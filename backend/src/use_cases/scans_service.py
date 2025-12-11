import requests
import hashlib
from typing import Dict, Any
from fastapi import UploadFile
from sqlalchemy.orm import Session
from ..infrastructure.repositories.scan_repository import ScanRepository
from ..domain.scan_models import Scan
from datetime import datetime

class ScansService:
    def __init__(self, db: Session = None, user_id: int = None):
        self.API_KEY = "5726b0a3b16d7995f5a4253ae2622df703e0ee150fdf47ad364a882f902a3bfa"
        self.BASE_URL = "https://www.virustotal.com/api/v3"
        self.headers = {"x-apikey": self.API_KEY}
        self.db = db
        self.user_id = user_id
        self.repo = ScanRepository(db) if db else None

    def _compute_hash(self, content: str) -> str:
        """Compute SHA256 hash of content for deduplication."""
        return hashlib.sha256(content.encode()).hexdigest()

    def _get_analysis(self, analysis_id: str) -> Dict[str, Any]:
        """Fetch analysis results by ID."""
        url = f"{self.BASE_URL}/analyses/{analysis_id}"
        response = requests.get(url, headers=self.headers)
        if response.status_code != 200:
             raise Exception(f"VT Error {response.status_code}: {response.text}")
        return response.json()

    def get_analysis_result(self, analysis_id: str) -> Dict[str, Any]:
        """Public method to get analysis result."""
        return self._get_analysis(analysis_id)

    def scan_url(self, url_to_scan: str) -> Dict[str, Any]:
        """
        Submit a URL for scanning with DB caching.
        1. Check if URL already scanned (by hash)
        2. If cached, return cached result
        3. If not, submit to VirusTotal and save
        """
        url_hash = self._compute_hash(url_to_scan)
        
        # Check cache if DB available (non-blocking)
        try:
            if self.repo:
                cached = self.repo.find_by_hash(url_hash)
                if cached:
                    print(f"[INFO] Cache HIT for URL: {url_to_scan}")
                    # Return cached result in VT format
                    return {
                        "data": {
                            "id": f"cached-{cached.id}",
                            "type": "analysis",
                            "attributes": {
                                "status": "completed",
                                "stats": {
                                    "malicious": cached.malicious_count,
                                    "suspicious": cached.suspicious_count,
                                    "harmless": cached.harmless_count,
                                    "undetected": cached.undetected_count
                                }
                            }
                        },
                        "from_cache": True
                    }
        except Exception as cache_error:
            print(f"[WARN] Cache check failed: {cache_error}, continuing without cache")
        
        # Not cached, submit to VT
        print(f"[INFO] Submitting URL to VirusTotal: {url_to_scan}")
        endpoint = f"{self.BASE_URL}/urls"
        data = {"url": url_to_scan}
        response = requests.post(endpoint, headers=self.headers, data=data)
        
        if response.status_code != 200:
            raise Exception(f"VT Error {response.status_code}: {response.text}")
        
        return response.json()

    async def scan_file(self, file: UploadFile) -> Dict[str, Any]:
        """
        Check/upload file with DB caching.
        1. Compute file hash
        2. Check cache
        3. If not cached, check VT then upload if needed
        """
        content = await file.read()
        sha256_hash = hashlib.sha256(content).hexdigest()
        
        # Check DB cache first
        if self.repo:
            cached = self.repo.find_by_hash(sha256_hash)
            if cached:
                return {
                    "type": "report",
                    "data": {
                        "attributes": {
                            "status": "completed",
                            "stats": {
                                "malicious": cached.malicious_count,
                                "suspicious": cached.suspicious_count,
                                "harmless": cached.harmless_count,
                                "undetected": cached.undetected_count
                            }
                        }
                    },
                    "from_cache": True
                }
        
        # Check VT by hash
        report_url = f"{self.BASE_URL}/files/{sha256_hash}"
        response = requests.get(report_url, headers=self.headers)
        
        if response.status_code == 200:
            data = response.json()
            
            # Save to DB if available
            if self.repo and self.user_id:
                self._save_scan_to_db(
                    scan_type="file",
                    target=file.filename,
                    target_hash=sha256_hash,
                    result=data['data']['attributes']
                )
            
            return {"type": "report", "data": data['data']}
        
        # Not found in VT, upload
        if response.status_code == 404:
            files = {'file': (file.filename, content, file.content_type)}
            upload_url = f"{self.BASE_URL}/files"
            upload_resp = requests.post(upload_url, headers=self.headers, files=files)
            
            if upload_resp.status_code != 200:
                raise Exception(f"VT Upload Error {upload_resp.status_code}: {upload_resp.text}")
            
            return {"type": "queued", "data": upload_resp.json()['data']}
            
        raise Exception(f"VT Error {response.status_code}: {response.text}")

    def _save_scan_to_db(self, scan_type: str, target: str, target_hash: str, result: dict):
        """Helper to save scan result to database."""
        if not self.repo or not self.user_id:
            return
        
        stats = result.get('stats', {})
        scan = Scan(
            id=None,
            user_id=self.user_id,
            scan_type=scan_type,
            target=target,
            target_hash=target_hash,
            status="completed",
            malicious_count=stats.get('malicious', 0),
            suspicious_count=stats.get('suspicious', 0),
            harmless_count=stats.get('harmless', 0),
            undetected_count=stats.get('undetected', 0),
            raw_result=result,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        self.repo.save(scan)

    def save_analysis_result(self, analysis_id: str, scan_type: str, target: str, target_hash: str, result: dict):
        """Save completed analysis to DB."""
        self._save_scan_to_db(scan_type, target, target_hash, result)

    def get_scan_history(self, limit: int = 50):
        """Get user's scan history."""
        if not self.repo or not self.user_id:
            return []
        return self.repo.find_by_user(self.user_id, limit)

    def get_scan_stats(self):
        """Get scan statistics for analytics."""
        if not self.repo or not self.user_id:
            return {"total_scans": 0, "threats_detected": 0, "clean_scans": 0}
        return self.repo.get_stats(self.user_id)


def get_scans_service(db: Session, user_id: int) -> ScansService:
    """Factory function to create ScansService with dependencies."""
    return ScansService(db=db, user_id=user_id)

import os
import requests
from datetime import datetime, timedelta
from typing import Optional, Dict, Any

class ThreatIntelService:
    """
    Threat Intelligence Service for enriching alerts with:
    - IP reputation scores
    - Geolocation data
    - Known threat indicators
    """
    
    def __init__(self):
        # Using free/freemium APIs
        self.abuseipdb_key = os.getenv('ABUSEIPDB_API_KEY', '')
        self.cache = {}  # Simple in-memory cache
        self.cache_ttl = 3600  # 1 hour cache
        
    def get_ip_reputation(self, ip_address: str) -> Dict[str, Any]:
        """
        Get IP reputation from multiple sources
        Returns enrichment data including reputation score, country, ISP, etc.
        """
        # Check cache first
        cache_key = f"ip_rep_{ip_address}"
        if cache_key in self.cache:
            cached_data, cached_time = self.cache[cache_key]
            if datetime.now() - cached_time < timedelta(seconds=self.cache_ttl):
                return cached_data
        
        enrichment = {
            "ip": ip_address,
            "reputation_score": 0,
            "is_malicious": False,
            "country": None,
            "isp": None,
            "abuse_reports": 0,
            "last_reported": None,
            "threat_types": [],
            "checked_at": datetime.now().isoformat()
        }
        
        # Try AbuseIPDB if key available
        if self.abuseipdb_key:
            try:
                abuse_data = self._check_abuseipdb(ip_address)
                if abuse_data:
                    enrichment.update({
                        "reputation_score": abuse_data.get('abuseConfidenceScore', 0),
                        "is_malicious": abuse_data.get('abuseConfidenceScore', 0) > 50,
                        "country": abuse_data.get('countryCode'),
                        "isp": abuse_data.get('isp'),
                        "abuse_reports": abuse_data.get('totalReports', 0),
                        "last_reported": abuse_data.get('lastReportedAt'),
                    })
            except Exception as e:
                print(f"AbuseIPDB lookup failed: {e}")
        
        # Fallback to ip-api.com for geolocation (free, no key needed)
        try:
            geo_data = self._get_geolocation(ip_address)
            if geo_data and not enrichment['country']:
                enrichment.update({
                    "country": geo_data.get('countryCode'),
                    "country_name": geo_data.get('country'),
                    "city": geo_data.get('city'),
                    "isp": geo_data.get('isp') if not enrichment['isp'] else enrichment['isp'],
                    "lat": geo_data.get('lat'),
                    "lon": geo_data.get('lon'),
                })
        except Exception as e:
            print(f"Geolocation lookup failed: {e}")
        
        # Cache the result
        self.cache[cache_key] = (enrichment, datetime.now())
        
        return enrichment
    
    def _check_abuseipdb(self, ip_address: str) -> Optional[Dict]:
        """Check IP against AbuseIPDB"""
        if not self.abuseipdb_key:
            return None
            
        url = 'https://api.abuseipdb.com/api/v2/check'
        headers = {
            'Accept': 'application/json',
            'Key': self.abuseipdb_key
        }
        params = {
            'ipAddress': ip_address,
            'maxAgeInDays': '90'
        }
        
        response = requests.get(url, headers=headers, params=params, timeout=5)
        if response.status_code == 200:
            return response.json().get('data', {})
        return None
    
    def _get_geolocation(self, ip_address: str) -> Optional[Dict]:
        """Get geolocation data from ip-api.com (free, no key needed)"""
        # Skip private IPs
        if ip_address.startswith(('10.', '172.', '192.168.', '127.')):
            return {
                "country": "Private",
                "countryCode": "LAN",
                "city": "Local Network",
                "isp": "Private Network"
            }
        
        url = f'http://ip-api.com/json/{ip_address}?fields=status,country,countryCode,city,isp,lat,lon,org'
        response = requests.get(url, timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('status') == 'success':
                return data
        return None
    
    def get_domain_reputation(self, domain: str) -> Dict[str, Any]:
        """
        Get domain reputation (placeholder for future VirusTotal integration)
        """
        return {
            "domain": domain,
            "is_malicious": False,
            "reputation_score": 0,
            "checked_at": datetime.now().isoformat()
        }
    
    def enrich_alert(self, alert_data: Dict) -> Dict[str, Any]:
        """
        Enrich a full alert with threat intelligence
        """
        enrichment = {
            "source": None,
            "destination": None,
            "enriched_at": datetime.now().isoformat()
        }
        
        # Enrich source IP
        if alert_data.get('src_ip'):
            enrichment['source'] = self.get_ip_reputation(alert_data['src_ip'])
        
        # Enrich destination IP
        if alert_data.get('dest_ip'):
            enrichment['destination'] = self.get_ip_reputation(alert_data['dest_ip'])
        
        return enrichment


# Singleton instance
threat_intel_service = ThreatIntelService()

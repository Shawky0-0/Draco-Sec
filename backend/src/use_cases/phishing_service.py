import requests
import json
from typing import List, Dict, Any

class PhishingService:
    def __init__(self):
        self.BASE_URL = "https://127.0.0.1:3333/api"
        # Using the API Key provided by the user
        self.API_KEY = "c86ae4f065ef13044b29c40df996e7771c8830064d2339a55273d10e3caf949d"
        # Disable SSL warning for local self-signed certs
        requests.packages.urllib3.disable_warnings()

    def _get(self, endpoint: str) -> List[Dict[str, Any]]:
        """Helper to perform GET requests."""
        try:
            response = requests.get(
                f"{self.BASE_URL}{endpoint}", 
                params={'api_key': self.API_KEY}, 
                verify=False,
                timeout=5
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"GoPhish API Error (GET {endpoint}): {e}")
            return []

    def _post(self, endpoint: str, data: Dict[str, Any], timeout: int = 5) -> Dict[str, Any]:
        """Helper to perform POST requests."""
        try:
            response = requests.post(
                f"{self.BASE_URL}{endpoint}", 
                json=data,
                params={'api_key': self.API_KEY}, 
                verify=False,
                timeout=timeout
            )
            if not response.ok:
                raise Exception(f"GoPhish Error {response.status_code}: {response.text}")
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"GoPhish API Error (POST {endpoint}): {e}")
            raise e

    def _delete(self, endpoint: str) -> Dict[str, Any]:
        """Helper to perform DELETE requests."""
        try:
            response = requests.delete(
                f"{self.BASE_URL}{endpoint}", 
                params={'api_key': self.API_KEY}, 
                verify=False,
                timeout=5
            )
            if not response.ok:
                raise Exception(f"GoPhish Error {response.status_code}: {response.text}")
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"GoPhish API Error (DELETE {endpoint}): {e}")
            raise e

    def _put(self, endpoint: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Helper to perform PUT requests."""
        try:
            response = requests.put(
                f"{self.BASE_URL}{endpoint}", 
                json=data,
                params={'api_key': self.API_KEY}, 
                verify=False,
                timeout=5
            )
            if not response.ok:
                raise Exception(f"GoPhish Error {response.status_code}: {response.text}")
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"GoPhish API Error (PUT {endpoint}): {e}")
            raise e

    def _delete(self, endpoint: str) -> Dict[str, Any]:
        """Helper to perform DELETE requests."""
        try:
            response = requests.delete(
                f"{self.BASE_URL}{endpoint}", 
                params={'api_key': self.API_KEY}, 
                verify=False,
                timeout=5
            )
            if not response.ok:
                raise Exception(f"GoPhish Error {response.status_code}: {response.text}")
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"GoPhish API Error (DELETE {endpoint}): {e}")
            raise e

    def _put(self, endpoint: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Helper to perform PUT requests."""
        try:
            url = f"{self.BASE_URL}{endpoint}"
            
            # GoPhish requires explicit Content-Type
            headers = {'Content-Type': 'application/json'}
            
            print(f"PUT Request: {url}")
            print(f"PUT Data: {json.dumps(data, indent=2)}")
            
            response = requests.put(
                url, 
                json=data,
                headers=headers,
                params={'api_key': self.API_KEY}, 
                verify=False,
                timeout=5
            )
            
            print(f"PUT Response Code: {response.status_code}")
            print(f"PUT Response Text: {response.text}")

            if not response.ok:
                print(f"GoPhish PUT Error: {response.text}")
                raise Exception(f"GoPhish Error {response.status_code}: {response.text}")
            
            try:
                return response.json()
            except json.JSONDecodeError:
                if not response.content:
                    return {} # Handle empty success response
                print("Failed to decode JSON response")
                raise
        except requests.exceptions.RequestException as e:
            print(f"GoPhish API Error (PUT {endpoint}): {e}")
            raise e

    # --- Helper Methods ---
    def _calculate_campaign_stats(self, campaign: Dict[str, Any]) -> None:
        """Calculates stats (sent, clicked, etc.) from results and injects into campaign dict."""
        results = campaign.get('results') or []  # Handle None or missing
        stats = {'sent': 0, 'clicked': 0, 'opened': 0, 'submitted': 0, 'error': 0}
        
        for result in results:
            status = result.get('status', '')
            
            # Logic: Status represents the *latest* state.
            if status in ['Email Sent', 'Email Opened', 'Clicked Link', 'Submitted Data']:
                stats['sent'] += 1
            
            if status in ['Email Opened', 'Clicked Link', 'Submitted Data']:
                stats['opened'] += 1

            if status in ['Clicked Link', 'Submitted Data']:
                stats['clicked'] += 1
                
            if status == 'Submitted Data':
                stats['submitted'] += 1
                
            if status == 'Error':
                stats['error'] += 1

        campaign['stats'] = stats

    # --- GET Methods ---
    def get_campaigns(self) -> List[Dict[str, Any]]:
        campaigns = self._get("/campaigns/")
        for campaign in campaigns:
            self._calculate_campaign_stats(campaign)
        return campaigns

    def get_campaign(self, campaign_id: int) -> Dict[str, Any]:
        campaign = self._get(f"/campaigns/{campaign_id}")
        if isinstance(campaign, list):
            # Handle case where _get returns empty list on error
            return {}
        self._calculate_campaign_stats(campaign)
        return campaign

    def get_groups(self) -> List[Dict[str, Any]]:
        return self._get("/groups/")

    def get_templates(self) -> List[Dict[str, Any]]:
        return self._get("/templates/")

    def get_pages(self) -> List[Dict[str, Any]]:
        return self._get("/pages/")
    
    def get_sending_profiles(self) -> List[Dict[str, Any]]:
        return self._get("/smtp/")

    def get_stats(self) -> Dict[str, Any]:
        """Aggregate stats for the dashboard."""
        try:
            campaigns = self.get_campaigns()
            total_campaigns = len(campaigns)
            active_campaigns = len([c for c in campaigns if c.get('status') == 'In Progress'])
            
            # Safely sum up stats
            emails_sent = sum([c.get('stats', {}).get('sent', 0) if c.get('stats') else 0 for c in campaigns])
            clicked = sum([c.get('stats', {}).get('clicked', 0) if c.get('stats') else 0 for c in campaigns])
            opened = sum([c.get('stats', {}).get('opened', 0) if c.get('stats') else 0 for c in campaigns])
            submitted = sum([c.get('stats', {}).get('submitted', 0) if c.get('stats') else 0 for c in campaigns])
            error = sum([c.get('stats', {}).get('error', 0) if c.get('stats') else 0 for c in campaigns])
            
            return {
                "total_campaigns": total_campaigns,
                "active_campaigns": active_campaigns,
                "emails_sent": emails_sent,
                "clicked": clicked,
                "opened": opened,
                "submitted": submitted,
                "error": error
            }
        except Exception as e:
            print(f"ERROR computing stats: {e}")
            import traceback
            traceback.print_exc()
            return {
                "total_campaigns": 0,
                "active_campaigns": 0,
                "emails_sent": 0,
                "clicked": 0,
                "opened": 0,
                "submitted": 0,
                "error": 0
            }

    def create_group(self, data: Dict[str, Any]) -> Dict[str, Any]:
        return self._post("/groups/", data)

    def delete_group(self, group_id: int) -> Dict[str, Any]:
        return self._delete(f"/groups/{group_id}")

    def modify_group(self, group_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Updates a group using PUT. GoPhish validates that data['id'] == group_id.
        GoPhish automatically sets modified_date and user_id server-side.
        """
        return self._put(f"/groups/{group_id}", data)

    def create_template(self, data: Dict[str, Any]) -> Dict[str, Any]:
        return self._post("/templates/", data)

    def modify_template(self, template_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        # Force ID in body to match URL to prevent GoPhish 400 Mismatch error
        data['id'] = int(template_id)
        return self._put(f"/templates/{template_id}", data)

    def delete_template(self, template_id: int) -> Dict[str, Any]:
        return self._delete(f"/templates/{template_id}/")

    def create_page(self, data: Dict[str, Any]) -> Dict[str, Any]:
        return self._post("/pages/", data)

    def modify_page(self, page_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        # Force ID in body to match URL to prevent GoPhish 400 Mismatch error
        data['id'] = int(page_id)
        return self._put(f"/pages/{page_id}", data)

    def delete_page(self, page_id: int) -> Dict[str, Any]:
        return self._delete(f"/pages/{page_id}")

    def create_profile(self, data: Dict[str, Any]) -> Dict[str, Any]:
        # GoPhish endpoint for profiles is /smtp_profiles or /smtp depending on version
        # Based on file inspection earlier, it seemed to be /smtp in models, but often /smtp_profiles in API
        # I'll try /smtp_profiles first as it's standard for 0.11+
        return self._post("/smtp/", data)

    def modify_profile(self, profile_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        # Force ID in body to match URL to prevent GoPhish 400 Mismatch error
        data['id'] = int(profile_id)
        return self._put(f"/smtp/{profile_id}", data)

    def delete_profile(self, profile_id: int) -> Dict[str, Any]:
        return self._delete(f"/smtp/{profile_id}")

    def create_campaign(self, data: Dict[str, Any]) -> Dict[str, Any]:
        return self._post("/campaigns/", data, timeout=30)

    def delete_campaign(self, campaign_id: int) -> Dict[str, Any]:
        return self._delete(f"/campaigns/{campaign_id}/")

    def complete_campaign(self, campaign_id: int) -> Dict[str, Any]:
        """Mark campaign as completed in GoPhish"""
        try:
            # GoPhish requires specific simplified structure for updates
            campaign = self._get(f"/campaigns/{campaign_id}/")
            
            # Construct minimal payload that GoPhish accepts
            update_data = {
                'name': campaign.get('name'),
                'status': 'Completed',
                'url': campaign.get('url'),
                # GoPhish expects only names for related objects during update
                'template': {'name': campaign['template']['name']} if campaign.get('template') else None,
                'page': {'name': campaign['page']['name']} if campaign.get('page') else None,
                'smtp': {'name': campaign['smtp']['name']} if campaign.get('smtp') else None,
                'groups': [{'name': g['name']} for g in campaign.get('groups', [])]
            }
            
            # Remove None values
            update_data = {k: v for k, v in update_data.items() if v is not None}
            
            return self._put(f"/campaigns/{campaign_id}/", update_data)
        except Exception as e:
            print(f"Error completing campaign: {e}")
            raise e



    # --- IMPORT Methods ---
    def import_site(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Proxies to /api/import/site"""
        return self._post("/import/site", data)

    def import_email(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Proxies to /api/import/email"""
        return self._post("/import/email/", data)

    def send_test_email(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Proxies to /api/util/send_test_email"""
        # Sending email takes time, so increase timeout
        return self._post("/util/send_test_email", data, timeout=30)


phishing_service = PhishingService()

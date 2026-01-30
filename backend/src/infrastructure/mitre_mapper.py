"""
MITRE ATT&CK Mapping Service
Maps Suricata signatures to MITRE ATT&CK Tactics, Techniques, and Procedures (TTPs)
"""

from typing import List, Dict, Optional

class MitreAttackMapper:
    """
    Maps security alerts to MITRE ATT&CK framework
    Pre-built mappings for common Suricata signatures
    """
    
    def __init__(self):
        # Common signature patterns → MITRE techniques
        self.signature_mappings = {
            # Reconnaissance
            'scan': ['T1595', 'T1046'],  # Active Scanning, Network Service Scanning
            'port scan': ['T1046'],
            'nmap': ['T1046'],
            
            # Initial Access
            'exploit': ['T1190'],  # Exploit Public-Facing Application
            'sql injection': ['T1190'],
            'rce': ['T1190'],
            'remote code execution': ['T1190'],
            'shellshock': ['T1190'],
            
            # Execution  
            'malware': ['T1059'],  # Command and Scripting Interpreter
            'trojan': ['T1204'],  # User Execution
            'backdoor': ['T1059'],
            
            # Persistence
            'webshell': ['T1505.003'],  # Server Software Component: Web Shell
            
            # Privilege Escalation
            'privilege escalation': ['T1068'],  # Exploitation for Privilege Escalation
            'root': ['T1068'],
            
            # Defense Evasion
            'obfuscated': ['T1027'],  # Obfuscated Files or Information
            'encoding': ['T1027'],
            'encrypted': ['T1573'],  # Encrypted Channel
            
            # Credential Access
            'brute force': ['T1110'],  # Brute Force
            'password': ['T1110'],
            'credential': ['T1003'],  # OS Credential Dumping
            
            # Discovery
            'enumeration': ['T1087'],  # Account Discovery
            
            # Lateral Movement
            'smb': ['T1021.002'],  # Remote Services: SMB/Windows Admin Shares
            'rdp': ['T1021.001'],  # Remote Services: Remote Desktop Protocol
            'ssh': ['T1021.004'],  # Remote Services: SSH
            
            # Collection
            'download': ['T1005'],  # Data from Local System
            
            # Command and Control
            'c2': ['T1071'],  # Application Layer Protocol
            'c&c': ['T1071'],
            'command and control': ['T1071'],
            'beacon': ['T1071'],
            'callback': ['T1071'],
            'bot': ['T1071'],
            'dns tunnel': ['T1071.004'],  # DNS
            'http': ['T1071.001'],  # Web Protocols
            'https': ['T1071.001'],
            
            # Exfiltration
            'exfiltration': ['T1041'],  # Exfiltration Over C2 Channel
            'upload': ['T1041'],
            
            # Impact
            'dos': ['T1498'],  # Network Denial of Service
            'ddos': ['T1498'],
            'flood': ['T1498'],
            'ransomware': ['T1486'],  # Data Encrypted for Impact
        }
        
        # Technique metadata  
        self.technique_info = {
            'T1595': {'tactic': 'Reconnaissance', 'name': 'Active Scanning'},
            'T1046': {'tactic': 'Discovery', 'name': 'Network Service Scanning'},
            'T1190': {'tactic': 'Initial Access', 'name': 'Exploit Public-Facing Application'},
            'T1059': {'tactic': 'Execution', 'name': 'Command and Scripting Interpreter'},
            'T1204': {'tactic': 'Execution', 'name': 'User Execution'},
            'T1505.003': {'tactic': 'Persistence', 'name': 'Web Shell'},
            'T1068': {'tactic': 'Privilege Escalation', 'name': 'Exploitation for Privilege Escalation'},
            'T1027': {'tactic': 'Defense Evasion', 'name': 'Obfuscated Files or Information'},
            'T1573': {'tactic': 'Command and Control', 'name': 'Encrypted Channel'},
            'T1110': {'tactic': 'Credential Access', 'name': 'Brute Force'},
            'T1003': {'tactic': 'Credential Access', 'name': 'OS Credential Dumping'},
            'T1087': {'tactic': 'Discovery', 'name': 'Account Discovery'},
            'T1021.002': {'tactic': 'Lateral Movement', 'name': 'SMB/Windows Admin Shares'},
            'T1021.001': {'tactic': 'Lateral Movement', 'name': 'Remote Desktop Protocol'},
            'T1021.004': {'tactic': 'Lateral Movement', 'name': 'SSH'},
            'T1005': {'tactic': 'Collection', 'name': 'Data from Local System'},
            'T1071': {'tactic': 'Command and Control', 'name': 'Application Layer Protocol'},
            'T1071.004': {'tactic': 'Command and Control', 'name': 'DNS'},
            'T1071.001': {'tactic': 'Command and Control', 'name': 'Web Protocols'},
            'T1041': {'tactic': 'Exfiltration', 'name': 'Exfiltration Over C2 Channel'},
            'T1498': {'tactic': 'Impact', 'name': 'Network Denial of Service'},
            'T1486': {'tactic': 'Impact', 'name': 'Data Encrypted for Impact'},
        }
    
    def map_signature(self, signature: str) -> List[Dict[str, str]]:
        """
        Map a Suricata signature to MITRE ATT&CK techniques
        Returns list of technique objects with ID, tactic, and name
        """
        if not signature:
            return []
        
        signature_lower = signature.lower()
        techniques = []
        seen_techniques = set()
        
        # Check for pattern matches
        for pattern, technique_ids in self.signature_mappings.items():
            if pattern in signature_lower:
                for tech_id in technique_ids:
                    if tech_id not in seen_techniques:
                        seen_techniques.add(tech_id)
                        info = self.technique_info.get(tech_id, {})
                        techniques.append({
                            'technique_id': tech_id,
                            'tactic': info.get('tactic', 'Unknown'),
                            'technique_name': info.get('name', 'Unknown'),
                            'url': f'https://attack.mitre.org/techniques/{tech_id.replace(".", "/")}/'
                        })
        
        return techniques
    
    def get_kill_chain_phase(self, techniques: List[Dict]) -> Optional[str]:
        """
        Determine the primary kill chain phase based on tactics
        """
        if not techniques:
            return None
        
        # Order of kill chain phases
        phase_order = [
            'Reconnaissance',
            'Initial Access',
            'Execution',
            'Persistence',
            'Privilege Escalation',
            'Defense Evasion',
            'Credential Access',
            'Discovery',
            'Lateral Movement',
            'Collection',
            'Command and Control',
            'Exfiltration',
            'Impact'
        ]
        
        # Get the earliest phase in the kill chain
        for phase in phase_order:
            for tech in techniques:
                if tech.get('tactic') == phase:
                    return phase
        
        return techniques[0].get('tactic')


# Singleton instance
mitre_mapper = MitreAttackMapper()

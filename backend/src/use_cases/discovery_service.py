import threading
import time
import socket
import struct
import fcntl
from datetime import datetime
from scapy.all import ARP, Ether, srp
from sqlalchemy.orm import Session
from src.infrastructure.database import SessionLocal
from src.infrastructure.models import NetworkDevice
from mac_vendor_lookup import MacLookup
import asyncio
from nmb.NetBIOS import NetBIOS

class DiscoveryService:
    def __init__(self, interface="eth0"):
        self.interface = interface
        self.running = False
        self.scan_interval = 300  # 5 minutes by default
        self.mac_lookup = MacLookup()
        
        # Try to update vendor list in background if possible, but don't block
        try:
            self.mac_lookup.update_vendors()
        except:
            pass

    def _get_subnet(self):
        """Get the subnet of the current interface."""
        try:
            # We usually know we want to scan the local subnet. Let's get the IP and Netmask
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            # 0x8915 is SIOCGIFADDR (IP), 0x891b is SIOCGIFNETMASK (Netmask)
            ip = socket.inet_ntoa(fcntl.ioctl(
                s.fileno(), 0x8915, struct.pack('256s', self.interface[:15].encode('utf-8'))
            )[20:24])
            netmask = socket.inet_ntoa(fcntl.ioctl(
                s.fileno(), 0x891b, struct.pack('256s', self.interface[:15].encode('utf-8'))
            )[20:24])
            
            # Simple CIDR calculation
            cidr = sum([bin(int(x)).count('1') for x in netmask.split('.')])
            networkip = socket.inet_ntoa(struct.pack('!I', struct.unpack('!I', socket.inet_aton(ip))[0] & struct.unpack('!I', socket.inet_aton(netmask))[0]))
            return f"{networkip}/{cidr}"
        except Exception as e:
            print(f"Error getting subnet for {self.interface}: {e}")
            return "192.168.1.0/24"  # Fallback

    def _get_vendor(self, mac):
        """Lookup MAC Organizationally Unique Identifier (OUI)."""
        try:
            return self.mac_lookup.lookup(mac)
        except Exception:
            return "Unknown Device"

    def _get_hostname(self, ip):
        """Try to resolve the hostname via DNS pointer record and NetBIOS."""
        hostname = None
        # 1. Try standard DNS reverse lookup
        try:
            hostname = socket.gethostbyaddr(ip)[0]
            if hostname:
                return hostname
        except Exception:
            pass
            
        # 2. Try NetBIOS lookup (common for Windows/Linux local names)
        try:
            n = NetBIOS()
            name = n.queryIPForName(ip, timeout=0.1)
            n.close()
            if name and len(name) > 0:
                return name[0]
        except Exception:
            pass

        return None

    def scan_network(self):
        """Perform a single active ARP scan and update the database."""
        subnet = self._get_subnet()
        print(f"Starting network discovery on {subnet}...")
        
        try:
            # Create ARP request packet
            arp = ARP(pdst=subnet)
            ether = Ether(dst="ff:ff:ff:ff:ff:ff")
            packet = ether/arp

            # Send packet and receive answers
            result = srp(packet, timeout=2, verbose=0, iface=self.interface)[0]

            discovered_devices = []
            for sent, received in result:
                # Add basic resolve
                vendor = self._get_vendor(received.hwsrc)
                hostname = self._get_hostname(received.psrc)
                
                discovered_devices.append({
                    'ip': received.psrc, 
                    'mac': received.hwsrc,
                    'vendor': vendor,
                    'hostname': hostname
                })

            self._update_database(discovered_devices)
            return discovered_devices

        except PermissionError:
            print("Permission denied: Active network discovery requires root privileges to send raw packets.")
            return []
        except Exception as e:
            print(f"Error during network scan: {e}")
            return []

    def _update_database(self, devices):
        """Update or insert devices into the SQLite database."""
        db = SessionLocal()
        try:
            current_time = datetime.utcnow()
            active_ips = [device['ip'] for device in devices]
            
            # 1. Update/Insert found devices
            for device in devices:
                db_device = db.query(NetworkDevice).filter(NetworkDevice.ip_address == device['ip']).first()
                if db_device:
                    db_device.mac_address = device['mac'] # Update MAC in case of IP reassignment
                    db_device.last_seen = current_time
                    db_device.is_active = 1
                    
                    # Update potentially missing details
                    if device['vendor'] != "Unknown Device":
                         db_device.vendor = device['vendor']
                    if device['hostname']:
                         db_device.hostname = device['hostname']
                else:
                    new_device = NetworkDevice(
                        ip_address=device['ip'],
                        mac_address=device['mac'],
                        vendor=device['vendor'],
                        hostname=device['hostname'],
                        first_seen=current_time,
                        last_seen=current_time,
                        is_active=1
                    )
                    db.add(new_device)
            
            # 2. Mark devices not seen as inactive
            offline_devices = db.query(NetworkDevice).filter(NetworkDevice.ip_address.notin_(active_ips)).all()
            for off_device in offline_devices:
                # If we haven't seen it recently, mark it inactive
                off_device.is_active = 0
                
            db.commit()
            print(f"Discovery complete. Found {len(devices)} active devices.")
        except Exception as e:
            print(f"Database error during discovery update: {e}")
        finally:
            db.close()

    def start_background_scan(self):
        """Start a periodic background scanning thread."""
        self.running = True
        thread = threading.Thread(target=self._scan_loop, daemon=True)
        thread.start()
        print(f"Started Background Network Discovery on interval of {self.scan_interval}s.")

    def _scan_loop(self):
        while self.running:
            self.scan_network()
            # Sleep in intervals to allow quick shutdown
            for _ in range(int(self.scan_interval)):
                if not self.running:
                    break
                time.sleep(1)

discovery_service = DiscoveryService()

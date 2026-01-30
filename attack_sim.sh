#!/bin/bash

TARGET="http://localhost:8000"

echo "🚀 Starting Attack Simulation on $TARGET..."

# 1. Nmap Scan (Recon)
echo "[1/4] Running Nmap Port Scan (Recon)..."
nmap -p 8000,22 -sV localhost > /dev/null 2>&1 &
PID=$!
sleep 2 # Let it run a bit
echo "      Done."

# 2. SQL Injection Attempt
echo "[2/4] Simulating SQL Injection..."
curl -s "$TARGET/api/v1/user?id=1' OR 1=1" > /dev/null
echo "      Sent."

# 3. Directory Traversal / LFI
echo "[3/4] Simulating /etc/passwd Access (LFI)..."
curl -s "$TARGET/api/v1/file?path=../../../../etc/passwd" > /dev/null
echo "      Sent."

# 4. Suspicious User Agent (BlackSun)
echo "[4/4] Sending Request with Bad User-Agent (BlackSun)..."
curl -s -A "BlackSun" "$TARGET/" > /dev/null
echo "      Sent."

echo "✅ Simulation Complete. Check the Monitoring Dashboard!"

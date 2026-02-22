# 🐉 DracoSec

A cybersecurity platform with offensive scanning, network monitoring, AI-powered analysis, and phishing simulation.

---

## ⚡ Quick Setup (Fresh Clone)

### 1. Backend

**Linux/Mac:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python init_db.py
python -m uvicorn src.infrastructure.main:app --host 0.0.0.0 --port 8000 --reload
```

**Windows (PowerShell):**
```powershell
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python init_db.py
python -m uvicorn src.infrastructure.main:app --host 0.0.0.0 --port 8000 --reload
```

> ⚠️ **Note for Windows users**: Features requiring Suricata or firewall rules won't work on Windows, but core features (login, signup, scanning, AI chat) will work fine.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

The app will be available at **http://localhost:5173**


---

## 🔑 Environment Variables

### Backend (`backend/.env`)
| Variable | Required | Description |
|---|---|---|
| `VT_API_KEY` | Yes (for scans) | [VirusTotal API Key](https://www.virustotal.com/) |
| `GOPHISH_API_URL` | No | GoPhish server URL |
| `GOPHISH_API_KEY` | No | GoPhish API key |

### Frontend (`frontend/.env`)
| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | No | Backend URL (defaults to `http://localhost:8000`) |

---

## 🗂 Project Structure

```
Draco-Sec/
├── backend/          # FastAPI backend (Python)
│   ├── src/
│   │   ├── interfaces/api/   # Route handlers
│   │   ├── use_cases/        # Business logic
│   │   ├── infrastructure/   # DB, models, security
│   │   └── domain/           # Domain models
│   ├── init_db.py            # DB initialization script
│   └── requirements.txt
├── frontend/         # React + Vite frontend
│   └── src/
│       ├── features/         # Page components
│       ├── context/          # AuthContext
│       └── config/api.js     # API URL configuration
└── strix/            # AI penetration testing agent
```

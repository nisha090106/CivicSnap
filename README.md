# CivicSnap 📸🏛️
### Multi-Modal AI Civic Engagement & Automated Authority Routing Platform

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110.0-009688.svg?style=flat&logo=FastAPI)](https://fastapi.tiangolo.com/)
[![PyTorch](https://img.shields.io/badge/PyTorch-CPU_2.2+-EE4C2C.svg?style=flat&logo=PyTorch)](https://pytorch.org/)
[![React](https://img.shields.io/badge/React-18.0+-61DAFB.svg?style=flat&logo=React)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.0+-646CFF.svg?style=flat&logo=Vite)](https://vitejs.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15.0+-4169E1.svg?style=flat&logo=PostgreSQL)](https://www.postgresql.org/)
[![Resend](https://img.shields.io/badge/Resend-Email_API-000000.svg?style=flat)](https://resend.com/)

CivicSnap is a state-of-the-art, production-grade civic engagement platform that empowers citizens to capture evidence of public infrastructure issues (potholes, water leaks, waste overflow, streetlight defects, food sanitation, forest damage) and automatically routes verified, multi-lingual formal complaint letters to target municipal authorities.

---

## 🌟 Key Architecture Features

### 1. ⚡ 100% Offline Local PyTorch Vision Engine
- **Local Zero-Shot Classifier**: Uses a CPU-optimized PyTorch Transformers model (`openai/clip-vit-base-patch32`) cached on disk (`backend/models_cache`).
- **Zero Cloud Latency & Network Dependency**: Operates 100% offline with sub-150ms CPU inference time. Eliminates external cloud API rate-limiting, network timeouts, and token authentication errors.
- **Visual Domain Evaluators**: Evaluates 6 specialized domain models (`Road & Pothole`, `Waste & Garbage`, `Water Leakage`, `Electrical Hazard`, `Food & Sanitation`, `Forest & Wildlife`) using deep semantic visual representations.

### 2. 🎨 Streamlined UI & Citizen Manual Override
- **Decluttered Interface**: Hides category grids by default to provide a clean, modern, and uncluttered citizen modal view.
- **AI Target Authority Routing**: Automatically identifies the issue and sets the destination authority department (e.g. *Water Leakage* → *Municipal Corporation*).
- **On-Demand Citizen Override**: Includes an explicit **`Classification wrong?`** trigger button that expands the category selector, alongside a single-click **`Reset to AI Result`** option.

### 3. 🚀 Parallel Multi-Lingual Letter Pre-Generation & Caching
- **Parallel Execution (`Promise.all`)**: Pre-generates formal complaint letters in all 5 supported languages (**English, Hindi, Marathi, Gujarati, Tamil**) simultaneously.
- **Session Storage Cache (`sessionStorage`)**: Stores letter dictionary locally for instant 0ms language tab switching (`🇬🇧 English`, `🇮🇳 हिंदी`, `🚩 मराठी`, `🏛️ ગુજરાતી`, `🛕 தமிழ்`).
- **Lifecycle Cache Management**: Automatically purges preview caches upon report submission, modal closing, photo retaking, or category adjustment.

### 4. 📧 Automated Citizen Status Update Notifications
- **Lifecycle Tracking**: When an authority officer updates a report status (`Pending` → `In Progress 🟡` → `Resolved 🟢`), an automated status change notification email is dispatched to the reporting citizen's email address via Resend API.

### 5. 🛡️ Anti-Hallucination Critic Subsystem
- **Cross-Verification**: Audits generated formal complaint letters against SOAP (Subjective, Objective, Assessment, Plan) transcripts to eliminate hallucinated locations, factual errors, or category mismatches before dispatching emails to municipal officers.

---

## 🏗️ System Architecture & Workflow

![CivicSnap High-Level System Architecture Diagram](./CP-High-Level-Design-Updated.png)

```mermaid
flowchart TD
    A["👤 Citizen User Interface (React + Vite)"] -->|1. Capture Photo & Location| B["📷 Evidence Capture & Geolocation"]
    B -->|2. POST /api/reports/classify| C["🧠 Local PyTorch Vision Engine (CLIP CPU)"]
    C -->|3. Auto-Detect Category & Department| D["🏷️ Winner-Takes-All Domain Evaluator"]
    
    D -->|4. Generate Parallel Previews| E["🌐 Multi-Lingual Formal Letter Engine (EN, HI, MR, GU, TA)"]
    E -->|5. Store Preview Cache| F["💾 Session Storage Cache (0ms Switch)"]
    
    F -->|6. POST /api/reports/submit| G["⚙️ Core FastAPI Backend (Port 5000)"]
    G -->|7. Store Metadata| H["🗄️ PostgreSQL Database"]
    G -->|8. Store Evidence| I["☁️ AWS S3 / Local 15-Day TTL Storage"]
    G -->|9. Audit & Dispatch| J["🛡️ Anti-Hallucination Critic"]
    J -->|10. Dispatch Email| K["📧 Resend Email Dispatcher (Authority & Citizen)"]
    
    L["🏛️ Authority Portal"] -->|11. POST /api/reports/{id}/status| G
    G -->|12. Status Change Email| M["📩 Citizen Status Update Email (In Progress / Resolved)"]
```


---

## 📁 Repository Structure

```text
CivicSnap/
├── frontend/                   # Citizen & Authority Web Application (React 18 + Vite)
│   ├── src/
│   │   ├── components/         # ReportIssueModal, Navbar, IssueCard, MapView
│   │   ├── context/            # AuthContext & Session State
│   │   └── pages/              # Citizen Feed, Authority Dashboard
│   └── package.json
│
├── backend/                    # Core FastAPI Service & PyTorch AI Microservice
│   ├── services/
│   │   ├── classification_service.py   # PyTorch Local Vision & Domain Evaluators
│   │   ├── email_service.py            # Resend Email Worker & Status Notifier
│   │   ├── multimodal_service.py       # SOAP Transcript Analysis Engine
│   │   ├── report_generator_service.py # Multi-Lingual Formal Letter Generator
│   │   └── storage_service.py          # AWS S3 & 15-Day TTL Cleanup Worker
│   ├── database.py             # SQLAlchemy Database Connection
│   ├── main.py                 # FastAPI Application & Endpoints
│   ├── models.py               # PostgreSQL SQLAlchemy Schemas
│   ├── models_cache/           # Local Cached PyTorch Model Weights (.gitignore)
│   └── requirements.txt        # Python Dependencies (PyTorch CPU, FastAPI, Transformers)
│
├── auth-service/               # Express.js Authentication Microservice (Port 4000)
│   ├── server.js               # JWT Auth Endpoints (Register, Login, Verify)
│   └── package.json
│
└── scripts/                    # Production System Launcher Scripts
    ├── run_system.bat          # Unified Batch Launcher for Auth, Core Backend, & Frontend
    └── start.bat              # Helper Script
```

---

## 🛠️ Microservices & Port Allocation

| Service | Port | Environment | Description |
| :--- | :--- | :--- | :--- |
| **Frontend UI** | `3000` | Node.js / Vite | Web Portal for Citizens & Municipal Authority Officers |
| **Auth Microservice** | `4000` | Express.js / Node | JWT User Registration, Authentication & Role Management |
| **Core Backend API** | `5000` | FastAPI / PyTorch | Multi-Modal AI Engine, Report Submission, S3 Storage & Routing |
| **PostgreSQL DB** | `5432` | PostgreSQL 15 | Primary Relational Storage |

---

## ⚙️ Environment Configuration

### `backend/.env`
```env
PORT=5000
FRONTEND_URL=http://localhost:3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/civicsnap
JWT_SECRET=your_jwt_secret_key_here
RESEND_API_KEY=re_your_resend_api_key
RESEND_FROM_EMAIL=CivicSnap Dispatch <onboarding@resend.dev>
AWS_STORAGE_BUCKET_NAME=civicsnap-dtplm
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
TEST_EMAIL_OVERRIDE=your_test_email@example.com
```

### `auth-service/.env`
```env
PORT=4000
JWT_SECRET=your_jwt_secret_key_here
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/civicsnap
```

### `frontend/.env`
```env
VITE_BACKEND_URL=http://localhost:5000
VITE_AUTH_URL=http://localhost:4000
```

---

## 🚀 One-Click Production Launch

### Windows (Unified Launcher)
Double-click or run the included production system batch script:
```powershell
.\scripts\run_system.bat
```
This automatically launches all 3 microservices in separate terminal windows:
- **Auth Microservice** (`http://localhost:4000`)
- **Core Backend API** (`http://localhost:5000`)
- **Frontend App** (`http://localhost:3000`)

---

## 🧪 Automated Test Suite

CivicSnap includes dedicated automated verification scripts to validate offline ML inference and email dispatching:

```bash
# 1. Verify 100% Offline PyTorch Vision Engine & Water Leak Detection
python backend/test_offline_model.py

# 2. Verify Multi-Modal Multi-Class Classifier Suite
python backend/test_multimodal_classify.py

# 3. Verify Citizen Status Change Email Notifications
python backend/test_status_email_notification.py
```

---

## 📡 API Endpoint Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/reports/classify` | Multi-Modal Visual & Text Classification Engine |
| `POST` | `/api/reports/preview` | Generates Multi-lingual Formal Letter Preview |
| `POST` | `/api/reports/submit` | Core Pipeline: S3 Storage, SOAP Transcript, Critic Audit & Email Dispatch |
| `GET` | `/api/reports/citizen` | Fetches citizen submitted reports |
| `GET` | `/api/reports/authority` | Fetches authority department feed filtered by jurisdiction |
| `POST` | `/api/reports/{id}/status` | Updates report status (`in_progress`/`resolved`) & sends notification email |
| `GET` | `/api/reports/s3-image/{id}` | Returns presigned AWS S3 image access URL |
| `GET` | `/health` | Service & Database connectivity health check |

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for details.

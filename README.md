# CivicSnap

## Project Overview

CivicSnap is a civic issue reporting platform for citizens and municipal authorities. A citizen can capture or upload evidence of a public issue, add a description and location, review an automatically generated complaint, and submit it to the responsible department. Authorities can view department-specific reports, inspect evidence and locations, and move reports through their resolution lifecycle.

The current implementation combines a React web client, an Express authentication service, and a FastAPI reporting and AI service backed by PostgreSQL.

![CivicSnap high-level architecture](./CP-High-Level-Design-Updated.png)

## Current Implementation Status

Implemented in the repository:

- Citizen and authority portals with protected, role-aware routes.
- Email/password, phone OTP, and Google sign-in flows.
- Authority department selection and approval gating.
- Camera capture, image upload, camera switching, and image retake.
- Browser geolocation with Maharashtra location fallback data.
- Multimodal issue classification using local CLIP, visual heuristics, and description keywords.
- Automatic authority department routing for six issue categories.
- Manual category override and reset-to-AI behavior in the reporting flow.
- Five-language complaint preview generation and session caching.
- Anonymous or disclosed citizen identity in generated complaints.
- SOAP-style report analysis, severity assessment, and 48-hour action plan.
- S3-first evidence storage with local file fallback and 15-day TTL metadata.
- Anti-hallucination checks before official email dispatch.
- Citizen report history and public community report map.
- Authority dashboard with status counts, filters, map, analytics, and citizen hub views.
- Resend email dispatch and status-change notifications to citizens.
- Local and integration-oriented Python verification scripts.

The project is a working development-stage system. Some dashboard analytics, sample credentials, and UI fallback records are intentionally representative/demo data and should be replaced with production data sources before deployment.

## Features

### Citizen experience

- Public landing page with product overview, supported categories, FAQ, and entry points for citizens and officers.
- Citizen sign-in through Google OAuth, phone OTP, or email/password.
- Optional account registration from the shared authentication modal.
- One-tap report action from the citizen dashboard.
- Capture evidence through `getUserMedia`, switch between front and rear cameras, or upload an image.
- Optional description, GPS coordinates, identity disclosure choice, and language selection.
- AI classification of:
    - Road and pothole damage
    - Waste and garbage
    - Water leakage
    - Street light and electrical wire issues
    - Food and sanitation issues
    - Forest and wildlife issues
- Classification confidence and per-domain model results are returned by the API.
- Low-confidence results can be reviewed and manually corrected by the citizen.
- Formal complaint preview in English, Hindi, Marathi, Gujarati, or Tamil.
- All five language previews are requested in parallel with `Promise.all` and cached in `sessionStorage`.
- Preview cache is cleared after submission, closing the modal, replacing the image, or changing the report context.
- Anonymous reporting by default, with an explicit disclosed-identity option.
- Personal report history with category, department, status, evidence image, city, timestamp, and Google Maps link.
- Public community map with status-colored report markers and evidence popups.
- Notifications and profile modal entry points.

### Authority experience

- Department-specific officer login.
- Authority accounts are blocked until approved.
- Protected authority dashboard routes enforce both role and approval state.
- KPI cards for total, pending, in-progress, and resolved reports.
- Recent, assigned, and priority report views.
- Report detail selection with evidence, category, department, location, and status controls.
- Status transitions are persisted through the backend.
- Interactive department map with report pins.
- Analytics view with resolution efficiency, response SLA, satisfaction, and category distribution presentation.
- Citizens Hub view for active reporter presentation.
- Refresh and time-range controls in the dashboard shell.
- Citizen notification email is triggered when an authority changes a report status.

### AI and report processing

- Local `openai/clip-vit-base-patch32` model loading through Transformers and PyTorch.
- Model weights are cached under `backend/models_cache` after first download.
- Rule-based visual fallback analyzes color, saturation, asphalt, water, vegetation, waste, and electrical-hazard signals when model inference is unavailable.
- Text keyword matching contributes to multimodal classification when a description is provided.
- Six domain evaluators produce confidence values and the highest-confidence evaluator wins.
- Reverse-geocoding fallback maps supported coordinates to city, taluka, district, and state values.
- SOAP output contains Subjective, Objective, Assessment, and Plan sections.
- Severity is derived from the category and includes a target action plan and 48-hour SLA.
- Authority routing supports road transport, municipal corporation, nagar panchayat, gram panchayat, forest, and food/drug destinations.
- Complaint generation uses NVIDIA Nemotron when `NVIDIA_API_KEY` is configured and falls back to deterministic multilingual templates.
- Complaint content is kept under the intended concise formal-letter format.

### Storage and email

- Base64 evidence images are decoded and stored in S3 when AWS credentials are configured.
- Local `backend/uploads` storage is used when S3 is unavailable.
- S3 images are exposed through 24-hour presigned URLs when credentials are available.
- Local evidence receives a 15-day expiration timestamp and cleanup worker path.
- Official emails include category, jurisdiction, severity, evidence URL, complaint letter, and SLA request.
- Resend delivery status and provider ID are persisted on the report.
- `TEST_EMAIL_OVERRIDE` supports safe development routing for Resend domain restrictions.
- Status updates can notify the original citizen by stored email, user lookup, or configured test override.

## Architecture

### Runtime topology

```text
Browser
    |
    +--> React/Vite frontend :3000
                    |
                    +--> Express auth service :4000 --> PostgreSQL
                    |
                    +--> FastAPI core API :5000 --> PostgreSQL
                                                                            |
                                                                            +--> Local CLIP / PyTorch
                                                                            +--> S3 or local uploads
                                                                            +--> NVIDIA Nemotron (optional)
                                                                            +--> Resend (optional)
```

### Request lifecycle: report submission

1. The citizen captures/uploads an image and the frontend obtains GPS coordinates when available.
2. `POST /api/reports/classify` combines image inference, visual heuristics, and text keywords.
3. The citizen confirms or overrides the category and selects identity/language settings.
4. The frontend calls `POST /api/reports/preview` for complaint generation. All five language previews are generated and cached in parallel.
5. `POST /api/reports/submit` stores the image, classifies or accepts the selected category, creates the SOAP transcript, and resolves the authority.
6. The report generator creates a formal letter using NVIDIA Nemotron or a local template fallback.
7. The email subsystem drafts an officer email and runs the anti-hallucination critic against the SOAP data.
8. Resend dispatch is attempted and its status is stored.
9. A PostgreSQL `reports` record is created with evidence, location, routing, status, SOAP data, complaint text, critic verdict, email audit fields, and TTL metadata.
10. The frontend refreshes the citizen feed and public map after the report event.

### Request lifecycle: authority status update

1. An approved authority requests `GET /api/reports/authority` with a JWT bearer token.
2. The API filters the feed by the officer department.
3. The officer submits a new status to `POST /api/reports/{report_id}/status`.
4. The report status is persisted.
5. If the status changed, the service resolves the citizen email and sends a status notification through Resend.

## Technology Stack

### Frontend

- React 18.2
- Vite 5
- React Router 7
- Tailwind CSS 3, PostCSS, Autoprefixer
- Leaflet and React Leaflet for maps
- Framer Motion for motion/UI transitions
- Lucide React for icons
- Google OAuth React SDK
- Browser APIs: camera, geolocation, `localStorage`, and `sessionStorage`

### Core backend

- Python 3
- FastAPI and Uvicorn
- Pydantic 2
- SQLAlchemy 2
- PostgreSQL through `psycopg`
- PyTorch and Torchvision
- Hugging Face Transformers and CLIP
- Pillow and NumPy
- Boto3 for AWS S3
- Resend Python SDK
- PyJWT and python-dotenv

### Authentication service

- Node.js
- Express 4
- Better Auth-compatible PostgreSQL schema/runtime integration
- `pg` PostgreSQL client
- JSON Web Tokens with `jsonwebtoken`
- Google token verification with `google-auth-library`
- Node `crypto.scrypt` for credential hashing and verification
- CORS and dotenv

### External services and infrastructure

- PostgreSQL or Supabase PostgreSQL
- AWS S3, optional
- Resend, optional for email dispatch
- NVIDIA API, optional for Nemotron complaint generation
- Twilio or compatible SMS provider, optional for phone OTP delivery
- OpenStreetMap tiles through Leaflet

## Repository Structure

```text
DTPLM_CP/
├── frontend/
│   ├── src/
│   │   ├── components/       # Auth, reporting, map, notification, profile, and UI components
│   │   ├── context/          # AuthContext and persisted client session
│   │   ├── pages/            # Landing, login, citizen, authority, and approval pages
│   │   ├── utils/            # Browser location helpers
│   │   ├── App.jsx           # Routes and ProtectedRoute rules
│   │   └── index.css         # Global styles and Tailwind layer
│   ├── package.json
│   ├── vite.config.js
│   └── Dockerfile
├── auth-service/
│   ├── index.js              # Express server and auth endpoints
│   ├── auth.js               # PostgreSQL pool and JWT helpers
│   ├── db_schema.txt         # Auth schema notes
│   └── package.json
├── backend/
│   ├── main.py               # FastAPI app and report endpoints
│   ├── auth.py               # JWT dependencies and role guards
│   ├── database.py           # SQLAlchemy engine and sessions
│   ├── models.py             # Report persistence model
│   ├── services/
│   │   ├── classification_service.py
│   │   ├── multimodal_service.py
│   │   ├── report_generator_service.py
│   │   ├── email_service.py
│   │   └── storage_service.py
│   ├── test_*.py              # Classification, model, API, and email checks
│   ├── requirements.txt
│   ├── uploads/               # Local evidence fallback
│   └── static/                # Static assets and image fallback paths
├── scripts/
│   ├── run_system.bat        # Starts all three local services
│   └── start.bat             # Additional Windows helper
├── CP-High-Level-Design-Updated.png
└── README.md
```

## Ports and URLs

| Service | Development URL | Default port |
| --- | --- | ---: |
| Frontend | http://localhost:3000 | 3000 |
| Auth service | http://localhost:4000 | 4000 |
| FastAPI backend | http://localhost:5000 | 5000 |
| FastAPI Swagger UI | http://localhost:5000/docs | 5000 |
| PostgreSQL | configured by connection URL | 5432 commonly |

## Configuration

The backend reads `DB_URL`, not `DATABASE_URL`.

### `backend/.env`

```env
DB_URL=postgresql://postgres:postgres@localhost:5432/civicsnap
JWT_SECRET=replace_with_a_shared_secret
FRONTEND_URL=http://localhost:3000
RESEND_API_KEY=re_your_resend_api_key
RESEND_FROM_EMAIL=CivicSnap Dispatch <onboarding@resend.dev>
NVIDIA_API_KEY=optional_nvidia_api_key
AWS_STORAGE_BUCKET_NAME=optional_bucket_name
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=optional_access_key
AWS_SECRET_ACCESS_KEY=optional_secret_key
TEST_EMAIL_OVERRIDE=optional_test_recipient@example.com
```

### `auth-service/.env`

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/civicsnap
JWT_SECRET=the_same_secret_used_by_the_backend
AUTH_SERVICE_PORT=4000
FRONTEND_URL=http://localhost:3000
GOOGLE_CLIENT_ID=optional_google_client_id
SMS_PROVIDER_SID=optional_twilio_account_sid
SMS_PROVIDER_AUTH_TOKEN=optional_twilio_auth_token
SMS_PROVIDER_FROM_NUMBER=optional_twilio_sender_number
```

### `frontend/.env`

```env
VITE_BACKEND_URL=http://localhost:5000
VITE_AUTH_SERVICE_URL=http://localhost:4000
VITE_GOOGLE_CLIENT_ID=optional_google_client_id
```

Do not commit real secrets. The authority credentials shown in the UI are development seed credentials and must be replaced or removed for a production deployment.

## Local Setup

### Prerequisites

- Node.js and npm
- Python 3.10 or newer recommended
- PostgreSQL or a Supabase PostgreSQL database
- Optional: AWS, Resend, NVIDIA, Google OAuth, and SMS provider credentials

### Install dependencies

```powershell
cd auth-service
npm install

cd ..\frontend
npm install

cd ..\backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### Start services individually

```powershell
# Terminal 1
cd auth-service
npm start

# Terminal 2
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 5000

# Terminal 3
cd frontend
npm run dev
```

The backend module is `main:app` when the working directory is `backend`.

### Start all services on Windows

```powershell
.\scripts\run_system.bat
```

The launcher opens separate windows for the auth service, backend, and frontend.

## API Reference

### Core backend

| Method | Endpoint | Purpose | Access |
| --- | --- | --- | --- |
| `GET` | `/` | Backend service status | Public |
| `GET` | `/health` or `/api/health` | Database and service health | Public |
| `GET` | `/api/me` | Current authenticated JWT payload | Authenticated |
| `POST` | `/api/reports/classify` | Image/text classification and routing suggestion | Public |
| `POST` | `/api/reports/preview` | Generate a multilingual complaint preview | Optional JWT |
| `POST` | `/api/reports/submit` | Store, analyze, route, audit, and email a report | Optional JWT |
| `GET` | `/api/reports/citizen` | Authenticated citizen report history | Optional JWT |
| `GET` | `/api/reports/public` or `/api/reports/all` | Public map/feed reports | Public |
| `GET` | `/api/reports/authority` | Department-filtered authority feed | Approved authority |
| `POST` | `/api/reports/{report_id}/status` | Update status and notify citizen | Approved authority |
| `GET` | `/api/reports/s3-image/{report_id}` | Resolve an accessible image URL | Public |
| `GET` | `/api/reports/{report_id}/image` | Alias for image URL resolution | Public |
| `GET` | `/api/reports/stream-image/{report_id}` | Stream or proxy report image bytes | Public |
| `GET` | `/api/reports/image-stream/{report_id}` | Alias for image streaming | Public |

### Authentication service

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Auth database health |
| `POST` | `/api/auth/phone/send-otp` | Generate and send/store a phone OTP |
| `POST` | `/api/auth/phone/verify-otp` | Verify OTP, upsert user, and issue JWT |
| `POST` | `/api/auth/sign-up/email` | Register an email/password account |
| `POST` | `/api/auth/sign-in/email` | Authenticate email/password account |
| `POST` | `/api/auth/google/signin` | Verify Google ID token and issue JWT |
| `GET` | `/api/auth/me` | Verify JWT and return current user |
| `POST` | `/api/auth/approve-authority` | Development/admin approval helper |

## Data Model

The core `reports` table stores:

- UUID report identity, optional citizen ID, and citizen email.
- Evidence image URL, category, description, latitude, longitude, and status.
- Department, city, taluka, district, and state routing metadata.
- SOAP transcript, severity, and generated complaint report.
- `ttl_expires_at` for evidence retention handling.
- Email draft, critic verdict, delivery status, provider email ID, and sent timestamp.
- Vote count for community engagement support.

The auth database uses Better Auth-compatible `user`, `account`, and `verification` records with role, department, approval, email, and phone verification fields.

## Tests and Verification Scripts

The repository contains focused scripts for model behavior, API checks, multimodal classification, email status behavior, and offline operation:

```powershell
python backend/test_offline_model.py
python backend/test_multimodal_classify.py
python backend/test_classify.py
python backend/test_hf_api.py
python backend/test_status_email_notification.py
python backend/test_email_signin.py
```

Some checks require a configured database, running services, model cache, or external provider credentials. Provider-dependent tests should be run with test overrides and never with production recipients.

## Known Development Limitations

- Phone OTP is stored in memory as well as the verification table and exposes the generated OTP in the response for developer testing; this must be removed before production.
- The authority approval endpoint is a development helper and is not protected by an administrator authorization layer.
- The backend has no migration framework; startup creates tables and applies a small set of additive `ALTER TABLE`  operations.
- Local image cleanup is implemented for expired local records; S3 object lifecycle policies should be configured separately for cloud retention.
- If external AI/email/storage integrations are not configured, local/template/fallback behavior is used.
- Some dashboard values and sample citizen records are presentation fallbacks rather than calculated production metrics.
- The frontend currently expects `VITE_AUTH_SERVICE_URL`; older environment files using `VITE_AUTH_URL` will not configure the auth client.
- Production hardening still requires rate limiting, admin authorization, secret management, structured logging, observability, API tests, and deployment configuration.

## Development History / Updates Completed

The implementation has progressed through these major updates:

1. Created the three-service CivicSnap foundation: React/Vite frontend, Express authentication service, and FastAPI backend.
2. Added PostgreSQL persistence for users, authentication records, and civic reports.
3. Added JWT authentication and frontend protected routes for citizen and authority roles.
4. Added citizen registration/login, authority login, Google OAuth, phone OTP, and authority approval state handling.
5. Added camera capture, image upload, camera switching, geolocation, and report submission UI.
6. Added six-category multimodal classification with local CLIP, visual fallback analysis, keyword matching, confidence scoring, and department routing.
7. Added manual classification correction and AI-result reset behavior.
8. Added SOAP transcript generation, severity assessment, location hierarchy, and municipal action plan generation.
9. Added multilingual formal complaint generation in five languages with parallel frontend preview requests and client-side caching.
10. Added S3 storage, local upload fallback, presigned URL support, image streaming, and 15-day TTL cleanup behavior.
11. Added official email drafting, critic verification, Resend dispatch, email audit persistence, and test-recipient override support.
12. Added citizen report history, public reports feed, community map markers, image popups, and Google Maps links.
13. Added authority department feeds, report status lifecycle, dashboard metrics, priority/assignment views, map, analytics, and citizens hub.
14. Added automatic citizen email notifications after authority status changes.
15. Added focused test scripts for offline inference, multimodal classification, email sign-in, status notifications, and supporting API behavior.
16. Updated this README to match the current file structure, environment variable names, routes, architecture, setup commands, implemented features, and known limitations.

## License

No license file is currently present in the repository. Add a license before distributing CivicSnap publicly.

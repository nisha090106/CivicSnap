# CivicSnap

CivicSnap is a civic issue reporting and resolution platform designed to help citizens report public problems quickly and help local authorities manage, route, and resolve them efficiently. Citizens can capture or upload evidence, add a description, and submit the issue to the correct department. The platform adds AI-powered classification, multilingual complaint drafting, route assignment, and status tracking for better civic service delivery.

The project brings together a React frontend, an Express authentication service, and a FastAPI backend with PostgreSQL persistence, AI/ML services, and optional cloud integrations for storage and notifications.

## Why CivicSnap?

Public issues such as potholes, garbage, water leakage, broken street lights, sanitation problems, and forest or wildlife concerns are often underreported or tracked through fragmented systems. CivicSnap makes reporting simple, verifiable, and actionable by combining evidence capture, automated classification, department routing, and authority workflows in one platform.

## Core Features

### Citizen Features
- Report civic issues using image upload or live camera capture
- Add description, GPS coordinates, optional identity disclosure, and language preference
- AI-powered classification for categories including:
  - Road and pothole damage
  - Garbage and waste disposal
  - Water leakage
  - Street light and electrical faults
  - Food and sanitation issues
  - Forest and wildlife-related issues
- Manual category override when model confidence is low
- Multilingual complaint preview generation in English, Hindi, Marathi, Gujarati, and Tamil
- Public map of submitted reports with status-based markers
- Personal report history dashboard with evidence and status details
- Notifications and profile access for citizen users

### Authority Features
- Department-specific login and role-aware access control
- Authority approval gating before dashboard access is granted
- KPI dashboard cards for total, pending, in-progress, and resolved reports
- Sort, filter, and priority views for active civic reports
- Detailed report views with evidence, location, department, and status management
- Status transitions such as pending, in-progress, and resolved
- Department-based analytics and map views for operational oversight
- Citizen hub view for communication and response tracking
- Email notifications when report status changes

### AI and Automation
- Multimodal classification using local CLIP/PyTorch image analysis where the model is available
- Keyword and rule-based fallback heuristics when local or external inference is unavailable
- Keyword-based text classification and confidence scoring
- Coordinate-to-jurisdiction mapping for supported Maharashtra areas, plus browser-side reverse geocoding for map context
- Automatic department routing based on issue category
- Complaint generation using AI with template fallback when external services are unavailable
- Severity and urgency analysis for each report
- Anti-hallucination validation before formal dispatch to departments

### Storage and Communication
- S3-first evidence storage with a local upload fallback
- Presigned image URLs for public access when cloud storage is configured
- Official email dispatch with category, jurisdiction, severity, and complaint details
- Resend integration for email notifications and delivery tracking
- Optional Google authentication and phone OTP login
- PostgreSQL-backed persistence for report and auth data

## Tech Stack

### Frontend
- React
- Vite
- Tailwind CSS
- React Router
- Leaflet and React Leaflet
- Framer Motion
- Lucide React
- Google OAuth integration via @react-oauth/google

### Authentication Service
- Node.js
- Express.js
- Better Auth
- PostgreSQL
- JWT
- Google Auth Library
- CORS and dotenv

### Backend / API
- Python
- FastAPI
- SQLAlchemy
- PostgreSQL
- Pydantic
- Uvicorn
- JWT-based auth enforcement

### AI / ML
- PyTorch
- Transformers
- Local OpenAI CLIP model support
- Pillow and NumPy for image processing
- Optional NVIDIA-hosted language-model assistance through an OpenAI-compatible client

### Cloud and Messaging
- AWS S3 for evidence storage
- Resend for email notifications
- Optional Twilio-compatible SMS flow for phone OTP login
- PostgreSQL / Supabase-backed database services

## System Architecture

```text
Browser / citizen app
    |
    +--> React frontend (Vite)
            |
            +--> Auth service (Express + Better Auth)
            |       |
            |       +--> PostgreSQL
            |
            +--> FastAPI backend
                    |
                    +--> PostgreSQL
                    |
                    +--> AI inference (CLIP + heuristics)
                    |
                    +--> S3 / local file storage
                    |
                    +--> Email and notification integrations
```

## How CivicSnap Works

1. A citizen opens the app and signs in using email/password, Google, or phone OTP.
2. The user captures or uploads proof of a civic issue and adds a description and location.
3. The backend classifies the issue using multimodal AI and rule-based heuristics.
4. The system suggests the correct department and allows manual override if needed.
5. The complaint preview is generated in the preferred language and can be reviewed before submission.
6. The report is stored in PostgreSQL with evidence metadata, severity, and department routing.
7. The authority dashboard receives the issue, reviews the evidence, and updates the status.
8. Citizens can track the progress and view their report history from the dashboard.
9. Email notifications and status updates keep stakeholders informed throughout the lifecycle.

## Project Workflow

### Report Submission Lifecycle
- Citizen submits issue with image, description, and geolocation
- AI identifies the category and confidence score
- System determines the responsible government department
- Formal complaint draft is generated
- Evidence is stored in cloud or local storage
- Authority reviews and updates report status
- Citizen receives updates and sees the resolution progress

## Current Implementation and Feature Status

CivicSnap is a development-stage application. The following describes the current code, not a production-readiness guarantee:

| Capability | Current behavior |
|---|---|
| Report submission | FastAPI accepts report details, coordinates, optional evidence, and identity-disclosure preference. Reports are persisted in PostgreSQL. |
| Classification | A local CLIP model can classify images into civic categories; text keywords and rule-based logic provide fallback and supporting signals. |
| Complaint generation | The backend prepares structured SOAP notes and formal complaint text, with configured external language-model assistance where available. |
| Severity and urgency | Severity analysis and urgency fields exist; AI severity and priority behavior are controlled by backend feature flags. |
| Routing and notification | Reports are mapped to a responsible department/authority and email is drafted, checked, and dispatched through the configured email integration. |
| Map | Leaflet renders geolocated reports on OpenStreetMap tiles. The community-map API and associated interactions are feature-flagged. |
| Community support | The data model and API include report clusters, votes, comments, and audit records. Interactions require the community feature to be enabled and a report to have a cluster. |
| Duplicate detection | Nearby, category-compatible reports are compared by distance, time, and description similarity. Suggestions are logged for authority review; suggestions do not automatically merge or cluster reports. |
| Priority | A versioned score and explainable breakdown are implemented for clusters. The score uses community votes, severity, and age; external engagement currently contributes zero. |
| External social reports | Tables and a design are present for external reports and engagement, but an external X ingestion/matching worker is not implemented. |
| Geographic precision | Coordinates are stored as numeric latitude/longitude, not PostGIS geometry. The backend community-radius filter uses a bounding box; duplicate detection additionally applies Haversine distance. |

The community map can be enabled with `FEATURE_COMMUNITY_MAP=true` in the backend environment and `VITE_FEATURE_COMMUNITY_MAP=true` in the frontend build environment. Priority and AI-severity paths are separately controlled by `FEATURE_PRIORITY_SCORING` and `FEATURE_AI_SEVERITY`. Check the deployment environment before assuming these features are enabled.

### Duplicate detection details

After report creation, a FastAPI background task checks for potential matches. It narrows candidates using an approximate coordinate bounding box and report time, then checks normalized categories and exact distance with the Haversine formula. The score is composed of 50% location proximity, 30% category agreement, and 20% `difflib.SequenceMatcher` description similarity. Defaults are a 50-meter radius, a 0.85 confidence threshold, and a 168-hour time window; these can be overridden with `DEDUP_RADIUS_METERS`, `DEDUP_CONFIDENCE_THRESHOLD`, and `DEDUP_TIME_WINDOW_HOURS`. Older resolved reports are excluded after the configured resolved grace period.

Results are saved as audit-log suggestions and exposed to authorized authorities through `GET /api/reports/dedup-suggestions`. A result labeled `auto_merge_candidate` is only a high-confidence suggestion: current shadow-mode behavior leaves the report's `cluster_id` unchanged.

### Geospatial behavior

The browser requests location permission and sends coordinates with a report. A report can still use fallback coordinates if location is unavailable, so users should verify the pin before submission. `CommunityMap` uses Leaflet / React Leaflet and OpenStreetMap tiles; the location helper calls Nominatim reverse geocoding for a readable map location. Separately, the backend currently uses approximate coordinate-boundary rules to derive jurisdiction metadata for supported locations. These mechanisms support map display and routing, but are not a GIS boundary service or a PostGIS spatial database.

## Proposed Community Priority and External-Evidence Solution

The community-report design is documented in [docs/priority-based-community-reports.md](docs/priority-based-community-reports.md). It extends the existing report workflow rather than creating a second reporting system:

1. Preserve each citizen submission, while associating likely duplicates with a canonical community issue after validation and review.
2. Let authenticated citizens support an issue with one vote per citizen and add comments intended for authorities.
3. Expose safe summary fields and aggregate support publicly; restrict comments, identities, merge history, and detailed evidence to authorized authorities.
4. Calculate and persist a versioned priority score with its component breakdown so authorities can understand how it was produced.
5. If officially permitted X API access is available, run external-post discovery and matching asynchronously, validate matches, and expose verified evidence only to authorities.
6. Roll out conservatively: deduplication in shadow mode first, then authority review, then community interactions and calibrated priority scoring. External ingestion remains a future integration and must comply with provider terms, retention, deletion, and rate-limit requirements.

The current priority service weights CivicSnap support at 50%, external support at 20%, severity at 20%, and report age at 10%; external support is currently zero because ingestion is not implemented. Default vote tiers and severity floors are demo configuration, not validated municipal service-level targets. The design document describes a fuller future matching and X-ingestion solution; those proposed capabilities should not be confused with shipped behavior.

## Repository Structure

```text
DTPLM_CP/
├── frontend/                     # React/Vite web application
│   └── src/
│       ├── components/            # Report form, map, and dashboard components
│       ├── context/               # Authentication context
│       └── pages/                 # Citizen and authority views
├── auth-service/                  # Express authentication service
├── backend/                       # FastAPI API, models, and service modules
│   ├── services/                  # Classification, storage, email, priority, deduplication
│   ├── test_*.py                  # Backend tests
│   └── requirements.txt
├── docs/                          # Feature design documents
├── scripts/                       # Windows launcher scripts
├── supabase/migrations/           # PostgreSQL schema migrations
├── CP-High-Level-Design-Updated.png
└── README.md
```

## Local Setup

### Prerequisites
- Node.js 18+
- Python 3.10+
- PostgreSQL or Supabase PostgreSQL instance
- Optional provider credentials for Google OAuth, AWS S3, Resend, NVIDIA, Hugging Face, and SMS delivery

### Configure environment

Create service-local environment files for development, but do not commit them. The following are variable names only; provide your own values in your local environment:

| Service | Variable names | Purpose |
|---|---|---|
| Backend | `DB_URL`, `JWT_SECRET`, `FRONTEND_URL` | PostgreSQL connection, token verification, and allowed frontend origin |
| Backend | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_STORAGE_BUCKET_NAME`, `AWS_REGION` | Optional S3 image storage; local uploads are used when S3 is not configured |
| Backend | `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | Optional email delivery |
| Backend | `NVIDIA_API_KEY`, `HUGGINGFACE_API_KEY` | Optional external language-model or inference integrations |
| Backend | `FEATURE_COMMUNITY_MAP`, `FEATURE_PRIORITY_SCORING`, `FEATURE_AI_SEVERITY` | Enable selected backend feature paths |
| Backend | `DEDUP_RADIUS_METERS`, `DEDUP_CONFIDENCE_THRESHOLD`, `DEDUP_TIME_WINDOW_HOURS`, `DEDUP_RESOLVED_GRACE_HOURS` | Tune shadow duplicate matching |
| Backend | `PRIORITY_SUPPORT_LOG_CAP`, `PRIORITY_TIER_LOW`, `PRIORITY_TIER_MEDIUM`, `PRIORITY_TIER_HIGH`, `PRIORITY_TIER_HIGHEST` | Tune priority-score normalization and demo vote tiers |
| Auth service | `DATABASE_URL` or `DB_URL`, `JWT_SECRET`, `FRONTEND_URL`, `AUTH_SERVICE_PORT` | Auth database, token signing, CORS origin, and listen port |
| Auth service | `GOOGLE_CLIENT_ID` | Google sign-in integration |
| Auth service | `SMS_PROVIDER_SID`, `SMS_PROVIDER_AUTH_TOKEN`, `SMS_PROVIDER_FROM_NUMBER` (or corresponding `TWILIO_*` names) | Optional Twilio-compatible OTP delivery |
| Frontend | `VITE_BACKEND_URL`, `VITE_AUTH_SERVICE_URL`, `VITE_GOOGLE_CLIENT_ID`, `VITE_FEATURE_COMMUNITY_MAP` | API endpoints, Google sign-in, and community-map UI flag |

`VITE_*` variables are embedded into the browser bundle and must never contain secrets. Backend and auth secrets must remain server-side. The auth service has a development OTP fallback; do not use it as production SMS verification.

### Install dependencies

```bash
cd auth-service
npm install

cd ../frontend
npm install

cd ../backend
python -m venv .venv
# Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# macOS/Linux:
# source .venv/bin/activate
pip install -r requirements.txt
```

Before first startup, configure PostgreSQL and apply the required schema. Review and apply the SQL migrations in `supabase/migrations/` using the Supabase CLI or SQL editor as appropriate for your environment. Keep migration credentials private.

### Run the services

Open three terminals from the repository root:

```bash
# Terminal 1: authentication service
cd auth-service
node index.js

# Terminal 2: API backend
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 5000

# Terminal 3: frontend
cd frontend
npm run dev
```

The frontend's Vite default is typically `http://localhost:5173`; the backend serves on `http://localhost:5000` and FastAPI's interactive API documentation is at `http://localhost:5000/docs`. The auth service defaults to port `4000`. Configure the frontend's `VITE_*` API URLs to match your local or deployed services. The repository also includes `scripts/run_system.bat` for Windows, which opens service terminals.

## API Overview

The principal FastAPI routes are:

| Method | Route | Purpose / access |
|---|---|---|
| `GET` | `/health` or `/api/health` | Backend health check |
| `POST` | `/api/reports/classify` | Classify issue evidence and description |
| `POST` | `/api/reports/preview` | Preview generated complaint/report content |
| `POST` | `/api/reports/submit` | Create and route a report |
| `GET` | `/api/reports/citizen` | Current citizen's reports |
| `GET` | `/api/reports/public` | Public reports feed used by map/live views |
| `GET` | `/api/reports/authority` | Role- and department-aware authority feed |
| `POST` | `/api/reports/{report_id}/status` | Authority status update |
| `GET` | `/api/community/reports` | Feature-flagged community map feed; optional category, status, and radius filters |
| `GET` | `/api/community/reports/{cluster_id}` | Community issue detail |
| `POST` | `/api/community/reports/{cluster_id}/upvote` | Authenticated citizen community interaction |
| `POST` | `/api/community/reports/{cluster_id}/comments` | Authenticated citizen comment submission |
| `GET` | `/api/reports/dedup-suggestions` | Authority-only shadow duplicate suggestions |

See FastAPI's `/docs` page for request/response schemas and current access-control requirements. Backend role checks—not client-side UI hiding—are the authorization boundary.

## Data Model

The principal persisted entities include:

- `reports`: original citizen report, coordinates, category, description, status, jurisdiction, evidence URL, severity, and email-delivery metadata.
- `report_clusters` and `report_cluster_members`: canonical community issue and report membership; current new submissions are not automatically assigned by the shadow deduplication flow.
- `votes` and `comments`: citizen support and community discussion associated with clusters.
- `audit_log`: auditable events, including duplicate suggestions and community actions.
- `external_reports`, `external_report_links`, and `external_engagement_snapshots`: schema support for future external evidence ingestion; no current X ingestion worker populates these as an integration.

The backend uses SQLAlchemy models and PostgreSQL UUID, JSON/JSONB, and relational constraints. Report coordinates are `FLOAT` columns with a composite B-tree index, not PostGIS geometry.

## Tests

Backend tests use `pytest`. From the `backend` directory, install the requirements and run:

```bash
pytest
```

The database-backed duplicate-detection integration test is skipped unless `RUN_DEDUP_INTEGRATION=1` is set and requires a configured test database. Unit tests for matching logic can run without that integration setting.

Frontend tests use Node's built-in test runner. From the `frontend` directory:

```bash
npm test
npm run build
```

The frontend `npm test` script currently covers the test files listed in `frontend/package.json`; it is not a guarantee that every UI flow has automated coverage.

## Future Implementation Roadmap

### Short-Term Goals
- Improve AI classification accuracy with larger labeled civic datasets
- Add stronger moderation and spam detection for public reports
- Improve dashboard analytics and visualizations for departments
- Strengthen role-based security and audit-ready workflows
- Add better mobile UX and offline-capable reporting

### Medium-Term Goals
- Introduce admin analytics for city-level issue trends
- Add multilingual voice-to-text reporting and accessibility improvements
- Expand public map insights with heatmaps and cluster analytics
- Enhance notification flows across SMS, email, and push channels
- Improve evidence retention and lifecycle policies for uploaded media

### Long-Term Goals
- Expand to regional and municipal government integrations
- Add live incident tracking and escalation workflows
- Support multi-city and multi-department deployments
- Integrate with government ERPs, ticketing systems, and GIS infrastructure
- Build a mobile-first citizen experience with native app support
- Add predictive analytics for recurring civic issues and infrastructure planning

## Contribution Notes

This project is a working development-stage civic technology platform. Before production use, rotate any credentials that have been exposed, remove secrets from repository history where applicable, use managed secret storage, replace demo authority data and routing addresses, strengthen OTP/authentication controls, validate jurisdiction and AI outputs, and complete privacy, security, retention, accessibility, and operational reviews. Never copy credential values into documentation, source control, issue trackers, or client-side `VITE_*` variables.

## License

This project is currently intended for internal or demonstration use unless a separate license is added by the repository owner.

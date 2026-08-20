# CivicSnap 📸🏛️

CivicSnap is a modern civic engagement platform that empowers citizens to report, track, and resolve community and municipal issues seamlessly.

## 📁 Project Structure

```
civicsnap/
├── frontend/          # Frontend web application
├── backend/           # Core API service & database handlers
├── auth-service/      # Authentication & Authorization microservice
├── .gitignore         # Version control exclusion rules
└── README.md          # Project documentation & setup instructions
```

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- Python 3.11+

### Running Locally
1. Install backend dependencies and start the API:
   ```bash
   cd backend
   python -m pip install -r requirements.txt
   uvicorn main:app --reload --host 0.0.0.0 --port 5000
   ```

2. In a second terminal, install auth-service dependencies and start it:
   ```bash
   cd auth-service
   npm install
   npm start
   ```

3. In a third terminal, install frontend dependencies and start Vite:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## 🛠 Services Architecture

| Service | Port | Description |
| :--- | :--- | :--- |
| **Frontend** | `3000` | Web UI for citizens and administrators |
| **Backend API** | `5000` | Core API for issue reports, telemetry, and status updates |
| **Auth Service** | `4000` | Microservice handling user registration, authentication & JWT tokens |
| **PostgreSQL** | `5432` | Primary relational database |
| **Redis** | `6379` | In-memory cache and session store |

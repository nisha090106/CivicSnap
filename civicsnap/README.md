# CivicSnap 📸🏛️

CivicSnap is a modern civic engagement platform that empowers citizens to report, track, and resolve community and municipal issues seamlessly.

## 📁 Project Structure

```
civicsnap/
├── frontend/          # Frontend web application
├── backend/           # Core API service & database handlers
├── auth-service/      # Authentication & Authorization microservice
├── docker-compose.yml # Docker multi-container setup
├── .env               # Local environment variables
├── .gitignore         # Version control exclusion rules
└── README.md          # Project documentation & setup instructions
```

## 🚀 Quick Start

### Prerequisites
- [Docker](https://www.docker.com/) & Docker Compose
- [Node.js](https://nodejs.org/) (v18+)

### Running Locally with Docker
1. Ensure `.env` is configured for your environment:
   ```bash
   cp .env .env.local
   ```

2. Spin up all services using Docker Compose:
   ```bash
   docker-compose up --build
   ```

## 🛠 Services Architecture

| Service | Port | Description |
| :--- | :--- | :--- |
| **Frontend** | `3000` | Web UI for citizens and administrators |
| **Backend API** | `5000` | Core API for issue reports, telemetry, and status updates |
| **Auth Service** | `4000` | Microservice handling user registration, authentication & JWT tokens |
| **PostgreSQL** | `5432` | Primary relational database |
| **Redis** | `6379` | In-memory cache and session store |

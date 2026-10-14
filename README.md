# Online Quiz Application — College DevOps Mini-Project

A complete, modern full-stack **Online Quiz Application** designed for academic demonstrations, DevOps CI/CD pipelines, and cloud containerization. The application features server-side scoring, countdown timers, student progress tracking, an administrative quiz builder, and a zero-database architecture powered by an atomic, thread-safe JSON file store.

---

## 1. Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite 8, TypeScript, React Router 7 |
| **Styling** | Custom Responsive CSS (Primary: `#2563EB`, Background: `#F8FAFC`, Borders: `#E2E8F0`) |
| **Backend** | Python 3.12+, FastAPI, Pydantic v2, PyJWT, Uvicorn |
| **Data Storage** | Local JSON File Store (`backend/data/store.json`) — **No SQL / No NoSQL** |
| **Authentication** | JWT (HMAC-SHA256) with PBKDF2-HMAC-SHA256 Password Hashing |
| **Testing** | `pytest` for backend API & persistence test suite; Vite/TSC for production build |
| **DevOps & CI/CD** | Git, GitHub Actions, Docker, Docker Compose, Google Cloud Run Ready |

---

## 2. Project Directory Structure

```text
online-quiz-app-devops/
├── .github/
│   └── workflows/
│       └── ci.yml                     # Automated CI (pytest + npm run build)
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── auth.py                    # PBKDF2 hashing, JWT creation/verification, RBAC
│   │   ├── config.py                  # Pydantic BaseSettings environment config
│   │   ├── logging_config.py          # Structured & sanitized logging
│   │   ├── main.py                    # FastAPI entrypoint, middleware & error handlers
│   │   ├── models.py                  # Pydantic schemas (User, Quiz, Attempt, Stats)
│   │   ├── storage.py                 # Thread-safe JSON persistence service (RLock + atomic write)
│   │   └── routers/
│   │       ├── __init__.py
│   │       ├── admin_router.py        # Admin stats, Quiz CRUD, Question pool
│   │       ├── auth_router.py         # Register, Login, Current User profile
│   │       ├── health_router.py       # Health probe (/api/health)
│   │       └── quiz_router.py         # Student quiz taking, submissions, attempt reviews
│   ├── data/
│   │   └── store.json                 # Persistent JSON data store (auto-initialized)
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── conftest.py                # Isolated test environment fixtures
│   │   ├── test_admin.py              # RBAC & admin workflow tests
│   │   ├── test_auth.py               # Auth, token & validation tests
│   │   ├── test_health.py             # Health check tests
│   │   ├── test_quizzes.py            # Student quiz taking, scoring & review tests
│   │   └── test_storage.py            # Atomic file write & reload persistence tests
│   ├── Dockerfile                     # Python 3.12 slim backend image with healthcheck
│   ├── .dockerignore
│   ├── pytest.ini                     # Pytest configuration
│   └── requirements.txt               # Backend dependencies
├── docs/
│   ├── architecture.md                # System design & JSON engine details
│   ├── deployment.md                  # Google Cloud Run & Artifact Registry guide
│   └── monitoring-and-recovery.md     # SRE observability & failure recovery runbook
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.ts              # Centralized API client with JWT interceptor
│   │   ├── components/
│   │   │   ├── Footer.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── Modal.tsx              # Confirmation modal dialog
│   │   │   ├── Navbar.tsx             # Role-based navigation bar
│   │   │   └── ProtectedRoute.tsx     # RBAC client-side route guard
│   │   ├── context/
│   │   │   └── AuthContext.tsx        # React authentication context
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   │   ├── AdminDashboard.tsx         # Overview metrics & stats
│   │   │   │   ├── CreateQuizPage.tsx         # Interactive multiple-question creator
│   │   │   │   ├── EditQuizPage.tsx           # Quiz settings editor
│   │   │   │   ├── QuestionManagementPage.tsx # Question bank CRUD
│   │   │   │   └── QuizManagementPage.tsx     # Quiz catalog & publish toggle
│   │   │   ├── student/
│   │   │   │   ├── AttemptHistoryPage.tsx     # Past attempt records
│   │   │   │   ├── AvailableQuizzesPage.tsx   # Active quiz catalog
│   │   │   │   ├── QuizResultPage.tsx         # Score breakdown & pass/fail
│   │   │   │   ├── QuizReviewPage.tsx         # Detailed answer explanations
│   │   │   │   ├── QuizStartPage.tsx          # Instructions & timer start
│   │   │   │   ├── QuizTakingPage.tsx         # Question stepper & countdown timer
│   │   │   │   └── StudentDashboard.tsx       # Student hub & performance summary
│   │   │   ├── LandingPage.tsx        # Hero banner & demo credentials
│   │   │   ├── LoginPage.tsx          # Login with demo autofill
│   │   │   └── RegisterPage.tsx       # Student registration
│   │   ├── types/
│   │   │   └── index.ts               # Shared TypeScript interfaces
│   │   ├── App.tsx                    # Route definitions
│   │   ├── index.css                  # UI design system styles
│   │   └── main.tsx                   # React root entrypoint
│   ├── Dockerfile                     # Multi-stage build + Nginx Alpine
│   ├── .dockerignore
│   ├── nginx.conf                     # SPA routing & API reverse proxy
│   └── package.json
├── docker-compose.yml                 # Local full-stack execution with volume mount
├── .env.example                       # Environment configuration template
├── .gitignore
└── README.md
```

---

## 3. Demo Login Credentials

The application initializes the JSON store with the following accounts on first startup:

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@example.com` | `Admin123!` | Dashboard stats, Quiz & Question CRUD, Publishing |
| **Student** | `student@example.com` | `Student123!` | Taking quizzes, viewing results, reviewing explanations |

> *Tip: The Login page features one-click "Demo Student" and "Demo Admin" autofill buttons for quick evaluations.*

---

## 4. Local Execution Commands

### Prerequisites
- Python 3.12+ (or 3.13)
- Node.js 20+ & npm

### Backend Setup & Execution
```bash
# 1. Navigate to backend
cd backend

# 2. Create and activate a Python virtual environment
python -m venv .venv

# On Windows (PowerShell):
.venv\Scripts\Activate.ps1
# On Linux/macOS:
source .venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Start the FastAPI development server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Backend will be active at:
- **API Base:** [http://localhost:8000](http://localhost:8000)
- **Interactive Swagger UI:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Check:** [http://localhost:8000/api/health](http://localhost:8000/api/health)

### Frontend Setup & Execution
Open a new terminal window:
```bash
# 1. Navigate to frontend
cd frontend

# 2. Install Node dependencies
npm install

# 3. Start Vite development server
npm run dev
```

Frontend will be active at:
- **Application URL:** [http://localhost:5173](http://localhost:5173)

---

## 5. Docker Compose Execution

To run the entire full stack in isolated containers with local JSON data persistence:

```bash
# Build and start all services
docker compose up --build -d

# Check service logs
docker compose logs -f

# Verify running containers
docker compose ps

# Stop all services
docker compose down
```

When running via Docker Compose:
- **Frontend App:** [http://localhost:3000](http://localhost:3000)
- **Backend API:** [http://localhost:8000](http://localhost:8000)
- **Swagger UI:** [http://localhost:8000/docs](http://localhost:8000/docs)
- The persistent data file is automatically mapped to `./backend/data/store.json`.

---

## 6. Testing & Build Verification Results

### Backend Automated Test Suite
Ran using `pytest` on Python 3.13:
```bash
python -m pytest -c backend/pytest.ini backend/tests -v
```
**Results:** **22 passed in 1.47s**
- `test_auth.py` (8 tests): Registration, duplicate rejection, email validation, login, wrong passwords, current user endpoint, unauthorized access.
- `test_quizzes.py` (5 tests): Quiz listing, answer key masking (preventing client leaks), 100% score calculation, partial scoring, attempt history & review.
- `test_admin.py` (4 tests): Student 403 Forbidden enforcement, dashboard stats, complete Quiz/Question CRUD lifecycle.
- `test_storage.py` (3 tests): Auto-initialization & seeding, persistence across service reloads, corrupt JSON error handling.
- `test_health.py` (2 tests): Health check probe and root API info.

### Frontend Production Build
Ran using `tsc -b && vite build`:
**Results:** **Passed cleanly (Exit code 0)**. Production bundle compiled into `frontend/dist/`.

---

## 7. Cloud Run Persistence Limitation

> [!IMPORTANT]
> **Ephemeral Filesystem Notice:**
> Google Cloud Run provides serverless container execution where container disk storage is strictly in-memory and ephemeral.
> - Data written to `backend/data/store.json` will reset upon container restart or scale-down.
> - Multiple concurrent instances will not share file state.
> - This setup is configured **strictly for demonstration and mini-project purposes**. Production deployments should integrate Google Cloud SQL or Firestore. Complete Cloud Run deployment instructions are documented in [`docs/deployment.md`](docs/deployment.md).

---

## 8. College Demo Walkthrough Checklist

Follow this quick script to present the project during an evaluation:

- [ ] **Step 1: System Health & Docs**
  - Open `http://localhost:8000/api/health` to demonstrate storage health and uptime.
  - Open `http://localhost:8000/docs` to showcase the Swagger API specification.
- [ ] **Step 2: Admin Workflow**
  - Log in with `admin@example.com` / `Admin123!`.
  - View the Admin Dashboard with live stats.
  - Click **+ Create New Quiz**, add a custom title, set a 5-minute timer, and add 2 multiple-choice questions with answer choices and explanations.
  - Save the quiz as **DRAFT**, then click the status badge to **PUBLISH** it.
- [ ] **Step 3: Student Workflow**
  - Open an incognito browser window or log out and log in as `student@example.com` / `Student123!`.
  - Open **Available Quizzes** and select your newly published quiz.
  - Read instructions on the start screen and click **Start Assessment**.
  - Answer the questions using the stepper, observe the countdown timer, and submit.
  - View the instantaneous score breakdown on the results screen.
  - Click **Review Detailed Answers** to demonstrate the color-coded feedback and teacher explanations.
- [ ] **Step 4: Persistence Proof**
  - Stop the backend server (`Ctrl + C`) and restart it.
  - Refresh the student's **My History** page to prove that the attempt and score survived the restart via `store.json`.

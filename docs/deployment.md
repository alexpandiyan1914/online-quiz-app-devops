# Google Cloud Run Deployment Guide

This guide details the step-by-step procedure for deploying the **Online Quiz Application** to **Google Artifact Registry** and **Google Cloud Run**.

> [!CAUTION]
> ### Critical Persistence Limitation on Google Cloud Run
> This application relies solely on a local JSON file (`backend/data/store.json`) for persistence.
> 
> **Cloud Run containers have ephemeral, non-shared filesystems:**
> 1. **Data Loss on Restarts:** Any data added or modified while the container is running will revert to the initial image state whenever Cloud Run scales to zero, restarts, or deploys a new revision.
> 2. **Instance Isolation:** If Cloud Run scales to 2 or more concurrent instances, each instance will write to its own independent file. They will not synchronize with each other.
> 
> **Explicit Classification:** This deployment architecture is intended **for academic demonstration and college mini-project presentation only**. Do not use single-file JSON persistence for real-world multi-tenant production systems.

---

## 1. Prerequisites and Environment Setup

Ensure the Google Cloud CLI (`gcloud`) is installed and authenticated:

```bash
# Login to Google Cloud
gcloud auth login

# Set your active GCP project
export PROJECT_ID="YOUR_GCP_PROJECT_ID"
export REGION="us-central1"
export REPO_NAME="quiz-app-repo"

gcloud config set project $PROJECT_ID
gcloud config set run/region $REGION
```

Enable the necessary GCP APIs:

```bash
gcloud services enable \
  artifactregistry.googleapis.com \
  run.googleapis.com \
  secretmanager.googleapis.com
```

---

## 2. Setting Up Google Artifact Registry

Create a standard Docker container repository:

```bash
gcloud artifacts repositories create $REPO_NAME \
  --repository-format=docker \
  --location=$REGION \
  --description="Docker repository for Online Quiz Application"

# Authenticate Docker to Artifact Registry
gcloud auth configure-docker ${REGION}-docker.pkg.dev
```

---

## 3. Building and Pushing Backend Image

```bash
# 1. Build backend container image
docker build -t ${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/quiz-backend:v1 ./backend

# 2. Push image to Artifact Registry
docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/quiz-backend:v1
```

---

## 4. Deploying Backend to Cloud Run

### 4.1 Store JWT Secret in Secret Manager
Never pass production secrets via raw command-line flags or git:

```bash
# Create secret in Secret Manager
echo -n "your-ultra-secure-random-jwt-secret-key-32-chars-minimum" | \
  gcloud secrets create quiz-jwt-secret --data-file=-

# Grant Cloud Run service account access to the secret
gcloud secrets add-iam-policy-binding quiz-jwt-secret \
  --member="serviceAccount:${PROJECT_ID}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### 4.2 Deploy Backend Service
```bash
gcloud run deploy quiz-backend \
  --image=${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/quiz-backend:v1 \
  --platform=managed \
  --region=$REGION \
  --allow-unauthenticated \
  --port=8000 \
  --min-instances=0 \
  --max-instances=1 \
  --set-env-vars="ENVIRONMENT=production,JWT_EXPIRE_MINUTES=240,DATA_FILE_PATH=/app/data/store.json,CORS_ORIGINS=*" \
  --set-secrets="JWT_SECRET_KEY=quiz-jwt-secret:latest"
```

> **Note on `--max-instances=1`:** Setting maximum instances to 1 minimizes filesystem divergence across instances during a demo session.

Save the generated backend URL:
```bash
export BACKEND_URL=$(gcloud run services describe quiz-backend --platform=managed --region=$REGION --format='value(status.url)')
echo "Backend deployed at: $BACKEND_URL"
```

---

## 5. Building and Deploying Frontend Image

### 5.1 Build Frontend with Backend URL
The React frontend requires `VITE_API_URL` during the static build phase:

```bash
docker build \
  --build-arg VITE_API_URL=$BACKEND_URL \
  -t ${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/quiz-frontend:v1 \
  ./frontend

# Push image
docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/quiz-frontend:v1
```

### 5.2 Deploy Frontend Service to Cloud Run
```bash
gcloud run deploy quiz-frontend \
  --image=${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/quiz-frontend:v1 \
  --platform=managed \
  --region=$REGION \
  --allow-unauthenticated \
  --port=80
```

Get the public URL for the frontend:
```bash
export FRONTEND_URL=$(gcloud run services describe quiz-frontend --platform=managed --region=$REGION --format='value(status.url)')
echo "Frontend accessible at: $FRONTEND_URL"
```

### 5.3 Restrict Backend CORS to Frontend URL
Update the backend service to only permit requests from the newly deployed frontend:

```bash
gcloud run services update quiz-backend \
  --region=$REGION \
  --update-env-vars="CORS_ORIGINS=${FRONTEND_URL}"
```

---

## 6. Verification and Health Checks

1. Verify backend health endpoint:
   ```bash
   curl -i "${BACKEND_URL}/api/health"
   ```
   Expected response: `HTTP/2 200` with `{"status":"healthy","storage_healthy":true,...}`.

2. Verify OpenAPI Swagger UI:
   Navigate to `${BACKEND_URL}/docs` in your browser.

3. Open `${FRONTEND_URL}` in your browser and test:
   - Login using `admin@example.com` / `Admin123!`
   - Create a quiz.
   - Login as `student@example.com` / `Student123!` and submit an attempt.

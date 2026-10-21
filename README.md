# DemoSpace — Login + Dashboard

A beginner-friendly demo full-stack application for learning **Docker**, **GitHub**, **AWS ECR**, and **Kubernetes (EKS)**.

- **Backend:** Java 21, Spring Boot, Maven, REST API on port `8080`
- **Frontend:** React + Vite (JavaScript), built to static files and served by **Nginx** on port `80`
- **DevOps:** Docker, Docker Compose, AWS ECR, Kubernetes / AWS EKS

> **Demo only:** authentication uses hard-coded demo credentials with no tokens or sessions. This is **not** production-grade security and must not be used for real accounts or sensitive data.

---

## 1. Project overview

The app has two screens:

1. **Login page** — DemoSpace logo/name, email + password (with show/hide), validation, a loading spinner, clear error messages for invalid credentials, a visible demo-credentials box, and a responsive layout.
2. **Dashboard** — admin-style layout with a sidebar (Overview, Projects, Tasks, Team, Settings, Logout), a top bar (app name, current section, user + avatar), stat cards (Total Projects 12, Tasks Completed 84, Team Members 8), a Recent Activity list, a Weekly Progress dial, a welcome message with the signed-in user's name, and a **New Project** button.

The login calls the backend at `POST /api/auth/login`. On success the frontend navigates to the dashboard; on failure it shows an error. The **Logout** button returns to the login page. The dashboard uses sample data and needs no database.

---

## 2. Architecture

```text
                Browser
                   │  GET /            (static React build)
                   │  POST /api/auth/login
                   ▼
        ┌─────────────────────┐        proxy /api/ → backend:8080
        │  Nginx (frontend)   │────────────────────────────────┐
        │  serves React build │                                │
        └─────────────────────┘                                ▼
                                                   ┌────────────────────────┐
                                                   │ Spring Boot (backend)  │
                                                   │  /api/auth/login       │
                                                   │  /api/health           │
                                                   └────────────────────────┘
```

The browser only ever talks to the frontend origin. Nginx proxies every `/api/` request to the backend:

- **Docker Compose:** proxies to the Compose service name `backend` (aliased as `demo-backend`).
- **Kubernetes:** proxies to the stable Service DNS name `demo-backend` in the `demospace` namespace.

Because of this reverse proxy, the frontend **never hard-codes** `localhost` or a backend IP.

---

## 3. Directory structure

```text
demo-login-dashboard/
├── backend/
│   ├── src/main/java/com/example/demospace/
│   │   ├── DemoSpaceApplication.java        # Spring Boot entry point
│   │   ├── AuthController.java              # POST /api/auth/login, GET /api/health
│   │   ├── AuthService.java                 # login logic (demo credentials)
│   │   ├── LoginRequest.java                # request DTO + validation
│   │   └── InvalidCredentialsException.java # 401 handling
│   ├── src/main/resources/application.properties
│   ├── src/test/java/.../AuthServiceTest.java
│   ├── pom.xml
│   ├── Dockerfile
│   └── .dockerignore
├── frontend/
│   ├── src/{main.jsx, App.jsx, styles.css}
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── nginx.conf
│   ├── Dockerfile
│   └── .dockerignore
├── k8s/
│   ├── namespace.yaml
│   ├── configmap.yaml
│   ├── backend-deployment.yaml
│   ├── backend-service.yaml
│   ├── frontend-deployment.yaml
│   ├── frontend-service.yaml
│   └── secret.example.yaml        # optional example, do not commit real secrets
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## 4. Prerequisites

| Tool | Purpose | Notes |
|------|---------|-------|
| Docker Desktop | Run locally with Compose, build images | Must be **running** |
| Git | Push to GitHub | |
| Node.js 20+ (optional) | Frontend dev/build **outside** Docker | `npm run build` |
| Java 21 + Maven (optional) | Backend build/test **outside** Docker | Maven wrapper not included |
| AWS CLI v2 | Authenticate to ECR, manage EKS | |
| kubectl | Deploy to Kubernetes/EKS | |
| AWS account + EKS cluster | Cloud deployment | EKS is **not** assumed to exist |

You do **not** need Node, Java, or Maven installed to run everything locally — Docker builds everything inside containers.

---

## 5. Demo credentials

| Field | Value |
|-------|-------|
| Email | `demo@example.com` |
| Password | `Demo@123` |

These are isolated in configuration (`application.properties` / environment variables) and shown in a clearly visible box on the login page. Passwords are **not** stored in frontend source as the source of truth — the backend validates them.

---

## 6. Run locally with Docker Compose

From the project root:

```powershell
docker compose up --build
```

Then open **http://localhost:8081**, sign in with the demo credentials, and the dashboard opens.

What you get:

| Service | Container port | Host URL |
|---------|----------------|----------|
| frontend (Nginx) | 80 | http://localhost:8081 |
| backend (Spring Boot) | 8080 | http://localhost:8082 |

- API through the proxy: http://localhost:8081/api/health
- API direct to backend: http://localhost:8082/api/health

Stop everything:

```powershell
docker compose down
```

### Run the frontend/backend without Docker (optional)

```powershell
# Terminal 1 - backend (needs Java 21 + Maven)
cd backend
mvn spring-boot:run

# Terminal 2 - frontend (needs Node 20+)
cd frontend
npm install
npm run dev
```

Vite proxies `/api` to `http://localhost:8080` during development (see `vite.config.js`).

---

## 7. Push to GitHub

Create an **empty** repository on GitHub, then from the project root:

```powershell
git init
git add .
git commit -m "DemoSpace: login + dashboard (frontend, backend, Docker, Kubernetes)"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
git push -u origin main
```

`.gitignore` already excludes build output, `node_modules`, `.env*`, and secrets. Never commit `.env`, `*.pem`, `*.key`, or AWS credentials.

---

## 8. Build Docker images

```powershell
docker build -t demo-login-backend:v1  .\backend
docker build -t demo-login-frontend:v1 .\frontend
```

---

## 9. Push images to AWS ECR

Create **two** private repositories in your region: `demo-login-backend` and `demo-login-frontend`.

Replace `ACCOUNT_ID` and `REGION` (for example `ap-south-1`):

```powershell
# 1. Authenticate Docker to ECR
aws ecr get-login-password --region REGION | docker login --username AWS --password-stdin ACCOUNT_ID.dkr.ecr.REGION.amazonaws.com

# 2. Tag images with the full ECR URIs
docker tag demo-login-backend:v1  ACCOUNT_ID.dkr.ecr.REGION.amazonaws.com/demo-login-backend:v1
docker tag demo-login-frontend:v1 ACCOUNT_ID.dkr.ecr.REGION.amazonaws.com/demo-login-frontend:v1

# 3. Push both images
docker push ACCOUNT_ID.dkr.ecr.REGION.amazonaws.com/demo-login-backend:v1
docker push ACCOUNT_ID.dkr.ecr.REGION.amazonaws.com/demo-login-frontend:v1
```

---

## 10. Deploy to Kubernetes / EKS

### 10.1 Prepare the cluster

EKS is **not** assumed to exist. Create one first if needed, then point kubectl at it:

```powershell
aws eks update-kubeconfig --region REGION --name YOUR_CLUSTER_NAME
```

### 10.2 Update the image placeholders

Edit the two manifests and replace the placeholders with your ECR URIs:

- `k8s/backend-deployment.yaml`  → `image: YOUR_ECR_BACKEND_IMAGE`  → `.../demo-login-backend:v1`
- `k8s/frontend-deployment.yaml` → `image: YOUR_ECR_FRONTEND_IMAGE` → `.../demo-login-frontend:v1`

### 10.3 Apply the manifests

```powershell
kubectl apply -f .\k8s\namespace.yaml
kubectl apply -f .\k8s\configmap.yaml
kubectl apply -f .\k8s\backend-deployment.yaml
kubectl apply -f .\k8s\backend-service.yaml
kubectl apply -f .\k8s\frontend-deployment.yaml
kubectl apply -f .\k8s\frontend-service.yaml
```

### 10.4 Verify Pods, Services, and logs

```powershell
kubectl -n demospace get pods,services
kubectl -n demospace get deployments
kubectl -n demospace logs -l app=demo-backend --tail=50
kubectl -n demospace describe pod -l app=demo-frontend
```

### 10.5 Access the frontend (port-forward)

The frontend Service is `ClusterIP` (simple and safe for a demo). Forward it locally:

```powershell
kubectl -n demospace port-forward service/demo-frontend 8081:80
```

Then open **http://localhost:8081**. Nginx inside the pod proxies `/api/` to the `demo-backend` Service, so login reaches the backend without any change.

> For public access on EKS later, add an Ingress or switch the frontend Service to a `LoadBalancer` and configure a properly scoped security group. This is out of scope for the demo.

### 10.6 Clean up

```powershell
kubectl delete namespace demospace
```

---

## 11. Kubernetes resources

| File | Resource | Notes |
|------|----------|-------|
| `namespace.yaml` | Namespace `demospace` | All resources live here |
| `configmap.yaml` | ConfigMap `demo-backend-config` | Demo login email/password |
| `backend-deployment.yaml` | Deployment `demo-backend` | 2 replicas, readiness + liveness on `/api/health`, CPU/memory requests & limits |
| `backend-service.yaml` | Service `demo-backend` | ClusterIP on port 8080 |
| `frontend-deployment.yaml` | Deployment `demo-frontend` | 2 replicas, probes on `/`, CPU/memory requests & limits |
| `frontend-service.yaml` | Service `demo-frontend` | ClusterIP on port 80 (use port-forward) |
| `secret.example.yaml` | Secret example | Optional; **do not commit real values** |

### Managing secrets safely

The demo credentials live in a **ConfigMap** because they are intentionally public demo values. For real secrets:

1. Copy `k8s/secret.example.yaml` to a git-ignored file such as `k8s/secret.local.yaml`.
2. Fill in base64 values:
   ```powershell
   [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes('your-value'))
   ```
3. Apply it and switch the backend Deployment from `configMapRef` to `secretRef`.
4. In production, prefer **AWS Secrets Manager** / **SSM Parameter Store** (for example via the Secrets Store CSI Driver) instead of committing any secret manifest.

---

## 12. Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| `Cannot connect to the server` on login | Backend not reachable / still starting | `docker compose ps` — wait for backend **healthy**; check `docker compose logs backend` |
| Login returns **500** | Backend crashed on startup | `docker compose logs backend`; ensure Java build succeeded |
| **401** on correct credentials | Wrong demo credentials | Use `demo@example.com` / `Demo@123` |
| **400** on login | Email blank / not a valid email | Enter a valid email address |
| Frontend loads but API calls fail | Nginx backend name mismatch | Compose uses `demo-backend` alias; K8s uses Service `demo-backend`. Keep these names consistent |
| `docker compose up` fails to build frontend | Stale `node_modules` copied into image | `.dockerignore` excludes it; run `docker compose build --no-cache frontend` |
| `kubectl port-forward` refused | Wrong namespace/name | Use `-n demospace service/demo-frontend` |
| Pod stuck `ImagePullBackOff` | Image URI/placeholder or ECR auth | Replace `YOUR_ECR_*` placeholders; ensure node can pull from ECR |
| Pods `CrashLoopBackOff` | App or probe failing | `kubectl -n demospace logs <pod>` and `describe pod <pod>` |
| Port 8081/8082 already in use | Another process bound | Stop it or edit the ports in `docker-compose.yml` |

---

## 13. Security note

This authentication is for demonstration only. Credentials are configurable via `DEMO_LOGIN_EMAIL` / `DEMO_LOGIN_PASSWORD` environment variables, but the default is a known public demo credential. Do not present this as a real login system, and never reuse these patterns for production authentication.

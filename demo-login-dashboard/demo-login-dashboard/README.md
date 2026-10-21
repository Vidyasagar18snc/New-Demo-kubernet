# DemoSpace — Login + Dashboard

A demo full-stack project for learning Docker, GitHub, AWS ECR, and Kubernetes.

## Demo credentials
- Email: `demo@example.com`
- Password: `Demo@123`

> Demo only: this uses hard-coded demo credentials and no real session/token security. Do not use for real accounts or sensitive data.

## Run locally with Docker
Prerequisite: Docker Desktop is installed and running.

From the project root:
```powershell
docker compose up --build
```
Open http://localhost:8081, sign in with the demo credentials, and the dashboard should open.

Stop:
```powershell
docker compose down
```

## Build Docker images
```powershell
docker build -t demo-login-backend:v1 .\backend
docker build -t demo-login-frontend:v1 .\frontend
```

## Push to AWS ECR
Create two private repositories in your AWS region:
- `demo-login-backend`
- `demo-login-frontend`

Authenticate Docker to ECR using the AWS CLI. Replace `ACCOUNT_ID` and `REGION` with your values:
```powershell
aws ecr get-login-password --region REGION | docker login --username AWS --password-stdin ACCOUNT_ID.dkr.ecr.REGION.amazonaws.com
docker tag demo-login-backend:v1 ACCOUNT_ID.dkr.ecr.REGION.amazonaws.com/demo-login-backend:v1
docker tag demo-login-frontend:v1 ACCOUNT_ID.dkr.ecr.REGION.amazonaws.com/demo-login-frontend:v1
docker push ACCOUNT_ID.dkr.ecr.REGION.amazonaws.com/demo-login-backend:v1
docker push ACCOUNT_ID.dkr.ecr.REGION.amazonaws.com/demo-login-frontend:v1
```

## Deploy to Kubernetes
1. Replace `YOUR_ECR_BACKEND_IMAGE` in `k8s/backend-deployment.yaml` with the full backend ECR image URI ending in `:v1`.
2. Replace `YOUR_ECR_FRONTEND_IMAGE` in `k8s/frontend-deployment.yaml` with the full frontend ECR image URI ending in `:v1`.
3. Apply the manifests:
```powershell
kubectl apply -f .\k8s\namespace.yaml
kubectl apply -f .\k8s\configmap.yaml
kubectl apply -f .\k8s\backend-deployment.yaml
kubectl apply -f .\k8s\backend-service.yaml
kubectl apply -f .\k8s\frontend-deployment.yaml
kubectl apply -f .\k8s\frontend-service.yaml
kubectl -n demospace get pods,services
```
4. Access the frontend locally:
```powershell
kubectl -n demospace port-forward service/demo-frontend 8081:80
```
Open http://localhost:8081.

## Project structure
- `backend/`: Java 21 Spring Boot API.
- `frontend/`: React + Vite login/dashboard, built and served by Nginx.
- `k8s/`: Kubernetes namespace, deployments, services, and ConfigMap.
- `docker-compose.yml`: local full-stack run.

## Security note
The demo password is configurable using `DEMO_LOGIN_EMAIL` and `DEMO_LOGIN_PASSWORD` environment variables, but the default is intentionally a known demo credential. Do not expose this as a real public login system.

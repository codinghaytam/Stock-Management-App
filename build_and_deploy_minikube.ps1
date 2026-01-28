# Powershell Script for Minikube Deployment
$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   Minikube Build & Deploy Helper"
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Point Docker CLI to Minikube's Docker daemon
Write-Host "[Init] Configuring shell for Minikube Docker environment..." -ForegroundColor Yellow
try {
    & minikube -p minikube docker-env --shell powershell | Invoke-Expression
} catch {
    Write-Error "Failed to set minikube docker-env. Is Minikube running?"
    exit 1
}

# 2. Build Backend
Write-Host "`n[1/3] Building Backend Image (Spring Boot)..." -ForegroundColor Yellow
docker build -t agent-interface-backend:latest -f agentInterface/Dockerfile agentInterface
if ($LASTEXITCODE -ne 0) { Write-Error "Backend build failed"; exit 1 }

# 3. Build Frontend
Write-Host "`n[2/3] Building Frontend Image (Angular + Nginx)..." -ForegroundColor Yellow
docker build -t frontend-erp:latest -f frontendERP/frontendERP/Dockerfile frontendERP/frontendERP
if ($LASTEXITCODE -ne 0) { Write-Error "Frontend build failed"; exit 1 }

# 4. Apply K8s Config
Write-Host "`n[3/3] Applying Kubernetes Configuration..." -ForegroundColor Yellow
kubectl apply -f kubernet/kuberneties.yaml

# 5. Restart to pick up new images
Write-Host "`n[Refresh] Restarting deployments to load new images..." -ForegroundColor Yellow
kubectl rollout restart deployment/agent-backend
kubectl rollout restart deployment/frontend-erp

Write-Host "`n==========================================" -ForegroundColor Green
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "Use 'kubectl get pods' or 'minikube dashboard' to monitor."
Write-Host "Access variables: minikube service frontend-erp --url"

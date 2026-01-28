@echo off
echo ==========================================
echo Starting Build and Deploy Process
echo ==========================================

echo [1/3] Building Backend Image (Spring Boot)...
docker build -t agent-interface-backend:latest -f agentInterface/Dockerfile agentInterface
if %errorlevel% neq 0 (
    echo Failed to build backend image.
    pause
    exit /b %errorlevel%
)

echo [2/3] Building Frontend Image (Angular + Nginx)...
docker build -t frontend-erp:latest -f frontendERP/frontendERP/Dockerfile frontendERP/frontendERP
if %errorlevel% neq 0 (
    echo Failed to build frontend image.
    pause
    exit /b %errorlevel%
)

echo [3/3] Applying Kubernetes Configuration...
kubectl apply -f kubernet/kuberneties.yaml
if %errorlevel% neq 0 (
    echo Failed to apply Kubernetes configuration.
    pause
    exit /b %errorlevel%
)

echo ==========================================
echo Deployment Complete!
echo Use 'kubectl get pods' to check status.
echo ==========================================
pause

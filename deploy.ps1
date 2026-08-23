# MediSlot Deployment Helper Script
# This script helps prepare your application for deployment

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   MediSlot Deployment Helper" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if pnpm is installed
Write-Host "Checking prerequisites..." -ForegroundColor Yellow
$pnpmInstalled = $false
try {
    $pnpmVersion = pnpm --version 2>$null
    if ($pnpmVersion) {
        Write-Host "✓ pnpm version: $pnpmVersion" -ForegroundColor Green
        $pnpmInstalled = $true
    }
} catch {
    $pnpmInstalled = $false
}

if (-not $pnpmInstalled) {
    Write-Host "✗ pnpm is not installed. Please install pnpm first." -ForegroundColor Red
    Write-Host "  Run: npm install -g pnpm" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Step 1: Clean Build" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Clean previous builds
Write-Host "Cleaning previous builds..." -ForegroundColor Yellow
if (Test-Path "apps/api/dist") {
    Remove-Item -Path "apps/api/dist" -Recurse -Force
    Write-Host "✓ Cleaned API dist folder" -ForegroundColor Green
}
if (Test-Path "apps/web/.next") {
    Remove-Item -Path "apps/web/.next" -Recurse -Force
    Write-Host "✓ Cleaned Web .next folder" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Step 2: Install Dependencies" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "Installing dependencies..." -ForegroundColor Yellow
pnpm install --frozen-lockfile
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to install dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Dependencies installed" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Step 3: Generate Prisma Client" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "Generating Prisma client..." -ForegroundColor Yellow
Push-Location packages/database
pnpm prisma generate
$prismaExitCode = $LASTEXITCODE
Pop-Location

if ($prismaExitCode -ne 0) {
    Write-Host "✗ Failed to generate Prisma client" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Prisma client generated" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Step 4: Build Backend (API)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "Building backend..." -ForegroundColor Yellow
Push-Location apps/api
pnpm run build
$apiExitCode = $LASTEXITCODE
Pop-Location

if ($apiExitCode -ne 0) {
    Write-Host "✗ Backend build failed" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Backend built successfully" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Step 5: Build Frontend (Web)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "Building frontend..." -ForegroundColor Yellow
Push-Location apps/web
pnpm run build
$webExitCode = $LASTEXITCODE
Pop-Location

if ($webExitCode -ne 0) {
    Write-Host "✗ Frontend build failed" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Frontend built successfully" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Build Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✓ All builds completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Review DEPLOYMENT_GUIDE.md for platform-specific instructions" -ForegroundColor White
Write-Host "2. Review QUICK_DEPLOY_STEPS.md for fastest deployment path" -ForegroundColor White
Write-Host "3. Complete PRE_DEPLOYMENT_CHECKLIST.md" -ForegroundColor White
Write-Host "4. Choose a deployment platform (Render, Railway, Vercel, etc.)" -ForegroundColor White
Write-Host "5. Set up environment variables on your chosen platform" -ForegroundColor White
Write-Host "6. Deploy backend first, then frontend" -ForegroundColor White
Write-Host "7. Update Google OAuth redirect URIs" -ForegroundColor White
Write-Host "8. Test all critical flows" -ForegroundColor White
Write-Host ""
Write-Host "Build artifacts:" -ForegroundColor Yellow
Write-Host "  Backend:  apps/api/dist/" -ForegroundColor White
Write-Host "  Frontend: apps/web/.next/" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Ready for Deployment! 🚀" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

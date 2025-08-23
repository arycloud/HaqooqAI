# Simple Deployment Guide for HaqooqAI

## 🚀 Simplified Deployment Workflow

### Branch Structure
- **`main`**: Production code (contains both frontend and backend)
- **`develop`**: Development integration branch (contains both frontend and backend)
- **`frontend`**: Frontend-only code for deployment
- **`backend`**: Backend-only code for deployment

### Deployment Process

#### Frontend Deployment
1. **Push to `frontend` branch** → Automatic deployment to GitHub Pages
2. **Workflow**: `.github/workflows/deploy-frontend.yml`
3. **Target**: GitHub Pages (static hosting)

#### Backend Deployment  
1. **Push to `backend` branch** → Automatic deployment to Hugging Face Spaces
2. **Workflow**: `.github/workflows/deploy-backend.yml`
3. **Target**: Hugging Face Spaces (Python backend hosting)

### Manual Integration
When you want to integrate changes:
1. Merge `frontend` → `develop` (for frontend changes)
2. Merge `backend` → `develop` (for backend changes)
3. Merge `develop` → `main` (for production releases)

### Required Secrets
Add these in GitHub → Settings → Secrets → Actions:

#### Backend Deployment
- `HF_TOKEN`: Your Hugging Face authentication token
- `GROQ_API_KEY`: Groq API key for AI services
- `GITHUB_CLIENT_ID`: GitHub OAuth client ID
- `GITHUB_CLIENT_SECRET`: GitHub OAuth client secret
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_KEY`: Supabase service role key
- `SUPABASE_ANON_KEY`: Supabase anonymous key

#### Frontend Deployment
- `VITE_BACKEND_URL`: Backend API URL (e.g., `https://ary91-haqooqai-backend.hf.space`)
- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous key
- `VITE_APP_URL`: Frontend app URL (e.g., `https://arycloud.github.io/HaqooqAI`)

### Quick Start
1. **Frontend changes**: Work on `frontend` branch → push → auto-deploy
2. **Backend changes**: Work on `backend` branch → push → auto-deploy  
3. **Integration**: Manually merge to `develop` when ready
4. **Production**: Manually merge `develop` → `main` for releases

### Default Branch
The default branch on GitHub should be set to **`develop`** for ongoing development.

### Verification
Run the verification script to check setup:
```bash
./verify-git-setup.sh
```

## 🎯 Simple Workflow Benefits
- No complex branch protection rules
- No automatic PR creation
- Direct deployment from service branches
- Manual control over integration
- Easy to understand and maintain

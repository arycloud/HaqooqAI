# HaqooqAI Professional Git Workflow & Deployment Strategy

## 🎯 Branch Strategy Overview

### Branch Hierarchy
```
main (production)
├── develop (integration)
│   ├── frontend (frontend development)
│   ├── backend (backend development)
│   └── feature/* (individual features)
└── hotfix/* (emergency fixes)
```

### Branch Purposes
- **`main`**: Production-ready code only. Protected with required reviews.
- **`develop`**: Integration branch for testing combined changes.
- **`frontend`**: Frontend development and staging deployment.
- **`backend`**: Backend development and staging deployment.
- **`feature/*`**: Individual feature development branches.
- **`hotfix/*`**: Emergency fixes that bypass normal flow.

## 🔒 Branch Protection Rules

### Main Branch Protection
```yaml
Branch: main
Settings:
  - Require pull request reviews: 2 reviewers
  - Dismiss stale reviews: true
  - Require review from code owners: true
  - Restrict pushes to matching branches: true
  - Require status checks: true
  - Required status checks:
    - frontend-tests
    - backend-tests
    - integration-tests
    - security-scan
  - Require branches to be up to date: true
  - Include administrators: true
  - Allow force pushes: false
  - Allow deletions: false
```

### Develop Branch Protection
```yaml
Branch: develop
Settings:
  - Require pull request reviews: 1 reviewer
  - Require status checks: true
  - Required status checks:
    - frontend-tests
    - backend-tests
    - integration-tests
  - Require branches to be up to date: true
  - Allow force pushes: false
```

### Service Branch Protection
```yaml
Branches: frontend, backend
Settings:
  - Require pull request reviews: 1 reviewer
  - Require status checks: true
  - Required status checks:
    - respective service tests
  - Allow force pushes: false
```

## 🚀 Deployment Workflows

### 1. Frontend Deployment
**Trigger**: Push to `frontend` or `main` branch
**Target**: GitHub Pages
**Process**:
1. Run TypeScript checks
2. Run ESLint
3. Run tests with coverage
4. Build application
5. Deploy to GitHub Pages
6. Create PR to merge `frontend` → `develop` (if from frontend branch)

### 2. Backend Deployment
**Trigger**: Push to `backend` or `main` branch
**Target**: Hugging Face Spaces
**Process**:
1. Run Python tests
2. Run code quality checks (flake8, black)
3. Test Supabase connection
4. Deploy to Hugging Face Spaces
5. Configure environment variables
6. Create PR to merge `backend` → `develop` (if from backend branch)

### 3. Integration Testing
**Trigger**: Push to `develop` or PR to `develop`/`main`
**Process**:
1. Run frontend tests
2. Run backend tests
3. Start backend service
4. Test frontend-backend integration
5. Run security scans
6. Generate quality gate report

### 4. Release Management
**Trigger**: Manual workflow dispatch or tag push
**Process**:
1. Calculate new version number
2. Update package.json versions
3. Generate changelog from commits
4. Create and push git tag
5. Create GitHub release
6. Deploy to production
7. Notify team

## 📋 Development Workflow

### Feature Development
```bash
# 1. Create feature branch from develop
git checkout develop
git pull origin develop
git checkout -b feature/new-feature

# 2. Develop and commit changes
git add .
git commit -m "feat: add new feature"

# 3. Push and create PR to appropriate service branch
git push origin feature/new-feature
# Create PR: feature/new-feature → frontend/backend

# 4. After review and merge, service branch auto-creates PR to develop
```

### Service-Specific Development
```bash
# Frontend development
git checkout frontend
git pull origin frontend
# Make changes
git commit -m "feat: update UI component"
git push origin frontend
# Triggers deployment + PR to develop

# Backend development
git checkout backend
git pull origin backend
# Make changes
git commit -m "feat: add new API endpoint"
git push origin backend
# Triggers deployment + PR to develop
```

### Release Process
```bash
# 1. Ensure develop is ready for release
git checkout develop
git pull origin develop

# 2. Create PR: develop → main
# This triggers full integration tests

# 3. After merge to main, create release
# Use GitHub Actions workflow dispatch for versioned release
```

### Hotfix Process
```bash
# 1. Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-fix

# 2. Make fix and test
git commit -m "fix: critical security issue"

# 3. Create PR directly to main
# This bypasses normal development flow for emergencies
```

## 🔧 Required GitHub Secrets

### Repository Secrets
```yaml
# Frontend Deployment
# VITE_BACKEND_URL: "https://ary91-haqooqai-backend.hf.space"
# VITE_SUPABASE_URL: "your-supabase-url"
# VITE_SUPABASE_ANON_KEY: "your-supabase-anon-key"
# VITE_APP_URL: "https://arycloud.github.io/HaqooqAI"

# Backend Deployment
HF_TOKEN: "your-hugging-face-token"
GROQ_API_KEY: "your-groq-api-key"
GITHUB_CLIENT_ID: "your-github-oauth-client-id"
GITHUB_CLIENT_SECRET: "your-github-oauth-client-secret"
SUPABASE_URL: "your-supabase-url"
SUPABASE_SERVICE_KEY: "your-supabase-service-key"
SUPABASE_ANON_KEY: "your-supabase-anon-key"

# General
GITHUB_TOKEN: "automatically provided by GitHub"
```

## 📊 Quality Gates

### Code Quality Requirements
- **Frontend**: TypeScript checks, ESLint, test coverage > 80%
- **Backend**: Python type hints, flake8, black formatting, test coverage > 80%
- **Security**: Trivy vulnerability scanning
- **Integration**: Frontend-backend communication tests

### Review Requirements
- **Main branch**: 2 required reviewers, code owner approval
- **Develop branch**: 1 required reviewer
- **Service branches**: 1 required reviewer
- **Feature branches**: No required reviews (optional)

## 🚨 Emergency Procedures

### Hotfix Deployment
1. Create hotfix branch from main
2. Make minimal fix
3. Create PR directly to main
4. Emergency review and merge
5. Automatic deployment to production
6. Backport fix to develop

### Rollback Procedure
1. Identify last known good commit/tag
2. Create rollback branch from that point
3. Deploy rollback branch
4. Investigate and fix issue in develop
5. Resume normal deployment flow

## 📈 Monitoring & Metrics

### Deployment Metrics
- Deployment frequency
- Lead time for changes
- Mean time to recovery
- Change failure rate

### Quality Metrics
- Test coverage percentage
- Code quality scores
- Security vulnerability count
- Performance benchmarks

## 🔄 Continuous Improvement

### Weekly Reviews
- Review deployment metrics
- Analyze failed deployments
- Update workflows based on learnings
- Team feedback on process

### Monthly Assessments
- Branch strategy effectiveness
- Workflow optimization opportunities
- Tool and process updates
- Team training needs

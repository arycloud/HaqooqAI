#!/bin/bash

# HaqooqAI Git Workflow Setup Script
# This script initializes the professional Git workflow structure

set -e

echo "🚀 Setting up HaqooqAI Professional Git Workflow"
echo "================================================"

# Check if we're in the right directory
if [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    echo "❌ Error: Please run this script from the HaqooqAI project root directory"
    exit 1
fi

# Initialize Git repository if not already initialized
if [ ! -d ".git" ]; then
    echo "📁 Initializing Git repository..."
    git init
    echo "✅ Git repository initialized"
else
    echo "📁 Git repository already exists"
fi

# Configure Git settings
echo "⚙️  Configuring Git settings..."
git config --local core.autocrlf false
git config --local core.safecrlf true
git config --local pull.rebase false
echo "✅ Git settings configured"

# Create .gitignore if it doesn't exist
if [ ! -f ".gitignore" ]; then
    echo "📝 Creating .gitignore..."
    cat > .gitignore << 'EOF'
# Dependencies
node_modules/
__pycache__/
*.pyc
*.pyo
*.pyd
.Python
env/
venv/
.venv/
pip-log.txt
pip-delete-this-directory.txt

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Build outputs
dist/
build/
*.egg-info/
.coverage
htmlcov/
.pytest_cache/
.mypy_cache/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
.nyc_output/

# Dependency directories
jspm_packages/

# Optional npm cache directory
.npm

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env

# Hugging Face
.huggingface/

# Temporary files
*.tmp
*.temp
EOF
    echo "✅ .gitignore created"
fi

# Add all files to staging
echo "📦 Adding files to Git..."
git add .

# Create initial commit if no commits exist
if ! git rev-parse --verify HEAD >/dev/null 2>&1; then
    echo "📝 Creating initial commit..."
    git commit -m "feat: initial HaqooqAI project setup

- Add frontend React application with TypeScript
- Add backend FastAPI service with AI integration
- Add comprehensive documentation
- Add professional Git workflow configuration
- Add GitHub Actions for CI/CD"
    echo "✅ Initial commit created"
fi

# Create and switch to main branch if not already on it
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "master")
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "🔄 Switching to main branch..."
    git branch -m main 2>/dev/null || git checkout -b main
    echo "✅ Now on main branch"
fi

# Create develop branch
echo "🌿 Creating develop branch..."
if ! git show-ref --verify --quiet refs/heads/develop; then
    git checkout -b develop
    git checkout main
    echo "✅ Develop branch created"
else
    echo "✅ Develop branch already exists"
fi

# Create frontend branch
echo "🎨 Creating frontend branch..."
if ! git show-ref --verify --quiet refs/heads/frontend; then
    git checkout -b frontend
    git checkout main
    echo "✅ Frontend branch created"
else
    echo "✅ Frontend branch already exists"
fi

# Create backend branch
echo "⚙️  Creating backend branch..."
if ! git show-ref --verify --quiet refs/heads/backend; then
    git checkout -b backend
    git checkout main
    echo "✅ Backend branch created"
else
    echo "✅ Backend branch already exists"
fi

# Ensure we're back on main
git checkout main

echo ""
echo "🎉 Git workflow setup complete!"
echo ""
echo "📋 Branch Structure Created:"
echo "   main     - Production releases"
echo "   develop  - Integration branch"
echo "   frontend - Frontend development"
echo "   backend  - Backend development"
echo ""
echo "🔧 Next Steps:"
echo "1. Set up GitHub repository:"
echo "   git remote add origin https://github.com/yourusername/HaqooqAI.git"
echo ""
echo "2. Push all branches:"
echo "   git push -u origin main"
echo "   git push -u origin develop"
echo "   git push -u origin frontend"
echo "   git push -u origin backend"
echo ""
echo "3. Configure branch protection rules in GitHub:"
echo "   - Go to Settings > Branches"
echo "   - Add protection rules as specified in DEPLOYMENT_STRATEGY.md"
echo ""
echo "4. Add required secrets in GitHub:"
echo "   - Go to Settings > Secrets and variables > Actions"
echo "   - Add all secrets listed in DEPLOYMENT_STRATEGY.md"
echo ""
echo "5. Enable GitHub Pages:"
echo "   - Go to Settings > Pages"
echo "   - Source: GitHub Actions"
echo ""
echo "📖 For detailed workflow information, see:"
echo "   - DEPLOYMENT_STRATEGY.md"
echo "   - .github/workflows/ directory"
echo ""
echo "✨ Happy coding!"

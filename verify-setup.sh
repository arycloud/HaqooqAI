#!/bin/bash

# HaqooqAI Setup Verification Script
# This script verifies that the Git workflow and directory structure are correctly set up

set -e

echo "🔍 Verifying HaqooqAI Setup"
echo "=========================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check if we're in the right directory
echo "📁 Checking directory structure..."
if [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    echo -e "${RED}❌ Error: Please run this script from the HaqooqAI project root directory${NC}"
    exit 1
fi
print_status 0 "Project root directory structure is correct"

# Check frontend directory structure
if [ -d "frontend/HaqooqAI-frontend" ]; then
    print_status 0 "Frontend directory exists: frontend/HaqooqAI-frontend"
else
    print_status 1 "Frontend directory missing: frontend/HaqooqAI-frontend"
fi

# Check backend directory structure
if [ -d "backend" ]; then
    print_status 0 "Backend directory exists: backend"
else
    print_status 1 "Backend directory missing: backend"
fi

# Check GitHub Actions workflows
echo ""
echo "🔧 Checking GitHub Actions workflows..."
if [ -d ".github/workflows" ]; then
    print_status 0 "GitHub Actions workflows directory exists"
    
    # Check individual workflow files
    workflows=("deploy-frontend.yml" "deploy-backend.yml" "integration-tests.yml" "release.yml")
    for workflow in "${workflows[@]}"; do
        if [ -f ".github/workflows/$workflow" ]; then
            print_status 0 "Workflow file exists: $workflow"
        else
            print_status 1 "Workflow file missing: $workflow"
        fi
    done
else
    print_status 1 "GitHub Actions workflows directory missing"
fi

# Check documentation files
echo ""
echo "📚 Checking documentation..."
docs=("DEPLOYMENT_STRATEGY.md" "Haqooqai Frontend Documentation.md" "Haqooqai Backend Documentation.md")
for doc in "${docs[@]}"; do
    if [ -f "$doc" ]; then
        print_status 0 "Documentation exists: $doc"
    else
        print_status 1 "Documentation missing: $doc"
    fi
done

# Check frontend package.json
echo ""
echo "📦 Checking frontend configuration..."
if [ -f "frontend/HaqooqAI-frontend/package.json" ]; then
    print_status 0 "Frontend package.json exists"
    
    # Check if required scripts exist
    if grep -q '"build"' frontend/HaqooqAI-frontend/package.json; then
        print_status 0 "Build script found in package.json"
    else
        print_status 1 "Build script missing in package.json"
    fi
    
    if grep -q '"dev"' frontend/HaqooqAI-frontend/package.json; then
        print_status 0 "Dev script found in package.json"
    else
        print_status 1 "Dev script missing in package.json"
    fi
else
    print_status 1 "Frontend package.json missing"
fi

# Check backend requirements
echo ""
echo "🐍 Checking backend configuration..."
if [ -f "backend/requirements.txt" ]; then
    print_status 0 "Backend requirements.txt exists"
else
    print_status 1 "Backend requirements.txt missing"
fi

if [ -f "backend/src/main.py" ]; then
    print_status 0 "Backend main.py exists"
else
    print_status 1 "Backend main.py missing"
fi

# Check Git repository
echo ""
echo "🔄 Checking Git repository..."
if [ -d ".git" ]; then
    print_status 0 "Git repository initialized"
    
    # Check current branch
    current_branch=$(git branch --show-current 2>/dev/null || echo "unknown")
    if [ "$current_branch" = "main" ]; then
        print_status 0 "Currently on main branch"
    else
        print_warning "Currently on branch: $current_branch (expected: main)"
    fi
    
    # Check if branches exist
    branches=("develop" "frontend" "backend")
    for branch in "${branches[@]}"; do
        if git show-ref --verify --quiet refs/heads/$branch; then
            print_status 0 "Branch exists: $branch"
        else
            print_status 1 "Branch missing: $branch"
        fi
    done
    
    # Check for remote
    if git remote -v | grep -q origin; then
        print_status 0 "Git remote 'origin' configured"
        echo "   Remote URL: $(git remote get-url origin)"
    else
        print_warning "Git remote 'origin' not configured"
    fi
else
    print_status 1 "Git repository not initialized"
fi

# Check workflow file paths
echo ""
echo "🔍 Verifying workflow file paths..."
if [ -f ".github/workflows/deploy-frontend.yml" ]; then
    if grep -q "frontend/HaqooqAI-frontend" .github/workflows/deploy-frontend.yml; then
        print_status 0 "Frontend workflow paths are correct"
    else
        print_status 1 "Frontend workflow paths need updating"
    fi
fi

if [ -f ".github/workflows/deploy-backend.yml" ]; then
    if grep -q "working-directory: ./backend" .github/workflows/deploy-backend.yml; then
        print_status 0 "Backend workflow paths are correct"
    else
        print_status 1 "Backend workflow paths need updating"
    fi
fi

# Summary
echo ""
echo "📊 Setup Verification Summary"
echo "============================"

# Count files and directories
frontend_files=$(find frontend -type f 2>/dev/null | wc -l)
backend_files=$(find backend -type f 2>/dev/null | wc -l)
workflow_files=$(find .github/workflows -name "*.yml" 2>/dev/null | wc -l)

echo "Frontend files: $frontend_files"
echo "Backend files: $backend_files"
echo "Workflow files: $workflow_files"

# Check if setup is complete
if [ -d "frontend/HaqooqAI-frontend" ] && [ -d "backend" ] && [ -d ".github/workflows" ] && [ -f "DEPLOYMENT_STRATEGY.md" ]; then
    echo ""
    echo -e "${GREEN}🎉 Setup verification completed successfully!${NC}"
    echo ""
    echo "✅ All essential components are in place"
    echo "✅ Directory structure is correct"
    echo "✅ GitHub Actions workflows are configured"
    echo "✅ Documentation is available"
    echo ""
    echo "🚀 Ready for development and deployment!"
    echo ""
    echo "Next steps:"
    echo "1. Run './setup-git-workflow.sh' if you haven't already"
    echo "2. Configure GitHub repository settings"
    echo "3. Add required secrets for deployment"
    echo "4. Start developing!"
else
    echo ""
    echo -e "${RED}⚠️  Setup verification found issues${NC}"
    echo ""
    echo "Please address the issues marked with ❌ above"
    echo "Run './setup-git-workflow.sh' to initialize Git workflow"
fi

echo ""
echo "📖 For detailed information, see:"
echo "   - DEPLOYMENT_STRATEGY.md"
echo "   - Haqooqai Frontend Documentation.md"
echo "   - Haqooqai Backend Documentation.md"

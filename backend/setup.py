"""
Setup script for HaqooqAI Backend
Initializes the backend environment and dependencies
"""
import os
import sys
import subprocess
from pathlib import Path


def run_command(command, description):
    """Run a shell command and handle errors"""
    print(f"🔄 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed: {e.stderr}")
        return False


def check_python_version():
    """Check if Python version is compatible"""
    if sys.version_info < (3, 9):
        print("❌ Python 3.9 or higher is required")
        return False
    print(f"✅ Python {sys.version_info.major}.{sys.version_info.minor} detected")
    return True


def setup_virtual_environment():
    """Create and activate virtual environment"""
    venv_path = Path("venv")
    
    if venv_path.exists():
        print("✅ Virtual environment already exists")
        return True
    
    return run_command("python -m venv venv", "Creating virtual environment")


def install_dependencies():
    """Install Python dependencies"""
    # Determine the correct pip command based on OS
    if os.name == 'nt':  # Windows
        pip_cmd = "venv\\Scripts\\pip"
    else:  # Unix/Linux/macOS
        pip_cmd = "venv/bin/pip"
    
    commands = [
        f"{pip_cmd} install --upgrade pip",
        f"{pip_cmd} install -r requirements.txt"
    ]
    
    for cmd in commands:
        if not run_command(cmd, f"Running: {cmd}"):
            return False
    
    return True


def setup_environment_file():
    """Create .env file from template if it doesn't exist"""
    env_file = Path(".env")
    env_example = Path(".env.example")
    
    if env_file.exists():
        print("✅ .env file already exists")
        return True
    
    if env_example.exists():
        try:
            env_file.write_text(env_example.read_text())
            print("✅ Created .env file from template")
            print("⚠️  Please edit .env file with your actual configuration values")
            return True
        except Exception as e:
            print(f"❌ Failed to create .env file: {e}")
            return False
    else:
        print("❌ .env.example template not found")
        return False


def setup_data_directories():
    """Ensure data directories exist"""
    directories = [
        "data",
        "data/chroma_db"
    ]
    
    for directory in directories:
        Path(directory).mkdir(parents=True, exist_ok=True)
    
    print("✅ Data directories created")
    return True


def run_health_check():
    """Run a basic health check"""
    if os.name == 'nt':  # Windows
        python_cmd = "venv\\Scripts\\python"
    else:  # Unix/Linux/macOS
        python_cmd = "venv/bin/python"
    
    health_check_script = """
import sys
sys.path.append('src')

try:
    from src.config import API_TITLE, API_VERSION
    print(f"✅ Configuration loaded: {API_TITLE} v{API_VERSION}")
    
    from src.auth.github_auth import GitHubAuthService
    print("✅ GitHub auth service imported successfully")
    
    from src.quota.usage_tracker import UsageTracker
    print("✅ Usage tracker imported successfully")
    
    from src.ai.rag_engine import LegalRAGEngine
    print("✅ RAG engine imported successfully")
    
    print("✅ All core components loaded successfully")
    
except Exception as e:
    print(f"❌ Health check failed: {e}")
    sys.exit(1)
"""
    
    with open("health_check.py", "w") as f:
        f.write(health_check_script)
    
    success = run_command(f"{python_cmd} health_check.py", "Running health check")
    
    # Clean up
    try:
        os.remove("health_check.py")
    except:
        pass
    
    return success


def main():
    """Main setup function"""
    print("🚀 Setting up HaqooqAI Backend...")
    print("=" * 50)
    
    # Check Python version
    if not check_python_version():
        return False
    
    # Setup virtual environment
    if not setup_virtual_environment():
        return False
    
    # Install dependencies
    if not install_dependencies():
        return False
    
    # Setup environment file
    if not setup_environment_file():
        return False
    
    # Setup data directories
    if not setup_data_directories():
        return False
    
    # Run health check
    if not run_health_check():
        return False
    
    print("\n" + "=" * 50)
    print("🎉 HaqooqAI Backend setup completed successfully!")
    print("\n📋 Next steps:")
    print("1. Edit .env file with your configuration values")
    print("2. Add legal document CSV files to data/ directory")
    print("3. Run the application:")
    
    if os.name == 'nt':  # Windows
        print("   venv\\Scripts\\python -m uvicorn src.main:app --reload")
    else:  # Unix/Linux/macOS
        print("   source venv/bin/activate")
        print("   python -m uvicorn src.main:app --reload")
    
    print("\n📚 Documentation: Check README.md for detailed instructions")
    print("🔗 API Docs: http://localhost:8000/docs (after starting the server)")
    
    return True


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)

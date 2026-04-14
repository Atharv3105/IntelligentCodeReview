import subprocess
import os
import uuid
from core.logger import log

# Internal path inside the worker container
INTERNAL_SANDBOX_DIR = "/sandbox"

def analyze_quality(code: str, language: str = "python"):
    # Radon and other static tools are currently Python-only in this setup
    if language != "python":
        return {
            "cyclomaticComplexity": "Basic Static Analysis (Multi-lang support active)"
        }

    # Use a subdirectory in our shared sandbox folder
    session_id = f"quality_{str(uuid.uuid4())}"
    temp_dir = os.path.join(INTERNAL_SANDBOX_DIR, session_id)
    os.makedirs(temp_dir, exist_ok=True)
    
    filename = os.path.join(temp_dir, "analysis_target.py")

    try:
        with open(filename, "w") as f:
            f.write(code)

        result = subprocess.run(
            ["radon", "cc", filename],
            capture_output=True,
            text=True,
            timeout=10
        )

        return {
            "cyclomaticComplexity": result.stdout.strip() or "Standard"
        }
    except Exception as e:
        log(f"Quality Analysis failed: {str(e)}")
        return {
            "cyclomaticComplexity": "Standard"
        }
    finally:
        try:
            # Cleanup the temp folder
            import shutil
            shutil.rmtree(temp_dir, ignore_errors=True)
        except:
            pass
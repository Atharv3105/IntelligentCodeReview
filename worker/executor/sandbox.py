import docker
import os
import shutil
import uuid
from core.config import EXEC_TIMEOUT
from core.logger import log

client = docker.from_env()

# Internal path inside the worker container
INTERNAL_SANDBOX_DIR = "/sandbox"
# Host path as seen by Docker Desktop (Windows)
HOST_SANDBOX_WORKDIR = os.getenv("HOST_SANDBOX_WORKDIR")

LANGUAGE_CONFIG = {
    "python": {
        "image": "secure-python-sandbox",
        "filename": "solution.py",
        "command": "python solution.py"
    },
    "javascript": {
        "image": "secure-js-sandbox",
        "filename": "solution.js",
        "command": "node solution.js"
    },
    "java": {
        "image": "secure-java-sandbox",
        "filename": "Solution.java",
        "command": "javac Solution.java && java Solution"
    },
    "cpp": {
        "image": "secure-cpp-sandbox",
        "filename": "solution.cpp",
        "command": "g++ -o solution solution.cpp && ./solution"
    }
}

def execute_code(code: str, language: str = "python"):
    config = LANGUAGE_CONFIG.get(language, LANGUAGE_CONFIG["python"])
    
    session_id = str(uuid.uuid4())
    
    # We use our shared workspace folder instead of system /tmp
    # This allows the host docker engine to see the files
    temp_dir = os.path.join(INTERNAL_SANDBOX_DIR, session_id)
    os.makedirs(temp_dir, exist_ok=True)

    file_path = os.path.join(temp_dir, config["filename"])

    try:
        with open(file_path, "w") as f:
            f.write(code)

        # Important: When mounting, the SOURCE path must be the HOST path
        # because the Docker API talks to the host engine.
        host_source_path = f"{HOST_SANDBOX_WORKDIR}/{session_id}" if HOST_SANDBOX_WORKDIR else temp_dir

        container = client.containers.run(
            config["image"],
            command=config["command"],
            volumes={host_source_path: {"bind": "/sandbox", "mode": "ro"}},
            working_dir="/sandbox",
            network_disabled=True,
            mem_limit="128m",
            nano_cpus=500000000,
            read_only=True,
            detach=True
        )

        try:
            # Wait for container and check for timeout
            status = container.wait(timeout=EXEC_TIMEOUT)
            logs = container.logs().decode()
            
            # If wait returns but container exited with non-zero, it might be a compilation/run error
            # For now we just return logs
            return {"output": logs, "error": ""}
            
        except Exception as e:
            try:
                container.kill()
            except:
                pass
            return {"output": "", "error": f"Execution timeout or crash: {str(e)}"}
        finally:
            try:
                container.remove(force=True)
            except:
                pass

    except Exception as e:
        log(f"Sandbox Error: {str(e)}")
        return {"output": "", "error": f"Internal Sandbox Error: {str(e)}"}

    finally:
        # Cleanup the session directory
        try:
            shutil.rmtree(temp_dir, ignore_errors=True)
        except:
            pass
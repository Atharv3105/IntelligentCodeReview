import docker
import tempfile
import os
import shutil
import uuid
from core.config import EXEC_TIMEOUT
from core.logger import log

client = docker.from_env()

def execute_code(code: str):

    session_id = str(uuid.uuid4())
    temp_dir = os.path.join("/tmp", session_id)
    os.makedirs(temp_dir, exist_ok=True)

    file_path = os.path.join(temp_dir, "solution.py")

    with open(file_path, "w") as f:
        f.write(code)

    try:
        container = client.containers.run(
            "secure-python-sandbox",
            command="python solution.py",
            volumes={temp_dir: {"bind": "/sandbox", "mode": "ro"}},
            working_dir="/sandbox",
            network_disabled=True,
            mem_limit="128m",
            nano_cpus=500000000,
            read_only=True,
            detach=True
        )

        try:
            container.wait(timeout=EXEC_TIMEOUT)
        except Exception:
            container.kill()
            return {"output": "", "error": "Execution timeout"}

        logs = container.logs().decode()
        container.remove(force=True)

        return {"output": logs, "error": ""}

    except Exception as e:
        return {"output": "", "error": str(e)}

    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)
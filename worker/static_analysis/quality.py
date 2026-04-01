import subprocess
import tempfile
import os

def analyze_quality(code: str):
    with tempfile.NamedTemporaryFile(delete=False, suffix=".py") as f:
        f.write(code.encode())
        filename = f.name

    result = subprocess.run(
        ["radon", "cc", filename],
        capture_output=True,
        text=True
    )

    os.remove(filename)

    return {
        "cyclomaticComplexity": result.stdout.strip()
    }
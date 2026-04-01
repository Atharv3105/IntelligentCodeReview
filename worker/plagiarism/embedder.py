import ast
import numpy as np
from core.config import EMBEDDING_DIM

def normalize_ast(code: str):
    tree = ast.parse(code)

    for node in ast.walk(tree):
        if isinstance(node, ast.Name):
            node.id = "var"

    return ast.dump(tree)

def embed_code(code: str):
    normalized = normalize_ast(code)
    np.random.seed(len(normalized))
    return np.random.rand(EMBEDDING_DIM).astype("float32")
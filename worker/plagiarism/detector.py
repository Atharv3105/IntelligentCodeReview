import faiss
import os
from core.config import FAISS_INDEX_PATH, EMBEDDING_DIM
from plagiarism.embedder import embed_code

if os.path.exists(FAISS_INDEX_PATH):
    index = faiss.read_index(FAISS_INDEX_PATH)
else:
    index = faiss.IndexFlatL2(EMBEDDING_DIM)

def check_plagiarism(code: str):

    vector = embed_code(code).reshape(1, -1)

    if index.ntotal > 0:
        D, I = index.search(vector, 1)
        score = float(D[0][0])
    else:
        score = 0.0

    index.add(vector)
    faiss.write_index(index, FAISS_INDEX_PATH)

    return score
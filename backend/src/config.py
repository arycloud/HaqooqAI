import os

# --- Project Paths ---
# Assuming this file is in src/ and data/ is in the parent directory
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), os.pardir))
DATA_DIR = os.path.join(PROJECT_ROOT, "data")

# Data file paths
RAW_DATA_PATH = os.path.join(DATA_DIR, "pakistan_laws_raw.csv")
SECTIONED_DATA_PATH = os.path.join(DATA_DIR, "pakistan_laws_sectioned.csv")  # Not explicitly saved, but good to have
SEMANTIC_SECTIONS_PATH = os.path.join(DATA_DIR, "pakistan_laws_semantic_sections.csv")
PROCESSED_CHUNKS_PATH = os.path.join(DATA_DIR, "pakistan_laws_chunks.csv")
EMBEDDED_CHUNKS_PATH = os.path.join(DATA_DIR, "pakistan_laws_chunks_with_embeddings.csv")

# ChromaDB path
VECTOR_DB_DIR = os.path.join(DATA_DIR, "chroma_db")
COLLECTION_NAME = "pakistan_laws_chunks_collection"

# --- Model Configuration ---
EMBEDDING_MODEL_NAME = "BAAI/bge-large-en-v1.5"
LLM_MODEL_NAME = "qwen3:1.7b"  # Or "qwen2:7b-instruct" if you download it later

# --- Chunking Parameters ---
CHUNK_SIZE = 1500
CHUNK_OVERLAP = 150

# Ensure data directories exist
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(VECTOR_DB_DIR, exist_ok=True)

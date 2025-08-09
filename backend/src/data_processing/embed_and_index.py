import pandas as pd
import chromadb
from chromadb.utils import embedding_functions
from sentence_transformers import SentenceTransformer
from tqdm import tqdm
import torch
import os
import json

# Import constants from config.py
from src.config import EMBEDDED_CHUNKS_PATH, VECTOR_DB_DIR, COLLECTION_NAME, EMBEDDING_MODEL_NAME, PROCESSED_CHUNKS_PATH

# Ensure tqdm works with pandas
tqdm.pandas()


def generate_embeddings_and_index(input_chunks_path: str):
    print(f"Starting embedding generation and indexing for {input_chunks_path}...")

    # Load the processed chunks
    try:
        chunks_df = pd.read_csv(input_chunks_path)
        print(f"Successfully loaded {len(chunks_df)} chunks from {input_chunks_path}")
    except FileNotFoundError:
        print(f"Error: {input_chunks_path} not found. Please run preprocess.py first.")
        return
    except Exception as e:
        print(f"An error occurred while loading the CSV: {e}")
        return

    # Load the embedding model
    model = SentenceTransformer("BAAI/bge-large-en-v1.5")
    try:
        model = SentenceTransformer(EMBEDDING_MODEL_NAME, device='cuda' if torch.cuda.is_available() else 'cpu')
        print(f"Embedding model '{EMBEDDING_MODEL_NAME}' loaded successfully on {model.device}.")
    except Exception as e:
        print(f"Error loading embedding model: {e}")
        print("Please ensure you have an active internet connection to download the model.")
        print("If using a GPU, ensure CUDA is properly installed and PyTorch is configured for it.")
        print("Attempting to load a smaller fallback model: all-MiniLM-L6-v2")
        EMBEDDING_MODEL_NAME_FALLBACK = "sentence-transformers/all-MiniLM-L6-v2"
        try:
            model = SentenceTransformer(EMBEDDING_MODEL_NAME_FALLBACK,
                                        device='cuda' if torch.cuda.is_available() else 'cpu')
            print(f"Loaded fallback model: {EMBEDDING_MODEL_NAME_FALLBACK}")
        except Exception as e_fallback:
            print(f"Failed to load fallback model: {e_fallback}. Cannot proceed with embeddings.")
            return

    # Generate embeddings
    print(f"Generating embeddings for {len(chunks_df)} chunks...")
    chunks_df['embedding'] = chunks_df['chunk_content'].progress_apply(lambda x: model.encode(x).tolist())
    print("Embeddings generated successfully!")

    # Save chunks with embeddings (optional, but good for debugging/reloading)
    chunks_df.to_csv(EMBEDDED_CHUNKS_PATH, index=False)
    print(f"Chunks with embeddings saved to {EMBEDDED_CHUNKS_PATH}")

    # Initialize ChromaDB client
    print(f"Initializing ChromaDB client at: {VECTOR_DB_DIR}")
    client = chromadb.PersistentClient(path=VECTOR_DB_DIR)

    # Create or Get a Collection
    try:
        # Use the same embedding function that was used to generate embeddings
        embedding_function_for_chroma = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name=EMBEDDING_MODEL_NAME,  # Use original model name for consistency
            device=model.device  # Use the device the model loaded on
        )
        collection = client.get_or_create_collection(
            name=COLLECTION_NAME,
            embedding_function=embedding_function_for_chroma
        )
        print(f"ChromaDB collection '{COLLECTION_NAME}' accessed/created.")
        print(f"Current count in collection: {collection.count()} chunks before adding.")
    except Exception as e:
        print(f"Error accessing/creating ChromaDB collection: {e}")
        print("Please ensure ChromaDB is correctly installed and accessible.")
        return

    # Prepare Data for ChromaDB
    ids = [f"chunk_{i}" for i in range(len(chunks_df))]
    documents = chunks_df['chunk_content'].tolist()
    metadatas = chunks_df[['source_file', 'section_title', 'chunk_length', 'start_index_in_section']].to_dict(
        orient='records')
    embeddings = chunks_df['embedding'].tolist()

    # Add Embeddings to the Collection in batches
    if collection.count() == len(ids):
        print("All chunks already appear to be in the collection. Skipping add operation.")
    else:
        print(f"Adding {len(ids)} chunks to the ChromaDB collection. This might take a moment...")
        BATCH_SIZE = 500
        for i in tqdm(range(0, len(ids), BATCH_SIZE), desc="Adding chunks to ChromaDB"):
            batch_ids = ids[i:i + BATCH_SIZE]
            batch_documents = documents[i:i + BATCH_SIZE]
            batch_metadatas = metadatas[i:i + BATCH_SIZE]
            batch_embeddings = embeddings[i:i + BATCH_SIZE]

            collection.add(
                ids=batch_ids,
                documents=batch_documents,
                metadatas=batch_metadatas,
                embeddings=batch_embeddings
            )
        print("All chunks successfully added to ChromaDB!")

    print(f"Final count in ChromaDB collection '{COLLECTION_NAME}': {collection.count()} chunks.")
    print("Embedding generation and indexing complete.")


if __name__ == "__main__":
    # This part will run only when embed_and_index.py is executed directly
    # Ensure 'pakistan_laws_chunks.csv' is generated by preprocess.py
    print("Running embedding generation and indexing script...")
    generate_embeddings_and_index(PROCESSED_CHUNKS_PATH)

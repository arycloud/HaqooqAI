import chromadb
from chromadb.utils import embedding_functions
from sentence_transformers import SentenceTransformer
from langchain.tools import Tool
from langchain_community.tools import DuckDuckGoSearchRun
import torch
import os

# Import constants from config.py
# from src.config import VECTOR_DB_DIR, COLLECTION_NAME, EMBEDDING_MODEL_NAME
# from config import VECTOR_DB_DIR, COLLECTION_NAME, EMBEDDING_MODEL_NAME
from src.config import VECTOR_DB_DIR, COLLECTION_NAME, EMBEDDING_MODEL_NAME
# --- Initialize ChromaDB Client and Connect to Collection ---
# This will be done once when the tools are loaded
client = chromadb.PersistentClient(path=VECTOR_DB_DIR)
embedding_function_for_chroma = embedding_functions.SentenceTransformerEmbeddingFunction(
    model_name=EMBEDDING_MODEL_NAME,
    device='cuda' if torch.cuda.is_available() else 'cpu'
)
collection = client.get_or_create_collection(  # Use get_or_create_collection for robustness
    name=COLLECTION_NAME,
    embedding_function=embedding_function_for_chroma
)
print(f"ChromaDB collection '{COLLECTION_NAME}' connected for tool use.")

# --- Load the Embedding Model for Query Encoding ---
# This must be the SAME model used to embed your chunks
query_embedding_model = None
try:
    query_embedding_model = SentenceTransformer(EMBEDDING_MODEL_NAME,
                                                device='cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Query embedding model '{EMBEDDING_MODEL_NAME}' loaded for tool use.")
except Exception as e:
    print(f"Error loading query embedding model for tools: {e}")
    print("Fallback to CPU or ensure model is downloaded. Agent might not function correctly.")
    # Fallback to CPU if GPU fails, or handle as needed
    query_embedding_model = SentenceTransformer(EMBEDDING_MODEL_NAME, device='cpu')


# --- Define the Retriever Function ---
def retrieve_relevant_chunks(query_text: str, n_results: int = 5) -> list:
    if query_embedding_model is None:
        print("Query embedding model not loaded. Cannot retrieve chunks.")
        return []

    query_embedding = query_embedding_model.encode(query_text).tolist()

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=n_results,
        include=['documents', 'metadatas', 'distances']
    )

    retrieved_chunks_info = []
    if results and results['documents']:
        for i in range(len(results['documents'][0])):
            chunk_content = results['documents'][0][i]
            metadata = results['metadatas'][0][i]
            distance = results['distances'][0][i]

            retrieved_chunks_info.append({
                "chunk_content": chunk_content,
                "source_file": metadata.get('source_file'),
                "section_title": metadata.get('section_title'),
                "distance": distance
            })
    return retrieved_chunks_info


# --- Define the Local Legal Document Search Tool ---
def _legal_document_search_func(query: str) -> str:
    """Searches the local legal documents for relevant information.
    Input should be a clear, standalone question or keyword phrase relevant to the local documents."""
    print(f"\n--- Using legal_document_search tool for query: '{query}' ---")
    chunks = retrieve_relevant_chunks(query, n_results=5)
    if not chunks:
        return "No relevant information found in local legal documents."
    formatted_context = "\n\n".join(chunk["chunk_content"] for chunk in chunks)
    return formatted_context


legal_document_search = Tool(
    name="legal_document_search",
    func=_legal_document_search_func,
    description="Searches the local legal documents for relevant information. Use this tool when the question is about specific Pakistani laws, ordinances, or legal documents that might be in the local knowledge base. Input should be a clear, standalone question or keyword phrase relevant to the local documents."
)

# --- Define the Web Search Tool ---
web_search_tool = DuckDuckGoSearchRun(
    name="web_search",
    description="Useful for general knowledge questions or when information is not found in local legal documents. Input should be a concise search query."
)

# Collect all tools in a list
tools = [legal_document_search, web_search_tool]

print("Agent tools initialized.")

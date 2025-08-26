"""
Enhanced search tools for HaqooqAI Backend
Adapted from existing tools.py with improved integration
"""
import chromadb
from chromadb.utils import embedding_functions
from sentence_transformers import SentenceTransformer
from langchain.tools import Tool
import torch
import re
import logging

from ..config import VECTOR_DB_DIR, COLLECTION_NAME, EMBEDDING_MODEL_NAME
from .searxng_client import searxng_client

logger = logging.getLogger(__name__)

# --- Initialize ChromaDB Client and Connect to Collection ---
try:
    client = chromadb.PersistentClient(path=VECTOR_DB_DIR)

    # Try to get existing collection first
    try:
        collection = client.get_collection(name=COLLECTION_NAME)
        logger.info(f"ChromaDB collection '{COLLECTION_NAME}' loaded (existing).")
    except Exception:
        # If collection doesn't exist, create it with the embedding function
        embedding_function_for_chroma = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name=EMBEDDING_MODEL_NAME,
            device='cuda' if torch.cuda.is_available() else 'cpu'
        )
        collection = client.create_collection(
            name=COLLECTION_NAME,
            embedding_function=embedding_function_for_chroma
        )
        logger.info(f"ChromaDB collection '{COLLECTION_NAME}' created with embedding function.")

except Exception as e:
    logger.error(f"Error initializing ChromaDB: {e}")
    client = None
    collection = None

# --- Load the Embedding Model for Query Encoding ---
query_embedding_model = None
try:
    query_embedding_model = SentenceTransformer(
        EMBEDDING_MODEL_NAME,
        device='cuda' if torch.cuda.is_available() else 'cpu'
    )
    logger.info(f"Query embedding model '{EMBEDDING_MODEL_NAME}' loaded for tool use.")
except Exception as e:
    logger.error(f"Error loading query embedding model for tools: {e}")
    try:
        query_embedding_model = SentenceTransformer(EMBEDDING_MODEL_NAME, device='cpu')
    except Exception as e2:
        logger.error(f"Failed to load embedding model on CPU: {e2}")
        query_embedding_model = None


class QueryProcessor:
    """Enhanced query processing for better search results."""

    @staticmethod
    def clean_query(query: str) -> str:
        """Clean and normalize the query."""
        # Remove extra whitespace
        query = re.sub(r'\s+', ' ', query.strip())

        # Remove common stop words that might confuse search
        stop_words = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']
        words = query.split()
        if len(words) > 3:  # Only remove stop words if query is long enough
            words = [word for word in words if word.lower() not in stop_words]
            query = ' '.join(words)

        return query

    @staticmethod
    def is_time_sensitive(query: str) -> bool:
        """Determine if query requires current/recent information."""
        time_indicators = [
            'recent', 'latest', 'current', 'new', 'update', 'today', 'now',
            '2024', '2023', 'this year', 'last year', 'currently'
        ]
        return any(indicator in query.lower() for indicator in time_indicators)

    @staticmethod
    def is_pakistan_related(query: str) -> bool:
        """Check if query is related to Pakistan."""
        pakistan_terms = [
            'pakistan', 'pakistani', 'lahore', 'karachi', 'islamabad',
            'sindh', 'punjab', 'balochistan', 'kpk', 'khyber pakhtunkhwa'
        ]
        return any(term in query.lower() for term in pakistan_terms)

    @staticmethod
    def enhance_search_query(query: str) -> str:
        """Enhance query for better web search results."""
        enhanced_query = QueryProcessor.clean_query(query)

        # Add Pakistan context if it's a legal query but doesn't mention Pakistan
        legal_terms = ['constitution', 'amendment', 'law', 'act', 'ordinance', 'legal', 'court']
        if (any(term in enhanced_query.lower() for term in legal_terms) and
            not QueryProcessor.is_pakistan_related(enhanced_query)):
            enhanced_query = f"Pakistan {enhanced_query}"

        # Add site-specific searches for better results
        if 'constitution' in enhanced_query.lower() and 'amendment' in enhanced_query.lower():
            enhanced_query = f"{enhanced_query} site:na.gov.pk OR site:pakistan.gov.pk"

        return enhanced_query


# --- Define the Retriever Function ---
def retrieve_relevant_chunks(query_text: str, n_results: int = 3) -> list:
    """Retrieve relevant chunks from ChromaDB"""
    if not query_embedding_model or not collection:
        logger.error("Query embedding model or collection not loaded. Cannot retrieve chunks.")
        return []

    try:
        # Clean the query before embedding
        cleaned_query = QueryProcessor.clean_query(query_text)
        query_embedding = query_embedding_model.encode(cleaned_query).tolist()

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

    except Exception as e:
        logger.error(f"Error retrieving chunks: {e}")
        return []


# --- Define the Local Legal Document Search Tool ---
def _legal_document_search_func(query: str) -> str:
    """Enhanced local legal document search with better query processing."""
    logger.info(f"Using legal_document_search tool for query: '{query}'")

    # Process the query for better matching
    processed_query = QueryProcessor.clean_query(query)

    chunks = retrieve_relevant_chunks(processed_query, n_results=5)  # Get more results initially

    if not chunks:
        return "No relevant information found in local legal documents."

    # Filter chunks by relevance threshold
    relevant_chunks = [chunk for chunk in chunks if chunk["distance"] < 0.7]  # Adjust threshold as needed

    if not relevant_chunks:
        return "No highly relevant information found in local legal documents."

    # Format the response with source information
    formatted_context = []
    for i, chunk in enumerate(relevant_chunks[:3], 1):  # Limit to top 3
        source_info = f"[Source: {chunk.get('source_file', 'Unknown')}]"
        if chunk.get('section_title'):
            source_info += f" - Section: {chunk['section_title']}"

        formatted_context.append(f"Result {i}: {source_info}\n{chunk['chunk_content']}")

    return "\n\n---\n\n".join(formatted_context)


async def _searxng_web_search_func(query: str) -> str:
    """
    Enhanced SearxNG web search with intelligent query processing.
    """
    logger.info(f"Using SearxNG web search tool for query: '{query}'")

    # Process and enhance the query
    enhanced_query = QueryProcessor.enhance_search_query(query)
    logger.info(f"Enhanced query: '{enhanced_query}'")

    # Log health status
    health_status = await searxng_client.get_health_status()
    logger.info(f"SearxNG Status: {health_status['healthy']}/{health_status['total_instances']} instances healthy")

    # Perform the search
    result = await searxng_client.search(enhanced_query)

    # Post-process results for relevance
    if "No search results found" in result or not _is_result_relevant_to_query(result, query):
        logger.info("First search attempt yielded poor results, trying alternative approach...")

        # Try with a simpler, more direct query
        simple_query = QueryProcessor.clean_query(query)
        if simple_query != enhanced_query:
            result = await searxng_client.search(simple_query)

    return result


def _is_result_relevant_to_query(result: str, original_query: str) -> bool:
    """Check if search results contain relevant information."""
    if not result or "No search results found" in result:
        return False

    result_lower = result.lower()
    query_lower = original_query.lower()

    # Extract key terms from the query
    query_terms = set(re.findall(r'\b\w+\b', query_lower))
    query_terms.discard('')  # Remove empty strings

    # Check if at least some key terms appear in results
    matching_terms = sum(1 for term in query_terms if term in result_lower)
    relevance_ratio = matching_terms / len(query_terms) if query_terms else 0

    # Results are relevant if at least 30% of query terms appear
    return relevance_ratio >= 0.3


# --- Enhanced Tool Definitions ---
legal_document_search = Tool(
    name="legal_document_search",
    func=_legal_document_search_func,
    description=(
        "Searches the local legal documents for relevant information about Pakistani law. "
        "This tool is most effective for questions about specific Pakistani laws, ordinances, "
        "constitutional provisions, or legal documents that might be in the local knowledge base. "
        "Input should be a clear, standalone question or keyword phrase. "
        "Examples: 'Privatisation Commission powers', 'constitutional amendments procedure', 'Supreme Court jurisdiction'"
    )
)

web_search_tool = Tool(
    name="web_search",
    func=_searxng_web_search_func,
    description=(
        "Search the web using production-grade SearxNG instances with intelligent query processing and health monitoring. "
        "Use for: general knowledge questions, current events, recent Pakistani legal developments, government updates, "
        "or when information is not found in local legal documents. "
        "The tool automatically enhances queries for better results and includes Pakistan context when relevant. "
        "Input should be a clear, concise search query. "
        "Examples: 'recent constitutional amendments 2024', 'current Chief Justice Pakistan', 'latest Supreme Court decisions'"
    )
)

# Collect all tools in a list
tools = [legal_document_search, web_search_tool]

logger.info("Enhanced agent tools initialized with improved query processing.")

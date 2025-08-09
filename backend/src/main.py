import os
import sys

# Add src directory to Python path to allow absolute imports from src
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), os.pardir)))

from src.data_processing.preprocess import run_preprocessing
from src.data_processing.embed_and_index import generate_embeddings_and_index
from src.agent.agent import initialize_agent_executor
from src.config import RAW_DATA_PATH, PROCESSED_CHUNKS_PATH, EMBEDDED_CHUNKS_PATH


def run_full_pipeline():
    print("--- Starting Full Project Pipeline ---")

    # Step 1: Data Preprocessing
    print("\nPhase 1: Running Data Preprocessing...")
    run_preprocessing(RAW_DATA_PATH)

    # Step 2: Embedding Generation and Indexing
    print("\nPhase 2: Running Embedding Generation and Indexing...")
    # Ensure the ChromaDB directory exists and is writable
    generate_embeddings_and_index(PROCESSED_CHUNKS_PATH)

    # Step 3: Initialize and Test Agent
    print("\nPhase 3: Initializing and Testing LLM Agent...")
    agent_executor = initialize_agent_executor()

    if agent_executor:
        print("\n--- Agent Ready for Interaction ---")
        while True:
            user_question = input("\nEnter your legal question (or 'exit' to quit): ")
            if user_question.lower() == 'exit':
                break

            print(f"\nAgent processing question: '{user_question}'")
            try:
                response = agent_executor.invoke({"question": user_question})
                print("\nAgent's Answer:")
                print(response["output"])
            except Exception as e:
                print(f"\nAn error occurred during agent execution: {e}")
                print("Please check the logs above for more details.")
    else:
        print("\nAgent could not be initialized. Please check previous error messages.")

    print("\n--- Full Project Pipeline Finished ---")


if __name__ == "__main__":
    run_full_pipeline()

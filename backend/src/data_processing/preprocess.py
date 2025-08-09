import pandas as pd
import re
import os
from tqdm import tqdm
from langchain.text_splitter import RecursiveCharacterTextSplitter

from src.config import RAW_DATA_PATH, SEMANTIC_SECTIONS_PATH, PROCESSED_CHUNKS_PATH, CHUNK_SIZE, CHUNK_OVERLAP

# Ensure tqdm works with pandas
tqdm.pandas()


def clean_text(text: str) -> str:
    """
    Performs detailed cleaning on legal text.
    - Normalizes whitespace.
    - Removes common page headers/footers (e.g., "Page X of Y", "Updated till date").
    - Removes typical "CONTENTS" sections at the start of documents.
    - Can be extended for more specific legal document noise.
    """

    if not isinstance(text, str):
        return ""
    text = text.replace("\xa0", " ").replace("­", "")  # remove non-breaking spaces and soft hyphens

    # Remove common page artifacts
    text = re.sub(r"(?i)Page \d+ of \d+", " ", text)
    text = re.sub(r"(?i)Updated till \d{1,2}\.\d{1,2}\.\d{4}", " ", text)

    # Remove 'CONTENTS' section (basic version)
    text = re.sub(r'(?i)\bCONTENTS\b.*?(?=(PART|CHAPTER|\d+\.?\s+[A-Z]))', '', text, flags=re.DOTALL)

    # Collapse multiple whitespaces and newlines
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def extract_semantic_sections(text: str, file_name: str) -> list[dict]:
    """
    Extracts semantic sections (Parts, Chapters, numbered Sections/Articles) from legal text.
    It attempts to capture the section heading and the content belonging to it.
    """
    sections_list = []
    section_header_pattern = re.compile(
        r"^(PART\s+[IVXLCDM]+\.?—?.*?$|"  # Matches PART headings
        r"^CHAPTER\s+[IVXLCDM]+\.?—?.*?$|"  # Matches CHAPTER headings
        r"^\d+\.\s+[A-Z].*?$) ",  # Matches numbered sections/articles (e.g., "1. Short title...")
        re.MULTILINE | re.IGNORECASE
    )
    split_content = section_header_pattern.split(text)
    preamble_content = split_content[0].strip()
    if preamble_content:
        sections_list.append({
            "source_file": file_name,
            "section_title": "Preamble/Introduction",
            "section_content": preamble_content,
            "section_type": "semantic_preamble"
        })

    for i in range(1, len(split_content), 2):
        header = split_content[i]
        content = split_content[i + 1] if (i + 1) < len(split_content) else ""  # Handle last section

        if header and content.strip():
            sections_list.append({
                "source_file": file_name,
                "section_title": header.strip(),
                "section_content": content.strip(),
                "section_type": "semantic_section"
            })
        elif header:
            sections_list.append({
                "source_file": file_name,
                "section_title": header.strip(),
                "section_content": "",
                "section_type": "semantic_section_header_only"
            })

    return sections_list


def run_preprocessing(input_csv_path: str):
    print(f"Starting data preprocessing from {input_csv_path}...")

    # Load raw data
    laws_df = pd.read_csv(input_csv_path)
    print(f"Loaded {len(laws_df)} raw documents.")

    # Apply cleaning
    if not laws_df.empty:
        laws_df['Cleaned_Content'] = laws_df['Content'].progress_apply(clean_text)
        print("Text cleaning complete.")

    # Extract semantic sections
    all_semantic_sections = []
    if not laws_df.empty:
        for index, row in tqdm(laws_df.iterrows(), total=len(laws_df), desc="Extracting semantic sections"):
            file_name = row['File Name']
            cleaned_content = row['Cleaned_Content']
            if not cleaned_content.strip():
                continue
            extracted_sections = extract_semantic_sections(cleaned_content, file_name)
            all_semantic_sections.extend(extracted_sections)
    semantic_sections_df = pd.DataFrame(all_semantic_sections)
    print(f"Generated {len(semantic_sections_df)} semantic sections.")
    semantic_sections_df.to_csv(SEMANTIC_SECTIONS_PATH, index=False)
    print(f"Semantic sections saved to {SEMANTIC_SECTIONS_PATH}")

    # Initial chunking strategy
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        length_function=len,
        add_start_index=True,
        separators=["\n\n\n", "\n\n", "\n", " ", ""]
    )

    all_chunks = []
    if not semantic_sections_df.empty:
        for index, row in tqdm(semantic_sections_df.iterrows(), total=len(semantic_sections_df),
                               desc="Splitting sections into chunks"):
            source_file = row['source_file']
            section_title = row['section_title']
            section_content = row['section_content']
            if not section_content.strip():
                continue
            docs = text_splitter.create_documents(
                texts=[section_content],
                metadatas=[{"source_file": source_file, "section_title": section_title}]
            )
            for doc in docs:
                chunk_data = {
                    "source_file": doc.metadata["source_file"],
                    "section_title": doc.metadata["section_title"],
                    "chunk_content": doc.page_content,
                    "chunk_length": len(doc.page_content),
                    "start_index_in_section": doc.metadata["start_index"],
                    "original_chunk_index": len(all_chunks)
                }
                all_chunks.append(chunk_data)

    chunks_df = pd.DataFrame(all_chunks)
    print(f"Generated {len(chunks_df)} total chunks from semantic sections.")
    chunks_df.to_csv(PROCESSED_CHUNKS_PATH, index=False)
    print(f"Processed chunks saved to {PROCESSED_CHUNKS_PATH}")
    print("Data preprocessing complete.")

if __name__ == "__main__":
    # This part will run only when preprocess.py is executed directly
    # Ensure 'pakistan_laws_raw.csv' is in your 'data/' directory
    # For first run, you might need to manually place it there or adjust RAW_DATA_PATH
    print("Running data preprocessing script...")
    run_preprocessing(RAW_DATA_PATH)

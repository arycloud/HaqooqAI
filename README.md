---
title: HaqooqAI Backend
emoji: ⚖️
colorFrom: green
colorTo: blue
sdk: docker
dockerfile: ./backend/Dockerfile
app_port: 7860
---

# HaqooqAI
LLM-Powered Legal Assistant Agent for Pakistani Law

## 🔗 Repository Links
- **Main Branch:** [https://github.com/arycloud/HaqooqAI](https://github.com/arycloud/HaqooqAI)
- **Deployment Branch:** [https://github.com/arycloud/HaqooqAI/tree/feature/api-development](https://github.com/arycloud/HaqooqAI/tree/feature/api-development)

## 📄 Live Documentation Site
Explore the interactive documentation for this project here: [https://arycloud.github.io/HaqooqAI/](https://arycloud.github.io/HaqooqAI/)

## 📘 Project Overview
HaqooqAI is an intelligent legal assistant designed to answer queries about Pakistani laws, ordinances, and legal affairs. It uses Retrieval-Augmented Generation (RAG) to combine the reasoning power of a large language model (LLM) with a curated legal knowledge base and live web search functionality.

This project is divided into two main components:
- **FastAPI Backend:** Handles all AI logic.
- **React Frontend:** Provides a modern, user-friendly chat interface.

## 🔑 Key Features
- **Specialized Legal Information Retrieval:** Searches relevant legal content from a curated local database.
- **Intelligent Tool Routing:** Automatically chooses between local document search and web search based on the query.
- **Domain Specialization:** Politely declines non-legal queries, focusing solely on Pakistani law.
- **Enhanced Factual Grounding:** Reduces hallucinations by relying strictly on retrieved tool outputs.
- **Accurate Source Attribution:** All responses are cited clearly, indicating the source (local docs or web search).

## 🏗️ Architecture
The system is powered by a LangChain agent coordinating the following components:

### Backend Architecture
- **Generative LLM:** `openai/gpt-oss-20b` (Groq)
- **Embedding Model:** `BAAI/bge-large-en-v1.5`
- **Vector Database:** ChromaDB for document embedding storage and retrieval
- **Tools:**
  - `legal_document_search`: Queries the local ChromaDB
  - `web_search`: Searches the web using DuckDuckGo

### Frontend Architecture
- **Framework:** React + Vite
- **Styling:** Tailwind CSS
- **Markdown Rendering:** react-markdown + remark-gfm

## 🧺 Data Pipeline

### 📥 Data Acquisition
- **Dataset:** `AyeshaJadoon/Pakistan_Laws_Dataset`
- Raw legal documents from Hugging Face.

### 🧹 Preprocessing
- Cleans headers, footers, and whitespaces.
- Semantic sectioning into Parts, Chapters, and Sections.
- Chunks texts into manageable sizes (1500 characters with 150 overlap).
- Implemented in: `src/data_processing/preprocess.py`

### 🔢 Embedding Generation
- Uses `BAAI/bge-large-en-v1.5` to generate embeddings.
- GPU recommended.
- Implemented in: `src/data_processing/embed_and_index.py`

### 🗃️ Vector Database Indexing
- Stores embeddings in ChromaDB for fast retrieval.


## ⚙️ Setup and Installation

### 1. Clone the Repository
```bash
   git clone https://github.com/arycloud/HaqooqAI
   cd HaqooqAI
````


### 2. Create a Virtual Environment (Recommended)

```bash
    python -m venv venv
    source venv/bin/activate   # Linux/macOS
    # On Windows:
    # .\venv\Scripts\activate

```

### 3. Install Python Dependencies

```bash
   pip install -r requirements.txt
```

### 4. Acquire Dataset

* Download `pdf_data.json` from Hugging Face
* Place in `data/` directory, convert to `pakistan_laws_raw.csv` if needed (see `notebooks/data_preprocessing.ipynb`).

## 🚀 Running the Project

```bash
   python -m src.main
```

### 4. Install Ollama and Download LLM

- Download Ollama from: [ollama.com/download](https://ollama.com/download)
- Pull the LLM:

```bash
ollama pull qwen3:1.7b
```

> Wait for the download to complete, then exit.

### 5. Acquire Dataset

- Download `pdf_data.json` from [Hugging Face](https://huggingface.co/datasets/AyeshaJadoon/Pakistan_Laws_Dataset)
- Place the file in the `data/` directory and transform it to `pakistan_laws_raw.csv` if needed, you can see the complete code for that in `notebooks/data_preprocessing.ipynb`.
- Or update `src/data_processing/preprocess.py` to load the JSON file directly.

---

## 🚀 Running the Project

To run the full pipeline:

```bash
   python -m src.main

```

This will:
1. Preprocess the legal data
2. Generate and index embeddings
3. Initialize the LLM agent
4. Start an interactive legal assistant loop

## 📦 Containerization and Deployment

### Build Docker Image

```bash
   docker build -t haqooq-ai-backend .
```

### Run Container

```bash
   docker run -p 7860:7860 haqooq-ai-backend
```

## 🧱 Project Structure

```plaintext
.
├── data/
├── notebooks/
├── src/
│   ├── config.py
│   ├── data_processing/
│   │   ├── preprocess.py
│   │   └── embed_and_index.py
│   └── agent/
│       ├── tools.py
│       └── agent.py
├── .gitignore
├── README.md
├── Dockerfile
└── requirements.txt
```

## 🔮 Future Work

* ✅ Build user-friendly UI
* ✅ Implement streaming responses
* ✅ Explore LLM fine-tuning
* ✅ CI/CD for deployment
* ✅ Define evaluation metrics

## 📜 License

MIT License — see LICENSE file for details.

---


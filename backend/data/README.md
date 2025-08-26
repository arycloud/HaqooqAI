# HaqooqAI Backend Data Directory

This directory contains data files and databases used by the HaqooqAI backend.

## Directory Structure

```
data/
├── chroma_db/          # ChromaDB vector database files
├── usage.json          # User quota tracking data
├── pakistan_laws_*.csv # Legal document datasets (to be added)
└── README.md           # This file
```

## Files Description

### usage.json
- Tracks user query quotas and usage statistics
- JSON format with user IDs as keys
- Automatically managed by the UsageTracker service
- Contains quota counts, reset times, and user metadata

### chroma_db/
- ChromaDB persistent storage directory
- Contains vector embeddings of Pakistani legal documents
- Automatically created and managed by ChromaDB
- Used for semantic search of legal documents

### pakistan_laws_*.csv
- Legal document datasets in CSV format
- Should contain columns: document_id, title, content, section, source_file
- Used to populate the ChromaDB vector database
- Files should be added manually or through data ingestion scripts

## Setup Instructions

1. **Initial Setup**: The directories are created automatically by the application
2. **Data Ingestion**: Add legal document CSV files to this directory
3. **Vector Database**: Run the data ingestion script to populate ChromaDB
4. **Permissions**: Ensure the application has read/write access to this directory

## Data Privacy

- User API keys are stored in memory only (not persisted)
- Usage data contains only GitHub user IDs and usage counts
- No personal information or query content is stored
- Legal document content is stored locally for search purposes

## Backup Recommendations

- Backup the entire data/ directory regularly
- usage.json should be backed up daily
- chroma_db/ should be backed up after any data updates
- Consider using version control for legal document CSV files

## Monitoring

- Monitor disk usage in this directory
- Check usage.json for corruption or unusual patterns
- Verify ChromaDB integrity periodically
- Log access patterns for security monitoring

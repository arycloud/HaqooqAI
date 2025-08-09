import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from src.agent.agent import LegalAssistantAgent

app = FastAPI(title="HaqooqAI", version="0.0.1")
agent = LegalAssistantAgent()

# Add the CORS middleware
origins = [
    "*"  # Allows all origins for development, you can restrict this later
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class QueryRequest(BaseModel):
    query: str

@app.post("/ask/")
def ask_agent(request: QueryRequest):
    try:
        response = agent.run(request.query)
        return {
            "status": "success",
            "answer": response
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
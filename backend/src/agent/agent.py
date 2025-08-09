import os
from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from dotenv import load_dotenv
from src.agent.tools import legal_document_search, web_search_tool

load_dotenv()

# Define the Agent Class
class LegalAssistantAgent:
    def __init__(self):
        """Initializes the agent and its tools."""
        # 1. Initialize the LLM (using the same local model)
        # self.llm = ChatOllama(model="qwen3:1.7b")
        # Now upadated to the openrouter model
        self.llm = ChatOpenAI(
            model="openai/gpt-oss-20b",
            openai_api_base="https://api.groq.com/openai/v1",
            openai_api_key=os.getenv("GROQ_API_KEY"),
            temperature=0.1,
            max_tokens=8000,
            verbose=True
        )

        # 2. Define the tools the agent will use
        self.tools = [
            legal_document_search,
            web_search_tool
        ]

        # 3. Define the prompt template
        self.prompt = ChatPromptTemplate.from_messages([
                        ("system",
                         "You are a helpful legal assistant named HaqooqAI, specializing in Pakistani law. "
                         "Your primary goal is to provide accurate and legally sound answers to user queries. "
                         "You have access to two powerful tools: a local legal document search and a general web search. "
                         "You MUST adhere to the following rules:"
                         "1. For questions related to static legal principles, ordinances, and historical legal information, always use the 'legal_document_search' tool. This is your primary source of legal truth. "
                         "2. For questions about current events, people, or facts that can change over time (e.g., 'Who is the current prime minister?'), you should use the 'web_search' tool. "
                         "3. If a query is not related to legal matters, politely decline to answer. "
                         "4. If a query is not related to Pakistan, politely decline to answer and say it\'s not related to my scope!"
                         "5. Your responses MUST be factually grounded in the information returned by the tools. "
                         "6. For every piece of information you provide, you must include the source of that information (e.g., 'Source: Legal Document Search' or 'Source: Web Search'). "
                         "7. Do not hallucinate or make up information. If a tool cannot find an answer, state that you were unable to find a relevant answer."),
                        ("placeholder", "{chat_history}"),
                        ("human", "{question}"),
                        ("placeholder", "{agent_scratchpad}"),
                    ])

        # 4. Create the agent executor
        self.agent_executor = create_tool_calling_agent(self.llm, self.tools, self.prompt)
        self.agent_executor = AgentExecutor(agent=self.agent_executor, tools=self.tools, verbose=True)

    def run(self, query: str):
        """Runs the agent with a given query."""
        response = self.agent_executor.invoke({"question": query, "chat_history": []})
        output_string = response.get("output", "I was unable to find a relevant answer.")
        import re
        cleaned_output_string = re.sub(r"<tool_code>.*?</tool_code>", "", output_string, flags=re.DOTALL)
        final_response  = cleaned_output_string.strip()
        return final_response


# This block is for direct testing of the agent
if __name__ == "__main__":
    agent = LegalAssistantAgent()
    print("\n--- Testing the Full RAG Pipeline with Agentic Capabilities ---")

    question_1 = "What are the functions and powers of the Privatisation Commission as per the Ordinance?"
    print(f"\nQuestion 1: {question_1}")
    response_1 = agent.run(question_1)
    print(f"\nResponse 1: {response_1}")

    question_2 = "What is the capital of France?"
    print(f"\nQuestion 2: {question_2}")
    response_2 = agent.run(question_2)
    print(f"\nResponse 2: {response_2}")
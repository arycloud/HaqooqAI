"""
Legal Assistant Agent for HaqooqAI Backend
Adapted from existing agent.py with improved integration
"""
from datetime import datetime
import os
import logging
from typing import List, Optional, Dict, Any, Tuple
from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
import re

from .tools import legal_document_search, web_search_tool
from ..config import GROQ_API_BASE, GROQ_MODEL, DEFAULT_GROQ_KEY

logger = logging.getLogger(__name__)


class LegalAssistantAgent:
    """Enhanced Legal Assistant Agent for Pakistani law queries"""

    def __init__(self):
        """Initializes the enhanced agent and its tools."""
        self.groq_api_base = GROQ_API_BASE
        self.groq_model = GROQ_MODEL
        self.default_groq_key = DEFAULT_GROQ_KEY

        # 2. Define the tools the agent will use
        self.tools = [
            legal_document_search,
            web_search_tool
        ]
        current_date = datetime.now().strftime("%B %d, %Y")
        # 3. Prompt Template
        self.prompt = ChatPromptTemplate.from_messages([
                    ("system",
                    f"CURRENT DATE: {current_date}\n\n"
                    "You are HaqooqAI, a specialized legal assistant for Pakistani laws and legal affairs. Always respond in clear, professional English. Follow this decision flow strictly.\n\n"

                    "## SCOPE CHECK ##\n"
                    "First, verify if the question or conversation history relates to Pakistan:\n"
                    "- If NOT about Pakistan (no relevant terms in query or history): Reply 'Out of scope – I only answer questions about Pakistan. Please rephrase with Pakistani context.'\n"
                    "- If unclear or a follow-up without explicit terms but history indicates Pakistan context: Proceed, assuming relevance from history.\n"
                    "- Examples: Follow-ups like 'expand on that' after a Pakistan law discussion are in-scope; unrelated shifts (e.g., 'Who is Biden?') are out-of-scope.\n\n"

                    "## SEARCH STRATEGY ##\n"
                    "For confirmed Pakistani queries:\n\n"

                    "### Time-Sensitive Queries ###\n"
                    "ALWAYS use the CURRENT DATE shown at the top of this prompt (NOT your internal knowledge) for year references.\n"
                    "If involving current events, recent changes, or time-sensitive info (keywords: 'recent', 'current', 'latest', 'new', 'today', or history suggests dynamism):\n"
                    "- Action: ALWAYS use web_search_tool FIRST for verification.\n"
                    "- Enhance query: Add 'Pakistan' if missing, 'site:pakistan.gov.pk OR site:na.gov.pk OR site:supremecourt.gov.pk' for official info, and the CURRENT YEAR from the date above (e.g., 'Pakistan PM 2025').\n"
                    "- NEVER use years from your training data (like 2023) — always use the current year shown at the top.\n"
                    "- Examples: Current PM, recent amendments, latest court decisions — never guess; tool-verify.\n\n"

                    "### Historical/Established Legal Queries ###\n"
                    "For static laws, constitutional provisions, or historical info:\n"
                    "- Action: Try legal_document_search FIRST for precise matches.\n"
                    "- If no relevant results (distance > 0.7, no matches, or incomplete): Fallback to web_search_tool with enhancements.\n"
                    "- Cross-verify: If history contradicts, re-query tools.\n"
                    "- Examples: 1973 Constitution articles, established procedures—use history to refine.\n\n"

                    "### Query Enhancement ###\n"
                    "Always refine queries using history:\n"
                    "- Add Pakistan context if implied by history but missing.\n"
                    "- Prefer official/reliable sources: Append 'site:pakistan.gov.pk OR site:na.gov.pk OR site:supremecourt.gov.pk', OR use site:en.wikipedia.org\n"
                    "- For legal: Add 'legal OR law OR act OR ordinance'.\n"
                    "- If results poor (irrelevant, outdated, non-English): Retry with synonyms, simpler terms, or combine tools.\n\n"

                    "## RESPONSE QUALITY ##\n"
                    "- ALWAYS base EVERY factual claim on tool results—never hallucinate, guess, or use internal knowledge alone.\n"
                    "- Use chat_history for continuity: Reference prior info (e.g., 'Building on our discussion of marriage laws...'), avoid repetition.\n"
                    "- If tools return conflicting info: Note the discrepancy and prioritize official sources (e.g., gov.pk).\n"
                    "- Handle languages: Prefer English; ignore non-relevant foreign content unless Urdu legal terms (e.g., 'nikah').\n"
                    "- Keep responses concise, structured (bullet points/tables for lists), and neutral.\n\n"

                    "## CRITICAL OUTPUT RULES ##\n"
                    "Adhere to these formatting rules strictly. The system parses your output automatically — any deviation will cause errors.\n\n"
                    "- NEVER output JSON, XML, or any structured data format.\n"
                    "- ALWAYS output plain text only.\n"
                    "- Format lists using hyphens (-) or numbered lists as appropriate.\n"
                    "- Format bold text using **double asterisks**.\n"
                    "- NEVER include 'type', 'children', 'metadata', or other structural elements.\n\n"

                    "## SOURCE FORMAT (MANDATORY) ##\n"
                    "Sources MUST appear at the very end of the response, one per line, in this **exact format**:\n"
                    "```\n"
                    "Source: [Type] | [Title] | [URL]\n"
                    "```\n"
                    "- `[Type]`: Use exactly one of: `Web Search`, `Local Legal Doc`\n"
                    "- `[Title]`: A clear, concise title (e.g., 'The Constitution of the Islamic Republic of Pakistan')\n"
                    "- `[URL]`: Full URL if available. If no URL (e.g., internal document), use `N/A`\n\n"

                    "✅ CORRECT EXAMPLES:\n"
                    "```\n"
                    "Source: Web Search | The Constitution of the Islamic Republic of Pakistan | https://na.gov.pk/uploads/documents/1333523681_951.pdf\n"
                    "Source: Local Legal Doc | Pakistan Penal Code, 1860 - Section 302 | N/A\n"
                    "```\n\n"

                    "❌ NEVER USE THESE FORMATS FOR SOURCES:\n"
                    "- `Source: Web Search – Title - https://example.com`\n"
                    "- `Source: [Web Search] | Title | URL`\n"
                    "- `Source: Web Search | https://example.com | Title`\n"
                    "- `Source: Web Search: Title - https://example.com`\n"
                    "- Any format using `–`, `-`, `:`, or incorrect field order\n\n"

                    "## FINAL DISCLAIMER ##\n"
                    "After listing all sources, add this exact line:\n"
                    "```\n"
                    "**Disclaimer**: This is informational and not a substitute for formal legal advice. Consult a qualified Pakistani lawyer for specific cases.\n"
                    "```\n\n"

                    "## QUALITY CHECKS ##\n"
                    "Before final answer, self-verify:\n"
                    "1. Is response Pakistan-relevant and consistent with history?\n"
                    "2. Does it directly address the query without extras?\n"
                    "3. Are all facts tool-verified with citations?\n"
                    "4. Are sources in the **exact pipe format** and disclaimer present?\n"
                    "5. If tools failed/relevant info missing: Say 'Insufficient reliable info—please provide more details or rephrase.'\n\n"

                    "Prioritize accuracy, relevance, and user safety over completeness."
                    ),
                    ("placeholder", "{chat_history}"),
                    ("human", "{question}"),
                    ("placeholder", "{agent_scratchpad}"),
                ])
        # Initialize with default LLM if available
        self.default_llm = None
        if self.default_groq_key:
            try:
                self.default_llm = self._create_llm(self.default_groq_key)
                self.default_agent_executor = self._create_agent_executor(self.default_llm)
                logger.info("Default LLM initialized successfully")
            except Exception as e:
                logger.error(f"Error initializing default LLM: {e}")
                self.default_agent_executor = None
        else:
            self.default_agent_executor = None
            logger.warning("No default Groq API key provided")

    def _create_llm(self, groq_api_key: str) -> ChatOpenAI:
        """Create a ChatOpenAI instance with the provided key"""
        return ChatOpenAI(
            model=self.groq_model,
            openai_api_base=self.groq_api_base,
            openai_api_key=groq_api_key,
            temperature=0.1,
            max_tokens=10000,
            verbose=True
        )

    def _create_agent_executor(self, llm: ChatOpenAI) -> AgentExecutor:
        """Create an agent executor with the provided LLM"""
        agent = create_tool_calling_agent(llm, self.tools, self.prompt)
        return AgentExecutor(
            agent=agent,
            tools=self.tools,
            verbose=True,
            max_iterations=5,  # Allow more iterations for better results
            early_stopping_method="generate"
        )

    def _preprocess_query(self, query: str, chat_history: list = None) -> dict:
        """Analyze query and chat history to determine search strategy."""
        query_lower = query.lower()
        
        # List of Pakistan-related terms
        pakistan_terms = [
            # === COUNTRY & NATIONAL TERMS ===
            'pakistan', 'pakistani', 'pak', 'pakistān', 'pakis', 'pakisani',
            'islamic republic of pakistan', 'republic of pakistan',
            
            # === PROVINCES & ADMINISTRATIVE REGIONS ===
            'punjab', 'sindh', 'khyber pakhtunkhwa', 'kp', 'kpk', 'balochistan', 'gilgit', 'baltistan',
            'federally administered tribal areas', 'fata', 'azad kashmir', 'ajk', 'islamabad capital territory', 'ict',
            'potohar', 'saraiki', 'makran', 'cholistan', 'thar', 'nubra', 'skardu', 'hunza', 'shigar',
            
            # === MAJOR CITIES & TOWNS ===
            'karachi', 'lahore', 'islamabad', 'rawalpindi', 'faisalabad', 'multan', 'hyderabad', 'quetta',
            'peshawar', 'mardan', 'abbottabad', 'swat', 'mansehra', 'murree', 'gulberg', 'defence', 'dha',
            'clifton', 'gulshan', 'bahria', 'model town', 'johar town', 'walled city', 'old city',
            
            # === LEGISLATION & ACTS ===
            'pakistan penal code', 'ppc', 'criminal procedure code', 'crpc', 'civil procedure code', 'cpc',
            'qanun-e-shahadat', 'evidence act', 'contract act 1872', 'sale of goods act 1930',
            'partnership act 1932', 'limitation act 1908', 'specific relief act 1877',
            'property act 1882', 'registration act 1908', 'transfer of property act 1882',
            'guardians and wards act 1890', 'guardianship law', 'custody law',
            'child marriage restraint act 1929', 'cmra', 'sindh child marriage restraint act 2020',
            'punjab dowry act 2021', 'dowry prohibition', 'bride price', 'mahr', 'dower',
            'zakat', 'ushr', 'waqf', 'wakf', 'charity law', 'religious endowment',
            'defamation law', 'cybercrime law', 'peca', 'prevention of electronic crimes act 2016',
            'anti-corruption', 'nab', 'national accountability bureau', 'accountability court',
            'provincial assembly', 'national assembly', 'senate', 'parliament',
            
            # === GOVERNMENT & INSTITUTIONS ===
            'government of pakistan', 'federal government', 'provincial government',
            'ministry of law', 'law and justice division', 'attorney general', 'solicitor general',
            'district commissioner', 'dc', 'deputy commissioner', 'assistant commissioner', 'ac',
            'police', 'ppc', 'punjab police', 'sindh police', 'kpk police', 'balochistan police',
            'fia', 'federal investigation agency', 'nhsrc', 'national human rights commission',
            'lc', 'local commission', 'ombudsman', 'mohtasib', 'wafaqi mohtasib',
            'land revenue', 'revenue department', 'patwari', 'mutation', 'fard', 'intiqal',
            'stamp duty', 'registration fee', 'property tax', 'municipal tax',
            # === RELIGIOUS & CULTURAL CONTEXT (Legal Relevance) ===
            'sunni', 'shiite', 'ahmadi', 'qadiani', 'blasphemy', '295c', 'section 295c',
            'islamic ideology', 'niqab', 'hijab', 'burqa', 'purdah',
            'interest', 'usury', 'zina', 
            'nikah', 'nikkah','nikah nama', 'dissolution of muslim marriages act 1939',
            'khula', 'talaq', 'divorce', 'iddat', 'iddah', 'maintenance', 'muta',
            'wali', 'guardian', 'consent', 'minor marriage', 'child marriage',
            'inheritance', 'sharia inheritance', 'faraid', 'ulama', 'mufti',

            'christian marriage act 1872', 'hindu marriage act 2017',
            'sikh gurdwara act 1925', 'special marriage act 1872',
        ]
        
        follow_up_indicators = [
        'previous', 'last', 'that', 'the person', 'he', 'she', 'it', 'expand', 'more on',
        'follow up', 'clarify', 'elaborate', 'expand', 'what about', 'tell me more', 'who was',
        'the one', 'mentioned', 'earlier', 'before', 'just asked', 'in my last'
        ]
        is_follow_up = any(indicator in query_lower for indicator in follow_up_indicators)
        
        # Check if the query itself has Pakistan terms
        is_pakistan_in_query = any(term in query_lower for term in pakistan_terms)
        
        # Check chat history for Pakistan context if available
        is_pakistan_in_history = False
        if chat_history:
            # Limit to recent history (last 4 messages: ~2 user-assistant pairs) for relevance
            recent_history = chat_history[-4:]
            # Extract content from tuples (role, content)
            history_text = ' '.join([content for role, content in recent_history])
            history_lower = history_text.lower()
            is_pakistan_in_history = any(term in history_lower for term in pakistan_terms)
        
        # Refined: Related if query has terms OR (it's a follow-up AND history has terms)
        is_pakistan_related = is_pakistan_in_query or (is_follow_up and is_pakistan_in_history)
        
        # New: Debug logging
        logger.debug(f"Scope Check - Query: '{query}' | In Query: {is_pakistan_in_query} | Follow-up: {is_follow_up} | In History: {is_pakistan_in_history} | Overall Related: {is_pakistan_related}")
        
        # Analyze time sensitivity and legal nature (no changes needed)
        is_time_sensitive = any(term in query_lower for term in [
            'recent', 'latest', 'current', 'new', 'update', 'today', 'now',
            '2024', '2023', 'this year', 'last year', 'currently'
        ])
        
        is_legal_query = any(term in query_lower for term in [
            # ... (keep your list as-is) ...
        ])
        
        # Determine suggested strategy (no changes needed)
        if not is_pakistan_related:
            suggested_strategy = 'scope_check'
        elif is_time_sensitive:
            suggested_strategy = 'web_first'
        elif is_legal_query:
            suggested_strategy = 'local_first'
        else:
            suggested_strategy = 'web_first'
        
        return {
            'is_pakistan_related': is_pakistan_related,
            'is_time_sensitive': is_time_sensitive,
            'is_legal_query': is_legal_query,
            'suggested_strategy': suggested_strategy
        }

    async def run(self, query: str, groq_api_key: Optional[str] = None,
                  chat_history: List[Tuple[str, str]] = []) -> Dict[str, Any]:
        """
        Enhanced run method with preprocessing and better error handling.

        Args:
            query: User query
            groq_api_key: Optional user's Groq API key

        Returns:
            Dict containing response and metadata
        """
        try:
            # Determine which executor to use
            executor_to_use = self.default_agent_executor

            if groq_api_key:
                # Create a temporary ChatOpenAI instance with the provided key
                temp_llm = self._create_llm(groq_api_key)
                executor_to_use = self._create_agent_executor(temp_llm)
            elif not self.default_agent_executor:
                return {
                    "response": "Service temporarily unavailable. Please provide your own Groq API key or try again later.",
                    "error": "No API key available",
                    "sources": []
                }

            # Preprocess the query for insights
            query_analysis = self._preprocess_query(query, chat_history)

            # Handle obvious scope issues early
            if query_analysis['suggested_strategy'] == 'scope_check':
                if not query_analysis['is_pakistan_related']:
                    return {
                        "response": "This seems unrelated to Pakistan.\n"
                        "If it's a follow-up, please reference it clearly (e.g., 'the previous Pakistan PM')."
                        " Otherwise, rephrase with Pakistan context.",
                        "sources": [],
                        "query_analysis": query_analysis
                    }

            # Add preprocessing context to the query
            enhanced_context = f"""
                                Query Analysis:
                                    - Pakistan-related: {query_analysis['is_pakistan_related']}
                                    - Time-sensitive: {query_analysis['is_time_sensitive']}
                                    - Legal query: {query_analysis['is_legal_query']}
                                    - Suggested strategy: {query_analysis['suggested_strategy']}
                                    Original Question: {query}
                                """

            response = await executor_to_use.ainvoke({
                "question": enhanced_context,
                "chat_history": chat_history
            })

            output_string = response.get("output", "I was unable to find a relevant answer.")

            # Clean up any tool code artifacts
            cleaned_output_string = re.sub(r"<tool_code>.*?</tool_code>", "", output_string, flags=re.DOTALL)

            # Post-process the response
            final_response = self._post_process_response(cleaned_output_string.strip(), query)
            sources, disclaimer = self._extract_sources_from_response(final_response)
            print("=======SOURCES=======")
            for source in sources:
                print(f"Source: {source['title']}, Type: {source['type']}, URL: {source['url']}")
            print(f'Disclaimer found: {disclaimer}')
            return {
                "response": final_response,
                "sources": sources,
                "disclaimer": disclaimer
            }

        except Exception as e:
            logger.error(f"Error in agent run: {e}")
            return {
                "response": f"I encountered an error while processing your question: {str(e)}. Please try rephrasing your question or try again later.",
                "error": str(e),
                "sources": []
            }

    def _sanitize_llm_response(self, response: str) -> str:
        """Ensure response is plain text and remove any structured formats but keep markdown structure."""

        # Remove JSON-like structures that might have been generated
        response = re.sub(r'\{[^}]*"type"[^}]*\}', '', response)
        response = re.sub(r'\{[^}]*"children"[^}]*\}', '', response)

        # Remove specific structured patterns
        structured_patterns = [
            r'"type":\s*"container"',
            r'"type":\s*"card"',
            r'"type":\s*"infoBlock"',
            r'"type":\s*"paragraph"',
            r'"type":\s*"metadata"',
            r'"type":\s*"disclaimerCard"',
            r'"style":\s*{[^}]*}'
        ]
        for pattern in structured_patterns:
            response = re.sub(pattern, '', response)

        # Remove JSON wrapping if present
        response = re.sub(r'^\s*{.*?}\s*$', '', response, flags=re.DOTALL)

        # Convert escaped newlines
        response = response.replace("\\n", "\n")

        # 🚨 Keep multiple newlines (section spacing), only collapse >3 into 2
        response = re.sub(r'\n{3,}', '\n\n', response)

        # Remove leftover backslashes
        response = response.replace("\\", "")

        # Trim trailing/leading whitespace
        return response.strip()

    def _post_process_response(self, response: str, original_query: str) -> str:
        """Post-process the response for quality and consistency."""

        response = self._sanitize_llm_response(response)

        # Check if response seems incomplete or irrelevant
        if len(response) < 50:
            response = f"{response}\n\nNote: This response seems brief. If you need more detailed information, please rephrase your question or provide more specific details."

        # Ensure disclaimer is present for legal queries
        query_lower = original_query.lower()
        is_legal_query = any(term in query_lower for term in [
            'constitution', 'amendment', 'law', 'act', 'ordinance', 'legal',
            'court', 'judge', 'justice', 'parliament'
        ])

        if is_legal_query and "substitute for formal legal advice" not in response:
            response += "\n\n**Disclaimer:** This information is for general guidance only and is not a substitute for formal legal advice. For specific legal matters, please consult a qualified legal professional."

        return response

    # def _extract_sources_from_response(self, response: str) -> tuple[list[dict], str | None]:
    #     """Extract sources and disclaimer from LLM response text."""
    #     sources = []
    #     disclaimer = None

    #     # Regex for sources
    #     source_pattern = r"Source:\s*(?:Web Search\s*[-–]\s*)?(.+)"
    #     for match in re.finditer(source_pattern, response, re.IGNORECASE):
    #         source_text = match.group(1).strip()
    #         if source_text and len(source_text) > 3:
    #             sources.append({"title": source_text})

    #     # Regex for disclaimer
    #     disclaimer_pattern = r"\*\*Disclaimer\*\*:?(.+)"
    #     m = re.search(disclaimer_pattern, response, re.IGNORECASE | re.DOTALL)
    #     if m:
    #         disclaimer = "**Disclaimer**:" + m.group(1).strip()

    #     # Deduplicate sources by title
    #     seen = set()
    #     unique_sources = []
    #     for s in sources:
    #         if s["title"] not in seen:
    #             seen.add(s["title"])
    #             unique_sources.append(s)

    #     return unique_sources, disclaimer
    


    # def _extract_sources_from_response(self, response: str) -> tuple[list[dict], str | None]:
    #     """
    #     Extracts structured sources and a disclaimer from the LLM response text.
    #     Assumes sources are in the format: 'Source: [Type] | [Title] | [URL]'
    #     """
    #     sources = []
    #     disclaimer = None

    #     # 1. Regex for the new, structured source format
    #     # This pattern captures three groups separated by pipes.
    #     source_pattern = re.compile(
    #         r"^Source:\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*(.+?)$", 
    #         re.MULTILINE | re.IGNORECASE
    #     )
        
    #     for match in source_pattern.finditer(response):
    #         source_type = match.group(1).strip()
    #         title = match.group(2).strip()
    #         url = match.group(3).strip()

    #         # The frontend expects a 'type' field, as seen in its documentation
    #         # Let's map it to a more structured format
    #         source_doc_type = 'web_search' if 'web' in source_type.lower() else 'legal_doc'

    #         sources.append({
    #             "type": source_doc_type,
    #             "title": title,
    #             "url": url if url.lower() != 'n/a' else None, # Store None if URL is 'N/A'
    #         })
        

    #     # 2. Regex for disclaimer (can remain the same, but let's make it robust)
    #     disclaimer_pattern = re.compile(r"(\*\*Disclaimer\*\*:.+)", re.IGNORECASE | re.DOTALL)
    #     disclaimer_match = disclaimer_pattern.search(response)
    #     if disclaimer_match:
    #         disclaimer = disclaimer_match.group(1).strip()

    #     # 3. Deduplicate sources based on a combination of title and URL
    #     # This prevents identical sources from appearing twice
    #     seen = set()
    #     unique_sources = []
    #     for s in sources:
    #         # Create a unique identifier for each source
    #         identifier = (s["title"], s["url"])
    #         if identifier not in seen:
    #             seen.add(identifier)
    #             unique_sources.append(s)

    #     # The function now returns unique_sources, disclaimer, and the cleaned response
    #     # You may need to adjust your RAG engine to handle this third return value.
    #     # For now, let's stick to the original function signature.
    #     return unique_sources, disclaimer


    # Grabbing both "-" and "|" format for sources
    def _extract_sources_from_response(self, response: str) -> tuple[list[dict], str | None]:
        sources = []
        disclaimer = None

        # Flexible regex: accepts | or - or – as separators
        source_pattern = re.compile(
            r"^Source:\s*(.*?)\s*[\|\-\u2013]\s*(.+?)\s*[\-\u2013]\s*(https?://[^\s]+|N/A|n/a)\s*$",
            re.MULTILINE | re.IGNORECASE
        )

        for match in source_pattern.finditer(response):
            raw_type = match.group(1).strip()
            title = match.group(2).strip()
            url = match.group(3).strip()

            doc_type = "web_search" if "web" in raw_type.lower() else "legal_doc"
            url_value = None if url.lower() == "n/a" else url

            sources.append({
                "type": doc_type,
                "title": title,
                "url": url_value
            })

        # Extract disclaimer
        disclaimer_match = re.search(r"(\*\*Disclaimer\*\*:.+)", response, re.IGNORECASE | re.DOTALL)
        if disclaimer_match:
            disclaimer = disclaimer_match.group(1).strip()

        # Deduplicate
        seen = set()
        unique_sources = []
        for s in sources:
            key = (s["title"], s["url"])
            if key not in seen:
                seen.add(key)
                unique_sources.append(s)

        return unique_sources, disclaimer

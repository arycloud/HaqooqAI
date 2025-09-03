"""
Legal Assistant Agent for HaqooqAI Backend
"""
from datetime import datetime
import logging
import re
from typing import List, Optional, Dict, Any, Tuple

from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI

from .tools import legal_document_search, web_search_tool
from ..config import GROQ_API_BASE, GROQ_MODEL, DEFAULT_GROQ_KEY

logger = logging.getLogger(__name__)


class LegalAssistantAgent:
    """Enhanced Legal Assistant Agent for Pakistani law queries"""

    # --- Constants ---
    PAKISTAN_TERMS: List[str] = [
        "pakistan", "pakistani", "pak", "pakistān", "pakis", "pakisani",
        "islamic republic of pakistan", "republic of pakistan",
        # Provinces & regions
        "punjab", "sindh", "khyber pakhtunkhwa", "kp", "kpk", "balochistan",
        "gilgit", "baltistan", "fata", "azad kashmir", "ajk",
        "islamabad capital territory", "ict",
        # Major cities
        "karachi", "lahore", "islamabad", "rawalpindi", "faisalabad", "multan",
        "quetta", "peshawar", "mardan", "abbottabad",
        # Key legislation & acts
        "pakistan penal code", "ppc", "criminal procedure code", "crpc",
        "civil procedure code", "cpc", "qanun-e-shahadat", "evidence act",
        "contract act 1872", "sale of goods act 1930", "partnership act 1932",
        "limitation act 1908", "specific relief act 1877",
        "property act 1882", "registration act 1908",
        "transfer of property act 1882", "guardians and wards act 1890",
        "child marriage restraint act 1929", "peca",
        "prevention of electronic crimes act 2016",
        # Institutions
        "supreme court", "national assembly", "senate", "nab", "fia",
        "attorney general", "solicitor general", "ombudsman", "mohtasib",
        # Religious/cultural
        "nikah", "khula", "talaq", "iddat", "inheritance", "sharia inheritance",
        "hijab", "blasphemy", "section 295c"
    ]

    FOLLOW_UP_INDICATORS: List[str] = [
        "previous", "last", "that", "the person", "he", "she", "it", "expand",
        "more on", "follow up", "clarify", "elaborate", "what about",
        "tell me more", "mentioned", "earlier", "before", "just asked"
    ]

    # Precompiled regex patterns
    _structured_patterns = [
        re.compile(r'"type":\s*"container"'),
        re.compile(r'"type":\s*"card"'),
        re.compile(r'"type":\s*"infoBlock"'),
        re.compile(r'"type":\s*"paragraph"'),
        re.compile(r'"type":\s*"metadata"'),
        re.compile(r'"type":\s*"disclaimerCard"'),
        re.compile(r'"style":\s*{[^}]*}')
    ]
    _json_like_pattern = re.compile(r"\{[^}]*\"(type|children)\"[^}]*\}")
    _code_block_pattern = re.compile(r"```[\s\S]*?Source:.*?```", re.MULTILINE | re.IGNORECASE)
    _source_line_pattern = re.compile(r"^Source:\s*.+$", re.MULTILINE | re.IGNORECASE)
    _disclaimer_text = "This is informational and not a substitute for formal legal advice. Consult a qualified Pakistani lawyer for specific cases."
    _pipe_pattern = re.compile(
        r"^Source:\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*(.+?)$",
        re.MULTILINE | re.IGNORECASE
    )

    def __init__(self) -> None:
        """Initializes the enhanced agent and its tools."""
        self.groq_api_base = GROQ_API_BASE
        self.groq_model = GROQ_MODEL
        self.default_groq_key = DEFAULT_GROQ_KEY

        self.tools = [legal_document_search, web_search_tool]

        current_date = datetime.now().strftime("%B %d, %Y")
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
                    "Sources MUST appear at the very end of the response after the disclaimer, one per line, in this **exact format**:\n"
                    "```\n"
                    "Source: [Type] | [Title] | [URL]\n"
                    "```\n"
                    "- `[Type]`: Use exactly one of: `Web Search`, `Local Legal Doc`\n"
                    "- `[Title]`: A clear, concise title (e.g., 'The Constitution of the Islamic Republic of Pakistan')\n"
                    "- `[URL]`: Full URL if available. If no URL (e.g., internal document), use `N/A`\n\n"

                    "✅ CORRECT EXAMPLES:\n"
                    "```\n"
                    "Source: Web Search | The Constitution of the Islamic Republic of Pakistan | https://na.gov.pk/uploads/documents/1333523681_951.pdf\n"
                    "Source: Local Legal Doc | Pakistan Penal Code, 1860 | Section 302 | N/A\n"
                    "```\n\n"

                    "❌ NEVER USE THESE FORMATS FOR SOURCES:\n"
                    "- `Source: Web Search – Title - https://example.com`\n"
                    "- `Source: [Web Search] | Title | URL`\n"
                    "- `Source: Web Search | https://example.com | Title`\n"
                    "- `Source: Web Search: Title - https://example.com`\n"
                    "- Any format using `–`, `-`, `:`, or incorrect field order\n\n"

                    "## FINAL DISCLAIMER ##\n"
                    "Just before listing all sources, add this exact line:\n"
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

        self.default_llm: Optional[ChatOpenAI] = None
        if self.default_groq_key:
            try:
                self.default_llm = self._create_llm(self.default_groq_key)
                self.default_agent_executor = self._create_agent_executor(self.default_llm)
                logger.info("Default LLM initialized successfully")
            except Exception as e:
                logger.error("Error initializing default LLM: %s", e)
                self.default_agent_executor = None
        else:
            logger.warning("No default Groq API key provided")
            self.default_agent_executor = None

    # --- LLM Setup ---
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
            max_iterations=5,
            early_stopping_method="generate"
        )

    # --- Query Preprocessing ---
    def _detect_scope(self, query: str, chat_history: List[Tuple[str, str]]) -> bool:
        query_lower = query.lower()
        in_query = any(term in query_lower for term in self.PAKISTAN_TERMS)
        follow_up = any(ind in query_lower for ind in self.FOLLOW_UP_INDICATORS)
        in_history = False
        if chat_history:
            recent_history = chat_history[-4:]
            history_text = " ".join([c for _, c in recent_history]).lower()
            in_history = any(term in history_text for term in self.PAKISTAN_TERMS)
        return in_query or (follow_up and in_history)

    def _detect_time_sensitivity(self, query: str) -> bool:
        time_terms = ["recent", "latest", "current", "new", "update", "today", "now", "2024", "2023"]
        return any(t in query.lower() for t in time_terms)

    def _detect_legal_query(self, query: str) -> bool:
        legal_terms = ["act", "section", "law", "code", "ordinance", "regulation", "constitution"]
        return any(t in query.lower() for t in legal_terms)

    def _preprocess_query(self, query: str, chat_history: List[Tuple[str, str]]) -> Dict[str, Any]:
        """Analyze query and chat history to determine search strategy."""
        is_related = self._detect_scope(query, chat_history)
        is_time_sensitive = self._detect_time_sensitivity(query)
        is_legal_query = self._detect_legal_query(query)

        if not is_related:
            strategy = "scope_check"
        elif is_time_sensitive:
            strategy = "web_first"
        elif is_legal_query:
            strategy = "local_first"
        else:
            strategy = "web_first"

        logger.debug(
            "Scope Check - Query: %s | Related: %s | Time-sensitive: %s | Legal: %s | Strategy: %s",
            query, is_related, is_time_sensitive, is_legal_query, strategy
        )

        return {
            "is_pakistan_related": is_related,
            "is_time_sensitive": is_time_sensitive,
            "is_legal_query": is_legal_query,
            "suggested_strategy": strategy
        }

    # --- Run Agent ---
    async def run(
        self,
        query: str,
        groq_api_key: Optional[str] = None,
        chat_history: List[Tuple[str, str]] = []
    ) -> Dict[str, Any]:
        try:
            executor = self.default_agent_executor
            if groq_api_key:
                executor = self._create_agent_executor(self._create_llm(groq_api_key))
            elif not executor:
                return {
                    "response": "Service temporarily unavailable. Please provide your own Groq API key or try again later.",
                    "error": "No API key available",
                    "sources": []
                }

            query_analysis = self._preprocess_query(query, chat_history)
            if query_analysis["suggested_strategy"] == "scope_check":
                return {
                    "response": (
                        "This seems unrelated to Pakistan.\n"
                        "If it's a follow-up, please reference it clearly "
                        "(e.g., 'the previous Pakistan PM'). "
                        "Otherwise, rephrase with Pakistan context."
                    ),
                    "sources": [],
                    "query_analysis": query_analysis
                }

            enhanced_context = (
                f"Query Analysis:\n"
                f"- Pakistan-related: {query_analysis['is_pakistan_related']}\n"
                f"- Time-sensitive: {query_analysis['is_time_sensitive']}\n"
                f"- Legal query: {query_analysis['is_legal_query']}\n"
                f"- Suggested strategy: {query_analysis['suggested_strategy']}\n"
                f"Original Question: {query}"
            )

            # Invoke model
            response = await executor.ainvoke(
                {"question": enhanced_context, "chat_history": chat_history}
            )
            raw_output = response.get("output", "")

            if not raw_output:
                return {
                    "response": "I was unable to find a relevant answer.",
                    "sources": [],
                    "disclaimer": None
                }

            # Extract disclaimer + sources from RAW output
            sources, disclaimer = self._extract_sources_from_response(raw_output)

            # Sanitize & post-process for final frontend response
            cleaned = self._sanitize_llm_response(raw_output)
            final_response = self._post_process_response(cleaned)

            logger.debug("Response after post-processing:\n%s", final_response)
            logger.debug("Sources extracted: %s | Disclaimer found: %s", sources, disclaimer)

            return {
                "response": final_response,
                "sources": sources,
                "disclaimer": disclaimer
            }

        except Exception as e:
            logger.error("Error in agent run: %s", e)
            return {
                "response": f"I encountered an error while processing your question: {e}",
                "error": str(e),
                "sources": []
            }

    # --- Response Processing ---
    def _sanitize_llm_response(self, response: str) -> str:
        """Ensure response is plain text and remove structured formats but keep markdown."""
        response = self._json_like_pattern.sub("", response)
        for pattern in self._structured_patterns:
            response = pattern.sub("", response)
        response = re.sub(r"^\s*{.*?}\s*$", "", response, flags=re.DOTALL)
        response = response.replace("\\n", "\n").replace("\\", "")
        response = re.sub(r"\n{3,}", "\n\n", response)
        return response.strip()

    def _post_process_response(self, response: str) -> str:
        """Remove sources and disclaimer from final user-facing text."""
        clean = self._sanitize_llm_response(response)
        clean = self._code_block_pattern.sub("", clean)
        clean = self._source_line_pattern.sub("", clean)

        clean = re.sub(r"^\s*\*\*Disclaimer\*\*:.*$", "", clean, flags=re.MULTILINE | re.IGNORECASE)
        clean = re.sub(r"^\s*Disclaimer:.*$", "", clean, flags=re.MULTILINE | re.IGNORECASE)

        clean = re.sub(r"```+|~~~+", "", clean)
        clean = re.sub(r"(\n*[-*_]{3,}\s*)+$", "", clean)
        clean = re.sub(r"\n{3,}", "\n\n", clean).strip()

        if len(clean) < 50:
            clean += (
                "\n\nNote: This response seems brief. "
                "If you need more detailed information, please rephrase your question."
            )
        return clean

    def _extract_sources_from_response(self, response: str) -> Tuple[List[Dict[str, Any]], Optional[str]]:
        """Extract structured sources and disclaimer from the LLM response text."""
        sources: List[Dict[str, Any]] = []
        disclaimer: Optional[str] = None

        # Check for disclaimer in the original response before any processing
        if "**Disclaimer**" in response:
            disclaimer = self._disclaimer_text
            logger.debug("Found **Disclaimer** in response, setting disclaimer text")
        else:
            disclaimer = None
            logger.debug("No **Disclaimer** found in response")

        text_to_parse = "\n".join(re.findall(r"```([\s\S]*?)```", response)) or response
        for match in self._pipe_pattern.finditer(text_to_parse):
            source_type, title, url = match.groups()
            sources.append({
                "type": "web_search" if "web" in source_type.lower() else "legal_doc",
                "title": title.strip(),
                "reference": source_type.strip(),
                "url": None if url.strip().lower() in ["n/a", "na"] else url.strip().rstrip("`"),
            })

        unique_sources = []
        seen = set()
        for s in sources:
            key = (s["title"], s["url"])
            if key not in seen:
                seen.add(key)
                unique_sources.append(s)

        logger.debug("=== DEBUG: Raw Response for Disclaimer Extraction ===\n%s", repr(response))
        logger.debug("Code blocks found:\n%s", repr(re.findall(r"```(?:[\s\S]*?)```", response)))

        return unique_sources, disclaimer

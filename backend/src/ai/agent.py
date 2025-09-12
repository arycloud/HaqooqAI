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
from langchain.schema import SystemMessage, HumanMessage, AIMessage
import re

from .tools import legal_document_search, web_search_tool
from .llm_providers import LLMProviderManager, LLMProvider
from ..config import GROQ_API_BASE, GROQ_MODEL, DEFAULT_GROQ_KEY

logger = logging.getLogger(__name__)


class LegalAssistantAgent:
    """Enhanced Legal Assistant Agent for Pakistani law queries"""

    def __init__(self):
        """Initializes the enhanced agent and its tools."""
        self.groq_api_base = GROQ_API_BASE
        self.groq_model = GROQ_MODEL
        self.default_groq_key = DEFAULT_GROQ_KEY

        # Initialize LLM provider manager
        self.provider_manager = LLMProviderManager()

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

                    "## CONTEXT RESOLUTION ##\n"
                    "When interpreting user follow-ups (e.g., \"expand on Step 1\", \"what about that\")"
                    "ALWAYS ground your answer in the most recent relevant assistant message provided in chat_history."
                    "If the user query is ambiguous, assume it refers to the last assistant response unless specified otherwise."
                    
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
                    "Source: Local Legal Doc | Pakistan Penal Code, 1860 | Section 302 | N/A\n"
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
        logger.info(f"_create_llm called with Groq key prefix: {groq_api_key[:6] + '...' if groq_api_key else 'None'}")
        return ChatOpenAI(
            model=self.groq_model,
            base_url=self.groq_api_base,
            api_key=groq_api_key,
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

            # recent_history = chat_history[-6:]
            # history_texts = []
            # for m in recent_history:
            #     if isinstance(m, tuple) and len(m) == 2:
            #         # (role, content)
            #         history_texts.append(m[1])
            #     elif isinstance(m, dict) and "content" in m:
            #         # {"role": "user", "content": "..."}
            #         history_texts.append(m["content"])
            #     elif hasattr(m, "content"):
            #         # LangChain Message objects (HumanMessage, AIMessage, SystemMessage)
            #         history_texts.append(m.content)
            # # Extract content from tuples (role, content)
            # history_text = " ".join(history_texts)
            # history_lower = history_text.lower()

            history_text = ' '.join([content for role, content in chat_history])
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

    async def run(
            self,
            query: str,
            groq_api_key: Optional[str] = None,
            gemini_api_key: Optional[str] = None,
            openai_api_key: Optional[str] = None,
            conversation_id: Optional[str] = None,
            user_id: Optional[int] = None,
        ) -> Dict[str, Any]:
        """
        Enhanced run method with multi-LLM routing and preprocessing.

        Args:
            query: User query
            groq_api_key: Optional user's Groq API key
            gemini_api_key: Optional user's Gemini API key
            openai_api_key: Optional user's OpenAI API key

        Returns:
            Dict containing response and metadata
        """
        try:
            # -------------------------
            # Query validation and LLM provider routing
            # -------------------------

            # Validate query length
            is_valid, query_tokens, error_msg = self.provider_manager.validate_query_length(query)
            if not is_valid:
                return {
                    "response": error_msg,
                    "sources": [],
                    "query_analysis": {"error": "query_too_long"},
                    "routing_info": {"error": error_msg}
                }

            # -------------------------
            # Fetch chat history (with semantic follow-up handling)
            # -------------------------
            chat_history = []
            if conversation_id and user_id:
                from ..services.context_manager import get_context_manager
                cm = get_context_manager()
                chat_history = await cm.get_chat_history(conversation_id, user_id, user_query=query)
                if not chat_history:
                    logger.info("ContextManager returned 0 messages for conversation=%s. conversation_id present=%s user_id=%s", conversation_id, bool(conversation_id), user_id)
                else:
                    logger.info("ContextManager returned %d messages for conversation=%s", len(chat_history), conversation_id)

            # --- DEBUG: log the chat history contents (preview) so we can see what ContextManager returned ---
            try:
                logger.info("Chat history preview (first 8 messages):")
                for i, m in enumerate(chat_history[:8]):
                    preview = (m.content[:240] + "...") if getattr(m, "content", "") and len(m.content) > 240 else getattr(m, "content", "")
                    logger.info("  CH[%d] role=%s preview=%s", i, m.__class__.__name__, preview)
            except Exception:
                logger.exception("Failed to log chat_history preview")

            # --- Build combined history text for fallback scope detection ---
            history_text = " ".join([getattr(m, "content", "") or "" for m in chat_history]).lower().strip()

            # Quick list of Pakistan terms to look for (keeps short/canonical tokens)
            pakistan_terms_quick = [
                "pakistan", "pakistani", "secp", "fbr", "nadra", "national tax", "companies act",
                "company", "ntn", "national assembly", "supreme court", "lahore", "karachi", "islamabad"
            ]

            # If _preprocess_query later reports "not Pakistan" but history contains Pakistan terms,
            # override to treat the query as Pakistan-related to avoid false scope rejections.
            # We'll do the override after we compute query_analysis (see below) — but explicitly
            # log the combined history so you can trace cases where original heuristics fail.
            logger.debug("Combined history text length=%d chars", len(history_text))

            # -------------------------
            # LLM Provider Routing Decision
            # -------------------------
            message_count = len(chat_history)
            routing_decision = self.provider_manager.determine_provider(
                query=query,
                message_count=message_count,
                user_groq_key=groq_api_key,
                user_gemini_key=gemini_api_key,
                user_openai_key=openai_api_key
            )

            logger.info(
                "LLM Routing: provider=%s, reason=%s, messages=%d, tokens=%d, user_key=%s",
                routing_decision.provider.value,
                routing_decision.reason,
                routing_decision.message_count,
                routing_decision.query_tokens,
                routing_decision.using_user_key
            )

            # -------------------------
            # Choose executor based on routing decision
            # -------------------------
            # Create LLM client based on routing decision
            try:
                if routing_decision.using_user_key:
                    # User provided their own key
                    if routing_decision.provider == LLMProvider.GROQ:
                        api_key = groq_api_key
                    elif routing_decision.provider == LLMProvider.GEMINI:
                        api_key = gemini_api_key
                    elif routing_decision.provider == LLMProvider.OPENAI:
                        api_key = openai_api_key
                    else:
                        api_key = None
                else:
                    # Use system default key
                    api_key = None

                llm_client = self.provider_manager.create_llm_client(routing_decision.provider, api_key)
                executor_to_use = self._create_agent_executor(llm_client)

            except Exception as e:
                logger.error(f"Failed to create LLM client for {routing_decision.provider.value}: {e}")
                # Fallback to default Groq if available
                if self.default_agent_executor:
                    executor_to_use = self.default_agent_executor
                    logger.info("Falling back to default Groq executor")
                else:
                    return {
                        "response": "Service temporarily unavailable. Please provide your own API key or try again later.",
                        "error": "No API key available",
                        "sources": [],
                        "routing_info": routing_decision.__dict__
                    }
            
            # -------------------------
            # Extract rewritten follow-up (if ContextManager injected one)
            # -------------------------
            rewritten_query = None
            matched_context_snippet = None
            for idx, m in enumerate(chat_history):
                if isinstance(m, SystemMessage) and m.content.startswith("Follow-up rewritten:"):
                    # prefer the next HumanMessage (ContextManager injects it)
                    if idx + 1 < len(chat_history) and isinstance(chat_history[idx + 1], HumanMessage):
                        rewritten_query = chat_history[idx + 1].content
                        matched_context_snippet = m.content
                        logger.info("Detected ContextManager rewrite (injected): %s", (matched_context_snippet[:200] + "...") if len(matched_context_snippet) > 200 else matched_context_snippet)
                        break
                if isinstance(m, SystemMessage) and m.content.startswith("Follow-up context"):
                    # capture context snippet for debugging
                    matched_context_snippet = m.content if not matched_context_snippet else matched_context_snippet

            # Use original query instead of rewritten query if the rewritten query is clearly not a real question
            # The context manager sometimes rewrites queries to analysis tasks like "Okay, let's see..."
            if rewritten_query and ("Okay, let's see" in rewritten_query or "The user's original question was" in rewritten_query):
                effective_query = query
                logger.info("Ignoring context manager rewrite as it appears to be an analysis task, using original query: %s", (query[:200] + "..." if len(query) > 200 else query))
            else:
                effective_query = rewritten_query or query
                
            if rewritten_query and effective_query != rewritten_query:
                logger.info("Using original query instead of context manager rewrite: %s", (query[:200] + "..." if len(query) > 200 else query))
            elif rewritten_query:
                logger.info("Using rewritten effective_query for preprocessing (preview): %s", (effective_query[:200] + "..." if len(effective_query) > 200 else effective_query))
            else:
                logger.debug("No rewrite found; using original user query for preprocessing")


            # -------------------------
            # Convert chat_history -> simple tuples for _preprocess_query and log preview
            # -------------------------
            def _msg_role(m):
                if isinstance(m, HumanMessage):
                    return "user"
                if isinstance(m, AIMessage):
                    return "assistant"
                return "system"

            history_tuples = [( _msg_role(m), getattr(m, "content", "") or "" ) for m in chat_history]
            logger.debug("Passing %d history tuples to _preprocess_query (preview=%s)", len(history_tuples), history_tuples[:3])

            
           # Safe call to _preprocess_query (it is synchronous in your code). Wrap in try to avoid breaking on unexpected types.
            try:
                query_analysis = self._preprocess_query(effective_query, history_tuples)
                # --- Fallback override for scope detection: if history contains Pakistan terms, force related ---
                if not query_analysis.get("is_pakistan_related", False) and history_text:
                    if any(tok in history_text for tok in pakistan_terms_quick):
                        logger.info(
                            "Scope-check override: Pakistan keywords found in history -> treating query as Pakistan-related"
                        )
                        query_analysis["is_pakistan_related"] = True
                        # choose strategy conservatively: if is_legal_query is True then local_first, else web_first
                        query_analysis["suggested_strategy"] = "local_first" if query_analysis.get("is_legal_query") else "web_first"

                logger.info(
                    "Query analysis: suggested_strategy=%s is_pakistan_related=%s is_time_sensitive=%s",
                    query_analysis.get("suggested_strategy"),
                    query_analysis.get("is_pakistan_related"),
                    query_analysis.get("is_time_sensitive")
                )
            except Exception as e:
                logger.error("Preprocess query failed: %s. Falling back to minimal analysis.", e)
                query_analysis = {
                    "is_pakistan_related": False,
                    "is_time_sensitive": False,
                    "is_legal_query": False,
                    "suggested_strategy": "web_first"
                }

            logger.info("Query analysis: suggested_strategy=%s is_pakistan_related=%s is_time_sensitive=%s",
                        query_analysis.get("suggested_strategy"),
                        query_analysis.get("is_pakistan_related"),
                        query_analysis.get("is_time_sensitive"))

            # Handle obvious scope issues early
            if query_analysis.get('suggested_strategy') == 'scope_check' and not query_analysis.get('is_pakistan_related'):
                return {
                    "response": "This seems unrelated to Pakistan.\n"
                                "If it's a follow-up, please reference it clearly (e.g., 'the previous Pakistan PM')."
                                " Otherwise, rephrase with Pakistan context.",
                    "sources": [],
                    "query_analysis": query_analysis,
                    "routing_info": {
                        "provider": routing_decision.provider.value,
                        "reason": "Scope check failed",
                        "message_count": routing_decision.message_count,
                        "query_tokens": routing_decision.query_tokens
                    }
                }

            # Add preprocessing context to the query (use effective_query)
            enhanced_context = f"""
                                Query Analysis:
                                    - Pakistan-related: {query_analysis['is_pakistan_related']}
                                    - Time-sensitive: {query_analysis['is_time_sensitive']}
                                    - Legal query: {query_analysis['is_legal_query']}
                                    - Suggested strategy: {query_analysis['suggested_strategy']}
                                """

            # -------------------------
            # Call agent executor; pass chat_history (LangChain messages) so agent keeps context
            # -------------------------
            response = await executor_to_use.ainvoke({
                        "question": effective_query,
                        "chat_history": chat_history
                    })

            output_string = response.get("output", "I was unable to find a relevant answer.")
            cleaned_output_string = re.sub(r"<tool_code>.*?</tool_code>", "", output_string, flags=re.DOTALL)
            cleaned_output_string = cleaned_output_string.strip()

            # Step 1: Extract sources and disclaimer
            sources, disclaimer = self._extract_sources_from_response(cleaned_output_string)

            # Step 2: Post-process response (without re-extraction)
            final_response = self._post_process_response(cleaned_output_string)
            

            return {
                "response": final_response,
                "sources": sources,
                "disclaimer": disclaimer,
                "query_analysis": query_analysis,
                "routing_info": {
                    "provider": routing_decision.provider.value,
                    "reason": routing_decision.reason,
                    "message_count": routing_decision.message_count,
                    "query_tokens": routing_decision.query_tokens,
                    "using_user_key": routing_decision.using_user_key,
                    "estimated_cost": routing_decision.estimated_cost
                }
            }

        except Exception as e:
            error_msg = str(e)

            # Handle Groq 500 Internal Server Error
            if "500" in error_msg and "Internal Server Error" in error_msg:
                logger.error(f"Groq service error: {error_msg}")
                return {
                    "response": (
                        "⚠️ The Groq service is temporarily unavailable (Internal Server Error). "
                        "Please try again in a few minutes."
                    ),
                    "error": "GroqInternalServerError",
                    "sources": []
                }

            # Handle Groq 401 Invalid API Key
            if "401" in error_msg and "Invalid API Key" in error_msg:
                logger.warning(f"Invalid Groq API key used: {error_msg}")
                return {
                    "response": (
                        "❌ The provided Groq API key is invalid or unauthorized. "
                        "Please check your API key and try again."
                    ),
                    "error": "InvalidAPIKey",
                    "sources": []
                }

            # Generic fallback
            logger.error(f"Error in agent run: {error_msg}")
            return {
                "response": (
                    f"I encountered an unexpected error while processing your question: {error_msg}. "
                    "Please try rephrasing your question or try again later."
                ),
                "error": error_msg,
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


    def _post_process_response(self, response: str) -> str:
        """Post-process the response for quality and consistency.
        Removes fenced source blocks, inline sources, and disclaimers so they don’t appear in the final response.
        """

        # Sanitize first (removes JSON artifacts, etc.)
        response = self._sanitize_llm_response(response)
        clean_content = response

        # 🚨 Remove fenced blocks that contain "Source:"
        clean_content = re.sub(
            r"```[\s\S]*?Source:.*?```",
            "",
            clean_content,
            flags=re.MULTILINE | re.IGNORECASE
        )

        # 🚨 Remove any standalone "Source:" lines (pipe or dash separated)
        clean_content = re.sub(
            r"^Source:\s*.+$",
            "",
            clean_content,
            flags=re.MULTILINE | re.IGNORECASE
        )

        # 🚨 Remove markdown headings like "### Sources:" or "## **Sources:**"
        clean_content = re.sub(
            r"^#{1,6}\s*\**Sources?\**:?\s*$",
            "",
            clean_content,
            flags=re.MULTILINE | re.IGNORECASE
        )

        # 🚨 Remove bare "Sources:" lines (just in case)
        clean_content = re.sub(
            r"^\s*Sources?:\s*$",
            "",
            clean_content,
            flags=re.MULTILINE | re.IGNORECASE
        )

        # 🚨 Remove disclaimer if present
        disclaimer_pattern = re.compile(
            r"\*\*Disclaimer\*\*:.+",
            re.IGNORECASE | re.DOTALL
        )
        clean_content = disclaimer_pattern.sub("", clean_content)

        # 🚨 Remove any stray code fences (``` or ~~~)
        clean_content = re.sub(r"```+", "", clean_content)
        clean_content = re.sub(r"~~~+", "", clean_content)

        # 🚨 Remove trailing horizontal rules (--- or *** at the end)
        clean_content = re.sub(r'(\n*[-*_]{3,}\s*)+$', '', clean_content, flags=re.MULTILINE)

        # Final cleanup of spacing
        clean_content = re.sub(r'\n{3,}', '\n\n', clean_content.strip())
        clean_content = clean_content.strip()

        # Quality check for too-short answers
        if len(clean_content) < 30:
            clean_content += (
                "\n\nNote: This response seems brief. "
                "If you need more detailed information, please rephrase your question or provide more specific details."
            )

        return clean_content

    
    def _extract_sources_from_response(self, response: str) -> tuple[list[dict], Optional[str]]:
        """Extract structured sources and disclaimer from the LLM response text."""
        sources = []
        disclaimer = None

        if not response:
            return sources, disclaimer

        # 1. Extract code block contents (if present)
        code_block_pattern = re.compile(r"```([\s\S]*?)```", re.MULTILINE)
        blocks = code_block_pattern.findall(response)

        # If no fenced block, fall back to full response
        text_to_parse = "\n".join(blocks) if blocks else response

        # 2. Regex for pipe-separated sources
        pipe_pattern = re.compile(
            r"^Source:\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*(.+?)$",
            re.MULTILINE | re.IGNORECASE
        )

        for match in pipe_pattern.finditer(text_to_parse):
            source_type, title, url = match.groups()
            sources.append({
                "type": "web_search" if "web" in source_type.lower() else "legal_doc",
                "title": title.strip(),
                "reference": source_type.strip(),
                "url": None if url.strip().lower() in ["n/a", "na"] else url.strip().rstrip("`"),
            })

        # 3. Regex for disclaimer
        disclaimer_pattern = re.compile(r"(\*\*Disclaimer\*\*:.+)", re.IGNORECASE | re.DOTALL)
        disclaimer_match = disclaimer_pattern.search(response)
        if disclaimer_match:
            disclaimer = disclaimer_match.group(1).strip()

        # 4. Deduplicate by (title, url)
        seen = set()
        unique_sources = []
        for s in sources:
            key = (s["title"], s["url"])
            if key not in seen:
                seen.add(key)
                unique_sources.append(s)

        return unique_sources, disclaimer

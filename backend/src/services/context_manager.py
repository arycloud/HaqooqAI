# src/services/context_manager.py

import os
import re
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple

import tiktoken
from dateutil.parser import isoparse
from sentence_transformers import SentenceTransformer, util
from langchain.schema import HumanMessage, AIMessage, SystemMessage, BaseMessage
from langchain_openai import ChatOpenAI

from ..config import DEFAULT_GROQ_KEY, GROQ_API_BASE, EMBEDDING_MODEL_NAME

logger = logging.getLogger(__name__)


class ContextManager:
    """
    Context manager for conversation history with semantic follow-up detection + rewrite.

    - get_chat_history(conversation_id, user_id, user_query="") returns a list[BaseMessage]
      that contains previous messages (converted to LangChain messages) and the current
      user message appended at the end.
    - If a follow-up rewrite is detected, a SystemMessage with the exact prefix
      "Follow-up rewritten: " will be injected (so agent.run can extract the rewrite).
    """

    def __init__(self, max_messages: int = 30, max_tokens: int = 6000):
        # Allow overrides from environment, but enforce sane minimums
        self.max_messages = max(1, int(os.getenv("MAX_CONTEXT_MESSAGES", max_messages)))
        self.max_tokens = max(512, int(os.getenv("MAX_CONTEXT_TOKENS", max_tokens)))  # min 512 tokens

        logger.debug("ContextManager init: max_messages=%d max_tokens=%d", self.max_messages, self.max_tokens)

        # Token encoder (use gpt-4 proxy encoding; fallback available)
        try:
            self.encoding = tiktoken.encoding_for_model("gpt-4")
        except Exception:
            self.encoding = tiktoken.get_encoding("cl100k_base")

        if os.getenv("CONTEXT_SUMMARIZER_ENABLED", "1") == "1":
            # Summarizer LLM (cheap/smaller model) - used for rewrites & summarization fallback
            try:
                self.summarizer = ChatOpenAI(
                    model=os.getenv("CONTEXT_SUMMARIZER_MODEL", "qwen/qwen3-32b"),
                    base_url=GROQ_API_BASE,
                    api_key=DEFAULT_GROQ_KEY,
                    temperature=float(os.getenv("SUMMARIZER_TEMP", "0.2")),
                    max_tokens=int(os.getenv("SUMMARIZER_MAX_TOKENS", "256")),
                )
                logger.info("Context summarizer initialized")
            except Exception as e:
                logger.error("Failed to initialize summarizer LLM: %s", e)
                self.summarizer = None
        else:
            self.summarizer = None
            logger.info("Context summarizer disabled via env var (CONTEXT_SUMMARIZER_ENABLED=0)")
        # Embedding model for semantic follow-up detection
        try:
            device = "cuda" if os.getenv("USE_CUDA", "0") == "1" else "cpu"
            self.embedder = SentenceTransformer(EMBEDDING_MODEL_NAME, device=device)
            logger.info(f"Semantic resolver embedder loaded: {EMBEDDING_MODEL_NAME} ({device})")
        except Exception as e:
            logger.error(f"Failed to initialize embedder '{EMBEDDING_MODEL_NAME}': {e}")
            self.embedder = None

        # Similarity thresholds (tunable via env)
        self.sim_followup_high = float(os.getenv("SIM_FOLLOWUP_HIGH", "0.72"))  # strong follow-up
        self.sim_followup_low = float(os.getenv("SIM_FOLLOWUP_LOW", "0.50"))    # definitely not
        # Max assistant messages considered for matching
        self.max_assistant_match = int(os.getenv("MAX_ASSISTANT_MATCH", "12"))

    def _get_supabase_client(self):
        """Get the appropriate supabase client (mock or real)"""
        # Import the global variable that gets replaced in testing mode
        import sys
        if 'src.main' in sys.modules:
            # If main module is loaded, use its supabase_client (which might be mock)
            main_module = sys.modules['src.main']
            if hasattr(main_module, 'supabase_client'):
                return main_module.supabase_client

        # Fallback to original import
        from ..database.supabase_client import supabase_client
        return supabase_client

    # -----------------------------
    # Internal helpers
    # -----------------------------
    async def _summarize_messages(self, messages: List[BaseMessage]) -> str:
        """Summarize a chunk of messages into a compact paragraph (fallback safe string on error)."""
        text = "\n".join(
            [f"{'User' if isinstance(m, HumanMessage) else 'Assistant'}: {m.content}" for m in messages]
        )
        if not self.summarizer:
            return "Earlier discussion was summarized due to length limits."
        try:
            resp = await self.summarizer.ainvoke([HumanMessage(
                content=f"Summarize this conversation briefly and concisely into one short paragraph:\n\n{text}"
            )])
            # langchain-openai typically returns an object with .content
            out = getattr(resp, "content", None)
            if not out:
                out = str(resp)
            return out.strip()
        except Exception as e:
            logger.error("Summarization failed: %s", e)
            return "Earlier discussion was summarized due to length limits."

    def _parse_iso_timestamp(self, ts) -> datetime:
        """Robust ISO timestamp parsing used for sorting messages."""
        if isinstance(ts, datetime):
            return ts
        if not ts:
            return datetime.min
        s = str(ts)
        try:
            return isoparse(s)
        except Exception:
            # try a tolerant ISO parse
            try:
                return datetime.fromisoformat(s.replace("Z", "+00:00"))
            except Exception:
                return datetime.min

    # -----------------------------
    # Semantic follow-up logic
    # -----------------------------
    def _assistant_messages_from_history(self, history: List[BaseMessage]) -> List[AIMessage]:
        """Return assistant messages (LangChain AIMessage) from the history list."""
        return [m for m in history if isinstance(m, AIMessage)]

    def _compute_similarity_best(self, query: str, assistant_msgs: List[AIMessage]) -> Tuple[Optional[int], float]:
        """
        Return (best_index, score) matching an assistant message (or (None, 0.0) if not computable).
        Uses SentenceTransformer util.cos_sim; returns highest cosine similarity.
        """
        if not self.embedder or not assistant_msgs:
            return None, 0.0

        try:
            # Limit number of messages encoded to avoid expensive calls
            candidates = assistant_msgs[-self.max_assistant_match :]
            query_emb = self.embedder.encode(query, convert_to_tensor=True)
            docs = [m.content for m in candidates]
            doc_embs = self.embedder.encode(docs, convert_to_tensor=True)
            cos_sims = util.cos_sim(query_emb, doc_embs)[0]  # 1 x n tensor
            best_idx = int(cos_sims.argmax().cpu().numpy().item())
            best_score = float(cos_sims[best_idx].cpu().numpy().item())
            # Map back to index in assistant_msgs
            real_index = len(assistant_msgs) - len(candidates) + best_idx
            return real_index, best_score
        except Exception as e:
            logger.debug("Embedding similarity computation failed: %s", e)
            return None, 0.0

    async def _maybe_rewrite_with_summarizer(self, user_query: str, context_text: str) -> Optional[str]:
        """
        Use summarizer LLM to produce a standalone rewrite.
        Returns rewritten query string or None on failure / NO decision.
        """
        if not self.summarizer:
            return None

        # Classification + rewrite prompt (concise)
        prompt = (
            "Decide whether the Query is a follow-up to the Context. "
            "If it is a follow-up, produce a single standalone, self-contained question that "
            "replaces pronouns and references. If it is NOT a follow-up, reply with exactly 'NO'.\n\n"
            f"Context:\n{context_text}\n\nQuery: {user_query}\n\nAnswer:"
        )
        try:
            resp = await self.summarizer.ainvoke([HumanMessage(content=prompt)])
            out = getattr(resp, "content", None) or str(resp)
            out = out.strip()
            # If model says NO explicitly
            if re.match(r"^no\.?$", out, flags=re.IGNORECASE):
                return None
            # Otherwise interpret first non-empty line as rewrite
            lines = [ln.strip() for ln in out.splitlines() if ln.strip()]
            if not lines:
                return None
            # if output looks like JSON, try to extract rewrite field
            first = lines[0]
            # If first line is too short (like "Yes") then try next line
            if len(first) < 5 and len(lines) > 1:
                return lines[1]
            return first
        except Exception as e:
            logger.debug("Summarizer rewrite failed: %s", e)
            return None


    def _semantic_resolve_followup(
        self, user_query: str, history: List[BaseMessage]
    ) -> Optional[BaseMessage]:
        """
        Resolve which past assistant message a follow-up query is referring to.
        Returns the best-matching AIMessage (assistant reply) or None.
        """
        if not self.embedder or not history or not user_query:
            logger.debug("Semantic resolver skipped: no embedder / empty history / empty query")
            return None

        # Lightweight quick check for follow-up-like wording (fast path)
        followup_terms = [
            "expand", "step", "that", "previous", "more on", "clarify", "elaborate",
            "what about", "follow up", "expand on", "can you expand", "details", "how about"
        ]
        if not any(term in user_query.lower() for term in followup_terms):
            logger.debug("No follow-up keywords detected in user query (quick exit)")
            return None

        # Only consider assistant messages as possible referents
        assistant_msgs = [m for m in history if isinstance(m, AIMessage)]
        if not assistant_msgs:
            logger.debug("No assistant messages available to match follow-up against")
            return None

        try:
            logger.debug(
                "Semantic follow-up: computing embeddings for query and %d assistant messages",
                len(assistant_msgs),
            )

            # embed query + messages (as tensors)
            query_emb = self.embedder.encode(user_query, convert_to_tensor=True)
            msg_texts = [m.content for m in assistant_msgs]
            msg_embs = self.embedder.encode(msg_texts, convert_to_tensor=True)

            # cosine similarity
            cos_sims = util.cos_sim(query_emb, msg_embs)[0]
            best_idx = int(cos_sims.argmax())
            best_score = float(cos_sims[best_idx].item())
            best_msg = assistant_msgs[best_idx]

            logger.info(
                "Follow-up resolver: matched query to assistant message index=%d score=%.4f preview=%s",
                best_idx,
                best_score,
                (best_msg.content[:140] + "...") if len(best_msg.content) > 140 else best_msg.content,
            )

            # threshold for accepting a match (tunable via env)
            SCORE_THRESHOLD = float(os.getenv("FOLLOWUP_RESOLVE_THRESHOLD", 0.45))
            if best_score < SCORE_THRESHOLD:
                logger.info(
                    "Resolved best_score %.4f below threshold %.2f — treating as fresh query",
                    best_score,
                    SCORE_THRESHOLD,
                )
                return None

            return best_msg

        except Exception as e:
            logger.error("Semantic follow-up resolution failed: %s", e, exc_info=True)
            return None


    # -----------------------------
    # Public API
    # -----------------------------
    async def get_chat_history(self, conversation_id: str, user_id: int, user_query: str = "") -> List[BaseMessage]:
        """
        Fetch conversation history as LangChain messages, with semantic follow-up detection & optional rewrite.
        Extensive debug logging included to diagnose missing-history issues.
        """
        def _local_parse_iso(ts) -> datetime:
            if isinstance(ts, datetime):
                return ts
            if not ts:
                return datetime.min
            s = str(ts)
            try:
                return isoparse(s)
            except Exception:
                try:
                    return datetime.fromisoformat(s.replace("Z", "+00:00"))
                except Exception:
                    return datetime.min

        def _normalize_short_followup(query: str) -> str:
            q = query.strip().lower()
            if re.fullmatch(r'^\d+$', q) or re.fullmatch(r'^[\.\-]*\d+[\.\-]*$', q):
                return f"step {int(re.sub(r'[^0-9]', '', q))}"
            m = re.match(r'^(?:n|s|step)\s*[\.\-:]*\s*(\d+)$', q)
            if m:
                return f"step {int(m.group(1))}"
            digits = re.findall(r'\d+', q)
            if len(digits) == 1 and len(q) <= 6:
                return f"step {int(digits[0])}"
            return query

        parse_fn = getattr(self, "_parse_iso_timestamp", _local_parse_iso)

        logger.debug("get_chat_history: conversation_id=%s user_id=%s user_query_present=%s",
                     conversation_id, user_id, bool(user_query))

        # 1) Resolve internal user id
        supabase_client = self._get_supabase_client()
        user_internal_id = supabase_client.get_user_internal_id(user_id)
        logger.debug("Resolved user_internal_id: %s for github_id=%s", user_internal_id, user_id)
        if not user_internal_id:
            logger.warning("User internal ID not found for GitHub ID %s", user_id)
            return []

        # 2) Fetch conversation and messages
        conversation = supabase_client.get_conversation_with_messages(conversation_id, user_internal_id)
        if not conversation:
            logger.debug("No conversation returned from supabase for conversation_id=%s user_internal_id=%s",
                         conversation_id, user_internal_id)
            return []
        messages = conversation.get("messages") or []
        logger.debug("Supabase returned %d messages for conversation_id=%s", len(messages), conversation_id)

        if not messages:
            logger.debug("Conversation has zero messages -> returning empty history")
            return []

        # 3) Sort oldest → newest and slice last N messages
        messages.sort(key=lambda m: parse_fn(m.get("created_at")))
        recent_messages = messages[-self.max_messages :] if self.max_messages > 0 else messages
        logger.debug("Using %d recent_messages after slicing max_messages=%d", len(recent_messages), self.max_messages)

        # 4) Convert to LangChain messages + token budgeting
        chat_history: List[BaseMessage] = []
        total_tokens = 0

        for msg in recent_messages:
            role = msg.get("role")
            content = msg.get("content", "") or ""

            if role == "user":
                lc_msg = HumanMessage(content=content)
            elif role == "assistant":
                lc_msg = AIMessage(content=content)
            else:
                lc_msg = SystemMessage(content=content)

            msg_str = f"{role}: {content}"
            try:
                msg_tokens = len(self.encoding.encode(msg_str))
            except Exception:
                msg_tokens = max(1, len(msg_str) // 4)

            logger.debug("Message candidate role=%s tokens=%d preview=%s", role, msg_tokens, (content[:120] + "...") if len(content) > 120 else content)

            if total_tokens + msg_tokens > self.max_tokens:
                logger.info("Token budget reached: stopping at cumulative tokens=%d (max=%d)", total_tokens, self.max_tokens)
                break

            chat_history.append(lc_msg)
            total_tokens += msg_tokens

        logger.debug("After gathering messages: chat_history_len=%d total_tokens=%d", len(chat_history), total_tokens)

        # 5) If near token budget, summarize older half of retained messages
        if total_tokens >= self.max_tokens * 0.9 and len(chat_history) > 6:
            logger.info("Context near token budget; summarizing older messages")
            midpoint = len(chat_history) // 2
            older_half = chat_history[:midpoint]
            newer_half = chat_history[midpoint:]
            try:
                summary_text = await self._summarize_messages(older_half)
                summary_msg = SystemMessage(content=f"Summary of earlier conversation: {summary_text}")
                chat_history = [summary_msg] + newer_half
                logger.debug("Inserted summary message and kept %d newer messages", len(newer_half))
            except Exception as e:
                logger.error("Summarization step failed: %s", e)

        # 6) Semantic follow-up detection & optional rewrite
        injected_messages: List[BaseMessage] = []

        if not user_query:
            logger.debug("No user_query provided -> returning chat_history (len=%d)", len(chat_history))
            return chat_history

        normalized_user_query = _normalize_short_followup(user_query) if user_query else user_query
        if normalized_user_query != (user_query or ""):
            logger.debug("Normalized short follow-up '%s' -> '%s'", user_query, normalized_user_query)

        # Load/fix follow-up hint list
        followup_hint_env = os.getenv(
            "FOLLOWUP_HINTS",
            "expand,step,that,previous,more on,clarify,elaborate,what about,another,also,can you,details"
        )
        followup_hint_terms = [t.strip() for t in followup_hint_env.split(",") if t.strip()]
        is_hint = any(term in normalized_user_query.lower() for term in followup_hint_terms)

        logger.debug("Follow-up hint check: is_hint=%s (terms=%s)", is_hint, followup_hint_terms[:6])

        # Build assistant messages list for matching
        assistant_msgs = [m for m in chat_history if isinstance(m, AIMessage)]

        # compute similarity
        matched_msg: Optional[AIMessage] = None
        best_score = 0.0
        try:
            if self.embedder and assistant_msgs:
                logger.debug("Computing embeddings for follow-up detection (assistants=%d)", len(assistant_msgs))
                query_emb = self.embedder.encode(normalized_user_query, convert_to_tensor=True)
                msg_texts = [m.content for m in assistant_msgs]
                msg_embs = self.embedder.encode(msg_texts, convert_to_tensor=True)
                cos_sims = util.cos_sim(query_emb, msg_embs)[0]
                best_idx = int(cos_sims.argmax().item())
                best_score = float(cos_sims[best_idx].item())
                logger.debug("Best semantic match idx=%s score=%.4f", best_idx, best_score)
                if best_score >= float(os.getenv("FOLLOWUP_SIM_HIGH", getattr(self, "sim_followup_high", 0.60))):
                    matched_msg = assistant_msgs[best_idx]
                    logger.info("High-confidence follow-up match found (score=%.4f)", best_score)
                elif best_score <= float(os.getenv("FOLLOWUP_SIM_LOW", getattr(self, "sim_followup_low", 0.35))):
                    logger.debug("Score <= low threshold (%.4f) -> treat as standalone", best_score)
                else:
                    logger.debug("Ambiguous semantic score %.4f", best_score)
            else:
                logger.debug("No embedder or no assistant messages (embedder=%s assistant_msgs=%d)", bool(self.embedder), len(assistant_msgs))
        except Exception as e:
            logger.error("Embedding similarity computation failed: %s", e, exc_info=True)

        # Decide rewrite via summarizer if matched or ambiguous + summarizer available
        rewrite_text: Optional[str] = None
        if matched_msg:
            if self.summarizer:
                try:
                    prompt = (
                        "You are an assistant that rewrites a user's follow-up into a standalone question. "
                        "Return only the rewritten question or 'NO' if not a follow-up.\n\n"
                        f"Assistant message:\n{matched_msg.content}\n\nUser follow-up:\n{user_query}\n\nRewrite:"
                    )
                    logger.debug("Calling summarizer to rewrite follow-up (high-confidence)")
                    rewrite_resp = await self.summarizer.ainvoke([HumanMessage(content=prompt)])
                    rewrite_text = getattr(rewrite_resp, "content", None)
                    if rewrite_text:
                        rewrite_text = rewrite_text.strip()
                        logger.info("Summarizer produced rewrite (len=%d)", len(rewrite_text))
                except Exception as e:
                    logger.error("Summarizer rewrite failed: %s", e)

        else:
            # ambiguous or no match: optionally try summarizer to classify/rewrite
            if self.summarizer:
                try:
                    recent_assist_block = "\n\n---\n\n".join([f"{i+1}. {m.content}" for i, m in enumerate(assistant_msgs[-6:])]) if assistant_msgs else ""
                    prompt = (
                        "Decide whether the user query is a follow-up and if so rewrite it into a standalone question. "
                        "Return the rewritten question or the original query unchanged.\n\n"
                        f"Recent assistant replies:\n{recent_assist_block}\n\nUser query:\n{user_query}\n\nReturn one line:"
                    )
                    logger.debug("Calling summarizer to classify ambiguous follow-up")
                    rewrite_resp = await self.summarizer.ainvoke([HumanMessage(content=prompt)])
                    candidate = getattr(rewrite_resp, "content", None)
                    if candidate:
                        candidate = candidate.strip()
                        if candidate.lower() != user_query.lower():
                            rewrite_text = candidate
                            logger.info("Summarizer classified query as follow-up and rewrote (len=%d)", len(candidate))
                except Exception as e:
                    logger.error("Summarizer classification failed: %s", e)

        # Build injected messages
        if matched_msg:
            score_str = f"{best_score:.3f}"
            injected_messages.append(SystemMessage(content=f"Follow-up context (matched assistant message, similarity={score_str}):\n{matched_msg.content}"))

        if rewrite_text:
            injected_messages.append(SystemMessage(content=f"Follow-up rewritten: {rewrite_text}"))
            injected_messages.append(HumanMessage(content=rewrite_text))
            logger.debug("Injected rewritten follow-up and system note")
        else:
            injected_messages.append(HumanMessage(content=user_query))
            logger.debug("Injected original user query (no rewrite)")

        final_history = chat_history + injected_messages if injected_messages else chat_history
        logger.debug("Returning final_history len=%d (chat_history=%d injected=%d) total_tokens=%d",
                     len(final_history), len(chat_history), len(injected_messages), total_tokens)
        # Log each returned message (role + preview) so we can audit follow-up resolution
        for i, m in enumerate(final_history):
            preview = (m.content[:240] + "...") if getattr(m, "content", "") and len(m.content) > 240 else getattr(m, "content", "")
            logger.info("  CM[%d] role=%s preview=%s", i, m.__class__.__name__, preview)
        return final_history



# Create module-level singleton to avoid repeated heavy loads
_context_manager_singleton = None

def get_context_manager():
    global _context_manager_singleton
    if _context_manager_singleton is None:
        _context_manager_singleton = ContextManager()
    return _context_manager_singleton
// This is the complete and corrected code for the MessageBubble.tsx component.
// It includes a new, robust parsing function and refactors the component to use it correctly.

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ExternalLink, Scale, User } from 'lucide-react';
import { formatMessageTime } from '@/utils/formatters'

interface Source {
  title: string;
  reference?: string;
  url?: string;
  type?: string;
  section?: string;
}

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  created_at: string;
  sources?: Source[];
}

interface MessageBubbleProps {
  message: Message;
}

// 1. Updated and more robust extraction function
const extractStructuredContent = (content: string, existingSources?: Source[]) => {
  if (!content || typeof content !== 'string') {
    return { cleanContent: '', sources: existingSources, notes: [] };
  }

  let cleanContent = content;
  let extractedSources: Source[] = [...(existingSources || [])];
  let notes: string[] = [];

  // Regex to match "Source: [title] - [url]" or "Source: [title]"
  const sourceRegex = /Source:\s*(.*?)(?:\s*—\s*Web Search)?\s*–\s*([^,]+)/g;
  let match;
  while ((match = sourceRegex.exec(cleanContent)) !== null) {
    const title = match[1].trim();
    const reference = match[2].trim();
    if (title && reference) {
      extractedSources.push({ type: 'web_search', title, reference });
    }
  }

  // Regex to match the disclaimer at the end
  const disclaimerRegex = /This is informational and not a substitute for formal legal advice\. Consult a qualified Pakistani lawyer for specific cases\./g;
  const disclaimerMatch = content.match(disclaimerRegex);
  if (disclaimerMatch) {
    notes.push(disclaimerMatch[0]);
  }

  // Clean the content by removing the extracted sources and disclaimer
  cleanContent = cleanContent
    .replace(sourceRegex, '')
    .replace(disclaimerRegex, '')
    .trim();

  // Final cleanup and formatting for Markdown
  cleanContent = cleanContent
    .replace(/\n\s*$/, '') // remove trailing newlines
    .replace(/\s+$/g, '') // remove trailing spaces
    .replace(/\.\s*$/, '.'); // ensure sentences end with a period

  return { cleanContent, sources: extractedSources, notes };
};

// 2. Main React Component
export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const extractionResult = isUser
    ? { cleanContent: message.content, sources: undefined, notes: [] }
    : extractStructuredContent(message.content, message.sources);

  const { cleanContent, sources: extractedSources, notes } = extractionResult;

  // Filter out invalid sources and duplicates
  const filteredSources = extractedSources?.filter((source) => {
    const title = source.title?.trim().toLowerCase() || "";
    return (
      title.length > 2 &&
      !title.includes("this information is current") &&
      !title.includes("for real-time updates") &&
      !title.includes("verify with official") &&
      !title.startsWith("note:") &&
      !title.startsWith("**disclaimer**")
    );
  });

  // Deduplicate sources by a unique key (title + reference)
  const uniqueSources = Array.from(
    new Map(filteredSources?.map((src) => [src.title + src.reference, src])).values()
  );

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-6 lg:mb-8`}>
      <div className={`max-w-4xl lg:max-w-5xl ${isUser ? "order-2" : "order-1"}`}>
        {/* Header (unchanged) */}
        <div className={`flex items-center space-x-3 mb-3 lg:mb-4 ${isUser ? "justify-end" : "justify-start"}`}>
          <div className={`flex items-center space-x-3 ${isUser ? "flex-row-reverse space-x-reverse" : ""}`}>
            <div className={`w-8 h-8 lg:w-10 lg:h-10 rounded-full flex items-center justify-center shadow-md ${
              isUser ? "bg-gradient-to-br from-purple-600 to-blue-600" : "bg-gradient-to-br from-gray-700 to-gray-800"
            }`}>
              {isUser ? <User className="w-4 h-4 lg:w-5 lg:h-5 text-white" /> : <Scale className="w-4 h-4 lg:w-5 lg:h-5 text-white" />}
            </div>
            <span className="text-base lg:text-lg font-semibold text-gray-900 dark:text-gray-100">
              {isUser ? "You" : "HaqooqAI"}
            </span>
            <span className="text-sm lg:text-base text-gray-500 dark:text-gray-400">
              {formatMessageTime(message.created_at)}
            </span>
          </div>
        </div>

        {/* Bubble */}
        <div className={`rounded-2xl p-6 lg:p-8 shadow-lg border-2 ${
          isUser
            ? "bg-gradient-to-br from-purple-600 to-blue-600 text-white border-purple-500/20"
            : "bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-slate-600"
        }`}>
          {/* Main Content */}
          {isUser ? (
            <p className="whitespace-pre-wrap text-base lg:text-lg leading-relaxed font-medium">
              {message.content}
            </p>
          ) : (
            <div className="prose prose-base lg:prose-lg max-w-none dark:prose-invert leading-relaxed">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{cleanContent}</ReactMarkdown>
            </div>
          )}

          {/* Sources + Notes */}
          {!isUser && (uniqueSources.length > 0 || notes.length > 0) && (
            <div className="mt-6 lg:mt-8">
              <div className="bg-gray-100/60 dark:bg-slate-700/40 rounded-2xl p-6 lg:p-8 border border-gray-200/40 dark:border-slate-600/40 shadow-sm">
                
                {/* Sources Box */}
                {uniqueSources.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center space-x-3 mb-5">
                      <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
                        <ExternalLink className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                      </div>
                      <h3 className="text-base lg:text-lg font-bold text-gray-800 dark:text-gray-200">
                        📄 Legal Sources &amp; References
                      </h3>
                    </div>
                    <div className="space-y-4">
                      {uniqueSources.map((source, index) => (
                        <div key={index}
                          className="bg-white/80 dark:bg-slate-800/60 rounded-xl p-4 lg:p-5 border border-gray-200/50 dark:border-slate-600/50 cursor-pointer hover:bg-white dark:hover:bg-slate-800/80 hover:shadow-md transition-all duration-200 group"
                          onClick={() => source.url && window.open(source.url, "_blank")}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="text-base lg:text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 mb-2">
                                {source.title}
                              </h4>
                              {source.section && (
                                <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                                  {source.section}
                                </p>
                              )}
                            </div>
                            {source.url && (
                              <div className="ml-4 flex-shrink-0">
                                <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-xl bg-gray-100 dark:bg-slate-700 flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30">
                                  <ExternalLink className="w-4 h-4 lg:w-5 lg:h-5 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Disclaimer Box */}
                {notes.length > 0 && (
                  <div className="bg-amber-50/80 dark:bg-amber-900/20 rounded-xl p-4 lg:p-5 border border-amber-200/50 dark:border-amber-700/30">
                    <div className="prose prose-base lg:prose-lg max-w-none dark:prose-invert">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {notes[notes.length - 1]}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
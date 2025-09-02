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
  disclaimer?: string;
}

interface MessageBubbleProps {
  message: Message;
}

export const extractStructuredContent = (
  content: string,
  existingSources?: Source[],
  disclaimer?: string
) => {
  if (!content || typeof content !== "string") {
    return { cleanContent: "", sources: existingSources || [], disclaimer: disclaimer || "" };
  }

  return {
    cleanContent: content.trim(),
    sources: existingSources || [],
    disclaimer: disclaimer || ""
  };
};

// Helper: strip any leftover inline "Source:" lines
function sanitizeContent(text: string): string {
  return text.replace(/^Source:.*(?:\nSource:.*)*/gmi, "").trim();
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const extractionResult = isUser
    ? { cleanContent: message.content, sources: [], disclaimer: "" }
    : extractStructuredContent(message.content, message.sources, message.disclaimer);

  const { cleanContent, sources: extractedSources, disclaimer } = extractionResult;

  // ✅ Sanitize content before rendering
  const sanitizedContent = sanitizeContent(cleanContent);

  // Filter out invalid sources
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

  // Deduplicate sources
  const uniqueSources = Array.from(
    new Map(filteredSources?.map((src) => [src.title + src.url, src])).values()
  );

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-6 lg:mb-8`}>
      <div className={`max-w-4xl lg:max-w-5xl ${isUser ? "order-2" : "order-1"}`}>
        {/* Header */}
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
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-2">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-2">{children}</ol>,
                  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                  h1: ({ children }) => <h1 className="text-2xl font-bold mb-4 mt-6 first:mt-0">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-xl font-bold mb-3 mt-5 first:mt-0">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-lg font-bold mb-2 mt-4 first:mt-0">{children}</h3>,
                  strong: ({ children }) => <strong className="font-bold text-gray-900 dark:text-gray-100">{children}</strong>,
                  em: ({ children }) => <em className="italic">{children}</em>,
                }}
              >
                {sanitizedContent}
              </ReactMarkdown>
            </div>
          )}

          {/* Sources + Disclaimer */}
          {!isUser && (uniqueSources.length > 0 || disclaimer) && (
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
                              {source.reference && (
                                <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                                  {source.reference}
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
                {disclaimer && (
                  <div className="bg-amber-50 dark:bg-amber-900/30 rounded-xl p-4 lg:p-5 border border-amber-200 dark:border-amber-700/50 shadow-sm">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-sm font-bold">!</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-2">
                          Important Notice
                        </h4>
                        <p className="text-sm text-amber-700 dark:text-amber-300 leading-relaxed">
                          {disclaimer}
                        </p>
                      </div>
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

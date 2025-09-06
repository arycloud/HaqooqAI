import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ExternalLink, Scale, User, Copy, Check, ThumbsUp, ThumbsDown } from 'lucide-react';
import { formatMessageTime } from '@/utils/formatters';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

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
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);

  const extractionResult = isUser
    ? { cleanContent: message.content, sources: [], disclaimer: "" }
    : extractStructuredContent(message.content, message.sources, message.disclaimer);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleFeedback = (type: 'up' | 'down') => {
    setFeedback(feedback === type ? null : type);
    // Here you could send feedback to your analytics service
  };

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
    <div className="flex items-start gap-4">
      {/* Avatar */}
      <div
        className="bg-center bg-no-repeat aspect-square bg-cover rounded-full w-10 h-10 flex-shrink-0"
        style={{
          backgroundImage: isUser
            ? `url("https://lh3.googleusercontent.com/aida-public/AB6AXuADvzRasd2oQf260RfVgglGC8fhX7-WzRtlxYF3WRTIXKtHwGHuMEV6N8QhdeTWbyC6iBdqS2ccwJoSge3NZXAFOAarGcRc-R_BglZRnTGAciUxTIaPsn7CKJji0lvH9mPq6zhTPSak7gDBI41d8myoVkr0tetdwqqNXg7BKajOOKotkC7EUXMldBI3tBlY_XLldTVdM6r0ZrUJLBTOKOFILkBw6FDNKodrxd1CsZqi4Ro07Lnn9XH8ORPCtgJUH-a-b9LLyUmaizQ")`
            : `url("https://lh3.googleusercontent.com/aida-public/AB6AXuCVhzVdaXxR_p3E3fMgkBz6ftAWMIQhZhO0eUcPg45HQcdqABNiD5l6e6QsmtMvjc9BB0OvnBD2tGF3S-xwL9gIbPYll5USP6s23Kp2ACsN2pS8-BL7xZuTvsl5GBDScDTeMDzmxcLqQHziqI-MLkoUT2iRVJlLOMarIe7usrFfE8Oajmt1IlKu5v4ugihjYpj3CPmESsk0vDWPxGgE5iZTajLFJF2ShkkHueRk2B1iNOrj3fEjiDXuT7ntwpGvAgSaQ5GOyihkuWw")`
        }}
      />

      {/* Message Content */}
      <div className={cn(
        "p-4 rounded-xl flex-1",
        isUser
          ? "bg-gradient-to-r from-pink-500/10 to-purple-500/10"
          : "bg-gradient-to-r from-purple-500/10 to-indigo-500/10"
      )}>
        <p className={cn(
          "text-sm font-bold leading-tight mb-2",
          isUser ? "text-pink-300" : "text-purple-300"
        )}>
          {isUser ? "You" : "HaqooqAI Assistant"}
        </p>
        {/* Modern Header with Avatar */}
        <div className={`flex items-start space-x-4 mb-4 ${isUser ? "justify-end flex-row-reverse space-x-reverse" : "justify-start"}`}>
          <div className={`relative flex-shrink-0 ${
            isUser ? "" : "group"
          }`}>
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 ${
              isUser 
                ? "bg-gradient-to-br from-blue-500 to-purple-600 hover:shadow-xl" 
                : "bg-gradient-to-br from-gray-700 to-gray-900 group-hover:from-blue-600 group-hover:to-purple-700 group-hover:shadow-xl"
            }`}>
              {isUser ? (
                <User className="w-5 h-5 text-white" />
              ) : (
                <Scale className="w-5 h-5 text-white" />
              )}
            </div>
            {/* Online indicator for AI */}
            {!isUser && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-900 shadow-sm">
                <div className="w-full h-full bg-green-400 rounded-full animate-pulse" />
              </div>
            )}
          </div>
          
          <div className={`flex flex-col ${isUser ? "items-end text-right" : "items-start text-left"} space-y-1`}>
            <div className="flex items-center space-x-2">
              <span className="text-base font-semibold text-gray-900 dark:text-gray-100">
                {isUser ? "You" : "HaqooqAI"}
              </span>
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {formatMessageTime(message.created_at)}
            </span>
          </div>
        </div>

        {/* Enhanced Message Bubble */}
        <div className={`relative group transition-all duration-300 ${
          isUser
            ? "ml-8"
            : "mr-8"
        }`}>
          {/* Bubble with modern design */}
          <div className={`relative rounded-3xl shadow-lg transition-all duration-300 group-hover:shadow-xl ${
            isUser
              ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white p-6 ml-auto"
              : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-6 border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm"
          }`}>
            {/* Modern content styling */}
            {isUser ? (
              <div className="prose prose-white max-w-none">
                <p className="whitespace-pre-wrap text-base leading-relaxed font-medium text-white mb-0">
                  {message.content}
                </p>
              </div>
            ) : (
              <div className="prose prose-gray dark:prose-invert max-w-none leading-relaxed">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ children }) => <p className="mb-4 last:mb-0 text-gray-700 dark:text-gray-300">{children}</p>,
                    ul: ({ children }) => <ul className="list-none pl-0 mb-4 space-y-3">{children}</ul>,
                    ol: ({ children }) => <ol className="list-none pl-0 mb-4 space-y-3">{children}</ol>,
                    li: ({ children }) => (
                      <li className="flex items-start space-x-3 text-gray-700 dark:text-gray-300">
                        <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mt-2 flex-shrink-0" />
                        <span className="leading-relaxed">{children}</span>
                      </li>
                    ),
                    h1: ({ children }) => (
                      <h1 className="text-2xl font-bold mb-4 mt-6 first:mt-0 text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-xl font-bold mb-3 mt-5 first:mt-0 text-gray-900 dark:text-gray-100">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-lg font-bold mb-2 mt-4 first:mt-0 text-gray-800 dark:text-gray-200">
                        {children}
                      </h3>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-bold text-gray-900 dark:text-gray-100 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {children}
                      </strong>
                    ),
                    em: ({ children }) => <em className="italic text-gray-600 dark:text-gray-400">{children}</em>,
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-gradient-to-b from-blue-500 to-purple-600 pl-4 italic text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/30 py-3 rounded-r-lg">
                        {children}
                      </blockquote>
                    ),
                    code: ({ children }) => (
                      <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md text-sm font-mono text-gray-800 dark:text-gray-200">
                        {children}
                      </code>
                    ),
                  }}
                >
                  {sanitizedContent}
                </ReactMarkdown>
              </div>
            )}

            {/* Tail for speech bubble effect */}
            <div className={`absolute top-6 w-4 h-4 transform rotate-45 ${
              isUser
                ? "right-[-8px] bg-gradient-to-br from-blue-500 to-purple-600"
                : "left-[-8px] bg-white dark:bg-gray-800 border-l border-t border-gray-200/50 dark:border-gray-700/50"
            }`} />
          </div>

          {/* Action Buttons */}
          <motion.div
            className={`flex items-center space-x-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
              isUser ? "justify-end" : "justify-start"
            }`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 0, y: 0 }}
            whileHover={{ opacity: 1 }}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-8 px-3 text-xs bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
            >
              {copied ? (
                <Check className="w-3 h-3 mr-1 text-green-600" />
              ) : (
                <Copy className="w-3 h-3 mr-1" />
              )}
              {copied ? 'Copied!' : 'Copy'}
            </Button>

            {!isUser && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFeedback('up')}
                  className={cn(
                    "h-8 px-3 text-xs bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all duration-200",
                    feedback === 'up' && "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                  )}
                >
                  <ThumbsUp className="w-3 h-3" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFeedback('down')}
                  className={cn(
                    "h-8 px-3 text-xs bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200",
                    feedback === 'down' && "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                  )}
                >
                  <ThumbsDown className="w-3 h-3" />
                </Button>
              </>
            )}
          </motion.div>

          {/* Enhanced Sources and Disclaimer Section */}
          {!isUser && (uniqueSources.length > 0 || disclaimer) && (
            <div className="mt-6">
              <div className="backdrop-blur-xl bg-gradient-to-br from-gray-50/90 to-blue-50/90 dark:from-gray-800/90 dark:to-blue-900/90 rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
                
                {/* Modern Sources Section */}
                {uniqueSources.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center space-x-3 mb-5">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                        <ExternalLink className="w-4 h-4 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        📚 Legal References
                      </h3>
                      <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent dark:from-gray-600" />
                    </div>
                    
                    <div className="grid gap-4">
                      {uniqueSources.map((source, index) => (
                        <div key={index}
                          className="group relative bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm rounded-xl p-5 border border-gray-200/50 dark:border-gray-600/50 cursor-pointer hover:bg-white dark:hover:bg-gray-700 hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300 transform hover:-translate-y-1"
                          onClick={() => source.url && window.open(source.url, "_blank")}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-2">
                              <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 line-clamp-2">
                                {source.title}
                              </h4>
                              {source.reference && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-3">
                                  {source.reference}
                                </p>
                              )}
                              {source.section && (
                                <div className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full">
                                  Section: {source.section}
                                </div>
                              )}
                            </div>
                            {source.url && (
                              <div className="ml-4 flex-shrink-0">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center group-hover:from-blue-500 group-hover:to-purple-600 transition-all duration-300 shadow-md group-hover:shadow-lg">
                                  <ExternalLink className="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-white transition-colors duration-300" />
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Hover glow effect */}
                          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/0 to-purple-600/0 group-hover:from-blue-500/5 group-hover:to-purple-600/5 transition-all duration-300" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Enhanced Disclaimer */}
                {disclaimer && (
                  <div className="relative bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-5 border border-amber-200/50 dark:border-amber-700/50 shadow-sm">
                    <div className="flex items-start space-x-4">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                        <span className="text-white text-sm font-bold">!</span>
                      </div>
                      <div className="flex-1 space-y-2">
                        <h4 className="text-base font-semibold text-amber-800 dark:text-amber-200">
                          ⚖️ Legal Notice
                        </h4>
                        <p className="text-sm text-amber-700 dark:text-amber-300 leading-relaxed">
                          {disclaimer}
                        </p>
                      </div>
                    </div>
                    
                    {/* Decorative elements */}
                    <div className="absolute top-2 right-2 w-2 h-2 bg-amber-400/30 rounded-full" />
                    <div className="absolute bottom-2 right-4 w-1 h-1 bg-amber-400/20 rounded-full" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

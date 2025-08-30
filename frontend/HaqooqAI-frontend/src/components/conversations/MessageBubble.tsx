import React from 'react'
import { User, Scale, ExternalLink } from 'lucide-react'
import { Message, Source } from '@/types/message'
import { formatMessageTime } from '@/utils/formatters'
import ReactMarkdown from 'react-markdown'
import remarkGfm from "remark-gfm"

const extractStructuredContent = (content: string, existingSources?: Source[]) => {
  if (!content || typeof content !== 'string') {
    return { cleanContent: '', sources: existingSources, notes: [] }
  }

  let cleanContent = content
  let extractedSources: Source[] = [...(existingSources || [])]
  let notes: string[] = []

  // --- [JSON Parsing Block Unchanged: same as your version] ---
  try {
    let jsonMatch = content.match(/({\s*"type"\s*:\s*".*?"\s*,[\s\S]*})/)
    let jsonStr = jsonMatch ? jsonMatch[0] : content
    const possibleJson = JSON.parse(jsonStr);

    if (possibleJson.type && ["container", "card", "infoBlock"].includes(possibleJson.type)) {
      const flattenContent = (node: any): string => {
        if (typeof node === 'string') return node;
        if (node.type === 'text' && node.value !== undefined) return node.value;
        if (node.content !== undefined) {
          if (typeof node.content === 'string') return node.content;
          if (Array.isArray(node.content)) return node.content.map(flattenContent).join('');
        }
        if (node.children !== undefined) {
          if (typeof node.children === 'string') return node.children;
          if (Array.isArray(node.children)) return node.children.map(flattenContent).join('\n\n');
        }
        return node.title || node.value || node.text || '';
      };

      cleanContent = flattenContent(possibleJson);

      const extractSources = (node: any): Source[] => {
        if (!node || typeof node !== 'object') return [];
        let sources: Source[] = [];
        const processMetadata = (metadata: any) => {
          const items = metadata.children || metadata.items || [];
          items.forEach((item: any) => {
            if ((item.label === 'Source' || item.label === 'Sources') && item.value) {
              sources.push({ type: 'web_search', title: item.value, reference: item.value });
            }
          });
        };
        if (node.type === 'metadata' || node.type === 'metadataBlock') processMetadata(node);
        if (node.children) {
          node.children.forEach((child: any) => {
            if (child.type === 'metadata' || child.type === 'metadataBlock') processMetadata(child);
            sources = [...sources, ...extractSources(child)];
          });
        }
        return sources;
      };

      const extractNotes = (node: any): string[] => {
        if (!node || typeof node !== 'object') return [];
        let noteItems: string[] = [];
        const processNote = (content: any) => {
          if (typeof content === 'string') noteItems.push(content);
          else if (content?.value) noteItems.push(content.value);
        };
        if (["disclaimerCard", "alertBox"].includes(node.type) ||
            (node.label && node.label.includes("Disclaimer"))) {
          if (node.content) processNote(node.content);
        }
        if (node.children) node.children.forEach((child: any) => {
          noteItems = [...noteItems, ...extractNotes(child)];
        });
        return noteItems;
      };

      extractedSources = [...extractSources(possibleJson), ...extractedSources];
      notes = [...extractNotes(possibleJson), ...notes];

      return { cleanContent, sources: extractedSources, notes };
    }
  } catch (e) {}

  // --- [Regex-based extraction for sources and disclaimer] ---
  const sourceStart = content.search(/Source:/i);
  if (sourceStart !== -1) {
    cleanContent = content.substring(0, sourceStart).trim();
    const rest = content.substring(sourceStart);
    const restLines = rest.split('\n');
    let sourceEndIndex = restLines.length;
    for (let i = 0; i < restLines.length; i++) {
      const trimmed = restLines[i].trim();
      if (!trimmed.startsWith('Source:') && trimmed !== '') {
        sourceEndIndex = i;
        break;
      }
    }
    const sourcesText = restLines.slice(0, sourceEndIndex).join('\n');
    const disclaimerText = restLines.slice(sourceEndIndex).join('\n').trim();

    // Extract sources
    const sourceMatches = [...sourcesText.matchAll(/Source:\s*(.+)/gi)];
    sourceMatches.forEach((match) => {
      let title = match[1].trim();
      let url = null;
      const urlMatch = title.match(/(https?:\/\/[^\s]+)/);
      if (urlMatch) {
        url = urlMatch[0];
        title = title.replace(url, '').trim();
      }
      // Clean title prefixes
      if (title.startsWith('Web Search – ')) {
        title = title.replace('Web Search – ', '');
      } else if (title.startsWith('Local Legal Docs – ')) {
        title = title.replace('Local Legal Docs – ', '');
      }
      extractedSources.push({
        type: 'web_search',
        title,
        reference: title,
        // url,
      });
    });

    if (disclaimerText) {
      notes.push(disclaimerText);
    }
  } else {
    // Check for disclaimer without sources
    const disclaimerPatterns = [
      /This is informational and not a substitute for formal legal advice\. Consult a qualified Pakistani lawyer for specific cases\./,
      // Add more patterns if needed
    ];
    for (let pattern of disclaimerPatterns) {
      const dMatch = content.match(pattern);
      if (dMatch) {
        cleanContent = content.replace(pattern, '').trim();
        notes.push(dMatch[0]);
        break;
      }
    }
  }

  // final cleanup
  cleanContent = cleanContent
    .replace(/\n\n+/g, '\n\n')
    .replace(/^\s*[-•]\s*/gm, '')
    .replace(/\.\s*$/, '')
    .replace(/\s+$/, '')
    .trim()

  return { cleanContent, sources: extractedSources.length > 0 ? extractedSources : undefined, notes }
}

interface MessageBubbleProps {
  message: Message
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const extractionResult = isUser
    ? { cleanContent: message.content, sources: undefined, notes: [] }
    : extractStructuredContent(message.content, message.sources);

  const { cleanContent, sources: extractedSources, notes } = extractionResult;

  // Ensure sources are filtered properly
  const displaySources = extractedSources?.length ? extractedSources : message.sources;

  const filteredSources = displaySources?.filter((source) => {
    const title = source.title?.trim().toLowerCase() || "";
    return (
      title.length > 2 && // 🚀 drop single letters like W, L, A
      !title.includes("this information is current") &&
      !title.includes("for real-time updates") &&
      !title.includes("verify with official") &&
      !title.startsWith("note:") &&
      !title.startsWith("**disclaimer**")
    );
  });

  let finalContent = (cleanContent || message.content || "").trim();
  finalContent = finalContent.replace(/\.\s*$/, "").trim();

  const normalizeContentForMarkdown = (text: string) => {
    let t = text;
    t = t.replace(/^\s*[•–—]\s+/gm, "- ");
    t = t.replace(/([^\n])\n(-\s)/g, "$1\n\n$2");
    t = t.replace(/\n{3,}/g, "\n\n");
    return t.trim();
  };

  const normalizedContent = normalizeContentForMarkdown(finalContent);

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
          {/* Content */}
          {isUser ? (
            <p className="whitespace-pre-wrap text-base lg:text-lg leading-relaxed font-medium">
              {message.content}
            </p>
          ) : (
            <div className="prose prose-base lg:prose-lg max-w-none dark:prose-invert leading-relaxed">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{normalizedContent}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* Sources */}
        {!isUser && filteredSources && filteredSources.length > 0 && (
          <div className="mt-6 lg:mt-8 bg-gray-100/60 dark:bg-slate-700/40 rounded-2xl p-6 lg:p-8 border border-gray-200/40 dark:border-slate-600/40 shadow-sm">
            <div className="flex items-center space-x-3 mb-5">
              <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
                <ExternalLink className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
              </div>
              <h3 className="text-base lg:text-lg font-bold text-gray-800 dark:text-gray-200">
                📄 Legal Sources &amp; References
              </h3>
            </div>
            <div className="space-y-4">
              {Array.from(
                new Map(filteredSources.map((src) => [src.title + (src.url ?? ""), src])).values()
              ).map((source, index) => (
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

        {/* Disclaimer */}
        {!isUser && notes.length > 0 && (
          <div className="mt-6 lg:mt-8 bg-amber-50/80 dark:bg-amber-900/20 rounded-2xl p-6 lg:p-8 border border-amber-200/50 dark:border-amber-700/30 shadow-sm">
            <div className="prose prose-base lg:prose-lg max-w-none dark:prose-invert">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {notes[notes.length - 1]}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

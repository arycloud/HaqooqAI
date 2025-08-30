import React from 'react'
import { User, Scale, ExternalLink, AlertCircle } from 'lucide-react'
import { Message, Source } from '@/types/message'
import { formatMessageTime } from '@/utils/formatters'
import ReactMarkdown from 'react-markdown'

// Enhanced helper function to extract and separate all structured content from backend response
const extractStructuredContent = (content: string, existingSources?: Source[]) => {
  if (!content || typeof content !== 'string') {
    return { cleanContent: '', sources: existingSources, notes: [] }
  }

  let cleanContent = content
  let extractedSources: Source[] = [...(existingSources || [])]
  let notes: string[] = []

  // 1. First, check if content is JSON (handle inconsistent backend responses)
  try {
    // Try to find JSON object in the string (in case it's embedded in text)
    let jsonMatch = content.match(/({\s*"type"\s*:\s*".*?"\s*,[\s\S]*})/)
    let jsonStr = jsonMatch ? jsonMatch[0] : content
    
    // Attempt to parse as JSON
    const possibleJson = JSON.parse(jsonStr);
    
    // Check if it's a structured response format we recognize
    if (possibleJson.type && (possibleJson.type === 'container' || possibleJson.type === 'card' || possibleJson.type === 'infoBlock')) {
      // This is structured JSON - extract content and sources
      const flattenContent = (node: any): string => {
        if (typeof node === 'string') return node;
        
        // Handle text nodes
        if (node.type === 'text' && node.value !== undefined) {
          return node.value;
        }
        
        // Handle content arrays
        if (node.content !== undefined) {
          if (typeof node.content === 'string') {
            return node.content;
          } else if (Array.isArray(node.content)) {
            return node.content.map(flattenContent).join('');
          }
        }
        
        // Handle children arrays
        if (node.children !== undefined) {
          if (typeof node.children === 'string') {
            return node.children;
          } else if (Array.isArray(node.children)) {
            return node.children.map(flattenContent).join('\n\n');
          }
        }
        
        // Fallback for other structures
        if (node.title || node.value || node.text) {
          return node.title || node.value || node.text;
        }
        
        return '';
      };

      cleanContent = flattenContent(possibleJson);
      
      // Extract sources from the structured format
      const extractSources = (node: any): Source[] => {
        if (!node || typeof node !== 'object') return [];
        
        let sources: Source[] = [];
        
        // Look for metadata blocks
        const processMetadata = (metadata: any) => {
          const items = metadata.children || metadata.items || [];
          
          items.forEach((item: any) => {
            if ((item.label === 'Source' || item.label === 'Sources') && item.value) {
              sources.push({
                type: 'web_search',
                title: item.value,
                reference: item.value
              });
            }
          });
        };
        
        if (node.type === 'metadata' || node.type === 'metadataBlock') {
          processMetadata(node);
        } else if (node.children) {
          // Check for metadata blocks in children
          node.children.forEach((child: any) => {
            if (child.type === 'metadata' || child.type === 'metadataBlock') {
              processMetadata(child);
            }
          });
          
          // Recursively check children
          node.children.forEach((child: any) => {
            sources = [...sources, ...extractSources(child)];
          });
        }
        
        return sources;
      };
      
      // Extract notes from structured format
      const extractNotes = (node: any): string[] => {
        if (!node || typeof node !== 'object') return [];
        
        let noteItems: string[] = [];
        
        // Look for disclaimer cards or note sections
        const processNote = (content: any) => {
          if (typeof content === 'string') {
            noteItems.push(content);
          } else if (content && typeof content === 'object') {
            if (content.value) {
              noteItems.push(content.value);
            } else if (content.content) {
              if (typeof content.content === 'string') {
                noteItems.push(content.content);
              } else if (Array.isArray(content.content)) {
                const text = content.content
                  .map((c: any) => c.value || c.text || c)
                  .filter(Boolean)
                  .join('');
                if (text) noteItems.push(text);
              }
            }
          }
        };
        
        if (node.type === 'disclaimerCard' || 
            node.type === 'alertBox' ||
            (node.label && node.label.includes('Disclaimer')) ||
            (node.title && node.title.includes('Disclaimer'))) {
          if (node.content) {
            processNote(node.content);
          } else if (node.children) {
            node.children.forEach((child: any) => {
              if (child.type === 'alertBox' && child.content) {
                processNote(child.content);
              }
            });
          }
        }
        
        // Recursively check children
        if (node.children) {
          node.children.forEach((child: any) => {
            noteItems = [...noteItems, ...extractNotes(child)];
          });
        }
        
        return noteItems;
      };
      
      // Apply structured extraction
      const jsonSources = extractSources(possibleJson);
      if (jsonSources.length > 0) {
        extractedSources = [...jsonSources, ...extractedSources];
      }
      
      const jsonNotes = extractNotes(possibleJson);
      if (jsonNotes.length > 0) {
        notes = [...jsonNotes, ...notes];
      }
      
      // We've processed the JSON, so we'll use the flattened content for the rest
      // No need to continue with regex-based extraction
      return {
        cleanContent,
        sources: extractedSources,
        notes
      };
    }
  } catch (e) {
    // Not JSON, continue with normal processing
  }

  // 2. ENHANCEMENT: Standardize list formatting for better Markdown rendering
  // Convert inconsistent list formats to proper Markdown lists
  cleanContent = cleanContent
    // Handle cases like "Key requirements include: - Company Type..."
    .replace(/([^.?!;:])(\s*- )/g, '$1\n$2')
    // Ensure proper spacing after colons before lists
    .replace(/([^.?!;:])(:\s*- )/g, '$1:\n$2')
    // Fix nested lists with proper indentation
    .replace(/(\n\s*- [^\n]+)(\n\s*- )/g, '$1\n  $2')
    // Ensure multiple spaces after hyphens are standardized
    .replace(/(\n\s*-)\s+/g, '\n- ')
    // Add newline before numbered lists
    .replace(/([^.?!;:])(\s*\d+\.\s)/g, '$1\n$2')
    // Ensure proper spacing for nested numbered lists
    .replace(/(\n\s*\d+\.[^\n]+)(\n\s*\d+\.\s)/g, '$1\n  $2')

  // 3. First, extract and remove all notes content to prevent it from being captured as sources
  const notePatterns = [
    // Markdown bold format
    /\*\*(?:Important\s+)?Notes?\s*:\*\*(.*?)(?=\n\n\*\*|\n\n[A-Z]|\n\n$|$)/gs,
    /\*\*Disclaimers?\s*:\*\*(.*?)(?=\n\n\*\*|\n\n[A-Z]|\n\n$|$)/gs,
    /\*\*Important\s*:\*\*(.*?)(?=\n\n\*\*|\n\n[A-Z]|\n\n$|$)/gs,
    /\*\*(?:Please\s+)?Note\s*:\*\*(.*?)(?=\n\n\*\*|\n\n[A-Z]|\n\n$|$)/gs,
    // Plain text format
    /(?:Important\s+)?Notes?\s*:(.*?)(?=\n\n[A-Z]|\n\n$|$)/gs,
    /Disclaimers?\s*:(.*?)(?=\n\n[A-Z]|\n\n$|$)/gs,
    /Important\s*:(.*?)(?=\n\n[A-Z]|\n\n$|$)/gs,
    /(?:Please\s+)?Note\s*:(.*?)(?=\n\n[A-Z]|\n\n$|$)/gs,
    // Section headers
    /(?:^|\n)(?:Important\s+)?Notes?\s*:?\s*\n(.*?)(?=\n\n[A-Z]|\n\n$|$)/gs,
    /(?:^|\n)Disclaimers?\s*:?\s*\n(.*?)(?=\n\n[A-Z]|\n\n$|$)/gs,
  ]
  let notesProcessed = false
  notePatterns.forEach(pattern => {
    if (notesProcessed) return
    try {
      const matches = content.match(pattern)
      if (matches && matches.length > 0) {
        notesProcessed = true
        const match = matches[0] // Only process the first match
        // Extract note content
        const noteContent = match.replace(/\*\*(?:Important\s+)?(?:Notes?|Disclaimers?|Important):\*\*|(?:Important\s+)?(?:Notes?|Disclaimers?):/g, '').trim()
        if (noteContent) {
          // Split multiple notes if they exist
          const individualNotes = noteContent.split(/\n\s*[-•]\s*/).filter(note => note.trim())
          if (individualNotes.length > 1) {
            // Multiple bullet points
            individualNotes.forEach(note => {
              const trimmedNote = note.trim()
              if (trimmedNote) {
                notes.push(trimmedNote)
              }
            })
          } else {
            // Single note
            notes.push(noteContent)
          }
        }

        // Remove from main content
        cleanContent = cleanContent.replace(match, '').trim()
      }
    } catch (error) {
      console.warn('Error processing note pattern:', pattern, error)
    }
  })

  // 4. Extract Sources/References section (after notes are removed)
  const sourcePatterns = [
    // Markdown bold format
    /\*\*(?:Legal\s+)?Sources?(?:\s+(?:and|&)\s+References?)?\s*:\*\*(.*?)(?=\n\n\*\*|\n\n[A-Z]|\n\n$|$)/gs,
    /\*\*References?\s*:\*\*(.*?)(?=\n\n\*\*|\n\n[A-Z]|\n\n$|$)/gs,
    /\*\*Legal\s+References?\s*:\*\*(.*?)(?=\n\n\*\*|\n\n[A-Z]|\n\n$|$)/gs,
    // Plain text format
    /(?:Legal\s+)?Sources?(?:\s+(?:and|&)\s+References?)?\s*:(.*?)(?=\n\n[A-Z]|\n\n$|$)/gs,
    /References?\s*:(.*?)(?=\n\n[A-Z]|\n\n$|$)/gs,
    // Section headers
    /(?:^|\n)(?:Legal\s+)?Sources?(?:\s+(?:and|&)\s+References?)?\s*:?\s*\n(.*?)(?=\n\n[A-Z]|\n\n$|$)/gs,
    /(?:^|\n)References?\s*:?\s*\n(.*?)(?=\n\n[A-Z]|\n\n$|$)/gs,
  ]

  let sourcesProcessed = false
  sourcePatterns.forEach(pattern => {
    if (sourcesProcessed) return
    try {
      const matches = content.match(pattern)
      if (matches && matches.length > 0) {
        sourcesProcessed = true
        const match = matches[0] // Only process the first match
        // Extract source content and parse individual sources
        const sourceContent = match.replace(/\*\*(?:Legal\s+)?(?:Sources?|References?):\*\*|(?:Sources?|References?):/g, '').trim()

        // Parse individual sources from the content
        const sourceLines = sourceContent.split('\n').filter(line => line.trim())
        sourceLines.forEach(line => {
          const trimmedLine = line.trim()
          if (trimmedLine) {
            // Skip lines that start with "Note:" as they belong to notes section
            if (trimmedLine.toLowerCase().startsWith('note:')) {
              return
            }

            // Clean up bullet points and numbering
            const cleanLine = trimmedLine.replace(/^[-•]\s*/, '').replace(/^\d+\.\s*/, '').trim()

            if (cleanLine && !cleanLine.toLowerCase().startsWith('note:')) {
              // Try to extract title and URL if present
              const urlMatch = cleanLine.match(/\[(.*?)\]\((.*?)\)/) // Markdown link format
              if (urlMatch) {
                extractedSources.push({
                  type: 'legal_doc',
                  title: urlMatch[1].trim(),
                  url: urlMatch[2].trim()
                })
              } else {
                // Check for plain URL at the end
                const urlAtEndMatch = cleanLine.match(/^(.*?)\s+(https?:\/\/\S+)$/)
                if (urlAtEndMatch) {
                  extractedSources.push({
                    type: 'legal_doc',
                    title: urlAtEndMatch[1].trim(),
                    url: urlAtEndMatch[2].trim()
                  })
                } else {
                  // Plain text source - but exclude note content
                  if (!cleanLine.toLowerCase().includes('this information is current') &&
                      !cleanLine.toLowerCase().includes('for real-time updates') &&
                      !cleanLine.toLowerCase().includes('verify with official')) {
                    extractedSources.push({
                      type: 'legal_doc',
                      title: cleanLine
                    })
                  }
                }
              }
            }
          }
        })

        // Remove from main content
        cleanContent = cleanContent.replace(match, '').trim()
      }
    } catch (error) {
      console.warn('Error processing source pattern:', pattern, error)
    }
  })

  // 5. Clean up the main content
  cleanContent = cleanContent
    .replace(/\n\n+/g, '\n\n') // Remove excessive line breaks
    .replace(/^\s*[-•]\s*/gm, '') // Remove bullet points from main content
    .replace(/Note:\s*This information is current.*?sources\.\*/gi, '') // Remove note content that might leak
    .replace(/This information is current.*?sources\.\*/gi, '') // Remove note content variations
    .replace(/\.\s*$/, '') // Remove trailing period at the end
    .replace(/\s+$/, '') // Remove trailing whitespace
    .trim()

  // 6. Remove any remaining section headers that might be left
  cleanContent = cleanContent.replace(/^\*\*[A-Z][^:]*:\*\*\s*$/gm, '').trim()

  // 7. Final cleanup - remove any trailing periods
  cleanContent = cleanContent.replace(/\.\s*$/, '').trim()

  return {
    cleanContent,
    sources: extractedSources.length > 0 ? extractedSources : undefined,
    notes
  }
}

interface MessageBubbleProps {
  message: Message
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  // Extract structured content from AI responses
  const extractionResult = isUser
    ? { cleanContent: message.content, sources: undefined, notes: [] }
    : extractStructuredContent(message.content, message.sources)

  const { cleanContent, sources: extractedSources, notes } = extractionResult

  // Use extracted sources or fall back to message sources, but avoid duplicates
  const displaySources = extractedSources && extractedSources.length > 0 ? extractedSources : message.sources

  // Filter out any note content that might have leaked into sources
  const filteredSources = displaySources?.filter(source => {
    const title = source.title?.toLowerCase() || ''
    return !title.includes('this information is current') &&
           !title.includes('for real-time updates') &&
           !title.includes('verify with official') &&
           !title.startsWith('note:')
  })

  // Fallback: if extraction resulted in empty content, use original content
  let finalContent = cleanContent.trim() || message.content

  // Additional cleanup for final content - remove any trailing periods
  finalContent = finalContent.replace(/\.\s*$/, '').trim()

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6 lg:mb-8`}>
      <div className={`max-w-4xl lg:max-w-5xl ${isUser ? 'order-2' : 'order-1'}`}>
        {/* Enhanced Message Header */}
        <div className={`flex items-center space-x-3 mb-3 lg:mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
          <div className={`flex items-center space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
            <div className={`w-8 h-8 lg:w-10 lg:h-10 rounded-full flex items-center justify-center shadow-md ${
              isUser ? 'bg-gradient-to-br from-purple-600 to-blue-600' : 'bg-gradient-to-br from-gray-700 to-gray-800'
            }`}>
              {isUser ? (
                <User className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
              ) : (
                <Scale className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
              )}
            </div>
            <span className="text-base lg:text-lg font-semibold text-gray-900 dark:text-gray-100">
              {isUser ? 'You' : 'HaqooqAI'}
            </span>
            <span className="text-sm lg:text-base text-gray-500 dark:text-gray-400">
              {formatMessageTime(message.created_at)}
            </span>
          </div>
        </div>

        {/* Enhanced Message Content */}
        <div className={`rounded-2xl p-6 lg:p-8 shadow-lg border-2 ${
          isUser
            ? 'bg-gradient-to-br from-purple-600 to-blue-600 text-white border-purple-500/20'
            : 'bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-slate-600'
        }`}>
          {isUser ? (
            <p className="whitespace-pre-wrap text-lg lg:text-xl leading-relaxed font-medium">{message.content}</p>
          ) : (
            <div className="prose prose-lg lg:prose-xl max-w-none dark:prose-invert">
              <ReactMarkdown
                components={{
                  // Enhanced markdown rendering with better styling and larger text
                  p: ({ children }) => <p className="mb-4 lg:mb-5 last:mb-0 text-lg lg:text-xl leading-relaxed">{children}</p>,
                  ul: ({ children }) => {
                    // Filter out empty children to prevent empty lists
                    const filteredChildren = React.Children.toArray(children).filter(child => {
                      if (React.isValidElement(child) && child.type === 'li') {
                        const childContent = React.Children.toArray(child.props.children)
                        return childContent.some(c => typeof c === 'string' ? c.trim() : true)
                      }
                      return true
                    })
                    return filteredChildren.length > 0 ? (
                      <ul className="list-disc list-inside mb-4 lg:mb-5 space-y-2 text-lg lg:text-xl pl-5">{filteredChildren}</ul>
                    ) : null
                  },
                  ol: ({ children }) => {
                    // Filter out empty children to prevent empty lists
                    const filteredChildren = React.Children.toArray(children).filter(child => {
                      if (React.isValidElement(child) && child.type === 'li') {
                        const childContent = React.Children.toArray(child.props.children)
                        return childContent.some(c => typeof c === 'string' ? c.trim() : true)
                      }
                      return true
                    })
                    return filteredChildren.length > 0 ? (
                      <ol className="list-decimal list-inside mb-4 lg:mb-5 space-y-2 text-lg lg:text-xl pl-5">{filteredChildren}</ol>
                    ) : null
                  },
                  li: ({ children }) => {
                    // Only render list items that have non-empty content
                    const hasContent = React.Children.toArray(children).some(child =>
                      typeof child === 'string' ? child.trim() : true
                    )
                    return hasContent ? (
                      <li className="text-gray-700 dark:text-gray-300 leading-relaxed pl-2">
                        {children}
                      </li>
                    ) : null
                  },
                  strong: ({ children }) => <strong className="font-semibold text-gray-900 dark:text-gray-100">{children}</strong>,
                  em: ({ children }) => <em className="italic">{children}</em>,
                  code: ({ children }) => (
                    <code className="bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded-lg text-base lg:text-lg font-mono text-gray-800 dark:text-gray-200">{children}</code>
                  ),
                  pre: ({ children }) => (
                    <pre className="bg-gray-100 dark:bg-slate-700 p-4 lg:p-5 rounded-xl overflow-x-auto text-base lg:text-lg font-mono">{children}</pre>
                  ),
                }}
              >
                {finalContent}
              </ReactMarkdown>
            </div>
          )}

          {/* Nested Information Container - Single container for both Sources and Notes */}
          {/* Nested Information Container */}
          {!isUser && (notes.length > 0 || (filteredSources && filteredSources.length > 0)) && (
            <div className="mt-6 lg:mt-8">
              <div className="bg-gray-100/60 dark:bg-slate-700/40 rounded-2xl p-6 lg:p-8 border border-gray-200/40 dark:border-slate-600/40 shadow-sm">

                {/* Sources Section */}
                {filteredSources && filteredSources.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center space-x-3 mb-5">
                      <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
                        <ExternalLink className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                      </div>
                      <h3 className="text-base lg:text-lg font-bold text-gray-800 dark:text-gray-200">
                        📄 Legal Sources & References
                      </h3>
                    </div>

                    <div className="space-y-4">
                      {Array.from(
                        new Map(filteredSources.map(src => [src.title + src.url, src])).values()
                      ).map((source, index) => (
                        <div
                          key={index}
                          className="bg-white/80 dark:bg-slate-800/60 rounded-xl p-4 lg:p-5 border border-gray-200/50 dark:border-slate-600/50 cursor-pointer hover:bg-white dark:hover:bg-slate-800/80 hover:shadow-md transition-all duration-200 group"
                          onClick={() => source.url && window.open(source.url, '_blank')}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="text-base lg:text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200 mb-2">
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
                                <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-xl bg-gray-100 dark:bg-slate-700 flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors duration-200">
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

                {/* Disclaimer Section - Show only once */}
                {notes.length > 0 && (
                <div className="bg-amber-50/80 dark:bg-amber-900/20 rounded-xl p-4 lg:p-5 border border-amber-200/50 dark:border-amber-700/30">
                  <div className="prose prose-base lg:prose-lg max-w-none dark:prose-invert">
                    <ReactMarkdown>
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
  )
}
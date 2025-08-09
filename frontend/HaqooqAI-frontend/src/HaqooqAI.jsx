import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './HaqooqAI.css';

const HaqooqAI = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm HaqooqAI, your AI-powered legal assistant for Pakistani law. How can I help you today?",
      isBot: true,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      text: inputValue,
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue(""); // Clear input immediately
    setIsTyping(true);

    try {
      const response = await fetch("https://ary91-haqooqai-backend.hf.space/ask/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ query: userMessage.text })
      });
      const data = await response.json();
      const botMessage = {
        id: messages.length + 2,
        text: data.answer || "Sorry, I couldn't get a response.",
        isBot: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const botMessage = {
        id: messages.length + 2,
        text: "Error connecting to backend. Please try again later.",
        isBot: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    }
    setIsTyping(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-10 opacity-50">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/20 backdrop-blur-xl border-b border-white/10 shadow-2xl">
        <nav className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-0 transition-all duration-300">
                  <span className="text-white font-bold text-xl">H</span>
                </div>
                <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
              </div>
              <div>
                <span className="text-3xl font-bold bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-400 bg-clip-text text-transparent">
                  HaqooqAI
                </span>
                <div className="text-sm text-gray-400 font-medium">Legal Assistant</div>
              </div>
            </div>
            <a
              href="https://github.com/arycloud/HaqooqAI"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative inline-flex items-center justify-center p-3 px-6 py-3 overflow-hidden font-bold text-white transition duration-300 ease-out border-2 border-purple-500 rounded-full shadow-md group"
            >
              <span className="absolute inset-0 flex items-center justify-center w-full h-full text-white duration-300 -translate-x-full bg-gradient-to-r from-purple-500 to-pink-500 group-hover:translate-x-0 ease">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </span>
              <span className="absolute flex items-center justify-center w-full h-full text-purple-500 transition-all duration-300 transform group-hover:translate-x-full ease">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                GitHub
              </span>
              <span className="relative invisible">GitHub</span>
            </a>
          </div>
        </nav>
      </header>

      {/* Hero Section with Proper Spacing */}
      <div className="relative z-10 pt-10 pb-8">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-8">
            <div className="animate-fade-in">
              <h1 className="text-5xl md:text-7xl font-black mb-8 leading-tight">
                <span className="block bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-400 bg-clip-text text-transparent animate-pulse">
                  HaqooqAI
                </span>
                <span className="block text-3xl md:text-5xl bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent font-light">
                  Your AI Legal Assistant
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed font-light">
                Ask clear, trusted answers about Pakistani law with a modern, delightful chat experience.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Massive Chat Interface */}
      <div className="relative z-20 flex justify-center pb-32">
        <div className="w-full max-w-8xl px-2 sm:px-4 lg:px-12">
          <div className="relative">
            {/* Glowing border effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 rounded-3xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>

            <div className="relative bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden" style={{maxWidth: '100%', width: '100%', margin: '0 auto'}}>
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 px-8 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-white font-bold text-2xl mb-1">Your AI Legal Assistant</h2>
                  <p className="text-white/80 text-lg">Ask anything about Pakistani law</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-4 h-4 bg-green-400 rounded-full animate-pulse"></div>
                    <div className="absolute inset-0 w-4 h-4 bg-green-400 rounded-full animate-ping opacity-75"></div>
                  </div>
                  <span className="text-white text-lg font-semibold">Online</span>
                </div>
              </div>
            </div>

            {/* Messages Container - Much Bigger */}
            <div className="h-[500px] overflow-y-auto p-8 space-y-6 bg-gradient-to-b from-transparent to-black/20">
              {messages.map((message, index) => (
                <div key={index} className={`flex ${message.isBot ? 'justify-start' : 'justify-end'} animate-fade-in`}>
                  <div className={`w-full px-8 py-6 rounded-2xl shadow-xl ${
                    message.isBot 
                      ? 'bg-white/90 backdrop-blur-sm border border-white/30 text-gray-800' 
                      : 'bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 text-white shadow-lg'
                  }`} style={message.isBot ? {overflowX: 'auto'} : {}}>
                    {message.isBot ? (
                      <>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {message.text && typeof message.text === 'string' 
                            ? message.text.split('Source:')[0].trim()
                            : message.text}
                        </ReactMarkdown>
                        {message.text && typeof message.text === 'string' && message.text.includes('Source:') && (
                          <div className="mt-4 bg-gray-100/90 backdrop-blur-sm rounded-xl p-4">
                            <p className="text-gray-600 text italic">
                              <b>Source:</b> {message.text.split('Source:')[1].trim()}
                            </p>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-base leading-relaxed font-medium">{message.text}</p>
                    )}
                    <p className={`text-sm mt-3 ${message.isBot ? 'text-gray-500' : 'text-white/70'}`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start animate-fade-in">
                  <div className="bg-white/90 backdrop-blur-sm border border-white/30 px-6 py-4 rounded-2xl shadow-xl">
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 bg-gradient-to-r from-yellow-400 to-pink-500 rounded-full animate-bounce"></div>
                      <div className="w-3 h-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Enhanced Input Section */}
            <div className="p-8 bg-black/20 backdrop-blur-sm border-t border-white/10">
              <div className="flex space-x-4">
                <div className="flex-1 relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your legal question... (Shift+Enter for newline)"
                    className="relative w-full px-6 py-4 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-2xl focus:border-white/40 focus:outline-none resize-none transition-all duration-300 text-white placeholder-gray-300 text-lg"
                    rows="1"
                    style={{ minHeight: '60px', maxHeight: '140px' }}
                  />
                </div>
                <button
                  onClick={handleSend}
                  disabled={!inputValue.trim()}
                  className={`group relative inline-flex items-center justify-center p-4 overflow-hidden font-bold transition duration-300 ease-out rounded-2xl shadow-xl ${
                    inputValue.trim()
                      ? 'text-white hover:scale-110 transform hover:shadow-2xl'
                      : 'text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {inputValue.trim() && (
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600"></span>
                  )}
                  {!inputValue.trim() && (
                    <span className="absolute inset-0 w-full h-full bg-gray-600"></span>
                  )}
                  <span className="relative flex items-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </span>
                </button>
              </div>
              <p className="text-sm text-gray-400 mt-4 text-center font-medium">
                Press Enter to send, Shift+Enter for new line
              </p>
            </div>
          </div>
        </div>
      </div>
      </div>
      {/* Footer */}
      <footer className="relative z-10 bg-black/40 backdrop-blur-xl border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-300 text-lg mb-3">© 2025 HaqooqAI. All rights reserved.</p>
          <p className="text-gray-500">Built with care using React + Vite.</p>
        </div>
      </footer>
    </div>
    
  );
};

export default HaqooqAI;
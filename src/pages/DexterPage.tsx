import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Loader2, RefreshCw } from 'lucide-react';

interface AgentEvent {
  type: string;
  answer?: string;
  message?: string;
  data?: any;
  [key: string]: any;
}

interface Message {
  id: string;
  role: 'user' | 'agent';
  content: string;
  events?: AgentEvent[];
}

export const DexterPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    const agentMsgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: agentMsgId, role: 'agent', content: '', events: [] }]);

    try {
      const response = await fetch('/api/dexter/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMsg.content, sessionKey: 'stocklens-web-session' }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) throw new Error('No readable stream available');
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      
      let currentContent = '';
      let currentEvents: AgentEvent[] = [];

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.replace('data: ', '').trim();
              if (dataStr) {
                try {
                  const event = JSON.parse(dataStr) as AgentEvent;
                  if (event.type === 'done') {
                    currentContent = event.answer || "I'm sorry, I couldn't generate a response. Please try rephrasing or using a different model.";
                  } else if (event.type === 'error') {
                    currentContent = `Error: ${event.message}`;
                  } else {
                    currentEvents.push(event);
                  }
                  
                  // Update the agent message in state
                  setMessages(prev => prev.map(msg => 
                    msg.id === agentMsgId 
                      ? { ...msg, content: currentContent, events: [...currentEvents] } 
                      : msg
                  ));
                } catch (e) {
                  console.error('Error parsing SSE event:', e);
                }
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => prev.map(msg => 
        msg.id === agentMsgId 
          ? { ...msg, content: 'Sorry, I encountered an error communicating with the server.' } 
          : msg
      ));
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col h-[calc(100vh-64px)]">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
          <Bot className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dexter AI</h1>
          <p className="text-sm text-gray-500">Intelligent financial assistant powered by StockLens data</p>
        </div>
      </div>

      <div className="flex-1 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
              <Bot className="h-12 w-12 text-gray-300 mb-3" />
              <p className="text-lg font-medium text-gray-500">Welcome to Dexter</p>
              <p className="text-sm">Ask me about stocks, financials, SEC filings, or market trends.</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'agent' && (
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <Bot className="h-4 w-4" />
                  </div>
                )}
                
                <div className={`max-w-[80%] rounded-2xl px-5 py-3 ${
                  msg.role === 'user' 
                    ? 'bg-emerald-600 text-white rounded-tr-none' 
                    : 'bg-gray-50 border border-gray-100 text-gray-800 rounded-tl-none'
                }`}>
                  {/* Event stream preview (thinking) */}
                  {msg.role === 'agent' && msg.events && msg.events.length > 0 && !msg.content && (
                    <div className="text-xs text-gray-500 mb-2 font-mono flex items-center gap-2">
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      {msg.events[msg.events.length - 1].type}...
                    </div>
                  )}
                  
                  {/* Final content */}
                  {msg.content ? (
                    <div className="whitespace-pre-wrap font-sans text-sm">{msg.content}</div>
                  ) : (
                    msg.role === 'agent' && isTyping && (
                      <div className="flex gap-1.5 items-center h-5">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"></span>
                      </div>
                    )
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <div className="p-4 bg-gray-50 border-t border-gray-100">
          <form onSubmit={handleSubmit} className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isTyping}
              placeholder="Ask Dexter about stocks..."
              className="w-full bg-white border border-gray-300 rounded-full px-5 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="absolute right-2 p-2 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isTyping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </form>
          <div className="text-center mt-2">
            <p className="text-[10px] text-gray-400 font-medium">Dexter can make mistakes. Consider verifying important information.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

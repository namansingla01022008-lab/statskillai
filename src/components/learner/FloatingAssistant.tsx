import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { StorageService } from '../../services/storageService';
import { GeminiService } from '../../services/geminiService';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { ChatMessage } from '../../types';
import {
  MessageSquare,
  X,
  Send,
  Trash2,
  Sparkles,
  Bot,
  User,
  ShieldAlert,
  WifiOff,
} from 'lucide-react';

export const FloatingAssistant: React.FC = () => {
  const { currentUser, activeProfile, domainScores, language, t } = useApp();
  const { isOnline } = useNetworkStatus();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    StorageService.getChatHistory(currentUser.id)
  );
  const scrollRef = useRef<HTMLDivElement>(null);

  // Sync messages when user changes
  useEffect(() => {
    setMessages(StorageService.getChatHistory(currentUser.id));
  }, [currentUser.id]);

  useEffect(() => {
    if (isOpen && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  // Handle send message
  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: `chat-u-${Date.now()}`,
      userId: currentUser.id,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    StorageService.saveChatMessage(userMsg);
    setInput('');
    setLoading(true);

    try {
      const gapAnalysis = StorageService.getGapAnalysis(currentUser.id);
      const recentGaps = gapAnalysis ? gapAnalysis.gaps.map((g) => `${g.domain}: ${g.skill}`) : [];

      const learnerContext = {
        name: currentUser.name,
        profileType: currentUser.profileType || 'Student',
        careerGoal: activeProfile?.careerGoal || 'Advance professional competencies under NEP-2020.',
        domainScores,
        recentGaps,
      };

      const { response } = await GeminiService.chatWithAssistant(
        newHistory.map((m) => ({ role: m.role, content: m.content })),
        learnerContext,
        language
      );

      const botMsg: ChatMessage = {
        id: `chat-b-${Date.now()}`,
        userId: currentUser.id,
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
      };

      const updatedHistory = [...newHistory, botMsg];
      setMessages(updatedHistory);
      StorageService.saveChatMessage(botMsg);
    } catch (err) {
      console.error('Chat error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    StorageService.clearChatHistory(currentUser.id);
    setMessages([]);
  };

  const starterQueries = [
    t('sampleQuery1'),
    t('sampleQuery2'),
    t('sampleQuery3'),
  ];

  // Helper to render simple markdown formatting (bold, bullet points, headers)
  const renderFormatted = (content: string) => {
    return content.split('\n').map((line, idx) => {
      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} className="font-bold text-slate-900 text-xs mt-1.5 mb-0.5">
            {line.replace('### ', '')}
          </h4>
        );
      }
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return (
          <li key={idx} className="ml-4 list-disc text-slate-800 my-0.5">
            {formatInline(line.slice(2))}
          </li>
        );
      }
      if (line.match(/^\d+\.\s/)) {
        return (
          <li key={idx} className="ml-4 list-decimal text-slate-800 my-0.5">
            {formatInline(line.replace(/^\d+\.\s/, ''))}
          </li>
        );
      }
      if (!line.trim()) {
        return <div key={idx} className="h-1.5" />;
      }
      return (
        <p key={idx} className="my-0.5">
          {formatInline(line)}
        </p>
      );
    });
  };

  const formatInline = (str: string) => {
    // Basic bold **text** parsing
    const parts = str.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold text-slate-950">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="fixed bottom-5 right-5 z-40">
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2.5 px-4 py-3 rounded-full bg-teal-700 hover:bg-teal-800 text-white shadow-xl hover:shadow-2xl transition-all border border-teal-600 focus:ring-4 focus:ring-teal-400 group"
          aria-label="Open AI Learning Assistant"
        >
          <div className="relative">
            <Bot className="w-5 h-5 text-white" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-300 animate-pulse" />
          </div>
          <span className="text-xs font-bold tracking-wide hidden sm:inline">
            StatSkill Assistant
          </span>
        </button>
      )}

      {/* Expanded Chat Drawer */}
      {isOpen && (
        <div
          className="w-[92vw] sm:w-96 h-[520px] max-h-[85vh] bg-white rounded-xl shadow-2xl border border-slate-300 flex flex-col overflow-hidden animate-in fade-in-50 slide-in-from-bottom-5"
          role="dialog"
          aria-label={t('chatTitle')}
        >
          {/* Header */}
          <div className="bg-slate-900 text-white p-3.5 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-teal-600 flex items-center justify-center text-white">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-xs tracking-tight">{t('chatTitle')}</h3>
                <p className="text-[10px] text-teal-300 leading-tight">Grounded in NEP-2020</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleClear}
                className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-300 transition-colors"
                title={t('clearChat')}
                aria-label={t('clearChat')}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                aria-label="Close assistant"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Offline Warning Notice */}
          {!isOnline && (
            <div className="p-3 bg-amber-50 border-b border-amber-200 text-xs text-amber-900 flex items-start gap-2">
              <WifiOff className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-[11px]">AI Companion Unavailable Offline</p>
                <p className="text-[10px] text-amber-800 leading-snug">
                  Gemini AI cloud generation requires internet access. You can attempt your{' '}
                  <a href="#/assessment" className="underline font-bold text-amber-950">
                    preloaded offline assessment
                  </a>{' '}
                  instead.
                </p>
              </div>
            </div>
          )}

          {/* Persona Disclaimer Banner */}
          <div className="bg-slate-50 border-b border-slate-200 px-3 py-1.5 text-[10px] text-slate-500 flex items-center justify-between">
            <span>AI Educational Mentor • No employment guarantees</span>
            <span className="font-semibold text-teal-700 uppercase tracking-wider">{language.toUpperCase()}</span>
          </div>

          {/* Messages Body */}
          <div ref={scrollRef} className="flex-1 p-3 overflow-y-auto space-y-3 text-xs bg-slate-50/50">
            {messages.length === 0 ? (
              <div className="text-center py-6 px-3 space-y-3">
                <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-800 mx-auto flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-xs">{t('chatTitle')}</p>
                  <p className="text-[11px] text-slate-500 mt-1">{t('chatSubtitle')}</p>
                </div>

                {/* Suggested starters */}
                <div className="pt-2 space-y-1.5 text-left">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Suggested Questions:
                  </span>
                  {starterQueries.map((query, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(query)}
                      className="w-full text-left p-2 rounded-md bg-white border border-slate-200 hover:border-teal-400 hover:bg-teal-50/50 text-[11px] text-slate-700 transition-colors leading-snug"
                    >
                      {query}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m) => {
                const isUser = m.role === 'user';
                return (
                  <div
                    key={m.id}
                    className={`flex gap-2 items-start ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold ${
                        isUser ? 'bg-sky-700 text-white' : 'bg-teal-700 text-white'
                      }`}
                    >
                      {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                    </div>
                    <div
                      className={`max-w-[80%] rounded-lg p-2.5 leading-relaxed text-xs shadow-xs ${
                        isUser
                          ? 'bg-sky-700 text-white rounded-tr-none'
                          : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                      }`}
                    >
                      {isUser ? m.content : renderFormatted(m.content)}
                      <div
                        className={`text-[9px] mt-1 text-right ${
                          isUser ? 'text-sky-200' : 'text-slate-400'
                        }`}
                      >
                        {m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {loading && (
              <div className="flex gap-2 items-center text-slate-500 text-xs italic bg-white p-2.5 rounded-md border border-slate-200 w-fit">
                <Bot className="w-4 h-4 animate-spin text-teal-600" />
                <span>Generating pedagogical guidance...</span>
              </div>
            )}
          </div>

          {/* Footer Input Area */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={!isOnline ? 'AI Assistant is offline...' : t('chatPlaceholder')}
              className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:border-teal-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
              disabled={loading || !isOnline}
              aria-label="Ask learning assistant"
            />
            <button
              type="submit"
              disabled={loading || !input.trim() || !isOnline}
              className="p-2 rounded-md bg-teal-700 hover:bg-teal-800 text-white disabled:opacity-50 transition-colors"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

'use client';

import { useAuraStore, type PrismChatMessage } from '@/store/aura-store';
import { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Sparkles, X, Send, Palette, Brain, Leaf, RotateCcw, Loader2,
  MessageCircle, Lightbulb, Wand2, Heart, Zap
} from 'lucide-react';

const MODE_CONFIG = {
  companion: {
    label: 'Companion',
    icon: Sparkles,
    color: 'from-violet-600 to-fuchsia-600',
    bgColor: 'bg-violet-500/20',
    textColor: 'text-violet-400',
    borderColor: 'border-violet-500/30',
    description: 'Your AI friend — chat, create, vibe',
  },
  remix: {
    label: 'Remix',
    icon: Palette,
    color: 'from-fuchsia-600 to-pink-600',
    bgColor: 'bg-fuchsia-500/20',
    textColor: 'text-fuchsia-400',
    borderColor: 'border-fuchsia-500/30',
    description: 'Transform & remix content ideas',
  },
  coach: {
    label: 'Vibe Coach',
    icon: Leaf,
    color: 'from-emerald-600 to-teal-600',
    bgColor: 'bg-emerald-500/20',
    textColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
    description: 'Wellness tips & creative flow',
  },
};

type Mode = 'companion' | 'remix' | 'coach';

const QUICK_PROMPTS: Record<Mode, string[]> = {
  companion: [
    'What should I post today?',
    'Give me a creative daily brief',
    'Suggest a fun reply for my last post',
    'What vibes are trending?',
  ],
  remix: [
    'Turn this into a holographic edit',
    'Make it a retro synthwave vibe',
    'Suggest a viral remix for my reel',
    'Create a cross-format idea',
  ],
  coach: [
    'How can I improve my screen time?',
    'Am I spending time well on ORRA?',
    'I feel creatively stuck, help!',
    'Suggest a balanced social routine',
  ],
};

export function PrismCompanion() {
  const {
    prismCompanionOpen, prismMessages, prismCompanionMode, prismIsTyping,
  } = useAuraStore();

  if (!prismCompanionOpen) return null;

  return <PrismCompanionPanel />;
}

function PrismCompanionPanel() {
  const {
    prismMessages, prismCompanionMode, prismIsTyping,
  } = useAuraStore();

  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const mode = (prismCompanionMode || 'companion') as Mode;
  const config = MODE_CONFIG[mode] || MODE_CONFIG.companion;

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [prismMessages, prismIsTyping]);

  // Focus input when companion opens
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isSending) return;

    setInputText('');
    setIsSending(true);

    // Add user message to store
    const userMsg: PrismChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      createdAt: Date.now(),
      mode,
    };
    useAuraStore.setState((s) => ({
      prismMessages: [...s.prismMessages, userMsg],
      prismIsTyping: true,
    }));

    try {
      // Build conversation history for context
      const chatHistory = useAuraStore.getState().prismMessages
        .slice(-20)
        .map((m) => ({ role: m.role, content: m.content }));

      chatHistory.push({ role: 'user', content: text });

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: chatHistory, mode }),
      });

      const data = await res.json();

      if (data.success && data.data?.message) {
        const aiMsg: PrismChatMessage = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: data.data.message.content,
          createdAt: Date.now(),
          mode,
        };
        useAuraStore.setState((s) => ({
          prismMessages: [...s.prismMessages, aiMsg],
          prismIsTyping: false,
        }));

        // Earn 1 ORRA for chatting with Prism (max 10 per day)
        useAuraStore.getState().earnTokens(1, 'Prism AI chat');
      } else {
        throw new Error(data.error || 'AI response failed');
      }
    } catch (error) {
      const errorMsg: PrismChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: "Oops, my neural link glitched! Try again? ✨",
        createdAt: Date.now(),
        mode,
      };
      useAuraStore.setState((s) => ({
        prismMessages: [...s.prismMessages, errorMsg],
        prismIsTyping: false,
      }));
    } finally {
      setIsSending(false);
    }
  }, [inputText, isSending, mode]);

  const handleQuickPrompt = (prompt: string) => {
    setInputText(prompt);
  };

  const switchMode = (newMode: Mode) => {
    useAuraStore.setState({ prismCompanionMode: newMode });
  };

  const closeCompanion = () => {
    useAuraStore.setState({ prismCompanionOpen: false });
  };

  const clearChat = () => {
    useAuraStore.setState({ prismMessages: [] });
  };

  const ModeIcon = config.icon;

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeCompanion} />

      {/* Panel */}
      <div className="relative w-full sm:w-[420px] max-h-[85vh] sm:max-h-[600px] bg-[#0a0a12] border border-white/10 rounded-t-3xl sm:rounded-3xl flex flex-col shadow-2xl shadow-violet-900/30 fade-in overflow-hidden">
        {/* Header */}
        <div className={`flex items-center gap-3 p-4 border-b border-white/5 bg-gradient-to-r ${config.color} bg-opacity-10`}>
          <div className={`w-10 h-10 rounded-xl ${config.bgColor} flex items-center justify-center`}>
            <ModeIcon className={`w-5 h-5 ${config.textColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Prism AI</h3>
              <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${config.bgColor} ${config.textColor} border ${config.borderColor}`}>
                {config.label}
              </span>
            </div>
            <p className="text-[10px] text-slate-400">{config.description}</p>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={clearChat} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 transition-all" title="Clear chat">
              <RotateCcw className="w-4 h-4" />
            </button>
            <button onClick={closeCompanion} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mode Tabs */}
        <div className="flex gap-1 p-2 border-b border-white/5 bg-white/[0.02]">
          {(Object.entries(MODE_CONFIG) as [Mode, typeof MODE_CONFIG.companion][]).map(([key, cfg]) => {
            const TabIcon = cfg.icon;
            const isActive = key === mode;
            return (
              <button
                key={key}
                onClick={() => switchMode(key)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? `${cfg.bgColor} ${cfg.textColor} border ${cfg.borderColor}`
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                }`}
              >
                <TabIcon className="w-3.5 h-3.5" />
                {cfg.label}
              </button>
            );
          })}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3 min-h-[200px]">
          {/* Welcome message if empty */}
          {prismMessages.length === 0 && (
            <div className="text-center py-8 space-y-4">
              <div className={`w-16 h-16 rounded-2xl ${config.bgColor} flex items-center justify-center mx-auto`}>
                <ModeIcon className={`w-8 h-8 ${config.textColor}`} />
              </div>
              <div>
                <p className="text-white font-bold text-sm">Hey! I&apos;m Prism ✨</p>
                <p className="text-slate-400 text-xs mt-1">Your AI companion in ORRA. Ask me anything!</p>
              </div>
              {/* Quick prompts */}
              <div className="space-y-1.5 max-w-xs mx-auto">
                {QUICK_PROMPTS[mode].map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleQuickPrompt(prompt)}
                    className={`w-full text-left px-3 py-2 rounded-xl ${config.bgColor} border ${config.borderColor} ${config.textColor} text-xs hover:brightness-125 transition-all`}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat messages */}
          {prismMessages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] ${
                msg.role === 'user'
                  ? 'bg-violet-600/30 rounded-2xl rounded-br-md'
                  : 'bg-white/5 border border-white/5 rounded-2xl rounded-bl-md'
              } px-3 py-2.5`}>
                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-1.5 mb-1">
                    <Sparkles className="w-3 h-3 text-violet-400" />
                    <span className="text-[9px] font-bold text-violet-400">PRISM</span>
                  </div>
                )}
                <p className={`text-sm leading-relaxed ${msg.role === 'user' ? 'text-white' : 'text-slate-200'}`}>
                  {msg.content}
                </p>
                <p className={`text-[9px] mt-1 ${msg.role === 'user' ? 'text-violet-300/50' : 'text-slate-500'}`}>
                  {Math.floor((Date.now() - msg.createdAt) / 60000) < 1 ? 'Just now' : `${Math.floor((Date.now() - msg.createdAt) / 60000)}m ago`}
                </p>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {prismIsTyping && (
            <div className="flex justify-start">
              <div className="bg-white/5 border border-white/5 rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-violet-400 animate-pulse" />
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Ask Prism ${mode === 'coach' ? 'about wellness' : mode === 'remix' ? 'for a remix' : 'anything'}...`}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-all pr-10"
                onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400" />
                <span className="text-[9px] text-amber-400 font-bold">+1</span>
              </div>
            </div>
            <button
              onClick={handleSend}
              disabled={!inputText.trim() || isSending}
              className={`p-2.5 rounded-xl bg-gradient-to-r ${config.color} text-white hover:opacity-90 transition-all disabled:opacity-30`}
            >
              {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[9px] text-slate-600 mt-1.5 text-center">
            Earn 1 ORRA per message. Prism may make mistakes — verify important info.
          </p>
        </div>
      </div>
    </div>
  );
}

// Floating button to open Prism Companion
export function PrismCompanionButton() {
  const { prismCompanionOpen, isLiveActive, showGoLiveSetup } = useAuraStore();

  // Don't show button when companion is already open or when live streaming
  if (prismCompanionOpen || isLiveActive || showGoLiveSetup) return null;

  return (
    <button
      onClick={() => useAuraStore.setState({ prismCompanionOpen: true })}
      className="fixed bottom-20 lg:bottom-6 right-4 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/40 hover:shadow-violet-500/60 hover:scale-105 transition-all group"
      title="Open Prism AI Companion"
    >
      <Sparkles className="w-6 h-6 text-white group-hover:rotate-12 transition-transform" />
      {/* Pulse ring */}
      <span className="absolute inset-0 rounded-full bg-violet-500/30 animate-ping" />
    </button>
  );
}

'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Image as ImageIcon, X, Loader2, Mic, Bot, User, Sparkles } from 'lucide-react';
import Image from 'next/image';
import type { Message } from '@/types';

interface ChatPanelProps {
    messages: Message[];
    input: string;
    setInput: (v: string) => void;
    handleSend: () => void;
    onImageSelect: (file: File | null) => void;
    imagePreview: string | null;
    setImagePreview: (v: string | null) => void;
    isTyping: boolean;
    isLive: boolean;
    onToggleLive: () => void;
    onClose?: () => void;
}

export default function ChatPanel({
    messages, input, setInput, handleSend, onImageSelect, imagePreview, setImagePreview, isTyping, isLive, onToggleLive, onClose,
}: ChatPanelProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages, isTyping]);

    return (
        <div className="flex flex-col h-full bg-white relative overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 flex items-center justify-between glass-light border-b border-emerald-100 z-10 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm"
                        style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                        <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-emerald-950">Gemini Assistant</h2>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Live Agent</span>
                        </div>
                    </div>
                </div>
                <button
                    onClick={onToggleLive}
                    className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${isLive
                        ? 'bg-red-500 text-white shadow-lg shadow-red-200 animate-pulse'
                        : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                        }`}
                >
                    <Mic className={`w-3.5 h-3.5 ${isLive ? 'animate-bounce' : ''}`} />
                    {isLive ? 'LIVE NOW' : 'GO LIVE'}
                </button>
 
                {onClose && (
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-emerald-400 hover:bg-emerald-50 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>
 
            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar bg-emerald-50/20 min-h-0">
                <AnimatePresence initial={false}>
                    {messages.length === 0 && !isTyping && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="h-full flex flex-col items-center justify-center text-center p-8"
                        >
                            <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-xl"
                                style={{ background: 'var(--gradient-1)', boxShadow: '0 8px 32px rgba(16,185,129,0.2)' }}>
                                <Sparkles className="w-10 h-10 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-emerald-950 mb-2">Welcome to your AI Concierge</h3>
                            <p className="text-sm text-emerald-700/60 max-w-xs mb-8">
                                I can help you find products, answer questions, or manage your shopping cart.
                            </p>
                            <div className="grid grid-cols-1 gap-2 w-full max-w-xs">
                                {['Show me summer dresses', 'What are your best sellers?', 'Track my order'].map((q) => (
                                    <button
                                        key={q}
                                        onClick={() => setInput(q)}
                                        className="text-left px-4 py-3 rounded-2xl bg-white border border-emerald-100 text-sm text-emerald-800 hover:border-emerald-300 hover:bg-emerald-50 transition-all font-medium"
                                    >
                                        "{q}"
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {messages.map((m, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center shadow-sm ${m.role === 'user'
                                    ? 'bg-emerald-100 text-emerald-600'
                                    : 'bg-emerald-600 text-white'
                                    }`}>
                                    {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                </div>
                                <div className="space-y-1">
                                    <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${m.role === 'user'
                                        ? 'bubble-user'
                                        : 'bubble-ai'
                                        }`}>
                                        {m.role === 'user' && m.imageUrl && (
                                            <div className="mb-2 rounded-lg overflow-hidden border border-white/20">
                                                <Image src={m.imageUrl} alt="upload" width={200} height={200} className="w-full object-cover" />
                                            </div>
                                        )}
                                        {m.text}
                                    </div>
                                    <p className="text-[10px] font-medium text-emerald-800/40 px-1">
                                        {m.role === 'user' ? 'Sent' : 'Assistant'}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    ))}

                    {isTyping && (
                        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
                                    <Bot className="w-4 h-4" />
                                </div>
                                <div className="bubble-ai px-4 py-3 rounded-2xl flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-emerald-100 shrink-0">
                {imagePreview && (
                    <div className="mb-3 relative inline-block p-1 border border-emerald-100 rounded-xl bg-emerald-50/50">
                        <Image src={imagePreview} alt="preview" width={80} height={80} className="rounded-lg object-cover" />
                        <button
                            onClick={() => setImagePreview(null)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                )}
                <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-emerald-50/50 border border-emerald-100 focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-500/5 transition-all">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2.5 text-emerald-500 hover:text-emerald-700 hover:bg-white rounded-xl transition-all"
                        title="Upload image"
                    >
                        <ImageIcon className="w-5 h-5" />
                    </button>
                    <input
                        type="file" ref={fileInputRef} className="hidden" accept="image/*"
                        onChange={(e) => onImageSelect(e.target.files?.[0] || null)}
                    />
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask anything..."
                        className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-emerald-950 placeholder:text-emerald-700/50"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() && !imagePreview}
                        className="btn-primary p-2.5 rounded-xl disabled:opacity-50 disabled:scale-100 active:scale-95"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}

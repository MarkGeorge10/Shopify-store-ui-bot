'use client';

import { useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Loader2, Bot, User, Image as ImageIcon, X, Mic, MicOff } from 'lucide-react';
import Image from 'next/image';
import { renderMessageText } from '@/utils/renderMessageText';
import type { Message } from '@/types';

interface ChatPanelProps {
    messages: Message[];
    input: string;
    isLoading: boolean;
    previewImage: string | null;
    messagesEndRef: React.RefObject<HTMLDivElement | null>;
    onInputChange: (value: string) => void;
    onImageSelect: (file: File | null) => void;
    onRemoveImage: () => void;
    onSend: (e?: React.FormEvent) => void;
    isLive?: boolean;
    liveLevel?: number;
    onToggleLive?: () => void;
}

export default function ChatPanel({
    messages,
    input,
    isLoading,
    previewImage,
    messagesEndRef,
    onInputChange,
    onImageSelect,
    onRemoveImage,
    onSend,
    isLive = false,
    liveLevel = 0,
    onToggleLive,
}: ChatPanelProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageBtnClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onImageSelect(file);
        }
    };
    return (
        <>
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <AnimatePresence initial={false}>
                    {messages.map((msg) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                        >
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-neutral-100' : 'bg-indigo-50 text-indigo-600'
                                    }`}
                            >
                                {msg.role === 'user'
                                    ? <User className="w-4 h-4 text-neutral-600" />
                                    : <Bot className="w-4 h-4" />}
                            </div>
                            <div
                                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm flex flex-col gap-2 ${msg.role === 'user'
                                    ? 'bg-neutral-900 text-white rounded-tr-sm'
                                    : 'bg-white border border-neutral-100 shadow-sm text-neutral-800 rounded-tl-sm'
                                    }`}
                            >
                                {msg.imageUrl && (
                                    <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-neutral-800/50 mb-1">
                                        <Image
                                            src={msg.imageUrl}
                                            alt="Sent image"
                                            fill
                                            className="object-contain"
                                            unoptimized // for local blobs
                                        />
                                    </div>
                                )}
                                {msg.text && (
                                    <div>{renderMessageText(msg.text, msg.role as 'user' | 'model')}</div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {isLoading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                            <Bot className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div className="bg-white border border-neutral-100 shadow-sm rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                            <span className="text-sm text-neutral-500">Thinking...</span>
                        </div>
                    </motion.div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-neutral-100">
                {/* Image Preview */}
                {previewImage && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-3 relative inline-block"
                    >
                        <div className="w-20 h-20 rounded-xl border border-neutral-200 overflow-hidden bg-neutral-50 shadow-sm">
                            <Image
                                src={previewImage}
                                alt="Preview"
                                fill
                                className="object-cover"
                            />
                        </div>
                        <button
                            onClick={onRemoveImage}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full shadow-md border border-neutral-200 flex items-center justify-center hover:bg-neutral-50 transition-colors"
                        >
                            <X className="w-3 h-3 text-neutral-600" />
                        </button>
                    </motion.div>
                )}

                <form onSubmit={onSend} className="relative flex items-center gap-2">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                    />
                    <button
                        type="button"
                        onClick={handleImageBtnClick}
                        className={`shrink-0 w-10 h-10 flex items-center justify-center rounded-full border transition-all
                            ${previewImage
                                ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                                : 'border-neutral-200 text-neutral-500 hover:border-neutral-300 hover:bg-neutral-50'
                            }`}
                        disabled={isLoading}
                    >
                        <ImageIcon className="w-5 h-5" />
                    </button>

                    <div className="relative flex-1">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => onInputChange(e.target.value)}
                            placeholder={isLive ? "Listening..." : (previewImage ? "Describe what to find..." : "Ask about products...")}
                            className={`w-full bg-neutral-100 border-transparent focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-full py-3 pl-5 pr-24 text-sm transition-all outline-none ${isLive ? 'ring-2 ring-red-100' : ''}`}
                            disabled={isLoading}
                            readOnly={isLive}
                        />
                        <div className="absolute right-2 top-1.5 flex items-center gap-1.5">
                            {onToggleLive && (
                                <button
                                    type="button"
                                    onClick={onToggleLive}
                                    className={`w-8 h-8 flex items-center justify-center rounded-full transition-all relative
                                        ${isLive ? 'bg-red-500 text-white animate-pulse' : 'bg-neutral-200 text-neutral-500 hover:bg-neutral-300'}`}
                                >
                                    {isLive ? <Mic className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                                    {isLive && (
                                        <div
                                            className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping opacity-25"
                                            style={{ transform: `scale(${1 + liveLevel * 2})` }}
                                        />
                                    )}
                                </button>
                            )}
                            <button
                                type="submit"
                                disabled={(!input.trim() && !previewImage) || isLoading || isLive}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-indigo-600 text-white disabled:opacity-50 disabled:bg-neutral-400 transition-colors"
                            >
                                <Send className="w-4 h-4 ml-0.5" />
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </>
    );
}

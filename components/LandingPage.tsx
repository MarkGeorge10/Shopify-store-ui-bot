'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, ShoppingBag, MessageSquare, ArrowRight, Zap, Shield, Globe } from 'lucide-react';
import AuthModal from '@/components/AuthModal';
import type { AuthTab, AuthForm } from '@/types';

interface LandingPageProps {
    // Auth props (passed through from useAuth)
    showAuthModal: boolean;
    authTab: AuthTab;
    authForm: AuthForm;
    authLoading: boolean;
    authError: string | null;
    showPassword: boolean;
    setShowAuthModal: (v: boolean) => void;
    setAuthForm: React.Dispatch<React.SetStateAction<AuthForm>>;
    setShowPassword: React.Dispatch<React.SetStateAction<boolean>>;
    switchTab: (tab: AuthTab) => void;
    handleLogin: () => void;
    handleSignup: () => void;
    openAuthModal: () => void;
}

export default function LandingPage({
    showAuthModal,
    authTab,
    authForm,
    authLoading,
    authError,
    showPassword,
    setShowAuthModal,
    setAuthForm,
    switchTab,
    handleLogin,
    handleSignup,
    openAuthModal,
    setShowPassword,
}: LandingPageProps) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white overflow-hidden">
            {/* Animated background blobs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute top-1/2 -left-40 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute bottom-20 right-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            {/* Nav */}
            <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-bold tracking-tight">AI Concierge</span>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => { switchTab('login'); openAuthModal(); }}
                        className="px-5 py-2.5 text-sm font-medium text-white/80 hover:text-white transition-colors"
                    >
                        Log In
                    </button>
                    <button
                        onClick={() => { switchTab('signup'); openAuthModal(); }}
                        className="px-5 py-2.5 text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40"
                    >
                        Get Started
                    </button>
                </div>
            </nav>

            {/* Hero */}
            <main className="relative z-10 max-w-7xl mx-auto px-8 pt-20 pb-32">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="text-center max-w-3xl mx-auto"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-sm text-indigo-300 font-medium mb-8">
                        <Zap className="w-4 h-4" />
                        Powered by Gemini AI
                    </div>

                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6">
                        Your AI Shopping
                        <span className="block bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                            Concierge
                        </span>
                    </h1>

                    <p className="text-lg md:text-xl text-white/60 leading-relaxed max-w-2xl mx-auto mb-10">
                        Connect your Shopify store and let AI handle product discovery,
                        cart management, and customer support — all in one intelligent chat interface.
                    </p>

                    <div className="flex items-center justify-center gap-4">
                        <button
                            onClick={() => { switchTab('signup'); openAuthModal(); }}
                            className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-lg rounded-2xl transition-all shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 flex items-center gap-2 active:scale-[0.98]"
                        >
                            Start Free Trial
                            <ArrowRight className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => { switchTab('login'); openAuthModal(); }}
                            className="px-8 py-4 bg-white/10 hover:bg-white/15 text-white font-semibold text-lg rounded-2xl transition-all backdrop-blur-sm border border-white/10"
                        >
                            Sign In
                        </button>
                    </div>
                </motion.div>

                {/* Feature Cards */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="mt-28 grid grid-cols-1 md:grid-cols-3 gap-6"
                >
                    {[
                        {
                            icon: <MessageSquare className="w-6 h-6" />,
                            title: 'AI Chat Assistant',
                            description: 'Natural language product search, recommendations, and order tracking powered by Gemini.',
                            color: 'from-indigo-500/20 to-indigo-600/10',
                            iconBg: 'bg-indigo-500/20',
                        },
                        {
                            icon: <ShoppingBag className="w-6 h-6" />,
                            title: 'Smart Storefront',
                            description: 'Browse products, manage cart, and checkout — all within a beautiful, responsive interface.',
                            color: 'from-purple-500/20 to-purple-600/10',
                            iconBg: 'bg-purple-500/20',
                        },
                        {
                            icon: <Shield className="w-6 h-6" />,
                            title: 'Secure & Private',
                            description: 'Enterprise-grade encryption, tenant isolation, and secure Shopify OAuth integration.',
                            color: 'from-emerald-500/20 to-emerald-600/10',
                            iconBg: 'bg-emerald-500/20',
                        },
                    ].map((feature, idx) => (
                        <motion.div
                            key={feature.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.5 + idx * 0.15 }}
                            className={`bg-gradient-to-br ${feature.color} backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:border-white/20 transition-all`}
                        >
                            <div className={`w-12 h-12 rounded-xl ${feature.iconBg} flex items-center justify-center mb-5`}>
                                {feature.icon}
                            </div>
                            <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                            <p className="text-white/50 text-sm leading-relaxed">{feature.description}</p>
                        </motion.div>
                    ))}
                </motion.div>
            </main>

            {/* Auth Modal */}
            <AuthModal
                customer={null}
                show={showAuthModal}
                authTab={authTab}
                authForm={authForm}
                authLoading={authLoading}
                authError={authError}
                showPassword={showPassword}
                onClose={() => setShowAuthModal(false)}
                onSwitchTab={switchTab}
                onFormChange={(field, value) => setAuthForm((f) => ({ ...f, [field]: value }))}
                onLogin={handleLogin}
                onSignup={handleSignup}
                onLogout={() => { }}
                onTogglePassword={() => setShowPassword((p) => !p)}
            />
        </div>
    );
}

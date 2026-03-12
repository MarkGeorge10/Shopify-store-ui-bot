'use client';

import { motion } from 'motion/react';
import { Sparkles, ShoppingBag, MessageSquare, ArrowRight, Zap, Shield, Globe, Bot, Star } from 'lucide-react';
import AuthModal from '@/components/AuthModal';
import type { AuthTab, AuthForm } from '@/types';

interface LandingPageProps {
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
    showAuthModal, authTab, authForm, authLoading, authError, showPassword,
    setShowAuthModal, setAuthForm, switchTab, handleLogin, handleSignup, openAuthModal, setShowPassword,
}: LandingPageProps) {
    return (
        <div className="min-h-screen text-emerald-950 overflow-hidden relative" style={{ background: 'var(--gradient-hero)' }}>
            {/* Animated background blobs */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="animate-blob absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full opacity-20"
                    style={{ background: 'radial-gradient(circle, #34d399, #10b981, transparent 70%)' }} />
                <div className="animate-blob absolute top-1/2 -left-48 w-[500px] h-[500px] rounded-full opacity-15"
                    style={{ background: 'radial-gradient(circle, #6ee7b7, #10b981, transparent 70%)', animationDelay: '3s' }} />
                <div className="animate-blob absolute bottom-0 right-1/4 w-[450px] h-[450px] rounded-full opacity-10"
                    style={{ background: 'radial-gradient(circle, #10b981, #0ea5e9, transparent 70%)', animationDelay: '5s' }} />
                {/* Grid overlay */}
                <div className="absolute inset-0 opacity-5"
                    style={{ backgroundImage: 'linear-gradient(rgba(16,185,129,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
            </div>

            {/* Nav */}
            <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg"
                        style={{ background: 'var(--gradient-1)', boxShadow: '0 4px 20px rgba(16,185,129,0.5)' }}>
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <span className="text-lg font-bold tracking-tight text-emerald-950">AI Concierge</span>
                        <div className="badge-gemini mt-0.5">
                            <Zap className="w-2.5 h-2.5" /> Gemini Live Agent
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => { switchTab('login'); openAuthModal(); }}
                        className="px-5 py-2.5 text-sm font-semibold text-emerald-900/70 hover:text-emerald-950 transition-colors rounded-xl hover:bg-emerald-50"
                    >
                        Log In
                    </button>
                    <button
                        onClick={() => { switchTab('signup'); openAuthModal(); }}
                        className="btn-primary px-5 py-2.5 text-sm"
                    >
                        Get Started <ArrowRight className="inline w-4 h-4 ml-1" />
                    </button>
                </div>
            </nav>

            {/* Hero */}
            <main className="relative z-10 max-w-7xl mx-auto px-8 pt-16 pb-36">
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="text-center max-w-4xl mx-auto"
                >
                    {/* Badge */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="inline-flex items-center gap-2 px-5 py-2 rounded-full mb-8 glass text-sm font-semibold"
                        style={{ color: '#059669', border: '1px solid rgba(16,185,129,0.3)', background: 'rgba(255,255,255,0.8)' }}
                    >
                        <Star className="w-4 h-4 text-emerald-500 fill-emerald-500" />
                        Built for Gemini Live Agent Challenge 2025
                        <Star className="w-4 h-4 text-emerald-500 fill-emerald-500" />
                    </motion.div>

                    <h1 className="text-6xl md:text-8xl font-extrabold tracking-tight leading-[1.05] mb-6 text-emerald-950">
                        Shop Smarter with
                        <span className="block gradient-text mt-2">AI Concierge</span>
                    </h1>

                    <p className="text-lg md:text-xl leading-relaxed max-w-2xl mx-auto mb-10" style={{ color: 'rgba(6,78,59,0.7)' }}>
                        The world's most intelligent Shopify shopping agent. Ask anything, discover products,
                        manage your cart, and checkout — powered by <strong className="text-emerald-900">Google Gemini</strong>.
                    </p>

                    <div className="flex items-center justify-center gap-4 flex-wrap">
                        <button
                            onClick={() => { switchTab('signup'); openAuthModal(); }}
                            className="btn-primary px-8 py-4 text-base rounded-2xl flex items-center gap-2"
                        >
                            <Bot className="w-5 h-5" />
                            Start Shopping with AI
                            <ArrowRight className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => { switchTab('login'); openAuthModal(); }}
                            className="glass px-8 py-4 text-base rounded-2xl font-bold hover:bg-emerald-50 transition-all text-emerald-900 bg-white shadow-sm"
                        >
                            Sign In
                        </button>
                    </div>

                    {/* Stats row */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="mt-14 flex items-center justify-center gap-12 flex-wrap"
                    >
                        {[
                            { value: 'Gemini', label: 'AI Engine' },
                            { value: 'Shopify', label: 'Native Integration' },
                            { value: 'Live', label: 'Voice Mode' },
                        ].map(stat => (
                            <div key={stat.label} className="text-center">
                                <div className="text-2xl font-extrabold gradient-text">{stat.value}</div>
                                <div className="text-xs font-medium mt-1" style={{ color: 'rgba(6,78,59,0.5)' }}>{stat.label}</div>
                            </div>
                        ))}
                    </motion.div>
                </motion.div>

                {/* Feature Cards - Restored and themed */}
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6"
                >
                    {[
                        {
                            icon: <MessageSquare className="w-7 h-7" />,
                            title: 'AI Chat & Voice',
                            description: 'Natural language product search, voice shopping with Gemini Live, personalized recommendations, and instant support.',
                            gradient: 'from-emerald-500/20 via-emerald-100/10 to-transparent',
                            iconGradient: 'linear-gradient(135deg, #10b981, #059669)',
                            glow: 'rgba(16,185,129,0.3)',
                        },
                        {
                            icon: <ShoppingBag className="w-7 h-7" />,
                            title: 'Smart Storefront',
                            description: 'Full Shopify product catalog, real-time inventory, variant selection, cart management, and seamless checkout.',
                            gradient: 'from-teal-500/20 via-emerald-500/10 to-transparent',
                            iconGradient: 'linear-gradient(135deg, #0d9488, #10b981)',
                            glow: 'rgba(13,148,136,0.3)',
                        },
                        {
                            icon: <Shield className="w-7 h-7" />,
                            title: 'Enterprise Ready',
                            description: 'Multi-tenant architecture, AES-256 encryption, Shopify OAuth, and tenant-isolated data storage.',
                            gradient: 'from-green-500/20 via-emerald-500/10 to-transparent',
                            iconGradient: 'linear-gradient(135deg, #16a34a, #059669)',
                            glow: 'rgba(22,163,74,0.3)',
                        },
                    ].map((feature, idx) => (
                        <motion.div
                            key={feature.title}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.6 + idx * 0.15 }}
                            className={`glass bg-gradient-to-br ${feature.gradient} rounded-3xl p-8 card-hover group shadow-sm`}
                            style={{ background: 'rgba(255,255,255,0.9)' }}
                        >
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg transition-transform group-hover:scale-110"
                                style={{ background: feature.iconGradient, boxShadow: `0 8px 24px ${feature.glow}` }}>
                                {feature.icon}
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-emerald-950">{feature.title}</h3>
                            <p className="text-sm leading-relaxed" style={{ color: 'rgba(6,78,59,0.6)' }}>{feature.description}</p>
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

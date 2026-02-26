'use client';

import { motion, AnimatePresence } from 'motion/react';
import { X, LogOut, LogIn, Loader2, UserRound, Eye, EyeOff } from 'lucide-react';
import type { Customer, AuthTab, AuthForm } from '@/types';

interface AuthModalProps {
    customer: Customer | null;
    show: boolean;
    authTab: AuthTab;
    authForm: AuthForm;
    authLoading: boolean;
    authError: string | null;
    showPassword: boolean;
    onClose: () => void;
    onSwitchTab: (tab: AuthTab) => void;
    onFormChange: (field: keyof AuthForm, value: string) => void;
    onLogin: () => void;
    onSignup: () => void;
    onLogout: () => void;
    onTogglePassword: () => void;
}

export default function AuthModal({
    customer,
    show,
    authTab,
    authForm,
    authLoading,
    authError,
    showPassword,
    onClose,
    onSwitchTab,
    onFormChange,
    onLogin,
    onSignup,
    onLogout,
    onTogglePassword,
}: AuthModalProps) {
    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end md:items-center justify-center"
                    onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
                >
                    <motion.div
                        initial={{ y: 60, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 60, opacity: 0 }}
                        transition={{ type: 'spring', damping: 25 }}
                        className="w-full max-w-sm bg-white rounded-t-3xl md:rounded-3xl shadow-2xl p-6"
                    >
                        {customer ? (
                            // ── Logged-in view ──────────────────────────────────────────
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-bold text-neutral-900">My Account</h2>
                                    <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-full">
                                        <X className="w-4 h-4 text-neutral-400" />
                                    </button>
                                </div>
                                <div className="flex items-center gap-4 p-4 bg-indigo-50 rounded-2xl">
                                    <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                                        {customer.firstName[0]}{customer.lastName[0]}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-neutral-900">{customer.firstName} {customer.lastName}</p>
                                        <p className="text-xs text-neutral-500">{customer.email}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onLogout}
                                    className="w-full flex items-center justify-center gap-2 py-3 border-2 border-neutral-200 text-neutral-600 rounded-xl font-semibold hover:border-red-300 hover:text-red-500 transition-all"
                                >
                                    <LogOut className="w-4 h-4" /> Sign Out
                                </button>
                            </div>
                        ) : (
                            // ── Guest view: Login / Signup tabs ─────────────────────────
                            <div className="space-y-5">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-bold text-neutral-900">
                                        {authTab === 'login' ? 'Welcome Back' : 'Create Account'}
                                    </h2>
                                    <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-full">
                                        <X className="w-4 h-4 text-neutral-400" />
                                    </button>
                                </div>

                                {/* Tabs */}
                                <div className="flex bg-neutral-100 rounded-xl p-1">
                                    {(['login', 'signup'] as const).map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => onSwitchTab(tab)}
                                            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${authTab === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-neutral-500'
                                                }`}
                                        >
                                            {tab === 'login' ? 'Sign In' : 'Sign Up'}
                                        </button>
                                    ))}
                                </div>

                                {/* Error */}
                                {authError && (
                                    <div className="px-4 py-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
                                        {authError}
                                    </div>
                                )}

                                {/* Fields */}
                                <div className="space-y-3">
                                    {authTab === 'signup' && (
                                        <div className="grid grid-cols-2 gap-3">
                                            <input
                                                type="text" placeholder="First name"
                                                value={authForm.firstName}
                                                onChange={(e) => onFormChange('firstName', e.target.value)}
                                                className="px-4 py-3 rounded-xl border border-neutral-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 outline-none text-sm transition-all"
                                            />
                                            <input
                                                type="text" placeholder="Last name"
                                                value={authForm.lastName}
                                                onChange={(e) => onFormChange('lastName', e.target.value)}
                                                className="px-4 py-3 rounded-xl border border-neutral-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 outline-none text-sm transition-all"
                                            />
                                        </div>
                                    )}
                                    <input
                                        type="email" placeholder="Email address"
                                        value={authForm.email}
                                        onChange={(e) => onFormChange('email', e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 outline-none text-sm transition-all"
                                    />
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="Password"
                                            value={authForm.password}
                                            onChange={(e) => onFormChange('password', e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && authTab === 'login' && onLogin()}
                                            className="w-full px-4 py-3 pr-10 rounded-xl border border-neutral-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 outline-none text-sm transition-all"
                                        />
                                        <button
                                            type="button"
                                            onClick={onTogglePassword}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    {authTab === 'signup' && (
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="Confirm password"
                                            value={authForm.confirm}
                                            onChange={(e) => onFormChange('confirm', e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && onSignup()}
                                            className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 outline-none text-sm transition-all"
                                        />
                                    )}
                                </div>

                                <button
                                    onClick={authTab === 'login' ? onLogin : onSignup}
                                    disabled={authLoading}
                                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-neutral-300 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
                                >
                                    {authLoading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : authTab === 'login' ? (
                                        <><LogIn className="w-4 h-4" /> Sign In</>
                                    ) : (
                                        <><UserRound className="w-4 h-4" /> Create Account</>
                                    )}
                                </button>

                                <p className="text-center text-xs text-neutral-400">
                                    {authTab === 'login' ? "Don't have an account? " : 'Already have an account? '}
                                    <button
                                        onClick={() => onSwitchTab(authTab === 'login' ? 'signup' : 'login')}
                                        className="text-indigo-600 font-semibold hover:underline"
                                    >
                                        {authTab === 'login' ? 'Sign up' : 'Sign in'}
                                    </button>
                                </p>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

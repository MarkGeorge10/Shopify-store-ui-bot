'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Store, ArrowRight, Loader2, AlertCircle, Sparkles, LogOut } from 'lucide-react';
import { apiPost } from '@/lib/api';

interface StoreConnectPageProps {
    onConnected: () => void;
    onLogout: () => void;
    userEmail: string;
}

export default function StoreConnectPage({ onConnected, onLogout, userEmail }: StoreConnectPageProps) {
    const [domain, setDomain] = useState('');
    const [storefrontToken, setStorefrontToken] = useState('');
    const [adminToken, setAdminToken] = useState('');
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleConnect = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!domain.trim() || !storefrontToken.trim()) {
            setError('Store domain and Storefront Access Token are required.');
            return;
        }

        setIsConnecting(true);
        setError(null);

        try {
            await apiPost('/api/store/connect', {
                shopify_domain: domain.trim(),
                shopify_storefront_token: storefrontToken.trim(),
                shopify_admin_token: adminToken.trim() || storefrontToken.trim(),
            });
            onConnected();
        } catch (err: any) {
            const detail = err?.detail;
            setError(typeof detail === 'string' ? detail : 'Failed to connect store. Please check your credentials.');
        } finally {
            setIsConnecting(false);
        }
    };

    const inputCls =
        'w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm text-white placeholder-white/30 transition-all';

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-center p-8">
            {/* Background blobs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-20 -left-40 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            {/* Top-right user info */}
            <div className="absolute top-6 right-8 flex items-center gap-3 z-10">
                <span className="text-sm text-white/50">{userEmail}</span>
                <button
                    onClick={onLogout}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/50 hover:text-white"
                    title="Log out"
                >
                    <LogOut className="w-4 h-4" />
                </button>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="relative w-full max-w-lg"
            >
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-500/30">
                        <Store className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight mb-3">Connect Your Store</h1>
                    <p className="text-white/50 text-sm leading-relaxed max-w-sm mx-auto">
                        Enter your Shopify store credentials to enable AI-powered shopping experiences.
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleConnect} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 space-y-5">
                    <div>
                        <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
                            Store Domain
                        </label>
                        <input
                            type="text"
                            value={domain}
                            onChange={(e) => setDomain(e.target.value)}
                            placeholder="your-store.myshopify.com"
                            className={inputCls}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
                            Storefront Access Token
                        </label>
                        <input
                            type="password"
                            value={storefrontToken}
                            onChange={(e) => setStorefrontToken(e.target.value)}
                            placeholder="shpat_xxxxxxxxxxxxxxxx"
                            className={inputCls}
                        />
                        <p className="text-xs text-white/30 mt-1.5">
                            Found in Shopify Admin → Settings → Apps → Develop apps
                        </p>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
                            Admin Access Token <span className="text-white/30">(optional)</span>
                        </label>
                        <input
                            type="password"
                            value={adminToken}
                            onChange={(e) => setAdminToken(e.target.value)}
                            placeholder="shpat_xxxxxxxxxxxxxxxx"
                            className={inputCls}
                        />
                        <p className="text-xs text-white/30 mt-1.5">
                            Required for order tracking and inventory. Falls back to Storefront token if empty.
                        </p>
                    </div>

                    {error && (
                        <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
                            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isConnecting}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 disabled:cursor-not-allowed text-white font-bold text-base rounded-xl transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 active:scale-[0.98]"
                    >
                        {isConnecting ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Connecting...
                            </>
                        ) : (
                            <>
                                Connect Store
                                <ArrowRight className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </form>

                {/* Footer hint */}
                <p className="text-center text-xs text-white/30 mt-6 flex items-center justify-center gap-1.5">
                    <Sparkles className="w-3 h-3" />
                    Your tokens are encrypted at rest and never logged.
                </p>
            </motion.div>
        </div>
    );
}

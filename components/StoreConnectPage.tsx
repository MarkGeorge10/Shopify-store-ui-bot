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
        'w-full px-4 py-3.5 rounded-xl bg-white border border-emerald-100 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/5 outline-none text-sm text-emerald-950 placeholder-emerald-300 transition-all';

    return (
        <div className="min-h-screen bg-mint text-emerald-950 flex items-center justify-center p-8 relative overflow-hidden">
            {/* Background blobs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-100/50 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-20 -left-40 w-80 h-80 bg-mint-accent/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            {/* Top-right user info */}
            <div className="absolute top-6 right-8 flex items-center gap-3 z-10">
                <span className="text-sm text-emerald-600/70 font-medium">{userEmail}</span>
                <button
                    onClick={onLogout}
                    className="p-2 rounded-xl hover:bg-emerald-50 transition-colors text-emerald-400 hover:text-emerald-600"
                    title="Log out"
                >
                    <LogOut className="w-4 h-4" />
                </button>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
                className="relative w-full max-w-lg"
            >
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-200"
                        style={{ background: 'var(--gradient-1)' }}>
                        <Store className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight mb-3 text-emerald-950">Connect Your Store</h1>
                    <p className="text-emerald-700/60 text-sm leading-relaxed max-w-sm mx-auto font-medium">
                        Enter your Shopify store credentials to enable AI-powered shopping experiences.
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleConnect} className="bg-white/80 backdrop-blur-md border border-emerald-100 rounded-3xl p-8 space-y-5 shadow-2xl shadow-emerald-200/50">
                    <div>
                        <label className="block text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2">
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
                        <label className="block text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2">
                            Storefront Access Token
                        </label>
                        <input
                            type="password"
                            value={storefrontToken}
                            onChange={(e) => setStorefrontToken(e.target.value)}
                            placeholder="shpat_xxxxxxxxxxxxxxxx"
                            className={inputCls}
                        />
                        <p className="text-[11px] text-emerald-400 mt-2 font-medium">
                            Found in Admin → Settings → Apps → Develop apps
                        </p>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2">
                            Admin Access Token <span className="text-emerald-300">(optional)</span>
                        </label>
                        <input
                            type="password"
                            value={adminToken}
                            onChange={(e) => setAdminToken(e.target.value)}
                            placeholder="shpat_xxxxxxxxxxxxxxxx"
                            className={inputCls}
                        />
                        <p className="text-[11px] text-emerald-400 mt-2 font-medium leading-normal">
                            Required for order tracking and inventory. Falls back to Storefront token if empty.
                        </p>
                    </div>

                    {error && (
                        <div className="flex items-start gap-2 p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium animate-shake">
                            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isConnecting}
                        className="btn-primary w-full py-4 text-white font-extrabold text-base rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] shadow-lg shadow-emerald-200"
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
                <p className="text-center text-xs text-emerald-400 mt-8 font-medium flex items-center justify-center gap-1.5 opacity-70">
                    <Sparkles className="w-3.5 h-3.5" />
                    Your tokens are encrypted and stored securely.
                </p>
            </motion.div>
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
    Store, Plus, Trash2, Pencil, ExternalLink, Copy, Check,
    Loader2, LogOut, Sparkles, Globe, ArrowRight, AlertCircle, X,
} from 'lucide-react';
import { apiGet, apiPost, apiDelete, isAuthenticated, clearToken } from '@/lib/api';
import { useRouter } from 'next/navigation';

// ── Types ─────────────────────────────────────────────────────────────────────

interface StoreItem {
    id: string;
    name: string;
    slug: string;
    shopify_domain: string;
    is_active: boolean;
    public_url: string;
}

interface BackendUser {
    id: string;
    email: string;
    is_pro: boolean;
}

export default function DashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<BackendUser | null>(null);
    const [stores, setStores] = useState<StoreItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

    // Add store form
    const [formName, setFormName] = useState('My Store');
    const [formDomain, setFormDomain] = useState('');
    const [formStorefrontToken, setFormStorefrontToken] = useState('');
    const [formAdminToken, setFormAdminToken] = useState('');
    const [formError, setFormError] = useState<string | null>(null);
    const [formLoading, setFormLoading] = useState(false);

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/');
            return;
        }
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [me, storeList] = await Promise.all([
                apiGet<BackendUser>('/api/auth/me'),
                apiGet<StoreItem[]>('/api/store/list'),
            ]);
            setUser(me);
            setStores(storeList);
        } catch {
            router.push('/');
        } finally {
            setLoading(false);
        }
    };

    const handleAddStore = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formDomain.trim() || !formStorefrontToken.trim()) {
            setFormError('Domain and Storefront Token are required.');
            return;
        }
        setFormLoading(true);
        setFormError(null);
        try {
            const newStore = await apiPost<StoreItem>('/api/store/connect', {
                name: formName.trim(),
                shopify_domain: formDomain.trim(),
                shopify_storefront_token: formStorefrontToken.trim(),
                shopify_admin_token: formAdminToken.trim() || formStorefrontToken.trim(),
            });
            setStores((prev) => [...prev, newStore]);
            setShowAddForm(false);
            setFormName('My Store');
            setFormDomain('');
            setFormStorefrontToken('');
            setFormAdminToken('');
        } catch (err: any) {
            setFormError(err?.detail || 'Failed to add store.');
        } finally {
            setFormLoading(false);
        }
    };

    const handleDeleteStore = async (storeId: string) => {
        if (!confirm('Delete this store? This action cannot be undone.')) return;
        try {
            await apiDelete(`/api/store/${storeId}`);
            setStores((prev) => prev.filter((s) => s.id !== storeId));
        } catch {
            alert('Failed to delete store.');
        }
    };

    const handleCopyLink = (slug: string) => {
        const fullUrl = `${window.location.origin}/s/${slug}`;
        navigator.clipboard.writeText(fullUrl);
        setCopiedSlug(slug);
        setTimeout(() => setCopiedSlug(null), 2000);
    };

    const handleLogout = () => {
        clearToken();
        router.push('/');
    };

    const inputCls =
        'w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm text-white placeholder-white/30 transition-all';

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white">
            {/* Background blobs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-20 -left-40 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            {/* Nav */}
            <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-bold tracking-tight">AI Concierge</span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-white/50">{user?.email}</span>
                    <button
                        onClick={handleLogout}
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/50 hover:text-white"
                        title="Log out"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </nav>

            {/* Content */}
            <main className="relative z-10 max-w-5xl mx-auto px-8 pb-20">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight">Your Stores</h1>
                        <p className="text-white/50 mt-1 text-sm">
                            Manage your Shopify stores and share their AI chatbot links.
                        </p>
                    </div>
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-500/25 flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Add Store
                    </button>
                </div>

                {/* Add Store Form Modal */}
                {showAddForm && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold">Connect New Store</h2>
                            <button onClick={() => setShowAddForm(false)} className="text-white/40 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleAddStore} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-1.5">Store Name</label>
                                <input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="My Store" className={inputCls} />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-1.5">Shopify Domain</label>
                                <input value={formDomain} onChange={(e) => setFormDomain(e.target.value)} placeholder="your-store.myshopify.com" className={inputCls} />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-1.5">Storefront Token</label>
                                <input type="password" value={formStorefrontToken} onChange={(e) => setFormStorefrontToken(e.target.value)} placeholder="shpat_xxx" className={inputCls} />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-1.5">Admin Token <span className="text-white/30">(optional)</span></label>
                                <input type="password" value={formAdminToken} onChange={(e) => setFormAdminToken(e.target.value)} placeholder="shpat_xxx" className={inputCls} />
                            </div>
                            {formError && (
                                <div className="md:col-span-2 flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    {formError}
                                </div>
                            )}
                            <div className="md:col-span-2">
                                <button
                                    type="submit"
                                    disabled={formLoading}
                                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-500/25 flex items-center gap-2"
                                >
                                    {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                    Connect Store
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}

                {/* Stores Grid */}
                {stores.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-20"
                    >
                        <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-6">
                            <Store className="w-10 h-10 text-white/20" />
                        </div>
                        <h2 className="text-xl font-bold text-white/70 mb-2">No stores yet</h2>
                        <p className="text-white/40 text-sm mb-6">Connect your first Shopify store to get started.</p>
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-500/25 inline-flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Add Your First Store
                        </button>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {stores.map((store, idx) => (
                            <motion.div
                                key={store.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all group"
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                                            <Store className="w-5 h-5 text-indigo-400" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white">{store.name}</h3>
                                            <p className="text-xs text-white/40">{store.shopify_domain}</p>
                                        </div>
                                    </div>
                                    <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${store.is_active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                                        {store.is_active ? 'Active' : 'Inactive'}
                                    </div>
                                </div>

                                {/* Public link */}
                                <div className="bg-white/5 rounded-xl p-3 flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <Globe className="w-4 h-4 text-white/40 shrink-0" />
                                        <code className="text-xs text-indigo-300 truncate">/s/{store.slug}</code>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <button
                                            onClick={() => handleCopyLink(store.slug)}
                                            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/40 hover:text-white"
                                            title="Copy public link"
                                        >
                                            {copiedSlug === store.slug ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                        </button>
                                        <a
                                            href={`/s/${store.slug}`}
                                            target="_blank"
                                            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/40 hover:text-white"
                                            title="Open storefront"
                                        >
                                            <ExternalLink className="w-3.5 h-3.5" />
                                        </a>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                    <a
                                        href={`/s/${store.slug}`}
                                        target="_blank"
                                        className="flex-1 px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 rounded-xl text-sm font-medium text-center transition-all flex items-center justify-center gap-1.5"
                                    >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                        Open Storefront
                                    </a>
                                    <button
                                        onClick={() => handleDeleteStore(store.id)}
                                        className="p-2 rounded-xl hover:bg-red-500/20 text-white/30 hover:text-red-400 transition-all"
                                        title="Delete store"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

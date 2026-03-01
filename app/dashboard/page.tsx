'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    Store, Plus, Trash2, Pencil, ExternalLink, Copy, Check,
    Loader2, LogOut, Sparkles, Globe, ArrowRight, AlertCircle, X,
    Database, RefreshCw, ToggleLeft, ToggleRight, BarChart2, ChevronDown, ChevronUp, ThumbsUp, ThumbsDown, Clock
} from 'lucide-react';
import { apiGet, apiPost, apiDelete, apiPut, isAuthenticated, clearToken } from '@/lib/api';
import { useRouter } from 'next/navigation';

// ── Types ─────────────────────────────────────────────────────────────────────

interface StoreItem {
    id: string;
    name: string;
    slug: string;
    shopify_domain: string;
    is_active: boolean;
    public_url: string;
    enhanced_search_enabled?: boolean;
    rag_index_status?: string;
}

interface RagMetrics {
    total_searches: number;
    pinecone_searches: number;
    native_searches: number;
    fallback_rate: number;
    avg_latency_ms: number;
    avg_pinecone_score: number | null;
    avg_results_count: number;
    avg_ndcg: number | null;
    thumbs_up: number;
    thumbs_down: number;
    feedback_ratio: number | null;
    days: number;
}

interface SearchLogItem {
    id: string;
    query: string | null;
    has_image: boolean;
    provider: string;
    results_count: number;
    pinecone_top_score: number | null;
    fallback_used: boolean;
    latency_ms: number;
    user_feedback: number | null;
    created_at: string;
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

    // Analytics panel state per store
    const [openAnalytics, setOpenAnalytics] = useState<string | null>(null);
    const [metricsMap, setMetricsMap] = useState<Record<string, RagMetrics>>({});
    const [logsMap, setLogsMap] = useState<Record<string, SearchLogItem[]>>({});
    const [metricsLoading, setMetricsLoading] = useState<string | null>(null);

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
        } catch (err: any) {
            console.error('Failed to load dashboard data:', err);
            if (err?.status === 401) {
                router.push('/');
            } else {
                alert('Dashboard load error: ' + (err?.detail || err?.message || 'Unknown error. Check backend logs.'));
            }
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

    const handleToggleRAG = async (storeId: string, currentVal: boolean | undefined) => {
        try {
            const newVal = !currentVal;
            // Optimistic update
            setStores(prev => prev.map(s => s.id === storeId ? {
                ...s,
                enhanced_search_enabled: newVal,
                rag_index_status: newVal ? 'building' : 'idle'
            } : s));

            if (newVal) {
                await apiPost(`/api/store/${storeId}/enhanced-search/enable`, {});
            } else {
                await apiPost(`/api/store/${storeId}/enhanced-search/disable`, {});
            }
        } catch {
            alert('Failed to toggle Enhanced AI Search. Please check your backend logs.');
            // Revert on error
            setStores(prev => prev.map(s => s.id === storeId ? { ...s, enhanced_search_enabled: currentVal } : s));
        }
    };

    // Poll status for stores actively building
    useEffect(() => {
        const interval = setInterval(async () => {
            // Use functional state update to avoid stale closures and infinite re-renders
            setStores(currentStores => {
                const buildingStores = currentStores.filter(s => s.rag_index_status === 'building');
                if (buildingStores.length === 0) return currentStores;

                // We don't want to block the state updater, so we kick off async calls
                // and they will trigger another state update when done.
                buildingStores.forEach(async (store) => {
                    try {
                        const status = await apiGet<any>(`/api/store/${store.id}/enhanced-search/status`);
                        if (status.rag_index_status !== 'building') {
                            setStores(prev => prev.map(s => s.id === store.id ? {
                                ...s,
                                enhanced_search_enabled: status.enhanced_search_enabled,
                                rag_index_status: status.rag_index_status
                            } : s));
                        }
                    } catch (e) {
                        console.error("Status check failed for store", store.id, e);
                    }
                });

                return currentStores; // Return current unchanged while async finishes
            });
        }, 3000); // Check every 3 seconds

        return () => clearInterval(interval);
    }, []);

    const handleReindex = async (storeId: string) => {
        try {
            setStores(prev => prev.map(s => s.id === storeId ? { ...s, rag_index_status: 'building' } : s));
            await apiPost(`/api/store/${storeId}/enhanced-search/reindex`);
        } catch (err: any) {
            alert(err?.detail || 'Failed to start re-index.');
            setStores(prev => prev.map(s => s.id === storeId ? { ...s, rag_index_status: 'error' } : s));
        }
    };

    const handleLogout = () => {
        clearToken();
        router.push('/');
    };

    const handleOpenAnalytics = async (storeId: string) => {
        if (openAnalytics === storeId) {
            setOpenAnalytics(null);
            return;
        }
        setOpenAnalytics(storeId);
        setMetricsLoading(storeId);
        try {
            const [metrics, logs] = await Promise.all([
                apiGet<RagMetrics>(`/api/store/${storeId}/rag/metrics?days=7`),
                apiGet<SearchLogItem[]>(`/api/store/${storeId}/rag/logs?limit=20`),
            ]);
            setMetricsMap(prev => ({ ...prev, [storeId]: metrics }));
            setLogsMap(prev => ({ ...prev, [storeId]: logs }));
        } catch (e) {
            console.error('Failed to load RAG analytics', e);
        } finally {
            setMetricsLoading(null);
        }
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

                                {/* AI Enhanced Search Options */}
                                <div className="bg-white/5 border border-white/5 rounded-xl p-4 mb-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Sparkles className="w-4 h-4 text-purple-400" />
                                            <span className="text-sm font-semibold text-white">Enhanced AI Search (RAG)</span>
                                        </div>
                                        <button
                                            onClick={() => handleToggleRAG(store.id, store.enhanced_search_enabled)}
                                            className={`transition-colors ${store.enhanced_search_enabled ? 'text-emerald-400' : 'text-white/30 hover:text-white/50'}`}
                                        >
                                            {store.enhanced_search_enabled ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                                        </button>
                                    </div>

                                    {store.enhanced_search_enabled && (
                                        <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                            <div className="flex items-center gap-2">
                                                <Database className="w-4 h-4 text-white/40" />
                                                <span className="text-xs text-white/60">Status:</span>
                                                <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${store.rag_index_status === 'ready' ? 'bg-emerald-500/10 text-emerald-400' :
                                                    store.rag_index_status === 'building' ? 'bg-amber-500/10 text-amber-400 animate-pulse' :
                                                        store.rag_index_status === 'error' ? 'bg-red-500/10 text-red-400' :
                                                            'bg-white/10 text-white/50'
                                                    }`}>
                                                    {store.rag_index_status || 'idle'}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => handleReindex(store.id)}
                                                disabled={store.rag_index_status === 'building'}
                                                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 text-white/70"
                                            >
                                                <RefreshCw className={`w-3.5 h-3.5 ${store.rag_index_status === 'building' ? 'animate-spin' : ''}`} />
                                                Re-Index
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* RAG Analytics Panel */}
                                <div className="mb-4">
                                    <button
                                        onClick={() => handleOpenAnalytics(store.id)}
                                        className="w-full flex items-center justify-between px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-sm transition-colors group/analytics"
                                    >
                                        <span className="flex items-center gap-2 text-white/70 group-hover/analytics:text-white">
                                            <BarChart2 className="w-4 h-4 text-indigo-400" />
                                            RAG Analytics (7d)
                                        </span>
                                        {metricsLoading === store.id
                                            ? <Loader2 className="w-4 h-4 text-white/40 animate-spin" />
                                            : openAnalytics === store.id ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />
                                        }
                                    </button>

                                    <AnimatePresence>
                                        {openAnalytics === store.id && metricsMap[store.id] && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="mt-2 bg-black/20 border border-white/10 rounded-xl p-4 space-y-4">
                                                    {/* Metrics Grid */}
                                                    {(() => {
                                                        const m = metricsMap[store.id];
                                                        return (
                                                            <>
                                                                <div className="grid grid-cols-2 gap-3 text-xs">
                                                                    <div className="bg-white/5 rounded-lg p-3">
                                                                        <div className="text-white/40 mb-1">Total Searches</div>
                                                                        <div className="text-white font-bold text-lg">{m.total_searches}</div>
                                                                        <div className="text-white/30 mt-0.5">{m.pinecone_searches} Pinecone · {m.native_searches} Native</div>
                                                                    </div>
                                                                    <div className="bg-white/5 rounded-lg p-3">
                                                                        <div className="text-white/40 mb-1">Fallback Rate</div>
                                                                        <div className={`font-bold text-lg ${m.fallback_rate > 0.2 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                                                            {(m.fallback_rate * 100).toFixed(0)}%
                                                                        </div>
                                                                        <div className="text-white/30 mt-0.5">{m.fallback_rate > 0.2 ? '⚠ High' : '✓ Good'}</div>
                                                                    </div>
                                                                    <div className="bg-white/5 rounded-lg p-3">
                                                                        <div className="text-white/40 mb-1 flex items-center gap-1"><Clock className="w-3 h-3" /> Avg Latency</div>
                                                                        <div className={`font-bold text-lg ${m.avg_latency_ms > 1000 ? 'text-amber-400' : 'text-white'}`}>{m.avg_latency_ms}ms</div>
                                                                    </div>
                                                                    <div className="bg-white/5 rounded-lg p-3">
                                                                        <div className="text-white/40 mb-1">Avg Pinecone Score</div>
                                                                        <div className={`font-bold text-lg ${m.avg_pinecone_score !== null && m.avg_pinecone_score > 0.75 ? 'text-emerald-400' : 'text-white'}`}>
                                                                            {m.avg_pinecone_score !== null ? m.avg_pinecone_score.toFixed(3) : '—'}
                                                                        </div>
                                                                        {m.avg_ndcg !== null && <div className="text-white/30 mt-0.5">NDCG: {m.avg_ndcg.toFixed(3)}</div>}
                                                                    </div>
                                                                </div>

                                                                {/* Feedback */}
                                                                {(m.thumbs_up + m.thumbs_down) > 0 && (
                                                                    <div className="flex items-center gap-3 text-xs">
                                                                        <span className="text-white/40">User Feedback:</span>
                                                                        <span className="flex items-center gap-1 text-emerald-400"><ThumbsUp className="w-3 h-3" />{m.thumbs_up}</span>
                                                                        <span className="flex items-center gap-1 text-red-400"><ThumbsDown className="w-3 h-3" />{m.thumbs_down}</span>
                                                                        {m.feedback_ratio !== null && (
                                                                            <span className="text-white/40">({(m.feedback_ratio * 100).toFixed(0)}% positive)</span>
                                                                        )}
                                                                    </div>
                                                                )}

                                                                {/* Recent Queries */}
                                                                {logsMap[store.id] && logsMap[store.id].length > 0 && (
                                                                    <div>
                                                                        <div className="text-xs text-white/40 mb-2 font-semibold uppercase tracking-wider">Recent Queries</div>
                                                                        <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                                                                            {logsMap[store.id].map(log => (
                                                                                <div key={log.id} className="flex items-center justify-between text-xs bg-white/5 rounded-lg px-3 py-2">
                                                                                    <div className="flex items-center gap-2 min-w-0">
                                                                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0 ${log.provider === 'pinecone' ? 'bg-purple-500/20 text-purple-300' : log.provider === 'hybrid' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-white/10 text-white/50'}`}>
                                                                                            {log.provider}
                                                                                        </span>
                                                                                        <span className="text-white/70 truncate">{log.query || (log.has_image ? '🖼 Image search' : '—')}</span>
                                                                                    </div>
                                                                                    <div className="flex items-center gap-2 shrink-0 ml-2 text-white/40">
                                                                                        <span>{log.results_count} results</span>
                                                                                        {log.pinecone_top_score !== null && <span className="text-purple-400">{log.pinecone_top_score.toFixed(2)}</span>}
                                                                                        <span>{log.latency_ms}ms</span>
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {m.total_searches === 0 && (
                                                                    <p className="text-center text-white/30 text-xs py-2">No searches yet — use the storefront to generate data.</p>
                                                                )}
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
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

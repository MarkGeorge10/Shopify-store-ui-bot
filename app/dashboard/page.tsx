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
    default_mode: 'storefront' | 'admin';
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

    const handleUpdateMode = async (storeId: string, mode: 'storefront' | 'admin') => {
        // Optimistic update
        setStores(prev => prev.map(s => s.id === storeId ? { ...s, default_mode: mode } : s));
        try {
            await apiPut(`/api/store/${storeId}`, { default_mode: mode });
        } catch (err: any) {
            alert(err?.detail || 'Failed to update API mode.');
            // Revert
            setStores(prev => prev.map(s => s.id === storeId ? { ...s, default_mode: mode === 'admin' ? 'storefront' : 'admin' } : s));
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
        'w-full px-5 py-4 rounded-2xl bg-emerald-50/30 border border-emerald-100 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/5 outline-none text-sm text-emerald-950 placeholder-emerald-300 transition-all font-medium';

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white text-emerald-950 font-sans">
            {/* Background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-50 rounded-full blur-3xl opacity-60" />
                <div className="absolute bottom-20 -left-40 w-80 h-80 bg-emerald-50/50 rounded-full blur-3xl opacity-40" />
            </div>

            {/* Nav */}
            <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200"
                         style={{ background: 'var(--gradient-1)' }}>
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-emerald-950">AI Concierge</span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-emerald-600/60 font-medium">{user?.email}</span>
                    <button
                        onClick={handleLogout}
                        className="p-2 rounded-xl hover:bg-emerald-50 transition-colors text-emerald-400 hover:text-emerald-600"
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
                        <h1 className="text-3xl font-extrabold tracking-tight text-emerald-950">Your Stores</h1>
                        <p className="text-emerald-700/60 mt-1 text-sm font-medium">
                            Manage your Shopify stores and share their AI chatbot links.
                        </p>
                    </div>
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="btn-primary px-6 py-3 text-sm flex items-center gap-2 shadow-lg shadow-emerald-200"
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
                        className="mb-8 bg-white/80 backdrop-blur-md border border-emerald-100 rounded-3xl p-8 shadow-xl shadow-emerald-100/50"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-emerald-950">Connect New Store</h2>
                            <button onClick={() => setShowAddForm(false)} className="text-emerald-300 hover:text-emerald-500 transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleAddStore} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2 font-bold text-emerald-600">Store Name</label>
                                <input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="My Store" className={inputCls} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2">Shopify Domain</label>
                                <input value={formDomain} onChange={(e) => setFormDomain(e.target.value)} placeholder="your-store.myshopify.com" className={inputCls} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2">Storefront Token</label>
                                <input type="password" value={formStorefrontToken} onChange={(e) => setFormStorefrontToken(e.target.value)} placeholder="shpat_xxx" className={inputCls} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2">Admin Token <span className="text-emerald-300">(optional)</span></label>
                                <input type="password" value={formAdminToken} onChange={(e) => setFormAdminToken(e.target.value)} placeholder="shpat_xxx" className={inputCls} />
                            </div>
                            {formError && (
                                <div className="md:col-span-2 flex items-center gap-2 p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium">
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    {formError}
                                </div>
                            )}
                            <div className="md:col-span-2 pt-2">
                                <button
                                    type="submit"
                                    disabled={formLoading}
                                    className="btn-primary px-8 py-4 text-base flex items-center gap-2 shadow-lg shadow-emerald-200"
                                >
                                    {formLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
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
                        className="text-center py-24"
                    >
                        <div className="w-24 h-24 rounded-3xl bg-emerald-50 flex items-center justify-center mx-auto mb-8 shadow-inner">
                            <Store className="w-12 h-12 text-emerald-200" />
                        </div>
                        <h2 className="text-2xl font-bold text-emerald-950 mb-3">No stores connected</h2>
                        <p className="text-emerald-700/50 text-base mb-10 max-w-sm mx-auto font-medium">Connect your first Shopify store to start using AI-powered shopping concierge.</p>
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="btn-primary px-8 py-4 text-base flex items-center gap-2 shadow-lg shadow-emerald-200 mx-auto"
                        >
                            <Plus className="w-5 h-5" />
                            Add Your First Store
                        </button>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {stores.map((store, idx) => (
                            <motion.div
                                key={store.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="bg-white/80 backdrop-blur-md border border-emerald-100 rounded-3xl p-8 shadow-lg shadow-emerald-100/20 hover:shadow-xl hover:shadow-emerald-100/40 hover:border-emerald-200 transition-all group"
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center shadow-inner">
                                            <Store className="w-6 h-6 text-emerald-500" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-emerald-950">{store.name}</h3>
                                            <p className="text-sm text-emerald-400 font-medium">{store.shopify_domain}</p>
                                        </div>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-xs font-bold tracking-tight uppercase ${store.is_active ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                                        {store.is_active ? 'Active' : 'Inactive'}
                                    </div>
                                </div>

                                {/* Public link */}
                                <div className="bg-emerald-50/50 rounded-2xl p-4 flex items-center justify-between mb-6 border border-emerald-100/50 shadow-inner">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <Globe className="w-4 h-4 text-emerald-400 shrink-0" />
                                        <code className="text-xs font-bold text-emerald-600 truncate">/s/{store.slug}</code>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            onClick={() => handleCopyLink(store.slug)}
                                            className="p-2 rounded-xl hover:bg-white transition-all text-emerald-400 hover:text-emerald-700 shadow-sm"
                                            title="Copy public link"
                                        >
                                            {copiedSlug === store.slug ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                        <a
                                            href={`/s/${store.slug}`}
                                            target="_blank"
                                            className="p-2 rounded-xl hover:bg-white transition-all text-emerald-400 hover:text-emerald-700 shadow-sm"
                                            title="Open storefront"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
                                    </div>
                                </div>

                                {/* AI Enhanced Search Options */}
                                <div className="bg-emerald-50/30 border border-emerald-100 rounded-2xl p-5 mb-6 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Sparkles className="w-5 h-5 text-emerald-500" />
                                            <span className="text-sm font-bold text-emerald-950">Enhanced AI Search (RAG)</span>
                                        </div>
                                        <button
                                            onClick={() => handleToggleRAG(store.id, store.enhanced_search_enabled)}
                                            className={`transition-colors focus:outline-none ${store.enhanced_search_enabled ? 'text-emerald-500' : 'text-emerald-200 hover:text-emerald-300'}`}
                                        >
                                            {store.enhanced_search_enabled ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                                        </button>
                                    </div>

                                    {store.enhanced_search_enabled && (
                                        <div className="flex items-center justify-between pt-4 border-t border-emerald-100">
                                            <div className="flex items-center gap-2 text-xs">
                                                <Database className="w-4 h-4 text-emerald-400" />
                                                <span className="text-emerald-700/60 font-medium">Status:</span>
                                                <span className={`px-2 py-0.5 rounded-lg font-bold uppercase tracking-tighter ${store.rag_index_status === 'ready' ? 'bg-emerald-100 text-emerald-700' :
                                                    store.rag_index_status === 'building' ? 'bg-amber-100 text-amber-700 animate-pulse' :
                                                        store.rag_index_status === 'error' ? 'bg-red-100 text-red-700' :
                                                            'bg-emerald-50 text-emerald-400'
                                                    }`}>
                                                    {store.rag_index_status || 'idle'}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => handleReindex(store.id)}
                                                disabled={store.rag_index_status === 'building'}
                                                className="px-4 py-2 bg-white hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-xs font-bold transition-all border border-emerald-100 text-emerald-600 shadow-sm flex items-center gap-2"
                                            >
                                                <RefreshCw className={`w-3.5 h-3.5 ${store.rag_index_status === 'building' ? 'animate-spin' : ''}`} />
                                                Re-Index
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* RAG Analytics Panel */}
                                <div className="mb-6">
                                    <button
                                        onClick={() => handleOpenAnalytics(store.id)}
                                        className="w-full flex items-center justify-between px-5 py-3.5 bg-emerald-50 hover:bg-emerald-100/60 rounded-2xl text-sm font-bold transition-all group/analytics border border-emerald-100/50"
                                    >
                                        <span className="flex items-center gap-2 text-emerald-700">
                                            <BarChart2 className="w-5 h-5 text-emerald-500" />
                                            RAG Analytics (7d)
                                        </span>
                                        {metricsLoading === store.id
                                            ? <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                                            : openAnalytics === store.id ? <ChevronUp className="w-4 h-4 text-emerald-400" /> : <ChevronDown className="w-4 h-4 text-emerald-400" />
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
                                                <div className="mt-3 bg-white border border-emerald-100 rounded-2xl p-5 space-y-5 shadow-inner">
                                                    {/* Metrics Grid */}
                                                    {(() => {
                                                        const m = metricsMap[store.id];
                                                        return (
                                                            <>
                                                                <div className="grid grid-cols-2 gap-4 text-xs">
                                                                    <div className="bg-emerald-50/30 rounded-xl p-4 border border-emerald-100/30">
                                                                        <div className="text-emerald-800/40 mb-1 font-bold uppercase tracking-tighter">Total Searches</div>
                                                                        <div className="text-emerald-950 font-black text-2xl">{m.total_searches}</div>
                                                                        <div className="text-emerald-600/50 mt-1 font-medium">{m.pinecone_searches} Pinecone · {m.native_searches} Native</div>
                                                                    </div>
                                                                    <div className="bg-emerald-50/30 rounded-xl p-4 border border-emerald-100/30">
                                                                        <div className="text-emerald-800/40 mb-1 font-bold uppercase tracking-tighter">Fallback Rate</div>
                                                                        <div className={`font-black text-2xl ${m.fallback_rate > 0.2 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                                                            {(m.fallback_rate * 100).toFixed(0)}%
                                                                        </div>
                                                                        <div className="text-emerald-600/50 mt-1 font-medium">{m.fallback_rate > 0.2 ? '⚠ Needs Review' : '✓ Excellent'}</div>
                                                                    </div>
                                                                    <div className="bg-emerald-50/30 rounded-xl p-4 border border-emerald-100/30">
                                                                        <div className="text-emerald-800/40 mb-1 font-bold uppercase tracking-tighter flex items-center gap-1"><Clock className="w-3 h-3" /> Latency</div>
                                                                        <div className={`font-black text-2xl ${m.avg_latency_ms > 1000 ? 'text-amber-600' : 'text-emerald-950'}`}>{m.avg_latency_ms}ms</div>
                                                                    </div>
                                                                    <div className="bg-emerald-50/30 rounded-xl p-4 border border-emerald-100/30">
                                                                        <div className="text-emerald-800/40 mb-1 font-bold uppercase tracking-tighter">AI Accuracy</div>
                                                                        <div className={`font-black text-2xl ${m.avg_pinecone_score !== null && m.avg_pinecone_score > 0.75 ? 'text-emerald-600' : 'text-emerald-950'}`}>
                                                                            {m.avg_pinecone_score !== null ? m.avg_pinecone_score.toFixed(3) : '—'}
                                                                        </div>
                                                                        {m.avg_ndcg !== null && <div className="text-emerald-600/50 mt-1 font-medium italic">NDCG: {m.avg_ndcg.toFixed(3)}</div>}
                                                                    </div>
                                                                </div>

                                                                {/* Feedback */}
                                                                {(m.thumbs_up + m.thumbs_down) > 0 && (
                                                                    <div className="flex items-center gap-4 text-xs font-bold p-3 bg-emerald-50/50 rounded-xl border border-emerald-100/30">
                                                                        <span className="text-emerald-950/40 uppercase tracking-widest text-[10px]">Feedback:</span>
                                                                        <span className="flex items-center gap-1.5 text-emerald-600 bg-white px-2 py-1 rounded-lg shadow-sm"><ThumbsUp className="w-3.5 h-3.5" />{m.thumbs_up}</span>
                                                                        <span className="flex items-center gap-1.5 text-red-600 bg-white px-2 py-1 rounded-lg shadow-sm"><ThumbsDown className="w-3.5 h-3.5" />{m.thumbs_down}</span>
                                                                        {m.feedback_ratio !== null && (
                                                                            <span className="text-emerald-800/50">({(m.feedback_ratio * 100).toFixed(0)}% positive)</span>
                                                                        )}
                                                                    </div>
                                                                )}

                                                                {/* Recent Queries */}
                                                                {logsMap[store.id] && logsMap[store.id].length > 0 && (
                                                                    <div>
                                                                        <div className="text-[10px] text-emerald-950/30 mb-3 font-black uppercase tracking-widest">Recent Search Engine Activity</div>
                                                                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                                                            {logsMap[store.id].map(log => (
                                                                                <div key={log.id} className="flex items-center justify-between text-xs bg-emerald-50/30 hover:bg-emerald-50 rounded-xl px-4 py-3 border border-emerald-100/20 transition-colors">
                                                                                    <div className="flex items-center gap-3 min-w-0">
                                                                                        <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-tighter shrink-0 ${log.provider === 'pinecone' ? 'bg-indigo-100 text-indigo-700' : log.provider === 'hybrid' ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-50 text-emerald-400'}`}>
                                                                                            {log.provider}
                                                                                        </span>
                                                                                        <span className="text-emerald-950/80 font-bold truncate">{log.query || (log.has_image ? '📸 Photo Search' : '—')}</span>
                                                                                    </div>
                                                                                    <div className="flex items-center gap-3 shrink-0 ml-4 text-[10px] font-bold text-emerald-800/40">
                                                                                        <span className="bg-white px-1.5 py-0.5 rounded shadow-sm">{log.results_count} hits</span>
                                                                                        {log.pinecone_top_score !== null && <span className="text-emerald-600">{log.pinecone_top_score.toFixed(2)}</span>}
                                                                                        <span>{log.latency_ms}ms</span>
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {m.total_searches === 0 && (
                                                                    <p className="text-center text-emerald-950/20 text-sm py-4 font-medium italic">No search activity recorded yet.</p>
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
                                <div className="flex items-center gap-3">
                                    <a
                                        href={`/s/${store.slug}`}
                                        target="_blank"
                                        className="flex-1 px-6 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-2xl text-sm font-bold text-center transition-all flex items-center justify-center gap-2 border border-emerald-100/50"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        Launch Storefront
                                    </a>
                                    <button
                                        onClick={() => handleDeleteStore(store.id)}
                                        className="p-3 rounded-2xl hover:bg-red-50 text-emerald-200 hover:text-red-500 transition-all border border-transparent hover:border-red-100"
                                        title="Delete store"
                                    >
                                        <Trash2 className="w-5 h-5" />
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

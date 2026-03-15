'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    Store, Plus, Trash2, Pencil, ExternalLink, Copy, Check,
    Loader2, LogOut, Sparkles, Globe, ArrowRight, AlertCircle, X,
    Database, RefreshCw, ToggleLeft, ToggleRight, BarChart2, ChevronDown, ChevronUp, ThumbsUp, ThumbsDown, Clock, Bot
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
    clicked_product_id?: string | null;
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
        'w-full px-5 py-4 rounded-xl bg-zinc-900/40 border border-zinc-800 focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 outline-none text-sm text-zinc-100 placeholder-zinc-500 transition-all font-medium backdrop-blur-sm';

    if (loading) {
        return (
            <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#09090b] text-zinc-400 font-sans selection:bg-emerald-500/20">
            {/* Ambient Background Glows */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute -top-[10%] -right-[5%] w-[40%] h-[40%] bg-emerald-500/5 rounded-full blur-[120px]" />
                <div className="absolute top-[20%] -left-[10%] w-[30%] h-[30%] bg-emerald-500/2 rounded-full blur-[100px]" />
            </div>

            {/* Navbar */}
            <nav className="sticky top-0 z-50 w-full border-b border-zinc-800/50 bg-[#09090b]/80 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <Sparkles className="w-5 h-5 text-zinc-950" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-lg font-bold tracking-tight text-zinc-100">AI Concierge</span>
                            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-none">Merchant Portal</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="hidden md:flex flex-col items-end">
                            <span className="text-sm text-zinc-200 font-semibold">{user?.email}</span>
                            <span className="text-[10px] text-emerald-500 font-bold uppercase">Pro Account</span>
                        </div>
                        <div className="w-px h-6 bg-zinc-800" />
                        <button
                            onClick={handleLogout}
                            className="p-2.5 rounded-xl bg-zinc-900/50 border border-zinc-800 text-zinc-500 hover:text-zinc-100 hover:border-zinc-700 transition-all group"
                            title="Log out"
                        >
                            <LogOut className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                        </button>
                    </div>
                </div>
            </nav>

            {/* Main Content Area */}
            <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">
                {/* Dashboard Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div className="space-y-2">
                        <h1 className="text-4xl font-extrabold tracking-tight text-zinc-50">Your Stores</h1>
                        <p className="text-zinc-500 text-lg font-medium max-w-2xl">
                            Manage your Shopify integrations, monitor AI performance, and export storefront links.
                        </p>
                    </div>
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="flex items-center gap-2.5 px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/10 active:scale-95 shrink-0"
                    >
                        <Plus className="w-5 h-5" />
                        Add New Store
                    </button>
                </div>

                {/* Add Store Form Modal */}
                {showAddForm && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-12 bg-zinc-900/40 border border-zinc-800 rounded-3xl p-10 backdrop-blur-md shadow-2xl relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-4">
                            <button onClick={() => setShowAddForm(false)} className="text-zinc-500 hover:text-zinc-100 transition-colors p-2 hover:bg-zinc-800 rounded-lg">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-zinc-50">Connect New Store</h2>
                            <p className="text-zinc-500 text-sm mt-1">Provide your Shopify credentials to initialize the AI concierge.</p>
                        </div>

                        <form onSubmit={handleAddStore} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest pl-1">Display Name</label>
                                <input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Summer Collection 2025" className={inputCls} />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest pl-1">Shopify Domain</label>
                                <input value={formDomain} onChange={(e) => setFormDomain(e.target.value)} placeholder="your-store.myshopify.com" className={inputCls} />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest pl-1">Storefront Access Token</label>
                                <input type="password" value={formStorefrontToken} onChange={(e) => setFormStorefrontToken(e.target.value)} placeholder="shpat_..." className={inputCls} />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest pl-1 flex items-center justify-between">
                                    Admin API Token
                                    <span className="text-[10px] text-zinc-600 font-normal normal-case italic">Required for Re-Indexing</span>
                                </label>
                                <input type="password" value={formAdminToken} onChange={(e) => setFormAdminToken(e.target.value)} placeholder="shpat_..." className={inputCls} />
                            </div>
                            
                            {formError && (
                                <div className="md:col-span-2 flex items-center gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-medium">
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    {formError}
                                </div>
                            )}

                            <div className="md:col-span-2 pt-4 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={formLoading}
                                    className="px-10 py-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/10 flex items-center gap-3 active:scale-95 disabled:opacity-50"
                                >
                                    {formLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                                    Establish Connection
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}

                {/* Stores Grid Redesign */}
                {stores.length === 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-32 border border-dashed border-zinc-800 rounded-[2.5rem] bg-zinc-950/20">
                        <div className="w-24 h-24 rounded-full bg-zinc-900 flex items-center justify-center mx-auto mb-8 shadow-inner border border-zinc-800">
                            <Loader2 className="w-10 h-10 text-zinc-700" />
                        </div>
                        <h2 className="text-2xl font-bold text-zinc-50 mb-3">No Stores Connected</h2>
                        <p className="text-zinc-500 text-lg mb-10 max-w-sm mx-auto font-medium">Start by adding your first Shopify store to activate the AI concierge features.</p>
                        <button onClick={() => setShowAddForm(true)} className="px-8 py-4 bg-zinc-100 hover:bg-white text-zinc-950 font-bold rounded-xl transition-all shadow-xl active:scale-95 flex items-center gap-2 mx-auto">
                            <Plus className="w-6 h-6" /> Initialize First Store
                        </button>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {stores.map((store, idx) => (
                            <motion.div
                                key={store.id}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="group relative bg-[#18181b]/50 border border-[#27272a] hover:border-emerald-500/30 rounded-[2rem] p-8 shadow-premium transition-all duration-300 flex flex-col backdrop-blur-sm"
                            >
                                {/* Store Identity Section */}
                                <div className="flex items-start justify-between mb-8">
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-inner group-hover:bg-emerald-500/10 group-hover:border-emerald-500/20 transition-colors">
                                            <Store className="w-7 h-7 text-emerald-500" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-zinc-50 group-hover:text-emerald-400 transition-colors">{store.name}</h3>
                                            <p className="text-sm text-zinc-500 font-medium tracking-tight mt-1">{store.shopify_domain}</p>
                                        </div>
                                    </div>
                                    <div className={`px-4 py-1.5 rounded-xl text-[10px] font-black tracking-widest uppercase flex items-center gap-2 ${store.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800 text-zinc-500'}`}>
                                        {store.is_active && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                                        {store.is_active ? 'Live Coverage' : 'Service Paused'}
                                    </div>
                                </div>

                                {/* URL & Sharing */}
                                <div className="bg-zinc-950/80 rounded-2xl p-4 flex items-center justify-between mb-8 border border-zinc-800/50">
                                    <div className="flex items-center gap-3 min-w-0 px-1">
                                        <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                                            <Globe className="w-3.5 h-3.5" />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-[9px] text-zinc-600 font-black uppercase tracking-tighter leading-none mb-1">Public Concierge ID</span>
                                            <code className="text-xs font-bold text-zinc-300 truncate">/s/{store.slug}</code>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            onClick={() => handleCopyLink(store.slug)}
                                            className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-zinc-100 hover:border-zinc-700 transition-all"
                                            title="Copy link"
                                        >
                                            {copiedSlug === store.slug ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                        <a
                                            href={`/s/${store.slug}`}
                                            target="_blank"
                                            className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-zinc-100 hover:border-zinc-700 transition-all"
                                            title="Preview link"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
                                    </div>
                                </div>

                                {/* Engine Status & Controls */}
                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-4 flex flex-col justify-between h-28">
                                        <div className="flex items-center gap-2 text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                                            <Sparkles className="w-3.5 h-3.5 text-emerald-500" /> AI Engine
                                        </div>
                                        <div className="flex items-center justify-between mt-auto">
                                            <span className="text-sm font-bold text-zinc-300">Enhanced Search</span>
                                            <button
                                                onClick={() => handleToggleRAG(store.id, store.enhanced_search_enabled)}
                                                className={`transition-all ${store.enhanced_search_enabled ? 'text-emerald-500' : 'text-zinc-700 hover:text-zinc-600'}`}
                                            >
                                                {store.enhanced_search_enabled ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-4 flex flex-col justify-between h-28">
                                        <div className="flex items-center gap-2 text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                                            <Database className="w-3.5 h-3.5 text-zinc-500" /> RAG Index
                                        </div>
                                        <div className="flex items-center justify-between mt-auto">
                                            <span className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase ${
                                                store.rag_index_status === 'ready' ? 'bg-emerald-500/10 text-emerald-400' :
                                                store.rag_index_status === 'building' ? 'bg-amber-500/10 text-amber-500 animate-pulse' :
                                                'bg-zinc-800 text-zinc-500'
                                            }`}>
                                                {store.rag_index_status || 'idle'}
                                            </span>
                                            <button
                                                onClick={() => handleReindex(store.id)}
                                                disabled={store.rag_index_status === 'building'}
                                                className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-white transition-colors border border-zinc-700/50"
                                            >
                                                <RefreshCw className={`w-4 h-4 ${store.rag_index_status === 'building' ? 'animate-spin' : ''}`} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Analytics Toggle Area */}
                                <div className="mb-8">
                                    <button
                                        onClick={() => handleOpenAnalytics(store.id)}
                                        className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl font-bold transition-all border ${
                                            openAnalytics === store.id 
                                            ? 'bg-zinc-900 text-zinc-100 border-zinc-700' 
                                            : 'bg-zinc-900/20 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                                        }`}
                                    >
                                        <span className="flex items-center gap-3">
                                            <BarChart2 className={`w-5 h-5 ${openAnalytics === store.id ? 'text-emerald-500' : 'text-zinc-600'}`} />
                                            Analytics Performance (7d)
                                        </span>
                                        {metricsLoading === store.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronDown className={`w-4 h-4 transition-transform ${openAnalytics === store.id ? 'rotate-180' : ''}`} />}
                                    </button>

                                    <AnimatePresence>
                                        {openAnalytics === store.id && metricsMap[store.id] && (
                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                                                <div className="mt-4 p-6 bg-zinc-950/50 rounded-2xl border border-zinc-800/50 grid grid-cols-3 gap-6">
                                                    {Object.entries({
                                                        'Searches': metricsMap[store.id].total_searches,
                                                        'AI / Native': `${metricsMap[store.id].pinecone_searches} / ${metricsMap[store.id].native_searches}`,
                                                        'Fallback': `${(metricsMap[store.id].fallback_rate * 100).toFixed(0)}%`,
                                                        'Top Score': metricsMap[store.id].avg_pinecone_score?.toFixed(2) || '1.00',
                                                        'Avg Res': metricsMap[store.id].avg_results_count.toFixed(1),
                                                        'Latency': `${metricsMap[store.id].avg_latency_ms}ms`,
                                                    }).map(([label, val]) => (
                                                        <div key={label} className="flex flex-col">
                                                            <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mb-1">{label}</span>
                                                            <span className="text-lg font-bold text-zinc-100">{val}</span>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Search Logs Table */}
                                                <div className="mt-4 bg-zinc-950/50 rounded-2xl border border-zinc-800/50 overflow-hidden">
                                                    <div className="px-6 py-3 border-b border-zinc-800/50 flex justify-between items-center">
                                                        <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Recent Activity Logs</span>
                                                        <span className="text-[10px] text-zinc-600">Showing last 20 queries</span>
                                                    </div>
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-left text-xs border-collapse">
                                                            <thead className="text-zinc-500 font-bold uppercase tracking-tighter bg-zinc-900/40">
                                                                <tr>
                                                                    <th className="px-6 py-3">Query</th>
                                                                    <th className="px-4 py-3">Provider</th>
                                                                    <th className="px-4 py-3">Results</th>
                                                                    <th className="px-4 py-3">Score</th>
                                                                    <th className="px-4 py-3">Time</th>
                                                                    <th className="px-4 py-3 text-right">Feedback</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-zinc-800/30">
                                                                {logsMap[store.id]?.map((log) => (
                                                                    <tr key={log.id} className="hover:bg-zinc-900/40 transition-colors">
                                                                        <td className="px-6 py-3 font-medium text-zinc-300 max-w-[150px] truncate" title={log.query || '(Empty)'}>
                                                                            {log.query || <span className="text-zinc-700 italic">Empty</span>}
                                                                        </td>
                                                                        <td className="px-4 py-3">
                                                                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase ${
                                                                                log.provider === 'pinecone' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'
                                                                            }`}>
                                                                                {log.provider === 'pinecone' ? 'Vector' : 'Native'}
                                                                            </span>
                                                                        </td>
                                                                        <td className="px-4 py-3 text-zinc-400 font-mono">{log.results_count}</td>
                                                                        <td className="px-4 py-3 text-zinc-400 font-mono">
                                                                            {log.pinecone_top_score ? log.pinecone_top_score.toFixed(3) : '-'}
                                                                        </td>
                                                                        <td className="px-4 py-3 text-zinc-500">
                                                                            {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                        </td>
                                                                        <td className="px-4 py-3 text-right">
                                                                            {log.user_feedback === 1 ? <ThumbsUp className="w-3 h-3 text-emerald-500 ml-auto" /> : 
                                                                             log.user_feedback === -1 ? <ThumbsDown className="w-3 h-3 text-rose-500 ml-auto" /> : 
                                                                             <span className="text-zinc-800 text-[10px]">—</span>}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                                {(logsMap[store.id]?.length === 0) && (
                                                                    <tr>
                                                                        <td colSpan={6} className="px-6 py-10 text-center text-zinc-600 font-medium">
                                                                            No recent logs found.
                                                                        </td>
                                                                    </tr>
                                                                )}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Action Bar - Higher Emphasis */}
                                <div className="mt-auto flex items-center gap-4">
                                    <a
                                        href={`/s/${store.slug}`}
                                        target="_blank"
                                        className="flex-1 px-6 py-4 bg-emerald-500/8 hover:bg-emerald-500/15 text-emerald-400 font-bold rounded-2xl transition-all border border-emerald-500/20 hover:border-emerald-500/40 flex items-center justify-center gap-2 group/btn"
                                    >
                                        <Bot className="w-5 h-5 group/btn:scale-110 transition-transform" />
                                        Launch Concierge
                                    </a>
                                    <button
                                        onClick={() => handleDeleteStore(store.id)}
                                        className="p-4 rounded-2xl bg-rose-500/5 hover:bg-rose-500/10 text-rose-500/40 hover:text-rose-500 border border-transparent hover:border-rose-500/20 transition-all"
                                        title="Terminate Store"
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

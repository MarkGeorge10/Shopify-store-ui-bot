'use client';

import React, { useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Sparkles, Loader2, Image as ImageIcon, Upload, X, Search, ArrowLeft, ShoppingBag, Plus, UserRound } from 'lucide-react';
import Image from 'next/image';
import useShopperAuth from '@/hooks/useShopperAuth';
import type { Product } from '@/types';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/$/, '');

// ── Product mapper ──────────────────────────────────────────────────────────

function mapProduct(p: any): Product {
    return {
        id: p.id,
        title: p.title,
        description: p.description || '',
        imageUrl: p.image_url || null,
        price: p.price || '0.00',
        currency: p.currency || 'USD',
        variantId: p.variant_id || null,
        variants: (p.variants || []).map((v: any) => ({
            id: v.id,
            title: v.title || '',
            available: v.available ?? true,
            price: v.price || '0.00',
            currency: v.currency || 'USD',
            imageUrl: v.image_url || null,
            options: v.options || [],
        })),
        optionNames: p.option_names || [],
    };
}

export default function VisualSearchPage() {
    const params = useParams();
    const router = useRouter();
    const slug = (params?.slug as string) || '';

    const { customer, showAuthModal, setShowAuthModal, handleLogout } = useShopperAuth(slug);

    // UI State
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [query, setQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    // Results
    const [products, setProducts] = useState<Product[]>([]);
    const [hasSearched, setHasSearched] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        setPreviewUrl(null);
        setProducts([]);
        setHasSearched(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSearch = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!imageFile) {
            setError('Please upload an image to search.');
            return;
        }

        setIsSearching(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('image', imageFile);
            if (query.trim()) {
                formData.append('q', query.trim());
            }

            const res = await fetch(`${API_URL}/api/public/${slug}/search/image`, {
                method: 'POST',
                // Don't set Content-Type header manually for FormData
                body: formData,
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.detail || 'Visual search failed');
            }

            const data = await res.json();
            const mapped = (data.products || []).map(mapProduct);
            setProducts(mapped);
            setHasSearched(true);
        } catch (err: any) {
            setError(err.message || 'An error occurred during search.');
        } finally {
            setIsSearching(false);
        }
    };

    // Dummy empty handlers since there is no cart context in this isolated page.
    // In a real app we would use Context for cart/views or merge this into page.tsx.
    const handleAddToCart = () => {
        alert("To add items to your cart, click the back button and go to the main storefront.");
    };

    return (
        <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans flex flex-col">
            {/* Minimal nav — StorefrontHeader props don't match this page's context */}
            <header className="px-6 py-4 border-b border-neutral-200/60 bg-white/70 backdrop-blur-sm sticky top-0 z-10 flex justify-between items-center">
                <span className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-indigo-600" />
                    Visual Search
                </span>
                <button
                    onClick={customer ? handleLogout : () => setShowAuthModal(true)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-neutral-600 hover:bg-neutral-100 rounded-xl transition-all"
                >
                    <UserRound className="w-4 h-4" />
                    {customer ? `${customer.firstName} (Sign out)` : 'Sign In'}
                </button>
            </header>

            <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
                <button
                    onClick={() => router.push(`/s/${slug}`)}
                    className="flex items-center gap-2 text-neutral-500 hover:text-neutral-900 mb-6 transition-colors text-sm font-medium"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Store
                </button>

                <div className="bg-white rounded-3xl shadow-xl border border-neutral-100 p-8 text-center max-w-2xl mx-auto mb-12 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-50 rounded-full blur-3xl opacity-50 translate-y-1/2 -translate-x-1/2" />

                    <div className="relative z-10">
                        <div className="w-16 h-16 bg-neutral-900 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg rotate-3">
                            <Sparkles className="w-8 h-8" />
                        </div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 mb-3">
                            Visual AI Search
                        </h1>
                        <p className="text-neutral-500 mb-8 max-w-md mx-auto">
                            Upload a photo of something you like, and our AI will find the closest matches in our store.
                        </p>

                        <form onSubmit={handleSearch} className="space-y-6">
                            {/* Image Dropzone */}
                            {!previewUrl ? (
                                <div
                                    className="border-2 border-dashed border-neutral-300 rounded-2xl p-10 hover:border-indigo-500 hover:bg-neutral-50/50 transition-all cursor-pointer group"
                                    onClick={() => fileInputRef.current?.click()}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={handleDrop}
                                >
                                    <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                        <Upload className="w-6 h-6 text-neutral-500" />
                                    </div>
                                    <p className="text-sm font-medium text-neutral-700">Click or drag an image here</p>
                                    <p className="text-xs text-neutral-400 mt-2">Supports JPG, PNG, WEBP</p>
                                </div>
                            ) : (
                                <div className="relative w-full aspect-video md:aspect-[21/9] rounded-2xl overflow-hidden bg-neutral-100 border border-neutral-200 group">
                                    <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                                    <button
                                        type="button"
                                        onClick={handleRemoveImage}
                                        className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 backdrop-blur-md text-white rounded-full transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleImageSelect}
                            />

                            {/* Additional Query */}
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Add detail (e.g. 'in red' or 'just the shoes')..."
                                    className="w-full pl-12 pr-4 py-4 rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-inner"
                                />
                            </div>

                            {error && (
                                <div className="text-sm text-red-600 bg-red-50 py-2 px-4 rounded-lg text-left">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isSearching || !imageFile}
                                className="w-full py-4 bg-neutral-900 hover:bg-black text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-black/10 hover:shadow-black/20"
                            >
                                {isSearching ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Analyzing Image...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-5 h-5" />
                                        Find Similar Products
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Results Area */}
                <div className="mb-20">
                    {hasSearched ? (
                        products.length > 0 ? (
                            <>
                                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                    <ImageIcon className="w-5 h-5 text-indigo-500" />
                                    Visual Matches ({products.length})
                                </h2>
                                {/* Inline grid — ProductGrid requires many props not available here */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {products.map((product) => (
                                        <div key={product.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-neutral-100 flex flex-col">
                                            <div className="aspect-square relative bg-neutral-100 overflow-hidden">
                                                {product.imageUrl ? (
                                                    <Image src={product.imageUrl} alt={product.title} fill className="object-cover" referrerPolicy="no-referrer" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-neutral-300">
                                                        <ShoppingBag className="w-12 h-12" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-4 flex flex-col flex-1 gap-2">
                                                <h3 className="font-medium text-neutral-900 line-clamp-2 text-sm">{product.title}</h3>
                                                <div className="flex items-center justify-between mt-auto pt-2">
                                                    <p className="text-lg font-semibold text-indigo-600">{product.currency} {parseFloat(product.price).toFixed(2)}</p>
                                                    <button
                                                        onClick={handleAddToCart}
                                                        className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                                        title="Add to Cart"
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-20 border-2 border-dashed border-neutral-200 rounded-3xl">
                                <Search className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-neutral-900">No matches found</h3>
                                <p className="text-neutral-500">We couldn't find anything similar in the catalog.</p>
                            </div>
                        )
                    ) : null}
                </div>
            </main>
        </div>
    );
}

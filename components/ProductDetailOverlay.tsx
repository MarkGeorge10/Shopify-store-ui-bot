'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, X, Loader2, ShoppingCart, ShoppingBag, Sparkles, Star } from 'lucide-react';
import Image from 'next/image';
import { apiGet } from '@/lib/api';
import type { Product } from '@/types';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/$/, '');

export default function ProductDetailOverlay({ product, slug, onClose, onAddToCart, onAskAI }: ProductDetailOverlayProps) {
    const [productDetails, setProductDetails] = useState<any>(null);
    const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
    const [isLoadingProduct, setIsLoadingProduct] = useState(false);
    const [added, setAdded] = useState(false);

    useEffect(() => {
        if (!product) { setProductDetails(null); setSelectedOptions({}); return; }
        setIsLoadingProduct(true);
        const endpoint = slug
            ? `${API_URL}/api/public/${slug}/product/${encodeURIComponent(product.id)}`
            : `/api/products/${encodeURIComponent(product.id)}`;
        const fetchPromise = slug ? fetch(endpoint).then(res => res.json()) : apiGet(endpoint);
        fetchPromise
            .then((details) => {
                setProductDetails(details);
                if (details?.variants?.edges?.length) {
                    const firstVariant = details.variants.edges[0].node;
                    const defaults: Record<string, string> = {};
                    firstVariant.selectedOptions?.forEach((opt: any) => { defaults[opt.name] = opt.value; });
                    setSelectedOptions(defaults);
                }
                setIsLoadingProduct(false);
            })
            .catch(() => setIsLoadingProduct(false));
    }, [product?.id, slug]);

    const selectedVariant = productDetails?.variants?.edges?.find((edge: any) =>
        edge.node.selectedOptions?.every((opt: any) => selectedOptions[opt.name] === opt.value),
    )?.node ?? null;

    const optionGroups: Record<string, string[]> = {};
    productDetails?.variants?.edges?.forEach((edge: any) => {
        edge.node.selectedOptions?.forEach((opt: any) => {
            if (!optionGroups[opt.name]) optionGroups[opt.name] = [];
            if (!optionGroups[opt.name].includes(opt.value)) optionGroups[opt.name].push(opt.value);
        });
    });

    const handleAddToCart = () => {
        const varId = selectedVariant?.id ?? product?.variantId;
        if (varId) {
            onAddToCart(varId);
            setAdded(true);
            setTimeout(() => { setAdded(false); onClose(); }, 900);
        }
    };

    return (
        <AnimatePresence>
            {product && (
                <motion.div
                    initial={{ opacity: 0, x: 60 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 60 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 35 }}
                    className="absolute inset-0 z-20 flex flex-col"
                    style={{ background: 'white' }}
                >
                    {/* Header */}
                    <div className="px-7 py-5 flex items-center justify-between sticky top-0 glass-light z-10"
                        style={{ borderBottom: '1px solid rgba(16,185,129,0.1)' }}>
                        <button onClick={onClose}
                            className="flex items-center gap-2 text-sm font-semibold transition-colors hover:opacity-70"
                            style={{ color: 'var(--primary)' }}>
                            <ArrowLeft className="w-4 h-4" /> Back to Shop
                        </button>
                        <button onClick={onClose}
                            className="w-9 h-9 flex items-center justify-center rounded-2xl transition-colors hover:bg-emerald-50"
                            style={{ color: 'var(--text-3)' }}>
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-7 lg:p-10"
                        style={{ background: 'var(--surface-2)' }}>
                        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">
                            {/* Image */}
                            <div>
                                <div className="aspect-square relative rounded-3xl overflow-hidden shadow-lg"
                                    style={{ background: 'linear-gradient(135deg, #f0fdf4, #d1fae5)', border: '1px solid rgba(16,185,129,0.1)' }}>
                                    <AnimatePresence mode="wait">
                                        {(() => {
                                            const displayUrl = selectedVariant?.image?.url || product.imageUrl;
                                            return displayUrl ? (
                                                <motion.div key={displayUrl}
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    transition={{ duration: 0.25 }}
                                                    className="absolute inset-0"
                                                >
                                                    <Image src={displayUrl} alt={product.title} fill className="object-cover" referrerPolicy="no-referrer" />
                                                </motion.div>
                                            ) : (
                                                <motion.div key="placeholder" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                                    className="absolute inset-0 flex items-center justify-center">
                                                    <ShoppingBag className="w-20 h-20 opacity-15" style={{ color: 'var(--primary)' }} />
                                                </motion.div>
                                            );
                                        })()}
                                    </AnimatePresence>
                                </div>

                                {/* Fake star rating for polish */}
                                <div className="mt-4 flex items-center gap-1.5">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                                    ))}
                                    <span className="text-xs font-medium ml-1" style={{ color: 'var(--text-3)' }}>(4.9)</span>
                                </div>
                            </div>

                            {/* Info */}
                            <div className="flex flex-col">
                                <div className="mb-5">
                                    <span className="badge-gemini mb-3">
                                        <Sparkles className="w-2.5 h-2.5" /> Premium Quality
                                    </span>
                                    <h2 className="text-3xl font-extrabold leading-tight mb-4" style={{ color: 'var(--text-1)' }}>
                                        {product.title}
                                    </h2>
                                    <div className="text-3xl font-extrabold" style={{ color: 'var(--primary)' }}>
                                        {selectedVariant
                                            ? `${selectedVariant.price.currencyCode} ${parseFloat(selectedVariant.price.amount).toFixed(2)}`
                                            : `${product.currency} ${product.price}`}
                                    </div>
                                    {selectedVariant && !selectedVariant.availableForSale && (
                                        <span className="mt-2 inline-block text-xs font-bold text-red-500 bg-red-50 px-3 py-1 rounded-full">
                                            Out of stock
                                        </span>
                                    )}
                                </div>

                                {/* Description */}
                                <div className="text-sm leading-relaxed mb-6 p-4 rounded-2xl"
                                    style={{ background: 'rgba(16,185,129,0.05)', color: 'var(--text-2)', border: '1px solid rgba(16,185,129,0.08)' }}>
                                    {product.description || 'No description available for this product.'}
                                </div>

                                {/* Variant Picker */}
                                {isLoadingProduct ? (
                                    <div className="flex items-center gap-2 text-sm mb-6" style={{ color: 'var(--text-3)' }}>
                                        <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--primary)' }} /> Loading options...
                                    </div>
                                ) : Object.keys(optionGroups).length > 0 && (
                                    <div className="space-y-5 mb-6">
                                        {Object.entries(optionGroups).map(([optName, values]) => (
                                            <div key={optName}>
                                                <p className="text-sm font-bold mb-2.5" style={{ color: 'var(--text-2)' }}>
                                                    {optName}:{' '}
                                                    <span className="font-normal" style={{ color: 'var(--primary)' }}>{selectedOptions[optName]}</span>
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    {values.map((val) => {
                                                        const isSelected = selectedOptions[optName] === val;
                                                        const isAvailable = productDetails?.variants?.edges?.some((e: any) =>
                                                            e.node.availableForSale &&
                                                            e.node.selectedOptions?.some((o: any) => o.name === optName && o.value === val),
                                                        );
                                                        return (
                                                            <button
                                                                key={val}
                                                                onClick={() => setSelectedOptions((prev) => ({ ...prev, [optName]: val }))}
                                                                disabled={!isAvailable}
                                                                className="px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all"
                                                                style={isSelected ? {
                                                                    background: 'var(--gradient-1)',
                                                                    color: 'white',
                                                                    borderColor: 'transparent',
                                                                    boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
                                                                } : {
                                                                    borderColor: isAvailable ? 'rgba(16,185,129,0.2)' : 'rgba(0,0,0,0.06)',
                                                                    color: isAvailable ? 'var(--text-2)' : 'var(--text-3)',
                                                                    textDecoration: isAvailable ? 'none' : 'line-through',
                                                                }}
                                                            >
                                                                {val}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* CTAs */}
                                <div className="space-y-3 mt-auto">
                                    <button
                                        onClick={handleAddToCart}
                                        disabled={selectedVariant ? !selectedVariant.availableForSale : false}
                                        className="btn-primary w-full py-4 rounded-2xl text-base flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ShoppingCart className="w-5 h-5" />
                                        {added ? 'Added to Bag ✓' : 'Add to Bag'}
                                    </button>
                                    <button
                                        onClick={() => { onAskAI(product.title); onClose(); }}
                                        className="w-full py-4 rounded-2xl text-base font-bold transition-all flex items-center justify-center gap-2 border-2 hover:scale-[1.01] active:scale-[0.99]"
                                        style={{
                                            borderColor: 'rgba(16,185,129,0.25)',
                                            color: 'var(--primary)',
                                            background: 'rgba(16,185,129,0.05)',
                                        }}
                                    >
                                        <Sparkles className="w-4 h-4" />
                                        Ask AI about this
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

interface ProductDetailOverlayProps {
    product: Product | null;
    slug?: string;
    onClose: () => void;
    onAddToCart: (variantId: string) => void;
    onAskAI: (productTitle: string) => void;
}

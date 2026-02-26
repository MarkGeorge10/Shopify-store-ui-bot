'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, X, Loader2, ShoppingCart, ShoppingBag } from 'lucide-react';
import Image from 'next/image';
import { apiGet } from '@/lib/api';
import type { Product } from '@/types';

interface ProductDetailOverlayProps {
    product: Product | null;
    slug?: string;
    onClose: () => void;
    onAddToCart: (variantId: string) => void;
    onAskAI: (productTitle: string) => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function ProductDetailOverlay({
    product,
    slug,
    onClose,
    onAddToCart,
    onAskAI,
}: ProductDetailOverlayProps) {
    const [productDetails, setProductDetails] = useState<any>(null);
    const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
    const [isLoadingProduct, setIsLoadingProduct] = useState(false);

    useEffect(() => {
        if (!product) { setProductDetails(null); setSelectedOptions({}); return; }
        setIsLoadingProduct(true);

        const endpoint = slug
            ? `${API_URL}/api/public/${slug}/product/${encodeURIComponent(product.id)}`
            : `/api/products/${encodeURIComponent(product.id)}`;

        const fetchPromise = slug
            ? fetch(endpoint).then(res => res.json())
            : apiGet(endpoint);

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
            .catch((err) => {
                console.error('Error fetching product details:', err);
                setIsLoadingProduct(false);
            });
    }, [product?.id, slug]);

    const selectedVariant =
        productDetails?.variants?.edges?.find((edge: any) =>
            edge.node.selectedOptions?.every(
                (opt: any) => selectedOptions[opt.name] === opt.value,
            ),
        )?.node ?? null;

    const optionGroups: Record<string, string[]> = {};
    productDetails?.variants?.edges?.forEach((edge: any) => {
        edge.node.selectedOptions?.forEach((opt: any) => {
            if (!optionGroups[opt.name]) optionGroups[opt.name] = [];
            if (!optionGroups[opt.name].includes(opt.value)) optionGroups[opt.name].push(opt.value);
        });
    });

    return (
        <AnimatePresence>
            {product && (
                <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 50 }}
                    className="absolute inset-0 z-20 bg-white flex flex-col"
                >
                    {/* Header */}
                    <div className="px-8 py-6 border-b border-neutral-100 flex items-center justify-between bg-white sticky top-0">
                        <button
                            onClick={onClose}
                            className="flex items-center gap-2 text-neutral-500 hover:text-indigo-600 transition-colors font-medium text-sm"
                        >
                            <ArrowLeft className="w-4 h-4" /> Back to Shop
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
                            <X className="w-5 h-5 text-neutral-400" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-8 lg:p-12">
                        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
                            {/* Image */}
                            <div className="space-y-4">
                                <div className="aspect-square relative rounded-3xl overflow-hidden bg-neutral-100 border border-neutral-100 shadow-sm">
                                    <AnimatePresence mode="wait">
                                        {(() => {
                                            const displayUrl = selectedVariant?.image?.url || product.imageUrl;
                                            return displayUrl ? (
                                                <motion.div key={displayUrl} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="absolute inset-0">
                                                    <Image src={displayUrl} alt={product.title} fill className="object-cover" referrerPolicy="no-referrer" />
                                                </motion.div>
                                            ) : (
                                                <motion.div key="placeholder" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex items-center justify-center text-neutral-300">
                                                    <ShoppingBag className="w-20 h-20" />
                                                </motion.div>
                                            );
                                        })()}
                                    </AnimatePresence>
                                </div>
                            </div>

                            {/* Info */}
                            <div className="flex flex-col">
                                <div className="mb-6">
                                    <span className="inline-block px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-4">
                                        Premium Quality
                                    </span>
                                    <h2 className="text-3xl font-bold text-neutral-900 mb-3 leading-tight">{product.title}</h2>
                                    <div className="text-2xl font-bold text-indigo-600">
                                        {selectedVariant
                                            ? `${selectedVariant.price.currencyCode} ${parseFloat(selectedVariant.price.amount).toFixed(2)}`
                                            : `${product.currency} ${product.price}`}
                                    </div>
                                    {selectedVariant && !selectedVariant.availableForSale && (
                                        <span className="mt-2 inline-block text-xs text-red-500 font-semibold">Out of stock</span>
                                    )}
                                </div>

                                <div className="prose prose-neutral prose-sm mb-6 text-neutral-600 leading-relaxed">
                                    <p className="font-semibold text-neutral-900 mb-1">Description</p>
                                    {product.description || 'No description available for this product.'}
                                </div>

                                {/* Variant Picker */}
                                {isLoadingProduct ? (
                                    <div className="flex items-center gap-2 text-neutral-400 text-sm mb-6">
                                        <Loader2 className="w-4 h-4 animate-spin" /> Loading options...
                                    </div>
                                ) : Object.keys(optionGroups).length > 0 && (
                                    <div className="space-y-5 mb-6">
                                        {Object.entries(optionGroups).map(([optName, values]) => (
                                            <div key={optName}>
                                                <p className="text-sm font-semibold text-neutral-700 mb-2">
                                                    {optName}:{' '}
                                                    <span className="font-normal text-neutral-500">{selectedOptions[optName]}</span>
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
                                                                className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all ${isSelected
                                                                    ? 'border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-100'
                                                                    : isAvailable
                                                                        ? 'border-neutral-200 text-neutral-700 hover:border-indigo-400'
                                                                        : 'border-neutral-100 text-neutral-300 line-through cursor-not-allowed'
                                                                    }`}
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

                                <div className="space-y-3 mt-auto">
                                    <button
                                        onClick={() => {
                                            const varId = selectedVariant?.id ?? product.variantId;
                                            if (varId) { onAddToCart(varId); onClose(); }
                                        }}
                                        disabled={selectedVariant ? !selectedVariant.availableForSale : false}
                                        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-200 active:scale-[0.98]"
                                    >
                                        <ShoppingCart className="w-5 h-5" /> Add to Bag
                                    </button>
                                    <button
                                        onClick={() => { onAskAI(product.title); onClose(); }}
                                        className="w-full bg-white border-2 border-neutral-200 hover:border-indigo-600 hover:text-indigo-600 text-neutral-700 font-semibold py-4 px-6 rounded-2xl transition-all active:scale-[0.98]"
                                    >
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

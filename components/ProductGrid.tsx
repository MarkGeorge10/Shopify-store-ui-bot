'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, ShoppingBag, Plus, Check, Sparkles, Tag } from 'lucide-react';
import Image from 'next/image';
import type { Product, PageInfo, Variant } from '@/types';

const COLOR_MAP: Record<string, string> = {
    red: '#EF4444', blue: '#3B82F6', green: '#22C55E', yellow: '#EAB308',
    black: '#1F2937', white: '#F9FAFB', pink: '#EC4899', purple: '#A855F7',
    orange: '#F97316', brown: '#92400E', gray: '#6B7280', grey: '#6B7280',
    navy: '#1E3A5F', beige: '#D4C5A9', cream: '#FFFDD0', teal: '#14B8A6',
    maroon: '#7F1D1D', olive: '#84CC16', coral: '#F87171', gold: '#CA8A04',
    silver: '#9CA3AF', burgundy: '#881337', charcoal: '#374151', ivory: '#FEFCE8',
    lavender: '#C084FC', mint: '#86EFAC', peach: '#FDBA74', rose: '#FDA4AF',
    sage: '#A3B18A', tan: '#D2B48C', turquoise: '#2DD4BF', wine: '#722F37',
};

function getColorHex(colorName: string): string | null {
    const lower = colorName.toLowerCase().trim();
    if (COLOR_MAP[lower]) return COLOR_MAP[lower];
    for (const [name, hex] of Object.entries(COLOR_MAP)) {
        if (lower.includes(name)) return hex;
    }
    return null;
}

interface ProductGridProps {
    products: Product[];
    pageInfo: PageInfo;
    collections: any[];
    selectedCollection: string | null;
    isSearching: boolean;
    onSelectProduct: (product: Product) => void;
    onAddToCart: (variantId: string) => void;
    onLoadMore: () => void;
    onSelectCollection: (id: string | null) => void;
    onClearCollection: () => void;
    setProducts: (p: Product[]) => void;
    setPageInfo: (pi: PageInfo) => void;
    setIsSearching: (v: boolean) => void;
    setSelectedCollection: (id: string | null) => void;
}

export default function ProductGrid({
    products, pageInfo, collections, selectedCollection, isSearching,
    onSelectProduct, onAddToCart, onLoadMore, onSelectCollection, onClearCollection,
    setProducts, setPageInfo, setIsSearching, setSelectedCollection,
}: ProductGridProps) {
    const handleCollectionClick = (collectionId: string) => {
        setSelectedCollection(collectionId);
        onSelectCollection(collectionId);
    };

    return (
        <div className="flex-1 overflow-y-auto p-6" style={{ background: 'var(--surface-2)' }}>
            {/* Collection Filter Bar */}
            {collections.length > 0 && (
                <div className="mb-6 flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                    <button
                        onClick={onClearCollection}
                        className="px-4 py-2 rounded-2xl text-sm font-semibold transition-all whitespace-nowrap"
                        style={selectedCollection === null ? {
                            background: 'var(--gradient-1)',
                            color: 'white',
                            boxShadow: '0 4px 16px rgba(6,95,70,0.35)',
                        } : {
                            background: 'white',
                            color: 'var(--text-2)',
                            border: '1.5px solid rgba(6,95,70,0.15)',
                        }}
                    >
                        All Products
                    </button>
                    {collections.map((coll) => (
                        <button
                            key={coll.id}
                            onClick={() => handleCollectionClick(coll.id)}
                            className="px-4 py-2 rounded-2xl text-sm font-semibold transition-all whitespace-nowrap"
                            style={selectedCollection === coll.id ? {
                                background: 'var(--gradient-1)',
                                color: 'white',
                                boxShadow: '0 4px 16px rgba(6,95,70,0.35)',
                            } : {
                                background: 'white',
                                color: 'var(--text-2)',
                                border: '1.5px solid rgba(6,95,70,0.15)',
                            }}
                        >
                            {coll.title}
                        </button>
                    ))}
                </div>
            )}

            {/* Grid Body */}
            {isSearching ? (
                <div className="h-80 flex flex-col items-center justify-center gap-4" style={{ color: 'var(--text-3)' }}>
                    <div className="w-14 h-14 rounded-3xl flex items-center justify-center"
                        style={{ background: 'rgba(6,95,70,0.1)' }}>
                        <Loader2 className="w-7 h-7 animate-spin" style={{ color: 'var(--primary)' }} />
                    </div>
                    <p className="font-medium text-sm">Searching catalog...</p>
                </div>
            ) : products.length > 0 ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
                >
                    {products.map((product, idx) => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            idx={idx}
                            onSelect={() => onSelectProduct(product)}
                            onAddToCart={onAddToCart}
                        />
                    ))}
                </motion.div>
            ) : (
                <div className="h-80 flex flex-col items-center justify-center gap-5">
                    <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
                        style={{ background: 'rgba(6,95,70,0.08)' }}>
                        <ShoppingBag className="w-10 h-10" style={{ color: 'rgba(6,95,70,0.3)' }} />
                    </div>
                    <div className="text-center">
                        <p className="font-semibold mb-1" style={{ color: 'var(--text-2)' }}>No products found</p>
                        <p className="text-sm" style={{ color: 'var(--text-3)' }}>Try asking the AI concierge!</p>
                    </div>
                </div>
            )}

            {/* Load More */}
            {pageInfo.hasNextPage && products.length > 0 && (
                <div className="mt-10 flex justify-center">
                    <button
                        onClick={onLoadMore}
                        disabled={isSearching}
                        className="px-8 py-3 rounded-2xl font-semibold text-sm transition-all flex items-center gap-2 hover:scale-105"
                        style={{
                            background: 'white',
                            color: 'var(--primary)',
                            border: '1.5px solid rgba(6,95,70,0.25)',
                            boxShadow: '0 4px 20px rgba(6,95,70,0.1)',
                        }}
                    >
                        {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        Load More Products
                    </button>
                </div>
            )}
        </div>
    );
}

function ProductCard({ product, idx, onSelect, onAddToCart }: {
    product: Product; idx: number;
    onSelect: () => void; onAddToCart: (variantId: string) => void;
}) {
    const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
        if (!product.variants.length) return {};
        const defaults: Record<string, string> = {};
        product.variants[0]?.options.forEach((o) => { defaults[o.name] = o.value; });
        return defaults;
    });
    const [addedFeedback, setAddedFeedback] = useState(false);

    const selectedVariant: Variant | null =
        product.variants.find((v) => v.options.every((o) => selectedOptions[o.name] === o.value))
        ?? product.variants[0] ?? null;

    const optionGroups: Record<string, string[]> = {};
    product.variants.forEach((v) => {
        v.options.forEach((o) => {
            if (!optionGroups[o.name]) optionGroups[o.name] = [];
            if (!optionGroups[o.name].includes(o.value)) optionGroups[o.name].push(o.value);
        });
    });

    const hasVariants = product.variants.length > 1;
    const displayPrice = selectedVariant?.price ?? product.price;
    const displayCurrency = selectedVariant?.currency ?? product.currency;
    const displayImage = selectedVariant?.imageUrl || product.imageUrl;
    const isNew = idx % 5 === 0;

    const handleAddToCart = (e: React.MouseEvent) => {
        e.stopPropagation();
        const vid = selectedVariant?.id ?? product.variantId;
        if (vid) {
            onAddToCart(vid);
            setAddedFeedback(true);
            setTimeout(() => setAddedFeedback(false), 1200);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.04, type: 'spring', stiffness: 300, damping: 25 }}
            className="bg-white rounded-[2rem] overflow-hidden group cursor-pointer flex flex-col transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_20px_60px_rgba(6,95,70,0.15)]"
            style={{ border: '1px solid rgba(6,95,70,0.08)' }}
        >
            {/* Image Section */}
            <div className="aspect-[4/5] relative overflow-hidden bg-emerald-50/30" onClick={onSelect}>
                {displayImage ? (
                    <Image
                        src={displayImage}
                        alt={product.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-1000 ease-out"
                        referrerPolicy="no-referrer"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="w-12 h-12 opacity-10 text-emerald-500" />
                    </div>
                )}

                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                    {isNew && (
                        <div className="px-3 py-1 rounded-full bg-emerald-700 text-white text-[10px] font-bold tracking-widest uppercase shadow-lg shadow-emerald-700/20">
                            New
                        </div>
                    )}
                    {product.variants.every(v => !v.available) && (
                        <div className="px-3 py-1 rounded-full bg-emerald-950/80 backdrop-blur-md text-white text-[10px] font-bold tracking-widest uppercase">
                            Sold Out
                        </div>
                    )}
                </div>

                {/* Quick View Overlay */}
                <div className="absolute inset-0 bg-emerald-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-2xl scale-50 group-hover:scale-100 transition-transform duration-500">
                        <Sparkles className="w-6 h-6 text-emerald-600" />
                    </div>
                </div>
            </div>

            {/* Info Section */}
            <div className="p-5 flex flex-col flex-1 gap-4">
                <div className="space-y-1.5">
                    <h3
                        className="font-bold text-[15px] line-clamp-2 cursor-pointer transition-colors leading-relaxed tracking-tight"
                        style={{ color: 'var(--text-1)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                        onClick={onSelect}
                    >
                        {product.title}
                    </h3>
                    <div className="flex items-center gap-1">
                        <Tag className="w-3 h-3 text-emerald-700/50" />
                        <span className="text-[10px] font-bold text-emerald-800/60 uppercase tracking-widest">Premium Selection</span>
                    </div>
                </div>

                {/* Variant selectors */}
                {hasVariants && (
                    <div className="flex flex-col gap-3">
                        {Object.entries(optionGroups).map(([optName, values]) => {
                            const isColor = optName.toLowerCase().includes('color') || optName.toLowerCase().includes('colour');
                            if (isColor) {
                                return (
                                    <div key={optName} className="flex items-center gap-2 flex-wrap">
                                        {values.map((val) => {
                                            const hex = getColorHex(val);
                                            const isSelected = selectedOptions[optName] === val;
                                            const isAvailable = product.variants.some(
                                                (v) => v.available && v.options.some((o) => o.name === optName && o.value === val),
                                            );
                                            if (!isAvailable) return null;
                                            return (
                                                <button
                                                    key={val}
                                                    title={val}
                                                    onClick={(e) => { e.stopPropagation(); setSelectedOptions((prev) => ({ ...prev, [optName]: val })); }}
                                                    className={`w-5 h-5 rounded-full border-2 transition-all p-0.5 ${isSelected ? 'border-emerald-700 ring-2 ring-emerald-700/10' : 'border-transparent'}`}
                                                >
                                                    <div className="w-full h-full rounded-full shadow-inner" style={{ backgroundColor: hex || '#ccc' }} />
                                                </button>
                                            );
                                        })}
                                    </div>
                                );
                            }
                            return (
                                <div key={optName} className="flex items-center gap-1.5 flex-wrap">
                                    {values.map((val) => {
                                        const isSelected = selectedOptions[optName] === val;
                                        const isAvailable = product.variants.some(
                                            (v) => v.available && v.options.some((o) => o.name === optName && o.value === val),
                                        );
                                        if (!isAvailable) return null;
                                        return (
                                            <button
                                                key={val}
                                                onClick={(e) => { e.stopPropagation(); setSelectedOptions((prev) => ({ ...prev, [optName]: val })); }}
                                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all uppercase tracking-tighter ${isSelected
                                                    ? 'bg-emerald-800 text-white border-transparent'
                                                    : 'bg-emerald-50/50 text-black border-emerald-100 hover:border-emerald-300'}`}
                                            >
                                                {val}
                                            </button>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Footer: Price + Add */}
                <div className="flex items-center justify-between mt-auto pt-2">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-emerald-800/60 uppercase tracking-widest">{displayCurrency}</span>
                        <span className="text-xl font-black text-black" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                            {parseFloat(displayPrice).toFixed(2)}
                        </span>
                    </div>
                    <button
                        onClick={handleAddToCart}
                        disabled={selectedVariant ? !selectedVariant.available : false}
                        className={`group relative h-12 px-6 rounded-2xl font-bold text-sm tracking-tight transition-all duration-300 flex items-center gap-2 overflow-hidden ${addedFeedback
                            ? 'bg-emerald-800 text-white shadow-lg shadow-emerald-200'
                            : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-800 hover:text-white hover:shadow-lg hover:shadow-emerald-100'}`}
                    >
                        <AnimatePresence mode="wait">
                            {addedFeedback ? (
                                <motion.div key="check" initial={{ y: 20 }} animate={{ y: 0 }} exit={{ y: -20 }} className="flex items-center gap-2">
                                    <Check className="w-4 h-4" /> Added
                                </motion.div>
                            ) : (
                                <motion.div key="plus" initial={{ y: 20 }} animate={{ y: 0 }} exit={{ y: -20 }} className="flex items-center gap-2">
                                    <Plus className="w-4 h-4" /> Add
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

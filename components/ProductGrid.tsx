'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Loader2, ShoppingBag, Plus, Check } from 'lucide-react';
import Image from 'next/image';
import type { Product, PageInfo, Variant } from '@/types';

// Common color name → hex mapping for swatches
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
    // Direct match
    if (COLOR_MAP[lower]) return COLOR_MAP[lower];
    // Partial match (e.g. "Light Blue" → blue)
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
    products,
    pageInfo,
    collections,
    selectedCollection,
    isSearching,
    onSelectProduct,
    onAddToCart,
    onLoadMore,
    onSelectCollection,
    onClearCollection,
    setProducts,
    setPageInfo,
    setIsSearching,
    setSelectedCollection,
}: ProductGridProps) {
    const handleCollectionClick = (collectionId: string) => {
        setSelectedCollection(collectionId);
        onSelectCollection(collectionId);
    };

    return (
        <div className="flex-1 overflow-y-auto p-8">
            {/* Collection Filter Bar */}
            {collections.length > 0 && (
                <div className="mb-6 flex items-center gap-2 overflow-x-auto no-scrollbar">
                    <button
                        onClick={onClearCollection}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${selectedCollection === null
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                            : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                            }`}
                    >
                        All Products
                    </button>
                    {collections.map((coll) => (
                        <button
                            key={coll.id}
                            onClick={() => handleCollectionClick(coll.id)}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${selectedCollection === coll.id
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                                }`}
                        >
                            {coll.title}
                        </button>
                    ))}
                </div>
            )}

            {/* Grid Body */}
            {isSearching ? (
                <div className="h-full flex flex-col items-center justify-center text-neutral-400 space-y-4">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                    <p>Searching catalog...</p>
                </div>
            ) : products.length > 0 ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
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
                <div className="h-full flex flex-col items-center justify-center text-neutral-400 space-y-4">
                    <ShoppingBag className="w-12 h-12 opacity-20" />
                    <p>No products found. Try asking the concierge!</p>
                </div>
            )}

            {/* Load More */}
            {pageInfo.hasNextPage && products.length > 0 && (
                <div className="mt-12 flex justify-center">
                    <button
                        onClick={onLoadMore}
                        disabled={isSearching}
                        className="px-8 py-3 bg-white border border-neutral-200 text-neutral-700 rounded-xl font-semibold hover:bg-neutral-50 hover:border-neutral-300 transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
                    >
                        {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        Load More Products
                    </button>
                </div>
            )}
        </div>
    );
}


// ── Product Card with Variant Selectors ──────────────────────────────────────

function ProductCard({
    product,
    idx,
    onSelect,
    onAddToCart,
}: {
    product: Product;
    idx: number;
    onSelect: () => void;
    onAddToCart: (variantId: string) => void;
}) {
    const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
        if (!product.variants.length) return {};
        const defaults: Record<string, string> = {};
        product.variants[0]?.options.forEach((o) => { defaults[o.name] = o.value; });
        return defaults;
    });

    // Get selected variant based on chosen options
    const selectedVariant: Variant | null =
        product.variants.find((v) =>
            v.options.every((o) => selectedOptions[o.name] === o.value),
        ) ?? product.variants[0] ?? null;

    // Collect unique values per option name
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

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-neutral-100 group cursor-pointer flex flex-col"
        >
            {/* Image */}
            <div className="aspect-square relative bg-neutral-100 overflow-hidden" onClick={onSelect}>
                {displayImage ? (
                    <Image
                        src={displayImage}
                        alt={product.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-300">
                        <ShoppingBag className="w-12 h-12" />
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="p-4 flex flex-col flex-1 gap-2">
                <h3
                    className="font-medium text-neutral-900 line-clamp-2 text-sm cursor-pointer hover:text-indigo-600 transition-colors"
                    onClick={onSelect}
                >
                    {product.title}
                </h3>

                {/* Variant Selectors */}
                {hasVariants && Object.entries(optionGroups).map(([optName, values]) => {
                    const isColor = optName.toLowerCase().includes('color') || optName.toLowerCase().includes('colour');

                    if (isColor) {
                        // Color swatches
                        return (
                            <div key={optName} className="flex items-center gap-1.5 flex-wrap">
                                {values.map((val) => {
                                    const hex = getColorHex(val);
                                    const isSelected = selectedOptions[optName] === val;
                                    const isAvailable = product.variants.some(
                                        (v) => v.available && v.options.some((o) => o.name === optName && o.value === val),
                                    );

                                    return (
                                        <button
                                            key={val}
                                            title={val}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedOptions((prev) => ({ ...prev, [optName]: val }));
                                            }}
                                            disabled={!isAvailable}
                                            className={`w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center
                                                ${isSelected
                                                    ? 'border-indigo-600 ring-2 ring-indigo-200 scale-110'
                                                    : isAvailable
                                                        ? 'border-neutral-200 hover:border-neutral-400'
                                                        : 'border-neutral-100 opacity-30 cursor-not-allowed'
                                                }`}
                                            style={hex ? { backgroundColor: hex } : {
                                                background: 'linear-gradient(135deg, #ddd 25%, #999 75%)',
                                            }}
                                        >
                                            {isSelected && (
                                                <Check
                                                    className="w-3 h-3"
                                                    style={{ color: hex && ['#1F2937', '#1E3A5F', '#7F1D1D', '#881337', '#374151', '#722F37'].includes(hex) ? 'white' : '#1F2937' }}
                                                />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        );
                    }

                    // Size / other pills
                    return (
                        <div key={optName} className="flex items-center gap-1 flex-wrap">
                            {values.map((val) => {
                                const isSelected = selectedOptions[optName] === val;
                                const isAvailable = product.variants.some(
                                    (v) => v.available && v.options.some((o) => o.name === optName && o.value === val),
                                );

                                return (
                                    <button
                                        key={val}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedOptions((prev) => ({ ...prev, [optName]: val }));
                                        }}
                                        disabled={!isAvailable}
                                        className={`px-2 py-0.5 rounded-md text-xs font-medium border transition-all
                                            ${isSelected
                                                ? 'border-indigo-600 bg-indigo-600 text-white'
                                                : isAvailable
                                                    ? 'border-neutral-200 text-neutral-600 hover:border-indigo-400'
                                                    : 'border-neutral-100 text-neutral-300 line-through cursor-not-allowed'
                                            }`}
                                    >
                                        {val}
                                    </button>
                                );
                            })}
                        </div>
                    );
                })}

                {/* Price + Add to Cart */}
                <div className="flex items-center justify-between mt-auto pt-2">
                    <p className="text-lg font-semibold text-indigo-600">
                        {displayCurrency} {parseFloat(displayPrice).toFixed(2)}
                    </p>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            const vid = selectedVariant?.id ?? product.variantId;
                            if (vid) onAddToCart(vid);
                        }}
                        disabled={selectedVariant ? !selectedVariant.available : false}
                        className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white disabled:bg-neutral-100 disabled:text-neutral-300 disabled:cursor-not-allowed transition-all shadow-sm"
                        title="Add to Cart"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

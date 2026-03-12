'use client';

import { ShoppingBag, ShoppingCart, Sparkles, ArrowLeft } from 'lucide-react';
import type { Cart, ViewMode, Customer } from '@/types';

interface StorefrontHeaderProps {
    viewMode: ViewMode;
    cart: Cart | null;
    products: any[];
    customer: Customer | null;
    onToggleCart: () => void;
    onLoginClick: () => void;
}

export default function StorefrontHeader({
    viewMode, cart, products, customer, onToggleCart, onLoginClick,
}: StorefrontHeaderProps) {
    const cartCount = cart?.items.reduce((acc, item) => acc + item.quantity, 0) ?? 0;

    const label =
        viewMode === 'shop'
            ? `${products.length} Products`
            : viewMode === 'checkout'
                ? 'Secure Checkout'
                : `${cart?.items.length ?? 0} Items`;

    const title =
        viewMode === 'shop' ? 'Storefront' : viewMode === 'cart' ? 'Your Bag' : 'Checkout';

    return (
        <div
            className="px-7 py-5 sticky top-0 z-10 flex justify-between items-center glass-light"
            style={{
                borderBottom: '1px solid rgba(16,185,129,0.1)',
                background: 'rgba(255,255,255,0.92)',
                backdropFilter: 'blur(20px)',
            }}
        >
            {/* Left: title */}
            <div className="flex items-center gap-3">
                {viewMode !== 'shop' && (
                    <button
                        onClick={onToggleCart}
                        className="w-8 h-8 flex items-center justify-center rounded-xl transition-colors hover:bg-emerald-50 text-emerald-500"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                )}
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(52,211,153,0.15))' }}>
                        <ShoppingBag className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                    </div>
                    <div>
                        <h2 className="text-base font-bold" style={{ color: 'var(--text-1)' }}>{title}</h2>
                        <p className="text-xs font-medium" style={{ color: 'var(--text-3)' }}>{label}</p>
                    </div>
                </div>
            </div>

            {/* Right: actions */}
            <div className="flex items-center gap-3">
                {/* Powered by badge */}
                <div className="badge-gemini hidden sm:flex">
                    <Sparkles className="w-2.5 h-2.5" /> Gemini AI
                </div>

                <div className="w-px h-5 rounded-full" style={{ background: 'rgba(16,185,129,0.15)' }} />

                {/* Cart toggle */}
                <button
                    onClick={onToggleCart}
                    className="relative flex items-center gap-2 px-3 py-2 rounded-2xl font-semibold text-sm transition-all hover:scale-105"
                    style={{
                        background: cartCount > 0 ? 'var(--gradient-1)' : 'rgba(16,185,129,0.08)',
                        color: cartCount > 0 ? 'white' : 'var(--primary)',
                        boxShadow: cartCount > 0 ? '0 4px 16px rgba(16,185,129,0.35)' : 'none',
                    }}
                >
                    {viewMode === 'shop' ? (
                        <>
                            <ShoppingCart className="w-4 h-4" />
                            {cartCount > 0 && (
                                <span className="font-bold text-xs">{cartCount}</span>
                            )}
                        </>
                    ) : (
                        <ShoppingBag className="w-4 h-4" />
                    )}
                </button>
            </div>
        </div>
    );
}

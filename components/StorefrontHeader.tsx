'use client';

import { ShoppingBag, ShoppingCart, Sparkles, UserRound } from 'lucide-react';
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
    viewMode,
    cart,
    products,
    customer,
    onToggleCart,
    onLoginClick,
}: StorefrontHeaderProps) {
    const cartCount = cart?.items.reduce((acc, item) => acc + item.quantity, 0) ?? 0;

    const label =
        viewMode === 'shop'
            ? `${products.length} Products`
            : viewMode === 'checkout'
                ? 'Checkout'
                : `${cart?.items.length ?? 0} Items`;

    const title =
        viewMode === 'shop' ? 'Storefront' : viewMode === 'cart' ? 'Your Bag' : 'Checkout';

    return (
        <div className="px-8 py-6 border-b border-neutral-200/60 bg-white/50 backdrop-blur-sm sticky top-0 z-10 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-neutral-800 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-indigo-600" />
                {title}
            </h2>
            <div className="flex items-center gap-4">
                {/* User Auth Button */}
                <button
                    onClick={onLoginClick}
                    className="flex items-center gap-2 px-3 py-1.5 hover:bg-neutral-100 rounded-xl transition-all font-medium text-sm text-neutral-600"
                >
                    {customer ? (
                        <>
                            <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px]">
                                {customer.firstName[0]}{customer.lastName[0]}
                            </div>
                            <span className="hidden sm:inline">{customer.firstName}</span>
                        </>
                    ) : (
                        <>
                            <UserRound className="w-5 h-5" />
                            <span className="hidden sm:inline">Sign In</span>
                        </>
                    )}
                </button>

                <div className="w-px h-6 bg-neutral-200"></div>

                {/* Cart Toggle */}
                <button
                    onClick={onToggleCart}
                    className="relative p-2 hover:bg-neutral-100 rounded-xl transition-all group"
                >
                    {viewMode === 'shop' ? (
                        <>
                            <ShoppingCart className="w-6 h-6 text-neutral-600 group-hover:text-indigo-600" />
                            {cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
                                    {cartCount}
                                </span>
                            )}
                        </>
                    ) : (
                        <Sparkles className="w-6 h-6 text-indigo-600" />
                    )}
                </button>
                <div className="text-sm text-neutral-500 font-medium bg-white px-3 py-1 rounded-full shadow-sm border border-neutral-100">
                    {label}
                </div>
            </div>
        </div>
    );
}

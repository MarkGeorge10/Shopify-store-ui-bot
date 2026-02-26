'use client';

import { useState } from 'react';
import { apiPost } from '@/lib/api';
import type { Cart, CartItem } from '@/types';

// ── API Response Types ────────────────────────────────────────────────────────

interface ApiCartLineItem {
    line_id: string;
    variant_id: string;
    title: string;
    quantity: number;
    price: string;
    currency: string;
    image_url: string | null;
}

interface ApiCartCost {
    subtotal: string;
    total: string;
    currency: string;
}

interface ApiCartResponse {
    cart_id: string;
    checkout_url: string | null;
    lines: ApiCartLineItem[];
    cost: ApiCartCost | null;
}

// ── Mapper ───────────────────────────────────────────────────────────────────

function mapApiCartToLocal(apiCart: ApiCartResponse): Cart {
    return {
        id: apiCart.cart_id,
        checkoutUrl: apiCart.checkout_url || undefined,
        items: apiCart.lines.map(
            (line): CartItem => ({
                id: line.line_id,
                quantity: line.quantity,
                title: line.title,
                price: line.price,
                variantId: line.variant_id,
                imageUrl: line.image_url || undefined,
            }),
        ),
        totalAmount: apiCart.cost?.total || '0.00',
        currencyCode: apiCart.cost?.currency || 'USD',
    };
}

/** @deprecated — kept for backwards compatibility with useChat. Use mapApiCartToLocal instead. */
export function parseShopifyCart(shopifyCart: any): Cart {
    return mapApiCartToLocal(shopifyCart);
}

// ── Hook ─────────────────────────────────────────────────────────────────────

interface UseCartOptions {
    onViewCart: () => void;
}

export function useCart({ onViewCart }: UseCartOptions) {
    const [cart, setCart] = useState<Cart | null>(null);

    const handleCartAction = async (
        action: 'add' | 'remove' | 'increase' | 'decrease',
        variantId: string,
    ) => {
        if (action === 'add') onViewCart();

        try {
            let result: ApiCartResponse;

            if (action === 'add') {
                if (!cart?.id) {
                    // No cart exists yet — create one with initial line
                    result = await apiPost<ApiCartResponse>('/api/cart/create', {
                        variant_id: variantId,
                        quantity: 1,
                    });
                } else {
                    result = await apiPost<ApiCartResponse>('/api/cart/add', {
                        cart_id: cart.id,
                        variant_id: variantId,
                        quantity: 1,
                    });
                }
            } else if (action === 'remove') {
                if (!cart?.id) return;
                const item = cart.items.find((i) => i.variantId === variantId || i.id === variantId);
                if (!item) return;
                result = await apiPost<ApiCartResponse>('/api/cart/remove', {
                    cart_id: cart.id,
                    line_id: item.id,
                });
            } else {
                // increase or decrease
                if (!cart?.id) return;
                const item = cart.items.find((i) => i.variantId === variantId || i.id === variantId);
                if (!item) return;

                const newQuantity =
                    action === 'increase' ? item.quantity + 1 : Math.max(0, item.quantity - 1);

                if (newQuantity === 0) {
                    result = await apiPost<ApiCartResponse>('/api/cart/remove', {
                        cart_id: cart.id,
                        line_id: item.id,
                    });
                } else {
                    result = await apiPost<ApiCartResponse>('/api/cart/update', {
                        cart_id: cart.id,
                        line_id: item.id,
                        quantity: newQuantity,
                    });
                }
            }

            setCart(mapApiCartToLocal(result!));
        } catch (err) {
            console.error('Cart action error:', err);
        }
    };

    return { cart, setCart, handleCartAction };
}

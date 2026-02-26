'use client';

import { ShoppingBag, Minus, Plus, Trash2, Lock, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import type { Cart } from '@/types';

interface CartViewProps {
    cart: Cart | null;
    onIncrease: (variantId: string) => void;
    onDecrease: (variantId: string) => void;
    onRemove: (variantId: string) => void;
    onContinueShopping: () => void;
    onCheckout: () => void;
}

export default function CartView({
    cart,
    onIncrease,
    onDecrease,
    onRemove,
    onContinueShopping,
    onCheckout,
}: CartViewProps) {
    const isEmpty = !cart || cart.items.length === 0;

    return (
        <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-3xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-bold text-neutral-900">Your Shopping Bag</h3>
                    <button
                        onClick={onContinueShopping}
                        className="text-indigo-600 font-medium hover:underline text-sm"
                    >
                        Continue Shopping
                    </button>
                </div>

                {isEmpty ? (
                    <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-neutral-200">
                        <ShoppingBag className="w-16 h-16 text-neutral-200 mx-auto mb-4" />
                        <p className="text-neutral-500 font-medium">Your cart is empty</p>
                        <button
                            onClick={onContinueShopping}
                            className="mt-6 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold shadow-md shadow-indigo-100"
                        >
                            Go to Shop
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Line items */}
                        <div className="bg-white rounded-3xl border border-neutral-100 shadow-sm overflow-hidden">
                            {cart.items.map((item, idx) => (
                                <div
                                    key={item.id}
                                    className={`p-6 flex items-center gap-6 ${idx !== cart.items.length - 1 ? 'border-b border-neutral-50' : ''
                                        }`}
                                >
                                    <div className="w-20 h-20 bg-neutral-100 rounded-2xl flex items-center justify-center text-neutral-300 relative overflow-hidden shrink-0">
                                        {item.imageUrl ? (
                                            <Image src={item.imageUrl} alt={item.title} fill className="object-cover" />
                                        ) : (
                                            <ShoppingBag className="w-8 h-8" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-neutral-900">{item.title}</h4>
                                        <p className="text-indigo-600 font-medium">{cart.currencyCode} {item.price}</p>
                                    </div>
                                    <div className="flex items-center bg-neutral-50 rounded-xl p-1">
                                        <button
                                            onClick={() => onDecrease(item.variantId)}
                                            className="p-2 hover:bg-white rounded-lg transition-colors"
                                        >
                                            <Minus className="w-4 h-4 text-neutral-500" />
                                        </button>
                                        <span className="w-8 text-center font-bold text-neutral-700">{item.quantity}</span>
                                        <button
                                            onClick={() => onIncrease(item.variantId)}
                                            className="p-2 hover:bg-white rounded-lg transition-colors"
                                        >
                                            <Plus className="w-4 h-4 text-indigo-600" />
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => onRemove(item.variantId)}
                                        className="p-3 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Summary + CTA */}
                        <div className="bg-white rounded-3xl border border-neutral-100 shadow-sm p-8">
                            <div className="flex justify-between items-center mb-6">
                                <span className="text-neutral-500 font-medium">Subtotal</span>
                                <span className="text-2xl font-bold text-neutral-900">
                                    {cart.currencyCode} {cart.totalAmount}
                                </span>
                            </div>
                            <button
                                onClick={onCheckout}
                                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                <Lock className="w-5 h-5" />
                                Proceed to Checkout
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

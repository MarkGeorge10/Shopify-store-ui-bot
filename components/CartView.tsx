'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Minus, Plus, Trash2, Lock, ChevronRight, ArrowLeft, Gift } from 'lucide-react';
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

export default function CartView({ cart, onIncrease, onDecrease, onRemove, onContinueShopping, onCheckout }: CartViewProps) {
    const isEmpty = !cart || cart.items.length === 0;

    return (
        <div className="flex-1 overflow-y-auto p-6" style={{ background: 'var(--surface-2)' }}>
            <div className="max-w-3xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-extrabold" style={{ color: 'var(--text-1)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Your Bag</h3>
                    <button
                        onClick={onContinueShopping}
                        className="flex items-center gap-1.5 text-sm font-semibold transition-colors hover:opacity-80"
                        style={{ color: 'var(--primary)' }}
                    >
                        <ArrowLeft className="w-4 h-4" /> Continue Shopping
                    </button>
                </div>

                {!isEmpty && (
                    <div className="mb-8 p-6 rounded-[2rem] bg-emerald-50/50 border border-emerald-100/50">
                        <div className="flex justify-between items-end mb-3">
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Rewards</span>
                                <p className="text-sm font-bold text-emerald-950">You're almost at Free Shipping!</p>
                            </div>
                            <p className="text-xs font-bold text-emerald-600">
                                {Number(cart.totalAmount) >= 100 ? 'Unlocked!' : `${cart.currencyCode} ${(100 - Number(cart.totalAmount)).toFixed(2)} away`}
                            </p>
                        </div>
                        <div className="h-2 w-full bg-emerald-100 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min((Number(cart.totalAmount) / 100) * 100, 100)}%` }}
                                className="h-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                            />
                        </div>
                    </div>
                )}

                {isEmpty ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-3xl p-14 text-center"
                        style={{ background: 'white', border: '1.5px dashed rgba(16,185,129,0.2)' }}
                    >
                        <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5"
                            style={{ background: 'rgba(16,185,129,0.08)' }}>
                            <ShoppingBag className="w-10 h-10" style={{ color: 'rgba(16,185,129,0.3)' }} />
                        </div>
                        <p className="font-bold text-lg mb-2" style={{ color: 'var(--text-1)' }}>Your cart is empty</p>
                        <p className="text-sm mb-6" style={{ color: 'var(--text-3)' }}>Looks like you haven't added anything yet</p>
                        <button
                            onClick={onContinueShopping}
                            className="btn-primary px-7 py-3 text-sm rounded-2xl"
                        >
                            Go to Shop
                        </button>
                    </motion.div>
                ) : (
                    <div className="space-y-5">
                        {/* Line items */}
                        <div className="rounded-3xl overflow-hidden" style={{ background: 'white', boxShadow: 'var(--shadow-card)' }}>
                            {cart.items.map((item, idx) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.07 }}
                                    className="p-5 flex items-center gap-5"
                                    style={{ borderBottom: idx !== cart.items.length - 1 ? '1px solid rgba(16,185,129,0.07)' : 'none' }}
                                >
                                    {/* Image */}
                                    <div className="w-20 h-20 rounded-2xl relative overflow-hidden shrink-0"
                                        style={{ background: 'linear-gradient(135deg, #f0fdf4, #d1fae5)' }}>
                                        {item.imageUrl
                                            ? <Image src={item.imageUrl} alt={item.title} fill className="object-cover" />
                                            : <ShoppingBag className="w-8 h-8 absolute inset-0 m-auto opacity-20" style={{ color: 'var(--primary)' }} />}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-sm truncate mb-1" style={{ color: 'var(--text-1)' }}>{item.title}</h4>
                                        <p className="text-base font-bold" style={{ color: 'var(--primary)' }}>
                                            {cart.currencyCode} {item.price}
                                        </p>
                                    </div>

                                    {/* Quantity */}
                                    <div className="flex items-center gap-1 rounded-2xl p-1" style={{ background: 'rgba(16,185,129,0.06)' }}>
                                        <button onClick={() => onDecrease(item.id)}
                                            className="w-8 h-8 flex items-center justify-center rounded-xl transition-all hover:bg-white hover:shadow-sm">
                                            <Minus className="w-3.5 h-3.5" style={{ color: 'var(--text-2)' }} />
                                        </button>
                                        <span className="w-8 text-center text-sm font-bold" style={{ color: 'var(--text-1)' }}>
                                            {item.quantity}
                                        </span>
                                        <button onClick={() => onIncrease(item.id)}
                                            className="w-8 h-8 flex items-center justify-center rounded-xl transition-all hover:bg-white hover:shadow-sm"
                                            style={{ color: 'var(--primary)' }}>
                                            <Plus className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
 
                                    {/* Remove */}
                                    <button onClick={() => onRemove(item.id)}
                                        className="p-2 rounded-xl transition-all hover:bg-red-50 hover:text-red-500"
                                        style={{ color: 'var(--text-3)' }}>
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </motion.div>
                            ))}
                        </div>

                        {/* Summary + CTA */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="rounded-3xl p-7" style={{ background: 'white', boxShadow: 'var(--shadow-card)' }}
                        >
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium" style={{ color: 'var(--text-3)' }}>Subtotal</span>
                                <span className="text-2xl font-extrabold" style={{ color: 'var(--text-1)' }}>
                                    {cart.currencyCode} {cart.totalAmount}
                                </span>
                            </div>
                            <p className="text-xs mb-6" style={{ color: 'var(--text-3)' }}>Shipping and taxes calculated at checkout</p>

                            <button
                                onClick={onCheckout}
                                className="btn-primary w-full py-4 rounded-2xl text-base flex items-center justify-center gap-2"
                            >
                                <Lock className="w-4 h-4" />
                                Proceed to Checkout
                                <ChevronRight className="w-5 h-5" />
                            </button>

                            <div className="mt-4 flex items-center justify-center gap-2 text-xs font-medium"
                                style={{ color: 'var(--text-3)' }}>
                                <Gift className="w-3.5 h-3.5" />
                                Free returns · Secure payment
                            </div>
                        </motion.div>
                    </div>
                )}
            </div>
        </div>
    );
}

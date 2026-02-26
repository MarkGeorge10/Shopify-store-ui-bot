'use client';

import { ArrowLeft, Lock, User, ShoppingBag, CreditCard } from 'lucide-react';
import Image from 'next/image';
import type { Cart, CheckoutForm } from '@/types';

interface CheckoutViewProps {
    cart: Cart | null;
    form: CheckoutForm;
    onFormChange: (field: keyof CheckoutForm, value: string) => void;
    onBack: () => void;
    onPlaceOrder: () => void;
}

export default function CheckoutView({
    cart,
    form,
    onFormChange,
    onBack,
    onPlaceOrder,
}: CheckoutViewProps) {
    const inputCls =
        'px-4 py-3 rounded-xl border border-neutral-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 outline-none text-sm transition-all';

    return (
        <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-neutral-500 hover:text-indigo-600 transition-colors font-medium text-sm"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Bag
                    </button>
                    <h3 className="text-2xl font-bold text-neutral-900 flex-1">Checkout</h3>
                    <span className="flex items-center gap-1 text-xs text-neutral-400 font-medium">
                        <Lock className="w-3 h-3" /> Secure
                    </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    {/* Form Column */}
                    <div className="lg:col-span-3 space-y-6">
                        {/* Contact */}
                        <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-6">
                            <h4 className="font-bold text-neutral-900 mb-4 flex items-center gap-2">
                                <User className="w-4 h-4 text-indigo-500" /> Contact
                            </h4>
                            <div className="space-y-3">
                                <input
                                    type="email" placeholder="Email address"
                                    value={form.email}
                                    onChange={(e) => onFormChange('email', e.target.value)}
                                    className={`w-full ${inputCls}`}
                                />
                                <div className="grid grid-cols-2 gap-3">
                                    <input
                                        type="text" placeholder="First name"
                                        value={form.firstName}
                                        onChange={(e) => onFormChange('firstName', e.target.value)}
                                        className={inputCls}
                                    />
                                    <input
                                        type="text" placeholder="Last name"
                                        value={form.lastName}
                                        onChange={(e) => onFormChange('lastName', e.target.value)}
                                        className={inputCls}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Shipping */}
                        <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-6">
                            <h4 className="font-bold text-neutral-900 mb-4 flex items-center gap-2">
                                <ShoppingBag className="w-4 h-4 text-indigo-500" /> Shipping Address
                            </h4>
                            <div className="space-y-3">
                                <input
                                    type="text" placeholder="Street address"
                                    value={form.address}
                                    onChange={(e) => onFormChange('address', e.target.value)}
                                    className={`w-full ${inputCls}`}
                                />
                                <div className="grid grid-cols-2 gap-3">
                                    <input type="text" placeholder="City" value={form.city}
                                        onChange={(e) => onFormChange('city', e.target.value)} className={inputCls} />
                                    <input type="text" placeholder="State / Province" value={form.state}
                                        onChange={(e) => onFormChange('state', e.target.value)} className={inputCls} />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <input type="text" placeholder="ZIP / Postal code" value={form.zip}
                                        onChange={(e) => onFormChange('zip', e.target.value)} className={inputCls} />
                                    <select
                                        value={form.country}
                                        onChange={(e) => onFormChange('country', e.target.value)}
                                        className={`bg-white ${inputCls}`}
                                    >
                                        <option value="US">United States</option>
                                        <option value="CA">Canada</option>
                                        <option value="GB">United Kingdom</option>
                                        <option value="AU">Australia</option>
                                        <option value="DE">Germany</option>
                                        <option value="FR">France</option>
                                        <option value="AE">UAE</option>
                                        <option value="SA">Saudi Arabia</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <button
                            disabled={!cart?.checkoutUrl}
                            onClick={onPlaceOrder}
                            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-100 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            <CreditCard className="w-5 h-5" />
                            Place Order — {cart?.currencyCode} {cart?.totalAmount}
                        </button>
                        <p className="text-center text-xs text-neutral-400 mt-1">
                            You will be securely redirected to complete payment
                        </p>
                    </div>

                    {/* Order Summary Column */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-6 sticky top-4">
                            <h4 className="font-bold text-neutral-900 mb-4">Order Summary</h4>
                            <div className="space-y-3 mb-4">
                                {cart?.items.map((item) => (
                                    <div key={item.id} className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-neutral-100 rounded-lg relative overflow-hidden shrink-0">
                                            {item.imageUrl
                                                ? <Image src={item.imageUrl} alt={item.title} fill className="object-cover" />
                                                : <ShoppingBag className="w-4 h-4 text-neutral-300 absolute inset-0 m-auto" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium text-neutral-800 truncate">{item.title}</p>
                                            <p className="text-xs text-neutral-400">Qty {item.quantity}</p>
                                        </div>
                                        <span className="text-xs font-semibold text-neutral-700 shrink-0">
                                            {cart.currencyCode} {(parseFloat(item.price) * item.quantity).toFixed(2)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <div className="border-t border-neutral-100 pt-4 flex justify-between items-center">
                                <span className="font-semibold text-neutral-700">Total</span>
                                <span className="text-lg font-bold text-indigo-600">
                                    {cart?.currencyCode} {cart?.totalAmount}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

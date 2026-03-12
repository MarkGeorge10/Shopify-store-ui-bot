'use client';

import { ArrowLeft, Lock, User, MapPin, CreditCard, ShieldCheck } from 'lucide-react';
import Image from 'next/image';
import { ShoppingBag } from 'lucide-react';
import type { Cart, CheckoutForm } from '@/types';

export default function CheckoutView({ cart, form, onFormChange, onBack, onPlaceOrder }: CheckoutViewProps) {
    const inputStyle = {
        padding: '12px 16px',
        borderRadius: '14px',
        border: '1.5px solid rgba(16,185,129,0.15)',
        fontSize: '14px',
        outline: 'none',
        transition: 'all 0.2s',
        width: '100%',
        background: 'white',
        color: 'var(--text-1)',
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
        e.target.style.borderColor = 'var(--primary)';
        e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.1)';
    };
    const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
        e.target.style.borderColor = 'rgba(16,185,129,0.15)';
        e.target.style.boxShadow = 'none';
    };

    return (
        <div className="flex-1 overflow-y-auto p-6" style={{ background: 'var(--surface-2)' }}>
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-7">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-sm font-semibold transition-colors hover:opacity-80"
                        style={{ color: 'var(--primary)' }}
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Bag
                    </button>
                    <div className="flex-1" />
                    <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--primary-dark)' }}>
                        <ShieldCheck className="w-3.5 h-3.5" /> Secure Checkout
                    </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* Form Column */}
                    <div className="lg:col-span-3 space-y-5">
                        {/* Contact */}
                        <div className="rounded-3xl p-6" style={{ background: 'white', boxShadow: 'var(--shadow-card)' }}>
                            <h4 className="font-bold mb-5 flex items-center gap-2" style={{ color: 'var(--text-1)' }}>
                                <div className="w-7 h-7 rounded-xl flex items-center justify-center"
                                    style={{ background: 'rgba(16,185,129,0.1)' }}>
                                    <User className="w-3.5 h-3.5" style={{ color: 'var(--primary)' }} />
                                </div>
                                Contact Info
                            </h4>
                            <div className="space-y-3">
                                <input
                                    type="email" placeholder="Email address"
                                    value={form.email}
                                    onChange={(e) => onFormChange('email', e.target.value)}
                                    style={inputStyle}
                                    onFocus={handleFocus} onBlur={handleBlur}
                                />
                                <div className="grid grid-cols-2 gap-3">
                                    <input type="text" placeholder="First name" value={form.firstName}
                                        onChange={(e) => onFormChange('firstName', e.target.value)}
                                        style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
                                    <input type="text" placeholder="Last name" value={form.lastName}
                                        onChange={(e) => onFormChange('lastName', e.target.value)}
                                        style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
                                </div>
                            </div>
                        </div>

                        {/* Shipping */}
                        <div className="rounded-3xl p-6" style={{ background: 'white', boxShadow: 'var(--shadow-card)' }}>
                            <h4 className="font-bold mb-5 flex items-center gap-2" style={{ color: 'var(--text-1)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                <div className="w-7 h-7 rounded-xl flex items-center justify-center"
                                    style={{ background: 'rgba(16,185,129,0.1)' }}>
                                    <MapPin className="w-3.5 h-3.5" style={{ color: 'var(--primary)' }} />
                                </div>
                                Shipping Address
                            </h4>
                            <div className="space-y-4">
                                <input type="text" placeholder="Street address" value={form.address}
                                    onChange={(e) => onFormChange('address', e.target.value)}
                                    style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
                                <div className="grid grid-cols-2 gap-4">
                                    <input type="text" placeholder="City" value={form.city}
                                        onChange={(e) => onFormChange('city', e.target.value)}
                                        style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
                                    <input type="text" placeholder="State / Province" value={form.state}
                                        onChange={(e) => onFormChange('state', e.target.value)}
                                        style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <input type="text" placeholder="ZIP / Postal code" value={form.zip}
                                        onChange={(e) => onFormChange('zip', e.target.value)}
                                        style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
                                    <select
                                        value={form.country}
                                        onChange={(e) => onFormChange('country', e.target.value)}
                                        style={{ ...inputStyle, cursor: 'pointer' }}
                                        onFocus={handleFocus} onBlur={handleBlur}
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

                        {/* Place order */}
                        <div className="space-y-4">
                            <button
                                disabled={!cart?.checkoutUrl}
                                onClick={onPlaceOrder}
                                className="w-full py-5 rounded-2xl text-base font-bold flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-emerald-200"
                                style={{ background: 'var(--gradient-1)', color: 'white' }}
                            >
                                <Lock className="w-4 h-4" />
                                Place Order — {cart?.currencyCode} {cart?.totalAmount}
                            </button>
                            <div className="flex flex-col items-center gap-3 py-4 border-t border-emerald-100/50">
                                <p className="text-[10px] font-bold text-emerald-600/60 uppercase tracking-widest text-center">
                                    Guaranteed Safe & Secure Checkout
                                </p>
                                <div className="flex items-center gap-4 grayscale opacity-40">
                                    <span className="text-[10px] font-black border border-current px-1.5 py-0.5 rounded">VISA</span>
                                    <span className="text-[10px] font-black border border-current px-1.5 py-0.5 rounded">MASTERCARD</span>
                                    <span className="text-[10px] font-black border border-current px-1.5 py-0.5 rounded">AMEX</span>
                                    <span className="text-[10px] font-black border border-current px-1.5 py-0.5 rounded">PAYPAL</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-2">
                        <div className="rounded-3xl p-6 sticky top-4" style={{ background: 'white', boxShadow: 'var(--shadow-card)' }}>
                            <h4 className="font-bold mb-5" style={{ color: 'var(--text-1)' }}>Order Summary</h4>
                            <div className="space-y-3 mb-5">
                                {cart?.items.map((item) => (
                                    <div key={item.id} className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-2xl relative overflow-hidden shrink-0"
                                            style={{ background: 'linear-gradient(135deg, #f0fdf4, #d1fae5)' }}>
                                            {item.imageUrl
                                                ? <Image src={item.imageUrl} alt={item.title} fill className="object-cover" />
                                                : <ShoppingBag className="w-5 h-5 absolute inset-0 m-auto opacity-20" style={{ color: 'var(--primary)' }} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-1)' }}>{item.title}</p>
                                            <p className="text-xs" style={{ color: 'var(--text-3)' }}>Qty {item.quantity}</p>
                                        </div>
                                        <span className="text-sm font-bold shrink-0" style={{ color: 'var(--text-1)' }}>
                                            {cart.currencyCode} {(parseFloat(item.price) * item.quantity).toFixed(2)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(52,211,153,0.08))', border: '1px solid rgba(16,185,129,0.12)' }}>
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold text-sm" style={{ color: 'var(--text-2)' }}>Total</span>
                                    <span className="text-xl font-extrabold" style={{ color: 'var(--primary)' }}>
                                        {cart?.currencyCode} {cart?.totalAmount}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

interface CheckoutViewProps {
    cart: Cart | null;
    form: CheckoutForm;
    onFormChange: (field: keyof CheckoutForm, value: string) => void;
    onBack: () => void;
    onPlaceOrder: () => void;
}

'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Sparkles, Loader2, ShoppingBag, UserRound } from 'lucide-react';
import ChatPanel from '@/components/ChatPanel';
import StorefrontHeader from '@/components/StorefrontHeader';
import ProductGrid from '@/components/ProductGrid';
import CartView from '@/components/CartView';
import CheckoutView from '@/components/CheckoutView';
import ProductDetailOverlay from '@/components/ProductDetailOverlay';
import AuthModal from '@/components/AuthModal';
import useShopperAuth from '@/hooks/useShopperAuth';
import { useLiveAudio } from '@/hooks/useLiveAudio';
import type { Product, PageInfo, Cart, ViewMode, CheckoutForm, Message, Variant, VariantOption } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// ── Simple fetch helpers (no auth) ──────────────────────────────────────────

async function publicGet<T = any>(path: string): Promise<T> {
    const res = await fetch(`${API_URL}${path}`);
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw body;
    }
    return res.json();
}

async function publicPost<T = any>(path: string, data: any): Promise<T> {
    const res = await fetch(`${API_URL}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw body;
    }
    return res.json();
}

// ── Product mapper ──────────────────────────────────────────────────────────

function mapProduct(p: any): Product {
    return {
        id: p.id,
        title: p.title,
        description: p.description || '',
        imageUrl: p.image_url || null,
        price: p.price || '0.00',
        currency: p.currency || 'USD',
        variantId: p.variant_id || null,
        variants: (p.variants || []).map((v: any) => ({
            id: v.id,
            title: v.title || '',
            available: v.available ?? true,
            price: v.price || '0.00',
            currency: v.currency || 'USD',
            imageUrl: v.image_url || null,
            options: (v.options || []) as VariantOption[],
        })),
        optionNames: p.option_names || [],
    };
}

function mapPageInfo(pi: any): PageInfo {
    return { hasNextPage: pi?.has_next_page ?? false, endCursor: pi?.end_cursor ?? null };
}

// ── Cart mapper ─────────────────────────────────────────────────────────────

function mapCart(c: any): Cart {
    // Handle both raw Shopify GraphQL format (lines.edges[]) returned by voice
    // tool calls, and the flat backend format used by regular text chat.
    let items: Cart['items'] = [];
    if (c.lines?.edges) {
        items = c.lines.edges.map((edge: any) => {
            const node = edge.node;
            const merch = node.merchandise || {};
            return {
                id: node.id || '',
                quantity: node.quantity,
                title: merch.title || 'Product',
                price: merch.price?.amount || '0.00',
                variantId: merch.id,
                imageUrl: merch.image?.url || undefined,
            };
        });
    } else if (Array.isArray(c.lines)) {
        items = c.lines.map((l: any) => ({
            id: l.line_id || l.id || '',
            quantity: l.quantity,
            title: l.title || 'Product',
            price: l.price || '0.00',
            variantId: l.variant_id,
            imageUrl: l.image_url || undefined,
        }));
    }

    return {
        id: c.cart_id || c.id || '',
        checkoutUrl: c.checkout_url || c.checkoutUrl || '',
        items,
        totalAmount: c.cost?.totalAmount?.amount || c.cost?.total || '0.00',
        currencyCode: c.cost?.totalAmount?.currencyCode || c.cost?.currency || 'USD',
    };
}

// ── Main Component ──────────────────────────────────────────────────────────

export default function PublicStorefront() {
    const params = useParams();
    const slug = params.slug as string;

    const [storeName, setStoreName] = useState('');
    const [storeLoading, setStoreLoading] = useState(true);
    const [storeError, setStoreError] = useState<string | null>(null);

    const [products, setProducts] = useState<Product[]>([]);
    const [pageInfo, setPageInfo] = useState<PageInfo>({ hasNextPage: false, endCursor: null });
    const [collections, setCollections] = useState<any[]>([]);
    const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const [cart, setCart] = useState<Cart | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('shop');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [checkoutForm, setCheckoutForm] = useState<CheckoutForm>({
        email: '', firstName: '', lastName: '',
        address: '', city: '', state: '', zip: '', country: 'US',
    });

    const [messages, setMessages] = useState<Message[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const sessionIdRef = useRef<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const shopperAuth = useShopperAuth(slug);

    const handleStructuredActions = React.useCallback((toolCalls: any[]) => {
        for (const tc of toolCalls) {
            if (tc.name === 'search_products' && tc.result?.products) {
                setProducts(tc.result.products.map(mapProduct));
                setPageInfo(mapPageInfo(tc.result.page_info));
                setSearchQuery(tc.args?.query || '');
                setSelectedCollection(null);
            }
            if (tc.name === 'get_collections' && tc.result?.collections) {
                setCollections(tc.result.collections);
            }
            if (tc.name === 'get_products_in_collection' && tc.result?.products) {
                setProducts(tc.result.products.map(mapProduct));
                setPageInfo(mapPageInfo(tc.result.page_info));
            }
            if ((tc.name === 'manage_cart' || tc.name === 'create_checkout') && tc.result?.cart) {
                setCart(mapCart(tc.result.cart));
                setViewMode('cart');
            }
        }
    }, []);

    const { isLive, level, toggle: toggleLive } = useLiveAudio({
        slug,
        shopperEmail: shopperAuth.customer?.email || undefined,
        onToolCall: (name, result) => {
            handleStructuredActions([{ name, args: {}, result }]);
        },
        onAIText: (text) => {
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'model',
                text,
            }]);
        },
    });

    // ── Cart Sync on Login ──────────────────────────────────────────────
    useEffect(() => {
        const token = shopperAuth.customer?.accessToken;
        if (!token) return;

        const syncCart = async () => {
            try {
                // Determine our local cart id
                let currentCartId = null;
                setCart(prevCart => {
                    currentCartId = prevCart?.id;
                    return prevCart;
                });

                const res = await publicPost(`/api/public/${slug}/cart/sync`, {
                    customer_access_token: token,
                    cart_id: currentCartId
                });

                if (res.cart) {
                    setCart(mapCart(res.cart));
                }
            } catch (err) {
                console.error('Failed to sync cart:', err);
            }
        };

        syncCart();
    }, [shopperAuth.customer?.accessToken, slug]);

    // ── Load store info + products ──────────────────────────────────────
    useEffect(() => {
        const load = async () => {
            try {
                const [info, colls, result] = await Promise.all([
                    publicGet(`/api/public/${slug}/info`),
                    publicGet(`/api/public/${slug}/collections`),
                    publicGet(`/api/public/${slug}/products`),
                ]);
                setStoreName(info.name);
                setCollections(colls.collections || []);
                setProducts((result.products || []).map(mapProduct));
                setPageInfo(mapPageInfo(result.page_info));
                setMessages([{
                    id: '1',
                    role: 'model',
                    text: `Welcome to ${info.name}! I'm your AI shopping assistant. How can I help you today?`,
                }]);
            } catch {
                setStoreError('Store not found or unavailable.');
            } finally {
                setStoreLoading(false);
            }
        };
        load();
    }, [slug]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Update checkout form email if customer logs in
    useEffect(() => {
        if (shopperAuth.customer?.email && !checkoutForm.email) {
            setCheckoutForm(prev => ({ ...prev, email: shopperAuth.customer!.email, firstName: shopperAuth.customer!.firstName, lastName: shopperAuth.customer!.lastName }));
        }
    }, [shopperAuth.customer, checkoutForm.email]);

    // ── Cart actions ────────────────────────────────────────────────────
    const handleCartAction = async (action: string, id: string) => {
        try {
            let result;
            if (action === 'add') {
                if (cart) {
                    result = await publicPost(`/api/public/${slug}/cart/add`, {
                        cart_id: cart.id, variant_id: id, quantity: 1,
                    });
                } else {
                    result = await publicPost(`/api/public/${slug}/cart/create`, {
                        variant_id: id, quantity: 1,
                    });
                }
            } else if (action === 'increase') {
                const item = cart?.items.find((i) => i.id === id);
                if (!item || !cart) return;
                result = await publicPost(`/api/public/${slug}/cart/update`, {
                    cart_id: cart.id, line_id: id, quantity: item.quantity + 1,
                });
            } else if (action === 'decrease') {
                const item = cart?.items.find((i) => i.id === id);
                if (!item || !cart) return;
                if (item.quantity <= 1) {
                    result = await publicPost(`/api/public/${slug}/cart/remove`, {
                        cart_id: cart.id, line_id: id,
                    });
                } else {
                    result = await publicPost(`/api/public/${slug}/cart/update`, {
                        cart_id: cart.id, line_id: id, quantity: item.quantity - 1,
                    });
                }
            } else if (action === 'remove') {
                if (!cart) return;
                result = await publicPost(`/api/public/${slug}/cart/remove`, {
                    cart_id: cart.id, line_id: id,
                });
            }
            if (result) setCart(mapCart(result));
            if (action === 'add') setViewMode('cart');
        } catch (err) {
            console.error('Cart action failed:', err);
        }
    };

    const handleImageSelect = (file: File | null) => {
        if (!file) {
            setImageFile(null);
            setPreviewImage(null);
            return;
        }
        setImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewImage(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        setPreviewImage(null);
    };

    // ── Chat ────────────────────────────────────────────────────────────
    const handleSend = async (e?: React.FormEvent, overrideText?: string) => {
        e?.preventDefault();
        const userText = (overrideText || chatInput).trim();
        if (!userText && !imageFile) return;

        // Intercept silent UI cart directives
        if (userText.startsWith('{"action":"cart.')) return;

        const currentPreview = previewImage;
        if (!overrideText) setChatInput('');

        setMessages((prev) => [...prev, {
            id: Date.now().toString(),
            role: 'user',
            text: userText,
            imageUrl: currentPreview || undefined
        }]);

        setImageFile(null);
        setPreviewImage(null);
        setChatLoading(true);

        try {
            let imageBase64: string | undefined = undefined;
            if (currentPreview) {
                imageBase64 = currentPreview;
            }

            const res = await publicPost(`/api/public/${slug}/chat`, {
                message: userText,
                session_id: sessionIdRef.current,
                image_base64: imageBase64,
                shopper_email: shopperAuth.customer?.email || undefined,
            });
            sessionIdRef.current = res.session_id;

            // Handle structured actions (tool calls) to update UI
            if (res.tool_calls && Array.isArray(res.tool_calls)) {
                handleStructuredActions(res.tool_calls);
            }

            setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), role: 'model', text: res.message || '...' }]);
        } catch {
            setMessages((prev) => [...prev, {
                id: (Date.now() + 1).toString(), role: 'model',
                text: 'Sorry, I encountered an error. Please try again.',
            }]);
        } finally {
            setChatLoading(false);
        }
    };

    // ── Load more ───────────────────────────────────────────────────────
    const loadMore = async () => {
        if (!pageInfo.endCursor) return;
        setIsSearching(true);
        try {
            let result;
            if (selectedCollection) {
                result = await publicGet(`/api/public/${slug}/collections/${selectedCollection}?after=${pageInfo.endCursor}`);
            } else {
                result = await publicGet(`/api/public/${slug}/products?q=${encodeURIComponent(searchQuery)}&after=${pageInfo.endCursor}`);
            }
            setProducts((prev) => [...prev, ...(result.products || []).map(mapProduct)]);
            setPageInfo(mapPageInfo(result.page_info));
        } finally {
            setIsSearching(false);
        }
    };

    const loadCollectionProducts = async (collId: string) => {
        setIsSearching(true);
        try {
            const result = await publicGet(`/api/public/${slug}/collections/${collId}`);
            setProducts((result.products || []).map(mapProduct));
            setPageInfo(mapPageInfo(result.page_info));
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectCollection = (collId: string | null) => {
        if (collId) {
            setSelectedCollection(collId);
            loadCollectionProducts(collId);
        }
    };

    const clearCollection = () => {
        setSelectedCollection(null);
        // Re-fetch all products
        publicGet(`/api/public/${slug}/products`).then((result) => {
            setProducts((result.products || []).map(mapProduct));
            setPageInfo(mapPageInfo(result.page_info));
        });
    };

    // ── Loading / Error ─────────────────────────────────────────────────
    if (storeLoading) {
        return (
            <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
        );
    }

    if (storeError) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center text-white">
                <div className="text-center">
                    <ShoppingBag className="w-12 h-12 text-white/20 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold mb-2">Store Not Found</h1>
                    <p className="text-white/50">{storeError}</p>
                </div>
            </div>
        );
    }

    // ── Checkout ─────────────────────────────────────────────────────────
    const handlePlaceOrder = () => {
        // If they are not logged in, ask them to log in or register before checking out
        if (!shopperAuth.customer) {
            shopperAuth.setAuthTab('login');
            shopperAuth.setShowAuthModal(true);
            return;
        }

        if (!cart?.checkoutUrl) return;
        const url = new URL(cart.checkoutUrl);
        if (checkoutForm.email) url.searchParams.set('checkout[email]', checkoutForm.email);
        if (checkoutForm.firstName) url.searchParams.set('checkout[shipping_address][first_name]', checkoutForm.firstName);
        if (checkoutForm.lastName) url.searchParams.set('checkout[shipping_address][last_name]', checkoutForm.lastName);
        window.location.href = url.toString();
    };

    const toggleCart = () => {
        if (viewMode === 'shop') setViewMode('cart');
        else if (viewMode === 'checkout') setViewMode('cart');
        else setViewMode('shop');
    };

    return (
        <div className="flex h-screen bg-neutral-50 overflow-hidden font-sans">
            {/* Left: Chat Panel */}
            <div className="relative w-full md:w-[400px] lg:w-[450px] flex flex-col bg-white border-r border-neutral-200 shadow-sm z-10">
                <div className="flex items-center gap-3 px-6 py-5 border-b border-neutral-100 bg-white">
                    <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center shadow-sm">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                        <h1 className="font-semibold text-neutral-900">{storeName}</h1>
                        <p className="text-xs text-neutral-500">AI Shopping Assistant</p>
                    </div>
                </div>

                <ChatPanel
                    messages={messages}
                    input={chatInput}
                    isLoading={chatLoading}
                    previewImage={previewImage}
                    messagesEndRef={messagesEndRef}
                    onInputChange={setChatInput}
                    onImageSelect={handleImageSelect}
                    onRemoveImage={handleRemoveImage}
                    onSend={handleSend}
                    isLive={isLive}
                    liveLevel={level}
                    onToggleLive={toggleLive}
                />
            </div>

            {/* Right: Storefront */}
            <div className="flex-1 flex flex-col bg-neutral-50 h-full overflow-hidden relative">
                <StorefrontHeader
                    viewMode={viewMode}
                    cart={cart}
                    products={products}
                    customer={shopperAuth.customer}
                    onLoginClick={() => shopperAuth.setShowAuthModal(true)}
                    onToggleCart={toggleCart}
                />

                {viewMode === 'shop' && (
                    <ProductGrid
                        products={products}
                        pageInfo={pageInfo}
                        collections={collections}
                        selectedCollection={selectedCollection}
                        isSearching={isSearching}
                        onSelectProduct={setSelectedProduct}
                        onAddToCart={(variantId) => handleCartAction('add', variantId)}
                        onLoadMore={loadMore}
                        onSelectCollection={handleSelectCollection}
                        onClearCollection={clearCollection}
                        setProducts={setProducts}
                        setPageInfo={setPageInfo}
                        setIsSearching={() => { }}
                        setSelectedCollection={setSelectedCollection}
                    />
                )}

                {viewMode === 'cart' && (
                    <CartView
                        cart={cart}
                        onIncrease={(id) => handleCartAction('increase', id)}
                        onDecrease={(id) => handleCartAction('decrease', id)}
                        onRemove={(id) => handleCartAction('remove', id)}
                        onContinueShopping={() => setViewMode('shop')}
                        onCheckout={() => setViewMode('checkout')}
                    />
                )}

                {viewMode === 'checkout' && (
                    <CheckoutView
                        cart={cart}
                        form={checkoutForm}
                        onFormChange={(field, value) => setCheckoutForm((f) => ({ ...f, [field]: value }))}
                        onBack={() => setViewMode('cart')}
                        onPlaceOrder={handlePlaceOrder}
                    />
                )}

                <ProductDetailOverlay
                    product={selectedProduct}
                    slug={slug}
                    onClose={() => setSelectedProduct(null)}
                    onAddToCart={(variantId) => handleCartAction('add', variantId)}
                    onAskAI={(title) => {
                        setChatInput(`Tell me more about the ${title}`);
                        setSelectedProduct(null);
                    }}
                />
            </div>

            {/* Auth Modal */}
            <AuthModal
                customer={shopperAuth.customer}
                show={shopperAuth.showAuthModal}
                authTab={shopperAuth.authTab}
                authForm={shopperAuth.authForm}
                authLoading={shopperAuth.authLoading}
                authError={shopperAuth.authError}
                showPassword={shopperAuth.showPassword}
                onClose={() => shopperAuth.setShowAuthModal(false)}
                onSwitchTab={shopperAuth.setAuthTab}
                onFormChange={shopperAuth.setAuthForm}
                onLogin={shopperAuth.handleLogin}
                onSignup={shopperAuth.handleSignup}
                onLogout={shopperAuth.handleLogout}
                onTogglePassword={() => shopperAuth.setShowPassword(p => !p)}
            />
        </div>
    );
}

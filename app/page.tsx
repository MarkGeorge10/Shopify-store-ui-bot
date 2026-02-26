'use client';

import { useState } from 'react';
import { Sparkles, UserRound, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { useProducts } from '@/hooks/useProducts';
import { useChat } from '@/hooks/useChat';
import LandingPage from '@/components/LandingPage';
import StoreConnectPage from '@/components/StoreConnectPage';
import AuthModal from '@/components/AuthModal';
import ChatPanel from '@/components/ChatPanel';
import StorefrontHeader from '@/components/StorefrontHeader';
import ProductGrid from '@/components/ProductGrid';
import CartView from '@/components/CartView';
import CheckoutView from '@/components/CheckoutView';
import ProductDetailOverlay from '@/components/ProductDetailOverlay';
import type { CheckoutForm, ViewMode, Product } from '@/types';

export default function ShopifyConcierge() {
  const [viewMode, setViewMode] = useState<ViewMode>('shop');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [checkoutForm, setCheckoutForm] = useState<CheckoutForm>({
    email: '', firstName: '', lastName: '',
    address: '', city: '', state: '', zip: '', country: 'US',
  });

  // ── Hooks ───────────────────────────────────────────────────────────────
  const { cart, setCart, handleCartAction } = useCart({ onViewCart: () => setViewMode('cart') });

  const auth = useAuth({
    onMessage: (msg) => chat.appendMessage(msg),
  });

  const products = useProducts(auth.appView === 'app');

  const chat = useChat({
    cart,
    setCart,
    setProducts: products.setProducts,
    setPageInfo: products.setPageInfo,
    setCollections: products.setCollections,
    setSelectedCollection: products.setSelectedCollection,
    setSearchQuery: products.setCurrentSearchQuery,
    onViewCart: () => setViewMode('cart'),
  });

  // ── Loading state ───────────────────────────────────────────────────────
  if (auth.initialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    );
  }

  // ── Landing Page (not authenticated) ────────────────────────────────────
  if (auth.appView === 'landing') {
    return (
      <LandingPage
        showAuthModal={auth.showAuthModal}
        authTab={auth.authTab}
        authForm={auth.authForm}
        authLoading={auth.authLoading}
        authError={auth.authError}
        showPassword={auth.showPassword}
        setShowAuthModal={auth.setShowAuthModal}
        setAuthForm={auth.setAuthForm}
        setShowPassword={auth.setShowPassword}
        switchTab={auth.switchTab}
        handleLogin={auth.handleLogin}
        handleSignup={auth.handleSignup}
        openAuthModal={auth.openAuthModal}
      />
    );
  }

  // ── Store Connection (authenticated but no store connected) ─────────────
  if (auth.appView === 'store-connect') {
    return (
      <StoreConnectPage
        onConnected={auth.handleStoreConnected}
        onLogout={auth.handleLogout}
        userEmail={auth.user?.email || ''}
      />
    );
  }

  // ── Main App (authenticated + store connected) ──────────────────────────
  const toggleCart = () => {
    if (viewMode === 'shop') setViewMode('cart');
    else if (viewMode === 'checkout') setViewMode('cart');
    else setViewMode('shop');
  };

  const handlePlaceOrder = () => {
    if (!cart?.checkoutUrl) return;
    const url = new URL(cart.checkoutUrl);
    if (checkoutForm.email) url.searchParams.set('checkout[email]', checkoutForm.email);
    if (checkoutForm.firstName) url.searchParams.set('checkout[shipping_address][first_name]', checkoutForm.firstName);
    if (checkoutForm.lastName) url.searchParams.set('checkout[shipping_address][last_name]', checkoutForm.lastName);
    if (checkoutForm.address) url.searchParams.set('checkout[shipping_address][address1]', checkoutForm.address);
    if (checkoutForm.city) url.searchParams.set('checkout[shipping_address][city]', checkoutForm.city);
    if (checkoutForm.state) url.searchParams.set('checkout[shipping_address][province]', checkoutForm.state);
    if (checkoutForm.zip) url.searchParams.set('checkout[shipping_address][zip]', checkoutForm.zip);
    if (checkoutForm.country) url.searchParams.set('checkout[shipping_address][country]', checkoutForm.country);
    window.location.href = url.toString();
  };

  const handleSelectCollection = (collectionId: string | null) => {
    if (collectionId) products.loadCollectionProducts(collectionId);
  };

  return (
    <div className="flex h-screen bg-neutral-50 overflow-hidden font-sans">
      {/* ── Left: Chat Panel ────────────────────────────────────────── */}
      <div className="relative w-full md:w-[400px] lg:w-[450px] flex flex-col bg-white border-r border-neutral-200 shadow-sm z-10">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-neutral-100 bg-white">
          <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center shadow-sm">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="font-semibold text-neutral-900">AI Concierge</h1>
            <p className="text-xs text-neutral-500">
              {auth.storeConfig
                ? auth.storeConfig.shopify_domain
                : auth.customer
                  ? `Hi, ${auth.customer.firstName}`
                  : 'Powered by Gemini'}
            </p>
          </div>
          <button
            onClick={auth.openAuthModal}
            className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${auth.customer
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-neutral-100 text-neutral-500 hover:bg-indigo-50 hover:text-indigo-600'
              }`}
            title={auth.customer ? `${auth.customer.firstName}` : 'Sign In'}
          >
            {auth.customer
              ? auth.customer.firstName[0].toUpperCase()
              : <UserRound className="w-4 h-4" />}
          </button>
        </div>

        <AuthModal
          customer={auth.customer}
          show={auth.showAuthModal}
          authTab={auth.authTab}
          authForm={auth.authForm}
          authLoading={auth.authLoading}
          authError={auth.authError}
          showPassword={auth.showPassword}
          onClose={() => auth.setShowAuthModal(false)}
          onSwitchTab={auth.switchTab}
          onFormChange={(field, value) => auth.setAuthForm((f) => ({ ...f, [field]: value }))}
          onLogin={auth.handleLogin}
          onSignup={auth.handleSignup}
          onLogout={auth.handleLogout}
          onTogglePassword={() => auth.setShowPassword((p) => !p)}
        />

        <ChatPanel
          messages={chat.messages}
          input={chat.input}
          isLoading={chat.isLoading}
          previewImage={chat.previewImage}
          messagesEndRef={chat.messagesEndRef}
          onInputChange={chat.setInput}
          onImageSelect={chat.handleImageSelect}
          onRemoveImage={chat.handleRemoveImage}
          onSend={chat.handleSend}
        />
      </div>

      {/* ── Right: Storefront ───────────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-neutral-50 h-full overflow-hidden relative">
        <StorefrontHeader
          viewMode={viewMode}
          cart={cart}
          products={products.products}
          customer={null}
          onLoginClick={() => { }}
          onToggleCart={toggleCart}
        />

        {viewMode === 'shop' && (
          <ProductGrid
            products={products.products}
            pageInfo={products.pageInfo}
            collections={products.collections}
            selectedCollection={products.selectedCollection}
            isSearching={products.isSearching}
            onSelectProduct={setSelectedProduct}
            onAddToCart={(variantId) => handleCartAction('add', variantId)}
            onLoadMore={products.loadMoreProducts}
            onSelectCollection={handleSelectCollection}
            onClearCollection={products.clearCollection}
            setProducts={products.setProducts}
            setPageInfo={products.setPageInfo}
            setIsSearching={() => { }}
            setSelectedCollection={products.setSelectedCollection}
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
          onClose={() => setSelectedProduct(null)}
          onAddToCart={(variantId) => handleCartAction('add', variantId)}
          onAskAI={(title) => {
            chat.setInput(`Tell me more about the ${title}`);
            setSelectedProduct(null);
          }}
        />
      </div>
    </div>
  );
}

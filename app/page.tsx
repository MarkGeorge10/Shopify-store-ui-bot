'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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

  const [isChatOpen, setIsChatOpen] = useState(false);

  // ── Hooks ───────────────────────────────────────────────────────────────
  const { cart, setCart, handleCartAction } = useCart({ onViewCart: () => setViewMode('cart') });

  const auth = useAuth({
    onMessage: (msg) => {
      chat.appendMessage(msg);
      setIsChatOpen(true);
    },
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
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
    <div className="flex h-screen bg-white overflow-hidden font-sans relative">
      {/* ── Chat Panel (Overlay Sidebar) ────────────────────────── */}
      <AnimatePresence>
        {isChatOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsChatOpen(false)}
              className="absolute inset-0 bg-emerald-950/20 backdrop-blur-[2px] z-40 lg:hidden"
            />
            {/* Panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute left-0 top-0 bottom-0 w-[100%] md:w-[400px] lg:w-[450px] bg-white shadow-2xl z-50 flex flex-col border-r border-emerald-100"
            >
              <ChatPanel
                messages={chat.messages}
                input={chat.input}
                setInput={chat.setInput}
                handleSend={chat.handleSend}
                onImageSelect={chat.handleImageSelect}
                imagePreview={chat.previewImage}
                setImagePreview={chat.handleRemoveImage}
                isTyping={chat.isLoading}
                isLive={chat.isLive}
                onToggleLive={chat.toggleLive}
                onClose={() => setIsChatOpen(false)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

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

      {/* ── Floating AI Trigger ────────────────────────────────────────── */}
      <button
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-8 left-8 z-30 group flex items-center gap-3 p-2 pr-6 rounded-2xl bg-white border border-emerald-100 shadow-xl shadow-emerald-200/50 hover:border-emerald-200 active:scale-95 transition-all outline-none"
      >
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20"
          style={{ background: 'var(--gradient-1)' }}>
          <Sparkles className="w-6 h-6 text-white group-hover:rotate-12 transition-transform" />
        </div>
        <div className="flex flex-col items-start translate-x-[-4px]">
          <span className="text-xs font-bold text-emerald-950 uppercase tracking-widest text-left">AI Assistant</span>
          <span className="text-[10px] text-emerald-500/80 font-medium">Click to chat</span>
        </div>
      </button>

      {/* ── Right: Storefront ───────────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-emerald-50/10 h-full overflow-hidden relative">
        <StorefrontHeader
          viewMode={viewMode}
          cart={cart}
          products={products.products}
          customer={auth.customer}
          onLoginClick={auth.openAuthModal}
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
            setIsSearching={products.setIsSearching}
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

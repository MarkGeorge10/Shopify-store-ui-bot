'use client';

import { useState, useEffect } from 'react';
import {
    apiLogin,
    apiRegister,
    apiGetMe,
    apiGet,
    setToken,
    clearToken,
    getToken,
    isAuthenticated,
} from '@/lib/api';
import type { Message, AuthTab, AuthForm } from '@/types';

const EMPTY_FORM: AuthForm = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirm: '',
};

interface BackendUser {
    id: string;
    email: string;
    is_pro: boolean;
    trial_start_date: string;
    trial_ends_at: string;
}

interface StoreConfig {
    id: string;
    shopify_domain: string;
}

type AppView = 'landing' | 'store-connect' | 'app';

interface UseAuthOptions {
    /** Called to append a welcome message to the chat after login/signup */
    onMessage: (msg: Message) => void;
}

export function useAuth({ onMessage }: UseAuthOptions) {
    const [user, setUser] = useState<BackendUser | null>(null);
    const [storeConfig, setStoreConfig] = useState<StoreConfig | null>(null);
    const [appView, setAppView] = useState<AppView>('landing');
    const [initialLoading, setInitialLoading] = useState(true);

    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authTab, setAuthTab] = useState<AuthTab>('login');
    const [authForm, setAuthForm] = useState<AuthForm>(EMPTY_FORM);
    const [authLoading, setAuthLoading] = useState(false);
    const [authError, setAuthError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    // ── Check store connection ──────────────────────────────────────────
    const checkStoreConnection = async () => {
        try {
            const config = await apiGet<StoreConfig>('/api/store/config');
            setStoreConfig(config);
            setAppView('app');
        } catch {
            // 404 = no store connected yet
            setStoreConfig(null);
            setAppView('store-connect');
        }
    };

    // ── Restore session on mount ────────────────────────────────────────
    useEffect(() => {
        const restore = async () => {
            if (!isAuthenticated()) {
                setInitialLoading(false);
                return;
            }
            try {
                const me = await apiGetMe();
                setUser(me);
                // If on the landing page and authenticated, redirect to dashboard
                if (window.location.pathname === '/') {
                    window.location.href = '/dashboard';
                    return;
                }
            } catch {
                clearToken();
                setUser(null);
                setAppView('landing');
            } finally {
                setInitialLoading(false);
            }
        };
        restore();
    }, []);

    // ── After successful auth, redirect to dashboard ──────────────────
    const onAuthSuccess = async (me: BackendUser, isSignup: boolean) => {
        setUser(me);
        setShowAuthModal(false);
        setAuthForm(EMPTY_FORM);

        // Redirect to dashboard for multi-store management
        window.location.href = '/dashboard';
    };

    const handleLogin = async () => {
        setAuthLoading(true);
        setAuthError(null);

        try {
            const res = await apiLogin(authForm.email, authForm.password);
            setToken(res.access_token);
            const me = await apiGetMe();
            await onAuthSuccess(me, false);
        } catch (err: any) {
            const detail = err?.detail;
            setAuthError(typeof detail === 'string' ? detail : 'Login failed. Please try again.');
        } finally {
            setAuthLoading(false);
        }
    };

    const handleSignup = async () => {
        if (authForm.password !== authForm.confirm) {
            setAuthError('Passwords do not match.');
            return;
        }
        setAuthLoading(true);
        setAuthError(null);

        try {
            await apiRegister(authForm.email, authForm.password);
            const res = await apiLogin(authForm.email, authForm.password);
            setToken(res.access_token);
            const me = await apiGetMe();
            await onAuthSuccess(me, true);
        } catch (err: any) {
            const detail = err?.detail;
            setAuthError(typeof detail === 'string' ? detail : 'Registration failed. Please try again.');
        } finally {
            setAuthLoading(false);
        }
    };

    const handleLogout = () => {
        clearToken();
        setUser(null);
        setStoreConfig(null);
        setAppView('landing');
        setShowAuthModal(false);
    };

    const handleStoreConnected = async () => {
        await checkStoreConnection();
    };

    const openAuthModal = () => {
        setAuthError(null);
        setShowAuthModal(true);
    };

    const switchTab = (tab: AuthTab) => {
        setAuthTab(tab);
        setAuthError(null);
    };

    // Backwards-compatible shape for components expecting Customer type
    const customer = user
        ? {
            id: user.id,
            firstName: user.email.split('@')[0],
            lastName: '',
            email: user.email,
            accessToken: getToken() || '',
        }
        : null;

    return {
        // App state
        appView,
        initialLoading,
        storeConfig,

        // User
        customer,
        user,

        // Auth modal
        showAuthModal,
        authTab,
        authForm,
        authLoading,
        authError,
        showPassword,
        setAuthForm,
        setShowPassword,
        setShowAuthModal,
        openAuthModal,
        switchTab,
        handleLogin,
        handleSignup,
        handleLogout,
        handleStoreConnected,
    };
}

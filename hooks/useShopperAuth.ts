import { useState, useEffect } from 'react';
import type { Customer, AuthTab, AuthForm } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const EMPTY_FORM: AuthForm = {
    email: '',
    password: '',
    confirm: '',
    firstName: '',
    lastName: '',
};

export default function useShopperAuth(slug: string) {
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [authLoading, setAuthLoading] = useState(false);
    const [authError, setAuthError] = useState<string | null>(null);

    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authTab, setAuthTab] = useState<AuthTab>('login');
    const [authForm, setAuthForm] = useState<AuthForm>(EMPTY_FORM);
    const [showPassword, setShowPassword] = useState(false);

    // Load token from storage on mount
    useEffect(() => {
        const token = localStorage.getItem(`shopper_token_${slug}`);
        if (token) {
            fetchCustomerMe(token);
        }
    }, [slug]);

    const fetchCustomerMe = async (token: string) => {
        try {
            const res = await fetch(`${API_URL}/api/public/${slug}/customer/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Invalid token');
            const data = await res.json();
            setCustomer({
                ...data,
                accessToken: token,
            });
        } catch {
            localStorage.removeItem(`shopper_token_${slug}`);
            setCustomer(null);
        }
    };

    const handleLogin = async () => {
        if (!authForm.email || !authForm.password) {
            setAuthError('Email and password required');
            return;
        }
        setAuthLoading(true);
        setAuthError(null);
        try {
            const res = await fetch(`${API_URL}/api/public/${slug}/customer/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: authForm.email,
                    password: authForm.password,
                })
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || 'Login failed');
            }
            const data = await res.json();
            localStorage.setItem(`shopper_token_${slug}`, data.access_token);
            setCustomer({ ...data.customer, accessToken: data.access_token });
            setShowAuthModal(false);
            setAuthForm(EMPTY_FORM);
        } catch (err: any) {
            setAuthError(err.message);
        } finally {
            setAuthLoading(false);
        }
    };

    const handleSignup = async () => {
        if (!authForm.email || !authForm.password || !authForm.firstName) {
            setAuthError('All fields are required');
            return;
        }
        if (authForm.password !== authForm.confirm) {
            setAuthError('Passwords do not match');
            return;
        }
        setAuthLoading(true);
        setAuthError(null);
        try {
            const res = await fetch(`${API_URL}/api/public/${slug}/customer/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    first_name: authForm.firstName,
                    last_name: authForm.lastName,
                    email: authForm.email,
                    password: authForm.password,
                })
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || 'Signup failed');
            }
            const data = await res.json();
            localStorage.setItem(`shopper_token_${slug}`, data.access_token);
            setCustomer({ ...data.customer, accessToken: data.access_token });
            setShowAuthModal(false);
            setAuthForm(EMPTY_FORM);
        } catch (err: any) {
            setAuthError(err.message);
        } finally {
            setAuthLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem(`shopper_token_${slug}`);
        setCustomer(null);
        setShowAuthModal(false);
    };

    return {
        customer,
        showAuthModal,
        setShowAuthModal,
        authTab,
        setAuthTab,
        authForm,
        setAuthForm: (field: keyof AuthForm, value: string) => setAuthForm(prev => ({ ...prev, [field]: value })),
        authLoading,
        authError,
        showPassword,
        setShowPassword,
        handleLogin,
        handleSignup,
        handleLogout,
    };
}

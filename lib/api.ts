/**
 * Centralized API client for communicating with the FastAPI backend.
 *
 * Handles JWT token storage, automatic Authorization headers,
 * and typed request helpers.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const TOKEN_KEY = 'concierge_jwt';

// ── Token Management ──────────────────────────────────────────────────────────

export function getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
    localStorage.removeItem(TOKEN_KEY);
}

export function isAuthenticated(): boolean {
    return !!getToken();
}

// ── HTTP Helpers ──────────────────────────────────────────────────────────────

interface ApiError {
    detail: string | object;
    status: number;
}

async function handleResponse<T>(response: Response): Promise<T> {
    if (response.status === 401) {
        clearToken();
        // Could emit an event or redirect here
        throw { detail: 'Session expired. Please log in again.', status: 401 } as ApiError;
    }
    if (response.status === 402) {
        throw { detail: 'Trial expired. Please upgrade to Pro.', status: 402 } as ApiError;
    }
    if (!response.ok) {
        const body = await response.json().catch(() => ({ detail: response.statusText }));
        throw { detail: body.detail || response.statusText, status: response.status } as ApiError;
    }
    // Handle 204 No Content
    if (response.status === 204) return undefined as T;
    return response.json();
}

function authHeaders(): Record<string, string> {
    const token = getToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
}

export async function apiGet<T = any>(path: string): Promise<T> {
    const res = await fetch(`${API_URL}${path}`, { headers: authHeaders() });
    return handleResponse<T>(res);
}

export async function apiPost<T = any>(path: string, body?: object): Promise<T> {
    const res = await fetch(`${API_URL}${path}`, {
        method: 'POST',
        headers: authHeaders(),
        body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(res);
}

export async function apiDelete<T = any>(path: string): Promise<T> {
    const res = await fetch(`${API_URL}${path}`, {
        method: 'DELETE',
        headers: authHeaders(),
    });
    return handleResponse<T>(res);
}

// ── Auth Endpoints (special — login uses form-encoded) ────────────────────────

export async function apiLogin(email: string, password: string): Promise<{ access_token: string; token_type: string }> {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
    });
    return handleResponse(res);
}

export async function apiRegister(email: string, password: string): Promise<any> {
    return apiPost('/api/auth/register', { email, password });
}

export async function apiGetMe(): Promise<any> {
    return apiGet('/api/auth/me');
}

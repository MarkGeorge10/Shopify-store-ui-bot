// ── Shared Domain Types ────────────────────────────────────────────────────

export interface Message {
    id: string;
    role: 'user' | 'model';
    text: string;
    imageUrl?: string;
}

export interface VariantOption {
    name: string;      // e.g. "Color", "Size"
    value: string;     // e.g. "Red", "XL"
}

export interface Variant {
    id: string;
    title: string;
    available: boolean;
    price: string;
    currency: string;
    imageUrl: string | null;
    options: VariantOption[];
}

export interface Product {
    id: string;
    title: string;
    description: string;
    imageUrl: string | null;
    price: string;
    currency: string;
    variantId: string | null;
    variants: Variant[];
    optionNames: string[];     // e.g. ["Color", "Size"]
}

export interface CartItem {
    id: string;
    quantity: number;
    title: string;
    price: string;
    variantId: string;
    imageUrl?: string;
}

export interface Cart {
    id: string;
    checkoutUrl?: string;
    items: CartItem[];
    totalAmount: string;
    currencyCode: string;
}

export interface Customer {
    id?: string;
    firstName: string;
    lastName: string;
    email: string;
    accessToken: string;
}

export type ViewMode = 'shop' | 'cart' | 'checkout';

export type AuthTab = 'login' | 'signup';

export interface AuthForm {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirm: string;
}

export interface CheckoutForm {
    email: string;
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    country: string;
}

export interface PageInfo {
    hasNextPage: boolean;
    endCursor: string | null;
}

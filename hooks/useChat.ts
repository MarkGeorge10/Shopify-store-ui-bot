'use client';

import { useState, useRef, useEffect } from 'react';
import { apiPost, isAuthenticated } from '@/lib/api';
import type { Message, Product, Cart } from '@/types';

// ── Backend Response Types ────────────────────────────────────────────────────

interface ToolCallOut {
    name: string;
    args: Record<string, any>;
    result: Record<string, any>;
}

interface ChatSendResponse {
    session_id: string;
    reply: string;
    tool_calls: ToolCallOut[];
    structured_actions: {
        suggested_product_ids?: string[];
        checkout_url?: string;
        cart_id?: string;
    };
}

// ── Hook ─────────────────────────────────────────────────────────────────────

interface UseChatOptions {
    cart: Cart | null;
    setCart: (cart: Cart) => void;
    setProducts: (p: Product[]) => void;
    setPageInfo: (pi: any) => void;
    setCollections: (c: any[]) => void;
    setSelectedCollection: (id: string | null) => void;
    setSearchQuery?: (q: string) => void;
    onViewCart: () => void;
}

export function useChat({
    cart,
    setCart,
    setProducts,
    setPageInfo,
    setCollections,
    setSelectedCollection,
    setSearchQuery,
    onViewCart,
}: UseChatOptions) {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'model',
            text: 'Hi there! I am your AI shopping concierge. What are you looking for today?',
        },
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const sessionIdRef = useRef<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

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

    const appendMessage = (msg: Message) =>
        setMessages((prev) => [...prev, msg]);

    // ── Handle structured actions from backend ────────────────────────────
    const handleStructuredActions = (actions: ChatSendResponse['structured_actions'], toolCalls: ToolCallOut[]) => {
        for (const tc of toolCalls) {
            if (tc.name === 'search_products' && tc.result?.products) {
                const products: Product[] = tc.result.products.map((p: any) => ({
                    id: p.id,
                    title: p.title,
                    description: p.description || '',
                    imageUrl: p.image_url || null,
                    price: p.price || '0.00',
                    currency: p.currency || 'USD',
                    variantId: p.variantId || p.variant_id || null,
                    variants: (p.variants || []).map((v: any) => ({
                        id: v.id,
                        title: v.title,
                        available: v.available ?? true,
                        price: v.price || '0.00',
                        currency: v.currency || 'USD',
                        imageUrl: v.image_url || null,
                        options: v.options || [],
                    })),
                    optionNames: p.option_names || [],
                }));
                setProducts(products);
                if (tc.result.page_info) {
                    setPageInfo({
                        hasNextPage: tc.result.page_info.has_next_page,
                        endCursor: tc.result.page_info.end_cursor,
                    });
                } else {
                    setPageInfo({ hasNextPage: false, endCursor: null });
                }
                if (setSearchQuery) {
                    setSearchQuery(tc.args?.query || '');
                }
                setSelectedCollection(null);
            }

            if (tc.name === 'get_collections' && tc.result?.collections) {
                setCollections(tc.result.collections);
            }

            if (tc.name === 'get_products_in_collection' && tc.result?.products) {
                const products: Product[] = tc.result.products.map((p: any) => ({
                    id: p.id,
                    title: p.title,
                    description: p.description || '',
                    imageUrl: p.image_url || null,
                    price: p.price || '0.00',
                    currency: p.currency || 'USD',
                    variantId: p.variantId || p.variant_id || null,
                    variants: (p.variants || []).map((v: any) => ({
                        id: v.id,
                        title: v.title,
                        available: v.available ?? true,
                        price: v.price || '0.00',
                        currency: v.currency || 'USD',
                        imageUrl: v.image_url || null,
                        options: v.options || [],
                    })),
                    optionNames: p.option_names || [],
                }));
                setProducts(products);
                if (tc.result.page_info) {
                    setPageInfo({
                        hasNextPage: tc.result.page_info.has_next_page,
                        endCursor: tc.result.page_info.end_cursor,
                    });
                } else {
                    setPageInfo({ hasNextPage: false, endCursor: null });
                }
            }

            if ((tc.name === 'manage_cart' || tc.name === 'create_checkout') && tc.result?.cart) {
                const c = tc.result.cart;
                setCart({
                    id: c.id,
                    checkoutUrl: c.checkoutUrl,
                    items: (c.lines?.edges ?? []).map((edge: any) => ({
                        id: edge.node.id,
                        quantity: edge.node.quantity,
                        title: edge.node.merchandise?.title || 'Product',
                        price: edge.node.merchandise?.price?.amount || '0.00',
                        variantId: edge.node.merchandise?.id,
                        imageUrl: edge.node.merchandise?.image?.url || undefined,
                    })),
                    totalAmount: c.cost?.totalAmount?.amount || '0.00',
                    currencyCode: c.cost?.totalAmount?.currencyCode || 'USD',
                });
                onViewCart();
            }
        }
    };

    // ── Handle send ───────────────────────────────────────────────────────
    const handleSend = async (e?: React.FormEvent, overrideText?: string) => {
        e?.preventDefault();
        const userText = (overrideText || input).trim();
        if (!userText && !imageFile) return;

        // Intercept silent UI cart directives
        if (userText.startsWith('{"action":"cart.')) return;

        const currentPreview = previewImage;
        const msg: Message = {
            id: Date.now().toString(),
            role: 'user',
            text: userText,
            imageUrl: currentPreview || undefined,
        };

        setMessages((prev) => [...prev, msg]);
        setInput('');
        setImageFile(null);
        setPreviewImage(null);
        setIsLoading(true);

        try {
            if (!isAuthenticated()) {
                appendMessage({
                    id: Date.now().toString(),
                    role: 'model',
                    text: 'Please sign in to use the AI concierge.',
                });
                return;
            }

            let imageBase64: string | undefined = undefined;
            if (currentPreview) {
                imageBase64 = currentPreview;
            }

            const response = await apiPost<ChatSendResponse>('/api/ai/chat', {
                message: userText,
                session_id: sessionIdRef.current,
                image_base64: imageBase64,
            });

            sessionIdRef.current = response.session_id;
            handleStructuredActions(response.structured_actions, response.tool_calls);

            appendMessage({
                id: Date.now().toString(),
                role: 'model',
                text: response.reply,
            });
        } catch (error: any) {
            console.error('Chat error:', error);
            const detail = error?.detail;
            appendMessage({
                id: Date.now().toString(),
                role: 'model',
                text: typeof detail === 'string'
                    ? detail
                    : 'Sorry, I encountered an error while processing your request.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return {
        messages,
        appendMessage,
        input,
        isLoading,
        previewImage,
        messagesEndRef,
        setInput,
        handleImageSelect,
        handleRemoveImage,
        handleSend,
        handleStructuredActions,
    };
}

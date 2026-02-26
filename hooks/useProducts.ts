'use client';

import { useState, useEffect, useRef } from 'react';
import { apiGet, isAuthenticated } from '@/lib/api';
import type { Product, PageInfo, Variant, VariantOption } from '@/types';

// ── API Response Types ────────────────────────────────────────────────────────

interface ApiVariantOption {
    name: string;
    value: string;
}

interface ApiVariantItem {
    id: string;
    title: string;
    available: boolean;
    price: string;
    currency: string;
    image_url: string | null;
    options: ApiVariantOption[];
}

interface ApiProductItem {
    id: string;
    title: string;
    description: string;
    image_url: string | null;
    price: string;
    currency: string;
    variant_id: string | null;
    variants: ApiVariantItem[];
    option_names: string[];
}

interface ApiPageInfo {
    has_next_page: boolean;
    end_cursor: string | null;
}

interface ApiProductSearchResponse {
    products: ApiProductItem[];
    page_info: ApiPageInfo;
}

interface ApiCollectionItem {
    id: string;
    title: string;
    handle: string;
}

// ── Mappers (snake_case → camelCase) ──────────────────────────────────────────

function mapVariant(v: ApiVariantItem): Variant {
    return {
        id: v.id,
        title: v.title,
        available: v.available,
        price: v.price,
        currency: v.currency,
        imageUrl: v.image_url,
        options: v.options as VariantOption[],
    };
}

function mapProduct(p: ApiProductItem): Product {
    return {
        id: p.id,
        title: p.title,
        description: p.description,
        imageUrl: p.image_url,
        price: p.price,
        currency: p.currency,
        variantId: p.variant_id,
        variants: (p.variants || []).map(mapVariant),
        optionNames: p.option_names || [],
    };
}

function mapPageInfo(pi: ApiPageInfo): PageInfo {
    return {
        hasNextPage: pi.has_next_page,
        endCursor: pi.end_cursor,
    };
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useProducts(enabled: boolean = false) {
    const [products, setProducts] = useState<Product[]>([]);
    const [pageInfo, setPageInfo] = useState<PageInfo>({ hasNextPage: false, endCursor: null });
    const [collections, setCollections] = useState<any[]>([]);
    const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const currentSearchQuery = useRef<string>('');

    useEffect(() => {
        if (!enabled || !isAuthenticated()) return;
        const fetchInitialData = async () => {
            try {
                const [colls, result] = await Promise.all([
                    apiGet<{ collections: ApiCollectionItem[] }>('/api/products/collections'),
                    apiGet<ApiProductSearchResponse>('/api/products/search?q='),
                ]);
                setCollections(colls.collections);
                setProducts(result.products.map(mapProduct));
                setPageInfo(mapPageInfo(result.page_info));
            } catch (err) {
                console.error('Initial fetch error:', err);
            }
        };
        fetchInitialData();
    }, [enabled]);

    const searchProducts = async (query: string) => {
        currentSearchQuery.current = query;
        setIsSearching(true);
        try {
            const result = await apiGet<ApiProductSearchResponse>(
                `/api/products/search?q=${encodeURIComponent(query)}`
            );
            setProducts(result.products.map(mapProduct));
            setPageInfo(mapPageInfo(result.page_info));
        } catch (err) {
            console.error('Search error:', err);
        } finally {
            setIsSearching(false);
        }
    };

    const loadCollectionProducts = async (collectionId: string) => {
        setSelectedCollection(collectionId);
        setIsSearching(true);
        try {
            const result = await apiGet<ApiProductSearchResponse>(
                `/api/products/collections/${encodeURIComponent(collectionId)}`
            );
            setProducts(result.products.map(mapProduct));
            setPageInfo(mapPageInfo(result.page_info));
        } catch (err) {
            console.error('Collection fetch error:', err);
        } finally {
            setIsSearching(false);
        }
    };

    const loadMoreProducts = async () => {
        if (!pageInfo.hasNextPage || !pageInfo.endCursor || isSearching) return;
        setIsSearching(true);
        try {
            let result: ApiProductSearchResponse;
            if (selectedCollection) {
                result = await apiGet<ApiProductSearchResponse>(
                    `/api/products/collections/${encodeURIComponent(selectedCollection)}?after=${encodeURIComponent(pageInfo.endCursor)}`
                );
            } else {
                result = await apiGet<ApiProductSearchResponse>(
                    `/api/products/search?q=${encodeURIComponent(currentSearchQuery.current)}&after=${encodeURIComponent(pageInfo.endCursor)}`
                );
            }
            setProducts((prev) => [...prev, ...result.products.map(mapProduct)]);
            setPageInfo(mapPageInfo(result.page_info));
        } catch (err) {
            console.error('Load more error:', err);
        } finally {
            setIsSearching(false);
        }
    };

    const clearCollection = async () => {
        setSelectedCollection(null);
        await searchProducts('');
    };

    const setCurrentSearchQuery = (query: string) => {
        currentSearchQuery.current = query;
    };

    return {
        products,
        setProducts,
        pageInfo,
        setPageInfo,
        collections,
        setCollections,
        selectedCollection,
        setSelectedCollection,
        isSearching,
        currentSearchQuery,
        setCurrentSearchQuery,
        searchProducts,
        loadCollectionProducts,
        loadMoreProducts,
        clearCollection,
    };
}

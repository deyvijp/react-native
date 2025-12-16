import { ENV } from '../config/env';
import { getSession } from './session';

/**
 * Service for interacting with Odoo's website/shop controllers
 * These are public endpoints that don't require special permissions
 */
export const shopService = {
    /**
     * Get shop categories from the website
     */
    getCategories: async () => {
        try {
            const session = getSession();
            const headers: any = {
                'Content-Type': 'application/json',
            };

            if (session.sessionId) {
                headers['Cookie'] = `session_id=${session.sessionId}`;
            }

            const response = await fetch(`${ENV.ODOO_URL}/shop/categories`, {
                method: 'GET',
                headers: headers,
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const html = await response.text();

            // Parse categories from HTML (simple extraction)
            // In a real scenario, you might want to create a specific JSON endpoint in Odoo
            // For now, we'll use a simpler approach with the /shop endpoint
            return [];
        } catch (error) {
            console.error('Error fetching categories:', error);
            return [];
        }
    },

    /**
     * Get products from the shop
     * Uses Odoo's /shop endpoint which is public
     */
    getProducts: async (params: {
        search?: string;
        category?: number;
        limit?: number;
        offset?: number;
    } = {}) => {
        try {
            const session = getSession();
            const headers: any = {
                'Content-Type': 'application/json',
            };

            if (session.sessionId) {
                headers['Cookie'] = `session_id=${session.sessionId}`;
            }

            // Build query params
            const queryParams = new URLSearchParams();
            if (params.search) queryParams.append('search', params.search);
            if (params.category) queryParams.append('category', params.category.toString());
            if (params.limit) queryParams.append('ppg', params.limit.toString()); // products per page
            if (params.offset) queryParams.append('offset', params.offset.toString());

            const url = `${ENV.ODOO_URL}/shop?${queryParams.toString()}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: headers,
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            // For now, return empty - we'll use the JSON endpoint instead
            return [];
        } catch (error) {
            console.error('Error fetching products:', error);
            return [];
        }
    },

    /**
     * Get product detail
     * Uses /shop/product/<id> endpoint
     */
    getProductDetail: async (productId: number) => {
        try {
            const session = getSession();
            const headers: any = {
                'Content-Type': 'application/json',
            };

            if (session.sessionId) {
                headers['Cookie'] = `session_id=${session.sessionId}`;
            }

            const response = await fetch(`${ENV.ODOO_URL}/shop/product/${productId}`, {
                method: 'GET',
                headers: headers,
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            return null;
        } catch (error) {
            console.error('Error fetching product detail:', error);
            return null;
        }
    },

    /**
     * Get shop data via JSON-RPC (uses website's public methods)
     * This is better than direct model access
     */
    getShopData: async () => {
        try {
            const session = getSession();
            const headers: any = {
                'Content-Type': 'application/json',
            };

            if (session.sessionId) {
                headers['Cookie'] = `session_id=${session.sessionId}`;
            }

            const payload = {
                jsonrpc: '2.0',
                method: 'call',
                params: {},
                id: Math.floor(Math.random() * 1000000000),
            };

            const response = await fetch(`${ENV.ODOO_URL}/shop/get_product_data`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const text = await response.text();
            let result;
            try {
                result = JSON.parse(text);
            } catch (e) {
                throw new Error('Invalid JSON response');
            }

            return result.result || null;
        } catch (error) {
            console.error('Error fetching shop data:', error);
            return null;
        }
    },

    /**
     * Search products using website search
     */
    searchProducts: async (query: string) => {
        try {
            const session = getSession();
            const headers: any = {
                'Content-Type': 'application/json',
            };

            if (session.sessionId) {
                headers['Cookie'] = `session_id=${session.sessionId}`;
            }

            const payload = {
                jsonrpc: '2.0',
                method: 'call',
                params: {
                    term: query,
                    options: {
                        displayDescription: true,
                        displayDetail: true,
                        displayExtraLink: true,
                        displayImage: true,
                        max_nb_chars: 100,
                    },
                },
                id: Math.floor(Math.random() * 1000000000),
            };

            const response = await fetch(`${ENV.ODOO_URL}/website/snippet/autocomplete`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                return [];
            }

            const text = await response.text();
            let result;
            try {
                result = JSON.parse(text);
            } catch (e) {
                return [];
            }

            return result.result?.products || [];
        } catch (error) {
            console.error('Error searching products:', error);
            return [];
        }
    },
};

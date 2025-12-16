import { call } from './api';
import { ENV } from '../config/env';

export interface Product {
    id: number;
    name: string;
    list_price: number;
    image_512?: string;
    currency_id?: any[];
}

export const productService = {
    getFeaturedProducts: async (): Promise<Product[]> => {
        // Find products that can be sold.
        // Note: 'website_published' depends on the 'website_sale' module being installed.
        // We use 'sale_ok' as a safer fallback for now.
        const domain = [['sale_ok', '=', true]];
        // Fields to fetch - Removed image_512 to avoid heavy payload
        const fields = ['name', 'list_price', 'currency_id'];

        // Fetch products
        const products = await call('product.template', 'search_read', [domain, fields], {
            limit: 5,
            order: 'create_date desc'
        });

        return products;
    },

    getProductImageUrl: (productId: number) => {
        const baseUrl = ENV.ODOO_URL.replace(/\/$/, '');
        // Use standard product image field
        return `${baseUrl}/web/image/product.template/${productId}/image_128`;
    },

    searchByBarcode: async (barcode: string) => {
        // Search in product.product (variants typically carry the barcode)
        const domain = [['barcode', '=', barcode]];
        const fields = ['name', 'list_price', 'product_tmpl_id'];

        const products = await call('product.product', 'search_read', [domain, fields], { limit: 1 });
        return products && products.length > 0 ? products[0] : null;
    }
};

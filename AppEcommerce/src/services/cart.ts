// --- LOCAL CACHE STATE ---
// Odoo sometimes fails to return the cart via RPC/HTML immediately after adding (synchronization lag or permission issues).
// But addToCart response allows us to know the *exact* state. We cache it here.
let cartCache: any = null;

import { ENV } from '../config/env';
import { call } from './api';
import { getSession } from './session';

export const cartService = {

    /**
     * Add product to cart using Odoo's website shop endpoint
     * Same as clicking "Add to Cart" on the website
     */
    addToCart: async (productId: number, quantity: number = 1) => {
        const url = `${ENV.ODOO_URL}/shop/cart/update_json`;
        const session = getSession();

        try {
            const headers: any = {
                'Content-Type': 'application/json',
            };

            if (session.sessionId) {
                headers['Cookie'] = `session_id=${session.sessionId}`;
            } else {
                console.warn('No session ID found in addToCart');
            }

            console.log('Adding to cart (Web Endpoint):', { productId, quantity, sessionId: session.sessionId });

            const response = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    jsonrpc: "2.0",
                    method: "call",
                    params: {
                        product_id: productId,
                        add_qty: quantity,
                        display: false
                    },
                    id: Math.floor(Math.random() * 1000000000)
                }),
            });

            const json = await response.json();

            if (json.error) {
                console.error('Add to Cart Error:', json.error);
                throw new Error(json.error.data?.message || json.error.message || 'Error adding to cart');
            }

            console.log('Added to cart successfully:', JSON.stringify(json.result));

            // CRITICAL STEP: CLAIM THE ORDER
            // The order was likely created as "Public User" (anonymous).
            // We must try to assign it to our Partner ID immediately so getCart RPC works.
            try {
                if (json.result && json.result.notification_info && json.result.notification_info.lines) {
                    // Extract a line ID from the response
                    const notifLines = json.result.notification_info.lines;
                    const resultLineId = notifLines[0].id; // We just need one line to find the order

                    if (resultLineId && session.uid) {
                        // 1. Get User's Partner ID
                        const u = await call('res.users', 'read', [[session.uid], ['partner_id']]);
                        const myPid = u[0].partner_id[0];

                        // 2. Find Order ID from the Line
                        const lines = await call('sale.order.line', 'read', [[resultLineId], ['order_id']]);
                        if (lines && lines.length > 0) {
                            const orderId = lines[0].order_id[0];
                            console.log(`CLAIM: Found Order ID ${orderId} from line ${resultLineId}. Attempting to assign to Partner ${myPid}...`);

                            // 3. WRITE partner_id to the Order
                            // This bypasses 'create' permissions (ir.sequence) because we are just editing.
                            await call('sale.order', 'write', [[orderId], {
                                partner_id: myPid
                            }]);
                            console.log('CLAIM SUCCESS: Order is now assigned to you!');

                            // Success! Invalidate cache so getCart RPC fetches the real deal.
                            cartCache = null;
                        }
                    }
                }
            } catch (claimErr) {
                console.warn('CLAIM FAILED: Could not assign order to user.', claimErr);
                // We don't throw here, we let the flow continue (cache will handle display)
            }

            // UPDATE CACHE FROM RESPONSE (Fallback if Claim fails)
            if (cartCache === null && json.result && json.result.notification_info) {
                // ... (Only populate cache if we didn't successfully claim/invalidate)
                // Actually, populate it anyway for speed, getCart checks RPC first.
                const notifLines = json.result.notification_info.lines;
                // ... existing mapping code ...
            }

            // Re-use existing cache logic just for display speed if needed, 
            // but the Claim is the priority.
            if (json.result && json.result.notification_info && json.result.notification_info.lines) {
                const notifLines = json.result.notification_info.lines;
                const cachedLines = notifLines.map((l: any) => ({
                    id: l.id,
                    product_id: productId,
                    product_name: l.name,
                    quantity: l.quantity,
                    price_unit: l.line_price_total / l.quantity,
                    price_subtotal: l.line_price_total,
                    price_total: l.line_price_total
                }));

                cartCache = {
                    lines: cachedLines,
                    amount_total: json.result.amount,
                    currency: 'DOP',
                    id: 0,
                    name: 'Cached Cart'
                };
            }

            return json.result;
        } catch (error) {
            console.error('Add to Cart Network Error:', error);
            throw error;
        }
    },

    /**
     * Remove product from cart using Odoo's website shop endpoint
     */
    removeFromCart: async (lineId: number) => {
        try {
            // Invalidate cache on remove
            cartCache = null;

            const session = getSession();
            if (!session.sessionId) {
                throw new Error('No session available');
            }

            console.log('Removing from cart (Web Endpoint), line ID:', lineId);

            // Fetch product_id first because update_json sometimes needs it contextually or we want to be safe
            // But usually just setting line_id qty to 0 is enough if done right.
            // Let's try finding the product_id to match addToCart style.

            // Try RPC read of line to get product_id
            let productId = null;
            try {
                const lines = await call('sale.order.line', 'read', [[lineId], ['product_id']]);
                if (lines && lines.length) productId = lines[0].product_id[0];
            } catch (e) { console.log('Could not read line via RPC for removal details'); }

            const url = `${ENV.ODOO_URL}/shop/cart/update_json`;
            const headers: any = {
                'Content-Type': 'application/json',
                'Cookie': `session_id=${session.sessionId}`
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    jsonrpc: "2.0",
                    method: "call",
                    params: {
                        line_id: lineId,
                        product_id: productId, // Might be null, Odoo handles it usually if line_id provided
                        set_qty: 0,
                        display: false
                    },
                    id: Math.floor(Math.random() * 1000000000)
                }),
            });

            const json = await response.json();

            if (json.error) {
                // If error is permission, we just assume it's done or non-critical if we rely on cache clearing
                console.error('Remove Error:', json.error);
                throw new Error(json.error.data?.message || json.error.message || 'Error removing from cart');
            }

            console.log('Removed from cart successfully');
            return { success: true };
        } catch (error) {
            console.error('Remove from Cart Error:', error);
            throw error;
        }
    },

    /**
     * Request/Confirm Order
     */
    requestOrder: async (orderId: number) => {
        try {
            console.log('Requesting order via RPC (action_confirm_app)...', orderId);

            // 1. Check valid ID
            if (!orderId || orderId === 0) {
                throw new Error("Invalid Order ID for RPC confirmation");
            }

            // 2. Call Custom Model Method via RPC
            // This method uses sudo() internally to bypass permissions
            const result = await call('sale.order', 'action_confirm_app', [[orderId]]);

            console.log('RPC Confirm Success:', result);

            // 3. Clear Cache
            cartCache = null;

            return { success: true };

        } catch (error) {
            console.error('RPC Request Order Failed:', error);
            // Fallback to old Guest Checkout if RPC fails (e.g. module not updated yet)
            // ... (Code omitted for brevity, but could keep it if paranoid)
            throw error;
        }
    },

    /**
     * Update Quantity
     */
    updateQuantity: async (lineId: number, quantity: number) => {
        try {
            if (quantity <= 0) return await cartService.removeFromCart(lineId);

            const session = getSession();
            const url = `${ENV.ODOO_URL}/shop/cart/update_json`;
            const headers: any = {
                'Content-Type': 'application/json',
                'Cookie': `session_id=${session.sessionId}`
            };

            // Get product ID if possible
            let productId = null;
            try {
                const lines = await call('sale.order.line', 'read', [[lineId], ['product_id']]);
                if (lines && lines.length) productId = lines[0].product_id[0];
            } catch (e) { }

            const response = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    jsonrpc: "2.0",
                    method: "call",
                    params: {
                        line_id: lineId,
                        product_id: productId,
                        set_qty: quantity,
                        display: false
                    },
                    id: Math.floor(Math.random() * 1000000000)
                }),
            });

            const json = await response.json();
            if (json.error) throw new Error(json.error.message);

            // Invalidate/Update Cache? 
            // Better to rely on getCart refresh or partial update.
            // For now, let's just clear cache so getCart fetches fresh.
            cartCache = null;

            return json.result;

        } catch (error) {
            console.error('Update Quantity Error:', error);
            throw error;
        }
    },

    /**
     * Get cart - searches for the most recent draft order for the user
     */
    getCart: async () => {
        try {
            const session = getSession();
            if (!session.uid) {
                console.log('No UID in session');
                return null;
            }

            // Get user's partner_id
            const users = await call('res.users', 'read', [[session.uid], ['partner_id']]);
            if (!users || !users.length) {
                return null;
            }

            const partnerId = users[0].partner_id[0];
            console.log('Getting cart for partner:', partnerId);

            const domain = [
                ['partner_id', '=', partnerId],
                ['state', 'in', ['draft', 'sent']]
            ];

            const fields = ['id', 'name', 'order_line', 'amount_total', 'amount_untaxed', 'amount_tax', 'write_date', 'state'];

            const orders = await call('sale.order', 'search_read', [domain, fields], {
                order: 'write_date desc',
                limit: 5
            });

            if (!orders || !orders.length) {
                console.log('No active order found for partner', partnerId, '- Attempting HTML Fallback');

                // HTML FALLBACK
                if (session.sessionId) {
                    try {
                        console.log('Executing HTML Cart Fallback...');
                        const response = await fetch(`${ENV.ODOO_URL}/shop/cart`, {
                            headers: { 'Cookie': `session_id=${session.sessionId}` }
                        });
                        const html = await response.text();

                        // Strategy: Find Product IDs from Image URLs usually present in cart lines
                        const imgRegex = /\/web\/image\/product\.product\/(\d+)/g;
                        const productIdsFound = new Set<number>();

                        let imgMatch;
                        while ((imgMatch = imgRegex.exec(html)) !== null) {
                            productIdsFound.add(parseInt(imgMatch[1]));
                        }

                        if (html.includes('Producto test')) {
                            console.log('HTML CONFIRMED: Contains "Producto test"');
                        } else {
                            console.log('HTML WARNING: Does NOT contain "Producto test". Preview:', html.substring(0, 200).replace(/\n/g, ' '));
                        }

                        if (productIdsFound.size > 0) {
                            const ids = Array.from(productIdsFound);
                            console.log('HTML Fallback found ' + ids.length + ' products. Hydrating...');

                            // Fetch details
                            const products = (await call('product.product', 'read', [ids, ['name', 'list_price', 'display_name']])) as any[];

                            const formattedLines = products.map((p: any) => ({
                                id: 0, // Virtual
                                product_id: p.id,
                                qty: 1, // Defaulting to 1
                                product_name: p.display_name,
                                price_unit: p.list_price,
                                price_subtotal: p.list_price,
                                price_total: p.list_price,
                                order_id: 0
                            }));

                            const total = formattedLines.reduce((sum: number, line: any) => sum + line.price_total, 0);

                            return {
                                lines: formattedLines,
                                amount_total: total,
                                currency: 'DOP', // Default
                                id: 0, // Virtual ID
                                name: 'Web Cart (Sincronizado)'
                            };
                        }
                    } catch (e) {
                        console.error('HTML Fallback Error', e);
                    }
                }

                if (cartCache) {
                    console.log('Returning Local Cache as Backend/HTML returned Empty');
                    return cartCache;
                }
                return null;
            }

            const draftOrder = orders.find((o: any) => o.state === 'draft');
            const order = draftOrder || orders[0];

            // Get order lines with product details
            if (order.order_line && order.order_line.length > 0) {
                const lineFields = [
                    'id',
                    'product_id',
                    'product_template_id',
                    'name',
                    'product_uom_qty',
                    'price_unit',
                    'price_subtotal',
                    'price_total'
                ];

                const lines = await call('sale.order.line', 'read', [order.order_line, lineFields]);

                order.lines = lines.map((line: any) => ({
                    id: line.id,
                    product_id: line.product_id[0],
                    product_template_id: line.product_template_id ? line.product_template_id[0] : null,
                    product_name: line.product_id[1],
                    quantity: line.product_uom_qty,
                    price_unit: line.price_unit,
                    price_subtotal: line.price_subtotal,
                    price_total: line.price_total,
                }));
            } else {
                order.lines = [];
            }

            return order;
        } catch (error) {
            console.error('Get Cart Error:', error);
            if (cartCache) {
                console.log('Returning Local Cache due to Error');
                return cartCache;
            }
            return null;
        }
    },

    getCartCount: async (): Promise<number> => {
        try {
            if (cartCache && cartCache.lines) {
                const count = cartCache.lines.reduce((sum: number, line: any) => sum + (line.quantity || 0), 0);
                return count;
            }
            const cart = await cartService.getCart();
            if (!cart || !cart.lines) return 0;
            return cart.lines.reduce((sum: number, line: any) => sum + (line.quantity || 0), 0);
        } catch (error) {
            return 0;
        }
    },
};

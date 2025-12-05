import api from './api';
import { databaseService } from './database';

export interface Route {
    id: number;
    name: string;
    date: string;
    state: 'draft' | 'open' | 'done';
    line_ids: RouteLine[];
}

export interface RouteLine {
    id: number;
    partner_id: [number, string]; // Odoo Many2one format
    sequence: number;
    status: 'pending' | 'visited' | 'skipped';
    visit_time?: string;
}

class RouteService {
    /**
     * Fetch routes from Odoo and save to local DB
     */
    async syncRoutes(userId: number) {
        try {
            // 1. Fetch from Odoo
            // We use search_read to get the data we need
            const response = await api.post('/web/dataset/call_kw/sales.route/search_read', {
                jsonrpc: '2.0',
                method: 'call',
                params: {
                    model: 'sales.route',
                    method: 'search_read',
                    args: [[['user_id', '=', userId]]], // Domain
                    kwargs: {
                        fields: ['name', 'date', 'state', 'line_ids'],
                    },
                },
            });

            if (response.data.result) {
                const routes = response.data.result;

                // 2. For each route, we might need to fetch the lines details if not fully expanded
                // But 'line_ids' in search_read usually returns just IDs.
                // Let's do a second fetch for lines or use a better controller endpoint.
                // For now, let's assume we use the custom controller we might build, OR just standard ORM.
                // Standard ORM 'read' on lines is easier.

                // Optimization: Let's fetch all lines for these routes
                const allLineIds = routes.flatMap((r: any) => r.line_ids);

                if (allLineIds.length > 0) {
                    const linesResponse = await api.post('/web/dataset/call_kw/sales.route.line/read', {
                        jsonrpc: '2.0',
                        method: 'call',
                        params: {
                            model: 'sales.route.line',
                            method: 'read',
                            args: [allLineIds],
                            kwargs: {
                                fields: ['route_id', 'partner_id', 'sequence', 'status', 'visit_time'],
                            },
                        },
                    });

                    if (linesResponse.data.result) {
                        const lines = linesResponse.data.result;
                        // Attach lines to routes
                        routes.forEach((route: any) => {
                            route.line_ids = lines.filter((l: any) => l.route_id[0] === route.id);
                        });
                    }
                }

                // 3. Save to Local DB
                databaseService.saveRoutes(routes);
                return routes;
            }
        } catch (error) {
            console.error('Sync Routes Error:', error);
            throw error;
        }
    }

    /**
     * Get routes from Local DB
     */
    getLocalRoutes() {
        const routes = databaseService.getRoutes();
        // Parse JSON lines
        return routes.map(r => ({
            ...r,
            line_ids: r.lines_json ? JSON.parse(r.lines_json) : []
        }));
    }
}

export const routeService = new RouteService();

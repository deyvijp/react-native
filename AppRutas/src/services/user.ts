import { ENV } from '../config/env';
import { getSession } from './session';

type JsonRpcRequest = {
    jsonrpc: '2.0';
    method: 'call';
    params: {
        service: 'object';
        method: 'execute_kw';
        args: any[];
    };
    id: number;
};

const call = async (model: string, method: string, args: any[], kwargs: any = {}) => {
    const session = getSession();
    if (!session.uid) throw new Error('No active session');

    const baseUrl = ENV.ODOO_URL.replace(/\/$/, '');
    const url = `${baseUrl}/jsonrpc`;

    const payload: JsonRpcRequest = {
        jsonrpc: '2.0',
        method: 'call',
        params: {
            service: 'object',
            method: 'execute_kw',
            args: [
                ENV.ODOO_DB,
                session.uid,
                session.password,
                model,
                method,
                args,
                kwargs
            ]
        },
        id: Math.floor(Math.random() * 1000000000),
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    const result = await response.json();
    if (result.error) {
        throw new Error(result.error.data.message || result.error.message);
    }
    return result.result;
};

export const userService = {
    getUserInfo: async () => {
        const session = getSession();
        // Read fields from res.users
        const fields = ['name', 'email', 'mobile', 'phone', 'login'];
        const data = await call('res.users', 'read', [[session.uid], fields]);
        return data && data[0] ? data[0] : null;
    },

    /**
     * Updates fields on the current user record (res.users).
     * @param vals Dictionary of fields to update to Odoo (e.g. { mobile: '...', phone: '...' })
     */
    updateUser: async (vals: any) => {
        const session = getSession();
        return await call('res.users', 'write', [[session.uid], vals]);
    }
};

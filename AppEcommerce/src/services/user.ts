import { call } from './api';
import { getSession } from './session';

// Local call function removed in favor of shared api.ts

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

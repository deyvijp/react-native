import { ODOO_URL, ODOO_DB } from '@env';

// In a real app, use react-native-dotenv or react-native-config
// to load these from a .env file.

export const ENV = {
    ODOO_URL: ODOO_URL || "https://mediterranean-condition-tent-development.trycloudflare.com",
    ODOO_DB: ODOO_DB || "v18",
};

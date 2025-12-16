import { call } from './api';
import { getSession } from './session';

type CompanyConfig = {
    id: number;
    name: string;
    currency_id: [number, string];
    currency_symbol: string;
    currency_position: 'before' | 'after';
    decimal_separator: string;
    thousands_separator: string;
    logo?: string;
};

let cachedConfig: CompanyConfig | null = null;

export const companyService = {
    /**
     * Get company configuration including currency and formatting
     */
    getCompanyConfig: async (): Promise<CompanyConfig | null> => {
        if (cachedConfig) {
            console.log('Returning cached company config');
            return cachedConfig;
        }

        try {
            const session = getSession();
            console.log('Getting company config for session:', { uid: session.uid, hasSessionId: !!session.sessionId });

            if (!session.uid) {
                console.warn('No UID in session, returning default config');
                return {
                    id: 1,
                    name: 'Company',
                    currency_id: [1, 'DOP'],
                    currency_symbol: 'RD$',
                    currency_position: 'before',
                    decimal_separator: '.',
                    thousands_separator: ',',
                };
            }

            // Get user's company
            console.log('Fetching user company...');
            const users = await call('res.users', 'read', [[session.uid], ['company_id']]);
            if (!users || !users.length) {
                console.error('No user found');
                return null;
            }

            const companyId = users[0].company_id[0];
            console.log('Company ID:', companyId);

            // Get company details with currency info
            console.log('Fetching company details...');
            const companies = await call('res.company', 'read', [
                [companyId],
                ['name', 'currency_id', 'logo']
            ]);

            if (!companies || !companies.length) {
                console.error('No company found');
                return null;
            }
            const company = companies[0];
            console.log('Company:', company.name, 'Currency ID:', company.currency_id);

            // Get currency details
            console.log('Fetching currency details...');
            const currencies = await call('res.currency', 'read', [
                [company.currency_id[0]],
                ['symbol', 'position']
            ]);

            if (!currencies || !currencies.length) {
                console.error('No currency found');
                return null;
            }
            const currency = currencies[0];
            console.log('Currency symbol:', currency.symbol, 'Position:', currency.position);

            // Get language formatting (decimal and thousands separators)
            const lang = await call('res.lang', 'search_read', [
                [['code', '=', 'es_DO']], // Dominican Spanish, adjust as needed
                ['decimal_point', 'thousands_sep']
            ], { limit: 1 });

            const decimalSep = lang && lang.length > 0 ? lang[0].decimal_point : '.';
            const thousandsSep = lang && lang.length > 0 ? lang[0].thousands_sep : ',';

            cachedConfig = {
                id: company.id,
                name: company.name,
                currency_id: company.currency_id,
                currency_symbol: currency.symbol,
                currency_position: currency.position,
                decimal_separator: decimalSep,
                thousands_separator: thousandsSep,
                logo: company.logo,
            };

            console.log('Company config loaded successfully:', cachedConfig);
            return cachedConfig;
        } catch (error) {
            console.error('Error loading company config:', error);
            // Return default config instead of null
            const defaultConfig = {
                id: 1,
                name: 'Company',
                currency_id: [1, 'DOP'] as [number, string],
                currency_symbol: 'RD$',
                currency_position: 'before' as 'before' | 'after',
                decimal_separator: '.',
                thousands_separator: ',',
            };
            console.log('Returning default config');
            return defaultConfig;
        }
    },

    /**
     * Format price according to company currency settings
     */
    formatPrice: async (amount: number): Promise<string> => {
        const config = await companyService.getCompanyConfig();
        if (!config) return `$${amount.toFixed(2)}`;

        // Format number with thousands separator
        const parts = amount.toFixed(2).split('.');
        const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, config.thousands_separator);
        const decimalPart = parts[1];
        const formattedNumber = `${integerPart}${config.decimal_separator}${decimalPart}`;

        // Add currency symbol
        if (config.currency_position === 'before') {
            return `${config.currency_symbol}${formattedNumber}`;
        } else {
            return `${formattedNumber} ${config.currency_symbol}`;
        }
    },

    /**
     * Clear cached config (useful after company change)
     */
    clearCache: () => {
        cachedConfig = null;
    },
};

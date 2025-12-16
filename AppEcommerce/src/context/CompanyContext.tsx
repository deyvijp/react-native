import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { companyService } from '../services/company';

type CompanyContextType = {
    currencySymbol: string;
    currencyPosition: 'before' | 'after';
    formatPrice: (amount: number) => string;
    companyName: string;
};

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const CompanyProvider = ({ children }: { children: ReactNode }) => {
    const [currencySymbol, setCurrencySymbol] = useState('$');
    const [currencyPosition, setCurrencyPosition] = useState<'before' | 'after'>('before');
    const [companyName, setCompanyName] = useState('');
    const [decimalSep, setDecimalSep] = useState('.');
    const [thousandsSep, setThousandsSep] = useState(',');

    useEffect(() => {
        loadCompanyConfig();
    }, []);

    const loadCompanyConfig = async () => {
        try {
            const config = await companyService.getCompanyConfig();
            console.log('Company config loaded:', config);
            if (config) {
                setCurrencySymbol(config.currency_symbol);
                setCurrencyPosition(config.currency_position);
                setCompanyName(config.name);
                setDecimalSep(config.decimal_separator);
                setThousandsSep(config.thousands_separator);
                console.log('Currency symbol set to:', config.currency_symbol);
            } else {
                console.warn('No company config returned');
            }
        } catch (e) {
            console.error('Error loading company config:', e);
        }
    };

    const formatPrice = (amount: number): string => {
        // Format number with thousands separator
        const parts = amount.toFixed(2).split('.');
        const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSep);
        const decimalPart = parts[1];
        const formattedNumber = `${integerPart}${decimalSep}${decimalPart}`;

        // Add currency symbol
        if (currencyPosition === 'before') {
            return `${currencySymbol}${formattedNumber}`;
        } else {
            return `${formattedNumber} ${currencySymbol}`;
        }
    };

    return (
        <CompanyContext.Provider value={{ currencySymbol, currencyPosition, formatPrice, companyName }}>
            {children}
        </CompanyContext.Provider>
    );
};

export const useCompany = () => {
    const context = useContext(CompanyContext);
    if (!context) {
        throw new Error('useCompany must be used within CompanyProvider');
    }
    return context;
};

// Mock implementation for Web
export const open = () => ({
    execute: (query) => {
        console.log('SQLite Mock Execute:', query);
        return { rows: { _array: [] } };
    },
    transaction: (callback) => {
        callback({
            execute: (query) => console.log('SQLite Mock Transaction:', query),
        });
    },
});

export const QuickSQLiteConnection = class { };

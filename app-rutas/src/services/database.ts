import { QuickSQLiteConnection, open } from 'react-native-quick-sqlite';

const DB_NAME = 'sales_route.db';

class DatabaseService {
    private db: QuickSQLiteConnection | null = null;

    constructor() {
        try {
            this.db = open({ name: DB_NAME });
            this.initTables();
        } catch (e) {
            console.error('Failed to open database', e);
        }
    }

    private initTables() {
        if (!this.db) return;

        // Table for storing Routes (synced from Odoo)
        this.db.execute(`
      CREATE TABLE IF NOT EXISTS routes (
        id INTEGER PRIMARY KEY,
        name TEXT,
        date TEXT,
        state TEXT,
        lines_json TEXT
      );
    `);

        // Table for storing Tracking Logs (to be synced to Odoo)
        this.db.execute(`
      CREATE TABLE IF NOT EXISTS tracking_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        latitude REAL,
        longitude REAL,
        timestamp TEXT,
        battery_level REAL,
        speed REAL,
        heading REAL,
        synced INTEGER DEFAULT 0
      );
    `);
    }

    // --- Route Methods ---

    public saveRoutes(routes: any[]) {
        if (!this.db) return;

        this.db.transaction((tx) => {
            // Clear existing routes (simple strategy: replace all)
            tx.execute('DELETE FROM routes');

            for (const route of routes) {
                tx.execute(
                    'INSERT INTO routes (id, name, date, state, lines_json) VALUES (?, ?, ?, ?, ?)',
                    [route.id, route.name, route.date, route.state, JSON.stringify(route.line_ids)]
                );
            }
        });
    }

    public getRoutes() {
        if (!this.db) return [];
        const result = this.db.execute('SELECT * FROM routes ORDER BY date DESC');
        return result.rows?._array || []; // Adapt based on library return shape
    }

    // --- Tracking Methods ---

    public addTrackingLog(log: {
        latitude: number;
        longitude: number;
        timestamp: string;
        battery_level: number;
        speed: number;
        heading: number;
    }) {
        if (!this.db) return;

        this.db.execute(
            'INSERT INTO tracking_logs (latitude, longitude, timestamp, battery_level, speed, heading) VALUES (?, ?, ?, ?, ?, ?)',
            [log.latitude, log.longitude, log.timestamp, log.battery_level, log.speed, log.heading]
        );
    }

    public getPendingLogs() {
        if (!this.db) return [];
        const result = this.db.execute('SELECT * FROM tracking_logs WHERE synced = 0');
        return result.rows?._array || [];
    }

    public markLogsAsSynced(ids: number[]) {
        if (!this.db || ids.length === 0) return;
        const idsStr = ids.join(',');
        this.db.execute(`UPDATE tracking_logs SET synced = 1 WHERE id IN (${idsStr})`);
        // Optional: Delete synced logs to save space
        // this.db.execute(`DELETE FROM tracking_logs WHERE id IN (${idsStr})`);
    }
}

export const databaseService = new DatabaseService();

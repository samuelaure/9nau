
export interface LogEntry {
    timestamp: string;
    level: 'info' | 'error' | 'warn';
    message: string;
    data?: any;
}

class LogService {
    private logs: LogEntry[] = [];
    private readonly MAX_LOGS = 100;
    private listeners: (() => void)[] = [];

    private addLog(level: 'info' | 'error' | 'warn', message: string, data?: any) {
        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            data,
        };

        this.logs.unshift(entry);
        if (this.logs.length > this.MAX_LOGS) {
            this.logs.pop();
        }

        this.notifyListeners();

        // Also log to console for development
        if (level === 'error') console.error(message, data);
        else if (level === 'warn') console.warn(message, data);
        else console.log(message, data);
    }

    log(message: string, data?: any) {
        this.addLog('info', message, data);
    }

    error(message: string, data?: any) {
        this.addLog('error', message, data);
    }

    warn(message: string, data?: any) {
        this.addLog('warn', message, data);
    }

    getLogs() {
        return this.logs;
    }

    clear() {
        this.logs = [];
        this.notifyListeners();
    }

    subscribe(listener: () => void) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    private notifyListeners() {
        this.listeners.forEach(l => l());
    }
}

export const logger = new LogService();

// utils/debugUtils.ts
export const debugUtils = {
    logApiCall: (method: string, endpoint: string, data?: any, response?: any, error?: any) => {
        const timestamp = new Date().toISOString();

        const logEntry = {
            timestamp,
            method,
            endpoint,
            request: data ? { ...data, password: data.password ? '***' : undefined } : undefined,
            response,
            error: error ? {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data
            } : undefined
        };

        console.log(`🔍 API Debug:`, logEntry);

        // Salvar no localStorage para debug persistente
        const debugLogs = JSON.parse(localStorage.getItem('debug_logs') || '[]');
        debugLogs.unshift(logEntry);
        if (debugLogs.length > 50) debugLogs.pop(); // Limitar a 50 logs
        localStorage.setItem('debug_logs', JSON.stringify(debugLogs));

        return logEntry;
    },

    clearDebugLogs: () => {
        localStorage.removeItem('debug_logs');
    },

    getDebugLogs: () => {
        return JSON.parse(localStorage.getItem('debug_logs') || '[]');
    },

    testBackend: async (): Promise<{
        status: 'connected' | 'error';
        message: string;
        data?: any;
    }> => {
        try {
            const response = await fetch('https://api.washingtongaming.tech/api/v1/health');
            const data = await response.json();

            return {
                status: response.ok ? 'connected' : 'error',
                message: response.ok ? 'Backend connected' : 'Backend error',
                data
            };
        } catch (error: any) {
            return {
                status: 'error',
                message: error.message || 'Failed to connect to backend'
            };
        }
    }
};
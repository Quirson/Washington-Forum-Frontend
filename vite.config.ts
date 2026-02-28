import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@/components': path.resolve(__dirname, './src/components'),
            '@/pages': path.resolve(__dirname, './src/pages'),
            '@/hooks': path.resolve(__dirname, './src/hooks'),
            '@/store': path.resolve(__dirname, './src/store'),
            '@/services': path.resolve(__dirname, './src/services'),
            '@/utils': path.resolve(__dirname, './src/utils'),
            '@/types': path.resolve(__dirname, './src/types'),
        },
    },
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: 'https://api.washingtongaming.tech',
                changeOrigin: true,
            },
        },
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom', 'react-router-dom'],
                    ui: ['lucide-react', 'framer-motion'],
                },
            },
        },
    },
});

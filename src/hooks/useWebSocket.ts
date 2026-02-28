// hooks/useWebSocket.ts - APAGUE TUDO E COLE ISSO:

import { useEffect, useRef } from 'react';

export const useWebSocket = (url: string, onMessage: (msg: any) => void) => {
    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        // 1. Pega token
        const token = localStorage.getItem('token');
        if (!token) {
            console.log('❌ No token, skipping WebSocket');
            return;
        }

        // 2. Monta URL
        const wsUrl = `${url}?token=${token}`.replace('http', 'ws');
        console.log('🔌 WebSocket URL:', wsUrl);

        // 3. Cria conexão
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        // 4. Eventos MÍNIMOS
        ws.onopen = () => console.log('✅ WebSocket CONNECTED');
        ws.onerror = (e) => console.log('⚠️ WebSocket error (ignoring):', e);
        ws.onclose = () => console.log('🔌 WebSocket closed');

        ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                console.log('📨 WS Message received:', msg);
                onMessage(msg); // Chama callback
            } catch (err) {
                console.log('⚠️ Failed to parse WS message');
            }
        };

        // 5. Cleanup simples
        return () => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        };
    }, [url, onMessage]);

    // Função send simples
    const send = (data: any) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(data));
            console.log('📤 Sent via WS:', data);
        } else {
            console.log('⚠️ WS not ready, skipping send');
        }
    };

    return { send };
};
#!/bin/bash
echo "🔨 Building..."
go build -o forum-backend ./cmd/api/main.go && \
echo "✅ Build OK!" && \
pm2 restart forum-backend && \
echo "🚀 Deployed!" && \
pm2 logs forum-backend --lines 20

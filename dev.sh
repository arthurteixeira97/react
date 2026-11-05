#!/usr/bin/env bash
# Sobe o backend e o app mobile juntos, num terminal só.
# Uso: ./dev.sh   (ou: npm run dev, a partir da pasta estoque/)
set -uo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$DIR/server"
MOBILE_DIR="$DIR/mobile"
API_HEALTH="http://localhost:3001/api/health"

SERVER_PID=""

cleanup() {
  if [ -n "$SERVER_PID" ] && kill -0 "$SERVER_PID" 2>/dev/null; then
    echo ""
    echo "🛑 Encerrando o backend (pid $SERVER_PID)..."
    kill "$SERVER_PID" 2>/dev/null
    wait "$SERVER_PID" 2>/dev/null
  fi
}
trap cleanup EXIT INT TERM

echo "🚀 Iniciando o backend (server)..."
( cd "$SERVER_DIR" && npm run dev ) &
SERVER_PID=$!

echo "⏳ Esperando a API responder em $API_HEALTH ..."
ok=0
for i in $(seq 1 30); do
  if curl -s -m 1 "$API_HEALTH" >/dev/null 2>&1; then
    ok=1
    break
  fi
  if ! kill -0 "$SERVER_PID" 2>/dev/null; then
    echo "❌ O backend caiu antes de responder. Veja o erro acima (.env ausente? porta 3001 ocupada? banco sem migração?)."
    exit 1
  fi
  sleep 1
done

if [ "$ok" -eq 1 ]; then
  echo "✅ API no ar."
else
  echo "⚠️  A API não respondeu em 30s. Vou abrir o Expo assim mesmo, mas confira os logs do backend acima."
fi

echo "📱 Iniciando o Expo (mobile)..."
cd "$MOBILE_DIR"
npx expo start -c

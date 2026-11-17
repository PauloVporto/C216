#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
export API_PORT="${E2E_API_PORT:-8180}"
export FRONTEND_PORT="${E2E_FRONTEND_PORT:-5180}"
export DB_PORT="${E2E_DB_PORT:-55433}"
export POSTGRES_DB=biblioteca_e2e POSTGRES_USER=e2e POSTGRES_PASSWORD=e2e
export CORS_ORIGINS="http://localhost:${FRONTEND_PORT}"
export E2E_BASE_URL="http://localhost:${FRONTEND_PORT}"
compose=(docker compose -p c216-entrelinhas-e2e)
cleanup() {
  result=$?
  trap - EXIT
  if [ "$result" -ne 0 ]; then "${compose[@]}" logs --no-color; fi
  "${compose[@]}" down -v --remove-orphans
  exit "$result"
}
trap cleanup EXIT
"${compose[@]}" up -d --build --wait --wait-timeout 120
cd frontend
npm run test:e2e

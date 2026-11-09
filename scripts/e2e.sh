#!/bin/sh
set -eu
export API_PORT=8001 FRONTEND_PORT=5174
export VITE_API_URL=http://localhost:8001
export CORS_ORIGINS=http://localhost:5174,http://127.0.0.1:5174
export E2E_BASE_URL=http://localhost:5174
# --env-file evita herdar as portas e URLs do .env de desenvolvimento.
compose() { docker compose --env-file /dev/null -p lab-e2e "$@"; }
cleanup() { compose down -v --remove-orphans; }
trap cleanup EXIT
trap 'exit 130' INT TERM
compose up --build -d --wait
compose exec -T backend python -m app.db.migrate
(cd frontend && npm run test:e2e)

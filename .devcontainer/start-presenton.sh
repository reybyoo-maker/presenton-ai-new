#!/usr/bin/env bash
set -euo pipefail

cd "${CODESPACE_VSCODE_FOLDER:-$PWD}"

echo "Starting Presenton Reference Studio on port 5001..."
export PRESENTON_HTTP_HOST_PORT=5001
docker compose up -d --build production

echo
echo "Container status:"
docker compose ps production
echo
echo "The app is configured to use private port forwarding on port 5001."
echo "Wait for the port-forwarded link in the Codespaces Ports panel."

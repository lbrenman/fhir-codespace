#!/bin/bash
# ── FHIR R4 Codespace Setup Script ──
# Runs automatically via postCreateCommand in devcontainer.json

set -e

echo "🏗️  Setting up FHIR R4 Codespace..."

# ── Create .env from template if it doesn't exist ──
if [ ! -f .env ]; then
  echo "📝 Creating .env from template..."
  cp .env.example .env

  # Auto-detect Codespace URL
  if [ -n "$CODESPACE_NAME" ]; then
    FHIR_URL="https://${CODESPACE_NAME}-3000.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}"
    echo "   Codespace detected: ${CODESPACE_NAME}"
    echo "   FHIR Base URL: ${FHIR_URL}/fhir/r4"
    # Update .env with detected values
    sed -i "s|^FHIR_BASE_URL=.*|FHIR_BASE_URL=|" .env
  fi
else
  echo "✅ .env already exists, skipping"
fi

# ── Install server dependencies ──
echo "📦 Installing server dependencies..."
cd server && npm install && cd ..

# ── Generate sample data (skip if exists) ──
echo "🗃️  Seeding sample data..."
cd server && npm run seed && cd ..

# ── Install dashboard dependencies ──
echo "📦 Installing dashboard dependencies..."
cd dashboard && npm install && cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "   API Server:  http://localhost:3000"
echo "   Swagger UI:  http://localhost:3000/swagger"
echo "   Dashboard:   http://localhost:5173"
echo ""
echo "   Both services start automatically via postStartCommand."
echo ""

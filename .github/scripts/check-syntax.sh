#!/usr/bin/env bash
set -euo pipefail

# Base branch del PR (en pull_request event)
BASE_REF="${1:-origin/${GITHUB_BASE_REF:-main}}"

# Asegúrate de haber hecho checkout con fetch-depth:0 en Actions
git fetch origin "$BASE_REF" || true

# Lista de ficheros cambiados entre base y HEAD (works for push and PR)
CHANGED=$(git diff --name-only "origin/${GITHUB_BASE_REF:-$BASE_REF}"...HEAD || true)

# Filtrar .js y .json
JS_FILES=$(printf "%s\n" "$CHANGED" | grep -E '\.jsx?$' || true)
JSON_FILES=$(printf "%s\n" "$CHANGED" | grep -E '\.json$' || true)

EXIT_CODE=0

if [ -n "$JS_FILES" ]; then
  echo "Running ESLint on changed JS files:"
  echo "$JS_FILES"
  # Ejecuta eslint file-by-file para que el resultado sea claro
  while IFS= read -r f; do
    if [ -f "$f" ]; then
      npx eslint "$f" || EXIT_CODE=1
    fi
  done <<< "$JS_FILES"
else
  echo "No JS files changed."
fi

if [ -n "$JSON_FILES" ]; then
  echo "Checking JSON syntax for changed files:"
  echo "$JSON_FILES"
  while IFS= read -r f; do
    if [ -f "$f" ]; then
      # Usa jq para validar el JSON (sale con error si no es válido)
      if ! jq -e . "$f" > /dev/null 2>&1; then
        echo "Invalid JSON: $f"
        EXIT_CODE=1
      fi
    fi
  done <<< "$JSON_FILES"
else
  echo "No JSON files changed."
fi

exit $EXIT_CODE

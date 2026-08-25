#!/usr/bin/env bash
#
# Prepares the environment to run the Playwright test suite.
#
#  1. Installs npm dependencies
#  2. Downloads the Playwright browsers
#  3. Installs the OS packages required by those browsers
#
# OS packages can only be installed automatically when running as root
# (typical in CI) or with passwordless sudo. Without them, the browsers
# are still downloaded, but some may fail to launch until the packages
# are installed manually.

set -euo pipefail

cd "$(dirname "$0")"

can_install_os_packages() {
	if [ "$(id -u)" -eq 0 ]; then
		return 0
	fi
	command -v sudo >/dev/null 2>&1 && sudo -n true >/dev/null 2>&1
}

echo '==> Installing npm dependencies'
if [ -d node_modules ]; then
	echo '    node_modules already present, skipping npm ci'
else
	npm ci
fi

echo '==> Installing Playwright browsers'
if can_install_os_packages; then
	npx playwright install --with-deps
else
	if ! npx playwright install; then
		echo '!! Browser setup reported problems, most likely missing OS libraries.' >&2
	fi
	cat <<'HINT'

OS libraries could not be installed automatically (no root/passwordless sudo).
If browsers fail to launch, run this once with elevated privileges:

	sudo npx playwright install-deps

HINT
fi

echo '==> Setup complete'

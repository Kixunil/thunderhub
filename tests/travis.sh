#!/bin/bash

set -e

lnd_network=regtest

. /usr/share/lnd/lib/bash.sh

export BITCOIN_NETWORK="regtest"
export COOKIE_PATH="$lnd_admin_macaroon_file"
export SSO_SERVER_URL="127.0.0.1:$lnd_grpc_port"
export SSO_CERT_PATH="$lnd_cert_file"
export BASE_PATH="/thunderhub-rt"

npm run build

npm start &

# Give it some time to run
sleep 3

tests/basic-payments.py "`sudo "/usr/share/selfhost/lib/get_default_domain.sh"`" "thunderhub-rt" "`sudo cat "/var/run/thunderhub-system-regtest/sso/cookie"`" headless

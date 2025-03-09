#!/bin/bash

set -eufo pipefail

sudo softwareupdate --agree-to-license --install-rosetta

brew bundle --file=/dev/stdin <<EOF
cask "google-earth-pro"
EOF

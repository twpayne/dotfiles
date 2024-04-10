#!/bin/bash

set -eufo pipefail

sudo softwareupdate --agree-to-license --install-rosetta

brew bundle --no-lock --file=/dev/stdin <<EOF
cask "google-earth-pro"
EOF

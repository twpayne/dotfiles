#!/bin/bash

set -eufo pipefail

defaults write -g NSAutomaticCapitalizationEnabled -bool false
defaults write -g NSAutomaticPeriodSubstitutionEnabled -bool false
defaults write -g NSUserDictionaryReplacementItems '()'
defaults write -g com.apple.trackpad.forceClick -bool false

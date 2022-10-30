#!/bin/bash

set -eufo pipefail

# https://github.com/mathiasbynens/dotfiles/blob/main/.macos

defaults write NSGlobalDomain AppleInterfaceStyle Dark
defaults write NSGlobalDomain AppleLanguages -array en-US
defaults write NSGlobalDomain AppleLocale en_US
defaults write NSGlobalDomain InitialKeyRepeat -int 15
defaults write NSGlobalDomain KeyRepeat -int 2
defaults write NSGlobalDomain NSAutomaticCapitalizationEnabled -bool false
defaults write NSGlobalDomain NSAutomaticPeriodSubstitutionEnabled -bool false
defaults write NSGlobalDomain NSAutomaticQuoteSubstitutionEnabled -bool false
defaults write NSGlobalDomain NSAutomaticSpellingCorrectionEnabled -bool false
defaults write NSGlobalDomain NSAutomaticTextCompletionEnabled -bool false
defaults write NSGlobalDomain NSLinguisticDataAssetsRequested -array en en_US
defaults write NSGlobalDomain NSUserDictionaryReplacementItems -array
defaults write NSGlobalDomain WebAutomaticSpellingCorrectionEnabled -bool false
defaults write NSGlobalDomain com.apple.swipescrolldirection -bool false

defaults write com.apple.dock autohide -bool true
defaults write com.apple.dock autohide-delay -float 0
defaults write com.apple.dock autohide-time-modifier -float 0
defaults write com.apple.dock launchanim -bool false
defaults write com.apple.dock orientation left
defaults write com.apple.dock show-recents -bool false

defaults write -g ApplePressAndHoldEnabled -bool false

defaults write com.apple.finder _FXShowPosixPathInTitle -bool true

defaults write com.apple.systempreferences NSQuitAlwaysKeepsWindows -bool false

launchctl unload -w /System/Library/LaunchAgents/com.apple.notificationcenterui.plist 2> /dev/null

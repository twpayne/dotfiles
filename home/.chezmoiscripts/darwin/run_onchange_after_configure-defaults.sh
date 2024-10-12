#!/bin/bash

set -eufo pipefail

defaults write -g AppleEnableSwipeNavigateWithScrolls -int 0
defaults write -g AppleMiniaturizeOnDoubleClick -int 0
defaults write -g ApplePressAndHoldEnabled -int 0
defaults write -g AppleShowAllExtensions -int 1
defaults write -g CGDisableCursorLocationMagnification -int 0
defaults write -g InitialKeyRepeat -int 15
defaults write -g KeyRepeat -int 2
defaults write -g NSAutomaticCapitalizationEnabled -int 0
defaults write -g NSAutomaticDashSubstitutionEnabled -int 0
defaults write -g NSAutomaticInlinePredictionEnabled -int 0
defaults write -g NSAutomaticPeriodSubstitutionEnabled -int 0
defaults write -g NSAutomaticQuoteSubstitutionEnabled -int 0
defaults write -g NSAutomaticSpellingCorrectionEnabled -int 0
defaults write -g NSAutomaticTextCorrectionEnabled -int 0
defaults write -g NSDocumentSaveNewDocumentsToCloud -int 0
defaults write -g NSUserDictionaryReplacementItems '()'
defaults write -g WebAutomaticSpellingCorrectionEnabled -int 0

defaults write -g com.apple.keyboard.fnState -int 1
defaults write -g com.apple.swipescrolldirection -int 0
defaults write -g com.apple.trackpad.forceClick -int 0

defaults write com.apple.dock autohide -int 1
defaults write com.apple.dock orientation -string left
defaults write com.apple.dock show-recents -int 0
defaults write com.apple.dock showDesktopGestureEnabled -int 0
defaults write com.apple.dock showLaunchpadGestureEnabled -int 0
defaults write com.apple.dock showMissionControlGestureEnabled -int 0

defaults write com.apple.finder _FXShowPosixPathInTitle -int 1
defaults write com.apple.finder FXPreferredViewStyle -string Nlsv
defaults write com.apple.finder _FXSortFoldersFirst -int 1
defaults write com.apple.finder FXRemoveOldTrashItems -int 1
defaults write com.apple.finder FXEnableExtensionChangeWarning -int 0

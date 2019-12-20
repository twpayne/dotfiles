#!/bin/sh

defaults write -g KeyRepeat -float 0.01
defaults write -g NSAutomaticSpellingCorrectionEnabled -bool false

defaults write com.apple.dock autohide -bool true
defaults write com.apple.dock orientation right
defaults write com.apple.dock launchanim -bool false
killall Dock

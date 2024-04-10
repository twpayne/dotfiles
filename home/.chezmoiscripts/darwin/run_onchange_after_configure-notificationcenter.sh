#!/bin/bash

set -eufo pipefail

launchctl unload -w /System/Library/LaunchAgents/com.apple.notificationcenterui.plist 2> /dev/null

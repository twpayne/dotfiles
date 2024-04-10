#!/bin/bash

set -eufo pipefail

osascript -e 'tell application "System Events" to tell every desktop to set picture to "/System/Library/Desktop Pictures/Solid Colors/Space Gray Pro.png" as POSIX file'

#!/bin/sh

# Exit if VS Code is not installed.
which code > /dev/null || exit 0

# Install desired extensions.
code --force --install-extension alefragnani.project-manager
code --force --install-extension eamodio.gitlens
code --force --install-extension golang.Go
code --force --install-extension ms-python.python
code --force --install-extension ms-vscode.cpptools
code --force --install-extension ms-vscode.vscode-typescript-tslint-plugin
code --force --install-extension redhat.vscode-yaml
code --force --install-extension stkb.rewrap
code --force --install-extension tyriar.sort-lines
code --force --install-extension yzhang.markdown-all-in-one
code --force --install-extension zxh404.vscode-proto3

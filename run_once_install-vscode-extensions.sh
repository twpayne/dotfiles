#!/bin/sh

# Exit if VS Code is not installed.
which code > /dev/null || exit 0

# Remove previsously-installed extensions.
code --uninstall-extension DavidAnson.vscode-markdownlint

# Install desired extensions.
code --install-extension alefragnani.project-manager
code --install-extension DevonDCarew.bazel-code
code --install-extension eamodio.gitlens
code --install-extension ms-python.python
code --install-extension ms-vscode.cpptools
code --install-extension ms-vscode.Go
code --install-extension PeterJausovec.vscode-docker
code --install-extension redhat.vscode-yaml
code --install-extension stkb.rewrap
code --install-extension yzhang.markdown-all-in-one
code --install-extension zxh404.vscode-proto3 
	

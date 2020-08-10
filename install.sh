#!/bin/sh

if [ "$CODESPACES" == "true" ] ; then
	chmod 700 $HOME/dotfiles
	curl -sfL https://git.io/chezmoi | sh
	./bin/chezmoi init --apply --clone=false --source=$HOME/dotfiles
fi

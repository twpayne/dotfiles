all: update

update:
	chezmoi apply
	vim -c GoInstallBinaries -c qa
	vim -c PlugUpdate -c qa

install-ubuntu-packages:
	sudo apt-get install -y \
		direnv \
		google-chrome-stable \
		unattended-upgrades \
		vim-gtk3 \
		zsh

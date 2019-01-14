all: update

update:
	chezmoi apply
	vim -c GoInstallBinaries -c qa
	vim -c PlugUpdate -c qa

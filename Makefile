all: update

update:
	chezmoi apply
	vim -c PlugUpdate -c qa

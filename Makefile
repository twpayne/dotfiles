all: update

update:
	chezmoi apply
	vim -c PlugUpdate -c qa
	vim -c GoInstallBinaries -c qa

ubuntu-configure-cli: ubuntu-install-packages
	chsh -s /usr/bin/zsh

ubuntu-configure-gnome:
	gsettings set org.gnome.Terminal.Legacy.Settings default-show-menubar false

ubuntu-install-code:
	wget -q -O code_amd64.deb https://go.microsoft.com/fwlink/?LinkID=760868 
	sudo dpkg -i code_amd64.deb
	sudo apt-get -f -y install

ubuntu-install-google-chrome:
	wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
	sudo sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list'
	sudo apt-get update
	sudo apt-get install google-chrome-stable

ubuntu-install-lpass:
	mkdir -p ${HOME}/bin
	sudo apt-get --no-install-recommends -yqq install \
		bash-completion \
		build-essential \
		cmake \
		libcurl4  \
		libcurl4-openssl-dev  \
		libssl-dev  \
		libxml2 \
		libxml2-dev  \
		libssl1.1 \
		pkg-config \
		ca-certificates \
		xclip
	git clone https://github.com/lastpass/lastpass-cli.git ${HOME}/src/github.com/lastpass/lastpass-cli
	( cd ${HOME}/src/github.com/lastpass/lastpass-cli && make && install -m 755 build/lpass ${HOME}/bin )

ubuntu-install-packages:
	sudo apt-get install -y \
		direnv \
		unattended-upgrades \
		vim-gtk3 \
		zsh

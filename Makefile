all: update

update:
	chezmoi apply
	vim -c PlugUpdate -c qa
	vim -c GoInstallBinaries -c qa

debian-install-go:
	sudo add-apt-repository -y ppa:gophers/archive
	sudo apt-get update
	sudo apt-get install -y golang-go

ubuntu-configure-cli: ubuntu-install-packages
	chsh -s /usr/bin/zsh

ubuntu-configure-gnome:
	gsettings set org.gnome.desktop.interface cursor-size 32
	gsettings set org.gnome.desktop.interface text-scaling-factor 1.25
	gsettings set org.gnome.nautilus.icon-view default-zoom-level small
	gsettings set org.gnome.shell.extensions.dash-to-dock dash-max-icon-size 48
	gsettings set org.gnome.Terminal.Legacy.Settings default-show-menubar false

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
		curl \
		direnv \
		git-lfs \
		jq \
		software-properties-common \
		unattended-upgrades \
		units \
		vim-gnome \
		zsh

ubuntu-install-zoom:
	wget -q https://zoom.us/client/latest/zoom_amd64.deb
	sudo dpkg -i zoom_amd64.deb || true
	sudo apt-get -f -y install

update-third-party: \
	update-plug.vim \
	update-oh-my-zsh \
	update-aws_zsh_completer.sh \
	update-zsh-syntax-highlighting

update-plug.vim:
	curl -s -L https://raw.githubusercontent.com/junegunn/vim-plug/master/plug.vim > $$(chezmoi source-path ~/.vim/autoload/plug.vim)

update-oh-my-zsh:
	curl -s -L -o oh-my-zsh-master.tar.gz https://github.com/robbyrussell/oh-my-zsh/archive/master.tar.gz
	chezmoi import --strip-components 1 --destination ${HOME}/.oh-my-zsh oh-my-zsh-master.tar.gz

update-aws_zsh_completer.sh:
	mkdir -p dot_oh-my-zsh/custom/lib
	curl -s https://raw.githubusercontent.com/aws/aws-cli/develop/bin/aws_zsh_completer.sh > $$(chezmoi source-path ~/.oh-my-zsh/custom/lib)/aws_zsh_completer.sh

update-zsh-syntax-highlighting:
	mkdir -p dot_oh-my-zsh/custom/plugins
	curl -s -L -o zsh-syntax-highlighting-master.tar.gz https://github.com/zsh-users/zsh-syntax-highlighting/archive/master.tar.gz
	chezmoi import --strip-components 1 --destination ${HOME}/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting zsh-syntax-highlighting-master.tar.gz

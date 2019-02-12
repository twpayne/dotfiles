all: update

update:
	chezmoi apply
	vim -c PlugUpdate -c qa
	vim -c GoInstallBinaries -c qa

code-install-extensions:
	code --install-extension DavidAnson.vscode-markdownlint
	code --install-extension DevonDCarew.bazel-code
	code --install-extension ms-vscode.Go
	code --install-extension PeterJausovec.vscode-docker
	code --install-extension redhat.vscode-yaml
	code --install-extension stkb.rewrap
	code --install-extension vscodevim.vim
	if [ $$(uname) = "Darwin" ] ; then \
		code --install-extension deerawan.vscode-dash ; \
	fi

darwin-configure-vscode:
	defaults write com.microsoft.VSCode ApplePressAndHoldEnabled -bool false
	defaults delete -g ApplePressAndHoldEnabled || true

ubuntu-configure-cli: ubuntu-install-packages
	chsh -s /usr/bin/zsh

ubuntu-configure-gnome:
	gsettings set org.gnome.desktop.interface cursor-size 32
	gsettings set org.gnome.desktop.interface text-scaling-factor 1.25
	gsettings set org.gnome.nautilus.icon-view default-zoom-level small
	gsettings set org.gnome.shell.extensions.dash-to-dock dash-max-icon-size 48
	gsettings set org.gnome.Terminal.Legacy.Settings default-show-menubar false

ubuntu-install-bazel:
	sudo echo "deb [arch=amd64] http://storage.googleapis.com/bazel-apt stable jdk1.8" | sudo tee /etc/apt/sources.list.d/bazel.list
	curl https://bazel.build/bazel-release.pub.gpg | sudo apt-key add -
	sudo apt-get update
	sudo apt-get install -y \
		bazel \
		openjdk-8-jdk

BAZELBUILD_BUILDTOOLS_VERSION=0.20.0
ubuntu-install-bazelbuild-buildtools:
	for tool in buildifier buildozer unused_deps ; do \
		wget -q -O ${HOME}/bin/$${tool} https://github.com/bazelbuild/buildtools/releases/download/${BAZELBUILD_BUILDTOOLS_VERSION}/$${tool} && chmod 755 ${HOME}/bin/$${tool} ; \
	done

ubuntu-install-code:
	wget -q -O code_amd64.deb https://go.microsoft.com/fwlink/?LinkID=760868 
	sudo dpkg -i code_amd64.deb || true
	sudo apt-get -f -y install
	sudo sh -c "echo fs.inotify.max_user_watches=524288 >> /etc/sysctl.conf"
	sudo sysctl -p

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
	update-zsh_syntax-highlighting

update-plug.vim:
	curl -s -L https://raw.githubusercontent.com/junegunn/vim-plug/master/plug.vim > $$(chezmoi source-path ~/.vim/autoload/plug.vim)

update-oh-my-zsh:
	curl -s -L -o oh-my-zsh-master.tar.gz https://github.com/robbyrussell/oh-my-zsh/archive/master.tar.gz
	chezmoi import --strip-components 1 --destination ${HOME}/.oh-my-zsh oh-my-zsh-master.tar.gz

update-aws_zsh_completer.sh:
	curl -s https://raw.githubusercontent.com/aws/aws-cli/develop/bin/aws_zsh_completer.sh > $$(chezmoi source-path ~/.oh-my-zsh/custom/lib/aws_zsh_completer.sh)

update-zsh-syntax-highlighting:
	curl -s -L -o zsh-syntax-highlighting-master.tar.gz https://github.com/zsh-users/zsh-syntax-highlighting/archive/master.tar.gz
	chezmoi import --strip-components 1 --destination ${HOME}/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting zsh-syntax-highlighting-master.tar.gz

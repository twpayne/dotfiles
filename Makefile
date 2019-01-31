all: update

update:
	chezmoi apply
	vim -c PlugUpdate -c qa
	vim -c GoInstallBinaries -c qa

ubuntu-configure-cli: ubuntu-install-packages
	chsh -s /usr/bin/zsh

ubuntu-configure-gnome:
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
		unattended-upgrades \
		vim-gnome \
		zsh

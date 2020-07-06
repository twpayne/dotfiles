none:

update-third-party: \
	update-plug.vim \
	update-oh-my-zsh \
	update-zsh-syntax-highlighting

update-plug.vim:
	curl -s -L https://raw.githubusercontent.com/junegunn/vim-plug/master/plug.vim > $$(chezmoi source-path ~/.vim/autoload/plug.vim)

update-oh-my-zsh:
	curl -s -L -o oh-my-zsh-master.tar.gz https://github.com/robbyrussell/oh-my-zsh/archive/master.tar.gz
	chezmoi import --strip-components 1 --destination ${HOME}/.oh-my-zsh oh-my-zsh-master.tar.gz

update-zsh-syntax-highlighting:
	mkdir -p dot_oh-my-zsh/custom/plugins
	curl -s -L -o zsh-syntax-highlighting-master.tar.gz https://github.com/zsh-users/zsh-syntax-highlighting/archive/master.tar.gz
	chezmoi import --strip-components 1 --destination ${HOME}/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting zsh-syntax-highlighting-master.tar.gz

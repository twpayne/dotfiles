# github.com/twpayne/dotfiles

Tom Payne's dotfiles, managed with [`chezmoi`](https://github.com/twpayne/chezmoi).

This repo should be checked out in the directory `~/.config/share/chezmoi`, for
example:

    git clone https://github.com/twpayne/dotfiles.git ~/.config/share/chezmoi

You'll also need to create a configuation file `./config/chezmoi/chezmoi.yaml`
containing:

    [data]
        name = "<your-name>"
        email = "<your-email>"

Secrets are stored in [LastPass](https://lastpass.com) and you'll need the
[LastPass CLI](https://github.com/lastpass/lastpass-cli) installed. Login to
LastPass with:

    lpass login <your-email>

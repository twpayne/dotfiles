#!/bin/sh

version="9d9c50611da19044370ee759e593ccadbad32a6a"
destdir="${HOME}/.oh-my-zsh/custom/themes/powerlevel10k"

rm -rf ${destdir}
mkdir -p ${destdir}
curl -s -L https://github.com/romkatv/powerlevel10k/archive/${version}.tar.gz | tar -C ${destdir} --strip-components=1 -xzf -

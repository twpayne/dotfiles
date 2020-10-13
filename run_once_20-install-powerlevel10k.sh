#!/bin/bash

version="b770e6a3e58f5c2238363fe63839fc808c160456"
destdir="${HOME}/.oh-my-zsh/custom/themes/powerlevel10k"

rm -rf ${destdir}
mkdir -p ${destdir}
curl -s -L https://github.com/romkatv/powerlevel10k/archive/${version}.tar.gz | tar -C ${destdir} --strip-components=1 -xzf -

#!/bin/bash

version="04f75a10a5037ad66f8a5dd0e8f404db4302a6e3"
destdir="${HOME}/.oh-my-zsh/custom/themes/powerlevel10k"

rm -rf ${destdir}
mkdir -p ${destdir}
curl -s -L https://github.com/romkatv/powerlevel10k/archive/${version}.tar.gz | tar -C ${destdir} --strip-components=1 -xzf -

[user]
	email = tom@isovalent.com
[alias]
	cf = commit -s --fixup
	cm = commit -s --message
	ss = commit -s --message snapshot --no-gpg-sign

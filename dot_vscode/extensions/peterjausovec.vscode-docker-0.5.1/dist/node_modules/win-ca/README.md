# win-ca

[![Build status](https://ci.appveyor.com/api/projects/status/e6xhpp9d7aml95j2?svg=true)](https://ci.appveyor.com/project/ukoloff/win-ca)
[![NPM version](https://badge.fury.io/js/win-ca.svg)](http://badge.fury.io/js/win-ca)

Get Windows System Root certificates for [Node.js][].

## Rationale

Unlike [Ruby][], [Node.js][] on Windows **allows**
HTTPS requests out-of-box.
But it is implemented in a rather bizzare way:

> Node uses a
> [statically compiled, manually updated, hardcoded list][node.pem]
> of certificate authorities,
> rather than relying on the system's trust store...
> [Read more][node/4175]

It's very strange behavour under any OS,
but Windows differs from most of them
by having its own trust store,
fully incompatible with [OpenSSL].

This package is intended to
fetch Root CAs from Windows' store
(*Trusted Root Certification Authorities*)
and make them available to
[Node.js] application with minimal efforts.

### Advantages

- No internet access is required at all
- Windows store is updated automatically (in most modern environments)
- Manually installed Root certificates are used
- Enterpise trusted certificates (GPO etc.) are made available too

## Usage

Just say `npm install --save win-ca`
and then call `require('win-ca')`.

It is safe to use it under other OSes (not M$ Windows).

## API

After `require('win-ca')` Windows' Root CAs
are found, deduplicated
and installed to `https.globalAgent.options.ca`
so they are automatically used for all
requests with Node.js' https module.

For use in other places, these certificates
are also available via `.all()` method
(in [node-forge][]'s format).

```js
let ca = require('win-ca')
let forge = require('node-forge')

for (let crt of ca.all())
  console.log(forge.pki.certificateToPem(crt))
```
Unfortunately, `node-forge` at the time of writing is unable to
parse non-RSA certificates
(namely, ECC certificates becoming more popular).
If your *Trusted Root Certification Authorities* store
contains modern certificates,
`.all()` method will throw exception.

To fix this, one can pass `format` parameter to `.all` method:
```js
let ca = require('win-ca')

for (let crt of ca.all(ca.der2.pem))
  console.log(crt)
```
Available values for `format` are:

| Constant | Value | Meaning
|---|---:|---
der2.der | 0 | DER-format (binary, Node's [Buffer][])
|der2.pem | 1 | PEM-format (text, Base64-encoded)
|der2.txt| 2 | PEM-format plus some info as text
|der2.asn1| 3 | ASN.1-parsed certificate
| * | * | Certificate in `node-forge` format (RSA only)

One can enumerate Root CAs himself using `.each()` method:

```js
let ca = require('win-ca')

ca.each(crt=>
  console.log(forge.pki.certificateToPem(crt)))
```

But this list may contain duplicates.

Asynchronous enumeration is provided via `.async()` method:

```js
let ca = require('win-ca')

ca.each.async((error, crt)=> {
  if (error) throw error;
  if(crt)
    console.log(forge.pki.certificateToPem(crt))
  else
    console.log("That's all folks!")
})
```

Both `.each` and `.each.async` methods
accept `format` as the first parameter.

Finally, `win-ca` saves fetched ceritificates to disk
for use by other software.
Path to folder containing all the certificates
is available as `require('win-ca').path`.
Environment variable `SSL_CERT_DIR`
is set to point at it,
so [OpenSSL][]-based software will use it automatically.
The layout of that folder mimics
that of [OpenSSL][]'s `c_rehash` utility.

In addition, file `roots.pem` is placed
in the said folder.
It contains all root certificates in PEM format
concatenated together.
It can also be used by most cryptographic software.
In particular, `OpenSSL` will take it into account if one say
```cmd
set SSL_CERT_FILE = %SSL_CERT_DIR%\roots.pem
```

## Availability

Current version uses [N-API][],
so it can be used in [Node.js versions with N-API support][N-API-support],
i.e. v6 and all versions starting from v8.

Thanks to N-API, it is possible to precompile
Windows DLL and save it to package,
so no compilation is needed at installation time.

For other Node.js versions
(v4, 5 or 7)
speciall fallback utility is called
in the background to fetch the list anyway.

## Electron

[Electron][] uses its own N-API,
so if it is detected,
the same fallback is used
as for old Node.js.

## VSCode extension

Special [extension](vscode) for [VSCode][]
was created to import `win-ca`
in context of VSCode's Extension Host.

Since all VSCode extensions share the same process,
root certificates imported by one of them
are immediately available to others.
This can allow VSCode to connect to
(properly configured)
intranet sites from Windows machines.

## Building

- npm install
- npm run pretest
- npm run [nvm$][]
- npm publish

This builds both `x86` and `x64` versions with [N-API][] support.
For older Node.js versions standalone binary utility is built.

## See also

- [OpenSSL::Win::Root][] for Ruby version
- [mac-ca][] for Mac OS version

## Credits

Uses [node-forge][]
and used to use [node-ffi-napi][] (ancestor of [node-ffi][]).

[node-ffi]: https://github.com/node-ffi/node-ffi
[node-ffi-napi]: https://github.com/node-ffi-napi/node-ffi-napi
[node-forge]: https://github.com/digitalbazaar/forge
[OpenSSL::Win::Root]: https://github.com/ukoloff/openssl-win-root
[Node.js]: http://nodejs.org/
[Buffer]: https://nodejs.org/api/buffer.html
[Ruby]: https://www.ruby-lang.org/
[node.pem]: https://github.com/nodejs/node/blob/master/src/node_root_certs.h
[node/4175]: https://github.com/nodejs/node/issues/4175
[OpenSSL]: https://www.openssl.org/
[nvm$]: https://github.com/ukoloff/nvms
[N-API]: https://nodejs.org/api/n-api.html
[N-API-support]: https://github.com/nodejs/node-addon-api/blob/master/index.js#L17
[VSCode]: https://code.visualstudio.com/
[mac-ca]: https://github.com/jfromaniello/mac-ca
[Electron]: https://electronjs.org/

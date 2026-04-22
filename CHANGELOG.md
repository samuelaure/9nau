# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [1.11.2](https://github.com/samuelaure/9nau/compare/v1.11.1...v1.11.2) (2026-04-22)

### [1.11.1](https://github.com/samuelaure/9nau/compare/v1.11.0...v1.11.1) (2026-04-21)


### Bug Fixes

* **api:** add missing imports to workspaces service ([ef77f13](https://github.com/samuelaure/9nau/commit/ef77f133e564abf7f59670c29f17a509dbde6376))

## [1.10.0](https://github.com/samuelaure/9nau/compare/v1.9.2...v1.10.0) (2026-04-21)


### Features

* **workspaces:** implement rename and member listing endpoints ([05a13e4](https://github.com/samuelaure/9nau/commit/05a13e4653ca3b55e68eb46b3f7e5d1415fd4956))

### [1.9.2](https://github.com/samuelaure/9nau/compare/v1.9.1...v1.9.2) (2026-04-21)


### Features

* **accounts:** pass token via query param on login redirect ([6d2e711](https://github.com/samuelaure/9nau/commit/6d2e711fefd6ec5684dc4586dfd58db2346e2c5a))

### [1.9.1](https://github.com/samuelaure/9nau/compare/v1.9.0...v1.9.1) (2026-04-21)


### Features

* update CORS origins to include nauthenticity and localhost ([ab78419](https://github.com/samuelaure/9nau/commit/ab784193305d26d05df7f04adea24e6a1fd0729c))

## [1.9.0](https://github.com/samuelaure/9nau/compare/v1.8.0...v1.9.0) (2026-04-20)


### Features

* **api:** standardize AUTH_SECRET and add service workspace endpoint ([e8c5dd0](https://github.com/samuelaure/9nau/commit/e8c5dd014dce73e029afbe65015ef5970e6539a8))

## [1.8.0](https://github.com/samuelaure/9nau/compare/v1.7.1...v1.8.0) (2026-04-20)


### Features

* **api:** add brand model to prisma schema ([1802c39](https://github.com/samuelaure/9nau/commit/1802c39293bf28dcb4cf85a67fba87bac38df1bb))
* **api:** implement workspaces and brands management module ([09d2e88](https://github.com/samuelaure/9nau/commit/09d2e886ba1f9711db8f3aeeb31dd9b444bcc77d))
* **auth:** embed activeworkspaceid in jwt and add user lookup endpoint ([c0d9532](https://github.com/samuelaure/9nau/commit/c0d953255cd99849214bedd78bc264a6ef6b1891))
* **db:** fresh init migration for workspace architecture ([4f44d84](https://github.com/samuelaure/9nau/commit/4f44d841f4a126bae99aef7632401ab53ccfdd41))
* **ui:** implement platform settings and workspace management ([f99755e](https://github.com/samuelaure/9nau/commit/f99755e7931cf7308b9c9b21d46601cf2091e617))

### [1.7.1](https://github.com/samuelaure/9nau/compare/v1.7.0...v1.7.1) (2026-04-19)


### Bug Fixes

* **triage:** handle potential undefined choices in openai response ([cc66345](https://github.com/samuelaure/9nau/commit/cc663455b5f964af08b752a59211cc646c49700b))

## [1.7.0](https://github.com/samuelaure/9nau/compare/v1.6.0...v1.7.0) (2026-04-19)


### Features

* **infra:** add flownau integration and standardize r2 env keys ([c7ffd63](https://github.com/samuelaure/9nau/commit/c7ffd63f7bc9cf9fc49bb96b478dc66513a52073))


### Bug Fixes

* **api:** correct controller prefixes and update openai sdk syntax ([1b69ccd](https://github.com/samuelaure/9nau/commit/1b69ccd79334c0191840c9c37358b3e42fcd1857))

## [1.6.0](https://github.com/samuelaure/9nau/compare/v1.5.0...v1.6.0) (2026-04-19)


### Features

* **auth:** implement centralized SSO via shared domain cookie ([d472ae7](https://github.com/samuelaure/9nau/commit/d472ae78bb97c39831d9fd4f6de3105c8d5cb01b))

## [1.5.0](https://github.com/samuelaure/9nau/compare/v1.4.4...v1.5.0) (2026-04-19)


### Features

* **api:** implement AuthLinkToken model and endpoints for Telegram linking ([49956da](https://github.com/samuelaure/9nau/commit/49956dad2e45e7eb4c9f5c28a5f36f7ed3362ae1))
* **ui:** add TelegramLinkBanner and integrate into 9nau apps ([0fb6e1a](https://github.com/samuelaure/9nau/commit/0fb6e1ae9f92c5f10a059103c740e20652c7bdda))


### Bug Fixes

* **ui:** resolve component path aliases for Next.js builds ([4754b9a](https://github.com/samuelaure/9nau/commit/4754b9a48c0e116d58567e56520bdd83ac779997))

### [1.4.4](https://github.com/samuelaure/9nau/compare/v1.4.3...v1.4.4) (2026-04-19)


### Bug Fixes

* **deploy:** bake NEXT_PUBLIC variables into frontend builds ([228021a](https://github.com/samuelaure/9nau/commit/228021ac2192215300373b011c8d6fb768707bff))

### [1.4.3](https://github.com/samuelaure/9nau/compare/v1.4.2...v1.4.3) (2026-04-18)


### Bug Fixes

* **api:** fix ts type error in cors origins filter ([db59734](https://github.com/samuelaure/9nau/commit/db59734566072c99e09df38139a2f6a2d22d61e5))

### [1.4.2](https://github.com/samuelaure/9nau/compare/v1.4.1...v1.4.2) (2026-04-18)


### Bug Fixes

* **api:** whitelist app and accounts origins for CORS ([47ce09b](https://github.com/samuelaure/9nau/commit/47ce09bbb1003593083cb5003e256b6f0ca4d5f0))

### [1.4.1](https://github.com/samuelaure/9nau/compare/v1.4.0...v1.4.1) (2026-04-18)


### Bug Fixes

* **docker:** ensure public and static folders exist during build ([ff30e68](https://github.com/samuelaure/9nau/commit/ff30e68ac7fd0663d56becf3efbf6a916ff07812))

## [1.4.0](https://github.com/samuelaure/9nau/compare/v1.3.0...v1.4.0) (2026-04-18)


### Features

* **docker:** add standalone Dockerfiles for app and accounts ([9e23f95](https://github.com/samuelaure/9nau/commit/9e23f9594a187045c88bfd23d954615e0d5911ec))
* **infra:** add app and accounts services to deployment pipeline ([3bcc5d9](https://github.com/samuelaure/9nau/commit/3bcc5d9afea9a4ae7771c400ae13b1e71fd781d5))


### Bug Fixes

* **accounts:** standardize api url environment variable name ([14ea255](https://github.com/samuelaure/9nau/commit/14ea2557a4c9fe3c7ed17e154fc102275de61fc6))

## [1.3.0](https://github.com/samuelaure/9nau/compare/v1.2.14...v1.3.0) (2026-04-18)


### Features

* **9nau:** scaffold apps/accounts sso hub ([dba53d9](https://github.com/samuelaure/9nau/commit/dba53d9ab30dbc7fe4993e4392579ad17e5be5fd))

### [1.2.8](https://github.com/samuelaure/9nau/compare/v1.2.7...v1.2.8) (2026-04-18)

### [1.2.7](https://github.com/samuelaure/9nau/compare/v1.2.6...v1.2.7) (2026-04-18)

### [1.2.6](https://github.com/samuelaure/9nau/compare/v1.2.5...v1.2.6) (2026-04-18)

### [1.2.5](https://github.com/samuelaure/9nau/compare/v1.2.4...v1.2.5) (2026-04-18)


### Bug Fixes

* **docker:** correct main entry point path in CMD ([0e168f7](https://github.com/samuelaure/9nau/commit/0e168f7c7151fffee1a46761362b1b36a8952457))

### [1.2.4](https://github.com/samuelaure/9nau/compare/v1.2.3...v1.2.4) (2026-04-18)


### Bug Fixes

* **docker:** copy tsconfig.base.json to docker build context ([84fe1c6](https://github.com/samuelaure/9nau/commit/84fe1c6c0895e235b3f13d2ab2c64133a82344a2))

### [1.2.3](https://github.com/samuelaure/9nau/compare/v1.2.2...v1.2.3) (2026-04-18)


### Bug Fixes

* **infra:** add default redis password to prevent fatal crash if env is missing ([c0a8e0d](https://github.com/samuelaure/9nau/commit/c0a8e0d5629b37a26724faf12eb19567900a3245))

### [1.2.2](https://github.com/samuelaure/9nau/compare/v1.2.1...v1.2.2) (2026-04-18)


### Bug Fixes

* **docker:** correct package names and build filter in Dockerfile to ensure dist is generated ([23d2446](https://github.com/samuelaure/9nau/commit/23d244663d8ee4ecec4b6eeba512fac70583e0e7))

## [1.2.0](https://github.com/samuelaure/9nau/compare/v0.4.3...v1.2.0) (2026-04-17)


### Features

* **ci:** implement safe sequential deployment and disk health monitoring ([96c48f5](https://github.com/samuelaure/9nau/commit/96c48f5ed38b2fa28fbe09245b8e4bc53f905a73))
* **integrations:** add flownau ingestion bridge service ([6b80342](https://github.com/samuelaure/9nau/commit/6b80342350e356d3d3a9122fb4a504bef5be1a7d))
* **mobile:** improve tag picker logic and sync service stability ([d69d08c](https://github.com/samuelaure/9nau/commit/d69d08cd3ac5bdaeda06785872737537fea280cc))
* **triage:** hook content idea blocks to automated flownau ingestion ([8f653ac](https://github.com/samuelaure/9nau/commit/8f653ac35790bbdbdbf7ee356d2cb0c6381f132f))

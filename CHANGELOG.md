# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

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

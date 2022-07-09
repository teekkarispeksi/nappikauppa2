# Nappikauppa2

[![CircleCI](https://circleci.com/gh/teekkarispeksi/nappikauppa2.svg?style=svg)](https://circleci.com/gh/teekkarispeksi/nappikauppa2)

## Development enviroment

Project uses Visual Studio Code devcontainers for creating platform independent isolated development environment.

### Requirements

Check that these requirements are installed before proceeding futher

1. [Docker](https://www.docker.com)
2. [Visual Studio Code](https://code.visualstudio.com/)
3. [Visual Studio Code Remote Development](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.vscode-remote-extensionpack)

Other project requirements and VSCode extensions are managed by devcontainer system.

### Developing

1. Open project folder with VSCode
2. Check enviroment variables and directory mounts in `.devcontainer/docker-compose.yml` file. Pay attention to `UID` and `GID` variables
3. Reopen project in remote container enviroment. Project installs development database and dependencies automatically.
4. Use `ctrl+shift+b` to start dev server
5. Go to [http://localhost:3000/](http://localhost:3000/). For admin site go to [http://localhost:3000/admin](http://localhost:3000/admin). Default username is admin and password nappiadmin5.

### Notes

Project is migrated  back from [yarn](https://yarnpkg.com/lang/en/) to [npm](https://www.npmjs.com/). Please use npm for installing dependencies as production Dockerfile uses `package-lock.json` file for dependency installation.

Development server supports livereload for detecting frontend changes

## Setting up database for production
( Assuming that you have [mysql (maridb)](https://mariadb.org/) installed )

1. Run db/tables.sql and db/venues.sql against your database (e.g. `mysql nappikauppa2 < db/tables.sql`)
2. Run db/evolutions/01_add_production_to_discount_code.sql against your database
3. Run db/evolutions/02_add_payment_provider_to_order.sql against your database

### Notes

**DO NOT USE DEVELOPEMENT DOCKER DATABASE IN PRODUCTION** Development docker database file is not for production use, if you want to run database inside docker, please create own image for that purposes.

## Building docker image

1. Check out this repository
2. Move to repository root
3. Run `docker build -t teekkarispeksi/nappikauppa2:latest .` and wait magic to happen

Build results to single alpine based docker image which is ready for execution.

## Deploying docker image to production

We use [portainer](https://www.portainer.io/) on top of [docker swarm](https://docs.docker.com/engine/swarm/) for running application stack in production.

### Sample stack.yml

Sample swarm stack configuration

```yml
version: '3.7'

services:
  nappikauppa:
    image: teekkarispeksi/nappikauppa2:latest
    configs:
      - source: nappikauppa-config
        target: /app/config/config.js
      - source: nappikauppa-frontend-config
        target: /app/config/frontend-config.js
    deploy:
      replicas: 1
      update_config:
        parallelism: 1
        delay: 5s
        order: start-first
      restart_policy:
        condition: any
        delay: 5s
        max_attempts: 3
        window: 120s

configs:
  nappikauppa-config:
    name: nappikauppa2.config.v1.js
    external: true
  nappikauppa-frontend-config:
    name: nappikauppa2.frontend-config.v1.js
    external: true

```

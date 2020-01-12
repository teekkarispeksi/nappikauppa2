# Production dockerfile

# Use alpine as base image instead of debian, as this will result to smaller image size
FROM alpine:3.10 AS base

# Install dependencies
RUN apk add --no-cache libstdc++ \
  && apk add --no-cache --virtual .build-deps \
    curl

# Install Nodejs 12.13

ENV NODE_VERSION 12.13.1

RUN ARCH= && alpineArch="$(apk --print-arch)" \
  && case "${alpineArch##*-}" in \
      x86_64) \
        ARCH='x64' \
        CHECKSUM="cf493d306a6367fb7bcff5608731e1dd44b9ad8d64e7df7706916d8be0f497a1" \
        ;; \
      * ) ;; \
    esac \
  && if [ -n "${CHECKSUM}" ]; then \
    set -eu; \
    curl -fsSLO --compressed "https://unofficial-builds.nodejs.org/download/release/v$NODE_VERSION/node-v$NODE_VERSION-linux-$ARCH-musl.tar.xz"; \
    echo "$CHECKSUM  node-v$NODE_VERSION-linux-$ARCH-musl.tar.xz" | sha256sum -c - \
      && tar -xJf "node-v$NODE_VERSION-linux-$ARCH-musl.tar.xz" -C /usr/local --strip-components=1 --no-same-owner \
      && ln -s /usr/local/bin/node /usr/local/bin/nodejs; \
  else \
    echo "Building from source" \
    # backup build
    && apk add --no-cache --virtual .build-deps-full \
        binutils-gold \
        g++ \
        gcc \
        gnupg \
        libgcc \
        linux-headers \
        make \
        python \
    # gpg keys listed at https://github.com/nodejs/node#release-keys
    && for key in \
      94AE36675C464D64BAFA68DD7434390BDBE9B9C5 \
      FD3A5288F042B6850C66B31F09FE44734EB7990E \
      71DCFD284A79C3B38668286BC97EC7A07EDE3FC1 \
      DD8F2338BAE7501E3DD5AC78C273792F7D83545D \
      C4F0DFFF4E8C1A8236409D08E73BC641CC11F4C8 \
      B9AE9905FFD7803F25714661B63B535A4C206CA9 \
      77984A986EBC2AA786BC0F66B01FBB92821C587A \
      8FCCA13FEF1D0C2E91008E09770F7A9A5AE15600 \
      4ED778F539E3634C779C87C6D7062848A1AB005C \
      A48C2BEE680E841632CD4E44F07496B3EB3C1762 \
      B9E2F5981AA6E0CD28160D9FF13993A75599653C \
    ; do \
      gpg --batch --keyserver hkp://p80.pool.sks-keyservers.net:80 --recv-keys "$key" || \
      gpg --batch --keyserver hkp://ipv4.pool.sks-keyservers.net --recv-keys "$key" || \
      gpg --batch --keyserver hkp://pgp.mit.edu:80 --recv-keys "$key" ; \
    done \
    && curl -fsSLO --compressed "https://nodejs.org/dist/v$NODE_VERSION/node-v$NODE_VERSION.tar.xz" \
    && curl -fsSLO --compressed "https://nodejs.org/dist/v$NODE_VERSION/SHASUMS256.txt.asc" \
    && gpg --batch --decrypt --output SHASUMS256.txt SHASUMS256.txt.asc \
    && grep " node-v$NODE_VERSION.tar.xz\$" SHASUMS256.txt | sha256sum -c - \
    && tar -xf "node-v$NODE_VERSION.tar.xz" \
    && cd "node-v$NODE_VERSION" \
    && ./configure \
    && make -j$(getconf _NPROCESSORS_ONLN) V= \
    && make install \
    && apk del .build-deps-full \
    && cd .. \
    && rm -Rf "node-v$NODE_VERSION" \
    && rm "node-v$NODE_VERSION.tar.xz" SHASUMS256.txt.asc SHASUMS256.txt; \
  fi \
  && rm -f "node-v$NODE_VERSION-linux-$ARCH-musl.tar.xz" \
  && apk del .build-deps

# Builder image
FROM base AS builder

# Setup build environment
RUN apk add --no-cache git python3 make g++\
  && mkdir -p /workspace \
  && npm install -g typescript@~3.7 tslint@~5.20 gulp-cli@~2.2

WORKDIR /workspace

# Copy build script
COPY ./scripts/docker-build.sh /usr/local/bin/docker-build

# Copy source files
COPY . /workspace

# Install dependencies and run build script
RUN npm ci \
  && /usr/local/bin/docker-build

# Install runtime depenencies
RUN rm -rf /workspace/node_modules && npm ci --only=prod

# Production image
FROM base AS prod


RUN mkdir -p /app

COPY ./scripts/docker-entrypoint.sh /usr/local/bin/docker-entrypoint

WORKDIR /app

COPY --from=builder /workspace/build /app
COPY --from=builder /workspace/node_modules /app/node_modules
COPY ./healthcheck.js /app/healthcheck.js

EXPOSE 80

HEALTHCHECK --interval=10s --timeout=5s --start-period=60s \
  CMD node /app/healthcheck.js

ENTRYPOINT ["/usr/local/bin/docker-entrypoint"]
CMD ["node", "/app/app.js"]

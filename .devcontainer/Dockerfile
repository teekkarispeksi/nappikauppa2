# Use latest debian buildpack as base devcontainer image
FROM buildpack-deps:buster

# Avoid container build to stuck on warning with noninteractive
ENV DEBIAN_FRONTEND=noninteractive

# Install dependencies
RUN  apt-get update \
  && apt-get install --no-install-recommends -y apt-utils 2>&1 \
  # Check that git, procps and ssh are installed
  && apt-get install -y git procps ssh \
  # Cleanup
  && apt-get autoremove -y \
  && apt-get clean -y \
  && rm -rf /var/lib/apt/lists/*

# Install Node.js 16.13.1

ENV NODE_VERSION 16.13.1

RUN ARCH= && dpkgArch="$(dpkg --print-architecture)" \
  && case "${dpkgArch##*-}" in \
    amd64) ARCH='x64';; \
    ppc64el) ARCH='ppc64le';; \
    s390x) ARCH='s390x';; \
    arm64) ARCH='arm64';; \
    armhf) ARCH='armv7l';; \
    i386) ARCH='x86';; \
    *) echo "unsupported architecture"; exit 1 ;; \
  esac \
  # gpg keys listed at https://github.com/nodejs/node#release-keys
  && set -ex \
  && for key in \
    4ED778F539E3634C779C87C6D7062848A1AB005C \
    94AE36675C464D64BAFA68DD7434390BDBE9B9C5 \
    74F12602B6F1C4E913FAA37AD3A89613643B6201 \
    71DCFD284A79C3B38668286BC97EC7A07EDE3FC1 \
    8FCCA13FEF1D0C2E91008E09770F7A9A5AE15600 \
    C4F0DFFF4E8C1A8236409D08E73BC641CC11F4C8 \
    C82FA3AE1CBEDC6BE46B9360C43CEC45C17AB93C \
    DD8F2338BAE7501E3DD5AC78C273792F7D83545D \
    A48C2BEE680E841632CD4E44F07496B3EB3C1762 \
    108F52B48DB57BB0CC439B2997B01419BD92F80A \
    B9E2F5981AA6E0CD28160D9FF13993A75599653C \
  ; do \
      gpg --batch --keyserver hkps://keys.openpgp.org --recv-keys "$key" || \
      gpg --batch --keyserver keyserver.ubuntu.com --recv-keys "$key" ; \
  done \
  && curl -fsSLO --compressed "https://nodejs.org/dist/v$NODE_VERSION/node-v$NODE_VERSION-linux-$ARCH.tar.xz" \
  && curl -fsSLO --compressed "https://nodejs.org/dist/v$NODE_VERSION/SHASUMS256.txt.asc" \
  && gpg --batch --decrypt --output SHASUMS256.txt SHASUMS256.txt.asc \
  && grep " node-v$NODE_VERSION-linux-$ARCH.tar.xz\$" SHASUMS256.txt | sha256sum -c - \
  && tar -xJf "node-v$NODE_VERSION-linux-$ARCH.tar.xz" -C /usr/local --strip-components=1 --no-same-owner \
  && rm "node-v$NODE_VERSION-linux-$ARCH.tar.xz" SHASUMS256.txt.asc SHASUMS256.txt \
  && ln -s /usr/local/bin/node /usr/local/bin/nodejs

# Install typescript, gulp-cli and tslint globally
RUN npm install -g typescript@~3.7 tslint@~5.20 gulp-cli@~2.2

# Copy post create command
COPY ./post-create.sh /usr/local/bin/post-create.sh

# Copy entrypoint
COPY ./entrypoint.sh /usr/local/bin/entrypoint.sh

# Create non-root development user and required directories

# User args, override these from docker-compose.yml
ARG USERNAME=developer
ARG GROUPNAME=developer
ARG UID=1000
ARG GID=1000

# Create group
RUN groupadd --gid $GID $GROUPNAME \
  # Create user
  && useradd --uid $UID --gid $GID -m -s /bin/bash -d /server $USERNAME \
  # Create node_modules directory
  && mkdir -p /workspace/node_modules \
  # Create vscode-server install directory
  && mkdir -p /server/.vscode-server \
  # Set correct directory ownerships
  && chown -R $UID:$GID /workspace \
  && chown -R $UID:$GID /server/.vscode-server

# Expose common development ports
# HTTP, 3000, Livereload
EXPOSE 80 3000 35729

# Set workdir
WORKDIR /workspace

# Set user
USER $USERNAME

# Set frontend back to interactive
ENV DEBIAN_FRONTEND=dialog

# Container will execute entrypoint.sh as default command
CMD ["/usr/local/bin/entrypoint.sh"]

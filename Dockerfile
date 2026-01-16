#####
# Builder layer for React Frontend
#####

FROM node:14-bullseye AS builder

ARG REACT_APP_SHOW_IMPRESSUM_AND_DATENSCHUTZ

RUN apt-get update && \
  apt-get install -y zip

RUN adduser --quiet --disabled-password --shell /bin/bash --home /home/diversifix --gecos "" diversifix
USER diversifix

WORKDIR /home/diversifix/diversifix-build

ENV PATH="${PATH}:/home/diversifix/.yarn/bin"
RUN yarn global add devcmd-cli

ADD --chown=diversifix:diversifix ./dev_cmds/ dev_cmds/
RUN cd dev_cmds && yarn install

ADD --chown=diversifix:diversifix ./react-ui/ react-ui/
RUN cd react-ui && yarn install

ADD --chown=diversifix:diversifix . .
RUN devcmd setup
RUN devcmd prepare-server


#####
# Release layer for final image
#####

FROM python:3.9-bullseye

RUN apt-get update && \
  apt-get install -y gunicorn && \
  rm -rf /var/lib/apt/lists/*

RUN adduser --quiet --disabled-password --shell /bin/bash --home /home/diversifix --gecos "" diversifix
USER diversifix
WORKDIR /home/diversifix/diversifix-build

COPY --from=builder --chown=diversifix:diversifix /home/diversifix/diversifix-build/diversifix_server ./diversifix_server
RUN pip install --no-warn-script-location --disable-pip-version-check -r diversifix_server/requirements.in && \
  rm -rf /home/diversifix/.cache/pip
RUN python3 -m diversifix_server.download_language_models

ENV DIVERSIFIX_BIND_HOST=0.0.0.0
ENV DIVERSIFIX_BIND_PORT=80
ENV DIVERSIFIX_STARTUP_TIMEOUT_SEC=900

EXPOSE ${BIND_PORT}

CMD gunicorn diversifix_server.app:app \
  --bind ${DIVERSIFIX_BIND_HOST}:${DIVERSIFIX_BIND_PORT} \
  --timeout ${DIVERSIFIX_STARTUP_TIMEOUT_SEC}

ARG BUILD_DATE
ARG VCS_REVISION

# OCI Labels as per https://github.com/opencontainers/image-spec/blob/main/annotations.md
LABEL org.opencontainers.image.created=$BUILD_DATE
LABEL org.opencontainers.image.title="diversifix-app"
LABEL org.opencontainers.image.description="DIVERSIFIX - Einfach diversitätssensibel."
LABEL org.opencontainers.image.url="https://github.com/diversifix/diversifix"
LABEL org.opencontainers.image.source="https://github.com/diversifix/diversifix"
LABEL org.opencontainers.image.revision=$VCS_REVISION

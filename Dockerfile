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
# Release layer for final image using uv
#####

FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim

RUN apt-get update && \
  rm -rf /var/lib/apt/lists/*

RUN adduser --quiet --disabled-password --shell /bin/bash --home /home/diversifix --gecos "" diversifix
USER diversifix
WORKDIR /home/diversifix/diversifix-build

# Copy the server code
COPY --from=builder --chown=diversifix:diversifix /home/diversifix/diversifix-build/backend ./backend

# Install dependencies using uv (uses pyproject.toml)
RUN cd backend && \
  uv sync --frozen --no-dev && \
  rm -rf /home/diversifix/.cache/uv

# Download language models
RUN cd backend && \
  uv run python -m diversifix_server.download_language_models

ENV DIVERSIFIX_BIND_HOST=0.0.0.0
ENV DIVERSIFIX_BIND_PORT=80
ENV DIVERSIFIX_STARTUP_TIMEOUT_SEC=900

EXPOSE ${BIND_PORT}

# Run with uvicorn (FastAPI is natively ASGI)
CMD cd backend && uv run uvicorn diversifix_server.app:app \
  --host ${DIVERSIFIX_BIND_HOST} \
  --port ${DIVERSIFIX_BIND_PORT} \
  --timeout-keep-alive ${DIVERSIFIX_STARTUP_TIMEOUT_SEC}

ARG BUILD_DATE
ARG VCS_REVISION

# OCI Labels as per https://github.com/opencontainers/image-spec/blob/main/annotations.md
LABEL org.opencontainers.image.created=$BUILD_DATE
LABEL org.opencontainers.image.title="diversifix-app"
LABEL org.opencontainers.image.description="DIVERSIFIX - Einfach diversitätssensibel."
LABEL org.opencontainers.image.url="https://github.com/diversifix/diversifix"
LABEL org.opencontainers.image.source="https://github.com/diversifix/diversifix"
LABEL org.opencontainers.image.revision=$VCS_REVISION

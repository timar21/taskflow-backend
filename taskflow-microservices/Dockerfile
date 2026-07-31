# One Dockerfile builds all four apps — which one gets built/run is chosen
# by the APP_NAME build arg, set per-service in docker-compose.yml.
# Using -slim (Debian) rather than -alpine: bcrypt needs native bindings,
# and alpine's musl libc is a common source of "works on my machine, not
# in the container" native-module failures.
FROM node:22-slim AS builder
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .

ARG APP_NAME
RUN npx nest build ${APP_NAME}

FROM node:22-slim AS runtime
WORKDIR /usr/src/app
ENV NODE_ENV=production

ARG APP_NAME
ENV APP_NAME=${APP_NAME}

# Only production deps needed at runtime — Nest's webpack build already
# bundled the shared lib's source directly into dist/apps/<app>/main.js,
# so libs/shared itself doesn't need to exist in the final image at all.
COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /usr/src/app/dist ./dist

# Shell form so ${APP_NAME} actually gets substituted — exec-form CMD
# ["node", "dist/apps/${APP_NAME}/main.js"] would try to run a literal
# file named "${APP_NAME}" and fail.
CMD node dist/apps/${APP_NAME}/main.js
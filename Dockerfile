FROM oven/bun:1-slim AS build-client
WORKDIR /app
ENV NODE_ENV="production"
ARG VITE_DISPLAY_BASE_URL "furs.id"
COPY ./client/package.json ./client/bun.lockb ./
RUN bun install --frozen-lockfile
COPY client ./
RUN bun run build --outDir client-out

FROM lukemathwalker/cargo-chef:latest-rust-slim AS rust-base
WORKDIR /app

FROM rust-base AS planner
COPY . .
RUN cargo chef prepare --recipe-path recipe.json

FROM rust-base AS build-bend
COPY --from=planner /app/recipe.json recipe.json
RUN cargo chef cook --release --recipe-path recipe.json
COPY . .
RUN cargo build --release

FROM gcr.io/distroless/cc-debian12
COPY --from=build-bend /app/target/release/link-shortener /
COPY --from=build-client /app/client-out/ /client-out/

ENV HOST="0.0.0.0"
ENV PORT="3000"
VOLUME [ "/app/data/" ]
CMD ["./link-shortener"]
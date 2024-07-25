FROM oven/bun:1-slim AS build-client
WORKDIR /app
ENV NODE_ENV production
COPY ./client/package.json ./client/bun.lockb ./
RUN bun install --frozen-lockfile
COPY client ./
RUN bun run build --outDir client-out

FROM rust:1-slim as rust-base
RUN cargo install cargo-chef
WORKDIR /app

FROM rust-base as planner
COPY . .
RUN cargo chef prepare --recipe-path recipe.json

FROM rust-base as build-bend
COPY --from=planner /app/recipe.json recipe.json
RUN cargo chef cook --release --recipe-path recipe.json
COPY . .
RUN cargo build --release

FROM gcr.io/distroless/cc-debian12
COPY --from=build-bend /app/target/release/link-shortener /
COPY --from=build-client /app/client-out/ /client-out/

VOLUME [ "/app/data/" ]
EXPOSE 3000/tcp
CMD ["./link-shortener"]
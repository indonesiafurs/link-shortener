#![deny(clippy::all)]
#![warn(clippy::pedantic)]
#![warn(clippy::nursery)]
#![warn(clippy::perf)]
#![warn(clippy::complexity)]
#![warn(clippy::style)]

use std::{net::SocketAddr, sync::Arc};

use axum::{response::Redirect, routing::get};
use tower_http::{
    catch_panic::CatchPanicLayer,
    compression::CompressionLayer,
    cors::CorsLayer,
    normalize_path::NormalizePathLayer,
    services::{ServeDir, ServeFile},
    trace::TraceLayer,
};
use tracing::info;

pub mod db;
pub mod routes;

#[derive(Clone)]
pub struct AppState {
    db: libsql::Connection,
}

#[tokio::main]
async fn main() {
    dotenvy::dotenv().ok();
    tracing_subscriber::fmt::init();

    let dbconn = db::prepare().await;
    let app_state = Arc::new(AppState { db: dbconn });

    let permissive_cors = CorsLayer::new()
        .allow_headers(tower_http::cors::Any)
        .allow_methods(tower_http::cors::Any)
        .allow_origin(tower_http::cors::Any);

    let app = axum::Router::new()
        .nest_service("/", ServeDir::new("client-out"))
        .nest_service("/admin", ServeFile::new("client-out/admin.html"))
        .nest("/api", routes::api::layer())
        .fallback(get(routes::handle_short_url))
        .with_state(app_state)
        .layer(NormalizePathLayer::trim_trailing_slash())
        .layer(CatchPanicLayer::new())
        .layer(
            CompressionLayer::new()
                .zstd(true)
                .quality(tower_http::CompressionLevel::Precise(19)),
        )
        .layer(permissive_cors)
        .layer(TraceLayer::new_for_http());

    let tcp_listener = tokio::net::TcpListener::bind("0.0.0.0:3000")
        .await
        .expect("Unable to bind to :3000");
    info!("Listening on 0.0.0.0:3000");

    axum::serve(
        tcp_listener,
        app.into_make_service_with_connect_info::<SocketAddr>(),
    )
    .await
    .expect("Server crashed :(");
}

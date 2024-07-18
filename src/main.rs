#![deny(clippy::all)]
#![warn(clippy::pedantic)]
#![warn(clippy::nursery)]
#![warn(clippy::perf)]
#![warn(clippy::complexity)]
#![warn(clippy::style)]

use std::{net::SocketAddr, sync::Arc};

use axum::{response::Redirect, routing::get};
use tower_http::{
    catch_panic::CatchPanicLayer, normalize_path::NormalizePathLayer, trace::TraceLayer,
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

    let app = axum::Router::new()
        .nest("/api", routes::api::layer())
        .route(
            "/",
            get(|| async { Redirect::to("https://furries.id/en/links") }),
        )
        .route("/admin", get(|| async { "Admin page" }))
        .fallback(get(routes::handle_short_url))
        .with_state(app_state)
        .layer(NormalizePathLayer::trim_trailing_slash())
        .layer(CatchPanicLayer::new())
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

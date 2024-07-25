#![deny(clippy::all)]
#![warn(clippy::pedantic)]
#![warn(clippy::nursery)]
#![warn(clippy::perf)]
#![warn(clippy::complexity)]
#![warn(clippy::style)]

use std::{net::SocketAddr, sync::Arc};

use tokio::{select, signal};
use tower_http::{
    catch_panic::CatchPanicLayer, compression::CompressionLayer, cors::CorsLayer,
    normalize_path::NormalizePathLayer, services::ServeFile, trace::TraceLayer,
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
        .route_service("/", ServeFile::new("client-out/index.html"))
        .nest_service("/admin", ServeFile::new("client-out/admin.html"))
        .nest("/api", routes::api::layer())
        .fallback(routes::handle_short_url)
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
    .with_graceful_shutdown(shutdown_signal())
    .await
    .expect("Server crashed :(");
}

async fn shutdown_signal() {
    let ctrl_c = async {
        signal::ctrl_c()
            .await
            .expect("failed to install Ctrl+C handler");
    };

    // *nix have a special signal for termination
    // https://man7.org/linux/man-pages/man7/signal.7.html
    #[cfg(unix)]
    let terminate = async {
        signal::unix::signal(signal::unix::SignalKind::terminate())
            .expect("[UNIX ONLY] Terminate signal handler installation failed")
            .recv()
            .await;
    };

    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    select! {
        () = ctrl_c => {},
        () = terminate => {},
    }

    info!("Exit signal captured. Shutting down gracefully..");
}

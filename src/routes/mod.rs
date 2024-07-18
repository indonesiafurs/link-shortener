use std::sync::Arc;

use axum::{
    extract::{Request, State},
    http::StatusCode,
    response::IntoResponse,
};
use axum_client_ip::InsecureClientIp;
use tracing::{info, instrument};

use crate::AppState;

pub mod api;

#[instrument(skip_all)]
pub async fn handle_short_url(
    State(state): State<Arc<AppState>>,
    ip: InsecureClientIp,
    req: Request,
) -> impl IntoResponse {
    let path = req.uri().path().to_lowercase();
    // TODO: Logging support?
    let query = req.uri().query().unwrap_or_default();

    let conn = state.db.clone();
    let mut target_url_query_rows = conn
        .query(
            "SELECT target_url FROM links WHERE short_url = ?",
            [path.as_str()],
        )
        .await
        .expect("Unable to execute query");

    #[allow(clippy::option_if_let_else)]
    if let Some(row) = target_url_query_rows.next().await.unwrap() {
        let target_url = row.get::<String>(0).expect("Unable to get target_url");
        info!("[{ip:?}] Redirecting {path} to {target_url}");
        axum::response::Redirect::to(&target_url).into_response()
    } else {
        info!("[{ip:?}] Visited {path}");

        (StatusCode::NOT_FOUND, format!("Path {path} not found")).into_response()
    }
}

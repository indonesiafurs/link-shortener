use std::{path::Path, sync::Arc};

use axum::{
    extract::{Request, State},
    http::{header, Method, StatusCode},
    response::IntoResponse,
};
use axum_client_ip::InsecureClientIp;
use tokio_util::io::ReaderStream;
use tracing::{info, instrument};

use crate::AppState;

pub mod api;

#[instrument(skip_all)]
pub async fn handle_short_url(
    State(state): State<Arc<AppState>>,
    ip: InsecureClientIp,
    req: Request,
) -> impl IntoResponse {
    if req.method() != Method::GET || req.method() == Method::HEAD {
        return (StatusCode::METHOD_NOT_ALLOWED, "Method not allowed").into_response();
    }

    // TODO: Logging support?
    let query = req.uri().query().unwrap_or_default();
    let uri = req.uri().path();
    let path = Path::new("client-out/").join(uri.trim_start_matches('/'));

    // Highest priority: Serve static file exists in client-out
    if let Ok(file) = tokio::fs::File::open(path).await {
        let file_size = file
            .metadata()
            .await
            .expect("Unable to read a file's metadata. Does the current user have read access?")
            .len();
        let mime_type = mime_guess::from_path(req.uri().path())
            .first_or_text_plain()
            .to_string();
        let headers = [
            (header::CONTENT_TYPE, mime_type),
            (header::CONTENT_LENGTH, file_size.to_string()),
            (header::CACHE_CONTROL, "public, max-age=86400".to_string()),
        ];

        // Only return headers if the request is not a HEAD request
        // https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/HEAD
        if req.method() == Method::HEAD {
            return (StatusCode::OK, headers).into_response();
        }

        let stream = ReaderStream::new(file);
        let body = axum::body::Body::from_stream(stream);

        return (headers, body).into_response();
    }

    let conn = state.db.clone();
    let mut target_url_query_rows = conn
        .query(
            "SELECT target_url FROM links WHERE short_url = ?",
            [uri.to_lowercase().as_str()],
        )
        .await
        .expect("Unable to execute query");

    #[allow(clippy::option_if_let_else)]
    if let Some(row) = target_url_query_rows.next().await.unwrap() {
        let target_url = row.get::<String>(0).expect("Unable to get target_url");
        info!("[{ip:?}] Redirecting {uri} to {target_url}");
        axum::response::Redirect::to(&target_url).into_response()
    } else {
        info!("[{ip:?}] Visited {uri}");

        (StatusCode::NOT_FOUND, format!("Path {uri} not found")).into_response()
    }
}

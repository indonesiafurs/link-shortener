use std::sync::Arc;

use axum::{
    extract::State,
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Json,
};
use libsql::params;
use tower_http::validate_request::ValidateRequestHeaderLayer;
use tracing::{instrument, warn};
use typeshare::typeshare;

use crate::AppState;

const DEFAULT_API_KEY: &str = "SUKSES_IWAG_UNTUK_BELI_TANGGA_BARU";

#[instrument(skip_all)]
pub fn layer() -> axum::Router<Arc<crate::AppState>> {
    let bearer_token = std::env::var("API_KEY");
    if bearer_token.is_err() {
        warn!("API_KEY is not set! Using default value of `{DEFAULT_API_KEY}`");
    }

    axum::Router::new()
        .route("/url", post(create_url).delete(delete_url))
        .route("/urls", get(list_urls))
        .layer(ValidateRequestHeaderLayer::bearer(
            &bearer_token.unwrap_or_else(|_| DEFAULT_API_KEY.to_string()),
        ))
}

#[typeshare]
#[derive(serde::Serialize)]
pub struct ShortenedUrl {
    short_url: String,
    target_url: String,
    comment: Option<String>,
    active: bool,
}

#[typeshare]
type AllShortenedUrls = Vec<ShortenedUrl>;

async fn list_urls(State(state): State<Arc<AppState>>) -> Json<AllShortenedUrls> {
    let conn = state.db.clone();

    let mut rows = conn
        .query(
            "SELECT short_url, target_url, comment, active FROM links",
            (),
        )
        .await
        .expect("Unable to execute query");

    let mut urls: Vec<ShortenedUrl> = Vec::new();
    while let Some(row) = rows.next().await.expect("Unable to get row") {
        let short_url = row.get::<String>(0).expect("Unable to get short_url");
        let target_url = row.get::<String>(1).expect("Unable to get target_url");
        let comment = row.get::<Option<String>>(2).expect("Unable to get active");
        let active = row.get::<bool>(3).expect("Unable to get active");
        urls.push(ShortenedUrl {
            short_url,
            target_url,
            comment,
            active,
        });
    }

    Json(urls)
}

#[typeshare]
#[derive(serde::Serialize, serde::Deserialize, Debug)]
pub struct CreateShortenedUrlDto {
    short_url: String,
    target_url: String,
    comment: Option<String>,
}

#[instrument(skip(state))]
async fn create_url(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<CreateShortenedUrlDto>,
) -> impl IntoResponse {
    if !payload.short_url.starts_with('/') {
        return (StatusCode::BAD_REQUEST, "Short URL must start with /").into_response();
    }

    if !payload.target_url.starts_with("https://") {
        return (
            StatusCode::BAD_REQUEST,
            "Target URL must start with https://",
        )
            .into_response();
    }

    // Try and parse Url
    let target_url = url::Url::parse(&payload.target_url).expect("Invalid target URL");
    if !(target_url.scheme() != "https" || target_url.scheme() != "http") {
        return (
            StatusCode::BAD_REQUEST,
            "Target URL must be an external url (starts with http://)",
        )
            .into_response();
    }

    let conn = state.db.clone();

    let mut stmt = conn
        .prepare("INSERT INTO links (short_url, target_url, comment) VALUES (?, ?, ?)")
        .await
        .expect("Unable to prepare create url statement");

    stmt.execute(params![payload.short_url, payload.target_url,])
        .await
        .expect("Unable to execute create url statement");

    StatusCode::NO_CONTENT.into_response()
}

#[typeshare]
#[derive(serde::Serialize, serde::Deserialize, Debug)]
struct DeleteShortenedUrlDto {
    short_url: String,
}

async fn delete_url(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<DeleteShortenedUrlDto>,
) -> impl IntoResponse {
    let conn = state.db.clone();

    let mut stmt = conn
        .prepare("DELETE FROM links WHERE short_url = ?")
        .await
        .expect("Unable to prepare delete url statement");

    let rows = stmt
        .execute(params![payload.short_url,])
        .await
        .expect("Unable to execute delete url statement");

    if rows == 0 {
        return (StatusCode::NOT_FOUND, "Short URL not found").into_response();
    }

    StatusCode::NO_CONTENT.into_response()
}

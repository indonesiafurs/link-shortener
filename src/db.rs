use std::fs;

use libsql::Builder;
use tracing::{debug, info, instrument};

const DB_PATH: &str = "data/links.db";

#[instrument]
pub async fn prepare() -> libsql::Connection {
    fs::create_dir("data").ok();

    let db = Builder::new_local(DB_PATH)
        .build()
        .await
        .expect("Unable to create / read links.db");

    let conn = db.connect().expect("Unable to get database connection");

    debug!("Running migrations");
    migrate(conn.clone()).await;

    conn
}

#[instrument(skip_all)]
async fn migrate(conn: libsql::Connection) {
    let mut pragma = conn
        .query("PRAGMA user_version", ())
        .await
        .expect("Unable to get user_version");

    let mut version = pragma
        .next()
        .await
        .unwrap()
        .unwrap()
        .get::<u64>(0)
        .unwrap_or(0);
    debug!("Current database version is {version}");

    // TODO: Rethink this or just use a different database lol
    if version == 0 {
        debug!("Migrating from version 0 -> 1");
        conn.execute(
            "CREATE TABLE links (short_url TEXT PRIMARY KEY, target_url TEXT, comment TEXT DEFAULT '', active BOOLEAN DEFAULT 1)",
            (),
        )
        .await
        .expect("Unable to create links table");
        version = 1;
    }

    conn.execute(&format!("PRAGMA user_version = {version}"), ())
        .await
        .expect("Unable to set user_version");
}

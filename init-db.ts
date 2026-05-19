import pg from 'pg';

const connectionString = "postgresql://neondb_owner:npg_kAymGIP9a7Rz@ep-wandering-glade-ao4itf5h-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const pool = new pg.Pool({
  connectionString,
});

async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS templates (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      prompt TEXT NOT NULL,
      image_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log("Templates table created");
  process.exit(0);
}

init();

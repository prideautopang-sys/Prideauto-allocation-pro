import { sql } from './lib/db.js';

async function migrate() {
  try {
    await sql(`
      ALTER TABLE cars 
      ADD COLUMN IF NOT EXISTS test_drive_date DATE,
      ADD COLUMN IF NOT EXISTS test_drive_branch VARCHAR(255),
      ADD COLUMN IF NOT EXISTS test_drive_no VARCHAR(255);
    `);
    console.log('Migration successful');
  } catch (e) {
    console.error('Migration failed', e);
  }
}

migrate();

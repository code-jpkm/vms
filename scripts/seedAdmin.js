/**
 * ⚠️ DEVELOPMENT ONLY
 * This script logs admin credentials to console.
 * DO NOT use this version in production.
 */

const path = require('path');
const fs = require('fs');
const { Pool } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');
const readline = require('readline');
const dotenv = require('dotenv')
dotenv.config()
/* ===============================
   Load .env.local manually
================================ */
function loadEnv(file) {
  const p = path.join(__dirname, '..', file);
  if (!fs.existsSync(p)) return;

  fs.readFileSync(p, 'utf8')
    .split('\n')
    .forEach((line) => {
      const l = line.trim();
      if (!l || l.startsWith('#')) return;
      const i = l.indexOf('=');
      if (i === -1) return;
      const k = l.slice(0, i).trim();
      let v = l.slice(i + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      if (!process.env[k]) process.env[k] = v;
    });
}

loadEnv('.env.local');
loadEnv('.env');

/* ===============================
   Helpers
================================ */
function ask(question, { hidden = false } = {}) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

    if (!hidden) {
      rl.question(question, (ans) => {
        rl.close();
        resolve(ans.trim());
      });
      return;
    }

    process.stdout.write(question);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');

    let value = '';
    process.stdin.on('data', (char) => {
      char = String(char);
      if (char === '\n' || char === '\r' || char === '\u0004') {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        rl.close();
        resolve(value.trim());
      } else if (char === '\u0003') {
        process.exit();
      } else if (char === '\u007f') {
        value = value.slice(0, -1);
      } else {
        value += char;
      }
    });
  });
}

/* ===============================
   Main
================================ */
async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found');
    process.exit(1);
  }

  const email =
    (await ask('Admin email (default admin@company.com): ')) || 'admin@company.com';
  const name = (await ask('Admin name (default Super Admin): ')) || 'Super Admin';
  const password = await ask('Admin password (WILL BE LOGGED): ', { hidden: true });

  if (!password || password.length < 6) {
    console.error('❌ Password too short');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);

    let adminId;

    if (existing.rows.length) {
      adminId = existing.rows[0].id;
      await pool.query(
        'UPDATE users SET password_hash=$1, name=$2, role=$3 WHERE id=$4',
        [passwordHash, name, 'admin', adminId]
      );
      console.log('🔁 Existing admin updated');
    } else {
      const ins = await pool.query(
        `INSERT INTO users (email, password_hash, name, role)
         VALUES ($1,$2,$3,'admin')
         RETURNING id`,
        [email, passwordHash, name]
      );
      adminId = ins.rows[0].id;
      console.log('✅ New admin created');
    }

    console.log('\n===============================');
    console.log('✅ ADMIN SEEDED SUCCESSFULLY');
    console.log('===============================');
    console.log('🆔 Admin ID     :', adminId);
    console.log('📧 Email        :', email);
    console.log('🔑 Password     :', password);
    console.log('🔐 Role         : admin');
    console.log('🌐 Login URL    : http://localhost:3000/admin');
    console.log('===============================\n');
    console.log('⚠️  DO NOT SHARE THESE CREDENTIALS');
  } catch (err) {
    console.error('❌ Failed:', err.message);
  } finally {
    await pool.end();
  }
}

main();

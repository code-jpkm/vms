import { Pool } from '@neondatabase/serverless';

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function withClient(fn) {
  const client = await pool.connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}

// -----------------------------
// Vendors
// -----------------------------
export async function getVendorById(vendorId) {
  return withClient(async (client) => {
    const result = await client.query('SELECT * FROM vendors WHERE id = $1', [vendorId]);
    return result.rows[0] || null;
  });
}

export async function getVendorByEmail(email) {
  return withClient(async (client) => {
    const r = await client.query('SELECT * FROM vendors WHERE email = $1', [email]);
    return r.rows[0] || null;
  });
}

export async function createVendorWithApplication(data) {
  return withClient(async (client) => {
    await client.query('BEGIN');
    try {
      const vRes = await client.query(
        `INSERT INTO vendors (
          email, password_hash, company_name, gst_number, pan_number,
          account_holder_name, account_number, ifsc_code, bank_name,
          address, city, state, zip_code, phone, contact_person_name, status,
          submitted_at, updated_at, created_at
        )
        VALUES (
          $1,$2,$3,$4,$5,
          $6,$7,$8,$9,
          $10,$11,$12,$13,$14,$15,$16,
          CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
        RETURNING *`,
        [
          data.email,
          data.password_hash,
          data.company_name,
          data.gst_number,
          data.pan_number,
          data.account_holder_name,
          data.account_number,
          data.ifsc_code,
          data.bank_name,
          data.address,
          data.city,
          data.state,
          data.zip_code,
          data.phone,
          data.contact_person_name,
          data.status || 'pending',
        ]
      );

      const vendor = vRes.rows[0];

      const applicationNumber = `APP-${Date.now()}-${vendor.id}`;
      const aRes = await client.query(
        `INSERT INTO applications (vendor_id, application_number, status, submission_date, created_at, updated_at)
         VALUES ($1,$2,'submitted', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING *`,
        [vendor.id, applicationNumber]
      );

      await client.query(
        'INSERT INTO audit_logs (vendor_id, action, details) VALUES ($1,$2,$3)',
        [vendor.id, 'vendor_registered', JSON.stringify({ registered_by: data.registered_by || 'self' })]
      );

      await client.query('COMMIT');
      return { vendor, application: aRes.rows[0] };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    }
  });
}

export async function getLatestApplicationForVendor(vendorId) {
  return withClient(async (client) => {
    const r = await client.query(
      'SELECT * FROM applications WHERE vendor_id = $1 ORDER BY created_at DESC LIMIT 1',
      [vendorId]
    );
    return r.rows[0] || null;
  });
}

export async function listDocumentsForVendor(vendorId) {
  return withClient(async (client) => {
    const r = await client.query('SELECT * FROM documents WHERE vendor_id = $1 ORDER BY upload_date DESC', [vendorId]);
    return r.rows || [];
  });
}

export async function listVendors({ status } = {}) {
  return withClient(async (client) => {
    const params = [];
    let where = '';
    if (status) {
      params.push(status);
      where = 'WHERE v.status = $1';
    }
    const r = await client.query(
      `SELECT v.*
       FROM vendors v
       ${where}
       ORDER BY v.created_at DESC`,
      params
    );
    return r.rows;
  });
}

export async function updateVendorStatus({ vendorId, status, adminNotes, rejectionReason }) {
  return withClient(async (client) => {
    await client.query('BEGIN');
    try {
      const vRes = await client.query(
        'UPDATE vendors SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
        [status, vendorId]
      );
      if (vRes.rows.length === 0) throw new Error('Vendor not found');
      const vendor = vRes.rows[0];

      const appRes = await client.query(
        `UPDATE applications
         SET status = $1,
             admin_notes = COALESCE($2, admin_notes),
             rejection_reason = COALESCE($3, rejection_reason),
             approval_date = CASE WHEN $1 = 'approved' THEN CURRENT_TIMESTAMP ELSE approval_date END,
             updated_at = CURRENT_TIMESTAMP
         WHERE vendor_id = $4
         AND id = (SELECT id FROM applications WHERE vendor_id = $4 ORDER BY created_at DESC LIMIT 1)
         RETURNING *`,
        [status, adminNotes || null, rejectionReason || null, vendorId]
      );

      await client.query(
        'INSERT INTO audit_logs (vendor_id, action, details) VALUES ($1, $2, $3)',
        [vendorId, 'vendor_status_updated', JSON.stringify({ status, adminNotes, rejectionReason })]
      );

      await client.query('COMMIT');
      return { vendor, application: appRes.rows[0] || null };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    }
  });
}

// -----------------------------
// Users (admin / staff)
// -----------------------------
export async function getUserByEmail(email) {
  return withClient(async (client) => {
    const r = await client.query('SELECT * FROM users WHERE email = $1', [email]);
    return r.rows[0] || null;
  });
}

// -----------------------------
// Leads
// -----------------------------
export async function createLead({
  customerName,
  customerPhone,
  customerEmail,
  location,
  details,
  createdByUserId,
  vendorId,
  assignedByUserId,
}) {
  return withClient(async (client) => {
    await client.query('BEGIN');
    try {
      const leadNumber = `LEAD-${Date.now()}`;
      const leadRes = await client.query(
        `INSERT INTO leads (lead_number, customer_name, customer_phone, customer_email, location, details, status, created_by_user_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         RETURNING *`,
        [
          leadNumber,
          customerName,
          customerPhone || null,
          customerEmail || null,
          location || null,
          details || null,
          vendorId ? 'assigned' : 'new',
          createdByUserId || null,
        ]
      );

      const lead = leadRes.rows[0];

      let assignment = null;
      if (vendorId) {
        const asgRes = await client.query(
          `INSERT INTO lead_assignments (lead_id, vendor_id, assigned_by_user_id, status)
           VALUES ($1,$2,$3,'assigned')
           RETURNING *`,
          [lead.id, vendorId, assignedByUserId || createdByUserId || null]
        );
        assignment = asgRes.rows[0];

        await client.query(
          `INSERT INTO lead_events (lead_id, actor_type, actor_id, event_type, message)
           VALUES ($1,'system',NULL,'assigned',$2)`,
          [lead.id, `Lead assigned to vendor #${vendorId}`]
        );
      } else {
        await client.query(
          `INSERT INTO lead_events (lead_id, actor_type, actor_id, event_type, message)
           VALUES ($1,'system',NULL,'created','Lead created')`,
          [lead.id]
        );
      }

      await client.query('COMMIT');
      return { lead, assignment };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    }
  });
}

export async function listLeadsAdmin() {
  return withClient(async (client) => {
    const r = await client.query(
      `SELECT l.*, 
              la.vendor_id,
              v.company_name AS vendor_company_name,
              la.status AS assignment_status,
              la.assigned_at
       FROM leads l
       LEFT JOIN lead_assignments la ON la.lead_id = l.id
       LEFT JOIN vendors v ON v.id = la.vendor_id
       ORDER BY l.created_at DESC`
    );
    return r.rows;
  });
}

export async function listVendorLeads(vendorId) {
  return withClient(async (client) => {
    const r = await client.query(
      `SELECT l.*, la.id AS assignment_id, la.status AS assignment_status, la.assigned_at, la.updated_at AS assignment_updated_at
       FROM lead_assignments la
       JOIN leads l ON l.id = la.lead_id
       WHERE la.vendor_id = $1
       ORDER BY la.assigned_at DESC`,
      [vendorId]
    );
    return r.rows;
  });
}

export async function updateLeadAssignmentStatus({ vendorId, assignmentId, status }) {
  return withClient(async (client) => {
    await client.query('BEGIN');
    try {
      const asgRes = await client.query(
        `UPDATE lead_assignments
         SET status = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2 AND vendor_id = $3
         RETURNING *`,
        [status, assignmentId, vendorId]
      );
      if (asgRes.rows.length === 0) throw new Error('Assignment not found');
      const assignment = asgRes.rows[0];

      const leadStatus =
        status === 'completed'
          ? 'completed'
          : status === 'in_progress'
            ? 'in_progress'
            : status === 'cancelled'
              ? 'cancelled'
              : 'assigned';

      await client.query('UPDATE leads SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [
        leadStatus,
        assignment.lead_id,
      ]);

      await client.query(
        `INSERT INTO lead_events (lead_id, actor_type, actor_id, event_type, message)
         VALUES ($1,'vendor',$2,'status_change',$3)`,
        [assignment.lead_id, vendorId, `Vendor updated lead to ${status}`]
      );

      await client.query('COMMIT');
      return assignment;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    }
  });
}
// -----------------------------
// Password reset (admin/staff users)
// -----------------------------
export async function createPasswordResetToken({ userId, tokenHash, expiresAt }) {
  return withClient(async (client) => {
    const r = await client.query(
      `INSERT INTO password_resets (user_id, token_hash, expires_at)
       VALUES ($1,$2,$3)
       RETURNING *`,
      [userId, tokenHash, expiresAt]
    );
    return r.rows[0];
  });
}

export async function findValidPasswordResetByHash(tokenHash) {
  return withClient(async (client) => {
    const r = await client.query(
      `SELECT pr.*, u.email, u.name
       FROM password_resets pr
       JOIN users u ON u.id = pr.user_id
       WHERE pr.token_hash = $1
         AND pr.used_at IS NULL
         AND pr.expires_at > CURRENT_TIMESTAMP
       ORDER BY pr.created_at DESC
       LIMIT 1`,
      [tokenHash]
    );
    return r.rows[0] || null;
  });
}

export async function markPasswordResetUsed(id) {
  return withClient(async (client) => {
    await client.query(`UPDATE password_resets SET used_at = CURRENT_TIMESTAMP WHERE id = $1`, [id]);
  });
}

export async function updateUserPasswordHash(userId, passwordHash) {
  return withClient(async (client) => {
    await client.query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [passwordHash, userId]);
  });
}

// -----------------------------
// Admin/Staff users
// -----------------------------
export async function createUser({ email, passwordHash, name, role }) {
  return withClient(async (client) => {
    const r = await client.query(
      `INSERT INTO users (email, password_hash, name, role)
       VALUES ($1,$2,$3,$4)
       RETURNING id, email, name, role, created_at`,
      [email, passwordHash, name, role]
    );
    return r.rows[0];
  });
}

export async function listUsers() {
  return withClient(async (client) => {
    const r = await client.query(
      `SELECT id, email, name, role, created_at
       FROM users
       ORDER BY created_at DESC`
    );
    return r.rows;
  });
}

import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

function normalizeVendor(v) {
  const companyName = v.companyName || v.company_name || v.company || '';
  const contactName = v.contactPersonName || v.contact_person_name || v.ownerName || v.account_holder_name || '';
  const email = v.email;
  const gst = v.gstNumber || v.gst || v.gst_number || v.gst_number;
  const pan = v.panNumber || v.pan || v.pan_number;
  const phone = v.phone || '';
  const businessType = v.businessType || v.business_type || '';
  return { ...v, companyName, contactName, email, gst, pan, phone, businessType };
}

export async function sendWelcomeEmail(vendor) {
  vendor = normalizeVendor(vendor);

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; color: white; }
          .header h1 { margin: 0; font-size: 28px; }
          .content { padding: 40px; }
          .content h2 { color: #333; margin-top: 0; }
          .info-box { background: #f0f4ff; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; border-radius: 4px; text-decoration: none; margin: 20px 0; font-weight: 600; }
          .footer { background: #f5f5f5; padding: 20px; text-align: center; color: #999; font-size: 12px; border-top: 1px solid #eee; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Our Vendor Network!</h1>
          </div>
          <div class="content">
            <h2>Hi ${vendor.contactName},</h2>
            <p>Congratulations! Your vendor profile has been successfully registered.</p>
            
            <div class="info-box">
              <strong>Registration Details:</strong><br>
              Company: ${vendor.companyName}<br>
              Email: ${vendor.email}<br>
              GST: ${vendor.gst}<br>
              Registered on: ${new Date().toLocaleDateString()}
            </div>

            <p>Your account is now active and your documents are under review.</p>

            <a href="${process.env.NEXT_PUBLIC_APP_URL}/login" class="button">Access Your Dashboard</a>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Our Vendor Network. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: vendor.email,
    subject: '✓ Welcome to Our Vendor Network - Registration Successful!',
    html,
  });
}

export async function sendAdminNotification(vendor) {
  vendor = normalizeVendor(vendor);

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; }
          .header { background: #1e293b; padding: 20px; color: white; }
          .content { padding: 20px; }
          .details { background: #f5f5f5; padding: 15px; border-radius: 4px; margin: 15px 0; }
          .button { display: inline-block; background: #3b82f6; color: white; padding: 10px 20px; border-radius: 4px; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>New Vendor Registration</h2>
          </div>
          <div class="content">
            <p>A new vendor has registered. Please review:</p>
            <div class="details">
              <strong>Company:</strong> ${vendor.companyName}<br>
              <strong>Owner:</strong> ${vendor.contactName}<br>
              <strong>Email:</strong> ${vendor.email}<br>
              <strong>Phone:</strong> ${vendor.phone}<br>
              <strong>GST:</strong> ${vendor.gst}<br>
              <strong>PAN:</strong> ${vendor.pan}<br>
            </div>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/dashboard?tab=vendors" class="button">Review in Admin Panel</a>
          </div>
        </div>
      </body>
    </html>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: process.env.ADMIN_EMAIL,
    subject: `New Vendor Registration: ${vendor.companyName}`,
    html,
  });
}

export async function sendStatusUpdateEmail(vendor, status, message) {
  vendor = normalizeVendor(vendor);

  const statusColor = status === 'approved' ? '#10b981' : status === 'rejected' ? '#ef4444' : '#f59e0b';
  const statusText = status.charAt(0).toUpperCase() + status.slice(1);

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; color: white; }
          .status-badge { display: inline-block; background: ${statusColor}; color: white; padding: 12px 24px; border-radius: 4px; font-weight: 600; font-size: 16px; margin: 20px 0; }
          .content { padding: 40px; }
          .message-box { background: #f0f4ff; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; border-radius: 4px; }
          .footer { background: #f5f5f5; padding: 20px; text-align: center; color: #999; font-size: 12px; border-top: 1px solid #eee; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Application Status Update</h1>
          </div>
          <div class="content">
            <h2>Hi ${vendor.contactName},</h2>
            <p>Your vendor application status has been updated:</p>
            
            <center>
              <div class="status-badge">${statusText}</div>
            </center>

            <div class="message-box">
              <strong>Message from Admin:</strong><br>
              ${message}
            </div>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Our Vendor Network. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: vendor.email,
    subject: `Your Application Status: ${statusText}`,
    html,
  });
}

export async function sendLeadAssignedEmail({ vendor, lead, assignedBy }) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; }
          .container { max-width: 640px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 6px 20px rgba(0,0,0,0.08); }
          .header { background: radial-gradient(circle at 20% 20%, #22c55e 0%, #3b82f6 45%, #8b5cf6 100%); padding: 32px 24px; color: white; }
          .header h1 { margin: 0; font-size: 22px; letter-spacing: 0.2px; }
          .content { padding: 28px 24px; }
          .pill { display:inline-block; padding: 6px 10px; border-radius: 999px; background: #eef2ff; color: #3730a3; font-weight: 700; font-size: 12px; }
          .grid { margin-top: 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; }
          .row { margin: 8px 0; }
          .label { color: #64748b; font-size: 12px; }
          .value { color: #0f172a; font-size: 14px; font-weight: 600; }
          .button { display: inline-block; margin-top: 18px; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; padding: 12px 18px; border-radius: 10px; text-decoration: none; font-weight: 700; }
          .footer { padding: 18px 24px; background: #f8fafc; color: #64748b; font-size: 12px; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Lead Assigned 🎯</h1>
            <div style="margin-top:10px"><span class="pill">${lead.lead_number}</span></div>
          </div>
          <div class="content">
            <p style="margin:0;color:#334155">Hi ${vendor.contact_person_name || vendor.company_name}, a new lead has been assigned to you${assignedBy ? ` by ${assignedBy}` : ''}.</p>
            <div class="grid">
              <div class="row"><div class="label">Customer</div><div class="value">${lead.customer_name}</div></div>
              <div class="row"><div class="label">Phone</div><div class="value">${lead.customer_phone || '-'}</div></div>
              <div class="row"><div class="label">Email</div><div class="value">${lead.customer_email || '-'}</div></div>
              <div class="row"><div class="label">Location</div><div class="value">${lead.location || '-'}</div></div>
              <div class="row"><div class="label">Notes</div><div class="value">${lead.details || '-'}</div></div>
            </div>

            <a class="button" href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard">Open Vendor Dashboard</a>
            <p style="margin-top:14px;color:#64748b;font-size:12px">Tip: Update the lead status as you progress. Admin can track everything in real-time.</p>
          </div>
          <div class="footer">
            <div>© ${new Date().getFullYear()} Vendor Management System • Automated message</div>
          </div>
        </div>
      </body>
    </html>
  `;
  

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: vendor.email,
    subject: `New Lead Assigned: ${lead.lead_number}`,
    html,
  });
}

export async function sendPasswordResetEmail({ to, name, resetUrl }) {
  const html = `
  <!doctype html>
  <html>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;background:#f5f5f5;padding:24px">
      <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0">
        <div style="padding:24px;background:linear-gradient(135deg,#0f172a,#4f46e5);color:#fff">
          <h1 style="margin:0;font-size:20px">Password Reset</h1>
          <p style="margin:8px 0 0;opacity:.9">Secure link valid for limited time</p>
        </div>
        <div style="padding:24px;color:#0f172a">
          <p style="margin:0 0 12px">Hi ${name || 'User'},</p>
          <p style="margin:0 0 16px;color:#334155">Click the button below to reset your password:</p>
          <a href="${resetUrl}" style="display:inline-block;background:#0f172a;color:#fff;text-decoration:none;padding:12px 16px;border-radius:12px;font-weight:800">
            Reset Password
          </a>
          <p style="margin:16px 0 0;color:#64748b;font-size:12px">
            If you did not request this, ignore this email.
          </p>
        </div>
        <div style="padding:16px 24px;background:#f8fafc;color:#64748b;font-size:12px;border-top:1px solid #e2e8f0">
          Automated message
        </div>
      </div>
    </body>
  </html>`;
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: 'Reset your password',
    html,
  });
}

export async function sendNewUserCredentialsEmail({ to, name, role, tempPassword, loginUrl }) {
  const html = `
  <!doctype html>
  <html>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;background:#f5f5f5;padding:24px">
      <div style="max-width:680px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0">
        <div style="padding:24px;background:linear-gradient(135deg,#0f172a,#4f46e5);color:#fff">
          <h1 style="margin:0;font-size:20px">Your ${role.toUpperCase()} Account is Ready</h1>
          <p style="margin:8px 0 0;opacity:.9">Use the temporary password to login and change it.</p>
        </div>

        <div style="padding:24px;color:#0f172a">
          <p style="margin:0 0 12px">Hi ${name || 'User'},</p>

          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:16px;margin:16px 0">
            <div style="font-size:12px;color:#64748b;margin-bottom:6px">Login Email</div>
            <div style="font-weight:800;color:#0f172a">${to}</div>

            <div style="height:10px"></div>

            <div style="font-size:12px;color:#64748b;margin-bottom:6px">Temporary Password</div>
            <div style="font-weight:900;letter-spacing:.4px;color:#0f172a">${tempPassword}</div>

            <div style="height:10px"></div>

            <div style="font-size:12px;color:#64748b;margin-bottom:6px">Role</div>
            <div style="font-weight:800;color:#0f172a">${role}</div>
          </div>

          <a href="${loginUrl}" style="display:inline-block;background:#0f172a;color:#fff;text-decoration:none;padding:12px 16px;border-radius:12px;font-weight:900">
            Open Login
          </a>

          <p style="margin:16px 0 0;color:#64748b;font-size:12px">
            Security tip: Change your password after first login.
          </p>
        </div>

        <div style="padding:16px 24px;background:#f8fafc;color:#64748b;font-size:12px;border-top:1px solid #e2e8f0">
          Automated message • Vendor Management System
        </div>
      </div>
    </body>
  </html>`;

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: `Your ${role} login credentials`,
    html,
  });
}

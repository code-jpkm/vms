# Vendor Onboarding Portal - Setup Guide

A professional vendor registration and management system with JWT authentication, automated email notifications, and comprehensive document management.

## Features

✨ **Professional Vendor Form**
- Company & Owner Information
- GST & PAN Number Validation
- Bank Account Details (Account Number + IFSC)
- Complete Address Information
- Multi-document Upload (GST Certificate, PAN, Bank Proof, Address Proof)

🔐 **JWT Authentication**
- Secure token-based authentication
- 30-day token expiry
- Client-side token storage
- Protected dashboard routes

📧 **Automated Email System**
- Welcome email to vendors with registration details
- Admin notification for new registrations
- Status update emails (approval/rejection)
- HTML-formatted professional emails

📊 **Vendor Dashboard**
- View submitted information
- Application status tracking
- Document submission history
- Logout functionality

## Tech Stack

- **Frontend**: Next.js 14+ with React, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Neon PostgreSQL (serverless)
- **Authentication**: JWT (jsonwebtoken)
- **Email**: Nodemailer
- **Styling**: Tailwind CSS with custom theme

## Installation

### 1. Prerequisites
- Node.js 16+
- npm or yarn
- Neon PostgreSQL account (free tier available)
- SMTP email provider (Gmail, SendGrid, etc.)

### 2. Setup Neon Database

1. Go to [neon.tech](https://neon.tech) and create a free account
2. Create a new project
3. Copy the connection string from dashboard
4. The database schema will be auto-created using the migration script

### 3. Clone & Install Dependencies
```bash
npm install jsonwebtoken nodemailer @neondatabase/serverless bcrypt
```

### 4. Environment Setup
Create a `.env.local` file in the root directory:

```env
# Database Configuration (Neon PostgreSQL)
DATABASE_URL=postgresql://user:password@ep-xyz.neon.tech/vendor_db

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Email Configuration (using Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@yourcompany.com

# Admin email for notifications
ADMIN_EMAIL=admin@yourcompany.com

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Gmail Setup (if using Gmail)

1. Enable 2-Factor Authentication on your Gmail account
2. Go to myaccount.google.com/apppasswords
3. Select "Mail" and "Windows Computer" (or your device)
4. Google will generate a 16-character password
5. Use this password in `SMTP_PASSWORD`

### 5. Run the Application
```bash
npm run dev
```

Visit `http://localhost:3000` to see the vendor registration form.

## File Structure

```
├── app/
│   ├── page.jsx                    # Main vendor form page
│   ├── layout.jsx                  # Root layout
│   ├── globals.css                 # Global styles & theme
│   ├── api/
│   │   └── vendors/
│   │       ├── register/
│   │       │   └── route.js        # Vendor registration endpoint
│   │       └── get-data/
│   │           └── route.js        # Fetch vendor data from Neon
│   └── dashboard/
│       └── page.jsx                # Vendor dashboard
├── components/
│   └── VendorForm.jsx              # Main form component
├── lib/
│   ├── jwt.js                      # JWT token generation/verification
│   ├── email.js                    # Email sending utilities
│   ├── db.js                       # Database utility functions
│   └── (other utilities)
├── scripts/
│   └── setup-neon.sql              # Database schema migration
└── .env.example                    # Environment variables template
```

## API Endpoints

### POST /api/vendors/register
Register a new vendor.

**Request Body:**
```json
{
  "companyName": "ABC Corp",
  "ownerName": "John Doe",
  "email": "john@example.com",
  "phone": "+91 9876543210",
  "gst": "22AABCU9603R1Z0",
  "pan": "AAAPB5055K",
  "accountNumber": "123456789012345",
  "ifsc": "SBIN0000001",
  "address": "123 Business St",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001",
  "businessType": "manufacturing",
  "documents": {
    "gstCertificate": "gst-cert.pdf",
    "panCard": "pan-card.png",
    "bankProof": "bank-statement.pdf",
    "addressProof": "address-proof.jpg"
  }
}
```

**Response:**
```json
{
  "message": "Registration successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "vendor": {
    "id": "1234567890",
    "companyName": "ABC Corp",
    "email": "john@example.com",
    "gst": "22AABCU9603R1Z0",
    "status": "pending"
  }
}
```

## Validation Rules

### GST Number
- Format: 15 alphanumeric characters
- Pattern: `22AABCU9603R1Z0` (example)

### PAN Number
- Format: 10 alphanumeric characters
- Pattern: `AAAPB5055K` (example)

### IFSC Code
- Format: 11 characters
- Pattern: `SBIN0000001` (example)

### Documents
- Accepted formats: PDF, PNG, JPG, JPEG
- Maximum file size: 5MB
- All 4 documents are required

## Email Templates

### Welcome Email
- Sent to vendor upon successful registration
- Includes: Registration details, company info, next steps
- Professional HTML format with branding

### Admin Notification
- Sent to admin email on new vendor registration
- Includes: Complete vendor details, action link to review

### Status Update Email
- Sent when application is approved/rejected
- Customizable message from admin
- Color-coded status badge

## Authentication Flow

1. Vendor fills registration form
2. Form data validated on client side
3. Data sent to `/api/vendors/register` API
4. Server validates and generates JWT token
5. Token + vendor data stored in localStorage
6. Redirect to dashboard
7. Dashboard reads token from localStorage
8. JWT decoded to display vendor info

## Database Details

### Neon PostgreSQL Schema
The system uses Neon PostgreSQL with the following tables:

**Tables:**
- `vendors` - Stores vendor registration data (email, GST, PAN, bank details)
- `applications` - Tracks application status and timeline
- `documents` - Manages uploaded vendor documents
- `audit_logs` - Records all system actions for compliance
- `notifications` - Stores email sending history

### Auto Schema Creation
Run the migration script:
```bash
npm run db:migrate
```

Or manually execute `/scripts/setup-neon.sql` in your Neon dashboard SQL editor.

### Benefits of Neon
- ✅ Serverless - No infrastructure to manage
- ✅ Auto-scaling - Handles traffic spikes
- ✅ Free tier - 3 projects, 0.5 GB storage
- ✅ Connection pooling - Built-in for better performance
- ✅ Point-in-time recovery - 7-day backup included

## Security Best Practices

✅ **Implemented**
- JWT token-based auth
- Input validation on server
- Email format validation
- GST/PAN format validation
- Secure SMTP with TLS

⚠️ **To Add (Production)**
- HTTPS only
- Rate limiting on API endpoints
- CORS configuration
- Password hashing for admin panel
- Database encryption for sensitive fields
- Audit logging for all changes
- Document virus scanning
- Two-factor authentication for admin

## Testing

### Test Vendor Credentials
```
Company Name: Test Corp
Owner Name: Test User
Email: test@example.com
GST: 22AABCU9603R1Z0
PAN: AAAPB5055K
Account: 123456789012345
IFSC: SBIN0000001
```

### Test Document Upload
Upload any file (even dummy files) matching:
- GST Certificate: .pdf
- PAN Card: .png
- Bank Proof: .pdf
- Address Proof: .jpg

## Troubleshooting

### Email Not Sending
1. Check SMTP credentials in `.env.local`
2. Verify SMTP_HOST and SMTP_PORT are correct
3. For Gmail: Verify app password (not regular password)
4. Check firewall/antivirus not blocking SMTP

### JWT Errors
1. Ensure JWT_SECRET is set in `.env.local`
2. Check token hasn't expired (30 days)
3. Clear localStorage and re-register if needed

### File Upload Issues
1. Check file size (max 5MB)
2. Verify file format (PDF, PNG, JPG, JPEG)
3. Check browser console for specific errors

## Deployment

### Vercel (Recommended)
```bash
npm run build
# Commit to GitHub
# Connect to Vercel
# Add environment variables in Vercel dashboard
```

### Environment Variables on Vercel
- Add all `.env.local` variables to Vercel Project Settings
- Use Vercel Postgres for database (optional)
- Use Vercel KV for caching (optional)

## Performance Optimization

- Images: Use Next.js Image component
- Form: Client-side validation before API call
- Email: Send asynchronously (don't block registration)
- Documents: Validate on client before upload

## Support & Customization

### Customize Brand Colors
Edit `/app/globals.css` theme variables:
```css
--primary: oklch(0.35 0.15 240);
--accent: oklch(0.45 0.15 200);
```

### Customize Email Templates
Edit templates in `/lib/email.js`:
- Change colors, fonts, branding
- Add company logo
- Update footer content

### Add Custom Fields
1. Add field to VendorForm.jsx form state
2. Add validation in form component
3. Add field to API validation in route.js
4. Update email templates if needed

## Future Enhancements

- [ ] Admin panel for vendor management
- [ ] Document verification workflow
- [ ] Automated compliance checks
- [ ] Payment integration
- [ ] Multi-language support
- [ ] Mobile app
- [ ] Real database integration
- [ ] Advanced analytics dashboard

## License

MIT License - Feel free to use for your projects!

## Support

For issues or questions, refer to the codebase comments or the file structure documentation above.

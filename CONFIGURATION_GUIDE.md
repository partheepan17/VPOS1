# POS System - Configuration Guide

## 📋 Table of Contents
1. [Google Cloud Storage Backup](#google-cloud-storage-backup)
2. [Email Notifications](#email-notifications)
3. [SMS Notifications](#sms-notifications)
4. [Environment Variables Reference](#environment-variables-reference)

---

## 🗄️ Google Cloud Storage Backup

### Prerequisites
- Google Cloud Platform account
- GCS bucket created
- Service account with Storage Admin role

### Setup Steps

#### 1. Create GCS Bucket
```bash
# In Google Cloud Console or gcloud CLI
gsutil mb -l us-central1 gs://your-pos-backup-bucket
```

#### 2. Create Service Account
1. Go to IAM & Admin > Service Accounts
2. Create new service account: `pos-backup-service`
3. Grant role: `Storage Object Admin`
4. Create JSON key and download

#### 3. Configure Backend
Add to `/app/backend/.env`:
```env
GCS_BUCKET_NAME=your-pos-backup-bucket
GCS_PROJECT_ID=your-gcp-project-id
GCS_CREDENTIALS_PATH=/app/backend/gcs-credentials.json
```

#### 4. Upload Credentials
```bash
# Copy your downloaded JSON key to backend folder
cp ~/Downloads/service-account-key.json /app/backend/gcs-credentials.json
```

#### 5. Restart Backend
```bash
sudo supervisorctl restart backend
```

### Usage
- **Manual Backup**: Settings > Backups > Create Backup
- **Restore**: Settings > Backups > Select backup > Restore
- **Automatic**: Backups run daily (if scheduled)

---

## 📧 Email Notifications

### Supported Services
- Gmail (with App Password)
- SendGrid
- AWS SES
- Any SMTP server

### Gmail Setup (Recommended for Testing)

#### 1. Enable 2-Factor Authentication
1. Go to Google Account Settings
2. Security > 2-Step Verification > Turn On

#### 2. Generate App Password
1. Security > 2-Step Verification > App passwords
2. Select app: Mail
3. Select device: Other (Custom name) > "POS System"
4. Copy the 16-character password

#### 3. Configure Backend
Add to `/app/backend/.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-16-char-app-password
FROM_EMAIL=your-email@gmail.com
FROM_NAME=My Store POS
MANAGER_EMAIL=manager@yourstore.com
```

#### 4. Restart Backend
```bash
sudo supervisorctl restart backend
```

### SendGrid Setup (Recommended for Production)

#### 1. Sign up at SendGrid
- Create account at https://sendgrid.com
- Verify your sender email

#### 2. Create API Key
- Settings > API Keys > Create API Key
- Give it "Mail Send" permissions

#### 3. Configure Backend
Add to `/app/backend/.env`:
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
FROM_EMAIL=noreply@yourstore.com
FROM_NAME=My Store POS
MANAGER_EMAIL=manager@yourstore.com
```

### Notification Types
1. **Low Stock Alerts** - Sent to manager when products reach reorder level
2. **Sales Receipts** - Sent to customers after purchase
3. **Adjustment Requests** - Sent to manager when cashier requests stock adjustment
4. **Daily Summary** - Daily sales report sent to manager

### Testing
```bash
# Test email in POS system
Settings > Notifications > Test Email
```

---

## 📱 SMS Notifications

### Twilio Setup (Optional)

#### 1. Sign up at Twilio
- Create account at https://www.twilio.com
- Get phone number

#### 2. Get Credentials
- Account SID and Auth Token from console

#### 3. Configure Backend
Add to `/app/backend/.env`:
```env
SMS_ENABLED=true
SMS_API_KEY=your-twilio-auth-token
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_PHONE_NUMBER=+1234567890
```

#### 4. Implement Integration
Currently SMS is a placeholder. To implement:
- Install: `pip install twilio`
- Update `services/notification_service.py` `send_sms()` method

---

## 🔐 Environment Variables Reference

### Required Variables
```env
# Database (Already configured)
MONGO_URL=mongodb://localhost:27017/

# JWT Secret
SECRET_KEY=your-secret-key-change-in-production
```

### Optional - Cloud Backup
```env
GCS_BUCKET_NAME=your-backup-bucket
GCS_PROJECT_ID=your-gcp-project
GCS_CREDENTIALS_PATH=/app/backend/gcs-credentials.json
```

### Optional - Email Notifications
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=your-email@gmail.com
FROM_NAME=Your Store Name
MANAGER_EMAIL=manager@yourstore.com
```

### Optional - SMS Notifications
```env
SMS_ENABLED=false
SMS_API_KEY=your-sms-service-key
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_PHONE_NUMBER=+1234567890
```

---

## 🧪 Testing Configuration

### Test Email
```bash
# Via API
curl -X POST http://localhost:8001/api/notifications/test-email?to_email=test@example.com \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Backup
```bash
# Via API
curl -X POST http://localhost:8001/api/backups/create \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Check Configuration Status
```bash
# Via API
curl http://localhost:8001/api/notifications/settings \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🔧 Troubleshooting

### Email Not Sending
1. Check SMTP credentials in `.env`
2. For Gmail: Ensure App Password (not regular password)
3. Check firewall allows outbound port 587
4. View backend logs: `tail -f /var/log/supervisor/backend.err.log`

### GCS Backup Failing
1. Verify service account JSON file exists at specified path
2. Check service account has Storage Object Admin role
3. Verify bucket name is correct
4. Test with `gsutil ls gs://your-bucket-name`

### Missing Environment Variables
- Backend logs show warnings for missing configs
- Check `/app/backend/.env` file exists
- Restart after changes: `sudo supervisorctl restart backend`

---

## 📚 Additional Resources
- [Google Cloud Storage Docs](https://cloud.google.com/storage/docs)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)
- [SendGrid Documentation](https://docs.sendgrid.com)
- [Twilio SMS Docs](https://www.twilio.com/docs/sms)

---

## ✅ Quick Start Checklist

- [ ] GCS bucket created
- [ ] Service account credentials downloaded
- [ ] GCS credentials added to backend
- [ ] SMTP credentials configured
- [ ] Test email sent successfully
- [ ] Manager email configured
- [ ] Backup tested
- [ ] All environment variables added to `.env`
- [ ] Backend restarted

---

**Need Help?** Check the backend logs or contact support.

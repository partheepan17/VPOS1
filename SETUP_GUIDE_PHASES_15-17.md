# Setup Guide: Phases 15-17 (Email/SMS, Cloud Backup, Offline Mode)

## Phase 15: Email/SMS Notifications

### Email Setup (SendGrid - Recommended)

1. **Create SendGrid Account**
   - Go to https://sendgrid.com/
   - Sign up for free account (100 emails/day free)
   - Verify your email address

2. **Get API Key**
   - Dashboard → Settings → API Keys
   - Click "Create API Key"
   - Give full access permissions
   - Copy the API key (starts with `SG.`)

3. **Add to Backend**
   ```bash
   # Add to /app/backend/.env
   SENDGRID_API_KEY=SG.your_api_key_here
   FROM_EMAIL=your-verified-email@example.com
   ```

4. **Install Package**
   ```bash
   cd /app/backend
   pip install sendgrid
   pip freeze > requirements.txt
   ```

5. **Implement Email Function**
   ```python
   # Add to server.py
   from sendgrid import SendGridAPIClient
   from sendgrid.helpers.mail import Mail
   
   def send_email(to_email: str, subject: str, content: str):
       api_key = os.environ.get('SENDGRID_API_KEY')
       from_email = os.environ.get('FROM_EMAIL')
       
       message = Mail(
           from_email=from_email,
           to_emails=to_email,
           subject=subject,
           html_content=content
       )
       
       try:
           sg = SendGridAPIClient(api_key)
           response = sg.send(message)
           return {"status": "sent", "status_code": response.status_code}
       except Exception as e:
           return {"status": "failed", "error": str(e)}
   ```

6. **Notification Triggers**
   - Low stock alert: When `stock < reorder_level`
   - Daily sales summary: Scheduled at end of day
   - New user created: When manager creates user

---

### SMS Setup (Twilio)

1. **Create Twilio Account**
   - Go to https://twilio.com/
   - Sign up for trial account ($15 free credit)
   - Verify your phone number

2. **Get Credentials**
   - Dashboard → Account Info
   - Copy: Account SID, Auth Token
   - Get a Twilio phone number

3. **Add to Backend**
   ```bash
   # Add to /app/backend/.env
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_FROM_NUMBER=+1234567890
   ```

4. **Install Package**
   ```bash
   cd /app/backend
   pip install twilio
   pip freeze > requirements.txt
   ```

5. **Implement SMS Function**
   ```python
   # Add to server.py
   from twilio.rest import Client
   
   def send_sms(to_number: str, message: str):
       account_sid = os.environ.get('TWILIO_ACCOUNT_SID')
       auth_token = os.environ.get('TWILIO_AUTH_TOKEN')
       from_number = os.environ.get('TWILIO_FROM_NUMBER')
       
       try:
           client = Client(account_sid, auth_token)
           message = client.messages.create(
               body=message,
               from_=from_number,
               to=to_number
           )
           return {"status": "sent", "sid": message.sid}
       except Exception as e:
           return {"status": "failed", "error": str(e)}
   ```

---

### Scheduled Notifications (APScheduler)

```bash
pip install apscheduler
```

```python
# Add to server.py
from apscheduler.schedulers.background import BackgroundScheduler

scheduler = BackgroundScheduler()

def send_daily_sales_summary():
    """Send daily sales summary at end of day"""
    # Get today's sales
    today = datetime.now().strftime("%Y-%m-%d")
    sales = list(sales_col.find({
        "status": "completed",
        "created_at": {"$gte": today}
    }))
    
    total_revenue = sum(s.get("total", 0) for s in sales)
    
    # Send email to admin
    send_email(
        to_email="admin@yourbusiness.com",
        subject=f"Daily Sales Summary - {today}",
        content=f"<h2>Sales Summary</h2><p>Total Sales: {len(sales)}</p><p>Total Revenue: LKR {total_revenue}</p>"
    )

# Schedule daily at 11:59 PM
scheduler.add_job(send_daily_sales_summary, 'cron', hour=23, minute=59)
scheduler.start()
```

---

## Phase 16: Google Cloud Storage Backup

### GCS Setup

1. **Create Google Cloud Project**
   - Go to https://console.cloud.google.com/
   - Create new project or use existing
   - Enable "Cloud Storage API"

2. **Create Service Account**
   - IAM & Admin → Service Accounts
   - Create Service Account
   - Grant role: "Storage Admin"
   - Create key (JSON format)
   - Download JSON key file

3. **Create Storage Bucket**
   - Cloud Storage → Buckets
   - Click "Create Bucket"
   - Name: `pos-system-backups` (must be globally unique)
   - Location: Choose closest region
   - Storage class: Standard
   - Access control: Uniform

4. **Setup Backend**
   ```bash
   cd /app/backend
   pip install google-cloud-storage
   pip freeze > requirements.txt
   ```

5. **Add Credentials**
   ```bash
   # Copy JSON key file to backend folder
   cp ~/Downloads/your-key-file.json /app/backend/gcs-key.json
   
   # Add to /app/backend/.env
   GOOGLE_APPLICATION_CREDENTIALS=/app/backend/gcs-key.json
   GCS_BUCKET_NAME=pos-system-backups
   ```

6. **Implement Backup Functions**
   ```python
   # Add to server.py
   from google.cloud import storage
   import json
   
   def upload_backup_to_gcs():
       """Upload database backup to Google Cloud Storage"""
       try:
           # Get all collections data
           backup_data = {
               "products": list(products_col.find({}, {"_id": 0})),
               "customers": list(customers_col.find({}, {"_id": 0})),
               "sales": list(sales_col.find({}, {"_id": 0})),
               "users": list(users_col.find({}, {"_id": 0, "password": 0})),
               "settings": list(settings_col.find({}, {"_id": 0})),
               "timestamp": datetime.utcnow().isoformat()
           }
           
           # Upload to GCS
           client = storage.Client()
           bucket = client.bucket(os.environ.get('GCS_BUCKET_NAME'))
           
           filename = f"backup-{datetime.utcnow().strftime('%Y%m%d-%H%M%S')}.json"
           blob = bucket.blob(filename)
           blob.upload_from_string(
               json.dumps(backup_data, indent=2),
               content_type='application/json'
           )
           
           return {"status": "success", "filename": filename}
       except Exception as e:
           return {"status": "failed", "error": str(e)}
   
   def list_backups_from_gcs():
       """List all available backups"""
       try:
           client = storage.Client()
           bucket = client.bucket(os.environ.get('GCS_BUCKET_NAME'))
           blobs = bucket.list_blobs()
           
           backups = []
           for blob in blobs:
               backups.append({
                   "name": blob.name,
                   "size": blob.size,
                   "created": blob.time_created.isoformat()
               })
           
           return {"backups": backups}
       except Exception as e:
           return {"backups": [], "error": str(e)}
   
   def restore_from_gcs(filename: str):
       """Restore database from GCS backup"""
       try:
           client = storage.Client()
           bucket = client.bucket(os.environ.get('GCS_BUCKET_NAME'))
           blob = bucket.blob(filename)
           
           backup_data = json.loads(blob.download_as_string())
           
           # Restore collections (WARNING: This will delete existing data)
           products_col.delete_many({})
           products_col.insert_many(backup_data["products"])
           
           customers_col.delete_many({})
           customers_col.insert_many(backup_data["customers"])
           
           # Add other collections...
           
           return {"status": "success", "restored": filename}
       except Exception as e:
           return {"status": "failed", "error": str(e)}
   ```

7. **Add API Endpoints**
   ```python
   @app.post("/api/backup/cloud")
   def create_cloud_backup(current_user: dict = Depends(require_role(["manager"]))):
       result = upload_backup_to_gcs()
       return result
   
   @app.get("/api/backup/cloud/list")
   def list_cloud_backups(current_user: dict = Depends(require_role(["manager"]))):
       result = list_backups_from_gcs()
       return result
   
   @app.post("/api/backup/cloud/restore/{filename}")
   def restore_cloud_backup(filename: str, current_user: dict = Depends(require_role(["manager"]))):
       result = restore_from_gcs(filename)
       return result
   ```

8. **Schedule Daily Backup**
   ```python
   # Add with APScheduler
   scheduler.add_job(upload_backup_to_gcs, 'cron', hour=0, minute=0)  # Daily at midnight
   ```

---

## Phase 17: Offline Mode

### Frontend Setup (IndexedDB + Service Worker)

1. **Install Dexie.js**
   ```bash
   cd /app/frontend
   yarn add dexie
   ```

2. **Create Offline Database**
   ```javascript
   // Create /app/frontend/src/db.js
   import Dexie from 'dexie';
   
   export const db = new Dexie('POSOfflineDB');
   
   db.version(1).stores({
       products: 'id, sku, name',
       customers: 'id, phone, name',
       sales: '++id, invoice_number, synced, created_at',
       syncQueue: '++id, type, data, synced'
   });
   ```

3. **Implement Offline Sales**
   ```javascript
   // Add to App.js or create OfflineManager.js
   import { db } from './db';
   
   async function createOfflineSale(saleData) {
       // Add to local database
       await db.sales.add({
           ...saleData,
           synced: false,
           offline: true,
           created_at: new Date().toISOString()
       });
       
       // Add to sync queue
       await db.syncQueue.add({
           type: 'sale',
           data: saleData,
           synced: false,
           timestamp: new Date().toISOString()
       });
   }
   
   async function syncOfflineData() {
       const queue = await db.syncQueue.where('synced').equals(false).toArray();
       
       for (const item of queue) {
           try {
               // Send to server
               await axios.post(`${API_URL}/api/sales`, item.data);
               
               // Mark as synced
               await db.syncQueue.update(item.id, { synced: true });
               await db.sales
                   .where('invoice_number')
                   .equals(item.data.invoice_number)
                   .modify({ synced: true });
           } catch (error) {
               console.error('Sync failed:', error);
           }
       }
   }
   
   // Check online status and sync
   window.addEventListener('online', syncOfflineData);
   ```

4. **Service Worker (Optional)**
   ```javascript
   // Create /app/frontend/public/service-worker.js
   const CACHE_NAME = 'pos-cache-v1';
   const urlsToCache = [
       '/',
       '/static/css/main.css',
       '/static/js/main.js'
   ];
   
   self.addEventListener('install', (event) => {
       event.waitUntil(
           caches.open(CACHE_NAME)
               .then((cache) => cache.addAll(urlsToCache))
       );
   });
   
   self.addEventListener('fetch', (event) => {
       event.respondWith(
           caches.match(event.request)
               .then((response) => response || fetch(event.request))
       );
   });
   ```

5. **Register Service Worker**
   ```javascript
   // Add to /app/frontend/src/index.js
   if ('serviceWorker' in navigator) {
       navigator.serviceWorker.register('/service-worker.js')
           .then((registration) => {
               console.log('Service Worker registered:', registration);
           });
   }
   ```

6. **Offline Indicator**
   ```javascript
   // Add to App.js
   const [isOnline, setIsOnline] = useState(navigator.onLine);
   
   useEffect(() => {
       const handleOnline = () => {
           setIsOnline(true);
           syncOfflineData();  // Sync when back online
       };
       const handleOffline = () => setIsOnline(false);
       
       window.addEventListener('online', handleOnline);
       window.addEventListener('offline', handleOffline);
       
       return () => {
           window.removeEventListener('online', handleOnline);
           window.removeEventListener('offline', handleOffline);
       };
   }, []);
   
   // Display indicator
   {!isOnline && (
       <div className="offline-indicator bg-yellow-500 text-white px-4 py-2 text-center">
           ⚠️ Offline Mode - Changes will sync when online
       </div>
   )}
   ```

---

## Testing Checklist

### Email/SMS
- [ ] Send test email notification
- [ ] Send test SMS notification
- [ ] Verify low stock alerts trigger
- [ ] Test daily sales summary

### Cloud Backup
- [ ] Create manual backup to GCS
- [ ] List available backups
- [ ] Download backup file
- [ ] Test restore (use test environment!)
- [ ] Verify daily auto-backup runs

### Offline Mode
- [ ] Disconnect internet
- [ ] Create sale offline
- [ ] Verify sale saved to IndexedDB
- [ ] Reconnect internet
- [ ] Verify sale syncs to server
- [ ] Check sync queue cleared

---

## Security Considerations

1. **Never commit credentials to Git**
   - Add to `.gitignore`:
     ```
     .env
     gcs-key.json
     *.pem
     ```

2. **Use environment variables**
   - All sensitive data in `.env` file
   - Different keys for dev/staging/prod

3. **Secure API keys**
   - Restrict SendGrid key to specific sender
   - Restrict Twilio key to specific numbers
   - Set GCS bucket permissions correctly

4. **Backup encryption**
   - Consider encrypting backups before upload
   - Use GCS encryption at rest

---

## Troubleshooting

### Email not sending
- Check SendGrid API key is valid
- Verify sender email is verified
- Check SendGrid activity logs

### SMS not sending
- Check Twilio trial restrictions
- Verify phone numbers are verified
- Check Twilio console logs

### GCS upload fails
- Verify JSON key file path
- Check bucket name is correct
- Verify service account has Storage Admin role
- Check bucket permissions

### Offline mode not working
- Check IndexedDB browser support
- Verify Dexie.js installed correctly
- Check browser console for errors
- Test in incognito mode (no extensions)

---

**Ready to implement these features!** Follow each section step-by-step.

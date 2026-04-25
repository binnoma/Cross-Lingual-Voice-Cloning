# 🚀 دليل النشر | Deployment Guide

دليل شامل لنشر مشروع استنساخ الصوت متعدد اللغات على مختلف المنصات.

---

## 📋 المتطلبات للإنتاج

| المتطلب | الحد الأدنى | المُوصى به |
|---------|-------------|-------------|
| CPU | 2 cores | 4+ cores |
| RAM | 4 GB | 8+ GB |
| Storage | 10 GB | 50+ GB (للنماذج) |
| GPU | — | NVIDIA مع CUDA (لـ OpenVoice) |

---

## 🐳 النشر باستخدام Docker (مُوصى به)

### 1. بناء الصور

```bash
# بناء صورة الواجهة الأمامية
docker build -t voice-clone-frontend -f Dockerfile.frontend .

# بناء صورة خدمة الصوت
docker build -t voice-clone-backend -f Dockerfile.backend ./mini-services/voice-service
```

### 2. التشغيل باستخدام Docker Compose

```bash
docker-compose up -d
```

---

## ☁️ النشر على Vercel + Railway

### الواجهة الأمامية (Vercel)

1. اربط مستودع GitHub بـ Vercel
2. أضف متغيرات البيئة:
   ```
   VOICE_SERVICE_URL=https://your-railway-app.up.railway.app
   ```
3. أبند الإعدادات:
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`

### خدمة الصوت (Railway)

1. أنشئ مشروع جديد على Railway
2. اربط مستودع GitHub
3. أضف متغيرات البيئة:
   ```
   OPENVOICE_CHECKPOINTS_DIR=/app/checkpoints
   VOICE_SERVICE_PORT=3030
   ```
4. سيتم كشف المنفذ 3030 تلقائياً

---

## 🖥️ النشر على خادم خاص (VPS)

### 1. إعداد الخادم

```bash
# تحديث النظام
sudo apt update && sudo apt upgrade -y

# تثبيت Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# تثبيت Python
sudo apt install -y python3 python3-pip python3-venv

# تثبيت Bun
curl -fsSL https://bun.sh/install | bash

# تثبيت Nginx (كـ reverse proxy)
sudo apt install -y nginx
```

### 2. إعداد المشروع

```bash
# استنساخ المشروع
git clone https://github.com/binnoma/Cross-Lingual-Voice-Cloning.git
cd Cross-Lingual-Voice-Cloning

# إعداد الواجهة
npm install
cp .env.example .env.local

# إعداد خدمة الصوت
cd mini-services/voice-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3. إعداد Systemd Services

**الواجهة الأمامية** (`/etc/systemd/system/voice-clone-web.service`):
```ini
[Unit]
Description=Voice Clone Web App
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/Cross-Lingual-Voice-Cloning
ExecStart=/usr/bin/npm start
Restart=always
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
```

**خدمة الصوت** (`/etc/systemd/system/voice-clone-api.service`):
```ini
[Unit]
Description=Voice Clone API Service
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/Cross-Lingual-Voice-Cloning/mini-services/voice-service
ExecStart=/path/to/venv/bin/uvicorn main:app --host 0.0.0.0 --port 3030
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable voice-clone-web voice-clone-api
sudo systemctl start voice-clone-web voice-clone-api
```

### 4. إعداد Nginx

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Voice Service API
    location /api/clone {
        proxy_pass http://127.0.0.1:3030;
        proxy_set_header Host $host;
        client_max_body_size 20M;
    }

    location /api/health {
        proxy_pass http://127.0.0.1:3030;
    }

    location /api/languages {
        proxy_pass http://127.0.0.1:3030;
    }
}
```

### 5. إعداد SSL مع Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## 🔧 إعداد OpenVoice V2 (للإنتاج)

### تحميل النموذج

```bash
mkdir -p checkpoints

# تحميل من HuggingFace
pip install huggingface-hub
huggingface-cli download myshell-ai/OpenVoiceV2 --local-dir checkpoints/openvoice_v2
```

### إعداد GPU (إن وُجدت)

```bash
# تثبيت CUDA toolkit
sudo apt install nvidia-cuda-toolkit

# تثبيت PyTorch مع CUDA
pip install torch torchaudio --index-url https://download.pytorch.org/whl/cu118
```

---

## 📊 المراقبة والصيانة

### فحص صحة الخدمات

```bash
# فحص الواجهة
curl -s http://localhost:3000/ | head -1

# فحص خدمة الصوت
curl -s http://localhost:3030/api/health

# فحص استخدام الموارد
docker stats  # إن كنت تستخدم Docker
```

### تنظيف ملفات الصوت المولدة

```bash
# حذف الملفات الأقدم من 7 أيام
find /path/to/download/audio -name "tts_*.wav" -mtime +7 -delete
```

### النسخ الاحتياطي

```bash
# نسخ احتياطي للإعدادات
tar -czf backup-$(date +%Y%m%d).tar.gz .env.local checkpoints/
```

---

## 🔒 الأمان

- استخدم HTTPS دائماً في الإنتاج
- فعّل Rate Limiting (الحد الأقصى: 10 طلب/دقيقة)
- أضف علامات مائية صوتية على المخرجات
- راقب الاستخدام المشبوه
- حدد حجم الملفات المرفوعة (10MB كحد أقصى)
- استخدم CORS محدد بدلاً من السماح بالكل

---

<div align="center">
  <p>للمساعدة، افتح Issue على GitHub أو تواصل مع @binnoma</p>
</div>

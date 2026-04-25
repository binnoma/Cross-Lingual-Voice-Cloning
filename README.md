# 🎙️ Cross-Lingual Voice Cloning | استنساخ الصوت متعدد اللغات

<div align="center">

![Project Banner](https://img.shields.io/badge/Voice_Clone-Cross_Lingual-8B5CF6?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=flat-square&logo=nextdotjs&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)
![Python](https://img.shields.io/badge/Python_3.10+-3776AB?style=flat-square&logo=python&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)
![Status](https://img.shields.io/badge/Status-Active-green.svg)

**حوّل صوتك إلى أي لغة في العالم** | **Transform your voice to any language**

[🇸🇦 العربية](#-نظرة-عامة) | [🇬🇧 English](#-overview)

</div>

---

## 🌟 نظرة عامة

تطبيق ويب متقدم لاستنساخ الصوت لحظياً (Instant Voice Cloning) مبني على تقنية **OpenVoice V2** مع واجهة ويب احترافية. يتميز بقدرته الفريدة على استنساخ نبرة الصوت بدقة متناهية ونقلها بين لغات مختلفة، مما يتيح لك "التحدث" بلغات عالمية مع الحفاظ على بصمتك الصوتية الأصلية.

### 🚀 الميزات الرئيسية

| الميزة | الوصف |
|--------|-------|
| **استنساخ لحظي (IVC)** | يتطلب عينة صوتية قصيرة جداً (أقل من 30 ثانية) للبدء |
| **تحكم دقيق (Granular Control)** | إمكانية التحكم في المشاعر، النبرة، السرعة، والوقفات اللفظية |
| **عابر للغات (Cross-Lingual)** | استنساخ صوت عربي ليتحدث الإنجليزية، الفرنسية، أو الصينية |
| **توليد صوت حقيقي (TTS)** | يعمل مباشرة مع محرك TTS عبر z-ai-web-dev-sdk |
| **واجهة عربية كاملة** | دعم RTL مع تبديل بين العربية والإنجليزية |
| **تسجيل مباشر** | سجّل صوتك من المتصفح مباشرة بدون برامج إضافية |
| **تصميم متجاوب** | يعمل على الهاتف والحاسوب بسلاسة |

### 🌍 اللغات المدعومة

| اللغة | الكود | الصوت الافتراضي |
|-------|-------|----------------|
| 🇸🇦 العربية | `ar` | tongtong |
| 🇬🇧 الإنجليزية | `en` | jam |
| 🇪🇸 الإسبانية | `es` | kazi |
| 🇫🇷 الفرنسية | `fr` | xiaochen |
| 🇨🇳 الصينية | `zh` | tongtong |
| 🇯🇵 اليابانية | `ja` | douji |
| 🇰🇷 الكورية | `ko` | chuichui |
| 🇩🇪 الألمانية | `de` | luodo |

---

## 🏗️ البنية التقنية (Architecture)

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js 16)                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐  │
│  │ Audio    │ │ Text     │ │ Settings │ │ Output    │  │
│  │ Upload   │ │ Input    │ │ Panel    │ │ Player    │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────┘  │
│                      │                    ▲              │
│                      ▼                    │              │
│  ┌──────────────────────────────────────────────────┐   │
│  │           Next.js API Routes                     │   │
│  │  /api/tts  →  z-ai-web-dev-sdk (TTS Engine)     │   │
│  │  /api/audio →  Serve generated audio files       │   │
│  └──────────────────────────────────────────────────┘   │
│                      │                                  │
│                      ▼                                  │
│  ┌──────────────────────────────────────────────────┐   │
│  │        Voice Service (FastAPI - Port 3030)       │   │
│  │  /api/clone  →  OpenVoice V2 (Voice Cloning)     │   │
│  │  /api/tts    →  Text-to-Speech                   │   │
│  │  /api/languages →  Supported languages            │   │
│  │  /api/health →  Health check                      │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

يعتمد المشروع على تقنية **Decoupled Architecture** التي تفصل بين هويتين للصوت:
1. **Base Speaker TTS** — يولد الكلام ويتحكم في الأسلوب واللغة
2. **Tone Color Converter** — يقوم بدمج "لون النبرة" من العينة المرجعية فوق الكلام المولد

---

## ⚙️ التثبيت والإعداد (Installation)

### المتطلبات المسبقة

| المتطلب | الإصدار |
|---------|---------|
| Node.js | 18+ |
| Python | 3.10+ |
| Bun (مُوصى به) | أحدث إصدار |
| Git | أحدث إصدار |
| (اختياري) NVIDIA GPU + CUDA | للأداء الأسرع |

### 1. تحميل المشروع

```bash
git clone https://github.com/binnoma/Cross-Lingual-Voice-Cloning.git
cd Cross-Lingual-Voice-Cloning
```

### 2. إعداد الواجهة الأمامية (Next.js)

```bash
# تثبيت المكتبات
npm install
# أو باستخدام bun (أسرع)
bun install

# نسخ ملف البيئة
cp .env.example .env.local

# تشغيل خادم التطوير
npm run dev
# أو
bun run dev
```

سيتم تشغيل التطبيق على `http://localhost:3000`

### 3. إعداد خدمة الصوت (FastAPI)

```bash
# الانتقال لمجلد الخدمة
cd mini-services/voice-service

# إنشاء بيئة افتراضية (مُوصى به)
python -m venv venv
source venv/bin/activate  # ويندوز: venv\Scripts\activate

# تثبيت المكتبات
pip install -r requirements.txt

# تشغيل الخدمة
python -m uvicorn main:app --host 0.0.0.0 --port 3030 --reload
```

ستعمل الخدمة على `http://localhost:3030`

### 4. (اختياري) تحميل أوزان OpenVoice V2

لتفعيل استنساخ الصوت الحقيقي، يجب تحميل أوزان النموذج:

```bash
# إنشاء مجلد الأوزان
mkdir -p checkpoints

# تحميل الأوزان من HuggingFace
# سيتم إضافة رابط التحميل لاحقاً
```

---

## 🛠️ كيفية الاستخدام (How to Use)

### الاستخدام الأساسي

1. افتح التطبيق في المتصفح: `http://localhost:3000`
2. **ارفع صوتك**: اسحب ملف صوتي أو سجّل صوتك مباشرة
3. **اكتب النص**: أدخل النص الذي تريد تحويله
4. **اختر اللغة**: حدد اللغة المستهدفة من القائمة
5. **اضغط "استنساخ الصوت"**: وانتظر النتيجة!

### تبديل اللغة

اضغط على زر **English/عربي** في شريط العنوان لتبديل واجهة المستخدم بين العربية والإنجليزية.

### إعدادات متقدمة

| الإعداد | الوصف | القيم |
|---------|-------|-------|
| **نبرة الصوت** | تحكم في أسلوب النطق | محايد، سعيد، حزين، غاضب، متحمس |
| **السرعة** | سرعة الكلام المولد | 0.5x (بطيء) — 1.0x (عادي) — 2.0x (سريع) |

### API Endpoints

#### توليد صوت من نص (TTS)

```bash
curl -X POST http://localhost:3000/api/tts \
  -H "Content-Type: application/json" \
  -d '{"text": "مرحبا بالعالم", "language": "ar", "speed": 1.0}'
```

**الاستجابة:**
```json
{
  "status": "success",
  "audioUrl": "/api/audio?file=tts_1234567890.wav",
  "filename": "tts_1234567890.wav",
  "text": "مرحبا بالعالم",
  "language": "ar"
}
```

#### الحصول على ملف الصوت

```bash
curl http://localhost:3000/api/audio?file=tts_1234567890.wav --output output.wav
```

#### فحص صحة الخدمة

```bash
curl http://localhost:3030/api/health
# {"status": "ok", "service": "voice-cloning"}
```

#### اللغات المدعومة

```bash
curl http://localhost:3030/api/languages
```

#### استنساخ الصوت (يتطلب OpenVoice V2)

```bash
curl -X POST http://localhost:3030/api/clone \
  -F "audio_file=@reference_voice.wav" \
  -F "text=Hello, how are you?" \
  -F "target_language=en" \
  -F "speed=1.0" \
  -F "emotion=neutral"
```

---

## 📁 هيكل المشروع (Project Structure)

```
Cross-Lingual-Voice-Cloning/
├── 📄 README.md                    # التوثيق الرئيسي
├── 📄 LICENSE                      # رخصة MIT
├── 📄 .gitignore                   # ملفات مستثناة من Git
├── 📄 .env.example                 # متغيرات البيئة (نموذج)
├── 📄 CONTRIBUTING.md              # دليل المساهمة
├── 📄 DEPLOYMENT.md                # دليل النشر
├── 📄 package.json                 # تبعيات Next.js
├── 📄 requirements-python.txt      # تبعيات Python
│
├── 📂 src/                         # كود الواجهة الأمامية
│   ├── 📂 app/
│   │   ├── 📄 page.tsx             # الصفحة الرئيسية (واجهة استنساخ الصوت)
│   │   ├── 📄 layout.tsx           # التخطيط العام (RTL + Cairo font)
│   │   ├── 📄 globals.css          # الأنماط العامة
│   │   └── 📂 api/
│   │       ├── 📂 tts/
│   │       │   └── 📄 route.ts     # واجهة توليد الصوت (z-ai-web-dev-sdk)
│   │       ├── 📂 audio/
│   │       │   └── 📄 route.ts     # واجهة تقديم ملفات الصوت
│   │       └── 📂 clone/
│   │           └── 📄 route.ts     # واجهة استنساخ الصوت
│   ├── 📂 components/
│   │   └── 📂 ui/                  # مكونات shadcn/ui
│   └── 📂 lib/                     # مكتبات مساعدة
│
├── 📂 mini-services/               # الخدمات المصغرة
│   └── 📂 voice-service/           # خدمة استنساخ الصوت (FastAPI)
│       ├── 📄 main.py              # التطبيق الرئيسي
│       ├── 📄 package.json         # إعدادات الخدمة
│       └── 📄 requirements.txt     # تبعيات Python
│
├── 📂 public/                      # الملفات الثابتة
├── 📂 prisma/                      # قاعدة البيانات (إن وجدت)
└── 📂 checkpoints/                 # أوزان النماذج (يجب تحميلها)
    ├── 📂 openvoice_v2/
    └── 📂 base_speakers/
```

---

## 🗺️ خارطة الطريق (Roadmap)

- [x] واجهة ويب احترافية بالعربية
- [x] دعم RTL وتعدد اللغات في الواجهة
- [x] رفع وتسجيل الصوت من المتصفح
- [x] تكامل TTS مع z-ai-web-dev-sdk
- [x] خدمة FastAPI لاستنساخ الصوت
- [ ] تكامل OpenVoice V2 الكامل
- [ ] علامات مائية صوتية (Audio Watermarking)
- [ ] نظام تحسين جودة الصوت (Denoiser)
- [ ] دعم نماذج Vision للتحريك الشفاهي (Lip Syncing)
- [ ] واجهة API عامة (Public API)
- [ ] دعم نماذج صوت إضافية (VITS, XTTS)
- [ ] وضع دفعة (Batch Processing)

---

## 🤝 المساهمة (Contributing)

نرحب بمساهماتكم! يرجى قراءة [CONTRIBUTING.md](CONTRIBUTING.md) للتفاصيل.

---

## ⚖️ إخلاء مسؤولية وأخلاقيات (Ethics & Disclaimer)

> **تحذير مهم**: هذا المشروع مخصص للأغراض التعليمية والبحثية فقط.

يُمنع منعاً باتاً استخدامه في:
- انتحال شخصية الأفراد دون موافقتهم الصريحة
- إنشاء محتوى مضلل أو "Deepfakes" تهدف للإساءة
- أي أنشطة غير قانونية أو غير أخلاقية

*نحن نشجع على الاستخدام المسؤول والشفاف لهذه التقنية.*

---

## 📄 الرخصة (License)

هذا المشروع مرخص تحت رخصة MIT - راجع [LICENSE](LICENSE) للتفاصيل.

---

<div align="center">
  <img src="https://flagcdn.com/w40/ae.png" width="30" alt="UAE Flag">
  <h3>صنع بحب في الامارات 🇦🇪</h3>
  <p><b>التطوير والإشراف: @binnoma</b></p>
  <p><i>رؤية طموحة لمستقبل الذكاء الاصطناعي العربي</i></p>
</div>

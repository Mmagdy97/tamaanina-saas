# دليل نشر مشروع "طمأنينة" على Vercel

يحتوي هذا الملف على الخطوات اللازمة لنشر المشروع من Firebase Studio إلى منصة Vercel بشكل احترافي.

## الخطوة 1: تهيئة Git والرفع على GitHub

افتح "الطرفية" (Terminal) في بيئة التطوير ونفذ الأوامر التالية:

```bash
# 1. تهيئة المستودع
git init

# 2. إضافة الملفات
git add .

# 3. تسجيل أول Commit
git commit -m "Initial commit: Tamaanina SaaS Platform"

# 4. ربط المشروع بمستودع GitHub (قم بإنشاء مستودع فارغ أولاً على github.com)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# 5. تغيير اسم الفرع للرئيسي والرفع
git branch -M main
git push -u origin main
```

## الخطوة 2: الربط بـ Vercel

1. سجل الدخول إلى [Vercel](https://vercel.com).
2. انقر على **"Add New"** ثم **"Project"**.
3. اختر المستودع الذي رفعته للتو من قائمة GitHub.
4. **هام جداً:** في قسم **Environment Variables**، أضف القيم التالية من مشروع Firebase الخاص بك:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
   - `GEMINI_API_KEY` (لعمل ميزات الذكاء الاصطناعي)

## الخطوة 3: إعدادات البناء (Build Settings)
- **Framework Preset**: Next.js (سيتم التعرف عليه تلقائياً).
- **Build Command**: `npm run build`.
- **Install Command**: `npm install`.

## ملاحظات تقنية
- تم ضبط المشروع ليعمل بنظام `standalone` لضمان أفضل أداء على Vercel.
- تأكد من إضافة رابط Vercel (مثلاً `tamaanina.vercel.app`) إلى قائمة **Authorized Domains** في إعدادات Firebase Authentication ليعمل تسجيل الدخول بشكل صحيح.
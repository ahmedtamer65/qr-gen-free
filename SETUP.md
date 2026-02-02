# 🚀 دليل إعداد QR Generator

## الخطوة 1: إنشاء مشروع Supabase (مجاني)

1. اذهب إلى **[supabase.com](https://supabase.com)**
2. اضغط **"Start your project"**
3. سجل دخول بحساب GitHub
4. اضغط **"New Project"**
5. اختار اسم المشروع: `qr-generator`
6. اختار كلمة مرور للـ Database
7. اختار أقرب Region ليك
8. اضغط **"Create new project"**
9. **استنى دقيقتين** حتى يكتمل الإنشاء

---

## الخطوة 2: إنشاء جدول قاعدة البيانات

1. من القائمة الجانبية، اضغط **"SQL Editor"**
2. انسخ الكود ده والصقه:

```sql
-- إنشاء جدول QR Codes
CREATE TABLE qr_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  short_code VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  original_url TEXT NOT NULL,
  fg_color VARCHAR(20) DEFAULT '#000000',
  bg_color VARCHAR(20) DEFAULT '#FFFFFF',
  scans INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء Index للبحث السريع
CREATE INDEX idx_qr_codes_user_id ON qr_codes(user_id);
CREATE INDEX idx_qr_codes_short_code ON qr_codes(short_code);

-- تفعيل Row Level Security
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;

-- سياسة: كل مستخدم يشوف بياناته بس
CREATE POLICY "Users can view own qr_codes" ON qr_codes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own qr_codes" ON qr_codes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own qr_codes" ON qr_codes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own qr_codes" ON qr_codes
  FOR DELETE USING (auth.uid() = user_id);
```

3. اضغط **"Run"** (أو Ctrl+Enter)
4. لازم تشوف رسالة "Success"

---

## الخطوة 3: الحصول على مفاتيح API

1. من القائمة الجانبية، اضغط **"Settings"** (أيقونة الترس)
2. اضغط **"API"**
3. انسخ القيم دي:
   - **Project URL** → ده `VITE_SUPABASE_URL`
   - **anon public** → ده `VITE_SUPABASE_ANON_KEY`

---

## الخطوة 4: تفعيل تسجيل الدخول بـ Google (اختياري)

1. من القائمة الجانبية، اضغط **"Authentication"**
2. اضغط **"Providers"**
3. ابحث عن **"Google"** وفعّله
4. هتحتاج تعمل OAuth app في Google Cloud Console

---

## الخطوة 5: رفع على GitHub

1. أنشئ Repository جديد على GitHub
2. ارفع كل الملفات

---

## الخطوة 6: النشر على Vercel

1. اذهب إلى **[vercel.com](https://vercel.com)**
2. اضغط **"Add New Project"**
3. اختار الـ Repository
4. **مهم!** في **Environment Variables** أضف:
   - `VITE_SUPABASE_URL` = القيمة من الخطوة 3
   - `VITE_SUPABASE_ANON_KEY` = القيمة من الخطوة 3
5. اضغط **"Deploy"**

---

## ✅ خلاص!

الموقع هيكون جاهز على رابط زي:
`https://qr-generator-xxx.vercel.app`

---

## 🔧 للتشغيل المحلي

1. انسخ `.env.example` إلى `.env`
2. حط القيم الصحيحة
3. شغّل:
```bash
npm install
npm run dev
```

---

## ❓ مشاكل شائعة

### "Invalid API key"
- تأكد إنك حطيت المفاتيح الصحيحة في Vercel

### "Permission denied"
- تأكد إنك شغلت الـ SQL في الخطوة 2

### مش بيسجل دخول بـ Google
- تأكد إنك فعلت Google provider في Supabase

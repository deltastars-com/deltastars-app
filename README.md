# Delta Stars - متجر نجوم دلتا

تطبيق Android احترافي لمتجر نجوم دلتا للخضروات والفواكه والتمور.

## 📋 المتطلبات

- Android Studio 2023.1 أو أحدث
- Android SDK 34 (API Level 34)
- Java 11 أو أحدث
- Gradle 8.2.0

## 🚀 البدء السريع

### 1. فتح المشروع في Android Studio

```bash
# افتح Android Studio
# اختر: File → Open
# اختر مجلد المشروع
```

### 2. تثبيت الاعتمادات

```bash
# Android Studio سيقوم بتثبيت الاعتمادات تلقائياً
# أو استخدم الأمر:
./gradlew build
```

### 3. بناء التطبيق

```bash
# بناء APK للتطوير:
./gradlew assembleDebug

# بناء APK للإنتاج:
./gradlew assembleRelease

# بناء AAB للنشر على Google Play:
./gradlew bundleRelease
```

### 4. تشغيل التطبيق

```bash
# على محاكي Android:
./gradlew installDebug

# أو من خلال Android Studio:
# اضغط على زر Run (Shift + F10)
```

## 📁 هيكل المشروع

```
deltastars-android-app/
├── app/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/deltastars/store/
│   │   │   │   ├── MainActivity.java
│   │   │   │   ├── ui/
│   │   │   │   ├── services/
│   │   │   │   ├── models/
│   │   │   │   ├── adapters/
│   │   │   │   ├── utils/
│   │   │   │   └── database/
│   │   │   ├── res/
│   │   │   │   ├── layout/
│   │   │   │   ├── drawable/
│   │   │   │   ├── values/
│   │   │   │   └── mipmap/
│   │   │   └── AndroidManifest.xml
│   │   ├── test/
│   │   └── androidTest/
│   ├── build.gradle
│   └── proguard-rules.pro
├── gradle/
│   └── wrapper/
├── build.gradle
├── settings.gradle
└── README.md
```

## 🔧 الإعدادات المهمة

### متغيرات البيئة

قم بتعديل الملفات التالية بمعلومات الشركة:

**app/build.gradle:**
```gradle
buildConfigField "String", "API_BASE_URL", '"https://api.deltastars.store/"'
buildConfigField "String", "MOYASAR_API_KEY", '"pk_test_XXXXXXXXXXXXXXXXXX"'
buildConfigField "String", "AUTHENTICA_API_KEY", '"XXXXXXXXXXXXXXXXXX"'
```

**app/src/main/AndroidManifest.xml:**
```xml
<meta-data
    android:name="com.google.android.geo.API_KEY"
    android:value="AIzaSyDXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" />
```

### التوقيع الرقمي

لبناء APK للإنتاج، تحتاج إلى ملف keystore:

```bash
# إنشاء keystore جديد:
keytool -genkey -v -keystore deltastars-keystore.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias deltastars-key

# ثم قم بتعيين كلمات المرور في build.gradle
```

## 📦 بناء APK للنشر

### خطوات البناء:

1. **فتح Build Menu:**
   - من Android Studio: Build → Build Bundle(s) / APK(s) → Build APK(s)

2. **اختيار Release:**
   - اختر `release` بدلاً من `debug`

3. **التوقيع:**
   - سيطلب منك اختيار keystore
   - أدخل كلمات المرور

4. **الانتظار:**
   - سيتم بناء الملف تلقائياً
   - ستجد الملف في: `app/release/app-release.apk`

## 📱 نشر على Google Play

### المتطلبات:

1. **حساب Google Play Developer** ($25 لمرة واحدة)
2. **ملف AAB (Android App Bundle)**
3. **صور وأيقونات**
4. **وصف التطبيق**

### خطوات النشر:

1. **بناء AAB:**
   ```bash
   ./gradlew bundleRelease
   ```

2. **فتح Google Play Console:**
   - اذهب إلى: https://play.google.com/console

3. **إنشاء تطبيق جديد:**
   - اضغط على "Create app"
   - أدخل اسم التطبيق

4. **رفع الملفات:**
   - اذهب إلى: Release → Production
   - ارفع ملف AAB

5. **إضافة المعلومات:**
   - أضف الصور والأيقونات
   - أضف الوصف والكلمات المفتاحية

6. **المراجعة والنشر:**
   - اضغط على "Review"
   - اضغط على "Publish"

## 🔐 الأمان

- ✅ جميع البيانات مشفرة (HTTPS/TLS 1.3)
- ✅ كلمات المرور محفوظة بأمان
- ✅ توثيق ثنائي (Firebase Auth)
- ✅ حماية من الهجمات الشائعة

## 🧪 الاختبار

### اختبار محلي:

```bash
# تشغيل اختبارات الوحدة:
./gradlew test

# تشغيل اختبارات الأجهزة:
./gradlew connectedAndroidTest
```

### اختبار على أجهزة حقيقية:

```bash
# توصيل الجهاز عبر USB
# تفعيل Developer Mode على الجهاز
# تشغيل:
./gradlew installDebug
```

## 📊 الأداء

- **حجم التطبيق:** ~25 MB
- **الذاكرة المطلوبة:** 100 MB
- **نظام التشغيل:** Android 5.0+
- **الأداء:** محسّن للأجهزة القديمة والحديثة

## 🐛 استكشاف الأخطاء

### المشكلة: فشل البناء

**الحل:**
```bash
# تنظيف المشروع:
./gradlew clean

# بناء جديد:
./gradlew build
```

### المشكلة: خطأ في Gradle

**الحل:**
```bash
# تحديث Gradle:
./gradlew wrapper --gradle-version=8.2.0

# إعادة محاولة:
./gradlew build
```

### المشكلة: خطأ في المكتبات

**الحل:**
```bash
# تحديث المكتبات:
./gradlew dependencies

# حذف الذاكرة المخزنة:
rm -rf ~/.gradle
```

## 📞 الدعم

**نجوم دلتا للتجارة**
- 📱 الهاتف: 920023204
- 💬 الواتساب: 0558828009
- 📧 البريد: INFO@DELTASTARS-KSA.COM
- 🌐 الموقع: https://deltastars-ksa.com

## 📄 الترخيص

© 2026 نجوم دلتا للتجارة. جميع الحقوق محفوظة.

---

**الإصدار:** 3.0.0  
**التاريخ:** 2 يوليو 2026  
**الحالة:** Production Ready ✅

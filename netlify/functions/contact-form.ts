// ================================================================
// netlify/functions/contact-form.ts
// معالج نموذج الاتصال - استقبال الرسائل من العملاء
// وتخزينها في قاعدة البيانات وإرسال إشعار للإدارة
// ================================================================

import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

// --------------------------------------------
// 1. إعداد الاتصال بـ Supabase
// --------------------------------------------

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase credentials are missing in environment variables.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// --------------------------------------------
// 2. دوال مساعدة للتحقق من صحة البيانات
// --------------------------------------------

/**
 * التحقق من صحة البريد الإلكتروني
 */
const isValidEmail = (email: string): boolean => {
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(email);
};

/**
 * التحقق من طول النص (منع الرسائل الطويلة جداً)
 */
const isValidLength = (text: string, maxLength: number = 2000): boolean => {
  return text.length <= maxLength;
};

/**
 * تنظيف النص من الأحرف الضارة (XSS)
 */
const sanitizeInput = (text: string): string => {
  return text
    .replace(/[<>]/g, '') // إزالة أقواس الزاوية لمنع HTML
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .trim();
};

// --------------------------------------------
// 3. دالة إرسال البريد الإلكتروني (اختيارية)
// --------------------------------------------

async function sendEmailNotification(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<void> {
  const sendgridKey = process.env.SENDGRID_API_KEY;
  const contactEmail = process.env.CONTACT_EMAIL || 'info@deltastars-ksa.com';

  if (!sendgridKey) {
    console.warn('⚠️ SENDGRID_API_KEY not set. Email notification will be skipped.');
    return;
  }

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sendgridKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: contactEmail }],
            subject: `📩 رسالة جديدة من ${data.name}: ${data.subject}`,
          },
        ],
        from: { email: 'noreply@deltastars.store', name: 'دلتا ستارز' },
        reply_to: { email: data.email, name: data.name },
        content: [
          {
            type: 'text/html',
            value: `
              <h2>📬 رسالة جديدة من نموذج الاتصال</h2>
              <p><strong>الاسم:</strong> ${data.name}</p>
              <p><strong>البريد الإلكتروني:</strong> ${data.email}</p>
              <p><strong>الموضوع:</strong> ${data.subject}</p>
              <p><strong>الرسالة:</strong></p>
              <p style="background: #f5f5f5; padding: 16px; border-radius: 8px;">${data.message}</p>
              <hr />
              <p style="color: #999; font-size: 12px;">تم إرسال هذه الرسالة من نموذج الاتصال في متجر دلتا ستارز.</p>
            `,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ SendGrid error:', errorText);
    } else {
      console.log('✅ Email notification sent successfully');
    }
  } catch (error) {
    console.error('❌ Failed to send email:', error);
  }
}

// --------------------------------------------
// 4. الدالة الرئيسية - معالج الطلب
// --------------------------------------------

export const handler: Handler = async (event) => {
  // 4.1 السماح فقط بـ POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Allow': 'POST' },
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  // 4.2 قراءة البيانات (دعم JSON و form-urlencoded)
  let body: Record<string, any> = {};
  try {
    if (event.headers['content-type']?.includes('application/json')) {
      body = JSON.parse(event.body || '{}');
    } else {
      const params = new URLSearchParams(event.body || '');
      body = Object.fromEntries(params);
    }
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid request body' }),
    };
  }

  // 4.3 استخراج الحقول الأساسية
  const { name, email, subject, message, website, confirm_email } = body;

  // 4.4 التحقق من honeypot (حقل خفي لمنع البريد المزعج)
  if (website || confirm_email) {
    console.warn('⚠️ Spam detected: honeypot field was filled.');
    // نعيد نجاح وهمي للمتسلل ولكن لا نخزن البيانات
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'تم استلام رسالتك بنجاح' }),
    };
  }

  // 4.5 التحقق من وجود جميع الحقول المطلوبة
  if (!name || !email || !subject || !message) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'جميع الحقول مطلوبة' }),
    };
  }

  // 4.6 التحقق من صحة البريد الإلكتروني
  if (!isValidEmail(email)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'البريد الإلكتروني غير صحيح' }),
    };
  }

  // 4.7 التحقق من طول النصوص
  if (!isValidLength(name, 100) || !isValidLength(subject, 200) || !isValidLength(message, 2000)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'بعض الحقول تجاوزت الحد المسموح' }),
    };
  }

  // 4.8 تنظيف النصوص من الأحرف الضارة
  const cleanName = sanitizeInput(name);
  const cleanEmail = sanitizeInput(email);
  const cleanSubject = sanitizeInput(subject);
  const cleanMessage = sanitizeInput(message);

  // 4.9 تسجيل البيانات في قاعدة البيانات (Supabase)
  try {
    const { data, error } = await supabase
      .from('contact_submissions')
      .insert({
        name: cleanName,
        email: cleanEmail,
        subject: cleanSubject,
        message: cleanMessage,
        ip_address: event.headers['x-forwarded-for'] || event.headers['client-ip'] || null,
        user_agent: event.headers['user-agent'] || null,
        created_at: new Date().toISOString(),
      })
      .select();

    if (error) {
      console.error('❌ Supabase insert error:', error);
      // لا نوقف التنفيذ هنا، نستمر في إرسال الإشعار
    } else {
      console.log('✅ Contact form submission stored in Supabase');
    }
  } catch (error) {
    console.error('❌ Database error:', error);
    // نكمل التنفيذ
  }

  // 4.10 إرسال إشعار عبر البريد الإلكتروني (اختياري)
  await sendEmailNotification({
    name: cleanName,
    email: cleanEmail,
    subject: cleanSubject,
    message: cleanMessage,
  });

  // 4.11 إرجاع استجابة نجاح
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*', // إذا كنت تريد السماح بـ CORS
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    },
    body: JSON.stringify({
      success: true,
      message: 'تم استلام رسالتك بنجاح. سنتواصل معك قريباً.',
    }),
  };
};

// دعم طلب OPTIONS لـ CORS
export const handlerOptions: Handler = async () => {
  return {
    statusCode: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
    body: '',
  };
};

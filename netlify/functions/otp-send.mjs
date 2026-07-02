// Netlify Function: POST /api/otp/send  (mapped via _redirects / netlify.toml)
// Sends an SMS OTP through Authentica.sa. Stateless — Authentica generates,
// stores and verifies the code, so this works on serverless with no DB.
const AUTHENTICA = "https://api.authentica.sa";
// Authentica auth value goes in the `X-Authorization` header. In this project the
// working credential is AUTHENTICA_API_SECRET; fall back to AUTHENTICA_API_KEY.
const CRED = process.env.AUTHENTICA_API_SECRET || process.env.AUTHENTICA_API_KEY || "";

function normalizePhone(raw) {
  const d = String(raw || "").replace(/\D/g, "");
  if (d.startsWith("966")) return "+" + d;
  if (d.startsWith("05")) return "+966" + d.slice(1);
  if (d.startsWith("5") && d.length === 9) return "+966" + d;
  return "+" + d;
}
function isValidSaudi(raw) {
  const d = String(raw || "").replace(/\D/g, "");
  return /^(05\d{8}|9665\d{8}|5\d{8})$/.test(d);
}
const json = (status, obj) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });

export default async (req) => {
  if (req.method !== "POST") return json(405, { success: false, error: "Method not allowed" });

  let body = {};
  try { body = await req.json(); } catch { /* empty body */ }

  const phone = body.phone;
  if (!phone) return json(400, { success: false, error: "رقم الجوال مطلوب" });
  if (!isValidSaudi(phone)) return json(400, { success: false, error: "رقم الجوال غير صحيح. مثال: 0512345678" });
  if (!CRED) return json(500, { success: false, error: "خدمة الرسائل غير مهيأة على الخادم (AUTHENTICA_API_SECRET مفقود)" });

  const normalized = normalizePhone(phone);

  try {
    const r = await fetch(`${AUTHENTICA}/api/v1/send-otp`, {
      method: "POST",
      headers: {
        "X-Authorization": CRED,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({ method: "sms", phone: normalized }),
    });
    const data = await r.json().catch(() => ({}));
    // Treat a 200 that carries a failure flag as a real failure, not a success.
    const ok = r.ok && data.success !== false && data.status !== false;
    if (!ok) {
      return json(502, { success: false, error: data.message || "فشل إرسال رمز التحقق. حاول مجدداً." });
    }
    return json(200, { success: true, message: "تم إرسال رمز التحقق بنجاح", expiresIn: 300 });
  } catch {
    return json(500, { success: false, error: "تعذّر الاتصال بخدمة الرسائل" });
  }
};

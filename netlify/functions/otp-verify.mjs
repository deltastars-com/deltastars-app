// Netlify Function: POST /api/otp/verify
// Verifies the SMS OTP through Authentica.sa. Returns the same contract the
// frontend (authService.verifyOTPAndSignIn) expects: { success, verified, user }.
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
  const code = body.code != null ? String(body.code) : "";
  if (!phone || !code) return json(400, { success: false, error: "رقم الجوال والرمز مطلوبان" });
  if (!isValidSaudi(phone)) return json(400, { success: false, error: "رقم الجوال غير صحيح" });
  if (!/^\d{4,6}$/.test(code)) return json(400, { success: false, error: "رمز التحقق يجب أن يكون 4-6 أرقام" });
  if (!CRED) return json(500, { success: false, error: "خدمة الرسائل غير مهيأة على الخادم (AUTHENTICA_API_SECRET مفقود)" });

  const normalized = normalizePhone(phone);

  try {
    const r = await fetch(`${AUTHENTICA}/api/v1/verify-otp`, {
      method: "POST",
      headers: {
        "X-Authorization": CRED,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({ phone: normalized, otp: code }),
    });
    const data = await r.json().catch(() => ({}));
    // Authentica returns { status:false } on a genuine wrong/expired code (HTTP
    // 422). A 200 with no explicit false flag is a successful verification.
    const verified =
      r.ok && data.status !== false && data.success !== false && data.verified !== false;
    if (!verified) {
      // A provider/config error (401/403/5xx) must NOT be shown as a wrong code.
      if (!r.ok && r.status !== 422) {
        return json(502, { success: false, error: "تعذّر التحقق من الرمز حالياً. حاول مجدداً." });
      }
      return json(422, { success: false, error: data.message || "رمز التحقق غير صحيح أو منتهي الصلاحية" });
    }
    return json(200, {
      success: true,
      verified: true,
      phone: normalized,
      user: { phone: normalized, role: "customer", verified: true },
    });
  } catch {
    return json(500, { success: false, error: "تعذّر الاتصال بخدمة التحقق" });
  }
};

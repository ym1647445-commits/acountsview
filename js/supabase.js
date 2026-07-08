// ===============================
// DevPlay Accounts Store - Supabase
// ===============================

// غيري القيمتين دول ببيانات مشروعك من Supabase
const SUPABASE_URL = "https://yzmliqhbmgpciejbkibe.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6bWxpcWhibWdwY2llamJraWJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0NTkxNzYsImV4cCI6MjA5OTAzNTE3Nn0.lOwZtSFPXrDJOILE4LTBQC_FBtdMQ-Q0oaXTlOuyJHg";

// رقم واتساب DevPlay Studio
const DEVPLAY_WHATSAPP = "201035966569";

const STORAGE_BUCKETS = {
  accounts: "account-images",
  documents: "seller-documents",
  pdfs: "sale-pdfs",
  videos: "account-videos"
};

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function safeText(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function money(value) {
  const n = Number(value || 0);
  const lang = localStorage.getItem("dp_lang") || "ar";
  return lang === "en" ? `${n.toLocaleString()} EGP` : `${n.toLocaleString()} جنيه`;
}

function statusText(status) {
  const lang = localStorage.getItem("dp_lang") || "ar";
  if (lang === "en") {
    if (status === "available") return "Available";
    if (status === "reserved") return "Reserved";
    if (status === "sold") return "Sold";
    return status || "";
  }
  if (status === "available") return "متاح";
  if (status === "reserved") return "محجوز";
  if (status === "sold") return "تم البيع";
  return status || "";
}

function fallbackImage() {
  return "assets/placeholder.svg";
}

function cleanStoragePath(img) {
  if (!img) return "";
  let path = String(img);

  if (path.includes("/storage/v1/object/public/account-images/")) {
    path = path.split("/storage/v1/object/public/account-images/")[1];
  }

  if (path.includes("/storage/v1/object/sign/account-images/")) {
    path = path.split("/storage/v1/object/sign/account-images/")[1].split("?")[0];
  }

  if (path.startsWith("account-images/")) {
    path = path.replace("account-images/", "");
  }

  return path;
}

async function getAccountImageUrl(img) {
  if (!img) return fallbackImage();

  img = String(img);

  if (img.startsWith("http")) return img;

  const path = cleanStoragePath(img);

  try {
    const signed = await db.storage
      .from(STORAGE_BUCKETS.accounts)
      .createSignedUrl(path, 60 * 60);

    if (!signed.error && signed.data && signed.data.signedUrl) {
      return signed.data.signedUrl;
    }
  } catch (e) {
    console.warn("Signed image failed", e);
  }

  try {
    const publicUrl = db.storage
      .from(STORAGE_BUCKETS.accounts)
      .getPublicUrl(path);

    return publicUrl?.data?.publicUrl || fallbackImage();
  } catch (e) {
    return fallbackImage();
  }
}

function whatsappOrderUrl(account) {
  const price = account.sell_price || account.price || 0;
  const text = `مرحبًا DevPlay Studio\nأريد طلب هذا الحساب:\n\nكود الحساب: ${account.code || ""}\nاللعبة: ${account.game || ""}\nاسم الحساب: ${account.account_name || ""}\nالسعر: ${price} جنيه\n\nهل الحساب متاح؟`;
  return `https://wa.me/${DEVPLAY_WHATSAPP}?text=${encodeURIComponent(text)}`;
}


function cleanVideoPath(value) {
  if (!value) return "";
  let path = String(value);
  if (path.includes("/storage/v1/object/public/account-videos/")) {
    path = path.split("/storage/v1/object/public/account-videos/")[1];
  }
  if (path.includes("/storage/v1/object/sign/account-videos/")) {
    path = path.split("/storage/v1/object/sign/account-videos/")[1].split("?")[0];
  }
  if (path.startsWith("account-videos/")) {
    path = path.replace("account-videos/", "");
  }
  return path;
}

async function getAccountVideoUrl(video) {
  if (!video) return "";
  video = String(video);
  if (video.startsWith("http")) return video;
  const path = cleanVideoPath(video);
  try {
    const signed = await db.storage.from(STORAGE_BUCKETS.videos).createSignedUrl(path, 60 * 60);
    if (!signed.error && signed.data && signed.data.signedUrl) return signed.data.signedUrl;
  } catch (e) {
    console.warn("Signed video failed", e);
  }
  try {
    return db.storage.from(STORAGE_BUCKETS.videos).getPublicUrl(path)?.data?.publicUrl || "";
  } catch (e) {
    return "";
  }
}

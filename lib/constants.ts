export const REDEEM_PRODUCT_NAME = "Series Sarimbit";
export const REDEEM_PRODUCT_REFERENCE_PRICE = 299000;

export const CONTENT_REQUIREMENTS = [
  "Konten orisinal (bukan repost/reupload)",
  "Series Agustin harus terlihat jelas di konten",
  "Wajib mention @aurorahijab.co",
  "Akun harus dapat diakses untuk keperluan verifikasi",
  "Khusus Reels: minimal 30 detik dan menunjukkan effort yang jelas",
] as const;

export const ROUTES = {
  home: "/",
  login: "/login",
  register: "/register",
  agentLogin: "/agent-login",
  adminLogin: "/admin-login",
  customerDashboard: "/customer/dashboard",
  agentDashboard: "/agent/dashboard",
  adminOverview: "/admin",
} as const;

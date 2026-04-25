import withPWA from "next-pwa";

const pwaDisabled = process.env.NEXT_PUBLIC_DISABLE_PWA === "true";

const publicApiBase = process.env.NEXT_PUBLIC_API_BASE_URL;
const derivedDjangoApi =
  publicApiBase?.replace(/\/api\/?$/, "") ?? "http://localhost:8001";
const DJANGO_API = process.env.DJANGO_API_URL ?? derivedDjangoApi;

const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      { source: "/borrowers", destination: "/loans/borrowers", permanent: false },
      { source: "/borrowers/:path*", destination: "/loans/borrowers/:path*", permanent: false },
      { source: "/collections", destination: "/loans/collections", permanent: false },
      { source: "/collections/:path*", destination: "/loans/collections/:path*", permanent: false },
      { source: "/reports", destination: "/loans/reports", permanent: false },
      { source: "/reports/:path*", destination: "/loans/reports/:path*", permanent: false },
      { source: "/overdue", destination: "/loans/overdue", permanent: false },
      { source: "/udhaar", destination: "/udhaarbook", permanent: false },
      { source: "/udhaar/:path*", destination: "/udhaarbook/:path*", permanent: false },
      { source: "/customer-ledger", destination: "/udhaarbook", permanent: false },
      { source: "/customer-ledger/:path*", destination: "/udhaarbook/:path*", permanent: false },
    ];
  },
  async rewrites() {
    return [
      {
        // Proxy all /api/* requests to Django so the browser sees them as
        // same-origin — this is what makes httpOnly cookies work without
        // needing SameSite=None + HTTPS in development.
        source: "/api/:path*",
        // Preserve Django-style trailing slashes for POST/PATCH endpoints.
        destination: `${DJANGO_API}/api/:path*/`,
      },
      { source: "/loans/borrowers", destination: "/borrowers" },
      { source: "/loans/borrowers/:path*", destination: "/borrowers/:path*" },
      { source: "/loans/collections", destination: "/collections" },
      { source: "/loans/collections/:path*", destination: "/collections/:path*" },
      { source: "/loans/reports", destination: "/reports" },
      { source: "/loans/reports/:path*", destination: "/reports/:path*" },
      { source: "/loans/overdue", destination: "/overdue" },
    ];
  },
};

export default withPWA({
  dest: "public",
  disable: pwaDisabled,
  register: true,
  skipWaiting: true,
})(nextConfig);

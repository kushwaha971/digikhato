import withPWA from "next-pwa";

const isDev = process.env.NODE_ENV === "development";

const publicApiBase = process.env.NEXT_PUBLIC_API_BASE_URL;
const derivedDjangoApi =
  publicApiBase?.replace(/\/api\/?$/, "") ?? "http://localhost:8001";
const DJANGO_API = process.env.DJANGO_API_URL ?? derivedDjangoApi;

const nextConfig = {
  reactStrictMode: true,
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
    ];
  },
};

export default withPWA({
  dest: "public",
  disable: isDev,
  register: true,
  skipWaiting: true,
})(nextConfig);

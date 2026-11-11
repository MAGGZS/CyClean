/** @type {import('next').NextConfig} */
const apiUrl =
  process.env.API_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://descarta-api-fa7a.onrender.com"
    : "http://localhost:4000");

const nextConfig = {
  reactStrictMode: true,
  // Rewrites de todas as rotas /api/* para a API hospedada no Render
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl.replace(/\/+$/, "")}/api/:path*`,
      },
    ];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "i.ytimg.com",
      },
      {
        protocol: "https",
        hostname: "img.youtube.com",
      },
    ],
  },
};

export default nextConfig;

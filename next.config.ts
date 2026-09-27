import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    // Nosotros y Contacto viven ahora en una sola página.
    return [{ source: "/contacto", destination: "/sobre-nosotros#contacto", permanent: true }];
  },
};

export default nextConfig;

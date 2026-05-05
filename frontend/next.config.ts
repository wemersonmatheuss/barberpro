import type { NextConfig } from "next";

/** Redireciona chamadas do browser (mesmo host do Next) para a API — permite acesso pelo celular via IP da rede. */
const backendInternal =
  process.env.BACKEND_INTERNAL_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:3001";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendInternal}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;

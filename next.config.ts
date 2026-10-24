import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Adresses de la version à comptes famille, peut-être déjà partagées :
  // elles mènent désormais à la liste unique.
  async redirects() {
    return [
      { source: "/l/:token", destination: "/", permanent: false },
      { source: "/inscription", destination: "/", permanent: false },
    ];
  },
};

export default nextConfig;

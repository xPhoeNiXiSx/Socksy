import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // La photo d'une envie part avec le formulaire, réduite dans le navigateur.
  experimental: { serverActions: { bodySizeLimit: "4mb" } },

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

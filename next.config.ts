import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	//prueba 2
	experimental: {
		serverActions: {
			bodySizeLimit: "50mb",
		},
	},
};

export default nextConfig;

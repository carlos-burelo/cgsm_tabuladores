import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	//prueba 3
	experimental: {
		serverActions: {
			bodySizeLimit: "50mb",
		},
	},
};

export default nextConfig;

import { createSSOMiddleware } from "@cgsm/sso-client";

export const middleware = createSSOMiddleware({
	ssoUrl:
		process.env.NEXT_PUBLIC_SSO_URL ||
		process.env.SSO_URL ||
		"http://localhost:3000",
	ssoInternalUrl: process.env.SSO_URL,
	debug: true,
});

export const config = {
	matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

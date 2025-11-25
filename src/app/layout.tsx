import type { Metadata } from 'next'
import { IBM_Plex_Sans } from 'next/font/google'
import { ThemeProvider } from '@/components/ThemeProvider'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const geistSans = IBM_Plex_Sans({
	variable: '--font-ibm',
	subsets: ['latin'],
	weight: ['400', '500', '600', '700'],
	fallback: ['sans-serif'],
	adjustFontFallback: true,
	display: 'swap',
	preload: true,
})

export const metadata: Metadata = {
	title: 'Tabuladores',
	description: 'Herramienta minimalista para comparar servicios médicos de múltiples proveedores',
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html lang='es' suppressHydrationWarning>
			<body className={`${geistSans.variable} antialiased`}>
				<main className='w-full h-screen bg-background grid content-start sm:px-4 md:px-6 lg:px-8'>
					<ThemeProvider
						attribute='class'
						defaultTheme='system'
						enableSystem
						disableTransitionOnChange
					>
						{children}
					</ThemeProvider>
				</main>
				<Toaster richColors />
			</body>
		</html>
	)
}

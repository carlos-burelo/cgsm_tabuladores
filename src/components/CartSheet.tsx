'use client'

import { useEffect, useState, useRef } from 'react'
import { ShoppingCart, Trash2, Copy, Image as ImageIcon, Download } from 'lucide-react'
import { snapdom } from '@zumer/snapdom'
import { useCartStore } from '@/store/cartStore'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
	Sheet,
	SheetContent,
	SheetTitle,
	SheetTrigger,
} from '@/components/ui/sheet'
import { toast } from 'sonner'

export function CartSheet() {
	const [isOpen, setIsOpen] = useState(false)
	const [mounted, setMounted] = useState(false)
	const [isAnimating, setIsAnimating] = useState(false)
	const ticketRef = useRef<HTMLDivElement>(null)
	const buttonRef = useRef<HTMLButtonElement>(null)

	const items = useCartStore((state) => state.items)
	const removeItem = useCartStore((state) => state.removeItem)
	const getTotalPrice = useCartStore((state) => state.getTotalPrice)
	const getItemCount = useCartStore((state) => state.getItemCount)
	const clearCart = useCartStore((state) => state.clearCart)

	// Prevenir hidratación
	useEffect(() => {
		setMounted(true)
	}, [])

	// Animar el botón cuando se añade un item
	useEffect(() => {
		if (mounted && items.length > 0) {
			setIsAnimating(true)
			const timer = setTimeout(() => setIsAnimating(false), 600)
			return () => clearTimeout(timer)
		}
	}, [items.length, mounted])

	if (!mounted || items.length === 0) {
		return null
	}

	const totalPrice = getTotalPrice()
	const itemCount = getItemCount()

	const generateTextContent = () => {
		let text = '═══════════════════════════════════\n'
		text += '           COTIZACIÓN DE SERVICIOS\n'
		text += '═══════════════════════════════════\n\n'

		items.forEach((item, index) => {
			text += `${index + 1}. ${item.nombreEstandar}\n`
			text += `   Proveedor: ${item.proveedor}\n`
			if (item.concepto) {
				text += `   Concepto: ${item.concepto}\n`
			}
			text += `   Precio: $${item.precio.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n\n`
		})

		text += '───────────────────────────────────\n'
		text += `TOTAL: $${totalPrice.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`
		text += '═══════════════════════════════════\n'

		return text
	}

	const handleCopyText = async () => {
		try {
			await navigator.clipboard.writeText(generateTextContent())
			toast.success('Cotización copiada')
		} catch {
			toast.error('Error al copiar')
		}
	}

	const handleCopyImage = async () => {
		if (!ticketRef.current) return

		try {
			const toastId = toast.loading('Generando imagen...')

			// Crear un contenedor temporal con fondo blanco
			const tempContainer = document.createElement('div')
			tempContainer.style.position = 'fixed'
			tempContainer.style.left = '-9999px'
			tempContainer.style.background = 'white'
			tempContainer.style.padding = '24px'
			tempContainer.style.borderRadius = '8px'
			tempContainer.style.color = '#000'

			// Clonar el contenido
			const clone = ticketRef.current.cloneNode(true) as HTMLElement
			tempContainer.appendChild(clone)
			document.body.appendChild(tempContainer)

			// Capturar la imagen
			const dataUrl = await snapdom.toPng(tempContainer)
			const response = await fetch(dataUrl.src)
			const blob = await response.blob()

			// Limpiar
			document.body.removeChild(tempContainer)

			await navigator.clipboard.write([
				new ClipboardItem({
					'image/png': blob,
				}),
			])
			toast.dismiss(toastId)
			toast.success('Imagen copiada')
		} catch (error) {
			toast.error('Error al copiar imagen')
			console.error(error)
		}
	}

	const handleDownloadImage = async () => {
		if (!ticketRef.current) return

		try {
			const toastId = toast.loading('Generando imagen...')

			// Crear un contenedor temporal con fondo blanco
			const tempContainer = document.createElement('div')
			tempContainer.style.position = 'fixed'
			tempContainer.style.left = '-9999px'
			tempContainer.style.background = 'white'
			tempContainer.style.padding = '24px'
			tempContainer.style.borderRadius = '8px'
			tempContainer.style.color = '#000'

			// Clonar el contenido
			const clone = ticketRef.current.cloneNode(true) as HTMLElement
			tempContainer.appendChild(clone)
			document.body.appendChild(tempContainer)

			// Capturar la imagen
			const dataUrl = await snapdom.toPng(tempContainer)

			// Limpiar
			document.body.removeChild(tempContainer)

			const link = document.createElement('a')
			link.href = dataUrl.src
			link.download = `cotizacion-${Date.now()}.png`
			link.click()
			toast.dismiss(toastId)
			toast.success('Imagen descargada')
		} catch (error) {
			toast.error('Error al descargar')
			console.error(error)
		}
	}

	return (
		<Sheet open={isOpen} onOpenChange={setIsOpen}>
			<SheetTrigger asChild>
				<button
					ref={buttonRef}
					className='fixed bottom-6 right-6 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-40'
					title={`${itemCount} artículos en la cotización`}
				>
					<ShoppingCart className='w-6 h-6' />
					<span
						className={`absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center transition-all duration-300 ${
							isAnimating ? 'scale-125' : 'scale-100'
						}`}
					>
						{itemCount}
					</span>
				</button>
			</SheetTrigger>
			<SheetContent side='right' className='w-full sm:w-[450px] flex flex-col p-0 gap-0'>
				{/* Header con botones */}
				<div className='border-b px-6 py-4 shrink-0 space-y-3 grid grid-flow-col items-center'>
					<SheetTitle className='m-0'>Cotización ({itemCount})</SheetTitle>

					{/* Botones de compartir */}
					<div className='grid gap-2 grid-flow-col justify-end mr-4'>
						<Button
							size='icon'
							variant='outline'
							onClick={handleCopyText}
							className='h-9'
							title='Copiar como texto'
						>
							<Copy className='w-4 h-4' />
						</Button>
						<Button
							size='icon'
							variant='outline'
							onClick={handleCopyImage}
							className='h-9'
							title='Copiar como imagen'
						>
							<ImageIcon className='w-4 h-4' />
						</Button>
						<Button
							size='icon'
							variant='outline'
							onClick={handleDownloadImage}
							className='h-9'
							title='Descargar imagen'
						>
							<Download className='w-4 h-4' />
						</Button>
					</div>
				</div>

				{/* Items - Scrollable */}
				<ScrollArea className='flex-1 min-h-0'>
					<div className='divide-y' ref={ticketRef}>
						{items.map((item) => (
							<div key={item.id} className='px-6 py-4 space-y-2'>
								<div className='flex items-start justify-between gap-3'>
									<div className='flex-1 min-w-0'>
										<h3 className='font-medium text-sm'>{item.nombreEstandar}</h3>
										<p className='text-xs text-muted-foreground truncate'>{item.proveedor}</p>
									</div>
									<button
										onClick={() => removeItem(item.id)}
										className='p-1 text-destructive hover:bg-destructive/10 rounded transition-colors shrink-0'
										title='Eliminar'
									>
										<Trash2 className='w-4 h-4' />
									</button>
								</div>
								<p className='text-lg font-semibold text-primary'>
									${item.precio.toLocaleString('es-MX', {
										minimumFractionDigits: 2,
										maximumFractionDigits: 2,
									})}
								</p>
							</div>
						))}
					</div>
				</ScrollArea>

				{/* Footer - Total y limpiar */}
				<div className='border-t p-6 space-y-4 shrink-0 bg-muted/50'>
					{/* Total */}
					<div className='text-center space-y-1'>
						<p className='text-xs font-semibold text-muted-foreground uppercase'>Total</p>
						<p className='text-3xl font-bold text-primary'>
							${totalPrice.toLocaleString('es-MX', {
								minimumFractionDigits: 2,
								maximumFractionDigits: 2,
							})}
						</p>
					</div>

					{/* Limpiar */}
					<Button
						variant='ghost'
						size='sm'
						onClick={() => {
							clearCart()
							setIsOpen(false)
						}}
						className='w-full text-muted-foreground hover:text-foreground'
					>
						Limpiar cotización
					</Button>
				</div>
			</SheetContent>
		</Sheet>
	)
}

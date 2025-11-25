'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Header } from '@/components/SearchPageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { getServiceTypesAction, uploadFileAction } from '@/lib/actions'

interface ServiceType {
	id: number
	name: string
	description?: string | null
}

export default function UploadPage() {
	const [uploadedFiles, setUploadedFiles] = useState<string[]>([])
	const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([])
	const [selectedServiceType, setSelectedServiceType] = useState<number | null>(null)
	const [newServiceType, setNewServiceType] = useState('')
	const [showNewTypeInput, setShowNewTypeInput] = useState(false)
	const fileInputRef = useRef<HTMLInputElement>(null)
	const [isPending, startTransition] = useTransition()
	const [isLoading, setIsLoading] = useState(true)

	// Cargar tipos de servicio al montar
	useEffect(() => {
		const loadServiceTypes = async () => {
			try {
				const types = await getServiceTypesAction()
				setServiceTypes(types)
				if (types.length > 0) {
					setSelectedServiceType(types[0].id)
				}
			} catch (error) {
				console.error('Error loading service types:', error)
				toast.error('Error al cargar los tipos de servicio')
			} finally {
				setIsLoading(false)
			}
		}
		loadServiceTypes()
	}, [])

	const handleFileSelect = (file: File) => {
		if (!file.name.endsWith('.xlsx')) {
			toast.error('Por favor selecciona un archivo Excel (.xlsx)')
			return
		}

		if (!selectedServiceType && !newServiceType) {
			toast.error('Por favor selecciona o crea un tipo de servicio')
			return
		}

		startTransition(async () => {
			const formData = new FormData()
			formData.append('file', file)
			formData.append('serviceTypeId', String(selectedServiceType || ''))
			formData.append('newServiceType', newServiceType)

			const result = await uploadFileAction(formData)

			if (result.success) {
				toast.success(result.message)
				setUploadedFiles([...uploadedFiles, file.name])
				if (fileInputRef.current) {
					fileInputRef.current.value = ''
				}
				// Recargar tipos de servicio si se creó uno nuevo
				if (newServiceType) {
					const types = await getServiceTypesAction()
					setServiceTypes(types)
					if (types.length > 0) {
						setSelectedServiceType(types[types.length - 1].id)
					}
					setNewServiceType('')
					setShowNewTypeInput(false)
				}
			} else {
				toast.error(result.message)
			}
		})
	}

	const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault()
		e.stopPropagation()

		const files = e.dataTransfer.files
		if (files.length > 0) {
			handleFileSelect(files[0])
		}
	}

	const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault()
		e.stopPropagation()
	}

	if (isLoading) {
		return (
			<main className='h-screen grid grid-rows-[auto_1fr]'>
				<Header />
				<div className='flex items-center justify-center'>
					<div className='animate-spin rounded-full h-12 w-12 border-2 border-muted border-t-foreground'></div>
				</div>
			</main>
		)
	}

	return (
		<main className='h-screen grid grid-rows-[auto_1fr]'>
			<Header />
			<div className='overflow-y-auto max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
				{/* Selector de tipo de servicio */}
				<div className='mb-8 p-6 bg-muted rounded-lg border border-border'>
					<label
						htmlFor='service-type'
						className='block text-sm font-semibold text-foreground mb-3'
					>
						Tipo de Servicio
					</label>

					{!showNewTypeInput ? (
						<div className='flex gap-3'>
							<Select
								name='service-type'
								value={String(selectedServiceType || '')}
								onValueChange={(value) => setSelectedServiceType(Number(value))}
							>
								<SelectTrigger className='flex-1'>
									<SelectValue placeholder='-- Selecciona un tipo --' />
								</SelectTrigger>
								<SelectContent>
									{serviceTypes.map((type) => (
										<SelectItem key={type.id} value={String(type.id)}>
											{type.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<Button onClick={() => setShowNewTypeInput(true)} variant='default'>
								+ Nuevo
							</Button>
						</div>
					) : (
						<div className='flex gap-3'>
							<Input
								type='text'
								value={newServiceType}
								onChange={(e) => setNewServiceType(e.target.value)}
								placeholder='Nombre del nuevo tipo de servicio'
							/>
							<Button
								onClick={() => {
									setShowNewTypeInput(false)
									setNewServiceType('')
								}}
								variant='outline'
							>
								Cancelar
							</Button>
						</div>
					)}
				</div>

				<div
					onDrop={handleDrop}
					onDragOver={handleDragOver}
					className='border-2 border-dashed border-border rounded-xl p-12 text-center hover:border-foreground/50 hover:bg-muted/30 transition-all cursor-pointer bg-background'
					onKeyDown={() => fileInputRef.current?.click()}
				>
					<input
						ref={fileInputRef}
						type='file'
						accept='.xlsx'
						onChange={(e) => {
							const file = e.target.files?.[0]
							if (file) {
								handleFileSelect(file)
							}
						}}
						disabled={isPending}
						className='hidden'
					/>

					{isPending ? (
						<>
							<div className='animate-spin rounded-full h-12 w-12 border-2 border-muted border-t-foreground mx-auto mb-4'></div>
							<p className='text-foreground font-medium'>Cargando archivo...</p>
						</>
					) : (
						<>
							<svg
								className='w-12 h-12 mx-auto mb-4 text-muted-foreground'
								fill='none'
								stroke='currentColor'
								viewBox='0 0 24 24'
							>
								<title className='sr-only'>Upload File</title>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									strokeWidth={1.5}
									d='M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12'
								/>
							</svg>
							<p className='text-foreground font-medium mb-1'>
								Arrastra tu archivo aquí o haz clic para seleccionar
							</p>
							<p className='text-xs text-muted-foreground'>Solo archivos Excel (.xlsx)</p>
						</>
					)}
				</div>

				{uploadedFiles.length > 0 && (
					<div className='mt-8 pt-8 border-t border-border'>
						<h2 className='text-sm font-semibold text-foreground uppercase tracking-wide mb-4'>
							Archivos cargados:
						</h2>
						<ul className='space-y-2'>
							{uploadedFiles.map((file, i) => (
								<li
									key={i}
									className='text-sm text-muted-foreground flex items-center p-3 bg-background rounded-lg border border-green-200 '
								>
									<span className='inline-block w-2 h-2 bg-green-500 rounded-full mr-3'></span>
									<span className='text-green-700 font-medium'>{file}</span>
								</li>
							))}
						</ul>
					</div>
				)}
			</div>
		</main>
	)
}

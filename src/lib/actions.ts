'use server'

import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ensureDataDir, parseExcelFile } from '@/lib/excelParser'
import { prisma } from '@/lib/prisma'
import type { ComparisonResult } from '@/types/service'

function sanitizeQuery(query: string): string {
	return query
		.trim()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toUpperCase()
}

function calculateRelevance(text: string, query: string): number {
	const sanitizedText = sanitizeQuery(text)

	if (sanitizedText.startsWith(query)) {
		return 1000
	}

	if (sanitizedText === query) {
		return 900
	}

	const words = sanitizedText.split(/\s+/)
	if (words.some((word) => word.startsWith(query))) {
		return 800
	}

	if (sanitizedText.includes(query)) {
		return 500
	}

	return 0
}

export async function getServiceTypesAction(): Promise<
	{ id: number; name: string; description?: string | null }[]
> {
	try {
		const serviceTypes = await prisma.serviceType.findMany({
			select: {
				id: true,
				name: true,
				description: true,
			},
			orderBy: {
				createdAt: 'desc',
			},
		})
		return serviceTypes
	} catch (error) {
		console.error('Get service types error:', error)
		return []
	}
}

export async function searchServicesAction(
	query: string,
	serviceTypeId?: number,
): Promise<ComparisonResult[]> {
	if (!query.trim()) {
		return []
	}

	try {
		const sanitizedQuery = sanitizeQuery(query)
		const services = await prisma.service.findMany({
			where: {
				AND: [
					{
						OR: [
							{ nombreEstandar: { contains: sanitizedQuery } },
							{ concepto: { contains: sanitizedQuery } },
							{ proveedor: { contains: sanitizedQuery } },
						],
					},
					serviceTypeId ? { serviceTypeId } : {},
				],
			},
		})

		type ServicesMap = Record<string, typeof services>
		const grouped = services.reduce<ServicesMap>(
			(acc: ServicesMap, service: (typeof services)[0]) => {
				const groupKey = service.nombreEstandar || service.concepto
				if (!acc[groupKey]) {
					acc[groupKey] = []
				}
				acc[groupKey].push(service)
				return acc
			},
			{},
		)

		const resultsWithScore = Object.entries(grouped)
			.map(([nombreEstandar, servicios]: [string, typeof services]) => {
				const uniqueServicesByProvider = new Map()
				for (const service of servicios) {
					if (!uniqueServicesByProvider.has(service.proveedor)) {
						uniqueServicesByProvider.set(service.proveedor, service)
					}
				}

				const sortedServicios = Array.from(uniqueServicesByProvider.values()).sort(
					(a, b) => a.precio - b.precio,
				)

				let relevanceScore = calculateRelevance(nombreEstandar, sanitizedQuery)

				if (relevanceScore === 0) {
					for (const service of servicios) {
						const conceptScore = calculateRelevance(service.concepto, sanitizedQuery)
						const proveedorScore = calculateRelevance(service.proveedor, sanitizedQuery)

						const maxScore = Math.max(conceptScore, proveedorScore)
						if (maxScore > 0) {
							relevanceScore = maxScore - 50
							break
						}
					}
				}

				const result: ComparisonResult = {
					nombreEstandar,
					servicios: sortedServicios.map((s: (typeof services)[0]) => ({
						proveedor: s.proveedor,
						precio: s.precio,
						concepto: s.concepto,
					})),
					precioMinimo: 0,
					precioMaximo: 0,
					promedio: 0,
				}

				return { result, relevanceScore }
			})

			.sort((a, b) => b.relevanceScore - a.relevanceScore)

			.map(({ result }) => result)

		return resultsWithScore
	} catch (error) {
		console.error('Search error:', error)
		return []
	}
}

export async function getUnclassifiedConceptsAction(
	serviceTypeId?: number,
): Promise<{ id: number; name: string; proveedor: string; precio: number }[]> {
	try {
		const services = await prisma.service.findMany({
			where: {
				nombreEstandar: '',
				...(serviceTypeId && { serviceTypeId }),
			},
			select: {
				id: true,
				concepto: true,
				proveedor: true,
				precio: true,
			},
		})

		return services.map((s) => ({
			id: s.id,
			name: s.concepto,
			proveedor: s.proveedor,
			precio: s.precio,
		}))
	} catch (error) {
		console.error('Get unclassified concepts error:', error)
		return []
	}
}

export async function saveConceptClassificationAction(
	conceptIds: number[],
	standardName: string,
): Promise<{ success: boolean; message: string }> {
	try {
		await prisma.service.updateMany({
			where: {
				id: {
					in: conceptIds,
				},
			},
			data: {
				nombreEstandar: standardName,
			},
		})

		return { success: true, message: 'Clasificación guardada correctamente' }
	} catch (error) {
		console.error('Save concept classification error:', error)
		return { success: false, message: 'Error al guardar la clasificación' }
	}
}

export async function deleteClassificationAction(
	conceptIds: number[],
): Promise<{ success: boolean; message: string }> {
	try {
		await prisma.service.updateMany({
			where: {
				id: {
					in: conceptIds,
				},
			},
			data: {
				nombreEstandar: '',
			},
		})

		return { success: true, message: 'Clasificación eliminada correctamente' }
	} catch (error) {
		console.error('Delete classification error:', error)
		return { success: false, message: 'Error al eliminar la clasificación' }
	}
}

export async function deleteClassifiedItemAction(
	conceptId: number,
): Promise<{ success: boolean; message: string }> {
	try {
		await prisma.service.update({
			where: {
				id: conceptId,
			},
			data: {
				nombreEstandar: '',
			},
		})

		return { success: true, message: 'Elemento eliminado de la clasificación' }
	} catch (error) {
		console.error('Delete classified item error:', error)
		return { success: false, message: 'Error al eliminar el elemento' }
	}
}

export async function getClassifiedConceptsAction(
	searchQuery: string,
	serviceTypeId?: number,
): Promise<
	{
		standardName: string
		concepts: { id: number; name: string; proveedor: string; precio: number }[]
	}[]
> {
	try {
		if (!searchQuery.trim()) {
			return []
		}

		const services = await prisma.service.findMany({
			where: {
				nombreEstandar: {
					not: '',
					contains: searchQuery.trim(),
				},
				...(serviceTypeId && { serviceTypeId }),
			},
			select: {
				id: true,
				concepto: true,
				nombreEstandar: true,
				proveedor: true,
				precio: true,
			},
		})

		// Agrupar por nombreEstandar
		type GroupedServices = Record<
			string,
			{ id: number; name: string; proveedor: string; precio: number }[]
		>
		const grouped = services.reduce<GroupedServices>((acc, service) => {
			if (!acc[service.nombreEstandar]) {
				acc[service.nombreEstandar] = []
			}
			acc[service.nombreEstandar].push({
				id: service.id,
				name: service.concepto,
				proveedor: service.proveedor,
				precio: service.precio,
			})
			return acc
		}, {})

		// Convertir a array de grupos
		const classifiedGroups = Object.entries(grouped).map(([standardName, concepts]) => ({
			standardName,
			concepts,
		}))

		return classifiedGroups
	} catch (error) {
		console.error('Get classified concepts error:', error)
		return []
	}
}

export async function uploadFileAction(
	formData: FormData,
): Promise<{ success: boolean; message: string; servicesCount?: number }> {
	try {
		const file = formData.get('file') as File
		const serviceTypeId = formData.get('serviceTypeId') as string
		const newServiceTypeName = formData.get('newServiceType') as string

		if (!file) {
			return { success: false, message: 'No file provided' }
		}

		if (!file.name.endsWith('.xlsx')) {
			return { success: false, message: 'Only .xlsx files are supported' }
		}

		if (!serviceTypeId && !newServiceTypeName) {
			return { success: false, message: 'Must select or create a service type' }
		}

		// Determinar el tipo de servicio a usar
		let finalServiceTypeId: number

		if (newServiceTypeName) {
			// Crear nuevo tipo de servicio
			const newServiceType = await prisma.serviceType.create({
				data: {
					name: newServiceTypeName,
				},
			})
			finalServiceTypeId = newServiceType.id
		} else {
			finalServiceTypeId = parseInt(serviceTypeId, 10)
		}

		ensureDataDir()
		const bytes = await file.arrayBuffer()
		const buffer = Buffer.from(bytes)

		const uploadDir = join(process.cwd(), 'public', 'uploads')
		const filePath = join(uploadDir, file.name)

		await writeFile(filePath, buffer)

		await new Promise((resolve) => setTimeout(resolve, 200))

		let parsed: {
			services: Array<{
				concepto: string
				precio: number
				proveedor: string
				nombreEstandar: string
			}>
		}
		try {
			parsed = parseExcelFile(filePath)
		} catch (parseError) {
			console.error('Parse error after upload:', parseError)

			return {
				success: true,
				message: `${file.name} cargado correctamente (sin previsualización)`,
				servicesCount: 0,
			}
		}

		const createdServices = await prisma.service.createMany({
			data: parsed.services.map((service) => ({
				concepto: service.concepto,
				precio: service.precio,
				proveedor: service.proveedor,
				nombreEstandar: service.nombreEstandar,
				serviceTypeId: finalServiceTypeId,
			})),
		})

		return {
			success: true,
			message: `${file.name} cargado correctamente`,
			servicesCount: createdServices.count,
		}
	} catch (error) {
		console.error('Upload error:', error)
		return { success: false, message: 'Error al cargar el archivo' }
	}
}

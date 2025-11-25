import * as fs from 'node:fs'
import * as path from 'node:path'
import * as XLSX from 'xlsx'
import type { ServiceFile, ServiceRow } from '@/types/service'

const DATA_DIR = path.join(process.cwd(), 'public', 'uploads')

function sanitizeText(text: string): string {
	return text
		.trim()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/\s+/g, ' ')
		.toUpperCase()
		.trim()
}

export function ensureDataDir() {
	if (!fs.existsSync(DATA_DIR)) {
		fs.mkdirSync(DATA_DIR, { recursive: true })
	}
}

export function parseExcelFile(filePath: string): ServiceFile {
	let workbook: XLSX.WorkBook
	try {
		const fileBuffer = fs.readFileSync(filePath)
		workbook = XLSX.read(fileBuffer, { type: 'buffer' })
	} catch (error) {
		throw new Error(`Failed to read Excel file: ${error}`)
	}

	const worksheet = workbook.Sheets[workbook.SheetNames[0]]
	const data: ServiceRow[] = XLSX.utils.sheet_to_json(worksheet, {
		defval: '',
		blankrows: false,
		header: 1,
	})

	const services: ServiceRow[] = []

	if (data.length > 1) {
		const CONCEPTO_IDX = 0
		const PRECIO_IDX = 1
		const PROVEEDOR_IDX = 2
		const NOMBRE_ESTANDAR_IDX = 3

		for (let i = 1; i < data.length; i++) {
			const row = data[i] as unknown as (string | number)[]

			if (row.length > 0 && row[0]) {
				const concepto = sanitizeText(row[CONCEPTO_IDX]?.toString() || '')
				const nombreEstandar = sanitizeText(row[NOMBRE_ESTANDAR_IDX]?.toString() || '')

				if (concepto) {
					const service: ServiceRow = {
						concepto: concepto,
						precio: parseFloat(row[PRECIO_IDX]?.toString() || '0') || 0,
						proveedor: sanitizeText(row[PROVEEDOR_IDX]?.toString() || ''),
						nombreEstandar: nombreEstandar,
					}

					services.push(service)
				}
			}
		}
	}

	return {
		fileName: path.basename(filePath),
		services,
		uploadedAt: new Date().toISOString(),
	}
}

export function deleteFile(fileName: string) {
	ensureDataDir()
	const filePath = path.join(DATA_DIR, fileName)

	if (fs.existsSync(filePath) && filePath.startsWith(DATA_DIR)) {
		fs.unlinkSync(filePath)
	}
}

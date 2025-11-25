export interface ServiceRow {
  concepto: string;
  precio: number;
  proveedor: string;
  nombreEstandar: string;
}

export interface ServiceFile {
  fileName: string;
  services: ServiceRow[];
  uploadedAt: string;
}

export interface ComparisonResult {
  nombreEstandar: string;
  servicios: Array<{
    proveedor: string;
    precio: number;
    concepto: string;
  }>;
  precioMinimo: number;
  precioMaximo: number;
  promedio: number;
}

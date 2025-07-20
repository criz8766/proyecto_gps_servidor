// frontend/src/api/informes.ts

/**
 * Descarga el reporte de ventas en un rango de fechas.
 * @param token El token de acceso JWT del usuario.
 * @param fechaInicio La fecha de inicio para el reporte (formato YYYY-MM-DD).
 * @param fechaFin La fecha de fin para el reporte (formato YYYY-MM-DD).
 * @returns Una promesa que resuelve en un Blob (el archivo Excel).
 */
export const descargarReporteVentas = async (
  token: string,
  fechaInicio: string,
  fechaFin: string
): Promise<Blob> => {

  const params = new URLSearchParams({
    fecha_inicio: fechaInicio,
    fecha_fin: fechaFin,
  });

  // Usamos una ruta relativa que será interceptada por nuestro proxy de Nginx
  const response = await fetch(`/api/informes/ventas/excel?${params.toString()}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    // Si hay un error, intentamos leer el cuerpo como JSON para un mensaje más claro
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Error al generar el reporte.');
  }

  // La respuesta es el archivo, lo devolvemos como un "Blob"
  return response.blob();
};



/**
 * Descarga el reporte de los productos más vendidos en un rango de fechas.
 * @param token El token de acceso JWT del usuario.
 * @param fechaInicio La fecha de inicio del reporte.
 * @param fechaFin La fecha de fin del reporte.
 * @param limite El número de productos a incluir en el top (ej: 10).
 * @returns Una promesa que resuelve en un Blob (el archivo Excel).
 */
export const descargarTopVendidos = async (
  token: string,
  fechaInicio: string,
  fechaFin: string,
  limite: number
): Promise<Blob> => {

  const params = new URLSearchParams({
    fecha_inicio: fechaInicio,
    fecha_fin: fechaFin,
    limite: limite.toString(),
  });

  const response = await fetch(`/api/informes/productos/top-vendidos/excel?${params.toString()}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Error al generar el reporte de top vendidos.');
  }

  return response.blob();
};



/**
 * Descarga el reporte de productos con stock por debajo de un umbral.
 * @param token El token de acceso JWT del usuario.
 * @param umbral El nivel de stock mínimo para generar la alerta.
 * @returns Una promesa que resuelve en un Blob (el archivo Excel).
 */
export const descargarAlertasStock = async (
  token: string,
  umbral: number
): Promise<Blob> => {

  const params = new URLSearchParams({
    umbral: umbral.toString(),
  });

  const response = await fetch(`/api/informes/stock/alertas/excel?${params.toString()}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Error al generar el reporte de alertas de stock.');
  }

  return response.blob();
};



/**
 * Descarga el reporte de productos sin ventas desde una fecha de inicio.
 * @param token El token de acceso JWT del usuario.
 * @param fechaInicio La fecha desde la cual buscar la falta de movimiento.
 * @returns Una promesa que resuelve en un Blob (el archivo Excel).
 */
export const descargarSinMovimiento = async (
  token: string,
  fechaInicio: string
): Promise<Blob> => {
  
  const params = new URLSearchParams({
    fecha_inicio: fechaInicio,
  });

  const response = await fetch(`/api/informes/productos/sin-movimiento/excel?${params.toString()}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Error al generar el reporte de productos sin movimiento.');
  }

  return response.blob();
};

// frontend/src/api/compras.ts

// Interfaces que reflejan los esquemas de tu backend (inventario/app/schemas.py)
export interface DetalleOrdenCompraCreate {
    producto_id: number;
    cantidad: number;
    precio_compra: number; // El precio al que se compra el producto
}

export interface OrdenCompraCreate {
    proveedor: string;
    detalles: DetalleOrdenCompraCreate[];
}

export interface DetalleOrdenCompra {
    id: number;
    orden_id: number;
    producto_id: number;
    cantidad: number;
    precio_compra: number;
    subtotal: number;
}

export interface OrdenCompra {
    id: number;
    proveedor: string;
    fecha_creacion: string; // La fecha vendrá como string ISO del backend
    estado: string; // Ej: "pendiente", "recibida"
    detalles: DetalleOrdenCompra[];
}

// URL base del microservicio de Inventario para las rutas de compras
// Asegúrate de que esta URL sea correcta según tu configuración de Nginx
const API_URL_COMPRAS = process.env.REACT_APP_INVENTARIO_API_URL || "http://localhost:8001/api/inventario";

// Función genérica para manejar las llamadas fetch con token y errores
async function fetchAPI<T>(url: string, token: string, options: RequestInit = {}): Promise<T> {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`, // Cabecera de autenticación
        ...options.headers,
    };

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
        if (response.status === 204 && options.method === 'DELETE') {
            return undefined as T;
        }
        const errorData = await response.json().catch(() => ({
            detail: `Error HTTP ${response.status} sin cuerpo JSON detallado.`
        }));
        console.error(`Error en la API (${url}):`, errorData);
        throw new Error(errorData.detail || `Error ${response.status} al llamar a la API`);
    }
    return response.status === 204 ? (undefined as T) : await response.json();
}

/**
 * Crea una nueva orden de compra en el backend.
 * @param orden La orden de compra a crear.
 * @param token El token de autenticación del usuario.
 * @returns La orden de compra creada con su ID y fecha.
 */
export const crearOrdenCompraAPI = async (orden: OrdenCompraCreate, token: string): Promise<OrdenCompra> => {
    return fetchAPI<OrdenCompra>(`${API_URL_COMPRAS}/compras/`, token, {
        method: 'POST',
        body: JSON.stringify(orden),
    });
};

/**
 * Marca una orden de compra como recibida y actualiza el stock.
 * @param ordenId El ID de la orden de compra a marcar como recibida.
 * @param token El token de autenticación del usuario.
 * @returns Un mensaje de confirmación.
 */
export const recibirOrdenCompraAPI = async (ordenId: number, token: string): Promise<{ mensaje: string }> => {
    return fetchAPI<{ mensaje: string }>(`${API_URL_COMPRAS}/compras/${ordenId}/recibir`, token, {
        method: 'POST', // Tu backend usa POST para recibir
    });
};

/**
 * Lista todas las órdenes de compra existentes.
 * @param token El token de autenticación del usuario.
 * @returns Una lista de órdenes de compra.
 */
export const listarOrdenesCompraAPI = async (token: string): Promise<OrdenCompra[]> => {
    return fetchAPI<OrdenCompra[]>(`${API_URL_COMPRAS}/compras/`, token);
};

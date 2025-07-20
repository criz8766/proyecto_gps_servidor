// frontend/src/api/inventario.ts

const API_URL = process.env.REACT_APP_INVENTARIO_API_URL || "http://localhost:8001/api/inventario";

// Interfaces para que TypeScript sepa cómo son los datos de un producto
export interface Producto {
    id: number;
    nombre: string;
    descripcion: string | null;
    precio_venta: number;
    stock: number;
}

export interface ProductoCreate {
    nombre: string;
    descripcion: string | null;
    precio_venta: number;
    stock: number;
}

export const listarProductosAPI = async (token: string): Promise<Producto[]> => {
    const response = await fetch(`${API_URL}/`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) {
        throw new Error("Error al obtener la lista de productos");
    }
    return response.json();
};

// Función para crear un nuevo producto
export const crearProductoAPI = async (producto: ProductoCreate, token: string): Promise<Producto> => {
    const response = await fetch(`${API_URL}/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(producto)
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Error al crear el producto");
    }
    return response.json();
};

// --- NUEVA FUNCIÓN PARA ACTUALIZAR ---
export const actualizarProductoAPI = async (id: number, productoData: ProductoCreate, token: string): Promise<Producto> => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(productoData)
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Error al actualizar el producto");
    }
    return response.json();
};

// --- NUEVA FUNCIÓN PARA ELIMINAR ---
export const eliminarProductoAPI = async (id: number, token: string): Promise<void> => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Error al eliminar el producto");
    }
};
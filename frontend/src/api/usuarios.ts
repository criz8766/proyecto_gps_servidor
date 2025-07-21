// frontend/src/api/usuarios.ts

export interface Usuario {
  id: number;
  email: string;
  nombre: string;
  rol: string; // Asumiendo roles como "administrador", "vendedor", "cajero", etc.
}

export interface UsuarioCreate {
  email: string;
  password?: string; // La contraseña es necesaria al crear, opcional al actualizar
  nombre: string;
  rol: string;
}

// URL base del microservicio de Usuarios. Asegúrate de que coincida con tu configuración de Nginx y Docker.
const API_URL = process.env.REACT_APP_USUARIOS_API_URL || "http://localhost:8002/api/usuarios";

// Función genérica para manejar las llamadas fetch con token y errores
async function fetchAPI<T>(url: string, token: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`, // Cabecera de autenticación
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    // Para DELETE con 204 (No Content), response.json() fallará.
    if (response.status === 204 && options.method === 'DELETE') {
      return undefined as T; // O un valor que indique éxito para DELETE
    }
    // Intenta parsear el error del backend
    const errorData = await response.json().catch(() => ({ 
      detail: `Error HTTP ${response.status} sin cuerpo JSON detallado.` 
    }));
    console.error(`Error en la API (${url}):`, errorData);
    throw new Error(errorData.detail || `Error ${response.status} al llamar a la API`);
  }
  // Para DELETE con 204, no hay cuerpo JSON que parsear.
  return response.status === 204 ? (undefined as T) : await response.json();
}

// Funciones CRUD para Usuarios
export async function listarUsuariosAPI(token: string): Promise<Usuario[]> {
  return fetchAPI<Usuario[]>(`${API_URL}/`, token);
}

export async function crearUsuarioAPI(usuario: UsuarioCreate, token: string): Promise<Usuario> {
  return fetchAPI<Usuario>(`${API_URL}/`, token, {
    method: 'POST',
    body: JSON.stringify(usuario),
  });
}

export async function actualizarUsuarioAPI(id: number, usuarioData: Partial<UsuarioCreate>, token: string): Promise<Usuario> {
  return fetchAPI<Usuario>(`${API_URL}/${id}`, token, {
    method: 'PUT',
    body: JSON.stringify(usuarioData),
  });
}

export async function eliminarUsuarioAPI(id: number, token: string): Promise<void> {
  await fetchAPI<void>(`${API_URL}/${id}`, token, {
    method: 'DELETE',
  });
}

export async function obtenerUsuarioPorIdAPI(id: number, token: string): Promise<Usuario> {
  return fetchAPI<Usuario>(`${API_URL}/${id}`, token);
}
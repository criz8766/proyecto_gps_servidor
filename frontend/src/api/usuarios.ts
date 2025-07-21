// frontend/src/api/usuarios.ts

export interface Usuario {
  user_id: string; // CAMBIO: De 'id: number' a 'user_id: string'
  email: string;
  nombre: string;
  rol: string; 
}

export interface UsuarioCreate {
  email: string;
  password?: string;
  nombre: string;
  rol: string;
}

const API_URL = process.env.REACT_APP_USUARIOS_API_URL || "http://localhost:8002/api/usuarios";

// Función genérica para manejar las llamadas fetch con token y errores
async function fetchAPI<T>(url: string, token: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
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

export async function listarUsuariosAPI(token: string): Promise<Usuario[]> {
  return fetchAPI<Usuario[]>(`${API_URL}/`, token);
}

export async function crearUsuarioAPI(usuario: UsuarioCreate, token: string): Promise<Usuario> {
  return fetchAPI<Usuario>(`${API_URL}/`, token, {
    method: 'POST',
    body: JSON.stringify(usuario),
  });
}

// CAMBIO: 'id' ahora es de tipo 'string'
export async function actualizarUsuarioAPI(id: string, usuarioData: Partial<UsuarioCreate>, token: string): Promise<Usuario> {
  return fetchAPI<Usuario>(`${API_URL}/${id}/rol`, token, { // ¡IMPORTANTE: Añadido '/rol' aquí!
    method: 'PUT',
    body: JSON.stringify(usuarioData),
  });
}

// CAMBIO: 'id' ahora es de tipo 'string'
export async function eliminarUsuarioAPI(id: string, token: string): Promise<void> {
  await fetchAPI<void>(`${API_URL}/${id}`, token, {
    method: 'DELETE',
  });
}

// CAMBIO: 'id' ahora es de tipo 'string'
export async function obtenerUsuarioPorIdAPI(id: string, token: string): Promise<Usuario> {
  return fetchAPI<Usuario>(`${API_URL}/${id}`, token);
}

export async function obtenerMiPerfilUsuarioAPI(token: string): Promise<Usuario> {
    return fetchAPI<Usuario>(`${API_URL}/perfil`, token);
}

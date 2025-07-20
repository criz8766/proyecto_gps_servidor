// frontend/src/api/pacientes.ts
export interface Paciente {
  id: number;
  nombre: string;
  rut: string;
  fecha_nacimiento: string;
}

export interface PacienteCreate { // También usado para datos de actualización
  nombre: string;
  rut: string;
  fecha_nacimiento: string;
}

export interface Dispensacion {
  id: number;
  paciente_id: number;
  producto_id: number; // Asumimos que guardas el ID del producto
  cantidad: number;
  fecha_dispensacion: string;
}

export interface DispensacionCreate {
  producto_id: number;
  cantidad: number;
}

const BASE_URL = process.env.REACT_APP_PACIENTES_API_URL || "http://localhost:8000/api/pacientes";

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

// --- Funciones CRUD que usan el token ---
export async function crearPacienteAPI(paciente: PacienteCreate, token: string): Promise<Paciente> {
  return fetchAPI<Paciente>(`${BASE_URL}/`, token, {
    method: 'POST',
    body: JSON.stringify(paciente),
  });
}

export async function listarPacientesAPI(token: string): Promise<Paciente[]> {
  return fetchAPI<Paciente[]>(`${BASE_URL}/`, token);
}

export async function actualizarPacienteAPI(id: number, pacienteData: PacienteCreate, token: string): Promise<Paciente> {
  return fetchAPI<Paciente>(`${BASE_URL}/${id}`, token, {
    method: 'PUT',
    body: JSON.stringify(pacienteData),
  });
}

export async function eliminarPacienteAPI(id: number, token: string): Promise<void> {
  await fetchAPI<void>(`${BASE_URL}/${id}`, token, {
    method: 'DELETE',
  });
}

export async function obtenerPacientePorIdAPI(id: number, token: string): Promise<Paciente> {
  return fetchAPI<Paciente>(`${BASE_URL}/${id}`, token);
}

export async function obtenerPacientePorRutAPI(rut: string, token: string): Promise<Paciente> {
  return fetchAPI<Paciente>(`${BASE_URL}/rut/${rut}`, token);
}

/**
 * Obtiene el historial de dispensaciones de un paciente específico.
 */
export async function obtenerDispensacionesAPI(pacienteId: number, token: string): Promise<Dispensacion[]> {
  return fetchAPI<Dispensacion[]>(`${BASE_URL}/${pacienteId}/dispensaciones`, token);
}

/**
 * Registra una nueva dispensación de medicamento para un paciente.
 */
export async function registrarDispensacionAPI(pacienteId: number, dispensacionData: DispensacionCreate, token: string): Promise<Dispensacion> {
  return fetchAPI<Dispensacion>(`${BASE_URL}/${pacienteId}/dispensaciones`, token, {
    method: 'POST',
    body: JSON.stringify(dispensacionData),
  });
}

/**
 * Verifica si existe una alerta para un medicamento y paciente específicos.
 */
export async function verificarAlertaAPI(pacienteId: number, productoId: number, token: string): Promise<{ alerta: boolean; mensaje: string }> {
    return fetchAPI<{ alerta: boolean; mensaje: string }>(`${BASE_URL}/${pacienteId}/dispensaciones/alerta?producto_id=${productoId}`, token);
}
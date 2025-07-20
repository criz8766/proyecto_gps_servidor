// frontend/src/components/ListarPacientes.tsx (Versión Completa y Reparada)

import React, { useState, useEffect, useCallback, FormEvent, ChangeEvent } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { 
  listarPacientesAPI, 
  actualizarPacienteAPI, 
  eliminarPacienteAPI, 
  Paciente, 
  PacienteCreate 
} from '../api/pacientes';
import FormularioPaciente from './FormularioPaciente';
import ModalHistorial from './ModalHistorial';
import './ListarPacientes.css';

const ListarPacientes: React.FC = () => {
  const { getAccessTokenSilently, isAuthenticated, isLoading: isLoadingAuth } = useAuth0();
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [mensaje, setMensaje] = useState('');
  const [cargandoLista, setCargandoLista] = useState(false);
  
  const [pacienteAEditar, setPacienteAEditar] = useState<Paciente | null>(null);
  const [mostrarModalEdicion, setMostrarModalEdicion] = useState(false);
  const [formDataEdicion, setFormDataEdicion] = useState<PacienteCreate>({
    nombre: '',
    rut: '',
    fecha_nacimiento: '',
  });
  const [isSubmittingEdicion, setIsSubmittingEdicion] = useState(false);

  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<Paciente | null>(null);

  const cargarPacientes = useCallback(async () => {
    if (!isAuthenticated) return;
    setCargandoLista(true);
    setMensaje('Cargando lista de pacientes...');
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: { audience: process.env.REACT_APP_AUTH0_API_AUDIENCE! },
      });
      const data = await listarPacientesAPI(token);
      setPacientes(data);
      setMensaje('');
    } catch (error: any) {
      console.error(error);
      setMensaje(error.message || 'Error desconocido al cargar pacientes');
      setPacientes([]);
    } finally {
      setCargandoLista(false);
    }
  }, [isAuthenticated, getAccessTokenSilently]);

  useEffect(() => {
    if (isAuthenticated) {
      cargarPacientes();
    } else {
      setPacientes([]);
      setMensaje('Inicia sesión para ver la lista de pacientes.');
    }
  }, [isAuthenticated, cargarPacientes]);

  // --- LÓGICA DE ELIMINAR (RESTAURADA) ---
  const handleEliminar = async (id: number, nombre: string) => {
    if (!isAuthenticated) {
      setMensaje('Debe iniciar sesión para realizar esta acción.');
      return;
    }
    if (window.confirm(`¿Estás seguro de que deseas eliminar a ${nombre}?`)) {
      setMensaje('Eliminando paciente...');
      try {
        const token = await getAccessTokenSilently({
          authorizationParams: { audience: process.env.REACT_APP_AUTH0_API_AUDIENCE! },
        });
        await eliminarPacienteAPI(id, token);
        setMensaje(`Paciente "${nombre}" eliminado exitosamente.`);
        cargarPacientes(); // Recargar la lista
      } catch (error: any) {
        console.error(error);
        setMensaje(error.message || 'Error desconocido al eliminar paciente');
      }
    }
  };

  // --- LÓGICA DE EDICIÓN (RESTAURADA) ---
  const abrirModalEdicion = (paciente: Paciente) => {
    setPacienteAEditar(paciente);
    setFormDataEdicion({
      nombre: paciente.nombre,
      rut: paciente.rut,
      fecha_nacimiento: paciente.fecha_nacimiento, // Ya viene en YYYY-MM-DD
    });
    setMostrarModalEdicion(true);
    setMensaje(''); 
  };

  const cerrarModalEdicion = () => {
    setMostrarModalEdicion(false);
    setPacienteAEditar(null);
  };

  const handleChangeEdicion = (e: ChangeEvent<HTMLInputElement>) => {
    setFormDataEdicion({ ...formDataEdicion, [e.target.name]: e.target.value });
  };

  const handleSubmitEdicion = async (e: FormEvent) => {
    e.preventDefault();
    if (!pacienteAEditar || !isAuthenticated) return;

    setIsSubmittingEdicion(true);
    setMensaje('Actualizando paciente...');
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: { audience: process.env.REACT_APP_AUTH0_API_AUDIENCE! },
      });
      await actualizarPacienteAPI(pacienteAEditar.id, formDataEdicion, token);
      setMensaje(`Paciente "${formDataEdicion.nombre}" actualizado exitosamente.`);
      cerrarModalEdicion();
      cargarPacientes(); 
    } catch (error: any) {
      console.error(error);
      setMensaje(error.message || 'Error desconocido al actualizar paciente');
    } finally {
      setIsSubmittingEdicion(false);
    }
  };

  // Funciones para manejar el nuevo modal de historial
  const abrirModalHistorial = (paciente: Paciente) => {
    setPacienteSeleccionado(paciente);
  };

  const cerrarModalHistorial = () => {
    setPacienteSeleccionado(null);
  };

  if (isLoadingAuth) {
    return <p className="listar-pacientes-mensaje">Verificando autenticación...</p>;
  }

  return (
    <div className="listar-pacientes-container">
      <h2 className="listar-pacientes-title">Lista de Pacientes</h2>
      
      {isAuthenticated && mensaje && !mostrarModalEdicion && (
        <p className={`listar-pacientes-mensaje ${mensaje.includes('Error') ? 'error' : (mensaje.includes('exitosamente') ? 'success' : '')}`}>
          {mensaje}
        </p>
      )}

      {/* ... El resto de tu JSX para la tabla y modales ... */}
      {isAuthenticated && pacientes.length > 0 && (
        <div className="tabla-responsive-container">
          <table className="pacientes-table">
            <thead>
              <tr>
                <th>ID</th><th>Nombre</th><th>RUT</th><th>Fecha de Nacimiento</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pacientes.map((paciente) => (
                <tr key={paciente.id}>
                  <td data-label="ID">{paciente.id}</td>
                  <td data-label="Nombre">{paciente.nombre}</td>
                  <td data-label="RUT">{paciente.rut}</td>
                  {/* El formateo de la fecha aquí funciona porque el backend la envía en YYYY-MM-DD */}
                  <td data-label="Fecha de Nacimiento">{new Date(paciente.fecha_nacimiento).toLocaleDateString('es-CL', { timeZone: 'UTC' })}</td>
                  <td data-label="Acciones" className="acciones-cell">
                    <button className="btn-accion info" onClick={() => abrirModalHistorial(paciente)}>Historial</button>
                    <button className="btn-accion editar" onClick={() => abrirModalEdicion(paciente)}>Editar</button>
                    <button className="btn-accion eliminar" onClick={() => handleEliminar(paciente.id, paciente.nombre)}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {mostrarModalEdicion && pacienteAEditar && (
        <div className="modal-edicion">
          <div className="modal-contenido">
            <span className="cerrar-modal" onClick={cerrarModalEdicion}>&times;</span>
            <FormularioPaciente
              formData={formDataEdicion}
              handleChange={handleChangeEdicion}
              handleSubmit={handleSubmitEdicion}
              mensaje={mensaje.includes('actualizar paciente') ? mensaje : ''} 
              isSubmitting={isSubmittingEdicion}
              isAuthenticated={isAuthenticated}
              textoBoton="Actualizar Paciente"
              tituloFormulario={`Editando: ${pacienteAEditar.nombre}`}
            />
          </div>
        </div>
      )}

      {pacienteSeleccionado && (
          <ModalHistorial
              paciente={pacienteSeleccionado}
              onClose={cerrarModalHistorial}
          />
      )}
    </div>
  );
};

export default ListarPacientes;
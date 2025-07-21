// frontend/src/components/ListarUsuarios.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { listarUsuariosAPI, eliminarUsuarioAPI, actualizarUsuarioAPI, Usuario, UsuarioCreate } from '../api/usuarios';
import FormularioUsuario from './FormularioUsuario';
import './ListarPacientes.css'; // Reutilizamos los estilos de tabla y botones de acción

interface ListarUsuariosProps {
  onUsuarioModificado: () => void; // Callback para refrescar la lista
}

const ListarUsuarios: React.FC<ListarUsuariosProps> = ({ onUsuarioModificado }) => {
  const { getAccessTokenSilently, isAuthenticated, isLoading: isLoadingAuth } = useAuth0();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [mensaje, setMensaje] = useState('');
  const [cargandoLista, setCargandoLista] = useState(false);

  const [usuarioAEditar, setUsuarioAEditar] = useState<Usuario | null>(null);
  const [mostrarModalEdicion, setMostrarModalEdicion] = useState(false);
  const [isSubmittingEdicion, setIsSubmittingEdicion] = useState(false);
  const [mensajeEdicion, setMensajeEdicion] = useState('');


  const cargarUsuarios = useCallback(async () => {
    if (!isAuthenticated) return;
    setCargandoLista(true);
    setMensaje('Cargando lista de usuarios...');
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: { audience: process.env.REACT_APP_AUTH0_API_AUDIENCE! },
      });
      const data = await listarUsuariosAPI(token);
      setUsuarios(data);
      setMensaje('');
    } catch (error: any) {
      console.error(error);
      setMensaje(error.message || 'Error desconocido al cargar usuarios');
      setUsuarios([]);
    } finally {
      setCargandoLista(false);
    }
  }, [isAuthenticated, getAccessTokenSilently]);

  useEffect(() => {
    if (isAuthenticated) {
      cargarUsuarios();
    } else {
      setUsuarios([]);
      setMensaje('Inicia sesión para ver la lista de usuarios.');
    }
  }, [isAuthenticated, cargarUsuarios]);

  const handleEliminar = async (id: number, nombre: string) => {
    if (!isAuthenticated) {
      setMensaje('Debe iniciar sesión para realizar esta acción.');
      return;
    }
    if (window.confirm(`¿Estás seguro de que deseas eliminar al usuario "${nombre}"?`)) {
      setMensaje('Eliminando usuario...');
      try {
        const token = await getAccessTokenSilently({
          authorizationParams: { audience: process.env.REACT_APP_AUTH0_API_AUDIENCE! },
        });
        await eliminarUsuarioAPI(id, token);
        setMensaje(`Usuario "${nombre}" eliminado exitosamente.`);
        onUsuarioModificado(); // Notificar al padre para recargar la lista
      } catch (error: any) {
        console.error(error);
        setMensaje(error.message || 'Error desconocido al eliminar usuario');
      }
    }
  };

  const handleEditar = (usuario: Usuario) => {
    setUsuarioAEditar(usuario);
    setMostrarModalEdicion(true);
    setMensajeEdicion('');
  };

  const handleCerrarModalEdicion = () => {
    setMostrarModalEdicion(false);
    setUsuarioAEditar(null);
    setMensajeEdicion('');
  };

  const handleSubmitEdicion = async (formData: UsuarioCreate) => {
    if (!usuarioAEditar || !isAuthenticated) return;

    setIsSubmittingEdicion(true);
    setMensajeEdicion('Actualizando usuario...');
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: { audience: process.env.REACT_APP_AUTH0_API_AUDIENCE! },
      });

      // Solo enviar la contraseña si ha sido modificada (no está vacía)
      const dataToSend: Partial<UsuarioCreate> = {
          email: formData.email,
          nombre: formData.nombre,
          rol: formData.rol,
      };
      if (formData.password) {
          dataToSend.password = formData.password;
      }

      await actualizarUsuarioAPI(usuarioAEditar.id, dataToSend, token);
      setMensajeEdicion(`Usuario "${formData.nombre}" actualizado exitosamente.`);
      handleCerrarModalEdicion();
      onUsuarioModificado(); // Recargar la lista
    } catch (error: any) {
      console.error(error);
      setMensajeEdicion(error.message || 'Error desconocido al actualizar usuario');
    } finally {
      setIsSubmittingEdicion(false);
    }
  };

  if (isLoadingAuth) {
    return <p className="listar-pacientes-mensaje">Verificando autenticación...</p>;
  }

  return (
    <div className="listar-pacientes-container"> {/* Reutiliza el contenedor general */}
      <h2 className="listar-pacientes-title">Lista de Usuarios</h2>
      
      {isAuthenticated && mensaje && !mostrarModalEdicion && (
        <p className={`listar-pacientes-mensaje ${mensaje.includes('Error') ? 'error' : (mensaje.includes('exitosamente') ? 'success' : '')}`}>
          {mensaje}
        </p>
      )}

      {cargandoLista ? (
        <p>Cargando usuarios...</p>
      ) : usuarios.length === 0 ? (
        <p className="listar-pacientes-mensaje">No hay usuarios registrados.</p>
      ) : (
        <div className="tabla-responsive-container">
          <table className="pacientes-table"> {/* Reutiliza la tabla de pacientes */}
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario) => (
                <tr key={usuario.id}>
                  <td data-label="ID">{usuario.id}</td>
                  <td data-label="Nombre">{usuario.nombre}</td>
                  <td data-label="Email">{usuario.email}</td>
                  <td data-label="Rol">{usuario.rol}</td>
                  <td data-label="Acciones" className="acciones-cell">
                    <button className="btn-accion editar" onClick={() => handleEditar(usuario)}>Editar</button>
                    <button className="btn-accion eliminar" onClick={() => handleEliminar(usuario.id, usuario.nombre)}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de Edición */}
      {mostrarModalEdicion && usuarioAEditar && (
        <div className="modal-edicion">
          <div className="modal-contenido">
            <span className="cerrar-modal" onClick={handleCerrarModalEdicion}>&times;</span>
            <FormularioUsuario
              initialData={usuarioAEditar}
              onSubmit={handleSubmitEdicion}
              isSubmitting={isSubmittingEdicion}
              mensaje={mensajeEdicion}
              textoBoton="Actualizar Usuario"
              tituloFormulario={`Editando: ${usuarioAEditar.nombre}`}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ListarUsuarios;
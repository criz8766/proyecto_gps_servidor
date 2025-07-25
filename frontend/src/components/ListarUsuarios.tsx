// frontend/src/components/ListarUsuarios.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
// Asegúrate de que las interfaces y funciones se importen correctamente
import { listarUsuariosAPI, eliminarUsuarioAPI, actualizarUsuarioAPI, Usuario, UsuarioCreate } from '../api/usuarios'; 
import FormularioUsuario from './FormularioUsuario';
import './ListarPacientes.css'; 

interface ListarUsuariosProps {
  onUsuarioModificado: () => void; 
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

  // CAMBIO: ID es de tipo 'string'
  const handleEliminar = async (id: string, nombre: string) => {
    if (!isAuthenticated) {
      setMensaje('Debe iniciar sesión para realizar esta acción.');
      return;
    }
    if (window.confirm(`¿Estás seguro de que deseas eliminar al usuario "${nombre}"?`)) {
      setMensaje('Eliminando usuario...');
      try {
        console.log("Intentando eliminar usuario con ID:", id); // Aquí se depuró el 'undefined'
        const token = await getAccessTokenSilently({
          authorizationParams: { audience: process.env.REACT_APP_AUTH0_API_AUDIENCE! },
        });
        await eliminarUsuarioAPI(id, token); // Pasa 'id' (que ahora es string)
        setMensaje(`Usuario "${nombre}" eliminado exitosamente.`);
        onUsuarioModificado(); 
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
    if (!usuarioAEditar || !isAuthenticated) {
        setMensajeEdicion("Error: No se ha seleccionado un usuario para editar o no está autenticado.");
        return;
    }

    setIsSubmittingEdicion(true);
    setMensajeEdicion('Actualizando usuario...');
    try {
      // CAMBIO: Usa usuarioAEditar.user_id
      console.log("Intentando actualizar usuario con ID:", usuarioAEditar.user_id, "Datos:", formData);
      const token = await getAccessTokenSilently({
        authorizationParams: { audience: process.env.REACT_APP_AUTH0_API_AUDIENCE! },
      });

      const dataToSend: Partial<UsuarioCreate> = {
          email: formData.email,
          nombre: formData.nombre,
          rol: formData.rol,
      };
      if (formData.password) {
          dataToSend.password = formData.password;
      }

      await actualizarUsuarioAPI(usuarioAEditar.user_id, dataToSend, token); // Pasa usuarioAEditar.user_id
      setMensajeEdicion(`Usuario "${formData.nombre}" actualizado exitosamente.`);
      handleCerrarModalEdicion();
      onUsuarioModificado();
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
    <div className="listar-pacientes-container">
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
          <table className="pacientes-table">
            <thead>
              <tr>
                <th>ID Usuario</th> {/* CAMBIO: Etiqueta de la columna */}
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario) => (
                <tr key={usuario.user_id}> {/* CAMBIO: usa user_id como key */}
                  <td data-label="ID Usuario">{usuario.user_id}</td> {/* CAMBIO: muestra user_id */}
                  <td data-label="Nombre">{usuario.nombre}</td>
                  <td data-label="Email">{usuario.email}</td>
                  <td data-label="Rol">{usuario.rol}</td>
                  <td data-label="Acciones" className="acciones-cell">
                    <button className="btn-accion editar" onClick={() => handleEditar(usuario)}>Editar</button>
                    <button className="btn-accion eliminar" onClick={() => handleEliminar(usuario.user_id, usuario.nombre)}>Eliminar</button> {/* CAMBIO: pasa user_id */}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
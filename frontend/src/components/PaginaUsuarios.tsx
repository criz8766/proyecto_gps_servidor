// frontend/src/components/PaginaUsuarios.tsx

import React, { useState, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { crearUsuarioAPI, UsuarioCreate } from '../api/usuarios';
import FormularioUsuario from './FormularioUsuario';
import ListarUsuarios from './ListarUsuarios';
import './Pagina.css'; // Reutilizamos los estilos generales de página

const PaginaUsuarios: React.FC = () => {
    const { getAccessTokenSilently, isAuthenticated } = useAuth0();
    const [mensajeCreacion, setMensajeCreacion] = useState('');
    const [isSubmittingCreacion, setIsSubmittingCreacion] = useState(false);
    
    // Estado para forzar la recarga de la lista de usuarios
    const [refrescarListaUsuarios, setRefrescarListaUsuarios] = useState(0);

    const handleCrearUsuario = async (formData: UsuarioCreate) => {
        if (!isAuthenticated) {
            setMensajeCreacion('Debe iniciar sesión para crear usuarios.');
            return;
        }
        setIsSubmittingCreacion(true);
        setMensajeCreacion('Creando usuario...');
        try {
            const token = await getAccessTokenSilently({
                authorizationParams: { audience: process.env.REACT_APP_AUTH0_API_AUDIENCE! },
            });
            const nuevoUsuario = await crearUsuarioAPI(formData, token);
            setMensajeCreacion(`Usuario "${nuevoUsuario.nombre}" creado exitosamente.`);
            setRefrescarListaUsuarios(prev => prev + 1); // Incrementar para forzar recarga
        } catch (error: any) {
            console.error("Error al crear usuario:", error);
            setMensajeCreacion(error.message || 'Error desconocido al crear usuario.');
        } finally {
            setIsSubmittingCreacion(false);
        }
    };

    // Callback para refrescar la lista después de cualquier acción (crear, editar, eliminar)
    const handleUsuarioModificado = useCallback(() => {
        setRefrescarListaUsuarios(prev => prev + 1);
    }, []);

    return (
        <div className="page-container">
            <div className="dashboard-container"> {/* Reutiliza el layout de dashboard */}
                <div className="card component-card">
                    <FormularioUsuario
                        onSubmit={handleCrearUsuario}
                        isSubmitting={isSubmittingCreacion}
                        mensaje={mensajeCreacion}
                        textoBoton="Crear Usuario"
                        tituloFormulario="Registrar Nuevo Usuario"
                    />
                </div>
                <div className="card component-card">
                    <ListarUsuarios key={refrescarListaUsuarios} onUsuarioModificado={handleUsuarioModificado} />
                </div>
            </div>
        </div>
    );
};

export default PaginaUsuarios;
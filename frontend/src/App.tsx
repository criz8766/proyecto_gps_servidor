import React, { useEffect } from 'react';
import './App.css';
import { useAuth0 } from '@auth0/auth0-react';
import { FiLogIn, FiLogOut, FiUser, FiLoader } from 'react-icons/fi';
// 1. Se importan las herramientas de React Router
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';

// 2. Se importan las nuevas "Páginas" que contendrán los componentes
import PaginaPacientes from './components/PaginaPacientes';
import PaginaInventario from './components/PaginaInventario';
import PaginaInformes from './components/PaginaInformes';
import PaginaVentas from './components/PaginaVentas';
import PaginaUsuarios from './components/PaginaUsuarios'; // Añade esta línea

import { obtenerUsuarioPorIdAPI, Usuario } from './api/usuarios';
import { obtenerMiPerfilUsuarioAPI } from './api/usuarios';

function App() {
  const { 
    loginWithRedirect, 
    logout, 
    user, 
    isAuthenticated, 
    isLoading,
    getAccessTokenSilently
  } = useAuth0();

  useEffect(() => {
    const syncUserWithBackend = async () => {
      if (isAuthenticated && user) {
        try {
          const token = await getAccessTokenSilently({
            authorizationParams: { audience: process.env.REACT_APP_AUTH0_API_AUDIENCE! },
          });
          // Llama al endpoint /perfil para que se cree/obtenga el usuario en la DB del backend
          const backendUser = await obtenerMiPerfilUsuarioAPI(token);
          console.log('Usuario sincronizado con backend:', backendUser);
          // Opcional: podrías guardar el rol del backend en un estado local si necesitas usarlo en el frontend
        } catch (error) {
          console.error('Error al sincronizar usuario con el backend:', error);
          // Aquí puedes manejar errores, por ejemplo, mostrar un mensaje al usuario
        }
      }
    };

    syncUserWithBackend();
  }, [isAuthenticated, user, getAccessTokenSilently]); // Dependencias del efecto

  if (isLoading) {
    return (
      <div className="loading-container">
        {FiLoader({ className: "loading-spinner" })}
        <p>Cargando aplicación...</p>
      </div>
    );
  }

  return (
    // 3. Se envuelve toda la aplicación en el Router
    <Router>
      <div className="App">
        <header className="App-header">
          <div className="header-content">
            
            {/* --- GRUPO IZQUIERDO: Título y Saludo --- */}
            <div className="header-left">
              <h1 className="logo-title">Gestión Farmacia</h1>
              {isAuthenticated && user && (
                <span className="user-greeting">
                  {FiUser({})} Hola, {user.name || user.email}
                </span>
              )}
            </div>

            {/* --- GRUPO DERECHO: Navegación y Sesión --- */}
            <div className="header-right">
              {isAuthenticated ? (
                <>
                  {/* Menú de Navegación con NavLink para estilos activos */}
                  <nav className="main-nav">
                    <NavLink to="/pacientes">Pacientes</NavLink>
                    <NavLink to="/inventario">Inventario</NavLink>
                    <NavLink to="/informes">Informes</NavLink>
                    <NavLink to="/ventas">Ventas</NavLink>
                    <NavLink to="/usuarios">Usuarios</NavLink>
                  </nav>

                  {/* Botón de Cerrar Sesión */}
                  <button
                    className="btn btn-secondary"
                    onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
                  >
                    {FiLogOut({})}
                    <span>Cerrar Sesión</span>
                  </button>
                </>
              ) : (
                 // Botón de Iniciar Sesión cuando no se está autenticado
                <button className="btn btn-primary" onClick={() => loginWithRedirect()}>
                  {FiLogIn({})} <span>Iniciar Sesión</span>
                </button>
              )}
            </div>
          </div>
        </header>

        <main className="main-content">
          {isAuthenticated ? (
            // 4. Aquí se decide qué página mostrar según la URL
            <Routes>
              <Route path="/pacientes" element={<PaginaPacientes />} />
              <Route path="/inventario" element={<PaginaInventario />} />
              <Route path="/informes" element={<PaginaInformes />} />
              <Route path="/ventas" element={<PaginaVentas />} />
               <Route path="/usuarios" element={<PaginaUsuarios />} />
              
              {/* Ruta por defecto: si el usuario va a la raíz, se redirige a /pacientes */}
              <Route path="*" element={<Navigate to="/pacientes" />} />
            </Routes>
          ) : (
            <div className="welcome-container">
              <div className="card welcome-card">
                <h2>Bienvenido al Sistema</h2>
                <p>Por favor, inicia sesión para continuar.</p>
              </div>
            </div>
          )}
        </main>

        <footer className="App-footer">
          <p>&copy; {new Date().getFullYear()} Tu Clínica o Farmacia. Todos los derechos reservados.</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;

// frontend/src/App.tsx

import React, { useEffect, useState } from 'react'; // Asegúrate de importar useState
import './App.css';
import { useAuth0 } from '@auth0/auth0-react';
import { FiLogIn, FiLogOut, FiUser, FiLoader } from 'react-icons/fi';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import PaginaPacientes from './components/PaginaPacientes';
import PaginaInventario from './components/PaginaInventario';
import PaginaInformes from './components/PaginaInformes';
import PaginaVentas from './components/PaginaVentas';
import PaginaUsuarios from './components/PaginaUsuarios';
import { obtenerMiPerfilUsuarioAPI } from './api/usuarios';

import PaginaDashboard from './components/PaginaDashboard';
function App() {
  const {
    loginWithRedirect,
    logout,
    user,
    isAuthenticated,
    isLoading,
    getAccessTokenSilently
  } = useAuth0();

  // NUEVO: Estado para guardar el rol del usuario desde el backend
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isRoleLoading, setIsRoleLoading] = useState(true); // Para saber si el rol ya cargó

  // Sincronizar el usuario con la base de datos del backend y obtener su rol
  useEffect(() => {
    const syncUserAndGetRole = async () => {
      if (isAuthenticated && user) {
        try {
          const token = await getAccessTokenSilently({
            authorizationParams: { audience: process.env.REACT_APP_AUTH0_API_AUDIENCE! },
          });
          const backendUser = await obtenerMiPerfilUsuarioAPI(token);
          console.log('Usuario sincronizado con backend:', backendUser);
          setUserRole(backendUser.rol); // Guarda el rol del backend
        } catch (error) {
          console.error('Error al sincronizar usuario o obtener rol del backend:', error);
          setUserRole(null); // Resetea el rol en caso de error
        } finally {
          setIsRoleLoading(false); // La carga del rol ha terminado
        }
      } else if (!isAuthenticated) {
        setUserRole(null); // Resetea el rol si no está autenticado
        setIsRoleLoading(false); // La carga del rol ha terminado (no hay usuario para cargar)
      }
    };

    syncUserAndGetRole();
  }, [isAuthenticated, user, getAccessTokenSilently]);

  if (isLoading || isRoleLoading) { // Añade isRoleLoading a la condición de carga
    return (
      <div className="loading-container">
        {FiLoader({ className: "loading-spinner" })}
        <p>Cargando aplicación y perfil de usuario...</p>
      </div>
    );
  }

  // Define si el usuario actual es administrador
  const isAdmin = userRole === 'admin_general';

  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <div className="header-content">
            <div className="header-left">
              <h1 className="logo-title">Gestión Farmacia</h1>
              {isAuthenticated && user && (
                <span className="user-greeting">
                  {FiUser({})} Hola, {user.name || user.email} ({userRole}) {/* Muestra el rol */}
                </span>
              )}
            </div>

            <div className="header-right">
              {isAuthenticated ? (
                <>
                  <nav className="main-nav">
                    <NavLink to="/dashboard">Dashboard</NavLink>
                    <NavLink to="/pacientes">Pacientes</NavLink>
                    <NavLink to="/inventario">Inventario</NavLink>
                    <NavLink to="/informes">Informes</NavLink>
                    <NavLink to="/ventas">Ventas</NavLink>
                    {/* NUEVO: Mostrar el enlace a Usuarios solo si es admin */}
                    {isAdmin && (
                      <NavLink to="/usuarios">Usuarios</NavLink>
                    )}
                  </nav>

                  <button
                    className="btn btn-secondary"
                    onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
                  >
                    {FiLogOut({})}
                    <span>Cerrar Sesión</span>
                  </button>
                </>
              ) : (
                <button className="btn btn-primary" onClick={() => loginWithRedirect()}>
                  {FiLogIn({})} <span>Iniciar Sesión</span>
                </button>
              )}
            </div>
          </div>
        </header>

        <main className="main-content">
          {isAuthenticated ? (
            <Routes>

              <Route path="/" element={<PaginaDashboard />} /> 
              <Route path="/dashboard" element={<PaginaDashboard />} /> {/* NUEVO: Ruta explícita para Dashboard */}
              <Route path="/pacientes" element={<PaginaPacientes />} />
              <Route path="/inventario" element={<PaginaInventario />} />
              <Route path="/informes" element={<PaginaInformes />} />
              <Route path="/ventas" element={<PaginaVentas />} />

              {/* NUEVO: Proteger la ruta de Usuarios */}
              {isAdmin ? (
                <Route path="/usuarios" element={<PaginaUsuarios />} />
              ) : (
                // Redirigir a pacientes si no es admin e intenta acceder a /usuarios
                <Route path="/usuarios" element={<Navigate to="/pacientes" />} />
              )}
              
              {/* Ruta por defecto: si el usuario va a la raíz, se redirige a /pacientes */}
              <Route path="*" element={<Navigate to="/dashboard" />} />
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

import React from 'react';
import './App.css';
import { useAuth0 } from '@auth0/auth0-react';
import { FiLogIn, FiLogOut, FiUser, FiLoader } from 'react-icons/fi';

// 1. Se importan las herramientas de React Router
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';

// 2. Se importan las nuevas "Páginas" que contendrán los componentes
import PaginaPacientes from './components/PaginaPacientes';
import PaginaInventario from './components/PaginaInventario';

function App() {
  const { 
    loginWithRedirect, 
    logout, 
    user, 
    isAuthenticated, 
    isLoading 
  } = useAuth0();

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

// frontend/src/components/DashboardContent.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { listarPacientesAPI, Paciente } from '../api/pacientes';
import { listarProductosAPI, Producto } from '../api/inventario';
import { listarUsuariosAPI, Usuario } from '../api/usuarios';
import './Pagina.css';
import './DashboardContent.css';

const DashboardContent: React.FC = () => {
    const { getAccessTokenSilently, isAuthenticated } = useAuth0();
    const [totalPacientes, setTotalPacientes] = useState<number | null>(null);
    const [totalProductos, setTotalProductos] = useState<number | null>(null);
    const [lowStockProductsCount, setLowStockProductsCount] = useState<number | null>(null);
    const [usersByRole, setUsersByRole] = useState<Record<string, number> | null>(null);
    const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        if (!isAuthenticated) {
            // Este mensaje es para usuarios NO autenticados.
            setError('Debes iniciar sesión para ver los datos del Dashboard.');
            setIsLoadingData(false);
            return;
        }

        setIsLoadingData(true);
        setError(null); // Limpiar errores previos

        try {
            const token = await getAccessTokenSilently({
                authorizationParams: { audience: process.env.REACT_APP_AUTH0_API_AUDIENCE! },
            });

            // --- Cargar datos de Pacientes (accesible para todos los roles autenticados) ---
            try {
                const pacientes: Paciente[] = await listarPacientesAPI(token);
                setTotalPacientes(pacientes.length);
            } catch (err: any) {
                console.error('Error al cargar pacientes para el Dashboard:', err);
                setTotalPacientes(null); // Opcional: mostrar N/A si falla
                // No establecemos el error principal aquí para no bloquear todo el dashboard
            }

            // --- Cargar datos de Productos (accesible para todos los roles autenticados) ---
            try {
                const products: Producto[] = await listarProductosAPI(token);
                setTotalProductos(products.length);
                const LOW_STOCK_THRESHOLD = 10;
                const lowStockCount = products.filter(p => p.stock <= LOW_STOCK_THRESHOLD).length;
                setLowStockProductsCount(lowStockCount);
            } catch (err: any) {
                console.error('Error al cargar productos para el Dashboard:', err);
                setTotalProductos(null); // Opcional: mostrar N/A si falla
                setLowStockProductsCount(null);
                // No establecemos el error principal aquí
            }

            // --- Cargar datos de Usuarios (probablemente solo para administradores) ---
            try {
                const users: Usuario[] = await listarUsuariosAPI(token);
                const rolesCount: Record<string, number> = {};
                users.forEach(user => {
                    rolesCount[user.rol] = (rolesCount[user.rol] || 0) + 1;
                });
                setUsersByRole(rolesCount);
            } catch (userApiError: any) {
                // Si falla la API de usuarios (ej. por permisos), no mostramos un error general,
                // simplemente indicamos que esa sección no está disponible.
                console.warn('No se pudieron cargar los datos de usuarios (posiblemente por permisos):', userApiError.message);
                setUsersByRole(null); // Reiniciar para indicar que no hay datos
            }

        } catch (err: any) {
            // Este catch solo se activará si falla la obtención del token o alguna API crítica
            // que no esté envuelta en su propio try-catch.
            console.error('Error crítico al obtener datos del Dashboard:', err);
            setError(err.message || 'Error desconocido al cargar el Dashboard.');
            // En este caso, sí reseteamos todo porque es un fallo más grave.
            setTotalPacientes(null);
            setTotalProductos(null);
            setLowStockProductsCount(null);
            setUsersByRole(null);
        } finally {
            setIsLoadingData(false);
        }
    }, [isAuthenticated, getAccessTokenSilently]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (isLoadingData) {
        return <div className="dashboard-loading"><p>Cargando datos del dashboard...</p></div>;
    }

    // Si hay un error crítico (ej. no se pudo obtener el token), mostramos el error.
    if (error) {
        return <div className="dashboard-error"><p>{error}</p></div>;
    }

    return (
        <div className="dashboard-grid">
            <div className="card dashboard-card">
                <h3>Total de Pacientes</h3>
                <p className="metric-number">{totalPacientes !== null ? totalPacientes : 'N/A'}</p>
            </div>
            <div className="card dashboard-card">
                <h3>Total de Productos</h3>
                <p className="metric-number">{totalProductos !== null ? totalProductos : 'N/A'}</p>
            </div>
            {/* NUEVA TARJETA: Productos con Bajo Stock */}
            <div className="card dashboard-card accent-low-stock">
                <h3>Productos con Bajo Stock</h3>
                <p className="metric-number">{lowStockProductsCount !== null ? lowStockProductsCount : 'N/A'}</p>
                {lowStockProductsCount !== null && lowStockProductsCount > 0 && 
                  <p className="sub-text">¡Revisa tu inventario!</p>
                }
            </div>
            {/* NUEVA TARJETA: Usuarios por Rol */}
            <div className="card dashboard-card accent-users">
                <h3>Usuarios por Rol</h3>
                {usersByRole ? (
                    <ul className="role-list">
                        {Object.entries(usersByRole).map(([rol, count]) => (
                            <li key={rol}>
                                <strong>{rol}:</strong> {count}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="sub-text">Datos no disponibles (requiere permisos de administrador).</p>
                )}
            </div>
        </div>
    );
};

export default DashboardContent;

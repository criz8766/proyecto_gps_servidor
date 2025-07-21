// frontend/src/components/DashboardContent.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { listarPacientesAPI, Paciente } from '../api/pacientes';
import { listarProductosAPI, Producto } from '../api/inventario';
import { listarUsuariosAPI, Usuario } from '../api/usuarios'; // NUEVO: Importa listarUsuariosAPI y Usuario
import './Pagina.css';
import './DashboardContent.css';

const DashboardContent: React.FC = () => {
    const { getAccessTokenSilently, isAuthenticated } = useAuth0();
    const [totalPacientes, setTotalPacientes] = useState<number | null>(null);
    const [totalProductos, setTotalProductos] = useState<number | null>(null);
    const [lowStockProductsCount, setLowStockProductsCount] = useState<number | null>(null); // NUEVO
    const [usersByRole, setUsersByRole] = useState<Record<string, number> | null>(null); // NUEVO
    const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        if (!isAuthenticated) {
            setError('Debes iniciar sesión para ver los datos del Dashboard.');
            setIsLoadingData(false);
            return;
        }

        setIsLoadingData(true);
        setError(null);

        try {
            const token = await getAccessTokenSilently({
                authorizationParams: { audience: process.env.REACT_APP_AUTH0_API_AUDIENCE! },
            });

            // Obtener total de pacientes
            const pacientes: Paciente[] = await listarPacientesAPI(token);
            setTotalPacientes(pacientes.length);

            // Obtener total de productos y contar los de bajo stock
            const products: Producto[] = await listarProductosAPI(token);
            setTotalProductos(products.length);
            const LOW_STOCK_THRESHOLD = 10; // Puedes ajustar este umbral
            const lowStockCount = products.filter(p => p.stock <= LOW_STOCK_THRESHOLD).length;
            setLowStockProductsCount(lowStockCount);

            // Obtener usuarios y agrupar por rol
            const users: Usuario[] = await listarUsuariosAPI(token);
            const rolesCount: Record<string, number> = {};
            users.forEach(user => {
                rolesCount[user.rol] = (rolesCount[user.rol] || 0) + 1;
            });
            setUsersByRole(rolesCount);

        } catch (err: any) {
            console.error('Error fetching dashboard data:', err);
            setError(err.message || 'Error al cargar los datos del Dashboard.');
            setTotalPacientes(null);
            setTotalProductos(null);
            setLowStockProductsCount(null); // Resetea también los nuevos estados
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
                    <p>N/A</p>
                )}
            </div>
            {/* Puedes añadir más tarjetas para otras métricas aquí */}
        </div>
    );
};

export default DashboardContent;
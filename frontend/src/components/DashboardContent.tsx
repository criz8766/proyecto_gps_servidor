// frontend/src/components/DashboardContent.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { listarPacientesAPI, Paciente } from '../api/pacientes';
import { listarProductosAPI, Producto } from '../api/inventario';
import './Pagina.css'; // Reutilizamos estilos generales de página
import './DashboardContent.css'; // Crearemos este archivo para estilos específicos del dashboard

const DashboardContent: React.FC = () => {
    const { getAccessTokenSilently, isAuthenticated } = useAuth0();
    const [totalPacientes, setTotalPacientes] = useState<number | null>(null);
    const [totalProductos, setTotalProductos] = useState<number | null>(null);
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

            // Obtener total de productos
            const productos: Producto[] = await listarProductosAPI(token);
            setTotalProductos(productos.length);

        } catch (err: any) {
            console.error('Error fetching dashboard data:', err);
            setError(err.message || 'Error al cargar los datos del Dashboard.');
            setTotalPacientes(null);
            setTotalProductos(null);
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
            {/* Puedes añadir más tarjetas para otras métricas aquí */}
            {/* Por ejemplo, un resumen de ventas o stock crítico si tienes esa información */}
        </div>
    );
};

export default DashboardContent;
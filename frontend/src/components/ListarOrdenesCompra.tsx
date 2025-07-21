// frontend/src/components/ListarOrdenesCompra.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { listarOrdenesCompraAPI, recibirOrdenCompraAPI, OrdenCompra } from '../api/compras';
import './ListarPacientes.css'; // Reutilizamos estilos de tabla y botones de acción

interface ListarOrdenesCompraProps {
    onOrdenesActualizadas: () => void; // Callback para refrescar la lista
}

const ListarOrdenesCompra: React.FC<ListarOrdenesCompraProps> = ({ onOrdenesActualizadas }) => {
    const { getAccessTokenSilently, isAuthenticated } = useAuth0();
    const [ordenes, setOrdenes] = useState<OrdenCompra[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [processingOrderId, setProcessingOrderId] = useState<number | null>(null); // Para deshabilitar botón mientras se procesa

    const fetchOrdenes = useCallback(async () => {
        if (!isAuthenticated) {
            setError('Inicia sesión para ver las órdenes de compra.');
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const token = await getAccessTokenSilently();
            const data = await listarOrdenesCompraAPI(token);
            // Ordenar por fecha de creación descendente
            const sortedData = data.sort((a, b) => new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime());
            setOrdenes(sortedData);
        } catch (err: any) {
            setError(err.message || 'Error al cargar las órdenes de compra.');
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated, getAccessTokenSilently]);

    useEffect(() => {
        fetchOrdenes();
    }, [fetchOrdenes]);

    const handleRecibirOrden = async (ordenId: number, proveedor: string) => {
        if (!isAuthenticated) {
            setError('Debe iniciar sesión para recibir órdenes.');
            return;
        }
        if (window.confirm(`¿Estás seguro de que deseas marcar la orden de ${proveedor} (ID: ${ordenId}) como RECIBIDA? Esto actualizará el stock.`)) {
            setProcessingOrderId(ordenId);
            setError(null);
            try {
                const token = await getAccessTokenSilently();
                await recibirOrdenCompraAPI(ordenId, token);
                setError(`Orden #${ordenId} de ${proveedor} marcada como RECIBIDA y stock actualizado.`);
                onOrdenesActualizadas(); // Notificar al padre para refrescar
            } catch (err: any) {
                setError(err.message || `Error al recibir la orden #${ordenId}.`);
            } finally {
                setProcessingOrderId(null);
            }
        }
    };

    if (isLoading) {
        return <p>Cargando órdenes de compra...</p>;
    }

    if (error) {
        return <p className="mensaje-feedback error">{error}</p>;
    }

    return (
        <div className="listar-pacientes-container"> {/* Reutiliza el contenedor general */}
            <h2 className="listar-pacientes-title">Órdenes de Compra</h2>
            {error && <p className="mensaje-feedback error">{error}</p>}
            
            {ordenes.length === 0 ? (
                <p className="mensaje-feedback">No hay órdenes de compra registradas.</p>
            ) : (
                <div className="tabla-responsive-container">
                    <table className="pacientes-table"> {/* Reutiliza la tabla de pacientes */}
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Proveedor</th>
                                <th>Fecha Creación</th>
                                <th>Estado</th>
                                <th>Total Productos</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ordenes.map((orden) => (
                                <tr key={orden.id}>
                                    <td data-label="ID">{orden.id}</td>
                                    <td data-label="Proveedor">{orden.proveedor}</td>
                                    <td data-label="Fecha Creación">{new Date(orden.fecha_creacion).toLocaleDateString('es-CL')}</td>
                                    <td data-label="Estado">
                                        <span className={`estado-badge ${orden.estado.toLowerCase().replace(' ', '-')}`}>
                                            {orden.estado}
                                        </span>
                                    </td>
                                    <td data-label="Total Productos">{orden.detalles.reduce((sum, det) => sum + det.cantidad, 0)}</td>
                                    <td data-label="Acciones" className="acciones-cell">
                                        {orden.estado === 'pendiente' && (
                                            <button
                                                className="btn-accion info"
                                                onClick={() => handleRecibirOrden(orden.id, orden.proveedor)}
                                                disabled={processingOrderId === orden.id}
                                            >
                                                {processingOrderId === orden.id ? 'Recibiendo...' : 'Recibir'}
                                            </button>
                                        )}
                                        {/* Podrías añadir un botón para ver detalles de la orden aquí */}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ListarOrdenesCompra;

// frontend/src/components/ModalHistorial.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Paciente, Dispensacion, obtenerDispensacionesAPI, registrarDispensacionAPI } from '../api/pacientes';
import './ModalHistorial.css';

interface ModalHistorialProps {
    paciente: Paciente;
    onClose: () => void;
}

const ModalHistorial: React.FC<ModalHistorialProps> = ({ paciente, onClose }) => {
    const { getAccessTokenSilently } = useAuth0();
    const [historial, setHistorial] = useState<Dispensacion[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [productoId, setProductoId] = useState('');
    const [cantidad, setCantidad] = useState(1);

    const cargarHistorial = useCallback(async () => {
        // ... (esta función no necesita cambios)
        setIsLoading(true);
        setError(null);
        try {
            const token = await getAccessTokenSilently();
            const data = await obtenerDispensacionesAPI(paciente.id, token);
            setHistorial(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [paciente.id, getAccessTokenSilently]);

    useEffect(() => {
        cargarHistorial();
    }, [cargarHistorial]);

    const handleRegistrarDispensacion = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!productoId || cantidad <= 0) {
            setError("Debe ingresar un ID de producto y una cantidad válida.");
            return;
        }
        setError(null);
        try {
            // --- CORRECCIÓN AQUÍ ---
            // 1. Obtenemos el token
            const token = await getAccessTokenSilently();
            
            // 2. Pasamos el token como tercer argumento
            await registrarDispensacionAPI(
                paciente.id, 
                {
                    producto_id: parseInt(productoId, 10),
                    cantidad: cantidad,
                },
                token // <-- El argumento que faltaba
            );

            cargarHistorial(); 
            setProductoId('');
            setCantidad(1);
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className="modal-historial">
            <div className="modal-contenido-historial">
                <span className="cerrar-modal" onClick={onClose}>&times;</span>
                <h3>Historial de: {paciente.nombre}</h3>
                {error && <div className="alert alert-danger">{error}</div>}

                {/* Formulario para nueva dispensación */}
                <div className="card mb-4">
                    <div className="card-body">
                        <h5 className="card-title">Registrar Nueva Dispensación</h5>
                        <form onSubmit={handleRegistrarDispensacion} className="form-inline-historial">
                            <input
                                type="number"
                                value={productoId}
                                onChange={(e) => setProductoId(e.target.value)}
                                placeholder="ID del Producto"
                                className="form-control mr-2"
                                required
                            />
                            <input
                                type="number"
                                value={cantidad}
                                onChange={(e) => setCantidad(parseInt(e.target.value, 10))}
                                min="1"
                                className="form-control mr-2"
                                required
                            />
                            <button type="submit" className="btn btn-primary">Registrar</button>
                        </form>
                    </div>
                </div>

                {/* Tabla de historial */}
                <h5>Dispensaciones Realizadas</h5>
                {isLoading ? <p>Cargando historial...</p> : (
                    <div className="tabla-responsive-container">
                        <table className="pacientes-table">
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>ID Producto</th>
                                    <th>Cantidad</th>
                                </tr>
                            </thead>
                            <tbody>
                                {historial.length > 0 ? (
                                    historial.map(d => (
                                        <tr key={d.id}>
                                            <td>{new Date(d.fecha_dispensacion).toLocaleString('es-CL')}</td>
                                            <td>{d.producto_id}</td>
                                            <td>{d.cantidad}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={3}>No hay dispensaciones registradas.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ModalHistorial;
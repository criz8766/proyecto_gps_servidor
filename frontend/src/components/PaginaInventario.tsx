// frontend/src/pages/PaginaInventario.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { listarProductosAPI, Producto } from '../api/inventario';
import FormularioProducto from '../components/FormularioProducto';
import ListarProductos from '../components/ListarProductos';

const PaginaInventario: React.FC = () => {
    const { getAccessTokenSilently, isAuthenticated } = useAuth0();
    const [productos, setProductos] = useState<Producto[]>([]);
    const [mensaje, setMensaje] = useState<string>('');
    const [cargando, setCargando] = useState<boolean>(true);

    const cargarProductos = useCallback(async () => {
        if (!isAuthenticated) return;
        setCargando(true);
        try {
            const token = await getAccessTokenSilently(); // Necesitamos el token aquí
            const data = await listarProductosAPI(token);
            setProductos(data);
        } catch (error: any) {
            setMensaje(error.message || 'Error al cargar productos.');
        } finally {
            setCargando(false);
        }
    }, [isAuthenticated, getAccessTokenSilently]);

    useEffect(() => {
        cargarProductos();
    }, [cargarProductos]);

    return (
        <div className="dashboard-container">
            <div className="card component-card">
                <FormularioProducto onProductoCreado={cargarProductos} />
            </div>
            <div className="card component-card">
                <ListarProductos 
                    productos={productos} 
                    cargando={cargando} 
                    onAccionRealizada={cargarProductos} // Pasamos la función para refrescar
                />
            </div>
        </div>
    );
};

export default PaginaInventario;
// frontend/src/pages/PaginaInventario.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { listarProductosAPI, crearProductoAPI, Producto, ProductoCreate } from '../api/inventario';
import FormularioProducto from './FormularioProducto'; // Lo crearemos ahora
import ListarProductos from './ListarProductos';   // Lo crearemos ahora

const PaginaInventario: React.FC = () => {
    const { getAccessTokenSilently, isAuthenticated } = useAuth0();
    const [productos, setProductos] = useState<Producto[]>([]);
    const [mensaje, setMensaje] = useState<string>('');
    const [cargando, setCargando] = useState<boolean>(true);

    const cargarProductos = useCallback(async () => {
        if (!isAuthenticated) return;
        setCargando(true);
        try {
            const data = await listarProductosAPI();
            setProductos(data);
        } catch (error) {
            setMensaje('Error al cargar productos.');
        } finally {
            setCargando(false);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        cargarProductos();
    }, [cargarProductos]);

    const handleProductoCreado = () => {
        // Refresca la lista de productos después de crear uno nuevo
        cargarProductos();
    };

    return (
        <div className="dashboard-container">
            <div className="card component-card">
                <FormularioProducto onProductoCreado={handleProductoCreado} />
            </div>
            <div className="card component-card">
                <ListarProductos productos={productos} cargando={cargando} />
            </div>
        </div>
    );
};

export default PaginaInventario;
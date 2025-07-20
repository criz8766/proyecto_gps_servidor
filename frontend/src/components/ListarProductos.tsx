// frontend/src/components/ListarProductos.tsx

import React, { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Producto, ProductoCreate, actualizarProductoAPI, eliminarProductoAPI } from '../api/inventario';
import FormularioProducto from './FormularioProducto'; // Reutilizaremos tu formulario
import '../components/ListarPacientes.css'; // Reutilizamos estilos

interface Props {
    productos: Producto[];
    cargando: boolean;
    onAccionRealizada: () => void; // Callback para refrescar la lista
}

const ListarProductos: React.FC<Props> = ({ productos, cargando, onAccionRealizada }) => {
    const { getAccessTokenSilently } = useAuth0();
    const [productoAEditar, setProductoAEditar] = useState<Producto | null>(null);
    const [mensaje, setMensaje] = useState('');

    const handleEliminar = async (id: number, nombre: string) => {
        if (window.confirm(`¿Estás seguro de que deseas eliminar el producto "${nombre}"?`)) {
            try {
                const token = await getAccessTokenSilently();
                await eliminarProductoAPI(id, token);
                setMensaje(`Producto "${nombre}" eliminado con éxito.`);
                onAccionRealizada(); // Avisa al padre para que refresque la lista
            } catch (error: any) {
                setMensaje(error.message);
            }
        }
    };
    
    const handleProductoEditado = () => {
        setProductoAEditar(null); // Cierra el modal
        onAccionRealizada(); // Refresca la lista
        setMensaje('Producto actualizado con éxito.');
    };

    if (cargando) {
        return <p>Cargando productos...</p>;
    }

    return (
        <div className="listar-pacientes-container">
            <h2 className="listar-pacientes-title">Productos en Inventario</h2>
            {mensaje && <p className="listar-pacientes-mensaje success">{mensaje}</p>}
            
            {/* Modal de Edición */}
            {productoAEditar && (
                <div className="modal-edicion">
                    <div className="modal-contenido">
                        <span className="cerrar-modal" onClick={() => setProductoAEditar(null)}>&times;</span>
                        <FormularioProducto
                            onProductoCreado={handleProductoEditado}
                            productoAEditar={productoAEditar} // Pasamos el producto para precargar el form
                        />
                    </div>
                </div>
            )}

            {productos.length === 0 ? (
                <p className="listar-pacientes-mensaje">No hay productos registrados.</p>
            ) : (
                <div className="tabla-responsive-container">
                    <table className="pacientes-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Nombre</th>
                                <th>Precio Venta</th>
                                <th>Stock</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {productos.map((producto) => (
                                <tr key={producto.id}>
                                    <td data-label="ID">{producto.id}</td>
                                    <td data-label="Nombre">{producto.nombre}</td>
                                    <td data-label="Precio">${producto.precio_venta.toLocaleString('es-CL')}</td>
                                    <td data-label="Stock">{producto.stock}</td>
                                    <td data-label="Acciones" className="acciones-cell">
                                        <button className="btn-accion editar" onClick={() => setProductoAEditar(producto)}>Editar</button>
                                        <button className="btn-accion eliminar" onClick={() => handleEliminar(producto.id, producto.nombre)}>Eliminar</button>
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

export default ListarProductos;
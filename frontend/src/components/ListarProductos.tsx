// frontend/src/components/ListarProductos.tsx
import React from 'react';
import { Producto } from '../api/inventario';
import '../components/ListarPacientes.css'; // Reutilizamos los estilos de la tabla de pacientes

interface Props {
    productos: Producto[];
    cargando: boolean;
}

const ListarProductos: React.FC<Props> = ({ productos, cargando }) => {
    if (cargando) {
        return <p>Cargando productos...</p>;
    }

    return (
        <div className="listar-pacientes-container">
            <h2 className="listar-pacientes-title">Productos en Inventario</h2>
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
                            </tr>
                        </thead>
                        <tbody>
                            {productos.map((producto) => (
                                <tr key={producto.id}>
                                    <td data-label="ID">{producto.id}</td>
                                    <td data-label="Nombre">{producto.nombre}</td>
                                    <td data-label="Precio">${producto.precio_venta.toLocaleString('es-CL')}</td>
                                    <td data-label="Stock">{producto.stock}</td>
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
// frontend/src/components/FormularioOrdenCompra.tsx

import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { crearOrdenCompraAPI, OrdenCompraCreate, DetalleOrdenCompraCreate } from '../api/compras';
import { listarProductosAPI, Producto } from '../api/inventario'; // Para seleccionar productos
import './FormularioPaciente.css'; // Reutilizamos estilos generales de formulario
import './FormularioOrdenCompra.css'; // Estilos específicos para este formulario

interface FormularioOrdenCompraProps {
    onOrdenCreada: () => void; // Callback para notificar al padre
}

const FormularioOrdenCompra: React.FC<FormularioOrdenCompraProps> = ({ onOrdenCreada }) => {
    const { getAccessTokenSilently, isAuthenticated } = useAuth0();
    const [proveedor, setProveedor] = useState<string>('');
    const [detalles, setDetalles] = useState<DetalleOrdenCompraCreate[]>([
        { producto_id: 0, cantidad: 1, precio_compra: 0 } // Detalle inicial
    ]);
    const [productosDisponibles, setProductosDisponibles] = useState<Producto[]>([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(true);
    const [errorProducts, setErrorProducts] = useState<string | null>(null);
    const [mensaje, setMensaje] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    // Cargar productos disponibles para el select
    useEffect(() => {
        const fetchProducts = async () => {
            if (!isAuthenticated) return;
            setIsLoadingProducts(true);
            setErrorProducts(null);
            try {
                const token = await getAccessTokenSilently();
                const data = await listarProductosAPI(token);
                setProductosDisponibles(data);
                // Si no hay productos, deshabilitar la adición de detalles
                if (data.length === 0) {
                    setDetalles([]);
                    setMensaje('No hay productos registrados para crear una orden de compra.');
                } else if (detalles.length === 0) {
                    // Si no hay detalles y hay productos, añadir uno por defecto
                    setDetalles([{ producto_id: data[0].id, cantidad: 1, precio_compra: 0 }]);
                }
            } catch (err: any) {
                setErrorProducts(err.message || 'Error al cargar productos.');
            } finally {
                setIsLoadingProducts(false);
            }
        };
        fetchProducts();
    }, [isAuthenticated, getAccessTokenSilently]);

    const handleDetalleChange = (index: number, e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const newDetalles = [...detalles];
        // Convertir a número si es producto_id, cantidad o precio_compra
        if (name === 'producto_id' || name === 'cantidad' || name === 'precio_compra') {
            newDetalles[index] = { ...newDetalles[index], [name]: parseFloat(value) };
        } else {
            newDetalles[index] = { ...newDetalles[index], [name]: value };
        }
        setDetalles(newDetalles);
    };

    const addDetalle = () => {
        if (productosDisponibles.length === 0) {
            setMensaje('No puedes añadir más detalles si no hay productos disponibles.');
            return;
        }
        setDetalles([...detalles, { producto_id: productosDisponibles[0].id, cantidad: 1, precio_compra: 0 }]);
    };

    const removeDetalle = (index: number) => {
        const newDetalles = detalles.filter((_, i) => i !== index);
        setDetalles(newDetalles);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!isAuthenticated) {
            setMensaje('Debe iniciar sesión para crear una orden de compra.');
            return;
        }
        if (detalles.length === 0) {
            setMensaje('Debe añadir al menos un producto a la orden de compra.');
            return;
        }
        if (detalles.some(d => d.cantidad <= 0 || d.precio_compra <= 0)) {
            setMensaje('La cantidad y el precio de compra deben ser mayores a 0 en todos los detalles.');
            return;
        }

        setIsSubmitting(true);
        setMensaje('Creando orden de compra...');
        try {
            const token = await getAccessTokenSilently();
            const ordenData: OrdenCompraCreate = {
                proveedor: proveedor,
                detalles: detalles,
            };
            const nuevaOrden = await crearOrdenCompraAPI(ordenData, token);
            setMensaje(`Orden de compra #${nuevaOrden.id} creada exitosamente.`);
            setProveedor('');
            setDetalles([{ producto_id: productosDisponibles[0]?.id || 0, cantidad: 1, precio_compra: 0 }]);
            onOrdenCreada(); // Notificar al padre para refrescar la lista
        } catch (error: any) {
            console.error(error);
            setMensaje(error.message || 'Error desconocido al crear la orden de compra.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="formulario-container">
            <h2>Crear Orden de Compra</h2>
            <form onSubmit={handleSubmit} noValidate>
                <div className="form-group">
                    <label htmlFor="proveedor">Proveedor</label>
                    <input
                        type="text"
                        id="proveedor"
                        name="proveedor"
                        value={proveedor}
                        onChange={(e) => setProveedor(e.target.value)}
                        required
                        placeholder="Ej: Laboratorio Saval"
                    />
                </div>

                <h3>Detalles de la Orden</h3>
                {isLoadingProducts ? (
                    <p>Cargando productos disponibles...</p>
                ) : errorProducts ? (
                    <p className="mensaje-feedback error">{errorProducts}</p>
                ) : productosDisponibles.length === 0 ? (
                    <p className="mensaje-feedback">No hay productos en el inventario para añadir a una orden de compra.</p>
                ) : (
                    detalles.map((detalle, index) => (
                        <div key={index} className="detalle-orden-item">
                            <div className="form-group">
                                <label htmlFor={`producto-${index}`}>Producto:</label>
                                <select
                                    id={`producto-${index}`}
                                    name="producto_id"
                                    value={detalle.producto_id}
                                    onChange={(e) => handleDetalleChange(index, e)}
                                    className="form-control"
                                    required
                                >
                                    {productosDisponibles.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.nombre} (Stock actual: {p.stock})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label htmlFor={`cantidad-${index}`}>Cantidad:</label>
                                <input
                                    type="number"
                                    id={`cantidad-${index}`}
                                    name="cantidad"
                                    value={detalle.cantidad}
                                    onChange={(e) => handleDetalleChange(index, e)}
                                    min="1"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor={`precio_compra-${index}`}>Precio Compra Unitario:</label>
                                <input
                                    type="number"
                                    id={`precio_compra-${index}`}
                                    name="precio_compra"
                                    value={detalle.precio_compra}
                                    onChange={(e) => handleDetalleChange(index, e)}
                                    min="0"
                                    step="0.01"
                                    required
                                />
                            </div>
                            <button
                                type="button"
                                className="btn-remove-item"
                                onClick={() => removeDetalle(index)}
                            >
                                &times;
                            </button>
                        </div>
                    ))
                )}

                {productosDisponibles.length > 0 && (
                    <button type="button" className="btn btn-secondary add-detalle-btn" onClick={addDetalle}>
                        Añadir Otro Producto
                    </button>
                )}

                <button type="submit" className="btn btn-primary" disabled={isSubmitting || detalles.length === 0 || productosDisponibles.length === 0}>
                    {isSubmitting ? 'Procesando...' : 'Crear Orden de Compra'}
                </button>
            </form>

            {mensaje && <p className={`mensaje-feedback ${mensaje.includes('Error') ? 'error' : 'success'}`}>{mensaje}</p>}
        </div>
    );
};

export default FormularioOrdenCompra;

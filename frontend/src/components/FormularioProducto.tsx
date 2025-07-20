// frontend/src/components/FormularioProducto.tsx (Versión Completa y Reparada)

import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { crearProductoAPI, actualizarProductoAPI, Producto, ProductoCreate } from '../api/inventario';
import './FormularioPaciente.css'; // Reutilizamos los estilos que ya tienes

interface Props {
    onProductoCreado: () => void;
    productoAEditar?: Producto | null; // Prop opcional para la edición
}

const FormularioProducto: React.FC<Props> = ({ onProductoCreado, productoAEditar }) => {
    const { getAccessTokenSilently } = useAuth0();
    const [formData, setFormData] = useState<ProductoCreate>({
        nombre: '',
        descripcion: '',
        precio_venta: 0,
        stock: 0,
    });
    const [mensaje, setMensaje] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // useEffect para precargar el formulario si estamos editando
    useEffect(() => {
        if (productoAEditar) {
            setFormData({
                nombre: productoAEditar.nombre,
                descripcion: productoAEditar.descripcion || '', // Asegurarse que no sea null
                precio_venta: productoAEditar.precio_venta,
                stock: productoAEditar.stock,
            });
        }
    }, [productoAEditar]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'precio_venta' || name === 'stock' ? parseFloat(value) : value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMensaje(productoAEditar ? 'Actualizando producto...' : 'Creando producto...');
        try {
            const token = await getAccessTokenSilently();
            if (productoAEditar) {
                // Lógica de actualización
                await actualizarProductoAPI(productoAEditar.id, formData, token);
            } else {
                // Lógica de creación
                await crearProductoAPI(formData, token);
            }
            setMensaje(productoAEditar ? '¡Producto actualizado!' : '¡Producto creado!');
            if (!productoAEditar) {
                setFormData({ nombre: '', descripcion: '', precio_venta: 0, stock: 0 });
            }
            onProductoCreado(); // Avisar al padre para que refresque la lista/cierre el modal
        } catch (error: any) {
            setMensaje(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="formulario-container">
            {/* Título dinámico */}
            <h2>{productoAEditar ? `Editando: ${productoAEditar.nombre}` : 'Registrar Nuevo Producto'}</h2>
            
            <form onSubmit={handleSubmit}>
                {/* --- SECCIÓN JSX QUE FALTABA --- */}
                <div className="form-group">
                    <label htmlFor="nombre">Nombre del Producto</label>
                    <input type="text" id="nombre" name="nombre" value={formData.nombre} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label htmlFor="descripcion">Descripción</label>
                    <input type="text" id="descripcion" name="descripcion" value={formData.descripcion || ''} onChange={handleChange} />
                </div>
                <div className="form-group">
                    <label htmlFor="precio_venta">Precio de Venta</label>
                    <input type="number" id="precio_venta" name="precio_venta" value={formData.precio_venta} onChange={handleChange} required min="0" />
                </div>
                <div className="form-group">
                    <label htmlFor="stock">Stock Inicial</label>
                    <input type="number" id="stock" name="stock" value={formData.stock} onChange={handleChange} required min="0" />
                </div>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? 'Procesando...' : (productoAEditar ? 'Actualizar Producto' : 'Crear Producto')}
                </button>
            </form>

            {mensaje && <p className="mensaje-feedback">{mensaje}</p>}
        </div>
    );
};

export default FormularioProducto;
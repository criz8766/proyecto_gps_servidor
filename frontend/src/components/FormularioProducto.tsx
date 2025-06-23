// frontend/src/components/FormularioProducto.tsx
import React, { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { crearProductoAPI, ProductoCreate } from '../api/inventario';
import '../components/FormularioPaciente.css'; // Reutilizamos los estilos del otro formulario

interface Props {
    onProductoCreado: () => void; // Función para avisar al padre que se creó un producto
}

const FormularioProducto: React.FC<Props> = ({ onProductoCreado }) => {
    const { getAccessTokenSilently } = useAuth0();
    const [formData, setFormData] = useState<ProductoCreate>({
        nombre: '',
        descripcion: '',
        precio_venta: 0,
        stock: 0,
    });
    const [mensaje, setMensaje] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'precio_venta' || name === 'stock' ? parseInt(value, 10) : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMensaje('Creando producto...');
        try {
            const token = await getAccessTokenSilently();
            await crearProductoAPI(formData, token);
            setMensaje('¡Producto creado con éxito!');
            setFormData({ nombre: '', descripcion: '', precio_venta: 0, stock: 0 }); // Limpiar formulario
            onProductoCreado(); // Avisar al componente padre para que refresque la lista
        } catch (error: any) {
            setMensaje(error.message || 'Error al crear el producto');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="formulario-container">
            <h2>Registrar Nuevo Producto</h2>
            <form onSubmit={handleSubmit}>
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
                    <input type="number" id="precio_venta" name="precio_venta" value={formData.precio_venta} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label htmlFor="stock">Stock Inicial</label>
                    <input type="number" id="stock" name="stock" value={formData.stock} onChange={handleChange} required />
                </div>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? 'Creando...' : 'Crear Producto'}
                </button>
            </form>
            {mensaje && <p className="mensaje-feedback">{mensaje}</p>}
        </div>
    );
};

export default FormularioProducto;
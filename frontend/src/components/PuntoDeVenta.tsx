// frontend/src/components/PuntoDeVenta.tsx

import React, { useState, useEffect, useCallback, ChangeEvent, FormEvent } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Paciente, obtenerPacientePorRutAPI, registrarDispensacionAPI } from '../api/pacientes';
import { Producto, listarProductosAPI } from '../api/inventario';
import './FormularioPaciente.css'; // Reutilizamos estilos generales de formulario
import './PuntoDeVenta.css'; // Estilos específicos para este componente (lo crearemos)

interface CartItem extends Producto {
    cantidadEnCesta: number;
}

const PuntoDeVenta: React.FC = () => {
    const { getAccessTokenSilently, isAuthenticated } = useAuth0();

    // Estados para el paciente
    const [rutPaciente, setRutPaciente] = useState<string>('');
    const [pacienteSeleccionado, setPacienteSeleccionado] = useState<Paciente | null>(null);
    const [errorPaciente, setErrorPaciente] = useState<string | null>(null);
    const [cargandoPaciente, setCargandoPaciente] = useState<boolean>(false);

    // Estados para productos
    const [productosDisponibles, setProductosDisponibles] = useState<Producto[]>([]);
    const [cargandoProductos, setCargandoProductos] = useState<boolean>(false);
    const [errorProductos, setErrorProductos] = useState<string | null>(null);
    const [filtroProducto, setFiltroProducto] = useState<string>('');

    // Estados para la cesta
    const [cart, setCart] = useState<CartItem[]>([]);
    const [mensajeVenta, setMensajeVenta] = useState<string | null>(null);
    const [isProcessingSale, setIsProcessingSale] = useState<boolean>(false);

    // Cargar productos disponibles al iniciar
    useEffect(() => {
        const fetchProductos = async () => {
            if (!isAuthenticated) return;
            setCargandoProductos(true);
            setErrorProductos(null);
            try {
                const token = await getAccessTokenSilently();
                const data = await listarProductosAPI(token);
                setProductosDisponibles(data);
            } catch (err: any) {
                setErrorProductos(err.message || 'Error al cargar productos.');
            } finally {
                setCargandoProductos(false);
            }
        };
        fetchProductos();
    }, [isAuthenticated, getAccessTokenSilently]);

    // Manejar búsqueda de paciente por RUT
    const handleBuscarPaciente = async (e: FormEvent) => {
        e.preventDefault();
        if (!isAuthenticated || !rutPaciente) {
            setErrorPaciente('Por favor, ingrese un RUT para buscar.');
            return;
        }
        setCargandoPaciente(true);
        setErrorPaciente(null);
        setPacienteSeleccionado(null);
        try {
            const token = await getAccessTokenSilently();
            const paciente = await obtenerPacientePorRutAPI(rutPaciente, token);
            setPacienteSeleccionado(paciente);
        } catch (err: any) {
            setErrorPaciente(err.message || 'Paciente no encontrado o error en la búsqueda.');
            setPacienteSeleccionado(null);
        } finally {
            setCargandoPaciente(false);
        }
    };

    // Filtrar productos por término de búsqueda
    const productosFiltrados = productosDisponibles.filter(p =>
        p.nombre.toLowerCase().includes(filtroProducto.toLowerCase()) ||
        (p.descripcion && p.descripcion.toLowerCase().includes(filtroProducto.toLowerCase())) ||
        p.id.toString().includes(filtroProducto)
    );

    // Añadir producto a la cesta
    const addToCart = (product: Producto, quantity: number) => {
        if (quantity <= 0) {
            setMensajeVenta('La cantidad debe ser mayor a 0.');
            return;
        }
        if (product.stock < quantity) {
            setMensajeVenta(`No hay suficiente stock para ${product.nombre}. Stock disponible: ${product.stock}`);
            return;
        }

        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.id === product.id);
            if (existingItem) {
                const newQuantity = existingItem.cantidadEnCesta + quantity;
                if (product.stock < newQuantity) {
                    setMensajeVenta(`La cantidad total en la cesta de ${product.nombre} excede el stock disponible.`);
                    return prevCart;
                }
                return prevCart.map(item =>
                    item.id === product.id ? { ...item, cantidadEnCesta: newQuantity } : item
                );
            } else {
                return [...prevCart, { ...product, cantidadEnCesta: quantity }];
            }
        });
        setMensajeVenta(null);
    };

    // Eliminar o ajustar cantidad de la cesta
    const updateCartItemQuantity = (productId: number, newQuantity: number) => {
        setCart(prevCart => {
            if (newQuantity <= 0) {
                return prevCart.filter(item => item.id !== productId);
            }
            const productInList = productosDisponibles.find(p => p.id === productId);
            if (productInList && newQuantity > productInList.stock) {
                 setMensajeVenta(`No hay suficiente stock para esta cantidad de ${productInList.nombre}. Stock disponible: ${productInList.stock}`);
                 return prevCart; // No actualizar si excede stock
            }
            return prevCart.map(item =>
                item.id === productId ? { ...item, cantidadEnCesta: newQuantity } : item
            );
        });
        setMensajeVenta(null);
    };

    const removeFromCart = (productId: number) => {
        setCart(prevCart => prevCart.filter(item => item.id !== productId));
    };

    const calcularTotal = () => {
        return cart.reduce((total, item) => total + (item.precio_venta * item.cantidadEnCesta), 0);
    };

    // Procesar la venta
    const handleProcesarVenta = async () => {
        if (!isAuthenticated || !pacienteSeleccionado) {
            setMensajeVenta('Debe seleccionar un paciente para procesar la venta.');
            return;
        }
        if (cart.length === 0) {
            setMensajeVenta('La cesta está vacía.');
            return;
        }

        setIsProcessingSale(true);
        setMensajeVenta('Procesando venta...');

        try {
            const token = await getAccessTokenSilently();
            for (const item of cart) {
                // Registrar cada producto como una dispensación
                await registrarDispensacionAPI(
                    pacienteSeleccionado.id,
                    { producto_id: item.id, cantidad: item.cantidadEnCesta },
                    token
                );
            }
            setMensajeVenta('Venta registrada con éxito y stock actualizado.');
            setCart([]); // Limpiar la cesta
            // Opcional: recargar productos disponibles para reflejar nuevo stock
            const updatedProducts = await listarProductosAPI(token);
            setProductosDisponibles(updatedProducts);

        } catch (err: any) {
            console.error('Error al procesar la venta:', err);
            setMensajeVenta(err.message || 'Error desconocido al procesar la venta.');
        } finally {
            setIsProcessingSale(false);
        }
    };

    if (!isAuthenticated) {
        return <p className="mensaje-feedback">Inicia sesión para usar el Punto de Venta.</p>;
    }

    return (
        <div className="punto-de-venta-container">
            <h2 className="section-title">Módulo de Caja: Punto de Venta</h2>
            {mensajeVenta && <p className={`mensaje-feedback ${mensajeVenta.includes('Error') ? 'error' : 'success'}`}>{mensajeVenta}</p>}

            <div className="pos-grid">
                {/* Panel Izquierdo: Búsqueda de Productos y Cesta */}
                <div className="pos-panel">
                    <div className="card mb-4">
                        <div className="card-body">
                            <h5 className="card-title">Buscar Producto</h5>
                            <input
                                type="text"
                                className="form-control mb-3"
                                placeholder="Buscar por nombre, descripción o ID..."
                                value={filtroProducto}
                                onChange={(e) => setFiltroProducto(e.target.value)}
                            />
                            {cargandoProductos ? (
                                <p>Cargando productos...</p>
                            ) : errorProductos ? (
                                <p className="mensaje-feedback error">{errorProductos}</p>
                            ) : (
                                <div className="product-list-scroll">
                                    <ul className="product-selection-list">
                                        {productosFiltrados.map(p => (
                                            <li key={p.id}>
                                                <span>{p.nombre} (${p.precio_venta.toLocaleString('es-CL')}) - Stock: {p.stock}</span>
                                                <button 
                                                    className="btn btn-add-to-cart" 
                                                    onClick={() => addToCart(p, 1)}
                                                    disabled={p.stock <= 0}
                                                >
                                                    Añadir
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-body">
                            <h5 className="card-title">Cesta de Compra</h5>
                            {cart.length === 0 ? (
                                <p>La cesta está vacía.</p>
                            ) : (
                                <ul className="cart-list">
                                    {cart.map(item => (
                                        <li key={item.id}>
                                            <span>{item.nombre}</span>
                                            <input
                                                type="number"
                                                min="1"
                                                value={item.cantidadEnCesta}
                                                onChange={(e) => updateCartItemQuantity(item.id, parseInt(e.target.value, 10))}
                                                className="cart-item-qty"
                                            />
                                            <span>x ${item.precio_venta.toLocaleString('es-CL')}</span>
                                            <span>= ${(item.cantidadEnCesta * item.precio_venta).toLocaleString('es-CL')}</span>
                                            <button className="btn-remove-item" onClick={() => removeFromCart(item.id)}>
                                                &times;
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            <div className="cart-total">
                                <strong>Total: ${calcularTotal().toLocaleString('es-CL')}</strong>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Panel Derecho: Selección de Paciente y Confirmación de Venta */}
                <div className="pos-panel">
                    <div className="card mb-4">
                        <div className="card-body">
                            <h5 className="card-title">Seleccionar Paciente</h5>
                            <form onSubmit={handleBuscarPaciente} className="form-inline-search">
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="RUT del Paciente"
                                    value={rutPaciente}
                                    onChange={(e) => setRutPaciente(e.target.value)}
                                    required
                                />
                                <button type="submit" className="btn btn-primary" disabled={cargandoPaciente}>
                                    {cargandoPaciente ? 'Buscando...' : 'Buscar'}
                                </button>
                            </form>
                            {errorPaciente && <p className="mensaje-feedback error">{errorPaciente}</p>}
                            {pacienteSeleccionado && (
                                <div className="paciente-info-venta">
                                    <p>Paciente: <strong>{pacienteSeleccionado.nombre}</strong> (RUT: {pacienteSeleccionado.rut})</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="card final-venta-card">
                        <div className="card-body">
                            <h5 className="card-title">Confirmar Venta</h5>
                            <div className="resumen-venta">
                                <p>Productos en cesta: {cart.length}</p>
                                <p>Paciente seleccionado: {pacienteSeleccionado ? pacienteSeleccionado.nombre : 'Ninguno'}</p>
                                <p>Total a pagar: <strong>${calcularTotal().toLocaleString('es-CL')}</strong></p>
                            </div>
                            <button
                                className="btn btn-primary btn-large mt-3"
                                onClick={handleProcesarVenta}
                                disabled={isProcessingSale || cart.length === 0 || !pacienteSeleccionado}
                            >
                                {isProcessingSale ? 'Procesando...' : 'Procesar Venta'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PuntoDeVenta;
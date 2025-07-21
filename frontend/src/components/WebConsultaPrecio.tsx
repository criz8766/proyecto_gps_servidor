// frontend/src/components/WebConsultaPrecio.tsx

import React, { useState, useEffect, useCallback, ChangeEvent, FormEvent } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { listarProductosAPI, Producto } from '../api/inventario';
import './FormularioPaciente.css'; // Reutilizamos estilos generales de formulario
import './WebConsultaPrecio.css'; // Estilos específicos para la consulta de precios

const WebConsultaPrecio: React.FC = () => {
    const { getAccessTokenSilently, isAuthenticated } = useAuth0();
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [searchResults, setSearchResults] = useState<Producto[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [allProducts, setAllProducts] = useState<Producto[]>([]); // Para almacenar todos los productos y filtrar en el frontend

    // Cargar todos los productos una vez al iniciar el componente
    useEffect(() => {
        const fetchAllProducts = async () => {
            if (!isAuthenticated) {
                setError('Inicia sesión para consultar precios.');
                return;
            }
            setIsLoading(true);
            setError(null);
            try {
                const token = await getAccessTokenSilently({
                    authorizationParams: { audience: process.env.REACT_APP_AUTH0_API_AUDIENCE! },
                });
                const data = await listarProductosAPI(token);
                setAllProducts(data);
            } catch (err: any) {
                setError(err.message || 'Error al cargar productos para la consulta.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchAllProducts();
    }, [isAuthenticated, getAccessTokenSilently]);

    // Manejar el cambio en el campo de búsqueda
    const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    // Realizar la búsqueda/filtrado de productos
    const performSearch = useCallback((query: string) => {
        if (!query) {
            setSearchResults([]);
            return;
        }
        const filtered = allProducts.filter(product =>
            product.nombre.toLowerCase().includes(query.toLowerCase()) ||
            (product.descripcion && product.descripcion.toLowerCase().includes(query.toLowerCase()))
        );
        setSearchResults(filtered);
    }, [allProducts]);

    // Ejecutar búsqueda cuando el término de búsqueda cambia
    useEffect(() => {
        performSearch(searchTerm);
    }, [searchTerm, performSearch]);

    // Manejar el envío del formulario (opcional, ya que la búsqueda es en tiempo real)
    const handleSearchSubmit = (e: FormEvent) => {
        e.preventDefault();
        performSearch(searchTerm);
    };

    if (!isAuthenticated) {
      return <p className="mensaje-feedback">Inicia sesión para consultar precios.</p>;
    }

    return (
        <div className="consulta-precio-container">
            <h2 className="section-title">Consulta de Precios</h2>
            
            <div className="card mb-4">
                <div className="card-body">
                    <h5 className="card-title">Buscar Producto</h5>
                    <form onSubmit={handleSearchSubmit} className="form-inline-search">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Nombre o descripción del producto..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                            aria-label="Buscar producto"
                        />
                        <button type="submit" className="btn btn-primary" disabled={isLoading}>
                            {isLoading ? 'Cargando...' : 'Buscar'}
                        </button>
                    </form>
                    {error && <p className="mensaje-feedback error">{error}</p>}
                </div>
            </div>

            <div className="search-results-section">
                {isLoading && <p>Cargando productos...</p>}
                {!isLoading && !searchTerm && <p className="mensaje-feedback">Introduce un término para buscar productos.</p>}
                {!isLoading && searchTerm && searchResults.length === 0 && (
                    <p className="mensaje-feedback">No se encontraron productos con "{searchTerm}".</p>
                )}

                {searchResults.length > 0 && (
                    <div className="tabla-responsive-container"> {/* Reutiliza el estilo de tabla */}
                        <table className="pacientes-table">
                            <thead>
                                <tr>
                                    <th>Nombre</th>
                                    <th>Descripción</th>
                                    <th>Precio Venta</th>
                                    <th>Stock</th>
                                </tr>
                            </thead>
                            <tbody>
                                {searchResults.map(product => (
                                    <tr key={product.id}>
                                        <td data-label="Nombre">{product.nombre}</td>
                                        <td data-label="Descripción">{product.descripcion || 'N/A'}</td>
                                        <td data-label="Precio">${product.precio_venta.toLocaleString('es-CL')}</td>
                                        <td data-label="Stock">{product.stock}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WebConsultaPrecio;
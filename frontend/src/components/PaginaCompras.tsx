// frontend/src/components/PaginaCompras.tsx

import React, { useState, useCallback } from 'react';
import FormularioOrdenCompra from '../components/FormularioOrdenCompra';
import ListarOrdenesCompra from '../components/ListarOrdenesCompra';
import './Pagina.css'; // Estilos generales de página

const PaginaCompras: React.FC = () => {
    // Estado para forzar la recarga de la lista de órdenes de compra
    const [refrescarOrdenes, setRefrescarOrdenes] = useState(0);

    // Callback para notificar que una orden fue creada o recibida
    const handleOrdenesActualizadas = useCallback(() => {
        setRefrescarOrdenes(prev => prev + 1);
    }, []);

    return (
        <div className="page-container">
            <h2 className="section-title">Módulo de Compras</h2>
            <div className="dashboard-container"> {/* Reutiliza el layout de dashboard */}
                <div className="card component-card">
                    <FormularioOrdenCompra onOrdenCreada={handleOrdenesActualizadas} />
                </div>
                <div className="card component-card">
                    <ListarOrdenesCompra key={refrescarOrdenes} onOrdenesActualizadas={handleOrdenesActualizadas} />
                </div>
            </div>
        </div>
    );
};

export default PaginaCompras;

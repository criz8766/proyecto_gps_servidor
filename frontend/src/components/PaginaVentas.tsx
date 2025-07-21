// frontend/src/components/PaginaVentas.tsx

import React from 'react';
import RegistrarVenta from './RegistrarVenta';
import './Pagina.css'; // Un archivo CSS general para páginas, lo crearemos en el paso 3.

const PaginaVentas: React.FC = () => {
    return (
        <div className="page-container">
            <RegistrarVenta />
        </div>
    );
};

export default PaginaVentas;
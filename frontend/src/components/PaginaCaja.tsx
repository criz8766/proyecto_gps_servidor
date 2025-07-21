// frontend/src/components/PaginaCaja.tsx

import React from 'react';
import PuntoDeVenta from './PuntoDeVenta';
import './Pagina.css'; // Estilos generales de página

const PaginaCaja: React.FC = () => {
    return (
        <div className="page-container">
            {/* PuntoDeVenta contiene su propio título h2 */}
            <PuntoDeVenta />
        </div>
    );
};

export default PaginaCaja;
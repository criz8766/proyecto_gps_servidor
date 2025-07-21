// frontend/src/components/PaginaConsultaPrecio.tsx

import React from 'react';
import WebConsultaPrecio from './WebConsultaPrecio';
import './Pagina.css'; // Estilos generales de página

const PaginaConsultaPrecio: React.FC = () => {
    return (
        <div className="page-container">
            {/* El título se define dentro de WebConsultaPrecio, así que no es necesario aquí */}
            <WebConsultaPrecio />
        </div>
    );
};

export default PaginaConsultaPrecio;

// frontend/src/components/PaginaDashboard.tsx

import React from 'react';
import DashboardContent from './DashboardContent';
import './Pagina.css'; // Estilos generales de página

const PaginaDashboard: React.FC = () => {
    return (
        <div className="page-container">
            <h2 className="section-title">Dashboard del Sistema</h2> {/* Usamos section-title de RegistrarVenta.css si está importado globalmente, o de Pagina.css */}
            <DashboardContent />
        </div>
    );
};

export default PaginaDashboard;
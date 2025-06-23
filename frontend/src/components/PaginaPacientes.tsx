// frontend/src/pages/PaginaPacientes.tsx
import React from 'react';
import CrearPaciente from '../components/CrearPaciente';
import ListarPacientes from '../components/ListarPacientes';

const PaginaPacientes: React.FC = () => {
    return (
        <div className="dashboard-container">
            <div className="card component-card">
                <CrearPaciente />
            </div>
            <div className="card component-card">
                <ListarPacientes />
            </div>
        </div>
    );
};

export default PaginaPacientes;
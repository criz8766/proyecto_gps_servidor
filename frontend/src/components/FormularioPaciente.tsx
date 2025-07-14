// frontend/src/components/FormularioPaciente.tsx
import React from 'react';
import './FormularioPaciente.css';
import { PacienteCreate } from '../api/pacientes';

// La 'interface' define las "reglas" o "contrato" de qué props acepta este componente.
interface FormularioPacienteProps {
  formData: PacienteCreate;
  mensaje: string;
  isSubmitting: boolean;
  textoBoton: string;
  tituloFormulario: string;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
  isAuthenticated: boolean; // <--- ESTA ES LA LÍNEA CLAVE QUE SOLUCIONA EL ERROR.
}

const FormularioPaciente: React.FC<FormularioPacienteProps> = ({
  formData,
  mensaje,
  isSubmitting,
  textoBoton,
  tituloFormulario,
  handleChange,
  handleSubmit,
  isAuthenticated, // La recibimos aquí
}) => {
  return (
    <div className="formulario-container">
      <h2>{tituloFormulario}</h2>

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="nombre">Nombre Completo</label>
          <input
            type="text"
            id="nombre"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            required
            placeholder="Ej: Javiera Paz Gonzalez"
          />
        </div>

        <div className="form-group">
          <label htmlFor="rut">RUT</label>
          <input
            type="text"
            id="rut"
            name="rut"
            value={formData.rut}
            onChange={handleChange}
            required
            placeholder="Ej: 12.345.678-9"
          />
        </div>

        <div className="form-group">
          <label htmlFor="fecha_nacimiento">Fecha de Nacimiento</label>
          <input
            type="date"
            id="fecha_nacimiento"
            name="fecha_nacimiento"
            value={formData.fecha_nacimiento}
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Procesando...' : textoBoton}
        </button>
      </form>

      {mensaje && <p className="mensaje-feedback">{mensaje}</p>}
    </div>
  );
};

export default FormularioPaciente;

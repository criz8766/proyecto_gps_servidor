// frontend/src/components/CrearPaciente.tsx
import React, { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { crearPacienteAPI, PacienteCreate } from '../api/pacientes';
import FormularioPaciente from './FormularioPaciente';

const CrearPaciente: React.FC = () => {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();
  
  const [formData, setFormData] = useState<PacienteCreate>({
    nombre: '',
    rut: '',
    fecha_nacimiento: '',
  });
  const [mensaje, setMensaje] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setMensaje('Debe iniciar sesión para realizar esta acción.');
      return;
    }
    setIsSubmitting(true);
    setMensaje('Registrando paciente...');
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: { audience: process.env.REACT_APP_AUTH0_API_AUDIENCE! },
      });
      const pacienteCreado = await crearPacienteAPI(formData, token);
      setMensaje(`Paciente "${pacienteCreado.nombre}" creado con ID: ${pacienteCreado.id}`);
      setFormData({ nombre: '', rut: '', fecha_nacimiento: '' }); // Limpiar
    } catch (error: any) {
      const errorData = error.response?.data;
      const errorMessage = errorData?.message || error.message || 'Error desconocido al crear paciente.';
      setMensaje(errorMessage);
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormularioPaciente
      formData={formData}
      handleChange={handleChange}
      handleSubmit={handleSubmit}
      mensaje={mensaje}
      isSubmitting={isSubmitting}
      isAuthenticated={isAuthenticated} // <-- ¡AÑADIMOS LA PROP QUE FALTABA AQUÍ!
      textoBoton="Crear Paciente"
      tituloFormulario="Registrar Nuevo Paciente"
    />
  );
};

export default CrearPaciente;
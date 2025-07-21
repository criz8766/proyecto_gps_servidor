// frontend/src/components/FormularioUsuario.tsx

import React, { useState, useEffect } from 'react';
import { UsuarioCreate, Usuario } from '../api/usuarios';
import './FormularioPaciente.css'; // Reutilizamos los estilos existentes

interface FormularioUsuarioProps {
  initialData?: Usuario | null; // Datos iniciales para edición
  onSubmit: (data: UsuarioCreate) => Promise<void>;
  isSubmitting: boolean;
  mensaje: string;
  textoBoton: string;
  tituloFormulario: string;
}

const FormularioUsuario: React.FC<FormularioUsuarioProps> = ({
  initialData,
  onSubmit,
  isSubmitting,
  mensaje,
  textoBoton,
  tituloFormulario,
}) => {
  const [formData, setFormData] = useState<UsuarioCreate>({
    email: '',
    password: '',
    nombre: '',
    rol: 'vendedor', // Rol por defecto, puedes ajustarlo
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        email: initialData.email,
        nombre: initialData.nombre,
        rol: initialData.rol,
        password: '', // No precargamos la contraseña por seguridad
      });
    } else {
      setFormData({ email: '', password: '', nombre: '', rol: 'vendedor' });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
    // No limpiamos el formulario aquí si es para edición, se espera que el padre lo maneje.
    // Si es para creación y éxito, el componente padre podría reinicializar initialData a null.
    if (!initialData && mensaje.includes("exitosamente")) { // Si es creación y éxito, limpiamos.
        setFormData({ email: '', password: '', nombre: '', rol: 'vendedor' });
    }
  };

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
            placeholder="Ej: Juan Pérez"
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="ejemplo@farmacia.com"
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Contraseña {initialData ? "(dejar en blanco para no cambiar)" : ""}</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password || ''}
            onChange={handleChange}
            required={!initialData} // Requerida solo para creación
            placeholder={initialData ? "Dejar en blanco para no cambiar" : "Contraseña"}
          />
        </div>
        <div className="form-group">
          <label htmlFor="rol">Rol</label>
          <select
            id="rol"
            name="rol"
            value={formData.rol}
            onChange={handleChange}
            className="form-control" // Reutiliza estilo de select si existe en FormularioPaciente.css o Pagina.css
          >
            <option value="administrador">Administrador</option>
            <option value="vendedor">Vendedor</option>
            <option value="cajero">Cajero</option>
            <option value="inventario">Admin. Inventario</option>
          </select>
        </div>
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Procesando...' : textoBoton}
        </button>
      </form>
      {mensaje && <p className={`mensaje-feedback ${mensaje.includes('Error') ? 'error' : (mensaje.includes('exitosamente') ? 'success' : '')}`}>{mensaje}</p>}
    </div>
  );
};

export default FormularioUsuario;
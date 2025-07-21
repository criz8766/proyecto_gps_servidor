// frontend/src/components/RegistrarVenta.tsx

import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Paciente, obtenerPacientePorRutAPI, registrarDispensacionAPI } from '../api/pacientes';
import { Producto, listarProductosAPI } from '../api/inventario';
import './FormularioPaciente.css'; // Reutilizamos estilos generales de formulario
import './RegistrarVenta.css'; // Crearemos este archivo para estilos específicos

const RegistrarVenta: React.FC = () => {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();

  const [rutPaciente, setRutPaciente] = useState<string>('');
  const [pacienteEncontrado, setPacienteEncontrado] = useState<Paciente | null>(null);
  const [errorPaciente, setErrorPaciente] = useState<string | null>(null);
  const [cargandoPaciente, setCargandoPaciente] = useState<boolean>(false);

  const [productosDisponibles, setProductosDisponibles] = useState<Producto[]>([]);
  const [cargandoProductos, setCargandoProductos] = useState<boolean>(false);
  const [errorProductos, setErrorProductos] = useState<string | null>(null);

  const [productoSeleccionadoId, setProductoSeleccionadoId] = useState<string>('');
  const [cantidad, setCantidad] = useState<number>(1);
  const [mensajeDispensacion, setMensajeDispensacion] = useState<string | null>(null);
  const [isSubmittingDispensacion, setIsSubmittingDispensacion] = useState<boolean>(false);

  // Cargar productos disponibles al iniciar
  useEffect(() => {
    const fetchProductos = async () => {
      if (!isAuthenticated) return;
      setCargandoProductos(true);
      setErrorProductos(null);
      try {
        const token = await getAccessTokenSilently();
        const data = await listarProductosAPI(token);
        setProductosDisponibles(data);
        if (data.length > 0) {
          setProductoSeleccionadoId(data[0].id.toString()); // Seleccionar el primero por defecto
        }
      } catch (err: any) {
        setErrorProductos(err.message || 'Error al cargar productos.');
      } finally {
        setCargandoProductos(false);
      }
    };
    fetchProductos();
  }, [isAuthenticated, getAccessTokenSilently]);

  // Manejar búsqueda de paciente por RUT
  const handleBuscarPaciente = async (e: FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !rutPaciente) {
      setErrorPaciente('Por favor, ingrese un RUT para buscar.');
      return;
    }
    setCargandoPaciente(true);
    setErrorPaciente(null);
    setPacienteEncontrado(null);
    try {
      const token = await getAccessTokenSilently();
      const paciente = await obtenerPacientePorRutAPI(rutPaciente, token);
      setPacienteEncontrado(paciente);
    } catch (err: any) {
      setErrorPaciente(err.message || 'Paciente no encontrado o error en la búsqueda.');
      setPacienteEncontrado(null);
    } finally {
      setCargandoPaciente(false);
    }
  };

  // Manejar el registro de una nueva dispensación/venta
  const handleRegistrarDispensacion = async (e: FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !pacienteEncontrado || !productoSeleccionadoId || cantidad <= 0) {
      setMensajeDispensacion('Faltan datos para registrar la venta (paciente, producto o cantidad inválida).');
      return;
    }

    setIsSubmittingDispensacion(true);
    setMensajeDispensacion('Registrando venta...');
    try {
      const token = await getAccessTokenSilently();
      await registrarDispensacionAPI(pacienteEncontrado.id, {
        producto_id: parseInt(productoSeleccionadoId, 10),
        cantidad: cantidad,
      }, token);
      setMensajeDispensacion('Venta registrada con éxito. Stock actualizado.');
      // Opcional: Recargar productos para reflejar el stock si la API lo soporta.
      // Si el backend envía eventos, podríamos escucharlos aquí.
    } catch (err: any) {
      setMensajeDispensacion(err.message || 'Error al registrar la venta.');
    } finally {
      setIsSubmittingDispensacion(false);
    }
  };

  if (!isAuthenticated) {
    return <p className="mensaje-feedback">Inicia sesión para registrar ventas.</p>;
  }

  return (
    <div className="registrar-venta-container">
      <h2 className="section-title">Registrar Nueva Venta / Dispensación</h2>

      {/* Sección de Búsqueda de Paciente */}
      <div className="card mb-4">
        <div className="card-body">
          <h5 className="card-title">1. Buscar Paciente</h5>
          <form onSubmit={handleBuscarPaciente} className="form-inline-search">
            <input
              type="text"
              className="form-control"
              placeholder="RUT del Paciente (ej: 12.345.678-9)"
              value={rutPaciente}
              onChange={(e) => setRutPaciente(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-primary" disabled={cargandoPaciente}>
              {cargandoPaciente ? 'Buscando...' : 'Buscar Paciente'}
            </button>
          </form>
          {errorPaciente && <p className="mensaje-feedback error">{errorPaciente}</p>}
          {pacienteEncontrado && (
            <div className="paciente-info">
              <p>Paciente encontrado: <strong>{pacienteEncontrado.nombre}</strong> (RUT: {pacienteEncontrado.rut})</p>
            </div>
          )}
        </div>
      </div>

      {/* Sección de Registro de Venta */}
      {pacienteEncontrado && (
        <div className="card">
          <div className="card-body">
            <h5 className="card-title">2. Registrar Venta para {pacienteEncontrado.nombre}</h5>
            {mensajeDispensacion && <p className={`mensaje-feedback ${mensajeDispensacion.includes('Error') ? 'error' : 'success'}`}>{mensajeDispensacion}</p>}
            
            <form onSubmit={handleRegistrarDispensacion}>
              <div className="form-group">
                <label htmlFor="producto">Producto:</label>
                {cargandoProductos ? (
                  <p>Cargando productos...</p>
                ) : errorProductos ? (
                  <p className="mensaje-feedback error">{errorProductos}</p>
                ) : (
                  <select
                    id="producto"
                    name="producto"
                    className="form-control"
                    value={productoSeleccionadoId}
                    onChange={(e) => setProductoSeleccionadoId(e.target.value)}
                    required
                  >
                    {productosDisponibles.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} (Stock: {p.stock})
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="cantidad">Cantidad:</label>
                <input
                  type="number"
                  id="cantidad"
                  name="cantidad"
                  className="form-control"
                  value={cantidad}
                  onChange={(e) => setCantidad(parseInt(e.target.value, 10))}
                  min="1"
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={isSubmittingDispensacion}>
                {isSubmittingDispensacion ? 'Registrando...' : 'Registrar Venta'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistrarVenta;
import React, { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { 
    descargarReporteVentas, 
    descargarTopVendidos, 
    descargarAlertasStock,
    descargarSinMovimiento // Asegúrate de añadir esta importación
} from '../api/informes';

const PaginaInformes: React.FC = () => {
    const { getAccessTokenSilently } = useAuth0();

    // Estados para cada reporte
    const [fechasVentas, setFechasVentas] = useState({ inicio: '', fin: '' });
    const [fechasTop, setFechasTop] = useState({ inicio: '', fin: '' });
    const [limiteTop, setLimiteTop] = useState(10);
    const [umbralStock, setUmbralStock] = useState(20);
    const [fechaSinMovimiento, setFechaSinMovimiento] = useState('');

    const [isLoading, setIsLoading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Función genérica para manejar la descarga de archivos y errores
    const ejecutarDescarga = async (nombreReporte: string, accionApi: () => Promise<Blob>, nombreArchivo: string) => {
        setIsLoading(nombreReporte);
        setError(null);
        try {
            const blob = await accionApi();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', nombreArchivo);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err: any) {
            setError(err.message || 'Ocurrió un error inesperado.');
        } finally {
            setIsLoading(null);
        }
    };

    // Handlers para cada botón de descarga
    const handleDescargarVentas = async () => {
        if (!fechasVentas.inicio || !fechasVentas.fin) {
            setError('Por favor, seleccione ambas fechas para el reporte de ventas.');
            return;
        }
        const token = await getAccessTokenSilently();
        ejecutarDescarga(
            'ventas',
            () => descargarReporteVentas(token, fechasVentas.inicio, fechasVentas.fin),
            `reporte_ventas_${fechasVentas.inicio}_a_${fechasVentas.fin}.xlsx`
        );
    };

    const handleDescargarTop = async () => {
        if (!fechasTop.inicio || !fechasTop.fin) {
            setError('Por favor, seleccione ambas fechas para el top de productos.');
            return;
        }
        const token = await getAccessTokenSilently();
        ejecutarDescarga(
            'top',
            () => descargarTopVendidos(token, fechasTop.inicio, fechasTop.fin, limiteTop),
            `top_${limiteTop}_productos_${fechasTop.inicio}_a_${fechasTop.fin}.xlsx`
        );
    };

    const handleDescargarAlertas = async () => {
        const token = await getAccessTokenSilently();
        ejecutarDescarga(
            'alertas',
            () => descargarAlertasStock(token, umbralStock),
            `reporte_alertas_stock_bajo_${umbralStock}.xlsx`
        );
    };
    
    const handleDescargarSinMovimiento = async () => {
        if (!fechaSinMovimiento) {
            setError('Por favor, seleccione una fecha de inicio.');
            return;
        }
        const token = await getAccessTokenSilently();
        ejecutarDescarga(
            'sinMovimiento',
            () => descargarSinMovimiento(token, fechaSinMovimiento),
            `reporte_sin_movimiento_desde_${fechaSinMovimiento}.xlsx`
        );
    };

    return (
        <div className="container mt-4">
            <h2>Generar Reportes</h2>
            {error && <div className="alert alert-danger" onClick={() => setError(null)} style={{cursor: 'pointer'}}>{error}</div>}

            {/* Tarjeta Reporte de Ventas */}
            <div className="card mb-4">
                <div className="card-body">
                    <h5 className="card-title">Reporte de Ventas por Fecha</h5>
                    <div className="row g-3 align-items-end">
                        <div className="col-auto">
                            <label className="form-label">Fecha de Inicio:</label>
                            <input type="date" className="form-control" value={fechasVentas.inicio} onChange={(e) => setFechasVentas({...fechasVentas, inicio: e.target.value})} />
                        </div>
                        <div className="col-auto">
                            <label className="form-label">Fecha de Fin:</label>
                            <input type="date" className="form-control" value={fechasVentas.fin} onChange={(e) => setFechasVentas({...fechasVentas, fin: e.target.value})} />
                        </div>
                        <div className="col-auto">
                            <button onClick={handleDescargarVentas} className="btn btn-primary" disabled={isLoading === 'ventas'}>
                                {isLoading === 'ventas' ? 'Generando...' : 'Descargar Ventas'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tarjeta Top Productos Vendidos */}
            <div className="card mb-4">
                <div className="card-body">
                    <h5 className="card-title">Top Productos Más Vendidos</h5>
                    <div className="row g-3 align-items-end">
                        <div className="col-auto">
                            <label className="form-label">Fecha de Inicio:</label>
                            <input type="date" className="form-control" value={fechasTop.inicio} onChange={(e) => setFechasTop({...fechasTop, inicio: e.target.value})} />
                        </div>
                        <div className="col-auto">
                            <label className="form-label">Fecha de Fin:</label>
                            <input type="date" className="form-control" value={fechasTop.fin} onChange={(e) => setFechasTop({...fechasTop, fin: e.target.value})} />
                        </div>
                        <div className="col-auto">
                            <label className="form-label">Límite:</label>
                            <input type="number" className="form-control" value={limiteTop} onChange={(e) => setLimiteTop(parseInt(e.target.value, 10))} style={{width: '100px'}} />
                        </div>
                        <div className="col-auto">
                            <button onClick={handleDescargarTop} className="btn btn-success" disabled={isLoading === 'top'}>
                                {isLoading === 'top' ? 'Generando...' : 'Descargar Top'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tarjeta Alertas de Stock Bajo */}
            <div className="card mb-4">
                <div className="card-body">
                    <h5 className="card-title">Reporte de Alertas de Stock</h5>
                    <div className="row g-3 align-items-end">
                        <div className="col-auto">
                            <label className="form-label">Umbral de Stock Mínimo:</label>
                            <input type="number" className="form-control" value={umbralStock} onChange={(e) => setUmbralStock(parseInt(e.target.value, 10))} style={{width: '120px'}} />
                        </div>
                        <div className="col-auto">
                            <button onClick={handleDescargarAlertas} className="btn btn-warning" disabled={isLoading === 'alertas'}>
                                {isLoading === 'alertas' ? 'Generando...' : 'Descargar Alertas'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Tarjeta Productos sin Movimiento */}
            <div className="card">
                <div className="card-body">
                    <h5 className="card-title">Reporte de Productos sin Movimiento</h5>
                    <div className="row g-3 align-items-end">
                        <div className="col-auto">
                            <label className="form-label">Sin ventas desde:</label>
                            <input type="date" className="form-control" value={fechaSinMovimiento} onChange={(e) => setFechaSinMovimiento(e.target.value)} />
                        </div>
                        <div className="col-auto">
                            <button onClick={handleDescargarSinMovimiento} className="btn btn-info" disabled={isLoading === 'sinMovimiento'}>
                                {isLoading === 'sinMovimiento' ? 'Generando...' : 'Descargar Reporte'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaginaInformes;
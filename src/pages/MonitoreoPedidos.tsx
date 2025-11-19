// src/pages/MonitoreoPedidos.tsx
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import orderService from '../services/order.service';
import pdfService from '../services/pdf.service';
import type { Pedido } from '../types/order';
import '../Styles/MonitoreoPedidos.css';

const MonitoreoPedidos: React.FC = () => {
  const { user } = useAuth();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPedidos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await orderService.getOrders();
      console.log('[MONITOREO] Pedidos cargados:', data);
      console.log('[MONITOREO] Usuario actual:', user);
      
      // Si es admin (rolId === 0), mostrar TODOS los pedidos
      const isAdmin = user && (user.rolId === 0 || user.rol === 'admin' || user.rol === 'ADMINISTRADOR' || user.rol === 'ADMIN');
      
      if (isAdmin) {
        console.log('[MONITOREO] Usuario es admin, mostrando todos los pedidos');
        setPedidos(data);
      } else {
        console.log('[MONITOREO] Usuario no es admin, filtrando por usuario');
        // Para clientes, filtrar solo sus pedidos
        const userPedidos = data.filter(p => {
          const pedidoUserId = p.usuario?.id || p.usuarioId;
          return pedidoUserId === user?.id;
        });
        setPedidos(userPedidos);
      }
    } catch (error) {
      console.error('[MONITOREO] Error:', error);
      setPedidos([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadPedidos();
  }, [loadPedidos]);

  // Auto-refresh cada 3 segundos
  useEffect(() => {
    const interval = setInterval(loadPedidos, 3000);
    return () => clearInterval(interval);
  }, [loadPedidos]);

  const formatDate = (date?: string) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return `$${(num || 0).toLocaleString('es-CO')}`;
  };

  const isAdmin = user && (user.rolId === 0 || user.rol === 'ADMINISTRADOR' || user.rol === 'ADMIN');

  const handleExportPDF = () => {
    pdfService.generateOrdersReport(pedidos);
  };

  if (loading) return <div className="loading">⏳ Cargando pedidos...</div>;

  return (
    <div className="monitoreo-page">
      <div className="monitoreo-header">
        <div>
          <h1>🚚 Monitoreo de Pedidos {isAdmin ? '(Administrador)' : ''}</h1>
          <p>Total de pedidos: <strong>{pedidos.length}</strong></p>
        </div>
        {pedidos.length > 0 && (
          <button onClick={handleExportPDF} className="btn-export-pdf">
            📄 Exportar PDF
          </button>
        )}
      </div>
      
      {pedidos.length === 0 ? (
        <div className="empty-state">
          <p>📦 No hay pedidos registrados</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="monitoreo-table">
            <thead>
              <tr>
                <th>ID</th>
                {isAdmin && <th>Cliente</th>}
                <th>Fecha</th>
                <th>Estado</th>
                <th>Dirección</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {pedidos.map(p => (
                <tr key={p.id}>
                  <td className="id-cell">#{p.id}</td>
                  {isAdmin && (
                    <td className="client-cell">
                      {p.usuario?.nombre || 'N/A'} {p.usuario?.apellido || ''}
                    </td>
                  )}
                  <td>{formatDate(p.fechaPedido || p.fechaCreacion)}</td>
                  <td>
                    <span className={`status-badge status-${p.estadoPedido?.toLowerCase()}`}>
                      {p.estadoPedido}
                    </span>
                  </td>
                  <td className="address-cell">{p.direccionEnvio}</td>
                  <td className="total-cell">{formatCurrency(p.totalPedido)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MonitoreoPedidos;

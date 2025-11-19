// src/pages/Pedidos.tsx
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import orderService from '../services/order.service';
import type { Pedido } from '../types/order';

const Pedidos: React.FC = () => {
  const { user } = useAuth();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadPedidos();
    }
  }, [user?.id]);

  const loadPedidos = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      console.log('[PEDIDOS] Cargando pedidos del usuario:', user.id);
      const data = await orderService.getOrders();
      console.log('[PEDIDOS] Todos los pedidos:', data);
      
      // 🔑 Filtrar usando p.usuario?.id (objeto anidado del backend)
      const userPedidos = data.filter(p => {
        const pedidoUserId = p.usuario?.id || p.usuarioId;
        console.log('[PEDIDOS] Comparando:', pedidoUserId, 'con:', user.id);
        return pedidoUserId === user.id;
      });
      
      console.log('[PEDIDOS] Pedidos filtrados:', userPedidos.length);
      setPedidos(userPedidos);
    } catch (error) {
      console.error('[PEDIDOS] Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string | Date | undefined): string => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) return <p>Cargando pedidos...</p>;
  if (pedidos.length === 0) return <p>No tienes pedidos registrados.</p>;

  return (
    <div className="pedidos-page">
      <h1>Mis Pedidos</h1>
      <div className="orders-list">
        {pedidos.map(pedido => (
          <div className="order-card" key={pedido.id}>
            <div className="order-header">
              <h3>Pedido #{pedido.id}</h3>
              <p>{formatDate(pedido.fechaPedido || pedido.fechaCreacion)}</p>
              <span className={`status-${pedido.estadoPedido?.toLowerCase()}`}>
                {pedido.estadoPedido}
              </span>
            </div>
            
            <div className="order-total">
              ${(pedido.totalPedido || 0).toLocaleString('es-ES')}
            </div>

            <button onClick={() => setExpandedId(
              expandedId === pedido.id ? null : (pedido.id || null)
            )}>
              {expandedId === pedido.id ? 'Ocultar' : 'Ver'} detalles
            </button>

            {expandedId === pedido.id && (
              <div className="order-details">
                <p><strong>Dirección:</strong> {pedido.direccionEnvio}</p>
                <p><strong>Método de Pago:</strong> {pedido.metodoPago?.nombrePago || `ID: ${pedido.metodoPagoId}`}</p>
                
                {pedido.detalles && pedido.detalles.length > 0 && (
                  <div className="items-list">
                    <h4>Productos:</h4>
                    {pedido.detalles.map((detalle, idx) => (
                      <div key={idx} className="item">
                        <p>{detalle.producto?.nombre || 'Producto'}</p>
                        <p>Cantidad: {detalle.cantidadProducto}</p>
                        <p>Precio: ${detalle.precioUnitario}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Pedidos;

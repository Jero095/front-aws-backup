// src/pages/DashboardSupabase.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import pdfService from '../services/pdf.service';
import type { Pedido } from '../types/order';
import '../Styles/Dashboard.css';

interface PedidoSupabase {
  id_producto: number;
  nombre_producto: string;
  id_cliente: number;
  nombre_cliente: string;
  precio_unitario: number;
  cantidad: number;
  fecha: string;
  estado: string;
}

const DashboardSupabase: React.FC = () => {
  const { user } = useAuth();
  const [pedidos, setPedidos] = useState<PedidoSupabase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPedidosSupabase();
  }, []);

  const loadPedidosSupabase = async () => {
    setLoading(true);
    try {
      console.log('[DASHBOARD SUPABASE] Cargando pedidos...');
      
      // URL completa con API key en query string
      const SUPABASE_URL = 'https://mvgcmaoegxbgexehbtbl.supabase.co/rest/v1/v_pedidos_detalle?select=*&apikey=sb_publishable_yn7Ora4gB4Tf1dtpmMc61A_b3Hyix1q';
      
      const response = await fetch(SUPABASE_URL, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data: PedidoSupabase[] = await response.json();
      console.log('[DASHBOARD SUPABASE] Pedidos cargados:', data.length);
      
      // Ordenar por fecha descendente (más recientes primero)
      const pedidosOrdenados = data.sort((a, b) => 
        new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      );
      
      setPedidos(pedidosOrdenados);
    } catch (error) {
      console.error('[DASHBOARD SUPABASE] Error:', error);
      setPedidos([]);
    } finally {
      setLoading(false);
    }
  };

  // Calcular estadísticas
  const totalVentas = pedidos.reduce((sum, p) => {
    return sum + (p.precio_unitario * p.cantidad);
  }, 0);

  // Productos únicos vendidos
  const productosUnicos = new Map<number, { nombre: string; ventas: number }>();
  pedidos.forEach(p => {
    const existing = productosUnicos.get(p.id_producto);
    if (existing) {
      existing.ventas += p.cantidad;
    } else {
      productosUnicos.set(p.id_producto, {
        nombre: p.nombre_producto,
        ventas: p.cantidad
      });
    }
  });

  // Clientes únicos
  const clientesUnicos = new Set(pedidos.map(p => p.id_cliente)).size;

  // Pedidos del día actual
  const pedidosHoy = pedidos.filter(p => {
    const fecha = new Date(p.fecha);
    const hoy = new Date();
    return fecha.toDateString() === hoy.toDateString();
  }).length;

  // Pedidos por estado
  const pedidosPorEstado = pedidos.reduce((acc, p) => {
    acc[p.estado] = (acc[p.estado] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString('es-CO')}`;
  };

  const formatDate = (date: string): string => {
    const d = new Date(date);
    return d.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleExportPedidos = () => {
    // Convertir pedidos de Supabase al formato del servicio PDF
    const pedidosParaPDF: Pedido[] = pedidos.map(p => ({
      id: p.id_producto,
      fechaPedido: p.fecha,
      estadoPedido: p.estado,
      totalPedido: p.precio_unitario * p.cantidad,
      direccionEnvio: 'N/A',
      usuario: {
        id: p.id_cliente,
        nombre: p.nombre_cliente.split(' ')[0],
        apellido: p.nombre_cliente.split(' ').slice(1).join(' ')
      }
    }));
    
    pdfService.generateOrdersReport(pedidosParaPDF);
  };

  if (loading) {
    return <div className="loading">⏳ Cargando dashboard de Supabase...</div>;
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1>📊 Dashboard Supabase - Historial de Pedidos</h1>
          <p>Bienvenido, {user?.nombre} {user?.apellido}</p>
        </div>
        <div className="export-buttons">
          <button onClick={handleExportPedidos} className="btn-export primary">
            📄 Exportar Pedidos Supabase
          </button>
          <button onClick={loadPedidosSupabase} className="btn-export secondary">
            🔄 Actualizar Datos
          </button>
        </div>
      </div>

      {/* Estadísticas principales */}
      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>Total Ventas</h3>
            <p className="stat-value">{formatCurrency(totalVentas)}</p>
            <span className="stat-label">{pedidos.length} ítems vendidos</span>
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <h3>Productos Únicos</h3>
            <p className="stat-value">{productosUnicos.size}</p>
            <span className="stat-label">Diferentes productos</span>
          </div>
        </div>

        <div className="stat-card info">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>Clientes</h3>
            <p className="stat-value">{clientesUnicos}</p>
            <span className="stat-label">Clientes únicos</span>
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <h3>Pedidos Hoy</h3>
            <p className="stat-value">{pedidosHoy}</p>
            <span className="stat-label">Último día</span>
          </div>
        </div>
      </div>

      {/* Estadísticas por estado */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2>📊 Pedidos por Estado</h2>
        </div>
        <div className="stats-grid">
          {Object.entries(pedidosPorEstado).map(([estado, cantidad]) => (
            <div key={estado} className="stat-card">
              <div className="stat-content">
                <h3>{estado}</h3>
                <p className="stat-value">{cantidad}</p>
                <span className="stat-label">pedidos</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabla de todos los pedidos */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2>📋 Historial Completo de Pedidos</h2>
          <span className="btn-link">{pedidos.length} registros</span>
        </div>
        
        {pedidos.length === 0 ? (
          <p className="empty-message">No hay pedidos disponibles en Supabase</p>
        ) : (
          <div className="table-container">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>ID Producto</th>
                  <th>Producto</th>
                  <th>Cliente</th>
                  <th>Precio Unit.</th>
                  <th>Cantidad</th>
                  <th>Total</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {pedidos.map((pedido, index) => (
                  <tr key={`${pedido.id_producto}-${pedido.id_cliente}-${index}`}>
                    <td>#{pedido.id_producto}</td>
                    <td>{pedido.nombre_producto}</td>
                    <td>{pedido.nombre_cliente}</td>
                    <td>{formatCurrency(pedido.precio_unitario)}</td>
                    <td className="text-center">{pedido.cantidad}</td>
                    <td className="total-cell">
                      {formatCurrency(pedido.precio_unitario * pedido.cantidad)}
                    </td>
                    <td>{formatDate(pedido.fecha)}</td>
                    <td>
                      <span className={`status-badge status-${pedido.estado.toLowerCase().replace('_', '-')}`}>
                        {pedido.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Top productos más vendidos */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2>🏆 Top Productos Más Vendidos</h2>
        </div>
        <div className="table-container">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Producto</th>
                <th>Unidades Vendidas</th>
              </tr>
            </thead>
            <tbody>
              {Array.from(productosUnicos.entries())
                .sort((a, b) => b[1].ventas - a[1].ventas)
                .slice(0, 10)
                .map(([id, data]) => (
                  <tr key={id}>
                    <td>#{id}</td>
                    <td>{data.nombre}</td>
                    <td>
                      <span className="stock-badge low-stock">{data.ventas} unidades</span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Accesos rápidos */}
      <div className="dashboard-section">
        <h2>⚡ Accesos Rápidos</h2>
        <div className="quick-actions">
          <Link to="/dashboard" className="action-card">
            <div className="action-icon">📊</div>
            <h3>Dashboard AWS</h3>
            <p>Ver dashboard principal</p>
          </Link>
          <Link to="/productos" className="action-card">
            <div className="action-icon">📦</div>
            <h3>Gestionar Productos</h3>
            <p>Ver y editar inventario</p>
          </Link>
          <Link to="/monitoreo-pedidos" className="action-card">
            <div className="action-icon">🚚</div>
            <h3>Monitoreo Pedidos AWS</h3>
            <p>Ver pedidos del sistema principal</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DashboardSupabase;

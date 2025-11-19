// src/pages/Dashboard.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import orderService from '../services/order.service';
import productService from '../services/product.service';
import pdfService from '../services/pdf.service';
import type { Pedido } from '../types/order';
import type { Producto } from '../types/product';
import '../Styles/Dashboard.css';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pedidosData, productosData] = await Promise.all([
        orderService.getOrders(),
        productService.getProducts()
      ]);
      setPedidos(pedidosData);
      setProductos(productosData);
    } catch (error) {
      console.error('[DASHBOARD] Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calcular estadísticas
  const totalVentas = pedidos.reduce((sum, p) => {
    const total = typeof p.totalPedido === 'string' ? parseFloat(p.totalPedido) : p.totalPedido;
    return sum + (total || 0);
  }, 0);

  const pedidosRecientes = pedidos
    .sort((a, b) => {
      const dateA = new Date(a.fechaPedido || a.fechaCreacion || 0).getTime();
      const dateB = new Date(b.fechaPedido || b.fechaCreacion || 0).getTime();
      return dateB - dateA;
    })
    .slice(0, 5);

  const productosConBajoStock = productos.filter(p => p.stock < 10);

  const formatCurrency = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return `$${(num || 0).toLocaleString('es-CO')}`;
  };

  const formatDate = (date: string | Date | undefined): string => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleExportDashboard = () => {
    pdfService.generateDashboardReport(pedidos, productos, totalVentas);
  };

  const handleExportOrders = () => {
    pdfService.generateOrdersReport(pedidos);
  };

  const handleExportInventory = () => {
    pdfService.generateInventoryReport(productos);
  };

  if (loading) {
    return <div className="loading">⏳ Cargando dashboard...</div>;
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1>📊 Dashboard Administrativo</h1>
          <p>Bienvenido, {user?.nombre} {user?.apellido}</p>
        </div>
        <div className="export-buttons">
          <button onClick={handleExportDashboard} className="btn-export primary">
            📄 Exportar Dashboard
          </button>
          <button onClick={handleExportOrders} className="btn-export secondary">
            🚚 Exportar Pedidos
          </button>
          <button onClick={handleExportInventory} className="btn-export tertiary">
            📦 Exportar Inventario
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
            <span className="stat-label">{pedidos.length} pedidos</span>
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <h3>Productos</h3>
            <p className="stat-value">{productos.length}</p>
            <span className="stat-label">En inventario</span>
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <h3>Stock Bajo</h3>
            <p className="stat-value">{productosConBajoStock.length}</p>
            <span className="stat-label">Productos con menos de 10 unidades</span>
          </div>
        </div>

        <div className="stat-card info">
          <div className="stat-icon">🛒</div>
          <div className="stat-content">
            <h3>Pedidos Hoy</h3>
            <p className="stat-value">
              {pedidos.filter(p => {
                const fecha = new Date(p.fechaPedido || p.fechaCreacion || 0);
                const hoy = new Date();
                return fecha.toDateString() === hoy.toDateString();
              }).length}
            </p>
            <span className="stat-label">Último día</span>
          </div>
        </div>
      </div>

      {/* Sección de pedidos recientes */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2>📋 Pedidos Recientes</h2>
          <Link to="/monitoreo-pedidos" className="btn-link">Ver todos →</Link>
        </div>
        
        {pedidosRecientes.length === 0 ? (
          <p className="empty-message">No hay pedidos registrados</p>
        ) : (
          <div className="table-container">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Cliente</th>
                  <th>Fecha</th>
                  <th>Total</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {pedidosRecientes.map(pedido => (
                  <tr key={pedido.id}>
                    <td>#{pedido.id}</td>
                    <td>
                      {pedido.usuario?.nombre || 'Usuario'} {pedido.usuario?.apellido || ''}
                    </td>
                    <td>{formatDate(pedido.fechaPedido || pedido.fechaCreacion)}</td>
                    <td className="total-cell">{formatCurrency(pedido.totalPedido)}</td>
                    <td>
                      <span className={`status-badge status-${pedido.estadoPedido?.toLowerCase()}`}>
                        {pedido.estadoPedido}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sección de productos con stock bajo */}
      {productosConBajoStock.length > 0 && (
        <div className="dashboard-section">
          <div className="section-header">
            <h2>⚠️ Productos con Stock Bajo</h2>
            <Link to="/productos" className="btn-link">Gestionar →</Link>
          </div>
          
          <div className="table-container">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th>Stock</th>
                  <th>Precio</th>
                </tr>
              </thead>
              <tbody>
                {productosConBajoStock.slice(0, 5).map(producto => (
                  <tr key={producto.id} className="warning-row">
                    <td>#{producto.id}</td>
                    <td>{producto.nombre}</td>
                    <td>{producto.categoria?.nombre || 'N/A'}</td>
                    <td>
                      <span className={`stock-badge ${producto.stock === 0 ? 'out-stock' : 'low-stock'}`}>
                        {producto.stock} unidades
                      </span>
                    </td>
                    <td>{formatCurrency(producto.precio)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Accesos rápidos */}
      <div className="dashboard-section">
        <h2>⚡ Accesos Rápidos</h2>
        <div className="quick-actions">
          <Link to="/productos" className="action-card">
            <div className="action-icon">📦</div>
            <h3>Gestionar Productos</h3>
            <p>Ver y editar inventario</p>
          </Link>
          <Link to="/monitoreo-pedidos" className="action-card">
            <div className="action-icon">🚚</div>
            <h3>Ver Pedidos</h3>
            <p>Monitorear todos los pedidos</p>
          </Link>
          <Link to="/" className="action-card">
            <div className="action-icon">🏠</div>
            <h3>Ir al Inicio</h3>
            <p>Volver a la página principal</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

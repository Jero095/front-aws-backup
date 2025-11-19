// src/pages/Home.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import productService from '../services/product.service';
import cartService from '../services/cart.service';
import type { Producto } from '../types/product';
import '../Styles/Home.css';

const Home: React.FC = () => {
  const { user } = useAuth();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadProductos();
  }, []);

  const loadProductos = async () => {
    setLoading(true);
    try {
      const data = await productService.getProducts();
      // Mostrar solo los primeros 10 productos
      setProductos(data.slice(0, 10));
    } catch (error) {
      console.error('Error cargando productos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (productoId: number, precio: number) => {
    if (!user?.id) {
      setMessage('⚠️ Debes iniciar sesión para agregar al carrito');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      await cartService.addToCart({
        usuarioId: user.id,
        productoId,
        cantidadProducto: 1,
        precioUnitario: precio
      });
      setMessage('✅ Producto agregado al carrito');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error agregando al carrito:', error);
      setMessage('❌ Error al agregar al carrito');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  // Vista para ADMINISTRADORES (rolId === 0)
  const isAdmin = user && (user.rolId === 0 || user.rol === 'admin' || user.rol === 'ADMINISTRADOR' || user.rol === 'ADMIN');
  
  if (isAdmin) {
    return (
      <div className="home-page admin-view">
        <div className="admin-header">
          <h1>Panel de Administración - HydroSyS</h1>
          <p>Bienvenido, {user.nombre} {user.apellido}</p>
        </div>
        <div className="admin-options">
          <Link to="/dashboard" className="admin-card">
            <div className="card-icon">📊</div>
            <h3>Dashboard</h3>
            <p>Ver estadísticas y reportes</p>
          </Link>
          <Link to="/productos" className="admin-card">
            <div className="card-icon">📦</div>
            <h3>Gestión de Productos</h3>
            <p>Administrar inventario</p>
          </Link>
          <Link to="/monitoreo-pedidos" className="admin-card">
            <div className="card-icon">🚚</div>
            <h3>Monitoreo de Pedidos</h3>
            <p>Ver todos los pedidos</p>
          </Link>
        </div>
      </div>
    );
  }

  // Vista principal de e-commerce (usuarios logueados y no logueados)
  return (
    <div className="home-page ecommerce-view">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1>HydroSyS - Tu Proveedor de Confianza</h1>
          <p className="hero-subtitle">Los mejores cilindros de gas al mejor precio</p>
          {!user && (
            <div className="hero-cta">
              <Link to="/register" className="btn btn-primary">Crear Cuenta</Link>
              <Link to="/login" className="btn btn-secondary">Iniciar Sesión</Link>
            </div>
          )}
          {user && (
            <div className="user-welcome">
              <span className="welcome-text">¡Hola, {user.nombre}! 👋</span>
              <div className="quick-links">
                <Link to="/carrito" className="quick-link">
                  🛒 Mi Carrito
                </Link>
                <Link to="/pedidos" className="quick-link">
                  📦 Mis Pedidos
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Message Alert */}
      {message && (
        <div className={`alert-message ${message.includes('✅') ? 'success' : message.includes('❌') ? 'error' : 'warning'}`}>
          {message}
        </div>
      )}

      {/* Categorías destacadas */}
      <section className="categories-section">
        <h2>Categorías Destacadas</h2>
        <div className="categories-grid">
          <div className="category-card">
            <div className="category-icon">🔥</div>
            <h3>Inflamables</h3>
          </div>
          <div className="category-card">
            <div className="category-icon">⚠️</div>
            <h3>Tóxicos</h3>
          </div>
          <div className="category-card">
            <div className="category-icon">💧</div>
            <h3>Líquidos</h3>
          </div>
          <div className="category-card">
            <div className="category-icon">🌡️</div>
            <h3>Gases Comprimidos</h3>
          </div>
        </div>
      </section>

      {/* Productos Destacados */}
      <section className="products-section">
        <div className="section-header">
          <h2>Productos Destacados</h2>
          <Link to="/productos" className="view-all-link">Ver todos →</Link>
        </div>

        {loading ? (
          <div className="loading-skeleton">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="skeleton-card"></div>
            ))}
          </div>
        ) : productos.length === 0 ? (
          <div className="empty-state">
            <p>📦 No hay productos disponibles en este momento</p>
          </div>
        ) : (
          <div className="products-grid">
            {productos.map((producto) => (
              <div key={producto.id} className="product-card">
                <Link to={`/producto/${producto.id}`} className="product-link">
                  <div className="product-image-container">
                    {producto.imagenUrl ? (
                      <img 
                        src={producto.imagenUrl} 
                        alt={producto.nombre}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x300?text=Sin+Imagen';
                        }}
                      />
                    ) : (
                      <div className="no-image">
                        <span>📦</span>
                        <p>Sin imagen</p>
                      </div>
                    )}
                    {producto.stock < 10 && producto.stock > 0 && (
                      <span className="stock-badge low-stock">¡Últimas unidades!</span>
                    )}
                    {producto.stock === 0 && (
                      <span className="stock-badge out-stock">Agotado</span>
                    )}
                  </div>

                  <div className="product-info">
                    <h3 className="product-name">{producto.nombre}</h3>
                    <p className="product-description">{producto.descripcion}</p>
                    
                    {producto.categoria && (
                      <span className="product-category">{producto.categoria.nombre}</span>
                    )}

                    <div className="price-section">
                      <span className="price">${producto.precio.toLocaleString('es-CO')}</span>
                      <span className="stock-info">Stock: {producto.stock}</span>
                    </div>
                  </div>
                </Link>

                <div className="product-footer">
                  <button 
                    onClick={() => handleAddToCart(producto.id!, producto.precio)}
                    className="btn-add-cart"
                    disabled={producto.stock === 0}
                  >
                    {producto.stock === 0 ? 'Agotado' : '🛒 Agregar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Benefits Section */}
      <section className="benefits-section">
        <h2>¿Por qué comprar con nosotros?</h2>
        <div className="benefits-grid">
          <div className="benefit-card">
            <div className="benefit-icon">🚚</div>
            <h3>Envío Rápido</h3>
            <p>Entregas en 24-48 horas</p>
          </div>
          <div className="benefit-card">
            <div className="benefit-icon">✅</div>
            <h3>Calidad Garantizada</h3>
            <p>Productos certificados</p>
          </div>
          <div className="benefit-card">
            <div className="benefit-icon">💳</div>
            <h3>Pago Seguro</h3>
            <p>Múltiples métodos de pago</p>
          </div>
          <div className="benefit-card">
            <div className="benefit-icon">📞</div>
            <h3>Atención 24/7</h3>
            <p>Soporte siempre disponible</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

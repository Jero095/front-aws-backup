// src/pages/ProductoDetalle.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import productService from '../services/product.service';
import cartService from '../services/cart.service';
import type { Producto } from '../types/product';
import '../Styles/ProductoDetalle.css';

const ProductoDetalle: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [producto, setProducto] = useState<Producto | null>(null);
  const [cantidad, setCantidad] = useState(1);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      loadProducto(parseInt(id));
    }
  }, [id]);

  const loadProducto = async (productoId: number) => {
    setLoading(true);
    setError('');
    try {
      const data = await productService.getProductById(productoId);
      setProducto(data);
    } catch (error) {
      console.error('Error cargando producto:', error);
      setError('No se pudo cargar el producto');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!user?.id) {
      setMessage('⚠️ Debes iniciar sesión para agregar al carrito');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      return;
    }

    if (!producto?.id) return;

    try {
      await cartService.addToCart({
        usuarioId: user.id,
        productoId: producto.id,
        cantidadProducto: cantidad,
        precioUnitario: producto.precio
      });
      setMessage(`✅ ${cantidad} ${cantidad === 1 ? 'producto agregado' : 'productos agregados'} al carrito`);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error agregando al carrito:', error);
      setMessage('❌ Error al agregar al carrito');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleBuyNow = async () => {
    if (!user?.id) {
      setMessage('⚠️ Debes iniciar sesión para comprar');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      return;
    }

    await handleAddToCart();
    setTimeout(() => {
      navigate('/cart');
    }, 1000);
  };

  const incrementCantidad = () => {
    if (producto && cantidad < producto.stock) {
      setCantidad(cantidad + 1);
    }
  };

  const decrementCantidad = () => {
    if (cantidad > 1) {
      setCantidad(cantidad - 1);
    }
  };

  if (loading) {
    return <div className="loading">⏳ Cargando producto...</div>;
  }

  if (error || !producto) {
    return (
      <div className="error-page">
        <h2>❌ {error || 'Producto no encontrado'}</h2>
        <Link to="/productos" className="btn btn-primary">Volver al catálogo</Link>
      </div>
    );
  }

  const precioTotal = producto.precio * cantidad;
  const disponible = producto.stock > 0;

  return (
    <div className="producto-detalle-page">
      <div className="breadcrumb">
        <Link to="/">Inicio</Link>
        <span> / </span>
        <Link to="/productos">Productos</Link>
        <span> / </span>
        <span>{producto.nombre}</span>
      </div>

      {/* Notification Popup */}
      {message && (
        <div className={`notification-popup ${message.includes('✅') ? 'success' : message.includes('❌') ? 'error' : 'warning'}`}>
          <div className="notification-content">
            <span className="notification-icon">
              {message.includes('✅') ? '✅' : message.includes('❌') ? '❌' : '⚠️'}
            </span>
            <div className="notification-text">
              <p className="notification-message">{message.replace(/[✅❌⚠]/g, '').trim()}</p>
            </div>
            <button 
              className="notification-close" 
              onClick={() => setMessage('')}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="producto-detalle-container">
        {/* Imagen del producto */}
        <div className="producto-imagen-section">
          <div className="imagen-principal">
            <img 
              src={producto.imagenUrl || 'https://via.placeholder.com/500x500?text=Sin+Imagen'} 
              alt={producto.nombre}
              onError={(e) => {
                e.currentTarget.src = 'https://via.placeholder.com/500x500?text=Sin+Imagen';
              }}
            />
          </div>
        </div>

        {/* Información del producto */}
        <div className="producto-info-section">
          <h1 className="producto-titulo">{producto.nombre}</h1>

          {producto.categoria && (
            <div className="producto-categoria">
              <span className="categoria-badge">{producto.categoria.nombre}</span>
            </div>
          )}

          <div className="producto-precio-section">
            <div className="precio-principal">
              ${producto.precio.toLocaleString('es-CO')}
            </div>
            <div className="precio-info">
              {disponible ? (
                <span className="stock-disponible">✓ Disponible ({producto.stock} en stock)</span>
              ) : (
                <span className="stock-agotado">✗ Agotado</span>
              )}
            </div>
          </div>

          <div className="producto-descripcion">
            <h3>Descripción</h3>
            <p>{producto.descripcion}</p>
          </div>

          {/* Selector de cantidad y botones */}
          {disponible && (
            <div className="producto-acciones">
              <div className="cantidad-selector">
                <label>Cantidad:</label>
                <div className="cantidad-controls">
                  <button 
                    onClick={decrementCantidad}
                    disabled={cantidad <= 1}
                    className="btn-cantidad"
                  >
                    -
                  </button>
                  <span className="cantidad-display">{cantidad}</span>
                  <button 
                    onClick={incrementCantidad}
                    disabled={cantidad >= producto.stock}
                    className="btn-cantidad"
                  >
                    +
                  </button>
                </div>
                <span className="cantidad-info">Máximo: {producto.stock}</span>
              </div>

              <div className="precio-total">
                <span className="label">Total:</span>
                <span className="valor">${precioTotal.toLocaleString('es-CO')}</span>
              </div>

              <div className="botones-compra">
                <button 
                  onClick={handleAddToCart}
                  className="btn btn-secondary btn-agregar-carrito"
                >
                  🛒 Agregar al Carrito
                </button>
                <button 
                  onClick={handleBuyNow}
                  className="btn btn-primary btn-comprar-ahora"
                >
                  ⚡ Comprar Ahora
                </button>
              </div>
            </div>
          )}

          {!disponible && (
            <div className="producto-no-disponible">
              <p>Este producto no está disponible en este momento</p>
              <Link to="/productos" className="btn btn-secondary">Ver otros productos</Link>
            </div>
          )}
        </div>
      </div>

      {/* Información adicional */}
      <div className="producto-info-adicional">
        <div className="info-card">
          <div className="info-icon">🚚</div>
          <div className="info-content">
            <h4>Envío</h4>
            <p>Envío a todo el país</p>
          </div>
        </div>
        <div className="info-card">
          <div className="info-icon">🔒</div>
          <div className="info-content">
            <h4>Compra Segura</h4>
            <p>Protegemos tus datos</p>
          </div>
        </div>
        <div className="info-card">
          <div className="info-icon">↩️</div>
          <div className="info-content">
            <h4>Devoluciones</h4>
            <p>30 días para devolver</p>
          </div>
        </div>
        <div className="info-card">
          <div className="info-icon">💬</div>
          <div className="info-content">
            <h4>Soporte</h4>
            <p>Atención personalizada</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductoDetalle;

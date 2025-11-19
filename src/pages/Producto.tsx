// src/pages/Producto.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import productService from '../services/product.service';
import cartService from '../services/cart.service';
import type { Producto } from '../types/product';
import '../Styles/Producto.css';

const Productos: React.FC = () => {
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
      setProductos(data);
    } catch (error) {
      console.error('Error cargando productos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (productoId: number, precio: number) => {
    if (!user?.id) {
      setMessage('Debes iniciar sesión para agregar al carrito');
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
    }
  };

  if (loading) {
    return <div className="loading">Cargando productos...</div>;
  }

  return (
    <div className="productos-page">
      <h1>Catálogo de Productos</h1>
      
      {message && <div className="message">{message}</div>}
      
      <div className="productos-grid">
        {productos.length === 0 ? (
          <p>No hay productos disponibles</p>
        ) : (
          productos.map(producto => (
            <div key={producto.id} className="producto-card">
              <Link to={`/producto/${producto.id}`} className="producto-link">
                {producto.imagenUrl ? (
                  <img src={producto.imagenUrl} alt={producto.nombre} />
                ) : (
                  <img src="https://via.placeholder.com/300x300?text=Sin+Imagen" alt={producto.nombre} />
                )}
                <h3>{producto.nombre}</h3>
                <p className="descripcion">{producto.descripcion}</p>
                <p className="precio">${producto.precio.toLocaleString('es-ES')}</p>
              </Link>
              <p className="stock">Stock: {producto.stock}</p>
              {producto.categoria && (
                <p className="categoria">Categoría: {producto.categoria.nombre}</p>
              )}
              {user && (
                <button 
                  onClick={() => handleAddToCart(producto.id!, producto.precio)}
                  className="btn btn-primary"
                  disabled={producto.stock === 0}
                >
                  {producto.stock === 0 ? 'Sin Stock' : 'Agregar al Carrito'}
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Productos;

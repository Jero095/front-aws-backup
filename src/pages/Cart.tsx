// src/pages/Cart.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import cartService from '../services/cart.service';
import checkoutService from '../services/checkout.service';
import type { DetalleCarrito } from '../types/cart';
import '../Styles/Cart.css';

const Cart: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<DetalleCarrito[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadCart();
    }
  }, [user?.id]);

  const loadCart = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await cartService.getCart(user.id);
      setItems(data);
    } catch (error) {
      console.error('Error cargando carrito:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id: number) => {
    try {
      await cartService.deleteCartItem(id);
      await loadCart();
    } catch (error) {
      console.error('Error eliminando item:', error);
    }
  };

  const handleCheckout = async () => {
    if (!user?.id || items.length === 0) return;

    setProcessing(true);
    try {
      const result = await checkoutService.processPurchase(
        user.id,
        items,
        1, // metodoPagoId
        'Dirección de envío del usuario'
      );

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/pedidos');
        }, 3000);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error: any) {
      console.error('Error en checkout:', error);
      alert('Error al procesar la compra');
    } finally {
      setProcessing(false);
    }
  };

  const total = items.reduce((sum, item) => {
    const cantidad = item.cantidadProducto || item.cantidad || 1;
    return sum + (item.producto?.precio || 0) * cantidad;
  }, 0);

  if (success) {
    return (
      <div className="cart-page">
        <div className="success-message">
          <h2>✅ ¡Compra exitosa!</h2>
          <p>Redirigiendo a tus pedidos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <h1>Mi Carrito</h1>
      
      {loading ? (
        <p>Cargando...</p>
      ) : items.length === 0 ? (
        <p>Tu carrito está vacío</p>
      ) : (
        <>
          <div className="cart-items">
            {items.map(item => {
              const cantidad = item.cantidadProducto || item.cantidad || 1;
              return (
                <div key={item.id} className="cart-item">
                  <h3>{item.producto?.nombre}</h3>
                  <p>Cantidad: {cantidad}</p>
                  <p>Precio: ${item.producto?.precio}</p>
                  <p>Subtotal: ${(item.producto?.precio || 0) * cantidad}</p>
                  <button onClick={() => handleRemove(item.id!)}>Eliminar</button>
                </div>
              );
            })}
          </div>
          
          <div className="cart-summary">
            <h2>Total: ${total.toLocaleString('es-ES')}</h2>
            <button 
              onClick={handleCheckout} 
              disabled={processing}
              className="btn btn-primary"
            >
              {processing ? '⏳ Procesando compra...' : 'Comprar Ahora'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Cart;

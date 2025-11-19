# Resumen Completo del Proyecto HydroSys - Frontend React + TypeScript

## 🎯 Contexto General
Aplicación e-commerce para venta de cilindros de gas desarrollada con:
- **Frontend**: React 18.3.1 + TypeScript 5.9 + Vite 7.1.9
- **Backend**: Spring Boot + PostgreSQL (puerto 8080)
- **Autenticación**: JWT con localStorage
- **Rutas**: react-router-dom 7.9.3

---

## 🔐 Sistema de Autenticación (CRÍTICO)

### Problema Principal Resuelto
**El backend NO devuelve un objeto `usuario` anidado, devuelve propiedades planas:**

```typescript
// ❌ Lo que esperábamos inicialmente:
{ token: "...", usuario: { id: 1, email: "...", rol: "CLIENTE" } }

// ✅ Lo que realmente devuelve el backend:
{ 
  token: "eyJhbGc...",
  userId: 2,          // ← ID como userId, NO id
  email: "user@example.com",
  rol: "CLIENTE",
  nombre: "Juan",     // Opcional
  apellido: "Pérez"   // Opcional
}
```

### Solución Implementada

#### 1. **AuthContext.tsx** - Inicialización desde localStorage
```typescript
// src/contexts/AuthContext.tsx
interface User {
  id: number;
  email: string;
  nombre: string;
  apellido: string;
  rol: string;
}

const AuthContext = createContext<{
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegistroUsuarioDTO) => Promise<void>;
  logout: () => void;
  loading: boolean;
  error: string | null;
} | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🔑 CLAVE: Inicializar desde localStorage al montar
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user_data');
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  // Sincronización entre pestañas
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'user_data' && e.newValue) {
        setUser(JSON.parse(e.newValue));
      } else if (e.key === 'user_data' && !e.newValue) {
        setUser(null);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const userData = await authService.login(email, password);
      setUser(userData);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al iniciar sesión');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
};
```

#### 2. **auth.service.ts** - Transformación de Respuesta del Backend
```typescript
// src/services/auth.service.ts
import API from './api';
import type { User, LoginDTO, RegistroUsuarioDTO } from '../types/user';

class AuthService {
  async login(email: string, password: string): Promise<User> {
    const response = await API.post('/api/auth/login', { email, password });
    const data = response.data;

    // 🔑 TRANSFORMAR la respuesta plana del backend a objeto User
    const usuario: User = {
      id: data.userId || data.id,  // Backend usa "userId"
      email: data.email,
      nombre: data.nombre || 'Usuario',
      apellido: data.apellido || '',
      rol: data.rol || 'CLIENTE'
    };

    // Guardar en localStorage
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('user_data', JSON.stringify(usuario));

    return usuario;
  }

  async register(dto: RegistroUsuarioDTO): Promise<User> {
    const response = await API.post('/api/auth/register', dto);
    const data = response.data;

    const usuario: User = {
      id: data.userId || data.id,
      email: data.email,
      nombre: data.nombre || dto.nombre,
      apellido: data.apellido || dto.apellido,
      rol: data.rol || 'CLIENTE'
    };

    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('user_data', JSON.stringify(usuario));

    return usuario;
  }

  logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
  }
}

export default new AuthService();
```

#### 3. **api.ts** - Interceptor de Axios
```typescript
// src/services/api.ts
import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:8080',
  headers: { 'Content-Type': 'application/json' }
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;
```

---

## 📄 Páginas y Vistas (3 Tipos de Usuario)

### 1. **Home.tsx** - Página Principal con Vista Condicional
```typescript
// src/pages/Home.tsx
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  const { user } = useAuth();

  // Vista para usuarios NO logueados
  if (!user) {
    return (
      <div className="home-page">
        <h1>Bienvenido a HydroSyS</h1>
        <p>Tu proveedor confiable de cilindros de gas</p>
        <div className="cta-buttons">
          <Link to="/login" className="btn btn-primary">Iniciar Sesión</Link>
          <Link to="/register" className="btn btn-secondary">Registrarse</Link>
        </div>
      </div>
    );
  }

  // Vista para ADMINISTRADORES
  if (user.rol === 'ADMINISTRADOR' || user.rol === 'ADMIN') {
    return (
      <div className="home-page admin-view">
        <h1>Panel de Administración - HydroSyS</h1>
        <p>Bienvenido, {user.nombre} {user.apellido}</p>
        <div className="admin-options">
          <Link to="/dashboard" className="admin-card">
            <h3>📊 Dashboard</h3>
            <p>Ver estadísticas y reportes</p>
          </Link>
          <Link to="/productos" className="admin-card">
            <h3>📦 Gestión de Productos</h3>
            <p>Administrar inventario</p>
          </Link>
          <Link to="/pedidos" className="admin-card">
            <h3>🚚 Pedidos</h3>
            <p>Gestionar pedidos de clientes</p>
          </Link>
        </div>
      </div>
    );
  }

  // Vista para CLIENTES logueados
  return (
    <div className="home-page customer-view">
      <h1>Bienvenido, {user.nombre}!</h1>
      <p>Explora nuestro catálogo de productos</p>
      <div className="customer-options">
        <Link to="/productos" className="customer-card">
          <h3>🛒 Ver Productos</h3>
          <p>Explora nuestro catálogo</p>
        </Link>
        <Link to="/carrito" className="customer-card">
          <h3>🛍️ Mi Carrito</h3>
          <p>Ver productos seleccionados</p>
        </Link>
        <Link to="/pedidos" className="customer-card">
          <h3>📦 Mis Pedidos</h3>
          <p>Historial de compras</p>
        </Link>
      </div>
    </div>
  );
};
```

### 2. **ProtectedRoute Component**
```typescript
// src/components/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAdmin = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading">Cargando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && user.rol !== 'ADMINISTRADOR' && user.rol !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
```

### 3. **Navbar.tsx** - Navegación Condicional
```typescript
// src/components/Navbar.tsx
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <Link to="/" className="logo">HydroSyS</Link>
      
      <div className="nav-links">
        {!user ? (
          // Usuario NO logueado
          <>
            <Link to="/login">Iniciar Sesión</Link>
            <Link to="/register">Registrarse</Link>
          </>
        ) : user.rol === 'ADMINISTRADOR' || user.rol === 'ADMIN' ? (
          // Administrador
          <>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/productos">Productos</Link>
            <Link to="/pedidos">Pedidos</Link>
            <Link to="/perfil">Perfil</Link>
            <button onClick={logout}>Cerrar Sesión</button>
          </>
        ) : (
          // Cliente
          <>
            <Link to="/productos">Productos</Link>
            <Link to="/carrito">Carrito</Link>
            <Link to="/pedidos">Mis Pedidos</Link>
            <Link to="/perfil">Perfil</Link>
            <button onClick={logout}>Cerrar Sesión</button>
          </>
        )}
      </div>
    </nav>
  );
};
```

---

## 🛒 Sistema de Carrito y Compras

### Problema Resuelto: Método de Pago
**Error inicial**: `400 Bad Request - "Método de pago no encontrado"`

**Causa**: Frontend enviaba `metodoPagoId: 1` pero no existía en la base de datos.

**Solución**: Usuario insertó manualmente en la BD:
```sql
INSERT INTO metodo_pago (id, nombre_pago) VALUES (1, 'Efectivo');
```

### 1. **cart.service.ts**
```typescript
// src/services/cart.service.ts
import API from './api';
import type { DetalleCarrito, DetalleCarritoDTO } from '../types/cart';

class CartService {
  async getCart(userId: number): Promise<DetalleCarrito[]> {
    const res = await API.get<DetalleCarrito[]>(`/api/carrito/${userId}`);
    return res.data;
  }

  async addToCart(dto: DetalleCarritoDTO): Promise<DetalleCarrito> {
    const res = await API.post<DetalleCarrito>('/api/carrito', dto);
    return res.data;
  }

  async deleteCartItem(id: number): Promise<void> {
    await API.delete(`/api/carrito/${id}`);
  }

  async clearCart(userId: number): Promise<void> {
    await API.delete(`/api/carrito/vaciar/${userId}`);
  }
}

export default new CartService();
```

### 2. **checkout.service.ts** - Flujo de Compra Completo
```typescript
// src/services/checkout.service.ts
import orderService from './order.service';
import orderDetailService from './order-detail.service';
import productService from './product.service';
import cartService from './cart.service';
import type { DetalleCarrito } from '../types/cart';
import type { PedidoDTO, DetallePedidoDTO } from '../types/order';

class CheckoutService {
  async processPurchase(
    usuarioId: number,
    cartItems: DetalleCarrito[],
    metodoPagoId: number = 1,
    direccionEnvio: string = 'Dirección por defecto'
  ): Promise<{ success: boolean; pedidoId?: number; error?: string }> {
    try {
      console.log('[CHECKOUT] Iniciando proceso de compra...');

      // 1. Calcular total
      const totalPedido = cartItems.reduce((sum, item) => {
        const precio = item.producto?.precio || 0;
        return sum + (precio * item.cantidad);
      }, 0);

      console.log('[CHECKOUT] Total calculado:', totalPedido);

      // 2. Crear pedido (Backend espera totalPedido como STRING para BigDecimal)
      const pedidoDTO: PedidoDTO = {
        usuarioId,
        metodoPagoId,
        estadoPedido: 'LISTO',
        direccionEnvio,
        totalPedido: String(totalPedido)  // 🔑 IMPORTANTE: Convertir a string
      };

      const pedido = await orderService.createOrder(pedidoDTO);
      console.log('[CHECKOUT] Pedido creado:', pedido.id);

      // 3. Crear detalles del pedido
      for (const item of cartItems) {
        const detalle: DetallePedidoDTO = {
          pedidoId: pedido.id!,
          productoId: item.producto!.id!,
          cantidadProducto: item.cantidad,
          precioUnitario: item.producto!.precio
        };
        await orderDetailService.createOrderDetail(detalle);
        console.log('[CHECKOUT] Detalle creado para producto:', item.producto!.id);
      }

      // 4. Eliminar productos del inventario
      for (const item of cartItems) {
        await productService.deleteProduct(item.producto!.id!);
        console.log('[CHECKOUT] Producto eliminado del inventario:', item.producto!.id);
      }

      // 5. Limpiar carrito
      await cartService.clearCart(usuarioId);
      console.log('[CHECKOUT] Carrito limpiado');

      return { success: true, pedidoId: pedido.id };

    } catch (error: any) {
      console.error('[CHECKOUT] Error en proceso de compra:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Error al procesar la compra' 
      };
    }
  }
}

export default new CheckoutService();
```

### 3. **Cart.tsx** - Página del Carrito
```typescript
// src/pages/Cart.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import cartService from '../services/cart.service';
import checkoutService from '../services/checkout.service';
import type { DetalleCarrito } from '../types/cart';

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

  const total = items.reduce((sum, item) => 
    sum + (item.producto?.precio || 0) * item.cantidad, 0
  );

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
            {items.map(item => (
              <div key={item.id} className="cart-item">
                <h3>{item.producto?.nombre}</h3>
                <p>Cantidad: {item.cantidad}</p>
                <p>Precio: ${item.producto?.precio}</p>
                <p>Subtotal: ${(item.producto?.precio || 0) * item.cantidad}</p>
                <button onClick={() => handleRemove(item.id!)}>Eliminar</button>
              </div>
            ))}
          </div>
          
          <div className="cart-summary">
            <h2>Total: ${total}</h2>
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
```

---

## 📦 Sistema de Pedidos

### Problema CRÍTICO Resuelto: Backend Devuelve Objeto Usuario Anidado

**Backend Model (Pedido.java)**:
```java
@ManyToOne
@JoinColumn(name = "id_usuario", nullable = false)
private Usuario usuario;
```

**Respuesta JSON del Backend**:
```json
{
  "id": 1,
  "usuario": {
    "id": 2,
    "email": "user@example.com",
    "nombre": "Juan"
  },
  "estadoPedido": "LISTO",
  "direccionEnvio": "...",
  "totalPedido": 50000,
  "fechaPedido": "2025-11-13T10:30:00"
}
```

### 1. **order.ts** - Tipos Actualizados
```typescript
// src/types/order.ts
export interface Pedido {
  id?: number;
  usuario?: {           // 🔑 Backend devuelve objeto anidado
    id: number;
    email?: string;
    nombre?: string;
    apellido?: string;
  };
  usuarioId?: number;   // Fallback para compatibilidad
  metodoPago?: { id: number; nombrePago?: string };
  metodoPagoId?: number;
  estadoPedido: string;
  direccionEnvio: string;
  totalPedido: number | string;  // Backend usa BigDecimal
  fechaPedido?: string;          // Campo principal del backend
  fechaCreacion?: string;        // Campo alternativo
  detalles?: DetallePedido[];
}

export interface DetallePedido {
  id?: number;
  pedidoId: number;
  productoId: number;
  cantidadProducto: number;
  precioUnitario: number;
  producto?: {
    id: number;
    nombre: string;
    precio: number;
  };
}

export interface PedidoDTO {
  usuarioId: number;
  metodoPagoId: number;
  estadoPedido: string;
  direccionEnvio: string;
  totalPedido: string;  // 🔑 IMPORTANTE: String para BigDecimal del backend
}

export interface DetallePedidoDTO {
  pedidoId: number;
  productoId: number;
  cantidadProducto: number;
  precioUnitario: number;
}
```

### 2. **Pedidos.tsx** - Página de Historial de Pedidos
```typescript
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
```

### 3. **MonitoreoPedidos.tsx** - Vista de Monitoreo (Admin)
```typescript
// src/pages/MonitoreoPedidos.tsx
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import orderService from '../services/order.service';
import type { Pedido } from '../types/order';

const MonitoreoPedidos: React.FC = () => {
  const { user } = useAuth();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPedidos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await orderService.getOrders();
      console.log('[MONITOREO] Pedidos cargados:', data);
      
      if (user) {
        // Filtrar por usuario si no es admin
        const userPedidos = data.filter(p => {
          const pedidoUserId = p.usuario?.id || p.usuarioId;
          return pedidoUserId === user.id;
        });
        setPedidos(userPedidos);
      } else {
        setPedidos(data);
      }
    } catch (error) {
      console.error('[MONITOREO] Error:', error);
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

  if (loading) return <p>⏳ Cargando pedidos...</p>;

  return (
    <div className="monitoreo-page">
      <h1>Monitoreo de Pedidos</h1>
      {pedidos.length === 0 ? (
        <p>📦 No tienes pedidos aún</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Fecha</th>
              <th>Estado</th>
              <th>Dirección</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {pedidos.map(p => (
              <tr key={p.id}>
                <td>#{p.id}</td>
                <td>{formatDate(p.fechaPedido || p.fechaCreacion)}</td>
                <td><span className={`status-${p.estadoPedido?.toLowerCase()}`}>
                  {p.estadoPedido}
                </span></td>
                <td>{p.direccionEnvio}</td>
                <td>${(p.totalPedido || 0).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};
```

---

## 📋 Tipos TypeScript Completos

### **user.ts**
```typescript
// src/types/user.ts
export interface User {
  id: number;
  email: string;
  nombre: string;
  apellido: string;
  rol: string;  // 'CLIENTE' | 'ADMINISTRADOR' | 'ADMIN'
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface RegistroUsuarioDTO {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  telefono?: string;
}
```

### **product.ts**
```typescript
// src/types/product.ts
export interface Producto {
  id?: number;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  categoriaId?: number;
  categoria?: {
    id: number;
    nombre: string;
  };
  imagenUrl?: string;
}

export interface ProductoDTO {
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  categoriaId: number;
  imagenUrl?: string;
}
```

### **cart.ts**
```typescript
// src/types/cart.ts
export interface DetalleCarrito {
  id?: number;
  usuarioId: number;
  productoId: number;
  cantidad: number;
  producto?: {
    id: number;
    nombre: string;
    precio: number;
    descripcion?: string;
    imagenUrl?: string;
  };
}

export interface DetalleCarritoDTO {
  usuarioId: number;
  productoId: number;
  cantidad: number;
}
```

---

## 🔧 Servicios Completos

### **product.service.ts**
```typescript
// src/services/product.service.ts
import API from './api';
import type { Producto, ProductoDTO } from '../types/product';

class ProductService {
  async getProducts(): Promise<Producto[]> {
    const res = await API.get<Producto[]>('/api/productos');
    return res.data;
  }

  async getProductById(id: number): Promise<Producto> {
    const res = await API.get<Producto>(`/api/productos/${id}`);
    return res.data;
  }

  async createProduct(dto: ProductoDTO): Promise<Producto> {
    const res = await API.post<Producto>('/api/productos', dto);
    return res.data;
  }

  async updateProduct(id: number, dto: ProductoDTO): Promise<Producto> {
    const res = await API.put<Producto>(`/api/productos/${id}`, dto);
    return res.data;
  }

  async deleteProduct(id: number): Promise<void> {
    await API.delete(`/api/productos/${id}`);
  }
}

export default new ProductService();
```

### **order.service.ts**
```typescript
// src/services/order.service.ts
import API from './api';
import type { Pedido, PedidoDTO } from '../types/order';

class OrderService {
  async createOrder(dto: PedidoDTO): Promise<Pedido> {
    console.log('[ORDER-SERVICE] Enviando POST a /api/pedidos');
    console.log('[ORDER-SERVICE] Body:', JSON.stringify(dto, null, 2));
    try {
      const res = await API.post<Pedido>('/api/pedidos', dto);
      console.log('[ORDER-SERVICE] Respuesta exitosa:', res.data);
      return res.data;
    } catch (error) {
      console.error('[ORDER-SERVICE] Error en POST /api/pedidos:', error);
      if (error instanceof Error) {
        console.error('[ORDER-SERVICE] Mensaje de error:', error.message);
      }
      
      // Intentar capturar la respuesta del servidor
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        console.error('[ORDER-SERVICE] Estado HTTP:', axiosError.response?.status);
        console.error('[ORDER-SERVICE] Respuesta del servidor:', axiosError.response?.data);
      }
      
      throw error;
    }
  }

  async getOrders(): Promise<Pedido[]> {
    const res = await API.get<Pedido[]>('/api/pedidos');
    return res.data;
  }

  async getOrderById(id: number): Promise<Pedido> {
    const res = await API.get<Pedido>(`/api/pedidos/${id}`);
    return res.data;
  }

  async deleteOrder(id: number): Promise<void> {
    await API.delete(`/api/pedidos/${id}`);
  }
}

export default new OrderService();
```

### **order-detail.service.ts**
```typescript
// src/services/order-detail.service.ts
import API from './api';
import type { DetallePedido, DetallePedidoDTO } from '../types/order';

class OrderDetailService {
  async createOrderDetail(dto: DetallePedidoDTO): Promise<DetallePedido> {
    console.log('[ORDER-DETAIL] Creando detalle:', dto);
    const res = await API.post<DetallePedido>('/api/detalles', dto);
    return res.data;
  }

  async getOrderDetails(pedidoId: number): Promise<DetallePedido[]> {
    const res = await API.get<DetallePedido[]>(`/api/detalles/pedido/${pedidoId}`);
    return res.data;
  }

  async deleteOrderDetail(id: number): Promise<void> {
    await API.delete(`/api/detalles/${id}`);
  }
}

export default new OrderDetailService();
```

---

## 🚨 Problemas Comunes y Soluciones

### 1. **Redirección Infinita al Login**
**Causa**: `user` inicialmente `undefined` en lugar de `null`
**Solución**: Inicializar con `null` y usar `loading` state

### 2. **Error 400 en Compra - "Método de pago no encontrado"**
**Causa**: `metodoPagoId: 1` no existe en BD
**Solución**: 
```sql
INSERT INTO metodo_pago (id, nombre_pago) VALUES (1, 'Efectivo');
```

### 3. **Pedidos No Aparecen en `/pedidos`**
**Causa**: Filtro usa `p.usuarioId` pero backend devuelve `p.usuario.id`
**Solución**: Usar `p.usuario?.id || p.usuarioId`

### 4. **Error 405 en Perfil**
**Causa**: Backend no tiene `GET /api/usuarios/:id`
**Solución**: Mostrar solo datos cacheados de `user` del AuthContext

### 5. **BigDecimal Error en Backend**
**Causa**: Enviar `totalPedido` como número
**Solución**: Convertir a string: `totalPedido: String(total)`

---

## 📁 Estructura de Carpetas Completa

```
front/hydrosysf/
├── src/
│   ├── main.tsx                    # Entry point
│   ├── App.tsx                     # Rutas principales
│   ├── App.css
│   ├── index.css
│   ├── assets/
│   ├── components/
│   │   ├── Navbar.tsx
│   │   └── ProtectedRoute.tsx
│   ├── contexts/
│   │   └── AuthContext.tsx         # 🔑 Estado global de autenticación
│   ├── pages/
│   │   ├── Home.tsx                # Vista condicional (3 tipos de usuario)
│   │   ├── login.tsx
│   │   ├── Producto.tsx
│   │   ├── Cart.tsx
│   │   ├── Pedidos.tsx             # Historial del cliente
│   │   ├── MonitoreoPedidos.tsx    # Vista de monitoreo
│   │   ├── Dashboard.tsx
│   │   └── EditarPerfil.tsx
│   ├── services/
│   │   ├── api.ts                  # Axios instance + interceptor
│   │   ├── auth.service.ts         # 🔑 Transformación de respuesta
│   │   ├── product.service.ts
│   │   ├── cart.service.ts
│   │   ├── order.service.ts
│   │   ├── order-detail.service.ts
│   │   └── checkout.service.ts     # 🔑 Orquesta el flujo de compra
│   ├── types/
│   │   ├── user.ts
│   │   ├── product.ts
│   │   ├── cart.ts
│   │   └── order.ts                # 🔑 Tipos con objetos anidados
│   └── Styles/
│       ├── Home.css
│       ├── Cart.css
│       ├── Producto.css
│       ├── MonitorePedidos.css
│       ├── Dashboard.css
│       └── EditarPerfil.css
├── public/
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
└── eslint.config.js
```

---

## 🎯 Endpoints del Backend Consumidos

```
✅ POST   /api/auth/login           - Login (devuelve: token, userId, email, rol)
✅ POST   /api/auth/register        - Registro
✅ GET    /api/productos            - Lista productos
✅ GET    /api/productos/:id        - Producto por ID
✅ POST   /api/productos            - Crear producto (admin)
✅ PUT    /api/productos/:id        - Actualizar producto (admin)
✅ DELETE /api/productos/:id        - Eliminar producto
✅ GET    /api/carrito/:userId      - Carrito del usuario
✅ POST   /api/carrito              - Agregar al carrito
✅ DELETE /api/carrito/:id          - Eliminar item del carrito
✅ DELETE /api/carrito/vaciar/:userId - Vaciar carrito
✅ GET    /api/pedidos              - Todos los pedidos (devuelve usuario anidado)
✅ GET    /api/pedidos/:id          - Pedido por ID
✅ POST   /api/pedidos              - Crear pedido
✅ DELETE /api/pedidos/:id          - Cancelar pedido
✅ POST   /api/detalles             - Crear detalle de pedido
✅ GET    /api/detalles/pedido/:id  - Detalles por pedido
❌ GET    /api/usuarios/:id         - NO IMPLEMENTADO (405 error)
❌ PUT    /api/usuarios/:id         - NO IMPLEMENTADO (405 error)
```

---

## 🚀 Configuración de Vite y Dependencias

### **package.json**
```json
{
  "name": "hydrosysf",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^7.9.3",
    "axios": "^1.13.2"
  },
  "devDependencies": {
    "@types/react": "^18.3.18",
    "@types/react-dom": "^18.3.5",
    "@vitejs/plugin-react": "^4.3.4",
    "typescript": "~5.9.0",
    "vite": "^7.1.9"
  }
}
```

### **vite.config.ts**
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  }
});
```

### **tsconfig.json**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

---

## ✅ Checklist de Implementación

### Configuración Inicial
- [ ] Instalar dependencias: `npm install`
- [ ] Configurar `vite.config.ts` con proxy al backend
- [ ] Crear estructura de carpetas

### Autenticación (PRIORIDAD ALTA)
- [ ] Crear `api.ts` con interceptor de Axios
- [ ] Crear `AuthContext.tsx` con inicialización desde localStorage
- [ ] Crear `auth.service.ts` con transformación de respuesta del backend
- [ ] Implementar `ProtectedRoute.tsx`
- [ ] Crear página `login.tsx`

### Navegación
- [ ] Crear `Navbar.tsx` con renderizado condicional
- [ ] Implementar rutas en `App.tsx`
- [ ] Crear `Home.tsx` con 3 vistas (no logueado, cliente, admin)

### Productos y Carrito
- [ ] Crear `product.service.ts`
- [ ] Crear página `Producto.tsx`
- [ ] Crear `cart.service.ts`
- [ ] Crear página `Cart.tsx`

### Sistema de Compras
- [ ] Crear `order.service.ts`
- [ ] Crear `order-detail.service.ts`
- [ ] Crear `checkout.service.ts` (orquestador)
- [ ] Integrar botón "Comprar Ahora" en `Cart.tsx`

### Pedidos
- [ ] Crear tipos en `order.ts` con objetos anidados
- [ ] Crear página `Pedidos.tsx` con filtro correcto
- [ ] Crear página `MonitoreoPedidos.tsx` con auto-refresh

### Estilos
- [ ] Crear archivos CSS para cada página
- [ ] Implementar estilos responsive

### Testing Manual
- [ ] Verificar login/register
- [ ] Verificar redirecciones según rol
- [ ] Agregar productos al carrito
- [ ] Realizar compra completa
- [ ] Verificar pedidos en `/pedidos`

---

## 🎨 Notas de Estilo

- Usar clases CSS modulares por página
- Estados de pedido: `status-pendiente`, `status-listo`, `status-enviado`, `status-entregado`
- Botones primarios: `.btn-primary`
- Mensajes de éxito: `.success-message`
- Mensajes de error: `.error-message`

---

**Este documento es la guía completa para recrear todo el proyecto frontend desde cero. Incluye todas las soluciones a problemas críticos encontrados durante el desarrollo.**

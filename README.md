# HydroSyS - Frontend React + TypeScript

Aplicación e-commerce para venta de cilindros de gas desarrollada con React 18.3.1 + TypeScript 5.9 + Vite 7.1.9

## 🚀 Tecnologías

- **Frontend**: React 18.3.1 + TypeScript 5.9
- **Build Tool**: Vite 7.1.9
- **Routing**: react-router-dom 7.9.3
- **HTTP Client**: Axios 1.13.2
- **Estilos**: CSS puro (sin frameworks)
- **Backend**: Spring Boot (puerto 8080)
- **Autenticación**: JWT con localStorage

## 📋 Prerequisitos

- Node.js (versión 16 o superior)
- npm o yarn
- Backend de Spring Boot corriendo en `http://localhost:8080`

## 🔧 Instalación

1. **Clonar el repositorio** (si aplica)
   ```bash
   git clone <url-del-repo>
   cd Front-hydrosys
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

## 🏃 Ejecución

### Modo Desarrollo
```bash
npm run dev
```
La aplicación estará disponible en `http://localhost:5173`

### Build para Producción
```bash
npm run build
```

### Preview de Build
```bash
npm run preview
```

## 📁 Estructura del Proyecto

```
Front-hydrosys/
├── src/
│   ├── assets/              # Imágenes y recursos estáticos
│   ├── components/          # Componentes reutilizables
│   │   ├── Navbar.tsx
│   │   └── ProtectedRoute.tsx
│   ├── contexts/            # Contexts de React
│   │   └── AuthContext.tsx
│   ├── pages/               # Páginas de la aplicación
│   │   ├── Home.tsx
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── Producto.tsx
│   │   ├── Cart.tsx
│   │   ├── Pedidos.tsx
│   │   ├── MonitoreoPedidos.tsx
│   │   ├── Dashboard.tsx
│   │   └── EditarPerfil.tsx
│   ├── services/            # Servicios para llamadas API
│   │   ├── api.ts
│   │   ├── auth.service.ts
│   │   ├── product.service.ts
│   │   ├── cart.service.ts
│   │   ├── order.service.ts
│   │   ├── order-detail.service.ts
│   │   └── checkout.service.ts
│   ├── types/               # Tipos TypeScript
│   │   ├── user.ts
│   │   ├── product.ts
│   │   ├── cart.ts
│   │   └── order.ts
│   ├── Styles/              # Archivos CSS
│   │   ├── Home.css
│   │   ├── Cart.css
│   │   ├── Producto.css
│   │   ├── MonitoreoPedidos.css
│   │   ├── Dashboard.css
│   │   └── EditarPerfil.css
│   ├── App.tsx              # Componente principal y rutas
│   ├── App.css
│   ├── main.tsx             # Entry point
│   └── index.css
├── public/                  # Archivos públicos estáticos
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 🔐 Sistema de Autenticación

El sistema usa JWT almacenado en localStorage con las siguientes características:

- **Login/Register**: Almacena token y datos de usuario
- **Auto-login**: Restaura sesión desde localStorage al recargar
- **Interceptor Axios**: Agrega automáticamente el token a las peticiones
- **Protected Routes**: Rutas protegidas según rol de usuario

### Formato de respuesta del backend (Login/Register):
```json
{
  "token": "eyJhbGc...",
  "userId": 2,
  "email": "user@example.com",
  "rol": "CLIENTE",
  "nombre": "Juan",
  "apellido": "Pérez"
}
```

## 👥 Tipos de Usuario

### 1. Usuario NO autenticado
- Puede ver la página de inicio
- Puede registrarse o iniciar sesión
- Puede ver productos (sin agregar al carrito)

### 2. Cliente (CLIENTE)
- Ver productos y agregar al carrito
- Realizar compras
- Ver historial de pedidos
- Ver perfil

### 3. Administrador (ADMINISTRADOR/ADMIN)
- Dashboard de administración
- Gestión de productos
- Ver todos los pedidos
- Estadísticas y reportes

## 🛒 Flujo de Compra

1. **Agregar al carrito**: Cliente selecciona productos
2. **Ver carrito**: Revisar productos y cantidades
3. **Comprar**: Se crea pedido, detalles del pedido, se eliminan productos del inventario y se limpia el carrito
4. **Confirmación**: Redirección a historial de pedidos

## 🎯 Endpoints del Backend

```
✅ POST   /api/auth/login              - Login
✅ POST   /api/auth/register           - Registro
✅ GET    /api/productos               - Listar productos
✅ POST   /api/productos               - Crear producto (admin)
✅ PUT    /api/productos/:id           - Actualizar producto (admin)
✅ DELETE /api/productos/:id           - Eliminar producto
✅ GET    /api/carrito/:userId         - Carrito del usuario
✅ POST   /api/carrito                 - Agregar al carrito
✅ DELETE /api/carrito/:id             - Eliminar item
✅ DELETE /api/carrito/vaciar/:userId  - Vaciar carrito
✅ GET    /api/pedidos                 - Listar pedidos
✅ POST   /api/pedidos                 - Crear pedido
✅ GET    /api/pedidos/:id             - Ver pedido
✅ POST   /api/detalles                - Crear detalle de pedido
✅ GET    /api/detalles/pedido/:id     - Detalles por pedido
```

## ⚠️ Notas Importantes

### Método de Pago
El backend requiere que exista un método de pago con `id: 1`. Si no existe, ejecuta:
```sql
INSERT INTO metodo_pago (id, nombre_pago) VALUES (1, 'Efectivo');
```

### Respuesta de Pedidos
El backend devuelve un objeto `usuario` anidado en los pedidos:
```json
{
  "id": 1,
  "usuario": {
    "id": 2,
    "email": "user@example.com"
  },
  "estadoPedido": "LISTO",
  "totalPedido": 50000
}
```

### BigDecimal en Backend
Cuando se crea un pedido, `totalPedido` debe enviarse como **string**:
```typescript
const pedidoDTO = {
  totalPedido: String(totalCalculado)  // ✅ Correcto
  // totalPedido: 50000  // ❌ Error 400
}
```

### Perfil de Usuario
Los endpoints `GET/PUT /api/usuarios/:id` **NO están implementados** en el backend (devuelven 405).
La página de perfil muestra solo los datos del `AuthContext`.

## 🎨 Personalización

Los estilos están en archivos CSS separados por página en `src/Styles/`.
Puedes personalizar:

- Colores principales en `.btn-primary` (App.css)
- Gradientes en `.admin-card` y `.customer-card` (Home.css)
- Estados de pedidos: `.status-listo`, `.status-pendiente`, etc.

## 🐛 Solución de Problemas

### Error: "Método de pago no encontrado"
Inserta el método de pago en la base de datos (ver sección "Notas Importantes")

### Error: Los pedidos no aparecen
Verifica que el backend esté corriendo en `http://localhost:8080`

### Error: Redirección infinita al login
Limpia localStorage: `localStorage.clear()` en la consola del navegador

## 📝 Scripts Disponibles

- `npm run dev` - Inicia servidor de desarrollo
- `npm run build` - Construye para producción
- `npm run preview` - Preview del build de producción
- `npm run lint` - Ejecuta ESLint

## 📄 Licencia

Este proyecto fue desarrollado para fines educativos.

## 👨‍💻 Autor

Desarrollado para el curso de Ingeniería de Software 2 - UIS

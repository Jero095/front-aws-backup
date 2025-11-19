// src/services/checkout.service.ts
import orderService from './order.service';
import orderDetailService from './order-detail.service';
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
      console.log('[CHECKOUT] Items del carrito:', cartItems);

      // 1. Calcular total
      const totalPedido = cartItems.reduce((sum, item) => {
        const precio = item.producto?.precio || item.precioUnitario || 0;
        const cantidad = item.cantidadProducto || item.cantidad || 1;
        console.log('[CHECKOUT] Item:', { precio, cantidad, subtotal: precio * cantidad });
        return sum + (precio * cantidad);
      }, 0);

      console.log('[CHECKOUT] Total calculado:', totalPedido);

      if (isNaN(totalPedido) || totalPedido <= 0) {
        throw new Error('El total calculado no es válido');
      }

      // 2. Crear pedido (Backend espera totalPedido como STRING para BigDecimal)
      const pedidoDTO: PedidoDTO = {
        usuarioId,
        metodoPagoId,
        estadoPedido: 'PENDIENTE',  // Estado inicial del pedido
        direccionEnvio,
        totalPedido: String(totalPedido)  // 🔑 IMPORTANTE: Convertir a string
      };

      const pedido = await orderService.createOrder(pedidoDTO);
      console.log('[CHECKOUT] Pedido creado:', pedido.id);

      // 3. Crear detalles del pedido
      for (const item of cartItems) {
        const cantidad = item.cantidadProducto || item.cantidad || 1;
        const precio = item.producto?.precio || item.precioUnitario || 0;
        const productoId = item.productoId || item.producto?.id;
        
        if (!productoId) {
          console.error('[CHECKOUT] Item sin productoId:', item);
          continue;
        }
        
        const detalle: DetallePedidoDTO = {
          pedidoId: pedido.id!,
          productoId: productoId,
          cantidadProducto: cantidad,
          precioUnitario: precio
        };
        await orderDetailService.createOrderDetail(detalle);
        console.log('[CHECKOUT] Detalle creado para producto:', detalle.productoId);
      }

      // 4. Limpiar carrito (NO eliminamos productos del inventario)
      await cartService.clearCart(usuarioId);
      console.log('[CHECKOUT] Carrito limpiado');

      return { success: true, pedidoId: pedido.id };

    } catch (error: any) {
      console.error('[CHECKOUT] Error en proceso de compra:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || error.message || 'Error al procesar la compra' 
      };
    }
  }
}

export default new CheckoutService();

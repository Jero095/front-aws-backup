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

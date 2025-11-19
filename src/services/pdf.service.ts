// src/services/pdf.service.ts
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Pedido } from '../types/order';
import type { Producto } from '../types/product';

class PDFService {
  /**
   * Genera un reporte completo del dashboard con estadísticas y pedidos
   */
  generateDashboardReport(
    pedidos: Pedido[],
    productos: Producto[],
    totalVentas: number
  ): void {
    const doc = new jsPDF();
    const today = new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Header
    doc.setFontSize(20);
    doc.setTextColor(102, 126, 234);
    doc.text('HydroSyS - Reporte del Dashboard', 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Fecha de generación: ${today}`, 14, 28);

    // Línea separadora
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 32, 196, 32);

    // Estadísticas principales
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Resumen Ejecutivo', 14, 40);

    const productosConBajoStock = productos.filter(p => p.stock < 10);
    const pedidosHoy = pedidos.filter(p => {
      const fecha = new Date(p.fechaPedido || p.fechaCreacion || 0);
      const hoy = new Date();
      return fecha.toDateString() === hoy.toDateString();
    });

    const stats = [
      ['Total de Ventas', `$${totalVentas.toLocaleString('es-CO')}`],
      ['Total de Pedidos', pedidos.length.toString()],
      ['Pedidos Hoy', pedidosHoy.length.toString()],
      ['Productos en Inventario', productos.length.toString()],
      ['Productos con Stock Bajo', productosConBajoStock.length.toString()]
    ];

    autoTable(doc, {
      startY: 45,
      head: [['Métrica', 'Valor']],
      body: stats,
      theme: 'grid',
      headStyles: { fillColor: [102, 126, 234] },
      margin: { left: 14 }
    });

    // Pedidos recientes
    const yPos = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.text('Pedidos Recientes', 14, yPos);

    const pedidosRecientes = pedidos
      .sort((a, b) => {
        const dateA = new Date(a.fechaPedido || a.fechaCreacion || 0).getTime();
        const dateB = new Date(b.fechaPedido || b.fechaCreacion || 0).getTime();
        return dateB - dateA;
      })
      .slice(0, 10);

    const pedidosData = pedidosRecientes.map(p => [
      `#${p.id}`,
      `${p.usuario?.nombre || 'N/A'} ${p.usuario?.apellido || ''}`,
      this.formatDate(p.fechaPedido || p.fechaCreacion),
      p.estadoPedido || 'N/A',
      `$${this.parseNumber(p.totalPedido).toLocaleString('es-CO')}`
    ]);

    autoTable(doc, {
      startY: yPos + 5,
      head: [['ID', 'Cliente', 'Fecha', 'Estado', 'Total']],
      body: pedidosData,
      theme: 'striped',
      headStyles: { fillColor: [102, 126, 234] },
      margin: { left: 14 }
    });

    // Productos con stock bajo (nueva página si hay muchos)
    if (productosConBajoStock.length > 0) {
      doc.addPage();
      doc.setFontSize(14);
      doc.text('Productos con Stock Bajo', 14, 20);

      const productosData = productosConBajoStock.map(p => [
        `#${p.id}`,
        p.nombre,
        p.categoria?.nombre || 'N/A',
        p.stock.toString(),
        `$${p.precio.toLocaleString('es-CO')}`
      ]);

      autoTable(doc, {
        startY: 25,
        head: [['ID', 'Producto', 'Categoría', 'Stock', 'Precio']],
        body: productosData,
        theme: 'striped',
        headStyles: { fillColor: [237, 137, 54] },
        margin: { left: 14 }
      });
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Página ${i} de ${pageCount}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }

    doc.save(`HydroSyS_Dashboard_${this.getFilenameDateString()}.pdf`);
  }

  /**
   * Genera un reporte de todos los pedidos
   */
  generateOrdersReport(pedidos: Pedido[]): void {
    const doc = new jsPDF();
    const today = new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Header
    doc.setFontSize(20);
    doc.setTextColor(102, 126, 234);
    doc.text('HydroSyS - Reporte de Pedidos', 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Fecha de generación: ${today}`, 14, 28);
    doc.text(`Total de pedidos: ${pedidos.length}`, 14, 34);

    // Línea separadora
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 38, 196, 38);

    // Tabla de pedidos
    const pedidosData = pedidos.map(p => [
      `#${p.id}`,
      `${p.usuario?.nombre || 'N/A'} ${p.usuario?.apellido || ''}`,
      this.formatDate(p.fechaPedido || p.fechaCreacion),
      p.estadoPedido || 'N/A',
      p.direccionEnvio?.substring(0, 30) || 'N/A',
      `$${this.parseNumber(p.totalPedido).toLocaleString('es-CO')}`
    ]);

    autoTable(doc, {
      startY: 45,
      head: [['ID', 'Cliente', 'Fecha', 'Estado', 'Dirección', 'Total']],
      body: pedidosData,
      theme: 'striped',
      headStyles: { fillColor: [102, 126, 234] },
      margin: { left: 14, right: 14 },
      styles: { fontSize: 8 },
      columnStyles: {
        4: { cellWidth: 40 }
      }
    });

    // Resumen financiero al final
    const totalVentas = pedidos.reduce((sum, p) => sum + this.parseNumber(p.totalPedido), 0);
    const yPos = (doc as any).lastAutoTable.finalY + 10;

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('Resumen Financiero', 14, yPos);

    const resumenData = [
      ['Total de Pedidos', pedidos.length.toString()],
      ['Total de Ventas', `$${totalVentas.toLocaleString('es-CO')}`],
      ['Promedio por Pedido', `$${(totalVentas / pedidos.length || 0).toFixed(0)}`]
    ];

    autoTable(doc, {
      startY: yPos + 5,
      head: [['Concepto', 'Valor']],
      body: resumenData,
      theme: 'grid',
      headStyles: { fillColor: [102, 126, 234] },
      margin: { left: 14 }
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Página ${i} de ${pageCount}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }

    doc.save(`HydroSyS_Pedidos_${this.getFilenameDateString()}.pdf`);
  }

  /**
   * Genera un reporte de inventario de productos
   */
  generateInventoryReport(productos: Producto[]): void {
    const doc = new jsPDF();
    const today = new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Header
    doc.setFontSize(20);
    doc.setTextColor(102, 126, 234);
    doc.text('HydroSyS - Reporte de Inventario', 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Fecha de generación: ${today}`, 14, 28);
    doc.text(`Total de productos: ${productos.length}`, 14, 34);

    // Línea separadora
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 38, 196, 38);

    // Tabla de productos
    const productosData = productos.map(p => [
      `#${p.id}`,
      p.nombre,
      p.categoria?.nombre || 'N/A',
      p.stock.toString(),
      `$${p.precio.toLocaleString('es-CO')}`,
      `$${(p.stock * p.precio).toLocaleString('es-CO')}`
    ]);

    autoTable(doc, {
      startY: 45,
      head: [['ID', 'Producto', 'Categoría', 'Stock', 'Precio Unit.', 'Valor Total']],
      body: productosData,
      theme: 'striped',
      headStyles: { fillColor: [102, 126, 234] },
      margin: { left: 14, right: 14 },
      styles: { fontSize: 9 }
    });

    // Resumen de inventario
    const valorTotal = productos.reduce((sum, p) => sum + (p.stock * p.precio), 0);
    const yPos = (doc as any).lastAutoTable.finalY + 10;

    doc.setFontSize(12);
    doc.text('Resumen de Inventario', 14, yPos);

    const resumenData = [
      ['Total de Productos', productos.length.toString()],
      ['Productos con Stock Bajo (<10)', productos.filter(p => p.stock < 10).length.toString()],
      ['Productos Agotados', productos.filter(p => p.stock === 0).length.toString()],
      ['Valor Total del Inventario', `$${valorTotal.toLocaleString('es-CO')}`]
    ];

    autoTable(doc, {
      startY: yPos + 5,
      head: [['Concepto', 'Valor']],
      body: resumenData,
      theme: 'grid',
      headStyles: { fillColor: [102, 126, 234] },
      margin: { left: 14 }
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Página ${i} de ${pageCount}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }

    doc.save(`HydroSyS_Inventario_${this.getFilenameDateString()}.pdf`);
  }

  // Métodos auxiliares
  private formatDate(date?: string | Date): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private parseNumber(value: number | string): number {
    if (typeof value === 'string') {
      return parseFloat(value) || 0;
    }
    return value || 0;
  }

  private getFilenameDateString(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }
}

export default new PDFService();

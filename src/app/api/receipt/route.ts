type ReceiptItem = { name: string; color: string; size: string; price: number; quantity: number }
type ReceiptRequest = { orderNumber: string; trackingCode?: string; deliveryDetails: { name: string; address: string; city: string }; items: ReceiptItem[]; subtotal: number; shipping: number; total: number }

function safeText(value: unknown) {
  return String(value ?? '').replace(/[^\x20-\x7E]/g, '?').replace(/[()\\]/g, (character) => `\\${character}`)
}

function createReceiptPdf(order: ReceiptRequest) {
  const commands: string[] = [
    '0.965 0.95 0.91 rg 0 0 595 842 re f',
    '0.086 0.145 0.114 rg 0 690 595 152 re f',
  ]
  const text = (value: string, x: number, y: number, size: number, font = 'F1', color = '0.086 0.145 0.114') => {
    commands.push(`${color} rg BT /${font} ${size} Tf ${x} ${y} Td (${safeText(value)}) Tj ET`)
  }
  const rule = (x1: number, y: number, x2: number, color = '0.82 0.81 0.76') => commands.push(`${color} RG 0.7 w ${x1} ${y} m ${x2} ${y} l S`)

  text('NEMO', 56, 786, 25, 'F2', '1 1 1')
  text('ORDER RECEIPT', 56, 751, 11, 'F2', '0.82 0.88 0.82')
  commands.push('0.31 0.45 0.36 rg 56 710 116 23 re f')
  text('COD ORDER', 69, 718, 8, 'F2', '1 1 1')
  text(`Order ${order.orderNumber}`, 382, 766, 9, 'F2', '1 1 1')
  text(`Tracking ${order.trackingCode || 'Pending'}`, 382, 753, 8, 'F1', '0.82 0.88 0.82')
  text(new Date().toLocaleDateString('en-US'), 382, 738, 9, 'F1', '0.82 0.88 0.82')

  text('DELIVER TO', 56, 650, 8, 'F2', '0.63 0.44 0.26')
  text(order.deliveryDetails.name, 56, 628, 12, 'F2')
  text(order.deliveryDetails.address, 56, 610, 9, 'F1', '0.35 0.39 0.35')
  text(order.deliveryDetails.city, 56, 594, 9, 'F1', '0.35 0.39 0.35')
  text('PAYMENT', 350, 650, 8, 'F2', '0.63 0.44 0.26')
  text('Cash on delivery', 350, 628, 12, 'F2')
  text('Pay when your order arrives', 350, 610, 9, 'F1', '0.35 0.39 0.35')
  text('Estimated delivery: 3-5 business days', 350, 594, 9, 'F1', '0.35 0.39 0.35')

  commands.push('0.90 0.89 0.85 rg 56 548 483 28 re f')
  text('ITEM', 70, 558, 8, 'F2', '0.35 0.39 0.35')
  text('QTY', 405, 558, 8, 'F2', '0.35 0.39 0.35')
  text('AMOUNT', 473, 558, 8, 'F2', '0.35 0.39 0.35')

  let rowY = 523
  order.items.forEach((item) => {
    text(item.name.slice(0, 42), 70, rowY, 10, 'F2')
    text(`${item.color} / ${item.size}`, 70, rowY - 15, 8, 'F1', '0.42 0.44 0.40')
    text(String(item.quantity), 410, rowY - 5, 9, 'F1')
    text(`$${(Number(item.price) * item.quantity).toFixed(2)}`, 473, rowY - 5, 9, 'F1')
    rule(56, rowY - 31, 539)
    rowY -= 45
  })

  const totalsY = Math.max(rowY - 14, 230)
  text('SUMMARY', 350, totalsY, 8, 'F2', '0.63 0.44 0.26')
  text('Subtotal', 350, totalsY - 25, 9, 'F1', '0.35 0.39 0.35')
  text(`$${Number(order.subtotal).toFixed(2)}`, 473, totalsY - 25, 9, 'F1')
  text('Shipping', 350, totalsY - 44, 9, 'F1', '0.35 0.39 0.35')
  text(Number(order.shipping) === 0 ? 'Complimentary' : `$${Number(order.shipping).toFixed(2)}`, 473, totalsY - 44, 9, 'F1')
  rule(350, totalsY - 58, 539, '0.63 0.44 0.26')
  text('TOTAL', 350, totalsY - 82, 10, 'F2')
  text(`$${Number(order.total).toFixed(2)}`, 468, totalsY - 82, 14, 'F2', '0.63 0.44 0.26')

  commands.push('0.086 0.145 0.114 rg 56 90 483 74 re f')
  text('THANK YOU FOR SHOPPING WITH NEMO.', 76, 132, 9, 'F2', '1 1 1')
  text('Please keep this receipt for your records.', 76, 113, 8, 'F1', '0.82 0.88 0.82')
  text('nemo.store', 454, 113, 8, 'F1', '0.82 0.88 0.82')

  const content = commands.join('\n')
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
  ]
  let pdf = '%PDF-1.4\n'
  const offsets = [0]
  objects.forEach((object, index) => {
    offsets[index + 1] = pdf.length
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`
  })
  const xrefOffset = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  offsets.slice(1).forEach((offset) => { pdf += `${String(offset).padStart(10, '0')} 00000 n \n` })
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
  return new TextEncoder().encode(pdf)
}

export async function POST(request: Request) {
  const order = await request.json() as ReceiptRequest
  if (!order.orderNumber || !order.deliveryDetails?.name || !Array.isArray(order.items) || order.items.length === 0) {
    return Response.json({ error: 'Receipt data is incomplete.' }, { status: 400 })
  }
  return new Response(createReceiptPdf(order), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${safeText(order.orderNumber)}-receipt.pdf"`,
      'Cache-Control': 'no-store',
    },
  })
}

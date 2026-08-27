export type ReceiptItem = { name: string; color: string; size: string; price: number; quantity: number }
export type ReceiptRequest = { orderNumber: string; trackingCode?: string; deliveryDetails: { name: string; address: string; city: string }; items: ReceiptItem[]; subtotal: number; shipping: number; total: number }

function safeText(value: unknown) { return String(value ?? '').replace(/[^\x20-\x7E]/g, '?').replace(/[()\\]/g, (character) => `\\${character}`) }

export function createReceiptPdf(invoice: ReceiptRequest) {
  const commands: string[] = [
    '0.96 0.98 1 rg 0 0 595 842 re f',
    '0.08 0.16 0.25 rg 0 0 145 842 re f',
    '0.86 0.35 0.25 rg 145 0 5 842 re f',
  ]
  const text = (value: string, x: number, y: number, size: number, font = 'F1', color = '0.08 0.16 0.25') => commands.push(`${color} rg BT /${font} ${size} Tf ${x} ${y} Td (${safeText(value)}) Tj ET`)
  const fill = (color: string, x: number, y: number, width: number, height: number) => commands.push(`${color} rg ${x} ${y} ${width} ${height} re f`)
  const rule = (x1: number, y: number, x2: number, color = '0.76 0.81 0.84') => commands.push(`${color} RG 0.7 w ${x1} ${y} m ${x2} ${y} l S`)

  text('NEMO', 38, 764, 25, 'F2', '1 1 1')
  text('CLOTHING STORE', 39, 741, 7, 'F2', '0.7 0.82 0.9')
  text('INVOICE', 38, 664, 16, 'F2', '1 1 1')
  text('Thank you for your order.', 38, 645, 8, 'F1', '0.7 0.82 0.9')
  text('nemo.store', 38, 92, 8, 'F1', '0.7 0.82 0.9')
  text('COD', 38, 122, 8, 'F2', '0.86 0.35 0.25')
  text('PAYMENT', 38, 108, 7, 'F1', '0.7 0.82 0.9')

  text('INVOICE DETAILS', 180, 777, 7, 'F2', '0.86 0.35 0.25')
  text('Invoice number', 180, 754, 8, 'F1', '0.38 0.44 0.48')
  text(invoice.orderNumber, 180, 738, 12, 'F2')
  text('Issued', 380, 754, 8, 'F1', '0.38 0.44 0.48')
  text(new Date().toISOString().slice(0, 10), 380, 738, 9, 'F2')
  rule(180, 716, 539, '0.86 0.88 0.89')

  text('BILL TO', 180, 683, 7, 'F2', '0.86 0.35 0.25')
  text(invoice.deliveryDetails.name, 180, 663, 11, 'F2')
  text(invoice.deliveryDetails.address, 180, 646, 8, 'F1', '0.38 0.44 0.48')
  text(invoice.deliveryDetails.city, 180, 632, 8, 'F1', '0.38 0.44 0.48')
  text('DELIVERY', 380, 683, 7, 'F2', '0.86 0.35 0.25')
  text('Cash on delivery', 380, 663, 10, 'F2')
  text('Estimated 3-5 business days', 380, 646, 8, 'F1', '0.38 0.44 0.48')

  fill('0.08 0.16 0.25', 180, 575, 359, 30)
  text('TRACKING CODE', 194, 586, 7, 'F2', '0.7 0.82 0.9')
  text(invoice.trackingCode || 'Pending', 330, 584, 10, 'F2', '1 1 1')
  text('ORDER ITEMS', 180, 548, 7, 'F2', '0.86 0.35 0.25')
  fill('0.88 0.92 0.94', 180, 510, 359, 25)
  text('ITEM', 194, 519, 7, 'F2', '0.08 0.16 0.25')
  text('QTY', 445, 519, 7, 'F2', '0.08 0.16 0.25')
  text('TOTAL', 490, 519, 7, 'F2', '0.08 0.16 0.25')

  let rowY = 482
  invoice.items.forEach((item) => {
    text(item.name.slice(0, 32), 194, rowY, 9, 'F2')
    text(`${item.color} / ${item.size}`, 194, rowY - 14, 7, 'F1', '0.38 0.44 0.48')
    text(String(item.quantity), 448, rowY - 4, 8)
    text(`$${(Number(item.price) * item.quantity).toFixed(2)}`, 490, rowY - 4, 8)
    rule(180, rowY - 29, 539)
    rowY -= 43
  })

  const totalsY = Math.max(rowY - 10, 220)
  text('PAYMENT SUMMARY', 350, totalsY, 7, 'F2', '0.86 0.35 0.25')
  text('Subtotal', 350, totalsY - 23, 8, 'F1', '0.38 0.44 0.48')
  text(`$${Number(invoice.subtotal).toFixed(2)}`, 490, totalsY - 23, 8)
  text('Shipping', 350, totalsY - 41, 8, 'F1', '0.38 0.44 0.48')
  text(Number(invoice.shipping) === 0 ? 'Free' : `$${Number(invoice.shipping).toFixed(2)}`, 490, totalsY - 41, 8)
  rule(350, totalsY - 55, 539, '0.86 0.35 0.25')
  text('AMOUNT DUE', 350, totalsY - 78, 9, 'F2')
  text(`$${Number(invoice.total).toFixed(2)}`, 478, totalsY - 78, 15, 'F2', '0.86 0.35 0.25')
  rule(180, 155, 539, '0.86 0.88 0.89')
  text('Questions about your order?', 180, 133, 8, 'F2')
  text('Keep this invoice for your records.', 180, 116, 8, 'F1', '0.38 0.44 0.48')

  const content = commands.join('\n')
  const objects = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>', '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 4 0 R >>', `<< /Length ${content.length} >>\nstream\n${content}\nendstream`, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>']
  let pdf = '%PDF-1.4\n'
  const offsets = [0]
  objects.forEach((object, index) => { offsets[index + 1] = pdf.length; pdf += `${index + 1} 0 obj\n${object}\nendobj\n` })
  const xrefOffset = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  offsets.slice(1).forEach((offset) => { pdf += `${String(offset).padStart(10, '0')} 00000 n \n` })
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
  return new TextEncoder().encode(pdf)
}

export function receiptFilename(orderNumber: string) { return `${safeText(orderNumber)}-invoice.pdf` }

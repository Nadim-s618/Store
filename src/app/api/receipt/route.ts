import { createReceiptPdf, receiptFilename, ReceiptRequest } from '@/lib/receipt'

export async function POST(request: Request) {
  const order = await request.json() as ReceiptRequest
  if (!order.orderNumber || !order.deliveryDetails?.name || !Array.isArray(order.items) || order.items.length === 0) {
    return Response.json({ error: 'Receipt data is incomplete.' }, { status: 400 })
  }
  return new Response(createReceiptPdf(order), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${receiptFilename(order.orderNumber)}"`,
      'Cache-Control': 'no-store',
    },
  })
}

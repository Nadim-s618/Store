export function orderNumber(orderId: string) {
  return `NEMO-${orderId.slice(-6).toUpperCase()}`
}

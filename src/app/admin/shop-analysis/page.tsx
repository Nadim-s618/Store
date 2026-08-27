import { prisma } from '@/lib/prisma'
import styles from './shop-analysis.module.css'
import ShopAnalysisCharts from './ShopAnalysisCharts'

export const dynamic = 'force-dynamic'

type Range = '7d' | '30d' | '12m' | '5y' | 'custom'
type Granularity = 'day' | 'month' | 'year'
type SearchParams = Promise<Record<string, string | string[] | undefined>>

function queryValue(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key]
  return Array.isArray(value) ? value[0] : value
}

function startOfDay(date: Date) { const result = new Date(date); result.setHours(0, 0, 0, 0); return result }
function endOfDay(date: Date) { const result = new Date(date); result.setHours(23, 59, 59, 999); return result }
function periodStart(date: Date, granularity: Granularity) {
  const result = new Date(date)
  if (granularity === 'year') result.setMonth(0, 1)
  else if (granularity === 'month') result.setDate(1)
  result.setHours(0, 0, 0, 0)
  return result
}
function addPeriod(date: Date, granularity: Granularity) {
  const result = new Date(date)
  if (granularity === 'day') result.setDate(result.getDate() + 1)
  if (granularity === 'month') result.setMonth(result.getMonth() + 1)
  if (granularity === 'year') result.setFullYear(result.getFullYear() + 1)
  return result
}
function formatPeriod(date: Date, granularity: Granularity) {
  if (granularity === 'day') return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  if (granularity === 'month') return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
  return String(date.getFullYear())
}

export default async function ShopAnalysisPage({ searchParams }: { searchParams?: SearchParams }) {
  const params = searchParams ? await searchParams : {}
  const requestedRange = queryValue(params, 'range')
  const range: Range = ['7d', '30d', '12m', '5y', 'custom'].includes(requestedRange ?? '') ? requestedRange as Range : '12m'
  const today = endOfDay(new Date())
  let startDate = startOfDay(new Date(today))
  let endDate = today
  let granularity: Granularity = 'month'
  let periodLabel = 'Last 12 months'
  const startValue = queryValue(params, 'start') ?? ''
  const endValue = queryValue(params, 'end') ?? ''

  if (range === '7d' || range === '30d') {
    startDate.setDate(startDate.getDate() - (range === '7d' ? 6 : 29)); granularity = 'day'
    periodLabel = range === '7d' ? 'Last 7 days' : 'Last 30 days'
  } else if (range === '5y') {
    startDate = startOfDay(new Date(today.getFullYear() - 4, 0, 1)); granularity = 'year'; periodLabel = 'Last 5 years'
  } else if (range === 'custom') {
    const customStart = new Date(`${startValue}T00:00:00`)
    const customEnd = new Date(`${endValue}T23:59:59.999`)
    if (startValue && endValue && !Number.isNaN(customStart.getTime()) && !Number.isNaN(customEnd.getTime()) && customStart <= customEnd) {
      startDate = customStart; endDate = customEnd
      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / 86_400_000)
      granularity = days <= 31 ? 'day' : days <= 366 ? 'month' : 'year'; periodLabel = 'Custom date range'
    } else periodLabel = 'Choose custom dates'
  } else {
    startDate.setDate(1); startDate.setMonth(startDate.getMonth() - 11)
  }

  const allOrders = await prisma.order.findMany({ include: { items: { include: { product: { include: { category: true } } } } } })
  const orders = allOrders.filter((order) => order.createdAt >= startDate && order.createdAt <= endDate)
  const deliveredOrders = orders.filter((order) => order.status === 'DELIVERED')
  const activeOrders = orders.filter((order) => order.status !== 'CANCELLED')
  const deliveredRevenue = deliveredOrders.reduce((sum, order) => sum + Number(order.total), 0)
  const productsSold = deliveredOrders.reduce((sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0)
  const pendingOrders = orders.filter((order) => !['DELIVERED', 'CANCELLED'].includes(order.status)).length
  const fulfillmentRate = activeOrders.length ? Math.round((deliveredOrders.length / activeOrders.length) * 100) : 0
  const averageOrder = deliveredOrders.length ? deliveredRevenue / deliveredOrders.length : 0

  const periods = []
  for (let cursor = periodStart(startDate, granularity); cursor <= endDate; cursor = addPeriod(cursor, granularity)) {
    const next = addPeriod(cursor, granularity)
    const periodOrders = orders.filter((order) => order.createdAt >= cursor && order.createdAt < next)
    const periodDelivered = periodOrders.filter((order) => order.status === 'DELIVERED')
    periods.push({ label: formatPeriod(cursor, granularity), revenue: periodDelivered.reduce((sum, order) => sum + Number(order.total), 0), orders: periodOrders.length })
  }

  const categoryTotals = new Map<string, number>()
  deliveredOrders.forEach((order) => order.items.forEach((item) => {
    const category = item.product.category.name
    categoryTotals.set(category, (categoryTotals.get(category) ?? 0) + Number(item.price) * item.quantity)
  }))
  const categories = [...categoryTotals.entries()].sort(([, first], [, second]) => second - first).slice(0, 5).map(([name, revenue]) => ({ name, revenue }))
  const latestPeriod = periods.at(-1)?.revenue ?? 0
  const previousPeriod = periods.at(-2)?.revenue ?? 0
  const periodChange = previousPeriod ? Math.round(((latestPeriod - previousPeriod) / previousPeriod) * 100) : 0

  return <>
    <header className={styles.heading}><p className={styles.kicker}>Business intelligence</p><h1>Shop analysis.</h1><p>See how NEMO is moving across your chosen period.</p></header>
    <details className={styles.analysisFilterPanel} open={Boolean(params.range)}>
      <summary aria-label="Filter analysis"><span className={styles.analysisFilterIcon} aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path d="M4 5h16l-6.2 7.1v5.2l-3.6 1.8v-7z" /></svg></span><span className={styles.visuallyHidden}>Filter analysis</span></summary>
      <form className={styles.analysisFilters} method="get">
        <label>Period<select name="range" defaultValue={range}><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option><option value="12m">Last 12 months</option><option value="5y">Last 5 years</option><option value="custom">Custom dates</option></select></label>
        <label>From<input type="date" name="start" defaultValue={startValue} /></label><label>To<input type="date" name="end" defaultValue={endValue} /></label><button className={styles.primaryButton} type="submit">Apply filter</button>
      </form>
    </details>
    <section className={styles.analysisStats}>
      <div className={styles.stat}><p className={styles.statLabel}>Delivered revenue</p><p className={styles.statValue}>${deliveredRevenue.toFixed(2)}</p><p className={styles.statHint}>{periodChange >= 0 ? '+' : ''}{periodChange}% vs previous period</p></div>
      <div className={styles.stat}><p className={styles.statLabel}>Fulfillment rate</p><p className={styles.statValue}>{fulfillmentRate}%</p><p className={styles.statHint}>{pendingOrders} awaiting delivery</p></div>
      <div className={styles.stat}><p className={styles.statLabel}>Products sold</p><p className={styles.statValue}>{productsSold}</p><p className={styles.statHint}>{deliveredOrders.length} fulfilled orders</p></div>
      <div className={styles.stat}><p className={styles.statLabel}>Average order</p><p className={styles.statValue}>${averageOrder.toFixed(2)}</p><p className={styles.statHint}>Delivered orders</p></div>
    </section>
    <ShopAnalysisCharts periods={periods} categories={categories} periodLabel={periodLabel} granularity={granularity} />
  </>
}

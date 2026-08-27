'use client'

import { useState } from 'react'
import styles from './shop-analysis.module.css'

type Period = { label: string; revenue: number; orders: number }
type Category = { name: string; revenue: number }
type Granularity = 'day' | 'month' | 'year'

function linePath(values: number[], width: number, height: number, padding: number) {
  const max = Math.max(...values, 1)
  const step = values.length > 1 ? (width - padding * 2) / (values.length - 1) : 0
  return values.map((value, index) => `${index === 0 ? 'M' : 'L'} ${padding + index * step} ${height - padding - (value / max) * (height - padding * 2)}`).join(' ')
}

export default function ShopAnalysisCharts({ periods, categories, periodLabel, granularity }: { periods: Period[]; categories: Category[]; periodLabel: string; granularity: Granularity }) {
  const [activeIndex, setActiveIndex] = useState(Math.max(periods.length - 1, 0))
  const maxRevenue = Math.max(...periods.map((period) => period.revenue), 1)
  const maxCategory = Math.max(...categories.map((category) => category.revenue), 1)
  const maxOrders = Math.max(...periods.map((period) => period.orders), 1)
  const orderPath = linePath(periods.map((period) => period.orders), 620, 240, 32)
  const revenuePath = linePath(periods.map((period) => period.revenue), 620, 240, 32)
  const labelEvery = Math.max(1, Math.ceil(periods.length / 8))
  const chartUnit = granularity === 'day' ? 'Daily' : granularity === 'year' ? 'Yearly' : 'Monthly'
  const activePeriod = periods[activeIndex]

  return <div className={styles.analysisCharts}>
    <section className={`${styles.analysisPanel} ${styles.analysisWide}`}><div className={styles.analysisPanelHeader}><div><p className={styles.analysisKicker}>Performance</p><h2>Delivered revenue</h2></div><span>{periodLabel}</span></div>{activePeriod && <p className={styles.analysisTooltip}><strong>{activePeriod.label}</strong><span>${activePeriod.revenue.toFixed(2)} revenue</span><span>{activePeriod.orders} orders</span></p>}<div className={styles.revenueChart} aria-label="Delivered revenue by selected period"><div className={styles.chartBars}>{periods.map((period, index) => <div className={`${styles.chartBarGroup} ${index === activeIndex ? styles.chartBarActive : ''}`} key={`${period.label}-${index}`} tabIndex={0} role="button" aria-label={`${period.label}: ${period.revenue.toFixed(2)} revenue, ${period.orders} orders`} onMouseEnter={() => setActiveIndex(index)} onFocus={() => setActiveIndex(index)} onClick={() => setActiveIndex(index)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') setActiveIndex(index) }}><span className={styles.chartValue}>${period.revenue.toFixed(0)}</span><div className={styles.chartBar} style={{ height: `${Math.max((period.revenue / maxRevenue) * 100, period.revenue ? 8 : 2)}%` }} /><span className={styles.chartLabel}>{index % labelEvery === 0 || index === periods.length - 1 ? period.label : ''}</span></div>)}</div></div></section>
    <section className={styles.analysisPanel}><div className={styles.analysisPanelHeader}><div><p className={styles.analysisKicker}>Volume</p><h2>Orders placed</h2></div><span>{chartUnit}</span></div><svg className={styles.ordersChart} viewBox="0 0 620 240" role="img" aria-label="Orders placed by selected period"><path className={styles.chartGridLine} d="M32 208H588M32 128H588M32 48H588" /><path className={styles.ordersLine} d={orderPath} />{periods.map((period, index) => { const x = 32 + index * (556 / (periods.length - 1 || 1)); const y = 208 - (period.orders / maxOrders) * 160; return <g key={`${period.label}-${index}`} onMouseEnter={() => setActiveIndex(index)} onFocus={() => setActiveIndex(index)} tabIndex={0} role="button" aria-label={`${period.label}: ${period.orders} orders`}><circle className={`${styles.ordersDot} ${index === activeIndex ? styles.ordersDotActive : ''}`} cx={x} cy={y} r={index === activeIndex ? 6 : 4} />{index === activeIndex && <text className={styles.chartPointValue} x={x} y={Math.max(y - 22, 28)} textAnchor="middle">{period.orders}</text>}{(index % labelEvery === 0 || index === periods.length - 1) && <text className={styles.chartAxisLabel} x={x} y="228" textAnchor="middle">{period.label}</text>}</g> })}</svg></section>
    <section className={styles.analysisPanel}><div className={styles.analysisPanelHeader}><div><p className={styles.analysisKicker}>Trend</p><h2>Revenue trend</h2></div><span>{chartUnit}</span></div><svg className={styles.ordersChart} viewBox="0 0 620 240" role="img" aria-label="Revenue trend by selected period"><path className={styles.chartGridLine} d="M32 208H588M32 128H588M32 48H588" /><path className={styles.revenueLine} d={revenuePath} />{periods.map((period, index) => { const x = 32 + index * (556 / (periods.length - 1 || 1)); const y = 208 - (period.revenue / maxRevenue) * 160; return <g key={`${period.label}-${index}`} onMouseEnter={() => setActiveIndex(index)} onFocus={() => setActiveIndex(index)} tabIndex={0} role="button" aria-label={`${period.label}: ${period.revenue.toFixed(2)} revenue`}><circle className={`${styles.revenueDot} ${index === activeIndex ? styles.revenueDotActive : ''}`} cx={x} cy={y} r={index === activeIndex ? 6 : 4} />{index === activeIndex && <text className={styles.chartPointValue} x={x} y={Math.max(y - 22, 28)} textAnchor="middle">${period.revenue.toFixed(0)}</text>}{(index % labelEvery === 0 || index === periods.length - 1) && <text className={styles.chartAxisLabel} x={x} y="228" textAnchor="middle">{period.label}</text>}</g> })}</svg></section>
    <section className={styles.analysisPanel}><div className={styles.analysisPanelHeader}><div><p className={styles.analysisKicker}>Mix</p><h2>Top categories</h2></div><span>By revenue</span></div><div className={styles.categoryBars}>{categories.length === 0 ? <p className={styles.analysisEmpty}>No delivered category data for this period.</p> : categories.map((category) => <div className={styles.categoryRow} key={category.name}><div className={styles.categoryRowLabel}><span>{category.name}</span><strong>${category.revenue.toFixed(0)}</strong></div><div className={styles.categoryTrack}><div className={styles.categoryFill} style={{ width: `${(category.revenue / maxCategory) * 100}%` }} /></div></div>)}</div></section>
  </div>
}

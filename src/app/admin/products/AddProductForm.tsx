'use client'

import { ChangeEvent, FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'

import { getMeasurementFields, MeasurementKey } from '@/lib/measurement-fields'
import styles from '../admin.module.css'

const sizeOptions = ['S', 'M', 'L', 'XL', 'XXL'] as const
const viewOptions = ['Front', 'Back', 'Right', 'Left'] as const
const colorOptions = ['Black', 'White', 'Navy', 'Beige', 'Grey', 'Green', 'Brown', 'Red']
const initialForm = { name: '', category: '', description: '', price: '', imageUrl: '', isTopCollection: false, topCollectionOrder: '0', isNewArrival: false, newArrivalOrder: '0' }
const emptySizeStock = () => ({ S: '0', M: '0', L: '0', XL: '0', XXL: '0' })

export default function AddProductForm({ categories }: { categories: Array<{ name: string; slug: string }> }) {
  const router = useRouter()
  const [form, setForm] = useState(initialForm)
  const [selectedColors, setSelectedColors] = useState(['Black'])
  const [stockByColor, setStockByColor] = useState<Record<string, Record<string, string>>>({ Black: emptySizeStock() })
  const [measurements, setMeasurements] = useState<Record<string, Record<MeasurementKey, string>>>({})
  const [imagesByColor, setImagesByColor] = useState<Record<string, Record<string, File | undefined>>>({})
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  function updateField(field: keyof typeof initialForm, value: string | boolean) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function updateColorSize(color: string, size: typeof sizeOptions[number], value: string) {
    setStockByColor((current) => ({ ...current, [color]: { ...current[color], [size]: value } }))
  }

  function updateMeasurement(size: string, key: MeasurementKey, value: string) {
    setMeasurements((current) => ({ ...current, [size]: { height: current[size]?.height ?? '', width: current[size]?.width ?? '', waist: current[size]?.waist ?? '', hip: current[size]?.hip ?? '', [key]: value } }))
  }

  function toggleColor(color: string) {
    setSelectedColors((current) => current.includes(color) ? current.filter((item) => item !== color) : [...current, color])
    setStockByColor((current) => current[color] ? current : { ...current, [color]: emptySizeStock() })
  }

  function updateImage(color: string, view: typeof viewOptions[number], event: ChangeEvent<HTMLInputElement>) {
    setImagesByColor((current) => ({ ...current, [color]: { ...current[color], [view]: event.target.files?.[0] } }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setMessage('')
    setIsSaving(true)
    const requestData = new FormData()
    Object.entries(form).forEach(([key, value]) => requestData.append(key, String(value)))
    requestData.set('variants', JSON.stringify(selectedColors.flatMap((color) => sizeOptions.map((size) => ({ color, size, quantity: Number(stockByColor[color]?.[size] ?? 0) })))))
    requestData.set('measurements', JSON.stringify(sizeOptions.map((size) => ({ size, height: measurements[size]?.height ? Number(measurements[size].height) : undefined, width: measurements[size]?.width ? Number(measurements[size].width) : undefined, waist: measurements[size]?.waist ? Number(measurements[size].waist) : undefined, hip: measurements[size]?.hip ? Number(measurements[size].hip) : undefined })).filter((measurement) => measurement.height !== undefined || measurement.width !== undefined || measurement.waist !== undefined || measurement.hip !== undefined)))
    selectedColors.forEach((color) => viewOptions.forEach((view) => {
      const file = imagesByColor[color]?.[view]
      if (file) requestData.append(`image-${color}-${view}`, file)
    }))

    const response = await fetch('/api/admin/products', {
      method: 'POST',
      body: requestData,
    })
    const result = await response.json().catch(() => null) as { error?: string } | null
    if (!response.ok) {
      setError(result?.error || 'Unable to create product.')
      setIsSaving(false)
      return
    }
    setForm(initialForm)
    setSelectedColors(['Black'])
    setStockByColor({ Black: emptySizeStock() })
    setMeasurements({})
    setImagesByColor({})
    setMessage('Product added successfully.')
    setIsSaving(false)
    router.refresh()
  }

  const measurementFields = getMeasurementFields(form.category)

  return (
    <details className={`${styles.panel} ${styles.collapsiblePanel}`} open>
      <summary className={styles.collapsibleSummary}><h2>Add product</h2><span>Collapse</span></summary>
      <form className={styles.createForm} onSubmit={handleSubmit}>
        <div className={styles.formGrid}>
          <label>Product name<input value={form.name} onChange={(event) => updateField('name', event.target.value)} required /></label>
          <label>Category<select value={form.category} onChange={(event) => updateField('category', event.target.value)} required><option value="" disabled>Select a category</option>{categories.map((category) => <option key={category.slug} value={category.name}>{category.name}</option>)}</select></label>
          <label>Price<input type="number" min="0" step="0.01" value={form.price} onChange={(event) => updateField('price', event.target.value)} required /></label>
          <label className={styles.fullWidth}>Description<textarea value={form.description} onChange={(event) => updateField('description', event.target.value)} rows={3} /></label>
        </div>
        <div className={styles.sectionChoices}>
          <p className={styles.choiceLabel}>Size chart measurements (cm)</p>
          <div className={styles.measurementGrid} style={{ gridTemplateColumns: `3rem repeat(${measurementFields.length}, minmax(0, 1fr))` }}><span>Size</span>{measurementFields.map((field) => <span key={field.key}>{field.label}</span>)}{sizeOptions.map((size) => <label key={size}><strong>{size}</strong>{measurementFields.map((field) => <input key={field.key} type="number" min="0" step="0.1" placeholder="—" value={measurements[size]?.[field.key] ?? ''} onChange={(event) => updateMeasurement(size, field.key, event.target.value)} />)}</label>)}</div>
        </div>
        <div className={styles.sectionChoices}>
          <p className={styles.choiceLabel}>Available colors</p>
          <div className={styles.colorChoices}>{colorOptions.map((color) => <label key={color} className={styles.choice}><input type="checkbox" checked={selectedColors.includes(color)} onChange={() => toggleColor(color)} /><span>{color}</span></label>)}</div>
          {selectedColors.map((color) => <div key={color} className={styles.colorStock}><p className={styles.choiceLabel}>{color} stock by size</p><div className={styles.sizeStockGrid}>{sizeOptions.map((size) => <label key={size}>{size}<input type="number" min="0" step="1" value={stockByColor[color]?.[size] ?? '0'} onChange={(event) => updateColorSize(color, size, event.target.value)} required /></label>)}</div><div className={styles.imageViewGrid}>{viewOptions.map((view) => <label key={view} className={styles.imagePicker}>{view}<input type="file" accept="image/*" onChange={(event) => updateImage(color, view, event)} /><span>{imagesByColor[color]?.[view]?.name || 'No image selected'}</span></label>)}</div></div>)}
        </div>
        <div className={styles.sectionChoices}>
          <p className={styles.choiceLabel}>Homepage placement</p>
          <div className={styles.choiceGrid}>
            <label className={styles.choice}><input type="checkbox" checked={form.isTopCollection} onChange={(event) => updateField('isTopCollection', event.target.checked)} /><span>Top collection</span><input className={styles.orderInput} type="number" min="0" aria-label="Top collection order" value={form.topCollectionOrder} onChange={(event) => updateField('topCollectionOrder', event.target.value)} /></label>
            <label className={styles.choice}><input type="checkbox" checked={form.isNewArrival} onChange={(event) => updateField('isNewArrival', event.target.checked)} /><span>New arrivals</span><input className={styles.orderInput} type="number" min="0" aria-label="New arrivals order" value={form.newArrivalOrder} onChange={(event) => updateField('newArrivalOrder', event.target.value)} /></label>
          </div>
        </div>
        {(error || message) && <p className={error ? styles.formError : styles.curationMessage} role="alert">{error || message}</p>}
        <button type="submit" className={styles.saveButton} disabled={isSaving}>{isSaving ? 'Adding…' : 'Add product'}</button>
      </form>
    </details>
  )
}

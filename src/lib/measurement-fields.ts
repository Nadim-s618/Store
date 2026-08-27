export type MeasurementKey = 'height' | 'width' | 'waist' | 'hip'
export type MeasurementField = { key: MeasurementKey; label: string }

export function getMeasurementFields(category: string): MeasurementField[] {
  const value = category.toLowerCase()
  if (/(pant|trouser|jean|short)/.test(value)) return [{ key: 'waist', label: 'Waist' }, { key: 'height', label: 'Length' }, { key: 'hip', label: 'Hip' }]
  if (/(shirt|t-shirt|tee|blouse|top)/.test(value)) return [{ key: 'height', label: 'Shoulder' }, { key: 'width', label: 'Chest' }, { key: 'waist', label: 'Length' }]
  if (/(dress|gown)/.test(value)) return [{ key: 'width', label: 'Bust' }, { key: 'waist', label: 'Waist' }, { key: 'hip', label: 'Hip' }, { key: 'height', label: 'Length' }]
  if (/(skirt)/.test(value)) return [{ key: 'waist', label: 'Waist' }, { key: 'hip', label: 'Hip' }, { key: 'height', label: 'Length' }]
  if (/(jacket|coat|blazer|outerwear|hoodie|sweatshirt)/.test(value)) return [{ key: 'height', label: 'Shoulder' }, { key: 'width', label: 'Chest' }, { key: 'waist', label: 'Sleeve' }, { key: 'hip', label: 'Length' }]
  if (/(shoe|sandal|footwear)/.test(value)) return [{ key: 'height', label: 'Foot length' }, { key: 'width', label: 'Foot width' }]
  return [{ key: 'height', label: 'Length' }, { key: 'width', label: 'Width' }, { key: 'waist', label: 'Waist' }, { key: 'hip', label: 'Hip' }]
}

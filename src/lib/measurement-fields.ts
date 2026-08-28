export type MeasurementKey = 'height' | 'width' | 'waist' | 'hip'
export type MeasurementField = { key: MeasurementKey; label: string }
export type MeasurementValues = Record<MeasurementKey, number>

const sizes = ['S', 'M', 'L', 'XL', 'XXL'] as const

const measurementPresets: Record<string, MeasurementValues[]> = {
  top: [
    { height: 42, width: 50, waist: 68, hip: 50 },
    { height: 44, width: 52, waist: 70, hip: 52 },
    { height: 46, width: 54, waist: 72, hip: 54 },
    { height: 48, width: 56, waist: 74, hip: 56 },
    { height: 50, width: 58, waist: 76, hip: 58 },
  ],
  jacket: [
    { height: 44, width: 52, waist: 61, hip: 68 },
    { height: 46, width: 54, waist: 62, hip: 70 },
    { height: 48, width: 56, waist: 63, hip: 72 },
    { height: 50, width: 58, waist: 64, hip: 74 },
    { height: 52, width: 60, waist: 65, hip: 76 },
  ],
  bottom: [
    { height: 98, width: 0, waist: 72, hip: 96 },
    { height: 99, width: 0, waist: 76, hip: 100 },
    { height: 100, width: 0, waist: 80, hip: 104 },
    { height: 101, width: 0, waist: 84, hip: 108 },
    { height: 102, width: 0, waist: 88, hip: 112 },
  ],
  dress: [
    { height: 86, width: 84, waist: 66, hip: 90 },
    { height: 88, width: 88, waist: 70, hip: 94 },
    { height: 90, width: 92, waist: 74, hip: 98 },
    { height: 92, width: 96, waist: 80, hip: 104 },
    { height: 94, width: 100, waist: 86, hip: 110 },
  ],
  skirt: [
    { height: 0, width: 0, waist: 66, hip: 90 },
    { height: 0, width: 0, waist: 70, hip: 94 },
    { height: 0, width: 0, waist: 74, hip: 98 },
    { height: 0, width: 0, waist: 80, hip: 104 },
    { height: 0, width: 0, waist: 86, hip: 110 },
  ],
  footwear: [
    { height: 24, width: 9, waist: 0, hip: 0 },
    { height: 25, width: 9.5, waist: 0, hip: 0 },
    { height: 26, width: 10, waist: 0, hip: 0 },
    { height: 27, width: 10.5, waist: 0, hip: 0 },
    { height: 28, width: 11, waist: 0, hip: 0 },
  ],
  default: [
    { height: 68, width: 48, waist: 44, hip: 50 },
    { height: 70, width: 50, waist: 46, hip: 52 },
    { height: 72, width: 52, waist: 48, hip: 54 },
    { height: 74, width: 54, waist: 50, hip: 56 },
    { height: 76, width: 56, waist: 52, hip: 58 },
  ],
}

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

export function getMeasurementDefaults(category: string): Record<string, Record<MeasurementKey, string>> {
  const value = category.toLowerCase()
  const preset = /pant|trouser|jean|short/.test(value)
    ? measurementPresets.bottom
    : /shirt|t-shirt|tee|blouse|top/.test(value)
      ? measurementPresets.top
      : /dress|gown/.test(value)
        ? measurementPresets.dress
        : /skirt/.test(value)
          ? measurementPresets.skirt
          : /jacket|coat|blazer|outerwear|hoodie|sweatshirt/.test(value)
            ? measurementPresets.jacket
            : /shoe|sandal|footwear/.test(value)
              ? measurementPresets.footwear
              : measurementPresets.default

  return Object.fromEntries(sizes.map((size, index) => [size, Object.fromEntries(Object.entries(preset[index]).map(([key, measurement]) => [key, measurement ? String(measurement) : '']))])) as Record<string, Record<MeasurementKey, string>>
}

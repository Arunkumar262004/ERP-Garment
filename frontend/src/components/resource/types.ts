export type FieldType = 'text' | 'email' | 'number' | 'date' | 'textarea' | 'select'

export interface SelectOption {
  value: string | number
  label: string
}

export interface FieldConfig {
  name: string
  label: string
  type: FieldType
  required?: boolean
  placeholder?: string
  options?: SelectOption[]
  loadOptions?: () => Promise<SelectOption[]>
  span?: 1 | 2
  defaultValue?: string | number
}

export interface ColumnConfig<T> {
  key: string
  label: string
  render?: (row: T) => React.ReactNode
}

export interface ResourceConfig<T> {
  title: string
  endpoint: string
  queryKey: string
  columns: ColumnConfig<T>[]
  fields: FieldConfig[]
  extraParams?: Record<string, string>
  searchPlaceholder?: string
  allowEdit?: boolean
}

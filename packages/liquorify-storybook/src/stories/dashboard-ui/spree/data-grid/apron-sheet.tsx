import type { Variant } from '@spree/admin-sdk'
import {
  DataGrid,
  type DataGridColumn,
  DecimalCell,
  editableRowIndex,
  MoneyCell,
  NumberCell,
  ReadOnlyCell,
  SelectCell,
  SwitchCell,
  TextCell,
} from '@spree/dashboard-ui'
import { cn } from '@spree/dashboard-ui/lib/utils'
import { useCallback, useMemo, useState } from 'react'
import { cartonSize } from '../../../../../../dashboard-core/src/products/carton-size'
import { composeOptionsText } from '../../../../../../dashboard-core/src/products/variants-matrix'
import { cartonPackageType, linenApron, optionTypes } from '../../../../fixtures/admin/catalog'

export interface SheetRow {
  id: string
  kind: 'header' | 'item'
  label: string
  sku: string | null
  onHand: number
  price: string | null
  weight: string | null
  weightUnit: string | null
  cartonId: string | null
  preorderable: boolean
}

const weights = ['0.35', '0.38', '0.35', '0.38']

/** The linen apron's four variants, with the weights a merchant has entered. */
export function apronRows(): SheetRow[] {
  const variants = (linenApron.variants ?? []) as Variant[]
  return [
    { ...blank, id: 'header:product', kind: 'header', label: linenApron.name },
    ...variants.map((variant, index) => ({
      id: `variant:${index}`,
      kind: 'item' as const,
      label: composeOptionsText(
        (variant.option_values ?? []).map((value) => ({
          name: value.option_type_name,
          value: value.name,
        })),
        optionTypes,
      ),
      sku: variant.sku ?? null,
      onHand: variant.stock_levels?.[0]?.count_on_hand ?? 0,
      price: variant.prices?.find((price) => price.currency === 'USD')?.amount ?? null,
      weight: weights[index],
      weightUnit: 'kg',
      cartonId: null,
      preorderable: variant.sku === 'APRON-SLT-M',
    })),
  ]
}

const blank: Omit<SheetRow, 'id' | 'kind' | 'label'> = {
  sku: null,
  onHand: 0,
  price: null,
  weight: null,
  weightUnit: null,
  cartonId: null,
  preorderable: false,
}

const units = ['g', 'kg', 'lb', 'oz'].map((unit) => ({ value: unit, label: unit }))

const cartons = [
  {
    value: cartonPackageType.id,
    label: cartonPackageType.name,
    hint: cartonSize(cartonPackageType) ?? undefined,
  },
]

/**
 * A spreadsheet of the linen apron's variants with one column for each kind of
 * cell Spree's product grids use: the variant's name as read-only text, its SKU
 * as text, stock as a whole number that turns amber below five as the
 * inventory grid sets it, the price as money, the weight as a decimal, its unit
 * and carton as fixed choices, and pre-order as a switch. Edits are kept, so a
 * play function sees them land.
 */
export function ApronSheet({
  symbol = '$',
  decimal = '.',
  grouped = true,
  scrollable = false,
  className,
  frameClassName,
}: {
  symbol?: string
  decimal?: string
  grouped?: boolean
  scrollable?: boolean
  className?: string
  /** Bounds the box the grid sits in, as the bulk variant editor's dialog does. */
  frameClassName?: string
}) {
  const [rows, setRows] = useState(() =>
    apronRows().filter((row) => grouped || row.kind === 'item'),
  )
  const update = useCallback(
    (id: string, change: Partial<SheetRow>) =>
      setRows((current) => current.map((row) => (row.id === id ? { ...row, ...change } : row))),
    [],
  )

  const columns = useMemo<DataGridColumn<SheetRow>[]>(() => {
    const at = (
      table: { getRowModel: () => { rows: { id: string; original: SheetRow }[] } },
      id: string,
      col: number,
    ) => ({ row: editableRowIndex(table.getRowModel().rows, id), col })
    const right = (label: string) => () => <span className="block text-right">{label}</span>
    return [
      {
        id: 'variant',
        header: 'Variant',
        cell: ({ row }) => (
          <ReadOnlyCell className="whitespace-nowrap text-muted-foreground">
            {row.original.label}
          </ReadOnlyCell>
        ),
      },
      {
        id: 'sku',
        header: 'SKU',
        cell: ({ row, table }) => (
          <TextCell
            coords={at(table, row.id, 0)}
            value={row.original.sku}
            onChange={(sku) => update(row.id, { sku })}
            ariaLabel={`SKU — ${row.original.label}`}
          />
        ),
      },
      {
        id: 'on_hand',
        header: right('On hand'),
        cell: ({ row, table }) => (
          <NumberCell
            coords={at(table, row.id, 1)}
            value={row.original.onHand}
            onChange={(onHand) => update(row.id, { onHand })}
            ariaLabel={`On hand — ${row.original.label}`}
            intent={row.original.onHand < 5 ? 'warning' : 'default'}
          />
        ),
      },
      {
        id: 'price',
        header: right('Price'),
        cell: ({ row, table }) => (
          <MoneyCell
            coords={at(table, row.id, 2)}
            value={row.original.price}
            onChange={(price) => update(row.id, { price })}
            symbol={symbol}
            decimal={decimal}
            ariaLabel={`Price for ${row.original.label}`}
          />
        ),
      },
      {
        id: 'weight',
        header: right('Weight'),
        cell: ({ row, table }) => (
          <DecimalCell
            coords={at(table, row.id, 3)}
            value={row.original.weight}
            onChange={(weight) => update(row.id, { weight })}
            decimal={decimal}
            ariaLabel={`Weight — ${row.original.label}`}
          />
        ),
      },
      {
        id: 'weight_unit',
        header: 'Unit',
        cell: ({ row, table }) => (
          <SelectCell
            coords={at(table, row.id, 4)}
            value={row.original.weightUnit}
            onChange={(weightUnit) => update(row.id, { weightUnit })}
            options={units}
            nullLabel="None"
            ariaLabel={`Unit — ${row.original.label}`}
          />
        ),
      },
      {
        id: 'carton',
        header: 'Carton',
        cell: ({ row, table }) => (
          <SelectCell
            coords={at(table, row.id, 5)}
            value={row.original.cartonId}
            onChange={(cartonId) => update(row.id, { cartonId })}
            options={cartons}
            nullLabel="None"
            ariaLabel={`Carton — ${row.original.label}`}
          />
        ),
      },
      {
        id: 'preorderable',
        header: 'Available for pre-order',
        cell: ({ row, table }) => (
          <SwitchCell
            coords={at(table, row.id, 6)}
            value={row.original.preorderable}
            onChange={(preorderable) => update(row.id, { preorderable })}
            ariaLabel={`Available for pre-order — ${row.original.label}`}
          />
        ),
      },
    ]
  }, [symbol, decimal, update])

  return (
    <div className={cn('overflow-hidden rounded border', frameClassName)}>
      <DataGrid<SheetRow>
        rows={rows}
        columns={columns}
        getRowId={(row) => row.id}
        renderSectionHeader={(row) =>
          row.kind === 'header' ? <div className="truncate font-medium">{row.label}</div> : null
        }
        aria-label="Variant spreadsheet"
        scrollable={scrollable}
        className={className}
      />
    </div>
  )
}

/** The handle the grid draws at the far corner of the selection, if it draws one. */
export function fillHandle(canvas: HTMLElement): HTMLElement | null {
  return canvas.querySelector<HTMLElement>('div[style*="crosshair"]')
}

/**
 * Drags the fill handle onto another cell the way a pointer would: pressed on
 * the handle, moved over the target, and released there unless `release` is
 * false, which leaves the drag in progress for the capture.
 */
export async function dragFillHandle(handle: HTMLElement, target: HTMLElement, release = true) {
  const pause = () => new Promise((resolve) => setTimeout(resolve, 60))
  const from = handle.getBoundingClientRect()
  const to = target.getBoundingClientRect()
  const event = (type: string, x: number, y: number) =>
    handle.dispatchEvent(
      new PointerEvent(type, {
        bubbles: true,
        pointerId: 1,
        isPrimary: true,
        pointerType: 'mouse',
        buttons: type === 'pointerup' ? 0 : 1,
        clientX: x,
        clientY: y,
      }),
    )
  event('pointerdown', from.left + 4, from.top + 4)
  await pause()
  event('pointermove', to.left + to.width / 2, to.top + to.height / 2)
  await pause()
  if (release) {
    event('pointerup', to.left + to.width / 2, to.top + to.height / 2)
    await pause()
  }
}

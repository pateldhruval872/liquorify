import type { PriceRule } from '@spree/admin-sdk'
import { typeDescription, typeLabel } from '@spree/dashboard-core'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@spree/dashboard-ui'
import type { ComponentType } from 'react'
import type { PriceRuleEditorContext } from '../../../../../dashboard/src/components/spree/price-list-editors/types'
import {
  type PriceRuleFormDraft,
  ruleDraftFromRule,
  ruleDraftFromType,
} from '../../../../../dashboard/src/schemas/price-list'
import { storeParameters } from '../../../decorators/store'
import { priceRuleTypes } from '../../../fixtures/admin/merchandising'
import { audienceLists } from '../../../mocks/handlers/admin/merchandising'

/**
 * A price rule's editor in the sheet the price list page opens it in
 * (DA-PRD-17): an existing rule, or a new one of a kind as Add rule starts it.
 */
export function RuleSheet({
  editor: Editor,
  rule,
  type,
  onSave,
  onClose,
}: {
  editor: ComponentType<PriceRuleEditorContext>
  rule?: PriceRule
  type: string
  onSave: (next: PriceRuleFormDraft) => void
  onClose: () => void
}) {
  const definition = priceRuleTypes.find((entry) => entry.type === type)
  const draft = rule
    ? ruleDraftFromRule(rule)
    : ruleDraftFromType(definition as NonNullable<typeof definition>)
  return (
    <Sheet open>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{typeLabel('price_rule', type, definition?.label)}</SheetTitle>
          <SheetDescription>
            {typeDescription('price_rule', type, definition?.description)}
          </SheetDescription>
        </SheetHeader>
        <Editor draft={draft} onSave={onSave} onClose={onClose} />
      </SheetContent>
    </Sheet>
  )
}

/** Signed in, with the channels, markets, groups and customers the pickers search. */
export const ruleSheetParameters = {
  liquorify: { ...storeParameters().liquorify, capture: 'viewport' },
  msw: { handlers: { ...storeParameters().msw.handlers, audience: audienceLists } },
}

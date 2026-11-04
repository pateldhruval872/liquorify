import type { PromotionAction, PromotionRule } from '@spree/admin-sdk'
import { typeLabel, useTranslation } from '@spree/dashboard-core'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@spree/dashboard-ui'
import type { ComponentType } from 'react'
import {
  actionDraftFromAction,
  actionDraftFromType,
  type PromotionActionEditorContext,
  type PromotionActionFormDraft,
  type PromotionRuleEditorContext,
  type PromotionRuleFormDraft,
  ruleDraftFromRule,
  ruleDraftFromType,
} from '../../../../../dashboard/src/components/spree/promotion-editors/types'
import { storeParameters } from '../../../decorators/store'
import { promotionActionTypes, promotionRuleTypes } from '../../../fixtures/admin/loyalty'
import { promotionPickers, promotionRequests } from '../../../mocks/handlers/admin/loyalty'

/**
 * A promotion rule's editor in the sheet the promotion page opens it in
 * (DA-PRM-02, DA-PRM-03): a saved rule, or a new one of a kind as Add rule
 * starts it, with the store's currency as the page passes it.
 */
export function RuleSheet({
  editor: Editor,
  rule,
  type,
  onSave,
  onClose,
}: {
  editor: ComponentType<PromotionRuleEditorContext>
  rule?: PromotionRule
  type: string
  onSave: (next: PromotionRuleFormDraft) => void
  onClose: () => void
}) {
  const { t } = useTranslation()
  const definition = promotionRuleTypes.find((entry) => entry.type === type)
  const draft = rule
    ? ruleDraftFromRule(rule)
    : ruleDraftFromType(definition as NonNullable<typeof definition>, { currency: 'USD' })
  return (
    <Sheet open>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{typeLabel('promotion_rule', type, definition?.label)}</SheetTitle>
          <SheetDescription>{t('admin.promotions.rule_edit.description')}</SheetDescription>
        </SheetHeader>
        <Editor draft={draft} onSave={onSave} onClose={onClose} />
      </SheetContent>
    </Sheet>
  )
}

/** Mirrors `RuleSheet` for a promotion action's editor. */
export function ActionSheet({
  editor: Editor,
  action,
  type,
  onSave,
  onClose,
}: {
  editor: ComponentType<PromotionActionEditorContext>
  action?: PromotionAction
  type: string
  onSave: (next: PromotionActionFormDraft) => void
  onClose: () => void
}) {
  const { t } = useTranslation()
  const definition = promotionActionTypes.find((entry) => entry.type === type)
  const draft = action
    ? actionDraftFromAction(action)
    : actionDraftFromType(definition as NonNullable<typeof definition>, { currency: 'USD' })
  return (
    <Sheet open>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{typeLabel('promotion_action', type, definition?.label)}</SheetTitle>
          <SheetDescription>{t('admin.promotions.action_edit.description')}</SheetDescription>
        </SheetHeader>
        <Editor draft={draft} onSave={onSave} onClose={onClose} />
      </SheetContent>
    </Sheet>
  )
}

/**
 * Signed in, with the rule and action kinds, the calculators and every list a
 * rule or action picks from answered. `overrides` replace any of them by key:
 * Storybook merges a story's handlers into its file's by key, so an override
 * under a new key would answer only after the defaults.
 */
export function editorSheetParameters(overrides: Record<string, unknown> = {}) {
  const base = storeParameters()
  return {
    liquorify: { ...base.liquorify, capture: 'viewport' },
    msw: {
      handlers: {
        ...base.msw.handlers,
        promotions: promotionRequests(),
        pickers: promotionPickers,
        ...overrides,
      },
    },
  }
}

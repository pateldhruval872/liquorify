import type { PermissionRule, SetupTask, Store } from '@spree/admin-sdk'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Card,
} from '@spree/dashboard-ui'
import { CheckCircle2Icon, CircleIcon } from '@spree/dashboard-ui/icons'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { StoryRoute } from '../../../decorators/router'
import { storeParameters } from '../../../decorators/store'
import { fullAccess } from '../../../fixtures/admin/session'
import { shellStore } from '../../../fixtures/admin/shell'

export const gettingStarted = {
  pattern: '/$storeId/getting-started',
  path: `/${shellStore.id}/getting-started`,
} satisfies StoryRoute

/**
 * One step of the Getting Started checklist (DA-HOME-02), opened, as the
 * page's card renders it (`routes/_authenticated/$storeId/getting-started.tsx`).
 */
export function TaskFrame({ task, children }: { task: SetupTask; children: ReactNode }) {
  const { t } = useTranslation()

  return (
    <Card className="overflow-hidden py-0">
      <Accordion defaultValue={[task.name]}>
        <AccordionItem value={task.name}>
          <AccordionTrigger>
            {task.done ? (
              <CheckCircle2Icon className="size-5 shrink-0 text-success" />
            ) : (
              <CircleIcon className="size-5 shrink-0 text-muted-foreground" />
            )}
            <span className={task.done ? 'text-muted-foreground' : undefined}>
              {t(`admin.pages.getting_started.tasks.${task.name}.title`)}
            </span>
          </AccordionTrigger>
          <AccordionContent keepMounted className="flex flex-col items-start gap-3 ps-12">
            {children}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  )
}

/** A task's step on the Getting Started page, in the store, with the page's own requests answered. */
export function taskParameters(
  handlers: Record<string, unknown> = {},
  store: Store = shellStore,
  rules: PermissionRule[] = fullAccess,
) {
  const base = storeParameters(store, rules)
  return {
    liquorify: { ...base.liquorify, route: gettingStarted, column: 'page' },
    msw: { handlers: { ...base.msw.handlers, ...handlers } },
  }
}

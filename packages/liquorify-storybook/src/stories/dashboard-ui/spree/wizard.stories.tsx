import { Wizard, WizardProgress, type WizardStep } from '@spree/dashboard-ui/spree/wizard'
import { Button } from '@spree/dashboard-ui/ui/button'
import { Field, FieldGroup, FieldLabel } from '@spree/dashboard-ui/ui/field'
import { Input } from '@spree/dashboard-ui/ui/input'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, screen, userEvent, waitFor } from 'storybook/test'

/** The catalog wizard's steps (DA-PRD-13), which the import wizard's frame shares. */
const steps: WizardStep[] = [
  { key: 'details', label: 'Details' },
  { key: 'audience', label: 'Audience' },
  { key: 'products', label: 'Products' },
  { key: 'pricing', label: 'Pricing' },
  { key: 'review', label: 'Review' },
]

const help: Record<string, string> = {
  details: 'Name this agreement so you recognise it later.',
  audience: 'Who sees this catalog and gets its prices.',
  products: 'What this agreement covers.',
  pricing: 'What buyers on this agreement pay.',
  review: 'Nothing is created until you finish.',
}

/**
 * The full-window frame a multi-step flow sits in, driven as the catalog
 * wizard drives it: Back and Next move between steps, a finished step can be
 * jumped back to, and the last step's button submits.
 */
function CatalogFrame({
  start = 'details',
  unsaved = false,
  onSubmit,
}: {
  start?: string
  unsaved?: boolean
  onSubmit: () => void
}) {
  const [current, setCurrent] = useState(start)
  const index = steps.findIndex((step) => step.key === current)
  const last = index === steps.length - 1
  return (
    <Wizard
      open
      onOpenChange={() => {}}
      title="New catalog"
      subtitle={index > 0 ? 'Trade catalog' : undefined}
      steps={steps}
      current={current}
      onStepSelect={setCurrent}
      hasUnsavedChanges={unsaved}
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit()
      }}
      contentClassName="max-w-2xl"
      back={
        <Button
          type="button"
          variant="outline"
          disabled={index === 0}
          onClick={() => setCurrent(steps[index - 1].key)}
        >
          Back
        </Button>
      }
      forward={
        last ? (
          <Button key="create" type="submit">
            Create catalog
          </Button>
        ) : (
          <Button key="next" type="button" onClick={() => setCurrent(steps[index + 1].key)}>
            Next
          </Button>
        )
      }
    >
      <div>
        <h2 className="font-medium text-lg">{steps[index].label}</h2>
        <p className="text-muted-foreground text-sm">{help[current]}</p>
      </div>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="wizard-name">Name</FieldLabel>
          <Input id="wizard-name" defaultValue={index > 0 ? 'Trade catalog' : ''} />
        </Field>
      </FieldGroup>
    </Wizard>
  )
}

const meta = {
  title: 'Dashboard UI/Composed/Wizard',
  component: CatalogFrame,
  tags: ['CMP-DUI-C-54'],
  args: { onSubmit: fn() },
  // The wizard takes the whole window.
  parameters: { liquorify: { capture: 'viewport' } },
} satisfies Meta<typeof CatalogFrame>

export default meta
type Story = StoryObj<typeof meta>

// The wizard moves focus into itself as it opens. A click made before that
// loses its focus to the close button, which then shows its focus ring, so a
// story clicks only once the wizard holds focus.
async function opened() {
  const wizard = await screen.findByRole('dialog', { name: 'New catalog' })
  await waitFor(() => expect(wizard.contains(document.activeElement)).toBe(true))
}

export const FirstStep: Story = {
  name: 'First step',
  play: async () => {
    await screen.findByRole('dialog', { name: 'New catalog' })
    await expect(screen.getByRole('button', { name: 'Back' })).toBeDisabled()
  },
}

export const PartWay: Story = {
  name: 'Part way',
  args: { start: 'products' },
  play: async () => {
    await expect(await screen.findByRole('button', { name: 'Products' })).toHaveAttribute(
      'aria-current',
      'step',
    )
  },
}

export const JumpingBack: Story = {
  name: 'Jumping back to a finished step',
  args: { start: 'pricing' },
  play: async () => {
    await opened()
    await userEvent.click(screen.getByRole('button', { name: 'Audience' }))
    await expect(screen.getByRole('button', { name: 'Audience' })).toHaveAttribute(
      'aria-current',
      'step',
    )
  },
}

export const LastStep: Story = {
  name: 'Last step',
  args: { start: 'review' },
  play: async ({ args }) => {
    await opened()
    await userEvent.click(screen.getByRole('button', { name: 'Create catalog' }))
    await expect(args.onSubmit).toHaveBeenCalled()
  },
}

// Closing with work filled in asks before throwing it away.
export const DiscardingDraft: Story = {
  name: 'Discarding a draft',
  args: { start: 'audience', unsaved: true },
  play: async () => {
    await opened()
    await userEvent.click(screen.getByRole('button', { name: 'Close' }))
    await screen.findByRole('dialog', { name: 'Discard this draft?' })
  },
}

/** The progress rail on its own, as the wizard draws it beside each step. */
export const Progress: StoryObj<typeof WizardProgress> = {
  render: () => (
    <WizardProgress steps={steps} current="pricing" onStepSelect={() => {}} className="w-56" />
  ),
  parameters: { liquorify: {} },
  play: async () => {
    await expect(await screen.findByRole('button', { name: 'Pricing' })).toHaveAttribute(
      'aria-current',
      'step',
    )
    await expect(screen.getByRole('button', { name: 'Review' })).toBeDisabled()
  },
}

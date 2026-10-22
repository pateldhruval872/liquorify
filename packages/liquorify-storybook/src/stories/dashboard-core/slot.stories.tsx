import { registerSlot, removeSlot, Slot } from '@spree/dashboard-core'
import { Button } from '@spree/dashboard-ui/ui/button'
import type { Meta, StoryObj } from '@storybook/react-vite'

// The sign-in page's slot, below its form (DA-AUTH-01). What appears there is
// whatever a plugin registers; the entries here stand in for one.
const name = 'login.after'

function CompanySignIn() {
  return (
    <Button variant="outline" className="w-full">
      Sign in with your company account
    </Button>
  )
}

function HelpLink() {
  return (
    <p className="text-center text-sm text-muted-foreground">Need help? Ask your store owner.</p>
  )
}

/** Registers entries for one story and removes them when it closes. */
function entries(...list: Parameters<typeof registerSlot>[1][]) {
  return () => {
    for (const entry of list) registerSlot(name, entry)
    return () => {
      for (const entry of list) removeSlot(name, entry.id)
    }
  }
}

const meta = {
  title: 'Dashboard core/Slot',
  component: Slot,
  tags: ['CMP-CORE-34'],
  args: { name },
  decorators: [
    (Story) => (
      <div className="flex w-96 flex-col gap-3">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Slot>

export default meta
type Story = StoryObj<typeof meta>

// Nothing registered. Without a fallback the slot draws nothing at all, as on
// a stock installation, which leaves nothing to capture.
export const Fallback: Story = {
  args: { fallback: <HelpLink /> },
}

export const OneEntry: Story = {
  name: 'One entry',
  beforeEach: entries({ id: 'company-sign-in', component: CompanySignIn }),
}

// Registered help first, then sign-in, but drawn by position.
export const ByPosition: Story = {
  name: 'By position',
  beforeEach: entries(
    { id: 'help', component: HelpLink, position: 200 },
    { id: 'company-sign-in', component: CompanySignIn, position: 100 },
  ),
}

// An entry whose condition is false is left out, so the fallback shows.
export const HiddenByCondition: Story = {
  name: 'Hidden by condition',
  args: { fallback: <HelpLink /> },
  beforeEach: entries({ id: 'company-sign-in', component: CompanySignIn, if: () => false }),
}

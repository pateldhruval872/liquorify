import { StorefrontVisibleSwitch } from '@spree/dashboard-ui'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useForm } from 'react-hook-form'
import { expect, screen, userEvent, waitFor } from 'storybook/test'

/** The switch in the payment method sheets (DA-SET-12), at the sheet's width and in its smaller text. */
function PaymentMethodVisibility({ visible = true }: { visible?: boolean }) {
  const form = useForm<{ storefront_visible: boolean }>({
    defaultValues: { storefront_visible: visible },
  })
  return (
    <div className="w-[566px] text-sm">
      <StorefrontVisibleSwitch control={form.control} name="storefront_visible" />
    </div>
  )
}

const meta = {
  title: 'Dashboard UI/Composed/Storefront visible switch',
  component: PaymentMethodVisibility,
  tags: ['CMP-DUI-C-49'],
} satisfies Meta<typeof PaymentMethodVisibility>

export default meta
type Story = StoryObj<typeof meta>

export const Visible: Story = {}

// Off: the method is offered only to staff placing orders in the dashboard.
export const AdminOnly: Story = { name: 'Admin only', args: { visible: false } }

// The label switches it too.
export const TurnedOff: Story = {
  name: 'Turned off',
  play: async () => {
    await userEvent.click(screen.getByText('Visible in storefront'))
    await waitFor(() => expect(screen.getByRole('switch')).not.toBeChecked())
  },
}

import { EyeIcon } from '@spree/dashboard-ui/icons'
import { StatusCard } from '@spree/dashboard-ui/spree/products/status-card'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useForm } from 'react-hook-form'
import { screen, userEvent } from 'storybook/test'

const statuses = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'archived', label: 'Archived' },
]

/**
 * The status card at the top of the product page's sidebar (DA-PRD-02,
 * DA-PRD-03), with the statuses the admin dashboard assigns. A product a
 * seller submitted adds its review status and buttons, which belong to the
 * marketplace batch.
 */
function ProductStatus({ status }: { status: string }) {
  const form = useForm({ defaultValues: { status } })
  return (
    <StatusCard
      control={form.control}
      name="status"
      title="Status"
      icon={<EyeIcon className="size-4" />}
      label="Status"
      options={statuses}
    />
  )
}

const meta = {
  title: 'Dashboard UI/Composed/Products/Status card',
  component: ProductStatus,
  tags: ['CMP-DUI-C-36'],
  args: { status: 'draft' },
  parameters: { liquorify: { column: 'sidebar' } },
} satisfies Meta<typeof ProductStatus>

export default meta
type Story = StoryObj<typeof meta>

export const Draft: Story = {}

export const Active: Story = {
  args: { status: 'active' },
}

export const Archived: Story = {
  args: { status: 'archived' },
}

export const Choosing: Story = {
  parameters: { liquorify: { column: 'sidebar', capture: 'viewport' } },
  play: async () => {
    await userEvent.click(screen.getByRole('combobox'))
    await screen.findByRole('option', { name: 'Archived' })
  },
}

import { ExternalLink } from '@spree/dashboard-ui/spree/external-link'
import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  title: 'Dashboard UI/Composed/External link',
  component: ExternalLink,
  tags: ['CMP-DUI-C-19'],
  args: { href: 'https://spreecommerce.org/docs/user/settings/users', children: 'Learn more' },
} satisfies Meta<typeof ExternalLink>

export default meta
type Story = StoryObj<typeof meta>

// On its own line, as the store settings page links a provider's documentation.
export const Default: Story = {}

// After a page's description, as the staff and roles pages link their
// documentation (DA-SET-24, DA-SET-25).
export const InADescription: Story = {
  name: 'In a description',
  render: (args) => (
    <p className="text-muted-foreground text-sm">
      Manage admin teammates and roles <ExternalLink {...args} />
    </p>
  ),
}

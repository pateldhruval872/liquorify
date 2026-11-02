import { CreditCardIcon, PlusIcon } from '@spree/dashboard-ui/icons'
import { Badge, StatusBadge } from '@spree/dashboard-ui/ui/badge'
import { Button } from '@spree/dashboard-ui/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@spree/dashboard-ui/ui/card'
import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  title: 'Dashboard UI/Primitives/Card',
  component: Card,
  tags: ['CMP-DUI-P-09'],
  decorators: [(Story) => <div className="w-[28rem]">{Story()}</div>],
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

// Spree's cards put a description or an action beside the title, never both.
export const Default: Story = {
  render: (args) => (
    <Card {...args}>
      <CardHeader>
        <CardTitle>Customer privacy</CardTitle>
        <CardDescription>What this customer agreed to, and when.</CardDescription>
      </CardHeader>
      <CardContent className="text-sm">
        <p>Subscribed to email marketing</p>
        <p className="text-muted-foreground">avery@example.com</p>
      </CardContent>
      <CardFooter>
        <Button size="sm" variant="ghost">
          View customer
        </Button>
      </CardFooter>
    </Card>
  ),
}

// The order page's cards: an icon and a count in the title, a status and a button as the action.
export const WithAction: Story = {
  name: 'With action',
  render: (args) => (
    <Card {...args}>
      <CardHeader>
        <CardTitle>
          <CreditCardIcon className="size-4" />
          Payments
          <Badge variant="outline">1</Badge>
        </CardTitle>
        <CardAction className="flex items-center gap-2">
          <StatusBadge status="paid" label="Paid" />
          <Button size="sm" variant="outline">
            <PlusIcon data-icon="inline-start" />
            Add payment
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="text-sm">Visa ending 4242 · $49.00 captured</CardContent>
    </Card>
  ),
}

export const ContentOnly: Story = {
  name: 'Content only',
  render: (args) => (
    <Card {...args}>
      <CardContent className="text-sm">
        Notes added to the order are visible to staff only.
      </CardContent>
    </Card>
  ),
}

// A container card holding nested records, as an order's fulfillments are shown.
export const ContainerWithNested: Story = {
  name: 'Container with nested',
  render: () => (
    <Card variant="container">
      <CardHeader>
        <CardTitle>Fulfillments</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {['F-1001', 'F-1002'].map((number, index) => (
          <Card key={number} variant="nested">
            <CardHeader>
              <CardTitle className="text-sm">{number}</CardTitle>
              <CardAction>
                <Badge variant={index === 0 ? 'success' : 'warning'}>
                  {index === 0 ? 'Shipped' : 'Ready'}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardContent className="text-sm">
              {index === 0 ? '2 items, tracking 1Z999AA10123456784' : '1 item'}
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  ),
}

import { CircleAlertIcon, InfoIcon, TriangleAlertIcon } from '@spree/dashboard-ui/icons'
import { Alert, AlertAction, AlertDescription, AlertTitle } from '@spree/dashboard-ui/ui/alert'
import { Button } from '@spree/dashboard-ui/ui/button'
import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ComponentProps, ReactNode } from 'react'

type Props = ComponentProps<typeof Alert> & {
  icon?: ReactNode
  title: string
  description?: string
  action?: string
}

function Example({ icon, title, description, action, ...props }: Props) {
  return (
    <div className="w-[28rem]">
      <Alert {...props}>
        {icon}
        <AlertTitle>{title}</AlertTitle>
        {description && <AlertDescription>{description}</AlertDescription>}
        {action && (
          <AlertAction>
            <Button size="xs" variant="outline">
              {action}
            </Button>
          </AlertAction>
        )}
      </Alert>
    </div>
  )
}

const meta = {
  title: 'Dashboard UI/Primitives/Alert',
  component: Example,
  tags: ['CMP-DUI-P-02'],
  args: {
    title: 'Taxes are calculated at checkout',
    description: 'Prices you enter include no tax. Customers see the tax before they pay.',
  },
} satisfies Meta<typeof Example>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithIcon: Story = { name: 'With icon', args: { icon: <InfoIcon /> } }

export const Info: Story = { args: { variant: 'info', icon: <InfoIcon /> } }

export const Warning: Story = {
  args: {
    variant: 'warning',
    icon: <TriangleAlertIcon />,
    title: 'Two products have no price in EUR',
    description: 'They are hidden from the EUR market until a price is set.',
  },
}

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    icon: <CircleAlertIcon />,
    title: 'The payment could not be captured',
    description: 'The provider declined the request. Try again or void the payment.',
  },
}

export const TitleOnly: Story = { name: 'Title only', args: { description: undefined } }

export const WithAction: Story = {
  name: 'With action',
  args: { icon: <InfoIcon />, action: 'Review' },
}

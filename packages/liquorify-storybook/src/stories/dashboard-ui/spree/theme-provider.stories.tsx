import { PageHeader } from '@spree/dashboard-core'
import { ThemeProvider } from '@spree/dashboard-ui/spree/theme-provider'
import { Button } from '@spree/dashboard-ui/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@spree/dashboard-ui/ui/card'
import { Switch } from '@spree/dashboard-ui/ui/switch'
import type { Meta, StoryObj } from '@storybook/react-vite'

/**
 * The provider every panel mounts at its root: it puts the light or dark
 * theme on the page and follows the system's choice until the admin picks
 * one. It draws nothing itself; the story shows a settings card in the theme
 * it sets. The toolbar's theme chooses the mode, as the account menu does.
 */
function ThemedCard() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Store" sticky={false} actions={<Button>Save</Button>} />
      <Card>
        <CardHeader>
          <CardTitle>Checkout</CardTitle>
          <CardDescription>How customers check out on your storefront.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4 text-sm">
          <label htmlFor="guest-checkout">Allow guest checkout</label>
          <Switch id="guest-checkout" defaultChecked />
        </CardContent>
      </Card>
    </div>
  )
}

const meta = {
  title: 'Dashboard UI/Composed/Theme provider',
  component: ThemeProvider,
  tags: ['CMP-DUI-C-52'],
  args: { children: <ThemedCard /> },
  parameters: { liquorify: { column: 'settings' } },
} satisfies Meta<typeof ThemeProvider>

export default meta
type Story = StoryObj<typeof meta>

export const Chosen: Story = {}

// Where the running dashboard starts: no choice stored, so the system decides.
export const FollowingTheSystem: Story = {
  name: 'Following the system',
  parameters: { liquorify: { systemTheme: true } },
}

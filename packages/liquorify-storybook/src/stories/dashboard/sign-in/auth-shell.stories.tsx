import { Button } from '@spree/dashboard-ui/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@spree/dashboard-ui/ui/card'
import { Input } from '@spree/dashboard-ui/ui/input'
import { Label } from '@spree/dashboard-ui/ui/label'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { AuthShell } from '../../../../../dashboard/src/components/spree/auth-shell'

const meta = {
  title: 'Admin dashboard/Sign-in/Auth shell',
  component: AuthShell,
  tags: ['CMP-DA-G-24'],
  // The shell fills the window, so the story is captured edge to edge.
  parameters: { layout: 'fullscreen', liquorify: { capture: 'viewport' } },
} satisfies Meta<typeof AuthShell>

export default meta
type Story = StoryObj<typeof meta>

// Holding a heading and a form, as the sign-in and forgot-password pages do
// (DA-AUTH-01, DA-AUTH-02).
export const WithAForm: Story = {
  name: 'With a form',
  args: {
    children: (
      <>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold">Reset your password</h1>
          <p className="text-sm text-muted-foreground">
            Enter your email and we'll send you a link to reset your password.
          </p>
        </div>
        <form className="grid gap-6">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            {/* The forgot-password page focuses its email field as it opens. */}
            <Input id="email" type="email" placeholder="admin@example.com" autoFocus />
          </div>
          <Button type="submit" className="w-full">
            Send reset link
          </Button>
          <div className="text-center">
            <a href="#login" className="link text-sm">
              Back to sign in
            </a>
          </div>
        </form>
      </>
    ),
  },
}

// Holding a card, as the reset-password page does (DA-AUTH-03).
export const WithACard: Story = {
  name: 'With a card',
  args: {
    children: (
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Invalid reset link</CardTitle>
          <CardDescription>This password reset link is missing its token.</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <a href="#forgot-password" className="link text-sm">
            Request a new reset link
          </a>
        </CardContent>
      </Card>
    ),
  },
}

// Holding only a message, as an invitation that cannot be found (DA-AUTH-04).
export const WithAMessage: Story = {
  name: 'With a message',
  args: {
    children: (
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Invitation not found</h1>
        <p className="text-sm text-muted-foreground">
          This invitation has expired, been revoked, or already been accepted. Ask the inviter to
          send a new one.
        </p>
      </div>
    ),
  },
}

import { SettingsIcon, TruckIcon } from '@spree/dashboard-ui/icons'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@spree/dashboard-ui/ui/tabs'
import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ComponentProps } from 'react'
import { userEvent } from 'storybook/test'

function Orders(props: ComponentProps<typeof Tabs>) {
  return (
    <Tabs defaultValue="all" {...props}>
      <TabsList>
        <TabsTrigger value="all">All</TabsTrigger>
        <TabsTrigger value="unfulfilled">Unfulfilled</TabsTrigger>
        <TabsTrigger value="drafts">Drafts</TabsTrigger>
        <TabsTrigger value="archived" disabled>
          Archived
        </TabsTrigger>
      </TabsList>
      <TabsContent value="all" className="text-sm">
        All orders placed in the last 30 days.
      </TabsContent>
      <TabsContent value="unfulfilled" className="text-sm">
        Orders waiting to be shipped.
      </TabsContent>
      <TabsContent value="drafts" className="text-sm">
        Orders created by staff and not yet sent.
      </TabsContent>
    </Tabs>
  )
}

const meta = {
  title: 'Dashboard UI/Primitives/Tabs',
  component: Orders,
  tags: ['CMP-DUI-P-42'],
} satisfies Meta<typeof Orders>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const SecondSelected: Story = {
  name: 'Second selected',
  args: { defaultValue: 'unfulfilled' },
}

// No Spree screen uses vertical tabs; the list sits in a fixed column so the panel keeps its width.
export const Vertical: Story = {
  render: () => (
    <Tabs defaultValue="general" orientation="vertical" className="w-[28rem]">
      <div className="w-40 shrink-0">
        <TabsList>
          <TabsTrigger value="general">
            <SettingsIcon />
            General
          </TabsTrigger>
          <TabsTrigger value="shipping">
            <TruckIcon />
            Shipping
          </TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="general" className="text-sm">
        Store name, address and contact email.
      </TabsContent>
      <TabsContent value="shipping" className="text-sm">
        Zones and delivery methods.
      </TabsContent>
    </Tabs>
  ),
}

// The arrow key moves focus to the next tab without selecting it.
export const FocusVisible: Story = {
  name: 'Focus visible',
  play: async () => {
    await userEvent.tab()
    await userEvent.keyboard('{ArrowRight}')
  },
}

// The selected tab's shadow replaces its focus ring, so this matches Default.
export const FocusOnSelected: Story = {
  name: 'Focus on selected tab',
  play: async () => {
    await userEvent.tab()
  },
}

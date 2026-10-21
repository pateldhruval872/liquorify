import { KeyRoundIcon, PlusIcon, TriangleAlertIcon } from '@spree/dashboard-ui/icons'
import { Button } from '@spree/dashboard-ui/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@spree/dashboard-ui/ui/empty'
import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  title: 'Dashboard UI/Primitives/Empty',
  component: Empty,
  tags: ['CMP-DUI-P-22'],
  decorators: [(Story) => <div className="w-[32rem]">{Story()}</div>],
} satisfies Meta<typeof Empty>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <Empty {...args}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <KeyRoundIcon />
        </EmptyMedia>
        <EmptyTitle>No API keys yet</EmptyTitle>
        <EmptyDescription>Create a key to connect an app or an integration.</EmptyDescription>
      </EmptyHeader>
    </Empty>
  ),
}

export const WithAction: Story = {
  name: 'With action',
  render: (args) => (
    <Empty {...args}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <KeyRoundIcon />
        </EmptyMedia>
        <EmptyTitle>No API keys yet</EmptyTitle>
        <EmptyDescription>Create a key to connect an app or an integration.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button size="sm">
          <PlusIcon />
          Create API key
        </Button>
      </EmptyContent>
    </Empty>
  ),
}

export const TitleOnly: Story = {
  name: 'Title only',
  render: (args) => (
    <Empty {...args}>
      <EmptyHeader>
        <EmptyTitle>No results for these filters</EmptyTitle>
      </EmptyHeader>
    </Empty>
  ),
}

export const ErrorState: Story = {
  name: 'Error',
  render: (args) => (
    <Empty {...args}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <TriangleAlertIcon />
        </EmptyMedia>
        <EmptyTitle>The report could not be loaded</EmptyTitle>
        <EmptyDescription>The server took too long to answer.</EmptyDescription>
      </EmptyHeader>
    </Empty>
  ),
}

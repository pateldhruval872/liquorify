import type { Meta, StoryObj } from '@storybook/react-vite'
import { screen, userEvent } from 'storybook/test'
import { StorefrontConnectTask } from '../../../../../dashboard/src/components/spree/setup-tasks/storefront-connect-task'
import { withStore } from '../../../decorators/store'
import { setUpStore } from '../../../fixtures/admin/settings'
import { shellStore } from '../../../fixtures/admin/shell'
import { storefrontRequests } from '../../../mocks/handlers/admin/settings'
import { gettingStarted, TaskFrame, taskParameters } from './task-frame'

const task = { name: 'setup_storefront', done: false }

const meta = {
  title: 'Admin dashboard/Getting started/Storefront connect task',
  component: StorefrontConnectTask,
  tags: ['CMP-DA-G-19'],
  args: { task, store: shellStore, storeId: shellStore.id },
  decorators: [
    (Story, { args }) => (
      <TaskFrame task={args.task}>
        <Story />
      </TaskFrame>
    ),
    withStore,
  ],
  parameters: taskParameters({ storefront: storefrontRequests() }),
} satisfies Meta<typeof StorefrontConnectTask>

export default meta
type Story = StoryObj<typeof meta>

export const NotDone: Story = { name: 'Not done' }

export const Done: Story = {
  args: { task: { ...task, done: true }, store: setUpStore },
}

export const SheetOpened: Story = {
  name: 'Sheet opened',
  parameters: { liquorify: { capture: 'viewport' } },
  play: async () => {
    await userEvent.click(screen.getByRole('button', { name: 'Connect storefront' }))
    await screen.findByRole('heading', { name: 'Connect your storefront' })
  },
}

// Vercel sends the merchant back with the new deployment's address, and the
// sheet opens with it filled in.
export const BackFromDeploy: Story = {
  name: 'Back from deploying',
  parameters: {
    liquorify: {
      capture: 'viewport',
      route: {
        ...gettingStarted,
        path: `${gettingStarted.path}?deployment-url=sample-storefront.vercel.app`,
      },
    },
  },
  play: async () => {
    await screen.findByDisplayValue('https://sample-storefront.vercel.app')
  },
}

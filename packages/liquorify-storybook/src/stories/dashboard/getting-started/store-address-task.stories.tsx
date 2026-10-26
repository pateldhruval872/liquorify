import type { Meta, StoryObj } from '@storybook/react-vite'
import { screen, userEvent } from 'storybook/test'
import { StoreAddressTask } from '../../../../../dashboard/src/components/spree/setup-tasks/store-address-task'
import { withStore } from '../../../decorators/store'
import { addressedLocation, shopLocation } from '../../../fixtures/admin/settings'
import { shellStore } from '../../../fixtures/admin/shell'
import { countries } from '../../../mocks/handlers/admin/countries'
import {
  stockLocationList,
  stockLocationsFailed,
  stockLocationsHeld,
} from '../../../mocks/handlers/admin/settings'
import { TaskFrame, taskParameters } from './task-frame'

const task = { name: 'setup_address', done: false }

const meta = {
  title: 'Admin dashboard/Getting started/Store address task',
  component: StoreAddressTask,
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
  // The browser tests' store: one location of its own, taking returns, with no address.
  parameters: taskParameters({ locations: stockLocationList([shopLocation]), countries }),
} satisfies Meta<typeof StoreAddressTask>

export default meta
type Story = StoryObj<typeof meta>

const saveAddress = () => screen.findByRole('button', { name: 'Save address' })

export const NoAddressYet: Story = {
  name: 'No address yet',
  play: async () => {
    await saveAddress()
  },
}

export const AddressGiven: Story = {
  name: 'Address given',
  args: { task: { ...task, done: true } },
  parameters: taskParameters({ locations: stockLocationList([addressedLocation]), countries }),
  play: async () => {
    await screen.findByText('410 Market Street')
  },
}

export const Loading: Story = { parameters: taskParameters({ locations: stockLocationsHeld }) }

// No location of the store's own to hold the address.
export const NoLocation: Story = {
  name: 'No location',
  parameters: taskParameters({ locations: stockLocationList([]) }),
  play: async () => {
    await screen.findByText(/You have no stock location of your own yet/)
  },
}

// A failed lookup says so, rather than reading as having no location.
export const Failed: Story = {
  parameters: taskParameters({ locations: stockLocationsFailed }),
  play: async () => {
    await screen.findByText('Failed to load', undefined, { timeout: 15_000 })
  },
}

export const DialogOpen: Story = {
  name: 'Dialog open',
  parameters: { liquorify: { capture: 'viewport' } },
  play: async () => {
    await userEvent.click(await saveAddress())
    await screen.findByRole('heading', { name: 'Add your shipping address' })
  },
}

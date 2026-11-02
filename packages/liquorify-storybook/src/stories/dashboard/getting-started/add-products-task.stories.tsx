import type { Meta, StoryObj } from '@storybook/react-vite'
import { AddProductsTask } from '../../../../../dashboard/src/components/spree/setup-tasks/add-products-task'
import { withStore } from '../../../decorators/store'
import { shellStore } from '../../../fixtures/admin/shell'
import { TaskFrame, taskParameters } from './task-frame'

const task = { name: 'add_products', done: false }

const meta = {
  title: 'Admin dashboard/Getting started/Add products task',
  component: AddProductsTask,
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
  parameters: taskParameters(),
} satisfies Meta<typeof AddProductsTask>

export default meta
type Story = StoryObj<typeof meta>

// Adding products by hand leads to the products page; the import opens here.
export const NotDone: Story = { name: 'Not done' }

export const Done: Story = { args: { task: { ...task, done: true } } }

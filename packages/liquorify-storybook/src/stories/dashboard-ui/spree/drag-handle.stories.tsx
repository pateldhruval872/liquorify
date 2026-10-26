import { DragHandle } from '@spree/dashboard-ui/spree/drag-handle'
import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ComponentProps } from 'react'
import { userEvent } from 'storybook/test'

const rules = ['Preferred location', 'Minimize splits', 'Default location']

// What `useSortable` hands the handle while nothing is being dragged. The
// story passes the same attributes without the drag library, which lives in
// the panel's own dependencies; dragging itself is shown by the order routing
// rules section, which sorts its rows with these handles.
const attributes: ComponentProps<typeof DragHandle>['attributes'] = {
  role: 'button',
  tabIndex: 0,
  'aria-disabled': false,
  'aria-pressed': undefined,
  'aria-roledescription': 'sortable',
  'aria-describedby': 'DndDescribedBy-0',
}

/** A channel's order routing rules (DA-SET-08), each row dragged by its handle. */
function RuleRows() {
  return (
    <ul className="flex w-96 flex-col gap-1">
      {rules.map((rule) => (
        <li key={rule} className="flex items-center gap-2 rounded-md border bg-card p-2">
          <span className="w-6 touch-none">
            <DragHandle attributes={attributes} listeners={undefined} />
          </span>
          <span className="text-sm">{rule}</span>
        </li>
      ))}
    </ul>
  )
}

const meta = {
  title: 'Dashboard UI/Composed/Drag handle',
  component: RuleRows,
  tags: ['CMP-DUI-C-17'],
} satisfies Meta<typeof RuleRows>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const FocusVisible: Story = {
  name: 'Focus visible',
  play: async () => {
    await userEvent.tab()
  },
}

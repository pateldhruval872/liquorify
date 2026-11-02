import { PageHeader } from '@spree/dashboard-core'
import { PlusIcon } from '@spree/dashboard-ui/icons'
import { Badge } from '@spree/dashboard-ui/ui/badge'
import { Button } from '@spree/dashboard-ui/ui/button'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { screen, userEvent } from 'storybook/test'
import { type Column, columnWidths } from '../../decorators/providers'
import type { StoryRoute } from '../../decorators/router'

const productRoute: StoryRoute = {
  pattern: '/$storeId/products/$productId',
  path: '/store_9Fh2Lq4c/products/prod_6Jt3Rb8w',
}

const meta = {
  title: 'Dashboard core/Page header',
  component: PageHeader,
  tags: ['CMP-CORE-20'],
  // The staff page's header (DA-SET-24).
  args: {
    title: 'Staff',
    description: 'Manage admin teammates and roles',
    docsPath: 'settings/users',
    actions: (
      <Button>
        <PlusIcon className="size-4" />
        Invite teammate
      </Button>
    ),
  },
  parameters: { liquorify: { signedIn: true }, pageColumn: 'settings' },
  // The header undoes the page's padding to run edge to edge, across the
  // column and its padding, so it sits in a column of the screen's width with
  // the same padding around it.
  decorators: [
    (Story, context) => {
      const column: Column = context.parameters.pageColumn
      return (
        <div className="flex flex-col gap-4 p-6" style={{ width: columnWidths[column] + 48 }}>
          <Story />
        </div>
      )
    },
  ],
} satisfies Meta<typeof PageHeader>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

// The roles page as a staffer who may read roles but not create them sees it:
// no action at all (DA-SET-25).
export const WithoutActions: Story = {
  name: 'Without actions',
  args: {
    title: 'Roles',
    description: 'Define what each staff role can see and do',
    docsPath: 'settings/users',
    actions: undefined,
  },
}

// A record's page: the way back, its status and when it last changed, Save,
// and the more-actions menu.
export const DetailPage: Story = {
  name: 'Detail page',
  args: {
    title: 'Spree Tote',
    description: undefined,
    docsPath: undefined,
    backTo: 'products',
    badges: <Badge variant="success">Active</Badge>,
    subtitle: 'Updated 3 days ago',
    actions: <Button>Save</Button>,
    resource: { id: 'prod_6Jt3Rb8w' },
    onDelete: () => {},
    deleteLabel: 'Delete product',
  },
  parameters: { liquorify: { route: productRoute }, pageColumn: 'page' },
}

export const MoreActionsOpen: Story = {
  ...DetailPage,
  name: 'More actions open',
  parameters: { liquorify: { route: productRoute, capture: 'viewport' }, pageColumn: 'page' },
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: /more actions/i }))
    await screen.findByRole('menu')
  },
}

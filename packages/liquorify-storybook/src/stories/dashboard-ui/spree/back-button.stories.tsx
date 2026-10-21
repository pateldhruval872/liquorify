import { BackButton } from '@spree/dashboard-ui/spree/back-button'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { userEvent } from 'storybook/test'
import type { StoryRoute } from '../../../decorators/router'

const adminProductRoute: StoryRoute = {
  pattern: '/$storeId/products/$productId',
  path: '/store_9Fh2Lq4c/products/prod_6Jt3Rb8w',
}

const meta = {
  title: 'Dashboard UI/Composed/Back button',
  component: BackButton,
  tags: ['CMP-DUI-C-03'],
  args: { fallback: 'products' },
  parameters: { liquorify: { route: adminProductRoute } },
} satisfies Meta<typeof BackButton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const SellerPanel: Story = {
  name: 'Seller panel',
  parameters: {
    liquorify: {
      panel: 'seller',
      route: {
        pattern: '/$sellerId/products/$productId',
        path: '/seller_2Wd7Np3c/products/prod_6Jt3Rb8w',
      },
    },
  },
}

export const FocusVisible: Story = {
  name: 'Focus visible',
  play: async () => {
    await userEvent.tab()
  },
}

import { ChevronRightIcon, PackageIcon } from '@spree/dashboard-ui/icons'
import { Badge } from '@spree/dashboard-ui/ui/badge'
import { Button } from '@spree/dashboard-ui/ui/button'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemGroup,
  ItemHeader,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from '@spree/dashboard-ui/ui/item'
import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ComponentProps } from 'react'

function Product(props: ComponentProps<typeof Item>) {
  return (
    <Item {...props}>
      <ItemMedia variant="image">
        <img src="/fixtures/product-sand.png" alt="" />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>Linen shirt</ItemTitle>
        <ItemDescription>Sand · Medium · LIN-SHIRT-SND-M</ItemDescription>
      </ItemContent>
      <ItemActions>
        <Button size="sm" variant="outline">
          View
        </Button>
      </ItemActions>
    </Item>
  )
}

const meta = {
  title: 'Dashboard UI/Primitives/Item',
  component: Product,
  tags: ['CMP-DUI-P-26'],
  decorators: [(Story) => <div className="w-[28rem]">{Story()}</div>],
} satisfies Meta<typeof Product>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Outline: Story = { args: { variant: 'outline' } }

export const Muted: Story = { args: { variant: 'muted' } }

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      {(['default', 'sm', 'xs'] as const).map((size) => (
        <Product key={size} variant="outline" size={size} />
      ))}
    </div>
  ),
}

export const IconMedia: Story = {
  name: 'Icon media',
  render: () => (
    <Item variant="outline">
      <ItemMedia variant="icon">
        <PackageIcon />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>Shipment ready to pick</ItemTitle>
      </ItemContent>
      <ItemActions>
        <ChevronRightIcon className="size-4" />
      </ItemActions>
    </Item>
  ),
}

export const Linked: Story = {
  render: () => (
    <Item variant="outline" render={<a href="#order" />}>
      <ItemContent>
        <ItemTitle>Order R123456789</ItemTitle>
        <ItemDescription>Placed on 1 October 2026</ItemDescription>
      </ItemContent>
      <ItemActions>
        <ChevronRightIcon className="size-4" />
      </ItemActions>
    </Item>
  ),
}

export const HeaderAndFooter: Story = {
  name: 'Header and footer',
  render: () => (
    <Item variant="outline">
      <ItemHeader>
        <span className="text-xs text-muted-foreground">Return RA-2041</span>
        <Badge variant="warning">Requested</Badge>
      </ItemHeader>
      <ItemContent>
        <ItemTitle>Linen shirt</ItemTitle>
        <ItemDescription>Too large</ItemDescription>
      </ItemContent>
      <ItemFooter>
        <span className="text-xs text-muted-foreground">1 item</span>
        <span className="text-sm font-medium">$49.00</span>
      </ItemFooter>
    </Item>
  ),
}

export const Group: Story = {
  render: () => (
    <ItemGroup>
      <Product />
      <ItemSeparator />
      <Product />
    </ItemGroup>
  ),
}

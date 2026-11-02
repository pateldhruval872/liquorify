import { CopyIcon, KeyRoundIcon, PercentIcon } from '@spree/dashboard-ui/icons'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from '@spree/dashboard-ui/ui/input-group'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { userEvent } from 'storybook/test'

const meta = {
  title: 'Dashboard UI/Primitives/Input group',
  component: InputGroup,
  tags: ['CMP-DUI-P-24'],
  decorators: [(Story) => <div className="w-80">{Story()}</div>],
} satisfies Meta<typeof InputGroup>

export default meta
type Story = StoryObj<typeof meta>

// Money and percentage fields carry their sign in an addon, as the dashboard requires.
export const CurrencyPrefix: Story = {
  name: 'Currency prefix',
  render: () => (
    <InputGroup>
      <InputGroupAddon>
        <InputGroupText>$</InputGroupText>
      </InputGroupAddon>
      <InputGroupInput type="number" defaultValue="49.00" aria-label="Price" />
      <InputGroupAddon align="inline-end">
        <InputGroupText>USD</InputGroupText>
      </InputGroupAddon>
    </InputGroup>
  ),
}

export const PercentSuffix: Story = {
  name: 'Percent suffix',
  render: () => (
    <InputGroup>
      <InputGroupInput type="number" defaultValue="15" aria-label="Discount" />
      <InputGroupAddon align="inline-end">
        <PercentIcon />
      </InputGroupAddon>
    </InputGroup>
  ),
}

export const IconAndButton: Story = {
  name: 'Icon and button',
  render: () => (
    <InputGroup>
      <InputGroupAddon>
        <KeyRoundIcon />
      </InputGroupAddon>
      <InputGroupInput defaultValue="pk_7f3a91c2" readOnly aria-label="Publishable key" />
      <InputGroupAddon align="inline-end">
        <InputGroupButton size="icon-xs" aria-label="Copy">
          <CopyIcon />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  ),
}

export const BlockAddons: Story = {
  name: 'Block addons',
  render: () => (
    <InputGroup>
      <InputGroupAddon align="block-start" className="border-b">
        <InputGroupText>Internal note</InputGroupText>
      </InputGroupAddon>
      <InputGroupTextarea defaultValue="Customer asked for gift wrapping." aria-label="Note" />
      <InputGroupAddon align="block-end">
        <InputGroupText className="ml-auto">32 / 500</InputGroupText>
      </InputGroupAddon>
    </InputGroup>
  ),
}

export const Disabled: Story = {
  render: () => (
    <InputGroup data-disabled="true">
      <InputGroupAddon>
        <InputGroupText>$</InputGroupText>
      </InputGroupAddon>
      <InputGroupInput type="number" defaultValue="49.00" disabled aria-label="Price" />
    </InputGroup>
  ),
}

export const Invalid: Story = {
  render: () => (
    <InputGroup>
      <InputGroupAddon>
        <InputGroupText>$</InputGroupText>
      </InputGroupAddon>
      <InputGroupInput type="number" defaultValue="-5" aria-invalid aria-label="Price" />
    </InputGroup>
  ),
}

export const FocusVisible: Story = {
  name: 'Focus visible',
  render: () => (
    <InputGroup>
      <InputGroupInput type="number" defaultValue="15" aria-label="Discount" />
      <InputGroupAddon align="inline-end">
        <PercentIcon />
      </InputGroupAddon>
    </InputGroup>
  ),
  play: async () => {
    await userEvent.tab()
  },
}

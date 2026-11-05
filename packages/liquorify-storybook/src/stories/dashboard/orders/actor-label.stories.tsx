import type { Meta, StoryObj } from '@storybook/react-vite'
import { ActorLabel } from '../../../../../dashboard/src/components/spree/actor-label'
import { connectorActor, staffActor, unnamedActor } from '../../../fixtures/admin/orders'

/**
 * Who did something to an order, as its summary names them (DA-ORD-04): a
 * member of staff by name, or an integration's API key marked with a key.
 */
const meta = {
  title: 'Admin dashboard/Orders/Actor label',
  component: ActorLabel,
  tags: ['CMP-DA-G-24'],
  args: { actor: staffActor },
} satisfies Meta<typeof ActorLabel>

export default meta
type Story = StoryObj<typeof meta>

export const Staff: Story = {}

export const ApiKey: Story = { name: 'API key', args: { actor: connectorActor } }

export const Unnamed: Story = { args: { actor: unnamedActor } }

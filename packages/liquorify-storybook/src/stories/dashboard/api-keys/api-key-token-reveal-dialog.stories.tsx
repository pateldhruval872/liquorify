import type { Meta, StoryObj } from '@storybook/react-vite'
import { TokenRevealDialog } from '../../../../../dashboard/src/components/spree/api-keys/api-key-token-reveal-dialog'
import { secretKeys } from '../../../fixtures/admin/api-keys'

const nothing = () => {}

// Shown once, straight after a secret key is created (DA-SET-26). The token is
// invented and is not a credential.
const created = {
  ...secretKeys[0],
  id: 'key_sk0Zz9Yy8X',
  name: 'Fulfilment partner',
  plaintext_token: 'sk_sample_not_a_real_key_00000000',
  last_used_at: null,
}

const meta = {
  title: 'Admin dashboard/API keys/Token reveal dialog',
  component: TokenRevealDialog,
  tags: ['CMP-DA-G-01'],
  args: { apiKey: created, onOpenChange: nothing },
  // The dialog renders outside the story's root.
  parameters: { liquorify: { capture: 'viewport' } },
} satisfies Meta<typeof TokenRevealDialog>

export default meta
type Story = StoryObj<typeof meta>

export const NewSecretKey: Story = { name: 'New secret key' }

// The copied mark lasts only a moment, so it is not captured.

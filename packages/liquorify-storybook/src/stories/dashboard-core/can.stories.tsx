import { Can, PageHeader, Subject } from '@spree/dashboard-core'
import { PencilIcon, PlayIcon } from '@spree/dashboard-ui/icons'
import { Button } from '@spree/dashboard-ui/ui/button'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { readOnly } from '../../fixtures/admin/session'
import { orderSyncEndpoint } from '../../fixtures/admin/webhooks'
import { adminSession } from '../../mocks/handlers/admin/session'

// A webhook endpoint's page header (DA-SET-29), whose test and edit buttons
// are drawn only for someone who may update endpoints. `Can` draws nothing of
// its own; what it changes is whether its children appear.
function EndpointHeader() {
  return (
    <PageHeader
      title={orderSyncEndpoint.name ?? orderSyncEndpoint.url}
      sticky={false}
      actions={
        <Can I="update" a={Subject.WebhookEndpoint}>
          <Button variant="outline">
            <PlayIcon className="size-4" />
            Send test
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Edit">
            <PencilIcon className="size-4" />
          </Button>
        </Can>
      }
    />
  )
}

const meta = {
  title: 'Dashboard core/Can',
  component: EndpointHeader,
  tags: ['CMP-CORE-05'],
  parameters: {
    liquorify: { signedIn: true, column: 'settings' },
    msw: { handlers: { session: adminSession() } },
  },
} satisfies Meta<typeof EndpointHeader>

export default meta
type Story = StoryObj<typeof meta>

export const Allowed: Story = {}

// A role that may read every setting and change none.
export const Refused: Story = {
  parameters: { msw: { handlers: { session: adminSession(readOnly) } } },
}

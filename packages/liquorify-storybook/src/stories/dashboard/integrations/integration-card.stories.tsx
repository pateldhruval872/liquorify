import { Badge } from '@spree/dashboard-ui/ui/badge'
import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ComponentProps } from 'react'
import { useTranslation } from 'react-i18next'
import { screen, userEvent } from 'storybook/test'
import { IntegrationCard } from '../../../../../dashboard/src/components/spree/integrations/integration-card'
import { relayType } from '../../../fixtures/admin/integrations'

type Props = Partial<ComponentProps<typeof IntegrationCard>> & {
  /** What the switch's save does: settle at once, or never. */
  save?: 'kept' | 'pending'
  payment?: boolean
  readOnly?: boolean
}

// Built as the integrations page (DA-SET-10) builds its cards, with its
// wording, at the width of one card in its three-column gallery.
function Card({ save = 'kept', payment = false, readOnly = false, ...props }: Props) {
  const { t } = useTranslation()
  const status = props.status ?? 'not_connected'
  const labels = {
    active: t('admin.integrations.status.active'),
    inactive: payment
      ? t('admin.payment_methods.status.disabled')
      : t('admin.integrations.status.connected_inactive'),
    not_connected: t('admin.integrations.status.not_connected'),
  }
  const group = (name: string) => (
    <Badge variant="secondary" className="uppercase tracking-wide">
      {name}
    </Badge>
  )
  return (
    <div className="w-[289px]">
      <IntegrationCard
        name={relayType.name}
        docsUrl={relayType.docs_url}
        description={relayType.description ?? undefined}
        status={status}
        statusLabels={labels}
        tags={group(t('admin.integrations.groups.shipping'))}
        toggle={{
          checked: status === 'active',
          disabled: readOnly,
          label: t('admin.integrations.toggle_label', { name: props.name ?? relayType.name }),
          onCheckedChange: (checked) =>
            save === 'kept' ? Promise.resolve(checked) : new Promise(() => {}),
        }}
        actionLabel={
          status !== 'not_connected'
            ? t('admin.integrations.configure_cta')
            : readOnly
              ? t('admin.integrations.view_cta')
              : t('admin.integrations.connect_cta')
        }
        onAction={() => {}}
        {...props}
      />
    </div>
  )
}

const meta = {
  title: 'Admin dashboard/Integrations/Integration card',
  component: Card,
  tags: ['CMP-DA-G-10'],
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

export const NotConnected: Story = { name: 'Not connected' }

export const ConnectedInactive: Story = {
  name: 'Connected, inactive',
  args: { status: 'inactive' },
}

export const Active: Story = { args: { status: 'active' } }

// A role that may read integrations but not change them sees the switch
// disabled and a View button.
export const ReadOnly: Story = { name: 'Read only', args: { readOnly: true } }

// The switch moves at once and the card follows it while the save is open.
// When a save fails the switch moves back, which looks as it did at the start.
export const Saving: Story = {
  args: { status: 'inactive', save: 'pending' },
  play: async () => {
    await userEvent.click(screen.getByRole('switch'))
  },
}

// A payment method set up with a third-party provider, in test mode and kept
// off the storefront, as the gallery's Payments section shows one.
export const PaymentMethodInTestMode: Story = {
  name: 'Payment method in test mode',
  args: { payment: true, status: 'active', name: 'Card payments', description: undefined },
  render: (args) => <PaymentCard {...args} />,
}

function PaymentCard(args: Props) {
  const { t } = useTranslation()
  return (
    <Card
      {...args}
      docsUrl={null}
      tags={
        <>
          <Badge variant="secondary" className="uppercase tracking-wide">
            {t('admin.integrations.groups.payments')}
          </Badge>
          <Badge variant="outline">Bogus</Badge>
          <Badge variant="warning">{t('admin.integrations.test_mode')}</Badge>
          <Badge variant="outline">{t('admin.payment_methods.storefront.admin_only')}</Badge>
        </>
      }
    />
  )
}

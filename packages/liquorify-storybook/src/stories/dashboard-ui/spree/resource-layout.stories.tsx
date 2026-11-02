import { PageHeader } from '@spree/dashboard-core'
import { ResourceLayout } from '@spree/dashboard-ui/spree/resource-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@spree/dashboard-ui/ui/card'
import type { Meta, StoryObj } from '@storybook/react-vite'

function Panel({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4">
            <span className="text-muted-foreground">{label}</span>
            <span>{value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

// Laid out as a webhook endpoint's page (DA-SET-29): its health and
// deliveries in the main column, its details beside them.
const meta = {
  title: 'Dashboard UI/Composed/Resource layout',
  component: ResourceLayout,
  tags: ['CMP-DUI-C-40'],
  args: {
    header: (
      <PageHeader
        title="Order sync"
        description="https://hooks.example.com/spree/orders"
        sticky={false}
      />
    ),
    main: (
      <>
        <Panel
          title="Health"
          rows={[
            ['Deliveries in the last 24 hours', '42'],
            ['Failed', '1'],
          ]}
        />
        <Panel title="Deliveries" rows={[['order.completed', '200']]} />
      </>
    ),
    sidebar: (
      <Panel
        title="Details"
        rows={[
          ['Status', 'Active'],
          ['Events', '3 events'],
        ]}
      />
    ),
  },
  parameters: { liquorify: { signedIn: true, column: 'settings' } },
} satisfies Meta<typeof ResourceLayout>

export default meta
type Story = StoryObj<typeof meta>

export const TwoColumns: Story = { name: 'Two columns' }

// Without a sidebar the main column takes the full width.
export const MainOnly: Story = { name: 'Main only', args: { sidebar: undefined } }

import type { Meta, StoryObj } from '@storybook/react-vite'
import { screen } from 'storybook/test'
import { TaxCategoryLabel } from '../../../../../dashboard/src/components/spree/tax-category-label'
import { taxCategories } from '../../../fixtures/admin/catalog'
import { adminUser } from '../../../fixtures/admin/session'
import { readHeld } from '../../../mocks/handlers/admin/records'
import { adminSession } from '../../../mocks/handlers/admin/session'
import { taxCategoryRequests } from '../../../mocks/handlers/admin/taxes'

/** The rates table's category cell (DA-SET-14), in the table's text. */
function CategoryCell({ id }: { id?: string | null }) {
  return (
    <span className="text-sm">
      <TaxCategoryLabel id={id} />
    </span>
  )
}

function parameters(categories = taxCategoryRequests()) {
  return {
    liquorify: { signedIn: true, storeId: adminUser.stores[0].id },
    msw: { handlers: { session: adminSession(), taxCategories: categories } },
  }
}

// A tax rate's category, named from the store's categories, on the tax rates
// tab (DA-SET-14) and the product page's tax card.
const meta = {
  title: 'Admin dashboard/Taxes/Tax category label',
  component: CategoryCell,
  tags: ['CMP-DA-G-24'],
  args: { id: taxCategories[1].id },
  parameters: parameters(),
} satisfies Meta<typeof CategoryCell>

export default meta
type Story = StoryObj<typeof meta>

export const Named: Story = {
  play: async () => {
    await screen.findByText('Clothing')
  },
}

export const NoCategory: Story = { name: 'No category', args: { id: null } }

// Until the categories arrive, and for one the list does not hold, the id shows.
export const Loading: Story = { parameters: parameters(readHeld('tax_categories')) }

export const NotListed: Story = { name: 'Not listed', args: { id: 'taxcat_9Zz9Zz9Z' } }

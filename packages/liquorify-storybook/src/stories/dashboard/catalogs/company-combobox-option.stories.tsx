import type { Meta, StoryObj } from '@storybook/react-vite'
import { screen } from 'storybook/test'
import { CompanyComboboxOption } from '../../../../../dashboard/src/components/spree/company-combobox-option'
import { companies } from '../../../fixtures/admin/merchandising'

const [harbor, westCoast] = companies

/**
 * A company as a catalog's audience picker lists it (DA-PRD-13, DA-PRD-14):
 * its name, and for a division the companies above it.
 */
const meta = {
  title: 'Admin dashboard/Catalogs/Company combobox option',
  component: CompanyComboboxOption,
  tags: ['CMP-DA-G-24'],
  args: { company: harbor },
  parameters: { liquorify: { column: 'inSidebarCard' } },
} satisfies Meta<typeof CompanyComboboxOption>

export default meta
type Story = StoryObj<typeof meta>

export const Company: Story = {
  play: async () => {
    await screen.findByText('Harbor Hospitality')
  },
}

export const Division: Story = {
  args: { company: westCoast },
  play: async () => {
    await screen.findByText('Harbor Hospitality')
  },
}

export const DeepDivision: Story = {
  name: 'Division of a division',
  args: {
    company: {
      ...westCoast,
      id: 'co_7Sf2Bp5G',
      name: 'San Francisco',
      ancestors: [
        ...westCoast.ancestors,
        { id: westCoast.id, name: westCoast.name, kind: westCoast.kind },
      ],
    },
  },
  play: async () => {
    await screen.findByText('Harbor Hospitality / West Coast')
  },
}

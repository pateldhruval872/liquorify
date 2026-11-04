import { SectionHeading } from '@spree/dashboard-core'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, screen } from 'storybook/test'

/** A list's title, what it is for, and where to read more, as the translations page (DA-PRD-06) opens. */
const meta = {
  title: 'Dashboard core/Section heading',
  component: SectionHeading,
  tags: ['CMP-CORE-28'],
  args: {
    title: 'Translations',
    description: 'See how much of your catalog is translated, and fill the gaps.',
  },
  parameters: { liquorify: { column: 'page' } },
} satisfies Meta<typeof SectionHeading>

export default meta
type Story = StoryObj<typeof meta>

export const WithDescription: Story = {
  name: 'With description',
  play: async () => {
    await screen.findByText(/how much of your catalog is translated/)
  },
}

export const TitleOnly: Story = {
  name: 'Title only',
  args: { description: undefined },
}

// A heading for a feature merchants meet for the first time links to the guide.
export const WithGuideLink: Story = {
  name: 'With guide link',
  args: {
    title: 'Catalogs',
    description: 'Decide which products each audience sees, and what they pay.',
    docsPath: 'products/catalogs',
  },
  play: async () => {
    await screen.findByRole('link', { name: /Learn more/ })
  },
}

// A list page has no other heading, so this one is the page's.
export const PageHeading: Story = {
  name: 'Page heading',
  args: { as: 'h1' },
  play: async () => {
    await expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('Translations')
  },
}

export const LongTitle: Story = {
  name: 'Long title',
  args: {
    title: 'Translations for every product, category, collection and option type in the store',
  },
}

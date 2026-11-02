import { CountryFlag } from '@spree/dashboard-ui/spree/country-flag'
import type { Meta, StoryObj } from '@storybook/react-vite'

const countryNames: Record<string, string> = {
  CH: 'Switzerland',
  PL: 'Poland',
  US: 'United States',
}

const meta = {
  title: 'Dashboard UI/Composed/Country flag',
  component: CountryFlag,
  tags: ['CMP-DUI-C-12'],
  // Beside a country's name in the first-run setup form (DA-SETUP-01), which
  // suggests the United States in the browser tests, and in the country
  // pickers. The flag is decorative; the name beside it is read out.
  args: { iso: 'US' },
  decorators: [
    (Story, { args }) => (
      <span className="flex items-center gap-2 text-base">
        <Story />
        {countryNames[args.iso.toUpperCase()]}
      </span>
    ),
  ],
} satisfies Meta<typeof CountryFlag>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

// The code is case-insensitive; Switzerland's square flag keeps the same box.
export const Square: Story = { args: { iso: 'ch' } }

// A size the caller sets, as a larger list might. The flag sprite's own width
// outranks the size classes, so only the height changes; no Spree screen sets one.
export const Larger: Story = { args: { iso: 'PL', className: 'h-6 w-8' } }

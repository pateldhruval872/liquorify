import {
  Combobox,
  ComboboxButtonTrigger,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxSearch,
  ComboboxTriggerPlaceholder,
  ComboboxValue,
  useComboboxAnchor,
} from '@spree/dashboard-ui/ui/combobox'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { screen, userEvent } from 'storybook/test'

// The store's stock locations, as a channel or delivery profile picks them.
const locations = ['Shop location', 'East coast depot', 'Downtown counter', 'Returns centre']

interface PickerProps {
  value?: string | null
  invalid?: boolean
  disabled?: boolean
}

/**
 * The button-shaped picker the dashboard's country, state, currency and
 * language fields are built from: the field shows the choice, and the search
 * box sits at the top of the list.
 */
function LocationPicker({ value = null, invalid, disabled }: PickerProps) {
  return (
    <div className="w-72">
      <Combobox items={locations} defaultValue={value} disabled={disabled}>
        <ComboboxButtonTrigger aria-label="Location" aria-invalid={invalid || undefined}>
          <ComboboxValue>
            {(selected: string | null) =>
              selected ? (
                <span className="truncate">{selected}</span>
              ) : (
                <ComboboxTriggerPlaceholder>Choose a location</ComboboxTriggerPlaceholder>
              )
            }
          </ComboboxValue>
        </ComboboxButtonTrigger>
        <ComboboxContent>
          <ComboboxSearch placeholder="Search locations…" />
          <ComboboxEmpty>No locations found</ComboboxEmpty>
          <ComboboxList>
            {(location: string) => (
              <ComboboxItem key={location} value={location}>
                {location}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  )
}

const meta = {
  title: 'Dashboard UI/Primitives/Combobox',
  component: LocationPicker,
  tags: ['CMP-DUI-P-14'],
} satisfies Meta<typeof LocationPicker>

export default meta
type Story = StoryObj<typeof meta>

const opened = {
  parameters: { liquorify: { capture: 'viewport' } },
  play: async () => {
    await userEvent.click(screen.getByRole('combobox', { name: 'Location' }))
    await screen.findByRole('option', { name: 'Downtown counter' })
  },
} satisfies Story

export const Placeholder: Story = {}

export const Selected: Story = { args: { value: 'East coast depot' } }

export const Invalid: Story = { args: { invalid: true } }

export const Disabled: Story = { args: { value: 'East coast depot', disabled: true } }

export const Open: Story = { ...opened, args: { value: 'East coast depot' } }

export const Filtered: Story = {
  ...opened,
  play: async () => {
    await opened.play()
    await userEvent.type(screen.getByPlaceholderText('Search locations…'), 'coast')
    await screen.findByRole('option', { name: 'East coast depot' })
  },
}

export const NothingFound: Story = {
  ...opened,
  name: 'Nothing found',
  play: async () => {
    await opened.play()
    await userEvent.type(screen.getByPlaceholderText('Search locations…'), 'Lisbon')
    await screen.findByText('No locations found')
  },
}

/** The editable-input form, with a clear button once something is chosen, as the record pickers use it. */
function InputPicker({ value = null }: PickerProps) {
  return (
    <div className="w-72">
      <Combobox items={locations} defaultValue={value}>
        <ComboboxInput aria-label="Location" placeholder="Search locations…" showClear />
        <ComboboxContent>
          <ComboboxEmpty>No locations found</ComboboxEmpty>
          <ComboboxList>
            {(location: string) => (
              <ComboboxItem key={location} value={location}>
                {location}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  )
}

export const SearchField: Story = {
  name: 'Search field',
  render: (args) => <InputPicker {...args} />,
  args: { value: 'Shop location' },
}

/** The multi-select form, each choice a removable chip, as market languages use it. */
function ChipsPicker({ value = null }: PickerProps) {
  const anchor = useComboboxAnchor()
  return (
    <div className="w-80">
      <Combobox multiple items={locations} defaultValue={value ? [value, locations[2]] : []}>
        <ComboboxChips ref={anchor}>
          <ComboboxValue>
            {(selected: string[]) =>
              selected.map((location) => <ComboboxChip key={location}>{location}</ComboboxChip>)
            }
          </ComboboxValue>
          <ComboboxChipsInput aria-label="Locations" placeholder="Add a location…" />
        </ComboboxChips>
        <ComboboxContent anchor={anchor}>
          <ComboboxEmpty>No locations found</ComboboxEmpty>
          <ComboboxList>
            {(location: string) => (
              <ComboboxItem key={location} value={location}>
                {location}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  )
}

export const Chips: Story = {
  render: (args) => <ChipsPicker {...args} />,
  args: { value: 'Shop location' },
}

export const ChipsOpen: Story = {
  name: 'Chips open',
  render: (args) => <ChipsPicker {...args} />,
  args: { value: 'Shop location' },
  parameters: { liquorify: { capture: 'viewport' } },
  play: async () => {
    await userEvent.click(screen.getByRole('combobox', { name: 'Locations' }))
    await screen.findByRole('option', { name: 'Returns centre' })
  },
}

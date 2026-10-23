import type { Meta, StoryObj } from '@storybook/react-vite'
import { screen, userEvent } from 'storybook/test'
import { twoStoreAdmin } from '../../../fixtures/admin/shell'
import { profileRefused } from '../../../mocks/handlers/admin/shell'
import { ShellPage, shellParameters, withStoreLayout } from './store-layout'

const meta = {
  title: 'Admin dashboard/Shell/Profile dialog',
  tags: ['CMP-DA-G-24'],
  // The signed-in teammate's own details, opened from the account menu
  // (DA-OVL-04).
  render: () => <ShellPage />,
  decorators: [withStoreLayout],
  parameters: shellParameters(),
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

async function openProfile(menuName = 'User menu') {
  await userEvent.click(await screen.findByRole('button', { name: menuName }))
  await userEvent.click(await screen.findByRole('menuitem', { name: 'Edit Profile' }))
  return screen.findByLabelText('First name')
}

export const Default: Story = {
  play: async () => {
    await openProfile()
  },
}

export const WithAPhoto: Story = {
  name: 'With a photo',
  parameters: shellParameters({
    user: { ...twoStoreAdmin, avatar_url: '/fixtures/avatar.png' },
  }),
  play: async () => {
    await openProfile()
  },
}

// The browser tests' server accepted every change tried, so this refusal is
// the Admin API's shape for a field error, answering the save.
export const FieldErrors: Story = {
  name: 'Field errors',
  parameters: { msw: { handlers: { profile: profileRefused } } },
  play: async () => {
    const firstName = await openProfile()
    await userEvent.type(firstName, 'ine')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    // The form puts the error above the fields as well as under the field.
    await screen.findByText('is too long (maximum is 100 characters)')
  },
}

export const OnAPhone: Story = {
  name: 'On a phone',
  tags: ['phone'],
  play: async () => {
    await openProfile()
  },
}

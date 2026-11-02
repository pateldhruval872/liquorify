import type { ResourceTranslations } from '@spree/admin-sdk'
import type { Meta, StoryObj } from '@storybook/react-vite'
import type { HttpHandler } from 'msw'
import { useState } from 'react'
import { expect, screen, userEvent, waitFor, within } from 'storybook/test'
import { ResourceTranslationsDialog } from '../../../../../dashboard/src/components/spree/translations/resource-translations-dialog'
import type { TranslatableResourceType } from '../../../../../dashboard/src/hooks/use-translations'
import { storeParameters, withStore } from '../../../decorators/store'
import { withToaster } from '../../../decorators/toaster'
import { clayMug, optionTypeTranslations, sizeOption } from '../../../fixtures/admin/catalog'
import {
  translationRequests,
  translationSaveRefused,
  translationsFailed,
  translationsHeld,
} from '../../../mocks/handlers/admin/catalog'
import { germanOnly, untranslated } from './translation-matrices'

interface Props {
  resourceType: TranslatableResourceType
  resourceId: string
}

/**
 * The translations editor, full screen: one row per translatable field, the
 * original beside the chosen language. Edits in every language are kept until
 * one save sends them together. The product page opens it from its card
 * (DA-PRD-03); the options page opens it for an option type and its values
 * (DA-PRD-05).
 */
function TranslationsDialog({ resourceType, resourceId }: Props) {
  const [open, setOpen] = useState(true)
  return (
    <ResourceTranslationsDialog
      open={open}
      onOpenChange={setOpen}
      resourceType={resourceType}
      resourceId={resourceId}
    />
  )
}

const dialog = (translations: HttpHandler[] = translationRequests(), ...more: HttpHandler[]) => {
  const base = storeParameters()
  return {
    liquorify: { ...base.liquorify, capture: 'viewport' },
    msw: { handlers: { ...base.msw.handlers, translations: [...more, ...translations] } },
  }
}

const matrix = (translations: ResourceTranslations) => dialog(translationRequests(translations))

const metaTitle = () => screen.findByLabelText('meta_title de')

const meta = {
  title: 'Admin dashboard/Translations/Resource translations dialog',
  component: TranslationsDialog,
  tags: ['CMP-DA-G-23'],
  args: { resourceType: 'product', resourceId: clayMug.id },
  decorators: [withStore, withToaster],
  parameters: dialog(),
} satisfies Meta<typeof TranslationsDialog>

export default meta
type Story = StoryObj<typeof meta>

export const German: Story = {
  name: 'Translated into German',
  play: async () => {
    await expect(await screen.findByLabelText('name de')).toHaveValue('Tonbecher')
  },
}

export const Untranslated: Story = {
  parameters: matrix(untranslated),
  play: async () => {
    await expect(await metaTitle()).toHaveValue('')
  },
}

export const ChoosingLanguage: Story = {
  name: 'Choosing a language',
  parameters: matrix(germanOnly),
  play: async () => {
    await userEvent.click(await screen.findByRole('combobox', { name: 'Locale' }))
    await screen.findByRole('option', { name: 'French' })
  },
}

export const Edited: Story = {
  name: 'Edited, not saved',
  play: async () => {
    await userEvent.type(await metaTitle(), 'Tonbecher, handgedreht')
    await screen.findByText('1 unsaved change(s)')
  },
}

// The saved and refused messages are toasts, which Spree stacks below every
// dialog so they never cover a sheet's buttons. Over this full-screen dialog
// that leaves them out of sight: the page reads the same before and after a
// save, and after a refusal. This looks like a Spree defect; the browser
// tests find the toast in the page, which does not show it can be seen.
//
// A save clears the dialog's edits before it reads the translations again, so
// the typed value is gone until the saved one comes back.
export const Saved: Story = {
  play: async () => {
    await userEvent.type(await metaTitle(), 'Tonbecher, handgedreht')
    await userEvent.click(screen.getByRole('button', { name: 'Save translations' }))
    await screen.findByText('Translations saved')
    await waitFor(async () => expect(await metaTitle()).toHaveValue('Tonbecher, handgedreht'))
  },
}

export const SaveRefused: Story = {
  name: 'Save refused',
  parameters: dialog(translationRequests(), ...translationSaveRefused),
  play: async () => {
    await userEvent.type(await metaTitle(), 'Tonbecher, handgedreht')
    await userEvent.click(screen.getByRole('button', { name: 'Save translations' }))
    await screen.findByText(/^Resource not found/)
  },
}

export const DiscardConfirmation: Story = {
  name: 'Closing with unsaved changes',
  play: async () => {
    await userEvent.type(await metaTitle(), 'Tonbecher, handgedreht')
    await userEvent.click(screen.getByRole('button', { name: 'Close' }))
    const confirm = await screen.findByText('Discard changes?')
    await within(confirm.closest('[role="dialog"]') as HTMLElement).findByRole('button', {
      name: 'Discard changes',
    })
  },
}

export const Loading: Story = {
  parameters: dialog(translationsHeld),
}

export const FailedToLoad: Story = {
  name: 'Failed to load',
  parameters: dialog(translationsFailed),
  play: async () => {
    // The dashboard asks again before giving up, as it does for every read.
    await screen.findByText('Could not load translations', undefined, { timeout: 15_000 })
  },
}

// The options page translates an option type and its values in one grid,
// each value labelled by its own name.
export const OptionType: Story = {
  name: 'An option type and its values',
  args: { resourceType: 'option_type', resourceId: sizeOption.id },
  parameters: matrix(
    optionTypeTranslations(sizeOption, {
      [sizeOption.id]: 'Größe',
      [(sizeOption.option_values ?? [])[0].id]: 'Klein',
    }),
  ),
  play: async () => {
    await expect(await screen.findByLabelText('label de')).toHaveValue('Größe')
    await screen.findByLabelText('M de')
  },
}

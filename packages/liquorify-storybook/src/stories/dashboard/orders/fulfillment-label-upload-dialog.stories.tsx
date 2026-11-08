import type { Meta, StoryObj } from '@storybook/react-vite'
import { HttpResponse, http } from 'msw'
import { fn, screen, userEvent } from 'storybook/test'
import { FulfillmentLabelUploadDialog } from '../../../../../dashboard/src/components/spree/orders/fulfillment-label-upload-dialog'
import { withStore } from '../../../decorators/store'
import { readyFulfillment, readyOrder } from '../../../fixtures/admin/after-sale'
import { fulfillmentWriteHeld } from '../../../mocks/handlers/admin/after-sale'
import { uploadAccepted, uploadHeld } from '../../../mocks/handlers/admin/files'
import { orderParameters } from './order-page'

/**
 * What the order page opens to record a label bought outside Spree on a
 * parcel (DA-ORD-04): the file, kept private, its tracking number, what the
 * postage cost in the order's currency, and the carrier.
 */
const meta = {
  title: 'Admin dashboard/Orders/Fulfillment label upload dialog',
  component: FulfillmentLabelUploadDialog,
  tags: ['CMP-DA-G-11'],
  args: {
    orderId: readyOrder.id,
    fulfillmentId: readyFulfillment.id,
    currency: 'USD',
    open: true,
    onOpenChange: fn(),
  },
  decorators: [withStore],
  parameters: orderParameters({ order: readyOrder, viewport: true, first: uploadAccepted }),
} satisfies Meta<typeof FulfillmentLabelUploadDialog>

export default meta
type Story = StoryObj<typeof meta>

const fileInput = () =>
  document.querySelector<HTMLInputElement>('input[type="file"]') as HTMLInputElement

const chooseFile = async () => {
  await screen.findByRole('heading', { name: 'Upload label' })
  await userEvent.upload(
    fileInput(),
    new File(['%PDF-1.7'], 'label-1Z4E7W8A0312845560.pdf', { type: 'application/pdf' }),
  )
}

const fill = async () => {
  await userEvent.type(
    await screen.findByRole('textbox', { name: 'Tracking number' }),
    '1Z4E7W8A0312845560',
  )
  await userEvent.type(screen.getByRole('spinbutton', { name: 'Postage cost' }), '9.40')
}

// The button reads Saving… until the chosen file has reached storage.
const upload = async () => screen.findByRole('button', { name: 'Upload label' })

export const Empty: Story = {
  play: async () => {
    await screen.findByRole('heading', { name: 'Upload label' })
  },
}

export const Filled: Story = {
  name: 'File and figures',
  play: async () => {
    await chooseFile()
    await screen.findByText('label-1Z4E7W8A0312845560.pdf')
    await fill()
  },
}

// Saving with no file would record a label with nothing behind it.
export const NoFile: Story = {
  name: 'No file, refused',
  play: async () => {
    await fill()
    await userEvent.click(await upload())
    await screen.findByRole('alert')
  },
}

// The tracking number is required.
export const NoTrackingNumber: Story = {
  name: 'No tracking number',
  play: async () => {
    await chooseFile()
    await userEvent.click(await upload())
    await screen.findByRole('textbox', { name: 'Tracking number', description: undefined })
  },
}

// The file is still on its way to storage, so the dialog waits.
export const Uploading: Story = {
  parameters: orderParameters({ order: readyOrder, viewport: true, first: uploadHeld }),
  play: async () => {
    await chooseFile()
    await screen.findByRole('button', { name: 'Saving…' })
  },
}

// One label already binds the parcel.
export const Refused: Story = {
  parameters: orderParameters({
    order: readyOrder,
    viewport: true,
    first: [
      ...uploadAccepted,
      http.post('/api/v3/admin/orders/:id/fulfillments/:fulfillmentId/labels', () =>
        HttpResponse.json(
          {
            error: {
              code: 'validation_error',
              message: 'This parcel already has an active shipping label',
              details: {},
            },
          },
          { status: 422 },
        ),
      ),
    ],
  }),
  play: async () => {
    await chooseFile()
    await screen.findByText('label-1Z4E7W8A0312845560.pdf')
    await fill()
    await userEvent.click(await upload())
    await screen.findByText('This parcel already has an active shipping label')
  },
}

export const Saving: Story = {
  parameters: orderParameters({
    order: readyOrder,
    viewport: true,
    first: [...uploadAccepted, ...fulfillmentWriteHeld('post /:fulfillmentId/labels')],
  }),
  play: async () => {
    await chooseFile()
    await screen.findByText('label-1Z4E7W8A0312845560.pdf')
    await fill()
    await userEvent.click(await upload())
    await screen.findByRole('button', { name: 'Saving…' })
  },
}

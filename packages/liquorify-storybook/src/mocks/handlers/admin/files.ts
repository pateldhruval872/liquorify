import { delay, HttpResponse, http } from 'msw'

interface UploadedFile {
  filename: string
  content_type: string
  byte_size: number
  visibility?: string
}

const uploads = new Map<string, UploadedFile>()

/**
 * The file a signed id was handed out for, so a record made from it, such as
 * a product's digital file, carries the name and size that was uploaded.
 */
export const uploadedFile = (signedId: string) => uploads.get(signedId)

const fileRequest = http.post('/api/v3/admin/files', async ({ request }) => {
  const body = (await request.json()) as UploadedFile
  const signedId = `story-signed-id-${uploads.size + 1}`
  uploads.set(signedId, body)
  return HttpResponse.json(
    {
      signed_id: signedId,
      filename: body.filename,
      content_type: body.content_type,
      byte_size: body.byte_size,
      visibility: body.visibility ?? 'public',
      expires_at: '2026-10-01T13:00:00.000Z',
      upload: {
        url: '/rails/active_storage/disk/story-key',
        method: 'PUT',
        headers: { 'Content-Type': body.content_type },
      },
    },
    { status: 201 },
  )
})

/**
 * Spree's answer to a file the dashboard asks to upload: a signed id, and
 * where the browser sends the bytes, here the local disk service.
 */
export const uploadAccepted = [
  fileRequest,
  http.put('/rails/active_storage/disk/:key', () => new HttpResponse(null, { status: 204 })),
]

/** The disk service refusing the bytes, as it does when their checksum does not match. */
export const storageRefused = [
  fileRequest,
  http.put('/rails/active_storage/disk/:key', () => new HttpResponse('', { status: 422 })),
]

/** The bytes still on their way to storage. */
export const uploadHeld = [
  fileRequest,
  http.put('/rails/active_storage/disk/:key', async () => {
    await delay('infinite')
  }),
]

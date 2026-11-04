import { delay, HttpResponse, http } from 'msw'
import { onePage } from '../../page'
import { refusal } from './developers'

const admin = '/api/v3/admin'

/** A record by its id, or the 404 Spree answers for one it cannot find. */
export function found<T extends { id: string }>(records: T[], id: unknown) {
  const record = records.find((candidate) => candidate.id === id)
  return record ? HttpResponse.json(record) : new HttpResponse(null, { status: 404 })
}

/** A resource's list, each record, and writes that succeed by echoing what was sent. */
export function recordRequests<T extends { id: string }>(path: string, records: T[]) {
  return [
    http.get(`${admin}/${path}`, () => HttpResponse.json(onePage(records))),
    http.get(`${admin}/${path}/:id`, ({ params }) => found(records, params.id)),
    http.post(`${admin}/${path}`, async ({ request }) => {
      const body = (await request.json()) as Partial<T>
      return HttpResponse.json(
        { ...records[0], ...body, id: `${records[0]?.id}new` },
        { status: 201 },
      )
    }),
    http.patch(`${admin}/${path}/:id`, async ({ params, request }) => {
      const record = records.find((candidate) => candidate.id === params.id) ?? records[0]
      return HttpResponse.json({ ...record, ...((await request.json()) as Partial<T>) })
    }),
    http.delete(`${admin}/${path}/:id`, () => new HttpResponse(null, { status: 204 })),
  ]
}

type Write = 'post' | 'patch'

/** Spree's refusal of a blank name, on a create or, with an id, an update. */
export function blankNameRefused(path: string, method: Write = 'post') {
  return [
    http[method](`${admin}/${path}`, async () => {
      await delay(300)
      return refusal('name', 'blank', "can't be blank", "Name can't be blank")
    }),
  ]
}

/** Spree's refusal of a name another of the store's records holds. */
export function takenNameRefused(path: string, method: Write = 'post') {
  return [
    http[method](`${admin}/${path}`, async () => {
      await delay(300)
      return refusal('name', 'taken', 'has already been taken', 'Name has already been taken')
    }),
  ]
}

/** Holds a write open, so the form stays in its saving state. */
export function writeHeld(path: string, method: Write | 'delete' = 'post') {
  return [
    http[method](`${admin}/${path}`, async () => {
      await delay('infinite')
    }),
  ]
}

/** Holds a read open, so the screen stays in its loading state. */
export function readHeld(path: string) {
  return [
    http.get(`${admin}/${path}`, async () => {
      await delay('infinite')
    }),
  ]
}

/** A read that fails as a server error does. */
export function readFailed(path: string) {
  return [http.get(`${admin}/${path}`, () => new HttpResponse(null, { status: 500 }))]
}

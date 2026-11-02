import { mkdirSync, writeFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'
import { getCredentials } from '../../dashboard/e2e/helpers'
import { seedDevelopers } from './developers'
import {
  adminCaller,
  type Caller,
  type Case,
  gapResult,
  notFound,
  ownOnly,
  runCases,
  unauthenticated,
} from './one-store'
import { addShoppers, publishableKey } from './shoppers'
import { seed } from './staff'

/**
 * Step P7's Store API refusals within one store, for G-11's shopper accounts:
 * reading or changing another customer's profile, addresses, orders, saved
 * cards and gift cards, as another customer of the same store and as a guest,
 * each beside the record's own customer. Judged by `one-store.ts`.
 *
 * Start Spree's browser-test server first, freshly, as `stack.spec.ts` says.
 * The script adds two customers of its own (`shoppers.ts`). Results go to
 * `results/p7/accounts.json`, with no response bodies, tokens or gift card
 * codes.
 *
 * The expected answers follow Spree's Store API: 401 `authentication_required`
 * without a customer's token; 404 naming the record, `order_not_found` for an
 * order and `record_not_found` otherwise, for another customer's record, which
 * each endpoint looks up among the caller's own. A request that names no
 * record (the profile, a list) cannot be refused by record: for it, the other
 * customer's answer must be their own, 200, carrying nothing of the first
 * customer's.
 */

const API = process.env.P7_API_URL ?? 'http://localhost:3010'
const results = new URL('./results/p7/', import.meta.url).pathname
const revision = process.env.FIDELITY_REVISION ?? null
const run = Date.now()

test.use({ baseURL: API })

test('the Store API keeps each customer to their own account, within one store', async ({
  request,
  baseURL,
}) => {
  const base = baseURL ?? API
  const creds = getCredentials()
  await seed(base)
  const { gatewayId } = await seedDevelopers(base)
  const admin = await adminCaller(
    request,
    'admin',
    creds.admin_email,
    creds.admin_password,
    creds.store_id,
  )

  const key = await publishableKey(request, admin)
  const guest: Caller = { name: 'guest', headers: { 'X-Spree-API-Key': key } }
  const wrongToken: Caller = {
    name: 'guest with a wrong order token',
    headers: { 'X-Spree-API-Key': key, 'X-Spree-Token': `p7-not-a-token-${run}` },
  }
  const { owner, other, lines, addresses, order, cards, gift } = await addShoppers(
    request,
    admin,
    key,
    gatewayId,
    run,
  )
  const me = '/api/v3/store/customers/me'

  const ownerOnly = { caller: other.caller, expected: ownOnly }
  const refusals = (code: string) => [
    { caller: guest, expected: unauthenticated },
    { caller: other.caller, expected: notFound(code) },
  ]
  const ownerRead = (path: string): Case['state'] => ({
    caller: owner.caller,
    request: { method: 'GET', path },
  })
  const profileValues = [owner.email, owner.last]
  const edit = `P7 edit ${run}`

  const cases: Case[] = [
    {
      gap: 'G-11',
      area: 'accounts',
      title: 'Read the profile',
      request: { method: 'GET', path: me },
      attempts: [{ caller: guest, expected: unauthenticated }, ownerOnly],
      control: { caller: owner.caller, status: 200 },
      protectedValues: profileValues,
    },
    {
      gap: 'G-11',
      area: 'accounts',
      title: "Change the profile, naming the other customer's id",
      request: { method: 'PATCH', path: me, data: { id: owner.id, first_name: edit } },
      attempts: [{ caller: guest, expected: unauthenticated }, ownerOnly],
      control: { caller: owner.caller, status: 200 },
      protectedValues: profileValues,
      state: ownerRead(me),
    },
    {
      gap: 'G-11',
      area: 'accounts',
      title: 'List the addresses',
      request: { method: 'GET', path: `${me}/addresses` },
      attempts: [{ caller: guest, expected: unauthenticated }, ownerOnly],
      control: { caller: owner.caller, status: 200 },
      protectedValues: [lines.kept, lines.spare, addresses.kept, addresses.spare],
    },
    {
      gap: 'G-11',
      area: 'accounts',
      title: 'Read an address',
      request: { method: 'GET', path: `${me}/addresses/${addresses.kept}` },
      attempts: refusals('record_not_found'),
      control: { caller: owner.caller, status: 200 },
      protectedValues: [lines.kept, owner.last],
    },
    {
      gap: 'G-11',
      area: 'accounts',
      title: 'Change an address',
      request: {
        method: 'PATCH',
        path: `${me}/addresses/${addresses.kept}`,
        data: { address1: edit },
      },
      attempts: refusals('record_not_found'),
      control: { caller: owner.caller, status: 200 },
      protectedValues: [lines.kept, owner.last],
      state: ownerRead(`${me}/addresses/${addresses.kept}`),
    },
    {
      gap: 'G-11',
      area: 'accounts',
      title: 'Delete an address',
      request: { method: 'DELETE', path: `${me}/addresses/${addresses.spare}` },
      attempts: refusals('record_not_found'),
      control: { caller: owner.caller, status: 204 },
      protectedValues: [lines.spare, owner.last],
      state: ownerRead(`${me}/addresses/${addresses.spare}`),
    },
    {
      gap: 'G-11',
      area: 'accounts',
      title: 'List the orders',
      request: { method: 'GET', path: `${me}/orders` },
      attempts: [{ caller: guest, expected: unauthenticated }, ownerOnly],
      control: { caller: owner.caller, status: 200 },
      protectedValues: [order.number, order.id],
    },
    {
      gap: 'G-11',
      area: 'accounts',
      title: "Read an order from the account's orders",
      request: { method: 'GET', path: `${me}/orders/${order.id}` },
      attempts: refusals('order_not_found'),
      control: { caller: owner.caller, status: 200 },
      protectedValues: [order.number, lines.order],
    },
    {
      gap: 'G-11',
      area: 'accounts',
      title: 'Read an order by its id, as the storefront does',
      request: { method: 'GET', path: `/api/v3/store/orders/${order.id}` },
      attempts: [
        { caller: guest, expected: notFound('order_not_found') },
        { caller: wrongToken, expected: notFound('order_not_found') },
        { caller: other.caller, expected: notFound('order_not_found') },
      ],
      control: { caller: owner.caller, status: 200 },
      protectedValues: [order.number, lines.order],
    },
    {
      gap: 'G-11',
      area: 'accounts',
      title: 'List the saved cards',
      request: { method: 'GET', path: `${me}/credit_cards` },
      attempts: [{ caller: guest, expected: unauthenticated }, ownerOnly],
      control: { caller: owner.caller, status: 200 },
      protectedValues: [cards.keptCard, cards.spareCard],
    },
    {
      gap: 'G-11',
      area: 'accounts',
      title: 'Read a saved card',
      request: { method: 'GET', path: `${me}/credit_cards/${cards.keptCard}` },
      attempts: refusals('record_not_found'),
      control: { caller: owner.caller, status: 200 },
      protectedValues: ['Bogus Card', '4242'],
    },
    {
      gap: 'G-11',
      area: 'accounts',
      title: 'Delete a saved card',
      request: { method: 'DELETE', path: `${me}/credit_cards/${cards.spareCard}` },
      attempts: refusals('record_not_found'),
      control: { caller: owner.caller, status: 204 },
      protectedValues: ['Bogus Card', '4242'],
      state: ownerRead(`${me}/credit_cards/${cards.spareCard}`),
    },
    {
      gap: 'G-11',
      area: 'accounts',
      title: 'List the gift cards',
      request: { method: 'GET', path: `${me}/gift_cards` },
      attempts: [{ caller: guest, expected: unauthenticated }, ownerOnly],
      control: { caller: owner.caller, status: 200 },
      protectedValues: [gift.code, gift.id],
    },
    {
      gap: 'G-11',
      area: 'accounts',
      title: 'Read a gift card',
      request: { method: 'GET', path: `${me}/gift_cards/${gift.id}` },
      attempts: refusals('record_not_found'),
      control: { caller: owner.caller, status: 200 },
      protectedValues: [gift.code],
    },
  ]

  const all = await runCases(request, cases)
  mkdirSync(results, { recursive: true })
  writeFileSync(
    `${results}accounts.json`,
    JSON.stringify(
      { revision, run, store: 'default', gaps: { 'G-11': gapResult(all) }, cases: all },
      null,
      2,
    ),
  )
  const failed = all.filter((item) => item.result === 'FAIL')
  expect(
    failed.map((item) => ({ title: item.title, failures: item.failures })),
    'every case passed',
  ).toEqual([])
})

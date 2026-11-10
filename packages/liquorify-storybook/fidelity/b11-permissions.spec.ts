import { type APIRequestContext, expect, request, test } from '@playwright/test'
import { getCredentials } from '../../dashboard/e2e/helpers'
import { EMAILS_URL, emailsAdmin, expectedToFail, RESET, record, SABOTAGE } from './b11'
import { type AdminCredentials, admin, PASSWORD, roles, seed, teammates } from './staff'

/**
 * Batch 11 verification, G-103's permission checks (work item §4 and §7):
 * each request the narrower roles could make, or were shown the controls for,
 * sent with that role's own token to the store's own records, and its answer
 * compared with the answer recorded before the run. The reporting, saved
 * report, export, counter and store requests go to the browser-test server;
 * the email template requests to the emails gem's test app.
 *
 * A refusal passes only with the expected status and error; a success only
 * with the expected status (and, for support's counters, the expected
 * counters). Every change a success makes is undone. No request names
 * another store. Tenant isolation stays NOT_RUN.
 */

const BTS_URL = process.env.FIDELITY_BASE_URL ?? 'http://localhost:5174'
const stamp = Date.now()

type Role = keyof typeof teammates
type Method = 'get' | 'post' | 'patch' | 'put' | 'delete'

interface Expected {
  status: number
  /** For a refusal: the error code, and a message it must hold if one is recorded. */
  code?: string
  message?: string
}

interface Check {
  id: string
  role: Role
  server: 'browser-test server' | 'emails gem test app'
  method: Method
  path: string
  data?: object
  expected: Expected
  /** A further check of a successful answer's body. */
  body?: (body: Record<string, unknown>) => Record<string, unknown>
}

const denied: Expected = { status: 403, code: 'access_denied' }
// Order-level money cannot be split per product (the server refuses that
// query as invalid before it checks the role), so a product query asks for
// net sales, which is per line.
const reportQuery = (dimension: string) => ({
  metrics: dimension === 'product' ? ['net_sales'] : ['total_sales', 'orders'],
  dimensions: [dimension],
  time_range: { preset: 'last_30_days' },
})
const reportExport = {
  type: 'report',
  search_params: {
    query: { metrics: ['total_sales'], time_range: { preset: 'last_7_days' } },
  },
}
const savedReport = (name: string) => ({
  name,
  query: { metrics: ['orders'], time_range: { preset: 'last_30_days' } },
})
const ORDER_COUNTERS = ['orders_to_fulfill', 'payments_to_collect']
const STOCK_COUNTERS = ['low_stock_items', 'out_of_stock_items']
const SENDER = `b11-${stamp}@example.com`

async function tokenFor(baseURL: string, email: string, password = PASSWORD) {
  const api = await request.newContext({ baseURL })
  try {
    const response = await api.post('/api/v3/admin/auth/login', { data: { email, password } })
    expect(response.ok(), `${email} signs in: ${await response.text()}`).toBe(true)
    return ((await response.json()) as { token: string }).token
  } finally {
    await api.dispose()
  }
}

test.use({ viewport: { width: 1280, height: 800 } })

test('G-103: what the server answers the narrower roles of batch 11', async () => {
  expectedToFail()
  test.setTimeout(600_000)
  await seed(BTS_URL)
  const emailsCreds = emailsAdmin()
  await seed(EMAILS_URL, emailsCreds)
  const btsCreds: AdminCredentials = getCredentials()

  const bts = await request.newContext({ baseURL: BTS_URL })
  const emails = await request.newContext({ baseURL: EMAILS_URL })
  const contexts = { 'browser-test server': bts, 'emails gem test app': emails } as const
  const stores = {
    'browser-test server': btsCreds.store_id,
    'emails gem test app': emailsCreds.store_id,
  } as const
  const btsAdmin = await admin(bts, btsCreds)
  const emailsAdminSession = await admin(emails, emailsCreds)
  const storeBefore = (await (
    await bts.get('/api/v3/admin/store', { headers: btsAdmin.headers })
  ).json()) as {
    mail_from_address: string | null
  }
  await emails.delete(`/api/v3/admin/email_templates/${RESET}?language=en`, {
    headers: emailsAdminSession.headers,
  })
  const defaultBody = (
    (await (
      await emails.get(`/api/v3/admin/email_templates/${RESET}?language=en`, {
        headers: emailsAdminSession.headers,
      })
    ).json()) as { default_body: string }
  ).default_body

  // A saved report the analyst is refused changing.
  const target = await bts.post('/api/v3/admin/reporting/saved_reports', {
    headers: btsAdmin.headers,
    data: savedReport(`B11 permission target ${stamp}`),
  })
  expect(target.status(), await target.text()).toBe(201)
  const targetId = ((await target.json()) as { id: string }).id
  const reportBuilderName = `B11 report builder ${stamp}`
  let builtId = ''

  const tokens = new Map<string, string>()
  const send = async (check: Check) => {
    const key = `${check.server}:${check.role}`
    const base = check.server === 'browser-test server' ? BTS_URL : EMAILS_URL
    if (!tokens.has(key)) tokens.set(key, await tokenFor(base, teammates[check.role].email))
    const api: APIRequestContext = contexts[check.server]
    const response = await api[check.method](check.path.replace(':built', builtId), {
      headers: {
        Authorization: `Bearer ${tokens.get(key)}`,
        'X-Spree-Store-Id': stores[check.server],
      },
      data: check.data,
    })
    const text = await response.text()
    let body: Record<string, unknown> = {}
    try {
      body = text ? (JSON.parse(text) as Record<string, unknown>) : {}
    } catch {
      body = { unparsed: text.slice(0, 200) }
    }
    return { status: response.status(), body }
  }

  const checks: Check[] = [
    {
      id: 'support-counters',
      role: 'support',
      server: 'browser-test server',
      method: 'get',
      path: '/api/v3/admin/dashboard/counters',
      expected: { status: 200 },
      body: (body) => {
        const keys = ((body.counters as { key: string }[]) ?? []).map((counter) => counter.key)
        return {
          counters: keys,
          has_order_counters: ORDER_COUNTERS.every((key) => keys.includes(key)),
          has_stock_counters: STOCK_COUNTERS.some((key) => keys.includes(key)),
        }
      },
    },
    {
      id: 'support-query',
      role: 'support',
      server: 'browser-test server',
      method: 'post',
      path: '/api/v3/admin/reporting/query',
      data: { metrics: ['total_sales'], time_range: { preset: 'last_30_days' } },
      expected: denied,
    },
    {
      id: 'support-saved-reports',
      role: 'support',
      server: 'browser-test server',
      method: 'get',
      path: '/api/v3/admin/reporting/saved_reports',
      expected: denied,
    },
    {
      id: 'merchandiser-counters',
      role: 'merchandiser',
      server: 'browser-test server',
      method: 'get',
      path: '/api/v3/admin/dashboard/counters',
      expected: denied,
    },
    {
      id: 'merchandiser-query',
      role: 'merchandiser',
      server: 'browser-test server',
      method: 'post',
      path: '/api/v3/admin/reporting/query',
      data: reportQuery('channel'),
      expected: denied,
    },
    {
      id: 'analyst-query',
      role: 'analyst',
      server: 'browser-test server',
      method: 'post',
      path: '/api/v3/admin/reporting/query',
      data: reportQuery('channel'),
      expected: { status: 200 },
    },
    {
      id: 'analyst-save',
      role: 'analyst',
      server: 'browser-test server',
      method: 'post',
      path: '/api/v3/admin/reporting/saved_reports',
      data: savedReport(`B11 analyst ${stamp}`),
      expected: {
        status: 403,
        code: 'access_denied',
        message: 'Missing permission: write_reports',
      },
    },
    {
      id: 'analyst-rename',
      role: 'analyst',
      server: 'browser-test server',
      method: 'patch',
      path: `/api/v3/admin/reporting/saved_reports/${targetId}`,
      data: { name: `B11 renamed ${stamp}` },
      expected: denied,
    },
    {
      id: 'analyst-delete',
      role: 'analyst',
      server: 'browser-test server',
      method: 'delete',
      path: `/api/v3/admin/reporting/saved_reports/${targetId}`,
      expected: denied,
    },
    {
      id: 'analyst-export',
      role: 'analyst',
      server: 'browser-test server',
      method: 'post',
      path: '/api/v3/admin/exports',
      data: reportExport,
      expected: denied,
    },
    {
      id: 'report-builder-create',
      role: 'reportBuilder',
      server: 'browser-test server',
      method: 'post',
      path: '/api/v3/admin/reporting/saved_reports',
      data: savedReport(reportBuilderName),
      expected: { status: 201 },
    },
    {
      id: 'report-builder-rename',
      role: 'reportBuilder',
      server: 'browser-test server',
      method: 'patch',
      path: '/api/v3/admin/reporting/saved_reports/:built',
      data: { name: `${reportBuilderName}, renamed` },
      expected: { status: 200 },
    },
    {
      id: 'report-builder-delete',
      role: 'reportBuilder',
      server: 'browser-test server',
      method: 'delete',
      path: '/api/v3/admin/reporting/saved_reports/:built',
      expected: { status: 204 },
    },
    {
      id: 'report-builder-export',
      role: 'reportBuilder',
      server: 'browser-test server',
      method: 'post',
      path: '/api/v3/admin/exports',
      data: reportExport,
      expected: { status: 201 },
    },
    {
      id: 'report-builder-query-by-product',
      role: 'reportBuilder',
      server: 'browser-test server',
      method: 'post',
      path: '/api/v3/admin/reporting/query',
      data: reportQuery('product'),
      expected: denied,
    },
    {
      id: 'store-settings-sender',
      role: 'storeSettings',
      server: 'browser-test server',
      method: 'patch',
      path: '/api/v3/admin/store',
      data: { mail_from_address: SENDER },
      expected: { status: 200 },
    },
    {
      id: 'store-settings-templates',
      role: 'storeSettings',
      server: 'emails gem test app',
      method: 'get',
      path: '/api/v3/admin/email_templates',
      expected: denied,
    },
    {
      id: 'email-editor-sender',
      role: 'emailEditor',
      server: 'browser-test server',
      method: 'patch',
      path: '/api/v3/admin/store',
      data: { mail_from_address: SENDER },
      expected: denied,
    },
    {
      id: 'email-editor-draft',
      role: 'emailEditor',
      server: 'emails gem test app',
      method: 'put',
      path: `/api/v3/admin/email_templates/${RESET}/draft`,
      data: { language: 'en', subject: `B11 editor ${stamp}`, body: defaultBody },
      expected: { status: 200 },
    },
    {
      id: 'email-editor-publication',
      role: 'emailEditor',
      server: 'emails gem test app',
      method: 'post',
      path: `/api/v3/admin/email_templates/${RESET}/publication`,
      data: { language: 'en' },
      expected: { status: 201 },
    },
    {
      id: 'email-editor-test-email',
      role: 'emailEditor',
      server: 'emails gem test app',
      method: 'post',
      path: `/api/v3/admin/email_templates/${RESET}/test_email`,
      data: { language: 'en', body: defaultBody },
      expected: { status: 202 },
    },
    {
      id: 'email-viewer-templates',
      role: 'emailViewer',
      server: 'emails gem test app',
      method: 'get',
      path: '/api/v3/admin/email_templates',
      expected: { status: 200 },
    },
    {
      id: 'email-viewer-revisions',
      role: 'emailViewer',
      server: 'emails gem test app',
      method: 'get',
      path: `/api/v3/admin/email_templates/${RESET}/revisions?language=en`,
      expected: { status: 200 },
    },
    {
      id: 'email-viewer-sender',
      role: 'emailViewer',
      server: 'browser-test server',
      method: 'patch',
      path: '/api/v3/admin/store',
      data: { mail_from_address: SENDER },
      expected: denied,
    },
    {
      id: 'email-viewer-draft',
      role: 'emailViewer',
      server: 'emails gem test app',
      method: 'put',
      path: `/api/v3/admin/email_templates/${RESET}/draft`,
      data: { language: 'en', subject: `B11 viewer ${stamp}`, body: defaultBody },
      expected: denied,
    },
    {
      id: 'email-viewer-preview',
      role: 'emailViewer',
      server: 'emails gem test app',
      method: 'post',
      path: `/api/v3/admin/email_templates/${RESET}/preview`,
      data: { language: 'en' },
      expected: denied,
    },
    {
      id: 'email-viewer-publication',
      role: 'emailViewer',
      server: 'emails gem test app',
      method: 'post',
      path: `/api/v3/admin/email_templates/${RESET}/publication`,
      data: { language: 'en' },
      expected: denied,
    },
    {
      id: 'email-viewer-test-email',
      role: 'emailViewer',
      server: 'emails gem test app',
      method: 'post',
      path: `/api/v3/admin/email_templates/${RESET}/test_email`,
      data: { language: 'en', body: defaultBody },
      expected: denied,
    },
  ]

  const answers: Record<string, unknown>[] = []
  let targetUnchanged = false
  try {
    for (const check of checks) {
      const answer = await send(check)
      if (check.id === 'report-builder-create' && answer.status === 201) {
        builtId = String(answer.body.id)
      }
      const error = (answer.body.error ?? {}) as { code?: string; message?: string }
      const extra = check.body && answer.status < 300 ? check.body(answer.body) : undefined
      const matches =
        answer.status === check.expected.status &&
        (check.expected.code === undefined || error.code === check.expected.code) &&
        (check.expected.message === undefined ||
          (error.message ?? '').includes(check.expected.message)) &&
        (check.id !== 'support-counters' ||
          (extra?.has_order_counters === true && extra?.has_stock_counters === false))
      answers.push({
        id: check.id,
        role: `${roles[teammates[check.role].role].name} (${roles[teammates[check.role].role].permissions.join(', ')})`,
        server: check.server,
        request: `${check.method.toUpperCase()} ${check.path.replace(':built', '{report builder’s report}').replace(targetId, '{saved report}')}`,
        expected: check.expected,
        answer: {
          status: answer.status,
          ...(answer.status >= 400 ? { code: error.code, message: error.message } : {}),
          ...(extra ?? {}),
        },
        matches,
      })
    }
    // Whatever the refusal's status, the analyst's rename and delete must
    // leave the report as the admin saved it.
    const targetAfter = await bts.get(`/api/v3/admin/reporting/saved_reports/${targetId}`, {
      headers: btsAdmin.headers,
    })
    targetUnchanged =
      targetAfter.status() === 200 &&
      ((await targetAfter.json()) as { name: string }).name === `B11 permission target ${stamp}`
  } finally {
    // Undo every change a success made.
    if (builtId) {
      await bts.delete(`/api/v3/admin/reporting/saved_reports/${builtId}`, {
        headers: btsAdmin.headers,
      })
    }
    await bts.delete(`/api/v3/admin/reporting/saved_reports/${targetId}`, {
      headers: btsAdmin.headers,
    })
    await bts.patch('/api/v3/admin/store', {
      headers: btsAdmin.headers,
      data: { mail_from_address: storeBefore.mail_from_address },
    })
    await emails.delete(`/api/v3/admin/email_templates/${RESET}?language=en`, {
      headers: emailsAdminSession.headers,
    })
    await bts.dispose()
    await emails.dispose()
  }
  record('g-103-permissions.json', {
    stores: 'each request names its own server’s default store; none names another',
    answers,
    analyst_left_saved_report_unchanged: targetUnchanged,
  })
  expect(targetUnchanged, 'the saved report the analyst was refused changing').toBe(true)
  const mismatched = answers.filter((answer) => !answer.matches).map((answer) => answer.id)
  expect(mismatched, 'requests whose answer differs from the expected one').toEqual(
    SABOTAGE ? ['impossible'] : [],
  )
  expect(answers).toHaveLength(checks.length)
})

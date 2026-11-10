import type { ReportingResult } from '@spree/admin-sdk'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import {
  draftFromQuery,
  EMPTY_QUERY,
  queryFromDraft,
} from '../../../../../dashboard/src/components/spree/reporting/report-draft'
import { ReportWorkspace } from '../../../../../dashboard/src/components/spree/reporting/report-workspace'
import { storeParameters, withStore } from '../../../decorators/store'
import {
  channelQuery,
  channelRanking,
  dailySeries,
  reportingSchema,
} from '../../../fixtures/admin/reporting'

/**
 * The builder beside the result it draws, the layout the new report and saved
 * report pages share (DA-RPT-02, DA-RPT-03), at the page's width at 1280
 * pixels. The result is the one the story starts with; a change in the
 * builder is kept, as the page keeps it before asking Spree again.
 */
function Workspace({
  start,
  result,
  error,
}: {
  start: typeof EMPTY_QUERY
  result?: ReportingResult
  error?: Error
}) {
  const [draft, setDraft] = useState(() => draftFromQuery(start, reportingSchema))
  return (
    <div style={{ width: 965 }}>
      <ReportWorkspace
        draft={draft}
        onChange={setDraft}
        schema={reportingSchema}
        query={queryFromDraft(draft, reportingSchema)}
        result={result}
        error={error}
      />
    </div>
  )
}

const meta = {
  title: 'Admin dashboard/Reporting/Report workspace',
  component: Workspace,
  tags: ['CMP-DA-G-17'],
  args: { start: EMPTY_QUERY, result: dailySeries() },
  decorators: [withStore],
  parameters: storeParameters(),
} satisfies Meta<typeof Workspace>

export default meta
type Story = StoryObj<typeof meta>

export const NewReport: Story = { name: 'A new report' }

export const Ranking: Story = {
  name: 'A ranking',
  args: { start: channelQuery, result: channelRanking() },
}

export const Loading: Story = { name: 'Loading', args: { result: undefined } }

import { Pagination, type PaginationMeta } from '@spree/dashboard-ui/ui/pagination'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'

function meta(page: number, pages: number, limit = 25): PaginationMeta {
  const count = pages * limit - 7
  return {
    page,
    limit,
    count,
    pages,
    from: (page - 1) * limit + 1,
    to: Math.min(page * limit, count),
    previous: page > 1 ? page - 1 : null,
    next: page < pages ? page + 1 : null,
  }
}

const stories = {
  title: 'Dashboard UI/Primitives/Pagination',
  component: Pagination,
  tags: ['CMP-DUI-P-29'],
  args: { meta: meta(1, 5), onPageChange: fn(), onPageSizeChange: fn() },
  parameters: { liquorify: { column: 'page' } },
} satisfies Meta<typeof Pagination>

export default stories
type Story = StoryObj<typeof stories>

export const FirstPage: Story = { name: 'First page' }

export const MiddlePage: Story = { name: 'Middle page', args: { meta: meta(3, 5) } }

export const LastPage: Story = { name: 'Last page', args: { meta: meta(5, 5) } }

export const OnePageWithPageSize: Story = {
  name: 'One page, with page size',
  args: { meta: meta(1, 1) },
}

export const WithoutPageSize: Story = {
  name: 'Without page size',
  args: { onPageSizeChange: undefined },
}

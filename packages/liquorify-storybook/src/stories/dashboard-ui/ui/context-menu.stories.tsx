import { DownloadIcon, PencilIcon, TrashIcon } from '@spree/dashboard-ui/icons'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@spree/dashboard-ui/ui/context-menu'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { fireEvent, screen, userEvent } from 'storybook/test'

/** A tile in the media library, which opens its menu on a right-click. */
function MediaLibraryTile() {
  return (
    <ul className="grid w-[48rem] grid-cols-6 gap-4">
      <li>
        <ContextMenu>
          <ContextMenuTrigger
            render={
              <button
                type="button"
                className="block w-full cursor-pointer overflow-hidden rounded-md border border-border text-left transition-colors hover:border-muted-foreground focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
              />
            }
          >
            <span className="relative flex aspect-square items-center justify-center bg-muted">
              <img src="/fixtures/product-sand.png" alt="" className="size-full object-cover" />
            </span>
            <span className="block truncate px-2 py-1.5 text-xs">Sand tee, front</span>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>
              <PencilIcon />
              Edit
            </ContextMenuItem>
            <ContextMenuItem>
              <DownloadIcon />
              Download
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem variant="destructive">
              <TrashIcon />
              Delete
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </li>
    </ul>
  )
}

async function rightClickTile() {
  const tile = await screen.findByRole('button', { name: 'Sand tee, front' })
  const box = tile.getBoundingClientRect()
  // At a fixed point on the tile, where the menu opens.
  fireEvent.contextMenu(tile, { clientX: box.left + 40, clientY: box.top + 40 })
  return screen.findByRole('menu')
}

const meta = {
  title: 'Dashboard UI/Primitives/Context menu',
  component: MediaLibraryTile,
  tags: ['CMP-DUI-P-16'],
  // The menu renders outside the story's root.
  parameters: { liquorify: { capture: 'viewport' } },
} satisfies Meta<typeof MediaLibraryTile>

export default meta
type Story = StoryObj<typeof meta>

export const Closed: Story = {}

export const Open: Story = {
  play: async () => {
    await rightClickTile()
  },
}

export const DestructiveHighlighted: Story = {
  name: 'Destructive highlighted',
  play: async () => {
    await rightClickTile()
    await userEvent.hover(await screen.findByRole('menuitem', { name: 'Delete' }))
  },
}

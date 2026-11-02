import { FileTypeIcon } from '@spree/dashboard-ui/spree/file-type-icon'
import type { Meta, StoryObj } from '@storybook/react-vite'

/**
 * A digital file's name in the digital files card of the product page
 * (DA-PRD-03), with the icon its type picks, as the card's rows draw it.
 */
function FileName({ filename, contentType }: { filename: string; contentType?: string }) {
  return (
    <span className="flex items-center gap-2 font-medium text-sm">
      <FileTypeIcon
        filename={filename}
        contentType={contentType}
        className="text-muted-foreground size-4 shrink-0"
      />
      {filename}
    </span>
  )
}

const meta = {
  title: 'Dashboard UI/Composed/File type icon',
  component: FileName,
  tags: ['CMP-DUI-C-20'],
} satisfies Meta<typeof FileName>

export default meta
type Story = StoryObj<typeof meta>

export const Document: Story = {
  args: { filename: 'glazing-guide.pdf', contentType: 'application/pdf' },
}

export const Image: Story = {
  args: { filename: 'pattern-sheet.png', contentType: 'image/png' },
}

export const Audio: Story = {
  args: { filename: 'studio-tour.mp3', contentType: 'audio/mpeg' },
}

export const Video: Story = {
  args: { filename: 'throwing-a-mug.mp4', contentType: 'video/mp4' },
}

export const Archive: Story = {
  args: { filename: 'templates.zip', contentType: 'application/zip' },
}

export const Spreadsheet: Story = {
  args: { filename: 'firing-schedule.csv', contentType: 'text/csv' },
}

export const Code: Story = {
  args: { filename: 'kiln-settings.json', contentType: 'application/json' },
}

// Servers often answer `application/octet-stream`; the name's extension decides then.
export const UnspecificTypeKnownExtension: Story = {
  name: 'Unspecific type, known extension',
  args: { filename: 'care-card.pdf', contentType: 'application/octet-stream' },
}

export const UnknownType: Story = {
  name: 'Unknown type',
  args: { filename: 'kiln-log.bin', contentType: 'application/octet-stream' },
}

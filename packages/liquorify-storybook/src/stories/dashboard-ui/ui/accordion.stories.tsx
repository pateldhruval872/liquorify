import { CheckCircle2Icon, CircleIcon } from '@spree/dashboard-ui/icons'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@spree/dashboard-ui/ui/accordion'
import { Card } from '@spree/dashboard-ui/ui/card'
import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ComponentProps } from 'react'
import { userEvent } from 'storybook/test'

const steps = [
  {
    value: 'payments',
    title: 'Connect a payment provider',
    body: 'Choose a provider and enter its keys to start taking payments.',
    done: true,
  },
  {
    value: 'shipping',
    title: 'Set up shipping',
    body: 'Add the zones you ship to and a delivery method for each one.',
    done: false,
  },
  {
    value: 'launch',
    title: 'Launch your store',
    body: 'Remove the password page so customers can find your products.',
    done: false,
  },
]

// Framed in one card, as the getting started page frames its checklist.
function Checklist(props: ComponentProps<typeof Accordion>) {
  return (
    <Card className="w-[28rem] overflow-hidden py-0">
      <Accordion {...props}>
        {steps.map((step) => (
          <AccordionItem key={step.value} value={step.value}>
            <AccordionTrigger>
              {step.done ? (
                <CheckCircle2Icon className="size-5 shrink-0 text-success" />
              ) : (
                <CircleIcon className="size-5 shrink-0 text-muted-foreground" />
              )}
              <span className={step.done ? 'text-muted-foreground' : undefined}>{step.title}</span>
            </AccordionTrigger>
            <AccordionContent className="flex flex-col items-start gap-3 ps-12">
              <p className="text-muted-foreground text-sm">{step.body}</p>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Card>
  )
}

const meta = {
  title: 'Dashboard UI/Primitives/Accordion',
  component: Checklist,
  tags: ['CMP-DUI-P-01'],
} satisfies Meta<typeof Checklist>

export default meta
type Story = StoryObj<typeof meta>

export const Closed: Story = {}

export const OneOpen: Story = { name: 'One open', args: { defaultValue: ['shipping'] } }

export const SeveralOpen: Story = {
  name: 'Several open',
  args: { multiple: true, defaultValue: ['payments', 'shipping'] },
}

export const FocusVisible: Story = {
  name: 'Focus visible',
  play: async () => {
    await userEvent.tab()
  },
}

import {Ban, CheckCircle2, Clock3} from 'lucide-react'
import {Status} from '../lib/invoices'

/*
  Status is carried by three things at once — colour, icon and word — because colour
  alone fails for colourblind users, and because a screenshot in a pitch deck has to
  read correctly at thumbnail size.
*/
const LOOK = {
  [Status.Pending]: {
    label: 'Pending',
    Icon: Clock3,
    className: 'bg-pending-bg text-pending ring-pending/25',
    dot: 'bg-pending',
  },
  [Status.Paid]: {
    label: 'Paid',
    Icon: CheckCircle2,
    className: 'bg-paid-bg text-paid ring-paid/25',
    dot: 'bg-paid',
  },
  [Status.Cancelled]: {
    label: 'Cancelled',
    Icon: Ban,
    className: 'bg-void-bg text-void ring-void/25',
    dot: 'bg-void',
  },
  [Status.None]: {
    label: 'Unknown',
    Icon: Ban,
    className: 'bg-void-bg text-void ring-void/25',
    dot: 'bg-void',
  },
} as const

export function StatusBadge({status, size = 'md'}: {status: Status; size?: 'sm' | 'md'}) {
  const {label, Icon, className, dot} = LOOK[status]
  const pad = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ring-1 ring-inset ${className} ${pad}`}
    >
      {status === Status.Pending ? (
        <span className={`size-1.5 rounded-full ${dot} animate-pulse-ring`} aria-hidden="true" />
      ) : (
        <Icon className={size === 'sm' ? 'size-3' : 'size-3.5'} aria-hidden="true" />
      )}
      {label}
    </span>
  )
}

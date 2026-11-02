import type { Balance } from '@spree/seller-sdk'

export const balances: Balance[] = [
  {
    currency: 'USD',
    settlement_currency: 'USD',
    converted: false,
    earned: '12480.50',
    pending: '640.00',
    payable: '11840.50',
    paid: '9200.00',
    balance: '2640.50',
  },
  {
    currency: 'EUR',
    settlement_currency: 'USD',
    converted: true,
    earned: '3150.00',
    pending: '0.00',
    payable: '3402.00',
    paid: '1700.00',
    balance: '1702.00',
  },
]

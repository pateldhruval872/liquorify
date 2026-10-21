import type { Country } from '@spree/admin-sdk'

function country(iso: string, iso3: string, fields: Partial<Country> = {}): Country {
  return {
    iso,
    iso3,
    states_required: false,
    zipcode_required: true,
    ...fields,
  } as Country
}

// A short list, enough to page through and filter; the API returns about 250.
export const countries: Country[] = [
  country('AU', 'AUS', { states_required: true }),
  country('CA', 'CAN', { states_required: true }),
  country('DE', 'DEU'),
  country('FR', 'FRA'),
  country('GB', 'GBR'),
  country('IE', 'IRL', { zipcode_required: false }),
  country('JP', 'JPN'),
  country('PL', 'POL'),
  country('US', 'USA', {
    states_required: true,
    states: [
      { abbr: 'CA', name: 'California' },
      { abbr: 'NY', name: 'New York' },
      { abbr: 'TX', name: 'Texas' },
    ],
  } as Partial<Country>),
]

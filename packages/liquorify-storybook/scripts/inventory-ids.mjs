#!/usr/bin/env node
// Builds the ID lists that the stories, the token files and the coverage report
// are checked against, from LIQ-009, the inventory that names every component
// file and token. LIQ-009 lives only in this repository, so the storefront's
// list is written here too and copied into the storefront repository.
//
//   node scripts/inventory-ids.mjs                    write inventory/ids.json
//   node scripts/inventory-ids.mjs --storefront <dir> also write the storefront's list,
//                                                     checking its files exist under <dir>
//   node scripts/inventory-ids.mjs --check            fail if inventory/ids.json is stale or a
//                                                     component file named in LIQ-009 is missing

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const repositoryRoot = path.resolve(packageRoot, '../..')
const inventoryFile = 'liquorify/LIQ-009-spree-component-and-token-inventory.md'
const backendOutput = path.join(packageRoot, 'inventory/ids.json')

// Where each component ID's files live. A group row names its folder in the
// second cell and its members in the fourth.
const componentRules = [
  { pattern: /^CMP-DUI-P-\d+$/, system: 'dashboard', folder: 'packages/dashboard-ui/src/ui/' },
  { pattern: /^CMP-DUI-C-\d+$/, system: 'dashboard', folder: 'packages/dashboard-ui/src/spree/' },
  {
    pattern: /^CMP-CORE-PG-\d+$/,
    system: 'dashboard',
    folder: 'packages/dashboard-core/src/pages/',
  },
  {
    pattern: /^CMP-CORE-PF-\d+$/,
    system: 'dashboard',
    folder: 'packages/dashboard-core/src/products/',
  },
  {
    pattern: /^CMP-CORE-\d+$/,
    system: 'dashboard',
    folder: 'packages/dashboard-core/src/components/',
  },
  {
    pattern: /^CMP-DA-G-\d+$/,
    system: 'dashboard',
    folder: 'packages/dashboard/src/components/spree/',
    group: true,
  },
  {
    pattern: /^CMP-SP-G-\d+$/,
    system: 'dashboard',
    folder: 'packages/seller-dashboard/src/components/',
    group: true,
  },
  { pattern: /^CMP-SF-P-\d+$/, system: 'storefront', folder: 'src/components/ui/' },
  { pattern: /^CMP-SF-G-\d+$/, system: 'storefront', folder: 'src/components/', group: true },
  { pattern: /^CMP-SF-PG-\d+$/, system: 'storefront', folder: 'src/app/[country]/[locale]/' },
]

// Semantic tokens carry a family and light and dark values; theme entries and
// email values carry one value.
const tokenRules = [
  { pattern: /^TK-DUI-\d+$/, system: 'dashboard', columns: ['name', 'family', 'light', 'dark'] },
  { pattern: /^TK-DUI-T-\d+$/, system: 'dashboard', columns: ['name', 'value'] },
  { pattern: /^TK-SF-\d+$/, system: 'storefront', columns: ['name', 'family', 'light', 'dark'] },
  { pattern: /^TK-SF-T-\d+$/, system: 'storefront', columns: ['name', 'value'] },
  { pattern: /^TK-EM-\d+$/, system: 'email', columns: ['name', 'value'] },
]

// Groups listed in a paragraph rather than a table: the colour utility aliases
// and the Tailwind palette colours each system uses.
const listedGroups = [
  { id: 'TK-DUI-A', system: 'dashboard', family: 'Colour utility alias' },
  { id: 'TK-SF-A', system: 'storefront', family: 'Colour utility alias' },
  { id: 'TK-TW-D', system: 'dashboard', family: 'Tailwind palette' },
  { id: 'TK-TW-S', system: 'storefront', family: 'Tailwind palette' },
]

function stripCode(cell) {
  return cell.replace(/`/g, '').trim()
}

function cellsOf(line) {
  return line
    .slice(1, line.lastIndexOf('|'))
    .split('|')
    .map((cell) => cell.trim())
}

function componentFiles(rule, cells) {
  if (!rule.group) {
    const name = stripCode(cells[1])
    const where = rule.pattern.source.includes('SF-PG') ? stripCode(cells[2]) : ''
    // The one page-level component outside the locale folder.
    if (name === 'global-error') return [{ name, file: 'src/app/global-error.tsx' }]
    return [{ name, file: `${rule.folder}${where}${name}.tsx` }]
  }

  const folder = cells[1] === 'Top level' ? '' : stripCode(cells[1])
  // A storefront group may list a subfolder's members after "<subfolder>:".
  return cells[3].split(';').flatMap((part) => {
    const match = part.trim().match(/^([a-z-]+): (.*)$/)
    const subfolder = match ? `${match[1]}/` : ''
    return stripCode(match ? match[2] : part)
      .split(',')
      .map((member) => member.trim())
      .filter(Boolean)
      .map((member) => ({ name: member, file: `${rule.folder}${folder}${subfolder}${member}.tsx` }))
  })
}

export function parseInventory(markdown) {
  const components = []
  const tokens = []

  for (const line of markdown.split('\n')) {
    if (line.startsWith('| CMP-') || line.startsWith('| TK-')) {
      const cells = cellsOf(line)
      const id = cells[0]
      const componentRule = componentRules.find((rule) => rule.pattern.test(id))
      if (componentRule) {
        for (const entry of componentFiles(componentRule, cells)) {
          components.push({ id, system: componentRule.system, ...entry })
        }
        continue
      }
      const tokenRule = tokenRules.find((rule) => rule.pattern.test(id))
      if (tokenRule) {
        const token = { id, system: tokenRule.system }
        tokenRule.columns.forEach((column, index) => {
          token[column] = stripCode(cells[index + 1])
        })
        tokens.push(token)
      }
      continue
    }

    for (const group of listedGroups) {
      if (line.includes(`(${group.id},`)) {
        // The members follow the paragraph's last colon; earlier examples are not members.
        const list = line.slice(line.lastIndexOf(': `') + 2)
        for (const name of list.match(/`--[a-z0-9-]+`/g) ?? []) {
          tokens.push({
            id: group.id,
            system: group.system,
            name: stripCode(name),
            family: group.family,
          })
        }
      }
    }
  }

  return { components, tokens }
}

function listFor(system, inventory, version) {
  const systems = system === 'storefront' ? ['storefront'] : ['dashboard', 'email']
  return {
    generatedFrom: inventoryFile,
    inventoryVersion: version,
    components: inventory.components.filter((entry) => systems.includes(entry.system)),
    tokens: inventory.tokens.filter((entry) => systems.includes(entry.system)),
  }
}

function serialize(list) {
  return `${JSON.stringify(list, null, 2)}\n`
}

function missingFiles(list, root) {
  return list.components.filter((entry) => !existsSync(path.join(root, entry.file)))
}

function main() {
  const args = process.argv.slice(2)
  const check = args.includes('--check')
  const storefrontIndex = args.indexOf('--storefront')
  const storefrontRoot = storefrontIndex >= 0 ? path.resolve(args[storefrontIndex + 1]) : null

  const markdown = readFileSync(path.join(repositoryRoot, inventoryFile), 'utf8')
  const version = markdown.match(/^version: (.+)$/m)?.[1] ?? 'unknown'
  const inventory = parseInventory(markdown)
  const backend = listFor('dashboard', inventory, version)
  const problems = missingFiles(backend, repositoryRoot).map(
    (entry) => `${entry.id} ${entry.name}: ${entry.file} does not exist`,
  )

  if (check) {
    const current = existsSync(backendOutput) ? readFileSync(backendOutput, 'utf8') : ''
    if (current !== serialize(backend)) {
      problems.push('inventory/ids.json does not match LIQ-009; run `pnpm inventory:ids`')
    }
  } else {
    writeFileSync(backendOutput, serialize(backend))
  }

  if (storefrontRoot) {
    const storefront = listFor('storefront', inventory, version)
    problems.push(
      ...missingFiles(storefront, storefrontRoot).map(
        (entry) => `${entry.id} ${entry.name}: ${entry.file} does not exist in the storefront`,
      ),
    )
    const storefrontOutput = path.join(storefrontRoot, 'stories/inventory/ids.json')
    if (!check) writeFileSync(storefrontOutput, serialize(storefront))
  }

  const counts = `${backend.components.length} component files and ${backend.tokens.length} tokens`
  if (problems.length > 0) {
    console.error(problems.join('\n'))
    process.exit(1)
  }
  console.log(`LIQ-009 ${version}: ${counts} for this repository`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main()

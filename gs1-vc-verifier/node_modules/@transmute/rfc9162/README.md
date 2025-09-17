# RFC9162

[![CI](https://github.com/transmute-industries/rfc9162/actions/workflows/ci.yml/badge.svg)](https://github.com/transmute-industries/rfc9162/actions/workflows/ci.yml)
![Branches](./badges/coverage-branches.svg)
![Functions](./badges/coverage-functions.svg)
![Lines](./badges/coverage-lines.svg)
![Statements](./badges/coverage-statements.svg)
![Jest coverage](./badges/coverage-jest%20coverage.svg)

<!-- [![NPM](https://nodei.co/npm/@transmute/rfc9162.png?mini=true)](https://npmjs.org/package/@transmute/rfc9162) -->

<img src="./transmute-banner.png" />

#### [Questions? Contact Transmute](https://transmute.typeform.com/to/RshfIw?typeform-source=rfc9162)

## Usage

```bash
npm install '@transmute/rfc9162'
```

```ts
import RFC9162 from '@transmute/rfc9162';
```

```js
const RFC9162 = require('@transmute/rfc9162');
```

### Usage

```ts
import RFC9162 from '@transmute/rfc9162'

const entries: Uint8Array[] = []
  for (let i = 0; i < 10; i++) {
    entries.push(RFC9162.strToBin(`${String.fromCharCode(65 + i)}`))
  }
  const root = RFC9162.treeHead(entries)
  const inclusionProof = RFC9162.inclusionProof(entries[2], entries)
  const leaf = RFC9162.leaf(entries[2])
  const verifiedInclusionProof = RFC9162.verifyInclusionProof(
    root,
    leaf,
    inclusionProof,
  )
  // expect(verifiedInclusionProof).toBe(true)
  entries.push(RFC9162.strToBin('Spicy update 🔥'))
  const root2 = RFC9162.treeHead(entries)
  const consistencyProof = RFC9162.consistencyProof(inclusionProof, entries)
  const verifiedConsistencyProof = RFC9162.verifyConsistencyProof(
    root,
    root2,
    consistencyProof,
  )
  // expect(verifiedConsistencyProof).toBe(true)
```

## Develop

```bash
npm i
npm t
npm run lint
npm run build
```
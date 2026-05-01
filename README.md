# @opticlm/nmem

> [!WARNING]
> This library is intended solely for implementing Optic's Extension functionality and has not been designed with reliability in mind for other purposes.

```
pnpm add zod
pnpm add @opticlm/nmem
```

## Usage

```ts
import { 
  NMem,
  CannotReachNMemError,
  MalformedResponseError,
} from '@opticlm/nmem';

import type { GetSpacesResponse } from '@opticlm/nmem/schema'

const nmem = new NMem();

try {
  const spaces: GetSpacesResponse = await nmem.getSpaces();
} catch (e) {
  if (e instanceof CannotReachNMemError) {
    // ...
  } else if (e instanceof MalformedResponseError) {
    // ...
  }
}
```
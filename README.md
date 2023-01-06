# Tsserver wrapper

A lite wrapper around tsserver

<p>
  <img src="https://github.com/shiyangzhaoa/tsserver/blob/main/typescript.svg" alt="tsserver">
</p>
<p>
    <a href="https://www.npmjs.com/package/tsserver-lite"><img src="https://img.shields.io/npm/dm/tsserver-lite?style=flat-square" alt="Total Downloads"></a>
    <a href="https://www.npmjs.com/package/tsserver-lite"><img src="https://img.shields.io/bundlephobia/minzip/tsserver-lite?style=flat-square" alt="Latest Release"></a>
    <a href="https://github.com/shiyangzhaoa/tsserver/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/tsserver-lite?style=flat-square" alt="License"></a>
</p>

## Install

```shell
yarn add tsserver-lite
```

## Example

For example, your project structure:

```shell
├── src
│  └── test.ts
└──── xxx
```

```ts
// src/test.ts
export const number = 123;
export const string = 'abc';
```

How to use:
```mjs
// index.mjs
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import { client } from 'tsserver-lite';

const updateTSFile = async (info) => {
  const fileInfo = Object.assign(
    {
      changedFiles: [],
      closedFiles: [],
      openFiles: [],
    },
    info,
  );

  await client.execute('updateOpen', fileInfo);
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const filePath = path.resolve(__dirname, './test.ts');

const main = async () => {
  client.startService();

  const openFile = {
    file: filePath,
    fileContent: fs.readFileSync(filePath, 'utf-8'),
    projectRootPath: path.resolve(__dirname, '../'),
    scriptKindName: 'ts',
  };

  try {
    await updateTSFile({
      openFiles: [openFile]
    });

    const result = await client.execute(
      'quickinfo',
      {
        file: filePath,
        line: 1,
        offset: 15,
      },
    );
    if (result.type === 'response') {
      console.log('result---', result);
    }
  } catch (err) {
    console.log(`tsserver error: ${err.message}`);
  }

  client.closeService();
};

main().catch(err => {
  console.error(err);
  process.exit(1);
});
```

Try run script:

```shell
node index.mjs
```

You will see these logs:

```ts
result: {
  seq: 0,
  type: 'response',
  command: 'quickinfo',
  request_seq: 3,
  success: true,
  body: {
    kind: 'const',
    kindModifiers: 'export',
    start: { line: 1, offset: 14 },
    end: { line: 1, offset: 20 },
    displayString: 'const number: 123',
    documentation: '',
    tags: []
  }
}
```

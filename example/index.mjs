import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import { client } from '../esm/index.mjs';

const updateOpenTSFile = async (info) => {
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

const exportPath = path.resolve(__dirname, './export.ts');

const main = async () => {
  client.startService();

  const openFile = {
    file: exportPath,
    fileContent: fs.readFileSync(exportPath, 'utf-8'),
    projectRootPath: path.resolve(__dirname, '../'),
    scriptKindName: 'ts',
  };

  try {
    const data = await updateOpenTSFile({
      openFiles: [openFile]
    });

    console.log('data', data);

    const result = await client.execute(
      'quickinfo',
      {
        file: exportPath,
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
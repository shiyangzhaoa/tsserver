import path from 'node:path';
import child_process from 'node:child_process';
import { createRequire } from 'node:module';

import type Proto from 'typescript/lib/protocol';

import type { TsServerProcessFactory, TsServerProcess } from './service.mjs';

const require = createRequire(import.meta.url);

class IpcChildServerProcess {
  constructor(private readonly _process: child_process.ChildProcess) {}

  write(serverRequest: Proto.Request): void {
    this._process.send(serverRequest);
  }

  onData(handler: (data: Proto.Response) => void): void {
    this._process.on('message', handler);
  }

  onExit(handler: (code: number | null, signal: string | null) => void): void {
    this._process.on('exit', handler);
  }

  onError(handler: (err: Error) => void): void {
    this._process.on('error', handler);
  }

  kill(): void {
    this._process.kill();
  }
}

function generatePatchedEnv(env: any, modulePath: string): any {
  const newEnv = Object.assign({}, env);
  newEnv['NODE_PATH'] = path.join(modulePath, '..', '..', '..');
  newEnv['PATH'] = newEnv['PATH'] || process.env.PATH;

  return newEnv;
}

export class ElectronServiceProcessFactory implements TsServerProcessFactory {
  fork(args: readonly string[]): TsServerProcess {
    const tsserverPath = require.resolve('typescript/lib/tsserver');

    const runtimeArgs = [...args];
    // Don't change this value
    runtimeArgs.push('--serverMode', 'semantic');

    runtimeArgs.push('--useInferredProjectPerProjectRoot');
    runtimeArgs.push('--enableTelemetry');
    runtimeArgs.push('--disableAutomaticTypingAcquisition');
    runtimeArgs.push('--useNodeIpc');

    const childProcess = child_process.fork(tsserverPath, runtimeArgs, {
      silent: true,
      cwd: undefined,
      env: generatePatchedEnv(process.env, tsserverPath),
      execArgv: [],
      stdio: 'inherit',
    });

    return new IpcChildServerProcess(childProcess);
  }
}

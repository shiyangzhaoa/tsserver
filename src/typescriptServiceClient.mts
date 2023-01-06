import { RequestQueue, RequestQueueingType } from './requestQueen.mjs';

import { CallbackMap } from './callbackMap.mjs';
import { ServerResponse } from './service.mjs';

import type { RequestItem } from './requestQueen.mjs';
import type {
  TypeScriptRequests,
  TsServerProcess,
  ExecConfig,
} from './service.mjs';

import type Proto from 'typescript/lib/protocol';

export const fenceCommands = new Set(['change', 'close', 'open', 'updateOpen']);

export class TypeScriptServiceClient {
  readonly #requestQueue = new RequestQueue();
  readonly #callbacks = new CallbackMap<Proto.Response>();
  readonly #pendingResponses = new Set<number>();

  constructor(
    private readonly watchOptions: Proto.WatchOptions,
    private readonly serverProcess: TsServerProcess,
  ) {
    this.serverProcess.onData((msg) => {
      this.#dispatchMessage(msg);
    });

    this.serverProcess.onExit(() => {
      this.#callbacks.destroy('server exited');
    });

    this.serverProcess.onError(() => {
      this.#callbacks.destroy('server errored');
    });
  }

  startService() {
    console.log('[TSServer] client server started');
    const configureOptions: Proto.ConfigureRequestArguments = {
      hostInfo: 'vscode',
      preferences: {
        providePrefixAndSuffixTextForRename: true,
        allowRenameOfImportPath: true,
        includePackageJsonAutoImports: 'auto',
      },
      watchOptions: this.watchOptions,
    };

    this.executeWithoutWaitingForResponse('configure', configureOptions);
    this.setCompilerOptionsForInferredProjects();
  }

  closeService() {
    console.log('[TSServer] client server closed');
    this.serverProcess.kill();
  }

  public execute(
    command: keyof TypeScriptRequests,
    args: any,
    config?: ExecConfig,
  ): Promise<ServerResponse.Response<Proto.Response>> {
    const executions = this.executeImpl(command, args, {
      isAsync: false,
      expectsResult: true,
      ...config,
    });

    return executions[0]!;
  }

  public executeWithoutWaitingForResponse(
    command: keyof TypeScriptRequests,
    args: any,
  ): void {
    this.executeImpl(command, args, {
      isAsync: false,
      expectsResult: false,
    });
  }

  private setCompilerOptionsForInferredProjects(): void {
    const args: Proto.SetCompilerOptionsForInferredProjectsArgs = {
      options: {
        module: 'ESNext',
        moduleResolution: 'Node',
        target: 'ES2020',
        jsx: 'react',
        strictNullChecks: true,
        strictFunctionTypes: true,
        sourceMap: true,
        allowJs: true,
        allowSyntheticDefaultImports: true,
        allowNonTsExtensions: true,
        resolveJsonModule: true,
      },
    } as any;
    this.executeWithoutWaitingForResponse(
      'compilerOptionsForInferredProjects',
      args,
    );
  }

  public executeImpl(
    command: keyof TypeScriptRequests,
    args: any,
    executeInfo: {
      isAsync: boolean;
      expectsResult: boolean;
      lowPriority?: boolean;
    },
  ) {
    const request = this.#requestQueue.createRequest(command, args);
    const requestInfo: RequestItem = {
      request,
      expectsResponse: executeInfo.expectsResult,
      isAsync: executeInfo.isAsync,
      queueingType: this.#getQueueingType(command, executeInfo.lowPriority),
    };
    let result: Promise<ServerResponse.Response<Proto.Response>> | undefined;
    if (executeInfo.expectsResult) {
      result = new Promise<ServerResponse.Response<Proto.Response>>(
        (resolve, reject) => {
          this.#callbacks.add(
            request.seq,
            {
              onSuccess: resolve as () =>
                | ServerResponse.Response<Proto.Response>
                | undefined,
              onError: reject,
              queuingStartTime: Date.now(),
              isAsync: executeInfo.isAsync,
            },
            executeInfo.isAsync,
          );
        },
      );
    }

    this.#requestQueue.enqueue(requestInfo);
    this.#sendNextRequests();

    return [result];
  }

  #sendNextRequests(): void {
    while (this.#pendingResponses.size === 0 && this.#requestQueue.length > 0) {
      const item = this.#requestQueue.dequeue();
      if (item) {
        this.#sendRequest(item);
      }
    }
  }

  #sendRequest(requestItem: RequestItem) {
    const serverRequest = requestItem.request;

    if (requestItem.expectsResponse && !requestItem.isAsync) {
      this.#pendingResponses.add(requestItem.request.seq);
    }

    try {
      this.serverProcess.write(serverRequest);
    } catch (err) {
      const callback = this.#fetchCallback(serverRequest.seq);
      callback?.onError(err as Error);
    }
  }

  #fetchCallback(seq: number) {
    const callback = this.#callbacks.fetch(seq);
    if (!callback) {
      return undefined;
    }

    this.#pendingResponses.delete(seq);
    return callback;
  }

  #getQueueingType(
    command: string,
    lowPriority?: boolean,
  ): RequestQueueingType {
    if (fenceCommands.has(command)) {
      return RequestQueueingType.Fence;
    }
    return lowPriority
      ? RequestQueueingType.LowPriority
      : RequestQueueingType.Normal;
  }

  #dispatchMessage(message: Proto.Message) {
    try {
      switch (message.type) {
        case 'response':
          this.#dispatchResponse(message as Proto.Response);
          break;

        case 'event': {
          const event = message as Proto.Event;
          if (event.event === 'requestCompleted') {
            const seq = (event as Proto.RequestCompletedEvent).body.request_seq;
            const callback = this.#callbacks.fetch(seq);
            if (callback) {
              callback.onSuccess(undefined);
            }
          }
          break;
        }
        default:
          throw new Error(`Unknown message type ${message.type} received`);
      }
    } finally {
      this.#sendNextRequests();
    }
  }

  #dispatchResponse(response: Proto.Response) {
    const callback = this.#fetchCallback(response.request_seq);

    if (!callback) {
      return;
    }

    if (response.success) {
      callback.onSuccess(response);
    } else if (response.message === 'No content available.') {
      callback.onSuccess(ServerResponse.NoContent);
    } else {
      callback.onError(new Error(response.message));
    }
  }
}

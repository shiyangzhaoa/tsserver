/* eslint-disable @typescript-eslint/no-namespace */
import type Proto from 'typescript/lib/protocol';

export namespace ServerResponse {
  export class Cancelled {
    public readonly type = 'cancelled';

    constructor(public readonly reason: string) {}
  }

  export const NoContent = { type: 'noContent' } as const;

  export const NoServer = { type: 'noServer' } as const;

  export type Response<T extends Proto.Response> =
    | T
    | Cancelled
    | typeof NoContent
    | typeof NoServer;
}

export interface TsServerProcessFactory {
  fork(args: readonly string[]): TsServerProcess;
}

export interface TsServerProcess {
  write(serverRequest: Proto.Request): void;

  onData(handler: (data: Proto.Response) => void): void;
  onExit(handler: (code: number | null, signal: string | null) => void): void;
  onError(handler: (error: Error) => void): void;

  kill(): void;
}

interface StandardTsServerRequests {
  applyCodeActionCommand: [
    Proto.ApplyCodeActionCommandRequestArgs,
    Proto.ApplyCodeActionCommandResponse,
  ];
  completionEntryDetails: [
    Proto.CompletionDetailsRequestArgs,
    Proto.CompletionDetailsResponse,
  ];
  completionInfo: [Proto.CompletionsRequestArgs, Proto.CompletionInfoResponse];
  completions: [Proto.CompletionsRequestArgs, Proto.CompletionsResponse];
  configure: [Proto.ConfigureRequestArguments, Proto.ConfigureResponse];
  definition: [Proto.FileLocationRequestArgs, Proto.DefinitionResponse];
  definitionAndBoundSpan: [
    Proto.FileLocationRequestArgs,
    Proto.DefinitionInfoAndBoundSpanResponse,
  ];
  docCommentTemplate: [
    Proto.FileLocationRequestArgs,
    Proto.DocCommandTemplateResponse,
  ];
  documentHighlights: [
    Proto.DocumentHighlightsRequestArgs,
    Proto.DocumentHighlightsResponse,
  ];
  format: [Proto.FormatRequestArgs, Proto.FormatResponse];
  formatonkey: [Proto.FormatOnKeyRequestArgs, Proto.FormatResponse];
  getApplicableRefactors: [
    Proto.GetApplicableRefactorsRequestArgs,
    Proto.GetApplicableRefactorsResponse,
  ];
  getCodeFixes: [Proto.CodeFixRequestArgs, Proto.CodeFixResponse];
  getCombinedCodeFix: [
    Proto.GetCombinedCodeFixRequestArgs,
    Proto.GetCombinedCodeFixResponse,
  ];
  getEditsForFileRename: [
    Proto.GetEditsForFileRenameRequestArgs,
    Proto.GetEditsForFileRenameResponse,
  ];
  getEditsForRefactor: [
    Proto.GetEditsForRefactorRequestArgs,
    Proto.GetEditsForRefactorResponse,
  ];
  getOutliningSpans: [Proto.FileRequestArgs, Proto.OutliningSpansResponse];
  getSupportedCodeFixes: [null, Proto.GetSupportedCodeFixesResponse];
  implementation: [Proto.FileLocationRequestArgs, Proto.ImplementationResponse];
  jsxClosingTag: [Proto.JsxClosingTagRequestArgs, Proto.JsxClosingTagResponse];
  navto: [Proto.NavtoRequestArgs, Proto.NavtoResponse];
  navtree: [Proto.FileRequestArgs, Proto.NavTreeResponse];
  organizeImports: [
    Proto.OrganizeImportsRequestArgs,
    Proto.OrganizeImportsResponse,
  ];
  projectInfo: [Proto.ProjectInfoRequestArgs, Proto.ProjectInfoResponse];
  quickinfo: [Proto.FileLocationRequestArgs, Proto.QuickInfoResponse];
  references: [Proto.FileLocationRequestArgs, Proto.ReferencesResponse];
  rename: [Proto.RenameRequestArgs, Proto.RenameResponse];
  selectionRange: [
    Proto.SelectionRangeRequestArgs,
    Proto.SelectionRangeResponse,
  ];
  signatureHelp: [Proto.SignatureHelpRequestArgs, Proto.SignatureHelpResponse];
  typeDefinition: [Proto.FileLocationRequestArgs, Proto.TypeDefinitionResponse];
  updateOpen: [Proto.UpdateOpenRequestArgs, Proto.Response];
  prepareCallHierarchy: [
    Proto.FileLocationRequestArgs,
    Proto.PrepareCallHierarchyResponse,
  ];
  provideCallHierarchyIncomingCalls: [
    Proto.FileLocationRequestArgs,
    Proto.ProvideCallHierarchyIncomingCallsResponse,
  ];
  provideCallHierarchyOutgoingCalls: [
    Proto.FileLocationRequestArgs,
    Proto.ProvideCallHierarchyOutgoingCallsResponse,
  ];
  fileReferences: [Proto.FileRequestArgs, Proto.FileReferencesResponse];
  provideInlayHints: [Proto.InlayHintsRequestArgs, Proto.InlayHintsResponse];
  'encodedSemanticClassifications-full': [
    Proto.EncodedSemanticClassificationsRequestArgs,
    Proto.EncodedSemanticClassificationsResponse,
  ];
  findSourceDefinition: [
    Proto.FileLocationRequestArgs,
    Proto.DefinitionResponse,
  ];
}

interface NoResponseTsServerRequests {
  open: [Proto.OpenRequestArgs, null];
  close: [Proto.FileRequestArgs, null];
  change: [Proto.ChangeRequestArgs, null];
  compilerOptionsForInferredProjects: [
    Proto.SetCompilerOptionsForInferredProjectsArgs,
    null,
  ];
  reloadProjects: [null, null];
  configurePlugin: [
    Proto.ConfigurePluginRequest,
    Proto.ConfigurePluginResponse,
  ];
}

interface AsyncTsServerRequests {
  geterr: [Proto.GeterrRequestArgs, Proto.Response];
  geterrForProject: [Proto.GeterrForProjectRequestArgs, Proto.Response];
}

export type TypeScriptRequests = StandardTsServerRequests &
  NoResponseTsServerRequests &
  AsyncTsServerRequests;

export type ExecConfig = {
  readonly lowPriority?: boolean;
  readonly nonRecoverable?: boolean;
};

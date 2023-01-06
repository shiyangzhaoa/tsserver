import { ElectronServiceProcessFactory } from './serverProcess.mjs';
import { TypeScriptServiceClient } from './typescriptServiceClient.mjs';

const processFactory = new ElectronServiceProcessFactory();

export const client = new TypeScriptServiceClient({}, processFactory.fork([]));

import Operation from './Operation';
import Oas3CompileContext from './Oas3CompileContext';
import * as oas3 from 'openapi3-ts';
export default class Path {
    readonly context: Oas3CompileContext;
    readonly oaPath: oas3.PathItemObject;
    private readonly _operations;
    constructor(context: Oas3CompileContext, oaPath: oas3.PathItemObject, exegesisController: string | undefined);
    getOperation(method: string): Operation | undefined;
}

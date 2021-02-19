import * as oa from "./OpenApi";
export declare class Server implements oa.ServerObject {
    url: string;
    description?: string;
    variables: {
        [v: string]: ServerVariable;
    };
    constructor(url: string, desc?: string);
    addVariable(name: string, variable: ServerVariable): void;
}
export declare class ServerVariable implements oa.ServerVariableObject {
    enum?: string[] | boolean[] | number[];
    default: string | boolean | number;
    description?: string;
    constructor(defaultValue: any, enums?: any, description?: string);
}

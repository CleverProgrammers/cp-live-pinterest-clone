export interface ISpecificationExtension {
    [extensionName: string]: any;
}
export declare class SpecificationExtension implements ISpecificationExtension {
    [extensionName: string]: any;
    static isValidExtension(extensionName: string): boolean;
    getExtension(extensionName: string): any;
    addExtension(extensionName: string, payload: any): void;
    listExtensions(): string[];
}

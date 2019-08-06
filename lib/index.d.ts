export declare const NO_VALIDATE_EXPIRE = 0;
declare type CheckExpireFunc = (expire: number) => boolean;
export interface AWStorageConstructorOptions {
    enableLog: boolean;
    disabled: boolean;
    prefix: string;
    session: boolean;
    hasMeta: boolean;
    expire: number;
    checkExpire?: CheckExpireFunc;
}
declare class AWStorage {
    /** 是否禁用缓存 */
    private disabled;
    /** 开启 log */
    private enableLog;
    /** 前缀 */
    private prefix;
    /** 是否使用 sessionStorage 存储 (默认使用 localStorage 存储) */
    private session;
    /** 是否有 meta 信息 */
    private hasMeta;
    /** 过期时间: 单位毫秒 (0 为不过期) */
    private expire;
    /** 判断是否过期的函数 (会和 expire 一块使用) */
    private checkExpire?;
    constructor({ disabled, enableLog, prefix, session, expire, hasMeta, checkExpire, }: Partial<AWStorageConstructorOptions>);
    private log;
    private getStorage;
    /** 获取 key */
    private getKey;
    /** 创建 meta 信息 */
    private createMeta;
    /** 是否过期 false=未过期 */
    private isExpired;
    /** 获取 meta 信息，并且返回真正的 value */
    private parseMetaAndReturnRealValue;
    private setItem;
    /** 返回空字符串 (表示没获取到) */
    private getItem;
    /** 设置 string */
    setString(key: string, val: string): void;
    /** 获取 string */
    getString(key: string): string | null;
    /** 设置 number */
    setNumber(key: string, val: number): void;
    /** 获取 number */
    getNumber(key: string): number | null;
    /** 设置 json */
    setJson(key: string, val: any, middleware?: (_: string) => string): boolean;
    /** 获取 json */
    getJson(key: string, middleware?: (_: string) => string): object | any[] | null;
    /** 删除 */
    remove(...keys: string[]): boolean;
}
export default AWStorage;

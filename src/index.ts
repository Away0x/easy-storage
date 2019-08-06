const SEPARATOR = '$META|META$';
// 不验证是否过期的过期时间设置
export const NO_VALIDATE_EXPIRE = 0;

type CheckExpireFunc = (expire: number) => boolean; // return true，表示过期了

interface MetaType {
  updateTime: number; // 修改时的时间戳
  expire: number;     // 过期时间 (毫秒)
}

export interface AWStorageConstructorOptions {
  enableLog: boolean
  disabled: boolean
  prefix: string
  session: boolean
  hasMeta: boolean
  expire: number
  checkExpire?: CheckExpireFunc
}

class AWStorage {

  /** 是否禁用缓存 */
  private disabled: boolean;
  /** 开启 log */
  private enableLog: boolean;
  /** 前缀 */
  private prefix: string;
  /** 是否使用 sessionStorage 存储 (默认使用 localStorage 存储) */
  private session: boolean
  /** 是否有 meta 信息 */
  private hasMeta: boolean
  /** 过期时间: 单位毫秒 (0 为不过期) */
  private expire: number; // 一分钟为 1000 * 60，一小时为 1000 * 60 * 60
  /** 判断是否过期的函数 (会和 expire 一块使用) */
  private checkExpire?: CheckExpireFunc;

  constructor({
    disabled = false,
    enableLog = false,
    prefix = '',
    session = false,
    expire = 0,
    hasMeta = true,
    checkExpire,
  }: Partial<AWStorageConstructorOptions>) {
    this.disabled = disabled;
    this.enableLog = enableLog;
    this.prefix = prefix;
    this.session = session;
    this.hasMeta = hasMeta;
    this.expire = expire;
    this.checkExpire = checkExpire;
  }

  private log(key: string, action: string, msg: string = '') {
    if (!this.enableLog) {
      return;
    }

    console.log('AWStorage-' + action + '' + key, msg);
  }

  private getStorage(): Storage {
    if (!window.sessionStorage || !window.localStorage) {
      throw new Error('该浏览器不支持本地存储');
    }
    return this.session ? window.sessionStorage : window.localStorage;
  }

  /** 获取 key */
  private getKey(key: string): string {
    if (!this.prefix) {
      return key;
    }

    return this.prefix + key;
  }

  /** 创建 meta 信息 */
  private createMeta(): string {
    const defaultMeta: MetaType = {
      updateTime: (new Date()).getTime(),
      expire: this.expire,
    }

    return JSON.stringify(defaultMeta);
  }

  /** 是否过期 false=未过期 */
  private isExpired(meta: MetaType): boolean {
    // 没有过期信息
    if (!meta.expire || !meta.updateTime || meta.expire === NO_VALIDATE_EXPIRE) { return false; }
    // 执行配置的验证函数
    if (this.checkExpire && this.checkExpire(meta.expire)) { return true; }
    // 验证是否过期
    const now = (new Date()).getTime();
    const time = now - meta.updateTime;
    return time >= meta.expire;
  }

  /** 获取 meta 信息，并且返回真正的 value */
  private parseMetaAndReturnRealValue(key: string): string | null {
    const rawValue = this.getStorage().getItem(this.getKey(key)) || '';
    const valueArr = rawValue.split(SEPARATOR);
    // 没有 meta 信息
    if (valueArr.length === 1) { return rawValue; }

    const metaString = valueArr[0];
    const realValue = valueArr[1];

    if (!realValue) { return null; }
    try {
      const metaObj: MetaType = JSON.parse(metaString);
      // meta 信息验证
      // 1. 是否过期
      if (this.isExpired(metaObj)) {
        this.remove(key);
        return null;
      }

      return realValue;
    } catch (err) {
      console.warn(err);
      return null;
    }
  }

  private setItem(key: string, val: string) {
    if (this.disabled) { return; }
    if (this.hasMeta) {
      const meta = this.createMeta();
      const value = meta + SEPARATOR + String(val);
      this.getStorage().setItem(this.getKey(key), value);
    } else {
      this.getStorage().setItem(this.getKey(key), String(val));
    }

    this.log(key, 'SET');
  }

  /** 返回空字符串 (表示没获取到) */
  private getItem(key: string): string | null {
    if (this.disabled) { return null; }
    let value: string | null = '';
    if (this.hasMeta) {
      value = this.parseMetaAndReturnRealValue(key);
    } else {
      value = this.getStorage().getItem(this.getKey(key)) || '';
    }

    this.log(key, 'GET');
    return value || '';
  }

  // ------------------- storeage -------------------
  /** 设置 string */
  public setString(key: string, val: string) {
    this.setItem(key, val);
  }

  /** 获取 string */
  public getString(key: string): string | null {
    return this.getItem(key);
  }

  /** 设置 number */
  public setNumber(key: string, val: number) {
    this.setItem(key, String(val));
  }

  /** 获取 number */
  public getNumber(key: string): number | null {
    const value = this.getItem(key);
    return value === null ? null : Number(value);
  }

  /** 设置 json */
  public setJson(key: string, val: any, middleware?: (_: string) => string): boolean {
    try {
      const data = JSON.stringify(val);
      const dealData = middleware ? middleware(data) : data;

      this.setItem(key, dealData);
      return true;
    } catch (err) {
      console.warn(err);
      return false;
    }
  }

  /** 获取 json */
  public getJson(key: string, middleware?: (_: string) => string): object | any[] | null {
    const data = this.getItem(key);
    if (!data) { return null; }
    const dealData = middleware ? middleware(data) : data;

    try {
      return dealData !== '' ? JSON.parse(dealData) : null;
    } catch (err) {
      console.warn(err);
      return null;
    }
  }

  /** 删除 */
  public remove(...keys: string[]): boolean {
    if (!keys || !keys.length) { return false; }

    (keys).forEach((key) => this.getStorage().removeItem(this.getKey(key)));
    return true;
  }

}

export default AWStorage;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var SEPARATOR = '$META|META$';
// 不验证是否过期的过期时间设置
exports.NO_VALIDATE_EXPIRE = 0;
var AWStorage = /** @class */ (function () {
    function AWStorage(_a) {
        var _b = _a.disabled, disabled = _b === void 0 ? false : _b, _c = _a.enableLog, enableLog = _c === void 0 ? false : _c, _d = _a.prefix, prefix = _d === void 0 ? '' : _d, _e = _a.session, session = _e === void 0 ? false : _e, _f = _a.expire, expire = _f === void 0 ? 0 : _f, _g = _a.hasMeta, hasMeta = _g === void 0 ? true : _g, checkExpire = _a.checkExpire;
        this.disabled = disabled;
        this.enableLog = enableLog;
        this.prefix = prefix;
        this.session = session;
        this.hasMeta = hasMeta;
        this.expire = expire;
        this.checkExpire = checkExpire;
    }
    AWStorage.prototype.log = function (key, action, msg) {
        if (msg === void 0) { msg = ''; }
        if (!this.enableLog) {
            return;
        }
        console.log('AWStorage-' + action + '' + key, msg);
    };
    AWStorage.prototype.getStorage = function () {
        if (!window.sessionStorage || !window.localStorage) {
            throw new Error('该浏览器不支持本地存储');
        }
        return this.session ? window.sessionStorage : window.localStorage;
    };
    /** 获取 key */
    AWStorage.prototype.getKey = function (key) {
        if (!this.prefix) {
            return key;
        }
        return this.prefix + key;
    };
    /** 创建 meta 信息 */
    AWStorage.prototype.createMeta = function () {
        var defaultMeta = {
            updateTime: (new Date()).getTime(),
            expire: this.expire,
        };
        return JSON.stringify(defaultMeta);
    };
    /** 是否过期 false=未过期 */
    AWStorage.prototype.isExpired = function (meta) {
        // 没有过期信息
        if (!meta.expire || !meta.updateTime || meta.expire === exports.NO_VALIDATE_EXPIRE) {
            return false;
        }
        // 执行配置的验证函数
        if (this.checkExpire && this.checkExpire(meta.expire)) {
            return true;
        }
        // 验证是否过期
        var now = (new Date()).getTime();
        var time = now - meta.updateTime;
        return time >= meta.expire;
    };
    /** 获取 meta 信息，并且返回真正的 value */
    AWStorage.prototype.parseMetaAndReturnRealValue = function (key) {
        var rawValue = this.getStorage().getItem(this.getKey(key)) || '';
        var valueArr = rawValue.split(SEPARATOR);
        // 没有 meta 信息
        if (valueArr.length === 1) {
            return rawValue;
        }
        var metaString = valueArr[0];
        var realValue = valueArr[1];
        if (!realValue) {
            return null;
        }
        try {
            var metaObj = JSON.parse(metaString);
            // meta 信息验证
            // 1. 是否过期
            if (this.isExpired(metaObj)) {
                this.remove(key);
                return null;
            }
            return realValue;
        }
        catch (err) {
            console.warn(err);
            return null;
        }
    };
    AWStorage.prototype.setItem = function (key, val) {
        if (this.disabled) {
            return;
        }
        if (this.hasMeta) {
            var meta = this.createMeta();
            var value = meta + SEPARATOR + String(val);
            this.getStorage().setItem(this.getKey(key), value);
        }
        else {
            this.getStorage().setItem(this.getKey(key), String(val));
        }
        this.log(key, 'SET');
    };
    /** 返回空字符串 (表示没获取到) */
    AWStorage.prototype.getItem = function (key) {
        if (this.disabled) {
            return null;
        }
        var value = '';
        if (this.hasMeta) {
            value = this.parseMetaAndReturnRealValue(key);
        }
        else {
            value = this.getStorage().getItem(this.getKey(key)) || '';
        }
        this.log(key, 'GET');
        return value || '';
    };
    // ------------------- storeage -------------------
    /** 设置 string */
    AWStorage.prototype.setString = function (key, val) {
        this.setItem(key, val);
    };
    /** 获取 string */
    AWStorage.prototype.getString = function (key) {
        return this.getItem(key);
    };
    /** 设置 number */
    AWStorage.prototype.setNumber = function (key, val) {
        this.setItem(key, String(val));
    };
    /** 获取 number */
    AWStorage.prototype.getNumber = function (key) {
        var value = this.getItem(key);
        return value === null ? null : Number(value);
    };
    /** 设置 json */
    AWStorage.prototype.setJson = function (key, val, middleware) {
        try {
            var data = JSON.stringify(val);
            var dealData = middleware ? middleware(data) : data;
            this.setItem(key, dealData);
            return true;
        }
        catch (err) {
            console.warn(err);
            return false;
        }
    };
    /** 获取 json */
    AWStorage.prototype.getJson = function (key, middleware) {
        var data = this.getItem(key);
        if (!data) {
            return null;
        }
        var dealData = middleware ? middleware(data) : data;
        try {
            return dealData !== '' ? JSON.parse(dealData) : null;
        }
        catch (err) {
            console.warn(err);
            return null;
        }
    };
    /** 删除 */
    AWStorage.prototype.remove = function () {
        var _this = this;
        var keys = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            keys[_i] = arguments[_i];
        }
        if (!keys || !keys.length) {
            return false;
        }
        (keys).forEach(function (key) { return _this.getStorage().removeItem(_this.getKey(key)); });
        return true;
    };
    return AWStorage;
}());
exports.default = AWStorage;

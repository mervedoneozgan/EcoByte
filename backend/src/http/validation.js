export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

export function badRequest(message) {
  return new HttpError(400, message);
}

export function readText(value, field, options = {}) {
  const {
    defaultValue,
    maxLength = 200,
    minLength = 0,
    required = false,
    pattern,
    trim = true,
  } = options;

  if (value === undefined || value === null) {
    if (required) throw badRequest(`${field} zorunludur.`);
    return defaultValue;
  }

  if (typeof value !== 'string') throw badRequest(`${field} metin olmalıdır.`);
  const text = trim ? value.trim() : value;
  if (required && !text) throw badRequest(`${field} zorunludur.`);
  if (text.length < minLength) throw badRequest(`${field} en az ${minLength} karakter olmalıdır.`);
  if (text.length > maxLength) throw badRequest(`${field} en fazla ${maxLength} karakter olabilir.`);
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/u.test(text)) {
    throw badRequest(`${field} geçersiz kontrol karakterleri içeriyor.`);
  }
  if (pattern && text && !pattern.test(text)) throw badRequest(`${field} geçerli biçimde değildir.`);
  return text;
}

export function readNumber(value, field, options = {}) {
  const { integer = false, min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY } = options;
  const number = Number(value);
  if (!Number.isFinite(number)) throw badRequest(`${field} geçerli bir sayı olmalıdır.`);
  if (integer && !Number.isInteger(number)) throw badRequest(`${field} tam sayı olmalıdır.`);
  if (number < min || number > max) {
    throw badRequest(`${field} ${min} ile ${max} arasında olmalıdır.`);
  }
  return number;
}

export function readBoolean(value, field, options = {}) {
  const { defaultValue = false } = options;
  if (value === undefined || value === null) return defaultValue;
  if (typeof value !== 'boolean') throw badRequest(`${field} doğru veya yanlış olmalıdır.`);
  return value;
}

export function readPlainObject(value, field, options = {}) {
  const { defaultValue = {}, maxKeys = 30 } = options;
  if (value === undefined || value === null) return defaultValue;
  if (typeof value !== 'object' || Array.isArray(value)) {
    throw badRequest(`${field} nesne biçiminde olmalıdır.`);
  }
  if (Object.keys(value).length > maxKeys) throw badRequest(`${field} en fazla ${maxKeys} alan içerebilir.`);
  return value;
}

export function requireOneOf(value, field, allowed) {
  if (!allowed.includes(value)) throw badRequest(`${field} desteklenmeyen bir değer içeriyor.`);
  return value;
}

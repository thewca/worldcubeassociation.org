// see app/helpers/error_codes.rb
export const INVALID_TOKEN = -1;
export const EXPIRED_TOKEN = -2;
export const MISSING_AUTHENTICATION = -3;
export const COMPETITION_NOT_FOUND = -1000;
export const COMPETITION_API_5XX = -1001;
export const USER_IS_BANNED = -2001;
export const USER_PROFILE_INCOMPLETE = -2002;
export const USER_INSUFFICIENT_PERMISSIONS = -2003;
export const REGISTRATION_NOT_FOUND = -3000;
export const PAYMENT_NOT_ENABLED = -3001;
export const PAYMENT_NOT_READY = -3002;
export const INVALID_REQUEST_DATA = -4000;
export const EVENT_EDIT_DEADLINE_PASSED = -4001;
export const GUEST_LIMIT_EXCEEDED = -4002;
export const USER_COMMENT_TOO_LONG = -4003;
export const INVALID_EVENT_SELECTION = -4004;
export const REQUIRED_COMMENT_MISSING = -4005;
export const COMPETITOR_LIMIT_REACHED = -4006;
export const INVALID_REGISTRATION_STATUS = -4007;
export const REGISTRATION_CLOSED = -4008;

export class BackendError extends Error {
  errorCode;

  httpCode;

  constructor(errorCode, httpCode) {
    super(`Error ${errorCode}, httpCode: ${httpCode}`);
    this.errorCode = errorCode;
    this.httpCode = httpCode;
  }
}

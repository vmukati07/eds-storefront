/* eslint-disable import/no-cycle */
/* eslint-disable import/prefer-default-export */
/* eslint no-console: ["error", { allow: ["error"] }] */
class Auth {
  constructor(key = Auth.AUTH_STORE) {
    this.subscribers = [];
    this.key = key;
    this.token = Auth.getToken();
  }

  static TOKEN_STORE = 'M2_VENIA_BROWSER_PERSISTENCE__signin_token';

  static AUTH_STORE = 'COMMERCE_AUTH_CACHE';

  static COOKIE_EXPIRATION_DAYS = 30; // TODO: Get value from commerce storeConfig?

  static DEFAULT_AUTH = {
    token: null,
    isAuthenticated: false,
  };

  static getToken() {
    const authTokenField = window.localStorage.getItem(Auth.TOKEN_STORE);
    if (!authTokenField) {
      return null;
    }
    try {
      const parsed = JSON.parse(authTokenField);
      return parsed.value.replace(/[""]/g, '');
    } catch (err) {
      console.error('Could not parse authTokenField', err);
      return null;
    }
  }

  static setToken(token) {
    window.localStorage.setItem(Auth.TOKEN_STORE, JSON.stringify({
      value: `"${token}"`,
      timeStored: Date.now(),
      ttl: 3600, // TODO: Get value from commerce storeConfig?
    }));
  }

  static logout(data) {
    // eslint-disable-next-line no-console
    console.log(data);
    const { result } = data.revokeCustomerToken;
    if (result === true) {
      this.unsetAuth();
    }
  }

  // eslint-disable-next-line class-methods-use-this
  getCookie(key) {
    return document.cookie
      .split(';')
      .map((c) => c.trim())
      .filter((cookie) => cookie.startsWith(`${key}=`))
      .map((cookie) => decodeURIComponent(cookie.split('=')[1]))[0] || null;
  }

  setCookie(key, value, days = this.COOKIE_EXPIRATION_DAYS, domain = `.${window.location.hostname}`, path = '/') {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${key}=${encodeURIComponent(value)}; expires=${expires}; domain=${domain}; path=${path}; SameSite=Lax`;
  }

  setToken(token) {
    this.token = token;
    Auth.setToken(token);
    this.setAuth({
      ...this.getAuth(),
      isAuthenticated: true,
      token,
    });
  }

  getToken() {
    return this.token;
  }

  setAuth(auth) {
    if (!this.getToken()) {
      return;
    }
    window.localStorage.setItem(`${this.key}_${this.token}`, JSON.stringify(auth));

    this.subscribers.forEach((callback) => {
      callback(auth);
    });
  }

  getAuth() {
    if (!this.getToken()) {
      return Auth.DEFAULT_AUTH;
    }
    try {
      const parsed = JSON.parse(window.localStorage.getItem(`${this.key}_${this.token}`)) || Auth.DEFAULT_AUTH;
      return parsed;
    } catch (err) {
      console.error('Failed to parse token from localStore. Resetting it.');
      window.localStorage.removeItem(`${this.key}_${this.token}`);
    }
    return Auth.DEFAULT_AUTH;
  }

  unsetAuth() {
    const keys = [
      `${this.key}_${this.token}`,
      Auth.TOKEN_STORE,
    ];

    keys.forEach((key) => {
      window.localStorage.removeItem(key);
    });
  }
}

export const auth = new Auth();

export const authApi = {
  accountLogin: async (email, password) => {
    const { generateCustomerToken } = await import('./auth.js');
    await generateCustomerToken(email, password);
  },
  accountLogout: async () => {
    const { revokeCustomerToken } = await import('./auth.js');
    await revokeCustomerToken();
  },
  accountRegister: async (firstname, lastname, email, password, isSubscribed = false) => {
    const { createCustomerV2 } = await import('./auth.js');
    await createCustomerV2(firstname, lastname, email, password, isSubscribed);
  },
};

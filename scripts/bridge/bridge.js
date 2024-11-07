/* eslint-disable import/no-cycle */
import { store } from '../minicart/api.js';
import { auth } from '../auth/api.js';

// Use case: When a user logs in Adobe Commerce, the bridge is authenticated
const cookieAuthenticated = 'eds_bridge_authenticated';

// Use case: When a user logs in Adobe Commerce, the token is set
const cookieSigninToken = 'eds_bridge_signin_token';

// Use case: When a user logs in Adobe Commerce, the cart id is set
const cookieCartUid = 'eds_bridge_cart_uid';

// Use case: When a user updates cart in LUMA, the cart is refreshed
const cookieCartRefresh = 'eds_bridge_cart_refresh';

// Use case: When an order is placed, the cart is reset
// Use case: When a user logs out, the cart is reset
const cookieCartReset = 'eds_bridge_cart_reset';

/**
 * When a user logs in Adobe Commerce, the bridge is authenticated
 * @returns {Promise<boolean>}
 */
export function isBridgeAuthenticated() {
  return auth.getCookie(cookieAuthenticated)
    && auth.getCookie(cookieAuthenticated) === 'true';
}

/**
 * When a user logs in Adobe Commerce, the token is set in a cookie
 * @returns {Promise<boolean>}
 */
export function hasCookieToken() {
  return auth.getCookie(cookieSigninToken);
}

/**
 * When a user logs in Adobe Commerce, the token is set in localStorage
 * @returns {Promise<boolean>}
 */
export function hasStorageToken() {
  return auth.getToken() !== null;
}

/**
 * When a user logs in Adobe Commerce, the cart id is set in localStorage
 * @returns {Promise<boolean>}
 */
export function hasStorageCartId() {
  return store.getCartId() !== null;
}

/**
 * When a user logs in Adobe Commerce, the bridge is authenticated state
 * @returns {Promise<string|boolean>}
 */
export function isAuthenticated() {
  return isBridgeAuthenticated() && hasStorageToken();
}

/**
 * Get the bridge type based on the user's authentication state or cart state
 * @returns {Promise<string[]>}
 */
export function getBridgeType() {
  if (isBridgeAuthenticated() && hasStorageToken()) {
    return ['customer', auth.getToken()];
  }
  return ['guest', store.getCartId()];
}

/**
 * Use a bridge redirect URL based on the user's authentication state or cart state
 * @returns {Promise<boolean>}
 */
export function useBridgeRedirect() {
  return hasStorageToken() || hasStorageCartId();
}

/**
 * When a user logs out, the cart is reset or, when a user places an order, the cart is reset
 * @returns {Promise<boolean>}
 */
function isCartReset() {
  return auth.getCookie(cookieCartReset)
    && auth.getCookie(cookieCartReset) === 'true';
}

/**
 * Reset the cart reset cookie used to synchronize cart state in LUMA and Edge Delivery Service
 * @returns {Promise<void>}
 */
async function resetCartReset() {
  auth.setCookie(cookieCartReset, 'false');
}

/**
 * Reset the cart state in Edge Delivery Service
 * @returns {Promise<void>}
 */
async function resetCart() {
  store.resetCartIdStore();
  resetCartReset();
}

/**
 * When a user updates cart in LUMA or Edge Delivery Service, the cart is refreshed
 * @returns {Promise<boolean>}
 */
function isCartRefresh() {
  return auth.getCookie(cookieCartRefresh)
    && auth.getCookie(cookieCartRefresh) === 'true';
}

/**
 * Reset the cart refresh cookie used to synchronize cart state in LUMA and Edge Delivery Service
 * @returns {Promise<void>}
 */
async function resetCartRefresh() {
  auth.setCookie(cookieCartRefresh, 'false');
}

/**
 * Reset the cart refresh cookie used to synchronize cart state in Edge Delivery Service
 * @returns {Promise<void>}
 */
async function refreshCart() {
  if (store.getCartId()) {
    const { getCart } = await import('../minicart/cart.js');
    await getCart();
  }
  resetCartRefresh();
}

/**
 * If a user is authenticated in Adobe Commerce, synchronize authentication state and
 *  refresh or reset cart state
 */
async function synchronizeAuthenticated() {
  // If the token is not set in Edge Delivery, set it from the eds_bridge_signin_token cookie
  if (!auth.getToken()) {
    const token = auth.getCookie(cookieSigninToken);
    if (token) {
      auth.setToken(token);
    }
  }

  // If the cart id is not set in Edge Delivery, set it from the eds_bridge_cart_uid cookie
  const cartId = auth.getCookie(cookieCartUid);
  if (!store.getCartId() || store.getCartId() !== cartId) {
    if (cartId) {
      store.setCartId(cartId);
      await refreshCart();
    }
  }
}

/**
 * if a user is unauthenticated in Adobe Commerce, synchronize unauthenticated state and
 * refresh or reset cart state
 *
 * this is the default or "unauthorized" state, so a token should not be set
 * in localStorage when the user is unauthenticated in LUMA
 *
 * @returns {Promise<void>}
 * @private
 */
async function synchronizeUnauthenticated() {
  // Commerce owns the token, so if the token is set in localStorage and
  //  this method is called during an unauthenticated state, unset the token from localStorage
  if (auth.getToken()) {
    auth.unsetAuth();
  }

  // If the cart id is not set in client storage,
  //  set it from the `eds_bridge_cart_uid` cookie if it exists and refresh the cart
  const cartId = auth.getCookie(cookieCartUid);
  if (!store.getCartId() || store.getCartId() !== cartId) {
    if (cartId) {
      store.setCartId(cartId);
      await refreshCart();
    }
  }
}

// if user is authenticated in LUMA, synchronize authentication state and
// reset or refresh cart state
export async function synchronizeBridge() {
  // if the user is authenticated in LUMA, synchronize authentication state
  if (isBridgeAuthenticated()) {
    await synchronizeAuthenticated();
  } else {
    await synchronizeUnauthenticated();
  }

  // if the cart is refreshed in LUMA, refresh the cart state in Edge Delivery Service
  if (isCartRefresh()) {
    await refreshCart();
  }

  // if the cart is reset in LUMA, reset the cart state in Edge Delivery Service
  if (isCartReset()) {
    await resetCart();
  }
}

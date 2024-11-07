/* eslint-disable import/no-cycle */
class Bridge {
  static COMMERCE_ROUTE = '/bridge/state/index/';

  static ALLOWED_PARAMS = ['guest', 'customer', 'path'];

  /**
   * Get the URL for the bridge based on the user's authentication state or cart state
   */
  static getUrl(params) {
    let type = 'guest';
    if (params.customer) {
      type = 'customer';
    }

    // e.g. https://domain.com/bridge/state/index/{TYPE}/{TYPE_VALUE}/path/{PATH}
    const path = `${Bridge.COMMERCE_ROUTE}${type}/${params[type]}/path/${params.path}`;
    const url = new URL(path, params.url);
    return url;
  }

  /**
   * Get the redirect URL for the bridge based on the user's authentication state or cart state
   */
  static getRedirectUrl(type, path, url) {
    const params = {
      url, // Adobe Commerce URL
      path, // Adobe Commerce path to redirect to
    };

    const [typeName, typeValue] = type;
    params[typeName] = typeValue;

    return Bridge.getUrl(params);
  }

  /**
   * Redirect to the bridge based on the user's authentication state or cart state
   */
  static redirect(type, path, url, useBridgeRedirect = null) {
    let redirectUrl;
    switch (path) {
      case 'account':
        redirectUrl = new URL('/customer/account/', url);
        break;
      case 'account-login':
        redirectUrl = new URL('/customer/account/login/', url);
        break;
      case 'account-logout':
        redirectUrl = new URL('/customer/account/logout/', url);
        break;
      case 'cart':
        redirectUrl = new URL('/checkout/cart/', url);
        break;
      case 'checkout':
        redirectUrl = new URL('/checkout/', url);
        break;
      default:
        redirectUrl = Bridge.getRedirectUrl(type, path, url);
    }

    // Paths should use bridge URL instead of commerce URL if bridge is authenticated or cart is set
    const paths = ['account-login', 'cart', 'checkout'];
    if (paths.includes(path) && useBridgeRedirect) {
      redirectUrl = Bridge.getRedirectUrl(type, path, url);
    }

    window.location.href = redirectUrl;
  }
}

export const bridge = new Bridge();

export const bridgeApi = {
  authenticated: async () => {
    const { isBridgeAuthenticated } = await import('./bridge.js');
    return isBridgeAuthenticated();
  },
  redirect: async (path) => {
    const { getBridgeType, useBridgeRedirect } = await import('./bridge.js');
    const { getConfigValue } = await import('../configs.js');

    const url = await getConfigValue('commerce-store-url');
    const type = await getBridgeType();
    const useBridge = await useBridgeRedirect();

    Bridge.redirect(type, path, url, useBridge);
  },
  synchronize: async () => {
    const { synchronizeBridge } = await import('./bridge.js');
    await synchronizeBridge();
  },
};

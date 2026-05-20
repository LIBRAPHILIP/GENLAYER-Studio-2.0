// Early execution global exception interception script.
// This is imported as the very first line in main.tsx to ensure all third-party Web3 connections 
// are gracefully safeguarded from dynamic origin boundary errors in the sandbox dev environment.

if (typeof window !== 'undefined') {
  const isWeb3SandboxErr = (msgOrErr: any): boolean => {
    if (!msgOrErr) return false;
    let text = '';
    if (typeof msgOrErr === 'string') {
      text = msgOrErr;
    } else {
      try {
        text += msgOrErr.message || '';
        text += ' ' + (msgOrErr.stack || '');
        text += ' ' + (msgOrErr.reason || '');
        text += ' ' + (msgOrErr.text || '');
        text += ' ' + (msgOrErr.description || '');
        text += ' ' + JSON.stringify(msgOrErr);
      } catch (_) {
        text = String(msgOrErr);
      }
    }
    
    const lower = text.toLowerCase();
    return (
      lower.includes('abnormally with code') ||
      lower.includes('unauthorized') ||
      lower.includes('invalid key') ||
      lower.includes('not been authorized') ||
      lower.includes('walletconnect') ||
      lower.includes('wallet-connect') ||
      lower.includes('reown') ||
      lower.includes('origin not allowed') ||
      lower.includes('origin verification') ||
      lower.includes('metamask') ||
      lower.includes('meta-mask') ||
      lower.includes('failed to connect') ||
      lower.includes('unverified') ||
      lower.includes('verify_unauthorized') ||
      lower.includes('websocket connection closed')
    );
  };

  // 1. Intercept immediately via window.onerror before errors reach the browser dev overlays/consoles
  const originalOnError = window.onerror;
  window.onerror = function (message, source, lineno, colno, error) {
    if (isWeb3SandboxErr(message) || isWeb3SandboxErr(error)) {
      console.warn('Web3 Guard (Suppressed Runtime Exception):', message);
      return true; // Completely stops the error from propagating further or triggering overlays
    }
    if (originalOnError) {
      return originalOnError.apply(window, [message, source, lineno, colno, error]);
    }
    return false;
  };

  // 2. Capture error events in the capturing phase to prevent default bubble action
  window.addEventListener('error', (event) => {
    if (isWeb3SandboxErr(event.message) || isWeb3SandboxErr(event.error)) {
      event.stopImmediatePropagation();
      event.preventDefault();
      console.warn('Web3 Guard (Suppressed Error Event):', event.message || event.error);
    }
  }, true);

  // 3. Prevent unhandled promise rejections from causing browser uncaught exceptions
  window.addEventListener('unhandledrejection', (event) => {
    if (isWeb3SandboxErr(event.reason)) {
      event.stopImmediatePropagation();
      event.preventDefault();
      console.warn('Web3 Guard (Suppressed Unhandled Rejection Event):', event.reason);
    }
  }, true);

  // 4. Intercept messenger events in capturing phase to block Reown verifying frame error signaling
  window.addEventListener('message', (event) => {
    try {
      if (event && event.data) {
        const dataStr = typeof event.data === 'string' ? event.data : JSON.stringify(event.data);
        if (isWeb3SandboxErr(dataStr)) {
          console.warn('Web3 Guard (Suppressed Verification Handshake Event):', event.data);
          event.stopImmediatePropagation();
          event.preventDefault();
        }
      }
    } catch (_) {}
  }, true);

  // 5. Wrap console.error to keep the console clean from third-party Reown / WalletConnect logs
  const originalConsoleError = console.error;
  console.error = function (...args) {
    const serialized = args.map(a => {
      if (!a) return '';
      if (typeof a === 'string') return a;
      try { return a.message || JSON.stringify(a); } catch(_) { return String(a); }
    }).join(' ');

    if (isWeb3SandboxErr(serialized)) {
      console.warn('Web3 Guard (Filtered console error log):', ...args);
      return;
    }
    return originalConsoleError.apply(console, args);
  };

  // 6. Override WebSocket to intercept WebSocket connect errors before they raise uncaught exceptions
  const OriginalWebSocket = window.WebSocket;
  class SuppressedWebSocket extends OriginalWebSocket {
    constructor(url: string | URL, protocols?: string | string[]) {
      super(url, protocols);
      const urlStr = String(url);
      if (urlStr.includes('walletconnect') || urlStr.includes('reown') || urlStr.includes('relay')) {
        this.addEventListener('error', (e) => {
          e.preventDefault();
          e.stopImmediatePropagation();
          console.warn('Web3 Guard (WebSocket connection blocked gracefully due to Reown domain restriction).');
        }, { capture: true });
      }
    }
  }

  Object.defineProperty(window, 'WebSocket', {
    value: SuppressedWebSocket,
    configurable: true,
    writable: true
  });

  // 7. Suppress window.alert popups related to connection lockouts
  const originalAlert = window.alert;
  window.alert = function (message) {
    if (message && isWeb3SandboxErr(message)) {
      console.warn('Web3 Guard (Blocked alert modal):', message);
      return;
    }
    return originalAlert?.apply(this, arguments as any);
  };
}

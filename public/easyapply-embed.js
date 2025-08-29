/**
 * EasyApply embed loader with JWT bridge (parent side)
 */
(function () {
  function getScript() { return document.currentScript || (function(){ var ss=document.getElementsByTagName('script'); return ss[ss.length-1]; })(); }
  function parseOriginFromSrc(src) { try { var u=new URL(src, window.location.href); return (u.origin || '').replace(/\/$/, ''); } catch(_) { return (window.EASYAPPLY_ORIGIN || '').replace(/\/$/, ''); }
  }

  function inject(slug, options) {
    var s = getScript();
    var appOrigin = (options && options.origin) || window.EASYAPPLY_ORIGIN || parseOriginFromSrc(s && s.src || '') || (window.location.origin || '');
    var container = (options && options.container) || (s && (s.getAttribute('data-target') ? document.querySelector(s.getAttribute('data-target')) : s.parentElement)) || document.body;
    var minHeightAttr = (options && options.minHeight) || (s && s.getAttribute('data-height')) || '400px';
    var debug = !!((options && options.debug) || (s && s.getAttribute('data-debug')) || window.EASYAPPLY_DEBUG);

    var iframe = document.createElement('iframe');
    var src = appOrigin.replace(/\/$/, '') + '/embed/' + encodeURIComponent(slug) + (debug ? '?ea_debug=1' : '');
    iframe.src = src;
    iframe.style.width = '100%';
    iframe.style.border = '0';
    iframe.style.minHeight = minHeightAttr;
    iframe.loading = 'lazy';
    iframe.setAttribute('allowtransparency', 'true');

    function log(){ if(debug) try{ console.log.apply(console, ['[EA EMBED]'].concat([].slice.call(arguments))); }catch(_){} }

    function postJWT() {
      try {
        var jwt = (window.localStorage && window.localStorage.getItem('wp_jwt')) || null;
        if (!jwt) {
          // Fallback: read from cookie set by bridge (works in incognito/partitioned scenarios as long as same-site)
          try {
            var m = document.cookie.match(/(?:^|; )ea_jwt=([^;]+)/);
            if (m) jwt = decodeURIComponent(m[1]);
          } catch(_) {}
        }
        iframe.contentWindow && iframe.contentWindow.postMessage({ type: 'EA_JWT', jwt: jwt }, appOrigin);
        log('sent EA_JWT');
      } catch (e) { log('EA_JWT error', e && (e.message||e)); }
    }

    async function tryAcquireJWTFromSessionCreds() {
      try {
        var exists = (window.localStorage && window.localStorage.getItem('wp_jwt')) || document.cookie.indexOf('ea_jwt=') >= 0;
        if (exists) return;
        var raw = null;
        try { raw = sessionStorage.getItem('ea_jwt_creds'); } catch(_) {}
        if (!raw) return;
        var parsed = null; try { parsed = JSON.parse(raw); } catch(_) {}
        if (!parsed || !parsed.u || !parsed.p) return;
        if (parsed.ts && (Date.now() - parsed.ts) > 2 * 60 * 1000) return; // stale
        var url = (window.location.origin || '') + '/wp-json/jwt-auth/v1/token';
        var res = await fetch(url, { method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'}, body:new URLSearchParams({ username: parsed.u, password: parsed.p }) });
        var data = await res.json().catch(function(){ return {}; });
        if (data && data.token) {
          try { window.localStorage && window.localStorage.setItem('wp_jwt', data.token); } catch(_){ }
          try { document.cookie = 'ea_jwt=' + encodeURIComponent(data.token) + '; path=/; SameSite=Lax'; } catch(_){ }
          try { sessionStorage.removeItem('ea_jwt_creds'); } catch(_){ }
          log('acquired JWT post-redirect');
          postJWT();
          try { window.dispatchEvent(new CustomEvent('ea:jwt:updated')); } catch(_) {}
        }
      } catch(_) {}
    }

    function onMessage(event) {
      // only accept messages from the app origin
      if (!event || event.origin !== appOrigin) return;
      var data = event.data || {};
      if (data.type === 'EA_RESIZE' && typeof data.height === 'number') {
        iframe.style.height = data.height + 'px';
      } else if (data.type === 'EA_REQUEST_JWT') {
        postJWT();
      } else if (data.type === 'EA_REDIRECT' && typeof data.url === 'string') {
        try { window.location.href = data.url; } catch(_) {}
      }
    }
    window.addEventListener('message', onMessage);
    // if login happens on the same page, forward the new token automatically
    try {
      window.addEventListener('storage', function (ev) {
        if (ev && ev.key === 'wp_jwt') postJWT();
      });
      // Also listen for a same-tab custom event emitted by the bridge
      window.addEventListener('ea:jwt:updated', function(){ postJWT(); });
      // After redirect, attempt to acquire JWT using saved credentials
      tryAcquireJWTFromSessionCreds();
      setTimeout(tryAcquireJWTFromSessionCreds, 1200);
    } catch(_) {}

    iframe.addEventListener('load', function(){
      try {
        // handshake & initial JWT
        iframe.contentWindow && iframe.contentWindow.postMessage({ type: 'EA_PARENT_READY', origin: window.location.origin }, appOrigin);
        postJWT();
        // Poll for a short window after load and after navigation
        var tries = 0; var t = setInterval(function(){ tries++; postJWT(); if (tries > 20) clearInterval(t); }, 500);
      } catch(e) { log('handshake error', e && (e.message||e)); }
    });

    container && container.appendChild(iframe);
    return iframe;
  }

  function auto() {
    var s = getScript(); if (!s) return;
    var slug = s.getAttribute('data-slug'); if (!slug) return;
    inject(slug, {});
  }

  window.EasyApplyEmbed = { inject: inject };
  auto();
})();



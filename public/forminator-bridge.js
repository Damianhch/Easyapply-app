(function () {
  var ORIGIN = (window.EASYAPPLY_ORIGIN || window.location.origin).replace(/\/$/, '');
  var DEBUG = !!(window.EASYAPPLY_DEBUG || /[?&]ea_debug=1\b/i.test(window.location.search));

  function log() { if (DEBUG) { try { console.log.apply(console, ['[ForminatorBridge]'].concat([].slice.call(arguments))); } catch (_) {} } }
  function warn() { if (DEBUG) { try { console.warn.apply(console, ['[ForminatorBridge]'].concat([].slice.call(arguments))); } catch (_) {} } }

  function qv(sel) {
    var el = document.querySelector(sel);
    if (!el) return '';
    if (el.type === 'checkbox') return !!el.checked;
    return (el.value || '').trim();
  }

  function buildBody() {
    var fullName = (qv('.ea-name') + ' ' + qv('.ea-last-name')).trim();
    if (!fullName) fullName = qv('.ea-fullname');
    var email = qv('.ea-user-email') || qv('.ea-email');
    var position = qv('.ea-position');
    var company = qv('.ea-company');
    var acceptedTerms = !!qv('.ea-accepted-terms');
    var acceptedTimestamp = new Date().toISOString();
    return {
      fullName: fullName,
      email: email,
      position: position,
      company: company,
      acceptedTerms: acceptedTerms,
      acceptedTimestamp: acceptedTimestamp
    };
  }

  function pick(selArr) {
    for (var i=0;i<selArr.length;i++){ var el=document.querySelector(selArr[i]); if(el) return el; }
    return null;
  }

  function setCookie(name, value) {
    try { document.cookie = name + '=' + encodeURIComponent(value) + '; path=/; SameSite=Lax'; } catch(_) {}
  }

  // Snapshot credentials at submit time so we still have them after Forminator clears fields
  var lastSubmittedCreds = { username: '', password: '' };
  document.addEventListener('submit', function (ev) {
    try {
      var u = pick(['.ea-login-username', '.ea-user-email', 'input[type="email"]', 'input[name*="email" i]', 'input[name*="user" i]', 'input[name*="login" i]']);
      var p = pick(['.ea-login-password', '.ea-password', 'input[type="password"]', 'input[name*="pass" i]']);
      lastSubmittedCreds.username = (u && u.value) || '';
      lastSubmittedCreds.password = (p && p.value) || '';
    } catch(_) {}
  }, true);

  async function trySetJWTFromForm() {
    try {
      // Prefer explicit classes, fallback to common selectors
      var u = pick(['.ea-login-username', '.ea-user-email', 'input[type="email"]', 'input[name*="email" i]', 'input[name*="user" i]', 'input[name*="login" i]']);
      var p = pick(['.ea-login-password', '.ea-password', 'input[type="password"]', 'input[name*="pass" i]']);
      var username = (u && u.value) || lastSubmittedCreds.username || '';
      var password = (p && p.value) || lastSubmittedCreds.password || '';
      if (!username || !password) { log('no credentials found for JWT fetch'); return; }
      var url = (window.location.origin || '') + '/wp-json/jwt-auth/v1/token';
      log('fetch JWT', url);
      var res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ username: username, password: password })
      });
      var data = await res.json().catch(function(){ return {}; });
      if (data && data.token) {
        window.localStorage && window.localStorage.setItem('wp_jwt', data.token);
        setCookie('ea_jwt', data.token);
        log('stored wp_jwt');
        // Immediately push to any EA iframes on the page (storage event won't fire in same tab)
        try {
          var iframes = document.querySelectorAll('iframe[src*="/embed/"]');
          for (var i=0;i<iframes.length;i++) {
            var ifr = iframes[i];
            if (ifr && ifr.contentWindow) {
              ifr.contentWindow.postMessage({ type: 'EA_JWT', jwt: data.token }, ORIGIN);
            }
          }
          // Also emit a local event so the loader can react
          window.dispatchEvent(new CustomEvent('ea:jwt:updated'));
        } catch(_) {}
      } else {
        warn('JWT fetch failed', { status: res.status, data: data });
      }
    } catch (e) { warn('JWT fetch error', e && (e.message || e)); }
  }

  async function postApplication() {
    var token = (window.localStorage && window.localStorage.getItem('wp_jwt')) || '';
    if (!token) { warn('Missing JWT (localStorage.wp_jwt)'); }

    var body = buildBody();
    var missing = [];
    if (!body.fullName) missing.push('ea-name/ea-last-name or ea-fullname');
    if (!body.email) missing.push('ea-user-email or ea-email');
    if (!body.position) missing.push('ea-position');
    if (!body.company) missing.push('ea-company');
    if (missing.length) {
      warn('Missing required fields:', missing.join(', '));
    }

    var url = ORIGIN + '/api/applications';
    var reqId = 'ea-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
    log('POST', url, body, 'reqId=', reqId);
    try {
      var res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': token ? ('Bearer ' + token) : '',
          'Content-Type': 'application/json',
          'X-EA-Request-ID': reqId
        },
        credentials: 'include',
        body: JSON.stringify(body)
      });
      var text = await res.text();
      var data;
      try { data = JSON.parse(text); } catch (_) { data = { raw: text }; }
      if (!res.ok) {
        warn('API error', res.status, data);
      } else {
        log('API ok', data);
      }
      window.dispatchEvent(new CustomEvent('ea:submit:result', { detail: { ok: res.ok, status: res.status, data: data, requestId: reqId } }));
    } catch (e) {
      warn('Network error', e && (e.message || e));
      window.dispatchEvent(new CustomEvent('ea:submit:result', { detail: { ok: false, error: String(e && (e.message || e)), requestId: reqId } }));
    }
  }

  // Prefer Forminator event; also expose a manual trigger
  document.addEventListener('forminator:form:submit:success', function () {
    log('Forminator success event caught');
    postApplication();
    // Also attempt to store JWT if credentials are present on the same form/page
    trySetJWTFromForm();
  });
  window.EasyApplyBridge = { submit: postApplication };

  // Optional debug button
  if (DEBUG) {
    var btn = document.createElement('button');
    btn.textContent = 'EA Debug Submit';
    btn.style.position = 'fixed';
    btn.style.bottom = '12px';
    btn.style.right = '12px';
    btn.style.zIndex = 99999;
    btn.onclick = postApplication;
    document.addEventListener('DOMContentLoaded', function () { document.body.appendChild(btn); });
  }
})();



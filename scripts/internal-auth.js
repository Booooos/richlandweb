(function () {
  const STORAGE_KEY = "richland.internalAuth";

  function apiBaseUrl() {
    return (
      (window.RICHLAND_CONFIG && window.RICHLAND_CONFIG.apiBaseUrl) ||
      "http://localhost:8787"
    ).replace(/\/$/, "");
  }

  function readSession() {
    try {
      return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "null");
    } catch (error) {
      return null;
    }
  }

  function writeSession(session) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }

  function clearSession() {
    window.localStorage.removeItem(STORAGE_KEY);
  }

  function loginUrl() {
    const next = encodeURIComponent(window.location.pathname + window.location.search);
    return `internal-login.html?next=${next}`;
  }

  function redirectToLogin() {
    window.location.href = loginUrl();
  }

  async function login(email, password) {
    let response;
    try {
      response = await fetch(`${apiBaseUrl()}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({ email, password })
      });
    } catch (error) {
      throw new Error("Ops backend is not reachable. Start the local backend on port 8787 and try again.");
    }
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload && payload.error ? payload.error : "Login failed");
    }
    const session = {
      token: payload.token,
      user: payload.user,
      roleAccess: payload.roleAccess
    };
    writeSession(session);
    return session;
  }

  async function me() {
    const session = readSession();
    if (!session || !session.token) {
      throw new Error("No active session");
    }
    let response;
    try {
      response = await fetch(`${apiBaseUrl()}/api/auth/me`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${session.token}`
        }
      });
    } catch (error) {
      throw new Error("Ops backend is not reachable. Start the local backend and reload this page.");
    }
    const payload = await response.json();
    if (!response.ok) {
      clearSession();
      throw new Error(payload && payload.error ? payload.error : "Session expired");
    }
    const nextSession = {
      token: session.token,
      user: payload.user,
      roleAccess: payload.roleAccess
    };
    writeSession(nextSession);
    return nextSession;
  }

  async function requireSession() {
    try {
      return await me();
    } catch (error) {
      redirectToLogin();
      throw error;
    }
  }

  async function fetchInternal(path, options = {}) {
    const session = readSession();
    if (!session || !session.token) {
      redirectToLogin();
      throw new Error("No active session");
    }
    let response;
    try {
      response = await fetch(`${apiBaseUrl()}${path}`, {
        ...options,
        headers: {
          Accept: "application/json",
          ...(options.body ? { "Content-Type": "application/json" } : {}),
          ...(options.headers || {}),
          Authorization: `Bearer ${session.token}`
        }
      });
    } catch (error) {
      throw new Error("Ops backend is not reachable. Start the local backend and refresh this page.");
    }
    if (response.status === 401) {
      clearSession();
      redirectToLogin();
      throw new Error("Login required");
    }
    return response;
  }

  function logout() {
    clearSession();
    redirectToLogin();
  }

  window.RichlandInternalAuth = {
    apiBaseUrl,
    readSession,
    writeSession,
    clearSession,
    login,
    me,
    requireSession,
    fetchInternal,
    logout,
    loginUrl
  };
})();

(function () {
  const form = document.querySelector("[data-login-form]");
  const message = document.querySelector("[data-login-message]");
  const params = new URLSearchParams(window.location.search);
  const next = params.get("next") || "internal-portal.html";
  const i18n = window.RichlandInternalI18n;

  function showMessage(text) {
    if (!message) return;
    message.className = "message is-visible is-danger";
    message.textContent = text;
  }

  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");
    const submitButton = form.querySelector("button[type='submit']");

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = i18n ? i18n.t("ui.signingIn") : "Signing in...";
    }

    try {
      await window.RichlandInternalAuth.login(email, password);
      window.location.href = next;
    } catch (error) {
      showMessage(error.message || (i18n ? i18n.t("login.error") : "Login failed."));
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = i18n ? i18n.t("ui.loginToOps") : "Login to Ops";
      }
    }
  });
})();

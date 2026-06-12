(function () {
  const form = document.querySelector("[data-job-contact-form]");
  if (!form) return;

  const i18n = window.RICHLAND_I18N || null;
  const endpoint = window.RICHLAND_CONFIG && window.RICHLAND_CONFIG.formspreeEndpoint;
  const status = form.querySelector("[data-job-form-status]");
  const submitButton = form.querySelector("[data-job-submit-button]");
  const controls = Array.from(form.querySelectorAll("input, textarea, select, button"));
  const emailInput = form.querySelector('input[name="email"]');
  const phoneInput = form.querySelector('input[name="phoneOrWechat"]');
  const defaultButtonLabel = submitButton ? submitButton.textContent.trim() : "";
  let isSubmitting = false;

  function setStatus(message, type) {
    if (!status) return;
    status.textContent = message || "";
    status.hidden = !message;
    status.dataset.state = type || "";
  }

  function toggleSubmitting(nextState) {
    isSubmitting = nextState;
    controls.forEach((control) => {
      control.disabled = nextState;
    });

    if (submitButton) {
      submitButton.textContent = nextState
        ? (i18n ? i18n.getUiText("sending") : "Sending...")
        : defaultButtonLabel;
      submitButton.setAttribute("aria-busy", nextState ? "true" : "false");
    }
  }

  function validateContactFields() {
    const email = emailInput ? emailInput.value.trim() : "";
    const phone = phoneInput ? phoneInput.value.trim() : "";
    return Boolean(email || phone);
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    const apiBaseUrl = window.RICHLAND_CONFIG && window.RICHLAND_CONFIG.apiBaseUrl;
    const activeEndpoint = apiBaseUrl
      ? String(apiBaseUrl).replace(/\/$/, "") + "/api/job-contacts"
      : endpoint;

    if (!activeEndpoint) {
      setStatus(
        i18n
          ? i18n.getUiText("jobContactConfigError")
          : "Job contact form is not configured yet. Please contact us by email directly.",
        "error"
      );
      return;
    }

    if (!form.reportValidity()) return;

    if (!validateContactFields()) {
      setStatus(
        i18n
          ? i18n.getUiText("jobContactSubmitError")
          : "Your message could not be sent right now. Please try again or contact us by email.",
        "error"
      );
      if (phoneInput) phoneInput.focus();
      return;
    }

    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    payload.formType = "job-contact";
    payload.page = "job";

    setStatus("", "");
    toggleSubmitting(true);

    try {
      const response = await fetch(activeEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error("Submission failed");
      }

      form.reset();
      setStatus(
        i18n
          ? i18n.getUiText("jobContactSuccess")
          : "Your job contact message has been sent. We will review it and get back to you if there is a suitable next step.",
        "success"
      );
    } catch (error) {
      setStatus(
        i18n
          ? i18n.getUiText("jobContactSubmitError")
          : "Your message could not be sent right now. Please try again or contact us by email.",
        "error"
      );
    } finally {
      toggleSubmitting(false);
    }
  });
})();

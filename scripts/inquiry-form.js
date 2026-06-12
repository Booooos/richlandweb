(function () {
  const form = document.querySelector("[data-inquiry-form]");
  if (!form) return;

  const i18n = window.RICHLAND_I18N || null;
  const submitButton = form.querySelector("[data-submit-button]");
  const status = form.querySelector("[data-form-status]");
  const modal = document.querySelector("[data-success-modal]");
  const modalCloseButtons = document.querySelectorAll("[data-modal-close]");
  const categorySelect = form.querySelector('select[name="targetCategory"]');
  const controls = Array.from(
    form.querySelectorAll("input, select, textarea, button")
  );
  const defaultButtonLabel = submitButton ? submitButton.textContent.trim() : "";
  let isSubmitting = false;

  function applyCategoryPrefill() {
    if (!categorySelect) return;
    const params = new URLSearchParams(window.location.search);
    const requestedCategory = params.get("category");
    if (!requestedCategory) return;

    const matchingOption = Array.from(categorySelect.options).find(
      (option) => option.value === requestedCategory || option.text === requestedCategory
    );

    if (matchingOption) {
      categorySelect.value = matchingOption.value || matchingOption.text;
    }
  }

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
      submitButton.disabled = nextState;
      submitButton.textContent = nextState
        ? (i18n ? i18n.getUiText("sending") : "Sending...")
        : defaultButtonLabel;
      submitButton.setAttribute("aria-busy", nextState ? "true" : "false");
    }
  }

  function openModal() {
    if (!modal) return;
    modal.hidden = false;
    document.body.classList.add("modal-open");
    history.replaceState(null, "", "#inquiry");
  }

  function closeModal() {
    if (!modal) return;
    modal.hidden = true;
    document.body.classList.remove("modal-open");
  }

  modalCloseButtons.forEach((button) => {
    button.addEventListener("click", closeModal);
  });

  if (modal) {
    modal.addEventListener("click", (event) => {
      if (event.target === modal) closeModal();
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal && !modal.hidden) {
      closeModal();
    }
  });

  applyCategoryPrefill();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    const apiBaseUrl = window.RICHLAND_CONFIG && window.RICHLAND_CONFIG.apiBaseUrl;
    if (!apiBaseUrl) {
      setStatus(
        i18n
          ? i18n.getUiText("inquiryConfigError")
          : "Inquiry form is not connected to the RichLand backend yet. Please contact us by email.",
        "error"
      );
      return;
    }
    const endpoint = String(apiBaseUrl).replace(/\/$/, "") + "/api/inquiries";

    if (!form.reportValidity()) return;

    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    setStatus("", "");
    toggleSubmitting(true);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json().catch(() => null);
      if (!response.ok || !result || !result.inquiry || !result.inquiry.id) {
        throw new Error("Submission failed");
      }

      form.reset();
      setStatus("", "");
      openModal();
    } catch (error) {
      setStatus(
        i18n
          ? i18n.getUiText("inquirySubmitError")
          : "Your inquiry could not be sent right now. Please try again or contact us by email.",
        "error"
      );
    } finally {
      toggleSubmitting(false);
    }
  });
})();

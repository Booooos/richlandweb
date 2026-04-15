(function () {
  var directory = document.querySelector("[data-footer-directory]");
  if (!directory) return;

  var FOOTER_DIRECTORY = {
    contacts: {
      sales: {
        name: "ZHiHai (Client Manager)",
        phone: "+86-0757-26630638",
        email: "Ht-888@163.com"
      },
      factory: {
        name: "",
        phone: "+86-0757-26657123",
        email: "",
        address: "No. 98 XingMin Road, Hecheng Street, Gaoming District, Foshan, Guangdong, China"
      }
    },
    locations: {
      headquarters: {
        label: "Headquarters",
        address: "KunZhou Industrial Zone, Beijiao Town, Shunde District, Foshan, Guangdong, China",
        phone: "+86-0757-26630638"
      },
      factory: {
        label: "Factory",
        address: "No. 98 XingMin Road, Hecheng Street, Gaoming District, Foshan, Guangdong, China",
        phone: "+86-0757-26657123"
      }
    }
  };

  function buildMapLinks(address) {
    var query = encodeURIComponent(address || "");
    return {
      embed: "https://www.google.com/maps?q=" + query + "&output=embed",
      open: "https://www.google.com/maps/search/?api=1&query=" + query
    };
  }

  function buildTel(phone) {
    return "tel:" + (phone || "").replace(/[^\d+]/g, "");
  }

  function setText(selector, value) {
    var node = directory.querySelector(selector);
    if (node) node.textContent = value || "";
  }

  function setLink(selector, value, href) {
    var node = directory.querySelector(selector);
    if (!node) return;
    node.textContent = value || "";
    node.href = href || "#";
  }

  function setVisibility(selector, isVisible) {
    var node = directory.querySelector(selector);
    if (!node) return;
    node.hidden = !isVisible;
  }

  function renderStaticContacts() {
    var sales = FOOTER_DIRECTORY.contacts.sales;
    var factory = FOOTER_DIRECTORY.contacts.factory;

    setVisibility("[data-sales-name-item]", !!sales.name);
    setVisibility("[data-sales-phone-item]", !!sales.phone);
    setVisibility("[data-sales-email-item]", !!sales.email);
    setVisibility("[data-factory-name-item]", !!factory.name);
    setVisibility("[data-factory-phone-item]", !!factory.phone);
    setVisibility("[data-factory-address-item]", !!factory.address);

    if (sales.name) setText("[data-sales-name]", sales.name);
    if (sales.phone) setLink("[data-sales-phone]", sales.phone, buildTel(sales.phone));
    if (sales.email) setLink("[data-sales-email]", sales.email, "mailto:" + sales.email);

    if (factory.name) setText("[data-factory-name]", factory.name);
    if (factory.phone) setLink("[data-factory-phone]", factory.phone, buildTel(factory.phone));
    if (factory.address) {
      setLink("[data-factory-address]", factory.address, buildMapLinks(factory.address).open);
    }
  }

  function renderLocation(key) {
    var location = FOOTER_DIRECTORY.locations[key];
    if (!location) return;

    var links = buildMapLinks(location.address);

    setText("[data-location-label]", location.label);
    setVisibility("[data-location-address-item]", !!location.address);
    setVisibility("[data-location-phone-item]", !!location.phone);

    if (location.address) {
      setLink("[data-location-address]", location.address, links.open);
    }

    if (location.phone) {
      setLink("[data-location-phone]", location.phone, buildTel(location.phone));
    }

    var map = directory.querySelector("[data-location-map]");
    if (map) {
      map.src = links.embed;
    }

    var open = directory.querySelector("[data-map-open]");
    if (open) {
      open.href = links.open;
    }

    var fallback = directory.querySelector("[data-map-fallback-text]");
    if (fallback) {
      fallback.textContent = location.address
        ? location.label + ": " + location.address
        : "Use the direct Google Maps link if the map preview is unavailable.";
    }

    var tabs = directory.querySelectorAll("[data-location-tab]");
    tabs.forEach(function (tab) {
      var isActive = tab.getAttribute("data-location-tab") === key;
      tab.classList.toggle("is-active", isActive);
      tab.setAttribute("aria-selected", isActive ? "true" : "false");
    });
  }

  renderStaticContacts();
  renderLocation("headquarters");

  directory.querySelectorAll("[data-location-tab]").forEach(function (tab) {
    tab.addEventListener("click", function () {
      renderLocation(tab.getAttribute("data-location-tab"));
    });
  });
})();

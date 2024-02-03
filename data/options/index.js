"use strict";

const toast = document.getElementById("toast");

function restore() {
  chrome.storage.local.get(
    {
      width: 400,
      mheight: 600,
      scale: 1.0,
      "offset-x": 0,
      "offset-y": 0,
      domain: "com",
      "force-inside": true,
      "direct-frame": false,
      "google-page": true,
      "default-action": "open-google",
      "translate-styles": "",
      "hide-translator": true,
      "google-extra": "",
    },
    (prefs) => {
      document.getElementById("force-inside").checked = prefs["force-inside"];
      document.getElementById("width").value = prefs.width;
      document.getElementById("mheight").value = prefs.mheight;
      document.getElementById("scale").value = prefs.scale;
      document.getElementById("offset-x").value = prefs["offset-x"];
      document.getElementById("offset-y").value = prefs["offset-y"];
      document.getElementById("domain").value = prefs.domain;
      document.getElementById("google-page").checked = prefs["google-page"];
      document.getElementById("hide-translator").checked =
        prefs["hide-translator"];
      document.getElementById("google-extra").value = prefs["google-extra"];

      document.getElementById("translate-styles").value =
        prefs["translate-styles"];
    }
  );
}

function save() {
  const prefs = {
    "force-inside": document.getElementById("force-inside").checked,
    width: Math.min(
      Math.max(Number(document.getElementById("width").value), 300),
      2000
    ),
    mheight: Number(document.getElementById("mheight").value),
    scale: Math.min(
      Math.max(parseFloat(document.getElementById("scale").value), 0.5),
      1.0
    ),
    "offset-x": Number(document.getElementById("offset-x").value),
    "offset-y": Number(document.getElementById("offset-y").value),
    domain: document.getElementById("domain").value,
    "google-page": document.getElementById("google-page").checked,
    "default-action": document.getElementById("default-action").value,
    "translate-styles": document.getElementById("translate-styles").value,
    "hide-translator": document.getElementById("hide-translator").checked,
    "google-extra": document.getElementById("google-extra").value,
  };

  chrome.storage.local.set(prefs, () => {
    toast.textContent = "Options saved.";
    setTimeout(() => (toast.textContent = ""), 750);
    restore();
  });
}

document.addEventListener("DOMContentLoaded", restore);
document.getElementById("save").addEventListener("click", () => {
  try {
    save();
  } catch (e) {
    toast.textContent = e.message;
    setTimeout(() => (toast.textContent = ""), 750);
  }
});

chrome.storage.onChanged.addListener((prefs) => {
  const google = prefs["google-page"];
  if (google) {
    if (google.newValue) {
      chrome.contextMenus.create({
        id: "open-google",
        title: "Translate with Google",
        contexts: ["page", "link"],
        documentUrlPatterns: ["*://*/*"],
      });
    } else {
      chrome.contextMenus.remove("open-google");
    }
  }
});

// support
document.getElementById("support").addEventListener("click", () =>
  chrome.tabs.create({
    url: chrome.runtime.getManifest().homepage_url + "?rd=donate",
  })
);
// reset
document.getElementById("reset").addEventListener("click", (e) => {
  if (e.detail === 1) {
    toast.textContent = "Double-click to reset!";
    window.setTimeout(() => (toast.textContent = ""), 750);
  } else {
    localStorage.clear();
    chrome.storage.local.clear(() => {
      chrome.runtime.reload();
      window.close();
    });
  }
});

// links
for (const a of [...document.querySelectorAll("[data-href]")]) {
  if (a.hasAttribute("href") === false) {
    a.href = chrome.runtime.getManifest().homepage_url + "#" + a.dataset.href;
  }
}

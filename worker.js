/* global position */
"use strict";

const open = (tab, query, frameId, permanent = false) =>
  chrome.scripting.executeScript(
    {
      target: {
        tabId: tab.id,
        frameIds: [frameId],
      },
      func: () => ({
        position: typeof position === "undefined" ? null : position,
      }),
    },
    ([{ result }]) => {
      const position = {
        sx: 0,
        sy: 0,
      };
      chrome.storage.local.get(
        {
          width: 400,
          mheight: 600,
          "translate-styles": "",
          scale: 1.0,
          "force-inside": true,
          "hide-translator": true,
          "cambridge-extra": "",
        },
        (prefs) => {
          chrome.windows.get(tab.windowId, async (win) => {
            if (result.position) {
              Object.assign(position, result.position);
            } else {
              position.sx = win.left;
              position.sy = win.top;
            }

            // Avoid popup outside the screen
            if (prefs["force-inside"]) {
              const { height, width, left, top } =
                await chrome.windows.getCurrent();
              position.sy = Math.min(position.sy, top + height - prefs.mheight);
              position.sx = Math.min(position.sx, left + width - prefs.width);
            }

            const url =
              "https://dictionary.cambridge.org/dictionary/english/" +
              encodeURIComponent(query);

            chrome.windows
              .create({
                url,
                left: parseInt(position.sx),
                top: parseInt(position.sy),
                width: parseInt(prefs.width),
                height: parseInt(prefs.mheight),
                type: "popup",
              })
              .catch((e) => {
                console.warn(e);

                return chrome.windows.create({
                  url,
                  width: parseInt(prefs.width),
                  height: parseInt(prefs.mheight),
                  type: "popup",
                });
              })
              .then((w) => {
                prefs.permanent = permanent;
                open.ids[w.tabs[0].id] = prefs;
              });
          });
        }
      );
    }
  );
open.ids = {};

const onMessage = (request, sender, response) => {
  if (request.method === "open-translator") {
    open(sender.tab, request.query, sender.frameId, request.permanent);

    chrome.scripting.executeScript({
      target: {
        tabId: sender.tab.id,
        allFrames: true,
      },
      func: () => {
        try {
          clearTimeout(self.pointer.rid);
          self.pointer.hide();
        } catch (e) {}
      },
    });
  } else if (request.method === "close") {
    chrome.tabs.remove(sender.tab.id);
  } else if (request.method === "extend") {
    response(open.ids[sender.tab.id]);
    delete open.ids[sender.tab.id];
  }
};
chrome.runtime.onMessage.addListener(onMessage);

const onClicked = (info, tab) => {
  if (info.menuItemId === "open-panel") {
    open(tab, info.selectionText, info.frameId);
  } else {
    chrome.storage.local.get(
      {
        "cambridge-extra": "",
      },
      (prefs) => {
        let link = info.linkUrl || info.pageUrl;
        if (link.startsWith("about:reader?url=")) {
          link = decodeURIComponent(link.replace("about:reader?url=", ""));
        }
        let url = `https://dictionary.cambridge.org/dictionary/english/${info.selectionText}`;
      }
    );
  }
};

/* context menu */
{
  const onStartup = () => {
    chrome.storage.local.get(
      {
        "cambridge-page": true,
      },
      (prefs) => {
        if (prefs["cambridge-page"]) {
          chrome.contextMenus.create(
            {
              id: "open-cambridge",
              title: " Look the word up in cambridge dictionary.",
              contexts: ["page", "link"],
              documentUrlPatterns: ["*://*/*"],
            },
            () => chrome.runtime.lastError
          );
        }
      }
    );
  };
  chrome.runtime.onInstalled.addListener(onStartup);
  chrome.runtime.onStartup.addListener(onStartup);
}
chrome.contextMenus.onClicked.addListener(onClicked);

chrome.action.onClicked.addListener((tab) =>
  chrome.storage.local.get(
    {
      "default-action": "open-cambridge",
    },
    (prefs) =>
      onClicked(
        {
          menuItemId: prefs["default-action"],
          pageUrl: tab.url,
        },
        tab
      )
  )
);

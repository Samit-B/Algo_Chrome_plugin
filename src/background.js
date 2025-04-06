import Client from './client.js';
import { openSidePanel, getBrowserType, toggleSidebar } from './utils.js';

const rateLimiter = {
  lastRequest: 0,
  minDelay: 1000, // 1 second between requests
  pendingRequests: new Map()
};

async function sendToAPI(content) {
  const apiUrl = "http://localhost:8000/chat/query"; // FastAPI endpoint

  try {
    const queryParams = new URLSearchParams({
      userChatQuery: `${content.context}\n\n${content.question}`,
    });

    const response = await fetch(`${apiUrl}?${queryParams.toString()}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || "Failed to fetch response");

    return { success: true, message: data.response };
  } catch (error) {
    return { success: false, error: error.message || "API request failed" };
  }
}

// Message listener to handle API requests
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "sendToAPI") {
    sendToAPI(request.content)
      .then(sendResponse)
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true; // Keep the message channel open for async response
  }
});

// Listen for settings changes and notify all tabs
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync') {
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        try {
          chrome.tabs.sendMessage(tab.id, {
            action: 'settingsUpdated',
            changes
          });
        } catch (error) {
          console.debug('Could not send to tab:', tab.id);
        }
      });
    });
  }
});

// Handle extension icon click to open the sidebar or popup
chrome.action.onClicked.addListener(async (tab) => {
  if (tab.url.startsWith('chrome://') || tab.url.startsWith('about:')) {
    return; // Can't open on browser internal URLs
  }

  try {
    await openSidePanel(tab);
  } catch (error) {
    console.error('Failed to open panel:', error);
    chrome.windows.create({
      url: 'popup.html',
      type: 'popup',
      width: 400,
      height: 600
    });
  }
});

// Firefox-specific sidebar handling
if (getBrowserType() === 'firefox') {
  browser.browserAction.onClicked.addListener(async () => {
    try {
      const currentWindow = await browser.windows.getCurrent();
      await browser.sidebarAction.close();
      await new Promise(resolve => setTimeout(resolve, 250));
      await browser.sidebarAction.open({ windowId: currentWindow.id });
    } catch (error) {
      console.error('Failed to toggle sidebar:', error);
      browser.windows.create({
        url: 'popup.html',
        type: 'popup',
        width: 400,
        height: 600
      });
    }
  });

  // Initialize sidebar on install for Firefox
  browser.runtime.onInstalled.addListener(() => {
    browser.sidebarAction.open();
  });
}

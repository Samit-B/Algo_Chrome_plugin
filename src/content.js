import { browserAPI } from './utils.js';

// Global state
const state = {
  port: null,
  selectedText: '',
  pageText: ''
};

function connectToExtension() {
  // Only create connection if it doesn't exist or is disconnected
  if (!state.port || state.port.disconnected) {
    try {
      state.port = browserAPI.runtime.connect({ name: 'content-script' });
      state.port.onDisconnect.addListener(() => {
        state.port.disconnected = true;
      });
    } catch (error) {
      console.error('Connection error:', error);
    }
  }
}

function sanitizeContent(text) {
  // Remove potentially dangerous characters/scripts
  return text
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/[^\w\s.,!?-]/g, ' ')
    .trim();
}

function getPageContent() {
  const selectedText = window.getSelection().toString().trim();
  let content = '';
  
  if (selectedText) {
    state.selectedText = selectedText;
    content = selectedText;
  } else {
    content = Array.from(document.body.getElementsByTagName('*'))
      .filter(element => {
        const style = window.getComputedStyle(element);
        return style.display !== 'none' && 
               style.visibility !== 'hidden' && 
               !element.hidden;
      })
      .map(element => {
        return Array.from(element.childNodes)
          .filter(node => node.nodeType === Node.TEXT_NODE)
          .map(node => node.textContent.trim())
          .join(' ');
      })
      .filter(text => text.length > 0)
      .join('\n')
      .replace(/[\s\n]+/g, ' ')
      .trim();
    
    state.pageText = content;
  }
  
  return sanitizeContent(content);
}

// Message listener
browserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getContent') {
    connectToExtension();
    sendResponse({ content: getPageContent() });
    return true;
  }
});
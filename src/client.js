import { getToken } from './utils.js';

class Client {
  constructor(config) {
    this.baseURL = config.baseURL;
    this.chat = {
      completions: {
        create: this.createChatCompletion.bind(this)
      }
    };
  }

  async createChatCompletion(params) {
    const token = await getToken();
    if (!token) {
      throw new Error('API token not found');
    }

    const response = await fetch(`${this.baseURL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        model: params.model,
        messages: params.messages,
        max_tokens: params.max_tokens
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: 'API request failed' } }));
      throw new Error(error.error?.message || 'API request failed');
    }

    return response.json();
  }
}

export default Client;

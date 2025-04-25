import axios from 'axios';

const GRAPH_BASE_URL = 'https://graph.microsoft.com/v1.0';

export class OutlookService {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${GRAPH_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Microsoft Graph API error: ${response.statusText}`);
    }

    return response.json();
  }

  async createDraft(to: string, subject: string, content: string): Promise<string> {
    const response = await this.request<{ id: string }>('/me/messages', {
      method: 'POST',
      body: JSON.stringify({
        subject,
        toRecipients: [{ emailAddress: { address: to } }],
        body: {
          contentType: 'HTML',
          content
        },
        isDraft: true
      })
    });

    return response.id;
  }
}
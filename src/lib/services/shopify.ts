import { saveIntegration } from './integrations';

export class ShopifyService {
  static async connect(userId: string, shopDomain: string, accessToken: string) {
    try {
      // Clean and validate the shop domain
      const cleanShopDomain = shopDomain.toLowerCase().trim();
      
      // Validate the shop domain format
      if (!cleanShopDomain.match(/^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/)) {
        throw new Error('Invalid Shopify store URL format. Please use your-store.myshopify.com format.');
      }

      // Save integration
      await saveIntegration(userId, 'shopify', {
        accessToken,
        shopDomain: cleanShopDomain
      });

      return { name: cleanShopDomain };
    } catch (error) {
      console.error('Shopify connection error:', error);
      throw error;
    }
  }
}
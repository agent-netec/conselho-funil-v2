import { MonaraTokenVault } from '../../firebase/vault';
import { PersonalizationMaestro } from '../../intelligence/personalization/maestro';
import { Timestamp } from 'firebase/firestore';

/**
 * @fileoverview Instagram Adapter (ST-20.2)
 * Gerencia interações via Instagram Graph API (DMs e Comentários).
 */

export class InstagramAdapter {
  private brandId: string;

  constructor(brandId: string) {
    this.brandId = brandId;
  }

  private async getAccessToken(): Promise<string> {
    const token = await MonaraTokenVault.getToken(this.brandId, 'instagram');
    if (!token) throw new Error(`Instagram Access Token not found for brand ${this.brandId}`);
    return token.accessToken;
  }

  /**
   * Envia uma DM para um lead.
   */
  async sendDM(recipientId: string, text: string): Promise<boolean> {
    const token = await this.getAccessToken();
    
    try {
      console.log(`[InstagramAdapter] Sending DM to ${recipientId}: ${text}`);
      // Implementação real: POST /me/messages
      return true;
    } catch (error) {
      console.error('[InstagramAdapter] Error sending DM:', error);
      return false;
    }
  }

  /**
   * Processa um webhook de mensagem recebida.
   */
  async handleIncomingMessage(senderId: string, text: string): Promise<void> {
    console.log(`[InstagramAdapter] Received message from ${senderId}: ${text}`);
    
    // Alimentar o Maestro com a interação
    await PersonalizationMaestro.processInteraction(this.brandId, senderId, {
      type: 'dm_received',
      platform: 'instagram',
      timestamp: Timestamp.now(),
      metadata: { text }
    });
  }

  /**
   * Processa um webhook de comentário recebido.
   */
  async handleIncomingComment(senderId: string, commentId: string, text: string, mediaId: string): Promise<void> {
    console.log(`[InstagramAdapter] Received comment from ${senderId} on ${mediaId}: ${text}`);
    
    await PersonalizationMaestro.processInteraction(this.brandId, senderId, {
      type: 'comment_made',
      platform: 'instagram',
      timestamp: Timestamp.now(),
      metadata: { commentId, text, mediaId }
    });
  }
}

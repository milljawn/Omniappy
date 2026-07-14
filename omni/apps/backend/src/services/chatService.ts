import { ChatMessage } from "@omni/shared";
import crypto from "crypto";

export interface ReadReceipt {
  messageId: string;
  parentProfileId: string;
  parentName: string;
  acknowledged: boolean;
  acknowledgedAt: Date | null;
}

export class ChatService {
  // Local simulated ledger for emergency alerts read receipts (Story 4.3)
  private static receiptsLedger: Map<string, ReadReceipt[]> = new Map();

  /**
   * Dispatches messages. If marked isEmergency, triggers SMS and logs receipt trackers.
   */
  public static async broadcastMessage(
    groupId: string,
    senderId: string,
    senderName: string,
    text: string,
    isEmergency: boolean,
    rosterParentIds: { id: string; name: string }[]
  ): Promise<{ message: ChatMessage; emergencyReceipts?: ReadReceipt[] }> {
    const message: ChatMessage = {
      id: crypto.randomUUID(),
      groupId,
      senderId,
      senderName,
      text,
      isEmergency,
      createdAt: new Date(),
    };

    if (isEmergency) {
      // Simulate SMS dispatch bypass for emergency alerts
      console.log(`[SMS Broadcast] Dispatched Emergency cancellation SMS to parents:`, rosterParentIds.map(p => p.name));
      
      // Initialize read receipts audit ledger (Story 4.3)
      const receipts: ReadReceipt[] = rosterParentIds.map((parent) => ({
        messageId: message.id,
        parentProfileId: parent.id,
        parentName: parent.name,
        acknowledged: false,
        acknowledgedAt: null,
      }));

      this.receiptsLedger.set(message.id, receipts);
      return { message, emergencyReceipts: receipts };
    }

    return { message };
  }

  public static acknowledgeMessage(messageId: string, parentProfileId: string): boolean {
    const receipts = this.receiptsLedger.get(messageId);
    if (!receipts) return false;

    const record = receipts.find((r) => r.parentProfileId === parentProfileId);
    if (record) {
      record.acknowledged = true;
      record.acknowledgedAt = new Date();
      return true;
    }
    return false;
  }

  public static getReadReceipts(messageId: string): ReadReceipt[] {
    return this.receiptsLedger.get(messageId) || [];
  }
}

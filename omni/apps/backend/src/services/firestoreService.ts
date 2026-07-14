import { Firestore } from "@google-cloud/firestore";
import { ChatMessage } from "@omni/shared";

export class FirestoreService {
  private static firestore: Firestore | null = null;

  private static getClient(): Firestore | null {
    if (this.firestore) return this.firestore;
    
    // Lazily initialize to prevent errors if running locally without GCP context
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GCP_PROJECT_ID) {
      try {
        this.firestore = new Firestore({
          projectId: process.env.GCP_PROJECT_ID,
        });
        console.log("[GCP Firestore] Client initialized successfully.");
        return this.firestore;
      } catch (error) {
        console.warn("[GCP Firestore] Failed to initialize Firestore client:", error);
        return null;
      }
    }
    return null;
  }

  /**
   * Streams a real-time message to Firestore NoSQL collection for instant syncing.
   */
  public static async streamMessageToFirestore(message: ChatMessage): Promise<void> {
    const db = this.getClient();
    if (db) {
      try {
        const docRef = db.collection("activity_groups")
          .doc(message.groupId)
          .collection("chat_messages")
          .doc(message.id);
        
        await docRef.set({
          senderId: message.senderId,
          senderName: message.senderName,
          text: message.text,
          isEmergency: message.isEmergency,
          createdAt: message.createdAt.toISOString(),
        });
        
        console.log(`[GCP Firestore] Message streamed successfully to group collection: ${message.groupId}`);
      } catch (error) {
        console.error("[GCP Firestore] Failed to write message stream document:", error);
      }
    } else {
      console.log(`[GCP Firestore Mock] Streamed chat message: "${message.text}" for group: ${message.groupId}`);
    }
  }
}

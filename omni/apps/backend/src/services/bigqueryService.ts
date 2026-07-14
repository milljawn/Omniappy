import { BigQuery } from "@google-cloud/bigquery";
import { Offer } from "@omni/shared";

export class BigQueryService {
  private static bq: BigQuery | null = null;
  private static DATASET_ID = "omni_audit_ledger";
  private static TABLE_ID = "placement_offers";

  private static getClient(): BigQuery | null {
    if (this.bq) return this.bq;

    if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GCP_PROJECT_ID) {
      try {
        this.bq = new BigQuery({
          projectId: process.env.GCP_PROJECT_ID,
        });
        console.log("[GCP BigQuery] Client initialized successfully.");
        return this.bq;
      } catch (error) {
        console.warn("[GCP BigQuery] Failed to initialize BigQuery client:", error);
        return null;
      }
    }
    return null;
  }

  /**
   * Appends financial placement offer transactions to Google BigQuery for big-data ledger analytics.
   */
  public static async logOfferTransactionToBigQuery(offer: Offer): Promise<void> {
    const bqClient = this.getClient();
    if (bqClient) {
      try {
        const rows = [
          {
            offer_id: offer.id,
            player_profile_id: offer.playerProfileId,
            doc_url: offer.docUrl,
            status: offer.status,
            price_cents: offer.priceCents,
            stripe_invoice_id: offer.stripeInvoiceId || "",
            created_at: offer.createdAt.toISOString(),
            logged_at: new Date().toISOString(),
          },
        ];
        
        await bqClient
          .dataset(this.DATASET_ID)
          .table(this.TABLE_ID)
          .insert(rows);
        
        console.log(`[GCP BigQuery] Inserted placement offer ledger event into BigQuery: ${offer.id}`);
      } catch (error) {
        console.error("[GCP BigQuery] Failed to insert ledger row:", error);
      }
    } else {
      console.log(`[GCP BigQuery Mock] Logged transaction to analytics ledger. Offer: ${offer.id}, Status: ${offer.status}, Price: $${(offer.priceCents/100).toFixed(2)}`);
    }
  }
}

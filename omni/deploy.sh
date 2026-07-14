#!/bin/bash
set -e

# Omni Google Cloud Hardened Free-Tier Auto-Deploy Script
# Designed to run inside Google Cloud Shell

# 1. Detect active project ID
PROJECT_ID=$(gcloud config get-value project)
echo "🚀 Starting Omni deployment on Google Cloud project: ${PROJECT_ID}"

# 2. Enable necessary APIs
echo "⚙️ Enabling Google Cloud Run, Firestore, BigQuery, and Compute Engine APIs..."
gcloud services enable run.googleapis.com \
                         firestore.googleapis.com \
                         bigquery.googleapis.com \
                         compute.googleapis.com

# 3. Create relational PostgreSQL database VM (e.g. Always Free e2-micro instance)
echo "💾 Provisioning Always Free tier e2-micro database instance (omni-postgres-db)..."
if ! gcloud compute instances describe omni-postgres-db --zone=us-central1-a >/dev/null 2>&1; then
  gcloud compute instances create omni-postgres-db \
    --zone=us-central1-a \
    --machine-type=e2-micro \
    --image-family=debian-11 \
    --image-project=debian-cloud \
    --boot-disk-size=30GB \
    --metadata=startup-script="sudo apt-get update && sudo apt-get install -y postgresql postgresql-contrib"
  echo "✅ Database VM created successfully."
else
  echo "ℹ️ Database VM already exists. Skipping provision."
fi

# 4. Deploy secured Fastify API server to Google Cloud Run
echo "⚡ Deploying Fastify API backend server to Google Cloud Run..."
gcloud run deploy omni-backend \
  --source . \
  --port 8080 \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GCP_PROJECT_ID="${PROJECT_ID}"

# 5. Deploy Next.js Web Console to Google Cloud Run
echo "🖥️ Deploying Next.js desktop web console to Google Cloud Run..."
gcloud run deploy omni-web \
  --source . \
  --port 3000 \
  --region us-central1 \
  --allow-unauthenticated

echo "🎉 Deployment complete! Both apps are live on Google Cloud Run!"
gcloud run services list --platform managed --region us-central1

#!/usr/bin/env bash
# ============================================================
# Calmdemy Content Factory — GCP one-time setup
# Run this script from your local machine with gcloud CLI installed.
#
# Prerequisites:
#   brew install --cask google-cloud-sdk
#   gcloud auth login
# ============================================================

set -euo pipefail

# ---------- Configuration ----------
PROJECT_ID="calmnest-e910e"
REGION="us-central1"
ZONE="${REGION}-a"
VM_NAME="calmdemy-worker"
SA_NAME="calmdemy-worker-sa"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
MACHINE_TYPE="g2-standard-4"      # 4 vCPU, 16 GB, 1x L4 GPU
BOOT_DISK_SIZE="100GB"
MODEL_DISK_NAME="calmdemy-model-weights"
MODEL_DISK_SIZE="100GB"

echo "=== Calmdemy Content Factory — GCP Setup ==="
echo "Project:  ${PROJECT_ID}"
echo "Zone:     ${ZONE}"
echo ""

# ---------- 1. Set project ----------
gcloud config set project "${PROJECT_ID}"

# ---------- 2. Enable APIs ----------
echo ">>> Enabling APIs..."
gcloud services enable \
  compute.googleapis.com \
  cloudfunctions.googleapis.com \
  cloudbuild.googleapis.com \
  logging.googleapis.com \
  firestore.googleapis.com \
  --quiet

echo "    APIs enabled."

# ---------- 3. Create service account ----------
echo ">>> Creating service account: ${SA_NAME}..."
if gcloud iam service-accounts describe "${SA_EMAIL}" &>/dev/null; then
  echo "    Service account already exists."
else
  gcloud iam service-accounts create "${SA_NAME}" \
    --display-name="Calmdemy Worker"
  echo "    Waiting for service account to propagate..."
  sleep 10
fi

# Grant roles
for ROLE in roles/datastore.user roles/storage.objectAdmin roles/compute.instanceAdmin.v1 roles/logging.logWriter; do
  gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="${ROLE}" \
    --quiet >/dev/null
done
echo "    Roles assigned."

# ---------- 4. Create persistent disk for model weights ----------
echo ">>> Creating model-weights disk: ${MODEL_DISK_NAME}..."
if gcloud compute disks describe "${MODEL_DISK_NAME}" --zone="${ZONE}" &>/dev/null; then
  echo "    Disk already exists."
else
  gcloud compute disks create "${MODEL_DISK_NAME}" \
    --zone="${ZONE}" \
    --size="${MODEL_DISK_SIZE}" \
    --type=pd-ssd
fi

# ---------- 5. Create the worker VM (stopped) ----------
echo ">>> Creating VM: ${VM_NAME}..."
if gcloud compute instances describe "${VM_NAME}" --zone="${ZONE}" &>/dev/null; then
  echo "    VM already exists."
else
  gcloud compute instances create "${VM_NAME}" \
    --zone="${ZONE}" \
    --machine-type="${MACHINE_TYPE}" \
    --accelerator=type=nvidia-l4,count=1 \
    --maintenance-policy=TERMINATE \
    --provisioning-model=SPOT \
    --instance-termination-action=STOP \
    --boot-disk-size="${BOOT_DISK_SIZE}" \
    --boot-disk-type=pd-ssd \
    --image-family=common-cu128-ubuntu-2204-nvidia-570 \
    --image-project=deeplearning-platform-release \
    --service-account="${SA_EMAIL}" \
    --scopes=cloud-platform \
    --disk="name=${MODEL_DISK_NAME},device-name=model-weights,mode=rw,auto-delete=no" \
    --metadata=startup-script='#!/bin/bash
# Mount model-weights disk if not already mounted
DEVICE=/dev/disk/by-id/google-model-weights
MOUNT=/mnt/models
if [ ! -d "$MOUNT" ]; then
  mkdir -p "$MOUNT"
fi
if ! mountpoint -q "$MOUNT"; then
  # Format only if no filesystem
  if ! blkid "$DEVICE" &>/dev/null; then
    mkfs.ext4 -F "$DEVICE"
  fi
  mount "$DEVICE" "$MOUNT"
fi

# Run the worker directly (if code is deployed)
if [ -f /home/*/worker/main.py ]; then
  WORKER_DIR=$(dirname $(ls /home/*/worker/main.py | head -1))
  WORKER_USER=$(stat -c "%U" "$WORKER_DIR")
  sudo -u "$WORKER_USER" bash -c "
    export MODEL_DIR=/mnt/models
    export GOOGLE_CLOUD_PROJECT=calmnest-e910e
    cd $WORKER_DIR
    nohup python3 main.py > worker.log 2>&1 &
  "
fi
'

  # Stop the VM immediately (we only start it on demand)
  gcloud compute instances stop "${VM_NAME}" --zone="${ZONE}" --quiet
fi

echo ""
echo "=== Setup complete ==="
echo ""
echo "Next steps:"
echo "  1. Copy worker code to the VM and install Python dependencies"
echo "  2. Download model weights to /mnt/models on the VM"
echo "  3. Deploy the Cloud Function (see cloud-function/ directory)"
echo "  4. Set your Firestore user doc role='admin' to access the admin UI"
echo ""
echo "To start the VM manually:"
echo "  gcloud compute instances start ${VM_NAME} --zone=${ZONE}"
echo ""
echo "To SSH into the VM:"
echo "  gcloud compute ssh ${VM_NAME} --zone=${ZONE}"

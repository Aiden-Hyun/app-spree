# Calmdemy Content Factory — Deployment Guide

## Prerequisites

- Google Cloud SDK (`gcloud`) installed and authenticated
  ```bash
  brew install --cask google-cloud-sdk
  gcloud init              # select project calmnest-e910e
  gcloud auth application-default login
  ```

## Step 1: GCP Setup (One-Time)

```bash
cd apps/calmdemy/worker
bash gcp-setup.sh
```

This script:
- Enables required GCP APIs
- Creates a service account with appropriate roles
- Creates a 100GB persistent disk for model weights
- Creates the worker VM (g2-standard-4 with L4 GPU), then stops it

> **Note:** If you get a GPU quota error, request a quota increase at
> https://console.cloud.google.com/iam-admin/quotas?project=calmnest-e910e
> (search for "GPUs (all regions)", request limit of 1). Approval can take minutes to hours.

## Step 2: Set Your User as Admin

In the [Firebase Console Firestore](https://console.firebase.google.com/project/calmnest-e910e/firestore):

1. Open the `users` collection
2. Find your user document (by your UID or email)
3. Add a field: `role` = `"admin"` (string)

This enables the "Content Factory" option in Settings.

## Step 3: Download Model Weights

Start the VM and SSH in:

```bash
gcloud compute instances start calmdemy-worker --zone=us-central1-a
sleep 60
gcloud compute ssh calmdemy-worker --zone=us-central1-a --tunnel-through-iap
```

On the VM, set up directories:

```bash
sudo mkdir -p /mnt/models/piper /mnt/models/gemma-3-12b-it
sudo chown -R $USER:$USER /mnt/models
```

Download Piper TTS voice:

```bash
cd /mnt/models/piper
wget https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/amy/medium/en_US-amy-medium.onnx
wget https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/amy/medium/en_US-amy-medium.onnx.json
```

Download Gemma 3 12B (requires HuggingFace account + accepted license):

1. Go to https://huggingface.co/google/gemma-3-12b-it and accept the license
2. Create an access token at https://huggingface.co/settings/tokens

```bash
sudo apt install -y python3-pip
pip3 install --user huggingface-hub

# Login with your HuggingFace token
python3 -c "from huggingface_hub import login; login()"

# Download (~24GB, takes a while)
python3 -c "
from huggingface_hub import snapshot_download
snapshot_download('google/gemma-3-12b-it', local_dir='/mnt/models/gemma-3-12b-it')
"
```

Don't shut down the VM yet — continue to Step 4.

## Step 4: Deploy Worker Code to VM

From your **local machine** (inside `apps/calmdemy`):

```bash
gcloud compute scp --recurse worker calmdemy-worker:~/worker --zone=us-central1-a --tunnel-through-iap
```

> **Tip:** Always use `--tunnel-through-iap` for reliable SSH/SCP connections.

Then **SSH into the VM**:

```bash
gcloud compute ssh calmdemy-worker --zone=us-central1-a --tunnel-through-iap
```

Install system dependencies and Python packages:

```bash
# System deps
sudo apt-get update && sudo apt-get install -y ffmpeg

# Python deps (use nohup in case SSH drops — takes ~5-10 min)
cd ~/worker
nohup pip3 install --user -r requirements.txt > install.log 2>&1 &

# Monitor progress (Ctrl+C to stop watching, install continues)
tail -f install.log
```

Once the install finishes, set up environment variables:

```bash
cat >> ~/.bashrc << 'EOF'
export MODEL_DIR=/mnt/models
export GOOGLE_CLOUD_PROJECT=calmnest-e910e
EOF
source ~/.bashrc
```

Verify everything works:

```bash
cd ~/worker
python3 -c "import vllm; print('vLLM version:', vllm.__version__)"
python3 -c "import firebase_admin; print('Firebase OK')"
python3 -c "import piper; print('Piper OK')"
```

Now shut down the VM (it will start automatically when jobs are created):

```bash
sudo shutdown -h now
```

## Step 5: Update VM Startup Script (if VM already exists)

If your VM was previously set up with Docker, update the startup script to run the worker directly:

```bash
gcloud compute instances add-metadata calmdemy-worker \
  --zone=us-central1-a \
  --metadata=startup-script='#!/bin/bash
DEVICE=/dev/disk/by-id/google-model-weights
MOUNT=/mnt/models
if [ ! -d "$MOUNT" ]; then mkdir -p "$MOUNT"; fi
if ! mountpoint -q "$MOUNT"; then
  if ! blkid "$DEVICE" &>/dev/null; then mkfs.ext4 -F "$DEVICE"; fi
  mount "$DEVICE" "$MOUNT"
fi
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
```

## Step 6: Deploy the Cloud Function

From your **local machine**:

```bash
cd apps/calmdemy/worker

gcloud functions deploy calmdemy-job-trigger \
  --gen2 \
  --runtime python312 \
  --region us-central1 \
  --source ./cloud-function \
  --entry-point on_job_created \
  --trigger-event-filters="type=google.cloud.firestore.document.v1.created" \
  --trigger-event-filters="database=(default)" \
  --trigger-event-filters-path-pattern="document=content_jobs/{jobId}" \
  --service-account calmdemy-worker-sa@calmnest-e910e.iam.gserviceaccount.com
```

## Step 7: Test End-to-End

1. Run the app: `npx expo start` from `apps/calmdemy`
2. Go to **Profile → Settings → Content Factory** (visible only if you're admin)
3. Tap **+** to create a new job
4. Fill in:
   - Content Type: Guided Meditation
   - Topic: "5-minute body scan for stress relief"
   - Duration: 5 minutes
   - LLM: Gemma 3 12B
   - TTS: Piper TTS
   - Voice: Amy (US Female)
5. Tap **"Generate Content"**
6. Watch the job dashboard — status progresses through:
   Pending → Generating Script → Formatting → Converting to Audio → Processing Audio → Uploading → Publishing → Completed
7. Once completed, the new meditation appears in the Meditate tab

## Troubleshooting

### VM won't start
```bash
gcloud compute instances describe calmdemy-worker --zone=us-central1-a
```

### Check worker logs
```bash
gcloud compute ssh calmdemy-worker --zone=us-central1-a --tunnel-through-iap -- "cat ~/worker/worker.log"
```

### Check Cloud Function logs
```bash
gcloud functions logs read calmdemy-job-trigger --region=us-central1
```

### Manually start/stop VM
```bash
gcloud compute instances start calmdemy-worker --zone=us-central1-a
gcloud compute instances stop calmdemy-worker --zone=us-central1-a
```

## Cost Management

- The VM only runs when there are jobs to process
- It automatically shuts down after 5 minutes of idle time
- Using spot pricing (~$0.21/hr vs $0.70/hr on-demand)
- The persistent disk for models costs ~$8/month always
- Expected monthly cost with light usage: ~$10/month

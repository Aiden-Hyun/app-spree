"""
Cloud Function: Start the Calmdemy worker VM when a new content job is created.

Triggered by Firestore document creation in the 'content_jobs' collection.

Routing by llmBackend / ttsBackend fields:
  - If either is "cloud" -> Start the GCE VM (GPU needed)
  - Otherwise            -> Do nothing (local worker handles it)

Cloud is currently unavailable / legacy. In practice this function
almost never starts the VM.

Deploy with:
  gcloud functions deploy calmdemy-job-trigger \
    --gen2 \
    --runtime python312 \
    --region northamerica-northeast1 \
    --source ./cloud-function \
    --entry-point on_job_created \
    --trigger-event-filters="type=google.cloud.firestore.document.v1.created" \
    --trigger-event-filters="database=(default)" \
    --trigger-event-filters-path-pattern="document=content_jobs/{jobId}" \
    --service-account calmdemy-worker-sa@calmnest-e910e.iam.gserviceaccount.com
"""

import functions_framework
from google.cloud import compute_v1
from google.events.cloud import firestore as firestoredata

PROJECT_ID = "calmnest-e910e"
ZONE = "us-central1-a"
VM_NAME = "calmdemy-worker"


def _get_vm_status() -> str:
    """Return the current status of the worker VM."""
    client = compute_v1.InstancesClient()
    instance = client.get(project=PROJECT_ID, zone=ZONE, instance=VM_NAME)
    return instance.status  # RUNNING, TERMINATED, STOPPED, etc.


def _start_vm() -> None:
    """Start the worker VM."""
    client = compute_v1.InstancesClient()
    client.start(project=PROJECT_ID, zone=ZONE, instance=VM_NAME)


def _get_field_str(cloud_event, field_name: str, default: str = "local") -> str:
    """Extract a string field from the Firestore document event."""
    try:
        data = cloud_event.data
        if isinstance(data, dict):
            fields = data.get("value", {}).get("fields", {})
            field = fields.get(field_name, {})
            return field.get("stringValue", default)
        return default
    except Exception:
        return default


def _needs_cloud(cloud_event) -> bool:
    """Return True if either LLM or TTS backend requires the cloud VM."""
    llm_backend = _get_field_str(cloud_event, "llmBackend", "local")
    tts_backend = _get_field_str(cloud_event, "ttsBackend", "local")
    return llm_backend == "cloud" or tts_backend == "cloud"


@functions_framework.cloud_event
def on_job_created(cloud_event):
    """Firestore onCreate trigger for content_jobs collection."""
    print(f"New content job created: {cloud_event['subject']}")

    llm_backend = _get_field_str(cloud_event, "llmBackend", "local")
    tts_backend = _get_field_str(cloud_event, "ttsBackend", "local")
    print(f"Job backends — LLM: {llm_backend}, TTS: {tts_backend}")

    if not _needs_cloud(cloud_event):
        print("No cloud backend needed — skipping VM start. Local worker will handle it.")
        return

    # At least one component needs the cloud VM
    try:
        status = _get_vm_status()
        print(f"Worker VM status: {status}")

        if status in ("TERMINATED", "STOPPED"):
            print("Starting worker VM for cloud job...")
            _start_vm()
            print("VM start request sent.")
        elif status == "RUNNING":
            print("VM already running; worker will pick up the new job.")
        else:
            print(f"VM in unexpected state: {status}. Will not start.")
    except Exception as e:
        print(f"Error checking/starting VM: {e}")
        raise

import json
from pathlib import Path
import httpx
from app.utils.core.config import settings


def get_slave_addresses() -> list[str]:
    # Path(__file__) = .../backend/app/utils/slave_manager/orchestrator.py
    # parent.parent.parent = .../backend/app/
    config_path = Path(__file__).parent.parent.parent / "config" / "slaves.json"

    if not config_path.exists():
        raise FileNotFoundError(
            f"Configuration file not found: {config_path}. "
            f"Please create the file with slave addresses."
        )

    with open(config_path, "r") as f:
        addresses = json.load(f)

    if not addresses or len(addresses) == 0:
        raise ValueError("No slave addresses configured in slaves.json")

    return addresses


def get_optimised_slave() -> str:
    addresses = get_slave_addresses()
    """
    Call each slave to get its current load and return the address of the least loaded one.
    For now, just return the first one.
    """
    return addresses[0]


def load_media(url: str):
    """Get the list of media files from the optimised slave."""
    response = httpx.get(
        url,
        headers={"X-API-Key": settings.SECRET_KEY},
    )

    response.raise_for_status()
    return response.json().get("files", [])


def save_media(file) -> str:
    """Upload a file to the optimised slave and return a proxy URL via the backend."""
    slave_base_url = get_optimised_slave()
    upload_url = slave_base_url + "/files"

    response = httpx.post(
        upload_url,
        files={"file": file},
        headers={"X-API-Key": settings.SECRET_KEY},
    )

    response.raise_for_status()
    data = response.json()

    # Retourner l'URL du proxy backend (pas l'URL directe du slave)
    file_id = data.get("id", "")
    proxy_url = f"/media/proxy/{file_id}"
    return proxy_url


def fetch_file_from_slave(file_id: str) -> httpx.Response:
    """Fetch a file from the optimised slave storage node."""
    slave_url = get_optimised_slave()
    url = f"{slave_url}/files/{file_id}"
    response = httpx.get(
        url,
        headers={"X-API-Key": settings.SECRET_KEY},
        follow_redirects=True,
    )
    response.raise_for_status()
    return response


def list_all_files_from_slave() -> dict:
    """List all files from the slave storage."""
    slave_url = get_optimised_slave()
    url = f"{slave_url}/files"
    response = httpx.get(
        url,
        headers={"X-API-Key": settings.SECRET_KEY},
    )
    response.raise_for_status()
    return response.json()


def delete_file_from_slave(file_id: str) -> dict:
    """Delete a file from the slave storage."""
    slave_url = get_optimised_slave()
    url = f"{slave_url}/files/{file_id}"
    response = httpx.delete(
        url,
        headers={"X-API-Key": settings.SECRET_KEY},
    )
    response.raise_for_status()
    return response.json()

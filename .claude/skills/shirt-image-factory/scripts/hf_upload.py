#!/usr/bin/env python3
"""PUT a local file to a Higgsfield presigned upload URL.

Usage:
    python hf_upload.py <local_file> <upload_url> [content_type]

After a successful PUT, call the MCP tool `media_confirm` as instructed by media_upload.
"""
import sys
import urllib.request
from pathlib import Path


def main():
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    path, url = sys.argv[1], sys.argv[2]
    ctype = sys.argv[3] if len(sys.argv) > 3 else (
        "image/png" if path.lower().endswith(".png") else "image/jpeg")
    data = Path(path).read_bytes()
    req = urllib.request.Request(url, data=data, method="PUT",
                                 headers={"Content-Type": ctype})
    with urllib.request.urlopen(req, timeout=120) as resp:
        print(f"PUT {len(data)} bytes -> HTTP {resp.status}")
        if resp.status not in (200, 201, 204):
            sys.exit(f"unexpected status {resp.status}")


if __name__ == "__main__":
    main()

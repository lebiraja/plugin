#!/usr/bin/env python3
"""Test script to verify document processor initialization and persistence"""

from services.document_processor import DocumentProcessor

if __name__ == "__main__":
    print("Initializing DocumentProcessor...")
    dp = DocumentProcessor()

    print("✅ DocumentProcessor initialized successfully")
    print(f"Tesseract available: {dp.tesseract_available}")

    files = dp.get_all_stored_files()
    print(f"\nStored files in vector DB: {len(files)}")

    if files:
        for f in files:
            print(f"  - {f['name']} ({f['chunks']} chunks, {f['size']} bytes)")
    else:
        print("  (no files stored yet)")

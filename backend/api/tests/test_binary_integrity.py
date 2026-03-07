"""
Test binary integrity: store → retrieve → compare
"""
from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).parent.parent))

from services.qgis_storage_service import storage_service

# Load original
original_path = Path(__file__).parent.parent.parent.parent / 'resources' / 'test_qgs' / 'SNU_TAG.qgz'
original_bytes = original_path.read_bytes()

print(f"Original size: {len(original_bytes)} bytes")
print(f"First 20 bytes: {original_bytes[:20]}")

# Store in DB
print("\n--- Storing in PostgreSQL ---")
result = storage_service.store_qgz(
    project_name='integrity_test',
    qgz_bytes=original_bytes,
    title='Binary Integrity Test'
)
print(f"Stored: {result}")

# Retrieve from DB
print("\n--- Retrieving from PostgreSQL ---")
retrieved_bytes = storage_service.retrieve_qgz('integrity_test')

if not retrieved_bytes:
    print("❌ retrieve_qgz() returned None!")
    sys.exit(1)

print(f"Retrieved size: {len(retrieved_bytes)} bytes")
print(f"First 20 bytes: {retrieved_bytes[:20]}")

# Compare
if original_bytes == retrieved_bytes:
    print("\n✅ PERFECT MATCH - Binary integrity preserved!")
else:
    print(f"\n❌ MISMATCH!")
    print(f"  Original:  {len(original_bytes)} bytes")
    print(f"  Retrieved: {len(retrieved_bytes)} bytes")
    print(f"  Diff: {len(original_bytes) - len(retrieved_bytes)} bytes")
    
    # Find first difference
    for i in range(min(len(original_bytes), len(retrieved_bytes))):
        if original_bytes[i] != retrieved_bytes[i]:
            print(f"  First diff at byte {i}: {original_bytes[i]} vs {retrieved_bytes[i]}")
            break

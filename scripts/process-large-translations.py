#!/usr/bin/env python3
"""
Process large translation files by reading them in chunks and writing them out.
This helps handle files that are too large for direct manipulation.
"""

import os

def read_file_in_chunks(file_path, chunk_size=1024*1024):
    """Generator to read file in chunks"""
    with open(file_path, 'r', encoding='utf-8') as f:
        while True:
            chunk = f.read(chunk_size)
            if not chunk:
                break
            yield chunk

def copy_large_file(file_path, target_path):
    """Copy a large file by reading and writing in chunks"""
    print(f"Processing large file: {os.path.basename(file_path)}")
    bytes_processed = 0
    chunk_count = 0
    
    with open(target_path, 'w', encoding='utf-8') as output:
        for chunk in read_file_in_chunks(file_path):
            output.write(chunk)
            bytes_processed += len(chunk.encode('utf-8'))
            chunk_count += 1
            print(f"  Processed chunk {chunk_count}...")
    
    print(f"  ✓ Total: {bytes_processed} bytes in {chunk_count} chunks")

def main():
    base_path = "/home/engine/project/src/content"
    
    # Files that need Japanese translation (excluding the one we already did)
    missing_files = [
        "blog-cn/claude-agent-sdk-python-.md",
        "blog-cn/gemini-cli-contributors-deep-analysis.md"
    ]
    
    for file_path in missing_files:
        cn_file = os.path.join(base_path, file_path)
        if not os.path.exists(cn_file):
            print(f"File not found: {cn_file}")
            continue
        
        en_file = cn_file.replace("blog-cn", "blog-en")
        if not os.path.exists(en_file):
            print(f"No English version found, using Chinese one: {en_file}")
            ja_target = cn_file.replace("blog-cn", "blog-ja")
            # We'll translate from Chinese instead
        else:
            ja_target = en_file.replace("blog-en", "blog-ja")
        
        # Check if already translated
        if os.path.exists(ja_target):
            print(f"Already exists: {ja_target}")
            continue
        
        print(f"\nNeed to translate: {os.path.basename(cn_file)}")
        print(f"  → Target: {ja_target}")

if __name__ == "__main__":
    main()

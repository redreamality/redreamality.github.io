#!/usr/bin/env python3
import os
import re
from pathlib import Path

def extract_description(file_path):
    """Extract description from markdown frontmatter"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Match description in frontmatter
        match = re.search(r'^description:\s*[\'"]([^\'"]+)[\'"]', content, re.MULTILINE)
        if match:
            return match.group(1)
        return None
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
        return None

def main():
    content_dir = Path('/home/engine/project/src/content')
    descriptions = []
    
    # Walk through all content directories
    for root, dirs, files in os.walk(content_dir):
        for file in files:
            if file.endswith('.md'):
                file_path = Path(root) / file
                description = extract_description(file_path)
                if description:
                    length = len(description)
                    descriptions.append({
                        'file': str(file_path.relative_to(content_dir)),
                        'description': description,
                        'length': length,
                        'status': 'SHORT' if length < 110 else 'GOOD' if length <= 160 else 'LONG'
                    })
    
    # Sort by length
    descriptions.sort(key=lambda x: x['length'])
    
    print(f"Analyzed {len(descriptions)} content files")
    print("\n=== SHORT DESCRIPTIONS (< 110 chars) ===")
    short_count = 0
    for desc in descriptions:
        if desc['length'] < 110:
            short_count += 1
            print(f"{desc['file']}: {desc['length']} chars")
            print(f"  Description: {desc['description'][:100]}{'...' if desc['length'] > 100 else ''}")
            print()
    
    print(f"\n=== GOOD DESCRIPTIONS (110-160 chars) ===")
    good_count = 0
    for desc in descriptions:
        if 110 <= desc['length'] <= 160:
            good_count += 1
            print(f"{desc['file']}: {desc['length']} chars")
            print(f"  Description: {desc['description'][:100]}{'...' if desc['length'] > 100 else ''}")
            print()
    
    print(f"\n=== LONG DESCRIPTIONS (> 160 chars) ===")
    long_count = 0
    for desc in descriptions:
        if desc['length'] > 160:
            long_count += 1
            print(f"{desc['file']}: {desc['length']} chars")
            print(f"  Description: {desc['description'][:100]}{'...' if desc['length'] > 100 else ''}")
            print()
    
    print(f"\n=== SUMMARY ===")
    print(f"Total files: {len(descriptions)}")
    print(f"Short (< 110): {short_count}")
    print(f"Good (110-160): {good_count}")
    print(f"Long (> 160): {long_count}")

if __name__ == '__main__':
    main()
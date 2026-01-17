#!/usr/bin/env python3
import os
import re
import glob
from pathlib import Path

def extract_description_length(file_path):
    """Extract description from frontmatter and return length"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Look for description in frontmatter
        desc_match = re.search(r'^description:\s*["\'](.*?)["\']', content, re.MULTILINE | re.DOTALL)
        if desc_match:
            description = desc_match.group(1)
            return len(description), description
        else:
            return 0, None
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
        return 0, None

def main():
    """Check all description lengths in content files"""
    content_dirs = ['src/content/blog-en', 'src/content/blog-cn', 'src/content/blog-ja']
    
    all_descriptions = []
    
    for content_dir in content_dirs:
        if os.path.exists(content_dir):
            for md_file in glob.glob(f"{content_dir}/*.md"):
                length, description = extract_description_length(md_file)
                if description:
                    all_descriptions.append({
                        'file': md_file,
                        'length': length,
                        'description': description
                    })
    
    # Sort by length
    all_descriptions.sort(key=lambda x: x['length'])
    
    print("=== DESCRIPTION LENGTH ANALYSIS ===")
    print(f"Total descriptions found: {len(all_descriptions)}")
    print()
    
    print("=== SHORT DESCRIPTIONS (< 110 characters) ===")
    short_descriptions = [d for d in all_descriptions if d['length'] < 110]
    print(f"Count: {len(short_descriptions)}")
    for desc in short_descriptions:
        print(f"File: {desc['file']}")
        print(f"Length: {desc['length']}")
        print(f"Description: {desc['description']}")
        print("-" * 50)
    
    print()
    print("=== GOOD LENGTH DESCRIPTIONS (110-160 characters) ===")
    good_descriptions = [d for d in all_descriptions if 110 <= d['length'] <= 160]
    print(f"Count: {len(good_descriptions)}")
    
    print()
    print("=== LONG DESCRIPTIONS (> 160 characters) ===")
    long_descriptions = [d for d in all_descriptions if d['length'] > 160]
    print(f"Count: {len(long_descriptions)}")
    for desc in long_descriptions[:10]:  # Show first 10
        print(f"File: {desc['file']}")
        print(f"Length: {desc['length']}")
        print(f"Description: {desc['description'][:100]}...")
        print("-" * 50)
    
    print()
    print("=== STATISTICS ===")
    if all_descriptions:
        lengths = [d['length'] for d in all_descriptions]
        print(f"Min length: {min(lengths)}")
        print(f"Max length: {max(lengths)}")
        print(f"Average length: {sum(lengths) / len(lengths):.1f}")
        
        short_count = len([d for d in all_descriptions if d['length'] < 110])
        good_count = len([d for d in all_descriptions if 110 <= d['length'] <= 160])
        long_count = len([d for d in all_descriptions if d['length'] > 160])
        
        print(f"Short (< 110): {short_count} ({short_count/len(all_descriptions)*100:.1f}%)")
        print(f"Good (110-160): {good_count} ({good_count/len(all_descriptions)*100:.1f}%)")
        print(f"Long (> 160): {long_count} ({long_count/len(all_descriptions)*100:.1f}%)")

if __name__ == "__main__":
    main()
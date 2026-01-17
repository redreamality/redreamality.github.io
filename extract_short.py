#!/usr/bin/env python3
import os
import re
import glob

def extract_short_descriptions():
    """Extract short descriptions that need fixing"""
    content_dirs = ['src/content/blog-en', 'src/content/blog-cn', 'src/content/blog-ja']
    
    short_descriptions = []
    
    for content_dir in content_dirs:
        if os.path.exists(content_dir):
            for md_file in glob.glob(f"{content_dir}/*.md"):
                try:
                    with open(md_file, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    # Extract title and description
                    title_match = re.search(r"title:\s*['\"](.*?)['\"]", content)
                    desc_match = re.search(r"description:\s*['\"](.*?)['\"]", content)
                    
                    if title_match and desc_match:
                        title = title_match.group(1)
                        description = desc_match.group(1)
                        length = len(description)
                        
                        if length < 110:
                            short_descriptions.append({
                                'file': md_file,
                                'title': title,
                                'description': description,
                                'length': length,
                                'lang': 'en' if 'blog-en' in content_dir else 'cn' if 'blog-cn' in content_dir else 'ja'
                            })
                except Exception as e:
                    continue
    
    return sorted(short_descriptions, key=lambda x: x['length'])

def main():
    short_descs = extract_short_descriptions()
    
    print("=== SHORT DESCRIPTIONS NEEDING FIXING ===")
    print(f"Total: {len(short_descs)} descriptions")
    print()
    
    # Show the shortest ones first
    for desc in short_descs[:20]:
        print(f"File: {desc['file']}")
        print(f"Title: {desc['title']}")
        print(f"Length: {desc['length']}")
        print(f"Current: {desc['description']}")
        print("-" * 60)
    
    if len(short_descs) > 20:
        print(f"... and {len(short_descs) - 20} more")

if __name__ == "__main__":
    main()
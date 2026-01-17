#!/usr/bin/env python3
import os
import re
from pathlib import Path

def extract_frontmatter(file_path):
    """Extract frontmatter data from markdown file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Match YAML frontmatter
        match = re.search(r'^---\s*\n(.*?)\n---\s*\n', content, re.DOTALL)
        if match:
            frontmatter = match.group(1)
            
            # Extract individual fields
            title_match = re.search(r"title:\s*['\"]([^'\"]+)['\"]", frontmatter)
            description_match = re.search(r"description:\s*['\"]([^'\"]+)['\"]", frontmatter)
            tags_match = re.search(r"tags:\s*\[(.*?)\]", frontmatter)
            
            title = title_match.group(1) if title_match else "No title"
            description = description_match.group(1) if description_match else "No description"
            tags = tags_match.group(1) if tags_match else ""
            
            return {
                'title': title,
                'description': description,
                'tags': tags,
                'description_length': len(description)
            }
        return None
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
        return None

def main():
    content_dir = Path('/home/engine/project/src/content')
    content_data = []
    
    # Walk through all content directories
    for root, dirs, files in os.walk(content_dir):
        for file in files:
            if file.endswith('.md'):
                file_path = Path(root) / file
                data = extract_frontmatter(file_path)
                if data:
                    # Determine category and priority
                    relative_path = file_path.relative_to(content_dir)
                    category = str(relative_path.parent)
                    
                    # Prioritize blog content
                    priority = 1 if 'blog' in category else 2
                    
                    content_data.append({
                        'file': str(relative_path),
                        'category': category,
                        'title': data['title'],
                        'description': data['description'],
                        'tags': data['tags'],
                        'length': data['description_length'],
                        'priority': priority,
                        'status': 'SHORT' if data['description_length'] < 110 else 'GOOD' if data['description_length'] <= 160 else 'LONG'
                    })
    
    # Sort by priority, then by category, then by length
    content_data.sort(key=lambda x: (x['priority'], x['category'], x['length']))
    
    print(f"Analyzed {len(content_data)} content files\n")
    
    # Show short descriptions by category
    categories = set(item['category'] for item in content_data)
    
    for category in sorted(categories):
        category_items = [item for item in content_data if item['category'] == category]
        short_items = [item for item in category_items if item['status'] == 'SHORT']
        
        if short_items:
            print(f"=== {category.upper()} ({len(short_items)} short descriptions) ===")
            for item in short_items[:10]:  # Show first 10
                print(f"File: {item['file']}")
                print(f"Title: {item['title']}")
                print(f"Current: \"{item['description']}\" ({item['length']} chars)")
                print(f"Tags: {item['tags']}")
                print("---")
            if len(short_items) > 10:
                print(f"... and {len(short_items) - 10} more short descriptions")
            print()

if __name__ == '__main__':
    main()
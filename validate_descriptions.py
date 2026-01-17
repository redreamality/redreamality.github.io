#!/usr/bin/env python3
import os
import re
from pathlib import Path

def validate_descriptions():
    """Validate meta description lengths and OG descriptions"""
    content_dir = Path('/home/engine/project/src/content')
    all_files = []
    
    # Walk through all content directories
    for root, dirs, files in os.walk(content_dir):
        for file in files:
            if file.endswith('.md'):
                file_path = Path(root) / file
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    # Extract frontmatter
                    match = re.search(r'^---\s*\n(.*?)\n---\s*\n', content, re.DOTALL)
                    if match:
                        frontmatter = match.group(1)
                        
                        title_match = re.search(r"title:\s*['\"]([^'\"]+)['\"]", frontmatter)
                        desc_match = re.search(r"description:\s*['\"]([^'\"]+)['\"]", frontmatter)
                        
                        if title_match and desc_match:
                            title = title_match.group(1)
                            description = desc_match.group(1)
                            length = len(description)
                            
                            # Check for OG description support (should be same as meta description)
                            category = str(file_path.parent.relative_to(content_dir))
                            
                            all_files.append({
                                'file': str(file_path.relative_to(content_dir)),
                                'category': category,
                                'title': title,
                                'description': description,
                                'length': length,
                                'status': 'SHORT' if length < 110 else 'GOOD' if length <= 160 else 'LONG'
                            })
                except Exception as e:
                    print(f"Error reading {file_path}: {e}")
    
    # Sort by category and length
    all_files.sort(key=lambda x: (x['category'], x['length']))
    
    print("=== META DESCRIPTION LENGTH VALIDATION ===\n")
    
    # Summary by category
    categories = {}
    for file_info in all_files:
        cat = file_info['category']
        if cat not in categories:
            categories[cat] = {'SHORT': 0, 'GOOD': 0, 'LONG': 0}
        categories[cat][file_info['status']] += 1
    
    total_short = sum(cat['SHORT'] for cat in categories.values())
    total_good = sum(cat['GOOD'] for cat in categories.values())
    total_long = sum(cat['LONG'] for cat in categories.values())
    
    print(f"=== OVERALL SUMMARY ===")
    print(f"Total files: {len(all_files)}")
    print(f"Short (< 110 chars): {total_short}")
    print(f"Good (110-160 chars): {total_good}")
    print(f"Long (> 160 chars): {total_long}")
    print(f"Success rate (110-160 chars): {(total_good / len(all_files)) * 100:.1f}%")
    print()
    
    # Show remaining short descriptions that need attention
    remaining_short = [f for f in all_files if f['status'] == 'SHORT']
    
    if remaining_short:
        print(f"=== REMAINING SHORT DESCRIPTIONS ({len(remaining_short)} files) ===")
        for file_info in remaining_short[:10]:  # Show first 10
            print(f"{file_info['file']}: {file_info['length']} chars")
            print(f"  Title: {file_info['title']}")
            print(f"  Description: \"{file_info['description'][:80]}{'...' if len(file_info['description']) > 80 else ''}\"")
            print()
        
        if len(remaining_short) > 10:
            print(f"... and {len(remaining_short) - 10} more short descriptions")
        print()
    
    # Check Layout.astro for OG description support
    layout_file = Path('/home/engine/project/src/layouts/Layout.astro')
    if layout_file.exists():
        with open(layout_file, 'r', encoding='utf-8') as f:
            layout_content = f.read()
        
        # Check if OG description is properly implemented
        if 'og:description' in layout_content:
            print("=== OG DESCRIPTION VALIDATION ===")
            print("✅ OG description tag found in Layout.astro")
            if 'content={description}' in layout_content:
                print("✅ OG description uses meta description content")
            else:
                print("⚠️  OG description may not use meta description content")
        else:
            print("❌ OG description tag not found in Layout.astro")
    
    return {
        'total': len(all_files),
        'short': total_short,
        'good': total_good,
        'long': total_long,
        'success_rate': (total_good / len(all_files)) * 100
    }

if __name__ == '__main__':
    result = validate_descriptions()
    print(f"\n🎉 Validation complete! {result['good']}/{result['total']} descriptions are now optimal length.")
    print(f"📈 Improvement: {result['success_rate']:.1f}% of descriptions are now 110-160 characters")
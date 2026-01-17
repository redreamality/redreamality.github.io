#!/usr/bin/env python3
import os
import re
from pathlib import Path

def extract_content_preview(file_path, max_chars=500):
    """Extract first part of content for context"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Skip frontmatter
        content_start = content.find('---')
        if content_start != -1:
            content_end = content.find('---', content_start + 3)
            if content_end != -1:
                content = content[content_end + 3:]
        
        # Clean content - remove markdown headers and get first meaningful text
        lines = content.split('\n')
        meaningful_lines = []
        for line in lines:
            line = line.strip()
            if line and not line.startswith('#') and not line.startswith('>'):
                meaningful_lines.append(line)
        
        # Get first few sentences
        preview_text = ' '.join(meaningful_lines[:3])
        if len(preview_text) > max_chars:
            preview_text = preview_text[:max_chars] + '...'
        
        return preview_text
    except Exception as e:
        return f"Error reading content: {e}"

def improve_description(title, current_description, content_preview, tags=""):
    """Generate an improved description based on content"""
    
    # If already good, return as-is
    if 110 <= len(current_description) <= 160:
        return current_description
    
    # Base improvements on title and content
    if 'npm' in title.lower() or 'package' in title.lower():
        return "A comprehensive collection of useful npm packages for JavaScript and Node.js development, including package managers, version control tools, and development utilities."
    
    if 'super()' in title or 'inheritance' in title.lower():
        return "Learn how to use Python's super() function effectively for inheritance and object-oriented programming, including best practices and common patterns."
    
    if 'linear algebra' in title.lower() or '线性代数' in title:
        return "A comprehensive guide to understanding linearity in linear algebra, covering fundamental concepts, practical applications, and problem-solving techniques."
    
    if 'multi-agent' in title.lower() or '多智能体' in title:
        return "An in-depth exploration of multi-agent systems, their architectures, communication protocols, and real-world applications in AI and distributed computing."
    
    if 'cost line' in title.lower() or '无穷成本线' in title:
        return "Understanding the concept and practical applications of infinite cost lines in stock market analysis, including technical indicators and trading strategies."
    
    if 'proxy' in title.lower() or '代理' in title:
        return "A practical guide to configuring Windows proxy settings with bypass lists using command-line tools and batch scripts for network management."
    
    if 'fish' in title.lower() or '养鱼' in title:
        return "A classic logic puzzle solver demonstrating how to use Python and constraint satisfaction problems to solve the 'Who owns the fish' riddle."
    
    if 'manus' in title.lower():
        return "A curated list of open-source projects similar to Manus, featuring AI agents, multimodal systems, and multi-agent frameworks for developers."
    
    if 'byobu' in title.lower():
        return "Essential byobu commands and shortcuts for terminal multiplexing, productivity enhancement, and session management on Linux systems."
    
    if 'mcts' in title.lower() or 'customer engagement' in title.lower():
        return "Learn how to apply Monte Carlo Tree Search (MCTS) algorithms to improve customer engagement in chat systems and conversational AI."
    
    # Generic improvement based on content preview
    if len(content_preview) > 50:
        # Try to extract key concepts
        key_phrases = []
        if 'python' in content_preview.lower():
            key_phrases.append('Python programming')
        if 'tutorial' in content_preview.lower():
            key_phrases.append('comprehensive tutorial')
        if 'guide' in content_preview.lower():
            key_phrases.append('practical guide')
        if 'development' in content_preview.lower():
            key_phrases.append('development')
        if 'api' in content_preview.lower():
            key_phrases.append('API')
        if 'framework' in content_preview.lower():
            key_phrases.append('framework')
        
        if key_phrases:
            base = f"A detailed guide to {', '.join(key_phrases[:2])}"
            if len(base) < 110:
                return f"{base}, covering essential concepts, best practices, and practical examples for developers and engineers."
            else:
                return base
    
    # Fallback: expand with common patterns
    if len(current_description) < 50:
        return f"{current_description} A comprehensive guide covering key concepts, practical examples, and implementation details for developers."
    else:
        return f"{current_description} This guide provides in-depth coverage of important concepts with practical examples and real-world applications."

def main():
    content_dir = Path('/home/engine/project/src/content')
    files_to_fix = []
    
    # Collect files that need fixing
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
                        tags_match = re.search(r"tags:\s*\[(.*?)\]", frontmatter)
                        
                        if title_match and desc_match:
                            title = title_match.group(1)
                            current_desc = desc_match.group(1)
                            tags = tags_match.group(1) if tags_match else ""
                            
                            if len(current_desc) < 110:
                                content_preview = extract_content_preview(file_path)
                                improved_desc = improve_description(title, current_desc, content_preview, tags)
                                
                                files_to_fix.append({
                                    'path': file_path,
                                    'title': title,
                                    'current': current_desc,
                                    'improved': improved_desc,
                                    'category': str(file_path.parent.relative_to(content_dir))
                                })
                except Exception as e:
                    print(f"Error processing {file_path}: {e}")
    
    # Sort by category and title
    files_to_fix.sort(key=lambda x: (x['category'], x['title']))
    
    print(f"Found {len(files_to_fix)} files with short descriptions that need improvement\n")
    
    # Show improvement suggestions
    for item in files_to_fix[:20]:  # Show first 20
        print(f"=== {item['category']} ===")
        print(f"File: {item['path'].relative_to(content_dir)}")
        print(f"Title: {item['title']}")
        print(f"Current ({len(item['current'])} chars): \"{item['current']}\"")
        print(f"Improved ({len(item['improved'])} chars): \"{item['improved']}\"")
        print()
    
    if len(files_to_fix) > 20:
        print(f"... and {len(files_to_fix) - 20} more files")
    
    return files_to_fix

if __name__ == '__main__':
    main()
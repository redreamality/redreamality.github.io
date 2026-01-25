#!/usr/bin/env python3
"""
修复markdown文档中的footnote引用格式
将".1"格式改为标准markdown引用[^1]格式
"""

import re
import sys
from pathlib import Path

def fix_footnotes_in_file(file_path):
    """修复单个文件中的footnote引用"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 替换形如 "text.1" 的引用为 "text[^1]"
    # 使用负向后视确保不匹配已经正确格式化的引用
    def replace_footnote(match):
        text = match.group(0)
        # 检查是否已经是正确格式
        if '[^' in text:
            return text
        
        # 提取数字
        number = match.group(1)
        # 提取前面的文本（不包括句号）
        before_text = match.group(2) if match.lastindex >= 2 else ''
        
        return f"{before_text}[^{number}]"
    
    # 匹配模式：任意字符（非换行）后跟句号和数字
    # 使用更精确的模式，避免匹配句号后跟非数字的情况
    pattern = r'([^\.\n]*?)\.([0-9]+)(?!\d)'
    
    # 先处理Works cited部分之前的引用
    works_cited_pos = content.find("**Works cited**")
    if works_cited_pos == -1:
        works_cited_pos = content.find("**References:**")
    
    if works_cited_pos != -1:
        # 只处理Works cited之前的部分
        before_cited = content[:works_cited_pos]
        after_cited = content[works_cited_pos:]
        
        # 修复引用格式
        fixed_before = re.sub(pattern, replace_footnote, before_cited)
        content = fixed_before + after_cited
    
    return content

def main():
    """主函数"""
    # 处理inbox目录下的markdown文件
    inbox_dir = Path("/home/engine/project/inbox")
    
    for md_file in inbox_dir.glob("*.md"):
        print(f"处理文件: {md_file}")
        
        # 备份原文件
        backup_path = md_file.with_suffix('.md.backup')
        backup_path.write_text(md_file.read_text(encoding='utf-8'), encoding='utf-8')
        
        # 修复引用
        fixed_content = fix_footnotes_in_file(md_file)
        
        # 写回文件
        md_file.write_text(fixed_content, encoding='utf-8')
        print(f"已修复: {md_file}")

if __name__ == "__main__":
    main()
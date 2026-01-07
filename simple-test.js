function getLocalizedPath(path, lang) {
  // Remove existing language prefix
  const cleanPath = path.replace(/^\/(cn|en)/, '');

  if (lang === 'zh') {
    return cleanPath === '' || cleanPath === '/' ? '/cn' : `/cn${cleanPath}`;
  }

  return cleanPath || '/';
}

console.log("测试结果:");
console.log("英文首页 -> 中文:", getLocalizedPath("/", "zh"));
console.log("中文首页 -> 英文:", getLocalizedPath("/cn", "en"));
console.log("英文博客 -> 中文:", getLocalizedPath("/blog/test", "zh"));
console.log("中文博客 -> 英文:", getLocalizedPath("/cn/blog/test", "en"));
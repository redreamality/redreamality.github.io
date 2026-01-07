// 测试语言切换路径生成逻辑
function getLocalizedPath(path, lang) {
  // Remove existing language prefix
  const cleanPath = path.replace(/^\/(cn|en)/, '');

  if (lang === 'zh') {
    return cleanPath === '' || cleanPath === '/' ? '/cn' : `/cn${cleanPath}`;
  }

  return cleanPath || '/';
}

function getAlternateLanguagePath(currentPath, targetLang) {
  return getLocalizedPath(currentPath, targetLang);
}

// 测试用例
const testCases = [
  {
    name: "English homepage to Chinese",
    currentPath: "/",
    targetLang: "zh",
    expected: "/cn"
  },
  {
    name: "Chinese homepage to English", 
    currentPath: "/cn",
    targetLang: "en",
    expected: "/"
  },
  {
    name: "English blog to Chinese",
    currentPath: "/blog/some-post",
    targetLang: "zh", 
    expected: "/cn/blog/some-post"
  },
  {
    name: "Chinese blog to English",
    currentPath: "/cn/blog/some-post",
    targetLang: "en",
    expected: "/blog/some-post"
  },
  {
    name: "Chinese about to English",
    currentPath: "/cn/about", 
    targetLang: "en",
    expected: "/about"
  },
  {
    name: "English about to Chinese",
    currentPath: "/about",
    targetLang: "zh",
    expected: "/cn/about"
  }
];

console.log("测试语言切换路径生成逻辑:\n");

testCases.forEach(test => {
  const result = getAlternateLanguagePath(test.currentPath, test.targetLang);
  const pass = result === test.expected;
  console.log(`${pass ? '✅' : '❌'} ${test.name}`);
  console.log(`   路径: ${test.currentPath} -> ${test.targetLang}`);
  console.log(`   预期: ${test.expected}`);
  console.log(`   实际: ${result}`);
  console.log("");
});
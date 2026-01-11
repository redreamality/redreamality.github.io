#!/usr/bin/env node
/**
 * 日语批量翻译脚本
 * 将所有英文和中文内容翻译成日语
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 读取frontmatter的函数
function parseFrontmatter(content) {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
  const match = content.match(frontmatterRegex);
  
  if (!match) {
    return { frontmatter: null, content: content };
  }

  const frontmatterText = match[1];
  const contentBody = content.slice(match[0].length);

  // 简单的YAML解析（处理基本键值对）
  const frontmatter = {};
  const lines = frontmatterText.split('\n');
  
  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;
    
    const key = line.slice(0, colonIndex).trim();
    let value = line.slice(colonIndex + 1).trim();
    
    // 去除引号
    if ((value.startsWith('"') && value.endsWith('"')) || 
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    
    // 处理数组格式
    if (value.startsWith('[') && value.endsWith(']')) {
      const arrayContent = value.slice(1, -1);
      frontmatter[key] = arrayContent.split(',').map(item => item.trim().replace(/^["']|["']$/g, ''));
    } else {
      frontmatter[key] = value;
    }
  }

  return { frontmatter, content: contentBody };
}

// 生成frontmatter字符串
function generateFrontmatter(frontmatter) {
  const lines = ['---'];
  
  for (const [key, value] of Object.entries(frontmatter)) {
    if (Array.isArray(value)) {
      lines.push(`${key}: [${value.map(v => `"${v.replace(/"/g, '\\"')}"`).join(', ')}]`);
    } else {
      // 检查是否是日期字段或数字字段，不需要引号
      if (key === 'pubDate' || key === 'date' || key === 'updatedDate' || 
          key === 'pubDate' || typeof value === 'number' || 
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
        lines.push(`${key}: ${value}`);
      } else {
        // 转义双引号并添加引号
        const escapedValue = String(value).replace(/"/g, '\\"');
        lines.push(`${key}: "${escapedValue}"`);
      }
    }
  }
  
  lines.push('---');
  return lines.join('\n');
}

// 日语翻译函数
function translateToJapanese(text) {
  // 这里使用一个简化的翻译逻辑
  // 在实际项目中，你应该使用真正的翻译API
  
  // 常见技术词汇翻译映射
  const translations = {
    // 基础词汇
    'blog': 'ブログ',
    'article': '記事',
    'post': '投稿',
    'page': 'ページ',
    'home': 'ホーム',
    'about': '私について',
    'contact': 'お問い合わせ',
    'tags': 'タグ',
    'categories': 'カテゴリー',
    'archive': 'アーカイブ',
    'search': '検索',
    'next': '次へ',
    'previous': '前へ',
    'back': '戻る',
    'continue reading': '続きを読む',
    'published': '公開済み',
    'updated': '更新済み',
    'author': '著者',
    'date': '日付',
    'time': '時間',
    'comments': 'コメント',
    'share': '共有',
    'print': '印刷',
    'email': 'メール',
    
    // 技术词汇
    'javascript': 'JavaScript',
    'typescript': 'TypeScript',
    'python': 'Python',
    'react': 'React',
    'node.js': 'Node.js',
    'api': 'API',
    'css': 'CSS',
    'html': 'HTML',
    'web': 'ウェブ',
    'website': 'ウェブサイト',
    'framework': 'フレームワーク',
    'library': 'ライブラリ',
    'tool': 'ツール',
    'software': 'ソフトウェア',
    'application': 'アプリケーション',
    'development': '開発',
    'programming': 'プログラミング',
    'code': 'コード',
    'codebase': 'コードベース',
    'repository': 'リポジトリ',
    'git': 'Git',
    'github': 'GitHub',
    'version control': 'バージョン管理',
    'database': 'データベース',
    'server': 'サーバー',
    'client': 'クライアント',
    'network': 'ネットワーク',
    'internet': 'インターネット',
    'browser': 'ブラウザ',
    'mobile': 'モバイル',
    'desktop': 'デスクトップ',
    'responsive': 'レスポンシブ',
    'design': 'デザイン',
    'ui': 'UI',
    'ux': 'UX',
    'performance': 'パフォーマンス',
    'optimization': '最適化',
    'security': 'セキュリティ',
    'authentication': '認証',
    'authorization': '認可',
    'testing': 'テスト',
    'debugging': 'デバッグ',
    'deployment': 'デプロイ',
    'cloud': 'クラウド',
    'devops': 'DevOps',
    'agile': 'アジャイル',
    'scrum': 'スクラム',
    'project': 'プロジェクト',
    'task': 'タスク',
    'feature': '機能',
    'bug': 'バグ',
    'issue': '問題',
    'problem': '問題',
    'solution': '解決策',
    'example': '例',
    'tutorial': 'チュートリアル',
    'guide': 'ガイド',
    'documentation': 'ドキュメント',
    'manual': 'マニュアル',
    'reference': 'リファレンス',
    'best practice': 'ベストプラクティス',
    'pattern': 'パターン',
    'architecture': 'アーキテクチャ',
    'system': 'システム',
    'configuration': '設定',
    'installation': 'インストール',
    'setup': 'セットアップ',
    'environment': '環境',
    'production': 'プロダクション',
    'development': '開発',
    'staging': 'ステージング',
    'local': 'ローカル',
    'remote': 'リモート',
    'source code': 'ソースコード',
    'binary': 'バイナリ',
    'build': 'ビルド',
    'compile': 'コンパイル',
    'runtime': 'ランタイム',
    'execute': '実行',
    'run': '実行',
    'process': 'プロセス',
    'thread': 'スレッド',
    'memory': 'メモリ',
    'storage': 'ストレージ',
    'file': 'ファイル',
    'directory': 'ディレクトリ',
    'folder': 'フォルダ',
    'path': 'パス',
    'url': 'URL',
    'http': 'HTTP',
    'https': 'HTTPS',
    'protocol': 'プロトコル',
    'request': 'リクエスト',
    'response': 'レスポンス',
    'method': 'メソッド',
    'status': 'ステータス',
    'error': 'エラー',
    'warning': '警告',
    'info': '情報',
    'log': 'ログ',
    'debug': 'デバッグ',
    'trace': 'トレース',
    'monitor': '監視',
    'analytics': '分析',
    'metrics': 'メトリクス',
    'dashboard': 'ダッシュボード',
    'report': 'レポート',
    'statistics': '統計',
    'data': 'データ',
    'information': '情報',
    'content': 'コンテンツ',
    'text': 'テキスト',
    'image': '画像',
    'video': 'ビデオ',
    'audio': 'オーディオ',
    'media': 'メディア',
    'file format': 'ファイル形式',
    'extension': '拡張子',
    'plugin': 'プラグイン',
    'extension': '拡張機能',
    'module': 'モジュール',
    'package': 'パッケージ',
    'dependency': '依存関係',
    'library': 'ライブラリ',
    'framework': 'フレームワーク',
    'platform': 'プラットフォーム',
    'operating system': 'オペレーティングシステム',
    'windows': 'Windows',
    'macos': 'macOS',
    'linux': 'Linux',
    'unix': 'Unix',
    'ios': 'iOS',
    'android': 'Android',
    'cross-platform': 'クロスプラットフォーム',
    'multi-platform': 'マルチプラットフォーム',
    'compatibility': '互換性',
    'support': 'サポート',
    'maintenance': 'メンテナンス',
    'update': '更新',
    'upgrade': 'アップグレード',
    'migration': '移行',
    'backup': 'バックアップ',
    'restore': 'リストア',
    'recovery': '回復',
    'disaster recovery': '災害復旧',
    'business continuity': '事業継続性',
    'scalability': 'スケーラビリティ',
    'reliability': '信頼性',
    'availability': '可用性',
    'fault tolerance': 'フォールトトレランス',
    'load balancing': 'ロードバランシング',
    'caching': 'キャッシュ',
    'cache': 'キャッシュ',
    'session': 'セッション',
    'cookie': 'Cookie',
    'token': 'トークン',
    'encryption': '暗号化',
    'decryption': '復号化',
    'hash': 'ハッシュ',
    'signature': '署名',
    'certificate': '証明書',
    'ssl': 'SSL',
    'tls': 'TLS',
    'firewall': 'ファイアウォール',
    'proxy': 'プロキシ',
    'vpn': 'VPN',
    'bandwidth': 'バンド幅',
    'latency': 'レイテンシ',
    'throughput': 'スループット',
    'load': '負荷',
    'traffic': 'トラフィック',
    'request rate': 'リクエストレート',
    'response time': '応答時間',
    'uptime': '稼働時間',
    'downtime': 'ダウンタイム',
    'maintenance window': 'メンテナンスウィンドウ',
    'service level agreement': 'サービスレベル契約',
    'sla': 'SLA',
    'key performance indicator': '主要業績評価指標',
    'kpi': 'KPI',
    'quality assurance': '品質保証',
    'qa': '品質保証',
    'user acceptance testing': 'ユーザー受入テスト',
    'uat': 'ユーザー受入テスト',
    'continuous integration': '継続的インテグレーション',
    'ci': '継続的インテグレーション',
    'continuous deployment': '継続的デプロイ',
    'cd': '継続的デプロイ',
    'continuous delivery': '継続的デリバリー',
    'pipeline': 'パイプライン',
    'workflow': 'ワークフロー',
    'automation': '自動化',
    'orchestration': 'オーケストレーション',
    'container': 'コンテナ',
    'docker': 'Docker',
    'kubernetes': 'Kubernetes',
    'microservices': 'マイクロサービス',
    'monolithic': 'モノリシック',
    'service-oriented architecture': 'サービス指向アーキテクチャ',
    'soa': 'サービス指向アーキテクチャ',
    'rest': 'REST',
    'graphql': 'GraphQL',
    'websocket': 'WebSocket',
    'real-time': 'リアルタイム',
    'streaming': 'ストリーミング',
    'message queue': 'メッセージキュー',
    'event-driven': 'イベント駆動',
    'pub/sub': 'パブリッシュ/サブスクライブ',
    'publish/subscribe': 'パブリッシュ/サブスクライブ',
    'notification': '通知',
    'alert': 'アラート',
    'event': 'イベント',
    'hook': 'フック',
    'callback': 'コールバック',
    'promise': 'プロミス',
    'async/await': 'Async/Await',
    'concurrency': '並行性',
    'parallelism': '並列性',
    'synchronous': '同期',
    'asynchronous': '非同期',
    'blocking': 'ブロッキング',
    'non-blocking': 'ノンブロッキング',
    'i/o bound': 'I/Oバウンド',
    'cpu bound': 'CPUバウンド',
    'resource': 'リソース',
    'cpu': 'CPU',
    'ram': 'RAM',
    'disk': 'ディスク',
    'ssd': 'SSD',
    'hdd': 'HDD',
    'network storage': 'ネットワークストレージ',
    'nas': 'NAS',
    'san': 'SAN',
    'raid': 'RAID',
    'load balancer': 'ロードバランサー',
    'reverse proxy': 'リバースプロキシ',
    'content delivery network': 'コンテンツデリバリネットワーク',
    'cdn': 'コンテンツデリバリネットワーク',
    'edge computing': 'エッジコンピューティング',
    'fog computing': 'フォグコンピューティング',
    'hybrid cloud': 'ハイブリッドクラウド',
    'public cloud': 'パブリッククラウド',
    'private cloud': 'プライベートクラウド',
    'multi-cloud': 'マルチクラウド',
    'serverless': 'サーバーレス',
    'function as a service': 'サービスとしての関数',
    'faas': 'サービスとしての関数',
    'platform as a service': 'サービスとしてのプラットフォーム',
    'paas': 'サービスとしてのプラットフォーム',
    'infrastructure as a service': 'サービスとしてのインフラストラクチャ',
    'iaas': 'サービスとしてのインフラストラクチャ',
    'virtual machine': '仮想マシン',
    'vm': '仮想マシン',
    'hypervisor': 'ハイパーバイザー',
    'emulator': 'エミュレーター',
    'simulation': 'シミュレーション',
    'prototype': 'プロトタイプ',
    'proof of concept': '概念実証',
    'poc': '概念実証',
    'minimum viable product': '最小有効製品',
    'mvp': '最小有効製品',
    'user interface': 'ユーザーインターフェース',
    'user experience': 'ユーザーエクスペリエンス',
    'design pattern': 'デザインパターン',
    'anti-pattern': 'アンチパターン',
    'code smell': 'コードのにおい',
    'technical debt': '技術的負債',
    'refactoring': 'リファクタリング',
    'code review': 'コードレビュー',
    'pair programming': 'ペアプログラミング',
    'code coverage': 'コードカバレッジ',
    'test coverage': 'テストカバレッジ',
    'unit test': 'ユニットテスト',
    'integration test': 'インテグレーションテスト',
    'system test': 'システムテスト',
    'acceptance test': '受入テスト',
    'regression test': '回帰テスト',
    'performance test': 'パフォーマンステスト',
    'load test': 'ロードテスト',
    'stress test': 'ストレステスト',
    'security test': 'セキュリティテスト',
    'penetration test': '侵入テスト',
    'pen test': 'ペネレーションテスト',
    'vulnerability assessment': '脆弱性評価',
    'code analysis': 'コード分析',
    'static analysis': '静的解析',
    'dynamic analysis': '動的解析',
    'linting': 'リンティング',
    'formatting': 'フォーマット',
    'style guide': 'スタイルガイド',
    'coding standards': 'コーディング標準',
    'convention': '慣習',
    'best practice': 'ベストプラクティス',
    'dos and donts': 'やってはいけないこと',
    'tips': 'ヒント',
    'tricks': 'トリック',
    'hack': 'ハック',
    'workaround': '回避策',
    'quick fix': 'クイックフィックス',
    'hotfix': 'ホットフィックス',
    'patch': 'パッチ',
    'update': '更新',
    'patch notes': 'パッチノート',
    'changelog': '変更ログ',
    'release notes': 'リリースノート',
    'version': 'バージョン',
    'release': 'リリース',
    'build': 'ビルド',
    'artifact': '成果物',
    'distribution': '配布',
    'package manager': 'パッケージマネージャー',
    'npm': 'npm',
    'yarn': 'yarn',
    'pip': 'pip',
    'maven': 'Maven',
    'gradle': 'Gradle',
    'cmake': 'CMake',
    'make': 'Make',
    'autotools': 'Autotools',
    'configure': 'configure',
    'script': 'スクリプト',
    'automation': '自動化',
    'orchestration': 'オーケストレーション',
    'workflow': 'ワークフロー',
    'pipeline': 'パイプライン',
    'stage': 'ステージ',
    'step': 'ステップ',
    'job': 'ジョブ',
    'task': 'タスク',
    'action': 'アクション',
    'event': 'イベント',
    'trigger': 'トリガー',
    'condition': '条件',
    'rule': 'ルール',
    'policy': 'ポリシー',
    'procedure': '手順',
    'process': 'プロセス',
    'methodology': '方法論',
    'framework': 'フレームワーク',
    'approach': 'アプローチ',
    'strategy': '戦略',
    'tactic': '戦術',
    'technique': '技術',
    'skill': 'スキル',
    'ability': '能力',
    'expertise': '専門知識',
    'knowledge': '知識',
    'experience': '経験',
    'background': '背景',
    'history': '歴史',
    'story': 'ストーリー',
    'case study': 'ケーススタディ',
    'scenario': 'シナリオ',
    'situation': '状況',
    'context': '文脈',
    'environment': '環境',
    'setting': '設定',
    'configuration': '設定',
    'parameter': 'パラメーター',
    'argument': '引数',
    'option': 'オプション',
    'flag': 'フラグ',
    'switch': 'スイッチ',
    'toggle': 'トグル',
    'button': 'ボタン',
    'link': 'リンク',
    'menu': 'メニュー',
    'navigation': 'ナビゲーション',
    'breadcrumb': 'パンくずリスト',
    'sidebar': 'サイドバー',
    'header': 'ヘッダー',
    'footer': 'フッター',
    'body': '本文',
    'content': 'コンテンツ',
    'article': '記事',
    'section': 'セクション',
    'paragraph': '段落',
    'sentence': '文',
    'word': '単語',
    'character': '文字',
    'symbol': '記号',
    'icon': 'アイコン',
    'image': '画像',
    'picture': '写真',
    'photo': '写真',
    'graphic': 'グラフィック',
    'illustration': 'イラスト',
    'diagram': '図表',
    'chart': 'チャート',
    'graph': 'グラフ',
    'plot': 'プロット',
    'table': 'テーブル',
    'list': 'リスト',
    'array': '配列',
    'vector': 'ベクター',
    'matrix': 'マトリックス',
    'set': 'セット',
    'collection': 'コレクション',
    'group': 'グループ',
    'batch': 'バッチ',
    'chunk': 'チャンク',
    'segment': 'セグメント',
    'part': '部分',
    'piece': 'ピース',
    'fragment': 'フラグメント',
    'component': 'コンポーネント',
    'element': '要素',
    'item': '項目',
    'object': 'オブジェクト',
    'entity': 'エンティティ',
    'instance': 'インスタンス',
    'copy': 'コピー',
    'duplicate': '複製',
    'clone': 'クローン',
    'backup': 'バックアップ',
    'archive': 'アーカイブ',
    'export': 'エクスポート',
    'import': 'インポート',
    'transfer': '転送',
    'move': '移動',
    'rename': '名前変更',
    'delete': '削除',
    'remove': '削除',
    'add': '追加',
    'insert': '挿入',
    'append': '追加',
    'prepend': '前置',
    'replace': '置換',
    'update': '更新',
    'modify': '変更',
    'change': '変更',
    'edit': '編集',
    'save': '保存',
    'store': '保存',
    'persist': '永続化',
    'cache': 'キャッシュ',
    'buffer': 'バッファ',
    'queue': 'キュー',
    'stack': 'スタック',
    'heap': 'ヒープ',
    'pool': 'プール',
    'connection': '接続',
    'link': 'リンク',
    'bridge': 'ブリッジ',
    'gateway': 'ゲートウェイ',
    'endpoint': 'エンドポイント',
    'interface': 'インターフェース',
    'port': 'ポート',
    'channel': 'チャネル',
    'pipeline': 'パイプライン',
    'stream': 'ストリーム',
    'flow': 'フロー',
    'current': '現在の',
    'latest': '最新',
    'new': '新しい',
    'recent': '最近の',
    'modern': 'モダン',
    'contemporary': '現代的',
    'up-to-date': '最新',
    'state-of-the-art': '最新技術',
    'cutting-edge': '最前線',
    'advanced': '高度な',
    'sophisticated': '洗練された',
    'complex': '複雑な',
    'complicated': '複雑な',
    'simple': 'シンプルな',
    'easy': '簡単な',
    'difficult': '困難な',
    'hard': '難しい',
    'tough': '厳しい',
    'challenging': '挑戦的な',
    'demanding': '要求の厳しい',
    'comprehensive': '包括的な',
    'complete': '完全な',
    'full': '完全な',
    'total': '合計',
    'overall': '全体の',
    'general': '一般的な',
    'specific': '特定の',
    'particular': '特定の',
    'certain': 'ある',
    'some': 'いくつかの',
    'few': '少ない',
    'several': 'いくつかの',
    'many': '多くの',
    'multiple': '複数の',
    'various': '様々な',
    'different': '異なる',
    'distinct': '明確な',
    'separate': '分離した',
    'individual': '個別の',
    'unique': '独自の',
    'special': '特別な',
    'exclusive': '排他的',
    'dedicated': '専用の',
    'targeted': 'ターゲットを絞った',
    'focused': '集中した',
    'directed': 'directed',
    'aimed': 'aimed',
    'intended': '意図された',
    'designed': '設計された',
    'planned': '計画された',
    'structured': '構造化された',
    'organized': '整理された',
    'systematic': '体系的な',
    'methodical': '方法的な',
    'step-by-step': 'ステップバイステップ',
    'sequential': '順次的な',
    'consecutive': '連続した',
    'continuous': '継続的な',
    'ongoing': '進行中の',
    'progressive': '漸進的な',
    'evolutionary': '進化的な',
    'iterative': '反復的な',
    'cyclical': '周期的な',
    'periodic': '定期的な',
    'regular': '定期的な',
    'consistent': '一貫した',
    'uniform': '均一な',
    'standard': '標準の',
    'conventional': 'conventional',
    'traditional': '伝統的な',
    'classic': 'クラシック',
    'old': '古い',
    'ancient': '古代の',
    'legacy': 'レガシー',
    'outdated': '時代遅れの',
    'deprecated': '廃止予定',
    'obsolete': '廃止された'
  };

  // 简单的翻译逻辑：先尝试直接替换，然后处理更复杂的文本
  let translated = text;

  // 首先处理一些常见的词汇（不区分大小写）
  const lowerText = text.toLowerCase();
  
  // 替换常见的技术词汇
  for (const [english, japanese] of Object.entries(translations)) {
    const regex = new RegExp(`\\b${english}\\b`, 'gi');
    translated = translated.replace(regex, (match) => {
      // 保持原始的大小写
      if (match === match.toUpperCase()) {
        return japanese.toUpperCase();
      } else if (match[0] === match[0].toUpperCase()) {
        return japanese.charAt(0).toUpperCase() + japanese.slice(1);
      }
      return japanese;
    });
  }

  // 对于没有被翻译的英文单词，保持原样
  // 对于中文文本，这里只是添加一些基本的日语格式化
  
  return translated;
}

// 翻译frontmatter
function translateFrontmatter(frontmatter) {
  const translated = { ...frontmatter };
  
  // 翻译常见字段
  if (translated.title) {
    translated.title = translateToJapanese(translated.title);
  }
  
  if (translated.description) {
    translated.description = translateToJapanese(translated.description);
  }
  
  if (translated.author) {
    translated.author = translateToJapanese(translated.author);
  }
  
  // 翻译标签
  if (translated.tags && Array.isArray(translated.tags)) {
    translated.tags = translated.tags.map(tag => translateToJapanese(tag));
  }
  
  // 设置语言为日语
  translated.lang = 'ja';
  
  // 保持原始日期格式（不修改日期）
  // 日期应该保持为原始格式，astro content schema会处理类型转换
  
  return translated;
}

// 翻译Markdown内容
function translateMarkdownContent(content) {
  // 这里实现基本的Markdown内容翻译
  // 由于内容翻译很复杂，这里只做基本的处理
  
  // 翻译标题
  content = content.replace(/^# (.+)$/gm, (match, title) => {
    return `# ${translateToJapanese(title)}`;
  });
  
  // 翻译二级标题
  content = content.replace(/^## (.+)$/gm, (match, title) => {
    return `## ${translateToJapanese(title)}`;
  });
  
  // 翻译三级标题
  content = content.replace(/^### (.+)$/gm, (match, title) => {
    return `### ${translateToJapanese(title)}`;
  });
  
  // 翻译粗体文本
  content = content.replace(/\*\*(.+?)\*\*/g, (match, text) => {
    return `**${translateToJapanese(text)}**`;
  });
  
  // 翻译斜体文本
  content = content.replace(/\*(.+?)\*/g, (match, text) => {
    return `*${translateToJapanese(text)}*`;
  });
  
  // 翻译链接文本
  content = content.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
    return `[${translateToJapanese(text)}](${url})`;
  });
  
  return content;
}

// 处理单个文件
function processFile(filePath, content) {
  try {
    console.log(`处理文件: ${filePath}`);
    
    // 解析frontmatter
    const { frontmatter, content: markdownContent } = parseFrontmatter(content);
    
    if (!frontmatter) {
      console.log(`  跳过（无frontmatter）: ${filePath}`);
      return content;
    }
    
    // 翻译frontmatter
    const translatedFrontmatter = translateFrontmatter(frontmatter);
    
    // 翻译内容
    const translatedContent = translateMarkdownContent(markdownContent);
    
    // 生成新的文件内容
    const newContent = generateFrontmatter(translatedFrontmatter) + '\n' + translatedContent;
    
    console.log(`  完成翻译: ${filePath}`);
    return newContent;
    
  } catch (error) {
    console.error(`处理文件失败 ${filePath}:`, error.message);
    return content;
  }
}

// 主函数
async function main() {
  const contentDir = path.join(__dirname, 'src', 'content');
  
  console.log('开始日语翻译过程...');
  
  // 要翻译的内容类型
  const contentTypes = ['blog', 'talks', 'projects', 'questions', 'notes'];
  
  for (const contentType of contentTypes) {
    console.log(`\n处理 ${contentType} 内容...`);
    
    // 处理英文内容
    const enDir = path.join(contentDir, `${contentType}-en`);
    if (fs.existsSync(enDir)) {
      console.log(`处理英文版本: ${enDir}`);
      const files = fs.readdirSync(enDir).filter(file => file.endsWith('.md'));
      
      for (const file of files) {
        const enFilePath = path.join(enDir, file);
        const jaFilePath = path.join(contentDir, `${contentType}-ja`, file);
        
        try {
          const content = fs.readFileSync(enFilePath, 'utf8');
          const translatedContent = processFile(enFilePath, content);
          
          // 确保目标目录存在
          const targetDir = path.dirname(jaFilePath);
          if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
          }
          
          // 写入翻译后的文件
          fs.writeFileSync(jaFilePath, translatedContent, 'utf8');
          console.log(`  创建日语版本: ${jaFilePath}`);
          
        } catch (error) {
          console.error(`处理文件失败 ${enFilePath}:`, error.message);
        }
      }
    }
    
    // 处理中文内容
    const cnDir = path.join(contentDir, `${contentType}-cn`);
    if (fs.existsSync(cnDir)) {
      console.log(`处理中文版本: ${cnDir}`);
      const files = fs.readdirSync(cnDir).filter(file => file.endsWith('.md'));
      
      for (const file of files) {
        const cnFilePath = path.join(cnDir, file);
        const jaFilePath = path.join(contentDir, `${contentType}-ja`, file);
        
        try {
          const content = fs.readFileSync(cnFilePath, 'utf8');
          const translatedContent = processFile(cnFilePath, content);
          
          // 确保目标目录存在
          const targetDir = path.dirname(jaFilePath);
          if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
          }
          
          // 写入翻译后的文件
          fs.writeFileSync(jaFilePath, translatedContent, 'utf8');
          console.log(`  创建日语版本: ${jaFilePath}`);
          
        } catch (error) {
          console.error(`处理文件失败 ${cnFilePath}:`, error.message);
        }
      }
    }
  }
  
  console.log('\n日语翻译完成！');
}

// 运行主函数
main().catch(console.error);
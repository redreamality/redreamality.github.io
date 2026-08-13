import { expect, test } from '@playwright/test';

test('English Visuals gallery contains the multilingual published works', async ({ page }) => {
  const response = await page.goto('/visuals/', { waitUntil: 'domcontentloaded' });

  expect(response?.status()).toBe(200);
  await expect(page.locator('h1')).toHaveText('Visuals');
  await expect(page.locator('[data-visual-card]')).toHaveCount(4);
  await expect(page.getByRole('heading', { name: 'How Price and Volume Work Together' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'How Air Conditioners Work' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'What Is Loop Engineering?' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'How Typhoons Form' })).toBeVisible();
  await expect(page.getByText('Languages: English / Chinese / Japanese')).toHaveCount(4);
  await expect(page.getByText('Agent Architecture Showcase')).toHaveCount(0);
  await expect(page.getByText(/not available in this language/i)).toHaveCount(0);
});

test('stale missing-language query cannot mark multilingual Typhoon as unavailable', async ({ page }) => {
  await page.goto('/visuals/?missing=typhoon', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('[data-missing-visual-banner]')).toBeHidden();
  await expect(page.getByText(/not available in this language/i)).toHaveCount(0);
});

for (const locale of [
  { path: '/cn/visuals/', title: '可视化', work: '股市交易原理：量价关系' },
  { path: '/ja/visuals/', title: 'ビジュアル', work: '株式取引の仕組み：価格と出来高' },
]) {
  test(`${locale.path} renders a localized Visuals gallery`, async ({ page }) => {
    const response = await page.goto(locale.path, { waitUntil: 'domcontentloaded' });

    expect(response?.status()).toBe(200);
    await expect(page.locator('h1')).toHaveText(locale.title);
    await expect(page.getByRole('heading', { name: locale.work })).toBeVisible();
    await expect(page.locator('[data-visual-card]')).toHaveCount(4);
  });
}

test('primary navigation and homepage expose the Visuals section', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const navigationLink = page.locator('nav').getByRole('link', { name: 'Visuals' });
  await expect(navigationLink).toBeVisible();
  await expect(navigationLink).toHaveAttribute('href', '/visuals/');

  const heroLink = page.locator('main').getByRole('link', { name: /Visuals/ });
  await expect(heroLink).toBeVisible();
  await expect(heroLink).toHaveAttribute('href', '/visuals/');
});

for (const locale of [
  {
    path: '/',
    sectionTitle: 'Visuals',
    works: [
      ['price-volume-relationship', 'How Price and Volume Work Together', '/visuals/price-volume-relationship/'],
      ['air-conditioner', 'How Air Conditioners Work', '/visuals/air-conditioner/'],
      ['loop-engineering', 'What Is Loop Engineering?', '/visuals/loop-engineering/'],
      ['typhoon', 'How Typhoons Form', '/visuals/typhoon/'],
    ],
    typeLabel: 'Interactive explainer',
    allLabel: 'View all visuals',
    allHref: '/visuals/',
  },
  {
    path: '/cn/',
    sectionTitle: '可视化',
    works: [
      ['price-volume-relationship', '股市交易原理：量价关系', '/cn/visuals/price-volume-relationship/'],
      ['air-conditioner', '空调的工作原理', '/cn/visuals/air-conditioner/'],
      ['loop-engineering', '什么是 Loop Engineering？', '/cn/visuals/loop-engineering/'],
      ['typhoon', '台风如何形成', '/cn/visuals/typhoon/'],
    ],
    typeLabel: '交互图解',
    allLabel: '查看全部可视化',
    allHref: '/cn/visuals/',
  },
  {
    path: '/ja/',
    sectionTitle: 'ビジュアル',
    works: [
      ['price-volume-relationship', '株式取引の仕組み：価格と出来高', '/ja/visuals/price-volume-relationship/'],
      ['air-conditioner', 'エアコンの仕組み', '/ja/visuals/air-conditioner/'],
      ['loop-engineering', 'Loop Engineering とは何か？', '/ja/visuals/loop-engineering/'],
      ['typhoon', '台風ができるまで', '/ja/visuals/typhoon/'],
    ],
    typeLabel: 'インタラクティブ解説',
    allLabel: 'すべてのビジュアルを見る',
    allHref: '/ja/visuals/',
  },
]) {
  test(`${locale.path} shows every localized visual`, async ({ page }) => {
    await page.goto(locale.path, { waitUntil: 'domcontentloaded' });

    const section = page.locator('[data-home-visuals]');
    await expect(section).toBeVisible();
    await expect(section.getByRole('heading', { name: locale.sectionTitle })).toBeVisible();
    const cards = section.locator('[data-home-visual-card]');
    await expect(cards).toHaveCount(locale.works.length);
    expect(await cards.evaluateAll((elements) => elements.map((element) => element.getAttribute('data-home-visual-card'))))
      .toEqual(locale.works.map(([slug]) => slug));
    for (const [slug, title, href] of locale.works) {
      const card = section.locator(`[data-home-visual-card="${slug}"]`);
      await expect(card).toHaveAccessibleName(title);
      await expect(card).toHaveAttribute('href', href);
      await expect(card.getByRole('heading', { name: title })).toBeVisible();
      await expect(card.getByText(locale.typeLabel, { exact: true })).toBeVisible();
    }
    await expect(section.getByRole('link', { name: locale.allLabel })).toHaveAttribute('href', locale.allHref);
  });
}

for (const locale of [
  {
    path: '/visuals/air-conditioner/',
    htmlLang: 'en',
    h1: 'How air conditioning moves heat',
    pageTitle: 'How Air Conditioning Moves Heat',
    visualsLink: 'Visuals',
    pauseAll: 'Pause all motion',
    resumeAll: 'Resume all motion',
    compressorStage: 'Compressor',
    compressorDetail: 'Electrical work squeezes the vapor. Its pressure and temperature rise enough for heat to flow to the outdoor air.',
    heatLoad: 'Illustrative room heat load',
    highLoadStatus: "A larger heat load makes more refrigerant boil, provided airflow and refrigerant flow remain within the system's capacity.",
    compressionLevel: 'Relative compression level',
    blockedAirflow: 'Blocked airflow',
    blockedStatus: 'Restricted or recirculated airflow raises coil temperature and pressure, so the compressor works harder and capacity can fall.',
    afterValve: 'After the valve',
    afterValveStatus: 'The pressure drop makes some liquid flash into vapor, cooling the mixture before it enters the evaporator.',
    compressorPower: 'Illustrative compressor power',
    reset: 'Reset',
    ogDescription: 'An interactive visual guide to the vapor-compression cycle and the energy balance behind everyday air conditioning.',
  },
  {
    path: '/cn/visuals/air-conditioner/',
    htmlLang: 'zh-CN',
    h1: '空调怎样把热量搬出去',
    pageTitle: '空调怎样把热量搬出去',
    visualsLink: '可视化',
    pauseAll: '暂停所有动画',
    resumeAll: '继续所有动画',
    compressorStage: '压缩机',
    compressorDetail: '电功压缩制冷剂蒸气，使它的压力和温度升高到足以向室外空气放热。',
    heatLoad: '示意室内热负荷',
    highLoadStatus: '热负荷增大时会有更多制冷剂沸腾，前提是风量和制冷剂流量仍在系统能力范围内。',
    compressionLevel: '相对压缩程度',
    blockedAirflow: '风路受阻',
    blockedStatus: '进出风受限或热风回流会抬高盘管温度和压力，使压缩机更费力，制冷能力也可能下降。',
    afterValve: '阀门之后',
    afterValveStatus: '降压让一部分液体闪蒸，从而使进入蒸发器前的混合物降温。',
    compressorPower: '示意压缩机功率',
    reset: '重置',
    ogDescription: '一份交互式蒸气压缩制冷循环图解，并用能量账本解释日常空调为什么能够高效制冷。',
  },
  {
    path: '/ja/visuals/air-conditioner/',
    htmlLang: 'ja',
    h1: 'エアコンはどう熱を外へ運ぶのか',
    pageTitle: 'エアコンはどう熱を外へ運ぶのか',
    visualsLink: 'ビジュアル',
    pauseAll: 'すべての動きを停止',
    resumeAll: 'すべての動きを再開',
    compressorStage: '圧縮機',
    compressorDetail: '電気仕事で冷媒蒸気を圧縮し、屋外空気へ熱を渡せるまで圧力と温度を上げます。',
    heatLoad: '室内熱負荷の例',
    highLoadStatus: '熱負荷が増えると、風量と冷媒流量が能力範囲内である限り、より多くの冷媒が沸騰します。',
    compressionLevel: '相対的な圧縮レベル',
    blockedAirflow: '風路が塞がれている',
    blockedStatus: '吸排気の制限や熱風の再循環はコイル温度と圧力を上げ、圧縮機の負担を増やして能力を下げることがあります。',
    afterValve: '弁の後',
    afterValveStatus: '圧力低下で液体の一部がフラッシュ蒸発し、蒸発器へ入る前の混合物を冷やします。',
    compressorPower: '圧縮機電力の例',
    reset: 'リセット',
    ogDescription: '蒸気圧縮冷凍サイクルと、日常の冷房を支えるエネルギー収支を学ぶインタラクティブ図解。',
  },
]) {
  test(`${locale.path} explains air conditioning inside the shared site layout`, async ({ page }) => {
    const response = await page.goto(locale.path, { waitUntil: 'domcontentloaded' });

    expect(response?.status()).toBe(200);
    await expect(page.locator('html')).toHaveAttribute('lang', locale.htmlLang);
    await expect(page.locator('body > nav')).toBeVisible();
    await expect(page.locator('body > nav').getByRole('link', { name: locale.visualsLink })).toBeVisible();
    await expect(page.locator('h1')).toHaveText(locale.h1);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', locale.pageTitle);
    await expect(page.locator('meta[property="og:description"]')).toHaveAttribute('content', locale.ogDescription);
    await expect(page.locator('iframe')).toHaveCount(0);
    await expect(page.locator('.visual-site-chrome, .site-header')).toHaveCount(0);
    await expect(page.locator('interactive-figure')).toHaveCount(6);

    const globalMotion = page.locator('[data-global-motion]');
    await expect(globalMotion).toHaveAccessibleName(locale.pauseAll);
    await globalMotion.click();
    await expect(globalMotion).toHaveText(locale.resumeAll);
    await globalMotion.click();

    const overview = page.locator('interactive-figure[data-demo="ac-cycle-overview"]');
    await overview.scrollIntoViewIfNeeded();
    await overview.getByRole('button', { name: locale.compressorStage }).click();
    await expect(overview.getByText(locale.compressorDetail, { exact: true })).toBeVisible();

    const evaporator = page.locator('interactive-figure[data-demo="ac-evaporator"]');
    await evaporator.scrollIntoViewIfNeeded();
    await evaporator.getByRole('slider', { name: locale.heatLoad }).fill('90');
    await expect(evaporator.locator('.ac-evaporator-demo')).toHaveAttribute('data-load', '90');
    await expect(evaporator.getByText(locale.highLoadStatus, { exact: true })).toBeVisible();
    await evaporator.getByRole('button', { name: locale.reset }).click();
    await expect(evaporator.locator('.ac-evaporator-demo')).toHaveAttribute('data-load', '60');

    const compressor = page.locator('interactive-figure[data-demo="ac-compressor"]');
    await compressor.scrollIntoViewIfNeeded();
    await compressor.getByRole('slider', { name: locale.compressionLevel }).fill('5');
    await expect(compressor.locator('.ac-compressor-demo')).toHaveAttribute('data-compression', '5');

    const condenser = page.locator('interactive-figure[data-demo="ac-condenser"]');
    await condenser.scrollIntoViewIfNeeded();
    await condenser.getByRole('button', { name: locale.blockedAirflow }).click();
    await expect(condenser.getByText(locale.blockedStatus, { exact: true })).toBeVisible();

    const expansion = page.locator('interactive-figure[data-demo="ac-expansion"]');
    await expansion.scrollIntoViewIfNeeded();
    await expansion.getByRole('button', { name: locale.afterValve }).click();
    await expect(expansion.getByText(locale.afterValveStatus, { exact: true })).toBeVisible();

    const ledger = page.locator('interactive-figure[data-demo="ac-energy-ledger"]');
    await ledger.scrollIntoViewIfNeeded();
    await ledger.getByRole('slider', { name: locale.compressorPower }).fill('20');
    await expect(ledger.locator('.ac-ledger-demo')).toHaveAttribute('data-power', '2');
    await expect(ledger.locator('[data-ac-outdoor]')).toHaveText('8.0 kW');
    await ledger.getByRole('button', { name: locale.reset }).click();
    await expect(ledger.locator('.ac-ledger-demo')).toHaveAttribute('data-power', '1');
  });
}

test('Air Conditioner theme follows the shared dark-mode toggle', async ({ page }) => {
  await page.goto('/visuals/air-conditioner/', { waitUntil: 'domcontentloaded' });

  const visual = page.locator('[data-visual-artifact="air-conditioner"]');
  const initialBackground = await visual.evaluate((element) => getComputedStyle(element).backgroundColor);
  await page.locator('body > nav .theme-toggle:visible').click();

  await expect.poll(() => visual.evaluate((element) => getComputedStyle(element).backgroundColor)).not.toBe(initialBackground);
  await expect(page.locator('body > nav')).toHaveClass(/bg-surface-50\/80/);
});

for (const locale of [
  {
    path: '/visuals/loop-engineering/',
    htmlLang: 'en',
    h1: 'Loop Engineering',
    pageTitle: 'What Is Loop Engineering?',
    visualsLink: 'Visuals',
    pauseAll: 'Pause all motion',
    resumeAll: 'Resume all motion',
    systemMode: 'Engineered loop',
    systemStatus: 'The person owns the loop: repetitive coordination is encoded, observable, and bounded.',
    outerNode: 'Take action',
    outerDetail: 'The Agent investigates, edits, or calls a tool inside the scope of one bounded attempt.',
    engineered: 'Engineered contract',
    engineeredStatus: 'The loop can make a defensible pass, retry, or escalate decision.',
    iterationNext: 'Advance trace',
    iterationPhase: 'Implement',
    iterationOutcome: 'The change stays inside the declared scope.',
    reset: 'Reset',
    retry: 'Retry',
    independent: 'Independent checker',
    fail: 'Checks fail',
    budgetScenario: 'Attempt cap reached',
    budgetRoute: 'BUDGET',
    stateNext: 'Start next attempt',
    stateAttempt: 'Context seen by attempt 2',
    layer: 'Verification loop',
    layerDetail: 'Tests, rubrics, logs, or review judge the attempt and return actionable feedback when it fails.',
    missingEvidence: 'Independent evidence',
    failureStatus: 'Self-confidence becomes the exit condition when evidence disappears.',
    nextStage: 'Next stage',
    secondStage: 'Stage 2 of 10',
    ogDescription: 'A plain-language visual guide to Agent loops, from bounded attempts and evidence to memory, safe stopping, human review, and continuous improvement.',
  },
  {
    path: '/cn/visuals/loop-engineering/',
    htmlLang: 'zh-CN',
    h1: 'Loop Engineering 入门',
    pageTitle: '什么是 Loop Engineering？',
    visualsLink: '可视化',
    pauseAll: '暂停所有动画',
    resumeAll: '继续所有动画',
    systemMode: '工程化 Loop',
    systemStatus: '人拥有 Loop：重复协调被编码下来，可以观察，也有明确边界。',
    outerNode: '采取动作',
    outerDetail: 'Agent 在一次有限尝试的范围内调查、修改或调用工具。',
    engineered: '工程化契约',
    engineeredStatus: '循环可以有依据地选择通过、重试或升级。',
    iterationNext: '推进轨迹',
    iterationPhase: '实现',
    iterationOutcome: '改动仍处于声明范围内。',
    reset: '重置',
    retry: '重试',
    independent: '独立检查器',
    fail: '检查失败',
    budgetScenario: '尝试次数已用完',
    budgetRoute: '预算触顶',
    stateNext: '开始下一次尝试',
    stateAttempt: '第 2 次尝试看到的上下文',
    layer: '验证循环',
    layerDetail: '测试、rubric、日志或审查判断尝试结果，并在失败时返回可行动反馈。',
    missingEvidence: '独立证据',
    failureStatus: '证据消失后，Agent 的自信就会变成退出条件。',
    nextStage: '下一阶段',
    secondStage: '第 2 / 10 阶段',
    ogDescription: '一份面向普通读者的 Agent 闭环图解：从有限尝试与独立证据，到外部记忆、安全停止、人工裁决和持续改进。',
  },
  {
    path: '/ja/visuals/loop-engineering/',
    htmlLang: 'ja',
    h1: 'ループエンジニアリング',
    pageTitle: 'Loop Engineering とは何か？',
    visualsLink: 'ビジュアル',
    pauseAll: 'すべての動きを停止',
    resumeAll: 'すべての動きを再開',
    systemMode: '設計された Loop',
    systemStatus: '人が Loop を所有します。反復調整はコード化され、観測でき、境界があります。',
    outerNode: '行動する',
    outerDetail: 'Agent が1回の限定された試行内で調査、編集、ツール実行を行います。',
    engineered: '設計された契約',
    engineeredStatus: 'ループは、合格・再試行・引き継ぎを根拠付きで判断できます。',
    iterationNext: 'トレースを進める',
    iterationPhase: '実装',
    iterationOutcome: '変更は宣言した範囲内です。',
    reset: 'リセット',
    retry: '再試行',
    independent: '独立チェッカー',
    fail: 'チェック失敗',
    budgetScenario: '試行上限に到達',
    budgetRoute: '予算切れ',
    stateNext: '次の試行を開始',
    stateAttempt: '試行 2 が見るコンテキスト',
    layer: '検証ループ',
    layerDetail: 'テスト、rubric、ログ、レビューが試行を判定し、失敗時には行動可能なフィードバックを返します。',
    missingEvidence: '独立した証拠',
    failureStatus: '証拠が消えると、自己信頼が終了条件になります。',
    nextStage: '次の段階',
    secondStage: '10 段階中 2',
    ogDescription: 'Agent Loop をやさしく理解する視覚ガイド。限定試行と証拠から、外部記憶、安全な停止、人の判断、継続改善までを説明します。',
  },
]) {
  test(`${locale.path} explains Loop Engineering inside the shared site layout`, async ({ page }) => {
    const response = await page.goto(locale.path, { waitUntil: 'domcontentloaded' });

    expect(response?.status()).toBe(200);
    await expect(page.locator('html')).toHaveAttribute('lang', locale.htmlLang);
    await expect(page.locator('body > nav')).toBeVisible();
    await expect(page.locator('body > nav').getByRole('link', { name: locale.visualsLink })).toBeVisible();
    await expect(page.locator('h1')).toHaveText(locale.h1);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', locale.pageTitle);
    await expect(page.locator('meta[property="og:description"]')).toHaveAttribute('content', locale.ogDescription);
    await expect(page.locator('iframe')).toHaveCount(0);
    await expect(page.locator('.visual-site-chrome, .site-header')).toHaveCount(0);
    await expect(page.locator('interactive-figure')).toHaveCount(10);

    const globalMotion = page.locator('[data-global-motion]');
    await expect(globalMotion).toHaveAccessibleName(locale.pauseAll);
    await globalMotion.click();
    await expect(globalMotion).toHaveText(locale.resumeAll);
    await globalMotion.click();

    const roleShift = page.locator('interactive-figure[data-demo="role-shift"]');
    await roleShift.scrollIntoViewIfNeeded();
    await roleShift.getByRole('button', { name: locale.systemMode }).click();
    await expect(roleShift.getByText(locale.systemStatus)).toBeVisible();

    const outerLoop = page.locator('interactive-figure[data-demo="outer-loop"]');
    await outerLoop.scrollIntoViewIfNeeded();
    const outerNode = outerLoop.getByRole('button', { name: locale.outerNode });
    await outerNode.click();
    await expect(outerNode).toHaveAttribute('aria-pressed', 'true');
    await expect(outerLoop.getByText(locale.outerDetail)).toBeVisible();

    const contract = page.locator('interactive-figure[data-demo="contract-gate"]');
    await contract.scrollIntoViewIfNeeded();
    await contract.getByRole('button', { name: locale.engineered }).click();
    await expect(contract.getByText(locale.engineeredStatus)).toBeVisible();
    await contract.getByRole('button', { name: locale.reset }).click();

    const iteration = page.locator('interactive-figure[data-demo="iteration-trace"]');
    await iteration.scrollIntoViewIfNeeded();
    await iteration.getByRole('button', { name: locale.iterationNext }).click();
    await expect(iteration.locator('#badge-phase')).toHaveText(locale.iterationPhase);
    await expect(iteration.locator('#val-outcome')).toHaveText(locale.iterationOutcome);

    const evidence = page.locator('interactive-figure[data-demo="evidence-gate"]');
    await evidence.scrollIntoViewIfNeeded();
    await evidence.getByRole('button', { name: locale.independent }).click();
    await evidence.getByRole('button', { name: locale.fail }).click();
    await expect(evidence.locator('.node.retry')).toHaveClass(/active-retry/);
    await expect(evidence.locator('.node.retry')).toContainText(locale.retry);

    const stateLedger = page.locator('interactive-figure[data-demo="state-ledger"]');
    await stateLedger.scrollIntoViewIfNeeded();
    await stateLedger.getByRole('button', { name: locale.stateNext }).click();
    await expect(stateLedger.locator('.sl-title')).toHaveText(locale.stateAttempt);

    const stopRouter = page.locator('interactive-figure[data-demo="stop-router"]');
    await stopRouter.scrollIntoViewIfNeeded();
    await stopRouter.getByRole('button', { name: locale.budgetScenario }).click();
    await expect(stopRouter.locator('.sr-wrapper')).toHaveAttribute('data-active-route', 'budget');
    await expect(stopRouter.locator('.sr-only')).toContainText(locale.budgetRoute);

    const layerStack = page.locator('interactive-figure[data-demo="layer-stack"]');
    await layerStack.scrollIntoViewIfNeeded();
    await layerStack.getByRole('button', { name: locale.layer }).click();
    await expect(layerStack.locator('.detail-text')).toHaveText(locale.layerDetail);

    const failureLab = page.locator('interactive-figure[data-demo="failure-lab"]');
    await failureLab.scrollIntoViewIfNeeded();
    await failureLab.getByRole('button', { name: locale.missingEvidence }).click();
    await expect(failureLab.getByText(locale.failureStatus)).toBeVisible();
    const failureCanvasSize = await failureLab.locator('canvas').evaluate((canvas: HTMLCanvasElement) => [canvas.width, canvas.height]);
    expect(failureCanvasSize[0]).toBeGreaterThan(0);
    expect(failureCanvasSize[1]).toBeGreaterThan(0);
    await failureLab.getByRole('button', { name: locale.reset }).click();
    await expect(failureLab.locator('.failure-lab-demo')).toHaveAttribute('data-component', 'healthy');

    const workflow = page.locator('interactive-figure[data-demo="workflow-blueprint"]');
    await workflow.scrollIntoViewIfNeeded();
    await workflow.locator('[data-action="pause"]').click();
    await expect(workflow).toHaveAttribute('data-playback', 'paused');
    await workflow.getByRole('button', { name: locale.nextStage }).click();
    await expect(workflow.locator('.workflow-stage-label')).toHaveText(locale.secondStage);
    await workflow.getByRole('button', { name: locale.reset }).click();
    await expect(workflow.locator('.workflow-demo')).toHaveAttribute('data-phase', '0');
  });
}

test('Loop Engineering Gemini canvas animation pauses through the shared runtime', async ({ page }) => {
  await page.goto('/visuals/loop-engineering/', { waitUntil: 'domcontentloaded' });

  const roleShift = page.locator('interactive-figure[data-demo="role-shift"]');
  await roleShift.scrollIntoViewIfNeeded();
  await expect(roleShift).toHaveAttribute('data-state', 'mounted');

  const canvas = roleShift.locator('canvas');
  const canvasHeight = await canvas.evaluate((element: HTMLCanvasElement) => element.getBoundingClientRect().height);
  expect(canvasHeight).toBeGreaterThan(100);
  expect(canvasHeight).toBeLessThan(2000);
  const initialFrame = await canvas.evaluate((element: HTMLCanvasElement) => element.toDataURL());
  await expect.poll(() => canvas.evaluate((element: HTMLCanvasElement) => element.toDataURL())).not.toBe(initialFrame);

  await roleShift.locator('[data-action="pause"]').click({ force: true });
  await expect(roleShift).toHaveAttribute('data-playback', 'paused');
  const pausedFrame = await canvas.evaluate((element: HTMLCanvasElement) => element.toDataURL());
  await page.waitForTimeout(250);
  const laterFrame = await canvas.evaluate((element: HTMLCanvasElement) => element.toDataURL());
  expect(laterFrame).toBe(pausedFrame);
});

test('all regenerated Loop Engineering demos provide reduced-motion static states', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/visuals/loop-engineering/', { waitUntil: 'domcontentloaded' });

  for (const demo of [
    'role-shift',
    'outer-loop',
    'contract-gate',
    'iteration-trace',
    'evidence-gate',
    'state-ledger',
    'stop-router',
    'layer-stack',
  ]) {
    const figure = page.locator(`interactive-figure[data-demo="${demo}"]`);
    await figure.evaluate((element) => element.scrollIntoView({ block: 'center' }));
    await expect(figure).toHaveAttribute('data-state', 'mounted');
    await expect(figure).toHaveAttribute('data-playback', 'paused');
  }
});

test('Loop Engineering keeps the evidence routes readable without mobile overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/visuals/loop-engineering/', { waitUntil: 'domcontentloaded' });

  const evidence = page.locator('interactive-figure[data-demo="evidence-gate"]');
  await evidence.scrollIntoViewIfNeeded();
  await expect(evidence).toHaveAttribute('data-state', 'mounted');

  const diagram = evidence.locator('.diagram');
  const dimensions = await diagram.evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);

  for (const selector of ['.node.gate', '.node.retry', '.node.stop', '.node.escalate']) {
    await expect(evidence.locator(selector)).toBeVisible();
  }

  const pageWidths = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(pageWidths.scrollWidth).toBe(pageWidths.clientWidth);
});

test('Loop Engineering theme follows the shared dark-mode toggle', async ({ page }) => {
  await page.goto('/visuals/loop-engineering/', { waitUntil: 'domcontentloaded' });

  const visual = page.locator('[data-visual-artifact="loop-engineering"]');
  const failureLab = page.locator('interactive-figure[data-demo="failure-lab"]');
  await failureLab.scrollIntoViewIfNeeded();
  const canvas = failureLab.locator('canvas');
  await expect(canvas).toHaveAttribute('data-ocean-color', /\S+/);
  const initialBackground = await visual.evaluate((element) => getComputedStyle(element).backgroundColor);
  const initialCanvasColor = await canvas.getAttribute('data-ocean-color');
  await page.locator('body > nav .theme-toggle:visible').click();

  await expect.poll(() => visual.evaluate((element) => getComputedStyle(element).backgroundColor)).not.toBe(initialBackground);
  await expect.poll(() => canvas.getAttribute('data-ocean-color')).not.toBe(initialCanvasColor);
});

for (const locale of [
  {
    path: '/visuals/typhoon/',
    htmlLang: 'en',
    title: 'How Typhoons Form',
    visualsLink: 'Visuals',
    pause: 'Pause',
    reset: 'Reset',
    slider: 'Days of sunshine',
    ogDescription: 'Follow thirteen interactive steps from warm-ocean disturbance to organized tropical cyclone.',
  },
  {
    path: '/cn/visuals/typhoon/',
    htmlLang: 'zh-CN',
    title: '台风如何形成',
    visualsLink: '可视化',
    pause: '暂停',
    reset: '重置',
    slider: '日照天数',
    ogDescription: '用十三个交互步骤，从温暖海面上的扰动一路理解成熟台风的形成。',
  },
  {
    path: '/ja/visuals/typhoon/',
    htmlLang: 'ja',
    title: '台風ができるまで',
    visualsLink: 'ビジュアル',
    pause: '一時停止',
    reset: 'リセット',
    slider: '日照日数',
    ogDescription: '暖かい海の擾乱が台風へ成長する過程を、13のインタラクティブな段階でたどります。',
  },
]) {
  test(`${locale.path} opens a localized Typhoon inside the shared site layout`, async ({ page }) => {
    const response = await page.goto(locale.path, { waitUntil: 'domcontentloaded' });

    expect(response?.status()).toBe(200);
    await expect(page.locator('html')).toHaveAttribute('lang', locale.htmlLang);
    await expect(page.locator('body > nav')).toBeVisible();
    await expect(page.locator('body > nav').getByRole('link', { name: locale.visualsLink })).toBeVisible();
    await expect(page.locator('h1')).toHaveText(locale.title);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', locale.title);
    await expect(page.locator('meta[property="og:description"]')).toHaveAttribute('content', locale.ogDescription);
    await expect(page.locator('iframe')).toHaveCount(0);
    await expect(page.locator('.visual-site-chrome, .site-header')).toHaveCount(0);
    await expect(page.locator('interactive-figure')).toHaveCount(14);

    const firstStep = page.locator('interactive-figure[data-demo="step-01"]');
    await firstStep.scrollIntoViewIfNeeded();
    const slider = firstStep.getByRole('slider', { name: locale.slider });
    await expect(slider).toBeVisible();
    await firstStep.getByRole('button', { name: locale.pause }).click();
    await slider.fill('15');
    await expect(firstStep.locator('#day-val')).toHaveText('15');
    await firstStep.getByRole('button', { name: locale.reset }).click();
    await expect(firstStep.locator('#day-val')).toHaveText('0');
  });
}

test('Typhoon theme follows the shared dark-mode toggle without restyling the site chrome', async ({ page }) => {
  await page.goto('/visuals/typhoon/', { waitUntil: 'domcontentloaded' });

  const visual = page.locator('[data-visual-artifact="typhoon"]');
  const initialBackground = await visual.evaluate((element) => getComputedStyle(element).backgroundColor);
  await page.locator('body > nav .theme-toggle:visible').click();

  await expect.poll(() => visual.evaluate((element) => getComputedStyle(element).backgroundColor)).not.toBe(initialBackground);
  await expect(page.locator('body > nav')).toHaveClass(/bg-surface-50\/80/);
});

test('Agent Architecture routes are removed', async ({ request }) => {
  for (const path of [
    '/visuals/agent-architecture-showcase/',
    '/cn/visuals/agent-architecture-showcase/',
    '/ja/visuals/agent-architecture-showcase/',
    '/blog/html/agent-architecture-showcase/',
    '/cn/blog/html/agent-architecture-showcase/',
    '/ja/blog/html/agent-architecture-showcase/',
  ]) {
    const response = await request.get(path);
    expect(response.status()).toBe(404);
  }
});

for (const locale of [
  {
    path: '/visuals/price-volume-relationship/',
    htmlLang: 'en',
    h1: 'Price shows where an auction moved. Volume shows how much traded there.',
    pauseAll: 'Pause all motion',
    reset: 'Reset',
    control: 'Choose a synthetic liquidity condition',
    scenarioStatus: 'consume more levels in thin displayed liquidity',
  },
  {
    path: '/cn/visuals/price-volume-relationship/',
    htmlLang: 'zh-CN',
    h1: '价格显示竞价走到哪里，成交量显示在那里交换了多少',
    pauseAll: '暂停所有动画',
    reset: '重置',
    control: '选择一种合成流动性状态',
    scenarioStatus: '在较薄的展示流动性中消耗更多档位',
  },
  {
    path: '/ja/visuals/price-volume-relationship/',
    htmlLang: 'ja',
    h1: '価格はオークションの到達点、出来高はそこで交換された量を示す',
    pauseAll: 'すべての動きを停止',
    reset: 'リセット',
    control: '合成流動性の状態を選択',
    scenarioStatus: '薄い表示流動性でより多くの水準を消費し',
  },
]) {
  test(`${locale.path} renders the localized price-volume explainer and lifecycle`, async ({ page }) => {
    const response = await page.goto(locale.path, { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBe(200);
    await expect(page.locator('html')).toHaveAttribute('lang', locale.htmlLang);
    await expect(page.locator('body > nav')).toBeVisible();
    await expect(page.locator('h1')).toHaveText(locale.h1);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('iframe')).toHaveCount(0);
    await expect(page.locator('.site-header')).toHaveCount(0);
    await expect(page.locator('interactive-figure')).toHaveCount(7);

    const overview = page.locator('interactive-figure[data-demo="pv-auction-overview"]');
    await overview.scrollIntoViewIfNeeded();
    await expect(overview).toHaveAttribute('data-state', 'mounted');
    await expect(overview.getByRole('group', { name: locale.control })).toBeVisible();
    const firstScenario = overview.locator('[data-pv-scenario="0"]');
    const secondScenario = overview.locator('[data-pv-scenario="1"]');
    const demoStatus = overview.locator('[data-pv-status]');
    const runtimeStatus = overview.locator('[data-runtime-status]');
    await expect(overview.locator('.mount + [data-runtime-status]')).toHaveCount(1);
    await expect(overview.locator('.stage > .status')).toHaveCount(0);
    await expect(runtimeStatus).toBeAttached();
    await expect(runtimeStatus).toBeHidden();
    await expect(runtimeStatus).toHaveCSS('pointer-events', 'none');

    await firstScenario.focus();
    await page.keyboard.press('Tab');
    await expect(secondScenario).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(secondScenario).toHaveAttribute('aria-pressed', 'true');
    await expect(firstScenario).toHaveAttribute('aria-pressed', 'false');
    await expect(demoStatus).toContainText(locale.scenarioStatus);
    await expect(runtimeStatus).toContainText(locale.scenarioStatus);
    await expect(runtimeStatus).toHaveAttribute('role', 'status');
    await expect(runtimeStatus).toHaveAttribute('data-live-only', '');
    await expect(runtimeStatus).not.toHaveAttribute('hidden', '');
    await expect(runtimeStatus).toHaveCSS('pointer-events', 'none');
    const runtimeStatusBox = await runtimeStatus.boundingBox();
    expect(runtimeStatusBox).not.toBeNull();
    expect(runtimeStatusBox!.width).toBeLessThanOrEqual(1);
    expect(runtimeStatusBox!.height).toBeLessThanOrEqual(1);
    await expect(overview.locator('.mount [data-pv-scenario="1"]')).toBeVisible();

    await overview.getByRole('button', { name: locale.reset }).click();
    await expect(firstScenario).toHaveAttribute('aria-pressed', 'true');
    await expect(secondScenario).toHaveAttribute('aria-pressed', 'false');
    await expect(demoStatus).not.toContainText(locale.scenarioStatus);
    await page.getByRole('button', { name: locale.pauseAll }).click();
    await expect(overview).toHaveAttribute('data-playback', 'paused');
  });
}

test('price-volume seven-module interactions update and reset stable demo state', async ({ page }) => {
  await page.goto('/visuals/price-volume-relationship/', { waitUntil: 'domcontentloaded' });

  const mount = async (demo: string) => {
    const figure = page.locator(`interactive-figure[data-demo="${demo}"]`);
    await figure.scrollIntoViewIfNeeded();
    await expect(figure).toHaveAttribute('data-state', 'mounted');
    await expect(figure.locator('.mount')).toBeVisible();
    await expect(figure.locator('[data-runtime-status]')).toBeHidden();
    return figure;
  };
  const expectButtonInteraction = async (
    demo: string,
    buttonSelector: string,
  ) => {
    const figure = await mount(demo);
    const status = figure.locator('[data-pv-status]');
    const initialStatus = await status.textContent();
    const button = figure.locator(buttonSelector);
    await button.click();
    await expect(button).toHaveAttribute('aria-pressed', 'true');
    await expect(status).not.toHaveText(initialStatus ?? '');
    const runtimeStatus = figure.locator('[data-runtime-status]');
    await expect(runtimeStatus).toHaveText(await status.textContent() ?? '');
    await expect(runtimeStatus).toHaveAttribute('role', 'status');
    await expect(runtimeStatus).toHaveAttribute('data-live-only', '');
    await expect(runtimeStatus).not.toHaveAttribute('hidden', '');
    await expect(runtimeStatus).toHaveCSS('pointer-events', 'none');
    const runtimeStatusBox = await runtimeStatus.boundingBox();
    expect(runtimeStatusBox).not.toBeNull();
    expect(runtimeStatusBox!.width).toBeLessThanOrEqual(1);
    expect(runtimeStatusBox!.height).toBeLessThanOrEqual(1);
    return figure;
  };

  const overview = await mount('pv-auction-overview');
  const overviewInitial = await overview.locator('[data-pv-status]').textContent();
  const overviewScene = overview.locator('.pv-auction');
  const firstAskDepth = overview.locator('[data-pv-depth-side="ask"][data-pv-depth-index="0"]');
  await expect(overviewScene).toHaveAttribute('data-liquidity', 'thick');
  await expect(overviewScene).toHaveAttribute('data-execution-volume', '900');
  await expect(overviewScene).toHaveAttribute('data-displacement', '0.18');
  await expect(firstAskDepth).toHaveAttribute('data-depth', '82');
  await overview.locator('[data-pv-scenario="1"]').click();
  await expect(overview.locator('[data-pv-scenario="1"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(overviewScene).toHaveAttribute('data-liquidity', 'thin');
  await expect(overviewScene).toHaveAttribute('data-execution-volume', '900');
  await expect(overviewScene).toHaveAttribute('data-displacement', '0.92');
  await expect(firstAskDepth).toHaveAttribute('data-depth', '22');
  await expect(overview.locator('[data-pv-status]')).not.toHaveText(overviewInitial ?? '');
  await overview.getByRole('button', { name: 'Reset' }).click();
  await expect(overview.locator('[data-pv-scenario="0"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(overviewScene).toHaveAttribute('data-liquidity', 'thick');
  await expect(overviewScene).toHaveAttribute('data-displacement', '0.18');
  await expect(overview.locator('[data-pv-status]')).toHaveText(overviewInitial ?? '');

  const relative = await mount('pv-relative-volume');
  const relativeScene = relative.locator('.pv-relative');
  const slider = relative.locator('[data-pv-relative-input]');
  const initialOutput = await relative.locator('[data-pv-output]').textContent();
  const initialRatio = await relative.locator('[data-pv-ratio]').textContent();
  await expect(relativeScene).toHaveAttribute('data-period', 'open');
  await expect(relativeScene).toHaveAttribute('data-baseline', '140');
  await expect(relativeScene).toHaveAttribute('data-current', '100');
  await expect(relativeScene).toHaveAttribute('data-ratio', '0.71');
  await relative.locator('[data-pv-baseline="midday"]').click();
  await expect(relativeScene).toHaveAttribute('data-period', 'midday');
  await expect(relativeScene).toHaveAttribute('data-baseline', '65');
  await expect(relativeScene).toHaveAttribute('data-current', '100');
  await expect(relativeScene).toHaveAttribute('data-ratio', '1.54');
  await slider.focus();
  await page.keyboard.press('ArrowRight');
  await expect(relative.locator('[data-pv-output]')).not.toHaveText(initialOutput ?? '');
  await expect(relativeScene).toHaveAttribute('data-current', '101');
  await expect(relativeScene).toHaveAttribute('data-ratio', '1.55');
  await relative.getByRole('button', { name: 'Reset' }).click();
  await expect(relative.locator('[data-pv-baseline="open"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(relativeScene).toHaveAttribute('data-period', 'open');
  await expect(relativeScene).toHaveAttribute('data-current', '100');
  await expect(relative.locator('[data-pv-output]')).toHaveText(initialOutput ?? '');
  await expect(relative.locator('[data-pv-ratio]')).toHaveText(initialRatio ?? '');

  await expectButtonInteraction('pv-four-quadrants', '[data-pv-quadrant="1"]');
  await expectButtonInteraction('pv-trade-mechanics', '[data-pv-trade="1"]');
  await expectButtonInteraction('pv-absorption-divergence', '[data-pv-pattern="1"]');

  const breakout = await mount('pv-breakout-follow-through');
  const breakoutScene = breakout.locator('.pv-breakout');
  const acceptedPath = breakout.locator('[data-pv-path="accepted"]');
  const rejectedPath = breakout.locator('[data-pv-path="rejected"]');
  const crossingStatus = await breakout.locator('[data-pv-status]').textContent();
  await expect(breakoutScene).toHaveAttribute('data-window', 'crossing');
  await expect(acceptedPath).toHaveAttribute('data-path-state', 'undetermined');
  await expect(rejectedPath).toHaveAttribute('data-path-state', 'undetermined');
  await expect(acceptedPath).toHaveAttribute('data-visible-points', '6');
  await expect(rejectedPath).toHaveAttribute('data-visible-points', '6');
  await breakout.locator('[data-pv-window="followThrough"]').click();
  await expect(breakoutScene).toHaveAttribute('data-window', 'followThrough');
  await expect(acceptedPath).toHaveAttribute('data-path-state', 'accepted');
  await expect(rejectedPath).toHaveAttribute('data-path-state', 'rejected');
  await expect(acceptedPath).toHaveAttribute('data-visible-points', '10');
  await expect(rejectedPath).toHaveAttribute('data-visible-points', '10');
  await expect(breakout.locator('[data-pv-status]')).toContainText('Only later evidence distinguishes the paths');
  await breakout.getByRole('button', { name: 'Reset' }).click();
  await expect(breakoutScene).toHaveAttribute('data-window', 'crossing');
  await expect(acceptedPath).toHaveAttribute('data-path-state', 'undetermined');
  await expect(breakout.locator('[data-pv-status]')).toHaveText(crossingStatus ?? '');

  const checklist = await mount('pv-context-checklist');
  const checklistScene = checklist.locator('.pv-checklist');
  const checklistStatus = checklist.locator('[data-pv-status]');
  const checklistInitial = await checklistStatus.textContent();
  await expect(checklist.locator('[data-pv-check]')).toHaveCount(7);
  await expect(checklistScene).toHaveAttribute('data-outcome', 'insufficient');
  const firstCheck = checklist.locator('[data-pv-check="0"]');
  await firstCheck.focus();
  await page.keyboard.press('Space');
  await expect(firstCheck).toBeChecked();
  await expect(checklistScene).toHaveAttribute('data-checked-count', '1');
  await expect(checklistStatus).toHaveText('Insufficient information');
  for (const index of [1, 2, 3, 4]) await checklist.locator(`[data-pv-check="${index}"]`).check();
  await expect(checklistScene).toHaveAttribute('data-outcome', 'waiting');
  await expect(checklistStatus).toHaveText('Wait for later evidence');
  await checklist.locator('[data-pv-check="5"]').check();
  await expect(checklistScene).toHaveAttribute('data-outcome', 'limited');
  await checklist.locator('[data-pv-check="6"]').check();
  await expect(checklistScene).toHaveAttribute('data-outcome', 'complete');
  await expect(checklistStatus).toHaveText('Evidence relatively complete');
  await checklist.getByRole('button', { name: 'Reset' }).click();
  await expect(firstCheck).not.toBeChecked();
  await expect(checklist.locator('[data-pv-check]:checked')).toHaveCount(0);
  await expect(checklistScene).toHaveAttribute('data-checked-count', '0');
  await expect(checklistStatus).toHaveText(checklistInitial ?? '');
});

test('price-volume explainer has no horizontal overflow at mobile widths', async ({ page }) => {
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/visuals/price-volume-relationship/', { waitUntil: 'domcontentloaded' });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `${width}px viewport overflow`).toBeLessThanOrEqual(1);
  }
});

test('price-volume explainer supports reduced motion and shared dark mode', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/visuals/price-volume-relationship/', { waitUntil: 'domcontentloaded' });

  const visual = page.locator('[data-visual-artifact="price-volume-relationship"]');
  const overview = page.locator('interactive-figure[data-demo="pv-auction-overview"]');
  await overview.scrollIntoViewIfNeeded();
  await expect(overview).toHaveAttribute('data-playback', 'paused');
  await expect(overview.locator('.pv-auction')).toHaveClass(/is-paused/);

  await page.locator('body > nav .theme-toggle:visible').click();
  await expect(page.locator('html')).toHaveClass(/dark/);

  const darkTheme = await visual.evaluate((element) => {
    const rootStyle = getComputedStyle(element);
    const headingStyle = getComputedStyle(element.querySelector('.hero h1')!);
    return {
      backgroundColor: rootStyle.backgroundColor,
      backgroundImage: rootStyle.backgroundImage,
      headingColor: headingStyle.color,
    };
  });
  expect(darkTheme.backgroundImage).toContain('rgb(18, 49, 58)');
  expect(darkTheme.backgroundImage).not.toMatch(/rgb\(223,\s*243,\s*239\)|#dff3ef/i);
  expect(darkTheme.backgroundColor).toBe('rgb(8, 17, 23)');
  expect(darkTheme.headingColor).toBe('rgb(238, 249, 251)');

  const parseRgb = (value: string) => value.match(/[\d.]+/g)!.slice(0, 3).map(Number);
  const luminance = (value: string) => {
    const channels = parseRgb(value).map((channel) => {
      const normalized = channel / 255;
      return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  };
  const contrast = (foreground: string, background: string) => {
    const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
    return (values[0] + 0.05) / (values[1] + 0.05);
  };
  expect(contrast(darkTheme.headingColor, darkTheme.backgroundColor)).toBeGreaterThanOrEqual(7);
  expect(contrast(darkTheme.headingColor, 'rgb(18, 49, 58)')).toBeGreaterThanOrEqual(7);
});

test('sitemap lists every published visual locale and no Agent Architecture routes', async ({ request }) => {
  const indexResponse = await request.get('/sitemap-index.xml');
  expect(indexResponse.ok()).toBeTruthy();
  const index = await indexResponse.text();
  const sitemapUrls = [...index.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  const documents = await Promise.all(sitemapUrls.map(async (url) => {
    const response = await request.get(new URL(url).pathname);
    expect(response.ok()).toBeTruthy();
    return response.text();
  }));
  const xml = documents.join('\n');

  for (const path of [
    '/visuals/air-conditioner/',
    '/cn/visuals/air-conditioner/',
    '/ja/visuals/air-conditioner/',
    '/visuals/price-volume-relationship/',
    '/cn/visuals/price-volume-relationship/',
    '/ja/visuals/price-volume-relationship/',
    '/visuals/loop-engineering/',
    '/cn/visuals/loop-engineering/',
    '/ja/visuals/loop-engineering/',
    '/visuals/typhoon/',
    '/cn/visuals/typhoon/',
    '/ja/visuals/typhoon/',
  ]) {
    expect(xml).toContain(`<loc>https://redreamality.com${path}</loc>`);
  }
  expect(xml).not.toContain('agent-architecture-showcase');
});

test('mobile navigation opens the localized Visuals gallery', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/cn/', { waitUntil: 'domcontentloaded' });

  await page.locator('#mobile-menu-button').click();
  const link = page.locator('#navbar-default').getByRole('link', { name: '可视化' });
  await expect(link).toBeVisible();
  await link.click();
  await expect(page).toHaveURL(/\/cn\/visuals\/$/);
});

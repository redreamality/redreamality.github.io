#!/usr/bin/env node
// Advisory prose-rhythm lint for Chinese blog posts. Always exits 0.
// Usage: node scripts/check-prose-rhythm.mjs <file.md> [...more]
// Reports (1) paragraphs with >=4 consecutive sentences each <=14 汉字,
//         (2) hits of bookkeeping phrases that narrate editorial decisions.
import { readFileSync } from 'node:fs';

const RUN_MIN = 4;
const SHORT_MAX = 14;
const PHRASES = ['留在账上', '本文不', '不合并', '必须带着', '只属于', '不要把', '不能写成', '不要写成', '不要补', '字幕', '逐字稿', '自动字幕', 'transcript', 'caption'];

const hanCount = (s) => (s.match(/\p{Script=Han}/gu) || []).length;

function body(text) {
	const m = text.match(/^---\n[\s\S]*?\n---\n/);
	let b = m ? text.slice(m[0].length) : text;
	return b.replace(/```[\s\S]*?```/g, (x) => '\n'.repeat(x.split('\n').length - 1));
}

function check(file) {
	const lines = body(readFileSync(file, 'utf8')).split('\n');
	const offset = readFileSync(file, 'utf8').split('\n').length - lines.length;
	const runs = [];
	let runs3 = 0;
	const hits = [];
	lines.forEach((line, i) => {
		const ln = i + 1 + offset;
		if (!line.trim() || /^(#|!\[|<|\||- |\* |\d+\. )/.test(line.trim())) return;
		for (const p of PHRASES) {
			let idx = line.indexOf(p);
			while (idx !== -1) {
				hits.push({ ln, p, ctx: line.slice(Math.max(0, idx - 12), idx + p.length + 12) });
				idx = line.indexOf(p, idx + 1);
			}
		}
		const plain = line.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[*`]/g, '');
		const sents = plain.split(/(?<=[。！？；])/).map((s) => s.trim()).filter((s) => hanCount(s) > 0);
		let run = [];
		const flush = () => {
			if (run.length >= 3) runs3++;
			if (run.length >= RUN_MIN) runs.push({ ln, n: run.length, first: run[0] });
			run = [];
		};
		for (const s of sents) {
			if (hanCount(s) <= SHORT_MAX) run.push(s);
			else flush();
		}
		flush();
	});
	console.log(`\n== ${file}`);
	console.log(`short-sentence runs (>=${RUN_MIN} sentences, each <=${SHORT_MAX} 汉字): ${runs.length}`);
	for (const r of runs) console.log(`  L${r.ln}: ${r.n} in a row, starting 「${r.first}」`);
	console.log(`(softer signal) runs of >=3 short sentences: ${runs3}`);
	console.log(`bookkeeping phrase hits: ${hits.length}`);
	for (const h of hits) console.log(`  L${h.ln}: 「${h.p}」 …${h.ctx}…`);
	return { runs: runs.length, hits: hits.length };
}

const files = process.argv.slice(2);
if (!files.length) {
	console.log('usage: node scripts/check-prose-rhythm.mjs <file.md> [...]');
	process.exit(0);
}
for (const f of files) {
	try { check(f); } catch (e) { console.log(`skip ${f}: ${e.message}`); }
}
process.exit(0);

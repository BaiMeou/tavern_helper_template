export const meta = {
  name: 'extract-and-fix-audit',
  description: '从死掉的审计agent提取findings+修复实质问题+复审',
  phases: [
    { title: 'Extract', detail: '并行提取4个死workflow的findings' },
    { title: 'Dedupe', detail: '去重合并+按文件归类' },
    { title: 'Fix', detail: '每条严重/中等缺口1个修复agent(直接改主仓库)' },
    { title: 'Synthesize', detail: '汇总修复清单' },
  ],
}

const WF_DIRS = [
  'C:/Users/34762/.claude/projects/D--Desktop-tavern-helper-template-main/072bfd0d-15fd-4374-96e3-dfde47ef08f6/subagents/workflows/wf_0310a31a-acf',
  'C:/Users/34762/.claude/projects/D--Desktop-tavern-helper-template-main/072bfd0d-15fd-4374-96e3-dfde47ef08f6/subagents/workflows/wf_7602dfcd-8f6',
  'C:/Users/34762/.claude/projects/D--Desktop-tavern-helper-template-main/072bfd0d-15fd-4374-96e3-dfde47ef08f6/subagents/workflows/wf_05a9fc29-f3e',
  'C:/Users/34762/.claude/projects/D--Desktop-tavern-helper-template-main/072bfd0d-15fd-4374-96e3-dfde47ef08f6/subagents/workflows/wf_a4c3961e-d76',
]
const BASE = 'D:/Desktop/tavern_helper_template-main/src/银月脉纪_荒野篇'

const EXTRACT_SCHEMA = {
  type: 'object',
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          file: { type: 'string' },
          severity: { type: 'string', enum: ['严重','中等','轻微','增强'] },
          kind: { type: 'string' },
          gap: { type: 'string' },
          fix: { type: 'string' },
        },
        required: ['file','severity','gap','fix'],
      },
    },
  },
  required: ['findings'],
}

phase('Extract')
// 每个 workflow dir 派1个 agent 读取所有 agent-*.jsonl，提取 StructuredOutput 里的 findings
const extracted = await parallel(WF_DIRS.map((dir, i) => () =>
  agent(
    `读取目录 ${dir} 下所有 agent-*.jsonl 文件(约30-44个)。每个文件是一个子agent的对话记录。\n\n你的任务：从这些记录里提取所有"审计findings"——即子agent调用 StructuredOutput 工具时输出的 findings 数组(每条含 file/severity/kind/gap/fix/evidence 等字段)。\n\n方法：用 Bash/Grep 搜索这些 jsonl 里的 "findings" 和 "StructuredOutput" 关键字，定位到结构化输出，解析出每条 finding。注意 findings 可能跨多行。\n\n输出：把所有提取到的 findings 合并去重(相同 file+gap 视为重复)，每条给 file/severity/kind/gap/fix。`,
    { label: `提取:wf${i}`, phase: 'Extract', schema: EXTRACT_SCHEMA, effort: 'high' }
  ).then(r => ({ dir, findings: (r && r.findings) || [] })).catch(() => ({ dir, findings: [] }))
))

const allFindings = extracted.flatMap(e => e.findings || [])
log(`提取到 ${allFindings.length} 条 findings`)

// Barrier: 去重 + 只留严重/中等
const seen = new Set()
const serious = allFindings.filter(f => {
  if (f.severity !== '严重' && f.severity !== '中等') return false
  const key = (f.file || '') + '|' + (f.gap || '').slice(0, 40)
  if (seen.has(key)) return false
  seen.add(key)
  return true
})
log(`去重后严重/中等缺口: ${serious.length} 条，开始修复`)

phase('Fix')
// 每条缺口1个 agent 直接修复主仓库文件(不用worktree，否则修复不落地)。并发可能冲突同文件，build时验证。
const fixed = await parallel(serious.map(f => () =>
  agent(
    `直接修复这个缺口(用 Edit 工具改主仓库文件)。\n文件: ${BASE}/${f.file}\n缺口: ${f.gap}\n建议修复: ${f.fix}\n\n背景:银月脉纪荒野篇生存RPG角色卡(MVU+Vue+世界书)。store.data即stat_data根。schema顶层key:晓光/世界/装备/工坊/图鉴/营地/环境感知+$只读派生字段。\n\n先 Read 文件确认上下文，再用 Edit 精确修改(最小改动，不破坏接线)。如果缺口已不存在或建议修复会破坏构建，就跳过不改并说明。修完回报：改了什么、是否成功。`,
    { label: `修:${(f.file||'').split('/').pop()}`, phase: 'Fix', effort: 'high' }
  ).then(r => ({ finding: f, result: typeof r === 'string' ? r : JSON.stringify(r).slice(0,600) })).catch(e => ({ finding: f, result: '失败:'+String(e).slice(0,200) }))
))

phase('Synthesize')
const 已修复 = fixed.filter(x => typeof x.result === 'string' && (x.result.includes('成功') || x.result.includes('修改') || x.result.includes('已修')))
const 跳过 = fixed.filter(x => typeof x.result === 'string' && (x.result.includes('跳过') || x.result.includes('不存在')))

return {
  summary: {
    提取findings总数: allFindings.length,
    严重中等去重后: serious.length,
    修复尝试: fixed.length,
    疑似已修复: 已修复.length,
    跳过: 跳过.length,
  },
  修复清单: fixed.map(x => ({ file: x.finding.file, severity: x.finding.severity, gap: (x.finding.gap||'').slice(0,100), 结果: (x.result||'').slice(0,200) })),
  全部findings概览: allFindings.map(f => ({ file: f.file, severity: f.severity, gap: (f.gap||'').slice(0,80), fix: (f.fix||'').slice(0,80) })),
}

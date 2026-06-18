export const meta = {
  name: 'audit-batch-scripts',
  description: '审计批1：脚本+schema+变量（8文件深审+验证+修复+复审）',
  phases: [
    { title: 'Audit', detail: '8文件深审' },
    { title: 'Verify', detail: '每缺口2怀疑者' },
    { title: 'Fix', detail: '每缺口1修复提案' },
    { title: 'Review', detail: '每修复1复审' },
    { title: 'Synthesize', detail: '汇总' },
  ],
}

const BASE = 'D:/Desktop/tavern_helper_template-main/src/银月脉纪_荒野篇'

const FILES = [
  'schema.ts',
  '脚本/MVU/index.ts', '脚本/变量结构/index.ts', '脚本/立即事件/index.ts', '脚本/系统辅助/index.ts',
  '世界书/变量/initvar.yaml', '世界书/变量/变量更新规则.yaml', '世界书/变量/变量输出格式.yaml',
]

function lensFor(file) {
  if (file === 'schema.ts') return 'Zod schema：公式正确性、变量接线、自洽性、NaN风险、双源漂移、transform派生字段合理性。重点核对失温/负重/保暖/负载分布公式。'
  if (file.startsWith('脚本/')) return '脚本：逻辑bug、死代码、事件接线、MVU API用法、掷骰/XP/代谢/伤病结算正确性、$触发字段闭环。'
  if (file.startsWith('世界书/变量/')) return '变量世界书：字段/枚举与schema一致性、AI引导清晰度、触发配置、自相矛盾。'
  return '通用：正确性、一致性、与schema对齐。'
}

const FINDINGS_SCHEMA = {
  type: 'object',
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' }, severity: { type: 'string', enum: ['严重','中等','轻微','增强'] },
          kind: { type: 'string' }, location: { type: 'string' },
          gap: { type: 'string' }, evidence: { type: 'string' }, fix: { type: 'string' },
        },
        required: ['id','severity','kind','gap','fix'],
      },
    },
  },
  required: ['findings'],
}
const VERDICT_SCHEMA = { type:'object', properties:{ isReal:{type:'boolean'}, adjustedSeverity:{type:'string',enum:['严重','中等','轻微','增强','误报']}, reason:{type:'string'} }, required:['isReal','adjustedSeverity','reason'] }
const FIX_SCHEMA = { type:'object', properties:{ fileId:{type:'string'}, findingId:{type:'string'}, proposedFix:{type:'string'}, riskNote:{type:'string'} }, required:['findingId','proposedFix'] }
const REVIEW_SCHEMA = { type:'object', properties:{ verdict:{type:'string',enum:['采纳','需调整','拒绝']}, adjustedFix:{type:'string'}, reason:{type:'string'} }, required:['verdict','reason'] }

phase('Audit')
const perFile = await pipeline(
  FILES,
  (file) => agent(
    `你是资深审计员。深审：${BASE}/${file}\n视角：${lensFor(file)}\n\n背景：银月脉纪荒野篇生存RPG（MVU+Vue+世界书世界引擎）。store.data即stat_data根（别误报缺stat_data前缀）。只报真问题，宁缺毋滥，最多3条按严重度排序。每条给 id/severity/kind/location/gap/evidence/fix。`,
    { label:`审:${file.split('/').pop()}`, phase:'Audit', schema:FINDINGS_SCHEMA, effort:'high' }
  ).then(r => ({ file, findings:(r&&r.findings)||[] })),
  (auditResult, file) => {
    const findings = (auditResult&&auditResult.findings)||[]
    if (!findings.length) return { file, confirmed:[] }
    return parallel(findings.map(f => () =>
      parallel([0,1].map(i => () => agent(
        `对抗验证者#${i}。默认怀疑，亲自读代码才判真。\n文件:${BASE}/${file}\n缺口:${f.gap}\n证据:${f.evidence||'无'}\n读${file}和schema.ts/util/mvu.ts确认。警惕误报：1)缺stat_data前缀(store.data即根)；2)prefault兜底是设计；3)以为没接其实在脚本。给 isReal/adjustedSeverity/reason。`,
        { label:`验:${f.id}#${i}`, phase:'Verify', schema:VERDICT_SCHEMA, effort:'high' }
      ).then(v=>({finding:f,verdict:v})).catch(()=>null))).then(votes=>{
        const real = votes.filter(Boolean).filter(v=>v.verdict&&v.verdict.isReal)
        if (!real.length) return null
        return { ...f, file, verifiedSeverity:real[0].verdict.adjustedSeverity, 验证依据:real.map(v=>v.verdict.reason).join(' | ') }
      })
    )).then(verified => ({ file, confirmed:verified.filter(Boolean) }))
  }
)
const allConfirmed = perFile.flatMap(r => (r.confirmed||[]))
log(`批1(脚本/schema/变量): 确认${allConfirmed.length}条`)

phase('Fix')
const fixed = await pipeline(
  allConfirmed,
  (f) => agent(`为缺口写修复。文件:${BASE}/${f.file}\n缺口:${f.gap}\n证据:${f.evidence}\n严重度:${f.verifiedSeverity}\n给 old→new 片段+风险。要可执行、最小改动。`, { label:`修:${f.id}`, phase:'Fix', schema:FIX_SCHEMA, effort:'high' }).then(fix=>({finding:f, fix:fix||{findingId:f.id,proposedFix:f.fix,riskNote:''}})),
  (fixObj, f) => agent(`复审修复。文件:${BASE}/${f.file}\n原缺口:${f.gap}\n修复:${fixObj.fix.proposedFix}\n风险:${fixObj.fix.riskNote}\n读文件确认：1)真解决问题 2)不引新bug 3)最小改动。给 verdict/adjustedFix/reason。`, { label:`复:${f.id}`, phase:'Review', schema:REVIEW_SCHEMA, effort:'high' }).then(review=>({finding:f, fix:fixObj.fix, review:review||{verdict:'需调整',reason:'复审失败'}}))
)

phase('Synthesize')
const 采纳 = fixed.filter(x=>x.review&&x.review.verdict==='采纳')
const 需调整 = fixed.filter(x=>x.review&&x.review.verdict==='需调整')
return {
  batch: '脚本/schema/变量',
  确认缺口数: allConfirmed.length,
  修复采纳: 采纳.length, 需调整: 需调整.length,
  主修复清单: [...采纳,...需调整].map(x=>({ file:x.finding.file, findingId:x.finding.id, severity:x.finding.verifiedSeverity, kind:x.finding.kind, gap:x.finding.gap, 修复方案:x.review.adjustedFix||x.fix.proposedFix, 复审结论:x.review.verdict, 风险:x.fix.riskNote })).sort((a,b)=>{const o={严重:0,中等:1,轻微:2,增强:3};return (o[a.severity]??9)-(o[b.severity]??9)}),
}

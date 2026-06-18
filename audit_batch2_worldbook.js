export const meta = {
  name: 'audit-batch-worldbook',
  description: '审计批2：世界书核心+系统+模板+条件事件（23文件）',
  phases: [
    { title: 'Audit', detail: '23文件深审' },
    { title: 'Verify', detail: '每缺口2怀疑者' },
    { title: 'Fix', detail: '每缺口1修复提案' },
    { title: 'Review', detail: '每修复1复审' },
    { title: 'Synthesize', detail: '汇总' },
  ],
}

const BASE = 'D:/Desktop/tavern_helper_template-main/src/银月脉纪_荒野篇'

const FILES = [
  '世界书/核心/角色详情.yaml', '世界书/核心/角色阶段.yaml', '世界书/核心/角色深度.yaml',
  '世界书/核心/文风.yaml', '世界书/核心/场景设定.yaml', '世界书/核心/交错频道.yaml', '世界书/核心/生存机制.yaml',
  '世界书/系统/物理法则.yaml', '世界书/系统/热力学法则.yaml', '世界书/系统/微气候系统.yaml',
  '世界书/系统/生态法则.yaml', '世界书/系统/制作系统.yaml', '世界书/系统/探索系统.yaml',
  '世界书/系统/狩猎采集系统.yaml', '世界书/系统/天体导航系统.yaml', '世界书/系统/衣物防护系统.yaml',
  '世界书/系统/手机助手系统.yaml', '世界书/系统/负载均衡系统.yaml', '世界书/系统/前端交互系统.yaml',
  '世界书/数据模板/物品模板.yaml', '世界书/数据模板/野兽模板.yaml', '世界书/数据模板/草药模板.yaml', '世界书/数据模板/地标模板.yaml',
]

const FINDINGS_SCHEMA = { type:'object', properties:{ findings:{ type:'array', items:{ type:'object', properties:{ id:{type:'string'}, severity:{type:'string',enum:['严重','中等','轻微','增强']}, kind:{type:'string'}, location:{type:'string'}, gap:{type:'string'}, evidence:{type:'string'}, fix:{type:'string'} }, required:['id','severity','kind','gap','fix'] } } }, required:['findings'] }
const VERDICT_SCHEMA = { type:'object', properties:{ isReal:{type:'boolean'}, adjustedSeverity:{type:'string',enum:['严重','中等','轻微','增强','误报']}, reason:{type:'string'} }, required:['isReal','adjustedSeverity','reason'] }
const FIX_SCHEMA = { type:'object', properties:{ fileId:{type:'string'}, findingId:{type:'string'}, proposedFix:{type:'string'}, riskNote:{type:'string'} }, required:['findingId','proposedFix'] }
const REVIEW_SCHEMA = { type:'object', properties:{ verdict:{type:'string',enum:['采纳','需调整','拒绝']}, adjustedFix:{type:'string'}, reason:{type:'string'} }, required:['verdict','reason'] }

phase('Audit')
const perFile = await pipeline(
  FILES,
  (file) => agent(
    `你是资深审计员。深审：${BASE}/${file}\n视角：世界书：字段/枚举与schema一致性、AI引导清晰度、触发配置(蓝绿灯/关键字/深度)、模板是否教清楚AI怎么补数据、自相矛盾、人设一致性(晓光九尾狐/吃鱼/执念/巫女服)。\n\n背景：银月脉纪荒野篇生存RPG（MVU+Vue+世界书世界引擎）。schema顶层key: 晓光/世界/装备/工坊/图鉴/营地/环境感知 + $只读派生字段。只报真问题，宁缺毋滥，最多3条按严重度排序。`,
    { label:`审:${file.split('/').pop()}`, phase:'Audit', schema:FINDINGS_SCHEMA, effort:'high' }
  ).then(r => ({ file, findings:(r&&r.findings)||[] })),
  (auditResult, file) => {
    const findings = (auditResult&&auditResult.findings)||[]
    if (!findings.length) return { file, confirmed:[] }
    return parallel(findings.map(f => () =>
      parallel([0,1].map(i => () => agent(
        `对抗验证者#${i}。默认怀疑，亲自读才判真。\n文件:${BASE}/${file}\n缺口:${f.gap}\n证据:${f.evidence||'无'}\n读${file}和schema.ts确认。警惕误报：1)缺stat_data前缀(store.data即根)；2)prefault兜底是设计；3)世界书引用的字段schema里有。给 isReal/adjustedSeverity/reason。`,
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
log(`批2(世界书): 确认${allConfirmed.length}条`)

phase('Fix')
const fixed = await pipeline(
  allConfirmed,
  (f) => agent(`为缺口写修复。文件:${BASE}/${f.file}\n缺口:${f.gap}\n证据:${f.evidence}\n严重度:${f.verifiedSeverity}\n给 old→new+风险。最小改动。`, { label:`修:${f.id}`, phase:'Fix', schema:FIX_SCHEMA, effort:'high' }).then(fix=>({finding:f, fix:fix||{findingId:f.id,proposedFix:f.fix,riskNote:''}})),
  (fixObj, f) => agent(`复审修复。文件:${BASE}/${f.file}\n原缺口:${f.gap}\n修复:${fixObj.fix.proposedFix}\n读文件确认：1)真解决 2)不引新bug 3)最小改动。给 verdict/adjustedFix/reason。`, { label:`复:${f.id}`, phase:'Review', schema:REVIEW_SCHEMA, effort:'high' }).then(review=>({finding:f, fix:fixObj.fix, review:review||{verdict:'需调整',reason:'复审失败'}}))
)

phase('Synthesize')
const 采纳 = fixed.filter(x=>x.review&&x.review.verdict==='采纳')
const 需调整 = fixed.filter(x=>x.review&&x.review.verdict==='需调整')
return {
  batch: '世界书',
  确认缺口数: allConfirmed.length,
  修复采纳: 采纳.length, 需调整: 需调整.length,
  主修复清单: [...采纳,...需调整].map(x=>({ file:x.finding.file, findingId:x.finding.id, severity:x.finding.verifiedSeverity, kind:x.finding.kind, gap:x.finding.gap, 修复方案:x.review.adjustedFix||x.fix.proposedFix, 复审结论:x.review.verdict, 风险:x.fix.riskNote })).sort((a,b)=>{const o={严重:0,中等:1,轻微:2,增强:3};return (o[a.severity]??9)-(o[b.severity]??9)}),
}

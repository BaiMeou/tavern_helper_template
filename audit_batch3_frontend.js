export const meta = {
  name: 'audit-batch-frontend',
  description: '审计批3：前端Vue组件+界面（35文件）',
  phases: [
    { title: 'Audit', detail: '35文件深审' },
    { title: 'Verify', detail: '每缺口2怀疑者' },
    { title: 'Fix', detail: '每缺口1修复提案' },
    { title: 'Review', detail: '每修复1复审' },
    { title: 'Synthesize', detail: '汇总' },
  ],
}

const BASE = 'D:/Desktop/tavern_helper_template-main/src/银月脉纪_荒野篇'

const FILES = [
  'index.yaml',
  '界面/状态栏/App.vue', '界面/状态栏/store.ts', '界面/状态栏/glossary.ts', '界面/状态栏/index.ts', '界面/状态栏/global.css', '界面/状态栏/index.html', '界面/状态栏/preview.html',
  '界面/状态栏/components/home/HomeView.vue', '界面/状态栏/components/home/VitalHero.vue',
  '界面/状态栏/components/layout/DetailShell.vue', '界面/状态栏/components/layout/TopStatusBar.vue',
  '界面/状态栏/components/status/StatusGroup.vue', '界面/状态栏/components/status/VitalCard.vue', '界面/状态栏/components/status/StatDotBar.vue', '界面/状态栏/components/status/WoundList.vue',
  '界面/状态栏/components/inventory/InventoryGroup.vue', '界面/状态栏/components/inventory/ItemCard.vue',
  '界面/状态栏/components/world/WorldGroup.vue', '界面/状态栏/components/world/SVGCompass.vue',
  '界面/状态栏/components/camp/CampGroup.vue',
  '界面/状态栏/components/workshop/WorkshopGroup.vue',
  '界面/状态栏/components/journal/JournalGroup.vue',
  '界面/状态栏/components/setup/SetupWizard.vue',
  '界面/状态栏/components/shared/ChoiceModal.vue', '界面/状态栏/components/shared/GlossaryOverlay.vue', '界面/状态栏/components/shared/InfoI.vue', '界面/状态栏/components/shared/DetailFold.vue', '界面/状态栏/components/shared/DataRow.vue', '界面/状态栏/components/shared/Formula.vue', '界面/状态栏/components/shared/DotBadge.vue', '界面/状态栏/components/shared/ProgressBar.vue',
  '第一条消息/0.txt', '第一条消息/1.txt',
]

const FINDINGS_SCHEMA = { type:'object', properties:{ findings:{ type:'array', items:{ type:'object', properties:{ id:{type:'string'}, severity:{type:'string',enum:['严重','中等','轻微','增强']}, kind:{type:'string'}, location:{type:'string'}, gap:{type:'string'}, evidence:{type:'string'}, fix:{type:'string'} }, required:['id','severity','kind','gap','fix'] } } }, required:['findings'] }
const VERDICT_SCHEMA = { type:'object', properties:{ isReal:{type:'boolean'}, adjustedSeverity:{type:'string',enum:['严重','中等','轻微','增强','误报']}, reason:{type:'string'} }, required:['isReal','adjustedSeverity','reason'] }
const FIX_SCHEMA = { type:'object', properties:{ fileId:{type:'string'}, findingId:{type:'string'}, proposedFix:{type:'string'}, riskNote:{type:'string'} }, required:['findingId','proposedFix'] }
const REVIEW_SCHEMA = { type:'object', properties:{ verdict:{type:'string',enum:['采纳','需调整','拒绝']}, adjustedFix:{type:'string'}, reason:{type:'string'} }, required:['verdict','reason'] }

phase('Audit')
const perFile = await pipeline(
  FILES,
  (file) => agent(
    `你是资深审计员。深审：${BASE}/${file}\n视角：${file.endsWith('.vue')?'Vue组件：store字段名是否与schema一致、硬编码、死prop、.length判空(record)、事件绑定、术语ⓘ接线、数据驱动趋势。':file==='index.yaml'?'入口配置：世界书条目激活策略/插入位置、正则规则、脚本库CDN hash、第一条消息文件引用。':file==='glossary.ts'?'术语库：52条术语措辞、PAGE_TERMS覆盖、openGlossary桥、与前端InfoI接线。':file==='preview.html'?'预览：术语ⓘ/折叠/操作日志/损坏标签展示是否完整。':file.startsWith('第一条消息/')?'首条消息：initvar内联YAML与schema一致性、人设(吃鱼/巫女服/执念)、StatusPlaceHolderImpl占位。':'通用正确性一致性。'}\n\n背景：银月脉纪荒野篇生存RPG（MVU+Vue+世界书世界引擎）。store.data即stat_data根（别误报缺stat_data前缀）。schema顶层key: 晓光/世界/装备/工坊/图鉴/营地/环境感知 + $只读派生字段($当前负重/$失温风险等级/$体感温度/$总保暖值/$精神区间等)。$近期操作是环形5条数组。只报真问题，宁缺毋滥，最多3条按严重度排序。`,
    { label:`审:${file.split('/').pop()}`, phase:'Audit', schema:FINDINGS_SCHEMA, effort:'high' }
  ).then(r => ({ file, findings:(r&&r.findings)||[] })),
  (auditResult, file) => {
    const findings = (auditResult&&auditResult.findings)||[]
    if (!findings.length) return { file, confirmed:[] }
    return parallel(findings.map(f => () =>
      parallel([0,1].map(i => () => agent(
        `对抗验证者#${i}。默认怀疑，亲自读才判真。\n文件:${BASE}/${file}\n缺口:${f.gap}\n证据:${f.evidence||'无'}\n读${file}和schema.ts/glossary.ts确认。警惕误报：1)store.data即根不缺stat_data前缀；2)prefault兜底是设计；3)以为字段错其实schema有。给 isReal/adjustedSeverity/reason。`,
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
log(`批3(前端): 确认${allConfirmed.length}条`)

phase('Fix')
const fixed = await pipeline(
  allConfirmed,
  (f) => agent(`为缺口写修复。文件:${BASE}/${f.file}\n缺口:${f.gap}\n证据:${f.evidence}\n严重度:${f.verifiedSeverity}\n给 old→new+风险。最小改动不破坏接线。`, { label:`修:${f.id}`, phase:'Fix', schema:FIX_SCHEMA, effort:'high' }).then(fix=>({finding:f, fix:fix||{findingId:f.id,proposedFix:f.fix,riskNote:''}})),
  (fixObj, f) => agent(`复审修复。文件:${BASE}/${f.file}\n原缺口:${f.gap}\n修复:${fixObj.fix.proposedFix}\n读文件确认：1)真解决 2)不引新bug 3)最小改动。给 verdict/adjustedFix/reason。`, { label:`复:${f.id}`, phase:'Review', schema:REVIEW_SCHEMA, effort:'high' }).then(review=>({finding:f, fix:fixObj.fix, review:review||{verdict:'需调整',reason:'复审失败'}}))
)

phase('Synthesize')
const 采纳 = fixed.filter(x=>x.review&&x.review.verdict==='采纳')
const 需调整 = fixed.filter(x=>x.review&&x.review.verdict==='需调整')
return {
  batch: '前端',
  确认缺口数: allConfirmed.length,
  修复采纳: 采纳.length, 需调整: 需调整.length,
  主修复清单: [...采纳,...需调整].map(x=>({ file:x.finding.file, findingId:x.finding.id, severity:x.finding.verifiedSeverity, kind:x.finding.kind, gap:x.finding.gap, 修复方案:x.review.adjustedFix||x.fix.proposedFix, 复审结论:x.review.verdict, 风险:x.fix.riskNote })).sort((a,b)=>{const o={严重:0,中等:1,轻微:2,增强:3};return (o[a.severity]??9)-(o[b.severity]??9)}),
}

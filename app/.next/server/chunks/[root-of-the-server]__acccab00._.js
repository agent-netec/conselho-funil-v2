module.exports=[193695,(e,r,s)=>{r.exports=e.x("next/dist/shared/lib/no-fallback-error.external.js",()=>require("next/dist/shared/lib/no-fallback-error.external.js"))},918622,(e,r,s)=>{r.exports=e.x("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js",()=>require("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js"))},556704,(e,r,s)=>{r.exports=e.x("next/dist/server/app-render/work-async-storage.external.js",()=>require("next/dist/server/app-render/work-async-storage.external.js"))},832319,(e,r,s)=>{r.exports=e.x("next/dist/server/app-render/work-unit-async-storage.external.js",()=>require("next/dist/server/app-render/work-unit-async-storage.external.js"))},324725,(e,r,s)=>{r.exports=e.x("next/dist/server/app-render/after-task-async-storage.external.js",()=>require("next/dist/server/app-render/after-task-async-storage.external.js"))},814747,(e,r,s)=>{r.exports=e.x("path",()=>require("path"))},224361,(e,r,s)=>{r.exports=e.x("util",()=>require("util"))},605365,(e,r,s)=>{r.exports=e.x("process",()=>require("process"))},446786,(e,r,s)=>{r.exports=e.x("os",()=>require("os"))},254799,(e,r,s)=>{r.exports=e.x("crypto",()=>require("crypto"))},688947,(e,r,s)=>{r.exports=e.x("stream",()=>require("stream"))},921517,(e,r,s)=>{r.exports=e.x("http",()=>require("http"))},522734,(e,r,s)=>{r.exports=e.x("fs",()=>require("fs"))},792509,(e,r,s)=>{r.exports=e.x("url",()=>require("url"))},653137,e=>{"use strict";e.i(564153);var r=e.i(918042);let s={maxRetries:3,initialDelay:1e3,maxDelay:1e4,factor:2},t=["aborted","deadline-exceeded","resource-exhausted","unavailable","internal"];async function a(e,o={}){let n,{maxRetries:i,initialDelay:c,maxDelay:d,factor:l}={...s,...o},u=c;for(let s=0;s<=i;s++)try{return await e()}catch(e){if(n=e,!(e instanceof r.FirestoreError&&t.includes(e.code))||s===i)break;console.warn(`[Resilience] Falha na opera\xe7\xe3o (tentativa ${s+1}/${i+1}). Erro: ${e.code}. Tentando novamente em ${u}ms...`),await new Promise(e=>setTimeout(e,u)),u=Math.min(u*l,d)}throw console.error("[Resilience] Operação falhou permanentemente após retries.",n),n}e.s(["withResilience",()=>a])},813106,e=>{"use strict";e.i(564153);var r=e.i(918042),s=e.i(474065),t=e.i(653137);async function a(e){let t=(0,r.doc)(s.db,"users",e),a=await (0,r.getDoc)(t);return a.exists()?a.data().credits??0:0}async function o(e,t=-1){let a=(0,r.doc)(s.db,"users",e);await (0,r.updateDoc)(a,{credits:(0,r.increment)(t),usage:(0,r.increment)(Math.abs(t))})}async function n(e){let t=(0,r.doc)(s.db,"users",e),a=await (0,r.getDoc)(t);return a.exists()?{id:a.id,...a.data()}:null}async function i(e){let t=(0,r.doc)(s.db,"funnels",e),a=await (0,r.getDoc)(t);return a.exists()?{id:a.id,...a.data()}:null}async function c(e){let t=(0,r.query)((0,r.collection)(s.db,"funnels"),(0,r.where)("userId","==",e));return(await (0,r.getDocs)(t)).docs.map(e=>({id:e.id,...e.data()})).sort((e,r)=>{let s=e.updatedAt?.seconds||0;return(r.updatedAt?.seconds||0)-s})}async function d(e,a){let o=(0,r.doc)(s.db,"funnels",e);await (0,t.withResilience)(async()=>{await (0,r.updateDoc)(o,{...a,updatedAt:r.Timestamp.now()})})}async function l(e,t){return(await (0,r.addDoc)((0,r.collection)(s.db,"funnels",e,"proposals"),{...t,funnelId:e,createdAt:r.Timestamp.now()})).id}async function u(e){let t=(0,r.query)((0,r.collection)(s.db,"funnels",e,"proposals"),(0,r.orderBy)("version","desc"));return(await (0,r.getDocs)(t)).docs.map(e=>({id:e.id,...e.data()}))}async function p(e){let t=(0,r.doc)(s.db,"conversations",e),a=await (0,r.getDoc)(t);return a.exists()?{id:a.id,...a.data()}:null}async function f(e,a){let o=(0,r.doc)(s.db,"conversations",e);await (0,t.withResilience)(async()=>{await (0,r.updateDoc)(o,{...a,updatedAt:r.Timestamp.now()})})}async function _(e,t){let a=await (0,r.addDoc)((0,r.collection)(s.db,"conversations",e,"messages"),{...t,conversationId:e,createdAt:r.Timestamp.now()});return await f(e,{}),a.id}async function m(e){let t=(0,r.doc)(s.db,"brands",e),a=await (0,r.getDoc)(t);return a.exists()?{id:a.id,...a.data()}:null}async function v(e){let t=(0,r.doc)(s.db,"campaigns",e),a=await (0,r.getDoc)(t);return a.exists()?{id:a.id,...a.data()}:null}async function x(e,a){let o=(0,r.doc)(s.db,"campaigns",e);return await (0,t.withResilience)(async()=>{await (0,r.setDoc)(o,{...a,updatedAt:r.Timestamp.now()},{merge:!0})})}e.i(317036),e.s(["addMessage",()=>_,"createProposal",()=>l,"getBrand",()=>m,"getCampaign",()=>v,"getConversation",()=>p,"getFunnel",()=>i,"getFunnelProposals",()=>u,"getUser",()=>n,"getUserCredits",()=>a,"getUserFunnels",()=>c,"updateCampaignManifesto",()=>x,"updateConversation",()=>f,"updateFunnel",()=>d,"updateUserUsage",()=>o])},673438,e=>{"use strict";function r(e){return`## CONTEXTO DA MARCA (PRIORIDADE M\xc1XIMA)
**Marca:** ${e.name}
**Vertical:** ${e.vertical}
**Posicionamento:** ${e.positioning}
**Tom de Voz:** ${e.voiceTone}

### P\xfablico-Alvo da Marca
- **Perfil:** ${e.audience.who}
- **Dor Principal:** ${e.audience.pain}
- **Consci\xeancia:** ${e.audience.awareness}
${e.audience.objections.length>0?`- **Obje\xe7\xf5es Conhecidas:** ${e.audience.objections.join(", ")}`:""}

### Oferta Principal
- **Produto/Servi\xe7o:** ${e.offer.what}
- **Ticket:** R$ ${e.offer.ticket.toLocaleString("pt-BR")}
- **Tipo:** ${e.offer.type}
- **Diferencial Competitivo:** ${e.offer.differentiator}

---

**INSTRU\xc7\xd5ES IMPORTANTES:**
1. Todas as propostas DEVEM alinhar-se com o tom de voz "${e.voiceTone}"
2. As headlines e copy DEVEM refletir o posicionamento da marca
3. O funil DEVE endere\xe7ar as obje\xe7\xf5es conhecidas do p\xfablico
4. Use o diferencial competitivo como eixo central da estrat\xe9gia
5. Considere o ticket de R$ ${e.offer.ticket.toLocaleString("pt-BR")} ao sugerir estrat\xe9gias de convers\xe3o

---
`}function s(e){let r=`### Marca: ${e.name}
- **Vertical**: ${e.vertical}
- **Posicionamento**: ${e.positioning}
- **Tom de Voz**: ${e.voiceTone}

### P\xfablico-Alvo da Marca
- **Quem**: ${e.audience.who}
- **Dor Principal**: ${e.audience.pain}
- **N\xedvel de Consci\xeancia**: ${e.audience.awareness}
${e.audience.objections.length>0?`- **Obje\xe7\xf5es**: ${e.audience.objections.join(", ")}`:""}

### Oferta da Marca
- **Produto/Servi\xe7o**: ${e.offer.what}
- **Ticket M\xe9dio**: R$ ${e.offer.ticket.toLocaleString("pt-BR")}
- **Tipo**: ${e.offer.type}
- **Diferencial**: ${e.offer.differentiator}
`;if(e.brandKit){let s=e.brandKit;r+=`
### BrandKit (Identidade Visual)
- **Estilo Visual**: ${s.visualStyle}
- **Cores**: Prim\xe1ria: ${s.colors.primary}, Secund\xe1ria: ${s.colors.secondary}, Accent: ${s.colors.accent}, Background: ${s.colors.background}
- **Tipografia**: Principal: ${s.typography.primaryFont}, Secund\xe1ria: ${s.typography.secondaryFont} (Fallback: ${s.typography.systemFallback})
- **Logo**: ${s.logoLock.locked?"USAR APENAS LOGO OFICIAL (LOCKED)":"Permite variações"}
- **URL Logo Principal**: ${s.logoLock.variants.primary.url}
${s.logoLock.variants.horizontal?`- **URL Logo Horizontal**: ${s.logoLock.variants.horizontal.url}
`:""}${s.logoLock.variants.icon?`- **URL \xcdcone**: ${s.logoLock.variants.icon.url}
`:""}`}return r+`
**⚠️ IMPORTANTE:** Todas as respostas devem respeitar o tom de voz, posicionamento e contexto desta marca.`}function t(e,r=[]){let s=e.context,a=s.channel?.main||s.channels?.primary||"N/A",o=`### Funil: ${e.name}
- **Status**: ${e.status}
- **Objetivo**: ${s.objective}
- **Empresa**: ${s.company}
- **Mercado**: ${s.market}

### P\xfablico-Alvo
- **Quem**: ${s.audience?.who||"N/A"}
- **Dor**: ${s.audience?.pain||"N/A"}
- **N\xedvel de Consci\xeancia**: ${s.audience?.awareness||"N/A"}

### Oferta
- **Produto**: ${s.offer?.what||"N/A"}
- **Ticket**: ${s.offer?.ticket||"N/A"}
- **Tipo**: ${s.offer?.type||"N/A"}

### Canais
- **Principal**: ${a}
`;return r.length>0&&(o+=`
### Propostas Geradas (${r.length})
`,r.slice(0,2).forEach((e,r)=>{let s=e.scorecard?.overall||"N/A";o+=`
**${r+1}. ${e.name}** (Score: ${s})
- ${e.summary?.slice(0,200)||"Sem resumo"}...
`,e.strategy?.risks?.length&&(o+=`- Riscos: ${e.strategy.risks.slice(0,2).join(", ")}
`)})),o}function a(e){let r=e.trim(),s=r.match(/```(?:json)?\s*([\s\S]*?)\s*```/);if(s&&s[1])r=s[1].trim();else{let e=r.indexOf("{"),s=r.lastIndexOf("}");-1!==e&&-1!==s&&s>e&&(r=r.substring(e,s+1))}try{return JSON.parse(r)}catch(s){throw console.error("Failed to parse JSON. Original text:",e),console.error("Cleaned text:",r),s}}e.s(["formatBrandContextForChat",()=>s,"formatBrandContextForFunnel",()=>r,"formatFunnelContextForChat",()=>t,"parseAIJSON",()=>a])},683695,e=>{"use strict";e.i(564153);var r=e.i(918042),s=e.i(474065);async function t(e){let t=(0,r.doc)(s.db,"brands",e),a=await (0,r.getDoc)(t);return a.exists()?{id:a.id,...a.data()}:null}e.s(["getBrand",()=>t])},878617,e=>{e.v(r=>Promise.all(["server/chunks/[root-of-the-server]__c5654b14._.js","server/chunks/5c86f_8db425cf._.js","server/chunks/5c86f_@aws-sdk_credential-provider-cognito-identity_48abad20._.js"].map(r=>e.l(r))).then(()=>r(971738)))},260063,e=>{e.v(r=>Promise.all(["server/chunks/5c86f_@aws-sdk_credential-provider-http_dist-es_index_cd17189a.js"].map(r=>e.l(r))).then(()=>r(618513)))},616800,e=>{e.v(r=>Promise.all(["server/chunks/5c86f_@smithy_credential-provider-imds_dist-es_index_0fe1a303.js"].map(r=>e.l(r))).then(()=>r(710858)))},307311,e=>{e.v(r=>Promise.all(["server/chunks/5c86f_@aws-sdk_credential-provider-env_dist-es_index_4fff1637.js"].map(r=>e.l(r))).then(()=>r(690392)))},210675,e=>{e.v(r=>Promise.all(["server/chunks/[root-of-the-server]__8845df96._.js","server/chunks/5c86f_@aws-sdk_nested-clients_dist-es_submodules_sts_index_e9d57c48.js","server/chunks/5c86f_30e61836._.js","server/chunks/5c86f_@aws-sdk_core_dist-es_submodules_protocols_query_AwsQueryProtocol_a71c1d68.js"].map(r=>e.l(r))).then(()=>r(482808)))},960952,e=>{e.v(r=>Promise.all(["server/chunks/[root-of-the-server]__c49a4bc6._.js","server/chunks/5c86f_@aws-sdk_nested-clients_dist-es_submodules_signin_index_2c34b094.js","server/chunks/5c86f_17fe0de2._.js","server/chunks/5c86f_5f11719d._.js"].map(r=>e.l(r))).then(()=>r(82515)))},83092,e=>{e.v(r=>Promise.all(["server/chunks/5c86f_@aws-sdk_credential-provider-process_dist-es_index_8f3445b8.js"].map(r=>e.l(r))).then(()=>r(493241)))},643449,e=>{e.v(r=>Promise.all(["server/chunks/5c86f_@aws-sdk_credential-provider-sso_dist-es_index_06fbc501.js"].map(r=>e.l(r))).then(()=>r(632366)))},435934,e=>{e.v(r=>Promise.all(["server/chunks/5c86f_@aws-sdk_credential-provider-web-identity_dist-es_index_bddb838d.js"].map(r=>e.l(r))).then(()=>r(424055)))},916312,e=>{e.v(r=>Promise.all(["server/chunks/5c86f_@aws-sdk_credential-provider-ini_dist-es_index_8e002212.js"].map(r=>e.l(r))).then(()=>r(689167)))},658563,e=>{e.v(r=>Promise.all(["server/chunks/[root-of-the-server]__c49a4bc6._.js","server/chunks/5c86f_17fe0de2._.js","server/chunks/5c86f_@aws-sdk_nested-clients_dist-es_submodules_sso-oidc_index_3fd57a79.js","server/chunks/5c86f_5f11719d._.js"].map(r=>e.l(r))).then(()=>r(246555)))},174079,e=>{e.v(r=>Promise.all(["server/chunks/[root-of-the-server]__84465e3d._.js","server/chunks/5c86f_@aws-sdk_8c815586._.js","server/chunks/5c86f_e7f27469._.js","server/chunks/5c86f_87262e2c._.js"].map(r=>e.l(r))).then(()=>r(720697)))},745393,e=>{e.v(r=>Promise.all(["server/chunks/[root-of-the-server]__4518c8b5._.js","server/chunks/5c86f_@aws-sdk_credential-providers_eaf019db._.js","server/chunks/5c86f_@aws-sdk_core_dist-es_submodules_protocols_query_AwsQueryProtocol_a71c1d68.js","server/chunks/5c86f_fda899e8._.js"].map(r=>e.l(r))).then(()=>r(281810)))},84617,e=>{e.v(r=>Promise.all(["server/chunks/OneDrive_Desktop_CURSOR_CONSELHO DE FUNIL_5954581c._.js"].map(r=>e.l(r))).then(()=>r(413263)))},401065,e=>{e.v(r=>Promise.all(["server/chunks/13466_Desktop_CURSOR_CONSELHO DE FUNIL_app_src_lib_ai_rag-helpers-fixed_ts_ca76f29a._.js"].map(r=>e.l(r))).then(()=>r(756565)))}];

//# sourceMappingURL=%5Broot-of-the-server%5D__acccab00._.js.map
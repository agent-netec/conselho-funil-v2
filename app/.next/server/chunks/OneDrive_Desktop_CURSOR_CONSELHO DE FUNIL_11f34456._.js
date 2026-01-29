module.exports=[673438,e=>{"use strict";function s(e){return`## CONTEXTO DA MARCA (PRIORIDADE M\xc1XIMA)
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
`}function r(e){let s=`### Marca: ${e.name}
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
`;if(e.brandKit){let r=e.brandKit;s+=`
### BrandKit (Identidade Visual)
- **Estilo Visual**: ${r.visualStyle}
- **Cores**: Prim\xe1ria: ${r.colors.primary}, Secund\xe1ria: ${r.colors.secondary}, Accent: ${r.colors.accent}, Background: ${r.colors.background}
- **Tipografia**: Principal: ${r.typography.primaryFont}, Secund\xe1ria: ${r.typography.secondaryFont} (Fallback: ${r.typography.systemFallback})
- **Logo**: ${r.logoLock.locked?"USAR APENAS LOGO OFICIAL (LOCKED)":"Permite variações"}
- **URL Logo Principal**: ${r.logoLock.variants.primary.url}
${r.logoLock.variants.horizontal?`- **URL Logo Horizontal**: ${r.logoLock.variants.horizontal.url}
`:""}${r.logoLock.variants.icon?`- **URL \xcdcone**: ${r.logoLock.variants.icon.url}
`:""}`}return s+`
**⚠️ IMPORTANTE:** Todas as respostas devem respeitar o tom de voz, posicionamento e contexto desta marca.`}function o(e,s=[]){let r=e.context,a=r.channel?.main||r.channels?.primary||"N/A",i=`### Funil: ${e.name}
- **Status**: ${e.status}
- **Objetivo**: ${r.objective}
- **Empresa**: ${r.company}
- **Mercado**: ${r.market}

### P\xfablico-Alvo
- **Quem**: ${r.audience?.who||"N/A"}
- **Dor**: ${r.audience?.pain||"N/A"}
- **N\xedvel de Consci\xeancia**: ${r.audience?.awareness||"N/A"}

### Oferta
- **Produto**: ${r.offer?.what||"N/A"}
- **Ticket**: ${r.offer?.ticket||"N/A"}
- **Tipo**: ${r.offer?.type||"N/A"}

### Canais
- **Principal**: ${a}
`;return s.length>0&&(i+=`
### Propostas Geradas (${s.length})
`,s.slice(0,2).forEach((e,s)=>{let r=e.scorecard?.overall||"N/A";i+=`
**${s+1}. ${e.name}** (Score: ${r})
- ${e.summary?.slice(0,200)||"Sem resumo"}...
`,e.strategy?.risks?.length&&(i+=`- Riscos: ${e.strategy.risks.slice(0,2).join(", ")}
`)})),i}function a(e){let s=e.trim(),r=s.match(/```(?:json)?\s*([\s\S]*?)\s*```/);if(r&&r[1])s=r[1].trim();else{let e=s.indexOf("{"),r=s.lastIndexOf("}");-1!==e&&-1!==r&&r>e&&(s=s.substring(e,r+1))}try{return JSON.parse(s)}catch(r){throw console.error("Failed to parse JSON. Original text:",e),console.error("Cleaned text:",s),r}}e.s(["formatBrandContextForChat",()=>r,"formatBrandContextForFunnel",()=>s,"formatFunnelContextForChat",()=>o,"parseAIJSON",()=>a])},683695,e=>{"use strict";e.i(564153);var s=e.i(918042),r=e.i(474065);async function o(e){let o=(0,s.doc)(r.db,"brands",e),a=await (0,s.getDoc)(o);return a.exists()?{id:a.id,...a.data()}:null}e.s(["getBrand",()=>o])},878617,e=>{e.v(s=>Promise.all(["server/chunks/[root-of-the-server]__10712ccc._.js","server/chunks/5c86f_8db425cf._.js","server/chunks/5c86f_@aws-sdk_credential-provider-cognito-identity_48abad20._.js"].map(s=>e.l(s))).then(()=>s(971738)))},260063,e=>{e.v(s=>Promise.all(["server/chunks/5c86f_@aws-sdk_credential-provider-http_dist-es_index_cd17189a.js"].map(s=>e.l(s))).then(()=>s(618513)))},616800,e=>{e.v(s=>Promise.all(["server/chunks/5c86f_@smithy_credential-provider-imds_dist-es_index_0fe1a303.js"].map(s=>e.l(s))).then(()=>s(710858)))},307311,e=>{e.v(s=>Promise.all(["server/chunks/5c86f_@aws-sdk_credential-provider-env_dist-es_index_4fff1637.js"].map(s=>e.l(s))).then(()=>s(690392)))},210675,e=>{e.v(s=>Promise.all(["server/chunks/[root-of-the-server]__dd24eaa2._.js","server/chunks/5c86f_@aws-sdk_nested-clients_dist-es_submodules_sts_index_e9d57c48.js","server/chunks/5c86f_30e61836._.js","server/chunks/5c86f_@aws-sdk_core_dist-es_submodules_protocols_query_AwsQueryProtocol_a71c1d68.js"].map(s=>e.l(s))).then(()=>s(482808)))},960952,e=>{e.v(s=>Promise.all(["server/chunks/[root-of-the-server]__f3dd76d2._.js","server/chunks/5c86f_@aws-sdk_nested-clients_dist-es_submodules_signin_index_2c34b094.js","server/chunks/5c86f_17fe0de2._.js","server/chunks/5c86f_5f11719d._.js"].map(s=>e.l(s))).then(()=>s(82515)))},83092,e=>{e.v(s=>Promise.all(["server/chunks/5c86f_@aws-sdk_credential-provider-process_dist-es_index_8f3445b8.js"].map(s=>e.l(s))).then(()=>s(493241)))},643449,e=>{e.v(s=>Promise.all(["server/chunks/5c86f_@aws-sdk_credential-provider-sso_dist-es_index_06fbc501.js"].map(s=>e.l(s))).then(()=>s(632366)))},435934,e=>{e.v(s=>Promise.all(["server/chunks/5c86f_@aws-sdk_credential-provider-web-identity_dist-es_index_bddb838d.js"].map(s=>e.l(s))).then(()=>s(424055)))},916312,e=>{e.v(s=>Promise.all(["server/chunks/5c86f_@aws-sdk_credential-provider-ini_dist-es_index_8e002212.js"].map(s=>e.l(s))).then(()=>s(689167)))},658563,e=>{e.v(s=>Promise.all(["server/chunks/[root-of-the-server]__f3dd76d2._.js","server/chunks/5c86f_17fe0de2._.js","server/chunks/5c86f_@aws-sdk_nested-clients_dist-es_submodules_sso-oidc_index_3fd57a79.js","server/chunks/5c86f_5f11719d._.js"].map(s=>e.l(s))).then(()=>s(246555)))},174079,e=>{e.v(s=>Promise.all(["server/chunks/[root-of-the-server]__43dba297._.js","server/chunks/5c86f_@aws-sdk_8c815586._.js","server/chunks/5c86f_e7f27469._.js","server/chunks/5c86f_87262e2c._.js"].map(s=>e.l(s))).then(()=>s(720697)))},745393,e=>{e.v(s=>Promise.all(["server/chunks/[root-of-the-server]__ac6f269c._.js","server/chunks/5c86f_@aws-sdk_credential-providers_eaf019db._.js","server/chunks/5c86f_@aws-sdk_core_dist-es_submodules_protocols_query_AwsQueryProtocol_a71c1d68.js","server/chunks/5c86f_fda899e8._.js"].map(s=>e.l(s))).then(()=>s(281810)))},84617,e=>{e.v(s=>Promise.all(["server/chunks/OneDrive_Desktop_CURSOR_CONSELHO DE FUNIL_1840395d._.js"].map(s=>e.l(s))).then(()=>s(413263)))},401065,e=>{e.v(s=>Promise.all(["server/chunks/13466_Desktop_CURSOR_CONSELHO DE FUNIL_app_src_lib_ai_rag-helpers-fixed_ts_ca76f29a._.js"].map(s=>e.l(s))).then(()=>s(756565)))}];

//# sourceMappingURL=OneDrive_Desktop_CURSOR_CONSELHO%20DE%20FUNIL_11f34456._.js.map
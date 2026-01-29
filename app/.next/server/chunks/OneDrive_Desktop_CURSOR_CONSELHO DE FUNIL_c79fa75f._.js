module.exports=[673438,e=>{"use strict";function t(e){return`## CONTEXTO DA MARCA (PRIORIDADE M\xc1XIMA)
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
`}function r(e){let t=`### Marca: ${e.name}
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
`;if(e.brandKit){let r=e.brandKit;t+=`
### BrandKit (Identidade Visual)
- **Estilo Visual**: ${r.visualStyle}
- **Cores**: Prim\xe1ria: ${r.colors.primary}, Secund\xe1ria: ${r.colors.secondary}, Accent: ${r.colors.accent}, Background: ${r.colors.background}
- **Tipografia**: Principal: ${r.typography.primaryFont}, Secund\xe1ria: ${r.typography.secondaryFont} (Fallback: ${r.typography.systemFallback})
- **Logo**: ${r.logoLock.locked?"USAR APENAS LOGO OFICIAL (LOCKED)":"Permite variações"}
- **URL Logo Principal**: ${r.logoLock.variants.primary.url}
${r.logoLock.variants.horizontal?`- **URL Logo Horizontal**: ${r.logoLock.variants.horizontal.url}
`:""}${r.logoLock.variants.icon?`- **URL \xcdcone**: ${r.logoLock.variants.icon.url}
`:""}`}return t+`
**⚠️ IMPORTANTE:** Todas as respostas devem respeitar o tom de voz, posicionamento e contexto desta marca.`}function a(e,t=[]){let r=e.context,s=r.channel?.main||r.channels?.primary||"N/A",o=`### Funil: ${e.name}
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
- **Principal**: ${s}
`;return t.length>0&&(o+=`
### Propostas Geradas (${t.length})
`,t.slice(0,2).forEach((e,t)=>{let r=e.scorecard?.overall||"N/A";o+=`
**${t+1}. ${e.name}** (Score: ${r})
- ${e.summary?.slice(0,200)||"Sem resumo"}...
`,e.strategy?.risks?.length&&(o+=`- Riscos: ${e.strategy.risks.slice(0,2).join(", ")}
`)})),o}function s(e){let t=e.trim(),r=t.match(/```(?:json)?\s*([\s\S]*?)\s*```/);if(r&&r[1])t=r[1].trim();else{let e=t.indexOf("{"),r=t.lastIndexOf("}");-1!==e&&-1!==r&&r>e&&(t=t.substring(e,r+1))}try{return JSON.parse(t)}catch(r){throw console.error("Failed to parse JSON. Original text:",e),console.error("Cleaned text:",t),r}}e.s(["formatBrandContextForChat",()=>r,"formatBrandContextForFunnel",()=>t,"formatFunnelContextForChat",()=>a,"parseAIJSON",()=>s])},683695,e=>{"use strict";e.i(564153);var t=e.i(918042),r=e.i(474065);async function a(e){let a=(0,t.doc)(r.db,"brands",e),s=await (0,t.getDoc)(a);return s.exists()?{id:s.id,...s.data()}:null}e.s(["getBrand",()=>a])},3260,e=>{"use strict";var t=e.i(906661),r=e.i(276806),a=e.i(981990),s=e.i(707163),o=e.i(893013),n=e.i(416393),i=e.i(418829),c=e.i(907831),l=e.i(787414),d=e.i(251948),u=e.i(254140),p=e.i(847739),f=e.i(877290),h=e.i(195428),_=e.i(114365),m=e.i(193695);e.i(495983);var v=e.i(56931),g=e.i(758910),x=e.i(998596),R=e.i(675229),k=e.i(813106),$=e.i(683695);e.i(199678);var w=e.i(275596),E=e.i(673438);async function P(e){try{let t,{funnelId:r,context:a,adjustments:s,originalProposalId:o,baseVersion:n}=await e.json();if(!r||!a)return g.NextResponse.json({error:"funnelId and context are required"},{status:400});if(!(0,R.isGeminiConfigured)())return g.NextResponse.json({error:"Gemini API not configured. Add GOOGLE_AI_API_KEY to .env.local"},{status:500});let i=s&&s.length>0;console.log(`🎯 ${i?"Regenerando com ajustes":"Gerando propostas"} para funil ${r}...`),await (0,k.updateFunnel)(r,{status:"generating"});let c="";try{let e=await (0,k.getFunnel)(r);if(e?.brandId){let t=await (0,$.getBrand)(e.brandId);t&&(c=(0,E.formatBrandContextForFunnel)(t),console.log(`🏷️ Usando contexto da marca: ${t.name}`))}}catch(e){console.error("Error loading brand:",e)}a.objective,a.market,a.audience.who,a.audience.pain,a.offer?.what,a.offer?.ticket,a.channel?.main;let l=await (0,x.retrieveForFunnelCreation)(a.objective,a.channel?.main||"generic",a.audience?.who||"general",20);console.log(`📚 ${l.length} chunks de conhecimento recuperados`);let d=l.map(e=>`[${e.metadata.counselor||"General"}] ${e.content}`).join("\n\n---\n\n"),u=(0,w.buildFunnelContextPrompt)(a,d,s);c&&(u=`${c}

${u}`);let p=i?w.FUNNEL_ADJUSTMENT_PROMPT:w.FUNNEL_GENERATION_PROMPT,f=`${p}

${u}`;console.log("🤖 Gerando propostas com Gemini...");let h=await (0,R.generateWithGemini)(f,{model:"gemini-2.0-flash-exp",temperature:.8,maxOutputTokens:8192});try{t=(0,E.parseAIJSON)(h)}catch(e){return console.error("Error parsing Gemini response:",e),console.log("Raw response:",h.substring(0,500)),await (0,k.updateFunnel)(r,{status:"draft"}),g.NextResponse.json({error:"Failed to parse AI response. Please try again."},{status:500})}let _=[],m=n?n+1:1;for(let e=0;e<t.proposals.length;e++){let a=t.proposals[e],n=i?m:e+1,c={version:n,name:i?`${a.name} (v${n})`:a.name,summary:a.summary,architecture:a.architecture,strategy:a.strategy,assets:a.assets,scorecard:a.scorecard,status:"pending",...i&&o?{parentProposalId:o,appliedAdjustments:s}:{}},l=await (0,k.createProposal)(r,c);_.push(l),console.log(`💾 Proposta ${i?"ajustada":""} v${n} salva: ${l}`)}return await (0,k.updateFunnel)(r,{status:"review"}),console.log(`✅ ${_.length} propostas geradas com sucesso!`),g.NextResponse.json({success:!0,funnelId:r,proposalIds:_,proposalsCount:_.length})}catch(e){return console.error("❌ Erro ao gerar propostas:",e),g.NextResponse.json({error:e instanceof Error?e.message:"Erro interno ao gerar propostas"},{status:500})}}e.s(["POST",()=>P,"dynamic",0,"force-dynamic","maxDuration",0,120,"runtime",0,"nodejs"],554862);var y=e.i(554862);let b=new t.AppRouteRouteModule({definition:{kind:r.RouteKind.APP_ROUTE,page:"/api/funnels/generate/route",pathname:"/api/funnels/generate",filename:"route",bundlePath:""},distDir:".next",relativeProjectDir:"",resolvedPagePath:"[project]/OneDrive/Desktop/CURSOR/CONSELHO DE FUNIL/app/src/app/api/funnels/generate/route.ts",nextConfigOutput:"",userland:y}),{workAsyncStorage:j,workUnitAsyncStorage:A,serverHooks:C}=b;function O(){return(0,a.patchFetch)({workAsyncStorage:j,workUnitAsyncStorage:A})}async function N(e,t,a){b.isDev&&(0,s.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let g="/api/funnels/generate/route";g=g.replace(/\/index$/,"")||"/";let x=await b.prepare(e,t,{srcPage:g,multiZoneDraftMode:!1});if(!x)return t.statusCode=400,t.end("Bad Request"),null==a.waitUntil||a.waitUntil.call(a,Promise.resolve()),null;let{buildId:R,params:k,nextConfig:$,parsedUrl:w,isDraftMode:E,prerenderManifest:P,routerServerContext:y,isOnDemandRevalidate:j,revalidateOnlyGenerated:A,resolvedPathname:C,clientReferenceManifest:O,serverActionsManifest:N}=x,T=(0,i.normalizeAppPath)(g),S=!!(P.dynamicRoutes[T]||P.routes[C]),I=async()=>((null==y?void 0:y.render404)?await y.render404(e,t,w,!1):t.end("This page could not be found"),null);if(S&&!E){let e=!!P.routes[C],t=P.dynamicRoutes[T];if(t&&!1===t.fallback&&!e){if($.experimental.adapterPath)return await I();throw new m.NoFallbackError}}let D=null;!S||b.isDev||E||(D="/index"===(D=C)?"/":D);let F=!0===b.isDev||!S,L=S&&!F;N&&O&&(0,n.setManifestsSingleton)({page:g,clientReferenceManifest:O,serverActionsManifest:N});let U=e.method||"GET",M=(0,o.getTracer)(),H=M.getActiveScopeSpan(),q={params:k,prerenderManifest:P,renderOpts:{experimental:{authInterrupts:!!$.experimental.authInterrupts},cacheComponents:!!$.cacheComponents,supportsDynamicResponse:F,incrementalCache:(0,s.getRequestMeta)(e,"incrementalCache"),cacheLifeProfiles:$.cacheLife,waitUntil:a.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,r,a,s)=>b.onRequestError(e,t,a,s,y)},sharedContext:{buildId:R}},G=new c.NodeNextRequest(e),B=new c.NodeNextResponse(t),K=l.NextRequestAdapter.fromNodeNextRequest(G,(0,l.signalFromNodeResponse)(t));try{let n=async e=>b.handle(K,q).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let r=M.getRootSpanAttributes();if(!r)return;if(r.get("next.span_type")!==d.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${r.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let a=r.get("next.route");if(a){let t=`${U} ${a}`;e.setAttributes({"next.route":a,"http.route":a,"next.span_name":t}),e.updateName(t)}else e.updateName(`${U} ${g}`)}),i=!!(0,s.getRequestMeta)(e,"minimalMode"),c=async s=>{var o,c;let l=async({previousCacheEntry:r})=>{try{if(!i&&j&&A&&!r)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let o=await n(s);e.fetchMetrics=q.renderOpts.fetchMetrics;let c=q.renderOpts.pendingWaitUntil;c&&a.waitUntil&&(a.waitUntil(c),c=void 0);let l=q.renderOpts.collectedTags;if(!S)return await (0,p.sendResponse)(G,B,o,q.renderOpts.pendingWaitUntil),null;{let e=await o.blob(),t=(0,f.toNodeOutgoingHttpHeaders)(o.headers);l&&(t[_.NEXT_CACHE_TAGS_HEADER]=l),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let r=void 0!==q.renderOpts.collectedRevalidate&&!(q.renderOpts.collectedRevalidate>=_.INFINITE_CACHE)&&q.renderOpts.collectedRevalidate,a=void 0===q.renderOpts.collectedExpire||q.renderOpts.collectedExpire>=_.INFINITE_CACHE?void 0:q.renderOpts.collectedExpire;return{value:{kind:v.CachedRouteKind.APP_ROUTE,status:o.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:r,expire:a}}}}catch(t){throw(null==r?void 0:r.isStale)&&await b.onRequestError(e,t,{routerKind:"App Router",routePath:g,routeType:"route",revalidateReason:(0,u.getRevalidateReason)({isStaticGeneration:L,isOnDemandRevalidate:j})},!1,y),t}},d=await b.handleResponse({req:e,nextConfig:$,cacheKey:D,routeKind:r.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:P,isRoutePPREnabled:!1,isOnDemandRevalidate:j,revalidateOnlyGenerated:A,responseGenerator:l,waitUntil:a.waitUntil,isMinimalMode:i});if(!S)return null;if((null==d||null==(o=d.value)?void 0:o.kind)!==v.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==d||null==(c=d.value)?void 0:c.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});i||t.setHeader("x-nextjs-cache",j?"REVALIDATED":d.isMiss?"MISS":d.isStale?"STALE":"HIT"),E&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let m=(0,f.fromNodeOutgoingHttpHeaders)(d.value.headers);return i&&S||m.delete(_.NEXT_CACHE_TAGS_HEADER),!d.cacheControl||t.getHeader("Cache-Control")||m.get("Cache-Control")||m.set("Cache-Control",(0,h.getCacheControlHeader)(d.cacheControl)),await (0,p.sendResponse)(G,B,new Response(d.value.body,{headers:m,status:d.value.status||200})),null};H?await c(H):await M.withPropagatedContext(e.headers,()=>M.trace(d.BaseServerSpan.handleRequest,{spanName:`${U} ${g}`,kind:o.SpanKind.SERVER,attributes:{"http.method":U,"http.target":e.url}},c))}catch(t){if(t instanceof m.NoFallbackError||await b.onRequestError(e,t,{routerKind:"App Router",routePath:T,routeType:"route",revalidateReason:(0,u.getRevalidateReason)({isStaticGeneration:L,isOnDemandRevalidate:j})},!1,y),S)throw t;return await (0,p.sendResponse)(G,B,new Response(null,{status:500})),null}}e.s(["handler",()=>N,"patchFetch",()=>O,"routeModule",()=>b,"serverHooks",()=>C,"workAsyncStorage",()=>j,"workUnitAsyncStorage",()=>A],3260)},878617,e=>{e.v(t=>Promise.all(["server/chunks/[root-of-the-server]__7e2dc449._.js","server/chunks/5c86f_8db425cf._.js","server/chunks/5c86f_@aws-sdk_credential-provider-cognito-identity_48abad20._.js"].map(t=>e.l(t))).then(()=>t(971738)))},260063,e=>{e.v(t=>Promise.all(["server/chunks/5c86f_@aws-sdk_credential-provider-http_dist-es_index_cd17189a.js"].map(t=>e.l(t))).then(()=>t(618513)))},616800,e=>{e.v(t=>Promise.all(["server/chunks/5c86f_@smithy_credential-provider-imds_dist-es_index_0fe1a303.js"].map(t=>e.l(t))).then(()=>t(710858)))},307311,e=>{e.v(t=>Promise.all(["server/chunks/5c86f_@aws-sdk_credential-provider-env_dist-es_index_4fff1637.js"].map(t=>e.l(t))).then(()=>t(690392)))},210675,e=>{e.v(t=>Promise.all(["server/chunks/[root-of-the-server]__020149f6._.js","server/chunks/5c86f_@aws-sdk_nested-clients_dist-es_submodules_sts_index_e9d57c48.js","server/chunks/5c86f_30e61836._.js","server/chunks/5c86f_@aws-sdk_core_dist-es_submodules_protocols_query_AwsQueryProtocol_a71c1d68.js"].map(t=>e.l(t))).then(()=>t(482808)))},960952,e=>{e.v(t=>Promise.all(["server/chunks/[root-of-the-server]__7f2a9058._.js","server/chunks/5c86f_@aws-sdk_nested-clients_dist-es_submodules_signin_index_2c34b094.js","server/chunks/5c86f_17fe0de2._.js","server/chunks/5c86f_5f11719d._.js"].map(t=>e.l(t))).then(()=>t(82515)))},83092,e=>{e.v(t=>Promise.all(["server/chunks/5c86f_@aws-sdk_credential-provider-process_dist-es_index_8f3445b8.js"].map(t=>e.l(t))).then(()=>t(493241)))},643449,e=>{e.v(t=>Promise.all(["server/chunks/5c86f_@aws-sdk_credential-provider-sso_dist-es_index_06fbc501.js"].map(t=>e.l(t))).then(()=>t(632366)))},435934,e=>{e.v(t=>Promise.all(["server/chunks/5c86f_@aws-sdk_credential-provider-web-identity_dist-es_index_bddb838d.js"].map(t=>e.l(t))).then(()=>t(424055)))},916312,e=>{e.v(t=>Promise.all(["server/chunks/5c86f_@aws-sdk_credential-provider-ini_dist-es_index_8e002212.js"].map(t=>e.l(t))).then(()=>t(689167)))},658563,e=>{e.v(t=>Promise.all(["server/chunks/[root-of-the-server]__7f2a9058._.js","server/chunks/5c86f_17fe0de2._.js","server/chunks/5c86f_@aws-sdk_nested-clients_dist-es_submodules_sso-oidc_index_3fd57a79.js","server/chunks/5c86f_5f11719d._.js"].map(t=>e.l(t))).then(()=>t(246555)))},174079,e=>{e.v(t=>Promise.all(["server/chunks/[root-of-the-server]__ceed63cb._.js","server/chunks/5c86f_@aws-sdk_8c815586._.js","server/chunks/5c86f_e7f27469._.js","server/chunks/5c86f_87262e2c._.js"].map(t=>e.l(t))).then(()=>t(720697)))},745393,e=>{e.v(t=>Promise.all(["server/chunks/[root-of-the-server]__bf9d3c93._.js","server/chunks/5c86f_@aws-sdk_credential-providers_eaf019db._.js","server/chunks/5c86f_@aws-sdk_core_dist-es_submodules_protocols_query_AwsQueryProtocol_a71c1d68.js","server/chunks/5c86f_fda899e8._.js"].map(t=>e.l(t))).then(()=>t(281810)))},84617,e=>{e.v(t=>Promise.all(["server/chunks/OneDrive_Desktop_CURSOR_CONSELHO DE FUNIL_61b7774a._.js"].map(t=>e.l(t))).then(()=>t(413263)))},401065,e=>{e.v(t=>Promise.all(["server/chunks/13466_Desktop_CURSOR_CONSELHO DE FUNIL_app_src_lib_ai_rag-helpers-fixed_ts_ca76f29a._.js"].map(t=>e.l(t))).then(()=>t(756565)))}];

//# sourceMappingURL=OneDrive_Desktop_CURSOR_CONSELHO%20DE%20FUNIL_c79fa75f._.js.map
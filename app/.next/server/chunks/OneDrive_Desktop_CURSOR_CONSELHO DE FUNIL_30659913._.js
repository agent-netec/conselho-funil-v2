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
`)})),o}function s(e){let t=e.trim(),r=t.match(/```(?:json)?\s*([\s\S]*?)\s*```/);if(r&&r[1])t=r[1].trim();else{let e=t.indexOf("{"),r=t.lastIndexOf("}");-1!==e&&-1!==r&&r>e&&(t=t.substring(e,r+1))}try{return JSON.parse(t)}catch(r){throw console.error("Failed to parse JSON. Original text:",e),console.error("Cleaned text:",t),r}}e.s(["formatBrandContextForChat",()=>r,"formatBrandContextForFunnel",()=>t,"formatFunnelContextForChat",()=>a,"parseAIJSON",()=>s])},931223,e=>{"use strict";var t=e.i(906661),r=e.i(276806),a=e.i(981990),s=e.i(707163),o=e.i(893013),n=e.i(416393),i=e.i(418829),c=e.i(907831),l=e.i(787414),d=e.i(251948),u=e.i(254140),p=e.i(847739),f=e.i(877290),_=e.i(195428),h=e.i(114365),v=e.i(193695);e.i(495983);var m=e.i(56931),g=e.i(758910);e.i(564153);var x=e.i(918042),R=e.i(474065),k=e.i(346414),$=e.i(822221),w=e.i(673438),E=e.i(998596);let A=new k.GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY||"");async function P(e,{params:t}){try{let e,{id:r}=await t;if(!r)return g.NextResponse.json({error:"Campaign ID is required"},{status:400});let a=(0,x.doc)(R.db,"campaigns",r),s=await (0,x.getDoc)(a);if(!s.exists())return g.NextResponse.json({error:"Campaign not found"},{status:404});let o={id:s.id,...s.data()};console.log(`[ST-11.15] Injetando RAG para gera\xe7\xe3o de Ads: ${r}`);let n=`Estrat\xe9gias de tr\xe1fego pago, segmenta\xe7\xe3o e escala para ${o.funnel?.mainGoal} focado em ${o.funnel?.targetAudience}`,{context:i}=await (0,E.ragQuery)(n,{topK:12,minSimilarity:.2,filters:{scope:"traffic"}},"ads"),c="";if(o.brandId)try{let e=await (0,E.retrieveBrandChunks)(o.brandId,n,5);e.length>0&&(c=(0,E.formatBrandContextForLLM)(e),console.log(`[ST-11.15] Injetados ${e.length} chunks da marca.`))}catch(e){console.error("Error in Brand RAG:",e)}let l=(0,$.buildAdsGenerationPrompt)(o,{ragContext:i,brandContext:c}),d=process.env.GEMINI_MODEL||"gemini-1.5-pro",u=A.getGenerativeModel({model:d}),p=(await u.generateContent(l)).response.text();try{e=(0,w.parseAIJSON)(p)}catch(e){return console.error("Failed to parse AI response:",p),g.NextResponse.json({error:"Failed to parse AI response",details:String(e)},{status:500})}return await (0,x.updateDoc)(a,{ads:e,updatedAt:x.Timestamp.now()}),console.log(`✅ Ads generated for campaign ${r}`),g.NextResponse.json({success:!0,ads:e})}catch(e){return console.error("Ads generation error:",e),g.NextResponse.json({error:"Failed to generate ads strategy",details:String(e)},{status:500})}}e.s(["POST",()=>P,"maxDuration",0,90,"runtime",0,"nodejs"],94032);var C=e.i(94032);let y=new t.AppRouteRouteModule({definition:{kind:r.RouteKind.APP_ROUTE,page:"/api/campaigns/[id]/generate-ads/route",pathname:"/api/campaigns/[id]/generate-ads",filename:"route",bundlePath:""},distDir:".next",relativeProjectDir:"",resolvedPagePath:"[project]/OneDrive/Desktop/CURSOR/CONSELHO DE FUNIL/app/src/app/api/campaigns/[id]/generate-ads/route.ts",nextConfigOutput:"",userland:C}),{workAsyncStorage:b,workUnitAsyncStorage:j,serverHooks:O}=y;function N(){return(0,a.patchFetch)({workAsyncStorage:b,workUnitAsyncStorage:j})}async function S(e,t,a){y.isDev&&(0,s.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let g="/api/campaigns/[id]/generate-ads/route";g=g.replace(/\/index$/,"")||"/";let x=await y.prepare(e,t,{srcPage:g,multiZoneDraftMode:!1});if(!x)return t.statusCode=400,t.end("Bad Request"),null==a.waitUntil||a.waitUntil.call(a,Promise.resolve()),null;let{buildId:R,params:k,nextConfig:$,parsedUrl:w,isDraftMode:E,prerenderManifest:A,routerServerContext:P,isOnDemandRevalidate:C,revalidateOnlyGenerated:b,resolvedPathname:j,clientReferenceManifest:O,serverActionsManifest:N}=x,S=(0,i.normalizeAppPath)(g),T=!!(A.dynamicRoutes[S]||A.routes[j]),I=async()=>((null==P?void 0:P.render404)?await P.render404(e,t,w,!1):t.end("This page could not be found"),null);if(T&&!E){let e=!!A.routes[j],t=A.dynamicRoutes[S];if(t&&!1===t.fallback&&!e){if($.experimental.adapterPath)return await I();throw new v.NoFallbackError}}let D=null;!T||y.isDev||E||(D="/index"===(D=j)?"/":D);let L=!0===y.isDev||!T,M=T&&!L;N&&O&&(0,n.setManifestsSingleton)({page:g,clientReferenceManifest:O,serverActionsManifest:N});let U=e.method||"GET",F=(0,o.getTracer)(),H=F.getActiveScopeSpan(),q={params:k,prerenderManifest:A,renderOpts:{experimental:{authInterrupts:!!$.experimental.authInterrupts},cacheComponents:!!$.cacheComponents,supportsDynamicResponse:L,incrementalCache:(0,s.getRequestMeta)(e,"incrementalCache"),cacheLifeProfiles:$.cacheLife,waitUntil:a.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,r,a,s)=>y.onRequestError(e,t,a,s,P)},sharedContext:{buildId:R}},B=new c.NodeNextRequest(e),G=new c.NodeNextResponse(t),K=l.NextRequestAdapter.fromNodeNextRequest(B,(0,l.signalFromNodeResponse)(t));try{let n=async e=>y.handle(K,q).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let r=F.getRootSpanAttributes();if(!r)return;if(r.get("next.span_type")!==d.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${r.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let a=r.get("next.route");if(a){let t=`${U} ${a}`;e.setAttributes({"next.route":a,"http.route":a,"next.span_name":t}),e.updateName(t)}else e.updateName(`${U} ${g}`)}),i=!!(0,s.getRequestMeta)(e,"minimalMode"),c=async s=>{var o,c;let l=async({previousCacheEntry:r})=>{try{if(!i&&C&&b&&!r)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let o=await n(s);e.fetchMetrics=q.renderOpts.fetchMetrics;let c=q.renderOpts.pendingWaitUntil;c&&a.waitUntil&&(a.waitUntil(c),c=void 0);let l=q.renderOpts.collectedTags;if(!T)return await (0,p.sendResponse)(B,G,o,q.renderOpts.pendingWaitUntil),null;{let e=await o.blob(),t=(0,f.toNodeOutgoingHttpHeaders)(o.headers);l&&(t[h.NEXT_CACHE_TAGS_HEADER]=l),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let r=void 0!==q.renderOpts.collectedRevalidate&&!(q.renderOpts.collectedRevalidate>=h.INFINITE_CACHE)&&q.renderOpts.collectedRevalidate,a=void 0===q.renderOpts.collectedExpire||q.renderOpts.collectedExpire>=h.INFINITE_CACHE?void 0:q.renderOpts.collectedExpire;return{value:{kind:m.CachedRouteKind.APP_ROUTE,status:o.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:r,expire:a}}}}catch(t){throw(null==r?void 0:r.isStale)&&await y.onRequestError(e,t,{routerKind:"App Router",routePath:g,routeType:"route",revalidateReason:(0,u.getRevalidateReason)({isStaticGeneration:M,isOnDemandRevalidate:C})},!1,P),t}},d=await y.handleResponse({req:e,nextConfig:$,cacheKey:D,routeKind:r.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:A,isRoutePPREnabled:!1,isOnDemandRevalidate:C,revalidateOnlyGenerated:b,responseGenerator:l,waitUntil:a.waitUntil,isMinimalMode:i});if(!T)return null;if((null==d||null==(o=d.value)?void 0:o.kind)!==m.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==d||null==(c=d.value)?void 0:c.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});i||t.setHeader("x-nextjs-cache",C?"REVALIDATED":d.isMiss?"MISS":d.isStale?"STALE":"HIT"),E&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let v=(0,f.fromNodeOutgoingHttpHeaders)(d.value.headers);return i&&T||v.delete(h.NEXT_CACHE_TAGS_HEADER),!d.cacheControl||t.getHeader("Cache-Control")||v.get("Cache-Control")||v.set("Cache-Control",(0,_.getCacheControlHeader)(d.cacheControl)),await (0,p.sendResponse)(B,G,new Response(d.value.body,{headers:v,status:d.value.status||200})),null};H?await c(H):await F.withPropagatedContext(e.headers,()=>F.trace(d.BaseServerSpan.handleRequest,{spanName:`${U} ${g}`,kind:o.SpanKind.SERVER,attributes:{"http.method":U,"http.target":e.url}},c))}catch(t){if(t instanceof v.NoFallbackError||await y.onRequestError(e,t,{routerKind:"App Router",routePath:S,routeType:"route",revalidateReason:(0,u.getRevalidateReason)({isStaticGeneration:M,isOnDemandRevalidate:C})},!1,P),T)throw t;return await (0,p.sendResponse)(B,G,new Response(null,{status:500})),null}}e.s(["handler",()=>S,"patchFetch",()=>N,"routeModule",()=>y,"serverHooks",()=>O,"workAsyncStorage",()=>b,"workUnitAsyncStorage",()=>j],931223)},878617,e=>{e.v(t=>Promise.all(["server/chunks/[root-of-the-server]__1f9ecf32._.js","server/chunks/5c86f_8db425cf._.js","server/chunks/5c86f_@aws-sdk_credential-provider-cognito-identity_48abad20._.js"].map(t=>e.l(t))).then(()=>t(971738)))},260063,e=>{e.v(t=>Promise.all(["server/chunks/5c86f_@aws-sdk_credential-provider-http_dist-es_index_cd17189a.js"].map(t=>e.l(t))).then(()=>t(618513)))},616800,e=>{e.v(t=>Promise.all(["server/chunks/5c86f_@smithy_credential-provider-imds_dist-es_index_0fe1a303.js"].map(t=>e.l(t))).then(()=>t(710858)))},307311,e=>{e.v(t=>Promise.all(["server/chunks/5c86f_@aws-sdk_credential-provider-env_dist-es_index_4fff1637.js"].map(t=>e.l(t))).then(()=>t(690392)))},210675,e=>{e.v(t=>Promise.all(["server/chunks/[root-of-the-server]__f54224ec._.js","server/chunks/5c86f_@aws-sdk_nested-clients_dist-es_submodules_sts_index_e9d57c48.js","server/chunks/5c86f_30e61836._.js","server/chunks/5c86f_@aws-sdk_core_dist-es_submodules_protocols_query_AwsQueryProtocol_a71c1d68.js"].map(t=>e.l(t))).then(()=>t(482808)))},960952,e=>{e.v(t=>Promise.all(["server/chunks/[root-of-the-server]__d6050494._.js","server/chunks/5c86f_@aws-sdk_nested-clients_dist-es_submodules_signin_index_2c34b094.js","server/chunks/5c86f_17fe0de2._.js","server/chunks/5c86f_5f11719d._.js"].map(t=>e.l(t))).then(()=>t(82515)))},83092,e=>{e.v(t=>Promise.all(["server/chunks/5c86f_@aws-sdk_credential-provider-process_dist-es_index_8f3445b8.js"].map(t=>e.l(t))).then(()=>t(493241)))},643449,e=>{e.v(t=>Promise.all(["server/chunks/5c86f_@aws-sdk_credential-provider-sso_dist-es_index_06fbc501.js"].map(t=>e.l(t))).then(()=>t(632366)))},435934,e=>{e.v(t=>Promise.all(["server/chunks/5c86f_@aws-sdk_credential-provider-web-identity_dist-es_index_bddb838d.js"].map(t=>e.l(t))).then(()=>t(424055)))},916312,e=>{e.v(t=>Promise.all(["server/chunks/5c86f_@aws-sdk_credential-provider-ini_dist-es_index_8e002212.js"].map(t=>e.l(t))).then(()=>t(689167)))},658563,e=>{e.v(t=>Promise.all(["server/chunks/[root-of-the-server]__d6050494._.js","server/chunks/5c86f_17fe0de2._.js","server/chunks/5c86f_@aws-sdk_nested-clients_dist-es_submodules_sso-oidc_index_3fd57a79.js","server/chunks/5c86f_5f11719d._.js"].map(t=>e.l(t))).then(()=>t(246555)))},174079,e=>{e.v(t=>Promise.all(["server/chunks/[root-of-the-server]__d676b784._.js","server/chunks/5c86f_@aws-sdk_8c815586._.js","server/chunks/5c86f_e7f27469._.js","server/chunks/5c86f_87262e2c._.js"].map(t=>e.l(t))).then(()=>t(720697)))},745393,e=>{e.v(t=>Promise.all(["server/chunks/[root-of-the-server]__906c2117._.js","server/chunks/5c86f_@aws-sdk_credential-providers_eaf019db._.js","server/chunks/5c86f_@aws-sdk_core_dist-es_submodules_protocols_query_AwsQueryProtocol_a71c1d68.js","server/chunks/5c86f_fda899e8._.js"].map(t=>e.l(t))).then(()=>t(281810)))},84617,e=>{e.v(t=>Promise.all(["server/chunks/OneDrive_Desktop_CURSOR_CONSELHO DE FUNIL_40dafaa2._.js"].map(t=>e.l(t))).then(()=>t(413263)))},401065,e=>{e.v(t=>Promise.all(["server/chunks/13466_Desktop_CURSOR_CONSELHO DE FUNIL_app_src_lib_ai_rag-helpers-fixed_ts_ca76f29a._.js"].map(t=>e.l(t))).then(()=>t(756565)))}];

//# sourceMappingURL=OneDrive_Desktop_CURSOR_CONSELHO%20DE%20FUNIL_30659913._.js.map
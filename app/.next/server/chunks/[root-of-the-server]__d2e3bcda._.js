module.exports=[666680,(e,t,r)=>{t.exports=e.x("node:crypto",()=>require("node:crypto"))},653936,e=>{"use strict";var t=e.i(346414);e.i(564153);var r=e.i(918042),a=e.i(474065);function o(){let e=(process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY??"").trim(),t=(process.env.GOOGLE_AI_API_KEY??"").trim();return e||t}async function n(e){let t=new TextEncoder().encode(e.trim().toLowerCase());return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",t))).map(e=>e.toString(16).padStart(2,"0")).join("")}async function i(e){let t=o();if(!t)throw Error("GOOGLE_AI_API_KEY not configured for embeddings");let i=Date.now(),s=await n(e);try{let e=(0,r.doc)(a.db,"query_cache",s),t=await (0,r.getDoc)(e);if(t.exists()){let e=t.data();if(!(r.Timestamp.now().toMillis()-e.createdAt.toMillis()>2592e6))return console.log(`[Embeddings] Cache HIT for key: ${s.substring(0,8)} (${Date.now()-i}ms)`),e.embedding}}catch(e){console.warn("[Embeddings] Cache read error:",e)}try{console.log("[Embeddings] Calling text-embedding-004 with dimensionality: 768");let o=await fetch("https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent",{method:"POST",headers:{"Content-Type":"application/json","x-goog-api-key":t},body:JSON.stringify({model:"models/text-embedding-004",content:{parts:[{text:e}]},outputDimensionality:768})});if(!o.ok){let e=await o.text();throw Error(`Embedding API failed: ${o.status} ${e}`)}let n=await o.json(),c=n?.embedding?.values;if(!Array.isArray(c))throw Error("Embedding API returned no values");let l=(0,r.doc)(a.db,"query_cache",s);return(0,r.setDoc)(l,{query:e.substring(0,500),embedding:c,createdAt:r.Timestamp.now()}).catch(e=>console.error("[Embeddings] Cache write error:",e)),console.log(`[Embeddings] Cache MISS - API called (${Date.now()-i}ms)`),c}catch(e){throw console.error("[Embeddings] Error generating embedding:",e),e}}async function s(e){let i=Date.now(),s=Array(e.length).fill(null),c=[],l=[],d=r.Timestamp.now().toMillis();for(let t=0;t<e.length;t++){let o=e[t],i=await n(o);try{let e=(0,r.doc)(a.db,"query_cache",i),o=await (0,r.getDoc)(e);if(o.exists()){let e=o.data();if(!(d-e.createdAt.toMillis()>2592e6)){s[t]=e.embedding;continue}}}catch(e){}c.push(t),l.push(o)}if(0===l.length)return console.log(`[Embeddings] Batch Cache HIT (100%) - ${e.length} items (${Date.now()-i}ms)`),s;let u=o();if(!u)throw Error("GOOGLE_AI_API_KEY not configured for embeddings");new t.GoogleGenerativeAI(u).getGenerativeModel({model:"text-embedding-004"});try{console.log(`[Embeddings] Batch Cache MISS - Calling API for ${l.length}/${e.length} items`);let t=[];for(let e=0;e<l.length;e+=90){let r=l.slice(e,e+90);console.log(`[Embeddings] Processing API sub-batch ${e/90+1} (${r.length} items)`);let a=await fetch("https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:batchEmbedContents",{method:"POST",headers:{"Content-Type":"application/json","x-goog-api-key":u},body:JSON.stringify({requests:r.map(e=>({model:"models/text-embedding-004",content:{parts:[{text:e}]},outputDimensionality:768}))})});if(!a.ok){let e=await a.text();throw Error(`Batch Embedding API failed: ${a.status} ${e}`)}let o=await a.json();if(!o.embeddings||!Array.isArray(o.embeddings))throw Error("Batch Embedding API returned invalid format");t.push(...o.embeddings.map(e=>e.values))}for(let e=0;e<c.length;e++){let o=c[e],i=t[e],d=l[e];s[o]=i;let u=await n(d),p=(0,r.doc)(a.db,"query_cache",u);(0,r.setDoc)(p,{query:d.substring(0,500),embedding:i,createdAt:r.Timestamp.now()}).catch(e=>console.error("[Embeddings] Cache write error:",e))}return console.log(`[Embeddings] Batch completed (${Date.now()-i}ms)`),s}catch(e){throw console.error("[Embeddings] Error generating batch embeddings:",e),e}}e.s(["generateEmbedding",()=>i,"generateEmbeddingsBatch",()=>s])},413263,e=>{"use strict";function t(){let e=process.env.PINECONE_API_KEY,t=process.env.PINECONE_INDEX||process.env.PINECONE_INDEX_NAME||"cf-dev-assets",r=process.env.PINECONE_HOST||process.env.PINECONE_HOST_URL;if(!e)throw Error("PINECONE_API_KEY ausente.");return{apiKey:e,indexName:t,host:r}}let r=null,a=null;async function o(){if(r)return r;let{apiKey:a}=t(),{Pinecone:o}=await e.A(465660);return r=new o({apiKey:a})}async function n(){if(a)return a;let{indexName:e,host:r}=t(),n=await o();return n?a=r?n.index(e,r):n.index(e):null}async function i(e,t={}){if(!e?.length)return{upserted:0};let r=await n();if(!r)return{upserted:0};let a=t.namespace?r.namespace(t.namespace):r;return await a.upsert(e),{upserted:e.length}}async function s(e){let{vector:t,topK:r=10,namespace:a,filter:o}=e,i=await n();if(!i)return{matches:[]};let s=a?i.namespace(a):i;return await s.query({vector:t,topK:r,filter:o,includeMetadata:!0})}async function c(){let{indexName:e}=t(),r=await n(),a=await o();if(!r||!a)return null;let i=await r.describeIndexStats();return await a.describeIndex(e),{status:"connected",index:e,totalVectors:i.totalRecordCount??0}}e.s(["checkPineconeHealth",()=>c,"getPineconeClient",()=>o,"getPineconeIndex",()=>n,"queryPinecone",()=>s,"upsertToPinecone",()=>i])},673438,e=>{"use strict";function t(e){return`## CONTEXTO DA MARCA (PRIORIDADE M\xc1XIMA)
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
**⚠️ IMPORTANTE:** Todas as respostas devem respeitar o tom de voz, posicionamento e contexto desta marca.`}function a(e,t=[]){let r=e.context,o=r.channel?.main||r.channels?.primary||"N/A",n=`### Funil: ${e.name}
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
- **Principal**: ${o}
`;return t.length>0&&(n+=`
### Propostas Geradas (${t.length})
`,t.slice(0,2).forEach((e,t)=>{let r=e.scorecard?.overall||"N/A";n+=`
**${t+1}. ${e.name}** (Score: ${r})
- ${e.summary?.slice(0,200)||"Sem resumo"}...
`,e.strategy?.risks?.length&&(n+=`- Riscos: ${e.strategy.risks.slice(0,2).join(", ")}
`)})),n}function o(e){let t=e.trim(),r=t.match(/```(?:json)?\s*([\s\S]*?)\s*```/);if(r&&r[1])t=r[1].trim();else{let e=t.indexOf("{"),r=t.lastIndexOf("}");-1!==e&&-1!==r&&r>e&&(t=t.substring(e,r+1))}try{return JSON.parse(t)}catch(r){throw console.error("Failed to parse JSON. Original text:",e),console.error("Cleaned text:",t),r}}e.s(["formatBrandContextForChat",()=>r,"formatBrandContextForFunnel",()=>t,"formatFunnelContextForChat",()=>a,"parseAIJSON",()=>o])},910153,e=>{"use strict";var t=e.i(666680);let r={randomUUID:t.randomUUID},a=new Uint8Array(256),o=a.length,n=[];for(let e=0;e<256;++e)n.push((e+256).toString(16).slice(1));e.s(["v4",0,function(e,i,s){if(r.randomUUID&&!i&&!e)return r.randomUUID();var c=e,l=s;let d=(c=c||{}).random??c.rng?.()??(o>a.length-16&&((0,t.randomFillSync)(a),o=0),a.slice(o,o+=16));if(d.length<16)throw Error("Random bytes length must be >= 16");if(d[6]=15&d[6]|64,d[8]=63&d[8]|128,i){if((l=l||0)<0||l+16>i.length)throw RangeError(`UUID byte range ${l}:${l+15} is out of buffer bounds`);for(let e=0;e<16;++e)i[l+e]=d[e];return i}return function(e,t=0){return(n[e[t+0]]+n[e[t+1]]+n[e[t+2]]+n[e[t+3]]+"-"+n[e[t+4]]+n[e[t+5]]+"-"+n[e[t+6]]+n[e[t+7]]+"-"+n[e[t+8]]+n[e[t+9]]+"-"+n[e[t+10]]+n[e[t+11]]+n[e[t+12]]+n[e[t+13]]+n[e[t+14]]+n[e[t+15]]).toLowerCase()}(d)}],910153)},283003,e=>{"use strict";var t=e.i(906661),r=e.i(276806),a=e.i(981990),o=e.i(707163),n=e.i(893013),i=e.i(416393),s=e.i(418829),c=e.i(907831),l=e.i(787414),d=e.i(251948),u=e.i(254140),p=e.i(847739),m=e.i(877290),g=e.i(195428),h=e.i(114365),f=e.i(193695);e.i(495983);var E=e.i(56931),v=e.i(758910),x=e.i(675229);let y=`
Voc\xea \xe9 o Diretor de Arte do Conselho de Funil. Sua miss\xe3o \xe9 analisar ativos visuais (an\xfancios, landing pages, posts) e fornecer cr\xedticas t\xe9cnicas baseadas em convers\xe3o e psicologia.

### DIRETRIZES DE AN\xc1LISE:
1. **Legibilidade**: O texto est\xe1 f\xe1cil de ler? O contraste est\xe1 correto?
2. **Psicologia das Cores**: As cores usadas transmitem a emo\xe7\xe3o correta para a marca?
3. **Gatilhos Visuais**: Existem elementos que guiam o olho (setas, rostos, bot\xf5es)?
4. **Alinhamento Estrat\xe9gico**: O visual suporta a oferta ou distrai dela?

### FORMATO DE SA\xcdDA:
Voc\xea DEVE responder APENAS com um objeto JSON v\xe1lido, seguindo exatamente esta estrutura:

{
  "score": 0-100,
  "heuristics": {
    "legibility": {
      "score": 0-100,
      "feedback": "string"
    },
    "colorPsychology": {
      "score": 0-100,
      "feedback": "string",
      "dominantEmotions": ["string"]
    },
    "visualHooks": {
      "presence": true/false,
      "types": ["faces", "arrows", "social_proof", "others"],
      "effectiveness": "string"
    }
  },
  "strategicAdvice": "Uma recomenda\xe7\xe3o curta e direta para melhorar a convers\xe3o."
}

Se houver contexto da marca, use-o para avaliar se as cores e o estilo est\xe3o alinhados.
`;var b=e.i(813106),A=e.i(673438),w=e.i(653936),$=e.i(413263),C=e.i(910153);async function R(e){try{let t,r,a,{imageUri:o,brandId:n,userId:i,context:s}=await e.json();if(!o||!n||!i)return v.NextResponse.json({error:"imageUri, brandId and userId are required"},{status:400});let c=await (0,b.getBrand)(n),l=c?(0,A.formatBrandContextForChat)(c):"";console.log(`[Vision] Processando imagem: ${o}`);let d="image/jpeg";try{let e=await fetch(o);if(!e.ok)throw Error(`Falha ao buscar imagem: ${e.statusText}`);let r=await e.arrayBuffer();t=Buffer.from(r).toString("base64");let a=e.headers.get("content-type");a&&(d=a)}catch(e){return console.error("[Vision] Erro ao carregar imagem:",e),v.NextResponse.json({error:"Falha ao carregar a imagem para análise."},{status:422})}let u=(a=y,l&&(a+=`

CONTEXTO DA MARCA:
${l}`),s&&(a+=`

CONTEXTO ADICIONAL DO ATIVO:
${s}`),a);console.log("[Vision] Chamando Gemini Vision...");let p=await (0,x.analyzeMultimodalWithGemini)(u,t,d,{model:"gemini-2.0-flash-exp",temperature:.2});try{r=(0,A.parseAIJSON)(p)}catch(e){return console.error("[Vision] Erro ao parsear JSON da IA:",p),v.NextResponse.json({error:"A IA retornou um formato inválido. Tente novamente."},{status:500})}try{let e=`An\xe1lise Visual (${c?.name||"Marca"}): ${r.strategicAdvice}. Score: ${r.score}. Heur\xedsticas: Legibilidade ${r.heuristics.legibility.score}, Cores ${r.heuristics.colorPsychology.score}.`,t=await (0,w.generateEmbedding)(e),a=`vis_${(0,C.v4)().substring(0,8)}`;await (0,$.upsertToPinecone)([{id:a,values:t,metadata:{assetType:"visual_analysis",brandId:n,userId:i,score:r.score,heuristics_summary:JSON.stringify(r.heuristics),strategicAdvice:r.strategicAdvice,imageUri:o,createdAt:new Date().toISOString()}}],{namespace:"visual"}),console.log(`[Vision] Insights salvos no Pinecone (ID: ${a})`)}catch(e){console.error("[Vision] Erro ao salvar no Pinecone:",e)}try{await (0,b.updateUserUsage)(i,-2),console.log(`[Vision] 2 cr\xe9ditos decrementados para usu\xe1rio: ${i}`)}catch(e){console.error("[Vision] Erro ao atualizar créditos:",e)}return v.NextResponse.json(r)}catch(e){return console.error("Error in analyze-visual API:",e),v.NextResponse.json({error:"Internal server error",details:e.message},{status:500})}}e.s(["POST",()=>R,"dynamic",0,"force-dynamic","runtime",0,"nodejs"],239696);var O=e.i(239696);let P=new t.AppRouteRouteModule({definition:{kind:r.RouteKind.APP_ROUTE,page:"/api/ai/analyze-visual/route",pathname:"/api/ai/analyze-visual",filename:"route",bundlePath:""},distDir:".next",relativeProjectDir:"",resolvedPagePath:"[project]/OneDrive/Desktop/CURSOR/CONSELHO DE FUNIL/app/src/app/api/ai/analyze-visual/route.ts",nextConfigOutput:"",userland:O}),{workAsyncStorage:I,workUnitAsyncStorage:N,serverHooks:S}=P;function T(){return(0,a.patchFetch)({workAsyncStorage:I,workUnitAsyncStorage:N})}async function _(e,t,a){P.isDev&&(0,o.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let v="/api/ai/analyze-visual/route";v=v.replace(/\/index$/,"")||"/";let x=await P.prepare(e,t,{srcPage:v,multiZoneDraftMode:!1});if(!x)return t.statusCode=400,t.end("Bad Request"),null==a.waitUntil||a.waitUntil.call(a,Promise.resolve()),null;let{buildId:y,params:b,nextConfig:A,parsedUrl:w,isDraftMode:$,prerenderManifest:C,routerServerContext:R,isOnDemandRevalidate:O,revalidateOnlyGenerated:I,resolvedPathname:N,clientReferenceManifest:S,serverActionsManifest:T}=x,_=(0,s.normalizeAppPath)(v),D=!!(C.dynamicRoutes[_]||C.routes[N]),k=async()=>((null==R?void 0:R.render404)?await R.render404(e,t,w,!1):t.end("This page could not be found"),null);if(D&&!$){let e=!!C.routes[N],t=C.dynamicRoutes[_];if(t&&!1===t.fallback&&!e){if(A.experimental.adapterPath)return await k();throw new f.NoFallbackError}}let U=null;!D||P.isDev||$||(U="/index"===(U=N)?"/":U);let M=!0===P.isDev||!D,L=D&&!M;T&&S&&(0,i.setManifestsSingleton)({page:v,clientReferenceManifest:S,serverActionsManifest:T});let j=e.method||"GET",V=(0,n.getTracer)(),F=V.getActiveScopeSpan(),H={params:b,prerenderManifest:C,renderOpts:{experimental:{authInterrupts:!!A.experimental.authInterrupts},cacheComponents:!!A.cacheComponents,supportsDynamicResponse:M,incrementalCache:(0,o.getRequestMeta)(e,"incrementalCache"),cacheLifeProfiles:A.cacheLife,waitUntil:a.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,r,a,o)=>P.onRequestError(e,t,a,o,R)},sharedContext:{buildId:y}},q=new c.NodeNextRequest(e),B=new c.NodeNextResponse(t),G=l.NextRequestAdapter.fromNodeNextRequest(q,(0,l.signalFromNodeResponse)(t));try{let i=async e=>P.handle(G,H).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let r=V.getRootSpanAttributes();if(!r)return;if(r.get("next.span_type")!==d.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${r.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let a=r.get("next.route");if(a){let t=`${j} ${a}`;e.setAttributes({"next.route":a,"http.route":a,"next.span_name":t}),e.updateName(t)}else e.updateName(`${j} ${v}`)}),s=!!(0,o.getRequestMeta)(e,"minimalMode"),c=async o=>{var n,c;let l=async({previousCacheEntry:r})=>{try{if(!s&&O&&I&&!r)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let n=await i(o);e.fetchMetrics=H.renderOpts.fetchMetrics;let c=H.renderOpts.pendingWaitUntil;c&&a.waitUntil&&(a.waitUntil(c),c=void 0);let l=H.renderOpts.collectedTags;if(!D)return await (0,p.sendResponse)(q,B,n,H.renderOpts.pendingWaitUntil),null;{let e=await n.blob(),t=(0,m.toNodeOutgoingHttpHeaders)(n.headers);l&&(t[h.NEXT_CACHE_TAGS_HEADER]=l),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let r=void 0!==H.renderOpts.collectedRevalidate&&!(H.renderOpts.collectedRevalidate>=h.INFINITE_CACHE)&&H.renderOpts.collectedRevalidate,a=void 0===H.renderOpts.collectedExpire||H.renderOpts.collectedExpire>=h.INFINITE_CACHE?void 0:H.renderOpts.collectedExpire;return{value:{kind:E.CachedRouteKind.APP_ROUTE,status:n.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:r,expire:a}}}}catch(t){throw(null==r?void 0:r.isStale)&&await P.onRequestError(e,t,{routerKind:"App Router",routePath:v,routeType:"route",revalidateReason:(0,u.getRevalidateReason)({isStaticGeneration:L,isOnDemandRevalidate:O})},!1,R),t}},d=await P.handleResponse({req:e,nextConfig:A,cacheKey:U,routeKind:r.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:C,isRoutePPREnabled:!1,isOnDemandRevalidate:O,revalidateOnlyGenerated:I,responseGenerator:l,waitUntil:a.waitUntil,isMinimalMode:s});if(!D)return null;if((null==d||null==(n=d.value)?void 0:n.kind)!==E.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==d||null==(c=d.value)?void 0:c.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});s||t.setHeader("x-nextjs-cache",O?"REVALIDATED":d.isMiss?"MISS":d.isStale?"STALE":"HIT"),$&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let f=(0,m.fromNodeOutgoingHttpHeaders)(d.value.headers);return s&&D||f.delete(h.NEXT_CACHE_TAGS_HEADER),!d.cacheControl||t.getHeader("Cache-Control")||f.get("Cache-Control")||f.set("Cache-Control",(0,g.getCacheControlHeader)(d.cacheControl)),await (0,p.sendResponse)(q,B,new Response(d.value.body,{headers:f,status:d.value.status||200})),null};F?await c(F):await V.withPropagatedContext(e.headers,()=>V.trace(d.BaseServerSpan.handleRequest,{spanName:`${j} ${v}`,kind:n.SpanKind.SERVER,attributes:{"http.method":j,"http.target":e.url}},c))}catch(t){if(t instanceof f.NoFallbackError||await P.onRequestError(e,t,{routerKind:"App Router",routePath:_,routeType:"route",revalidateReason:(0,u.getRevalidateReason)({isStaticGeneration:L,isOnDemandRevalidate:O})},!1,R),D)throw t;return await (0,p.sendResponse)(q,B,new Response(null,{status:500})),null}}e.s(["handler",()=>_,"patchFetch",()=>T,"routeModule",()=>P,"serverHooks",()=>S,"workAsyncStorage",()=>I,"workUnitAsyncStorage",()=>N],283003)},465660,e=>{e.v(t=>Promise.all(["server/chunks/[root-of-the-server]__a13a3d25._.js","server/chunks/5c86f_@pinecone-database_pinecone_dist_b1d5c4a9._.js"].map(t=>e.l(t))).then(()=>t(432229)))}];

//# sourceMappingURL=%5Broot-of-the-server%5D__d2e3bcda._.js.map
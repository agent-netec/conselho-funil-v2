module.exports=[285173,e=>{"use strict";var t=e.i(906661),n=e.i(276806),r=e.i(981990),a=e.i(707163),o=e.i(893013),s=e.i(416393),i=e.i(418829),l=e.i(907831),c=e.i(787414),d=e.i(251948),u=e.i(254140),p=e.i(847739),h=e.i(877290),g=e.i(195428),m=e.i(114365),f=e.i(193695);e.i(495983);var R=e.i(56931),C=e.i(758910),E=e.i(998596),x=e.i(675229),S=e.i(813106),v=e.i(683695);e.i(199678);var y=e.i(316030),O=e.i(112705),A=e.i(344121),_=e.i(673438);async function T(e){try{let t,{message:n,conversationId:r,mode:a="general",partyMode:o=!1,counselor:s,funnelId:i,campaignId:l,selectedAgents:c=[],intensity:d="debate"}=await e.json();if(!n||!r)return C.NextResponse.json({error:"Message and conversationId are required"},{status:400});let u=await (0,S.getConversation)(r);if(!u)return C.NextResponse.json({error:"Conversation not found"},{status:404});let p=u.userId,h=await (0,S.getUserCredits)(p);0;let g="party"===a||!0===o?"party":a,m="undefined"===l?void 0:l,f=Promise.resolve("");i&&(f=(async()=>{try{let e=await (0,S.getFunnel)(i);if(e){let t=await (0,S.getFunnelProposals)(i);return(0,_.formatFunnelContextForChat)(e,t)}}catch(e){console.error("Error loading funnel:",e)}return""})());let R=Promise.resolve("");m&&(R=(async()=>{try{let e=await (0,S.getCampaign)(m);if(e){let t=`## MANIFESTO DA CAMPANHA (LINHA DE OURO)
ID da Campanha: ${e.id||m}
Status: ${e.status||"active"}
Objetivo: ${e.funnel?.mainGoal||"N/A"}
P\xfablico: ${e.funnel?.targetAudience||"N/A"}
`;return e.copywriting&&(t+=`
[COPY APROVADA]
Big Idea: ${e.copywriting.bigIdea}
`),e.social&&(t+=`
[ESTRAT\xc9GIA SOCIAL]
${e.social.hooks?.length||0} Hooks aprovados.
`),e.design&&(t+=`
[ESTILO VISUAL]
${e.design.visualStyle}
`),t}}catch(e){console.error("Error loading campaign:",e)}return""})());let A=Promise.resolve("");["meus funis","quais funis","listar funis","lista de funis","funis que temos"].some(e=>n.toLowerCase().includes(e))&&(A=(async()=>{try{let e=await (0,S.getUserFunnels)(p);if(e.length>0)return`## SEUS FUNIS EXISTENTES (${e.length})

`+e.map(e=>`- **${e.name}**: ${e.description||"Sem descrição"} (Status: ${e.status}, ID: ${e.id})`).join("\n")+`

⚠️ INSTRU\xc7\xc3O: O usu\xe1rio pediu para ver seus funis. Liste-os de forma amig\xe1vel e pergunte se ele deseja analisar algum deles especificamente.`;return`## SEUS FUNIS EXISTENTES

Voc\xea ainda n\xe3o possui funis criados.`}catch(e){console.error("Error loading user funnels:",e)}return""})());let T=Promise.resolve({context:"",brandChunks:[]});u?.brandId&&(T=(async()=>{try{let e=await (0,v.getBrand)(u.brandId);if(e){let t=(0,_.formatBrandContextForChat)(e),r=await (0,E.retrieveBrandChunks)(u.brandId,n,5);return{context:t,brandChunks:r}}}catch(e){console.error("Error loading brand:",e)}return{context:"",brandChunks:[]}})());let b={topK:10,minSimilarity:.25,filters:{}},I=y.CHAT_SYSTEM_PROMPT;switch("copy"===g?(I=y.COPY_CHAT_SYSTEM_PROMPT,b.filters.docType="copywriting"):"social"===g?(I=y.SOCIAL_CHAT_SYSTEM_PROMPT,b.filters.counselor="social",b.topK=15):"ads"===g?(I=y.ADS_CHAT_SYSTEM_PROMPT,b.filters.scope="traffic",b.topK=15):"design"===g&&(I=O.DESIGN_CHAT_SYSTEM_PROMPT,b.filters.counselor="design_director",b.topK=15),g){case"funnel_creation":b.topK=15,b.minSimilarity=.2;break;case"funnel_evaluation":case"funnel_review":b.topK=12,b.filters.docType="scorecards"}s&&(b.filters.counselor=s);let P=(0,E.retrieveChunks)(n,b);console.log("[Chat API] Starting parallel context retrieval...");let[N,$,D,k,U]=await Promise.all([f,R,A,T,P]);console.log("[Chat API] Context retrieval completed.");let{context:M,brandChunks:j}=k,H=j.length>0?(0,E.formatBrandContextForLLM)(j):"",F=[...U.map(e=>({file:e.source.file,section:e.source.section,content:e.content.slice(0,400)+(e.content.length>400?"...":""),counselor:e.metadata.counselor,similarity:e.similarity,rerankScore:e.rerankScore,type:e.metadata.docType})),...j.map(e=>({file:e.assetName,section:"Asset da Marca",content:e.content.slice(0,400)+(e.content.length>400?"...":""),counselor:"brand",similarity:e.similarity,rerankScore:e.rerankScore,type:"brand_asset"}))],L=(0,E.formatContextForLLM)(U);if(M&&(L=`## CONTEXTO DA MARCA (SEMPRE CONSIDERE)

${M}

---

${L}`),H&&(L=`${H}

---

${L}`),N&&(L=`## CONTEXTO DO FUNIL DO USU\xc1RIO

${N}

---

${L}`),$&&(L=`${$}

---

${L}`),D&&(L=`${D}

---

${L}`),L.length>12e4){console.log(`[Chat API] Context too large (${L.length} chars). Truncating...`);let e=L.slice(0,2e4),t=L.slice(-1e5);L=`${e}

... [CONTE\xdaDO ANTIGO RESUMIDO PARA ECONOMIA DE CONTEXTO] ...

${t}`}try{if((0,x.isGeminiConfigured)())if("party"===g&&c.length>0)console.log("Generating Party Mode response with agents:",c),t=await (0,x.generatePartyResponseWithGemini)(n,L,c,{intensity:d});else{let e=M.length>0||N.length>0||$.length>0,r=0===U.length&&L.length<100&&!e?`${L}

⚠️ NOTA: A busca na base de conhecimento n\xe3o retornou resultados espec\xedficos para esta pergunta. Responda com base no seu conhecimento geral como especialista de 2026, mas mencione se houver incerteza sobre diretrizes internas espec\xedficas.`:L;console.log(`Generating council response for mode: ${g}`),t=await (0,x.generateCouncilResponseWithGemini)(n,r,I,"design"===g?"gemini-3-flash-preview":void 0)}else console.warn("Gemini API not configured, using fallback response"),t=w(n,U,I)}catch(e){console.error("AI generation error:",e),t=w(n,U,I)}try{let e="party"===g?c:[...new Set(U.map(e=>e.metadata.counselor).filter(Boolean))];0===e.length&&("copy"===g?e=["copy_director"]:"social"===g?e=["social_director"]:"ads"===g?e=["traffic_director"]:"design"===g&&(e=["design_director"]));let a=(0,S.addMessage)(r,{role:"assistant",content:t,metadata:{sources:F,counselors:e}}),o=Promise.resolve(),s=(0,S.updateConversation)(r,{title:n.slice(0,50)+(n.length>50?"...":"")});await Promise.all([a,o,s]),console.log("[Chat API] Post-processing completed.")}catch(e){console.error("Error in post-processing:",e)}return C.NextResponse.json({response:t,sources:F,version:"11.24.5-perf"})}catch(e){return console.error("Error in chat API:",e),C.NextResponse.json({error:"Internal server error"},{status:500})}}function w(e,t,n){if(0===t.length){let e=n?.includes("Copywriting");return n?.includes("Social")?`**Conselho Social**

Desculpe, n\xe3o encontrei informa\xe7\xf5es espec\xedficas sobre redes sociais na base de conhecimento para responder sua pergunta.

Os 4 especialistas sociais est\xe3o prontos para ajudar:
${Object.values(A.COUNSELORS_REGISTRY).filter(e=>["lia_haberman","rachel_karten","nikita_beer","justin_welsh"].includes(e.id)).map(e=>`- ${e.name} (${e.expertise})`).join("\n")}`:n?.includes("Ads")?`**Conselho de Ads**

Desculpe, n\xe3o encontrei informa\xe7\xf5es espec\xedficas sobre tr\xe1fego na base de conhecimento para responder sua pergunta.

Os 4 especialistas de Ads est\xe3o prontos para ajudar:
${Object.values(A.COUNSELORS_REGISTRY).filter(e=>["justin_brooke","nicholas_kusmich","jon_loomer","savannah_sanchez"].includes(e.id)).map(e=>`- ${e.name} (${e.expertise})`).join("\n")}`:n?.includes("Design")?`**Conselho de Design**

Desculpe, n\xe3o encontrei informa\xe7\xf5es espec\xedficas sobre design na base de conhecimento para responder sua pergunta.

O Diretor de Design est\xe1 pronto para ajudar:
- Diretor de Design (Dire\xe7\xe3o de Arte & Briefing)`:`**Conselho de ${e?"Copywriting":"Funil"}**

Desculpe, n\xe3o encontrei informa\xe7\xf5es espec\xedficas na base de conhecimento para responder sua pergunta.

Os ${e?"9 copywriters":"6 conselheiros"} est\xe3o prontos para ajudar:
${(e?["eugene_schwartz","claude_hopkins","gary_halbert","joseph_sugarman","dan_kennedy_copy","david_ogilvy","john_carlton","drayton_bird","frank_kern_copy"]:["russell_brunson","dan_kennedy","frank_kern","sam_ovens","ryan_deiss","perry_belcher"]).map(e=>{let t=A.COUNSELORS_REGISTRY[e];return`- ${t?.name} (${t?.expertise})`}).join("\n")}`}let r=[...new Set(t.map(e=>e.metadata.counselor).filter(Boolean))],a=`## An\xe1lise do Conselho de Funil

`;if(r.length>0){let e=r.map(e=>A.COUNSELORS_REGISTRY[e]?.name||e).join(", ");a+=`*Consultando: ${e}*

`}return a+=`Encontrei **${t.length}** refer\xeancia(s) relevante(s) para sua pergunta:

`,t.slice(0,3).forEach((e,t)=>{let n=e.metadata.counselor?A.COUNSELORS_REGISTRY[e.metadata.counselor]?.name||e.metadata.counselor:"Base de Conhecimento",r=(100*e.similarity).toFixed(0),o=e.content.slice(0,250).replace(/\n/g," ").trim();a+=`### ${n} (${e.metadata.docType})
*Relev\xe2ncia: ${r}%*

> ${o}...

`}),a+=`---
📚 *${t.length} fonte(s) consultada(s) na base de conhecimento*

⚠️ *Nota: Esta \xe9 uma resposta baseada apenas em retrieval. Configure o Vertex AI para respostas completas do Conselho.*`}e.s(["POST",()=>T,"dynamic",0,"force-dynamic","runtime",0,"nodejs"],404669);var b=e.i(404669);let I=new t.AppRouteRouteModule({definition:{kind:n.RouteKind.APP_ROUTE,page:"/api/chat/route",pathname:"/api/chat",filename:"route",bundlePath:""},distDir:".next",relativeProjectDir:"",resolvedPagePath:"[project]/OneDrive/Desktop/CURSOR/CONSELHO DE FUNIL/app/src/app/api/chat/route.ts",nextConfigOutput:"",userland:b}),{workAsyncStorage:P,workUnitAsyncStorage:N,serverHooks:$}=I;function D(){return(0,r.patchFetch)({workAsyncStorage:P,workUnitAsyncStorage:N})}async function k(e,t,r){I.isDev&&(0,a.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let C="/api/chat/route";C=C.replace(/\/index$/,"")||"/";let E=await I.prepare(e,t,{srcPage:C,multiZoneDraftMode:!1});if(!E)return t.statusCode=400,t.end("Bad Request"),null==r.waitUntil||r.waitUntil.call(r,Promise.resolve()),null;let{buildId:x,params:S,nextConfig:v,parsedUrl:y,isDraftMode:O,prerenderManifest:A,routerServerContext:_,isOnDemandRevalidate:T,revalidateOnlyGenerated:w,resolvedPathname:b,clientReferenceManifest:P,serverActionsManifest:N}=E,$=(0,i.normalizeAppPath)(C),D=!!(A.dynamicRoutes[$]||A.routes[b]),k=async()=>((null==_?void 0:_.render404)?await _.render404(e,t,y,!1):t.end("This page could not be found"),null);if(D&&!O){let e=!!A.routes[b],t=A.dynamicRoutes[$];if(t&&!1===t.fallback&&!e){if(v.experimental.adapterPath)return await k();throw new f.NoFallbackError}}let U=null;!D||I.isDev||O||(U="/index"===(U=b)?"/":U);let M=!0===I.isDev||!D,j=D&&!M;N&&P&&(0,s.setManifestsSingleton)({page:C,clientReferenceManifest:P,serverActionsManifest:N});let H=e.method||"GET",F=(0,o.getTracer)(),L=F.getActiveScopeSpan(),G={params:S,prerenderManifest:A,renderOpts:{experimental:{authInterrupts:!!v.experimental.authInterrupts},cacheComponents:!!v.cacheComponents,supportsDynamicResponse:M,incrementalCache:(0,a.getRequestMeta)(e,"incrementalCache"),cacheLifeProfiles:v.cacheLife,waitUntil:r.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,n,r,a)=>I.onRequestError(e,t,r,a,_)},sharedContext:{buildId:x}},q=new l.NodeNextRequest(e),B=new l.NodeNextResponse(t),K=c.NextRequestAdapter.fromNodeNextRequest(q,(0,c.signalFromNodeResponse)(t));try{let s=async e=>I.handle(K,G).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let n=F.getRootSpanAttributes();if(!n)return;if(n.get("next.span_type")!==d.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${n.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let r=n.get("next.route");if(r){let t=`${H} ${r}`;e.setAttributes({"next.route":r,"http.route":r,"next.span_name":t}),e.updateName(t)}else e.updateName(`${H} ${C}`)}),i=!!(0,a.getRequestMeta)(e,"minimalMode"),l=async a=>{var o,l;let c=async({previousCacheEntry:n})=>{try{if(!i&&T&&w&&!n)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let o=await s(a);e.fetchMetrics=G.renderOpts.fetchMetrics;let l=G.renderOpts.pendingWaitUntil;l&&r.waitUntil&&(r.waitUntil(l),l=void 0);let c=G.renderOpts.collectedTags;if(!D)return await (0,p.sendResponse)(q,B,o,G.renderOpts.pendingWaitUntil),null;{let e=await o.blob(),t=(0,h.toNodeOutgoingHttpHeaders)(o.headers);c&&(t[m.NEXT_CACHE_TAGS_HEADER]=c),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let n=void 0!==G.renderOpts.collectedRevalidate&&!(G.renderOpts.collectedRevalidate>=m.INFINITE_CACHE)&&G.renderOpts.collectedRevalidate,r=void 0===G.renderOpts.collectedExpire||G.renderOpts.collectedExpire>=m.INFINITE_CACHE?void 0:G.renderOpts.collectedExpire;return{value:{kind:R.CachedRouteKind.APP_ROUTE,status:o.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:n,expire:r}}}}catch(t){throw(null==n?void 0:n.isStale)&&await I.onRequestError(e,t,{routerKind:"App Router",routePath:C,routeType:"route",revalidateReason:(0,u.getRevalidateReason)({isStaticGeneration:j,isOnDemandRevalidate:T})},!1,_),t}},d=await I.handleResponse({req:e,nextConfig:v,cacheKey:U,routeKind:n.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:A,isRoutePPREnabled:!1,isOnDemandRevalidate:T,revalidateOnlyGenerated:w,responseGenerator:c,waitUntil:r.waitUntil,isMinimalMode:i});if(!D)return null;if((null==d||null==(o=d.value)?void 0:o.kind)!==R.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==d||null==(l=d.value)?void 0:l.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});i||t.setHeader("x-nextjs-cache",T?"REVALIDATED":d.isMiss?"MISS":d.isStale?"STALE":"HIT"),O&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let f=(0,h.fromNodeOutgoingHttpHeaders)(d.value.headers);return i&&D||f.delete(m.NEXT_CACHE_TAGS_HEADER),!d.cacheControl||t.getHeader("Cache-Control")||f.get("Cache-Control")||f.set("Cache-Control",(0,g.getCacheControlHeader)(d.cacheControl)),await (0,p.sendResponse)(q,B,new Response(d.value.body,{headers:f,status:d.value.status||200})),null};L?await l(L):await F.withPropagatedContext(e.headers,()=>F.trace(d.BaseServerSpan.handleRequest,{spanName:`${H} ${C}`,kind:o.SpanKind.SERVER,attributes:{"http.method":H,"http.target":e.url}},l))}catch(t){if(t instanceof f.NoFallbackError||await I.onRequestError(e,t,{routerKind:"App Router",routePath:$,routeType:"route",revalidateReason:(0,u.getRevalidateReason)({isStaticGeneration:j,isOnDemandRevalidate:T})},!1,_),D)throw t;return await (0,p.sendResponse)(q,B,new Response(null,{status:500})),null}}e.s(["handler",()=>k,"patchFetch",()=>D,"routeModule",()=>I,"serverHooks",()=>$,"workAsyncStorage",()=>P,"workUnitAsyncStorage",()=>N],285173)}];

//# sourceMappingURL=5c86f_next_dist_esm_build_templates_app-route_ad4ee442.js.map
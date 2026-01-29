module.exports=[918622,(e,t,r)=>{t.exports=e.x("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js",()=>require("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js"))},556704,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-async-storage.external.js",()=>require("next/dist/server/app-render/work-async-storage.external.js"))},832319,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-unit-async-storage.external.js",()=>require("next/dist/server/app-render/work-unit-async-storage.external.js"))},324725,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/after-task-async-storage.external.js",()=>require("next/dist/server/app-render/after-task-async-storage.external.js"))},193695,(e,t,r)=>{t.exports=e.x("next/dist/shared/lib/no-fallback-error.external.js",()=>require("next/dist/shared/lib/no-fallback-error.external.js"))},673438,e=>{"use strict";function t(e){return`## CONTEXTO DA MARCA (PRIORIDADE M\xc1XIMA)
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
`)})),n}function o(e){let t=e.trim(),r=t.match(/```(?:json)?\s*([\s\S]*?)\s*```/);if(r&&r[1])t=r[1].trim();else{let e=t.indexOf("{"),r=t.lastIndexOf("}");-1!==e&&-1!==r&&r>e&&(t=t.substring(e,r+1))}try{return JSON.parse(t)}catch(r){throw console.error("Failed to parse JSON. Original text:",e),console.error("Cleaned text:",t),r}}e.s(["formatBrandContextForChat",()=>r,"formatBrandContextForFunnel",()=>t,"formatFunnelContextForChat",()=>a,"parseAIJSON",()=>o])},39115,e=>{"use strict";var t=e.i(906661),r=e.i(276806),a=e.i(981990),o=e.i(707163),n=e.i(893013),i=e.i(416393),s=e.i(418829),l=e.i(907831),c=e.i(787414),d=e.i(251948),p=e.i(254140),u=e.i(847739),x=e.i(877290),f=e.i(195428),m=e.i(114365),h=e.i(193695);e.i(495983);var g=e.i(56931),v=e.i(758910),R=e.i(346414),$=e.i(673438);let y=new R.GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY||"");async function E(e){try{let{funnelId:t,userId:r,context:a}=await e.json();if(!t||!a?.copy)return v.NextResponse.json({error:"Contexto de copy é obrigatório."},{status:400});let o=process.env.GEMINI_MODEL||"gemini-2.0-flash-exp",n=y.getGenerativeModel({model:o,generationConfig:{responseMimeType:"application/json"}}),i=`
      Voc\xea \xe9 o Conselho de Design Estrat\xe9gico do "Conselho de Funil".
      Sua miss\xe3o \xe9 criar prompts visuais baseados no framework C.H.A.P.E.U.

      [CONTEXTO ESTRAT\xc9GICO]
      Objetivo: ${a.objective}
      Copy: ${a.copy}
      Hooks: ${JSON.stringify(a.hooks)}

      [INSTRU\xc7\xd5ES C.H.A.P.E.U]
      1. Planeje 3 criativos visuais diferentes.
      2. Foque em Contraste Alto e Hierarquia Visual.
      3. Use Antropomorfismo (presen\xe7a humana ou rostos expressivos).
      4. Indique as Safe Zones (Meta Stories, Feed, LinkedIn).
      
      Retorne APENAS um JSON no formato:
      {
        "prompts": [
          { 
            "platform": "meta", 
            "format": "square", 
            "safeZone": "feed", 
            "visualPrompt": "Prompt detalhado em ingl\xeas...", 
            "aspectRatio": "1:1",
            "strategy": {
              "contrastFocus": "Descri\xe7\xe3o do contraste...",
              "balanceType": "asymmetrical",
              "hierarchyOrder": ["Headline", "Product", "CTA"]
            },
            "assets": {
              "headline": "Texto curto para imagem",
              "primaryText": "Texto principal do Ad"
            }
          }
        ]
      }
    `,s=(await n.generateContent(i)).response.text(),l=(0,$.parseAIJSON)(s);return v.NextResponse.json({success:!0,prompts:l.prompts||[]})}catch(e){return console.error("Design plan error:",e),v.NextResponse.json({error:"Falha ao planejar design."},{status:500})}}e.s(["POST",()=>E,"dynamic",0,"force-dynamic","runtime",0,"nodejs"],895415);var A=e.i(895415);let C=new t.AppRouteRouteModule({definition:{kind:r.RouteKind.APP_ROUTE,page:"/api/design/plan/route",pathname:"/api/design/plan",filename:"route",bundlePath:""},distDir:".next",relativeProjectDir:"",resolvedPagePath:"[project]/OneDrive/Desktop/CURSOR/CONSELHO DE FUNIL/app/src/app/api/design/plan/route.ts",nextConfigOutput:"",userland:A}),{workAsyncStorage:O,workUnitAsyncStorage:T,serverHooks:w}=C;function P(){return(0,a.patchFetch)({workAsyncStorage:O,workUnitAsyncStorage:T})}async function N(e,t,a){C.isDev&&(0,o.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let v="/api/design/plan/route";v=v.replace(/\/index$/,"")||"/";let R=await C.prepare(e,t,{srcPage:v,multiZoneDraftMode:!1});if(!R)return t.statusCode=400,t.end("Bad Request"),null==a.waitUntil||a.waitUntil.call(a,Promise.resolve()),null;let{buildId:$,params:y,nextConfig:E,parsedUrl:A,isDraftMode:O,prerenderManifest:T,routerServerContext:w,isOnDemandRevalidate:P,revalidateOnlyGenerated:N,resolvedPathname:S,clientReferenceManifest:b,serverActionsManifest:k}=R,j=(0,s.normalizeAppPath)(v),I=!!(T.dynamicRoutes[j]||T.routes[S]),D=async()=>((null==w?void 0:w.render404)?await w.render404(e,t,A,!1):t.end("This page could not be found"),null);if(I&&!O){let e=!!T.routes[S],t=T.dynamicRoutes[j];if(t&&!1===t.fallback&&!e){if(E.experimental.adapterPath)return await D();throw new h.NoFallbackError}}let M=null;!I||C.isDev||O||(M="/index"===(M=S)?"/":M);let L=!0===C.isDev||!I,U=I&&!L;k&&b&&(0,i.setManifestsSingleton)({page:v,clientReferenceManifest:b,serverActionsManifest:k});let F=e.method||"GET",H=(0,n.getTracer)(),_=H.getActiveScopeSpan(),q={params:y,prerenderManifest:T,renderOpts:{experimental:{authInterrupts:!!E.experimental.authInterrupts},cacheComponents:!!E.cacheComponents,supportsDynamicResponse:L,incrementalCache:(0,o.getRequestMeta)(e,"incrementalCache"),cacheLifeProfiles:E.cacheLife,waitUntil:a.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,r,a,o)=>C.onRequestError(e,t,a,o,w)},sharedContext:{buildId:$}},V=new l.NodeNextRequest(e),K=new l.NodeNextResponse(t),B=c.NextRequestAdapter.fromNodeNextRequest(V,(0,c.signalFromNodeResponse)(t));try{let i=async e=>C.handle(B,q).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let r=H.getRootSpanAttributes();if(!r)return;if(r.get("next.span_type")!==d.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${r.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let a=r.get("next.route");if(a){let t=`${F} ${a}`;e.setAttributes({"next.route":a,"http.route":a,"next.span_name":t}),e.updateName(t)}else e.updateName(`${F} ${v}`)}),s=!!(0,o.getRequestMeta)(e,"minimalMode"),l=async o=>{var n,l;let c=async({previousCacheEntry:r})=>{try{if(!s&&P&&N&&!r)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let n=await i(o);e.fetchMetrics=q.renderOpts.fetchMetrics;let l=q.renderOpts.pendingWaitUntil;l&&a.waitUntil&&(a.waitUntil(l),l=void 0);let c=q.renderOpts.collectedTags;if(!I)return await (0,u.sendResponse)(V,K,n,q.renderOpts.pendingWaitUntil),null;{let e=await n.blob(),t=(0,x.toNodeOutgoingHttpHeaders)(n.headers);c&&(t[m.NEXT_CACHE_TAGS_HEADER]=c),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let r=void 0!==q.renderOpts.collectedRevalidate&&!(q.renderOpts.collectedRevalidate>=m.INFINITE_CACHE)&&q.renderOpts.collectedRevalidate,a=void 0===q.renderOpts.collectedExpire||q.renderOpts.collectedExpire>=m.INFINITE_CACHE?void 0:q.renderOpts.collectedExpire;return{value:{kind:g.CachedRouteKind.APP_ROUTE,status:n.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:r,expire:a}}}}catch(t){throw(null==r?void 0:r.isStale)&&await C.onRequestError(e,t,{routerKind:"App Router",routePath:v,routeType:"route",revalidateReason:(0,p.getRevalidateReason)({isStaticGeneration:U,isOnDemandRevalidate:P})},!1,w),t}},d=await C.handleResponse({req:e,nextConfig:E,cacheKey:M,routeKind:r.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:T,isRoutePPREnabled:!1,isOnDemandRevalidate:P,revalidateOnlyGenerated:N,responseGenerator:c,waitUntil:a.waitUntil,isMinimalMode:s});if(!I)return null;if((null==d||null==(n=d.value)?void 0:n.kind)!==g.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==d||null==(l=d.value)?void 0:l.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});s||t.setHeader("x-nextjs-cache",P?"REVALIDATED":d.isMiss?"MISS":d.isStale?"STALE":"HIT"),O&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let h=(0,x.fromNodeOutgoingHttpHeaders)(d.value.headers);return s&&I||h.delete(m.NEXT_CACHE_TAGS_HEADER),!d.cacheControl||t.getHeader("Cache-Control")||h.get("Cache-Control")||h.set("Cache-Control",(0,f.getCacheControlHeader)(d.cacheControl)),await (0,u.sendResponse)(V,K,new Response(d.value.body,{headers:h,status:d.value.status||200})),null};_?await l(_):await H.withPropagatedContext(e.headers,()=>H.trace(d.BaseServerSpan.handleRequest,{spanName:`${F} ${v}`,kind:n.SpanKind.SERVER,attributes:{"http.method":F,"http.target":e.url}},l))}catch(t){if(t instanceof h.NoFallbackError||await C.onRequestError(e,t,{routerKind:"App Router",routePath:j,routeType:"route",revalidateReason:(0,p.getRevalidateReason)({isStaticGeneration:U,isOnDemandRevalidate:P})},!1,w),I)throw t;return await (0,u.sendResponse)(V,K,new Response(null,{status:500})),null}}e.s(["handler",()=>N,"patchFetch",()=>P,"routeModule",()=>C,"serverHooks",()=>w,"workAsyncStorage",()=>O,"workUnitAsyncStorage",()=>T],39115)}];

//# sourceMappingURL=%5Broot-of-the-server%5D__fcb68932._.js.map
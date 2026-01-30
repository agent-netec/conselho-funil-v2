module.exports=[193695,(e,t,r)=>{t.exports=e.x("next/dist/shared/lib/no-fallback-error.external.js",()=>require("next/dist/shared/lib/no-fallback-error.external.js"))},918622,(e,t,r)=>{t.exports=e.x("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js",()=>require("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js"))},556704,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-async-storage.external.js",()=>require("next/dist/server/app-render/work-async-storage.external.js"))},832319,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-unit-async-storage.external.js",()=>require("next/dist/server/app-render/work-unit-async-storage.external.js"))},324725,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/after-task-async-storage.external.js",()=>require("next/dist/server/app-render/after-task-async-storage.external.js"))},814747,(e,t,r)=>{t.exports=e.x("path",()=>require("path"))},224361,(e,t,r)=>{t.exports=e.x("util",()=>require("util"))},605365,(e,t,r)=>{t.exports=e.x("process",()=>require("process"))},446786,(e,t,r)=>{t.exports=e.x("os",()=>require("os"))},254799,(e,t,r)=>{t.exports=e.x("crypto",()=>require("crypto"))},921517,(e,t,r)=>{t.exports=e.x("http",()=>require("http"))},688947,(e,t,r)=>{t.exports=e.x("stream",()=>require("stream"))},522734,(e,t,r)=>{t.exports=e.x("fs",()=>require("fs"))},792509,(e,t,r)=>{t.exports=e.x("url",()=>require("url"))},628581,e=>{"use strict";var t=e.i(906661),r=e.i(276806),a=e.i(981990),n=e.i(707163),o=e.i(893013),s=e.i(416393),i=e.i(418829),l=e.i(907831),d=e.i(787414),u=e.i(251948),p=e.i(254140),c=e.i(847739),x=e.i(877290),h=e.i(195428),f=e.i(114365),m=e.i(193695);e.i(495983);var g=e.i(56931),R=e.i(758910);e.i(564153);var v=e.i(918042),y=e.i(474065);async function $(e){try{var t,r;let a,n,o,s,{searchParams:i}=new URL(e.url),l=i.get("funnelId"),d=i.get("proposalId"),u=i.get("format")||"markdown";if(!l)return R.NextResponse.json({error:"funnelId is required"},{status:400});let p=await (0,v.getDoc)((0,v.doc)(y.db,"funnels",l));if(!p.exists())return R.NextResponse.json({error:"Funnel not found"},{status:404});let c={id:p.id,...p.data()},x=[];if(d){let e=await (0,v.getDoc)((0,v.doc)(y.db,"funnels",l,"proposals",d));e.exists()&&(x=[{id:e.id,...e.data()}])}else{let e=(0,v.query)((0,v.collection)(y.db,"funnels",l,"proposals"),(0,v.orderBy)("version","desc"));x=(await (0,v.getDocs)(e)).docs.map(e=>({id:e.id,...e.data()}))}let h=(t=c,r=x,a=t.context,n=a.channel?.main||a.channels?.primary||"N/A",o=new Date().toLocaleDateString("pt-BR"),s=`# ${t.name}

> Exportado em ${o} | Status: **${t.status}**

---

## 📋 Contexto do Neg\xf3cio

| Campo | Valor |
|-------|-------|
| **Empresa** | ${a.company} |
| **Mercado** | ${a.market} |
| **Maturidade** | ${a.maturity} |
| **Objetivo** | ${a.objective} |

---

## 👥 P\xfablico-Alvo

**Quem \xe9:**
${a.audience?.who||"Não definido"}

**Dor Principal:**
${a.audience?.pain||"Não definido"}

**N\xedvel de Consci\xeancia:** ${a.audience?.awareness||"N/A"}

${a.audience?.objection?`**Obje\xe7\xe3o Dominante:** ${a.audience.objection}`:""}

---

## 💰 Oferta

| Campo | Valor |
|-------|-------|
| **Produto/Servi\xe7o** | ${a.offer?.what||"N/A"} |
| **Ticket** | ${a.offer?.ticket||"N/A"} |
| **Tipo** | ${a.offer?.type||"N/A"} |

---

## 📡 Canais

- **Principal:** ${n}
${a.channel?.secondary||a.channels?.secondary?`- **Secund\xe1rio:** ${a.channel?.secondary||a.channels?.secondary}`:""}

---

`,r.length>0&&(s+=`## 🎯 Propostas de Funil

`,r.forEach((e,t)=>{var r,a;let n,o,i;s+=(r=e,a=t+1,n=r.scorecard,o=n?.overall||"N/A",i=`### Proposta ${a}: ${r.name}

**Score Geral:** ${"number"==typeof o?o.toFixed(1):o}/10

${r.summary}

`,r.strategy?.rationale&&(i+=`#### 💡 Racional Estrat\xe9gico

${r.strategy.rationale}

`),r.architecture?.stages?.length&&(i+=`#### 🏗️ Arquitetura do Funil

| # | Etapa | Tipo | Objetivo |
|---|-------|------|----------|
`,r.architecture.stages.forEach(e=>{i+=`| ${e.order} | ${e.name} | ${e.type} | ${e.objective||"-"} |
`}),i+="\n"),n&&"object"==typeof n&&(i+=`#### 📊 Scorecard

| Dimens\xe3o | Nota |
|----------|------|
| Clareza | ${n.clarity||"-"} |
| For\xe7a da Oferta | ${n.offerStrength||"-"} |
| Qualifica\xe7\xe3o | ${n.qualification||"-"} |
| Fric\xe7\xe3o | ${n.friction||"-"} |
| Potencial LTV | ${n.ltvPotential||"-"} |
| ROI Esperado | ${n.expectedRoi||"-"} |

`),r.strategy?.counselorInsights?.length&&(i+=`#### 🧠 Insights dos Conselheiros

`,r.strategy.counselorInsights.forEach(e=>{let t=e.counselor.replace("_"," ").replace(/\b\w/g,e=>e.toUpperCase());i+=`**${t}:** ${e.insight}

`})),r.strategy?.risks?.length&&(i+=`#### ⚠️ Riscos

${r.strategy.risks.map(e=>`- ${e}`).join("\n")}

`),r.strategy?.recommendations?.length&&(i+=`#### ✅ Recomenda\xe7\xf5es

${r.strategy.recommendations.map(e=>`- ${e}`).join("\n")}

`),r.assets&&(i+=`#### 📝 Assets Gerados

`,r.assets.headlines?.length&&(i+=`**Headlines:**
${r.assets.headlines.map(e=>`- ${e}`).join("\n")}

`),r.assets.hooks?.length&&(i+=`**Hooks:**
${r.assets.hooks.map(e=>`- ${e}`).join("\n")}

`),r.assets.ctas?.length&&(i+=`**CTAs:**
${r.assets.ctas.map(e=>`- ${e}`).join("\n")}

`)),i+=`---

`)})),s+=`
---

*Documento gerado pelo Conselho de Funil*
*https://conselho-de-funil.web.app*
`);if("markdown"===u)return new R.NextResponse(h,{headers:{"Content-Type":"text/markdown; charset=utf-8","Content-Disposition":`attachment; filename="${c.name.replace(/[^a-zA-Z0-9-_]/g,"_").substring(0,50)}.md"`}});return R.NextResponse.json({funnel:{id:c.id,name:c.name,status:c.status},markdown:h,proposals:x.map(e=>({id:e.id,name:e.name,version:e.version}))})}catch(e){return console.error("Export error:",e),R.NextResponse.json({error:"Failed to export",details:String(e)},{status:500})}}e.s(["GET",()=>$,"dynamic",0,"force-dynamic","runtime",0,"nodejs"],362947);var w=e.i(362947);let E=new t.AppRouteRouteModule({definition:{kind:r.RouteKind.APP_ROUTE,page:"/api/funnels/export/route",pathname:"/api/funnels/export",filename:"route",bundlePath:""},distDir:".next",relativeProjectDir:"",resolvedPagePath:"[project]/OneDrive/Desktop/CURSOR/CONSELHO DE FUNIL/app/src/app/api/funnels/export/route.ts",nextConfigOutput:"",userland:w}),{workAsyncStorage:C,workUnitAsyncStorage:b,serverHooks:N}=E;function A(){return(0,a.patchFetch)({workAsyncStorage:C,workUnitAsyncStorage:b})}async function j(e,t,a){E.isDev&&(0,n.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let R="/api/funnels/export/route";R=R.replace(/\/index$/,"")||"/";let v=await E.prepare(e,t,{srcPage:R,multiZoneDraftMode:!1});if(!v)return t.statusCode=400,t.end("Bad Request"),null==a.waitUntil||a.waitUntil.call(a,Promise.resolve()),null;let{buildId:y,params:$,nextConfig:w,parsedUrl:C,isDraftMode:b,prerenderManifest:N,routerServerContext:A,isOnDemandRevalidate:j,revalidateOnlyGenerated:k,resolvedPathname:q,clientReferenceManifest:O,serverActionsManifest:P}=v,T=(0,i.normalizeAppPath)(R),S=!!(N.dynamicRoutes[T]||N.routes[q]),D=async()=>((null==A?void 0:A.render404)?await A.render404(e,t,C,!1):t.end("This page could not be found"),null);if(S&&!b){let e=!!N.routes[q],t=N.dynamicRoutes[T];if(t&&!1===t.fallback&&!e){if(w.experimental.adapterPath)return await D();throw new m.NoFallbackError}}let I=null;!S||E.isDev||b||(I="/index"===(I=q)?"/":I);let _=!0===E.isDev||!S,H=S&&!_;P&&O&&(0,s.setManifestsSingleton)({page:R,clientReferenceManifest:O,serverActionsManifest:P});let U=e.method||"GET",F=(0,o.getTracer)(),M=F.getActiveScopeSpan(),L={params:$,prerenderManifest:N,renderOpts:{experimental:{authInterrupts:!!w.experimental.authInterrupts},cacheComponents:!!w.cacheComponents,supportsDynamicResponse:_,incrementalCache:(0,n.getRequestMeta)(e,"incrementalCache"),cacheLifeProfiles:w.cacheLife,waitUntil:a.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,r,a,n)=>E.onRequestError(e,t,a,n,A)},sharedContext:{buildId:y}},K=new l.NodeNextRequest(e),B=new l.NodeNextResponse(t),G=d.NextRequestAdapter.fromNodeNextRequest(K,(0,d.signalFromNodeResponse)(t));try{let s=async e=>E.handle(G,L).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let r=F.getRootSpanAttributes();if(!r)return;if(r.get("next.span_type")!==u.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${r.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let a=r.get("next.route");if(a){let t=`${U} ${a}`;e.setAttributes({"next.route":a,"http.route":a,"next.span_name":t}),e.updateName(t)}else e.updateName(`${U} ${R}`)}),i=!!(0,n.getRequestMeta)(e,"minimalMode"),l=async n=>{var o,l;let d=async({previousCacheEntry:r})=>{try{if(!i&&j&&k&&!r)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let o=await s(n);e.fetchMetrics=L.renderOpts.fetchMetrics;let l=L.renderOpts.pendingWaitUntil;l&&a.waitUntil&&(a.waitUntil(l),l=void 0);let d=L.renderOpts.collectedTags;if(!S)return await (0,c.sendResponse)(K,B,o,L.renderOpts.pendingWaitUntil),null;{let e=await o.blob(),t=(0,x.toNodeOutgoingHttpHeaders)(o.headers);d&&(t[f.NEXT_CACHE_TAGS_HEADER]=d),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let r=void 0!==L.renderOpts.collectedRevalidate&&!(L.renderOpts.collectedRevalidate>=f.INFINITE_CACHE)&&L.renderOpts.collectedRevalidate,a=void 0===L.renderOpts.collectedExpire||L.renderOpts.collectedExpire>=f.INFINITE_CACHE?void 0:L.renderOpts.collectedExpire;return{value:{kind:g.CachedRouteKind.APP_ROUTE,status:o.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:r,expire:a}}}}catch(t){throw(null==r?void 0:r.isStale)&&await E.onRequestError(e,t,{routerKind:"App Router",routePath:R,routeType:"route",revalidateReason:(0,p.getRevalidateReason)({isStaticGeneration:H,isOnDemandRevalidate:j})},!1,A),t}},u=await E.handleResponse({req:e,nextConfig:w,cacheKey:I,routeKind:r.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:N,isRoutePPREnabled:!1,isOnDemandRevalidate:j,revalidateOnlyGenerated:k,responseGenerator:d,waitUntil:a.waitUntil,isMinimalMode:i});if(!S)return null;if((null==u||null==(o=u.value)?void 0:o.kind)!==g.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==u||null==(l=u.value)?void 0:l.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});i||t.setHeader("x-nextjs-cache",j?"REVALIDATED":u.isMiss?"MISS":u.isStale?"STALE":"HIT"),b&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let m=(0,x.fromNodeOutgoingHttpHeaders)(u.value.headers);return i&&S||m.delete(f.NEXT_CACHE_TAGS_HEADER),!u.cacheControl||t.getHeader("Cache-Control")||m.get("Cache-Control")||m.set("Cache-Control",(0,h.getCacheControlHeader)(u.cacheControl)),await (0,c.sendResponse)(K,B,new Response(u.value.body,{headers:m,status:u.value.status||200})),null};M?await l(M):await F.withPropagatedContext(e.headers,()=>F.trace(u.BaseServerSpan.handleRequest,{spanName:`${U} ${R}`,kind:o.SpanKind.SERVER,attributes:{"http.method":U,"http.target":e.url}},l))}catch(t){if(t instanceof m.NoFallbackError||await E.onRequestError(e,t,{routerKind:"App Router",routePath:T,routeType:"route",revalidateReason:(0,p.getRevalidateReason)({isStaticGeneration:H,isOnDemandRevalidate:j})},!1,A),S)throw t;return await (0,c.sendResponse)(K,B,new Response(null,{status:500})),null}}e.s(["handler",()=>j,"patchFetch",()=>A,"routeModule",()=>E,"serverHooks",()=>N,"workAsyncStorage",()=>C,"workUnitAsyncStorage",()=>b],628581)}];

//# sourceMappingURL=%5Broot-of-the-server%5D__26037dcd._.js.map
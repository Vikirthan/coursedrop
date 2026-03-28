(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,94324,e=>{"use strict";function t(){return window.location.hostname.endsWith("github.io")}e.s(["isGithubPagesRuntime",()=>t])},53480,e=>{"use strict";var t=e.i(84648),r=e.i(72192),a=e.i(94324);let i=(0,r.createContext)({user:null,login:async()=>"Not ready",logout:async()=>{},loading:!0,isInitialized:!1});function s({children:e}){let[s,o]=(0,r.useState)(null),[n,l]=(0,r.useState)(!0),[d,c]=(0,r.useState)(!1);(0,r.useEffect)(()=>{(async()=>{try{let e=await fetch("/api/auth/session",{method:"GET",cache:"no-store"});if(!e.ok)return void o(null);let t=await e.json();o(t.user??null)}catch{o(null)}finally{c(!0),l(!1)}})()},[]);let u=async(e,t,r)=>{if("admin"===r){if((0,a.isGithubPagesRuntime)())return"Admin login needs backend APIs and is disabled on GitHub Pages. Deploy to Vercel for full login support.";try{let r=await fetch("/api/auth/admin/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({identifier:e,password:t})}),a=await r.json();if(!r.ok)return a.error??"Login failed";if(!a.user)return"Login failed";return o(a.user),null}catch{return"Network error. Try again."}}if((0,a.isGithubPagesRuntime)())return"Teacher/CR login needs backend APIs and is disabled on GitHub Pages. Deploy to Vercel for full login support.";try{let r=await fetch("/api/auth/teacher/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({identifier:e,password:t})}),a=await r.json();if(!r.ok){let e=a.error??"Login failed";if(e.includes("Missing Supabase configuration"))return"Server is missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your hosting dashboard, then redeploy.";return e}if(!a.user)return"Login failed";return o(a.user),null}catch{return"Network error. Try again."}},m=async()=>{try{await fetch("/api/auth/logout",{method:"POST"})}catch{}o(null)};return(0,t.jsx)(i.Provider,{value:{user:s,login:u,logout:m,loading:n,isInitialized:d},children:e})}function o(){return(0,r.useContext)(i)}e.s(["AuthProvider",()=>s,"useAuth",()=>o])},88830,e=>{"use strict";let t,r;var a,i=e.i(72192);let s={data:""},o=/(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g,n=/\/\*[^]*?\*\/|  +/g,l=/\n+/g,d=(e,t)=>{let r="",a="",i="";for(let s in e){let o=e[s];"@"==s[0]?"i"==s[1]?r=s+" "+o+";":a+="f"==s[1]?d(o,s):s+"{"+d(o,"k"==s[1]?"":t)+"}":"object"==typeof o?a+=d(o,t?t.replace(/([^,])+/g,e=>s.replace(/([^,]*:\S+\([^)]*\))|([^,])+/g,t=>/&/.test(t)?t.replace(/&/g,e):e?e+" "+t:t)):s):null!=o&&(s=/^--/.test(s)?s:s.replace(/[A-Z]/g,"-$&").toLowerCase(),i+=d.p?d.p(s,o):s+":"+o+";")}return r+(t&&i?t+"{"+i+"}":i)+a},c={},u=e=>{if("object"==typeof e){let t="";for(let r in e)t+=r+u(e[r]);return t}return e};function m(e){let t,r,a=this||{},i=e.call?e(a.p):e;return((e,t,r,a,i)=>{var s;let m=u(e),p=c[m]||(c[m]=(e=>{let t=0,r=11;for(;t<e.length;)r=101*r+e.charCodeAt(t++)>>>0;return"go"+r})(m));if(!c[p]){let t=m!==e?e:(e=>{let t,r,a=[{}];for(;t=o.exec(e.replace(n,""));)t[4]?a.shift():t[3]?(r=t[3].replace(l," ").trim(),a.unshift(a[0][r]=a[0][r]||{})):a[0][t[1]]=t[2].replace(l," ").trim();return a[0]})(e);c[p]=d(i?{["@keyframes "+p]:t}:t,r?"":"."+p)}let f=r&&c.g?c.g:null;return r&&(c.g=c[p]),s=c[p],f?t.data=t.data.replace(f,s):-1===t.data.indexOf(s)&&(t.data=a?s+t.data:t.data+s),p})(i.unshift?i.raw?(t=[].slice.call(arguments,1),r=a.p,i.reduce((e,a,i)=>{let s=t[i];if(s&&s.call){let e=s(r),t=e&&e.props&&e.props.className||/^go/.test(e)&&e;s=t?"."+t:e&&"object"==typeof e?e.props?"":d(e,""):!1===e?"":e}return e+a+(null==s?"":s)},"")):i.reduce((e,t)=>Object.assign(e,t&&t.call?t(a.p):t),{}):i,(e=>{if("object"==typeof window){let t=(e?e.querySelector("#_goober"):window._goober)||Object.assign(document.createElement("style"),{innerHTML:" ",id:"_goober"});return t.nonce=window.__nonce__,t.parentNode||(e||document.head).appendChild(t),t.firstChild}return e||s})(a.target),a.g,a.o,a.k)}m.bind({g:1});let p,f,h,y=m.bind({k:1});function g(e,t){let r=this||{};return function(){let a=arguments;function i(s,o){let n=Object.assign({},s),l=n.className||i.className;r.p=Object.assign({theme:f&&f()},n),r.o=/ *go\d+/.test(l),n.className=m.apply(r,a)+(l?" "+l:""),t&&(n.ref=o);let d=e;return e[0]&&(d=n.as||e,delete n.as),h&&d[0]&&h(n),p(d,n)}return t?t(i):i}}var b=(e,t)=>"function"==typeof e?e(t):e,v=(t=0,()=>(++t).toString()),w=()=>{if(void 0===r&&"u">typeof window){let e=matchMedia("(prefers-reduced-motion: reduce)");r=!e||e.matches}return r},x="default",E=(e,t)=>{let{toastLimit:r}=e.settings;switch(t.type){case 0:return{...e,toasts:[t.toast,...e.toasts].slice(0,r)};case 1:return{...e,toasts:e.toasts.map(e=>e.id===t.toast.id?{...e,...t.toast}:e)};case 2:let{toast:a}=t;return E(e,{type:+!!e.toasts.find(e=>e.id===a.id),toast:a});case 3:let{toastId:i}=t;return{...e,toasts:e.toasts.map(e=>e.id===i||void 0===i?{...e,dismissed:!0,visible:!1}:e)};case 4:return void 0===t.toastId?{...e,toasts:[]}:{...e,toasts:e.toasts.filter(e=>e.id!==t.toastId)};case 5:return{...e,pausedAt:t.time};case 6:let s=t.time-(e.pausedAt||0);return{...e,pausedAt:void 0,toasts:e.toasts.map(e=>({...e,pauseDuration:e.pauseDuration+s}))}}},k=[],S={toasts:[],pausedAt:void 0,settings:{toastLimit:20}},T={},C=(e,t=x)=>{T[t]=E(T[t]||S,e),k.forEach(([e,r])=>{e===t&&r(T[t])})},P=e=>Object.keys(T).forEach(t=>C(e,t)),A=(e=x)=>t=>{C(t,e)},j={blank:4e3,error:4e3,success:2e3,loading:1/0,custom:4e3},O=e=>(t,r)=>{let a,i=((e,t="blank",r)=>({createdAt:Date.now(),visible:!0,dismissed:!1,type:t,ariaProps:{role:"status","aria-live":"polite"},message:e,pauseDuration:0,...r,id:(null==r?void 0:r.id)||v()}))(t,e,r);return A(i.toasterId||(a=i.id,Object.keys(T).find(e=>T[e].toasts.some(e=>e.id===a))))({type:2,toast:i}),i.id},L=(e,t)=>O("blank")(e,t);L.error=O("error"),L.success=O("success"),L.loading=O("loading"),L.custom=O("custom"),L.dismiss=(e,t)=>{let r={type:3,toastId:e};t?A(t)(r):P(r)},L.dismissAll=e=>L.dismiss(void 0,e),L.remove=(e,t)=>{let r={type:4,toastId:e};t?A(t)(r):P(r)},L.removeAll=e=>L.remove(void 0,e),L.promise=(e,t,r)=>{let a=L.loading(t.loading,{...r,...null==r?void 0:r.loading});return"function"==typeof e&&(e=e()),e.then(e=>{let i=t.success?b(t.success,e):void 0;return i?L.success(i,{id:a,...r,...null==r?void 0:r.success}):L.dismiss(a),e}).catch(e=>{let i=t.error?b(t.error,e):void 0;i?L.error(i,{id:a,...r,...null==r?void 0:r.error}):L.dismiss(a)}),e};var N=1e3,$=y`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
 transform: scale(1) rotate(45deg);
  opacity: 1;
}`,I=y`
from {
  transform: scale(0);
  opacity: 0;
}
to {
  transform: scale(1);
  opacity: 1;
}`,D=y`
from {
  transform: scale(0) rotate(90deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(90deg);
	opacity: 1;
}`,_=g("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#ff4b4b"};
  position: relative;
  transform: rotate(45deg);

  animation: ${$} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;

  &:after,
  &:before {
    content: '';
    animation: ${I} 0.15s ease-out forwards;
    animation-delay: 150ms;
    position: absolute;
    border-radius: 3px;
    opacity: 0;
    background: ${e=>e.secondary||"#fff"};
    bottom: 9px;
    left: 4px;
    height: 2px;
    width: 12px;
  }

  &:before {
    animation: ${D} 0.15s ease-out forwards;
    animation-delay: 180ms;
    transform: rotate(90deg);
  }
`,z=y`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`,M=g("div")`
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  border: 2px solid;
  border-radius: 100%;
  border-color: ${e=>e.secondary||"#e0e0e0"};
  border-right-color: ${e=>e.primary||"#616161"};
  animation: ${z} 1s linear infinite;
`,R=y`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(45deg);
	opacity: 1;
}`,H=y`
0% {
	height: 0;
	width: 0;
	opacity: 0;
}
40% {
  height: 0;
	width: 6px;
	opacity: 1;
}
100% {
  opacity: 1;
  height: 10px;
}`,U=g("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#61d345"};
  position: relative;
  transform: rotate(45deg);

  animation: ${R} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;
  &:after {
    content: '';
    box-sizing: border-box;
    animation: ${H} 0.2s ease-out forwards;
    opacity: 0;
    animation-delay: 200ms;
    position: absolute;
    border-right: 2px solid;
    border-bottom: 2px solid;
    border-color: ${e=>e.secondary||"#fff"};
    bottom: 6px;
    left: 6px;
    height: 10px;
    width: 6px;
  }
`,B=g("div")`
  position: absolute;
`,F=g("div")`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 20px;
  min-height: 20px;
`,G=y`
from {
  transform: scale(0.6);
  opacity: 0.4;
}
to {
  transform: scale(1);
  opacity: 1;
}`,K=g("div")`
  position: relative;
  transform: scale(0.6);
  opacity: 0.4;
  min-width: 20px;
  animation: ${G} 0.3s 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
`,V=({toast:e})=>{let{icon:t,type:r,iconTheme:a}=e;return void 0!==t?"string"==typeof t?i.createElement(K,null,t):t:"blank"===r?null:i.createElement(F,null,i.createElement(M,{...a}),"loading"!==r&&i.createElement(B,null,"error"===r?i.createElement(_,{...a}):i.createElement(U,{...a})))},W=g("div")`
  display: flex;
  align-items: center;
  background: #fff;
  color: #363636;
  line-height: 1.3;
  will-change: transform;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1), 0 3px 3px rgba(0, 0, 0, 0.05);
  max-width: 350px;
  pointer-events: auto;
  padding: 8px 10px;
  border-radius: 8px;
`,J=g("div")`
  display: flex;
  justify-content: center;
  margin: 4px 10px;
  color: inherit;
  flex: 1 1 auto;
  white-space: pre-line;
`,Y=i.memo(({toast:e,position:t,style:r,children:a})=>{let s=e.height?((e,t)=>{let r=e.includes("top")?1:-1,[a,i]=w()?["0%{opacity:0;} 100%{opacity:1;}","0%{opacity:1;} 100%{opacity:0;}"]:[`
0% {transform: translate3d(0,${-200*r}%,0) scale(.6); opacity:.5;}
100% {transform: translate3d(0,0,0) scale(1); opacity:1;}
`,`
0% {transform: translate3d(0,0,-1px) scale(1); opacity:1;}
100% {transform: translate3d(0,${-150*r}%,-1px) scale(.6); opacity:0;}
`];return{animation:t?`${y(a)} 0.35s cubic-bezier(.21,1.02,.73,1) forwards`:`${y(i)} 0.4s forwards cubic-bezier(.06,.71,.55,1)`}})(e.position||t||"top-center",e.visible):{opacity:0},o=i.createElement(V,{toast:e}),n=i.createElement(J,{...e.ariaProps},b(e.message,e));return i.createElement(W,{className:e.className,style:{...s,...r,...e.style}},"function"==typeof a?a({icon:o,message:n}):i.createElement(i.Fragment,null,o,n))});a=i.createElement,d.p=void 0,p=a,f=void 0,h=void 0;var q=({id:e,className:t,style:r,onHeightUpdate:a,children:s})=>{let o=i.useCallback(t=>{if(t){let r=()=>{a(e,t.getBoundingClientRect().height)};r(),new MutationObserver(r).observe(t,{subtree:!0,childList:!0,characterData:!0})}},[e,a]);return i.createElement("div",{ref:o,className:t,style:r},s)},X=m`
  z-index: 9999;
  > * {
    pointer-events: auto;
  }
`,Z=({reverseOrder:e,position:t="top-center",toastOptions:r,gutter:a,children:s,toasterId:o,containerStyle:n,containerClassName:l})=>{let{toasts:d,handlers:c}=((e,t="default")=>{let{toasts:r,pausedAt:a}=((e={},t=x)=>{let[r,a]=(0,i.useState)(T[t]||S),s=(0,i.useRef)(T[t]);(0,i.useEffect)(()=>(s.current!==T[t]&&a(T[t]),k.push([t,a]),()=>{let e=k.findIndex(([e])=>e===t);e>-1&&k.splice(e,1)}),[t]);let o=r.toasts.map(t=>{var r,a,i;return{...e,...e[t.type],...t,removeDelay:t.removeDelay||(null==(r=e[t.type])?void 0:r.removeDelay)||(null==e?void 0:e.removeDelay),duration:t.duration||(null==(a=e[t.type])?void 0:a.duration)||(null==e?void 0:e.duration)||j[t.type],style:{...e.style,...null==(i=e[t.type])?void 0:i.style,...t.style}}});return{...r,toasts:o}})(e,t),s=(0,i.useRef)(new Map).current,o=(0,i.useCallback)((e,t=N)=>{if(s.has(e))return;let r=setTimeout(()=>{s.delete(e),n({type:4,toastId:e})},t);s.set(e,r)},[]);(0,i.useEffect)(()=>{if(a)return;let e=Date.now(),i=r.map(r=>{if(r.duration===1/0)return;let a=(r.duration||0)+r.pauseDuration-(e-r.createdAt);if(a<0){r.visible&&L.dismiss(r.id);return}return setTimeout(()=>L.dismiss(r.id,t),a)});return()=>{i.forEach(e=>e&&clearTimeout(e))}},[r,a,t]);let n=(0,i.useCallback)(A(t),[t]),l=(0,i.useCallback)(()=>{n({type:5,time:Date.now()})},[n]),d=(0,i.useCallback)((e,t)=>{n({type:1,toast:{id:e,height:t}})},[n]),c=(0,i.useCallback)(()=>{a&&n({type:6,time:Date.now()})},[a,n]),u=(0,i.useCallback)((e,t)=>{let{reverseOrder:a=!1,gutter:i=8,defaultPosition:s}=t||{},o=r.filter(t=>(t.position||s)===(e.position||s)&&t.height),n=o.findIndex(t=>t.id===e.id),l=o.filter((e,t)=>t<n&&e.visible).length;return o.filter(e=>e.visible).slice(...a?[l+1]:[0,l]).reduce((e,t)=>e+(t.height||0)+i,0)},[r]);return(0,i.useEffect)(()=>{r.forEach(e=>{if(e.dismissed)o(e.id,e.removeDelay);else{let t=s.get(e.id);t&&(clearTimeout(t),s.delete(e.id))}})},[r,o]),{toasts:r,handlers:{updateHeight:d,startPause:l,endPause:c,calculateOffset:u}}})(r,o);return i.createElement("div",{"data-rht-toaster":o||"",style:{position:"fixed",zIndex:9999,top:16,left:16,right:16,bottom:16,pointerEvents:"none",...n},className:l,onMouseEnter:c.startPause,onMouseLeave:c.endPause},d.map(r=>{let o,n,l=r.position||t,d=c.calculateOffset(r,{reverseOrder:e,gutter:a,defaultPosition:t}),u=(o=l.includes("top"),n=l.includes("center")?{justifyContent:"center"}:l.includes("right")?{justifyContent:"flex-end"}:{},{left:0,right:0,display:"flex",position:"absolute",transition:w()?void 0:"all 230ms cubic-bezier(.21,1.02,.73,1)",transform:`translateY(${d*(o?1:-1)}px)`,...o?{top:0}:{bottom:0},...n});return i.createElement(q,{id:r.id,key:r.id,onHeightUpdate:c.updateHeight,className:r.visible?X:"",style:u},"custom"===r.type?b(r.message,r):s?s(r):i.createElement(Y,{toast:r,position:l}))}))};e.s(["Toaster",()=>Z,"default",()=>L],88830)},477,e=>{"use strict";var t=e.i(72192),r=(e,t,r,a,i,s,o,n)=>{let l=document.documentElement,d=["light","dark"];function c(t){var r;(Array.isArray(e)?e:[e]).forEach(e=>{let r="class"===e,a=r&&s?i.map(e=>s[e]||e):i;r?(l.classList.remove(...a),l.classList.add(s&&s[t]?s[t]:t)):l.setAttribute(e,t)}),r=t,n&&d.includes(r)&&(l.style.colorScheme=r)}if(a)c(a);else try{let e=localStorage.getItem(t)||r,a=o&&"system"===e?window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light":e;c(a)}catch(e){}},a=["light","dark"],i="(prefers-color-scheme: dark)",s="u"<typeof window,o=t.createContext(void 0),n={setTheme:e=>{},themes:[]},l=()=>{var e;return null!=(e=t.useContext(o))?e:n},d=e=>t.useContext(o)?t.createElement(t.Fragment,null,e.children):t.createElement(u,{...e}),c=["light","dark"],u=({forcedTheme:e,disableTransitionOnChange:r=!1,enableSystem:s=!0,enableColorScheme:n=!0,storageKey:l="theme",themes:d=c,defaultTheme:u=s?"system":"light",attribute:y="data-theme",value:g,children:b,nonce:v,scriptProps:w})=>{let[x,E]=t.useState(()=>p(l,u)),[k,S]=t.useState(()=>"system"===x?h():x),T=g?Object.values(g):d,C=t.useCallback(e=>{let t=e;if(!t)return;"system"===e&&s&&(t=h());let i=g?g[t]:t,o=r?f(v):null,l=document.documentElement,d=e=>{"class"===e?(l.classList.remove(...T),i&&l.classList.add(i)):e.startsWith("data-")&&(i?l.setAttribute(e,i):l.removeAttribute(e))};if(Array.isArray(y)?y.forEach(d):d(y),n){let e=a.includes(u)?u:null,r=a.includes(t)?t:e;l.style.colorScheme=r}null==o||o()},[v]),P=t.useCallback(e=>{let t="function"==typeof e?e(x):e;E(t);try{localStorage.setItem(l,t)}catch(e){}},[x]),A=t.useCallback(t=>{S(h(t)),"system"===x&&s&&!e&&C("system")},[x,e]);t.useEffect(()=>{let e=window.matchMedia(i);return e.addListener(A),A(e),()=>e.removeListener(A)},[A]),t.useEffect(()=>{let e=e=>{e.key===l&&(e.newValue?E(e.newValue):P(u))};return window.addEventListener("storage",e),()=>window.removeEventListener("storage",e)},[P]),t.useEffect(()=>{C(null!=e?e:x)},[e,x]);let j=t.useMemo(()=>({theme:x,setTheme:P,forcedTheme:e,resolvedTheme:"system"===x?k:x,themes:s?[...d,"system"]:d,systemTheme:s?k:void 0}),[x,P,e,k,s,d]);return t.createElement(o.Provider,{value:j},t.createElement(m,{forcedTheme:e,storageKey:l,attribute:y,enableSystem:s,enableColorScheme:n,defaultTheme:u,value:g,themes:d,nonce:v,scriptProps:w}),b)},m=t.memo(({forcedTheme:e,storageKey:a,attribute:i,enableSystem:s,enableColorScheme:o,defaultTheme:n,value:l,themes:d,nonce:c,scriptProps:u})=>{let m=JSON.stringify([i,a,n,e,d,l,s,o]).slice(1,-1);return t.createElement("script",{...u,suppressHydrationWarning:!0,nonce:"u"<typeof window?c:"",dangerouslySetInnerHTML:{__html:`(${r.toString()})(${m})`}})}),p=(e,t)=>{let r;if(!s){try{r=localStorage.getItem(e)||void 0}catch(e){}return r||t}},f=e=>{let t=document.createElement("style");return e&&t.setAttribute("nonce",e),t.appendChild(document.createTextNode("*,*::before,*::after{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}")),document.head.appendChild(t),()=>{window.getComputedStyle(document.body),setTimeout(()=>{document.head.removeChild(t)},1)}},h=e=>(e||(e=window.matchMedia(i)),e.matches?"dark":"light");e.s(["ThemeProvider",()=>d,"useTheme",()=>l])},96046,e=>{"use strict";var t=e.i(84648),r=e.i(72192),a=e.i(53480),i=e.i(477),s=e.i(88830);function o({children:e}){return(0,r.useEffect)(()=>{"serviceWorker"in navigator&&window.addEventListener("load",()=>{navigator.serviceWorker.register("/sw.js")})},[]),(0,t.jsx)(i.ThemeProvider,{attribute:"class",defaultTheme:"light",enableSystem:!0,children:(0,t.jsxs)(a.AuthProvider,{children:[(0,t.jsx)(s.Toaster,{position:"top-right",toastOptions:{className:"!rounded-xl !text-sm !font-medium !shadow-lg",duration:3e3}}),e]})})}e.s(["default",()=>o])}]);
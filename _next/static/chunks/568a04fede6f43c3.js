(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,97980,e=>{"use strict";let t="12307334",a="Vikirthan@819";e.s(["ADMIN_ID",0,t,"ADMIN_PASSWORD",0,a,"CREDENTIALS",0,{[t]:{password:a,userId:"admin-1"},teacher:{password:"teacher123",userId:"teacher-1"}},"DUMMY_USERS",0,[{id:"admin-1",username:"admin",name:"Dr. Admin",role:"admin",email:"admin@coursedrop.edu"},{id:"teacher-1",username:"teacher",name:"Prof. Sharma",role:"teacher",email:"sharma@coursedrop.edu",department:"Computer Science"}],"SEED_FILES",0,[{id:"file-1",name:"Unit 1 Notes.pdf",type:"pdf",size:24e5,courseCode:"CSE101",subjectName:"Programming in C",uploadedBy:"teacher-1",uploadedByName:"Prof. Sharma",uploadDate:"2026-03-12T10:00:00Z",driveFileId:"mock-drive-id-1",driveDownloadUrl:"#"},{id:"file-2",name:"Module 2 Slides.pptx",type:"pptx",size:51e5,courseCode:"CSE101",subjectName:"Programming in C",uploadedBy:"teacher-1",uploadedByName:"Prof. Sharma",uploadDate:"2026-03-13T14:20:00Z",driveFileId:"mock-drive-id-2",driveDownloadUrl:"#"},{id:"file-3",name:"Lab Manual.txt",type:"txt",size:48e3,courseCode:"CSE101",subjectName:"Programming in C",uploadedBy:"teacher-1",uploadedByName:"Prof. Sharma",uploadDate:"2026-03-14T09:00:00Z",driveFileId:"mock-drive-id-3",driveDownloadUrl:"#"},{id:"file-4",name:"Circuit Diagram.png",type:"png",size:12e5,courseCode:"CSE101",subjectName:"Programming in C",uploadedBy:"teacher-1",uploadedByName:"Prof. Sharma",uploadDate:"2026-03-15T16:45:00Z",driveFileId:"mock-drive-id-4",driveDownloadUrl:"#"}],"SEED_REQUESTS",0,[{id:"req-1",teacherId:"teacher-1",teacherName:"Prof. Sharma",teacherEmail:"sharma@coursedrop.edu",department:"Computer Science",subjectName:"Programming in C",courseCode:"CSE101",message:"I would like to upload C programming lecture slides and lab manuals.",status:"approved",createdAt:"2026-03-10T10:00:00Z",updatedAt:"2026-03-11T09:00:00Z"},{id:"req-2",teacherId:"teacher-1",teacherName:"Prof. Sharma",teacherEmail:"sharma@coursedrop.edu",department:"Computer Science",subjectName:"Signals and Systems",courseCode:"ECE201",message:"Planning to share solved examples and previous year papers.",status:"pending",createdAt:"2026-03-15T14:30:00Z",updatedAt:"2026-03-15T14:30:00Z"},{id:"req-3",teacherId:"teacher-1",teacherName:"Prof. Sharma",teacherEmail:"sharma@coursedrop.edu",department:"Mathematics",subjectName:"Engineering Mathematics",courseCode:"MAT110",status:"rejected",createdAt:"2026-03-12T08:00:00Z",updatedAt:"2026-03-13T11:00:00Z"},{id:"req-4",teacherId:"teacher-1",teacherName:"Prof. Sharma",teacherEmail:"sharma@coursedrop.edu",department:"Electrical Engineering",subjectName:"Power Electronics",courseCode:"EEE220",message:"I teach the lab section and want to share practical notes.",status:"pending",createdAt:"2026-03-17T09:15:00Z",updatedAt:"2026-03-17T09:15:00Z"}]])},53480,e=>{"use strict";var t=e.i(84648),a=e.i(72192),r=e.i(97980);let o=(0,a.createContext)({user:null,login:async()=>"Not ready",logout:()=>{},loading:!0});function i({children:e}){let[i,s]=(0,a.useState)(null),[n,d]=(0,a.useState)(!0);(0,a.useEffect)(()=>{try{let e=localStorage.getItem("coursedrop_user");e&&s(JSON.parse(e))}catch{}d(!1)},[]);let l=async(e,t,a)=>{if("admin"===a){let a=r.CREDENTIALS[e];if(!a||a.password!==t)return"Invalid credentials";let o=r.DUMMY_USERS.find(e=>e.id===a.userId&&"admin"===e.role);return o?(s(o),localStorage.setItem("coursedrop_user",JSON.stringify(o)),null):"User not found"}try{let a=await fetch("/api/auth/teacher/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({identifier:e,password:t})}),r=await a.json();if(!a.ok)return r.error??"Login failed";if(!r.user)return"Login failed";return s(r.user),localStorage.setItem("coursedrop_user",JSON.stringify(r.user)),null}catch{return"Network error. Try again."}};return(0,t.jsx)(o.Provider,{value:{user:i,login:l,logout:()=>{s(null),localStorage.removeItem("coursedrop_user")},loading:n},children:e})}function s(){return(0,a.useContext)(o)}e.s(["AuthProvider",()=>i,"useAuth",()=>s])},88830,e=>{"use strict";let t,a;var r,o=e.i(72192);let i={data:""},s=/(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g,n=/\/\*[^]*?\*\/|  +/g,d=/\n+/g,l=(e,t)=>{let a="",r="",o="";for(let i in e){let s=e[i];"@"==i[0]?"i"==i[1]?a=i+" "+s+";":r+="f"==i[1]?l(s,i):i+"{"+l(s,"k"==i[1]?"":t)+"}":"object"==typeof s?r+=l(s,t?t.replace(/([^,])+/g,e=>i.replace(/([^,]*:\S+\([^)]*\))|([^,])+/g,t=>/&/.test(t)?t.replace(/&/g,e):e?e+" "+t:t)):i):null!=s&&(i=/^--/.test(i)?i:i.replace(/[A-Z]/g,"-$&").toLowerCase(),o+=l.p?l.p(i,s):i+":"+s+";")}return a+(t&&o?t+"{"+o+"}":o)+r},c={},u=e=>{if("object"==typeof e){let t="";for(let a in e)t+=a+u(e[a]);return t}return e};function p(e){let t,a,r=this||{},o=e.call?e(r.p):e;return((e,t,a,r,o)=>{var i;let p=u(e),m=c[p]||(c[p]=(e=>{let t=0,a=11;for(;t<e.length;)a=101*a+e.charCodeAt(t++)>>>0;return"go"+a})(p));if(!c[m]){let t=p!==e?e:(e=>{let t,a,r=[{}];for(;t=s.exec(e.replace(n,""));)t[4]?r.shift():t[3]?(a=t[3].replace(d," ").trim(),r.unshift(r[0][a]=r[0][a]||{})):r[0][t[1]]=t[2].replace(d," ").trim();return r[0]})(e);c[m]=l(o?{["@keyframes "+m]:t}:t,a?"":"."+m)}let f=a&&c.g?c.g:null;return a&&(c.g=c[m]),i=c[m],f?t.data=t.data.replace(f,i):-1===t.data.indexOf(i)&&(t.data=r?i+t.data:t.data+i),m})(o.unshift?o.raw?(t=[].slice.call(arguments,1),a=r.p,o.reduce((e,r,o)=>{let i=t[o];if(i&&i.call){let e=i(a),t=e&&e.props&&e.props.className||/^go/.test(e)&&e;i=t?"."+t:e&&"object"==typeof e?e.props?"":l(e,""):!1===e?"":e}return e+r+(null==i?"":i)},"")):o.reduce((e,t)=>Object.assign(e,t&&t.call?t(r.p):t),{}):o,(e=>{if("object"==typeof window){let t=(e?e.querySelector("#_goober"):window._goober)||Object.assign(document.createElement("style"),{innerHTML:" ",id:"_goober"});return t.nonce=window.__nonce__,t.parentNode||(e||document.head).appendChild(t),t.firstChild}return e||i})(r.target),r.g,r.o,r.k)}p.bind({g:1});let m,f,h,g=p.bind({k:1});function y(e,t){let a=this||{};return function(){let r=arguments;function o(i,s){let n=Object.assign({},i),d=n.className||o.className;a.p=Object.assign({theme:f&&f()},n),a.o=/ *go\d+/.test(d),n.className=p.apply(a,r)+(d?" "+d:""),t&&(n.ref=s);let l=e;return e[0]&&(l=n.as||e,delete n.as),h&&l[0]&&h(n),m(l,n)}return t?t(o):o}}var b=(e,t)=>"function"==typeof e?e(t):e,v=(t=0,()=>(++t).toString()),x=()=>{if(void 0===a&&"u">typeof window){let e=matchMedia("(prefers-reduced-motion: reduce)");a=!e||e.matches}return a},E="default",w=(e,t)=>{let{toastLimit:a}=e.settings;switch(t.type){case 0:return{...e,toasts:[t.toast,...e.toasts].slice(0,a)};case 1:return{...e,toasts:e.toasts.map(e=>e.id===t.toast.id?{...e,...t.toast}:e)};case 2:let{toast:r}=t;return w(e,{type:+!!e.toasts.find(e=>e.id===r.id),toast:r});case 3:let{toastId:o}=t;return{...e,toasts:e.toasts.map(e=>e.id===o||void 0===o?{...e,dismissed:!0,visible:!1}:e)};case 4:return void 0===t.toastId?{...e,toasts:[]}:{...e,toasts:e.toasts.filter(e=>e.id!==t.toastId)};case 5:return{...e,pausedAt:t.time};case 6:let i=t.time-(e.pausedAt||0);return{...e,pausedAt:void 0,toasts:e.toasts.map(e=>({...e,pauseDuration:e.pauseDuration+i}))}}},S=[],C={toasts:[],pausedAt:void 0,settings:{toastLimit:20}},N={},I=(e,t=E)=>{N[t]=w(N[t]||C,e),S.forEach(([e,a])=>{e===t&&a(N[t])})},D=e=>Object.keys(N).forEach(t=>I(e,t)),A=(e=E)=>t=>{I(t,e)},P={blank:4e3,error:4e3,success:2e3,loading:1/0,custom:4e3},T=e=>(t,a)=>{let r,o=((e,t="blank",a)=>({createdAt:Date.now(),visible:!0,dismissed:!1,type:t,ariaProps:{role:"status","aria-live":"polite"},message:e,pauseDuration:0,...a,id:(null==a?void 0:a.id)||v()}))(t,e,a);return A(o.toasterId||(r=o.id,Object.keys(N).find(e=>N[e].toasts.some(e=>e.id===r))))({type:2,toast:o}),o.id},k=(e,t)=>T("blank")(e,t);k.error=T("error"),k.success=T("success"),k.loading=T("loading"),k.custom=T("custom"),k.dismiss=(e,t)=>{let a={type:3,toastId:e};t?A(t)(a):D(a)},k.dismissAll=e=>k.dismiss(void 0,e),k.remove=(e,t)=>{let a={type:4,toastId:e};t?A(t)(a):D(a)},k.removeAll=e=>k.remove(void 0,e),k.promise=(e,t,a)=>{let r=k.loading(t.loading,{...a,...null==a?void 0:a.loading});return"function"==typeof e&&(e=e()),e.then(e=>{let o=t.success?b(t.success,e):void 0;return o?k.success(o,{id:r,...a,...null==a?void 0:a.success}):k.dismiss(r),e}).catch(e=>{let o=t.error?b(t.error,e):void 0;o?k.error(o,{id:r,...a,...null==a?void 0:a.error}):k.dismiss(r)}),e};var j=1e3,O=g`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
 transform: scale(1) rotate(45deg);
  opacity: 1;
}`,$=g`
from {
  transform: scale(0);
  opacity: 0;
}
to {
  transform: scale(1);
  opacity: 1;
}`,M=g`
from {
  transform: scale(0) rotate(90deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(90deg);
	opacity: 1;
}`,_=y("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#ff4b4b"};
  position: relative;
  transform: rotate(45deg);

  animation: ${O} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;

  &:after,
  &:before {
    content: '';
    animation: ${$} 0.15s ease-out forwards;
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
    animation: ${M} 0.15s ease-out forwards;
    animation-delay: 180ms;
    transform: rotate(90deg);
  }
`,U=g`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`,z=y("div")`
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  border: 2px solid;
  border-radius: 100%;
  border-color: ${e=>e.secondary||"#e0e0e0"};
  border-right-color: ${e=>e.primary||"#616161"};
  animation: ${U} 1s linear infinite;
`,Z=g`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(45deg);
	opacity: 1;
}`,L=g`
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
}`,B=y("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#61d345"};
  position: relative;
  transform: rotate(45deg);

  animation: ${Z} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;
  &:after {
    content: '';
    box-sizing: border-box;
    animation: ${L} 0.2s ease-out forwards;
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
`,R=y("div")`
  position: absolute;
`,F=y("div")`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 20px;
  min-height: 20px;
`,q=g`
from {
  transform: scale(0.6);
  opacity: 0.4;
}
to {
  transform: scale(1);
  opacity: 1;
}`,H=y("div")`
  position: relative;
  transform: scale(0.6);
  opacity: 0.4;
  min-width: 20px;
  animation: ${q} 0.3s 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
`,J=({toast:e})=>{let{icon:t,type:a,iconTheme:r}=e;return void 0!==t?"string"==typeof t?o.createElement(H,null,t):t:"blank"===a?null:o.createElement(F,null,o.createElement(z,{...r}),"loading"!==a&&o.createElement(R,null,"error"===a?o.createElement(_,{...r}):o.createElement(B,{...r})))},Y=y("div")`
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
`,K=y("div")`
  display: flex;
  justify-content: center;
  margin: 4px 10px;
  color: inherit;
  flex: 1 1 auto;
  white-space: pre-line;
`,Q=o.memo(({toast:e,position:t,style:a,children:r})=>{let i=e.height?((e,t)=>{let a=e.includes("top")?1:-1,[r,o]=x()?["0%{opacity:0;} 100%{opacity:1;}","0%{opacity:1;} 100%{opacity:0;}"]:[`
0% {transform: translate3d(0,${-200*a}%,0) scale(.6); opacity:.5;}
100% {transform: translate3d(0,0,0) scale(1); opacity:1;}
`,`
0% {transform: translate3d(0,0,-1px) scale(1); opacity:1;}
100% {transform: translate3d(0,${-150*a}%,-1px) scale(.6); opacity:0;}
`];return{animation:t?`${g(r)} 0.35s cubic-bezier(.21,1.02,.73,1) forwards`:`${g(o)} 0.4s forwards cubic-bezier(.06,.71,.55,1)`}})(e.position||t||"top-center",e.visible):{opacity:0},s=o.createElement(J,{toast:e}),n=o.createElement(K,{...e.ariaProps},b(e.message,e));return o.createElement(Y,{className:e.className,style:{...i,...a,...e.style}},"function"==typeof r?r({icon:s,message:n}):o.createElement(o.Fragment,null,s,n))});r=o.createElement,l.p=void 0,m=r,f=void 0,h=void 0;var V=({id:e,className:t,style:a,onHeightUpdate:r,children:i})=>{let s=o.useCallback(t=>{if(t){let a=()=>{r(e,t.getBoundingClientRect().height)};a(),new MutationObserver(a).observe(t,{subtree:!0,childList:!0,characterData:!0})}},[e,r]);return o.createElement("div",{ref:s,className:t,style:a},i)},W=p`
  z-index: 9999;
  > * {
    pointer-events: auto;
  }
`,G=({reverseOrder:e,position:t="top-center",toastOptions:a,gutter:r,children:i,toasterId:s,containerStyle:n,containerClassName:d})=>{let{toasts:l,handlers:c}=((e,t="default")=>{let{toasts:a,pausedAt:r}=((e={},t=E)=>{let[a,r]=(0,o.useState)(N[t]||C),i=(0,o.useRef)(N[t]);(0,o.useEffect)(()=>(i.current!==N[t]&&r(N[t]),S.push([t,r]),()=>{let e=S.findIndex(([e])=>e===t);e>-1&&S.splice(e,1)}),[t]);let s=a.toasts.map(t=>{var a,r,o;return{...e,...e[t.type],...t,removeDelay:t.removeDelay||(null==(a=e[t.type])?void 0:a.removeDelay)||(null==e?void 0:e.removeDelay),duration:t.duration||(null==(r=e[t.type])?void 0:r.duration)||(null==e?void 0:e.duration)||P[t.type],style:{...e.style,...null==(o=e[t.type])?void 0:o.style,...t.style}}});return{...a,toasts:s}})(e,t),i=(0,o.useRef)(new Map).current,s=(0,o.useCallback)((e,t=j)=>{if(i.has(e))return;let a=setTimeout(()=>{i.delete(e),n({type:4,toastId:e})},t);i.set(e,a)},[]);(0,o.useEffect)(()=>{if(r)return;let e=Date.now(),o=a.map(a=>{if(a.duration===1/0)return;let r=(a.duration||0)+a.pauseDuration-(e-a.createdAt);if(r<0){a.visible&&k.dismiss(a.id);return}return setTimeout(()=>k.dismiss(a.id,t),r)});return()=>{o.forEach(e=>e&&clearTimeout(e))}},[a,r,t]);let n=(0,o.useCallback)(A(t),[t]),d=(0,o.useCallback)(()=>{n({type:5,time:Date.now()})},[n]),l=(0,o.useCallback)((e,t)=>{n({type:1,toast:{id:e,height:t}})},[n]),c=(0,o.useCallback)(()=>{r&&n({type:6,time:Date.now()})},[r,n]),u=(0,o.useCallback)((e,t)=>{let{reverseOrder:r=!1,gutter:o=8,defaultPosition:i}=t||{},s=a.filter(t=>(t.position||i)===(e.position||i)&&t.height),n=s.findIndex(t=>t.id===e.id),d=s.filter((e,t)=>t<n&&e.visible).length;return s.filter(e=>e.visible).slice(...r?[d+1]:[0,d]).reduce((e,t)=>e+(t.height||0)+o,0)},[a]);return(0,o.useEffect)(()=>{a.forEach(e=>{if(e.dismissed)s(e.id,e.removeDelay);else{let t=i.get(e.id);t&&(clearTimeout(t),i.delete(e.id))}})},[a,s]),{toasts:a,handlers:{updateHeight:l,startPause:d,endPause:c,calculateOffset:u}}})(a,s);return o.createElement("div",{"data-rht-toaster":s||"",style:{position:"fixed",zIndex:9999,top:16,left:16,right:16,bottom:16,pointerEvents:"none",...n},className:d,onMouseEnter:c.startPause,onMouseLeave:c.endPause},l.map(a=>{let s,n,d=a.position||t,l=c.calculateOffset(a,{reverseOrder:e,gutter:r,defaultPosition:t}),u=(s=d.includes("top"),n=d.includes("center")?{justifyContent:"center"}:d.includes("right")?{justifyContent:"flex-end"}:{},{left:0,right:0,display:"flex",position:"absolute",transition:x()?void 0:"all 230ms cubic-bezier(.21,1.02,.73,1)",transform:`translateY(${l*(s?1:-1)}px)`,...s?{top:0}:{bottom:0},...n});return o.createElement(V,{id:a.id,key:a.id,onHeightUpdate:c.updateHeight,className:a.visible?W:"",style:u},"custom"===a.type?b(a.message,a):i?i(a):o.createElement(Q,{toast:a,position:d}))}))};e.s(["Toaster",()=>G,"default",()=>k],88830)},96046,e=>{"use strict";var t=e.i(84648),a=e.i(53480),r=e.i(88830);function o({children:e}){return(0,t.jsxs)(a.AuthProvider,{children:[(0,t.jsx)(r.Toaster,{position:"top-right",toastOptions:{className:"!rounded-xl !text-sm !font-medium !shadow-lg",duration:3e3}}),e]})}e.s(["default",()=>o])}]);
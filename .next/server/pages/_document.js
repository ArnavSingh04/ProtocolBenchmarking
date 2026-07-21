"use strict";(()=>{var a={};a.id=220,a.ids=[220],a.modules={361:a=>{a.exports=require("next/dist/compiled/next-server/pages.runtime.prod.js")},2015:a=>{a.exports=require("react")},3873:a=>{a.exports=require("path")},5430:(a,b,c)=>{c.r(b),c.d(b,{default:()=>g});var d=c(8732),e=c(2341);let f=`
(function () {
  try {
    var stored = localStorage.getItem('theme') || 'system';
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var resolved = stored === 'dark' || (stored === 'system' && prefersDark) ? 'dark' : 'light';
    document.documentElement.dataset.theme = resolved;
  } catch (e) {
    document.documentElement.dataset.theme = 'light';
  }
})();
`;function g(){return(0,d.jsxs)(e.Html,{lang:"en",children:[(0,d.jsxs)(e.Head,{children:[(0,d.jsx)("meta",{name:"description",content:"Compare MQTT, HTTP, WebSocket and CoAP against weighted quality attributes under realistic network scenarios."}),(0,d.jsx)("script",{dangerouslySetInnerHTML:{__html:f}})]}),(0,d.jsxs)("body",{children:[(0,d.jsx)(e.Main,{}),(0,d.jsx)(e.NextScript,{})]})]})}},8732:a=>{a.exports=require("react/jsx-runtime")}};var b=require("../webpack-runtime.js");b.C(a);var c=b.X(0,[341],()=>b(b.s=5430));module.exports=c})();
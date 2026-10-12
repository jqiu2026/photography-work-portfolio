const lum = (h) => { const c = [1,3,5].map(i => parseInt(h.slice(i,i+2),16)/255).map(v => v<=.03928? v/12.92 : ((v+.055)/1.055)**2.4); return .2126*c[0]+.7152*c[1]+.0722*c[2]; };
const cr = (a,b) => { const [x,y]=[lum(a),lum(b)].sort((p,q)=>q-p); return ((x+.05)/(y+.05)); };
const P = {
 "A light":{bg:"#f5f2ec",text:"#1b1a17",muted:"#66625a",accent:"#8a4b2a"},
 "A dark":{bg:"#151412",text:"#efebe3",muted:"#a09a8e",accent:"#d49a74"},
 "B dark":{bg:"#07080a",text:"#eef0f3",muted:"#8d949e",accent:"#8ab6ff"},
 "B light":{bg:"#f4f6f8",text:"#0b0d10",muted:"#555d68",accent:"#2457c5"},
 "C light":{bg:"#e9e6df",text:"#23211e",muted:"#5f5b53",accent:"#4a5a43"},
 "C dark":{bg:"#1b1a18",text:"#e8e5de",muted:"#9c978b",accent:"#a9bd9f"},
};
for (const [k,p] of Object.entries(P)) console.log(k.padEnd(8), ["text","muted","accent"].map(n=>`${n} ${cr(p.bg,p[n]).toFixed(2)}`).join("  "));

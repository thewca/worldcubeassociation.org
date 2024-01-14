const a = (n) => n == 1 ? 'one' : 'other';
const b = (n) => (n == 0 || n == 1) ? 'one' : 'other';
const c = (n) => n >= 0 && n <= 1 ? 'one' : 'other';
const d = (n) => {
  const s = String(n).split('.'), v0 = !s[1];
  return n == 1 && v0 ? 'one' : 'other';
};
const e = (n) => 'other';
const f = (n) => n == 1 ? 'one'
    : n == 2 ? 'two'
    : 'other';

(function (root, plurals) {
  Object.defineProperty(plurals, '__esModule', { value: true });
  if (typeof define === 'function' && define.amd) define(plurals);
  else if (typeof exports === 'object') module.exports = plurals;
  else root.plurals = plurals;
}(this, {
af: a,

ak: b,

am: c,

an: a,

ar: (n) => {
  const s = String(n).split('.'), t0 = Number(s[0]) == n, n100 = t0 && s[0].slice(-2);
  return n == 0 ? 'zero'
    : n == 1 ? 'one'
    : n == 2 ? 'two'
    : (n100 >= 3 && n100 <= 10) ? 'few'
    : (n100 >= 11 && n100 <= 99) ? 'many'
    : 'other';
},

ars: (n) => {
  const s = String(n).split('.'), t0 = Number(s[0]) == n, n100 = t0 && s[0].slice(-2);
  return n == 0 ? 'zero'
    : n == 1 ? 'one'
    : n == 2 ? 'two'
    : (n100 >= 3 && n100 <= 10) ? 'few'
    : (n100 >= 11 && n100 <= 99) ? 'many'
    : 'other';
},

as: c,

asa: a,

ast: d,

az: a,

bal: a,

be: (n) => {
  const s = String(n).split('.'), t0 = Number(s[0]) == n, n10 = t0 && s[0].slice(-1), n100 = t0 && s[0].slice(-2);
  return n10 == 1 && n100 != 11 ? 'one'
    : (n10 >= 2 && n10 <= 4) && (n100 < 12 || n100 > 14) ? 'few'
    : t0 && n10 == 0 || (n10 >= 5 && n10 <= 9) || (n100 >= 11 && n100 <= 14) ? 'many'
    : 'other';
},

bem: a,

bez: a,

bg: a,

bho: b,

bm: e,

bn: c,

bo: e,

br: (n) => {
  const s = String(n).split('.'), t0 = Number(s[0]) == n, n10 = t0 && s[0].slice(-1), n100 = t0 && s[0].slice(-2), n1000000 = t0 && s[0].slice(-6);
  return n10 == 1 && n100 != 11 && n100 != 71 && n100 != 91 ? 'one'
    : n10 == 2 && n100 != 12 && n100 != 72 && n100 != 92 ? 'two'
    : ((n10 == 3 || n10 == 4) || n10 == 9) && (n100 < 10 || n100 > 19) && (n100 < 70 || n100 > 79) && (n100 < 90 || n100 > 99) ? 'few'
    : n != 0 && t0 && n1000000 == 0 ? 'many'
    : 'other';
},

brx: a,

bs: (n) => {
  const s = String(n).split('.'), i = s[0], f = s[1] || '', v0 = !s[1], i10 = i.slice(-1), i100 = i.slice(-2), f10 = f.slice(-1), f100 = f.slice(-2);
  return v0 && i10 == 1 && i100 != 11 || f10 == 1 && f100 != 11 ? 'one'
    : v0 && (i10 >= 2 && i10 <= 4) && (i100 < 12 || i100 > 14) || (f10 >= 2 && f10 <= 4) && (f100 < 12 || f100 > 14) ? 'few'
    : 'other';
},

ca: (n) => {
  const s = String(n).split('.'), i = s[0], v0 = !s[1], i1000000 = i.slice(-6);
  return n == 1 && v0 ? 'one'
    : i != 0 && i1000000 == 0 && v0 ? 'many'
    : 'other';
},

ce: a,

ceb: (n) => {
  const s = String(n).split('.'), i = s[0], f = s[1] || '', v0 = !s[1], i10 = i.slice(-1), f10 = f.slice(-1);
  return v0 && (i == 1 || i == 2 || i == 3) || v0 && i10 != 4 && i10 != 6 && i10 != 9 || !v0 && f10 != 4 && f10 != 6 && f10 != 9 ? 'one' : 'other';
},

cgg: a,

chr: a,

ckb: a,

cs: (n) => {
  const s = String(n).split('.'), i = s[0], v0 = !s[1];
  return n == 1 && v0 ? 'one'
    : (i >= 2 && i <= 4) && v0 ? 'few'
    : !v0 ? 'many'
    : 'other';
},

cy: (n) => n == 0 ? 'zero'
    : n == 1 ? 'one'
    : n == 2 ? 'two'
    : n == 3 ? 'few'
    : n == 6 ? 'many'
    : 'other',

da: (n) => {
  const s = String(n).split('.'), i = s[0], t0 = Number(s[0]) == n;
  return n == 1 || !t0 && (i == 0 || i == 1) ? 'one' : 'other';
},

de: d,

doi: c,

dsb: (n) => {
  const s = String(n).split('.'), i = s[0], f = s[1] || '', v0 = !s[1], i100 = i.slice(-2), f100 = f.slice(-2);
  return v0 && i100 == 1 || f100 == 1 ? 'one'
    : v0 && i100 == 2 || f100 == 2 ? 'two'
    : v0 && (i100 == 3 || i100 == 4) || (f100 == 3 || f100 == 4) ? 'few'
    : 'other';
},

dv: a,

dz: e,

ee: a,

el: a,

en: d,

eo: a,

es: (n) => {
  const s = String(n).split('.'), i = s[0], v0 = !s[1], i1000000 = i.slice(-6);
  return n == 1 ? 'one'
    : i != 0 && i1000000 == 0 && v0 ? 'many'
    : 'other';
},

et: d,

eu: a,

fa: c,

ff: (n) => n >= 0 && n < 2 ? 'one' : 'other',

fi: d,

fil: (n) => {
  const s = String(n).split('.'), i = s[0], f = s[1] || '', v0 = !s[1], i10 = i.slice(-1), f10 = f.slice(-1);
  return v0 && (i == 1 || i == 2 || i == 3) || v0 && i10 != 4 && i10 != 6 && i10 != 9 || !v0 && f10 != 4 && f10 != 6 && f10 != 9 ? 'one' : 'other';
},

fo: a,

fr: (n) => {
  const s = String(n).split('.'), i = s[0], v0 = !s[1], i1000000 = i.slice(-6);
  return n >= 0 && n < 2 ? 'one'
    : i != 0 && i1000000 == 0 && v0 ? 'many'
    : 'other';
},

fur: a,

fy: d,

ga: (n) => {
  const s = String(n).split('.'), t0 = Number(s[0]) == n;
  return n == 1 ? 'one'
    : n == 2 ? 'two'
    : (t0 && n >= 3 && n <= 6) ? 'few'
    : (t0 && n >= 7 && n <= 10) ? 'many'
    : 'other';
},

gd: (n) => {
  const s = String(n).split('.'), t0 = Number(s[0]) == n;
  return (n == 1 || n == 11) ? 'one'
    : (n == 2 || n == 12) ? 'two'
    : ((t0 && n >= 3 && n <= 10) || (t0 && n >= 13 && n <= 19)) ? 'few'
    : 'other';
},

gl: d,

gsw: a,

gu: c,

guw: b,

gv: (n) => {
  const s = String(n).split('.'), i = s[0], v0 = !s[1], i10 = i.slice(-1), i100 = i.slice(-2);
  return v0 && i10 == 1 ? 'one'
    : v0 && i10 == 2 ? 'two'
    : v0 && (i100 == 0 || i100 == 20 || i100 == 40 || i100 == 60 || i100 == 80) ? 'few'
    : !v0 ? 'many'
    : 'other';
},

ha: a,

haw: a,

he: (n) => {
  const s = String(n).split('.'), i = s[0], v0 = !s[1];
  return i == 1 && v0 || i == 0 && !v0 ? 'one'
    : i == 2 && v0 ? 'two'
    : 'other';
},

hi: c,

hnj: e,

hr: (n) => {
  const s = String(n).split('.'), i = s[0], f = s[1] || '', v0 = !s[1], i10 = i.slice(-1), i100 = i.slice(-2), f10 = f.slice(-1), f100 = f.slice(-2);
  return v0 && i10 == 1 && i100 != 11 || f10 == 1 && f100 != 11 ? 'one'
    : v0 && (i10 >= 2 && i10 <= 4) && (i100 < 12 || i100 > 14) || (f10 >= 2 && f10 <= 4) && (f100 < 12 || f100 > 14) ? 'few'
    : 'other';
},

hsb: (n) => {
  const s = String(n).split('.'), i = s[0], f = s[1] || '', v0 = !s[1], i100 = i.slice(-2), f100 = f.slice(-2);
  return v0 && i100 == 1 || f100 == 1 ? 'one'
    : v0 && i100 == 2 || f100 == 2 ? 'two'
    : v0 && (i100 == 3 || i100 == 4) || (f100 == 3 || f100 == 4) ? 'few'
    : 'other';
},

hu: a,

hy: (n) => n >= 0 && n < 2 ? 'one' : 'other',

ia: d,

id: e,

ig: e,

ii: e,

io: d,

is: (n) => {
  const s = String(n).split('.'), i = s[0], t = (s[1] || '').replace(/0+$/, ''), t0 = Number(s[0]) == n, i10 = i.slice(-1), i100 = i.slice(-2);
  return t0 && i10 == 1 && i100 != 11 || t % 10 == 1 && t % 100 != 11 ? 'one' : 'other';
},

it: (n) => {
  const s = String(n).split('.'), i = s[0], v0 = !s[1], i1000000 = i.slice(-6);
  return n == 1 && v0 ? 'one'
    : i != 0 && i1000000 == 0 && v0 ? 'many'
    : 'other';
},

iu: f,

ja: e,

jbo: e,

jgo: a,

jmc: a,

jv: e,

jw: e,

ka: a,

kab: (n) => n >= 0 && n < 2 ? 'one' : 'other',

kaj: a,

kcg: a,

kde: e,

kea: e,

kk: a,

kkj: a,

kl: a,

km: e,

kn: c,

ko: e,

ks: a,

ksb: a,

ksh: (n) => n == 0 ? 'zero'
    : n == 1 ? 'one'
    : 'other',

ku: a,

kw: (n) => {
  const s = String(n).split('.'), t0 = Number(s[0]) == n, n100 = t0 && s[0].slice(-2), n1000 = t0 && s[0].slice(-3), n100000 = t0 && s[0].slice(-5), n1000000 = t0 && s[0].slice(-6);
  return n == 0 ? 'zero'
    : n == 1 ? 'one'
    : (n100 == 2 || n100 == 22 || n100 == 42 || n100 == 62 || n100 == 82) || t0 && n1000 == 0 && ((n100000 >= 1000 && n100000 <= 20000) || n100000 == 40000 || n100000 == 60000 || n100000 == 80000) || n != 0 && n1000000 == 100000 ? 'two'
    : (n100 == 3 || n100 == 23 || n100 == 43 || n100 == 63 || n100 == 83) ? 'few'
    : n != 1 && (n100 == 1 || n100 == 21 || n100 == 41 || n100 == 61 || n100 == 81) ? 'many'
    : 'other';
},

ky: a,

lag: (n) => {
  const s = String(n).split('.'), i = s[0];
  return n == 0 ? 'zero'
    : (i == 0 || i == 1) && n != 0 ? 'one'
    : 'other';
},

lb: a,

lg: a,

lij: d,

lkt: e,

ln: b,

lo: e,

lt: (n) => {
  const s = String(n).split('.'), f = s[1] || '', t0 = Number(s[0]) == n, n10 = t0 && s[0].slice(-1), n100 = t0 && s[0].slice(-2);
  return n10 == 1 && (n100 < 11 || n100 > 19) ? 'one'
    : (n10 >= 2 && n10 <= 9) && (n100 < 11 || n100 > 19) ? 'few'
    : f != 0 ? 'many'
    : 'other';
},

lv: (n) => {
  const s = String(n).split('.'), f = s[1] || '', v = f.length, t0 = Number(s[0]) == n, n10 = t0 && s[0].slice(-1), n100 = t0 && s[0].slice(-2), f100 = f.slice(-2), f10 = f.slice(-1);
  return t0 && n10 == 0 || (n100 >= 11 && n100 <= 19) || v == 2 && (f100 >= 11 && f100 <= 19) ? 'zero'
    : n10 == 1 && n100 != 11 || v == 2 && f10 == 1 && f100 != 11 || v != 2 && f10 == 1 ? 'one'
    : 'other';
},

mas: a,

mg: b,

mgo: a,

mk: (n) => {
  const s = String(n).split('.'), i = s[0], f = s[1] || '', v0 = !s[1], i10 = i.slice(-1), i100 = i.slice(-2), f10 = f.slice(-1), f100 = f.slice(-2);
  return v0 && i10 == 1 && i100 != 11 || f10 == 1 && f100 != 11 ? 'one' : 'other';
},

ml: a,

mn: a,

mo: (n) => {
  const s = String(n).split('.'), v0 = !s[1], t0 = Number(s[0]) == n, n100 = t0 && s[0].slice(-2);
  return n == 1 && v0 ? 'one'
    : !v0 || n == 0 || n != 1 && (n100 >= 1 && n100 <= 19) ? 'few'
    : 'other';
},

mr: a,

ms: e,

mt: (n) => {
  const s = String(n).split('.'), t0 = Number(s[0]) == n, n100 = t0 && s[0].slice(-2);
  return n == 1 ? 'one'
    : n == 2 ? 'two'
    : n == 0 || (n100 >= 3 && n100 <= 10) ? 'few'
    : (n100 >= 11 && n100 <= 19) ? 'many'
    : 'other';
},

my: e,

nah: a,

naq: f,

nb: a,

nd: a,

ne: a,

nl: d,

nn: a,

nnh: a,

no: a,

nqo: e,

nr: a,

nso: b,

ny: a,

nyn: a,

om: a,

or: a,

os: a,

osa: e,

pa: b,

pap: a,

pcm: c,

pl: (n) => {
  const s = String(n).split('.'), i = s[0], v0 = !s[1], i10 = i.slice(-1), i100 = i.slice(-2);
  return n == 1 && v0 ? 'one'
    : v0 && (i10 >= 2 && i10 <= 4) && (i100 < 12 || i100 > 14) ? 'few'
    : v0 && i != 1 && (i10 == 0 || i10 == 1) || v0 && (i10 >= 5 && i10 <= 9) || v0 && (i100 >= 12 && i100 <= 14) ? 'many'
    : 'other';
},

prg: (n) => {
  const s = String(n).split('.'), f = s[1] || '', v = f.length, t0 = Number(s[0]) == n, n10 = t0 && s[0].slice(-1), n100 = t0 && s[0].slice(-2), f100 = f.slice(-2), f10 = f.slice(-1);
  return t0 && n10 == 0 || (n100 >= 11 && n100 <= 19) || v == 2 && (f100 >= 11 && f100 <= 19) ? 'zero'
    : n10 == 1 && n100 != 11 || v == 2 && f10 == 1 && f100 != 11 || v != 2 && f10 == 1 ? 'one'
    : 'other';
},

ps: a,

pt: (n) => {
  const s = String(n).split('.'), i = s[0], v0 = !s[1], i1000000 = i.slice(-6);
  return (i == 0 || i == 1) ? 'one'
    : i != 0 && i1000000 == 0 && v0 ? 'many'
    : 'other';
},

pt_PT: (n) => {
  const s = String(n).split('.'), i = s[0], v0 = !s[1], i1000000 = i.slice(-6);
  return n == 1 && v0 ? 'one'
    : i != 0 && i1000000 == 0 && v0 ? 'many'
    : 'other';
},

rm: a,

ro: (n) => {
  const s = String(n).split('.'), v0 = !s[1], t0 = Number(s[0]) == n, n100 = t0 && s[0].slice(-2);
  return n == 1 && v0 ? 'one'
    : !v0 || n == 0 || n != 1 && (n100 >= 1 && n100 <= 19) ? 'few'
    : 'other';
},

rof: a,

ru: (n) => {
  const s = String(n).split('.'), i = s[0], v0 = !s[1], i10 = i.slice(-1), i100 = i.slice(-2);
  return v0 && i10 == 1 && i100 != 11 ? 'one'
    : v0 && (i10 >= 2 && i10 <= 4) && (i100 < 12 || i100 > 14) ? 'few'
    : v0 && i10 == 0 || v0 && (i10 >= 5 && i10 <= 9) || v0 && (i100 >= 11 && i100 <= 14) ? 'many'
    : 'other';
},

rwk: a,

sah: e,

saq: a,

sat: f,

sc: d,

scn: d,

sd: a,

sdh: a,

se: f,

seh: a,

ses: e,

sg: e,

sh: (n) => {
  const s = String(n).split('.'), i = s[0], f = s[1] || '', v0 = !s[1], i10 = i.slice(-1), i100 = i.slice(-2), f10 = f.slice(-1), f100 = f.slice(-2);
  return v0 && i10 == 1 && i100 != 11 || f10 == 1 && f100 != 11 ? 'one'
    : v0 && (i10 >= 2 && i10 <= 4) && (i100 < 12 || i100 > 14) || (f10 >= 2 && f10 <= 4) && (f100 < 12 || f100 > 14) ? 'few'
    : 'other';
},

shi: (n) => {
  const s = String(n).split('.'), t0 = Number(s[0]) == n;
  return n >= 0 && n <= 1 ? 'one'
    : (t0 && n >= 2 && n <= 10) ? 'few'
    : 'other';
},

si: (n) => {
  const s = String(n).split('.'), i = s[0], f = s[1] || '';
  return (n == 0 || n == 1) || i == 0 && f == 1 ? 'one' : 'other';
},

sk: (n) => {
  const s = String(n).split('.'), i = s[0], v0 = !s[1];
  return n == 1 && v0 ? 'one'
    : (i >= 2 && i <= 4) && v0 ? 'few'
    : !v0 ? 'many'
    : 'other';
},

sl: (n) => {
  const s = String(n).split('.'), i = s[0], v0 = !s[1], i100 = i.slice(-2);
  return v0 && i100 == 1 ? 'one'
    : v0 && i100 == 2 ? 'two'
    : v0 && (i100 == 3 || i100 == 4) || !v0 ? 'few'
    : 'other';
},

sma: f,

smi: f,

smj: f,

smn: f,

sms: f,

sn: a,

so: a,

sq: a,

sr: (n) => {
  const s = String(n).split('.'), i = s[0], f = s[1] || '', v0 = !s[1], i10 = i.slice(-1), i100 = i.slice(-2), f10 = f.slice(-1), f100 = f.slice(-2);
  return v0 && i10 == 1 && i100 != 11 || f10 == 1 && f100 != 11 ? 'one'
    : v0 && (i10 >= 2 && i10 <= 4) && (i100 < 12 || i100 > 14) || (f10 >= 2 && f10 <= 4) && (f100 < 12 || f100 > 14) ? 'few'
    : 'other';
},

ss: a,

ssy: a,

st: a,

su: e,

sv: d,

sw: d,

syr: a,

ta: a,

te: a,

teo: a,

th: e,

ti: b,

tig: a,

tk: a,

tl: (n) => {
  const s = String(n).split('.'), i = s[0], f = s[1] || '', v0 = !s[1], i10 = i.slice(-1), f10 = f.slice(-1);
  return v0 && (i == 1 || i == 2 || i == 3) || v0 && i10 != 4 && i10 != 6 && i10 != 9 || !v0 && f10 != 4 && f10 != 6 && f10 != 9 ? 'one' : 'other';
},

tn: a,

to: e,

tpi: e,

tr: a,

ts: a,

tzm: (n) => {
  const s = String(n).split('.'), t0 = Number(s[0]) == n;
  return (n == 0 || n == 1) || (t0 && n >= 11 && n <= 99) ? 'one' : 'other';
},

ug: a,

uk: (n) => {
  const s = String(n).split('.'), i = s[0], v0 = !s[1], i10 = i.slice(-1), i100 = i.slice(-2);
  return v0 && i10 == 1 && i100 != 11 ? 'one'
    : v0 && (i10 >= 2 && i10 <= 4) && (i100 < 12 || i100 > 14) ? 'few'
    : v0 && i10 == 0 || v0 && (i10 >= 5 && i10 <= 9) || v0 && (i100 >= 11 && i100 <= 14) ? 'many'
    : 'other';
},

und: e,

ur: d,

uz: a,

ve: a,

vec: (n) => {
  const s = String(n).split('.'), i = s[0], v0 = !s[1], i1000000 = i.slice(-6);
  return n == 1 && v0 ? 'one'
    : i != 0 && i1000000 == 0 && v0 ? 'many'
    : 'other';
},

vi: e,

vo: a,

vun: a,

wa: b,

wae: a,

wo: e,

xh: a,

xog: a,

yi: d,

yo: e,

yue: e,

zh: e,

zu: c
}));

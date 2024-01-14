const a = (start, end) => "other";
const b = (start, end) => (start === "other" && end === "one") ? "one" : "other";
const c = (start, end) => end || "other";

(function (root, pluralRanges) {
  Object.defineProperty(pluralRanges, '__esModule', { value: true });
  if (typeof define === 'function' && define.amd) define(pluralRanges);
  else if (typeof exports === 'object') module.exports = pluralRanges;
  else root.pluralRanges = pluralRanges;
}(this, {
af: a,

ak: b,

am: c,

an: a,

ar: (start, end) => (
  end === "few" ? "few"
  : end === "many" ? "many"
  : (start === "zero" && end === "one") ? "zero"
  : (start === "zero" && end === "two") ? "zero"
  : "other"
),

as: c,

az: c,

be: c,

bg: a,

bn: c,

bs: c,

ca: a,

cs: c,

cy: c,

da: c,

de: c,

el: c,

en: a,

es: a,

et: a,

eu: a,

fa: b,

fi: a,

fil: c,

fr: c,

ga: c,

gl: c,

gsw: c,

gu: c,

he: a,

hi: c,

hr: c,

hu: c,

hy: c,

ia: a,

id: a,

io: a,

is: c,

it: c,

ja: a,

ka: (start, end) => start || "other",

kk: c,

km: a,

kn: c,

ko: a,

ky: c,

lij: c,

lo: a,

lt: c,

lv: (start, end) => end === "one" ? "one" : "other",

mk: a,

ml: c,

mn: c,

mr: c,

ms: a,

my: a,

nb: a,

ne: c,

nl: c,

no: a,

or: b,

pa: c,

pcm: a,

pl: c,

ps: c,

pt: c,

ro: (start, end) => end === "few" ? "few" : end === "one" ? "few" : "other",

ru: c,

sc: c,

scn: c,

sd: b,

si: (start, end) => (start === "one" && end === "one") ? "one" : "other",

sk: c,

sl: (start, end) => (
  end === "few" ? "few"
  : end === "one" ? "few"
  : end === "two" ? "two"
  : "other"
),

sq: c,

sr: c,

sv: a,

sw: c,

ta: c,

te: c,

th: a,

tk: c,

tr: c,

ug: c,

uk: c,

ur: a,

uz: c,

vi: a,

yue: a,

zh: a,

zu: c
}));

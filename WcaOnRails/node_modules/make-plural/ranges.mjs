const a = (start, end) => "other";
const b = (start, end) => (start === "other" && end === "one") ? "one" : "other";
const c = (start, end) => end || "other";

export const af = a;
export const ak = b;
export const am = c;
export const an = a;
export const ar = (start, end) => (
  end === "few" ? "few"
  : end === "many" ? "many"
  : (start === "zero" && end === "one") ? "zero"
  : (start === "zero" && end === "two") ? "zero"
  : "other"
);
export const as = c;
export const az = c;
export const be = c;
export const bg = a;
export const bn = c;
export const bs = c;
export const ca = a;
export const cs = c;
export const cy = c;
export const da = c;
export const de = c;
export const el = c;
export const en = a;
export const es = a;
export const et = a;
export const eu = a;
export const fa = b;
export const fi = a;
export const fil = c;
export const fr = c;
export const ga = c;
export const gl = c;
export const gsw = c;
export const gu = c;
export const he = a;
export const hi = c;
export const hr = c;
export const hu = c;
export const hy = c;
export const ia = a;
export const id = a;
export const io = a;
export const is = c;
export const it = c;
export const ja = a;
export const ka = (start, end) => start || "other";
export const kk = c;
export const km = a;
export const kn = c;
export const ko = a;
export const ky = c;
export const lij = c;
export const lo = a;
export const lt = c;
export const lv = (start, end) => end === "one" ? "one" : "other";
export const mk = a;
export const ml = c;
export const mn = c;
export const mr = c;
export const ms = a;
export const my = a;
export const nb = a;
export const ne = c;
export const nl = c;
export const no = a;
export const or = b;
export const pa = c;
export const pcm = a;
export const pl = c;
export const ps = c;
export const pt = c;
export const ro = (start, end) => end === "few" ? "few" : end === "one" ? "few" : "other";
export const ru = c;
export const sc = c;
export const scn = c;
export const sd = b;
export const si = (start, end) => (start === "one" && end === "one") ? "one" : "other";
export const sk = c;
export const sl = (start, end) => (
  end === "few" ? "few"
  : end === "one" ? "few"
  : end === "two" ? "two"
  : "other"
);
export const sq = c;
export const sr = c;
export const sv = a;
export const sw = c;
export const ta = c;
export const te = c;
export const th = a;
export const tk = c;
export const tr = c;
export const ug = c;
export const uk = c;
export const ur = a;
export const uz = c;
export const vi = a;
export const yue = a;
export const zh = a;
export const zu = c;

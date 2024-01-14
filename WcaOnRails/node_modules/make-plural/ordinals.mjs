const a = (n) => 'other';
const b = (n) => n == 1 ? 'one' : 'other';

export const af = a;
export const am = a;
export const an = a;
export const ar = a;
export const as = (n) => (n == 1 || n == 5 || n == 7 || n == 8 || n == 9 || n == 10) ? 'one'
    : (n == 2 || n == 3) ? 'two'
    : n == 4 ? 'few'
    : n == 6 ? 'many'
    : 'other';
export const ast = a;
export const az = (n) => {
  const s = String(n).split('.'), i = s[0], i10 = i.slice(-1), i100 = i.slice(-2), i1000 = i.slice(-3);
  return (i10 == 1 || i10 == 2 || i10 == 5 || i10 == 7 || i10 == 8) || (i100 == 20 || i100 == 50 || i100 == 70 || i100 == 80) ? 'one'
    : (i10 == 3 || i10 == 4) || (i1000 == 100 || i1000 == 200 || i1000 == 300 || i1000 == 400 || i1000 == 500 || i1000 == 600 || i1000 == 700 || i1000 == 800 || i1000 == 900) ? 'few'
    : i == 0 || i10 == 6 || (i100 == 40 || i100 == 60 || i100 == 90) ? 'many'
    : 'other';
};
export const bal = b;
export const be = (n) => {
  const s = String(n).split('.'), t0 = Number(s[0]) == n, n10 = t0 && s[0].slice(-1), n100 = t0 && s[0].slice(-2);
  return (n10 == 2 || n10 == 3) && n100 != 12 && n100 != 13 ? 'few' : 'other';
};
export const bg = a;
export const bn = (n) => (n == 1 || n == 5 || n == 7 || n == 8 || n == 9 || n == 10) ? 'one'
    : (n == 2 || n == 3) ? 'two'
    : n == 4 ? 'few'
    : n == 6 ? 'many'
    : 'other';
export const bs = a;
export const ca = (n) => (n == 1 || n == 3) ? 'one'
    : n == 2 ? 'two'
    : n == 4 ? 'few'
    : 'other';
export const ce = a;
export const cs = a;
export const cy = (n) => (n == 0 || n == 7 || n == 8 || n == 9) ? 'zero'
    : n == 1 ? 'one'
    : n == 2 ? 'two'
    : (n == 3 || n == 4) ? 'few'
    : (n == 5 || n == 6) ? 'many'
    : 'other';
export const da = a;
export const de = a;
export const dsb = a;
export const el = a;
export const en = (n) => {
  const s = String(n).split('.'), t0 = Number(s[0]) == n, n10 = t0 && s[0].slice(-1), n100 = t0 && s[0].slice(-2);
  return n10 == 1 && n100 != 11 ? 'one'
    : n10 == 2 && n100 != 12 ? 'two'
    : n10 == 3 && n100 != 13 ? 'few'
    : 'other';
};
export const es = a;
export const et = a;
export const eu = a;
export const fa = a;
export const fi = a;
export const fil = b;
export const fr = b;
export const fy = a;
export const ga = b;
export const gd = (n) => (n == 1 || n == 11) ? 'one'
    : (n == 2 || n == 12) ? 'two'
    : (n == 3 || n == 13) ? 'few'
    : 'other';
export const gl = a;
export const gsw = a;
export const gu = (n) => n == 1 ? 'one'
    : (n == 2 || n == 3) ? 'two'
    : n == 4 ? 'few'
    : n == 6 ? 'many'
    : 'other';
export const he = a;
export const hi = (n) => n == 1 ? 'one'
    : (n == 2 || n == 3) ? 'two'
    : n == 4 ? 'few'
    : n == 6 ? 'many'
    : 'other';
export const hr = a;
export const hsb = a;
export const hu = (n) => (n == 1 || n == 5) ? 'one' : 'other';
export const hy = b;
export const ia = a;
export const id = a;
export const is = a;
export const it = (n) => (n == 11 || n == 8 || n == 80 || n == 800) ? 'many' : 'other';
export const ja = a;
export const ka = (n) => {
  const s = String(n).split('.'), i = s[0], i100 = i.slice(-2);
  return i == 1 ? 'one'
    : i == 0 || ((i100 >= 2 && i100 <= 20) || i100 == 40 || i100 == 60 || i100 == 80) ? 'many'
    : 'other';
};
export const kk = (n) => {
  const s = String(n).split('.'), t0 = Number(s[0]) == n, n10 = t0 && s[0].slice(-1);
  return n10 == 6 || n10 == 9 || t0 && n10 == 0 && n != 0 ? 'many' : 'other';
};
export const km = a;
export const kn = a;
export const ko = a;
export const kw = (n) => {
  const s = String(n).split('.'), t0 = Number(s[0]) == n, n100 = t0 && s[0].slice(-2);
  return (t0 && n >= 1 && n <= 4) || ((n100 >= 1 && n100 <= 4) || (n100 >= 21 && n100 <= 24) || (n100 >= 41 && n100 <= 44) || (n100 >= 61 && n100 <= 64) || (n100 >= 81 && n100 <= 84)) ? 'one'
    : n == 5 || n100 == 5 ? 'many'
    : 'other';
};
export const ky = a;
export const lij = (n) => {
  const s = String(n).split('.'), t0 = Number(s[0]) == n;
  return (n == 11 || n == 8 || (t0 && n >= 80 && n <= 89) || (t0 && n >= 800 && n <= 899)) ? 'many' : 'other';
};
export const lo = b;
export const lt = a;
export const lv = a;
export const mk = (n) => {
  const s = String(n).split('.'), i = s[0], i10 = i.slice(-1), i100 = i.slice(-2);
  return i10 == 1 && i100 != 11 ? 'one'
    : i10 == 2 && i100 != 12 ? 'two'
    : (i10 == 7 || i10 == 8) && i100 != 17 && i100 != 18 ? 'many'
    : 'other';
};
export const ml = a;
export const mn = a;
export const mo = b;
export const mr = (n) => n == 1 ? 'one'
    : (n == 2 || n == 3) ? 'two'
    : n == 4 ? 'few'
    : 'other';
export const ms = b;
export const my = a;
export const nb = a;
export const ne = (n) => {
  const s = String(n).split('.'), t0 = Number(s[0]) == n;
  return (t0 && n >= 1 && n <= 4) ? 'one' : 'other';
};
export const nl = a;
export const no = a;
export const or = (n) => {
  const s = String(n).split('.'), t0 = Number(s[0]) == n;
  return (n == 1 || n == 5 || (t0 && n >= 7 && n <= 9)) ? 'one'
    : (n == 2 || n == 3) ? 'two'
    : n == 4 ? 'few'
    : n == 6 ? 'many'
    : 'other';
};
export const pa = a;
export const pl = a;
export const prg = a;
export const ps = a;
export const pt = a;
export const ro = b;
export const ru = a;
export const sc = (n) => (n == 11 || n == 8 || n == 80 || n == 800) ? 'many' : 'other';
export const scn = (n) => (n == 11 || n == 8 || n == 80 || n == 800) ? 'many' : 'other';
export const sd = a;
export const sh = a;
export const si = a;
export const sk = a;
export const sl = a;
export const sq = (n) => {
  const s = String(n).split('.'), t0 = Number(s[0]) == n, n10 = t0 && s[0].slice(-1), n100 = t0 && s[0].slice(-2);
  return n == 1 ? 'one'
    : n10 == 4 && n100 != 14 ? 'many'
    : 'other';
};
export const sr = a;
export const sv = (n) => {
  const s = String(n).split('.'), t0 = Number(s[0]) == n, n10 = t0 && s[0].slice(-1), n100 = t0 && s[0].slice(-2);
  return (n10 == 1 || n10 == 2) && n100 != 11 && n100 != 12 ? 'one' : 'other';
};
export const sw = a;
export const ta = a;
export const te = a;
export const th = a;
export const tk = (n) => {
  const s = String(n).split('.'), t0 = Number(s[0]) == n, n10 = t0 && s[0].slice(-1);
  return (n10 == 6 || n10 == 9) || n == 10 ? 'few' : 'other';
};
export const tl = b;
export const tpi = a;
export const tr = a;
export const uk = (n) => {
  const s = String(n).split('.'), t0 = Number(s[0]) == n, n10 = t0 && s[0].slice(-1), n100 = t0 && s[0].slice(-2);
  return n10 == 3 && n100 != 13 ? 'few' : 'other';
};
export const und = a;
export const ur = a;
export const uz = a;
export const vec = (n) => (n == 11 || n == 8 || n == 80 || n == 800) ? 'many' : 'other';
export const vi = b;
export const yue = a;
export const zh = a;
export const zu = a;

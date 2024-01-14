const a = (n, ord) => {
  if (ord) return 'other';
  return n == 1 ? 'one' : 'other';
};
const b = (n, ord) => {
  if (ord) return 'other';
  return (n == 0 || n == 1) ? 'one' : 'other';
};
const c = (n, ord) => {
  if (ord) return 'other';
  return n >= 0 && n <= 1 ? 'one' : 'other';
};
const d = (n, ord) => {
  const s = String(n).split('.'), v0 = !s[1];
  if (ord) return 'other';
  return n == 1 && v0 ? 'one' : 'other';
};
const e = (n, ord) => 'other';
const f = (n, ord) => {
  if (ord) return 'other';
  return n == 1 ? 'one'
    : n == 2 ? 'two'
    : 'other';
};

export const af = a;
export const ak = b;
export const am = c;
export const an = a;
export const ar = (n, ord) => {
  const s = String(n).split('.'), t0 = Number(s[0]) == n, n100 = t0 && s[0].slice(-2);
  if (ord) return 'other';
  return n == 0 ? 'zero'
    : n == 1 ? 'one'
    : n == 2 ? 'two'
    : (n100 >= 3 && n100 <= 10) ? 'few'
    : (n100 >= 11 && n100 <= 99) ? 'many'
    : 'other';
};
export const ars = (n, ord) => {
  const s = String(n).split('.'), t0 = Number(s[0]) == n, n100 = t0 && s[0].slice(-2);
  if (ord) return 'other';
  return n == 0 ? 'zero'
    : n == 1 ? 'one'
    : n == 2 ? 'two'
    : (n100 >= 3 && n100 <= 10) ? 'few'
    : (n100 >= 11 && n100 <= 99) ? 'many'
    : 'other';
};
export const as = (n, ord) => {
  if (ord) return (n == 1 || n == 5 || n == 7 || n == 8 || n == 9 || n == 10) ? 'one'
    : (n == 2 || n == 3) ? 'two'
    : n == 4 ? 'few'
    : n == 6 ? 'many'
    : 'other';
  return n >= 0 && n <= 1 ? 'one' : 'other';
};
export const asa = a;
export const ast = d;
export const az = (n, ord) => {
  const s = String(n).split('.'), i = s[0], i10 = i.slice(-1), i100 = i.slice(-2), i1000 = i.slice(-3);
  if (ord) return (i10 == 1 || i10 == 2 || i10 == 5 || i10 == 7 || i10 == 8) || (i100 == 20 || i100 == 50 || i100 == 70 || i100 == 80) ? 'one'
    : (i10 == 3 || i10 == 4) || (i1000 == 100 || i1000 == 200 || i1000 == 300 || i1000 == 400 || i1000 == 500 || i1000 == 600 || i1000 == 700 || i1000 == 800 || i1000 == 900) ? 'few'
    : i == 0 || i10 == 6 || (i100 == 40 || i100 == 60 || i100 == 90) ? 'many'
    : 'other';
  return n == 1 ? 'one' : 'other';
};
export const bal = (n, ord) => n == 1 ? 'one' : 'other';
export const be = (n, ord) => {
  const s = String(n).split('.'), t0 = Number(s[0]) == n, n10 = t0 && s[0].slice(-1), n100 = t0 && s[0].slice(-2);
  if (ord) return (n10 == 2 || n10 == 3) && n100 != 12 && n100 != 13 ? 'few' : 'other';
  return n10 == 1 && n100 != 11 ? 'one'
    : (n10 >= 2 && n10 <= 4) && (n100 < 12 || n100 > 14) ? 'few'
    : t0 && n10 == 0 || (n10 >= 5 && n10 <= 9) || (n100 >= 11 && n100 <= 14) ? 'many'
    : 'other';
};
export const bem = a;
export const bez = a;
export const bg = a;
export const bho = b;
export const bm = e;
export const bn = (n, ord) => {
  if (ord) return (n == 1 || n == 5 || n == 7 || n == 8 || n == 9 || n == 10) ? 'one'
    : (n == 2 || n == 3) ? 'two'
    : n == 4 ? 'few'
    : n == 6 ? 'many'
    : 'other';
  return n >= 0 && n <= 1 ? 'one' : 'other';
};
export const bo = e;
export const br = (n, ord) => {
  const s = String(n).split('.'), t0 = Number(s[0]) == n, n10 = t0 && s[0].slice(-1), n100 = t0 && s[0].slice(-2), n1000000 = t0 && s[0].slice(-6);
  if (ord) return 'other';
  return n10 == 1 && n100 != 11 && n100 != 71 && n100 != 91 ? 'one'
    : n10 == 2 && n100 != 12 && n100 != 72 && n100 != 92 ? 'two'
    : ((n10 == 3 || n10 == 4) || n10 == 9) && (n100 < 10 || n100 > 19) && (n100 < 70 || n100 > 79) && (n100 < 90 || n100 > 99) ? 'few'
    : n != 0 && t0 && n1000000 == 0 ? 'many'
    : 'other';
};
export const brx = a;
export const bs = (n, ord) => {
  const s = String(n).split('.'), i = s[0], f = s[1] || '', v0 = !s[1], i10 = i.slice(-1), i100 = i.slice(-2), f10 = f.slice(-1), f100 = f.slice(-2);
  if (ord) return 'other';
  return v0 && i10 == 1 && i100 != 11 || f10 == 1 && f100 != 11 ? 'one'
    : v0 && (i10 >= 2 && i10 <= 4) && (i100 < 12 || i100 > 14) || (f10 >= 2 && f10 <= 4) && (f100 < 12 || f100 > 14) ? 'few'
    : 'other';
};
export const ca = (n, ord) => {
  const s = String(n).split('.'), i = s[0], v0 = !s[1], i1000000 = i.slice(-6);
  if (ord) return (n == 1 || n == 3) ? 'one'
    : n == 2 ? 'two'
    : n == 4 ? 'few'
    : 'other';
  return n == 1 && v0 ? 'one'
    : i != 0 && i1000000 == 0 && v0 ? 'many'
    : 'other';
};
export const ce = a;
export const ceb = (n, ord) => {
  const s = String(n).split('.'), i = s[0], f = s[1] || '', v0 = !s[1], i10 = i.slice(-1), f10 = f.slice(-1);
  if (ord) return 'other';
  return v0 && (i == 1 || i == 2 || i == 3) || v0 && i10 != 4 && i10 != 6 && i10 != 9 || !v0 && f10 != 4 && f10 != 6 && f10 != 9 ? 'one' : 'other';
};
export const cgg = a;
export const chr = a;
export const ckb = a;
export const cs = (n, ord) => {
  const s = String(n).split('.'), i = s[0], v0 = !s[1];
  if (ord) return 'other';
  return n == 1 && v0 ? 'one'
    : (i >= 2 && i <= 4) && v0 ? 'few'
    : !v0 ? 'many'
    : 'other';
};
export const cy = (n, ord) => {
  if (ord) return (n == 0 || n == 7 || n == 8 || n == 9) ? 'zero'
    : n == 1 ? 'one'
    : n == 2 ? 'two'
    : (n == 3 || n == 4) ? 'few'
    : (n == 5 || n == 6) ? 'many'
    : 'other';
  return n == 0 ? 'zero'
    : n == 1 ? 'one'
    : n == 2 ? 'two'
    : n == 3 ? 'few'
    : n == 6 ? 'many'
    : 'other';
};
export const da = (n, ord) => {
  const s = String(n).split('.'), i = s[0], t0 = Number(s[0]) == n;
  if (ord) return 'other';
  return n == 1 || !t0 && (i == 0 || i == 1) ? 'one' : 'other';
};
export const de = d;
export const doi = c;
export const dsb = (n, ord) => {
  const s = String(n).split('.'), i = s[0], f = s[1] || '', v0 = !s[1], i100 = i.slice(-2), f100 = f.slice(-2);
  if (ord) return 'other';
  return v0 && i100 == 1 || f100 == 1 ? 'one'
    : v0 && i100 == 2 || f100 == 2 ? 'two'
    : v0 && (i100 == 3 || i100 == 4) || (f100 == 3 || f100 == 4) ? 'few'
    : 'other';
};
export const dv = a;
export const dz = e;
export const ee = a;
export const el = a;
export const en = (n, ord) => {
  const s = String(n).split('.'), v0 = !s[1], t0 = Number(s[0]) == n, n10 = t0 && s[0].slice(-1), n100 = t0 && s[0].slice(-2);
  if (ord) return n10 == 1 && n100 != 11 ? 'one'
    : n10 == 2 && n100 != 12 ? 'two'
    : n10 == 3 && n100 != 13 ? 'few'
    : 'other';
  return n == 1 && v0 ? 'one' : 'other';
};
export const eo = a;
export const es = (n, ord) => {
  const s = String(n).split('.'), i = s[0], v0 = !s[1], i1000000 = i.slice(-6);
  if (ord) return 'other';
  return n == 1 ? 'one'
    : i != 0 && i1000000 == 0 && v0 ? 'many'
    : 'other';
};
export const et = d;
export const eu = a;
export const fa = c;
export const ff = (n, ord) => {
  if (ord) return 'other';
  return n >= 0 && n < 2 ? 'one' : 'other';
};
export const fi = d;
export const fil = (n, ord) => {
  const s = String(n).split('.'), i = s[0], f = s[1] || '', v0 = !s[1], i10 = i.slice(-1), f10 = f.slice(-1);
  if (ord) return n == 1 ? 'one' : 'other';
  return v0 && (i == 1 || i == 2 || i == 3) || v0 && i10 != 4 && i10 != 6 && i10 != 9 || !v0 && f10 != 4 && f10 != 6 && f10 != 9 ? 'one' : 'other';
};
export const fo = a;
export const fr = (n, ord) => {
  const s = String(n).split('.'), i = s[0], v0 = !s[1], i1000000 = i.slice(-6);
  if (ord) return n == 1 ? 'one' : 'other';
  return n >= 0 && n < 2 ? 'one'
    : i != 0 && i1000000 == 0 && v0 ? 'many'
    : 'other';
};
export const fur = a;
export const fy = d;
export const ga = (n, ord) => {
  const s = String(n).split('.'), t0 = Number(s[0]) == n;
  if (ord) return n == 1 ? 'one' : 'other';
  return n == 1 ? 'one'
    : n == 2 ? 'two'
    : (t0 && n >= 3 && n <= 6) ? 'few'
    : (t0 && n >= 7 && n <= 10) ? 'many'
    : 'other';
};
export const gd = (n, ord) => {
  const s = String(n).split('.'), t0 = Number(s[0]) == n;
  if (ord) return (n == 1 || n == 11) ? 'one'
    : (n == 2 || n == 12) ? 'two'
    : (n == 3 || n == 13) ? 'few'
    : 'other';
  return (n == 1 || n == 11) ? 'one'
    : (n == 2 || n == 12) ? 'two'
    : ((t0 && n >= 3 && n <= 10) || (t0 && n >= 13 && n <= 19)) ? 'few'
    : 'other';
};
export const gl = d;
export const gsw = a;
export const gu = (n, ord) => {
  if (ord) return n == 1 ? 'one'
    : (n == 2 || n == 3) ? 'two'
    : n == 4 ? 'few'
    : n == 6 ? 'many'
    : 'other';
  return n >= 0 && n <= 1 ? 'one' : 'other';
};
export const guw = b;
export const gv = (n, ord) => {
  const s = String(n).split('.'), i = s[0], v0 = !s[1], i10 = i.slice(-1), i100 = i.slice(-2);
  if (ord) return 'other';
  return v0 && i10 == 1 ? 'one'
    : v0 && i10 == 2 ? 'two'
    : v0 && (i100 == 0 || i100 == 20 || i100 == 40 || i100 == 60 || i100 == 80) ? 'few'
    : !v0 ? 'many'
    : 'other';
};
export const ha = a;
export const haw = a;
export const he = (n, ord) => {
  const s = String(n).split('.'), i = s[0], v0 = !s[1];
  if (ord) return 'other';
  return i == 1 && v0 || i == 0 && !v0 ? 'one'
    : i == 2 && v0 ? 'two'
    : 'other';
};
export const hi = (n, ord) => {
  if (ord) return n == 1 ? 'one'
    : (n == 2 || n == 3) ? 'two'
    : n == 4 ? 'few'
    : n == 6 ? 'many'
    : 'other';
  return n >= 0 && n <= 1 ? 'one' : 'other';
};
export const hnj = e;
export const hr = (n, ord) => {
  const s = String(n).split('.'), i = s[0], f = s[1] || '', v0 = !s[1], i10 = i.slice(-1), i100 = i.slice(-2), f10 = f.slice(-1), f100 = f.slice(-2);
  if (ord) return 'other';
  return v0 && i10 == 1 && i100 != 11 || f10 == 1 && f100 != 11 ? 'one'
    : v0 && (i10 >= 2 && i10 <= 4) && (i100 < 12 || i100 > 14) || (f10 >= 2 && f10 <= 4) && (f100 < 12 || f100 > 14) ? 'few'
    : 'other';
};
export const hsb = (n, ord) => {
  const s = String(n).split('.'), i = s[0], f = s[1] || '', v0 = !s[1], i100 = i.slice(-2), f100 = f.slice(-2);
  if (ord) return 'other';
  return v0 && i100 == 1 || f100 == 1 ? 'one'
    : v0 && i100 == 2 || f100 == 2 ? 'two'
    : v0 && (i100 == 3 || i100 == 4) || (f100 == 3 || f100 == 4) ? 'few'
    : 'other';
};
export const hu = (n, ord) => {
  if (ord) return (n == 1 || n == 5) ? 'one' : 'other';
  return n == 1 ? 'one' : 'other';
};
export const hy = (n, ord) => {
  if (ord) return n == 1 ? 'one' : 'other';
  return n >= 0 && n < 2 ? 'one' : 'other';
};
export const ia = d;
export const id = e;
export const ig = e;
export const ii = e;
export const io = d;
export const is = (n, ord) => {
  const s = String(n).split('.'), i = s[0], t = (s[1] || '').replace(/0+$/, ''), t0 = Number(s[0]) == n, i10 = i.slice(-1), i100 = i.slice(-2);
  if (ord) return 'other';
  return t0 && i10 == 1 && i100 != 11 || t % 10 == 1 && t % 100 != 11 ? 'one' : 'other';
};
export const it = (n, ord) => {
  const s = String(n).split('.'), i = s[0], v0 = !s[1], i1000000 = i.slice(-6);
  if (ord) return (n == 11 || n == 8 || n == 80 || n == 800) ? 'many' : 'other';
  return n == 1 && v0 ? 'one'
    : i != 0 && i1000000 == 0 && v0 ? 'many'
    : 'other';
};
export const iu = f;
export const ja = e;
export const jbo = e;
export const jgo = a;
export const jmc = a;
export const jv = e;
export const jw = e;
export const ka = (n, ord) => {
  const s = String(n).split('.'), i = s[0], i100 = i.slice(-2);
  if (ord) return i == 1 ? 'one'
    : i == 0 || ((i100 >= 2 && i100 <= 20) || i100 == 40 || i100 == 60 || i100 == 80) ? 'many'
    : 'other';
  return n == 1 ? 'one' : 'other';
};
export const kab = (n, ord) => {
  if (ord) return 'other';
  return n >= 0 && n < 2 ? 'one' : 'other';
};
export const kaj = a;
export const kcg = a;
export const kde = e;
export const kea = e;
export const kk = (n, ord) => {
  const s = String(n).split('.'), t0 = Number(s[0]) == n, n10 = t0 && s[0].slice(-1);
  if (ord) return n10 == 6 || n10 == 9 || t0 && n10 == 0 && n != 0 ? 'many' : 'other';
  return n == 1 ? 'one' : 'other';
};
export const kkj = a;
export const kl = a;
export const km = e;
export const kn = c;
export const ko = e;
export const ks = a;
export const ksb = a;
export const ksh = (n, ord) => {
  if (ord) return 'other';
  return n == 0 ? 'zero'
    : n == 1 ? 'one'
    : 'other';
};
export const ku = a;
export const kw = (n, ord) => {
  const s = String(n).split('.'), t0 = Number(s[0]) == n, n100 = t0 && s[0].slice(-2), n1000 = t0 && s[0].slice(-3), n100000 = t0 && s[0].slice(-5), n1000000 = t0 && s[0].slice(-6);
  if (ord) return (t0 && n >= 1 && n <= 4) || ((n100 >= 1 && n100 <= 4) || (n100 >= 21 && n100 <= 24) || (n100 >= 41 && n100 <= 44) || (n100 >= 61 && n100 <= 64) || (n100 >= 81 && n100 <= 84)) ? 'one'
    : n == 5 || n100 == 5 ? 'many'
    : 'other';
  return n == 0 ? 'zero'
    : n == 1 ? 'one'
    : (n100 == 2 || n100 == 22 || n100 == 42 || n100 == 62 || n100 == 82) || t0 && n1000 == 0 && ((n100000 >= 1000 && n100000 <= 20000) || n100000 == 40000 || n100000 == 60000 || n100000 == 80000) || n != 0 && n1000000 == 100000 ? 'two'
    : (n100 == 3 || n100 == 23 || n100 == 43 || n100 == 63 || n100 == 83) ? 'few'
    : n != 1 && (n100 == 1 || n100 == 21 || n100 == 41 || n100 == 61 || n100 == 81) ? 'many'
    : 'other';
};
export const ky = a;
export const lag = (n, ord) => {
  const s = String(n).split('.'), i = s[0];
  if (ord) return 'other';
  return n == 0 ? 'zero'
    : (i == 0 || i == 1) && n != 0 ? 'one'
    : 'other';
};
export const lb = a;
export const lg = a;
export const lij = (n, ord) => {
  const s = String(n).split('.'), v0 = !s[1], t0 = Number(s[0]) == n;
  if (ord) return (n == 11 || n == 8 || (t0 && n >= 80 && n <= 89) || (t0 && n >= 800 && n <= 899)) ? 'many' : 'other';
  return n == 1 && v0 ? 'one' : 'other';
};
export const lkt = e;
export const ln = b;
export const lo = (n, ord) => {
  if (ord) return n == 1 ? 'one' : 'other';
  return 'other';
};
export const lt = (n, ord) => {
  const s = String(n).split('.'), f = s[1] || '', t0 = Number(s[0]) == n, n10 = t0 && s[0].slice(-1), n100 = t0 && s[0].slice(-2);
  if (ord) return 'other';
  return n10 == 1 && (n100 < 11 || n100 > 19) ? 'one'
    : (n10 >= 2 && n10 <= 9) && (n100 < 11 || n100 > 19) ? 'few'
    : f != 0 ? 'many'
    : 'other';
};
export const lv = (n, ord) => {
  const s = String(n).split('.'), f = s[1] || '', v = f.length, t0 = Number(s[0]) == n, n10 = t0 && s[0].slice(-1), n100 = t0 && s[0].slice(-2), f100 = f.slice(-2), f10 = f.slice(-1);
  if (ord) return 'other';
  return t0 && n10 == 0 || (n100 >= 11 && n100 <= 19) || v == 2 && (f100 >= 11 && f100 <= 19) ? 'zero'
    : n10 == 1 && n100 != 11 || v == 2 && f10 == 1 && f100 != 11 || v != 2 && f10 == 1 ? 'one'
    : 'other';
};
export const mas = a;
export const mg = b;
export const mgo = a;
export const mk = (n, ord) => {
  const s = String(n).split('.'), i = s[0], f = s[1] || '', v0 = !s[1], i10 = i.slice(-1), i100 = i.slice(-2), f10 = f.slice(-1), f100 = f.slice(-2);
  if (ord) return i10 == 1 && i100 != 11 ? 'one'
    : i10 == 2 && i100 != 12 ? 'two'
    : (i10 == 7 || i10 == 8) && i100 != 17 && i100 != 18 ? 'many'
    : 'other';
  return v0 && i10 == 1 && i100 != 11 || f10 == 1 && f100 != 11 ? 'one' : 'other';
};
export const ml = a;
export const mn = a;
export const mo = (n, ord) => {
  const s = String(n).split('.'), v0 = !s[1], t0 = Number(s[0]) == n, n100 = t0 && s[0].slice(-2);
  if (ord) return n == 1 ? 'one' : 'other';
  return n == 1 && v0 ? 'one'
    : !v0 || n == 0 || n != 1 && (n100 >= 1 && n100 <= 19) ? 'few'
    : 'other';
};
export const mr = (n, ord) => {
  if (ord) return n == 1 ? 'one'
    : (n == 2 || n == 3) ? 'two'
    : n == 4 ? 'few'
    : 'other';
  return n == 1 ? 'one' : 'other';
};
export const ms = (n, ord) => {
  if (ord) return n == 1 ? 'one' : 'other';
  return 'other';
};
export const mt = (n, ord) => {
  const s = String(n).split('.'), t0 = Number(s[0]) == n, n100 = t0 && s[0].slice(-2);
  if (ord) return 'other';
  return n == 1 ? 'one'
    : n == 2 ? 'two'
    : n == 0 || (n100 >= 3 && n100 <= 10) ? 'few'
    : (n100 >= 11 && n100 <= 19) ? 'many'
    : 'other';
};
export const my = e;
export const nah = a;
export const naq = f;
export const nb = a;
export const nd = a;
export const ne = (n, ord) => {
  const s = String(n).split('.'), t0 = Number(s[0]) == n;
  if (ord) return (t0 && n >= 1 && n <= 4) ? 'one' : 'other';
  return n == 1 ? 'one' : 'other';
};
export const nl = d;
export const nn = a;
export const nnh = a;
export const no = a;
export const nqo = e;
export const nr = a;
export const nso = b;
export const ny = a;
export const nyn = a;
export const om = a;
export const or = (n, ord) => {
  const s = String(n).split('.'), t0 = Number(s[0]) == n;
  if (ord) return (n == 1 || n == 5 || (t0 && n >= 7 && n <= 9)) ? 'one'
    : (n == 2 || n == 3) ? 'two'
    : n == 4 ? 'few'
    : n == 6 ? 'many'
    : 'other';
  return n == 1 ? 'one' : 'other';
};
export const os = a;
export const osa = e;
export const pa = b;
export const pap = a;
export const pcm = c;
export const pl = (n, ord) => {
  const s = String(n).split('.'), i = s[0], v0 = !s[1], i10 = i.slice(-1), i100 = i.slice(-2);
  if (ord) return 'other';
  return n == 1 && v0 ? 'one'
    : v0 && (i10 >= 2 && i10 <= 4) && (i100 < 12 || i100 > 14) ? 'few'
    : v0 && i != 1 && (i10 == 0 || i10 == 1) || v0 && (i10 >= 5 && i10 <= 9) || v0 && (i100 >= 12 && i100 <= 14) ? 'many'
    : 'other';
};
export const prg = (n, ord) => {
  const s = String(n).split('.'), f = s[1] || '', v = f.length, t0 = Number(s[0]) == n, n10 = t0 && s[0].slice(-1), n100 = t0 && s[0].slice(-2), f100 = f.slice(-2), f10 = f.slice(-1);
  if (ord) return 'other';
  return t0 && n10 == 0 || (n100 >= 11 && n100 <= 19) || v == 2 && (f100 >= 11 && f100 <= 19) ? 'zero'
    : n10 == 1 && n100 != 11 || v == 2 && f10 == 1 && f100 != 11 || v != 2 && f10 == 1 ? 'one'
    : 'other';
};
export const ps = a;
export const pt = (n, ord) => {
  const s = String(n).split('.'), i = s[0], v0 = !s[1], i1000000 = i.slice(-6);
  if (ord) return 'other';
  return (i == 0 || i == 1) ? 'one'
    : i != 0 && i1000000 == 0 && v0 ? 'many'
    : 'other';
};
export const pt_PT = (n, ord) => {
  const s = String(n).split('.'), i = s[0], v0 = !s[1], i1000000 = i.slice(-6);
  if (ord) return 'other';
  return n == 1 && v0 ? 'one'
    : i != 0 && i1000000 == 0 && v0 ? 'many'
    : 'other';
};
export const rm = a;
export const ro = (n, ord) => {
  const s = String(n).split('.'), v0 = !s[1], t0 = Number(s[0]) == n, n100 = t0 && s[0].slice(-2);
  if (ord) return n == 1 ? 'one' : 'other';
  return n == 1 && v0 ? 'one'
    : !v0 || n == 0 || n != 1 && (n100 >= 1 && n100 <= 19) ? 'few'
    : 'other';
};
export const rof = a;
export const ru = (n, ord) => {
  const s = String(n).split('.'), i = s[0], v0 = !s[1], i10 = i.slice(-1), i100 = i.slice(-2);
  if (ord) return 'other';
  return v0 && i10 == 1 && i100 != 11 ? 'one'
    : v0 && (i10 >= 2 && i10 <= 4) && (i100 < 12 || i100 > 14) ? 'few'
    : v0 && i10 == 0 || v0 && (i10 >= 5 && i10 <= 9) || v0 && (i100 >= 11 && i100 <= 14) ? 'many'
    : 'other';
};
export const rwk = a;
export const sah = e;
export const saq = a;
export const sat = f;
export const sc = (n, ord) => {
  const s = String(n).split('.'), v0 = !s[1];
  if (ord) return (n == 11 || n == 8 || n == 80 || n == 800) ? 'many' : 'other';
  return n == 1 && v0 ? 'one' : 'other';
};
export const scn = (n, ord) => {
  const s = String(n).split('.'), v0 = !s[1];
  if (ord) return (n == 11 || n == 8 || n == 80 || n == 800) ? 'many' : 'other';
  return n == 1 && v0 ? 'one' : 'other';
};
export const sd = a;
export const sdh = a;
export const se = f;
export const seh = a;
export const ses = e;
export const sg = e;
export const sh = (n, ord) => {
  const s = String(n).split('.'), i = s[0], f = s[1] || '', v0 = !s[1], i10 = i.slice(-1), i100 = i.slice(-2), f10 = f.slice(-1), f100 = f.slice(-2);
  if (ord) return 'other';
  return v0 && i10 == 1 && i100 != 11 || f10 == 1 && f100 != 11 ? 'one'
    : v0 && (i10 >= 2 && i10 <= 4) && (i100 < 12 || i100 > 14) || (f10 >= 2 && f10 <= 4) && (f100 < 12 || f100 > 14) ? 'few'
    : 'other';
};
export const shi = (n, ord) => {
  const s = String(n).split('.'), t0 = Number(s[0]) == n;
  if (ord) return 'other';
  return n >= 0 && n <= 1 ? 'one'
    : (t0 && n >= 2 && n <= 10) ? 'few'
    : 'other';
};
export const si = (n, ord) => {
  const s = String(n).split('.'), i = s[0], f = s[1] || '';
  if (ord) return 'other';
  return (n == 0 || n == 1) || i == 0 && f == 1 ? 'one' : 'other';
};
export const sk = (n, ord) => {
  const s = String(n).split('.'), i = s[0], v0 = !s[1];
  if (ord) return 'other';
  return n == 1 && v0 ? 'one'
    : (i >= 2 && i <= 4) && v0 ? 'few'
    : !v0 ? 'many'
    : 'other';
};
export const sl = (n, ord) => {
  const s = String(n).split('.'), i = s[0], v0 = !s[1], i100 = i.slice(-2);
  if (ord) return 'other';
  return v0 && i100 == 1 ? 'one'
    : v0 && i100 == 2 ? 'two'
    : v0 && (i100 == 3 || i100 == 4) || !v0 ? 'few'
    : 'other';
};
export const sma = f;
export const smi = f;
export const smj = f;
export const smn = f;
export const sms = f;
export const sn = a;
export const so = a;
export const sq = (n, ord) => {
  const s = String(n).split('.'), t0 = Number(s[0]) == n, n10 = t0 && s[0].slice(-1), n100 = t0 && s[0].slice(-2);
  if (ord) return n == 1 ? 'one'
    : n10 == 4 && n100 != 14 ? 'many'
    : 'other';
  return n == 1 ? 'one' : 'other';
};
export const sr = (n, ord) => {
  const s = String(n).split('.'), i = s[0], f = s[1] || '', v0 = !s[1], i10 = i.slice(-1), i100 = i.slice(-2), f10 = f.slice(-1), f100 = f.slice(-2);
  if (ord) return 'other';
  return v0 && i10 == 1 && i100 != 11 || f10 == 1 && f100 != 11 ? 'one'
    : v0 && (i10 >= 2 && i10 <= 4) && (i100 < 12 || i100 > 14) || (f10 >= 2 && f10 <= 4) && (f100 < 12 || f100 > 14) ? 'few'
    : 'other';
};
export const ss = a;
export const ssy = a;
export const st = a;
export const su = e;
export const sv = (n, ord) => {
  const s = String(n).split('.'), v0 = !s[1], t0 = Number(s[0]) == n, n10 = t0 && s[0].slice(-1), n100 = t0 && s[0].slice(-2);
  if (ord) return (n10 == 1 || n10 == 2) && n100 != 11 && n100 != 12 ? 'one' : 'other';
  return n == 1 && v0 ? 'one' : 'other';
};
export const sw = d;
export const syr = a;
export const ta = a;
export const te = a;
export const teo = a;
export const th = e;
export const ti = b;
export const tig = a;
export const tk = (n, ord) => {
  const s = String(n).split('.'), t0 = Number(s[0]) == n, n10 = t0 && s[0].slice(-1);
  if (ord) return (n10 == 6 || n10 == 9) || n == 10 ? 'few' : 'other';
  return n == 1 ? 'one' : 'other';
};
export const tl = (n, ord) => {
  const s = String(n).split('.'), i = s[0], f = s[1] || '', v0 = !s[1], i10 = i.slice(-1), f10 = f.slice(-1);
  if (ord) return n == 1 ? 'one' : 'other';
  return v0 && (i == 1 || i == 2 || i == 3) || v0 && i10 != 4 && i10 != 6 && i10 != 9 || !v0 && f10 != 4 && f10 != 6 && f10 != 9 ? 'one' : 'other';
};
export const tn = a;
export const to = e;
export const tpi = e;
export const tr = a;
export const ts = a;
export const tzm = (n, ord) => {
  const s = String(n).split('.'), t0 = Number(s[0]) == n;
  if (ord) return 'other';
  return (n == 0 || n == 1) || (t0 && n >= 11 && n <= 99) ? 'one' : 'other';
};
export const ug = a;
export const uk = (n, ord) => {
  const s = String(n).split('.'), i = s[0], v0 = !s[1], t0 = Number(s[0]) == n, n10 = t0 && s[0].slice(-1), n100 = t0 && s[0].slice(-2), i10 = i.slice(-1), i100 = i.slice(-2);
  if (ord) return n10 == 3 && n100 != 13 ? 'few' : 'other';
  return v0 && i10 == 1 && i100 != 11 ? 'one'
    : v0 && (i10 >= 2 && i10 <= 4) && (i100 < 12 || i100 > 14) ? 'few'
    : v0 && i10 == 0 || v0 && (i10 >= 5 && i10 <= 9) || v0 && (i100 >= 11 && i100 <= 14) ? 'many'
    : 'other';
};
export const und = e;
export const ur = d;
export const uz = a;
export const ve = a;
export const vec = (n, ord) => {
  const s = String(n).split('.'), i = s[0], v0 = !s[1], i1000000 = i.slice(-6);
  if (ord) return (n == 11 || n == 8 || n == 80 || n == 800) ? 'many' : 'other';
  return n == 1 && v0 ? 'one'
    : i != 0 && i1000000 == 0 && v0 ? 'many'
    : 'other';
};
export const vi = (n, ord) => {
  if (ord) return n == 1 ? 'one' : 'other';
  return 'other';
};
export const vo = a;
export const vun = a;
export const wa = b;
export const wae = a;
export const wo = e;
export const xh = a;
export const xog = a;
export const yi = d;
export const yo = e;
export const yue = e;
export const zh = e;
export const zu = c;

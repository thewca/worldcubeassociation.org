# Cubing Icons and Fonts

[![Deploy to GitHub Pages](https://github.com/cubing/icons/actions/workflows/deploy.yml/badge.svg)](https://github.com/cubing/icons/actions/workflows/deploy.yml)

## Demo
<https://icons.cubing.net>

## Rebuild fonts and cubing-icons.css

We use the excellent [gulp-iconfont](https://www.npmjs.com/package/gulp-iconfont).

- `npm install`
- Install [potrace](http://potrace.sourceforge.net/).
- `npm run build` or `npm run watch` - Open `www/index.html` in your web browser.

## Releasing

### Bump version and deploy to npmjs

```
npm version major|minor|patch -m "Upgrade to %s for reasons"
```

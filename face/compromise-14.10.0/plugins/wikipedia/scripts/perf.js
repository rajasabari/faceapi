/* eslint-disable no-console, no-unused-vars */
import corpus from 'nlp-corpus'
import nlp from '../../../src/one.js'
import plugin from '../src/plugin.js'
nlp.extend(plugin)

const n = 30000
console.log(` -- processing ${n.toLocaleString()} sentences-`)
let docs = corpus.all().slice(30000, n + 30000)

const percent = (part, total) => {
  let num = (part / total) * 100;
  num = Math.round(num * 10) / 10;
  return num;
};

let found = {}
let matches = 0

docs.forEach(str => {
  let doc = nlp(str)
  let res = doc.wikipedia().json({ normal: true })
  res.forEach(o => {
    if (o.normal === 'discovery' || o.normal === 'a level') {
      console.log(str)
    }
    found[o.normal] = found[o.normal] || 0
    found[o.normal] += 1
    matches += 1
  })
})
// sort by freq
found = Object.keys(found).map(k => [k, found[k]])
found = found.sort((a, b) => (a[1] > b[1] ? -1 : 0))
found = found.slice(0, 400)


console.log(JSON.stringify(found, null, 2))
console.log(`found ${matches.toLocaleString()} matches in ${n} sentences`)
console.log(percent(matches, n) + '%')
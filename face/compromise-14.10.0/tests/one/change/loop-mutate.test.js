import test from 'tape'
import nlp from '../_lib.js'
const here = '[one/loop-mutate] '

test('foreach replace', function (t) {
  let doc = nlp('guns and roses')
  doc.match('guns').forEach(p => {
    p.replaceWith('flowers')
  })
  t.equal(doc.text(), 'flowers and roses', here+'simple loop-replace')

  doc = nlp('guns and roses. roses and guns')
  doc.match('guns').forEach(p => {
    p.replaceWith('flowers')
  })
  t.equal(doc.text(), 'flowers and roses. roses and flowers', here+'two loop-replacements')

  doc = nlp('guns and roses')
  doc.match('guns').forEach(p => {
    p.replaceWith('flowers, kittens')
  })
  t.equal(doc.text(), 'flowers, kittens and roses', here+'loop-replace-grow')

  doc = nlp('guns, bombs, and roses')
  doc.match('guns bombs').forEach(p => {
    p.replaceWith('flowers')
  })
  t.equal(doc.text(), 'flowers, and roses', here+'loop-replace-shrink')

  doc = nlp('the end')
  doc.match('end').forEach(p => {
    p.replaceWith('more words')
  })
  t.equal(doc.text(), 'the more words', here+'loop-replace-expand-end')

  t.end()
})

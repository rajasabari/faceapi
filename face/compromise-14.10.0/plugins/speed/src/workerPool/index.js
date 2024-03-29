import rip from './rip.js'
import makePool from './pool/create.js'
import os from 'os'
const cpuCount = os.cpus().length
let workerCount = cpuCount

const workerPool = function (txt, reg) {
  let nlp = this
  if (typeof reg === 'string') {
    reg = nlp.parseMatch(reg)
  }

  let workers = makePool(workerCount, reg)
  let parts = rip(txt, workerCount)
  // console.log(parts.length)
  let results = []
  let isRunning = workers.map(_ => true)// eslint-disable-line

  // workers.foreach
  workers.forEach((worker, i) => {
    worker.postMessage({ type: 'work', work: parts[i] || [] })
  })

  return new Promise((resolve) => {
    // setup listeners
    workers.forEach(worker => {
      worker.on('message', (msg) => {
        if (msg.type === 'match') {
          msg.match.forEach(m => {
            results.push(m)
          })
        }
        if (msg.type === 'drained') {
          let index = msg.status.workerIndex
          isRunning[index] = false
          // console.log(index, 'drained')
          if (isRunning.every(b => b === false)) {
            let doc = nlp('')
            doc.document = results
            workers.forEach(w => w.terminate())
            // console.log('done!')
            resolve(doc)
          }
        }
      })
    })
  })
}
export default workerPool


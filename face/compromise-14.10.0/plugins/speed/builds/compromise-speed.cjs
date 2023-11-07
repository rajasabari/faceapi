(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('fs'), require('path'), require('url'), require('worker_threads'), require('os')) :
  typeof define === 'function' && define.amd ? define(['exports', 'fs', 'path', 'url', 'worker_threads', 'os'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.compromiseSpeed = {}, global.fs, global.path, global.url, global.worker_threads, global.os));
})(this, (function (exports, fs, path, url, worker_threads, os) { 'use strict';

  function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

  function _interopNamespace(e) {
    if (e && e.__esModule) return e;
    var n = Object.create(null);
    if (e) {
      Object.keys(e).forEach(function (k) {
        if (k !== 'default') {
          var d = Object.getOwnPropertyDescriptor(e, k);
          Object.defineProperty(n, k, d.get ? d : {
            enumerable: true,
            get: function () { return e[k]; }
          });
        }
      });
    }
    n["default"] = e;
    return Object.freeze(n);
  }

  var fs__namespace = /*#__PURE__*/_interopNamespace(fs);
  var path__default = /*#__PURE__*/_interopDefaultLegacy(path);
  var os__default = /*#__PURE__*/_interopDefaultLegacy(os);

  const streamFile = function (path, fn, opts = {}) {
    const nlp = this;
    let world = nlp.world();
    const splitSentences = nlp.methods().one.tokenize.splitSentences;
    const s = fs__namespace.createReadStream(path, opts);

    let txt = '';
    let res = [];

    const doIt = (str) => {
      let doc = nlp(str);
      let m = fn(doc);
      if (m && m.found) {
        m.docs.forEach(l => res.push(l));
      }
    };

    const quickSplit = function (str) {
      let end = txt.substring(str.length - 300);
      let arr = splitSentences(end, world);
      let last = arr[arr.length - 1];
      let main = str.substr(0, str.length - last.length);
      return [main, last]
    };


    return new Promise((resolve, reject) => {
      s.on('data', function (chunk) {
        txt += chunk;
        let [main, end] = quickSplit(txt);
        doIt(main);
        txt = end;
      });
      s.on('end', function () {
        doIt(txt);// do dangling one
        // construct document of only results
        let doc = nlp('');
        doc.document = res;
        resolve(doc);
      });
      s.on('error', function (err) {
        console.error(err.stack); // eslint-disable-line
        reject(err);
      });
    })


  };

  var streamFile$1 = {
    lib: {
      streamFile
    }
  };

  let sentenceCache = {};

  /** memoize tagger per-sentence */
  const keyPress = function (text, lex, opts = {}) {
    const nlp = this;
    const splitSentences = this.methods().one.tokenize.splitSentences;
    let arr = splitSentences(text, this.world());

    let list = [];
    arr.forEach(str => {
      //do we already have it parsed?
      if (sentenceCache.hasOwnProperty(str) === true) {
        //use the cache
        list.push(sentenceCache[str].data);
        sentenceCache[str].used = true;
        // console.log('used cache: ', str, '\n')
      } else {
        //otherwise, parse it!
        if (opts.verbose) {
          console.log(`parsing: '${str}'\n`);//eslint-disable-line
        }
        let json = nlp(str, lex).json(0);
        //cache it
        sentenceCache[str] = {
          data: json,
          used: true,
        };
        list.push(json);
      }
    });
    // delete any unused cache
    Object.keys(sentenceCache).forEach(k => {
      if (sentenceCache[k].used !== true) {
        delete sentenceCache[k];
      } else {
        sentenceCache[k].used = null;
      }
    });
    if (opts.verbose) {
      console.log(`${Object.keys(sentenceCache).length}' sentences in cache\n`);//eslint-disable-line
    }
    return nlp(list)
  };

  var keyPress$1 = {
    lib: {
      keyPress
    }
  };

  let methods$o = {
    one: {},
    two: {},
    three: {},
    four: {},
  };

  let model$7 = {
    one: {},
    two: {},
    three: {},
  };
  let compute$d = {};
  let hooks = [];

  var tmpWrld = { methods: methods$o, model: model$7, compute: compute$d, hooks };

  const isArray$9 = input => Object.prototype.toString.call(input) === '[object Array]';

  const fns$5 = {
    /** add metadata to term objects */
    compute: function (input) {
      const { world } = this;
      const compute = world.compute;
      // do one method
      if (typeof input === 'string' && compute.hasOwnProperty(input)) {
        compute[input](this);
      }
      // allow a list of methods
      else if (isArray$9(input)) {
        input.forEach(name => {
          if (world.compute.hasOwnProperty(name)) {
            compute[name](this);
          } else {
            console.warn('no compute:', input); // eslint-disable-line
          }
        });
      }
      // allow a custom compute function
      else if (typeof input === 'function') {
        input(this);
      } else {
        console.warn('no compute:', input); // eslint-disable-line
      }
      return this
    },
  };
  var compute$c = fns$5;

  // wrappers for loops in javascript arrays

  const forEach = function (cb) {
    let ptrs = this.fullPointer;
    ptrs.forEach((ptr, i) => {
      let view = this.update([ptr]);
      cb(view, i);
    });
    return this
  };

  const map = function (cb, empty) {
    let ptrs = this.fullPointer;
    let res = ptrs.map((ptr, i) => {
      let view = this.update([ptr]);
      let out = cb(view, i);
      // if we returned nothing, return a view
      if (out === undefined) {
        return this.none()
      }
      return out
    });
    if (res.length === 0) {
      return empty || this.update([])
    }
    // return an array of values, or View objects?
    // user can return either from their callback
    if (res[0] !== undefined) {
      // array of strings
      if (typeof res[0] === 'string') {
        return res
      }
      // array of objects
      if (typeof res[0] === 'object' && (res[0] === null || !res[0].isView)) {
        return res
      }
    }
    // return a View object
    let all = [];
    res.forEach(ptr => {
      all = all.concat(ptr.fullPointer);
    });
    return this.toView(all)
  };

  const filter = function (cb) {
    let ptrs = this.fullPointer;
    ptrs = ptrs.filter((ptr, i) => {
      let view = this.update([ptr]);
      return cb(view, i)
    });
    let res = this.update(ptrs);
    return res
  };

  const find$c = function (cb) {
    let ptrs = this.fullPointer;
    let found = ptrs.find((ptr, i) => {
      let view = this.update([ptr]);
      return cb(view, i)
    });
    return this.update([found])
  };

  const some = function (cb) {
    let ptrs = this.fullPointer;
    return ptrs.some((ptr, i) => {
      let view = this.update([ptr]);
      return cb(view, i)
    })
  };

  const random = function (n = 1) {
    let ptrs = this.fullPointer;
    let r = Math.floor(Math.random() * ptrs.length);
    //prevent it from going over the end
    if (r + n > this.length) {
      r = this.length - n;
      r = r < 0 ? 0 : r;
    }
    ptrs = ptrs.slice(r, r + n);
    return this.update(ptrs)
  };
  var loops = { forEach, map, filter, find: find$c, some, random };

  const utils = {
    /** */
    termList: function () {
      return this.methods.one.termList(this.docs)
    },
    /** return individual terms*/
    terms: function (n) {
      let m = this.match('.');
      // this is a bit faster than .match('.') 
      // let ptrs = []
      // this.docs.forEach((terms) => {
      //   terms.forEach((term) => {
      //     let [y, x] = term.index || []
      //     ptrs.push([y, x, x + 1])
      //   })
      // })
      // let m = this.update(ptrs)
      return typeof n === 'number' ? m.eq(n) : m
    },

    /** */
    groups: function (group) {
      if (group || group === 0) {
        return this.update(this._groups[group] || [])
      }
      // return an object of Views
      let res = {};
      Object.keys(this._groups).forEach(k => {
        res[k] = this.update(this._groups[k]);
      });
      // this._groups = null
      return res
    },
    /** */
    eq: function (n) {
      let ptr = this.pointer;
      if (!ptr) {
        ptr = this.docs.map((_doc, i) => [i]);
      }
      if (ptr[n]) {
        return this.update([ptr[n]])
      }
      return this.none()
    },
    /** */
    first: function () {
      return this.eq(0)
    },
    /** */
    last: function () {
      let n = this.fullPointer.length - 1;
      return this.eq(n)
    },

    /** grab term[0] for every match */
    firstTerms: function () {
      return this.match('^.')
    },

    /** grab the last term for every match  */
    lastTerms: function () {
      return this.match('.$')
    },

    /** */
    slice: function (min, max) {
      let pntrs = this.pointer || this.docs.map((_o, n) => [n]);
      pntrs = pntrs.slice(min, max);
      return this.update(pntrs)
    },

    /** return a view of the entire document */
    all: function () {
      return this.update().toView()
    },
    /**  */
    fullSentences: function () {
      let ptrs = this.fullPointer.map(a => [a[0]]); //lazy!
      return this.update(ptrs).toView()
    },
    /** return a view of no parts of the document */
    none: function () {
      return this.update([])
    },

    /** are these two views looking at the same words? */
    isDoc: function (b) {
      if (!b || !b.isView) {
        return false
      }
      let aPtr = this.fullPointer;
      let bPtr = b.fullPointer;
      if (!aPtr.length === bPtr.length) {
        return false
      }
      // ensure pointers are the same
      return aPtr.every((ptr, i) => {
        if (!bPtr[i]) {
          return false
        }
        // ensure [n, start, end] are all the same
        return ptr[0] === bPtr[i][0] && ptr[1] === bPtr[i][1] && ptr[2] === bPtr[i][2]
      })
    },

    /** how many seperate terms does the document have? */
    wordCount: function () {
      return this.docs.reduce((count, terms) => {
        count += terms.filter(t => t.text !== '').length;
        return count
      }, 0)
    },

  };
  utils.group = utils.groups;
  utils.fullSentence = utils.fullSentences;
  utils.sentence = utils.fullSentences;
  utils.lastTerm = utils.lastTerms;
  utils.firstTerm = utils.firstTerms;
  var util = utils;

  const methods$n = Object.assign({}, util, compute$c, loops);

  // aliases
  methods$n.get = methods$n.eq;
  var api$y = methods$n;

  class View {
    constructor(document, pointer, groups = {}) {
      // invisible props
      [
        ['document', document],
        ['world', tmpWrld],
        ['_groups', groups],
        ['_cache', null],
        ['viewType', 'View']
      ].forEach(a => {
        Object.defineProperty(this, a[0], {
          value: a[1],
          writable: true,
        });
      });
      this.ptrs = pointer;
    }
    /* getters:  */
    get docs() {
      let docs = this.document;
      if (this.ptrs) {
        docs = tmpWrld.methods.one.getDoc(this.ptrs, this.document);
      }
      return docs
    }
    get pointer() {
      return this.ptrs
    }
    get methods() {
      return this.world.methods
    }
    get model() {
      return this.world.model
    }
    get hooks() {
      return this.world.hooks
    }
    get isView() {
      return true //this comes in handy sometimes
    }
    // is the view not-empty?
    get found() {
      return this.docs.length > 0
    }
    // how many matches we have
    get length() {
      return this.docs.length
    }
    // return a more-hackable pointer
    get fullPointer() {
      let { docs, ptrs, document } = this;
      // compute a proper pointer, from docs
      let pointers = ptrs || docs.map((_d, n) => [n]);
      // do we need to repair it, first?
      return pointers.map(a => {
        let [n, start, end, id, endId] = a;
        start = start || 0;
        end = end || (document[n] || []).length;
        //add frozen id, for good-measure
        if (document[n] && document[n][start]) {
          id = id || document[n][start].id;
          if (document[n][end - 1]) {
            endId = endId || document[n][end - 1].id;
          }
        }
        return [n, start, end, id, endId]
      })
    }
    // create a new View, from this one
    update(pointer) {
      let m = new View(this.document, pointer);
      // send the cache down, too?
      if (this._cache && pointer && pointer.length > 0) {
        // only keep cache if it's a full-sentence
        let cache = [];
        pointer.forEach((ptr, i) => {
          let [n, start, end] = ptr;
          if (ptr.length === 1) {
            cache[i] = this._cache[n];
          } else if (start === 0 && this.document[n].length === end) {
            cache[i] = this._cache[n];
          }
        });
        if (cache.length > 0) {
          m._cache = cache;
        }
      }
      m.world = this.world;
      return m
    }
    // create a new View, from this one
    toView(pointer) {
      return new View(this.document, pointer || this.pointer)
    }
    fromText(input) {
      const { methods } = this;
      //assume ./01-tokenize is installed
      let document = methods.one.tokenize.fromString(input, this.world);
      let doc = new View(document);
      doc.world = this.world;
      doc.compute(['normal', 'lexicon']);
      if (this.world.compute.preTagger) {
        doc.compute('preTagger');
      }
      return doc
    }
    clone() {
      // clone the whole document
      let document = this.document.slice(0);
      document = document.map(terms => {
        return terms.map(term => {
          term = Object.assign({}, term);
          term.tags = new Set(term.tags);
          return term
        })
      });
      // clone only sub-document ?
      let m = this.update(this.pointer);
      m.document = document;
      m._cache = this._cache; //clone this too?
      return m
    }
  }
  Object.assign(View.prototype, api$y);
  var View$1 = View;

  var version = '14.4.0';

  const isObject$6 = function (item) {
    return item && typeof item === 'object' && !Array.isArray(item)
  };

  // recursive merge of objects
  function mergeDeep(model, plugin) {
    if (isObject$6(plugin)) {
      for (const key in plugin) {
        if (isObject$6(plugin[key])) {
          if (!model[key]) Object.assign(model, { [key]: {} });
          mergeDeep(model[key], plugin[key]); //recursion
          // } else if (isArray(plugin[key])) {
          // console.log(key)
          // console.log(model)
        } else {
          Object.assign(model, { [key]: plugin[key] });
        }
      }
    }
    return model
  }
  // const merged = mergeDeep({ a: 1 }, { b: { c: { d: { e: 12345 } } } })
  // console.dir(merged, { depth: 5 })

  // vroom
  function mergeQuick(model, plugin) {
    for (const key in plugin) {
      model[key] = model[key] || {};
      Object.assign(model[key], plugin[key]);
    }
    return model
  }

  const extend = function (plugin, world, View, nlp) {
    const { methods, model, compute, hooks } = world;
    if (plugin.methods) {
      mergeQuick(methods, plugin.methods);
    }
    if (plugin.model) {
      mergeDeep(model, plugin.model);
    }
    // shallow-merge compute
    if (plugin.compute) {
      Object.assign(compute, plugin.compute);
    }
    // append new hooks
    if (hooks) {
      world.hooks = hooks.concat(plugin.hooks || []);
    }
    // assign new class methods
    if (plugin.api) {
      plugin.api(View);
    }
    if (plugin.lib) {
      Object.keys(plugin.lib).forEach(k => nlp[k] = plugin.lib[k]);
    }
    if (plugin.tags) {
      nlp.addTags(plugin.tags);
    }
    if (plugin.words) {
      nlp.addWords(plugin.words);
    }
    if (plugin.mutate) {
      plugin.mutate(world);
    }
  };
  var extend$1 = extend;

  /** log the decision-making to console */
  const verbose = function (set) {
    const env = typeof process === 'undefined' || !process.env ? self.env || {} : process.env; //use window, in browser
    env.DEBUG_TAGS = set === 'tagger' || set === true ? true : '';
    env.DEBUG_MATCH = set === 'match' || set === true ? true : '';
    env.DEBUG_CHUNKS = set === 'chunker' || set === true ? true : '';
    return this
  };

  const isObject$5 = val => {
    return Object.prototype.toString.call(val) === '[object Object]'
  };

  const isArray$8 = function (arr) {
    return Object.prototype.toString.call(arr) === '[object Array]'
  };

  // internal Term objects are slightly different
  const fromJson = function (json) {
    return json.map(o => {
      return o.terms.map(term => {
        if (isArray$8(term.tags)) {
          term.tags = new Set(term.tags);
        }
        return term
      })
    })
  };

  // interpret an array-of-arrays
  const preTokenized = function (arr) {
    return arr.map((a) => {
      return a.map(str => {
        return {
          text: str,
          normal: str,//cleanup
          pre: '',
          post: ' ',
          tags: new Set()
        }
      })
    })
  };

  const inputs = function (input, View, world) {
    const { methods } = world;
    let doc = new View([]);
    doc.world = world;
    // support a number
    if (typeof input === 'number') {
      input = String(input);
    }
    // return empty doc
    if (!input) {
      return doc
    }
    // parse a string
    if (typeof input === 'string') {
      let document = methods.one.tokenize.fromString(input, world);
      return new View(document)
    }
    // handle compromise View
    if (isObject$5(input) && input.isView) {
      return new View(input.document, input.ptrs)
    }
    // handle json input
    if (isArray$8(input)) {
      // pre-tokenized array-of-arrays 
      if (isArray$8(input[0])) {
        let document = preTokenized(input);
        return new View(document)
      }
      // handle json output
      let document = fromJson(input);
      return new View(document)
    }
    return doc
  };
  var handleInputs = inputs;

  let world$1 = Object.assign({}, tmpWrld);

  const nlp = function (input, lex) {
    if (lex) {
      nlp.addWords(lex);
    }
    let doc = handleInputs(input, View$1, world$1);
    if (input) {
      doc.compute(world$1.hooks);
    }
    return doc
  };
  Object.defineProperty(nlp, '_world', {
    value: world$1,
    writable: true,
  });

  /** don't run the POS-tagger */
  nlp.tokenize = function (input, lex) {
    const { compute } = this._world;
    // add user-given words to lexicon
    if (lex) {
      nlp.addWords(lex);
    }
    // run the tokenizer
    let doc = handleInputs(input, View$1, world$1);
    // give contractions a shot, at least
    if (compute.contractions) {
      doc.compute(['alias', 'normal', 'machine', 'contractions']); //run it if we've got it
    }
    return doc
  };

  /** extend compromise functionality */
  nlp.plugin = function (plugin) {
    extend$1(plugin, this._world, View$1, this);
    return this
  };
  nlp.extend = nlp.plugin;


  /** reach-into compromise internals */
  nlp.world = function () {
    return this._world
  };
  nlp.model = function () {
    return this._world.model
  };
  nlp.methods = function () {
    return this._world.methods
  };
  nlp.hooks = function () {
    return this._world.hooks
  };

  /** log the decision-making to console */
  nlp.verbose = verbose;
  /** current library release version */
  nlp.version = version;

  var nlp$1 = nlp;

  const createCache = function (document) {
    let cache = document.map(terms => {
      let stuff = new Set();
      terms.forEach(term => {
        // add words
        if (term.normal !== '') {
          stuff.add(term.normal);
        }
        // cache switch-status - '%Noun|Verb%'
        if (term.switch) {
          stuff.add(`%${term.switch}%`);
        }
        // cache implicit words, too
        if (term.implicit) {
          stuff.add(term.implicit);
        }
        if (term.machine) {
          stuff.add(term.machine);
        }
        if (term.root) {
          stuff.add(term.root);
        }
        // cache slashes words, etc
        if (term.alias) {
          term.alias.forEach(str => stuff.add(str));
        }
        let tags = Array.from(term.tags);
        for (let t = 0; t < tags.length; t += 1) {
          stuff.add('#' + tags[t]);
        }
      });
      return stuff
    });
    return cache
  };
  var cacheDoc = createCache;

  var methods$m = {
    one: {
      cacheDoc,
    },
  };

  const methods$l = {
    /** */
    cache: function () {
      this._cache = this.methods.one.cacheDoc(this.document);
      return this
    },
    /** */
    uncache: function () {
      this._cache = null;
      return this
    },
  };
  const addAPI$3 = function (View) {
    Object.assign(View.prototype, methods$l);
  };
  var api$x = addAPI$3;

  var compute$b = {
    cache: function (view) {
      view._cache = view.methods.one.cacheDoc(view.document);
    }
  };

  var cache$1 = {
    api: api$x,
    compute: compute$b,
    methods: methods$m,
  };

  var caseFns = {
    /** */
    toLowerCase: function () {
      this.termList().forEach(t => {
        t.text = t.text.toLowerCase();
      });
      return this
    },
    /** */
    toUpperCase: function () {
      this.termList().forEach(t => {
        t.text = t.text.toUpperCase();
      });
      return this
    },
    /** */
    toTitleCase: function () {
      this.termList().forEach(t => {
        t.text = t.text.replace(/^ *[a-z\u00C0-\u00FF]/, x => x.toUpperCase()); //support unicode?
      });
      return this
    },
    /** */
    toCamelCase: function () {
      this.docs.forEach(terms => {
        terms.forEach((t, i) => {
          if (i !== 0) {
            t.text = t.text.replace(/^ *[a-z\u00C0-\u00FF]/, x => x.toUpperCase()); //support unicode?
          }
          if (i !== terms.length - 1) {
            t.post = '';
          }
        });
      });
      return this
    },
  };

  // case logic
  const isTitleCase$1 = (str) => /^\p{Lu}[\p{Ll}'’]/u.test(str) || /^\p{Lu}$/u.test(str);
  const toTitleCase$1 = (str) => str.replace(/^\p{Ll}/u, x => x.toUpperCase());
  const toLowerCase = (str) => str.replace(/^\p{Lu}/u, x => x.toLowerCase());

  // splice an array into an array
  const spliceArr = (parent, index, child) => {
    // tag them as dirty
    child.forEach(term => term.dirty = true);
    if (parent) {
      let args = [index, 0].concat(child);
      Array.prototype.splice.apply(parent, args);
    }
    return parent
  };

  // add a space at end, if required
  const endSpace = function (terms) {
    const hasSpace = / $/;
    const hasDash = /[-–—]/;
    let lastTerm = terms[terms.length - 1];
    if (lastTerm && !hasSpace.test(lastTerm.post) && !hasDash.test(lastTerm.post)) {
      lastTerm.post += ' ';
    }
  };

  // sentence-ending punctuation should move in append
  const movePunct = (source, end, needle) => {
    const juicy = /[-.?!,;:)–—'"]/g;
    let wasLast = source[end - 1];
    if (!wasLast) {
      return
    }
    let post = wasLast.post;
    if (juicy.test(post)) {
      let punct = post.match(juicy).join(''); //not perfect
      let last = needle[needle.length - 1];
      last.post = punct + last.post;
      // remove it, from source
      wasLast.post = wasLast.post.replace(juicy, '');
    }
  };


  const moveTitleCase = function (home, start, needle) {
    let from = home[start];
    // should we bother?
    if (start !== 0 || !isTitleCase$1(from.text)) {
      return
    }
    // titlecase new first term
    needle[0].text = toTitleCase$1(needle[0].text);
    // should we un-titlecase the old word?
    let old = home[start];
    if (old.tags.has('ProperNoun') || old.tags.has('Acronym')) {
      return
    }
    if (isTitleCase$1(old.text) && old.text.length > 1) {
      old.text = toLowerCase(old.text);
    }
  };

  // put these words before the others
  const cleanPrepend = function (home, ptr, needle, document) {
    let [n, start, end] = ptr;
    // introduce spaces appropriately
    if (start === 0) {
      // at start - need space in insert
      endSpace(needle);
    } else if (end === document[n].length) {
      // at end - need space in home
      endSpace(needle);
    } else {
      // in middle - need space in home and insert
      endSpace(needle);
      endSpace([home[ptr[1]]]);
    }
    moveTitleCase(home, start, needle);
    // movePunct(home, end, needle)
    spliceArr(home, start, needle);
  };

  const cleanAppend = function (home, ptr, needle, document) {
    let [n, , end] = ptr;
    let total = (document[n] || []).length;
    if (end < total) {
      // are we in the middle?
      // add trailing space on self
      movePunct(home, end, needle);
      endSpace(needle);
    } else if (total === end) {
      // are we at the end?
      // add a space to predecessor
      endSpace(home);
      // very end, move period
      movePunct(home, end, needle);
      // is there another sentence after?
      if (document[n + 1]) {
        needle[needle.length - 1].post += ' ';
      }
    }
    spliceArr(home, ptr[2], needle);
    // set new endId
    ptr[4] = needle[needle.length - 1].id;
  };

  /*
  unique & ordered term ids, based on time & term index

  Base 36 (numbers+ascii)
    3 digit 4,600
    2 digit 1,200
    1 digit 36

    TTT|NNN|II|R

  TTT -> 46 terms since load
  NNN -> 46 thousand sentences (>1 inf-jest)
  II  -> 1,200 words in a sentence (nuts)
  R   -> 1-36 random number 

  novels: 
    avg 80,000 words
      15 words per sentence
    5,000 sentences

  Infinite Jest:
    36,247 sentences
    https://en.wikipedia.org/wiki/List_of_longest_novels

  collisions are more-likely after
      46 seconds have passed,
    and 
      after 46-thousand sentences

  */
  let index$2 = 0;

  const pad3 = (str) => {
    str = str.length < 3 ? '0' + str : str;
    return str.length < 3 ? '0' + str : str
  };

  const toId = function (term) {
    let [n, i] = term.index || [0, 0];
    index$2 += 1;

    //don't overflow index
    index$2 = index$2 > 46655 ? 0 : index$2;
    //don't overflow sentences
    n = n > 46655 ? 0 : n;
    // //don't overflow terms
    i = i > 1294 ? 0 : i;

    // 3 digits for time
    let id = pad3(index$2.toString(36));
    // 3 digit  for sentence index (46k)
    id += pad3(n.toString(36));

    // 1 digit for term index (36)
    let tx = i.toString(36);
    tx = tx.length < 2 ? '0' + tx : tx; //pad2
    id += tx;

    // 1 digit random number
    let r = parseInt(Math.random() * 36, 10);
    id += (r).toString(36);

    return term.normal + '|' + id.toUpperCase()
  };

  var uuid = toId;

  // setInterval(() => console.log(toId(4, 12)), 100)

  // are we inserting inside a contraction?
  // expand it first
  const expand$4 = function (m) {
    if (m.has('@hasContraction')) {//&& m.after('^.').has('@hasContraction')
      let more = m.grow('@hasContraction');
      more.contractions().expand();
    }
  };

  const isArray$7 = (arr) => Object.prototype.toString.call(arr) === '[object Array]';

  // set new ids for each terms
  const addIds$2 = function (terms) {
    terms = terms.map((term) => {
      term.id = uuid(term);
      return term
    });
    return terms
  };

  const getTerms = function (input, world) {
    const { methods } = world;
    // create our terms from a string
    if (typeof input === 'string') {
      return methods.one.tokenize.fromString(input, world)[0] //assume one sentence
    }
    //allow a view object
    if (typeof input === 'object' && input.isView) {
      return input.clone().docs[0] //assume one sentence
    }
    //allow an array of terms, too
    if (isArray$7(input)) {
      return isArray$7(input[0]) ? input[0] : input
    }
    return []
  };

  const insert = function (input, view, prepend) {
    const { document, world } = view;
    view.uncache();
    // insert words at end of each doc
    let ptrs = view.fullPointer;
    let selfPtrs = view.fullPointer;
    view.forEach((m, i) => {
      let ptr = m.fullPointer[0];
      let [n] = ptr;
      // add-in the words
      let home = document[n];
      let terms = getTerms(input, world);
      terms = addIds$2(terms);
      if (prepend) {
        expand$4(view.update([ptr]).firstTerm());
        cleanPrepend(home, ptr, terms, document);
      } else {
        expand$4(view.update([ptr]).lastTerm());
        cleanAppend(home, ptr, terms, document);
      }
      // harden the pointer
      if (document[n] && document[n][ptr[1]]) {
        ptr[3] = document[n][ptr[1]].id;
      }
      // change self backwards by len
      selfPtrs[i] = ptr;
      // extend the pointer
      ptr[2] += terms.length;
      ptrs[i] = ptr;
    });
    let doc = view.toView(ptrs);
    // shift our self pointer, if necessary
    view.ptrs = selfPtrs;
    // try to tag them, too
    doc.compute(['id', 'index', 'lexicon']);
    if (doc.world.compute.preTagger) {
      doc.compute('preTagger');
    }
    return doc
  };

  const fns$4 = {
    insertAfter: function (input) {
      return insert(input, this, false)
    },
    insertBefore: function (input) {
      return insert(input, this, true)
    },

  };
  fns$4.append = fns$4.insertAfter;
  fns$4.prepend = fns$4.insertBefore;
  fns$4.insert = fns$4.insertAfter;

  var insert$1 = fns$4;

  const dollarStub = /\$[0-9a-z]+/g;
  const fns$3 = {};

  const titleCase$3 = function (str) {
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase())
  };

  // doc.replace('foo', (m)=>{})
  const replaceByFn = function (main, fn) {
    main.forEach(m => {
      let out = fn(m);
      m.replaceWith(out);
    });
    return main
  };

  // support 'foo $0' replacements
  const subDollarSign = function (input, main) {
    if (typeof input !== 'string') {
      return input
    }
    let groups = main.groups();
    input = input.replace(dollarStub, (a) => {
      let num = a.replace(/\$/, '');
      if (groups.hasOwnProperty(num)) {
        return groups[num].text()
      }
      return a
    });
    return input
  };

  fns$3.replaceWith = function (input, keep = {}) {
    let ptrs = this.fullPointer;
    let main = this;
    this.uncache();
    if (typeof input === 'function') {
      return replaceByFn(main, input)
    }
    // support 'foo $0' replacements
    input = subDollarSign(input, main);

    let original = this.update(ptrs);
    // soften-up pointer
    ptrs = ptrs.map(ptr => ptr.slice(0, 3));
    // original.freeze()
    let oldTags = (original.docs[0] || []).map(term => Array.from(term.tags));
    // slide this in
    main.insertAfter(input);
    // are we replacing part of a contraction?
    if (original.has('@hasContraction') && main.contractions) {
      let more = main.grow('@hasContraction+');
      more.contractions().expand();
    }
    // delete the original terms
    main.delete(original); //science.
    // what should we return?
    let m = main.toView(ptrs).compute(['index', 'lexicon']);
    if (m.world.compute.preTagger) {
      m.compute('preTagger');
    }
    // replace any old tags
    if (keep.tags) {
      m.terms().forEach((term, i) => {
        term.tagSafe(oldTags[i]);
      });
    }
    // try to co-erce case, too
    if (keep.case && m.docs[0] && m.docs[0][0] && m.docs[0][0].index[1] === 0) {
      m.docs[0][0].text = titleCase$3(m.docs[0][0].text);
    }
    return m
  };

  fns$3.replace = function (match, input, keep) {
    if (match && !input) {
      return this.replaceWith(match, keep)
    }
    let m = this.match(match);
    if (!m.found) {
      return this
    }
    return m.replaceWith(input, keep)
  };
  var replace = fns$3;

  // transfer sentence-ending punctuation
  const repairPunct = function (terms, len) {
    let last = terms.length - 1;
    let from = terms[last];
    let to = terms[last - len];
    if (to && from) {
      to.post += from.post; //this isn't perfect.
      to.post = to.post.replace(/ +([.?!,;:])/, '$1');
      // don't allow any silly punctuation outcomes like ',!'
      to.post = to.post.replace(/[,;:]+([.?!])/, '$1');
    }
  };

  // remove terms from document json
  const pluckOut = function (document, nots) {
    nots.forEach(ptr => {
      let [n, start, end] = ptr;
      let len = end - start;
      if (!document[n]) {
        return // weird!
      }
      if (end === document[n].length && end > 1) {
        repairPunct(document[n], len);
      }
      document[n].splice(start, len); // replaces len terms at index start
    });
    // remove any now-empty sentences
    // (foreach + splice = 'mutable filter')
    for (let i = document.length - 1; i >= 0; i -= 1) {
      if (document[i].length === 0) {
        document.splice(i, 1);
        // remove any trailing whitespace before our removed sentence
        if (i === document.length && document[i - 1]) {
          let terms = document[i - 1];
          let lastTerm = terms[terms.length - 1];
          if (lastTerm) {
            lastTerm.post = lastTerm.post.trimEnd();
          }
        }
        // repair any downstream indexes
        // for (let k = i; k < document.length; k += 1) {
        //   document[k].forEach(term => term.index[0] -= 1)
        // }
      }
    }
    return document
  };

  var pluckOutTerm = pluckOut;

  const fixPointers$1 = function (ptrs, gonePtrs) {
    ptrs = ptrs.map(ptr => {
      let [n] = ptr;
      if (!gonePtrs[n]) {
        return ptr
      }
      gonePtrs[n].forEach(no => {
        let len = no[2] - no[1];
        // does it effect our pointer?
        if (ptr[1] <= no[1] && ptr[2] >= no[2]) {
          ptr[2] -= len;
        }
      });
      return ptr
    });

    // decrement any pointers after a now-empty pointer
    ptrs.forEach((ptr, i) => {
      // is the pointer now empty?
      if (ptr[1] === 0 && ptr[2] == 0) {
        // go down subsequent pointers
        for (let n = i + 1; n < ptrs.length; n += 1) {
          ptrs[n][0] -= 1;
          if (ptrs[n][0] < 0) {
            ptrs[n][0] = 0;
          }
        }
      }
    });
    // remove any now-empty pointers
    ptrs = ptrs.filter(ptr => ptr[2] - ptr[1] > 0);

    // remove old hard-pointers
    ptrs = ptrs.map((ptr) => {
      ptr[3] = null;
      ptr[4] = null;
      return ptr
    });
    return ptrs
  };

  const methods$k = {
    /** */
    remove: function (reg) {
      const { indexN } = this.methods.one.pointer;
      this.uncache();
      // two modes:
      //  - a. remove self, from full parent
      let self = this.all();
      let not = this;
      //  - b. remove a match, from self
      if (reg) {
        self = this;
        not = this.match(reg);
      }
      // is it part of a contraction?
      if (self.has('@hasContraction') && self.contractions) {
        let more = self.grow('@hasContraction');
        more.contractions().expand();
      }

      let ptrs = self.fullPointer;
      let nots = not.fullPointer.reverse();
      // remove them from the actual document)
      let document = pluckOutTerm(this.document, nots);
      // repair our pointers
      let gonePtrs = indexN(nots);
      ptrs = fixPointers$1(ptrs, gonePtrs);

      // clean up our original inputs
      self.ptrs = ptrs;
      self.document = document;
      self.compute('index');
      if (!reg) {
        this.ptrs = [];
        return self.none()
      }
      let res = self.toView(ptrs); //return new document
      return res
    },
  };

  // aliases
  methods$k.delete = methods$k.remove;
  var remove = methods$k;

  const methods$j = {
    /** add this punctuation or whitespace before each match: */
    pre: function (str, concat) {
      if (str === undefined && this.found) {
        return this.docs[0][0].pre
      }
      this.docs.forEach(terms => {
        let term = terms[0];
        if (concat === true) {
          term.pre += str;
        } else {
          term.pre = str;
        }
      });
      return this
    },

    /** add this punctuation or whitespace after each match: */
    post: function (str, concat) {
      if (str === undefined) {
        let last = this.docs[this.docs.length - 1];
        return last[last.length - 1].post
      }
      this.docs.forEach(terms => {
        let term = terms[terms.length - 1];
        if (concat === true) {
          term.post += str;
        } else {
          term.post = str;
        }
      });
      return this
    },

    /** remove whitespace from start/end */
    trim: function () {
      if (!this.found) {
        return this
      }
      let docs = this.docs;
      let start = docs[0][0];
      start.pre = start.pre.trimStart();
      let last = docs[docs.length - 1];
      let end = last[last.length - 1];
      end.post = end.post.trimEnd();
      return this
    },

    /** connect words with hyphen, and remove whitespace */
    hyphenate: function () {
      this.docs.forEach(terms => {
        //remove whitespace
        terms.forEach((t, i) => {
          if (i !== 0) {
            t.pre = '';
          }
          if (terms[i + 1]) {
            t.post = '-';
          }
        });
      });
      return this
    },

    /** remove hyphens between words, and set whitespace */
    dehyphenate: function () {
      const hasHyphen = /[-–—]/;
      this.docs.forEach(terms => {
        //remove whitespace
        terms.forEach(t => {
          if (hasHyphen.test(t.post)) {
            t.post = ' ';
          }
        });
      });
      return this
    },

    /** add quotations around these matches */
    toQuotations: function (start, end) {
      start = start || `"`;
      end = end || `"`;
      this.docs.forEach(terms => {
        terms[0].pre = start + terms[0].pre;
        let last = terms[terms.length - 1];
        last.post = end + last.post;
      });
      return this
    },

    /** add brackets around these matches */
    toParentheses: function (start, end) {
      start = start || `(`;
      end = end || `)`;
      this.docs.forEach(terms => {
        terms[0].pre = start + terms[0].pre;
        let last = terms[terms.length - 1];
        last.post = end + last.post;
      });
      return this
    },
  };
  methods$j.deHyphenate = methods$j.dehyphenate;
  methods$j.toQuotation = methods$j.toQuotations;

  var whitespace = methods$j;

  /** alphabetical order */
  const alpha = (a, b) => {
    if (a.normal < b.normal) {
      return -1
    }
    if (a.normal > b.normal) {
      return 1
    }
    return 0
  };

  /** count the # of characters of each match */
  const length = (a, b) => {
    let left = a.normal.trim().length;
    let right = b.normal.trim().length;
    if (left < right) {
      return 1
    }
    if (left > right) {
      return -1
    }
    return 0
  };

  /** count the # of terms in each match */
  const wordCount$2 = (a, b) => {
    if (a.words < b.words) {
      return 1
    }
    if (a.words > b.words) {
      return -1
    }
    return 0
  };

  /** count the # of terms in each match */
  const sequential = (a, b) => {
    if (a[0] < b[0]) {
      return 1
    }
    if (a[0] > b[0]) {
      return -1
    }
    return a[1] > b[1] ? 1 : -1
  };

  /** sort by # of duplicates in the document*/
  const byFreq = function (arr) {
    let counts = {};
    arr.forEach(o => {
      counts[o.normal] = counts[o.normal] || 0;
      counts[o.normal] += 1;
    });
    // sort by freq
    arr.sort((a, b) => {
      let left = counts[a.normal];
      let right = counts[b.normal];
      if (left < right) {
        return 1
      }
      if (left > right) {
        return -1
      }
      return 0
    });
    return arr
  };

  var methods$i = { alpha, length, wordCount: wordCount$2, sequential, byFreq };

  // aliases
  const seqNames = new Set(['index', 'sequence', 'seq', 'sequential', 'chron', 'chronological']);
  const freqNames = new Set(['freq', 'frequency', 'topk', 'repeats']);
  const alphaNames = new Set(['alpha', 'alphabetical']);

  // support function as parameter
  const customSort = function (view, fn) {
    let ptrs = view.fullPointer;
    ptrs = ptrs.sort((a, b) => {
      a = view.update([a]);
      b = view.update([b]);
      return fn(a, b)
    });
    view.ptrs = ptrs; //mutate original
    return view
  };

  /** re-arrange the order of the matches (in place) */
  const sort = function (input) {
    let { docs, pointer } = this;
    this.uncache();
    if (typeof input === 'function') {
      return customSort(this, input)
    }
    input = input || 'alpha';
    let ptrs = pointer || docs.map((_d, n) => [n]);
    let arr = docs.map((terms, n) => {
      return {
        index: n,
        words: terms.length,
        normal: terms.map(t => t.machine || t.normal || '').join(' '),
        pointer: ptrs[n],
      }
    });
    // 'chronological' sorting
    if (seqNames.has(input)) {
      input = 'sequential';
    }
    // alphabetical sorting
    if (alphaNames.has(input)) {
      input = 'alpha';
    }
    // sort by frequency
    if (freqNames.has(input)) {
      arr = methods$i.byFreq(arr);
      return this.update(arr.map(o => o.pointer))
    }
    // apply sort method on each phrase
    if (typeof methods$i[input] === 'function') {
      arr = arr.sort(methods$i[input]);
      return this.update(arr.map(o => o.pointer))
    }
    return this
  };

  /** reverse the order of the matches, but not the words or index */
  const reverse$2 = function () {
    let ptrs = this.pointer || this.docs.map((_d, n) => [n]);
    ptrs = [].concat(ptrs);
    ptrs = ptrs.reverse();
    if (this._cache) {
      this._cache = this._cache.reverse();
    }
    return this.update(ptrs)
  };

  /** remove any duplicate matches */
  const unique = function () {
    let already = new Set();
    let res = this.filter(m => {
      let txt = m.text('machine');
      if (already.has(txt)) {
        return false
      }
      already.add(txt);
      return true
    });
    // this.ptrs = res.ptrs //mutate original?
    return res//.compute('index')
  };

  var sort$1 = { unique, reverse: reverse$2, sort };

  const isArray$6 = (arr) => Object.prototype.toString.call(arr) === '[object Array]';

  // append a new document, somehow
  const combineDocs = function (homeDocs, inputDocs) {
    // add a space
    let end = homeDocs[homeDocs.length - 1];
    let last = end[end.length - 1];
    if (/ /.test(last.post) === false) {
      last.post += ' ';
    }
    homeDocs = homeDocs.concat(inputDocs);
    return homeDocs
  };

  const combineViews = function (home, input) {
    // is it a view from the same document?
    if (home.document === input.document) {
      let ptrs = home.fullPointer.concat(input.fullPointer);
      return home.toView(ptrs).compute('index')
    }
    // update n of new pointer, to end of our pointer
    let ptrs = input.fullPointer;
    ptrs.forEach(a => {
      a[0] += home.document.length;
    });
    home.document = combineDocs(home.document, input.document);
    return home.all()
  };

  var concat = {
    // add string as new match/sentence
    concat: function (input) {
      const { methods, document, world } = this;
      // parse and splice-in new terms
      if (typeof input === 'string') {
        let json = methods.one.tokenize.fromString(input, world);
        let ptrs = this.fullPointer;
        let lastN = ptrs[ptrs.length - 1][0];
        spliceArr(document, lastN + 1, json);
        return this.compute('index')
      }
      // plop some view objects together
      if (typeof input === 'object' && input.isView) {
        return combineViews(this, input)
      }
      // assume it's an array of terms
      if (isArray$6(input)) {
        let docs = combineDocs(this.document, input);
        this.document = docs;
        return this.all()
      }
      return this
    },
  };

  // add indexes to pointers
  const harden = function () {
    this.ptrs = this.fullPointer;
    return this
  };
  // remove indexes from pointers
  const soften = function () {
    let ptr = this.ptrs;
    if (!ptr || ptr.length < 1) {
      return this
    }
    ptr = ptr.map(a => a.slice(0, 3));
    this.ptrs = ptr;
    return this
  };
  var harden$1 = { harden, soften };

  const methods$h = Object.assign({}, caseFns, insert$1, replace, remove, whitespace, sort$1, concat, harden$1);

  const addAPI$2 = function (View) {
    Object.assign(View.prototype, methods$h);
  };
  var api$w = addAPI$2;

  const compute$9 = {
    id: function (view) {
      let docs = view.docs;
      for (let n = 0; n < docs.length; n += 1) {
        for (let i = 0; i < docs[n].length; i += 1) {
          let term = docs[n][i];
          term.id = term.id || uuid(term);
        }
      }
    }
  };

  var compute$a = compute$9;

  var change = {
    api: api$w,
    compute: compute$a,
  };

  var contractions$3 = [
    // simple mappings
    { word: '@', out: ['at'] },
    { word: 'alot', out: ['a', 'lot'] },
    { word: 'brb', out: ['be', 'right', 'back'] },
    { word: 'cannot', out: ['can', 'not'] },
    { word: 'cant', out: ['can', 'not'] },
    { word: 'dont', out: ['do', 'not'] },
    { word: 'dun', out: ['do', 'not'] },
    { word: 'wont', out: ['will', 'not'] },
    { word: "can't", out: ['can', 'not'] },
    { word: "shan't", out: ['should', 'not'] },
    { word: "won't", out: ['will', 'not'] },
    { word: "that's", out: ['that', 'is'] },
    { word: "what's", out: ['what', 'is'] },
    { word: "let's", out: ['let', 'us'] },
    { word: "there's", out: ['there', 'is'] },
    { word: 'dunno', out: ['do', 'not', 'know'] },
    { word: 'gonna', out: ['going', 'to'] },
    { word: 'gotta', out: ['have', 'got', 'to'] }, //hmm
    { word: 'gimme', out: ['give', 'me'] },
    { word: 'tryna', out: ['trying', 'to'] },
    { word: 'gtg', out: ['got', 'to', 'go'] },
    { word: 'im', out: ['i', 'am'] },
    { word: 'imma', out: ['I', 'will'] },
    { word: 'imo', out: ['in', 'my', 'opinion'] },
    { word: 'irl', out: ['in', 'real', 'life'] },
    { word: 'ive', out: ['i', 'have'] },
    { word: 'rn', out: ['right', 'now'] },
    { word: 'tbh', out: ['to', 'be', 'honest'] },
    { word: 'wanna', out: ['want', 'to'] },
    { word: `c'mere`, out: ['come', 'here'] },
    { word: `c'mon`, out: ['come', 'on'] },
    // apostrophe d
    { word: 'howd', out: ['how', 'did'] },
    { word: 'whatd', out: ['what', 'did'] },
    { word: 'whend', out: ['when', 'did'] },
    { word: 'whered', out: ['where', 'did'] },

    // { after: `cause`, out: ['because'] },
    { word: "tis", out: ['it', 'is'] },
    { word: "twas", out: ['it', 'was'] },
    { word: `y'know`, out: ['you', 'know'] },
    { word: "ne'er", out: ['never'] },
    { word: "o'er", out: ['over'] },
    // contraction-part mappings
    { after: 'll', out: ['will'] },
    { after: 've', out: ['have'] },
    { after: 're', out: ['are'] },
    { after: 'm', out: ['am'] },
    // french contractions
    { before: 'c', out: ['ce'] },
    { before: 'm', out: ['me'] },
    { before: 'n', out: ['ne'] },
    { before: 'qu', out: ['que'] },
    { before: 's', out: ['se'] },
    { before: 't', out: ['tu'] }, // t'aime
  ];

  var model$6 = { one: { contractions: contractions$3 } };

  // put n new words where 1 word was
  const insertContraction$1 = function (document, point, words) {
    let [n, w] = point;
    if (!words || words.length === 0) {
      return
    }
    words = words.map((word, i) => {
      word.implicit = word.text;
      word.machine = word.text;
      word.pre = '';
      word.post = '';
      word.text = '';
      word.normal = '';
      word.index = [n, w + i];
      return word
    });
    if (words[0]) {
      // move whitespace over
      words[0].pre = document[n][w].pre;
      words[words.length - 1].post = document[n][w].post;
      // add the text/normal to the first term
      words[0].text = document[n][w].text;
      words[0].normal = document[n][w].normal; // move tags too?
    }
    // do the splice
    document[n].splice(w, 1, ...words);
  };
  var splice$1 = insertContraction$1;

  const hasContraction$3 = /'/;
  //look for a past-tense verb
  // const hasPastTense = (terms, i) => {
  //   let after = terms.slice(i + 1, i + 3)
  //   return after.some(t => t.tags.has('PastTense'))
  // }
  // he'd walked -> had
  // how'd -> did
  // he'd go -> would

  const alwaysDid = new Set([
    'what',
    'how',
    'when',
    'where',
    'why',
  ]);

  // after-words
  const useWould = new Set([
    'be',
    'go',
    'start',
    'think',
    'need',
  ]);

  const useHad = new Set([
    'been',
    'gone'
  ]);
  // they'd gone
  // they'd go


  // he'd been
  //    he had been
  //    he would been

  const _apostropheD$1 = function (terms, i) {
    let before = terms[i].normal.split(hasContraction$3)[0];

    // what'd, how'd
    if (alwaysDid.has(before)) {
      return [before, 'did']
    }
    if (terms[i + 1]) {
      // they'd gone
      if (useHad.has(terms[i + 1].normal)) {
        return [before, 'had']
      }
      // they'd go
      if (useWould.has(terms[i + 1].normal)) {
        return [before, 'would']
      }
    }
    return null
    //   if (hasPastTense(terms, i) === true) {
    //     return [before, 'had']
    //   }
    //   // had/would/did
    //   return [before, 'would']
  };
  var apostropheD$1 = _apostropheD$1;

  //ain't -> are/is not
  const apostropheT$2 = function (terms, i) {
    if (terms[i].normal === "ain't" || terms[i].normal === 'aint') {
      return null //do this in ./two/
    }
    let before = terms[i].normal.replace(/n't/, '');
    return [before, 'not']
  };

  var apostropheT$3 = apostropheT$2;

  const hasContraction$2 = /'/;

  // l'amour
  const preL = (terms, i) => {
    // le/la
    let after = terms[i].normal.split(hasContraction$2)[1];
    // quick french gender disambig (rough)
    if (after && after.endsWith('e')) {
      return ['la', after]
    }
    return ['le', after]
  };

  // d'amerique
  const preD = (terms, i) => {
    let after = terms[i].normal.split(hasContraction$2)[1];
    // quick guess for noun-agreement (rough)
    if (after && after.endsWith('e')) {
      return ['du', after]
    } else if (after && after.endsWith('s')) {
      return ['des', after]
    }
    return ['de', after]
  };

  // j'aime
  const preJ = (terms, i) => {
    let after = terms[i].normal.split(hasContraction$2)[1];
    return ['je', after]
  };

  var french = {
    preJ,
    preL,
    preD,
  };

  const isRange = /^([0-9.]{1,4}[a-z]{0,2}) ?[-–—] ?([0-9]{1,4}[a-z]{0,2})$/i;
  const timeRange = /^([0-9]{1,2}(:[0-9][0-9])?(am|pm)?) ?[-–—] ?([0-9]{1,2}(:[0-9][0-9])?(am|pm)?)$/i;
  const phoneNum = /^[0-9]{3}-[0-9]{4}$/;

  const numberRange = function (terms, i) {
    let term = terms[i];
    let parts = term.text.match(isRange);
    if (parts !== null) {
      // 123-1234 is a phone number, not a number-range
      if (term.tags.has('PhoneNumber') === true || phoneNum.test(term.text)) {
        return null
      }
      return [parts[1], 'to', parts[2]]
    } else {
      parts = term.text.match(timeRange);
      if (parts !== null) {
        return [parts[1], 'to', parts[4]]
      }
    }
    return null
  };
  var numberRange$1 = numberRange;

  const numUnit = /^([0-9.,+-]+)([a-z°²³µ/]+)$/i;

  const notUnit = new Set([
    'st',
    'nd',
    'rd',
    'th',
    'am',
    'pm',
    'max'
  ]);

  const numberUnit = function (terms, i) {
    let term = terms[i];
    let parts = term.text.match(numUnit);
    if (parts !== null) {
      // is it a recognized unit, like 'km'?
      let unit = parts[2].toLowerCase().trim();
      // don't split '3rd'
      if (notUnit.has(unit)) {
        return null
      }
      return [parts[1], unit] //split it
    }
    return null
  };
  var numberUnit$1 = numberUnit;

  const byApostrophe$1 = /'/;
  const numDash = /^[0-9][^-–—]*[-–—].*?[0-9]/;

  // run tagger on our new implicit terms
  const reTag$1 = function (terms, view, start, len) {
    let tmp = view.update();
    tmp.document = [terms];
    // offer to re-tag neighbours, too
    let end = start + len;
    if (start > 0) {
      start -= 1;
    }
    if (terms[end]) {
      end += 1;
    }
    tmp.ptrs = [[0, start, end]];
  };

  const byEnd$1 = {
    // ain't
    t: (terms, i) => apostropheT$3(terms, i),
    // how'd
    d: (terms, i) => apostropheD$1(terms, i),
  };

  const byStart = {
    // j'aime
    j: (terms, i) => french.preJ(terms, i),
    // l'amour
    l: (terms, i) => french.preL(terms, i),
    // d'amerique
    d: (terms, i) => french.preD(terms, i),
  };

  // pull-apart known contractions from model
  const knownOnes = function (list, term, before, after) {
    for (let i = 0; i < list.length; i += 1) {
      let o = list[i];
      // look for word-word match (cannot-> [can, not])
      if (o.word === term.normal) {
        return o.out
      }
      // look for after-match ('re -> [_, are])
      else if (after !== null && after === o.after) {
        return [before].concat(o.out)
      }
      // look for before-match (l' -> [le, _])
      else if (before !== null && before === o.before) {
        return o.out.concat(after)
        // return [o.out, after] //typeof o.out === 'string' ? [o.out, after] : o.out(terms, i)
      }
    }
    return null
  };

  const toDocs$1 = function (words, view) {
    let doc = view.fromText(words.join(' '));
    doc.compute(['id', 'alias']);
    return doc.docs[0]
  };

  //really easy ones
  const contractions$1 = (view) => {
    let { world, document } = view;
    const { model, methods } = world;
    let list = model.one.contractions || [];
    new Set(model.one.units || []);
    // each sentence
    document.forEach((terms, n) => {
      // loop through terms backwards
      for (let i = terms.length - 1; i >= 0; i -= 1) {
        let before = null;
        let after = null;
        if (byApostrophe$1.test(terms[i].normal) === true) {
          [before, after] = terms[i].normal.split(byApostrophe$1);
        }
        // any known-ones, like 'dunno'?
        let words = knownOnes(list, terms[i], before, after);
        // ['foo', 's']
        if (!words && byEnd$1.hasOwnProperty(after)) {
          words = byEnd$1[after](terms, i, world);
        }
        // ['j', 'aime']
        if (!words && byStart.hasOwnProperty(before)) {
          words = byStart[before](terms, i);
        }
        // actually insert the new terms
        if (words) {
          words = toDocs$1(words, view);
          splice$1(document, [n, i], words);
          reTag$1(document[n], view, i, words.length);
          continue
        }
        // '44-2' has special care
        if (numDash.test(terms[i].normal)) {
          words = numberRange$1(terms, i);
          if (words) {
            words = toDocs$1(words, view);
            splice$1(document, [n, i], words);
            methods.one.setTag(words, 'NumberRange', world);//add custom tag
            // is it a time-range, like '5-9pm'
            if (words[2] && words[2].tags.has('Time')) {
              methods.one.setTag([words[0]], 'Time', world, null, 'time-range');
            }
            reTag$1(document[n], view, i, words.length);
          }
          continue
        }
        // split-apart '4km'
        words = numberUnit$1(terms, i);
        if (words) {
          words = toDocs$1(words, view);
          splice$1(document, [n, i], words);
          methods.one.setTag([words[1]], 'Unit', world, null, 'contraction-unit');
        }
      }
    });
  };
  var contractions$2 = contractions$1;

  var compute$8 = { contractions: contractions$2 };

  const plugin$4 = {
    model: model$6,
    compute: compute$8,
    hooks: ['contractions'],
  };
  var contractions = plugin$4;

  // scan-ahead to match multiple-word terms - 'jack rabbit'
  const checkMulti = function (terms, i, lexicon, setTag, world) {
    let max = i + 4 > terms.length ? terms.length - i : 4;
    let str = terms[i].machine || terms[i].normal;
    for (let skip = 1; skip < max; skip += 1) {
      let t = terms[i + skip];
      let word = t.machine || t.normal;
      str += ' ' + word;
      if (lexicon.hasOwnProperty(str) === true) {
        let tag = lexicon[str];
        let ts = terms.slice(i, i + skip + 1);
        setTag(ts, tag, world, false, '1-multi-lexicon');
        return true
      }
    }
    return false
  };

  const multiWord = function (terms, i, world) {
    const { model, methods } = world;
    // const { fastTag } = methods.one
    const setTag = methods.one.setTag;
    const multi = model.one._multiCache || {};
    const lexicon = model.one.lexicon || {};
    // basic lexicon lookup
    let t = terms[i];
    let word = t.machine || t.normal;
    // multi-word lookup
    if (terms[i + 1] !== undefined && multi[word] === true) {
      return checkMulti(terms, i, lexicon, setTag, world)
    }
    return null
  };
  var multiWord$1 = multiWord;

  const prefix$4 = /^(under|over|mis|re|un|dis|semi|pre|post)-?/;
  // anti|non|extra|inter|intra|over
  const allowPrefix = new Set(['Verb', 'Infinitive', 'PastTense', 'Gerund', 'PresentTense', 'Adjective', 'Participle']);

  // tag any words in our lexicon
  const checkLexicon = function (terms, i, world) {
    const { model, methods } = world;
    // const fastTag = methods.one.fastTag
    const setTag = methods.one.setTag;
    const lexicon = model.one.lexicon;

    // basic lexicon lookup
    let t = terms[i];
    let word = t.machine || t.normal;
    // normal lexicon lookup
    if (lexicon[word] !== undefined && lexicon.hasOwnProperty(word)) {
      let tag = lexicon[word];
      setTag([t], tag, world, false, '1-lexicon');
      // fastTag(t, tag, '1-lexicon')
      return true
    }
    // lookup aliases in the lexicon
    if (t.alias) {
      let found = t.alias.find(str => lexicon.hasOwnProperty(str));
      if (found) {
        let tag = lexicon[found];
        setTag([t], tag, world, false, '1-lexicon-alias');
        // fastTag(t, tag, '1-lexicon-alias')
        return true
      }
    }
    // prefixing for verbs/adjectives
    if (prefix$4.test(word) === true) {
      let stem = word.replace(prefix$4, '');
      if (lexicon.hasOwnProperty(stem) && stem.length > 3) {
        // only allow prefixes for verbs/adjectives
        if (allowPrefix.has(lexicon[stem])) {
          // console.log('->', word, stem, lexicon[stem])
          setTag([t], lexicon[stem], world, false, '1-lexicon-prefix');
          // fastTag(t, lexicon[stem], '1-lexicon-prefix')
          return true
        }
      }
    }
    return null
  };
  var singleWord = checkLexicon;

  // tag any words in our lexicon - even if it hasn't been filled-up yet
  // rest of pre-tagger is in ./two/preTagger
  const lexicon$3 = function (view) {
    const world = view.world;
    view.docs.forEach(terms => {
      for (let i = 0; i < terms.length; i += 1) {
        if (terms[i].tags.size === 0) {
          let found = null;
          found = found || multiWord$1(terms, i, world);
          // lookup known words
          found = found || singleWord(terms, i, world);
        }
      }
    });
  };

  var compute$7 = {
    lexicon: lexicon$3
  };

  // derive clever things from our lexicon key-value pairs
  const expand$3 = function (words) {
    // const { methods, model } = world
    let lex = {};
    // console.log('start:', Object.keys(lex).length)
    let _multi = {};
    // go through each word in this key-value obj:
    Object.keys(words).forEach(word => {
      let tag = words[word];
      // normalize lexicon a little bit
      word = word.toLowerCase().trim();
      word = word.replace(/'s\b/, '');
      // cache multi-word terms
      let split = word.split(/ /);
      if (split.length > 1) {
        _multi[split[0]] = true;
      }
      lex[word] = lex[word] || tag;
    });
    // cleanup
    delete lex[''];
    delete lex[null];
    delete lex[' '];
    return { lex, _multi }
  };
  var expandLexicon$3 = expand$3;

  var methods$g = {
    one: {
      expandLexicon: expandLexicon$3,
    }
  };

  /** insert new words/phrases into the lexicon */
  const addWords = function (words) {
    const world = this.world();
    const { methods, model } = world;
    if (!words) {
      return
    }
    // normalize tag vals
    Object.keys(words).forEach(k => {
      if (typeof words[k] === 'string' && words[k].startsWith('#')) {
        words[k] = words[k].replace(/^#/, '');
      }
    });
    // add some words to our lexicon
    if (methods.two.expandLexicon) {
      // do fancy ./two version
      let { lex, _multi } = methods.two.expandLexicon(words, world);
      Object.assign(model.one.lexicon, lex);
      Object.assign(model.one._multiCache, _multi);
    } else if (methods.one.expandLexicon) {
      // do basic ./one version
      let { lex, _multi } = methods.one.expandLexicon(words, world);
      Object.assign(model.one.lexicon, lex);
      Object.assign(model.one._multiCache, _multi);
    } else {
      //no fancy-business
      Object.assign(model.one.lexicon, words);
    }
  };

  var lib$5 = { addWords };

  const model$5 = {
    one: {
      lexicon: {}, //setup blank lexicon
      _multiCache: {},
    }
  };

  var lexicon$2 = {
    model: model$5,
    methods: methods$g,
    compute: compute$7,
    lib: lib$5,
    hooks: ['lexicon']
  };

  // edited by Spencer Kelly
  // credit to https://github.com/BrunoRB/ahocorasick by Bruno Roberto Búrigo.

  const tokenize$2 = function (phrase, world) {
    const { methods, model } = world;
    let terms = methods.one.tokenize.splitTerms(phrase, model).map(methods.one.tokenize.splitWhitespace);
    return terms.map(term => term.text.toLowerCase())
  };

  // turn an array or object into a compressed aho-corasick structure
  const buildTrie = function (phrases, world) {

    // const tokenize=methods.one.
    let goNext = [{}];
    let endAs = [null];
    let failTo = [0];

    let xs = [];
    let n = 0;
    phrases.forEach(function (phrase) {
      let curr = 0;
      // let wordsB = phrase.split(/ /g).filter(w => w)
      let words = tokenize$2(phrase, world);
      for (let i = 0; i < words.length; i++) {
        let word = words[i];
        if (goNext[curr] && goNext[curr].hasOwnProperty(word)) {
          curr = goNext[curr][word];
        } else {
          n++;
          goNext[curr][word] = n;
          goNext[n] = {};
          curr = n;
          endAs[n] = null;
        }
      }
      endAs[curr] = [words.length];
    });
    // f(s) = 0 for all states of depth 1 (the ones from which the 0 state can transition to)
    for (let word in goNext[0]) {
      n = goNext[0][word];
      failTo[n] = 0;
      xs.push(n);
    }

    while (xs.length) {
      let r = xs.shift();
      // for each symbol a such that g(r, a) = s
      let keys = Object.keys(goNext[r]);
      for (let i = 0; i < keys.length; i += 1) {
        let word = keys[i];
        let s = goNext[r][word];
        xs.push(s);
        // set state = f(r)
        n = failTo[r];
        while (n > 0 && !goNext[n].hasOwnProperty(word)) {
          n = failTo[n];
        }
        if (goNext.hasOwnProperty(n)) {
          let fs = goNext[n][word];
          failTo[s] = fs;
          if (endAs[fs]) {
            endAs[s] = endAs[s] || [];
            endAs[s] = endAs[s].concat(endAs[fs]);
          }
        } else {
          failTo[s] = 0;
        }
      }
    }
    return { goNext, endAs, failTo }
  };
  var build = buildTrie;

  // console.log(buildTrie(['smart and cool', 'smart and nice']))

  // follow our trie structure
  const scanWords = function (terms, trie, opts) {
    let n = 0;
    let results = [];
    for (let i = 0; i < terms.length; i++) {
      let word = terms[i][opts.form] || terms[i].normal;
      // main match-logic loop:
      while (n > 0 && (trie.goNext[n] === undefined || !trie.goNext[n].hasOwnProperty(word))) {
        n = trie.failTo[n] || 0; // (usually back to 0)
      }
      // did we fail?
      if (!trie.goNext[n].hasOwnProperty(word)) {
        continue
      }
      n = trie.goNext[n][word];
      if (trie.endAs[n]) {
        let arr = trie.endAs[n];
        for (let o = 0; o < arr.length; o++) {
          let len = arr[o];
          let term = terms[i - len + 1];
          let [no, start] = term.index;
          results.push([no, start, start + len, term.id]);
        }
      }
    }
    return results
  };

  const cacheMiss = function (words, cache) {
    for (let i = 0; i < words.length; i += 1) {
      if (cache.has(words[i]) === true) {
        return false
      }
    }
    return true
  };

  const scan = function (view, trie, opts) {
    let results = [];
    opts.form = opts.form || 'normal';
    let docs = view.docs;
    if (!trie.goNext || !trie.goNext[0]) {
      console.error('Compromise invalid lookup trie');//eslint-disable-line
      return view.none()
    }
    let firstWords = Object.keys(trie.goNext[0]);
    // do each phrase
    for (let i = 0; i < docs.length; i++) {
      // can we skip the phrase, all together?
      if (view._cache && view._cache[i] && cacheMiss(firstWords, view._cache[i]) === true) {
        continue
      }
      let terms = docs[i];
      let found = scanWords(terms, trie, opts);
      if (found.length > 0) {
        results = results.concat(found);
      }
    }
    return view.update(results)
  };
  var scan$1 = scan;

  const isObject$4 = val => {
    return Object.prototype.toString.call(val) === '[object Object]'
  };

  function api$v (View) {

    /** find all matches in this document */
    View.prototype.lookup = function (input, opts = {}) {
      if (!input) {
        return this.none()
      }
      if (typeof input === 'string') {
        input = [input];
      }
      let trie = isObject$4(input) ? input : build(input, this.world);
      let res = scan$1(this, trie, opts);
      res = res.settle();
      return res
    };
  }

  // chop-off tail of redundant vals at end of array
  const truncate = (list, val) => {
    for (let i = list.length - 1; i >= 0; i -= 1) {
      if (list[i] !== val) {
        list = list.slice(0, i + 1);
        return list
      }
    }
    return list
  };

  // prune trie a bit
  const compress = function (trie) {
    trie.goNext = trie.goNext.map(o => {
      if (Object.keys(o).length === 0) {
        return undefined
      }
      return o
    });
    // chop-off tail of undefined vals in goNext array
    trie.goNext = truncate(trie.goNext, undefined);
    // chop-off tail of zeros in failTo array
    trie.failTo = truncate(trie.failTo, 0);
    // chop-off tail of nulls in endAs array
    trie.endAs = truncate(trie.endAs, null);
    return trie
  };
  var compress$1 = compress;

  /** pre-compile a list of matches to lookup */
  const lib$4 = {
    /** turn an array or object into a compressed trie*/
    buildTrie: function (input) {
      const trie = build(input, this.world());
      return compress$1(trie)
    }
  };
  // add alias
  lib$4.compile = lib$4.buildTrie;

  var lookup = {
    api: api$v,
    lib: lib$4
  };

  const relPointer = function (ptrs, parent) {
    if (!parent) {
      return ptrs
    }
    ptrs.forEach(ptr => {
      let n = ptr[0];
      if (parent[n]) {
        ptr[0] = parent[n][0]; //n
        ptr[1] += parent[n][1]; //start
        ptr[2] += parent[n][1]; //end
      }
    });
    return ptrs
  };

  // make match-result relative to whole document
  const fixPointers = function (res, parent) {
    let { ptrs, byGroup } = res;
    ptrs = relPointer(ptrs, parent);
    Object.keys(byGroup).forEach(k => {
      byGroup[k] = relPointer(byGroup[k], parent);
    });
    return { ptrs, byGroup }
  };

  const isObject$3 = val => {
    return Object.prototype.toString.call(val) === '[object Object]'
  };

  // did they pass-in a compromise object?
  const isView = val => val && isObject$3(val) && val.isView === true;

  const isNet = val => val && isObject$3(val) && val.isNet === true;


  // is the pointer the full sentence?
  // export const isFull = function (ptr, document) {
  //   let [n, start, end] = ptr
  //   if (start !== 0) {
  //     return false
  //   }
  //   if (document[n] && document[n][end - 1] && !document[n][end]) {
  //     return true
  //   }
  //   return false
  // }

  const parseRegs = function (regs, opts, world) {
    const one = world.methods.one;
    if (typeof regs === 'number') {
      regs = String(regs);
    }
    // support param as string
    if (typeof regs === 'string') {
      regs = one.killUnicode(regs, world);
      regs = one.parseMatch(regs, opts, world);
    }
    return regs
  };

  const match$2 = function (regs, group, opts) {
    const one = this.methods.one;
    // support param as view object
    if (isView(regs)) {
      return this.intersection(regs)
    }
    // support a compiled set of matches
    if (isNet(regs)) {
      return this.sweep(regs, { tagger: false }).view.settle()
    }
    regs = parseRegs(regs, opts, this.world);
    let todo = { regs, group };
    let res = one.match(this.docs, todo, this._cache);
    let { ptrs, byGroup } = fixPointers(res, this.fullPointer);
    let view = this.toView(ptrs);
    view._groups = byGroup;
    return view
  };

  const matchOne = function (regs, group, opts) {
    const one = this.methods.one;
    // support at view as a param
    if (isView(regs)) {
      return this.intersection(regs).eq(0)
    }
    // support a compiled set of matches
    if (isNet(regs)) {
      return this.sweep(regs, { tagger: false, matchOne: true }).view
    }
    regs = parseRegs(regs, opts, this.world);
    let todo = { regs, group, justOne: true };
    let res = one.match(this.docs, todo, this._cache);
    let { ptrs, byGroup } = fixPointers(res, this.fullPointer);
    let view = this.toView(ptrs);
    view._groups = byGroup;
    return view
  };

  const has = function (regs, group, opts) {
    const one = this.methods.one;
    // support view as input
    if (isView(regs)) {
      let ptrs = regs.fullPointer; // support a view object as input
      return ptrs.length > 0
    }
    // support a compiled set of matches
    if (isNet(regs)) {
      return this.sweep(regs, { tagger: false }).view.found
    }
    regs = parseRegs(regs, opts, this.world);
    let todo = { regs, group, justOne: true };
    let ptrs = one.match(this.docs, todo, this._cache).ptrs;
    return ptrs.length > 0
  };

  // 'if'
  const ifFn = function (regs, group, opts) {
    const one = this.methods.one;
    // support view as input
    if (isView(regs)) {
      return this.filter(m => m.intersection(regs).found)
    }
    // support a compiled set of matches
    if (isNet(regs)) {
      let m = this.sweep(regs, { tagger: false }).view.settle();
      return this.if(m)//recurse with result
    }
    regs = parseRegs(regs, opts, this.world);
    let todo = { regs, group, justOne: true };
    let ptrs = this.fullPointer;
    let cache = this._cache || [];
    ptrs = ptrs.filter((ptr, i) => {
      let m = this.update([ptr]);
      let res = one.match(m.docs, todo, cache[i]).ptrs;
      return res.length > 0
    });
    let view = this.update(ptrs);
    // try and reconstruct the cache
    if (this._cache) {
      view._cache = ptrs.map(ptr => cache[ptr[0]]);
    }
    return view
  };

  const ifNo = function (regs, group, opts) {
    const { methods } = this;
    const one = methods.one;
    // support a view object as input
    if (isView(regs)) {
      return this.filter(m => !m.intersection(regs).found)
    }
    // support a compiled set of matches
    if (isNet(regs)) {
      let m = this.sweep(regs, { tagger: false }).view.settle();
      return this.ifNo(m)
    }
    // otherwise parse the match string
    regs = parseRegs(regs, opts, this.world);
    let cache = this._cache || [];
    let view = this.filter((m, i) => {
      let todo = { regs, group, justOne: true };
      let ptrs = one.match(m.docs, todo, cache[i]).ptrs;
      return ptrs.length === 0
    });
    // try to reconstruct the cache
    if (this._cache) {
      view._cache = view.ptrs.map(ptr => cache[ptr[0]]);
    }
    return view
  };

  var match$3 = { matchOne, match: match$2, has, if: ifFn, ifNo };

  const before = function (regs, group, opts) {
    const { indexN } = this.methods.one.pointer;
    let pre = [];
    let byN = indexN(this.fullPointer);
    Object.keys(byN).forEach(k => {
      // check only the earliest match in the sentence
      let first = byN[k].sort((a, b) => (a[1] > b[1] ? 1 : -1))[0];
      if (first[1] > 0) {
        pre.push([first[0], 0, first[1]]);
      }
    });
    let preWords = this.toView(pre);
    if (!regs) {
      return preWords
    }
    return preWords.match(regs, group, opts)
  };

  const after = function (regs, group, opts) {
    const { indexN } = this.methods.one.pointer;
    let post = [];
    let byN = indexN(this.fullPointer);
    let document = this.document;
    Object.keys(byN).forEach(k => {
      // check only the latest match in the sentence
      let last = byN[k].sort((a, b) => (a[1] > b[1] ? -1 : 1))[0];
      let [n, , end] = last;
      if (end < document[n].length) {
        post.push([n, end, document[n].length]);
      }
    });
    let postWords = this.toView(post);
    if (!regs) {
      return postWords
    }
    return postWords.match(regs, group, opts)
  };

  const growLeft = function (regs, group, opts) {
    if (typeof regs === 'string') {
      regs = this.world.methods.one.parseMatch(regs, opts, this.world);
    }
    regs[regs.length - 1].end = true;// ensure matches are beside us ←
    let ptrs = this.fullPointer;
    this.forEach((m, n) => {
      let more = m.before(regs, group);
      if (more.found) {
        let terms = more.terms();
        ptrs[n][1] -= terms.length;
        ptrs[n][3] = terms.docs[0][0].id;
      }
    });
    return this.update(ptrs)
  };

  const growRight = function (regs, group, opts) {
    if (typeof regs === 'string') {
      regs = this.world.methods.one.parseMatch(regs, opts, this.world);
    }
    regs[0].start = true;// ensure matches are beside us →
    let ptrs = this.fullPointer;
    this.forEach((m, n) => {
      let more = m.after(regs, group);
      if (more.found) {
        let terms = more.terms();
        ptrs[n][2] += terms.length;
        ptrs[n][4] = null; //remove end-id
      }
    });
    return this.update(ptrs)
  };

  const grow = function (regs, group, opts) {
    return this.growRight(regs, group, opts).growLeft(regs, group, opts)
  };

  var lookaround = { before, after, growLeft, growRight, grow };

  const combine = function (left, right) {
    return [left[0], left[1], right[2]]
  };

  const isArray$5 = function (arr) {
    return Object.prototype.toString.call(arr) === '[object Array]'
  };

  const getDoc$3 = (reg, view, group) => {
    if (typeof reg === 'string' || isArray$5(reg)) {
      return view.match(reg, group)
    }
    if (!reg) {
      return view.none()
    }
    return reg
  };

  const addIds$1 = function (ptr, view) {
    let [n, start, end] = ptr;
    if (view.document[n] && view.document[n][start]) {
      ptr[3] = ptr[3] || view.document[n][start].id;
      if (view.document[n][end - 1]) {
        ptr[4] = ptr[4] || view.document[n][end - 1].id;
      }
    }
    return ptr
  };

  const methods$f = {};
  // [before], [match], [after]
  methods$f.splitOn = function (m, group) {
    const { splitAll } = this.methods.one.pointer;
    let splits = getDoc$3(m, this, group).fullPointer;
    let all = splitAll(this.fullPointer, splits);
    let res = [];
    all.forEach(o => {
      res.push(o.passthrough);
      res.push(o.before);
      res.push(o.match);
      res.push(o.after);
    });
    res = res.filter(p => p);
    res = res.map(p => addIds$1(p, this));
    return this.update(res)
  };

  // [before], [match after]
  methods$f.splitBefore = function (m, group) {
    const { splitAll } = this.methods.one.pointer;
    let splits = getDoc$3(m, this, group).fullPointer;
    let all = splitAll(this.fullPointer, splits);
    let res = [];
    all.forEach(o => {
      res.push(o.passthrough);
      res.push(o.before);
      if (o.match && o.after) {
        // console.log(combine(o.match, o.after))
        res.push(combine(o.match, o.after));
      } else {
        res.push(o.match);
        res.push(o.after);
      }
    });
    res = res.filter(p => p);
    res = res.map(p => addIds$1(p, this));
    return this.update(res)
  };

  // [before match], [after]
  methods$f.splitAfter = function (m, group) {
    const { splitAll } = this.methods.one.pointer;
    let splits = getDoc$3(m, this, group).fullPointer;
    let all = splitAll(this.fullPointer, splits);
    let res = [];
    all.forEach(o => {
      res.push(o.passthrough);
      if (o.before && o.match) {
        res.push(combine(o.before, o.match));
      } else {
        res.push(o.before);
        res.push(o.match);
      }
      res.push(o.after);
    });
    res = res.filter(p => p);
    res = res.map(p => addIds$1(p, this));
    return this.update(res)
  };
  methods$f.split = methods$f.splitAfter;

  var split$2 = methods$f;

  const methods$e = Object.assign({}, match$3, lookaround, split$2);
  // aliases
  methods$e.lookBehind = methods$e.before;
  methods$e.lookBefore = methods$e.before;

  methods$e.lookAhead = methods$e.after;
  methods$e.lookAfter = methods$e.after;

  methods$e.notIf = methods$e.ifNo;
  const matchAPI = function (View) {
    Object.assign(View.prototype, methods$e);
  };
  var api$u = matchAPI;

  // match  'foo /yes/' and not 'foo/no/bar'
  const bySlashes = /(?:^|\s)([![^]*(?:<[^<]*>)?\/.*?[^\\/]\/[?\]+*$~]*)(?:\s|$)/;
  // match '(yes) but not foo(no)bar'
  const byParentheses = /([!~[^]*(?:<[^<]*>)?\([^)]+[^\\)]\)[?\]+*$~]*)(?:\s|$)/;
  // okay
  const byWord$1 = / /g;

  const isBlock = str => {
    return /^[![^]*(<[^<]*>)?\(/.test(str) && /\)[?\]+*$~]*$/.test(str)
  };
  const isReg = str => {
    return /^[![^]*(<[^<]*>)?\//.test(str) && /\/[?\]+*$~]*$/.test(str)
  };

  const cleanUp$1 = function (arr) {
    arr = arr.map(str => str.trim());
    arr = arr.filter(str => str);
    return arr
  };

  const parseBlocks = function (txt) {
    // parse by /regex/ first
    let arr = txt.split(bySlashes);
    let res = [];
    // parse by (blocks), next
    arr.forEach(str => {
      if (isReg(str)) {
        res.push(str);
        return
      }
      res = res.concat(str.split(byParentheses));
    });
    res = cleanUp$1(res);
    // split by spaces, now
    let final = [];
    res.forEach(str => {
      if (isBlock(str)) {
        final.push(str);
      } else if (isReg(str)) {
        final.push(str);
      } else {
        final = final.concat(str.split(byWord$1));
      }
    });
    final = cleanUp$1(final);
    return final
  };
  var parseBlocks$1 = parseBlocks;

  const hasMinMax = /\{([0-9]+)?(, *[0-9]*)?\}/;
  const andSign = /&&/;
  // const hasDash = /\p{Letter}[-–—]\p{Letter}/u
  const captureName = new RegExp(/^<\s*(\S+)\s*>/);
  /* break-down a match expression into this:
  {
    word:'',
    tag:'',
    regex:'',

    start:false,
    end:false,
    negative:false,
    anything:false,
    greedy:false,
    optional:false,

    named:'',
    choices:[],
  }
  */
  const titleCase$2 = str => str.charAt(0).toUpperCase() + str.substring(1);
  const end = (str) => str.charAt(str.length - 1);
  const start = (str) => str.charAt(0);
  const stripStart = (str) => str.substring(1);
  const stripEnd = (str) => str.substring(0, str.length - 1);

  const stripBoth = function (str) {
    str = stripStart(str);
    str = stripEnd(str);
    return str
  };
  //
  const parseToken = function (w, opts) {
    let obj = {};
    //collect any flags (do it twice)
    for (let i = 0; i < 2; i += 1) {
      //end-flag
      if (end(w) === '$') {
        obj.end = true;
        w = stripEnd(w);
      }
      //front-flag
      if (start(w) === '^') {
        obj.start = true;
        w = stripStart(w);
      }
      //capture group (this one can span multiple-terms)
      if (start(w) === '[' || end(w) === ']') {
        obj.group = null;
        if (start(w) === '[') {
          obj.groupStart = true;
        }
        if (end(w) === ']') {
          obj.groupEnd = true;
        }
        w = w.replace(/^\[/, '');
        w = w.replace(/\]$/, '');
        // Use capture group name
        if (start(w) === '<') {
          const res = captureName.exec(w);
          if (res.length >= 2) {
            obj.group = res[1];
            w = w.replace(res[0], '');
          }
        }
      }
      //back-flags
      if (end(w) === '+') {
        obj.greedy = true;
        w = stripEnd(w);
      }
      if (w !== '*' && end(w) === '*' && w !== '\\*') {
        obj.greedy = true;
        w = stripEnd(w);
      }
      if (end(w) === '?') {
        obj.optional = true;
        w = stripEnd(w);
      }
      if (start(w) === '!') {
        obj.negative = true;
        // obj.optional = true
        w = stripStart(w);
      }
      //soft-match
      if (start(w) === '~' && end(w) === '~' && w.length > 2) {
        w = stripBoth(w);
        obj.fuzzy = true;
        obj.min = opts.fuzzy || 0.85;
        if (/\(/.test(w) === false) {
          obj.word = w;
          return obj
        }
      }

      //wrapped-flags
      if (start(w) === '(' && end(w) === ')') {
        // support (one && two)
        if (andSign.test(w)) {
          obj.choices = w.split(andSign);
          obj.operator = 'and';
        } else {
          obj.choices = w.split('|');
          obj.operator = 'or';
        }
        //remove '(' and ')'
        obj.choices[0] = stripStart(obj.choices[0]);
        let last = obj.choices.length - 1;
        obj.choices[last] = stripEnd(obj.choices[last]);
        // clean up the results
        obj.choices = obj.choices.map(s => s.trim());
        obj.choices = obj.choices.filter(s => s);
        //recursion alert!
        obj.choices = obj.choices.map(str => {
          return str.split(/ /g).map(s => parseToken(s, opts))
        });
        w = '';
      }
      //regex
      if (start(w) === '/' && end(w) === '/') {
        w = stripBoth(w);
        if (opts.caseSensitive) {
          obj.use = 'text';
        }
        obj.regex = new RegExp(w); //potential vuln - security/detect-non-literal-regexp
        return obj
      }

      //root/sense overloaded
      if (start(w) === '{' && end(w) === '}') {
        w = stripBoth(w);
        obj.id = w;
        obj.root = w;
        if (/\//.test(w)) {
          let split = obj.root.split(/\//);
          obj.root = split[0];
          obj.pos = split[1];
          if (obj.pos === 'adj') {
            obj.pos = 'Adjective';
          }
          // titlecase
          obj.pos = obj.pos.charAt(0).toUpperCase() + obj.pos.substr(1).toLowerCase();
          // add sense-number too
          if (split[2] !== undefined) {
            obj.num = split[2];
          }
        }
        return obj
      }
      //chunks
      if (start(w) === '<' && end(w) === '>') {
        w = stripBoth(w);
        obj.chunk = titleCase$2(w);
        obj.greedy = true;
        return obj
      }
      if (start(w) === '%' && end(w) === '%') {
        w = stripBoth(w);
        obj.switch = w;
        return obj
      }
    }
    // support foo{1,9}
    if (hasMinMax.test(w) === true) {
      w = w.replace(hasMinMax, (_a, b, c) => {
        if (c === undefined) {
          // '{3}'	Exactly three times
          obj.min = Number(b);
          obj.max = Number(b);
        } else {
          c = c.replace(/, */, '');
          if (b === undefined) {
            // '{,9}' implied zero min
            obj.min = 0;
            obj.max = Number(c);
          } else {
            // '{2,4}' Two to four times
            obj.min = Number(b);
            // '{3,}' Three or more times
            obj.max = Number(c || 999);
          }
        }
        // use same method as '+'
        obj.greedy = true;
        // 0 as min means the same as '?'
        if (!obj.min) {
          obj.optional = true;
        }
        return ''
      });
    }
    //do the actual token content
    if (start(w) === '#') {
      obj.tag = stripStart(w);
      obj.tag = titleCase$2(obj.tag);
      return obj
    }
    //dynamic function on a term object
    if (start(w) === '@') {
      obj.method = stripStart(w);
      return obj
    }
    if (w === '.') {
      obj.anything = true;
      return obj
    }
    //support alone-astrix
    if (w === '*') {
      obj.anything = true;
      obj.greedy = true;
      obj.optional = true;
      return obj
    }
    if (w) {
      //somehow handle encoded-chars?
      w = w.replace('\\*', '*');
      w = w.replace('\\.', '.');
      if (opts.caseSensitive) {
        obj.use = 'text';
      } else {
        w = w.toLowerCase();
      }
      obj.word = w;
    }
    return obj
  };
  var parseToken$1 = parseToken;

  const hasDash$2 = /[a-z0-9][-–—][a-z]/i;

  // match 're-do' -> ['re','do']
  const splitHyphens$1 = function (regs, world) {
    let prefixes = world.model.one.prefixes;
    for (let i = regs.length - 1; i >= 0; i -= 1) {
      let reg = regs[i];
      if (reg.word && hasDash$2.test(reg.word)) {
        let words = reg.word.split(/[-–—]/g);
        // don't split 're-cycle', etc
        if (prefixes.hasOwnProperty(words[0])) {
          continue
        }
        words = words.filter(w => w).reverse();
        regs.splice(i, 1);
        words.forEach(w => {
          let obj = Object.assign({}, reg);
          obj.word = w;
          regs.splice(i, 0, obj);
        });
      }
    }
    return regs
  };
  var splitHyphens$2 = splitHyphens$1;

  const addVerbs = function (token, world) {
    let { verbConjugate } = world.methods.two.transform;
    let res = verbConjugate(token.root, world.model);
    delete res.FutureTense;
    return Object.values(res).filter(str => str)
  };

  const addNoun = function (token, world) {
    let { nounToPlural } = world.methods.two.transform;
    let res = [token.root];
    res.push(nounToPlural(token.root, world.model));
    return res
  };

  const addAdjective = function (token, world) {
    let { adjToSuperlative, adjToComparative, adjToAdverb } = world.methods.two.transform;
    let res = [token.root];
    res.push(adjToSuperlative(token.root, world.model));
    res.push(adjToComparative(token.root, world.model));
    res.push(adjToAdverb(token.root, world.model));
    return res
  };

  // turn '{walk}' into 'walking', 'walked', etc
  const inflectRoot = function (regs, world) {
    // do we have compromise/two?
    if (world.methods.two && world.methods.two.transform) {
      regs = regs.map(token => {
        // a reg to convert '{foo}'
        if (token.root) {
          let choices = [];
          if (!token.pos || token.pos === 'Verb') {
            choices = choices.concat(addVerbs(token, world));
          }
          if (!token.pos || token.pos === 'Noun') {
            choices = choices.concat(addNoun(token, world));
          }
          // don't run these by default
          if (!token.pos || token.pos === 'Adjective') {
            choices = choices.concat(addAdjective(token, world));
          }
          choices = choices.filter(str => str);
          if (choices.length > 0) {
            token.operator = 'or';
            token.fastOr = new Set(choices);
          }
        }
        return token
      });
    }
    return regs
  };
  var inflectRoot$1 = inflectRoot;

  // name any [unnamed] capture-groups with a number
  const nameGroups = function (regs) {
    let index = 0;
    let inGroup = null;
    //'fill in' capture groups between start-end
    for (let i = 0; i < regs.length; i++) {
      const token = regs[i];
      if (token.groupStart === true) {
        inGroup = token.group;
        if (inGroup === null) {
          inGroup = String(index);
          index += 1;
        }
      }
      if (inGroup !== null) {
        token.group = inGroup;
      }
      if (token.groupEnd === true) {
        inGroup = null;
      }
    }
    return regs
  };

  // optimize an 'or' lookup, when the (a|b|c) list is simple or multi-word
  const doFastOrMode = function (tokens) {
    return tokens.map(token => {
      if (token.choices !== undefined) {
        // make sure it's an OR
        if (token.operator !== 'or') {
          return token
        }
        if (token.fuzzy === true) {
          return token
        }
        // are they all straight-up words? then optimize them.
        let shouldPack = token.choices.every(block => {
          if (block.length !== 1) {
            return false
          }
          let reg = block[0];
          // ~fuzzy~ words need more care
          if (reg.fuzzy === true) {
            return false
          }
          // ^ and $ get lost in fastOr
          if (reg.start || reg.end) {
            return false
          }
          if (reg.word !== undefined && reg.negative !== true && reg.optional !== true && reg.method !== true) {
            return true //reg is simple-enough
          }
          return false
        });
        if (shouldPack === true) {
          token.fastOr = new Set();
          token.choices.forEach(block => {
            token.fastOr.add(block[0].word);
          });
          delete token.choices;
        }
      }
      return token
    })
  };

  // support ~(a|b|c)~
  const fuzzyOr = function (regs) {
    return regs.map(reg => {
      if (reg.fuzzy && reg.choices) {
        // pass fuzzy-data to each OR choice
        reg.choices.forEach(r => {
          if (r.length === 1 && r[0].word) {
            r[0].fuzzy = true;
            r[0].min = reg.min;
          }
        });
      }
      return reg
    })
  };

  const postProcess = function (regs) {
    // ensure all capture groups names are filled between start and end
    regs = nameGroups(regs);
    // convert 'choices' format to 'fastOr' format
    regs = doFastOrMode(regs);
    // support ~(foo|bar)~
    regs = fuzzyOr(regs);
    return regs
  };
  var postProcess$1 = postProcess;

  /** parse a match-syntax string into json */
  const syntax = function (input, opts, world) {
    // fail-fast
    if (input === null || input === undefined || input === '') {
      return []
    }
    opts = opts || {};
    if (typeof input === 'number') {
      input = String(input); //go for it?
    }
    let tokens = parseBlocks$1(input);
    //turn them into objects
    tokens = tokens.map(str => parseToken$1(str, opts));
    // '~re-do~'
    tokens = splitHyphens$2(tokens, world);
    // '{walk}'
    tokens = inflectRoot$1(tokens, world);
    //clean up anything weird
    tokens = postProcess$1(tokens);
    // console.log(tokens)
    return tokens
  };
  var parseMatch = syntax;

  const anyIntersection = function (setA, setB) {
    for (let elem of setB) {
      if (setA.has(elem)) {
        return true
      }
    }
    return false
  };
  // check words/tags against our cache
  const failFast = function (regs, cache) {
    for (let i = 0; i < regs.length; i += 1) {
      let reg = regs[i];
      if (reg.optional === true || reg.negative === true || reg.fuzzy === true) {
        continue
      }
      // is the word missing from the cache?
      if (reg.word !== undefined && cache.has(reg.word) === false) {
        return true
      }
      // is the tag missing?
      if (reg.tag !== undefined && cache.has('#' + reg.tag) === false) {
        return true
      }
      // perform a speedup for fast-or
      if (reg.fastOr && anyIntersection(reg.fastOr, cache) === false) {
        return false
      }
    }
    return false
  };
  var failFast$1 = failFast;

  // fuzzy-match (damerau-levenshtein)
  // Based on  tad-lispy /node-damerau-levenshtein
  // https://github.com/tad-lispy/node-damerau-levenshtein/blob/master/index.js
  // count steps (insertions, deletions, substitutions, or transpositions)
  const editDistance = function (strA, strB) {
    let aLength = strA.length,
      bLength = strB.length;
    // fail-fast
    if (aLength === 0) {
      return bLength
    }
    if (bLength === 0) {
      return aLength
    }
    // If the limit is not defined it will be calculate from this and that args.
    let limit = (bLength > aLength ? bLength : aLength) + 1;
    if (Math.abs(aLength - bLength) > (limit || 100)) {
      return limit || 100
    }
    // init the array
    let matrix = [];
    for (let i = 0; i < limit; i++) {
      matrix[i] = [i];
      matrix[i].length = limit;
    }
    for (let i = 0; i < limit; i++) {
      matrix[0][i] = i;
    }
    // Calculate matrix.
    let j, a_index, b_index, cost, min, t;
    for (let i = 1; i <= aLength; ++i) {
      a_index = strA[i - 1];
      for (j = 1; j <= bLength; ++j) {
        // Check the jagged distance total so far
        if (i === j && matrix[i][j] > 4) {
          return aLength
        }
        b_index = strB[j - 1];
        cost = a_index === b_index ? 0 : 1; // Step 5
        // Calculate the minimum (much faster than Math.min(...)).
        min = matrix[i - 1][j] + 1; // Deletion.
        if ((t = matrix[i][j - 1] + 1) < min) min = t; // Insertion.
        if ((t = matrix[i - 1][j - 1] + cost) < min) min = t; // Substitution.
        // Update matrix.
        let shouldUpdate =
          i > 1 && j > 1 && a_index === strB[j - 2] && strA[i - 2] === b_index && (t = matrix[i - 2][j - 2] + cost) < min;
        if (shouldUpdate) {
          matrix[i][j] = t;
        } else {
          matrix[i][j] = min;
        }
      }
    }
    // return number of steps
    return matrix[aLength][bLength]
  };
  // score similarity by from 0-1 (steps/length)
  const fuzzyMatch = function (strA, strB, minLength = 3) {
    if (strA === strB) {
      return 1
    }
    //don't even bother on tiny strings
    if (strA.length < minLength || strB.length < minLength) {
      return 0
    }
    const steps = editDistance(strA, strB);
    let length = Math.max(strA.length, strB.length);
    let relative = length === 0 ? 0 : steps / length;
    let similarity = 1 - relative;
    return similarity
  };
  var fuzzy = fuzzyMatch;

  // these methods are called with '@hasComma' in the match syntax
  // various unicode quotation-mark formats
  const startQuote =
    /([\u0022\uFF02\u0027\u201C\u2018\u201F\u201B\u201E\u2E42\u201A\u00AB\u2039\u2035\u2036\u2037\u301D\u0060\u301F])/;

  const endQuote = /([\u0022\uFF02\u0027\u201D\u2019\u00BB\u203A\u2032\u2033\u2034\u301E\u00B4])/;

  const hasHyphen$1 = /^[-–—]$/;
  const hasDash$1 = / [-–—] /;

  /** search the term's 'post' punctuation  */
  const hasPost = (term, punct) => term.post.indexOf(punct) !== -1;
  /** search the term's 'pre' punctuation  */
  const hasPre = (term, punct) => term.pre.indexOf(punct) !== -1;

  const methods$d = {
    /** does it have a quotation symbol?  */
    hasQuote: term => startQuote.test(term.pre) || endQuote.test(term.post),
    /** does it have a comma?  */
    hasComma: term => hasPost(term, ','),
    /** does it end in a period? */
    hasPeriod: term => hasPost(term, '.') === true && hasPost(term, '...') === false,
    /** does it end in an exclamation */
    hasExclamation: term => hasPost(term, '!'),
    /** does it end with a question mark? */
    hasQuestionMark: term => hasPost(term, '?') || hasPost(term, '¿'),
    /** is there a ... at the end? */
    hasEllipses: term => hasPost(term, '..') || hasPost(term, '…') || hasPre(term, '..') || hasPre(term, '…'),
    /** is there a semicolon after term word? */
    hasSemicolon: term => hasPost(term, ';'),
    /** is there a slash '/' in term word? */
    hasSlash: term => /\//.test(term.text),
    /** a hyphen connects two words like-term */
    hasHyphen: term => hasHyphen$1.test(term.post) || hasHyphen$1.test(term.pre),
    /** a dash separates words - like that */
    hasDash: term => hasDash$1.test(term.post) || hasDash$1.test(term.pre),
    /** is it multiple words combinded */
    hasContraction: term => Boolean(term.implicit),
    /** is it an acronym */
    isAcronym: term => term.tags.has('Acronym'),
    /** does it have any tags */
    isKnown: term => term.tags.size > 0,
    /** uppercase first letter, then a lowercase */
    isTitleCase: term => /^\p{Lu}[a-z'\u00C0-\u00FF]/u.test(term.text),
    /** uppercase all letters */
    isUpperCase: term => /^\p{Lu}+$/u.test(term.text),
  };
  // aliases
  methods$d.hasQuotation = methods$d.hasQuote;

  var termMethods = methods$d;

  //declare it up here
  let wrapMatch = function () { };
  /** ignore optional/greedy logic, straight-up term match*/
  const doesMatch$1 = function (term, reg, index, length) {
    // support '.'
    if (reg.anything === true) {
      return true
    }
    // support '^' (in parentheses)
    if (reg.start === true && index !== 0) {
      return false
    }
    // support '$' (in parentheses)
    if (reg.end === true && index !== length - 1) {
      return false
    }
    //support a text match
    if (reg.word !== undefined) {
      // check case-sensitivity, etc
      if (reg.use) {
        return reg.word === term[reg.use]
      }
      //match contractions, machine-form
      if (term.machine !== null && term.machine === reg.word) {
        return true
      }
      // term aliases for slashes and things
      if (term.alias !== undefined && term.alias.hasOwnProperty(reg.word)) {
        return true
      }
      // support ~ fuzzy match
      if (reg.fuzzy === true) {
        if (reg.word === term.root) {
          return true
        }
        let score = fuzzy(reg.word, term.normal);
        if (score >= reg.min) {
          return true
        }
      }
      // match slashes and things
      if (term.alias && term.alias.some(str => str === reg.word)) {
        return true
      }
      //match either .normal or .text
      return reg.word === term.text || reg.word === term.normal
    }
    //support #Tag
    if (reg.tag !== undefined) {
      return term.tags.has(reg.tag) === true
    }
    //support @method
    if (reg.method !== undefined) {
      if (typeof termMethods[reg.method] === 'function' && termMethods[reg.method](term) === true) {
        return true
      }
      return false
    }
    //support whitespace/punctuation
    if (reg.pre !== undefined) {
      return term.pre && term.pre.includes(reg.pre)
    }
    if (reg.post !== undefined) {
      return term.post && term.post.includes(reg.post)
    }
    //support /reg/
    if (reg.regex !== undefined) {
      let str = term.normal;
      if (reg.use) {
        str = term[reg.use];
      }
      return reg.regex.test(str)
    }
    //support <chunk>
    if (reg.chunk !== undefined) {
      return term.chunk === reg.chunk
    }
    //support %Noun|Verb%
    if (reg.switch !== undefined) {
      return term.switch === reg.switch
    }
    //support {machine}
    if (reg.machine !== undefined) {
      return term.normal === reg.machine || term.machine === reg.machine || term.root === reg.machine
    }
    //support {word/sense}
    if (reg.sense !== undefined) {
      return term.sense === reg.sense
    }
    // support optimized (one|two)
    if (reg.fastOr !== undefined) {
      // {work/verb} must be a verb
      if (reg.pos && !term.tags.has(reg.pos)) {
        return null
      }
      return reg.fastOr.has(term.implicit) || reg.fastOr.has(term.normal) || reg.fastOr.has(term.text) || reg.fastOr.has(term.machine)
    }
    //support slower (one|two)
    if (reg.choices !== undefined) {
      // try to support && operator
      if (reg.operator === 'and') {
        // must match them all
        return reg.choices.every(r => wrapMatch(term, r, index, length))
      }
      // or must match one
      return reg.choices.some(r => wrapMatch(term, r, index, length))
    }
    return false
  };
  // wrap result for !negative match logic
  wrapMatch = function (t, reg, index, length) {
    let result = doesMatch$1(t, reg, index, length);
    if (reg.negative === true) {
      return !result
    }
    return result
  };
  var matchTerm = wrapMatch;

  // for greedy checking, we no longer care about the reg.start
  // value, and leaving it can cause failures for anchored greedy
  // matches.  ditto for end-greedy matches: we need an earlier non-
  // ending match to succceed until we get to the actual end.
  const getGreedy = function (state, endReg) {
    let reg = Object.assign({}, state.regs[state.r], { start: false, end: false });
    let start = state.t;
    for (; state.t < state.terms.length; state.t += 1) {
      //stop for next-reg match
      if (endReg && matchTerm(state.terms[state.t], endReg, state.start_i + state.t, state.phrase_length)) {
        return state.t
      }
      let count = state.t - start + 1;
      // is it max-length now?
      if (reg.max !== undefined && count === reg.max) {
        return state.t
      }
      //stop here
      if (matchTerm(state.terms[state.t], reg, state.start_i + state.t, state.phrase_length) === false) {
        // is it too short?
        if (reg.min !== undefined && count < reg.min) {
          return null
        }
        return state.t
      }
    }
    return state.t
  };

  const greedyTo = function (state, nextReg) {
    let t = state.t;
    //if there's no next one, just go off the end!
    if (!nextReg) {
      return state.terms.length
    }
    //otherwise, we're looking for the next one
    for (; t < state.terms.length; t += 1) {
      if (matchTerm(state.terms[t], nextReg, state.start_i + t, state.phrase_length) === true) {
        // console.log(`greedyTo ${state.terms[t].normal}`)
        return t
      }
    }
    //guess it doesn't exist, then.
    return null
  };

  const isEndGreedy = function (reg, state) {
    if (reg.end === true && reg.greedy === true) {
      if (state.start_i + state.t < state.phrase_length - 1) {
        let tmpReg = Object.assign({}, reg, { end: false });
        if (matchTerm(state.terms[state.t], tmpReg, state.start_i + state.t, state.phrase_length) === true) {
          // console.log(`endGreedy ${state.terms[state.t].normal}`)
          return true
        }
      }
    }
    return false
  };

  const getGroup$2 = function (state, term_index) {
    if (state.groups[state.inGroup]) {
      return state.groups[state.inGroup]
    }
    state.groups[state.inGroup] = {
      start: term_index,
      length: 0,
    };
    return state.groups[state.inGroup]
  };

  //support 'unspecific greedy' .* properly
  // its logic is 'greedy until', where it's looking for the next token
  // '.+ foo' means we check for 'foo', indefinetly
  const doAstrix = function (state) {
    let { regs } = state;
    let reg = regs[state.r];

    let skipto = greedyTo(state, regs[state.r + 1]);
    //maybe we couldn't find it
    if (skipto === null || skipto === 0) {
      return null
    }
    // ensure it's long enough
    if (reg.min !== undefined && skipto - state.t < reg.min) {
      return null
    }
    // reduce it back, if it's too long
    if (reg.max !== undefined && skipto - state.t > reg.max) {
      state.t = state.t + reg.max;
      return true
    }
    // set the group result
    if (state.hasGroup === true) {
      const g = getGroup$2(state, state.t);
      g.length = skipto - state.t;
    }
    state.t = skipto;
    // log(`✓ |greedy|`)
    return true
  };
  var doAstrix$1 = doAstrix;

  const isArray$4 = function (arr) {
    return Object.prototype.toString.call(arr) === '[object Array]'
  };

  const doOrBlock$1 = function (state, skipN = 0) {
    let block = state.regs[state.r];
    let wasFound = false;
    // do each multiword sequence
    for (let c = 0; c < block.choices.length; c += 1) {
      // try to match this list of tokens
      let regs = block.choices[c];
      if (!isArray$4(regs)) {
        return false
      }
      wasFound = regs.every((cr, w_index) => {
        let extra = 0;
        let t = state.t + w_index + skipN + extra;
        if (state.terms[t] === undefined) {
          return false
        }
        let foundBlock = matchTerm(state.terms[t], cr, t + state.start_i, state.phrase_length);
        // this can be greedy - '(foo+ bar)'
        if (foundBlock === true && cr.greedy === true) {
          for (let i = 1; i < state.terms.length; i += 1) {
            let term = state.terms[t + i];
            if (term) {
              let keepGoing = matchTerm(term, cr, state.start_i + i, state.phrase_length);
              if (keepGoing === true) {
                extra += 1;
              } else {
                break
              }
            }
          }
        }
        skipN += extra;
        return foundBlock
      });
      if (wasFound) {
        skipN += regs.length;
        break
      }
    }
    // we found a match -  is it greedy though?
    if (wasFound && block.greedy === true) {
      return doOrBlock$1(state, skipN) // try it again!
    }
    return skipN
  };

  const doAndBlock$1 = function (state) {
    let longest = 0;
    // all blocks must match, and we return the greediest match
    let reg = state.regs[state.r];
    let allDidMatch = reg.choices.every(block => {
      //  for multi-word blocks, all must match
      let allWords = block.every((cr, w_index) => {
        let tryTerm = state.t + w_index;
        if (state.terms[tryTerm] === undefined) {
          return false
        }
        return matchTerm(state.terms[tryTerm], cr, tryTerm, state.phrase_length)
      });
      if (allWords === true && block.length > longest) {
        longest = block.length;
      }
      return allWords
    });
    if (allDidMatch === true) {
      // console.log(`doAndBlock ${state.terms[state.t].normal}`)
      return longest
    }
    return false
  };

  const orBlock = function (state) {
    const { regs } = state;
    let reg = regs[state.r];
    let skipNum = doOrBlock$1(state);
    // did we find a match?
    if (skipNum) {
      // handle 'not' logic
      if (reg.negative === true) {
        return null // die
      }
      // tuck in as named-group
      if (state.hasGroup === true) {
        const g = getGroup$2(state, state.t);
        g.length += skipNum;
      }
      // ensure we're at the end
      if (reg.end === true) {
        let end = state.phrase_length;
        if (state.t + state.start_i + skipNum !== end) {
          return null
        }
      }
      state.t += skipNum;
      // log(`✓ |found-or|`)
      return true
    } else if (!reg.optional) {
      return null //die
    }
    return true
  };
  var doOrBlock = orBlock;

  // '(foo && #Noun)' - require all matches on the term
  const andBlock = function (state) {
    const { regs } = state;
    let reg = regs[state.r];

    let skipNum = doAndBlock$1(state);
    if (skipNum) {
      // handle 'not' logic
      if (reg.negative === true) {
        return null // die
      }
      if (state.hasGroup === true) {
        const g = getGroup$2(state, state.t);
        g.length += skipNum;
      }
      // ensure we're at the end
      if (reg.end === true) {
        let end = state.phrase_length - 1;
        if (state.t + state.start_i !== end) {
          return null
        }
      }
      state.t += skipNum;
      // log(`✓ |found-and|`)
      return true
    } else if (!reg.optional) {
      return null //die
    }
    return true
  };
  var doAndBlock = andBlock;

  // '!foo' should match anything that isn't 'foo'
  // if it matches, return false
  const doNegative = function (state) {
    const { regs } = state;
    let reg = regs[state.r];
    let tmpReg = Object.assign({}, reg);
    tmpReg.negative = false; // try removing it
    let foundNeg = matchTerm(state.terms[state.t], tmpReg, state.start_i + state.t, state.phrase_length);
    if (foundNeg === true) {
      return null //bye!
    }
    return true
  };
  var doNegative$1 = doNegative;

  // 'foo? foo' matches are tricky.
  const foundOptional = function (state) {
    const { regs } = state;
    let reg = regs[state.r];
    let term = state.terms[state.t];
    // does the next reg match it too?
    let nextRegMatched = matchTerm(term, regs[state.r + 1], state.start_i + state.t, state.phrase_length);
    if (reg.negative || nextRegMatched) {
      // but does the next reg match the next term??
      // only skip if it doesn't
      let nextTerm = state.terms[state.t + 1];
      if (!nextTerm || !matchTerm(nextTerm, regs[state.r + 1], state.start_i + state.t, state.phrase_length)) {
        state.r += 1;
      }
    }
  };

  var foundOptional$1 = foundOptional;

  // keep 'foo+' or 'foo*' going..
  const greedyMatch = function (state) {
    const { regs, phrase_length } = state;
    let reg = regs[state.r];
    state.t = getGreedy(state, regs[state.r + 1]);
    if (state.t === null) {
      return null //greedy was too short
    }
    // foo{2,4} - has a greed-minimum
    if (reg.min && reg.min > state.t) {
      return null //greedy was too short
    }
    // 'foo+$' - if also an end-anchor, ensure we really reached the end
    if (reg.end === true && state.start_i + state.t !== phrase_length) {
      return null //greedy didn't reach the end
    }
    return true
  };
  var greedyMatch$1 = greedyMatch;

  // for: ['we', 'have']
  // a match for "we have" should work as normal
  // but matching "we've" should skip over implict terms
  const contractionSkip = function (state) {
    let term = state.terms[state.t];
    let reg = state.regs[state.r];
    // did we match the first part of a contraction?
    if (term.implicit && state.terms[state.t + 1]) {
      let nextTerm = state.terms[state.t + 1];
      // ensure next word is implicit
      if (!nextTerm.implicit) {
        return
      }
      // we matched "we've" - skip-over [we, have]
      if (reg.word === term.normal) {
        state.t += 1;
      }
      // also skip for @hasContraction
      if (reg.method === 'hasContraction') {
        state.t += 1;
      }
    }
  };
  var contractionSkip$1 = contractionSkip;

  // '[foo]' should also be logged as a group
  const setGroup = function (state, startAt) {
    let reg = state.regs[state.r];
    // Get or create capture group
    const g = getGroup$2(state, startAt);
    // Update group - add greedy or increment length
    if (state.t > 1 && reg.greedy) {
      g.length += state.t - startAt;
    } else {
      g.length++;
    }
  };

  // when a reg matches a term
  const simpleMatch = function (state) {
    const { regs } = state;
    let reg = regs[state.r];
    let term = state.terms[state.t];
    let startAt = state.t;
    // if it's a negative optional match... :0
    if (reg.optional && regs[state.r + 1] && reg.negative) {
      return true
    }
    // okay, it was a match, but if it's optional too,
    // we should check the next reg too, to skip it?
    if (reg.optional && regs[state.r + 1]) {
      foundOptional$1(state);
    }
    // Contraction skip:
    // did we match the first part of a contraction?
    if (term.implicit && state.terms[state.t + 1]) {
      contractionSkip$1(state);
    }
    //advance to the next term!
    state.t += 1;
    //check any ending '$' flags
    //if this isn't the last term, refuse the match
    if (reg.end === true && state.t !== state.terms.length && reg.greedy !== true) {
      return null //die
    }
    // keep 'foo+' going...
    if (reg.greedy === true) {
      let alive = greedyMatch$1(state);
      if (!alive) {
        return null
      }
    }
    // log '[foo]' as a group
    if (state.hasGroup === true) {
      setGroup(state, startAt);
    }
    return true
  };
  var simpleMatch$1 = simpleMatch;

  // i formally apologize for how complicated this is.

  /** 
   * try a sequence of match tokens ('regs') 
   * on a sequence of terms, 
   * starting at this certain term.
   */
  const tryHere = function (terms, regs, start_i, phrase_length) {
    if (terms.length === 0 || regs.length === 0) {
      return null
    }
    // all the variables that matter
    let state = {
      t: 0,
      terms: terms,
      r: 0,
      regs: regs,
      groups: {},
      start_i: start_i,
      phrase_length: phrase_length,
      inGroup: null,
    };

    // we must satisfy every token in 'regs'
    // if we get to the end, we have a match.
    for (; state.r < regs.length; state.r += 1) {
      let reg = regs[state.r];
      // Check if this reg has a named capture group
      state.hasGroup = Boolean(reg.group);
      // Reuse previous capture group if same
      if (state.hasGroup === true) {
        state.inGroup = reg.group;
      } else {
        state.inGroup = null;
      }
      //have we run-out of terms?
      if (!state.terms[state.t]) {
        //are all remaining regs optional or negative?
        const alive = regs.slice(state.r).some(remain => !remain.optional);
        if (alive === false) {
          break //done!
        }
        return null // die
      }
      // support 'unspecific greedy' .* properly
      if (reg.anything === true && reg.greedy === true) {
        let alive = doAstrix$1(state);
        if (!alive) {
          return null
        }
        continue
      }
      // slow-OR - multi-word OR (a|b|foo bar)
      if (reg.choices !== undefined && reg.operator === 'or') {
        let alive = doOrBlock(state);
        if (!alive) {
          return null
        }
        continue
      }
      // slow-AND - multi-word AND (#Noun && foo) blocks
      if (reg.choices !== undefined && reg.operator === 'and') {
        let alive = doAndBlock(state);
        if (!alive) {
          return null
        }
        continue
      }
      // support '.' as any-single
      if (reg.anything === true) {
        let alive = simpleMatch$1(state);
        if (!alive) {
          return null
        }
        continue
      }
      // support 'foo*$' until the end
      if (isEndGreedy(reg, state) === true) {
        let alive = simpleMatch$1(state);
        if (!alive) {
          return null
        }
        continue
      }
      // ok, finally test the term-reg
      let hasMatch = matchTerm(state.terms[state.t], reg, state.start_i + state.t, state.phrase_length);
      if (hasMatch === true) {
        let alive = simpleMatch$1(state);
        if (!alive) {
          return null
        }
        continue
      }
      // ok, it doesn't match - but maybe it wasn't *supposed* to?
      if (reg.negative) {
        let alive = doNegative$1(state);
        if (!alive) {
          return null
        }
      }
      //ok who cares, keep going
      if (reg.optional === true) {
        continue
      }

      // finally, we die
      return null
    }
    //return our results, as pointers
    let pntr = [null, start_i, state.t + start_i];
    if (pntr[1] === pntr[2]) {
      return null //found 0 terms
    }
    let groups = {};
    Object.keys(state.groups).forEach(k => {
      let o = state.groups[k];
      let start = start_i + o.start;
      groups[k] = [null, start, start + o.length];
    });
    return { pointer: pntr, groups: groups }
  };
  var fromHere = tryHere;

  // support returning a subset of a match
  // like 'foo [bar] baz' -> bar
  const getGroup = function (res, group) {
    let ptrs = [];
    let byGroup = {};
    if (res.length === 0) {
      return { ptrs, byGroup }
    }
    if (typeof group === 'number') {
      group = String(group);
    }
    if (group) {
      res.forEach(r => {
        if (r.groups[group]) {
          ptrs.push(r.groups[group]);
        }
      });
    } else {
      res.forEach(r => {
        ptrs.push(r.pointer);
        Object.keys(r.groups).forEach(k => {
          byGroup[k] = byGroup[k] || [];
          byGroup[k].push(r.groups[k]);
        });
      });
    }
    return { ptrs, byGroup }
  };
  var getGroup$1 = getGroup;

  // make proper pointers
  const addSentence = function (res, n) {
    res.pointer[0] = n;
    Object.keys(res.groups).forEach(k => {
      res.groups[k][0] = n;
    });
    return res
  };

  const handleStart = function (terms, regs, n) {
    let res = fromHere(terms, regs, 0, terms.length);
    if (res) {
      res = addSentence(res, n);
      return res //getGroup([res], group)
    }
    return null
  };

  // ok, here we go.
  const runMatch$2 = function (docs, todo, cache) {
    cache = cache || [];
    let { regs, group, justOne } = todo;
    let results = [];
    if (!regs || regs.length === 0) {
      return { ptrs: [], byGroup: {} }
    }

    const minLength = regs.filter(r => r.optional !== true && r.negative !== true).length;
    docs: for (let n = 0; n < docs.length; n += 1) {
      let terms = docs[n];
      // let index = terms[0].index || []
      // can we skip this sentence?
      if (cache[n] && failFast$1(regs, cache[n])) {
        continue
      }
      // ^start regs only run once, per phrase
      if (regs[0].start === true) {
        let foundStart = handleStart(terms, regs, n);
        if (foundStart) {
          results.push(foundStart);
        }
        continue
      }
      //ok, try starting the match now from every term
      for (let i = 0; i < terms.length; i += 1) {
        let slice = terms.slice(i);
        // ensure it's long-enough
        if (slice.length < minLength) {
          break
        }
        let res = fromHere(slice, regs, i, terms.length);
        // did we find a result?
        if (res) {
          // res = addSentence(res, index[0])
          res = addSentence(res, n);
          results.push(res);
          // should we stop here?
          if (justOne === true) {
            break docs
          }
          // skip ahead, over these results
          let end = res.pointer[2];
          if (Math.abs(end - 1) > i) {
            i = Math.abs(end - 1);
          }
        }
      }
    }
    // ensure any end-results ($) match until the last term
    if (regs[regs.length - 1].end === true) {
      results = results.filter(res => {
        let n = res.pointer[0];
        return docs[n].length === res.pointer[2]
      });
    }
    // grab the requested group
    results = getGroup$1(results, group);
    // add ids to pointers
    results.ptrs.forEach(ptr => {
      let [n, start, end] = ptr;
      ptr[3] = docs[n][start].id;//start-id
      ptr[4] = docs[n][end - 1].id;//end-id
    });
    return results
  };

  var match$1 = runMatch$2;

  const methods$b = {
    one: {
      termMethods,
      parseMatch,
      match: match$1,
    },
  };

  var methods$c = methods$b;

  var lib$3 = {
    /** pre-parse any match statements */
    parseMatch: function (str, opts) {
      const world = this.world();
      let killUnicode = world.methods.one.killUnicode;
      if (killUnicode) {
        str = killUnicode(str, world);
      }
      return world.methods.one.parseMatch(str, opts, world)
    }
  };

  var match = {
    api: api$u,
    methods: methods$c,
    lib: lib$3,
  };

  const isClass = /^\../;
  const isId = /^#./;

  const escapeXml = (str) => {
    str = str.replace(/&/g, '&amp;');
    str = str.replace(/</g, '&lt;');
    str = str.replace(/>/g, '&gt;');
    str = str.replace(/"/g, '&quot;');
    str = str.replace(/'/g, '&apos;');
    return str
  };

  // interpret .class, #id, tagName
  const toTag = function (k) {
    let start = '';
    let end = '</span>';
    k = escapeXml(k);
    if (isClass.test(k)) {
      start = `<span class="${k.replace(/^\./, '')}"`;
    } else if (isId.test(k)) {
      start = `<span id="${k.replace(/^#/, '')}"`;
    } else {
      start = `<${k}`;
      end = `</${k}>`;
    }
    start += '>';
    return { start, end }
  };

  const getIndex = function (doc, obj) {
    let starts = {};
    let ends = {};
    Object.keys(obj).forEach(k => {
      let res = obj[k];
      let tag = toTag(k);
      if (typeof res === 'string') {
        res = doc.match(res);
      }
      res.docs.forEach(terms => {
        // don't highlight implicit terms
        if (terms.every(t => t.implicit)) {
          return
        }
        let a = terms[0].id;
        starts[a] = starts[a] || [];
        starts[a].push(tag.start);
        let b = terms[terms.length - 1].id;
        ends[b] = ends[b] || [];
        ends[b].push(tag.end);
      });
    });
    return { starts, ends }
  };

  const html = function (obj) {
    // index ids to highlight
    let { starts, ends } = getIndex(this, obj);
    // create the text output
    let out = '';
    this.docs.forEach(terms => {
      for (let i = 0; i < terms.length; i += 1) {
        let t = terms[i];
        // do a span tag
        if (starts.hasOwnProperty(t.id)) {
          out += starts[t.id].join('');
        }
        out += t.pre || '' + t.text || '';
        if (ends.hasOwnProperty(t.id)) {
          out += ends[t.id].join('');
        }
        out += t.post || '';
      }
    });
    return out
  };
  var html$1 = { html };

  const trimEnd = /[,:;)\]*.?~!\u0022\uFF02\u201D\u2019\u00BB\u203A\u2032\u2033\u2034\u301E\u00B4—-]+$/;
  const trimStart =
    /^[(['"*~\uFF02\u201C\u2018\u201F\u201B\u201E\u2E42\u201A\u00AB\u2039\u2035\u2036\u2037\u301D\u0060\u301F]+/;

  const punctToKill = /[,:;)('"\u201D\]]/;
  const isHyphen = /^[-–—]$/;
  const hasSpace = / /;

  const textFromTerms = function (terms, opts, keepSpace = true) {
    let txt = '';
    terms.forEach((t) => {
      let pre = t.pre || '';
      let post = t.post || '';
      if (opts.punctuation === 'some') {
        pre = pre.replace(trimStart, '');
        // replace a hyphen with a space
        if (isHyphen.test(post)) {
          post = ' ';
        }
        post = post.replace(punctToKill, '');
        // cleanup exclamations
        post = post.replace(/\?!+/, '?');
        post = post.replace(/!+/, '!');
        post = post.replace(/\?+/, '?');
        // kill elipses
        post = post.replace(/\.{2,}/, '');
        // kill abbreviation periods
        if (t.tags.has('Abbreviation')) {
          post = post.replace(/\./, '');
        }
      }
      if (opts.whitespace === 'some') {
        pre = pre.replace(/\s/, ''); //remove pre-whitespace
        post = post.replace(/\s+/, ' '); //replace post-whitespace with a space
      }
      if (!opts.keepPunct) {
        pre = pre.replace(trimStart, '');
        if (post === '-') {
          post = ' ';
        } else {
          post = post.replace(trimEnd, '');
        }
      }
      // grab the correct word format
      let word = t[opts.form || 'text'] || t.normal || '';
      if (opts.form === 'implicit') {
        word = t.implicit || t.text;
      }
      if (opts.form === 'root' && t.implicit) {
        word = t.root || t.implicit || t.normal;
      }
      // add an implicit space, for contractions
      if ((opts.form === 'machine' || opts.form === 'implicit' || opts.form === 'root') && t.implicit) {
        if (!post || !hasSpace.test(post)) {
          post += ' ';
        }
      }
      txt += pre + word + post;
    });
    if (keepSpace === false) {
      txt = txt.trim();
    }
    if (opts.lowerCase === true) {
      txt = txt.toLowerCase();
    }
    return txt
  };

  const textFromDoc = function (docs, opts) {
    let text = '';
    if (!docs || !docs[0] || !docs[0][0]) {
      return text
    }
    for (let i = 0; i < docs.length; i += 1) {
      // middle
      text += textFromTerms(docs[i], opts, true);
    }
    if (!opts.keepSpace) {
      text = text.trim();
    }
    if (opts.keepPunct === false) {
      // don't remove ':)' etc
      if (!docs[0][0].tags.has('Emoticon')) {
        text = text.replace(trimStart, '');
      }
      let last = docs[docs.length - 1];
      if (!last[last.length - 1].tags.has('Emoticon')) {
        text = text.replace(trimEnd, '');
      }
    }
    if (opts.cleanWhitespace === true) {
      text = text.trim();
    }
    return text
  };

  const fmts = {
    text: {
      form: 'text',
    },
    normal: {
      whitespace: 'some',
      punctuation: 'some',
      case: 'some',
      unicode: 'some',
      form: 'normal',
    },
    machine: {
      whitespace: 'some',
      punctuation: 'some',
      case: 'none',
      unicode: 'some',
      form: 'machine',
    },
    root: {
      whitespace: 'some',
      punctuation: 'some',
      case: 'some',
      unicode: 'some',
      form: 'root',
    },
    implicit: {
      form: 'implicit',
    }
  };
  fmts.clean = fmts.normal;
  fmts.reduced = fmts.root;
  var fmts$1 = fmts;

  /* eslint-disable no-bitwise */
  /* eslint-disable no-mixed-operators */
  /* eslint-disable no-multi-assign */

  // https://github.com/jbt/tiny-hashes/
  let k = [], i$1 = 0;
  for (; i$1 < 64;) {
    k[i$1] = 0 | Math.sin(++i$1 % Math.PI) * 4294967296;
  }

  function md5(s) {
    let b, c, d,
      h = [b = 0x67452301, c = 0xEFCDAB89, ~b, ~c],
      words = [],
      j = decodeURI(encodeURI(s)) + '\x80',
      a = j.length;

    s = (--a / 4 + 2) | 15;

    words[--s] = a * 8;

    for (; ~a;) {
      words[a >> 2] |= j.charCodeAt(a) << 8 * a--;
    }

    for (i$1 = j = 0; i$1 < s; i$1 += 16) {
      a = h;

      for (; j < 64;
        a = [
          d = a[3],
          (
            b +
            ((d =
              a[0] +
              [
                b & c | ~b & d,
                d & b | ~d & c,
                b ^ c ^ d,
                c ^ (b | ~d)
              ][a = j >> 4] +
              k[j] +
              ~~words[i$1 | [
                j,
                5 * j + 1,
                3 * j + 5,
                7 * j
              ][a] & 15]
            ) << (a = [
              7, 12, 17, 22,
              5, 9, 14, 20,
              4, 11, 16, 23,
              6, 10, 15, 21
            ][4 * a + j++ % 4]) | d >>> -a)
          ),
          b,
          c
        ]
      ) {
        b = a[1] | 0;
        c = a[2];
      }
      for (j = 4; j;) h[--j] += a[j];
    }

    for (s = ''; j < 32;) {
      s += ((h[j >> 3] >> ((1 ^ j++) * 4)) & 15).toString(16);
    }

    return s;
  }

  // console.log(md5('food-safety'))

  const defaults$2 = {
    text: true,
    terms: true,
  };

  let opts = { case: 'none', unicode: 'some', form: 'machine', punctuation: 'some' };

  const merge = function (a, b) {
    return Object.assign({}, a, b)
  };

  const fns$2 = {
    text: (terms) => textFromTerms(terms, { keepPunct: true }, false),
    normal: (terms) => textFromTerms(terms, merge(fmts$1.normal, { keepPunct: true }), false),
    implicit: (terms) => textFromTerms(terms, merge(fmts$1.implicit, { keepPunct: true }), false),

    machine: (terms) => textFromTerms(terms, opts, false),
    root: (terms) => textFromTerms(terms, merge(opts, { form: 'root' }), false),

    hash: (terms) => md5(textFromTerms(terms, { keepPunct: true }, false)),

    offset: (terms) => {
      let len = fns$2.text(terms).length;
      return {
        index: terms[0].offset.index,
        start: terms[0].offset.start,
        length: len,
      }
    },
    terms: (terms) => {
      return terms.map(t => {
        let term = Object.assign({}, t);
        term.tags = Array.from(t.tags);
        return term
      })
    },
    confidence: (_terms, view, i) => view.eq(i).confidence(),
    syllables: (_terms, view, i) => view.eq(i).syllables(),
    sentence: (_terms, view, i) => view.eq(i).fullSentence().text(),
    dirty: (terms) => terms.some(t => t.dirty === true)
  };
  fns$2.sentences = fns$2.sentence;
  fns$2.clean = fns$2.normal;
  fns$2.reduced = fns$2.root;

  const toJSON$4 = function (view, option) {
    option = option || {};
    if (typeof option === 'string') {
      option = {};
    }
    option = Object.assign({}, defaults$2, option);
    // run any necessary upfront steps
    if (option.offset) {
      view.compute('offset');
    }
    return view.docs.map((terms, i) => {
      let res = {};
      Object.keys(option).forEach(k => {
        if (option[k] && fns$2[k]) {
          res[k] = fns$2[k](terms, view, i);
        }
      });
      return res
    })
  };


  const methods$a = {
    /** return data */
    json: function (n) {
      let res = toJSON$4(this, n);
      if (typeof n === 'number') {
        return res[n]
      }
      return res
    },
  };
  methods$a.data = methods$a.json;
  var json = methods$a;

  /* eslint-disable no-console */
  const logClientSide = function (view) {
    console.log('%c -=-=- ', 'background-color:#6699cc;');
    view.forEach(m => {
      console.groupCollapsed(m.text());
      let terms = m.docs[0];
      let out = terms.map(t => {
        let text = t.text || '-';
        if (t.implicit) {
          text = '[' + t.implicit + ']';
        }
        let tags = '[' + Array.from(t.tags).join(', ') + ']';
        return { text, tags }
      });
      console.table(out, ['text', 'tags']);
      console.groupEnd();
    });
  };
  var logClientSide$1 = logClientSide;

  // https://stackoverflow.com/questions/9781218/how-to-change-node-jss-console-font-color
  const reset = '\x1b[0m';

  //cheaper than requiring chalk
  const cli = {
    green: str => '\x1b[32m' + str + reset,
    red: str => '\x1b[31m' + str + reset,
    blue: str => '\x1b[34m' + str + reset,
    magenta: str => '\x1b[35m' + str + reset,
    cyan: str => '\x1b[36m' + str + reset,
    yellow: str => '\x1b[33m' + str + reset,
    black: str => '\x1b[30m' + str + reset,
    dim: str => '\x1b[2m' + str + reset,
    i: str => '\x1b[3m' + str + reset,
  };
  var cli$1 = cli;

  /* eslint-disable no-console */

  const tagString = function (tags, model) {
    if (model.one.tagSet) {
      tags = tags.map(tag => {
        if (!model.one.tagSet.hasOwnProperty(tag)) {
          return tag
        }
        const c = model.one.tagSet[tag].color || 'blue';
        return cli$1[c](tag)
      });
    }
    return tags.join(', ')
  };

  const showTags = function (view) {
    let { docs, model } = view;
    if (docs.length === 0) {
      console.log(cli$1.blue('\n     ──────'));
    }
    docs.forEach(terms => {
      console.log(cli$1.blue('\n  ┌─────────'));
      terms.forEach(t => {
        let tags = [...(t.tags || [])];
        let text = t.text || '-';
        if (t.sense) {
          text = '{' + t.sense + '}';
        }
        if (t.implicit) {
          text = '[' + t.implicit + ']';
        }
        text = cli$1.yellow(text);
        let word = "'" + text + "'";
        word = word.padEnd(18);
        let str = cli$1.blue('  │ ') + cli$1.i(word) + '  - ' + tagString(tags, model);
        console.log(str);
      });
    });
  };
  var showTags$1 = showTags;

  /* eslint-disable no-console */

  const showChunks = function (view) {
    let { docs } = view;
    console.log('');
    docs.forEach(terms => {
      let out = [];
      terms.forEach(term => {
        if (term.chunk === 'Noun') {
          out.push(cli$1.blue(term.implicit || term.normal));
        } else if (term.chunk === 'Verb') {
          out.push(cli$1.green(term.implicit || term.normal));
        } else if (term.chunk === 'Adjective') {
          out.push(cli$1.yellow(term.implicit || term.normal));
        } else if (term.chunk === 'Pivot') {
          out.push(cli$1.red(term.implicit || term.normal));
        } else {
          out.push(term.implicit || term.normal);
        }
      });
      console.log(out.join(' '), '\n');
    });
  };
  var showChunks$1 = showChunks;

  const split$1 = (txt, offset, index) => {
    let buff = index * 9; //there are 9 new chars addded to each highlight
    let start = offset.start + buff;
    let end = start + offset.length;
    let pre = txt.substring(0, start);
    let mid = txt.substring(start, end);
    let post = txt.substring(end, txt.length);
    return [pre, mid, post]
  };

  const spliceIn = function (txt, offset, index) {
    let parts = split$1(txt, offset, index);
    return `${parts[0]}${cli$1.blue(parts[1])}${parts[2]}`
  };

  const showHighlight = function (doc) {
    if (!doc.found) {
      return
    }
    let bySentence = {};
    doc.fullPointer.forEach(ptr => {
      bySentence[ptr[0]] = bySentence[ptr[0]] || [];
      bySentence[ptr[0]].push(ptr);
    });
    Object.keys(bySentence).forEach(k => {
      let full = doc.update([[Number(k)]]);
      let txt = full.text();
      let matches = doc.update(bySentence[k]);
      let json = matches.json({ offset: true });
      json.forEach((obj, i) => {
        txt = spliceIn(txt, obj.offset, i);
      });
      console.log(txt); // eslint-disable-line
    });
  };
  var showHighlight$1 = showHighlight;

  /* eslint-disable no-console */

  function isClientSide() {
    return typeof window !== 'undefined' && window.document
  }
  //output some helpful stuff to the console
  const debug = function (opts = {}) {
    let view = this;
    if (typeof opts === 'string') {
      let tmp = {};
      tmp[opts] = true; //allow string input
      opts = tmp;
    }
    if (isClientSide()) {
      logClientSide$1(view);
      return view
    }
    if (opts.tags !== false) {
      showTags$1(view);
      console.log('\n');
    }
    // output chunk-view, too
    if (opts.chunks === true) {
      showChunks$1(view);
      console.log('\n');
    }
    // highlight match in sentence
    if (opts.highlight === true) {
      showHighlight$1(view);
      console.log('\n');
    }
    return view
  };
  var debug$1 = debug;

  const toText$3 = function (term) {
    let pre = term.pre || '';
    let post = term.post || '';
    return pre + term.text + post
  };

  const findStarts = function (doc, obj) {
    let starts = {};
    Object.keys(obj).forEach(reg => {
      let m = doc.match(reg);
      m.fullPointer.forEach(a => {
        starts[a[3]] = { fn: obj[reg], end: a[2] };
      });
    });
    return starts
  };

  const wrap = function (doc, obj) {
    // index ids to highlight
    let starts = findStarts(doc, obj);
    let text = '';
    doc.docs.forEach((terms, n) => {
      for (let i = 0; i < terms.length; i += 1) {
        let t = terms[i];
        // do a span tag
        if (starts.hasOwnProperty(t.id)) {
          let { fn, end } = starts[t.id];
          let m = doc.update([[n, i, end]]);
          text += fn(m);
          i = end - 1;
          text += terms[i].post || '';
        } else {
          text += toText$3(t);
        }
      }
    });
    return text
  };
  var wrap$1 = wrap;

  const isObject$2 = val => {
    return Object.prototype.toString.call(val) === '[object Object]'
  };

  // sort by frequency
  const topk = function (arr) {
    let obj = {};
    arr.forEach(a => {
      obj[a] = obj[a] || 0;
      obj[a] += 1;
    });
    let res = Object.keys(obj).map(k => {
      return { normal: k, count: obj[k] }
    });
    return res.sort((a, b) => (a.count > b.count ? -1 : 0))
  };

  /** some named output formats */
  const out = function (method) {
    // support custom outputs
    if (isObject$2(method)) {
      return wrap$1(this, method)
    }
    // text out formats
    if (method === 'text') {
      return this.text()
    }
    if (method === 'normal') {
      return this.text('normal')
    }
    if (method === 'root') {
      return this.text('root')
    }
    if (method === 'machine' || method === 'reduced') {
      return this.text('machine')
    }
    if (method === 'hash' || method === 'md5') {
      return md5(this.text())
    }

    // json data formats
    if (method === 'json') {
      return this.json()
    }
    if (method === 'offset' || method === 'offsets') {
      this.compute('offset');
      return this.json({ offset: true })
    }
    if (method === 'array') {
      let arr = this.docs.map(terms => {
        return terms
          .reduce((str, t) => {
            return str + t.pre + t.text + t.post
          }, '')
          .trim()
      });
      return arr.filter(str => str)
    }
    // return terms sorted by frequency
    if (method === 'freq' || method === 'frequency' || method === 'topk') {
      return topk(this.json({ normal: true }).map(o => o.normal))
    }

    // some handy ad-hoc outputs
    if (method === 'terms') {
      let list = [];
      this.docs.forEach(s => {
        let terms = s.terms.map(t => t.text);
        terms = terms.filter(t => t);
        list = list.concat(terms);
      });
      return list
    }
    if (method === 'tags') {
      return this.docs.map(terms => {
        return terms.reduce((h, t) => {
          h[t.implicit || t.normal] = Array.from(t.tags);
          return h
        }, {})
      })
    }
    if (method === 'debug') {
      return this.debug() //allow
    }
    return this.text()
  };

  const methods$9 = {
    /** */
    debug: debug$1,
    /** */
    out: out,
  };

  var out$1 = methods$9;

  const isObject$1 = val => {
    return Object.prototype.toString.call(val) === '[object Object]'
  };

  var text = {
    /** */
    text: function (fmt) {
      let opts = {
        keepSpace: true,
        keepPunct: true,
      };
      if (fmt && typeof fmt === 'string' && fmts$1.hasOwnProperty(fmt)) {
        opts = Object.assign({}, fmts$1[fmt]);
      } else if (fmt && isObject$1(fmt)) {
        opts = Object.assign({}, fmt, opts);//todo: fixme
      }
      if (this.pointer) {
        opts.keepSpace = false;
        let ptr = this.pointer[0];
        if (ptr && ptr[1]) {
          opts.keepPunct = false;
        } else {
          opts.keepPunct = true;
        }
      } else {
        opts.keepPunct = true;
      }
      return textFromDoc(this.docs, opts)
    },
  };

  const methods$8 = Object.assign({}, out$1, text, json, html$1);

  const addAPI$1 = function (View) {
    Object.assign(View.prototype, methods$8);
  };
  var api$t = addAPI$1;

  var output = {
    api: api$t,
    methods: {
      one: {
        hash: md5
      }
    }
  };

  // do the pointers intersect?
  const doesOverlap = function (a, b) {
    if (a[0] !== b[0]) {
      return false
    }
    let [, startA, endA] = a;
    let [, startB, endB] = b;
    // [a,a,a,-,-,-,]
    // [-,-,b,b,b,-,]
    if (startA <= startB && endA > startB) {
      return true
    }
    // [-,-,-,a,a,-,]
    // [-,-,b,b,b,-,]
    if (startB <= startA && endB > startA) {
      return true
    }
    return false
  };

  // get widest min/max
  const getExtent = function (ptrs) {
    let min = ptrs[0][1];
    let max = ptrs[0][2];
    ptrs.forEach(ptr => {
      if (ptr[1] < min) {
        min = ptr[1];
      }
      if (ptr[2] > max) {
        max = ptr[2];
      }
    });
    return [ptrs[0][0], min, max]
  };

  // collect pointers by sentence number
  const indexN = function (ptrs) {
    let byN = {};
    ptrs.forEach(ref => {
      byN[ref[0]] = byN[ref[0]] || [];
      byN[ref[0]].push(ref);
    });
    return byN
  };

  // remove exact duplicates
  const uniquePtrs = function (arr) {
    let obj = {};
    for (let i = 0; i < arr.length; i += 1) {
      obj[arr[i].join(',')] = arr[i];
    }
    return Object.values(obj)
  };

  // a before b
  // console.log(doesOverlap([0, 0, 4], [0, 2, 5]))
  // // b before a
  // console.log(doesOverlap([0, 3, 4], [0, 1, 5]))
  // // disjoint
  // console.log(doesOverlap([0, 0, 3], [0, 4, 5]))
  // neighbours
  // console.log(doesOverlap([0, 1, 3], [0, 3, 5]))
  // console.log(doesOverlap([0, 3, 5], [0, 1, 3]))

  // console.log(
  //   getExtent([
  //     [0, 3, 4],
  //     [0, 4, 5],
  //     [0, 1, 2],
  //   ])
  // )

  // split a pointer, by match pointer
  const pivotBy = function (full, m) {
    let [n, start] = full;
    let mStart = m[1];
    let mEnd = m[2];
    let res = {};
    // is there space before the match?
    if (start < mStart) {
      let end = mStart < full[2] ? mStart : full[2]; // find closest end-point
      res.before = [n, start, end]; //before segment
    }
    res.match = m;
    // is there space after the match?
    if (full[2] > mEnd) {
      res.after = [n, mEnd, full[2]]; //after segment
    }
    return res
  };

  const doesMatch = function (full, m) {
    return full[1] <= m[1] && m[2] <= full[2]
  };

  const splitAll = function (full, m) {
    let byN = indexN(m);
    let res = [];
    full.forEach(ptr => {
      let [n] = ptr;
      let matches = byN[n] || [];
      matches = matches.filter(p => doesMatch(ptr, p));
      if (matches.length === 0) {
        res.push({ passthrough: ptr });
        return
      }
      // ensure matches are in-order
      matches = matches.sort((a, b) => a[1] - b[1]);
      // start splitting our left-to-right
      let carry = ptr;
      matches.forEach((p, i) => {
        let found = pivotBy(carry, p);
        // last one
        if (!matches[i + 1]) {
          res.push(found);
        } else {
          res.push({ before: found.before, match: found.match });
          if (found.after) {
            carry = found.after;
          }
        }
      });
    });
    return res
  };

  var splitAll$1 = splitAll;

  const max$1 = 4;

  // sweep-around looking for our start term uuid
  const blindSweep = function (id, doc, n) {
    for (let i = 0; i < max$1; i += 1) {
      // look up a sentence
      if (doc[n - i]) {
        let index = doc[n - i].findIndex(term => term.id === id);
        if (index !== -1) {
          return [n - i, index]
        }
      }
      // look down a sentence
      if (doc[n + i]) {
        let index = doc[n + i].findIndex(term => term.id === id);
        if (index !== -1) {
          return [n + i, index]
        }
      }
    }
    return null
  };

  const repairEnding = function (ptr, document) {
    let [n, start, , , endId] = ptr;
    let terms = document[n];
    // look for end-id
    let newEnd = terms.findIndex(t => t.id === endId);
    if (newEnd === -1) {
      // if end-term wasn't found, so go all the way to the end
      ptr[2] = document[n].length;
      ptr[4] = terms.length ? terms[terms.length - 1].id : null;
    } else {
      ptr[2] = newEnd; // repair ending pointer
    }
    return document[n].slice(start, ptr[2] + 1)
  };

  /** return a subset of the document, from a pointer */
  const getDoc$1 = function (ptrs, document) {
    let doc = [];
    ptrs.forEach((ptr, i) => {
      if (!ptr) {
        return
      }
      let [n, start, end, id, endId] = ptr; //parsePointer(ptr)
      let terms = document[n] || [];
      if (start === undefined) {
        start = 0;
      }
      if (end === undefined) {
        end = terms.length;
      }
      if (id && (!terms[start] || terms[start].id !== id)) {
        // console.log('  repairing pointer...')
        let wild = blindSweep(id, document, n);
        if (wild !== null) {
          let len = end - start;
          terms = document[wild[0]].slice(wild[1], wild[1] + len);
          // actually change the pointer
          let startId = terms[0] ? terms[0].id : null;
          ptrs[i] = [wild[0], wild[1], wild[1] + len, startId];
        }
      } else {
        terms = terms.slice(start, end);
      }
      if (terms.length === 0) {
        return
      }
      if (start === end) {
        return
      }
      // test end-id, if it exists
      if (endId && terms[terms.length - 1].id !== endId) {
        terms = repairEnding(ptr, document);
      }
      // otherwise, looks good!
      doc.push(terms);
    });
    doc = doc.filter(a => a.length > 0);
    return doc
  };
  var getDoc$2 = getDoc$1;

  // flat list of terms from nested document
  const termList = function (docs) {
    let arr = [];
    for (let i = 0; i < docs.length; i += 1) {
      for (let t = 0; t < docs[i].length; t += 1) {
        arr.push(docs[i][t]);
      }
    }
    return arr
  };

  var methods$7 = {
    one: {
      termList,
      getDoc: getDoc$2,
      pointer: {
        indexN,
        splitAll: splitAll$1,
      }
    },
  };

  // a union is a + b, minus duplicates
  const getUnion = function (a, b) {
    let both = a.concat(b);
    let byN = indexN(both);
    let res = [];
    both.forEach(ptr => {
      let [n] = ptr;
      if (byN[n].length === 1) {
        // we're alone on this sentence, so we're good
        res.push(ptr);
        return
      }
      // there may be overlaps
      let hmm = byN[n].filter(m => doesOverlap(ptr, m));
      hmm.push(ptr);
      let range = getExtent(hmm);
      res.push(range);
    });
    res = uniquePtrs(res);
    return res
  };
  var getUnion$1 = getUnion;

  // two disjoint
  // console.log(getUnion([[1, 3, 4]], [[0, 1, 2]]))
  // two disjoint
  // console.log(getUnion([[0, 3, 4]], [[0, 1, 2]]))
  // overlap-plus
  // console.log(getUnion([[0, 1, 4]], [[0, 2, 6]]))
  // overlap
  // console.log(getUnion([[0, 1, 4]], [[0, 2, 3]]))
  // neighbours
  // console.log(getUnion([[0, 1, 3]], [[0, 3, 5]]))

  const subtract = function (refs, not) {
    let res = [];
    let found = splitAll$1(refs, not);
    found.forEach(o => {
      if (o.passthrough) {
        res.push(o.passthrough);
      }
      if (o.before) {
        res.push(o.before);
      }
      if (o.after) {
        res.push(o.after);
      }
    });
    return res
  };
  var getDifference = subtract;

  // console.log(subtract([[0, 0, 2]], [[0, 0, 1]]))
  // console.log(subtract([[0, 0, 2]], [[0, 1, 2]]))

  // [a,a,a,a,-,-,]
  // [-,-,b,b,b,-,]
  // [-,-,x,x,-,-,]
  const intersection = function (a, b) {
    // find the latest-start
    let start = a[1] < b[1] ? b[1] : a[1];
    // find the earliest-end
    let end = a[2] > b[2] ? b[2] : a[2];
    // does it form a valid pointer?
    if (start < end) {
      return [a[0], start, end]
    }
    return null
  };

  const getIntersection = function (a, b) {
    let byN = indexN(b);
    let res = [];
    a.forEach(ptr => {
      let hmm = byN[ptr[0]] || [];
      hmm = hmm.filter(p => doesOverlap(ptr, p));
      // no sentence-pairs, so no intersection
      if (hmm.length === 0) {
        return
      }
      hmm.forEach(h => {
        let overlap = intersection(ptr, h);
        if (overlap) {
          res.push(overlap);
        }
      });
    });
    return res
  };
  var getIntersection$1 = getIntersection;

  // console.log(getIntersection([[0, 1, 3]], [[0, 2, 4]]))

  const isArray$3 = function (arr) {
    return Object.prototype.toString.call(arr) === '[object Array]'
  };

  const getDoc = (m, view) => {
    if (typeof m === 'string' || isArray$3(m)) {
      return view.match(m)
    }
    if (!m) {
      return view.none()
    }
    // support pre-parsed reg object
    return m
  };

  // 'harden' our json pointers, again
  const addIds = function (ptrs, docs) {
    return ptrs.map(ptr => {
      let [n, start] = ptr;
      if (docs[n] && docs[n][start]) {
        ptr[3] = docs[n][start].id;
      }
      return ptr
    })
  };

  const methods$6 = {};

  // all parts, minus duplicates
  methods$6.union = function (m) {
    m = getDoc(m, this);
    let ptrs = getUnion$1(this.fullPointer, m.fullPointer);
    ptrs = addIds(ptrs, this.document);
    return this.toView(ptrs)
  };
  methods$6.and = methods$6.union;

  // only parts they both have
  methods$6.intersection = function (m) {
    m = getDoc(m, this);
    let ptrs = getIntersection$1(this.fullPointer, m.fullPointer);
    ptrs = addIds(ptrs, this.document);
    return this.toView(ptrs)
  };

  // only parts of a that b does not have
  methods$6.not = function (m) {
    m = getDoc(m, this);
    let ptrs = getDifference(this.fullPointer, m.fullPointer);
    ptrs = addIds(ptrs, this.document);
    return this.toView(ptrs)
  };
  methods$6.difference = methods$6.not;

  // get opposite of a
  methods$6.complement = function () {
    let doc = this.all();
    let ptrs = getDifference(doc.fullPointer, this.fullPointer);
    ptrs = addIds(ptrs, this.document);
    return this.toView(ptrs)
  };

  // remove overlaps
  methods$6.settle = function () {
    let ptrs = this.fullPointer;
    ptrs.forEach(ptr => {
      ptrs = getUnion$1(ptrs, [ptr]);
    });
    ptrs = addIds(ptrs, this.document);
    return this.update(ptrs)
  };


  const addAPI = function (View) {
    // add set/intersection/union
    Object.assign(View.prototype, methods$6);
  };
  var api$s = addAPI;

  var pointers = {
    methods: methods$7,
    api: api$s,
  };

  var lib$2 = {
    // compile a list of matches into a match-net
    buildNet: function (matches) {
      const methods = this.methods();
      let net = methods.one.buildNet(matches, this.world());
      net.isNet = true;
      return net
    }
  };

  const api$q = function (View) {

    /** speedy match a sequence of matches */
    View.prototype.sweep = function (net, opts = {}) {
      const { world, docs } = this;
      const { methods } = world;
      let found = methods.one.bulkMatch(docs, net, this.methods, opts);

      // apply any changes
      if (opts.tagger !== false) {
        methods.one.bulkTagger(found, docs, this.world);
      }
      // fix the pointers
      // collect all found results into a View
      found = found.map(o => {
        let ptr = o.pointer;
        let term = docs[ptr[0]][ptr[1]];
        let len = ptr[2] - ptr[1];
        if (term.index) {
          o.pointer = [
            term.index[0],
            term.index[1],
            ptr[1] + len
          ];
        }
        return o
      });
      let ptrs = found.map(o => o.pointer);
      // cleanup results a bit
      found = found.map(obj => {
        obj.view = this.update([obj.pointer]);
        delete obj.regs;
        delete obj.needs;
        delete obj.pointer;
        delete obj._expanded;
        return obj
      });
      return {
        view: this.update(ptrs),
        found
      }
    };

  };
  var api$r = api$q;

  // extract the clear needs for an individual match token
  const getTokenNeeds = function (reg) {
    // negatives can't be cached
    if (reg.optional === true || reg.negative === true) {
      return null
    }
    if (reg.tag) {
      return '#' + reg.tag
    }
    if (reg.word) {
      return reg.word
    }
    if (reg.switch) {
      return `%${reg.switch}%`
    }
    return null
  };

  const getNeeds = function (regs) {
    let needs = [];
    regs.forEach(reg => {
      needs.push(getTokenNeeds(reg));
      // support AND (foo && tag)
      if (reg.operator === 'and' && reg.choices) {
        reg.choices.forEach(oneSide => {
          oneSide.forEach(r => {
            needs.push(getTokenNeeds(r));
          });
        });
      }
    });
    return needs.filter(str => str)
  };

  const getWants = function (regs) {
    let wants = [];
    let count = 0;
    regs.forEach(reg => {
      if (reg.operator === 'or' && !reg.optional && !reg.negative) {
        // add fast-or terms
        if (reg.fastOr) {
          Array.from(reg.fastOr).forEach(w => {
            wants.push(w);
          });
        }
        // add slow-or
        if (reg.choices) {
          reg.choices.forEach(rs => {
            rs.forEach(r => {
              let n = getTokenNeeds(r);
              if (n) {
                wants.push(n);
              }
            });
          });
        }
        count += 1;
      }
    });
    return { wants, count }
  };

  const parse$8 = function (matches, world) {
    const parseMatch = world.methods.one.parseMatch;
    matches.forEach(obj => {
      obj.regs = parseMatch(obj.match, {}, world);
      // wrap these ifNo properties into an array
      if (typeof obj.ifNo === 'string') {
        obj.ifNo = [obj.ifNo];
      }
      // cache any requirements up-front 
      obj.needs = getNeeds(obj.regs);
      let { wants, count } = getWants(obj.regs);
      obj.wants = wants;
      obj.minWant = count;
      // get rid of tiny sentences
      obj.minWords = obj.regs.filter(o => !o.optional).length;
    });
    return matches
  };

  var parse$9 = parse$8;

  // do some indexing on the list of matches
  const buildNet = function (matches, world) {
    // turn match-syntax into json
    matches = parse$9(matches, world);

    // collect by wants and needs
    let hooks = {};
    matches.forEach(obj => {
      // add needs
      obj.needs.forEach(str => {
        hooks[str] = hooks[str] || [];
        hooks[str].push(obj);
      });
      // add wants
      obj.wants.forEach(str => {
        hooks[str] = hooks[str] || [];
        hooks[str].push(obj);
      });
    });
    // remove duplicates
    Object.keys(hooks).forEach(k => {
      let already = {};
      hooks[k] = hooks[k].filter(obj => {
        if (already[obj.match]) {
          return false
        }
        already[obj.match] = true;
        return true
      });
    });

    // keep all un-cacheable matches (those with no needs) 
    let always = matches.filter(o => o.needs.length === 0 && o.wants.length === 0);
    return {
      hooks,
      always
    }
  };

  var buildNet$1 = buildNet;

  // for each cached-sentence, find a list of possible matches
  const getHooks = function (docCaches, hooks) {
    return docCaches.map((set, i) => {
      let maybe = [];
      Object.keys(hooks).forEach(k => {
        if (docCaches[i].has(k)) {
          maybe = maybe.concat(hooks[k]);
        }
      });
      // remove duplicates
      let already = {};
      maybe = maybe.filter(m => {
        if (already[m.match]) {
          return false
        }
        already[m.match] = true;
        return true
      });
      return maybe
    })
  };

  var getHooks$1 = getHooks;

  // filter-down list of maybe-matches
  const localTrim = function (maybeList, docCache) {
    return maybeList.map((list, n) => {
      let haves = docCache[n];
      // ensure all stated-needs of the match are met
      list = list.filter(obj => {
        return obj.needs.every(need => haves.has(need))
      });
      // ensure nothing matches in our 'ifNo' property
      list = list.filter(obj => {
        if (obj.ifNo !== undefined && obj.ifNo.some(no => docCache[n].has(no)) === true) {
          return false
        }
        return true
      });
      // ensure atleast one(?) of the wants is found
      list = list.filter(obj => {
        if (obj.wants.length === 0) {
          return true
        }
        // ensure there's one cache-hit
        let found = obj.wants.filter(str => haves.has(str)).length;
        return found >= obj.minWant
      });
      return list
    })
  };
  var trimDown = localTrim;

  // finally,
  // actually run these match-statements on the terms
  const runMatch = function (maybeList, document, methods, opts) {
    let results = [];
    for (let n = 0; n < maybeList.length; n += 1) {
      for (let i = 0; i < maybeList[n].length; i += 1) {
        let m = maybeList[n][i];
        // ok, actually do the work.
        let res = methods.one.match([document[n]], m);
        // found something.
        if (res.ptrs.length > 0) {
          // let index=document[n][0].index
          res.ptrs.forEach(ptr => {
            ptr[0] = n; // fix the sentence pointer
            let todo = Object.assign({}, m, { pointer: ptr });
            if (m.unTag !== undefined) {
              todo.unTag = m.unTag;
            }
            results.push(todo);
          });
          //ok cool, can we stop early?
          if (opts.matchOne === true) {
            return [results[0]]
          }
        }
      }
    }
    return results
  };
  var runMatch$1 = runMatch;

  const tooSmall = function (maybeList, document) {
    return maybeList.map((arr, i) => {
      let termCount = document[i].length;
      arr = arr.filter(o => {
        return termCount >= o.minWords
      });
      return arr
    })
  };

  const sweep$1 = function (document, net, methods, opts = {}) {
    // find suitable matches to attempt, on each sentence
    let docCache = methods.one.cacheDoc(document);
    // collect possible matches for this document
    let maybeList = getHooks$1(docCache, net.hooks);
    // ensure all defined needs are met for each match
    maybeList = trimDown(maybeList, docCache);
    // add unchacheable matches to each sentence's todo-list
    if (net.always.length > 0) {
      maybeList = maybeList.map(arr => arr.concat(net.always));
    }
    // if we don't have enough words
    maybeList = tooSmall(maybeList, document);

    // maybeList.forEach((arr, i) => {
    //   let txt = document[i].map(t => t.text).join(' ')
    //   console.log(`==== ${txt} ====`)
    //   arr.forEach(m => {
    //     console.log(`    - ${m.match}`)
    //   })
    // })

    // now actually run the matches
    let results = runMatch$1(maybeList, document, methods, opts);
    // console.dir(results, { depth: 5 })
    return results
  };
  var bulkMatch = sweep$1;

  // is this tag consistent with the tags they already have?
  const canBe = function (terms, tag, model) {
    let tagSet = model.one.tagSet;
    if (!tagSet.hasOwnProperty(tag)) {
      return true
    }
    let not = tagSet[tag].not || [];
    for (let i = 0; i < terms.length; i += 1) {
      let term = terms[i];
      for (let k = 0; k < not.length; k += 1) {
        if (term.tags.has(not[k]) === true) {
          return false //found a tag conflict - bail!
        }
      }
    }
    return true
  };
  var canBe$1 = canBe;

  const tagger$1 = function (list, document, world) {
    const { model, methods } = world;
    const { getDoc, setTag, unTag } = methods.one;
    if (list.length === 0) {
      return list
    }
    // some logging for debugging
    const env = typeof process === 'undefined' || !process.env ? self.env || {} : process.env;
    if (env.DEBUG_TAGS) {
      console.log(`\n\n  \x1b[32m→ ${list.length} post-tagger:\x1b[0m`); //eslint-disable-line
    }
    return list.map(todo => {
      if (!todo.tag && !todo.chunk && !todo.unTag) {
        return
      }
      let reason = todo.reason || todo.match;
      let terms = getDoc([todo.pointer], document)[0];
      // handle 'safe' tag
      if (todo.safe === true) {
        // check for conflicting tags
        if (canBe$1(terms, todo.tag, model) === false) {
          return
        }
        // dont tag half of a hyphenated word
        if (terms[terms.length - 1].post === '-') {
          return
        }
      }
      if (todo.tag !== undefined) {
        setTag(terms, todo.tag, world, todo.safe, `[post] '${reason}'`);
        // quick and dirty plural tagger
        if (terms.length === 1 && todo.tag === 'Noun') {
          if (terms[0].text && terms[0].text.match(/..s$/) !== null) {
            setTag(terms, 'Plural', world, todo.safe, 'quick-plural');
          }
        }
      }
      if (todo.unTag !== undefined) {
        unTag(terms, todo.unTag, world, todo.safe, reason);
      }
      // allow setting chunks, too
      if (todo.chunk) {
        terms.forEach(t => t.chunk = todo.chunk);
      }
    })
  };
  var bulkTagger = tagger$1;

  var methods$5 = {
    buildNet: buildNet$1,
    bulkMatch,
    bulkTagger
  };

  var sweep = {
    lib: lib$2,
    api: api$r,
    methods: {
      one: methods$5,
    }
  };

  const isMulti = / /;

  const addChunk = function (term, tag) {
    if (tag === 'Noun') {
      term.chunk = tag;
    }
    if (tag === 'Verb') {
      term.chunk = tag;
    }
  };

  const tagTerm = function (term, tag, tagSet, isSafe) {
    // does it already have this tag?
    if (term.tags.has(tag) === true) {
      return null
    }
    // allow this shorthand in multiple-tag strings
    if (tag === '.') {
      return null
    }
    // for known tags, do logical dependencies first
    let known = tagSet[tag];
    if (known) {
      // first, we remove any conflicting tags
      if (known.not && known.not.length > 0) {
        for (let o = 0; o < known.not.length; o += 1) {
          // if we're in tagSafe, skip this term.
          if (isSafe === true && term.tags.has(known.not[o])) {
            return null
          }
          term.tags.delete(known.not[o]);
        }
      }
      // add parent tags
      if (known.parents && known.parents.length > 0) {
        for (let o = 0; o < known.parents.length; o += 1) {
          term.tags.add(known.parents[o]);
          addChunk(term, known.parents[o]);
        }
      }
    }
    // finally, add our tag
    term.tags.add(tag);
    // now it's dirty?
    term.dirty = true;
    // add a chunk too, if it's easy
    addChunk(term, tag);
    return true
  };

  // support '#Noun . #Adjective' syntax
  const multiTag = function (terms, tagString, tagSet, isSafe) {
    let tags = tagString.split(isMulti);
    terms.forEach((term, i) => {
      let tag = tags[i];
      if (tag) {
        tag = tag.replace(/^#/, '');
        tagTerm(term, tag, tagSet, isSafe);
      }
    });
  };

  const isArray$2 = function (arr) {
    return Object.prototype.toString.call(arr) === '[object Array]'
  };

  // verbose-mode tagger debuging
  const log$1 = (terms, tag, reason = '') => {
    const yellow = str => '\x1b[33m\x1b[3m' + str + '\x1b[0m';
    const i = str => '\x1b[3m' + str + '\x1b[0m';
    let word = terms.map(t => {
      return t.text || '[' + t.implicit + ']'
    }).join(' ');
    if (typeof tag !== 'string' && tag.length > 2) {
      tag = tag.slice(0, 2).join(', #') + ' +'; //truncate the list of tags
    }
    tag = typeof tag !== 'string' ? tag.join(', #') : tag;
    console.log(` ${yellow(word).padEnd(24)} \x1b[32m→\x1b[0m #${tag.padEnd(22)}  ${i(reason)}`); // eslint-disable-line
  };

  // add a tag to all these terms
  const setTag$1 = function (terms, tag, world = {}, isSafe, reason) {
    const tagSet = world.model.one.tagSet || {};
    if (!tag) {
      return
    }
    // some logging for debugging
    const env = typeof process === 'undefined' || !process.env ? self.env || {} : process.env;
    if (env && env.DEBUG_TAGS) {
      log$1(terms, tag, reason);
    }
    if (isArray$2(tag) === true) {
      tag.forEach(tg => setTag$1(terms, tg, world, isSafe));
      return
    }
    tag = tag.trim();
    // support '#Noun . #Adjective' syntax
    if (isMulti.test(tag)) {
      multiTag(terms, tag, tagSet, isSafe);
      return
    }
    tag = tag.replace(/^#/, '');
    // let set = false
    for (let i = 0; i < terms.length; i += 1) {
      tagTerm(terms[i], tag, tagSet, isSafe);
    }
  };
  var setTag$2 = setTag$1;

  // remove this tag, and its children, from these terms
  const unTag = function (terms, tag, tagSet) {
    tag = tag.trim().replace(/^#/, '');
    for (let i = 0; i < terms.length; i += 1) {
      let term = terms[i];
      // support clearing all tags, with '*'
      if (tag === '*') {
        term.tags.clear();
        continue
      }
      // for known tags, do logical dependencies first
      let known = tagSet[tag];
      // removing #Verb should also remove #PastTense
      if (known && known.children.length > 0) {
        for (let o = 0; o < known.children.length; o += 1) {
          term.tags.delete(known.children[o]);
        }
      }
      term.tags.delete(tag);
    }
  };
  var unTag$1 = unTag;

  const e=function(e){return e.children=e.children||[],e._cache=e._cache||{},e.props=e.props||{},e._cache.parents=e._cache.parents||[],e._cache.children=e._cache.children||[],e},t=/^ *(#|\/\/)/,n$1=function(t){let n=t.trim().split(/->/),r=[];n.forEach((t=>{r=r.concat(function(t){if(!(t=t.trim()))return null;if(/^\[/.test(t)&&/\]$/.test(t)){let n=(t=(t=t.replace(/^\[/,"")).replace(/\]$/,"")).split(/,/);return n=n.map((e=>e.trim())).filter((e=>e)),n=n.map((t=>e({id:t}))),n}return [e({id:t})]}(t));})),r=r.filter((e=>e));let i=r[0];for(let e=1;e<r.length;e+=1)i.children.push(r[e]),i=r[e];return r[0]},r=(e,t)=>{let n=[],r=[e];for(;r.length>0;){let e=r.pop();n.push(e),e.children&&e.children.forEach((n=>{t&&t(e,n),r.push(n);}));}return n},i=e=>"[object Array]"===Object.prototype.toString.call(e),c=e=>(e=e||"").trim(),s$1=function(c=[]){return "string"==typeof c?function(r){let i=r.split(/\r?\n/),c=[];i.forEach((e=>{if(!e.trim()||t.test(e))return;let r=(e=>{const t=/^( {2}|\t)/;let n=0;for(;t.test(e);)e=e.replace(t,""),n+=1;return n})(e);c.push({indent:r,node:n$1(e)});}));let s=function(e){let t={children:[]};return e.forEach(((n,r)=>{0===n.indent?t.children=t.children.concat(n.node):e[r-1]&&function(e,t){let n=e[t].indent;for(;t>=0;t-=1)if(e[t].indent<n)return e[t];return e[0]}(e,r).node.children.push(n.node);})),t}(c);return s=e(s),s}(c):i(c)?function(t){let n={};t.forEach((e=>{n[e.id]=e;}));let r=e({});return t.forEach((t=>{if((t=e(t)).parent)if(n.hasOwnProperty(t.parent)){let e=n[t.parent];delete t.parent,e.children.push(t);}else console.warn(`[Grad] - missing node '${t.parent}'`);else r.children.push(t);})),r}(c):(r(s=c).forEach(e),s);var s;},h=e=>"[31m"+e+"[0m",o=e=>"[2m"+e+"[0m",l=function(e,t){let n="-> ";t&&(n=o("→ "));let i="";return r(e).forEach(((e,r)=>{let c=e.id||"";if(t&&(c=h(c)),0===r&&!e.id)return;let s=e._cache.parents.length;i+="    ".repeat(s)+n+c+"\n";})),i},a=function(e){let t=r(e);t.forEach((e=>{delete(e=Object.assign({},e)).children;}));let n=t[0];return n&&!n.id&&0===Object.keys(n.props).length&&t.shift(),t},p$1={text:l,txt:l,array:a,flat:a},d=function(e,t){return "nested"===t||"json"===t?e:"debug"===t?(console.log(l(e,!0)),null):p$1.hasOwnProperty(t)?p$1[t](e):e},u=e=>{r(e,((e,t)=>{e.id&&(e._cache.parents=e._cache.parents||[],t._cache.parents=e._cache.parents.concat([e.id]));}));},f$1=(e,t)=>(Object.keys(t).forEach((n=>{if(t[n]instanceof Set){let r=e[n]||new Set;e[n]=new Set([...r,...t[n]]);}else {if((e=>e&&"object"==typeof e&&!Array.isArray(e))(t[n])){let r=e[n]||{};e[n]=Object.assign({},t[n],r);}else i(t[n])?e[n]=t[n].concat(e[n]||[]):void 0===e[n]&&(e[n]=t[n]);}})),e),j=/\//;class g$1{constructor(e={}){Object.defineProperty(this,"json",{enumerable:!1,value:e,writable:!0});}get children(){return this.json.children}get id(){return this.json.id}get found(){return this.json.id||this.json.children.length>0}props(e={}){let t=this.json.props||{};return "string"==typeof e&&(t[e]=!0),this.json.props=Object.assign(t,e),this}get(t){if(t=c(t),!j.test(t)){let e=this.json.children.find((e=>e.id===t));return new g$1(e)}let n=((e,t)=>{let n=(e=>"string"!=typeof e?e:(e=e.replace(/^\//,"")).split(/\//))(t=t||"");for(let t=0;t<n.length;t+=1){let r=e.children.find((e=>e.id===n[t]));if(!r)return null;e=r;}return e})(this.json,t)||e({});return new g$1(n)}add(t,n={}){if(i(t))return t.forEach((e=>this.add(c(e),n))),this;t=c(t);let r=e({id:t,props:n});return this.json.children.push(r),new g$1(r)}remove(e){return e=c(e),this.json.children=this.json.children.filter((t=>t.id!==e)),this}nodes(){return r(this.json).map((e=>(delete(e=Object.assign({},e)).children,e)))}cache(){return (e=>{let t=r(e,((e,t)=>{e.id&&(e._cache.parents=e._cache.parents||[],e._cache.children=e._cache.children||[],t._cache.parents=e._cache.parents.concat([e.id]));})),n={};t.forEach((e=>{e.id&&(n[e.id]=e);})),t.forEach((e=>{e._cache.parents.forEach((t=>{n.hasOwnProperty(t)&&n[t]._cache.children.push(e.id);}));})),e._cache.children=Object.keys(n);})(this.json),this}list(){return r(this.json)}fillDown(){var e;return e=this.json,r(e,((e,t)=>{t.props=f$1(t.props,e.props);})),this}depth(){u(this.json);let e=r(this.json),t=e.length>1?1:0;return e.forEach((e=>{if(0===e._cache.parents.length)return;let n=e._cache.parents.length+1;n>t&&(t=n);})),t}out(e){return u(this.json),d(this.json,e)}debug(){return u(this.json),d(this.json,"debug"),this}}const _=function(e){let t=s$1(e);return new g$1(t)};_.prototype.plugin=function(e){e(this);};

  // i just made these up
  const colors = {
    Noun: 'blue',
    Verb: 'green',
    Negative: 'green',
    Date: 'red',
    Value: 'red',
    Adjective: 'magenta',
    Preposition: 'cyan',
    Conjunction: 'cyan',
    Determiner: 'cyan',
    Adverb: 'cyan',
  };

  var colors$1 = colors;

  const getColor = function (node) {
    if (colors$1.hasOwnProperty(node.id)) {
      return colors$1[node.id]
    }
    if (colors$1.hasOwnProperty(node.is)) {
      return colors$1[node.is]
    }
    let found = node._cache.parents.find(c => colors$1[c]);
    return colors$1[found]
  };

  // convert tags to our final format
  const fmt = function (nodes) {
    const res = {};
    nodes.forEach(node => {
      let { not, also, is, novel } = node.props;
      let parents = node._cache.parents;
      if (also) {
        parents = parents.concat(also);
      }
      res[node.id] = {
        is,
        not,
        novel,
        also,
        parents,
        children: node._cache.children,
        color: getColor(node)
      };
    });
    // lastly, add all children of all nots
    Object.keys(res).forEach(k => {
      let nots = new Set(res[k].not);
      res[k].not.forEach(not => {
        if (res[not]) {
          res[not].children.forEach(tag => nots.add(tag));
        }
      });
      res[k].not = Array.from(nots);
    });
    return res
  };

  var fmt$1 = fmt;

  const toArr = function (input) {
    if (!input) {
      return []
    }
    if (typeof input === 'string') {
      return [input]
    }
    return input
  };

  const addImplied = function (tags, already) {
    Object.keys(tags).forEach(k => {
      // support deprecated fmts
      if (tags[k].isA) {
        tags[k].is = tags[k].isA;
      }
      if (tags[k].notA) {
        tags[k].not = tags[k].notA;
      }
      // add any implicit 'is' tags
      if (tags[k].is && typeof tags[k].is === 'string') {
        if (!already.hasOwnProperty(tags[k].is) && !tags.hasOwnProperty(tags[k].is)) {
          tags[tags[k].is] = {};
        }
      }
      // add any implicit 'not' tags
      if (tags[k].not && typeof tags[k].not === 'string' && !tags.hasOwnProperty(tags[k].not)) {
        if (!already.hasOwnProperty(tags[k].not) && !tags.hasOwnProperty(tags[k].not)) {
          tags[tags[k].not] = {};
        }
      }
    });
    return tags
  };


  const validate = function (tags, already) {

    tags = addImplied(tags, already);

    // property validation
    Object.keys(tags).forEach(k => {
      tags[k].children = toArr(tags[k].children);
      tags[k].not = toArr(tags[k].not);
    });
    // not links are bi-directional
    // add any incoming not tags
    Object.keys(tags).forEach(k => {
      let nots = tags[k].not || [];
      nots.forEach(no => {
        if (tags[no] && tags[no].not) {
          tags[no].not.push(k);
        }
      });
    });
    return tags
  };
  var validate$1 = validate;

  // 'fill-down' parent logic inference
  const compute$6 = function (allTags) {
    // setup graph-lib format
    const flatList = Object.keys(allTags).map(k => {
      let o = allTags[k];
      const props = { not: new Set(o.not), also: o.also, is: o.is, novel: o.novel };
      return { id: k, parent: o.is, props, children: [] }
    });
    const graph = _(flatList).cache().fillDown();
    return graph.out('array')
  };

  const fromUser = function (tags) {
    Object.keys(tags).forEach(k => {
      tags[k] = Object.assign({}, tags[k]);
      tags[k].novel = true;
    });
    return tags
  };

  const addTags$1 = function (tags, already) {
    // are these tags internal ones, or user-generated?
    if (Object.keys(already).length > 0) {
      tags = fromUser(tags);
    }
    tags = validate$1(tags, already);

    let allTags = Object.assign({}, already, tags);
    // do some basic setting-up
    // 'fill-down' parent logic
    const nodes = compute$6(allTags);
    // convert it to our final format
    const res = fmt$1(nodes);
    return res
  };
  var addTags$2 = addTags$1;

  var methods$4 = {
    one: {
      setTag: setTag$2,
      unTag: unTag$1,
      addTags: addTags$2
    },
  };

  /* eslint no-console: 0 */
  const isArray$1 = function (arr) {
    return Object.prototype.toString.call(arr) === '[object Array]'
  };
  const fns$1 = {
    /** add a given tag, to all these terms */
    tag: function (input, reason = '', isSafe) {
      if (!this.found || !input) {
        return this
      }
      let terms = this.termList();
      if (terms.length === 0) {
        return this
      }
      const { methods, verbose, world } = this;
      // logger
      if (verbose === true) {
        console.log(' +  ', input, reason || '');
      }
      if (isArray$1(input)) {
        input.forEach(tag => methods.one.setTag(terms, tag, world, isSafe, reason));
      } else {
        methods.one.setTag(terms, input, world, isSafe, reason);
      }
      // uncache
      this.uncache();
      return this
    },

    /** add a given tag, only if it is consistent */
    tagSafe: function (input, reason = '') {
      return this.tag(input, reason, true)
    },

    /** remove a given tag from all these terms */
    unTag: function (input, reason) {
      if (!this.found || !input) {
        return this
      }
      let terms = this.termList();
      if (terms.length === 0) {
        return this
      }
      const { methods, verbose, model } = this;
      // logger
      if (verbose === true) {
        console.log(' -  ', input, reason || '');
      }
      let tagSet = model.one.tagSet;
      if (isArray$1(input)) {
        input.forEach(tag => methods.one.unTag(terms, tag, tagSet));
      } else {
        methods.one.unTag(terms, input, tagSet);
      }
      // uncache
      this.uncache();
      return this
    },

    /** return only the terms that can be this tag  */
    canBe: function (tag) {
      let tagSet = this.model.one.tagSet;
      // everything can be an unknown tag
      if (!tagSet.hasOwnProperty(tag)) {
        return this
      }
      let not = tagSet[tag].not || [];
      let nope = [];
      this.document.forEach((terms, n) => {
        terms.forEach((term, i) => {
          let found = not.find(no => term.tags.has(no));
          if (found) {
            nope.push([n, i, i + 1]);
          }
        });
      });
      let noDoc = this.update(nope);
      return this.difference(noDoc)
    },
  };
  var tag$1 = fns$1;

  const tagAPI = function (View) {
    Object.assign(View.prototype, tag$1);
  };
  var api$p = tagAPI;

  // wire-up more pos-tags to our model
  const addTags = function (tags) {
    const { model, methods } = this.world();
    const tagSet = model.one.tagSet;
    const fn = methods.one.addTags;
    let res = fn(tags, tagSet);
    model.one.tagSet = res;
    return this
  };

  var lib$1 = { addTags };

  const boringTags = new Set(['Auxiliary', 'Possessive']);

  const sortByKids = function (tags, tagSet) {
    tags = tags.sort((a, b) => {
      // (unknown tags are interesting)
      if (boringTags.has(a) || !tagSet.hasOwnProperty(b)) {
        return 1
      }
      if (boringTags.has(b) || !tagSet.hasOwnProperty(a)) {
        return -1
      }
      let kids = tagSet[a].children || [];
      let aKids = kids.length;
      kids = tagSet[b].children || [];
      let bKids = kids.length;
      return aKids - bKids
    });
    return tags
  };

  const tagRank = function (view) {
    const { document, world } = view;
    const tagSet = world.model.one.tagSet;
    document.forEach(terms => {
      terms.forEach(term => {
        let tags = Array.from(term.tags);
        term.tagRank = sortByKids(tags, tagSet);
      });
    });
  };
  var tagRank$1 = tagRank;

  var tag = {
    model: {
      one: { tagSet: {} }
    },
    compute: {
      tagRank: tagRank$1
    },
    methods: methods$4,
    api: api$p,
    lib: lib$1
  };

  const initSplit = /(\S.+?[.!?\u203D\u2E18\u203C\u2047-\u2049])(?=\s|$)/g; //!TODO: speedup this regex
  const newLine = /((?:\r?\n|\r)+)/; // Match different new-line formats
  // Start with a regex:
  const basicSplit = function (text) {
    let all = [];
    //first, split by newline
    let lines = text.split(newLine);
    for (let i = 0; i < lines.length; i++) {
      //split by period, question-mark, and exclamation-mark
      let arr = lines[i].split(initSplit);
      for (let o = 0; o < arr.length; o++) {
        all.push(arr[o]);
      }
    }
    return all
  };
  var simpleSplit = basicSplit;

  const hasLetter$1 = /[a-z0-9\u00C0-\u00FF\u00a9\u00ae\u2000-\u3300\ud000-\udfff]/i;
  const hasSomething$1 = /\S/;

  const notEmpty = function (splits) {
    let chunks = [];
    for (let i = 0; i < splits.length; i++) {
      let s = splits[i];
      if (s === undefined || s === '') {
        continue
      }
      //this is meaningful whitespace
      if (hasSomething$1.test(s) === false || hasLetter$1.test(s) === false) {
        //add it to the last one
        if (chunks[chunks.length - 1]) {
          chunks[chunks.length - 1] += s;
          continue
        } else if (splits[i + 1]) {
          //add it to the next one
          splits[i + 1] = s + splits[i + 1];
          continue
        }
      }
      //else, only whitespace, no terms, no sentence
      chunks.push(s);
    }
    return chunks
  };
  var simpleMerge = notEmpty;

  //loop through these chunks, and join the non-sentence chunks back together..
  const smartMerge = function (chunks, world) {
    const isSentence = world.methods.one.tokenize.isSentence;
    const abbrevs = world.model.one.abbreviations || new Set();

    let sentences = [];
    for (let i = 0; i < chunks.length; i++) {
      let c = chunks[i];
      //should this chunk be combined with the next one?
      if (chunks[i + 1] && isSentence(c, abbrevs) === false) {
        chunks[i + 1] = c + (chunks[i + 1] || '');
      } else if (c && c.length > 0) {
        //this chunk is a proper sentence..
        sentences.push(c);
        chunks[i] = '';
      }
    }
    return sentences
  };
  var smartMerge$1 = smartMerge;

  //(Rule-based sentence boundary segmentation) - chop given text into its proper sentences.
  // Ignore periods/questions/exclamations used in acronyms/abbreviations/numbers, etc.
  //regs-
  const hasSomething = /\S/;
  const startWhitespace = /^\s+/;

  const splitSentences$1 = function (text, world) {
    text = text || '';
    text = String(text);
    // Ensure it 'smells like' a sentence
    if (!text || typeof text !== 'string' || hasSomething.test(text) === false) {
      return []
    }
    // cleanup unicode-spaces
    text = text.replace('\xa0', ' ');
    // First do a greedy-split..
    let splits = simpleSplit(text);
    // Filter-out the crap ones
    let chunks = simpleMerge(splits);
    //detection of non-sentence chunks:
    let sentences = smartMerge$1(chunks, world);
    //if we never got a sentence, return the given text
    if (sentences.length === 0) {
      return [text]
    }
    //move whitespace to the ends of sentences, when possible
    //['hello',' world'] -> ['hello ','world']
    for (let i = 1; i < sentences.length; i += 1) {
      let ws = sentences[i].match(startWhitespace);
      if (ws !== null) {
        sentences[i - 1] += ws[0];
        sentences[i] = sentences[i].replace(startWhitespace, '');
      }
    }
    return sentences
  };
  var splitSentences$2 = splitSentences$1;

  const hasHyphen = function (str, model) {
    let parts = str.split(/[-–—]/);
    if (parts.length <= 1) {
      return false
    }
    const { prefixes, suffixes } = model.one;

    //dont split 're-do'
    if (prefixes.hasOwnProperty(parts[0])) {
      return false
    }
    //dont split 'flower-like'
    parts[1] = parts[1].trim().replace(/[.?!]$/, '');
    if (suffixes.hasOwnProperty(parts[1])) {
      return false
    }
    //letter-number 'aug-20'
    let reg = /^([a-z\u00C0-\u00FF`"'/]+)[-–—]([a-z0-9\u00C0-\u00FF].*)/i;
    if (reg.test(str) === true) {
      return true
    }
    //number-letter '20-aug'
    let reg2 = /^([0-9]{1,4})[-–—]([a-z\u00C0-\u00FF`"'/-]+$)/i;
    if (reg2.test(str) === true) {
      return true
    }
    return false
  };

  const splitHyphens = function (word) {
    let arr = [];
    //support multiple-hyphenated-terms
    const hyphens = word.split(/[-–—]/);
    let whichDash = '-';
    let found = word.match(/[-–—]/);
    if (found && found[0]) {
      whichDash = found;
    }
    for (let o = 0; o < hyphens.length; o++) {
      if (o === hyphens.length - 1) {
        arr.push(hyphens[o]);
      } else {
        arr.push(hyphens[o] + whichDash);
      }
    }
    return arr
  };

  // combine '2 - 5' like '2-5' is
  // 2-4: 2, 4
  const combineRanges = function (arr) {
    const startRange = /^[0-9]{1,4}(:[0-9][0-9])?([a-z]{1,2})? ?[-–—] ?$/;
    const endRange = /^[0-9]{1,4}([a-z]{1,2})? ?$/;
    for (let i = 0; i < arr.length - 1; i += 1) {
      if (arr[i + 1] && startRange.test(arr[i]) && endRange.test(arr[i + 1])) {
        arr[i] = arr[i] + arr[i + 1];
        arr[i + 1] = null;
      }
    }
    return arr
  };
  var combineRanges$1 = combineRanges;

  const isSlash = /\p{L} ?\/ ?\p{L}+$/u;

  // 'he / she' should be one word
  const combineSlashes = function (arr) {
    for (let i = 1; i < arr.length - 1; i++) {
      if (isSlash.test(arr[i])) {
        arr[i - 1] += arr[i] + arr[i + 1];
        arr[i] = null;
        arr[i + 1] = null;
      }
    }
    return arr
  };
  var combineSlashes$1 = combineSlashes;

  const wordlike = /\S/;
  const isBoundary = /^[!?.]+$/;
  const naiiveSplit = /(\S+)/;

  let notWord = ['.', '?', '!', ':', ';', '-', '–', '—', '--', '...', '(', ')', '[', ']', '"', "'", '`'];
  notWord = notWord.reduce((h, c) => {
    h[c] = true;
    return h
  }, {});

  const isArray = function (arr) {
    return Object.prototype.toString.call(arr) === '[object Array]'
  };

  //turn a string into an array of strings (naiive for now, lumped later)
  const splitWords = function (str, model) {
    let result = [];
    let arr = [];
    //start with a naiive split
    str = str || '';
    if (typeof str === 'number') {
      str = String(str);
    }
    if (isArray(str)) {
      return str
    }
    const words = str.split(naiiveSplit);
    for (let i = 0; i < words.length; i++) {
      //split 'one-two'
      if (hasHyphen(words[i], model) === true) {
        arr = arr.concat(splitHyphens(words[i]));
        continue
      }
      arr.push(words[i]);
    }
    //greedy merge whitespace+arr to the right
    let carry = '';
    for (let i = 0; i < arr.length; i++) {
      let word = arr[i];
      //if it's more than a whitespace
      if (wordlike.test(word) === true && notWord.hasOwnProperty(word) === false && isBoundary.test(word) === false) {
        //put whitespace on end of previous term, if possible
        if (result.length > 0) {
          result[result.length - 1] += carry;
          result.push(word);
        } else {
          //otherwise, but whitespace before
          result.push(carry + word);
        }
        carry = '';
      } else {
        carry += word;
      }
    }
    //handle last one
    if (carry) {
      if (result.length === 0) {
        result[0] = '';
      }
      result[result.length - 1] += carry; //put it on the end
    }
    // combine 'one / two'
    result = combineSlashes$1(result);
    result = combineRanges$1(result);
    // remove empty results
    result = result.filter(s => s);
    return result
  };
  var splitTerms = splitWords;

  //all punctuation marks, from https://en.wikipedia.org/wiki/Punctuation
  //we have slightly different rules for start/end - like #hashtags.
  const startings =
    /^[ \n\t.[\](){}⟨⟩:,،、‒–—―…!‹›«»‐\-?‘’;/⁄·&*•^†‡¡¿※№÷×ºª%‰+−=‱¶′″‴§~|‖¦©℗®℠™¤₳฿\u0022\uFF02\u0027\u201C\u201F\u201B\u201E\u2E42\u201A\u2035\u2036\u2037\u301D\u0060\u301F]+/;
  const endings =
    /[ \n\t.'[\](){}⟨⟩:,،、‒–—―…!‹›«»‐\-?‘’;/⁄·&*@•^†‡°¡¿※#№÷×ºª‰+−=‱¶′″‴§~|‖¦©℗®℠™¤₳฿\u0022\uFF02\u201D\u00B4\u301E]+$/;
  const hasApostrophe$1 = /['’]/;
  const hasAcronym = /^[a-z]\.([a-z]\.)+/i;
  const minusNumber = /^[-+.][0-9]/;
  const shortYear = /^'[0-9]{2}/;

  const normalizePunctuation = function (str) {
    let original = str;
    let pre = '';
    let post = '';
    // number cleanups
    str = str.replace(startings, found => {
      pre = found;
      // support '-40'
      if ((pre === '-' || pre === '+' || pre === '.') && minusNumber.test(str)) {
        pre = '';
        return found
      }
      // support years like '97
      if (pre === `'` && shortYear.test(str)) {
        pre = '';
        return found
      }
      return ''
    });
    str = str.replace(endings, found => {
      post = found;
      // keep s-apostrophe - "flanders'" or "chillin'"
      if (hasApostrophe$1.test(found) && /[sn]['’]$/.test(original) && hasApostrophe$1.test(pre) === false) {
        post = post.replace(hasApostrophe$1, '');
        return `'`
      }
      //keep end-period in acronym
      if (hasAcronym.test(str) === true) {
        post = post.replace(/\./, '');
        return '.'
      }
      return ''
    });
    //we went too far..
    if (str === '') {
      // do a very mild parse, and hope for the best.
      original = original.replace(/ *$/, after => {
        post = after || '';
        return ''
      });
      str = original;
      pre = '';
    }
    return { str, pre, post }
  };
  var tokenize$1 = normalizePunctuation;

  const parseTerm = txt => {
    // cleanup any punctuation as whitespace
    let { str, pre, post } = tokenize$1(txt);
    const parsed = {
      text: str,
      pre: pre,
      post: post,
      tags: new Set(),
    };
    return parsed
  };
  var splitWhitespace = parseTerm;

  // 'Björk' to 'Bjork'.
  const killUnicode = function (str, world) {
    const unicode = world.model.one.unicode || {};
    str = str || '';
    let chars = str.split('');
    chars.forEach((s, i) => {
      if (unicode[s]) {
        chars[i] = unicode[s];
      }
    });
    return chars.join('')
  };
  var killUnicode$1 = killUnicode;

  /** some basic operations on a string to reduce noise */
  const clean = function (str) {
    str = str || '';
    str = str.toLowerCase();
    str = str.trim();
    let original = str;
    //punctuation
    str = str.replace(/[,;.!?]+$/, '');
    //coerce Unicode ellipses
    str = str.replace(/\u2026/g, '...');
    //en-dash
    str = str.replace(/\u2013/g, '-');
    //strip leading & trailing grammatical punctuation
    if (/^[:;]/.test(str) === false) {
      str = str.replace(/\.{3,}$/g, '');
      str = str.replace(/[",.!:;?)]+$/g, '');
      str = str.replace(/^['"(]+/g, '');
    }
    // remove zero-width characters
    str = str.replace(/[\u200B-\u200D\uFEFF]/g, '');
    //do this again..
    str = str.trim();
    //oh shucks,
    if (str === '') {
      str = original;
    }
    //no-commas in numbers
    str = str.replace(/([0-9]),([0-9])/g, '$1$2');
    return str
  };
  var cleanup = clean;

  // do acronyms need to be ASCII?  ... kind of?
  const periodAcronym$1 = /([A-Z]\.)+[A-Z]?,?$/;
  const oneLetterAcronym$1 = /^[A-Z]\.,?$/;
  const noPeriodAcronym$1 = /[A-Z]{2,}('s|,)?$/;
  const lowerCaseAcronym$1 = /([a-z]\.)+[a-z]\.?$/;

  const isAcronym$2 = function (str) {
    //like N.D.A
    if (periodAcronym$1.test(str) === true) {
      return true
    }
    //like c.e.o
    if (lowerCaseAcronym$1.test(str) === true) {
      return true
    }
    //like 'F.'
    if (oneLetterAcronym$1.test(str) === true) {
      return true
    }
    //like NDA
    if (noPeriodAcronym$1.test(str) === true) {
      return true
    }
    return false
  };

  const doAcronym = function (str) {
    if (isAcronym$2(str)) {
      str = str.replace(/\./g, '');
    }
    return str
  };
  var doAcronyms = doAcronym;

  const normalize$1 = function (term, world) {
    const killUnicode = world.methods.one.killUnicode;
    // console.log(world.methods.one)
    let str = term.text || '';
    str = cleanup(str);
    //(very) rough ASCII transliteration -  bjŏrk -> bjork
    str = killUnicode(str, world);
    str = doAcronyms(str);
    term.normal = str;
  };
  var normal = normalize$1;

  // turn a string input into a 'document' json format
  const parse$7 = function (input, world) {
    const { methods, model } = world;
    const { splitSentences, splitTerms, splitWhitespace } = methods.one.tokenize;
    input = input || '';
    // split into sentences
    let sentences = splitSentences(input, world);
    // split into word objects
    input = sentences.map((txt) => {
      let terms = splitTerms(txt, model);
      // split into [pre-text-post]
      terms = terms.map(splitWhitespace);
      // add normalized term format, always
      terms.forEach((t) => {
        normal(t, world);
      });
      return terms
    });
    return input
  };
  var fromString = parse$7;

  const isAcronym$1 = /[ .][A-Z]\.? *$/i;
  const hasEllipse = /(?:\u2026|\.{2,}) *$/;
  const hasLetter = /\p{L}/u;

  /** does this look like a sentence? */
  const isSentence = function (str, abbrevs) {
    // must have a letter
    if (hasLetter.test(str) === false) {
      return false
    }
    // check for 'F.B.I.'
    if (isAcronym$1.test(str) === true) {
      return false
    }
    //check for '...'
    if (hasEllipse.test(str) === true) {
      return false
    }
    let txt = str.replace(/[.!?\u203D\u2E18\u203C\u2047-\u2049] *$/, '');
    let words = txt.split(' ');
    let lastWord = words[words.length - 1].toLowerCase();
    // check for 'Mr.'
    if (abbrevs.hasOwnProperty(lastWord) === true) {
      return false
    }
    // //check for jeopardy!
    // if (blacklist.hasOwnProperty(lastWord)) {
    //   return false
    // }
    return true
  };
  var isSentence$1 = isSentence;

  var methods$3 = {
    one: {
      killUnicode: killUnicode$1,
      tokenize: {
        splitSentences: splitSentences$2,
        isSentence: isSentence$1,
        splitTerms,
        splitWhitespace,
        fromString,
      },
    },
  };

  const aliases$1 = {
    '&': 'and',
    '@': 'at',
    '%': 'percent',
    'plz': 'please',
    'bein': 'being',
  };
  var aliases$2 = aliases$1;

  var misc$8 = [
    'approx',
    'apt',
    'bc',
    'cyn',
    'eg',
    'esp',
    'est',
    'etc',
    'ex',
    'exp',
    'prob', //probably
    'pron', // Pronunciation
    'gal', //gallon
    'min',
    'pseud',
    'fig', //figure
    'jd',
    'lat', //latitude
    'lng', //longitude
    'vol', //volume
    'fm', //not am
    'def', //definition
    'misc',
    'plz', //please
    'ea', //each
    'ps',
    'sec', //second
    'pt',
    'pref', //preface
    'pl', //plural
    'pp', //pages
    'qt', //quarter
    'fr', //french
    'sq',
    'nee', //given name at birth
    'ss', //ship, or sections
    'tel',
    'temp',
    'vet',
    'ver', //version
    'fem', //feminine
    'masc', //masculine
    'eng', //engineering/english
    'adj', //adjective
    'vb', //verb
    'rb', //adverb
    'inf', //infinitive
    'situ', // in situ
    'vivo',
    'vitro',
    'wr', //world record
  ];

  var honorifics$1 = [
    'adj',
    'adm',
    'adv',
    'asst',
    'atty',
    'bldg',
    'brig',
    'capt',
    'cmdr',
    'comdr',
    'cpl',
    'det',
    'dr',
    'esq',
    'gen',
    'gov',
    'hon',
    'jr',
    'llb',
    'lt',
    'maj',
    'messrs',
    'mister',
    'mlle',
    'mme',
    'mr',
    'mrs',
    'ms',
    'mstr',
    'phd',
    'prof',
    'pvt',
    'rep',
    'reps',
    'res',
    'rev',
    'sen',
    'sens',
    'sfc',
    'sgt',
    'sir',
    'sr',
    'supt',
    'surg',
    //miss
    //misses
  ];

  var months = ['jan', 'feb', 'mar', 'apr', 'jun', 'jul', 'aug', 'sep', 'sept', 'oct', 'nov', 'dec'];

  var nouns$2 = [
    'ad',
    'al',
    'arc',
    'ba',
    'bl',
    'ca',
    'cca',
    'col',
    'corp',
    'ft',
    'fy',
    'ie',
    'lit',
    'ma',
    'md',
    'pd',
    'tce',
  ];

  var organizations = ['dept', 'univ', 'assn', 'bros', 'inc', 'ltd', 'co'];

  var places$2 = [
    'rd',
    'st',
    'dist',
    'mt',
    'ave',
    'blvd',
    'cl',
    // 'ct',
    'cres',
    'hwy',
    //states
    'ariz',
    'cal',
    'calif',
    'colo',
    'conn',
    'fla',
    'fl',
    'ga',
    'ida',
    'ia',
    'kan',
    'kans',

    'minn',
    'neb',
    'nebr',
    'okla',
    'penna',
    'penn',
    'pa',
    'dak',
    'tenn',
    'tex',
    'ut',
    'vt',
    'va',
    'wis',
    'wisc',
    'wy',
    'wyo',
    'usafa',
    'alta',
    'ont',
    'que',
    'sask',
  ];

  // units that are abbreviations too
  var units = [
    'dl',
    'ml',
    'gal',
    // 'ft', //ambiguous
    'qt',
    'pt',
    'tbl',
    'tsp',
    'tbsp',
    'km',
    'dm', //decimeter
    'cm',
    'mm',
    'mi',
    'td',
    'hr', //hour
    'hrs', //hour
    'kg',
    'hg',
    'dg', //decigram
    'cg', //centigram
    'mg', //milligram
    'µg', //microgram
    'lb', //pound
    'oz', //ounce
    'sq ft',
    'hz', //hertz
    'mps', //meters per second
    'mph',
    'kmph', //kilometers per hour
    'kb', //kilobyte
    'mb', //megabyte
    // 'gb', //ambig
    'tb', //terabyte
    'lx', //lux
    'lm', //lumen
    // 'pa', //ambig
    'fl oz', //
    'yb',
  ];

  // add our abbreviation list to our lexicon
  let list$2 = [
    [misc$8],
    [units, 'Unit'],
    [nouns$2, 'Noun'],
    [honorifics$1, 'Honorific'],
    [months, 'Month'],
    [organizations, 'Organization'],
    [places$2, 'Place'],
  ];
  // create key-val for sentence-tokenizer
  let abbreviations = {};
  // add them to a future lexicon
  let lexicon$1 = {};

  list$2.forEach(a => {
    a[0].forEach(w => {
      // sentence abbrevs
      abbreviations[w] = true;
      // future-lexicon
      lexicon$1[w] = 'Abbreviation';
      if (a[1] !== undefined) {
        lexicon$1[w] = [lexicon$1[w], a[1]];
      }
    });
  });

  // dashed prefixes that are not independent words
  //  'mid-century', 'pre-history'
  var prefixes$1 = [
    'anti',
    'bi',
    'co',
    'contra',
    'de',
    'extra',
    'infra',
    'inter',
    'intra',
    'macro',
    'micro',
    'mis',
    'mono',
    'multi',
    'peri',
    'pre',
    'pro',
    'proto',
    'pseudo',
    're',
    'sub',
    'supra',
    'trans',
    'tri',
    'un',
    'out', //out-lived
    // 'counter',
    // 'mid',
    // 'out',
    // 'non',
    // 'over',
    // 'post',
    // 'semi',
    // 'super', //'super-cool'
    // 'ultra', //'ulta-cool'
    // 'under',
    // 'whole',
  ].reduce((h, str) => {
    h[str] = true;
    return h
  }, {});

  // dashed suffixes that are not independent words
  //  'flower-like', 'president-elect'
  var suffixes$5 = {
    'like': true,
    'ish': true,
    'less': true,
    'able': true,
    'elect': true,
    'type': true,
    'designate': true,
    // 'fold':true,
  };

  //a hugely-ignorant, and widely subjective transliteration of latin, cryllic, greek unicode characters to english ascii.
  //approximate visual (not semantic or phonetic) relationship between unicode and ascii characters
  //http://en.wikipedia.org/wiki/List_of_Unicode_characters
  //https://docs.google.com/spreadsheet/ccc?key=0Ah46z755j7cVdFRDM1A2YVpwa1ZYWlpJM2pQZ003M0E
  let compact = {
    '!': '¡',
    '?': '¿Ɂ',
    '"': '“”"❝❞',
    "'": '‘‛❛❜’',
    '-': '—–',
    a: 'ªÀÁÂÃÄÅàáâãäåĀāĂăĄąǍǎǞǟǠǡǺǻȀȁȂȃȦȧȺΆΑΔΛάαλАаѦѧӐӑӒӓƛæ',
    b: 'ßþƀƁƂƃƄƅɃΒβϐϦБВЪЬвъьѢѣҌҍ',
    c: '¢©ÇçĆćĈĉĊċČčƆƇƈȻȼͻͼϲϹϽϾСсєҀҁҪҫ',
    d: 'ÐĎďĐđƉƊȡƋƌ',
    e: 'ÈÉÊËèéêëĒēĔĕĖėĘęĚěƐȄȅȆȇȨȩɆɇΈΕΞΣέεξϵЀЁЕеѐёҼҽҾҿӖӗ',
    f: 'ƑƒϜϝӺӻҒғſ',
    g: 'ĜĝĞğĠġĢģƓǤǥǦǧǴǵ',
    h: 'ĤĥĦħƕǶȞȟΉΗЂЊЋНнђћҢңҤҥҺһӉӊ',
    I: 'ÌÍÎÏ',
    i: 'ìíîïĨĩĪīĬĭĮįİıƖƗȈȉȊȋΊΐΪίιϊІЇії',
    j: 'ĴĵǰȷɈɉϳЈј',
    k: 'ĶķĸƘƙǨǩΚκЌЖКжкќҚқҜҝҞҟҠҡ',
    l: 'ĹĺĻļĽľĿŀŁłƚƪǀǏǐȴȽΙӀӏ',
    m: 'ΜϺϻМмӍӎ',
    n: 'ÑñŃńŅņŇňŉŊŋƝƞǸǹȠȵΝΠήηϞЍИЙЛПийлпѝҊҋӅӆӢӣӤӥπ',
    o: 'ÒÓÔÕÖØðòóôõöøŌōŎŏŐőƟƠơǑǒǪǫǬǭǾǿȌȍȎȏȪȫȬȭȮȯȰȱΌΘΟθοσόϕϘϙϬϴОФоѲѳӦӧӨөӪӫ',
    p: 'ƤΡρϷϸϼРрҎҏÞ',
    q: 'Ɋɋ',
    r: 'ŔŕŖŗŘřƦȐȑȒȓɌɍЃГЯгяѓҐґ',
    s: 'ŚśŜŝŞşŠšƧƨȘșȿЅѕ',
    t: 'ŢţŤťŦŧƫƬƭƮȚțȶȾΓΤτϮТт',
    u: 'ÙÚÛÜùúûüŨũŪūŬŭŮůŰűŲųƯưƱƲǓǔǕǖǗǘǙǚǛǜȔȕȖȗɄΰυϋύ',
    v: 'νѴѵѶѷ',
    w: 'ŴŵƜωώϖϢϣШЩшщѡѿ',
    x: '×ΧχϗϰХхҲҳӼӽӾӿ',
    y: 'ÝýÿŶŷŸƳƴȲȳɎɏΎΥΫγψϒϓϔЎУучўѰѱҮүҰұӮӯӰӱӲӳ',
    z: 'ŹźŻżŽžƵƶȤȥɀΖ',
  };
  //decompress data into two hashes
  let unicode = {};
  Object.keys(compact).forEach(function (k) {
    compact[k].split('').forEach(function (s) {
      unicode[s] = k;
    });
  });
  var unicode$1 = unicode;

  var model$4 = {
    one: {
      aliases: aliases$2,
      abbreviations,
      prefixes: prefixes$1,
      suffixes: suffixes$5,
      lexicon: lexicon$1, //give this one forward
      unicode: unicode$1,
    },
  };

  const hasSlash = /\//;
  const hasDomain = /[a-z]\.[a-z]/i;
  const isMath = /[0-9]/;
  // const hasSlash = /[a-z\u00C0-\u00FF] ?\/ ?[a-z\u00C0-\u00FF]/
  // const hasApostrophe = /['’]s$/

  const addAliases = function (term, world) {
    let str = term.normal || term.text || term.machine;
    const aliases = world.model.one.aliases;
    // lookup known aliases like '&'
    if (aliases.hasOwnProperty(str)) {
      term.alias = term.alias || [];
      term.alias.push(aliases[str]);
    }
    // support slashes as aliases
    if (hasSlash.test(str) && !hasDomain.test(str) && !isMath.test(str)) {
      let arr = str.split(hasSlash);
      // don't split urls and things
      if (arr.length <= 2) {
        arr.forEach(word => {
          word = word.trim();
          if (word !== '') {
            term.alias = term.alias || [];
            term.alias.push(word);
          }
        });
      }
    }
    // aliases for apostrophe-s
    // if (hasApostrophe.test(str)) {
    //   let main = str.replace(hasApostrophe, '').trim()
    //   term.alias = term.alias || []
    //   term.alias.push(main)
    // }
    return term
  };
  var alias = addAliases;

  const hasDash = /^\p{Letter}+-\p{Letter}+$/u;
  // 'machine' is a normalized form that looses human-readability
  const doMachine = function (term) {
    let str = term.implicit || term.normal || term.text;
    // remove apostrophes
    str = str.replace(/['’]s$/, '');
    str = str.replace(/s['’]$/, 's');
    //lookin'->looking (make it easier for conjugation)
    str = str.replace(/([aeiou][ktrp])in'$/, '$1ing');
    //turn re-enactment to reenactment
    if (hasDash.test(str)) {
      str = str.replace(/-/g, '');
    }
    //#tags, @mentions
    str = str.replace(/^[#@]/, '');
    if (str !== term.normal) {
      term.machine = str;
    }
  };
  var machine = doMachine;

  // sort words by frequency
  const freq = function (view) {
    let docs = view.docs;
    let counts = {};
    for (let i = 0; i < docs.length; i += 1) {
      for (let t = 0; t < docs[i].length; t += 1) {
        let term = docs[i][t];
        let word = term.machine || term.normal;
        counts[word] = counts[word] || 0;
        counts[word] += 1;
      }
    }
    // add counts on each term
    for (let i = 0; i < docs.length; i += 1) {
      for (let t = 0; t < docs[i].length; t += 1) {
        let term = docs[i][t];
        let word = term.machine || term.normal;
        term.freq = counts[word];
      }
    }
  };
  var freq$1 = freq;

  // get all character startings in doc
  const offset = function (view) {
    let elapsed = 0;
    let index = 0;
    let docs = view.document; //start from the actual-top
    for (let i = 0; i < docs.length; i += 1) {
      for (let t = 0; t < docs[i].length; t += 1) {
        let term = docs[i][t];
        term.offset = {
          index: index,
          start: elapsed + term.pre.length,
          length: term.text.length,
        };
        elapsed += term.pre.length + term.text.length + term.post.length;
        index += 1;
      }
    }
  };


  var offset$1 = offset;

  // cheat- add the document's pointer to the terms
  const index = function (view) {
    // console.log('reindex')
    let document = view.document;
    for (let n = 0; n < document.length; n += 1) {
      for (let i = 0; i < document[n].length; i += 1) {
        document[n][i].index = [n, i];
      }
    }
    // let ptrs = b.fullPointer
    // console.log(ptrs)
    // for (let i = 0; i < docs.length; i += 1) {
    //   const [n, start] = ptrs[i]
    //   for (let t = 0; t < docs[i].length; t += 1) {
    //     let term = docs[i][t]
    //     term.index = [n, start + t]
    //   }
    // }
  };

  var index$1 = index;

  const wordCount = function (view) {
    let n = 0;
    let docs = view.docs;
    for (let i = 0; i < docs.length; i += 1) {
      for (let t = 0; t < docs[i].length; t += 1) {
        if (docs[i][t].normal === '') {
          continue //skip implicit words
        }
        n += 1;
        docs[i][t].wordCount = n;
      }
    }
  };

  var wordCount$1 = wordCount;

  // cheat-method for a quick loop
  const termLoop$1 = function (view, fn) {
    let docs = view.docs;
    for (let i = 0; i < docs.length; i += 1) {
      for (let t = 0; t < docs[i].length; t += 1) {
        fn(docs[i][t], view.world);
      }
    }
  };

  const methods$2 = {
    alias: (view) => termLoop$1(view, alias),
    machine: (view) => termLoop$1(view, machine),
    normal: (view) => termLoop$1(view, normal),
    freq: freq$1,
    offset: offset$1,
    index: index$1,
    wordCount: wordCount$1,
  };
  var compute$5 = methods$2;

  var tokenize = {
    compute: compute$5,
    methods: methods$3,
    model: model$4,
    hooks: ['alias', 'machine', 'index', 'id'],
  };

  // const plugin = function (world) {
  //   let { methods, model, parsers } = world
  //   Object.assign({}, methods, _methods)
  //   Object.assign(model, _model)
  //   methods.one.tokenize.fromString = tokenize
  //   parsers.push('normal')
  //   parsers.push('alias')
  //   parsers.push('machine')
  //   // extend View class
  //   // addMethods(View)
  // }
  // export default plugin

  // lookup last word in the type-ahead prefixes
  const typeahead$1 = function (view) {
    const prefixes = view.model.one.typeahead;
    const docs = view.docs;
    if (docs.length === 0 || Object.keys(prefixes).length === 0) {
      return
    }
    let lastPhrase = docs[docs.length - 1] || [];
    let lastTerm = lastPhrase[lastPhrase.length - 1];
    // if we've already put whitespace, end.
    if (lastTerm.post) {
      return
    }
    // if we found something
    if (prefixes.hasOwnProperty(lastTerm.normal)) {
      let found = prefixes[lastTerm.normal];
      // add full-word as an implicit result
      lastTerm.implicit = found;
      lastTerm.machine = found;
      lastTerm.typeahead = true;
      // tag it, as our assumed term
      if (view.compute.preTagger) {
        view.last().unTag('*').compute(['lexicon', 'preTagger']);
      }
    }
  };

  var compute$4 = { typeahead: typeahead$1 };

  // assume any discovered prefixes
  const autoFill = function () {
    const docs = this.docs;
    if (docs.length === 0) {
      return this
    }
    let lastPhrase = docs[docs.length - 1] || [];
    let term = lastPhrase[lastPhrase.length - 1];
    if (term.typeahead === true && term.machine) {
      term.text = term.machine;
      term.normal = term.machine;
    }
    return this
  };

  const api$n = function (View) {
    View.prototype.autoFill = autoFill;
  };
  var api$o = api$n;

  // generate all the possible prefixes up-front
  const getPrefixes = function (arr, opts, world) {
    let index = {};
    let collisions = [];
    let existing = world.prefixes || {};
    arr.forEach((str) => {
      str = str.toLowerCase().trim();
      let max = str.length;
      if (opts.max && max > opts.max) {
        max = opts.max;
      }
      for (let size = opts.min; size < max; size += 1) {
        let prefix = str.substring(0, size);
        // ensure prefix is not a word
        if (opts.safe && world.model.one.lexicon.hasOwnProperty(prefix)) {
          continue
        }
        // does it already exist?
        if (existing.hasOwnProperty(prefix) === true) {
          collisions.push(prefix);
          continue
        }
        if (index.hasOwnProperty(prefix) === true) {
          collisions.push(prefix);
          continue
        }
        index[prefix] = str;
      }
    });
    // merge with existing prefixes
    index = Object.assign({}, existing, index);
    // remove ambiguous-prefixes
    collisions.forEach((str) => {
      delete index[str];
    });
    return index
  };

  var allPrefixes = getPrefixes;

  const isObject = val => {
    return Object.prototype.toString.call(val) === '[object Object]'
  };

  const defaults$1 = {
    safe: true,
    min: 3,
  };

  const prepare = function (words = [], opts = {}) {
    let model = this.model();
    opts = Object.assign({}, defaults$1, opts);
    if (isObject(words)) {
      Object.assign(model.one.lexicon, words);
      words = Object.keys(words);
    }
    let prefixes = allPrefixes(words, opts, this.world());
    // manually combine these with any existing prefixes
    Object.keys(prefixes).forEach(str => {
      // explode any overlaps
      if (model.one.typeahead.hasOwnProperty(str)) {
        delete model.one.typeahead[str];
        return
      }
      model.one.typeahead[str] = prefixes[str];
    });
    return this
  };

  var lib = {
    typeahead: prepare
  };

  const model$3 = {
    one: {
      typeahead: {} //set a blank key-val
    }
  };
  var typeahead = {
    model: model$3,
    api: api$o,
    lib,
    compute: compute$4,
    hooks: ['typeahead']
  };

  // order here matters
  nlp$1.extend(change); //0kb
  nlp$1.extend(output); //0kb
  nlp$1.extend(match); //10kb
  nlp$1.extend(pointers); //2kb
  nlp$1.extend(tag); //2kb
  nlp$1.plugin(contractions); //~6kb
  nlp$1.extend(tokenize); //7kb
  nlp$1.plugin(cache$1); //~1kb
  nlp$1.extend(lookup); //7kb
  nlp$1.extend(typeahead); //1kb
  nlp$1.extend(lexicon$2); //1kb
  nlp$1.extend(sweep); //1kb

  //nouns with irregular plural/singular forms
  //used in nouns.toPlural(), and also in the lexicon.

  var irregularPlurals = {
    // -a
    addendum: 'addenda',
    corpus: 'corpora',
    criterion: 'criteria',
    curriculum: 'curricula',
    genus: 'genera',
    memorandum: 'memoranda',
    opus: 'opera',
    ovum: 'ova',
    phenomenon: 'phenomena',
    referendum: 'referenda',

    // -ae
    alga: 'algae',
    alumna: 'alumnae',
    antenna: 'antennae',
    formula: 'formulae',
    larva: 'larvae',
    nebula: 'nebulae',
    vertebra: 'vertebrae',

    // -is
    analysis: 'analyses',
    axis: 'axes',
    diagnosis: 'diagnoses',
    parenthesis: 'parentheses',
    prognosis: 'prognoses',
    synopsis: 'synopses',
    thesis: 'theses',
    neurosis: 'neuroses',
    // -x
    appendix: 'appendices',
    index: 'indices',
    matrix: 'matrices',
    ox: 'oxen',
    sex: 'sexes',

    // -i
    alumnus: 'alumni',
    bacillus: 'bacilli',
    cactus: 'cacti',
    fungus: 'fungi',
    hippopotamus: 'hippopotami',
    libretto: 'libretti',
    modulus: 'moduli',
    nucleus: 'nuclei',
    octopus: 'octopi',
    radius: 'radii',
    stimulus: 'stimuli',
    syllabus: 'syllabi',

    // -ie
    cookie: 'cookies',
    calorie: 'calories',
    auntie: 'aunties',
    movie: 'movies',
    pie: 'pies',
    rookie: 'rookies',
    tie: 'ties',
    zombie: 'zombies',

    // -f
    leaf: 'leaves',
    loaf: 'loaves',
    thief: 'thieves',

    // ee-
    foot: 'feet',
    goose: 'geese',
    tooth: 'teeth',

    // -eaux
    beau: 'beaux',
    chateau: 'chateaux',
    tableau: 'tableaux',

    // -ses
    bus: 'buses',
    gas: 'gases',
    circus: 'circuses',
    crisis: 'crises',
    virus: 'viruses',
    database: 'databases',
    excuse: 'excuses',
    abuse: 'abuses',

    avocado: 'avocados',
    barracks: 'barracks',
    child: 'children',
    clothes: 'clothes',
    echo: 'echoes',
    embargo: 'embargoes',
    epoch: 'epochs',
    deer: 'deer',
    halo: 'halos',
    man: 'men',
    woman: 'women',
    mosquito: 'mosquitoes',
    mouse: 'mice',
    person: 'people',
    quiz: 'quizzes',
    rodeo: 'rodeos',
    shoe: 'shoes',
    sombrero: 'sombreros',
    stomach: 'stomachs',
    tornado: 'tornados',
    tuxedo: 'tuxedos',

  };

  // generated in ./lib/lexicon
  var lexData = {
    "Comparative": "true¦better",
    "Superlative": "true¦earlier",
    "PresentTense": "true¦sounds",
    "Condition": "true¦lest,unless",
    "PastTense": "true¦be2came,d1had,lied,mea0sa1taken,we0;nt;id;en,gan",
    "Gerund": "true¦accord0be0go0result0stain0;ing",
    "Expression": "true¦a0Qb0Mco0Ld0He0Ffuck,g09hUjeez,lRmQnOoLpIshHtGuDvoi0Sw6y0;a4e3i1u0;ck,p;kYp0;ee,pee;ah,p,s;!a,h6y;ah5h2o1t0;af,f;rd up,w;e1o0;a,ops;e,w;oo;gh,h0;! 0h,m;huh,oh;sk,ut tut;eesh,hh,it;ff,h1l0ow,sst;ease,z;ew,ooey;h1i,o0uch,w,y;h,o,ps;!h;ah,o0;!pe;eh,mm;ah,m1ol0;!s;ao,fao;aBe9i7o2u0;h,mph,rra0zzB;h,y;ly1o0;r4y8;! 0;cow,moCsmok0;es;!p hip hoor0;ay;ck,e,ll0y;!o;ha1i,lleluj0;ah;!ha;ah,ee4o1r0;eat scott,r;l1od0sh; grief,bye;ly;! whiz;e0h,t cetera,ww;k,p;'oh,a0rat,uh;m0ng;mit,n0;!it;ngratulations,wabunga;a2oo1r0ye;avo,r;!ya;h,m; 1h0las,men,rgh;!a,em,oy;la",
    "Negative": "true¦n0;ever,o0;n,t",
    "QuestionWord": "true¦how3wh0;at,e1ich,o0y;!m,se;n,re; come,'s",
    "Reflexive": "true¦h4it5my5o1the0your2;ir1m1;ne3ur0;sel0;f,ves;er0im0;self",
    "Plural": "true¦ones,records",
    "Unit|Noun": "true¦cEfDgChBinchAk9lb,m6newt5oz,p4qt,t1y0;ardEd;able1b0ea1sp;!l,sp;spo1;a,oundAt,x;on9;!b,g,i1l,m,p0;h,s;!les;!b,elvin,g,m;!es;g,z;al,b;eet,oot,t;m,up0;!s",
    "Value": "true¦a few",
    "Imperative": "true¦come here",
    "PhrasalVerb": "true¦0:81;1:7Q;2:8E;3:84;4:7J;5:8H;6:7P;7:7E;8:7C;9:86;A:7Z;B:89;C:87;D:80;E:6L;F:6D;a8Kb73c66d61e60f4Yg4Gh3Viron0j3Rk3Ml33m2Pn2No2Lp22quietEr1Ns0GtWuUvacuum 1wJyammerAzG;ero Dip HonG;e0k0;by,up;aNeIhHiGor7Vrit37;mp0n34pe0r8s8;eel Dip 8P;aIiGn2S;gh Grd0;in,up;n Dr G;d2in,o4D;it 6Hk8lk Hrm 0Ysh Gt79v5F;aw3d2o5up;aw3in,o84;rgeAsG;e 1herF;aVeThRiNoMrIuGypL;ckFrn G;d2in,o45up;aHiGot0y 2O;ckleEp 8A;ckEdG;e 0N;neEp 2Zs4Z;ck IdHe Gghte5Yme0p o0Ire0;aw3ba4d2in,up;e 6Hy 1;by,oC;ink Grow 6U;ba4ov6up;aGe 6Fll5G;m 1r 53;ckAke Hlk G;ov6shit,u5H;aGba4d2in,o3Pup;ba4ft6p5Mw3;a0Lc0Ke0Eh0Ai07l03m02n01o00pVquar4XtMuKwG;earIiG;ngHtch G;aw3ba4o7O; by;ck Git 1m 1ss0;in,o7Bup;aMe10iLoJrHuG;c36d2O;aigh22iG;ke 6Wn3L;p Grm24;by,in,oC;n31r 1tc44;c30mp0nd Gr7Fve9y 1;ba4d2up;ar2YeJiIlHrGurA;ingAuc8;a3Rit 5R;l17n 1;e69ll0;ber 1rt0und like;ap 56ow D;ash 5Woke0;eep HiGow 7;c1Lp 1;in,oG;ff,v6;de12gn HngGt 5Rz8; al5Mle0;in,o5up;aIoGu5A;ot Gut0w 6U;aw3ba4f3SoC;c2GdeFk5Pve9;e Kll1Gnd Jrv8tG; Gtl4W;d2f5Bin,o5upG;!on;aw3ba4d2in,o2Nup;o6Dto;al5Iout0rap5I;il9v8;aTeQiPoLuG;b 5Ble0n Gstl8;aIba4d2inHoGt3Lu0X;ut,v6;!to;c2HrBw3;ll Iot HuG;g33nd9;a2Hf3Ao5;arBin,o5;ng 5Ip9;aGel9inFnt0;c5Rd G;o3Bup;c1Tt0;aUeTiRlPoNrKsyc2RuG;ll It G;aGba4d2in,o1Zt3Rup;p3Ww3;ap3Vd2in,o5t3Pup;attleAess HiJoG;p 1;ah1Zon;iGp 5Wr4CurEwer 5W;nt0;ay4SuG;gFmp 7;ck Gg0leAn 7p4P;o1Oup;el 4ZncilF;c4Hir 2Xn0ss ItHy G;ba4oC; d2c2E;aw3ba4in,o1J;pGw4C;e4Bt D;arrowEerd0oG;d9teE;aQeNiMoIuG;ddl8lG;l 3W;c12nkeyIp 7uth9ve G;aGd2in,o5up;l41w3; wi3Y;ss0x 1;asur8lHss G;a1Oup;t 7;ke Hn 7rGs1Xx0;k 7ry9;do,o4Vup;aWeRiMoGuck0;aKc3Ug JoGse0;k Gse3S;aft6ba4d2forw2Sin4Iov6uG;nd6p;in,o0V;d 7;e 04ghtJnIsHvG;e 3E;ten 4Y;e 1k 1; 1e3J;ave It HvelG; o4H;d2go,in,o5up;in,oG;pen,ut;c8p 1sh GtchAugh9y26;in43o5;eHick9nock G;d2o4Aup;eGyF;l 2Yp G;aw3ba4d2fYin,o0Dto,up;aIoHuG;ic8mpF;ke3BtE;c3Kzz 1;aVeQiNoKuG;nHrrGsh 7;y 1;kerEt G;arBd2;lGneFrse34;d Ge 1;ba4d2fast,o04up;de Ht G;ba4on,up;aw3o5;aGlp0;d Il 2Gr Gt 1;fGof;rom;in,oWu1K;cJm 1nHve Gz2B;it,to;d Gg 2MkerJ;d2in,o5;k 1;aUeOive Mloss 27oIrHunG; f0O;in3Now 2H; Gof 26;aHb1Fit,oGrBt0Qu1A;ff,n,v6;bo5ft6hMw3;aw3ba4d2in,oGrise,up,w3;ff,n,ut;ar 7ek0t G;aHb19d2in,oGrBup;ff,n,ut,v6;cHhGl23rBt,w3;ead;ross;d aHnG;g 1;bo5;a0Ae03iUlQoMrIuG;ck Ge28;arBup;eHighten GownAy 1;aw3oC;eGshe1U; 1z8;lIol G;aGwi1N;bo5rB;d 7low 1;aHeGip0;sh0;g 7ke0mGrGttenE;e 2Y;gNlLnJrHsGzzle0;h 2W;e Gm 1;aw3ba4up;d0isG;h 1;e Gl 1G;aw3fLin,o5;ht ba4ure0;eLnHsG;s 1;cId G;fGoC;or;e D;dYl 1;cKll Grm0t13;ap07bId2in,oHtG;hrough;ff,ut,v6;a4ehi27;e G;d2oCup;a0Ldge0nd 0Py8;oJrG;aHess 7op G;aw3bWin,o1U;gAwA; 0Iubl0Y;a00hXleaWoJrGut 16;ackAeep Goss D;by,d2in,oGup;n,ut;me JoHuntG; o1W;k 7l G;d2oC;aMbLforJin,oItHuG;nd6;ogeth6;n,ut,v6;th,wG;ard;a4y;pGrBw3;art;n 7;eGipF;ck Der G;on,up;lNncel0rKsItch HveF; in;o1Eup;h Dt G;doubt,oC;ry HvG;e 02;aw3o19;l HmE; d2;aGba4d2o16up;rBw3;a0Me0El07oYrLuG;bblIcklZil05lk 7ndlZrGst VtHy 16zz9;n 0AsG;t D;e G;ov6;anReaPiHush G;oCup;ghLng G;aIba4d2fGin,o5up;orG;th;bo5lGrBw3;ong;teG;n 1;k G;d2in,o5up;ch0;arNg 7iLn8oJssIttlHunce Gx D;aw3ba4;e 7; arB;k Dt 1;e 1;l 7;d2up;d 1;aLeed0oGurt0;cIw G;aw3ba4d2o5up;ck;k G;in,oX;ck0nk0st9; oLaJef 1nd G;d2ov6up;er;up;r0t G;d2in,oQup;ff,nG;to;ck Mil0nIrgHsG;h D;ainAe D;g DkA; on;in,o5; o5;aw3d2oGup;ff,ut;ay;cPdLsk Iuction9; oC;ff;arBo5;ouG;nd;d G;d2oGup;ff,n;own;t G;o5up;ut",
    "Verb": "true¦born,cannot,gonna,has,keep tabs,m0;ake sure,sg",
    "Demonym": "true¦0:15;1:12;a0Vb0Oc0Dd0Ce08f07g04h02iYjVkTlPmLnIomHpEqatari,rCs7t5u4v3welAz2;am0Gimbabwe0;enezuel0ietnam0I;gAkrai1;aiwTex0hai,rinida0Ju2;ni0Prkmen;a5cotti4e3ingapoOlovak,oma0Spaniard,udRw2y0W;ede,iss;negal0Cr09;sh;mo0uT;o5us0Jw2;and0;a2eru0Fhilippi0Nortugu07uerto r0S;kist3lesti1na2raguay0;ma1;ani;ami00i2orweP;caragu0geri2;an,en;a3ex0Lo2;ngo0Drocc0;cedo1la2;gasy,y07;a4eb9i2;b2thua1;e0Cy0;o,t01;azakh,eny0o2uwaiI;re0;a2orda1;ma0Ap2;anO;celandic,nd4r2sraeli,ta01vo05;a2iB;ni0qi;i0oneU;aiAin2ondur0unO;di;amEe2hanai0reek,uatemal0;or2rm0;gi0;ilipino,ren8;cuadoVgyp4mira3ngli2sto1thiopi0urope0;shm0;ti;ti0;aPominUut3;a9h6o4roat3ub0ze2;ch;!i0;lom2ngol5;bi0;a6i2;le0n2;ese;lifor1m2na3;bo2eroo1;di0;angladeshi,el6o4r3ul2;gaE;azi9it;li2s1;vi0;aru2gi0;si0;fAl7merBngol0r5si0us2;sie,tr2;a2i0;li0;genti2me1;ne;ba1ge2;ri0;ni0;gh0r2;ic0;an",
    "Organization": "true¦0:4D;a3Gb2Yc2Ed26e22f1Xg1Ph1Ki1Hj1Fk1Dl18m0Wn0Jo0Gp09qu08r01sTtGuBv8w3xiaomi,y1;amaha,m13ou1w13;gov,tu2Z;a3e1orld trade organizati2S;lls fargo,st1;fie28inghou2I;l1rner br3I;gree37l street journ29m17;an halOeriz2Nisa,o1;dafo2Ol1;kswagMvo;b4kip,n2ps,s1;a tod2Yps;es3Ai1;lev33ted natio30;er,s; mobi2Qaco beQd bNeAgi frida9h3im horto2Ymz,o1witt31;shi3Xy1;ota,s r 00;e 1in lizzy;b3carpen37daily ma31guess w2holli0rolling st1Rs1w2;mashing pumpki2Tuprem0;ho;ea1lack eyed pe3Lyrds;ch bo1tl0;ys;l2n3Ds1xas instrumen1J;co,la m15;efoni0Cus;a7e4ieme2Lnp,o2pice gir5quare04ta1ubaru;rbucks,to2R;ny,undgard1;en;a2x pisto1;ls;g1Nrs;few2Ainsbury2QlesforYmsu22;.e.m.,adiohead,b6e3oyal 1yana30;b1dutch she4;ank;aders dige1Gd 1max,vl1R;bu1c1Zhot chili peppe2Nlobst2C;ll;c,s;ant30izno2I;a5bs,e3fiz28hilip morrCi2r1;emier2Audenti16;nk floyd,zza hut;psi2Btro1uge0A;br2Vchina,n2V;lant2Nn1yp12; 2ason20da2I;ld navy,pec,range juli2xf1;am;us;aAb9e6fl,h5i4o1sa,vid3wa;k2tre dame,vart1;is;ia;ke,ntendo,ss0L;l,s;c,st1Htflix,w1; 1sweek;kids on the block,york09;a,c;nd1Vs2t1;ional aca2Io,we0Q;a,cYd0O;aBcdonaldAe7i5lb,o3tv,y1;spa1;ce;b1Mnsanto,ody blu0t1;ley crue,or0O;crosoft,t1;as,subisM;dica2rcedes benz,talli1;ca;id,re;'s,s;c's milk,tt14z1Z;'ore08a3e1g,ittle caesa1K;novo,x1;is,mark; 1bour party;pres0Bz boy;atv,fc,kk,m1od1J;art;iffy lu0Moy divisi0Gpmorgan1sa;! cha07;bm,hop,n1tv;g,te1;l,rpol;asbro,ewlett pack1Ri3o1sbc,yundai;me dep1n1L;ot;tac1zbollah;hi;eneral 6hq,ithub,l5mb,o2reen d0Lu1;cci,ns n ros0;ldman sachs,o1;dye1g0E;ar;axo smith kli03encoV;electr0Km1;oto0W;a4bi,da,edex,i2leetwood mac,o1rito l0D;rd,xcX;at,nancial1restoY; tim0;cebook,nnie mae;b08sa,u3xxon1; m1m1;ob0H;!rosceptics;aiml0Be6isney,o4u1;nkin donu2po0Xran dur1;an;ts;j,w j1;on0;a,f lepp0Zll,peche mode,r spiegZstiny's chi1;ld;aIbc,hEiCloudflaBnn,o3r1;aigsli5eedence clearwater reviv1ossra06;al;ca c7inba6l4m1o0Bst06;ca2p1;aq;st;dplPg1;ate;se;ola;re;a,sco1tigroup;! systems;ev2i1;ck fil-a,na daily;r1y;on;dbury,pital o1rl's jr;ne;aEbc,eBf9l5mw,ni,o1p,rexiteeU;ei3mbardiIston 1;glo1pizza;be;ng;o2ue c1;roV;ckbuster video,omingda1;le; g1g1;oodriL;cht2e ge0rkshire hathaw1;ay;el;idu,nana republ3s1xt5y5;f,kin robbi1;ns;ic;bYcTdidSerosmith,iRlKmEnheuser-busDol,pple9r6s3utodesk,v2y1;er;is,on;hland1sociated F; o1;il;by4g2m1;co;os; compu2bee1;'s;te1;rs;ch;c,d,erican3t1;!r1;ak; ex1;pre1;ss; 5catel2ta1;ir;!-lu1;ce1;nt;jazeera,qae1;da;g,rbnb;as;/dc,a3er,tivision1;! blizz1;ard;demy of scienc0;es;ba",
    "Possessive": "true¦any2its,my,no4o0somet3their1yo0;ur0;!s;o1t0;hing;ne",
    "Noun|Verb": "true¦0:7T;1:6L;2:7P;3:80;4:7Z;5:83;6:6Y;7:7J;8:76;9:6U;a7Lb6Wc5Vd59e51f4Dg43h3Vi3Pj3Nk3Ll3Bm32n2Yo2Up21ques7Nr1Ds07tTuRvMwCyBzA;ip,o6E;awn,e1Wie4T;aHeaGhEiCoAre7N;nd0rA;k,ry;mp,nApe,re,sh,tne85;!d,g;e6IiA;p,st6;r,th0;it,rAs4t2ve,x;ehou1ra84;aDiCoA;iAlunte0te,w;ce,d;be,ew,s8;cuum,l39;pAsh0;da4gra50lo4X;aLeKhrJiIoHrDuBwiAy4N;n,st;nArn;e,n63;aCeBiAu7;bu4ck,gg0m,p;at,nd;ck,de,in,nsf0p,v5Z;ll,ne,r3Rss,t77u2;ck,e,me,p,re;e4Mow,u7;ar,e,st;g,lArg63s4;k,ly;a0Ec09e06h01iZkXlVmUnTou6DpPtFuBwA;ear,it2;b1Xit,m,ppBrAspe5;ge,pri1vey;lAo5C;e59y;aHeGiFoDrBuAy6;dy,ff,mb6;a6DeAi4G;am,ss,t2;cking,p,rA;e,m;ck,t2;m,p;ck,in,ke,ll,mp,nd,rAte,y;!e,t;aCeed,iBla4Lons6NrAy;ay,e41ink6u3;n,r6Jte;n,rk;ee1Eow;e0Fi6o43;eep,iA;ce,p,t;ateboa60iA;!p;de,gnAze;!al;aDeCiBoA;ck,p,w;ft,p,v0;d,i32;pe,re;aBed,nArv15t;se,t1X;l,r2t;aDhedu6oCrA;at2eA;en,w;re,ut;le,n,r0I;crifi3il;aVeEiDoCuA;b,in,le,n,sA;h,t;a7ck,ll,ot;de,ng,p,s1B;as5FcOdo,el,fMgLje5lKmInHo0UpFque7sCturn,vAwa5D;eAi1I;al,r1;er5KoBt,uA;lt,me;l5Irt;air,eaAly,o3Z;l,t;dezvo25t;aAedy;ke,rk;ea1i3F;a51ist0r4E;act5Form,uA;nd,se;aAo4Yru8;ll;ck,i1ke,l48nAtU;ge,k;aZeWhUiRlNoJrBuA;mp,n2rcha1sh;ai1eFiEoAu3L;be,ceCdu3grAje5mi1te7;amAe5F;!me;ed,ss;ce,de;sAy;er4Vs;iClAol,p,re,s2Sw0;iAl;ce,sh;nt,s4J;aBe2AuA;g,n9;ce,nAy;!t;ck,lBnApe,t,vot;!e;e,ot;a1oA;ne,tograph;ak,eBn,rAt;fu3Wm8;!l;cka9iBn,rtAss,t2u1;!y;nt,r;bCff0il,oBrAutli2U;d0ie4U;ze;je5;a3NeCoA;d,tA;e,i3;ed,gle5rd,t;aFeDiCoBuA;rd0;d2Vnit46p,ve;lk,n2Zrr45x;asu12n3QrAss;ge,it;il,nBp,rk30sAt2;h,k;da4oeuv0Y;aGeDiCoAump;aAbby,ck,g,ok,ve;d,n;cen1ft,m8nEst;aBc0DvA;el,y;ch,d,p,se;bBcAnd,t2un2;e,k;el,o26;e2EiAno3E;ck,ll,ss;am,o18uA;d9i3;mpEnBr38ssA;ue;cr1Adex,fluBha6k,se1WterviAvoi3;ew;en3;a5le1R;aEeCiBoAu3U;ld,no1Uok,pe,r1st,u1;ghlight,ke,re,t;aAlp;d,t;ndBrAte;bo32m,ne3Jve7;!le;aIeek,lo3HoHrCuA;arAe3Gi0On;antee,d;aCiBoAumb6;om,u2D;nd,p;dAsp;e,ua4;of,ssip;in,me,ng,s,te,ze;aWeSiNlJoGrCuA;el,nAzz;c2Hd;aBoAy;st,wn;cAme;tuP;cBg,ol,rA;ce,e1Pm;us;aCe0Lip,oAy;at,od,wA;!er;g,re,sh,vo10;eDgClBnAre,sh,t,x;an3i0G;e,m,t0;ht,uE;ld;aBeAn3;d,l;r,tuA;re;ce,il,ll,rm,vo23;cho,nGsExAye;cCerci1hib8pAtra5;eriAo0K;en3me2L;el,han9;caAtima4;pe;count0d,gine0vy;aTeNiHoFrBuAye;b,mp,pli26;aCeBiA;ft,nk,ve;am,ss;ft,in;cu06d9ubt,wnloA;ad;p,sCvA;e,iAor3;de;char9liBpA;at2lay,u4;ke;al,ba4cDfeClBma0Xpos8siAtail;gn,re;ay,ega4;at,ct;liXrA;ea1;ma9n3rAte;e,t;a07ent06hZlWoGrCuA;be,rAt;e,l;aft,eCoBuAy;sh;p,ss,wd;d8ep;de,in,lNmHnCok,py,re,st,uAv0;gh,nAp6;sVt;ceCdu5glomeDstru5tAveI;a5rA;a7ol;ntArn;ra4;biEfoDmCpA;leAou09romi1;me1D;a07e1Cu4;rt;ne;lap1oA;r,ur;aBiA;ck,p;im,w;aBeAip;at,ck,er;iDllen9mpi0AnBrAuffe0G;ge,m,t;ge,nA;el;n,r;er,re;ke,ll,mp,p,rBsh,t2u1ve;se;d,e;aUeRiQlNoJrDuAypa0O;bb6ck6dgBff0lArn,st,zz;ly;et;anEeaDiBoadA;ca7;be,d9;ge;ch,k;ch,d;aCmb,ne,oBss,tt6x,ycott;le;k,st,t;rd,st;aBeAitz,oP;nd;me;as,d,ke,te;aBnef8t;it;r,t;il,lan3nCrgaBsA;e,h;in;!d,g,k;c01dTffilSge,iRlt0nOppLrHssFttDucBwaA;rd;tiA;on;aAempt;ck;i7ocM;st;chBmoA;ur;!iA;ve;eBroa2;ch;al;chAsw0;or;er;d,m,r;ia4;dEvA;an3oA;ca4;te;ce;i5reA;ss;ct;cAhe,t;eCoA;rd,uA;nt;nt,ss",
    "Actor": "true¦aJbGcFdCfAgardenIh9instructPjournalLlawyIm8nurse,opeOp5r3s1t0;echnCherapK;ailNcientJecretary,oldiGu0;pervKrgeon;e0oofE;ceptionGsearC;hotographClumbColi1r0sychologF;actitionBogrammB;cem6t5;echanic,inist9us4;airdress8ousekeep8;arm7ire0;fight6m2;eputy,iet0;ici0;an;arpent2lerk;ricklay1ut0;ch0;er;ccoun6d2ge7r0ssis6ttenda7;chitect,t0;ist;minist1v0;is1;rat0;or;ta0;nt",
    "Honorific": "true¦aObrigadiNcGdFexcellency,fiAliCma9officNp5queen,r2s0taoiseach,vice4;e0ultJ;cond liArgeaB;abbi,e0;ar0verend; adK;astGr0;eside6i0ofessF;me ministFnce0;!ss;gistrate,r4yC;eld mar3rst l0;ady,i0;eutena0;nt;shB;oct6utchess;aptain,hance4o0;lonel,mmand5n0unci3;gress0stable;m0wom0;an;ll0;or;er;d0yatullah;mir0;al",
    "Pronoun": "true¦'em,elle,h3i2me,she4th0us,we,you;e0ou;m,y;!l,t;e0im;!'s",
    "Singular": "true¦0:59;1:4I;2:58;3:4V;4:4T;5:4O;6:4S;7:52;8:4J;a4Sb47c3Ad2Xe2Qf2Gg25h1Tin1Qjel3k1Ol1Lm1Bn18o14p0Nqu0Mr0DsUtJuGvCw9;a9ha3Com2C;f1i4Wt0Ey9;! arou4F;arn4GeAo9;cabu07l53;gKr9;di6t1K;nc35p2SrAs 9;do3Ss56;bani2in0; rex,aIeHhGiEoDrBuAv9;! show;m2Jn5rntJto16;agedy,ib9o45;e,u2P;p5rq3E;c,de,er,m9;etE;ere,i8;am,mp39;ct5le4x return;aQcOeNhMi2kKoJtEuBy9;ll9n27st4P;ab2P;bAnri1Aper bowl,r9;f1roga2;st3Dtot0;aCepBipe3Qo1BrAudent9;! lo1K;ang1i8;fa1Fmo1F;ff1t30;loi41meo16;elet13i9;er,ll,rm3L;ack,or48;ab0Ucurity gu2D;e4ho9;l2Zol;la32;av0WeChetor5iAo9;de4om;te,v9;erb0N;bCcBf9publ5r0Ospi2;er9orm1;e4r0;it0ord label;a2u41;estion mark,ot28;aMeKhJiHlFort0rAu9yram1C;ddi8ppy,rpo0J;eCie3Ho9;bl3Us9;pe6t9;a2itu2;diction,mi0Eroga7ss relea0E;a9ebisci2;q27te,y1;cn5e9g;!r;armaci38otocoH;dest0ncil,r9t0;cen3Gsp3H;nAr2Rte9;!nt;el2Rop3;bj3DcApia2rde0thers,ve9wn1;n,rview;cu9e0F;pi1;aAit24ot9umb1;a25hi8;n29rra7;aFeEiDoAu9é0G;m0Sr0;mAnopo3pQrni8sq1Pt9u13;h1i35;!my;li0Wn09;d5nu,t0;mm0nAte9yf3;ri0;!d10;aurea2iAu9;ddi2nch;ght bulb,p0C;ey9ittL;!no2;cAdices,itia7se6te4vert9;eb1L;en7ide4;aJeaFighDo9uman right,ygie10;le,meAsp1Jtb9;ed;! r9;un; scho12ri9;se;dAv9;en; start,pho9;ne;m,ndful,ze;aHeFirl1KlaQoErAu9;l3y;an9enadi1id;a16d9; slam,fa9mo9;th1;d,lf1;lat0Dntlem9;an;df3r9;l5n1D;aHeGiElDol3rAun9;er0;ee market,iAon9;ti1;e16ga2;ame,u2;nan9ref3;ci1;lla,t14;br5mi3n0Uth1;conoEffDgg,lecto0MnCs1Xth5venBxAyel9;id;ampTempl0Ite4;i8t;er1K;e6i1J;my;adKeGiDoAr9u0P;agonf3i1;cAg1Fi3or,ssi1wn9;si0M;to0BumenB;ale6gniAnn1s9vide0O;conte4incen7tri6;ta0A;aBc0fAni0te9;c7rre4;ault 05err0;th;!dy;aXeVhOiNlLoDr9;edit cBit5uc9;ib9;le;ard;efficFke,lDmmuniqNnBpi1rr0t11u9yo2;ri1s9;in;ne6s9;ervatoVuI;ic,lQum9;ni0L;ie4;er9ie4;gy,ic;ty,vil wL;aDeqCocoBr9;istmas car9ysanthemum;ol;la2;ue;ndeli1racter9;ist5;ili8llDr9;e0tifica2;hi1naFpErCshi1t9ucus;erpi9hedr0;ll9;ar;bohyd9ri1;ra2;it0;ry;aPeOiMlemLoHrDu9;ddhiYnBr9tterf3;glar9i0;!y;ny;eakBiAo9;!th1;de;faRthroC;dy,g,roBwl,y9;!frie9;nd;ugh;ish;cyc9oH;liK;an,l3;nki8r9;!ri1;er;ng;cTdNllLnIppeti2rray,sFtBu9;nt,to9;psy;hAt5;ic;ie9le2;st;ce4pe6;ct;nt;ecAoma3tiA;ly;do2;er9y;gy; hominDjAvan9;tage;ec7;ti9;ve;em;cru0eAqui9;tt0;ta2;te;al",
    "Preposition": "true¦'o,-,aLbIcHdGexcept,fFinEmid,notwithstandiRoCpSqua,sBt7u4v2w0;/o,hereNith0;!in,oR;ersus,i0;a,s-a-vis;n1p0;!on;like,til;h0ill,owards;an,r0;ough0u;!oI;ans,ince,o that;',f0n1ut;!f;!to;or,rom;espite,own,u3;hez,irca;ar1e0oAy;sides,tween;ri6;',bo7cross,ft6lo5m3propos,round,s1t0;!op;! long 0;as;id0ong0;!st;ng;er;ut",
    "SportsTeam": "true¦0:1A;1:1H;2:1G;a1Eb16c0Td0Kfc dallas,g0Ihouston 0Hindiana0Gjacksonville jagua0k0El0Bm01newToQpJqueens parkIreal salt lake,sAt5utah jazz,vancouver whitecaps,w3yW;ashington 3est ham0Rh10;natio1Oredski2wizar0W;ampa bay 6e5o3;ronto 3ttenham hotspur;blue ja0Mrapto0;nnessee tita2xasC;buccanee0ra0K;a7eattle 5heffield0Kporting kansas0Wt3;. louis 3oke0V;c1Frams;marine0s3;eah15ounG;cramento Rn 3;antonio spu0diego 3francisco gJjose earthquak1;char08paA; ran07;a8h5ittsburgh 4ortland t3;imbe0rail blaze0;pirat1steele0;il3oenix su2;adelphia 3li1;eagl1philNunE;dr1;akland 3klahoma city thunder,rlando magic;athle0Mrai3;de0; 3castle01;england 7orleans 6york 3;city fc,g4je0FknXme0Fred bul0Yy3;anke1;ian0D;pelica2sain0C;patrio0Brevolut3;ion;anchester Be9i3ontreal impact;ami 7lwaukee b6nnesota 3;t4u0Fvi3;kings;imberwolv1wi2;rewe0uc0K;dolphi2heat,marli2;mphis grizz3ts;li1;cXu08;a4eicesterVos angeles 3;clippe0dodDla9; galaxy,ke0;ansas city 3nE;chiefs,roya0E; pace0polis colU;astr06dynamo,rockeTtexa2;olden state warrio0reen bay pac3;ke0;.c.Aallas 7e3i05od5;nver 5troit 3;lio2pisto2ti3;ge0;broncZnuggeM;cowbo4maver3;ic00;ys; uQ;arCelKh8incinnati 6leveland 5ol3;orado r3umbus crew sc;api5ocki1;brow2cavalie0india2;bengaWre3;ds;arlotte horAicago 3;b4cubs,fire,wh3;iteB;ea0ulR;diff3olina panthe0; c3;ity;altimore 9lackburn rove0oston 5rooklyn 3uffalo bilN;ne3;ts;cel4red3; sox;tics;rs;oriol1rave2;rizona Ast8tlanta 3;brav1falco2h4u3;nited;aw9;ns;es;on villa,r3;os;c5di3;amondbac3;ks;ardi3;na3;ls",
    "Uncountable": "true¦0:2S;1:1Z;2:27;a2Gb27c1Xd1Oe1Gf1Ag13h0Wi0Pj0Ok0Nl0Im08n06o05pZrUsIt9v7w3;a5i4oo3;d,l;ldlife,ne;rm8t2;ernacul1Ui3;neg1Tol0Otae;eAh9oothpas1Nr4un3yranny;a,gst1V;aff29ea18o4ue nor3;th;oZu3;ble3se1Ft;!shoot1X;ermod2Cund2;a,nnis;aCcene0JeBhAil9ki8o7p6t4u3weepstak1;g1Inshi12;ati02e3;am,el;ace24eci1;ap,cc2;n,ttl1;k,v2;eep,ingl1;na15ri1;d0Ofe1Wl3nd,t0C;m1Lt;a6e4ic3;e,ke0W;c3laxa0Tsearch;ogni0Srea0S;bi1in;aWe7hys0last1Lo5re3;amble,mis1s3ten1L;en1Ksu0D;l3rk;it0yC;a1Ptr07;bstetr0vercrowd17xyg10;a3ews;il polXtional securi1H;aAe8o5u3;m3s1B;ps;n3o1A;ey,o3;gamy;a3chan0rchandi17tallurgy;sl1t;chine3themat0; learn0Vry;aught2e6i5ogi4u3;ck,g0X;c,st0;ce,ghtn0Rngui1AteraSv2;ath2isuSss;ara09indergart0Inowled0U;azz,ewelD;ce,gnor8mp5n3;formaZter3;net,sta05;a3ort5;ti3;en0Z;an0Y;a6eIisto5o3;ckey,mework,ne3rserad7spitali0R;s0Qy;ry;ir,libYppiGs3;h3te;ish;ene6l5o4r3um,ymna0S;aDeed;lf,re;utZyce0D; 3t0;edit04po3;ol;aMicFlour,o5urni3;tu3;re;od,rgive3uri2wl;ne3;ss;conom0duca9lectr8n6quip7th0very4xper3;ti04;body,o3thU;ne;joy3tertain3;ment;ici02on0;tiR;e9i6o4raugh3ynas00;ts;pe,wnstai3;rs;abet1s3;honUrepu3;te;b3miQ;ut;aBelciAh7iv0l5o3urrency;al,ld w3nfusiGral,ttGusco9;ar;ass0oth1;es;aos,e4ick3;en;eHw8;us;d,rJ;a8eef,i6lood,read,u3;nt4tt2;er;ing;lliarEs3;on;g3ss;ga3;ge;cEdviDeroBirAm6ni5ppeal court,rithmet4spi3thlet0;rin;ic;se;en5n3;es3;ty;ds;craft;b0d3naut0;ynam0;ce;id,ou3;st0;ics",
    "Person|Noun": "true¦a05bZcWdPeNfMgKhHjDkiClBm9olive,p6r3s2triniYv0wang;an,enus,iol0;a,et;ky,on5umm01;ay,e1o0uby;bin,d,se;ed,x;atOe0ol;aGn0;ny;a0eloR;x,ya;a9eo,iE;ng,tL;a2e1o0;lDy;an,w3;de,smi4y;a0iKol8;ll,z0;el;ail,e0;ne;aith,ern,lo;a0dDmir,ula,ve;rl;a4e3i1ol0;ly;ck,x0;ie;an,ja;i0wn;sy;h0liff,rystal;ari0in,ristian;ty;ak4e3i2r0;an0ook;dy;ll;nedict,rg;er;l0rt;fredo,ma",
    "Noun|Gerund": "true¦0:25;1:24;2:1V;3:1H;4:1X;5:1N;a24b1Nc1Bd16en14f0Yg0Wh0Ti0Rjog1Zk0Pl0Lm0In0Go0Cp05ques08rWsGtBunderAvolunt15w6yDzo2;a8ed5i3or7r6;ap1Nest1Bi1;ki0r1N;i1r2s1Ttc1T;st1Mta4;al4e9hin4i8ra6y1J;c4di0i2v6;el15;mi0p1G;a1Xs1;ai12cIeHhFin1OkatDlZmo4nowCpeBt9u7w6;ea3im1T;f02r6;fi0vi0J;a1Kretc1Iu6;d1AfJ;l0Wn5;b7i0;eb6i0;oar5;ip14o6;rte2u1;a1r0At1;h7o3re6;a1Ge2;edu0Noo0N;aDe9i5o7u6;li0n2;o6wi0;fi0;a8c7hear1Cnde3por1struct6;r1Au3;or5yc0G;di0so2;p0Qti0;aBeacekAla9o7r6ublis0X;a0Peten5in1oces16;iso2si6;tio2;n2yi0;ee0K;cka0Tin1rt0K;f8pe7rgani6vula1;si0zi0;ni0ra1;fe3;e6ur0W;gotia1twor4;a7e6i2onito3;e1ssa0L;nufactu3rke1;a8ea7i6od0Jyi0;cen0Qf1s1;r2si0;n5ug0E;i6n0J;c4lS;ci0magi2n6ro2;nova1terac1;andPea1i7o6un1;l5wO;ki0ri0;athe3rie6ui5;vi0;ar0CenHi8l7or6ros1un5;ecas1mat1;ir1oo5;l7n6;anDdi0;i0li0;di0gin6;ee3;a8eba1irec1oub1r6umO;awi0es05i6;n4vi0;n6ti0;ci0;aFelebra1hDlBo8r6ur7;aw6os00;li0;a7di0lo3mplai2n6o4pi0ve3;duc1sul1;cMti0;apDea3imIo6ubI;ni0tK;a6ee3;n1t1;m9s1te3;ri0;aJeGitElDoBr9u6;il5ll7r6;pi0;yi0;an5;di0;a1m6o4;bi0;esHoa1;c6i0;hi0;gin2lon6t1;gi0;ni0;bys7c4ki0;ki0;it1;c9dverti8gi0rg7ssu6;mi0;ui0;si0;coun1ti0;ti0;ng",
    "Unit": "true¦a09b06cZdYexXfTgRhePin00joule0DkMlJmDnan0AoCp9quart0Dsq ft,t7volts,w6y2ze3°1µ0;g,s;c,f,n;dXear1o0;ttT; 0s 0;old;att06b;erPon0;!ne04;ascals,e1i0;cZnt02;rcent,tL;hms,uI;/s,e4i0m²,²,³;/h,cro2l0;e0liM;!²;grNsT;gEtL;it1u0;menSx;erRreR;b5elvins,ilo1m0notQ;/h,ph,²;!byIgrGmEs;ct0rtzN;aLogrE;allonLb0ig5rD;ps;a2emtGl0t6; oz,uid ou0;nceH;hrenheit,radG;aby9;eci3m1;aratDe1m0oulombD;²,³;lsius,nti0;gr2lit1m0;et0;er8;am7;b1y0;te5;l,ps;c2tt0;os0;econd1;re0;!s",
    "Adj|Noun": "true¦0:0S;a0Rb0Mc0Cde0Be06f00gZhomel08iXjuWlVmPnOoNpMrJsBt7u4va2w1;atershed,elcome;gabo4nilla,ria1;b0Dnt;ndergr1pstairs;adua0Jou1;nd;a3e1oken,ri0;en,r1;min0ror0B;boo,n;e6istZo4qua3ta2u1well;bordina0Cper6;b03ndard;re,t;cial05l1;e,ve0G;cret,n1ri0;ior;e1outiIubbish;ar,laUnt0p1;resentaTublican;atie0Aeriodic0otenti0rincip0;ffiYpposi01v0;agging,ovel;aRe4in3o1;biQdernUr1;al,t0;iature,or;di1tr04;an,um;attFiber0;stice,veniK;de0mpressionNn1;cumbeYdividu0noXstaY;enious,old;a4e2i1luid;ne;llow,m1;aDinH;t,vo1;riJuriJ;l3pRx1;c1ecu7pM;ess;d1iF;er;mographMriva3;hiDlassLo1rude;m4n2opera1;tive;cre9stitueHtemporary,vertab1;le;m2p1;anion,lex;er2un1;ist;ci0;lank,o4r1;i2u1;te;ef;ttom,urgeois;cadem6d3l2nim0rab;al;ert;oles1ult;ce1;nt;ic",
    "ProperNoun": "true¦barbie,c4diego,e3f2kirby,m0nis,riel;ercedes,i0;ckey,ssy;inn,ranco;lmo,uro;atalina,hristi",
    "Ordinal": "true¦eBf7nin5s3t0zeroE;enDhir1we0;lfCn7;d,t3;e0ixt8;cond,vent7;et0th;e6ie7;i2o0;r0urt3;tie4;ft1rst;ight0lev1;e0h,ie1;en0;th",
    "Cardinal": "true¦bEeBf5mEnine7one,s4t0zero;en,h2rDw0;e0o;lve,n5;irt6ousands,ree;even2ix2;i3o0;r1ur0;!t2;ty;ft0ve;e2y;ight0lev1;!e0y;en;illions",
    "Multiple": "true¦b3hundred,m3qu2se1t0;housand,r2;pt1xt1;adr0int0;illion",
    "City": "true¦0:6Y;1:5Y;2:6D;3:5R;4:5O;a65b50c4Fd45e41f3Tg3Eh36i2Xj2Sk2Bl20m1In18o15p0Tq0Rr0Ks01tPuOvLwDxiBy9z5;a7h5i4Juri4L;a5e5ongsh0;ng3E;greb,nzib5D;ang2e5okoha3Punfu;katerin3Erev0;a5n0N;m5En;arsBeAi6roclBu5;h0xi,zh5M;c7n5;d5nipeg,terth4;hoek,s1I;hi5Wkl37;l60xford;aw;a6ern2i5ladivost5Jolgogr6F;en3lni6M;lenc4Vncouv3Rr3ughn;lan bat1Brumqi,trecht;aDbilisi,eCheBi9o8r7u5;l1Zn60r5;in,ku;ipoli,ondh5Z;kyo,m2Zron1OulouS;an5jua3l2Umisoa69ra3;j4Ushui; hag60ssaloni2I;gucigal26hr0l av1U;briz,i6llinn,mpe57ng5rtu,shk2S;i3Fsh0;an,chu1n0p2Fyu0;aEeDh8kopje,owe1Gt7u5;ra5zh4Y;ba0Ht;aten is56ockholm,rasbou65uttga2W;an8e6i5;jiazhua1llo1m5Vy0;f51n5;ya1zh4I;gh3Lt4R;att46o1Wv45;cramen16int ClBn5o paulo,ppo3Srajevo; 7aa,t5;a 5o domin3F;a3fe,m1M;antonBdie3Dfrancisco,j5ped3Osalvad0K;o5u0;se;em,z26;lou57peters25;aAe9i7o5;me,sar5t58;io;ga,o5yadh;! de janei3F;cife,ykjavik;b4Sip4lei2Inc2Pwalpindi;ingdao,u5;ez2i0P;aEeDhCiBo8r7u6yong5;ya1;eb56ya1;ag50etor3M;rt5zn0; 5la4Do;au prin0Melizabe25sa04;ls3Qrae58tts27;iladelph3Hnom pe1Boenix;r22tah tik3F;lerZnaji,r4Nt5;na,r33;ak45des0Km1Nr6s5ttawa;a3Wlo;an,d06;a7ew5ing2Govosibir1Kyc; 5cast37;del25orlea45taip15;g8iro4Un5pl2Xshv34v0;ch6ji1t5;es,o1;a1o1;a6o5p4;ya;no,sa0X;aFeCi9o6u5;mb2Bni27sc3Z;gadishu,nt6s5;c14ul;evideo,re30;ami,l6n15s5;kolc,sissauga;an,waukee;cca,d5lbour2Nmph40ndo1D;an,ell5i3;in,ín;cau,drAkass2Sl9n8r5shh47;aca6ib5rakesh,se2L;or;i1Sy;a4BchEdal0Zi44;mo;id;aCeiAi8o6u5vRy2;anLckn0Odhia3;n5s angel26;d2g bea1N;brev2Be3Jma5nz,sb2verpo28;!ss27;c5pzig;est17; p6g5ho2Xn0Dusan25;os;az,la34;aHharFiClaipeBo9rak0Eu7y5;iv,o5;to;ala lump4n5;mi1sh0;hi0Ilka2Ypavog4si5wlo2;ce;da;ev,n5rkuk;gst2sha5;sa;k5toum;iv;bIdu3llakuric0Rmpa3Dn6ohsiu1ra5un1Jwaguc0R;c0Qj;d5o,p4;ah1Uy;a7e6i5ohannesW;l1Wn0;dd34rusalem;ip4k5;ar2I;bad0mph1PnBrkutVs8taYz5̇zm7;m6tapala5;pa;ir;fah0l6tanb5;ul;am2Wi2H;che2d5;ianap2Ko20;aAe7o5yder2T; chi mi5ms,nolulu;nh;f6lsin5rakli2;ki;ei;ifa,lifax,mCn5rb1Dva3;g8nov01oi;aFdanEenDhCiPlasgBo9raz,u5;a5jr23;dal6ng5yaquil;zh1J;aja2Lupe;ld coa1Athen5;bu2P;ow;ent;e0Uoa;sk;lw7n5za;dhi5gt1E;nag0U;ay;aisal26es,o8r6ukuya5;ma;ankfu5esno;rt;rt5sh0; wor6ale5;za;th;d5indhov0Pl paso;in5mont2;bur5;gh;aBe8ha0Xisp4o7resd0Lu5;b5esseldorf,rb0shanbe;ai,l0I;ha,nggu0rtmu13;hradSl6nv5troit;er;hi;donghIe6k09l5masc1Wr es sala1IugavpiY;i0lU;gu,je2;aJebu,hAleve0Vo5raio02uriti1N;lo7n6penhag0Ar5;do1Lk;akKst0V;gUm5;bo;aBen8i6ongqi1ristchur5;ch;ang m7ca5ttago1;go;g6n5;ai;du,zho1;ng5ttogr12;ch8sha,zh07;i9lga8mayenJn6pe town,r5;acCdiff;ber17c5;un;ry;ro;aVeNhKirmingh0UoJr9u5;chareSdapeSenos air7r5s0tu0;g5sa;as;es;a9is6usse5;ls;ba6t5;ol;ne;sil8tisla7zzav5;il5;le;va;ia;goZst2;op6ubaneshw5;ar;al;iBl9ng8r5;g6l5n;in;en;aluru,hazi;fa5grade,o horizonte;st;ji1rut;ghd09kGnAot9r7s6yan n4;ur;el,r05;celo3ranquil07;na;ou;du1g6ja lu5;ka;alo6k5;ok;re;ng;ers5u;field;a02bZccYddis abaXgartaWhmedUizawl,lQmNnHqaXrEsBt7uck5;la5;nd;he7l5;an5;ta;ns;h5unci2;dod,gab5;at;li5;ngt2;on;a6chora5kaLtwerp;ge;h7p5;ol5;is;eim;aravati,m0s5;terd5;am; 6buquerq5eppo,giers,maty;ue;basrah al qadim5mawsil al jadid5;ah;ab5;ad;la;ba;ra;idj0u dha5;bi;an;lbo6rh5;us;rg",
    "Region": "true¦0:2N;1:2T;2:2K;a2Qb2Dc1Zd1Ues1Tf1Rg1Lh1Hi1Cj18k13l10m0Pn07o05pZqWrTsKtFuCv9w5y3zacatec2U;akut0o0Du3;cat2k07;a4est 3isconsin,yomi1M;bengal,vi6;rwick2Bshington3;! dc;er4i3;rgin0;acruz,mont;dmurt0t3;ah,tar3; 2La0X;a5e4laxca1Rripu1Xu3;scaDva;langa1nnessee,x2F;bas0Vm3smNtar25;aulip2Dil nadu;a8i6o4taf11u3ylh1F;ffYrr04s1A;me1Cno1Quth 3;cVdU;ber0c3kkim,naloa;hu2ily;n4skatchew2xo3;ny; luis potosi,ta catari1;a3hode9;j3ngp07;asth2shahi;ingh25u3;e3intana roo;bec,en5reta0R;ara7e5rince edward3unjab; i3;sl0B;i,nnsylv3rnambu0B;an0;!na;axa0Ydisha,h3klaho20ntar3reg6ss0Bx0G;io;aJeDo5u3;evo le3nav0W;on;r3tt17va scot0;f8mandy,th3; 3ampton16;c5d4yo3;rk14;ako1N;aroli1;olk;bras1Mva0Cw3; 4foundland3;! and labrador;brunswick,hamp0Xjers4mexiSyork3;! state;ey;galOyarit;a9eghala0Mi5o3;nta1r3;dov0elos;ch5dlanCn4ss3zor11;issippi,ouri;as geraOneso18;ig2oac2;dhy12harasht0Gine,ni4r3ssachusetts;anhao,i el,ylF;p3toba;ur;anca0Ie3incoln0IouisH;e3iR;ds;a5e4h3omi;aka06ul1;ntucky,ra01;bardino,lmyk0ns0Qr3;achay,el0nata0X;alis5har3iangxi;kh3;and;co;daho,llino6n3owa;d4gush3;et0;ia1;is;a5ert4i3un2;dalFm0D;fordZ;mpYrya1waii;ansu,eorg0lou7oa,u3;an4erre3izhou,jarat;ro;ajuato,gdo3;ng;cesterS;lori3uji2;da;sex;ageTe6o4uran3;go;rs3;et;lawaLrbyK;aEeaDh8o3rimea ,umbr0;ahui6l5nnectic4rsi3ventry;ca;ut;i02orado;la;e4hattisgarh,i3uvash0;apQhuahua;chn4rke3;ss0;ya;ra;lFm3;bridge6peche;a8ihar,r7u3;ck3ryat0;ingham3;shi3;re;emen,itish columb0;h0ja cal7lk6s3v6;hkorto3que;st2;an;ar0;iforn0;ia;dygea,guascalientes,lAndhr8r4ss3;am;izo1kans4un3;achal 6;as;na;a 3;pradesh;a5ber4t3;ai;ta;ba4s3;ka;ma",
    "Country": "true¦0:39;1:2M;a2Xb2Ec22d1Ye1Sf1Mg1Ch1Ai14j12k0Zl0Um0Gn05om3DpZqat1KrXsKtCu6v4wal3yemTz2;a25imbabwe;es,lis and futu2Y;a2enezue32ietnam;nuatu,tican city;.5gTkraiZnited 3ruXs2zbeE;a,sr;arab emirat0Kkingdom,states2;! of am2Y;k.,s.2; 28a.;a7haBimor-les0Bo6rinidad4u2;nis0rk2valu;ey,me2Ys and caic1U; and 2-2;toba1K;go,kel0Znga;iw2Wji2nz2S;ki2U;aCcotl1eBi8lov7o5pa2Cri lanka,u4w2yr0;az2ed9itzerl1;il1;d2Rriname;lomon1Wmal0uth 2;afr2JkLsud2P;ak0en0;erra leoEn2;gapo1Xt maart2;en;negKrb0ychellY;int 2moa,n marino,udi arab0;hele25luc0mart20;epublic of ir0Dom2Duss0w2;an26;a3eHhilippinTitcairn1Lo2uerto riM;l1rtugE;ki2Cl3nama,pua new0Ura2;gu6;au,esti2;ne;aAe8i6or2;folk1Hth3w2;ay; k2ern mariana1C;or0N;caragua,ger2ue;!ia;p2ther19w zeal1;al;mib0u2;ru;a6exi5icro0Ao2yanm05;ldova,n2roc4zamb9;a3gol0t2;enegro,serrat;co;c9dagasc00l6r4urit3yot2;te;an0i15;shall0Wtin2;ique;a3div2i,ta;es;wi,ys0;ao,ed01;a5e4i2uxembourg;b2echtenste11thu1F;er0ya;ban0Hsotho;os,tv0;azakh1Ee3iriba03o2uwait,yrgyz1E;rWsovo;eling0Jnya;a2erF;ma15p1B;c6nd5r3s2taly,vory coast;le of m19rael;a2el1;n,q;ia,oI;el1;aiSon2ungary;dur0Mg kong;aAermany,ha0Pibralt9re7u2;a5ern4inea2ya0O;!-biss2;au;sey;deloupe,m,tema0P;e2na0M;ce,nl1;ar;bTmb0;a6i5r2;ance,ench 2;guia0Dpoly2;nes0;ji,nl1;lklandTroeT;ast tim6cu5gypt,l salv5ngl1quatorial3ritr4st2thiop0;on0; guin2;ea;ad2;or;enmark,jibou4ominica3r con2;go;!n B;ti;aAentral african 9h7o4roat0u3yprQzech2; 8ia;ba,racao;c3lo2morPngo-brazzaville,okFsta r03te d'ivoiK;mb0;osD;i2ristmasF;le,na;republic;m2naTpe verde,yman9;bod0ero2;on;aFeChut00o8r4u2;lgar0r2;kina faso,ma,undi;azil,itish 2unei;virgin2; is2;lands;liv0nai4snia and herzegoviGtswaGuvet2; isl1;and;re;l2n7rmuF;ar2gium,ize;us;h3ngladesh,rbad2;os;am3ra2;in;as;fghaFlCmAn5r3ustr2zerbaijH;al0ia;genti2men0uba;na;dorra,g4t2;arct6igua and barbu2;da;o2uil2;la;er2;ica;b2ger0;an0;ia;ni2;st2;an",
    "Place": "true¦aUbScOdNeMfLgHhGiEjfk,kClAm8new eng7ord,p5s4t2u1vostok,wake is7y0;akutCyz;laanbaatar,pO;ahiti,he 0;bronx,hamptons;akhalFfo,oho,under2yd;acifTek,h0itcairn;l,x;land;a0co,idHuc;gadRlibu,nhattR;a0gw,hr;s,x;osrae,rasnoyar0ul;sk;ax,cn,nd0st;ianKochina;arlem,kg,nd,ovd;ay village,re0;at 0enwich;brita0lakB;in;co,ra;urope,verglad8;en,fw,own2xb;dg,gk,h0lt;a1ina0uuk;town;morro,tham;cn,e0kk,rooklyn;l air,verly hills;frica,m7n2r3sia,tl1zor0;es;!ant2;adyr,tar0;ct0;ic0; oce0;an;ericas,s",
    "WeekDay": "true¦fri2mon2s1t0wednesd3;hurs1ues1;aturd1und1;!d0;ay0;!s",
    "Month": "true¦dec0february,july,nov0octo1sept0;em0;ber",
    "Date": "true¦ago,t0week end,yesterd2;mr2o0;d0morrow;ay;!w",
    "Duration": "true¦century,dAh9m6q5se4w1y0;ear,r;eek1k0;!s;!e4;ason,c;tr,uarter;i0onth;lliseco0nute;nd;our,r;ay,ecade",
    "FemaleName": "true¦0:IT;1:IX;2:I5;3:I6;4:IN;5:IA;6:JE;7:GR;8:JA;9:J6;A:HE;B:HO;C:IF;D:J3;E:IJ;F:H3;G:C5;H:HQ;aGJbFEcDKdCTeBJfB0gA9h9Pi9Cj8Bk7Bl5Vm45n3Jo3Fp33qu32r2As15t0Eu0Cv03wWxiUyPzI;aMeJineb,oIsof3;e3Qf3la,ra;h2iLlJna,ynI;ab,ep;da,ma;da,h2iIra;nab;aLeKi0FolB4uJvI;etAonDI;i0na;le0sen3;el,gm3Fn,rGBs8S;aoIme0nyi;m5XyAA;aNendDShiD9iI;dele9lKnI;if44niIo0;e,f43;a,helmi0lIma;a,ow;ka0nB;aNeKiIusa5;ck81ktoriBHlAole7viI;anGenIR;da,lA6rIs0;a,nIoniGX;a,iFJ;leInesGX;nI9rI;i1y;g9rIxGY;su5te;aZeVhSiOoMrJuIy2;i,la;acIRiIu0L;c3na,sI;hGta;nIr0H;iGya;aKffaEInIs6;a,gtiI;ng;!nFJra;aJeIomasi0;a,l9Mo87res1;l3ndolwethu;g9Do85rJssI;!a,ie;eIi,ri8;sa,za;bPlNmLnJrIs6tia0wa0;a60yn;iIya;a,ka,s6;arGe2iIm75ra;!ka;a,iI;a,t6;at6it6;a0Gcarlet3Te0ChYiUkye,neza0oStOuJyI;bI4lvi1;ha,mayI7ni7sJzI;an3KetAie,y;anIi8;!a,e,nI;aCe;aKeI;fIl5DphI;an4;cHSr5;b3fiA5m0MnIphi1;d2ia,ja,ya;er2lKmon1nJobh8NtI;a,i;dy;lEJv3;aNeJirIo0risF1y5;a,lDF;ba,e0i5lKrI;iIr6Gyl;!d8Ffa;ia,lDR;hd,iNki2nKrJu0w0yI;la,ma,na;i,le9on,ron;aJda,ia,nIon;a,on;!ya;k6mI;!aa;lKrJtaye7ZvI;da,inj;e0ife;en1i0ma;anA2bMd3Kh1PiBkLlKmJnd2rIs6vannaC;aCi0;ant6i2;lDGma,ome;ee0in8Qu2;in1ri0;a05e00hYiVoIuthDE;bTcSghRl8InQsKwJxI;anAWie,y;an,e0;aJeIie,lD; merBKann8ll1marD8t7;!lInn1;iIyn;e,nI;a,dG;da,i,na;ayy8D;hel63io;bDHer7yn;a,cJkImas,nGta,ya;ki,o;helHki;ea,iannG9oI;da,n1L;an0bKemGgi0iJnIta,y0;a88ee;han83na;a,eI;cE7kaC;bi0chJe,i0mo0nIquEHy0;di,ia;aEFelIiB;!e,le;een4ia0;aOeNhLipaluk,oKrIute67;iIudenCN;scil3LyamvaB;lly,rt3;ilome0oebe,ylI;is,lis;ggy,nelope,r5t2;ige,m0UnLo5rvaDDtJulI;a,etAin1;ricIt4T;a,e,ia;do2i07;ctav3dJfCWis6lIphCWumC0yunbileg;a,ga,iv3;eIvAB;l3tA;aXeViNoJurIy5;!ay,ul;a,eKor,rJuI;f,r;aCeEma;ll1mi;aOcMhariBLkLlaKna,sIta,vi;anIha;ur;!y;a,iDPki;hoHk9UolI;a,eDG;!mh;hir,lIna,risFsreE;!a,lBQ;asuMdLh3i6DnKomi8rgELtIzanin zah2;aIhal4;li1s6;cy,etA;e9iER;nngu30;a0Ackenz4e02iNoKrignayani,uriDAyI;a,rI;a,lOna,tH;bi0i2llBFnI;a,iI;ca,ka,qD0;a,cUkaTlOmi,nMrJtzi,yI;ar;aJiam,lI;anEK;!l,nB;dy,eIh,n4;nhHrva;aLdKiCMlI;iIy;cent,e;red;!gros;!e5;ae5hI;ae5el40;ag5FgOi,lLrI;edi79iJjem,on,yI;em,l;em,sF;an4iIliF;nIsCB;a,da;!an,han;b0DcAPd0Be,g09ha,i08ja,l06n04rMsoum60tLuJv82x9HyIz4;bell,ra,soB6;de,rI;a,eE;h8Eild1t4;a,cYgUiLjor4l7Sn4s6tKwa,yI;!aIbe6Wja9lAB;m,nBE;a,ha,in1;!aKbC8eJja,lDna,sIt64;!a,ol,sa;!l1H;! Kh,mJnI;!a,e,n1;!awit,i;aliAEcJeduarBfern5GjIlui5Y;o6Ful3;ecil3la2;arKeJie,oIr46ueriA;!t;!ry;et44i39;el4Wi77y;dIon,ue5;akran7y;ak,en,iIlo3Q;a,ka,nB;a,re,s4te;daIg4;!l3C;alDd4elIge,isD8on0;ei9in1yn;el,le;a0Oe0DiZoRuMyI;d3la,nI;!a,dJeBEnIsCI;!a,eBD;a,sCG;aCTcKel0QiFlJna,pIz;e,i7;a,u,wa;iIy;a0Te,ja,l2LnB;is,l1TrKttJuIvel4;el5is1;e,ie;aLeJi8na,rI;a86i8;lIn1t7;ei;!in1;aTbb9AdSepa,lNnKsJv3zI;!a,be5MetAz4;a,etA;!a,dI;a,sIy;ay,ey,i,y;a,iKja,lI;iIy;a9Ye;!aI;!nG;ia,ya;!nI;!a,ne;aQda,e0iOjZla,nNoLsKtIx4y5;iIt4;c3t3;e2NlCD;la,nIra;a,ie,o2;a,or1;a,gh,laI;!ni;!h,nI;a,d2e,n5Q;cPdon95iOkes6mi98na,rNtKurJvIxmi,y5;ern1in3;a,e55ie,yn;as6iJoI;nya,ya;fa,s6;a,isF;a,la;ey,ie,y;a05e00hYiPlAHoOrKyI;lIra;a,ee,ie;istIy6D;a,en,iJyI;!na;!e,n5A;nul,ri,urtnAX;aPerOlAWmKrIzzy;a,stI;en,in;!berlJmernI;aq;eIi,y;e,y;a,stE;!na,ra;aIei2ongordzol;dij1w5;el7OiLjsi,lKnJrI;a,i,ri;d2na,za;ey,i,lBAs4y;ra,s6;bi7cAGdiat7GeAZiSlRmQnyakuma1BrOss6JtLvi7yI;!e,lI;a,eI;e,i8J;a6DeJhIi4OlDri0y;ar6Ber6Bie,leErAZy;!lyn8Eri0;a,en,iIl5Soli0yn;!ma,nGsF;a5il1;ei8Ci,l4;a,tl6K;a09eZiWoOuI;anMdLliIst63;a8FeIsF;!n9tI;!a,te;e5Ji3Ky;a,i7;!anOcelDdNelHhan7PleMni,sJva0yI;a,ce;eIie;fIlDph5U;a,in1;en,n1;i8y;!a,e,n42;lIng;!i1ElI;!i1D;anOle0nLrKsI;i8AsI;!e,i89;i,ri;!a,elHif2CnI;a,etAiIy;!e,f2A;a,e8BiJnI;a,e8AiI;e,n1;cNda,mi,nJque4WsminGvie2y9zI;min8;a8eJiI;ce,e,n1s;!lIsFt0G;e,le;inJk4lDquelI;in1yn;da,ta;da,lSmQnPo0rOsJvaIzaro;!a0lu,na;aKiJlaIob81;!n9J;do2;belIdo2;!a,e,l39;a74en1i0ma;di2es,gr6Vji;a9elBogI;en1;a,e9iIo0se;a0na;aTePiKoIusFyacin2B;da,ll4rten23snI;a,i9M;lJmaI;ri;aJdIlaJ;a,egard;ry;ath1CiKlJnriet7rmi9sI;sa,t1B;en2Sga,mi;di;bi2Dil8ElOnNrKsJtIwa,yl8E;i5Pt4;n5Vti;iImo4Zri50;etI;!te;aCnaC;a,ey,l4;a04eYiTlRoPrLunKwI;enIyne1Q;!dolD;ay,el;acJetIiselB;a,chE;e,ieI;!la;ld1AogooI;sh;adys,enIor3yn2H;a,da,na;aLgi,lJna,ov85selIta;a,e,le;da,liI;an;!n0;mMnKorgJrI;ald3Oi,m3Btru87;etAi4T;a,eIna;s26vieve;ma;bJle,mIrnet,yH;al5Ki5;i5CrielI;a,l1;aVeSiRlorPoz3rI;anKeJiI;da,eB;da,ja;!cI;esJiIoi0O;n1s5Y;!ca;a,encI;e,ia;en,o0;lJn0rnI;anB;ec3ic3;jr,n7rLtIy8;emJiIma,ouma7;ha,ma,n;eh;ah,iBrah,za0;cr4Ld0Oe0Ni0Mk7l05mXn4WrUsOtNuMvI;aKelJiI;!e,ta;inGyn;!ngel2S;geni1ni43;h5Qta;mMperanLtI;eJhIrel5;er;l2Zr8;za;a,eralB;iIma,nest2Jyn;cIka,n;a,ka;a,eNiKmI;aIie,y;!li9;lIn1;ee,iIy;a,e,ja;lIrald;da,y;aXeViOlNma,no2oLsKvI;a,iI;na,ra;a,ie;iIuiI;se;a,en,ie,y;a0c3da,f,nNsKzaI;!betIve7;e,h;aIe,ka;!beI;th;!a,or;anor,nG;!a;!in1na;leEs6;vi;eJiIna,wi0;e,th;l,n;aZeNh3iMjeneLoI;lor5Qminiq4Gn3DrItt4;a,eEis,la,othIthy;ea,y;ba;an0AnaCon9ya;anRbQde,ePiNlKmetr3nIsir5H;a,iI;ce,se;a,iJla,orIphi9;es,is;a,l6A;dIrdI;re;!d59na;!b2ForaCraC;a,d2nI;!a,e;hl3i0l0HmOnMphn1rJvi1WyI;le,na;a,by,cJia,lI;a,en1;ey,ie;a,etAiI;!ca,el1Bka,z;arIia;is;a0Se0Oh05i03lVoKristJynI;di,th3;al,i0;lQnNrJurI;tn1E;aKd2MiIn2Mri9;!nI;a,e,n1;!l4;cepci57n4sI;tanIuelo;ce,za;eIleE;en,tA;aKeoJotI;il4Z;!pat2;ir8rKudI;etAiI;a,ne;a,e,iI;ce,s00;a2er2ndI;i,y;aSeOloe,rI;isKyI;stI;al;sy,tI;a1Qen,iIy;an1e,n1;deKlseJrI;!i8yl;a,y;li9;nNrI;isLlJmI;ai9;a,eIotA;n1tA;!sa;d2elHtI;al,elH;cJlI;esAi42;el3ilI;e,ia,y;itlZlYmilXndWrOsMtIy5;aKeKhIri0;erIleErDy;in1;ri0;a32sI;a31ie;a,iOlMmeKolJrI;ie,ol;!e,in1yn;lIn;!a,la;a,eIie,o7y;ne,y;na,sF;a0Hi0H;a,e,l1;is7l4;in,yn;a0Ie02iZlXoUrI;andi8eRiKoJyI;an0nn;nwDoke;an3CdgMg0XtI;n2WtI;!aJnI;ey,i,y;ny;etI;!t8;an0e,nI;da,na;bbi8glarJlo06nI;i7n4;ka;ancIossom,ythe;a,he;an18lja0nIsm3I;i7tI;ou;aVcky,linUni7rQssPtKulaCvI;!erlI;ey,y;hKsy,tI;e,iIy8;e,na;!anI;ie,y;!ie;nIt6yl;adJiI;ce;etAi9;ay,da;!triI;ce,z;rbKyaI;rmI;aa;a2o2ra;a2Sb2Md23g1Zi1Qj5l16m0Xn0Aoi,r05sVtUuQvPwa,yJzI;ra,u0;aLes6gKlJseI;!l;in;un;!nI;a,na;a,i2I;drKgus1RrJsteI;ja;el3;a,ey,i,y;aahua,he0;hJi2Gja,mi7s2DtrI;id;aNlJraqIt21;at;eJi8yI;!n;e,iIy;gh;!nI;ti;iKleJo6pi7;ta;en,n1tA;aIelH;!n1J;a01dje5eZgViTjRnKohito,toIya;inetAnI;el5ia;!aLeJiImK;e,ka;!mItA;ar4;!belJliFmV;sa;!le;a,eliI;ca;ka,sIta;a,sa;elIie;a,iI;a,ca,n1qI;ue;!tA;te;!bJmIstasiNya;ar3;el;aMberLeliKiIy;e,l3naI;!ta;a,ja;!ly;hHiJl3nB;da;a,ra;le;aXba,eQiNlLthKyI;a,c3sI;a,on,sa;ea;iIys0O;e,s0N;a,cJn1sIza;a,e,ha,on,sa;e,ia,ja;c3is6jaLksaLna,sKxI;aIia;!nd2;ia,saI;nd2;ra;ia;i0nJyI;ah,na;a,is,naCoud;la;c6da,leEmOnMsI;haClI;inIyZ;g,n;!h;a,o,slI;ey;ee;en;at6g4nJusI;ti0;es;ie;aXdiUelNrI;eKiI;anNenI;a,e,ne;an0;na;!aMeLiJyI;nn;a,n1;a,e;!ne;!iI;de;e,lDsI;on;yn;!lI;i9yn;ne;aLbJiIrM;!gaL;ey,i8y;!e;gaI;il;dLliyKradhJs6;ha;ya;ah;a,ya",
    "FirstName": "true¦aLblair,cHdevGgabrieFhinaEjCk9l8m4nelly,quinn,re3s0;h0umit;ay,e0iloh;a,lby;g6ne;a1el0ina,org5;!okuh9;naia,r0;ion,lo;ashawn,uca;asCe1ir0rE;an;lsAnyat2rry;am0ess6ie,ude;ie,m5;ta;le;an,on;as2h0;arl0eyenne;ie;ey,sidy;lex2ndr1ubr0;ey;a,ea;is",
    "LastName": "true¦0:9F;1:9V;2:9N;3:9X;4:9H;5:8K;6:9K;7:A0;8:9E;9:89;A:77;B:6F;C:6J;a9Ub8Mc7Kd6Xe6Sf6Eg5Vh58i54j4Pk45l3Nm2Sn2Fo27p1Oquispe,r18s0Ft05vVwOxNyGzD;aytsADhD;aDou,u;ng,o;aGeun80iDoshiA9un;!lD;diDmaz;rim,z;maDng;da,guc97mo6UsDzaA;aAhiA7;iao,u;aHeGiEoDright,u;jc8Sng;lDmm0nkl0sniewsA;liA1s3;b0iss,lt0;a5Sgn0lDtanabe;k0sh;aHeGiEoDukB;lk5roby5;dBllalDnogr2Zr10ss0val37;ba,obos;lasEsel7O;lGn dFrg8EsEzD;qu7;ily9Oqu7silj9O;en b35ijk,yk;enzue95verde;aLeix1KhHi2j6ka3IoGrFsui,uD;om4ZrD;c2n0un1;an,embl8TynisA;dor95lst31m4rr9th;at5Mi7MoD;mErD;are6Zlaci64;ps3s0Z;hirBkah8Dnaka;a01chXeUhQiNmKoItFuEvDzabo;en8Aobod34;ar7bot4lliv2zuA;aEein0oD;i67j3Lyan8V;l6rm0;kol5lovy5re6Qsa,to,uD;ng,sa;iDy5Z;rn5tD;!h;l5YmEnDrbu;at8gh;mo6Do6J;aFeDimizu;hu,vchD;en7Cuk;la,r17;gu8mDoh,pulve8Srra4R;jDyD;on5;evi6Filtz,miDneid0roed0ulz,warz;dEtD;!z;!t;ar41h6ito,lFnDr4saAto,v4;ch7d0AtDz;a4Oe,os;as,ihBm3Yo0Q;aOeNiKoGuEyD;a66oo,u;bio,iz,sD;so,u;bEc7Adrigue56g03j72mDosevelt,ssi,ta7Mux,w3Y;a4Be0O;ertsDins3;!on;bei0LcEes,vDzzo;as,e8;ci,hards3;ag2es,it0ut0y9;dFmEnDsmu7Yv5E;tan1;ir7os;ic,u;aSeLhJiGoErDut6;asad,if5Zochazk1V;lishc23pDrti62u54we66;e2Sov47;cEe09nD;as,to;as60hl0;aDillips;k,m,n5K;de39etIna,rGtD;ersErovDtersC;!a,ic;en,on;eDic,ry,ss3;i8ra,tz,z;ers;h70k,rk0tEvD;ic,l3S;el,t2N;bJconnor,g2BlGnei5PrEzD;demir,turk;ella3LtDwe5N;ega,iz;iDof6FsC;vDyn1E;ei8;aPri1;aLeJguy1iFoDune43ym2;rodahl,vDwak;ak3Tik5otn56;eEkolDlsCx3;ic,ov6W;ls1miD;!n1;ils3mD;co41ec;gy,kaEray2varD;ro;jiDmu8shiD;ma;aWcUeQiPoIuD;lGnFrDssoli5S;atDpTr67;i,ov4;oz,te4B;d0l0;h2lIo0GrEsDza0Y;er,s;aFeEiDoz5r3Dte4B;!n6E;au,i8no,t4M;!l9;i2Ql0;crac5Nhhail5kke3Pll0;hmeFij0j2ElEn2Wrci0ssiDyer18;!er;n0Io;dBti;cartDlaughl6;hy;dMe6Dgnu5Ei0jer34kLmJnci59rFtEyD;er,r;ei,ic,su1N;iEkBqu9roqu6tinD;ez,s;a54c,nD;!o;a52mD;ad5;e5Oin1;rig4Os1;aSeMiIoGuEyD;!nch;k4nDo;d,gu;mbarDpe2Rvr4;di;!nDu,yana1S;coln,dD;bDholm;erg;bed5TfeGhtFitn0kaEn6rDw2G;oy;!j;in1on1;bvDvD;re;iDmmy,rsCu,voie;ne,t11;aTennedy,h2iSlQnez47oJrGuEvar2woD;k,n;cerDmar58znets5;a,o2G;aDem0i30yeziu;sni3QvD;ch3V;bay4Frh0Jsk0TvaFwalDzl5;czDsA;yk;cFlD;!cDen3R;huk;!ev4ic,s;e6uiveD;rt;eff0l4mu8nnun1;hn,lloe,minsArEstra32to,ur,yDzl5;a,s0;j0GlsC;aMenLha2Qim0RoEuD;ng,r4;e2KhFnErge2Ku2OvD;anB;es,ss3;anEnsD;en,on,t3;nesDsC;en,s1;ki27s1;cGkob3RnsDrv06;en,sD;enDon;!s;ks3obs1;brahimBglesi3Ake4Ll0DnoZoneFshikEto,vanoD;u,v4A;awa;scu;aPeIitchcock,jaltal6oFrist46uD;!aDb0gh9ynh;m2ng;a24dz4fEjga2Tk,rDx3B;ak0Yvat;er,fm3B;iGmingw3NnErD;nand7re8;dDriks1;ers3;kkiEnD;on1;la,n1;dz4g1lvoLmJnsCqIrr0SsFuEyD;as36es;g1ng;anEhiD;mo0Q;i,ov08;ue;alaD;in1;rs1;aNeorgMheorghe,iKjonJoGrEuDw3;o,staf2Utierr7zm2;ayDg4iffitVub0;li1H;lub3Rme0JnEodD;e,m2;calv9zale0H;aj,i;l,mDordaL;en7;iev3A;gnJlGmaFnd2Mo,rDs2Muthi0;cDza;ia;ge;eaElD;agh0i,o;no;e,on;ab0erLiHjeldsted,lor9oFriedm2uD;cDent9ji3E;hs;ntaDrt6st0urni0;na;lipEsD;ch0;ovD;!ic;hatBnanFrD;arDei8;a,i;deS;ov4;dGinste6riksCsDva0D;cob2YpDtra2W;inoza,osiL;en,s3;er,is3wards;aUeMiKjurhuJoHrisco0ZuEvorakD;!oQ;arte,boEmitru,rDt2U;and,ic;is;g2he0Imingu7n2Ord1AtD;to;us;aDmitr29ssanayake;s,z; GbnaFlEmirDrvis1Lvi,w2;!ov4;gado,ic;th;bo0groot,jo04lEsilDvri9;va;a cruz,e3uD;ca;hl,mcevsAnEt2EviD;d5es,s;ieDku1S;ls1;ki;a06e01hOiobNlarkMoFrD;ivDuz;elli;h1lHntGoFrDs26x;byn,reD;a,ia;ke,p0;i,rer0N;em2liD;ns;!e;anu;aLeIiu,oGriDuJwe;stD;eDiaD;ns1;i,ng,uFwDy;!dhury;!n,onEuD;ng;!g;kEnDpm2tterjee,v7;!d,g;ma,raboD;rty;bGl08ng4rD;eghetEnD;a,y;ti;an,ota0L;cer9lder3mpbeIrFstDvadi07;iDro;llo;doEt0uDvalho;so;so,zo;ll;es;a08eWhTiRlNoGrFyD;rne,tyD;qi;ank5iem,ooks,yant;gdan5nFruya,su,uchEyHziD;c,n5;ard;darDik;enD;ko;ov;aEondD;al;nco,zD;ev4;ancRshwD;as;a01oDuiy2;umDwmD;ik;ckNethov1gu,ktLnJrD;gGisFnD;ascoDds1;ni;ha;er,mD;ann;gtDit7nett;ss3;asD;hi;er,ham;b4ch,ez,hMiley,kk0nHrDu0;bEnDua;es,i0;ieDosa;ri;dDik;a8yopadhyD;ay;ra;er;k,ng;ic;cosZdYguilXkhtXlSnJrGsl2yD;aEd6;in;la;aEsl2;an;ujo,ya;dFgelD;ovD;!a;ersGov,reD;aDjL;ss1;en;en,on,s3;on;eksejGiyGmeiFvD;ar7es;ez;da;ev;ar;ams;ta",
    "MaleName": "true¦0:DO;1:CP;2:D7;3:AK;4:CL;5:C0;6:CG;7:D3;8:BT;9:AS;A:95;B:DB;C:D4;D:BN;aCAbB8cA8d99e8Jf83g7Gh6Ti6Dj5Fk53l4Fm37n2Uo2Op2Gqu2Er1Ms12t0Gu0Fv08wUxTyJzE;aEor0;cEh9Kkaria,n0C;hFkE;!aC8;ar5VeC7;aMoGuE;sEu2LvBK;if,uf;nGsFusE;ouf,sE;ef;aEg;s,tE;an,h0;hli,nB9ssY;avi3ho4;aNeLiGoEyaBO;jcie88lfgang,odrow,utE;!er;lEnst1;bGey,fredBlE;aB0iE;am,e,s;e98ur;i,nde9sE;!l8t1;lFyE;l1ne;lEt3;a9Yy;aHiEladimir,ojte7V;cFha0kt68nceErgA6va0;!nt;e3Xt66;lentEn9T;inE;!e;ghBFlyss5Anax,sm0;aXeShOiMoIrGuFyE;!l3ro6s1;n7r5A;avAIeEist0oy,um0;ntAAv5Xy;bGd8SmEny;!as,mEoharu;aCCie,y;iAy;mEt5;!my,othy;adGeoFia0KomE;!as;!do8H;!de5;dHrE;en99rE;an98eEy;ll,n97;!dy;dgh,ha,iEnn3req,tsu4S;cAQka;aUcotSeQhMiKoIpenc3tEur1Xylve97zym1;anGeEua86;f0phBDvEwa85;e60ie;!islaw,l8;lom1uE;leyma6ta;dElAm1yabonga;!dhart75n8;aGeE;lErm0;d1t1;h7Lne,qu11un,wn,y6;aEbasti0k2Cl4Qrg4Nth,ymoAF;m5n;!tE;!ie,y;lFmEnti2Gq59ul;!ke5KmDu4;ik,vato7P;aZeVhe9WiRoIuFyE;an,ou;b7EdFf5pe7LssE;!elBJ;ol3Gy;an,bLc63dJel,geIh0landBmHnGry,sFyE;!ce;coe,s;!aA2nD;an,eo;l46r;er79g3n8olfo,riE;go;bDeAR;cEl8;ar6Jc6IhFkEo;!ey,ie,y;a8Wie;gFid,ubCyEza;an1KnZ;g9TiE;na9Ps;ch6Rfa4lImHndGpha4sFul,wi2IyE;an,mo6V;h7Km5;alAXol2Vy;iADon;f,ph;ent2inE;cy,t1;aJeHhilGier6UrE;aka18eE;m,st1;!ip,lip;dA5rcy,tE;ar,e3Fr1Z;b4Idra74tr6KulE;!o19;ctav3Ei3liv3m9Zndrej,rIsFtEum7wC;is,to;aFc7k7m0vE;al5T;ma;i,vM;aMeKiGoEu39;aEel,j5l0ma0r3J;h,m;cFg4i47kE;!au,h7Hola;holAkEolA;!olA;al,d,il,ls1vE;il8K;hom,tE;e,hE;anEy;!a4i4;a00eXiNoIuFyE;l2Hr1;hamFr6LstaE;fa,p55;ed,mI;di0Xe,hamGis2DntFsEussa;es,he;e,y;ad,ed,mE;ad,ed;cJgu4hai,kHlGnFtchE;!e9;a7Vik;house,o0Ct1;ae5Pe9NolE;aj;ah,hE;aFeE;al,l;el,l;hFlv2rE;le,ri9v2;di,met;ay0hUjd,ks2BlSmadXnRrLs1tGuricFxE;imilianBwe9;e,io;eHhFiAtEus,yA;!eo,hew,ia;eEis;us,w;j,o;cIio,kHlGqu6Zsha9tEv2;iEy;!m,n;in,on;el,oQus;!el91oPus;iHu4;achEcolm,ik;ai,y;amFdi,eEmoud;sh;adEm5H;ou;aXeRiPlo3AoLuFyE;le,nd1;cHiGkEth3uk;aEe;!s;gi,s,z;as,iaE;no;g0nn7CrenGuEv82we9;!iE;e,s;!zo;am,oE;n4r;a7Vevi,la4BnIonHst3thaGvE;eEi;nte;bo;!a6Eel;!ny;mGnFrEur55wr55;ry,s;ce,d1;ar,o4Y;aMeIhal7GiFristEu4Ky6J;i0o54;er0p,rE;k,ollE;os;en0iGnErmit,v3U;!dr3XnEt1;e18y;r,th;cp3j5m5Sna6OrFsp7them,uE;ri;im,l;a01eViToHuE;an,lEst2;en,iE;an,en,o,us;aOeMhnLkubAnJrHsE;eFhEi7Vue;!ua;!ph;dEge;i,on;!aEny;h,s,th55;!ath54ie,nD;!l,sEy;ph;o,qu2;an,mE;!mD;d,ffHrEs5;a5YemFmai6oEry;me,ni0Y;i7Fy;!e5OrE;ey,y;cLdCkJmIrGsFvi3yE;dCs1;on,p3;ed,od,rEv4V;e5Bod;al,es4Mis1;a,e,oEub;b,v;ob,quE;es;aXbRchiQgOkeNlija,nuMonut,rKsGtEv0;ai,suE;ki;aFha0i6ZmaEsac;el,il;ac,iaE;h,s;a,vinEw2;!g;k,nngu5F;!r;nacEor;io;ka;ai,rahE;im;aQeKoJuEyd7;be2FgHmber4KsE;eyFsE;a2e2;in,n;h,o;m3ra36sse2wa40;aIctHitHnrFrE;be28m0;iEy;!q0Z;or;th;bMlLmza,nKo,rGsFyE;a47dC;an,s0;lGo4Nry,uEv8;hi44ki,tE;a,o;an,ey;k,s;!im;ib;aWeSiQlenPoMrIuE;ilFsE;!tavo;herme,lerE;mo;aGegEov3;!g,orE;io,y;dy,h5J;nzaFrE;an,d1;lo;!n;lbe4Xno,oE;rg37van4X;oGrE;aEry;ld,rdB;ffr8rge;brFlCrEv2;la14r3Hth,y;e33ielE;!i5;aSePiNlLorrest,rE;anFedEitz;!dDer11r11;cGkE;!ie,lE;in,yn;esLisE;!co,z2W;etch3oE;yd;d4lEonn;ip;deriFliEng,rnan05;pe,x;co;bi0di,hd;dYfrXit0lSmLnIo2rGsteb0th0uge6vEymCzra;an,eE;ns,re2X;gi,i0AnErol,v2w2;estBie;oFriqEzo;ue;ch;aJerIiFmE;aIe2Q;lErh0;!iE;o,s;s1y;nu4;be0Bd1iGliFm3t1viEwood;n,s;ot1Ss;!as,j4EsE;ha;a2en;!d2Vg7mHoFuFwE;a26in;arE;do;oWuW;a02eRiPoHrag0uGwFylE;an,l0;ay6ight;a6dl8nc0st2;minHnFri0ugEvydAy29;!lA;!a2HnEov0;e9ie,y;go,iFykA;as;cEk;!k;armuEll1on,rk;id;andNj0lbeMmetri5nKon,rIsGvFwExt3;ay6ey;en,in;hawn,moE;nd;ek,rE;ick;is,nE;is,y;rt;re;an,le,mLnKrGvE;e,iE;!d;en,iGne9rEyl;eEin,yl;l35n;n,o,us;!i4ny;iEon;an,en,on;a08e06hYiar0lOoJrHuFyrE;il,us;rtE;!is;aEistob0S;ig;dy,lHnFrE;ey,neli5y;or,rE;ad;by,e,in,l2t1;aIeGiEyK;fEnt;fo0Et1;meEt5;nt;rGuFyE;!t1;de;enE;ce;aIeGrisE;!toE;ph3;st3;er;d,rEs;b4leE;s,y;cEdric,s7;il;lHmer1rE;ey,lFro9y;ll;!os,t1;eb,v2;a07eZiVlaUoSrFuEyr1;ddy,rtL;aMeHiGuFyE;an,ce,on;ce,no;an,ce;nFtE;!t;dFtE;!on;an,on;dFndE;en,on;!foEl8y;rd;bby,rEyd;is;i6ke;bGlFshE;al;al,lD;ek;nIrEshoi;at,nFtE;!r1B;aEie;rdB;!iFjam2nD;ie,y;to;kaNlazs,nIrE;n8rEt;eEy;tt;ey;dEeF;ar,iE;le;ar16b0Ud0Qf0Ogust2hm0Li0Ija0Hl03mZnSputsiRrIsaHugust5veFyEziz;a0kh0;ry;us;hi;aLchKiJjun,maInGon,tEy0;hEu09;ur;av,oE;ld;an,ndB;!el,ki;ie;ta;aq;as,dIgelBtE;hony,oE;i6nE;!iBy;ne;er,reEy;!as,i,s,w;iGmaEos;nu4r;el;ne,r,t;an,beQdCeKfIi,lHonGphYt1vE;aOin;on;so,zo;an,en;onUrE;ed;c,jaHksandGssaHxE;!andE;er,ru;ar,er;ndE;ro;rtB;ni;dCm7;ar;en;ad,eE;d,t;in;onE;so;aFi,olfBri0vik;!o;mEn;!a;dIeHraFuE;!bakr,lfazl;hEm;am;!l;allJelGoulaye,ulE;!lErG;ah,o;! rE;ahm0;an;ah;av,on",
    "Person": "true¦ashton kutchUbTcOdMeKgastPhIinez,jHkGleFmDnettLoCpAr5s4t2va1w0;arrDoode;lentino rossi,n go4;a0heresa may,iger woods,yra banks;tum,ylor;addam hussain,carlett johanssKlobodan milosevic;ay romano,e3o1ush limbau0;gh;d stewart,nald0;inho,o;ese witherspoFilly;a0ipJ;lmIris hiltD;prah winfrFra;essia0itt romnEubarek;en;bron james,e;anye west,endall,iefer sutherland,obe bryant;aime,effers7k rowling;a0itlBulk hogan;lle berry,rris5;ff0meril lagasse,zekiel;ie;a0enzel washingt2ick wolf;lt1nte;ar1lint0;on;dinal wols1son0;! palm2;ey;arack obama,rock;er",
    "Adjective": "true¦0:98;1:84;2:81;3:8Z;4:8T;5:6H;6:85;7:89;8:8U;9:8G;A:5Z;a7Qb7Ac6Sd6Ae5Sf5Ag52h4Ri3Tjuni46k3Rl3Gm34n2Uo2Fp1Wquart66r1Ls0Rt0JuMvIwBye1J;ast56eFholeEiDoB;man5oBrthwhi6u0F;d7Lzy;despr8Is6H;!sa6;ather13eBll o5Lste2R;!k5;aDeCiBola5F;b98ce versa,gi2R;ng4Xrsa5D;ca0lu56;lt06nHpDrCsBttermo90;ef79u4;b6Age0; Db2BpCsBti37;ca6et,ide dO;er,i4N;f3Vto da3;aWbecom2cVdPeOfNiMknLmKpJrGsCtoFus1wB;a06iel4G;e73i2GoDpCuB;pervis1spect2;e0ok71;ld;eBu5;cognQgul0LlBsolv1;at1ent2;a9recedeY;arri1et;own;que,vers4;air,orese6S;mploy1nd2xpect1;eBue;cid1rB;!a6VcovAly2sDwB;aBei2L;tAy;iz1to45;heck1onvinc2;ppeal2ssum2tteCuthorB;iz1;nd1;i3Ira;aGeDhough5Cip 1QoCrB;anspa72i3;gethAle86rp9;ena6JmpCrB;r3Htia6T;e8o6R;leBst3S;nt1;a03c01eZhYiWkiVmug,nobb41oPpMqueam41tGuBymb73;bDi generis,pBr5;erBre1P;! dupAb,viX;du1sBurb53;eq76tanda7S;atu6DeFi0VrByl3V;aBin4G;ightBy; fBfB;or61;adfa7Kri6;arCeBirit1lend9ot on;c30e36;k5se; caGlub6mbAphisticFrEuCvB;erei5Miet;ndBth0Y;pro6I;d9ry;at1;ll1;g1YnB;ce5Bg6;am32eA;at1co1Jem5lf3CnBre7;so5Z;ath2holBient2M;ar5;cr1me,tisfac5Q;aJeEheumato9iCoB;bu70tt5Cy4;ghtBv4;-w2f58;bZcEdu6RlDnown1sBtard1;is3FoB;lu3na0;e1Duc3D;e0ondi3;b9ciB;al,st;aOeMicayu7laLopuli6QrCuB;bl5Ynjabi;eGiEoB;!b2SfCmi3EpBv4Zxi21;er,ort63;a7u66;maBor,sti7va3;!ry;ci63exist2mBpa9;a1QiB;er,um;c9id;ac29rBti3;fe69ma34ti34v5X;i29rCsB;s5St;allCtB;-ti05i4;el;bMffKkJld InGrFthAutEverB;!aCni0Gseas,t,wB;ei0Frou0F;ll;do0Xer;d2Wg1N; bBbBgo2li7;oa62;fashion1school;!ay; gua5ZbBli7;eat;eCsB;ce7er0Do0S;dia0se;aJeIiHoBuanc1;nDrthBt1W;!eB;rn;chaCdescri5Nprof2AsB;top;la0;ght5;arby,cessa4Eighbor5xt;k1usiat2;aIeHinGoCuB;d15ltip6;deDl14nBot,st;ochroBth5;me;rn,st;dblSi;nac2re;cDgenta,in,j04keshift,mmCnBscu4G;da3Xy;ali2Koth;ab3Aho;aKeHiEoCuB;mber2sh;ngBut1A;stand2term;ghtweiCteraB;l,te;ght;ft-w2gBssAth4;al,eBi0B;nda3R;ngu9ps1st;aput,ind5nB;ow2;gno4Yll03mVnDpso 26rB;a3releB;va0; QaPcoMdJe2BfIhibi3EiWnHoGsDtBvalu0V;a4LeB;n49rdep1V;a7igColBuboD;ub6ve0;nifica0;rdi42;a3er;eriCluenOreq3Y;eCiEoB;or;fini3p1Mtermi3X;mpCnside8rB;re49;le3;ccu8deq3Yppr38;fBsitu,vitro;ro0;mFpB;arDeCl0SoBropA;li3r0P;nd2rfe41;ti4;aCeBi0U;d30n3N;tu24;egCiB;c0Lte8;al,iB;tiB;ma3;aIelHiFoCumB;a7dr3J;me ma2DnCrrBs04ur5;if31;e3Ro2K;ghfalut1MspB;an2Y;lUpf1Y;lCnBrdZtI;dy;f,low1;aiHener2Tiga27lob4oGraDuB;ilBng ho;ty;cCtB;ef1Qis;ef1P;od;nf1N;aPeMinLlJoErB;aCeBoz1N;q2Qtf1K;gi6nt2I;olErB; keeps,eBge0GmAtu2Pwa39;go2i1DseeB;ab6;ish;ag38uB;e0oresce0;al,i3;dCmini7rB;ti6; up;bl1i0l2Imiliar,r Bux;oBreach2;ff;aPfficie0lNmKnIqu4re2Qthere4veHxB;a2Pem2SplEquisi3traDuB;be2XlB;ta0;!va1I;icB;it;n,ryday; Bti0P;rou3sui3;erCiB;ne0;ge0;dBe19;er5;gAsB;t,ygo2;er;aQeHiCoBrea16ue;mina0ne,rma0ubK;dact1Jfficult,m,sCverB;ge0se;creCeJjoi0pa8tB;a0in23;et,te; IadpHceGfiFgene8liDpCreli21spe8voB;id,ut;ende0;ca3ghB;tf0B;a0ni3;as1;an;facto;i5ngeroY;ly;arRePivil,oErCuB;nn2stoma0N;aBu0Jystal0Y;v03z1;erKgniza0loJmInDrCveB;rt;po8ru1N;cEduHgr13jDsCtraB;dic0Ary;eq11ta0;oi0ug4;a0Vi14;mensu8pass0Z;ni4ss4;ci0S;leba3rtaB;in;diac,efN;aNeGizarFliLoDrBuck nak1;and new,isk,oB;kMn1E;gBldface,na fiT;us;re;autifGhiFloEnCsByoF;iPt;eUiBt;gn;v1w;nd;ul;ckCnkru0YrrB;en;!wards; priori,b0Pc0Md0Ff09g07h06l00mp6ntiquXpRrLsleep,ttracti08uHvEwB;aCkB;wa0W;ke,re;ant garCeraB;ge;de;diDtB;heBoimmu7;ntW;toG;bitEchiv4roDtiB;fiB;ci4;ga0;raB;ry;pBt;aEetiz2rB;oprB;ia3;ing;re0;at1e;ed;le;cohEiIkaCl,oBterO;of;li7;ne;olB;ic;ead;ainZed,gressiB;ve;fCra9;id;ectClB;ue0;ioB;na3; FeDvB;erB;se;pt,qB;ua3;hoc,infinitB;um;cu8tu4u3;al;ra3;erMlKoIrFsCuB;nda0;e0olu3traB;ct;te;eaCuB;pt;st;aBve;rd;aBe;ze;ra0;nt",
    "Determiner": "true¦aBboth,d9e6few,l4mu8neiDplenty,s3th2various,wh0;at0ich0;evC;at,e4is,ose;everal,ome;a,e0;!ast,s;a1i6l0very;!se;ch;e0u;!s;!n0;!o0y;th0;er",
    "Adverb": "true¦a09b05d01eXfRhPinOjustNkinda,likewi00mLnIoDpBquite,r8s4t1up0very,well; to,wards5;h1iny bit,o0wiO;o,t6w05;en,us;eldom,o0uch;!me1rt0; of;hZtimes,w0B;a1e0;alT;ndomSthN;ar excellDer0oint blank; Nhaps;f3n0;ce0ly;! 0;ag04moY; courIten;ewKo0; longEt 0;onIwithstanding;aybe,eanwhiAore0;!ovB;! aboW;deed,steX;en0;ce;or2u0;lArther0;!moL; 0ev3;examp0good,suJ;le;n1v0;er; mas0ough;se;e0irect1; 1finite0;ly;juAtrop;ackw2y 0;far,n0;ow;ard; DbroCd nauseam,gBl6ny3part,s2t 0w4;be6l0mo6wor6;arge,ea5; soon,ide;mo1w0;ay;re;l 1mo0one,ready,so,ways;st;b1t0;hat;ut;ain;ad;lot,posteriori",
    "Conjunction": "true¦aDb9cuz,how7in caCno6o5p4supposing,t1wh0yet;eth7ile;h0o;eref8o0;!uB;lus,rovided that;r,therwi6; matt1r;!ev0;er;e0ut;cau1f0;ore;se;lthou1nd,s 0;far as,if;gh",
    "Currency": "true¦$,aud,bQcOdJeurIfHgbp,hkd,iGjpy,kElDp8r7s3usd,x2y1z0¢,£,¥,ден,лв,руб,฿,₡,₨,€,₭,﷼;lotyQł;en,uanP;af,of;h0t5;e0il5;k0q0;elK;oubleJp,upeeJ;e2ound st0;er0;lingG;n0soF;ceEnies;empi7i7;n,r0wanzaCyatC;!onaBw;ls,nr;ori7ranc9;!os;en3i2kk,o0;b0ll2;ra5;me4n0rham4;ar3;e0ny;nt1;aht,itcoin0;!s",
    "Adj|Present": "true¦a00bluZcRdMeKfHhollGidNlEmCnarrGoBp9qua8r7s4t2utt3w0;aIet,ound,ro0;ng,ug01;end0hin,op;er;e1l0mooth,our,pa8u8;i2ow;cu6daVlNpaJ;eplicaUigV;ck;aDr0;eseOime,ompt;bscu1pen,wn;atu0eLodeD;re;ay,eJi0;gNve;ow;i1r0;ee,inge;rm;l0mpty,xpress;abo4ic7;amp,e2i1oub0ry;le;ffu8r5;fu7libe0;raB;l4o0;mple9n2ol,rr1unterfe0;it;ect;juga6sum5;e1o0;se;an;nt;lig2pproxi0;ma0;te;ht",
    "Comparable": "true¦0:3B;1:3Q;2:3F;3:2D;a3Ub3Cc30d2Qe2Jf27g1Vh1Li1Fj1Ek1Bl14m0Yn0To0Sp0Jqu0Hr08sJtEuDvBw5y4za0R;el11ou3A;a8e6hi1Hi4ry;ck0Dde,l4n1ry,se;d,y;a4i3T;k,ry;nti34ry;a4erda2ulgar;gue,in,st;g0pcomi31;a7en2Thi6i5ough,r4;anqu28en1ue;dy,g36me0ny,r03;ck,rs24;ll,me,rt,wd3I;aRcarQePhNiMkin0BlImGoEpDt7u5w4;eet,ift;b4dd0Vperfi1Wrre24;sta22t3;a8e7iff,r5u4;pUr1;a4ict,o2P;ig2Wn0N;a1ep,rn;le,rk;e1Oi2Wright0;ci1Vft,l4on,re;emn,id;a4el0;ll,rt;e6i4y;g2Nm4;!y;ek,nd2T;ck,l0mp3;a4iRort,rill,y;dy,l01rp;ve0Ixy;ce,y;d,fe,int0l1Ev0U;a9e7i6o4ude;mantic,o16sy,u4;gh,nd;ch,pe,tzy;a4d,mo0A;dy,l;gg5ndom,p4re,w;id;ed;ai2i4;ck,et;hoBi1ClAo9r6u4;ny,r4;e,p3;egna2ic5o4;fouSud;ey,k0;liXor;ain,easa2;ny;dd,i0ld,ranL;aive,e6i5o4;b3isy,rm0Vsy;ce,mb3;a4w;r,t;ad,e6ild,o5u4;nda0Yte;ist,o1;a5ek,l4;low;s0ty;a8ewd,i7o4ucky;f0Gn5o12u4ve0w0Wy0K;d,sy;e0g;ke0tt3ve0;me,r4te;ge;e5i4;nd;en;ol0ui1B;cy,ll,n4;secu7t4;e4ima5;llege2rmedia4;te;re;aBe8i7o6u4;ge,m4ng1E;b3id;me0t;gh,l0;a4fVsita2;dy,v4;en0y;nd15ppy,r4;d,sh;aEenDhBiAl9oofy,r4;a7e6is0o4ue12;o4ss;vy;at,en,y;nd,y;ad,ib,ooE;a2d1;a4o4;st0;t3uiS;u1y;aDeeb3i9lat,o7r6u4;ll,n4r0S;!ny;aDesh,iend0;a4rmEul;my;erce5nan4;ciB;! ;le;ir,ke,n08r,st,ul4;ty;a7erie,sse5v4xtre0G;il;nti4;al;r5s4;tern,y;ly,th0;aCe9i6ru5u4;ll,mb;nk;r5vi4;ne;e,ty;a4ep,nB;d4f,r;!ly;ppVrk;aDhAl8o6r5u4;dd0r0te;isp,uel;ar4ld,mmon,st0ward0zy;se;e4ou1;ar,vO;e4il0;ap,e4;sy;gey,lm,ri4;ng;aJiHlEoCr6u4;r0sy;ly;a8i5o4;ad,wn;g5llia2;nt;ht;sh,ve;ld,un4;cy;a5o4ue;nd,o1;ck,nd;g,tt4;er;d,ld,w1;dy;bsu7ng6we4;so4;me;ry;rd",
    "Infinitive": "true¦0:8U;1:8H;2:9C;3:90;4:81;5:7O;6:98;7:83;8:9F;9:91;A:9G;B:8W;C:7V;D:7R;E:7L;F:88;a81b7Ec6Od5Ge4Ef44g40h3Wi3Cj39k36l2Xm2Qnou3Vo2Lp24qu23r19s08tWuRvPwG;aMeLiJrG;eHiG;ng,te;ak,st4;d5e7CthG;draw,er;a2d,ep;i2ke,nGrn;d0t;aGie;li9Bni8ry;nGplift;cov0dHear7IlGplug,tie,ve84;ea8o3K;erGo;go,sta9Dval93whelm;aPeNhKoJrG;aGemb4;ffi3Fmp4nsG;aCpi7;pp4ugh5;aHiHrGwaD;eat5i2;nk;aGll,m8Z;ch,se;ck4ilor,keGmp0r7M;! paD;a0Fc0Ee0Ch08i06l04m03n02o00pVquUtNuIwG;all70e2EiG;m,ng;bIccumb,ffHggeBmm90p2FrG;mouFvi2;er,i3;li7Zmer9siGveD;de,st;aKe7SiIrG;ang4eGi2;ng20w;fGnW;f5le;gg0rG;t4ve;a3Ri8;awn,eJiIlHoGri6A;il,of;ay,it;ll,t;ak,nd;lGot6Lw;icEve;eak,i0K;a8ugg4;aGiA;m,y;ft,nGt;g,k;aIi5EoHriGun;nk,v5Q;ot,rt5;ke,rp5tt0ve;eGll,nd,que7Iv0w;!k,m;aven9ul7W;dd5tis17y;att4eHip5oG;am,ut;a05b03c01d00fXgroup,heaWiVlTmSnRpPq30sLtJvG;amp,eHiGo2P;sEve;l,rt;i7rG;ie2ofE;eFiItGurfa3;aDo1VrG;a5TiCuctu7;de,gn,st;el,hra1lGreseF;a3e66;d0ew,o02;a5Oe2Vo2;a6eFiGoad,y;e2nq3Fve;mbur1nf2O;r1t;inHleCocus,re8uG;el,rbi8;an3e;aCu3;ei2k7Ela3IoGyc4;gni57nci4up,v0;oot,uG;ff;ct,d,liG;se,ze;a8en5Nit,o6;aUerSiRlumm0UoQrIuG;b3Jke,ni8rGt;poDs6S;eKoG;cId,fe33hibEnoHpo1sp0truAvG;e,iAo4R;un3;la34u7;a5Ec1NdHf0ocSsup0EvG;a5JeF;etermi41iC;a5Brt4T;er3npoiF;cei2fo3Bi8mea6plex,sGvaA;eve7iB;mp0n13rGtrol,ve,y;a5Pt5L;bser2cJpIutHverGwe;lap,s15tu65u1;gr4Mnu1Wpa3;era6i3Rpo1;cupy;aLe08iHoGultiply;leBu60;micInHsG;pla3s;ce,g4us;!k;im,ke,na9;aNeJiGo1u34;e,ke,ng0quGv5;eGi62;fy;aInG;d,gG;th5;rn,ve;ng20u19;eHnG;e3Low;ep;o43uG;gg4xtaG;po1;gno7mUnG;cSdQfPgeBhOitia6ju7q0YsMtIun5OvG;eGo0N;nt,st;erHimi5LoxiOrG;odu3uA;aCn,prGru5L;et;iBpi7tGu7;il,ruC;abEibE;eBo25u1;iGul9;ca6;i6luA;b57mer1pG;aDer44ly,oHrG;is5Io2;rt,se,veG;ri8;aIear,iGoiBuD;de,jaGnd0;ck;mp0ng,pp5ve;ath0et,i2le1PoIrG;aGow;b,pp4ze;!ve4O;ast5er3Ji54lOorJrHuG;lf3Rr3N;ee2ZolG;ic;b3CeIfeEgGs4A;eGi2;!t;clo1go,sGwa4G;had2X;ee,i2L;a0FdEl0Dm08nQquip,rPsOt3CvMxG;cKeDha4iJpHtG;ing0Pol;eGi7loEo1un9;ct,di6;st,t;luA;alua6oG;ke,l2;chew,pou1tab11;a1u4F;aWcTdRfQgOhan3joy,lNqMrLsuKtIvG;e0TisG;a9i4K;er,i3rG;a2Jen2XuB;e,re;i2Vol;ui7;ar9iB;a9eGra2ulf;nd0;or3;ang0oGu7;r1w;lo1ou0ArHuG;mb0;oa2Ly3Y;b4ct;bHer9pG;hasi1Xow0;a0Sody,rG;a3oiG;d0l;ap1eCuG;ci3Ode;rGt;ma0Mn;a0Me01iIo,rGwind4;aw,ed9oG;p,wn;agno1e,ff0g,mi29sJvG;eGul9;rGst;ge,t;ab4bTcNlod9mant4pLru3GsKtG;iGoDu2W;lHngG;ui8;!l;ol2uaA;eGla3o1ro2;n1r1;a17e2WlJoHuG;ss;uGv0;ra9;aGo1;im;a37ur1;af5bXcRduCep5fPliOmLnJpIra1Uta1OvG;eGol2;lop;aDiCoD;oGy;te,un3;eHoG;li8;an;mEv0;a3i03oGraud,y;rm;ei2iKoIrG;ee,yG;!pt;de,mGup4;missi2Tpo1;de,ma6ph0;aHrief,uG;g,nk;rk;mp5rk5uF;a03ea1h01i00lZoHrGurta18;a2ea6ipp4;ales3eWhabEinciAllVmTnGrroA;cQdNfLju7no6qu0sJtIvG;eGin3;ne,r9;a0Iin24ribu6;er2iGoli26pi7titu6ult;d0st;iGroFu1;de,gu7rm;eHoG;ne;mn,n1;eGluA;al,i2;buBe,men3pG;e6ly;eCiAuA;r3xiB;ean1iQ;rcumveFte;eGoo1;ri8w;ncGre5t0ulk;el;aZeTiSlPoNrJuG;iHrGy;st,y;ld;aIeHiGoad5;ng;astfeKed;ke;il,l11mbaGrrNth0;rd;aHeGow;ed;ze;de,nd;!come,gKha2liJnd,queaIstHtGwild0;ray;ow;th;e2tt4;in;bysEckfi7ff4tG;he;it;b13c0Rd0Iffix,gr0Hl0Dm09n03ppZrXsQttNuLvIwaG;it,k5;en;eDoG;id;rt;gGto06;meF;aHeBraC;ct;ch;pi7sHtoG;ni8;aIeGi03u7;mb4rt;le;il;re;g0Fi1ou1rG;an9i2;eaIly,oiFrG;ai1o2;nt;r,se;aKiOnHtG;icipa6;eHoGul;un3y;al;ly1;aHu1;se;lgaGze;ma6;iIlG;e9oGuA;t,w;gn;ee;aZjLmiIoHsoG;rb;pt,rn;niGt;st0;er;ouHuB;st;rn;cJhie2knowled9quiGtiva6;es3re;ce;ge;eMomIrHusG;e,tom;ue;moHpG;any,li8;da6;te;pt;andMet,iAoIsG;coIol2;ve;li8rt,uG;nd;sh;de;on",
    "Modal": "true¦c5lets,m4ought3sh1w0;ill,o5;a0o4;ll,nt;! to,a;ight,ust;an,o0;uld",
    "Participle": "true¦f4g3h2less6s1w0;ors5ritt5;e4h5;ast3e2;iv2one;l2r0;ight0;en;own",
    "Adj|Gerund": "true¦0:2C;1:2E;2:22;3:20;4:1X;5:24;a1Zb1Uc1Cd0Ze0Uf0Kg0Eh0Di07jud1Sl04m01oXpTrNsCt7up6veWw0Lyiel4;lif0sZ;aUe9hr7i3ouc22r6wis0;eZoub2us0yi1;ea0Ji6;l2vi1;l2mp0;atisf28creec1Xhoc0Bkyrocke0lo0ZoEpDt9u7we6;e0Yl2;pp1Gr6;gi1pri5roun4;a7ea1Zi6ri07un18;mula0r3;gge3r6;t2vi1;ark2ee4;a6ot1O;ki1ri1;aAe7ive0o6us1M;a3l2;defi0Zfres1Kig0ZlaCs0v6war4;ea2itali6ol0M;si1zi1;gi1ll1Smb2vi1;a1Rerple8ier19lun14r6un1F;e6o0X;ce4s5vai2;xi1;ffs8pKut7ver6wi1;arc1Blap0Dri4whel1H;goi1l1Lst0U;et0;eande3i7o0Bu6;mb2;s5tiga0;a7i6o08;fesa07mi0vi1;cHg0Rs0;mAn6rri08;c8s7te13vi6;go1Cti1;pi3ul0;orpo1Area5;po5;arrowi1ea2orrif17umilia0;lAr6;a0ipWo7uel6;i1li1;undbrea6wi1;ki1;a3ea0W;aEetc0Pit0lBo9r7ulf6;il2;ee0Vigh6ust0Z;te01;r6un4;ebo4th0E;a7o6;a0we3;mi1tte3;di1scina0;m9n7x6;ac0ci0is0plo4;ab2c6du3ga01sQ;han0oura00;barras5erZpowe3;aHeAi6;s6zz0K;appoin0gus0sen0t6;r6u0L;ac0es5;biliBcAfiKgra4m9pres5ser8v6;asAelo6;pi1;vi1;an4eaG;a0BliF;ta0;maMri1sYun0;aMhJlo5o6ripp2ut0;mCn6rrespon4;cerAf9spi3t6vinO;in7r6;as0ibu0ol2;ui1;lic0u5;ni1;fAm9p6;e7ro6;mi5;l2ti1;an4;or0;a6ea0il2;llen6rO;gi1;lMptiva0;e9in4lin4o7rui5u6;d4st2;i2oJri1un6;ci1;coH;bsoOcJgonHlarGmEppea2rCs6;pi3su3to6;n7un4;di1;is6;hi1;ri1;res0;li1;a9u5;si1;mi1;i6zi1;zi1;c6hi1;ele7ompan6;yi1;ra0;ti1;rbi1;ng",
    "Adj|Past": "true¦0:2T;1:2K;2:2N;3:23;a2Db28c1Qd1Ae14f0Zgift0h0Wi0Pj0Oknown,l0Lm0Gn0Eo0Bp04qua03rUsEtAu8v6w4;arp0ea4or6;kIth2N;a4e0V;ri0;ni4pd1s0;fi0t0;ar6hreatDr4wi2M;a4ou18;ck0in0pp0;get0ni1K;aHcaGeFhEimDm01oak0pBt7u4;bsid23gge2Hs4;pe4ta1O;ct0nd0;at0e6r4uV;ength4ip0;en0;am0reotyp0;eci4ik0ott0;al1Vfi0;pIul1;ar0ut;al0c1Fle2t1N;r0tt21;t4ut0;is3ur1;aBe4;c8duc0f19g7l1new0qu6s4;pe2t4;or0ri2;e1Yir0;ist1Tul1;eiv0o4;mme0Ard0v1R;lli0ti3;li3;arallel0l8o7r4ump0;e5o4;c0Ilo0Hnou1Ppos0te2;fe0Koc9pZ;i1Cli0P;a4e15;nn0;c5rgan17verlo4;ok0;cupi0;e4ot0;ed0gle2;a6e5ix0o4;di3t0E;as0Nlt0;n4rk0;ag0ufact0L;eft,i5o4;ad0st;cens0mit0st0;agg0us0K;mp9n4sol1;br0debt0f7t4volv0;e4ox0C;gr1n4re14;d0si3;e2oW;li0oMrov0;amm0We1o4;ok0r4;ri3;aNe7i6lavo06ocus0r4;a4i0;ct04g0Im0;niVx0;ar0;duc1n8quipp0stabliTx4;p4te6;a5e4;ct0rie0O;nd0;ha0MsW;aIeAi4;gni3miniMre2s4;a7c6grun01t4;o4rBurb0;rt0;iplPou05;bl0;cenTdMf8lay0pr7ra6t4velop0;a4ermM;il0;ng0;ess0;e5o4;rm0;rr0;mag0t0;alcul1eHharg0lGo9r6u4;lt4stomR;iv1;a5owd0u4;sh0;ck0mp0;d0lo9m6n4ok0vW;centr1s4troll0;idUolid1;b5pl4;ic1;in0;ur0;assi3os0;lebr1n6r4;ti3;fi0;tralB;a7i6o4urn0;il0r0t4und;tl0;as0;laJs0;bandon0cKdHffe2lEnCppAss8u4ward0;g5thor4;iz0;me4;nt0;o6u4;m0r0;li0re4;ci1;im1ticip1;at0;leg0t4;er0;ct0;ju5o7va4;nc0;st0;ce4knowledg0;pt0;ed",
    "Person|Verb": "true¦b2ch1drew,grant,ja3ma0ollie,pat,rob,sue,wade;ck,rk;ase,u1;ob,u0;ck",
    "Person|Place": "true¦a5darw6h3jordan,k2orlando,s0victo7;a0ydney;lvador,mara,ntiago;ent,obe;amil0ous0;ton;lexand1ust0;in;ria",
    "Person|Date": "true¦a2j0sep;an0une;!uary;p0ugust,v0;ril"
  };

  const BASE = 36;
  const seq = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  const cache = seq.split('').reduce(function (h, c, i) {
    h[c] = i;
    return h
  }, {});

  // 0, 1, 2, ..., A, B, C, ..., 00, 01, ... AA, AB, AC, ..., AAA, AAB, ...
  const toAlphaCode = function (n) {
    if (seq[n] !== undefined) {
      return seq[n]
    }
    let places = 1;
    let range = BASE;
    let s = '';
    for (; n >= range; n -= range, places++, range *= BASE) {}
    while (places--) {
      const d = n % BASE;
      s = String.fromCharCode((d < 10 ? 48 : 55) + d) + s;
      n = (n - d) / BASE;
    }
    return s
  };

  const fromAlphaCode = function (s) {
    if (cache[s] !== undefined) {
      return cache[s]
    }
    let n = 0;
    let places = 1;
    let range = BASE;
    let pow = 1;
    for (; places < s.length; n += range, places++, range *= BASE) {}
    for (let i = s.length - 1; i >= 0; i--, pow *= BASE) {
      let d = s.charCodeAt(i) - 48;
      if (d > 10) {
        d -= 7;
      }
      n += d * pow;
    }
    return n
  };

  var encoding = {
    toAlphaCode,
    fromAlphaCode
  };

  const symbols = function (t) {
    //... process these lines
    const reSymbol = new RegExp('([0-9A-Z]+):([0-9A-Z]+)');
    for (let i = 0; i < t.nodes.length; i++) {
      const m = reSymbol.exec(t.nodes[i]);
      if (!m) {
        t.symCount = i;
        break
      }
      t.syms[encoding.fromAlphaCode(m[1])] = encoding.fromAlphaCode(m[2]);
    }
    //remove from main node list
    t.nodes = t.nodes.slice(t.symCount, t.nodes.length);
  };
  var parseSymbols = symbols;

  // References are either absolute (symbol) or relative (1 - based)
  const indexFromRef = function (trie, ref, index) {
    const dnode = encoding.fromAlphaCode(ref);
    if (dnode < trie.symCount) {
      return trie.syms[dnode]
    }
    return index + dnode + 1 - trie.symCount
  };

  const toArray$3 = function (trie) {
    const all = [];
    const crawl = (index, pref) => {
      let node = trie.nodes[index];
      if (node[0] === '!') {
        all.push(pref);
        node = node.slice(1); //ok, we tried. remove it.
      }
      const matches = node.split(/([A-Z0-9,]+)/g);
      for (let i = 0; i < matches.length; i += 2) {
        const str = matches[i];
        const ref = matches[i + 1];
        if (!str) {
          continue
        }
        const have = pref + str;
        //branch's end
        if (ref === ',' || ref === undefined) {
          all.push(have);
          continue
        }
        const newIndex = indexFromRef(trie, ref, index);
        crawl(newIndex, have);
      }
    };
    crawl(0, '');
    return all
  };

  //PackedTrie - Trie traversal of the Trie packed-string representation.
  const unpack$2 = function (str) {
    const trie = {
      nodes: str.split(';'),
      syms: [],
      symCount: 0
    };
    //process symbols, if they have them
    if (str.match(':')) {
      parseSymbols(trie);
    }
    return toArray$3(trie)
  };

  var traverse = unpack$2;

  const unpack = function (str) {
    if (!str) {
      return {}
    }
    //turn the weird string into a key-value object again
    const obj = str.split('|').reduce((h, s) => {
      const arr = s.split('¦');
      h[arr[0]] = arr[1];
      return h
    }, {});
    const all = {};
    Object.keys(obj).forEach(function (cat) {
      const arr = traverse(obj[cat]);
      //special case, for botched-boolean
      if (cat === 'true') {
        cat = true;
      }
      for (let i = 0; i < arr.length; i++) {
        const k = arr[i];
        if (all.hasOwnProperty(k) === true) {
          if (Array.isArray(all[k]) === false) {
            all[k] = [all[k], cat];
          } else {
            all[k].push(cat);
          }
        } else {
          all[k] = cat;
        }
      }
    });
    return all
  };

  var unpack$1 = unpack;

  //words that can't be compressed, for whatever reason
  let misc$6 = {
    // numbers
    '20th century fox': 'Organization',
    '7 eleven': 'Organization',
    'motel 6': 'Organization',
    g8: 'Organization',
    vh1: 'Organization',

    'km2': 'Unit',
    'm2': 'Unit',
    'dm2': 'Unit',
    'cm2': 'Unit',
    'mm2': 'Unit',
    'mile2': 'Unit',
    'in2': 'Unit',
    'yd2': 'Unit',
    'ft2': 'Unit',
    'm3': 'Unit',
    'dm3': 'Unit',
    'cm3': 'Unit',
    'in3': 'Unit',
    'ft3': 'Unit',
    'yd3': 'Unit',


    // ampersands
    'at&t': 'Organization',
    'black & decker': 'Organization',
    'h & m': 'Organization',
    'johnson & johnson': 'Organization',
    'procter & gamble': 'Organization',
    "ben & jerry's": 'Organization',
    '&': 'Conjunction',

    //pronouns
    i: ['Pronoun', 'Singular'],
    he: ['Pronoun', 'Singular'],
    she: ['Pronoun', 'Singular'],
    it: ['Pronoun', 'Singular'],
    they: ['Pronoun', 'Plural'],
    we: ['Pronoun', 'Plural'],
    was: ['Copula', 'PastTense'],
    is: ['Copula', 'PresentTense'],
    are: ['Copula', 'PresentTense'],
    am: ['Copula', 'PresentTense'],
    were: ['Copula', 'PastTense'],
    her: ['Possessive', 'Pronoun'],
    his: ['Possessive', 'Pronoun'],
    hers: ['Possessive', 'Pronoun'],
    their: ['Possessive', 'Pronoun'],
    themselves: ['Possessive', 'Pronoun'],
    your: ['Possessive', 'Pronoun'],
    our: ['Possessive', 'Pronoun'],
    my: ['Possessive', 'Pronoun'],
    its: ['Possessive', 'Pronoun'],

    // misc
    vs: ['Conjunction', 'Abbreviation'],
    if: ['Condition', 'Preposition'],
    closer: 'Comparative',
    closest: 'Superlative',
    much: 'Adverb',
    may: 'Modal',


    // irregular conjugations with two forms
    babysat: 'PastTense',
    blew: 'PastTense',
    drank: 'PastTense',
    drove: 'PastTense',
    forgave: 'PastTense',
    skiied: 'PastTense',
    spilt: 'PastTense',
    stung: 'PastTense',
    swam: 'PastTense',
    swung: 'PastTense',
    guaranteed: 'PastTense',
    shrunk: 'PastTense',

    no: ['Negative', 'Expression']
  };
  var misc$7 = misc$6;

  //just some of the most common emoticons
  //faster than
  //http://stackoverflow.com/questions/28077049/regex-matching-emoticons
  var emoticons = [
    ':(',
    ':)',
    ':P',
    ':p',
    ':O',
    ';(',
    ';)',
    ';P',
    ';p',
    ';O',
    ':3',
    ':|',
    ':/',
    ':\\',
    ':$',
    ':*',
    ':@',
    ':-(',
    ':-)',
    ':-P',
    ':-p',
    ':-O',
    ':-3',
    ':-|',
    ':-/',
    ':-\\',
    ':-$',
    ':-*',
    ':-@',
    ':^(',
    ':^)',
    ':^P',
    ':^p',
    ':^O',
    ':^3',
    ':^|',
    ':^/',
    ':^\\',
    ':^$',
    ':^*',
    ':^@',
    '):',
    '(:',
    '$:',
    '*:',
    ')-:',
    '(-:',
    '$-:',
    '*-:',
    ')^:',
    '(^:',
    '$^:',
    '*^:',
    '<3',
    '</3',
    '<\\3',
  ];

  /** patterns for turning 'bus' to 'buses'*/
  const suffixes$4 = {
    a: [
      [/(antenn|formul|nebul|vertebr|vit)a$/i, '$1ae'],
      [/([ti])a$/i, '$1a'],
    ],
    e: [
      [/(kn|l|w)ife$/i, '$1ives'],
      [/(hive)$/i, '$1s'],
      [/([m|l])ouse$/i, '$1ice'],
      [/([m|l])ice$/i, '$1ice'],
    ],
    f: [
      [/^(dwar|handkerchie|hoo|scar|whar)f$/i, '$1ves'],
      [/^((?:ca|e|ha|(?:our|them|your)?se|she|wo)l|lea|loa|shea|thie)f$/i, '$1ves'],
    ],
    i: [[/(octop|vir)i$/i, '$1i']],
    m: [[/([ti])um$/i, '$1a']],
    n: [[/^(oxen)$/i, '$1']],
    o: [[/(al|ad|at|er|et|ed)o$/i, '$1oes']],
    s: [
      [/(ax|test)is$/i, '$1es'],
      [/(alias|status)$/i, '$1es'],
      [/sis$/i, 'ses'],
      [/(bu)s$/i, '$1ses'],
      [/(sis)$/i, 'ses'],
      [/^(?!talis|.*hu)(.*)man$/i, '$1men'],
      [/(octop|vir|radi|nucle|fung|cact|stimul)us$/i, '$1i'],
    ],
    x: [
      [/(matr|vert|ind|cort)(ix|ex)$/i, '$1ices'],
      [/^(ox)$/i, '$1en'],
    ],
    y: [[/([^aeiouy]|qu)y$/i, '$1ies']],
    z: [[/(quiz)$/i, '$1zes']],
  };
  var rules$2 = suffixes$4;

  const addE = /([xsz]|ch|sh)$/;

  const trySuffix = function (str) {
    let c = str[str.length - 1];
    if (rules$2.hasOwnProperty(c) === true) {
      for (let i = 0; i < rules$2[c].length; i += 1) {
        let reg = rules$2[c][i][0];
        if (reg.test(str) === true) {
          return str.replace(reg, rules$2[c][i][1])
        }
      }
    }
    return null
  };
  /** Turn a singular noun into a plural
   * assume the given string is singular
   */
  const pluralize = function (str = '', model) {
    let { irregularPlurals, uncountable } = model.two;
    // is it a word without a plural form?
    if (uncountable.hasOwnProperty(str)) {
      return str
    }
    // check irregulars list
    if (irregularPlurals.hasOwnProperty(str)) {
      return irregularPlurals[str]
    }
    //we have some rules to try-out
    let plural = trySuffix(str);
    if (plural !== null) {
      return plural
    }
    //like 'church'
    if (addE.test(str)) {
      return str + 'es'
    }
    // ¯\_(ツ)_/¯
    return str + 's'
  };
  var nounToPlural = pluralize;

  // unpack our lexicon of words
  // (found in ./lexicon/)

  // more clever things are done on the data later
  //  - once the plugin is applied
  const hasSwitch = /\|/;
  let lexicon = misc$7;
  let switches$1 = {};

  const tmpModel$1 = { two: { irregularPlurals, uncountable: {} } };

  Object.keys(lexData).forEach(tag => {
    let wordsObj = unpack$1(lexData[tag]);
    // POS tag, or something fancier?
    if (!hasSwitch.test(tag)) {
      // set them as simple word key-value lookup
      Object.keys(wordsObj).forEach(w => {
        lexicon[w] = tag;
      });
      return
    }
    // add them as seperate key-val object
    Object.keys(wordsObj).forEach(w => {
      switches$1[w] = tag;
      // pluralize Noun|Verb switches
      if (tag === 'Noun|Verb') {
        let plural = nounToPlural(w, tmpModel$1);
        switches$1[plural] = 'Plural|Verb';
      }
    });
  });
  // add ':)'
  emoticons.forEach(str => lexicon[str] = 'Emoticon');

  // misc cleanup
  delete lexicon[''];
  delete lexicon[null];
  delete lexicon[' '];

  const jj = 'Adjective';

  var adj$1 = {
    beforeTags: {
      Determiner: jj, //the detailed
      // Copula: jj, //is detailed
      Possessive: jj, //spencer's detailed
    },

    afterTags: {
      // Noun: jj, //detailed plan, overwhelming evidence
      Adjective: jj, //intoxicated little
    },

    beforeWords: {
      seem: jj, //seem prepared
      seemed: jj,
      seems: jj,
      feel: jj, //feel prepared
      feels: jj,
      felt: jj,
      appear: jj,
      appears: jj,
      appeared: jj,
      also: jj,
      over: jj, //over cooked
      under: jj,
      too: jj, //too insulting
      it: jj, //find it insulting
      but: jj, //nothing but frustrating
      still: jj, //still scared
      // adverbs that are adjective-ish
      really: jj, //really damaged
      quite: jj,
      well: jj,
      very: jj,
      deeply: jj,
      // always: jj,
      // never: jj,
      profoundly: jj,
      extremely: jj,
      so: jj,
      badly: jj,
      mostly: jj,
      totally: jj,
      awfully: jj,
      rather: jj,
      nothing: jj, //nothing secret, 
      something: jj,//something wrong
      anything: jj,
      not: jj,//not swell
      me: jj,//called me swell
    },
    afterWords: {
      too: jj, //insulting too
      also: jj, //insulting too
      or: jj, //insulting or
    },
  };

  const g = 'Gerund';

  // Adj|Gerund
  // Noun|Gerund

  var gerund = {
    beforeTags: {
      // Verb: g, // loves shocking
      Adverb: g, //quickly shocking
      Preposition: g, //by insulting
      Conjunction: g, //to insulting
    },
    afterTags: {
      Adverb: g, //shocking quickly
      Possessive: g, //shocking spencer's
      Person: g, //telling spencer
      Pronoun: g, //shocking him
      Determiner: g, //shocking the
      Copula: g, //shocking is
      Preposition: g, //dashing by, swimming in
      Conjunction: g, //insulting to
      Comparative: g, //growing shorter
    },
    beforeWords: {
      been: g,
      keep: g,//keep going
      continue: g,//
      stop: g,//
      am: g,//am watching
      be: g,//be timing
      me: g,//got me thinking
      // action-words
      began: g,
      start: g,
      starts: g,
      started: g,
      stops: g,
      stopped: g,
      help: g,
      helps: g,
      avoid: g,
      avoids: g,
      love: g,//love painting
      loves: g,
      loved: g,
      hate: g,
      hates: g,
      hated: g,
      // was:g,//was working
      // is:g,
      // be:g,
    },
    afterWords: {
      you: g, //telling you
      me: g, //
      her: g, //
      him: g, //
      them: g, //
      their: g, // fighting their
      it: g, //dumping it
      this: g, //running this
      there: g, // swimming there
      on: g, // landing on
      about: g, // talking about
      for: g, // paying for
    },
  };

  // rallying the troops
  // her rallying cry
  const clue$6 = {
    beforeTags: Object.assign({}, adj$1.beforeTags, gerund.beforeTags, {
      // Copula: 'Adjective', 
      Imperative: 'Gerund',//recommend living in
      Infinitive: 'Adjective',//say charming things
      PresentTense: 'Gerund',
      Plural: 'Gerund'//kids cutting
    }),

    afterTags: Object.assign({}, adj$1.afterTags, gerund.afterTags, {
      Singular: 'Adjective'//shocking ignorance
    }),

    beforeWords: Object.assign({}, adj$1.beforeWords, gerund.beforeWords, {
      is: 'Adjective',
      was: 'Adjective',
      suggest: 'Gerund',
      recommend: 'Gerund',
    }),

    afterWords: Object.assign({}, adj$1.afterWords, gerund.afterWords, {
      to: 'Gerund',
      not: 'Gerund',//trying not to car
      the: 'Gerund' //sweeping the country
    }),
  };
  // console.log(clue)
  var adjGerund$1 = clue$6;

  const n = 'Singular';
  var noun$1 = {
    beforeTags: {
      Determiner: n, //the date
      Possessive: n, //his date
      Acronym: n,//u.s. state
      // ProperNoun:n,
      Noun: n, //nasa funding
      Adjective: n, //whole bottles
      // Verb:true, //save storm victims
      PresentTense: n, //loves hiking
      Gerund: n, //uplifting victims
      PastTense: n, //saved storm victims
      Infinitive: n, //profess love
      Date: n,//9pm show
    },
    afterTags: {
      Value: n, //date nine  -?
      Modal: n, //date would
      Copula: n, //fear is
      PresentTense: n, //babysitting sucks
      PastTense: n, //babysitting sucked
      // Noun:n, //talking therapy, planning process
      Demonym: n//american touch
    },
    // ownTags: { ProperNoun: n },
    beforeWords: {
      the: n,//the brands
      with: n,//with cakes
      without: n,//
      // was:n, //was time  -- was working
      // is:n, //
      of: n, //of power
      for: n, //for rats
      any: n, //any rats
      all: n, //all tips
      on: n, //on time
      // thing-ish verbs
      cut: n,//cut spending
      cuts: n,//cut spending
      save: n,//
      saved: n,//
      saves: n,//
      make: n,//
      makes: n,//
      made: n,//
      minus: n,//minus laughing
      plus: n,//
      than: n,//more than age
      another: n,//
      versus: n,//
      neither: n,//
      // strong adjectives
      favorite: n,//
      best: n,//
      daily: n,//
      weekly: n,//
      linear: n,//
      binary: n,//
      mobile: n,//
      lexical: n,//
      technical: n,//
      computer: n,//
      scientific: n,//
      formal: n
    },
    afterWords: {
      of: n, //date of birth (preposition)
      system: n,
      aid: n,
      method: n,
      utility: n,
      tool: n,
      reform: n,
      therapy: n,
      philosophy: n,
      room: n,
      authority: n,
      says: n,
      said: n,
      wants: n,
      wanted: n,
    },
  };

  // the commercial market
  // watching the commercial

  const misc$5 = {
    beforeTags: {
      Determiner: undefined, //the premier university
      Cardinal: 'Noun'//1950 convertable
    }
  };
  const clue$5 = {
    beforeTags: Object.assign({}, adj$1.beforeTags, noun$1.beforeTags, misc$5.beforeTags),
    afterTags: Object.assign({}, adj$1.afterTags, noun$1.afterTags),
    beforeWords: Object.assign({}, adj$1.beforeWords, noun$1.beforeWords, {
      // are representative
      are: 'Adjective', is: 'Adjective', was: 'Adjective', be: 'Adjective',
    }),
    afterWords: Object.assign({}, adj$1.afterWords, noun$1.afterWords),
  };
  var adjNoun = clue$5;

  // the boiled egg
  // boiled the water

  const past$1 = {
    beforeTags: {
      Adverb: 'PastTense', //quickly detailed
      Pronoun: 'PastTense', //he detailed
      ProperNoun: 'PastTense', //toronto closed
      Auxiliary: 'PastTense',
      Noun: 'PastTense', //eye closed  -- i guess.
    },
    afterTags: {
      Possessive: 'PastTense', //hooked him
      Pronoun: 'PastTense', //hooked me
      Determiner: 'PastTense', //hooked the
      Adverb: 'PastTense', //cooked perfectly
      Comparative: 'PastTense',//closed higher
      Date: 'PastTense',// alleged thursday
    },
    beforeWords: {
      be: 'PastTense',//be hooked
      get: 'PastTense',//get charged
      had: 'PastTense',
      has: 'PastTense',
      have: 'PastTense',
      been: 'PastTense',
      it: 'PastTense',//it intoxicated him
      as: 'PastTense',//as requested
      for: 'Adjective',//for discounted items
    },
    afterWords: {
      by: 'PastTense', //damaged by
      back: 'PastTense', //charged back
      out: 'PastTense', //charged out
      in: 'PastTense', //crowded in
      up: 'PastTense', //heated up
      down: 'PastTense', //hammered down
      for: 'PastTense', //settled for
      the: 'PastTense', //settled the
      with: 'PastTense', //obsessed with
      as: 'PastTense', //known as
      on: 'PastTense', //focused on
    },
  };

  var adjPast = {
    beforeTags: Object.assign({}, adj$1.beforeTags, past$1.beforeTags),
    afterTags: Object.assign({}, adj$1.afterTags, past$1.afterTags),
    beforeWords: Object.assign({}, adj$1.beforeWords, past$1.beforeWords),
    afterWords: Object.assign({}, adj$1.afterWords, past$1.afterWords),
  };

  const v = 'Infinitive';

  var verb = {
    beforeTags: {
      Modal: v, //would date
      Adverb: v, //quickly date
      Negative: v, //not date
      Plural: v, //characters drink
      // ProperNoun: vb,//google thought
    },
    afterTags: {
      Determiner: v, //flash the
      Adverb: v, //date quickly
      Possessive: v, //date his
      // Noun:true, //date spencer
      Preposition: v, //date around, dump onto, grumble about
      // Conjunction: v, // dip to, dip through
    },
    beforeWords: {
      i: v, //i date
      we: v, //we date
      you: v, //you date
      they: v, //they date
      to: v, //to date
      please: v, //please check
      will: v, //will check
      have: v,
      had: v,
      would: v,
      could: v,
      should: v,
      do: v,
      did: v,
      does: v,
      can: v,
      must: v,
      us: v,
      me: v,
      // them: v,
      he: v,
      she: v,
      it: v,
      being: v,
    },
    afterWords: {
      the: v, //echo the
      me: v, //date me
      you: v, //date you
      him: v, //loves him
      her: v, //
      them: v, //
      it: v, //hope it
      a: v, //covers a
      an: v, //covers an
      // from: v, //ranges from
      up: v,//serves up
      down: v,//serves up
      by: v,
      // in: v, //bob in
      out: v,
      // on: v,
      off: v,
      under: v,
      when: v,//starts when
      // for:true, //settled for
      all: v,//shiver all night
      // conjunctions
      to: v,//dip to
      because: v,//
      although: v,//
      before: v,//
      how: v,//
      otherwise: v,//
      together: v,//fit together
      though: v,//
      yet: v,//
    },
  };

  // 'would mean' vs 'is mean'
  const misc$4 = {
    afterTags: {
      Noun: 'Adjective',//ruling party
      Conjunction: undefined //clean and excellent
    }
  };
  const clue$4 = {
    beforeTags: Object.assign({}, adj$1.beforeTags, verb.beforeTags, {
      // always clean
      Adverb: undefined, Negative: undefined
    }),
    afterTags: Object.assign({}, adj$1.afterTags, verb.afterTags, misc$4.afterTags),
    beforeWords: Object.assign({}, adj$1.beforeWords, verb.beforeWords, {
      // have seperate contracts
      have: undefined, had: undefined, not: undefined,
      //went wrong, got wrong
      went: 'Adjective', goes: 'Adjective', got: 'Adjective',
      // be sure
      be: 'Adjective'
    }),
    afterWords: Object.assign({}, adj$1.afterWords, verb.afterWords, {
      to: undefined//slick to the touch
    }),
  };
  // console.log(clue.beforeWords)
  // console.log(clue)
  var adjPresent = clue$4;

  // 'operating the crane', or 'operating room'
  const misc$3 = {
    beforeTags: {
      Copula: 'Gerund', PastTense: 'Gerund', PresentTense: 'Gerund', Infinitive: 'Gerund'
    },
    afterTags: {},
    beforeWords: {
      are: 'Gerund', were: 'Gerund', be: 'Gerund', no: 'Gerund', without: 'Gerund',
      //are you playing
      you: 'Gerund', we: 'Gerund', they: 'Gerund', he: 'Gerund', she: 'Gerund',
      //stop us playing
      us: 'Gerund', them: 'Gerund'
    },
    afterWords: {
      // offering the
      the: 'Gerund', this: 'Gerund', that: 'Gerund',
      //got me thinking
      me: 'Gerund', us: 'Gerund', them: 'Gerund',
    },
  };
  const clue$3 = {
    beforeTags: Object.assign({}, gerund.beforeTags, noun$1.beforeTags, misc$3.beforeTags),
    afterTags: Object.assign({}, gerund.afterTags, noun$1.afterTags, misc$3.afterTags),
    beforeWords: Object.assign({}, gerund.beforeWords, noun$1.beforeWords, misc$3.beforeWords),
    afterWords: Object.assign({}, gerund.afterWords, noun$1.afterWords, misc$3.afterWords),
  };
  var nounGerund = clue$3;

  // 'boot the ball'   -  'the red boot'
  // 'boots the ball'  -   'the red boots'
  const clue$2 = {
    beforeTags: Object.assign({}, verb.beforeTags, noun$1.beforeTags, {
      // Noun: undefined
      Adjective: 'Singular',//great name
    }),
    afterTags: Object.assign({}, verb.afterTags, noun$1.afterTags, {
      ProperNoun: 'Infinitive', Gerund: 'Infinitive', Adjective: 'Infinitive',
      Copula: 'Singular',
    }),
    beforeWords: Object.assign({}, verb.beforeWords, noun$1.beforeWords, {
      // is time
      is: 'Singular', was: 'Singular',
      //balance of power
      of: 'Singular'
    }),
    afterWords: Object.assign({}, verb.afterWords, noun$1.afterWords, {
      // for: 'Infinitive',//work for
      instead: 'Infinitive',
      // that: 'Singular',//subject that was
      // for: 'Infinitive',//work for
      about: 'Infinitive',//talk about
      to: null,
      by: null,
      in: null
    }),
  };
  // console.log(clue.afterWords.of)
  var nounVerb = clue$2;

  const p = 'Person';

  var person$1 = {
    beforeTags: {
      Honorific: p,
      Person: p,
      Preposition: p, //with sue
    },
    afterTags: {
      Person: p,
      ProperNoun: p,
      Verb: p, //bob could
      // Modal:true, //bob could
      // Copula:true, //bob is
      // PresentTense:true, //bob seems
    },
    ownTags: {
      ProperNoun: p, //capital letter
    },
    beforeWords: {
      hi: p,
      hey: p,
      yo: p,
      dear: p,
      hello: p,
    },
    afterWords: {
      // person-usually verbs
      said: p,
      says: p,
      told: p,
      tells: p,
      feels: p,
      felt: p,
      seems: p,
      thinks: p,
      thought: p,
      spends: p,
      spendt: p,
      plays: p,
      played: p,
      sing: p,
      sang: p,
      learn: p,
      learned: p,
      wants: p,
      wanted: p
      // and:true, //sue and jeff
    },
  };

  // 'april o'neil'  -  'april 1st'

  const m$1 = 'Month';
  const month = {
    beforeTags: {
      Date: m$1,
      Value: m$1,
    },
    afterTags: {
      Date: m$1,
      Value: m$1,
    },
    beforeWords: {
      by: m$1,
      in: m$1,
      on: m$1,
      during: m$1,
      after: m$1,
      before: m$1,
      between: m$1,
      until: m$1,
      til: m$1,
      sometime: m$1,
      of: m$1, //5th of april
      this: m$1, //this april
      next: m$1,
      last: m$1,
      previous: m$1,
      following: m$1,
    },
    afterWords: {
      sometime: m$1,
      in: m$1,
      of: m$1,
      until: m$1,
      the: m$1, //june the 4th
    },
  };
  var personDate = {
    beforeTags: Object.assign({}, person$1.beforeTags, month.beforeTags),
    afterTags: Object.assign({}, person$1.afterTags, month.afterTags),
    beforeWords: Object.assign({}, person$1.beforeWords, month.beforeWords),
    afterWords: Object.assign({}, person$1.afterWords, month.afterWords),
  };

  // 'babling brook' vs 'brook sheilds'

  const clue$1 = {
    beforeTags: Object.assign({}, noun$1.beforeTags, person$1.beforeTags),
    afterTags: Object.assign({}, noun$1.afterTags, person$1.afterTags),
    beforeWords: Object.assign({}, noun$1.beforeWords, person$1.beforeWords, { i: 'Infinitive', we: 'Infinitive' }),
    afterWords: Object.assign({}, noun$1.afterWords, person$1.afterWords),
  };
  var personNoun = clue$1;

  // 'rob the store'   -  'rob lowe'
  const clues$3 = {
    beforeTags: Object.assign({}, person$1.beforeTags, verb.beforeTags),
    afterTags: Object.assign({}, person$1.afterTags, verb.afterTags),
    beforeWords: Object.assign({}, person$1.beforeWords, verb.beforeWords),
    afterWords: Object.assign({}, person$1.afterWords, verb.afterWords),
  };
  var personVerb = clues$3;

  // 'paris hilton' vs 'paris france'
  const place = {
    beforeTags: {
      Place: 'Place'
    },
    afterTags: {
      Place: 'Place',
      Abbreviation: 'Place'
    },
    beforeWords: {
      in: 'Place',
      by: 'Place',
      near: 'Place',
      from: 'Place',
      to: 'Place',
    },
    afterWords: {
      in: 'Place',
      by: 'Place',
      near: 'Place',
      from: 'Place',
      to: 'Place',
      government: 'Place',
      council: 'Place',
      region: 'Place',
      city: 'Place',
    },
  };

  const clue = {
    beforeTags: Object.assign({}, place.beforeTags, person$1.beforeTags),
    afterTags: Object.assign({}, place.afterTags, person$1.afterTags),
    beforeWords: Object.assign({}, place.beforeWords, person$1.beforeWords),
    afterWords: Object.assign({}, place.afterWords, person$1.afterWords),
  };
  var personPlace = clue;

  // '5 oz'   -  'dr oz'
  let un = 'Unit';
  const clues$2 = {
    beforeTags: { Value: un },
    afterTags: {},
    beforeWords: {
      per: un,
      every: un,
      each: un,
      square: un, //square km
      cubic: un,
      sq: un,
      metric: un //metric ton
    },
    afterWords: {
      per: un,
      squared: un,
      cubed: un,
      long: un //foot long
    },
  };
  var unitNoun = clues$2;

  const clues = {
    'Adj|Gerund': adjGerund$1,
    'Adj|Noun': adjNoun,
    'Adj|Past': adjPast,
    'Adj|Present': adjPresent,
    'Noun|Verb': nounVerb,
    'Noun|Gerund': nounGerund,
    'Person|Noun': personNoun,
    'Person|Date': personDate,
    'Person|Verb': personVerb,
    'Person|Place': personPlace,
    'Unit|Noun': unitNoun,
  };

  const copy = (obj, more) => {
    let res = Object.keys(obj).reduce((h, k) => {
      h[k] = obj[k] === 'Infinitive' ? 'PresentTense' : 'Plural';
      return h
    }, {});
    return Object.assign(res, more)
  };

  // make a copy of this one
  clues['Plural|Verb'] = {
    beforeWords: copy(clues['Noun|Verb'].beforeWords, {

    }),
    afterWords: copy(clues['Noun|Verb'].afterWords, {
      his: 'PresentTense', her: 'PresentTense', its: 'PresentTense',
      in: null, to: null,
    }),
    beforeTags: copy(clues['Noun|Verb'].beforeTags, {
      Conjunction: 'PresentTense', //and changes
      Noun: undefined, //the century demands
      ProperNoun: 'PresentTense'//john plays
    }),
    afterTags: copy(clues['Noun|Verb'].afterTags, {
      Gerund: 'Plural',//ice caps disappearing
      Noun: 'PresentTense', //changes gears
      Value: 'PresentTense' //changes seven gears
    }),
  };
  // add some custom plural clues
  var clues$1 = clues;

  //just a foolish lookup of known suffixes
  const Adj$2 = 'Adjective';
  const Inf$1 = 'Infinitive';
  const Pres$1 = 'PresentTense';
  const Sing$1 = 'Singular';
  const Past$1 = 'PastTense';
  const Avb = 'Adverb';
  const Plrl = 'Plural';
  const Actor$1 = 'Actor';
  const Vb = 'Verb';
  const Noun$2 = 'Noun';
  const Last$1 = 'LastName';
  const Modal = 'Modal';
  const Place = 'Place';
  const Prt = 'Participle';

  var suffixPatterns = [
    null,
    null,
    {
      //2-letter
      ea: Sing$1,
      ia: Noun$2,
      ic: Adj$2,
      ly: Avb,
      "'n": Vb,
      "'t": Vb,
    },
    {
      //3-letter
      oed: Past$1,
      ued: Past$1,
      xed: Past$1,
      ' so': Avb,
      "'ll": Modal,
      "'re": 'Copula',
      azy: Adj$2,
      eer: Noun$2,
      end: Vb,
      ped: Past$1,
      ffy: Adj$2,
      ify: Inf$1,
      ing: 'Gerund',
      ize: Inf$1,
      ibe: Inf$1,
      lar: Adj$2,
      mum: Adj$2,
      nes: Pres$1,
      nny: Adj$2,
      // oid: Adj,
      ous: Adj$2,
      que: Adj$2,
      rol: Sing$1,
      sis: Sing$1,
      ogy: Sing$1,
      oid: Sing$1,
      ian: Sing$1,
      zes: Pres$1,
      eld: Past$1,
      ken: Prt,//awoken
      ven: Prt,//woven
      ten: Prt,//brighten
      ect: Inf$1,
      ict: Inf$1,
      // ide: Inf,
      ign: Inf$1,
      ful: Adj$2,
      bal: Adj$2,
    },
    {
      //4-letter
      amed: Past$1,
      aped: Past$1,
      ched: Past$1,
      lked: Past$1,
      rked: Past$1,
      reed: Past$1,
      nded: Past$1,
      mned: Adj$2,
      cted: Past$1,
      dged: Past$1,
      ield: Sing$1,
      akis: Last$1,
      cede: Inf$1,
      chuk: Last$1,
      czyk: Last$1,
      ects: Pres$1,
      ends: Vb,
      enko: Last$1,
      ette: Sing$1,
      wner: Sing$1,//owner
      fies: Pres$1,
      fore: Avb,
      gate: Inf$1,
      gone: Adj$2,
      ices: Plrl,
      ints: Plrl,
      ruct: Inf$1,
      ines: Plrl,
      ions: Plrl,
      less: Adj$2,
      llen: Adj$2,
      made: Adj$2,
      nsen: Last$1,
      oses: Pres$1,
      ould: Modal,
      some: Adj$2,
      sson: Last$1,
      // tage: Inf,
      tion: Sing$1,
      tage: Noun$2,
      ique: Sing$1,
      tive: Adj$2,
      tors: Noun$2,
      vice: Sing$1,
      lier: Sing$1,
      fier: Sing$1,
      wned: Past$1,
      gent: Sing$1,
      tist: Sing$1,
      pist: Sing$1,
      rist: Sing$1,
      mist: Sing$1,
      yist: Sing$1,
      vist: Sing$1,
      lite: Sing$1,
      site: Sing$1,
      rite: Sing$1,
      mite: Sing$1,
      bite: Sing$1,
      mate: Sing$1,
      date: Sing$1,
      ndal: Sing$1,
      vent: Sing$1,
      uist: Sing$1,
      gist: Sing$1,
      note: Sing$1,
      cide: Sing$1,//homicide
      wide: Adj$2,//nationwide
      // side: Adj,//alongside
      vide: Inf$1,//provide
      ract: Inf$1,
      duce: Inf$1,
      pose: Inf$1,
      eive: Inf$1,
      lyze: Inf$1,
      lyse: Inf$1,
      iant: Adj$2,
      nary: Adj$2,
    },
    {
      //5-letter
      elist: Sing$1,
      holic: Sing$1,
      phite: Sing$1,
      tized: Past$1,
      urned: Past$1,
      eased: Past$1,
      ances: Plrl,
      bound: Adj$2,
      ettes: Plrl,
      fully: Avb,
      ishes: Pres$1,
      ities: Plrl,
      marek: Last$1,
      nssen: Last$1,
      ology: Noun$2,
      osome: Sing$1,
      tment: Sing$1,
      ports: Plrl,
      rough: Adj$2,
      tches: Pres$1,
      tieth: 'Ordinal',
      tures: Plrl,
      wards: Avb,
      where: Avb,
      archy: Noun$2,
      pathy: Noun$2,
      opoly: Noun$2,
      embly: Noun$2,
      phate: Noun$2,
      ndent: Sing$1,
      scent: Sing$1,
      onist: Sing$1,
      anist: Sing$1,
      alist: Sing$1,
      olist: Sing$1,
      icist: Sing$1,
      ounce: Inf$1,
      iable: Adj$2,
      borne: Adj$2,
      gnant: Adj$2,
      inant: Adj$2,
      igent: Adj$2,
      atory: Adj$2,
      // ctory: Adj,
      rient: Sing$1,
      dient: Sing$1,
    },
    {
      //6-letter
      auskas: Last$1,
      parent: Sing$1,
      cedent: Sing$1,
      ionary: Sing$1,
      cklist: Sing$1,
      keeper: Actor$1,
      logist: Actor$1,
      teenth: 'Value',
    },
    {
      //7-letter
      opoulos: Last$1,
      borough: Place,
      sdottir: Last$1, //swedish female
    },
  ];

  //prefixes give very-little away, in general.
  // more-often for scientific terms, etc.
  const Adj$1 = 'Adjective';
  const Noun$1 = 'Noun';
  const Verb$1 = 'Verb';

  var prefixPatterns = [
    null,
    null,
    {
      // 2-letter
    },
    {
      // 3-letter
      neo: Noun$1,
      bio: Noun$1,
      // pre: Noun,
      'de-': Verb$1,
      're-': Verb$1,
      'un-': Verb$1,
    },
    {
      // 4-letter
      anti: Noun$1,
      auto: Noun$1,
      faux: Adj$1,
      hexa: Noun$1,
      kilo: Noun$1,
      mono: Noun$1,
      nano: Noun$1,
      octa: Noun$1,
      poly: Noun$1,
      semi: Adj$1,
      tele: Noun$1,
      'pro-': Adj$1,
      'mis-': Verb$1,
      'dis-': Verb$1,
      'pre-': Adj$1, //hmm
    },
    {
      // 5-letter
      anglo: Noun$1,
      centi: Noun$1,
      ethno: Noun$1,
      ferro: Noun$1,
      grand: Noun$1,
      hepta: Noun$1,
      hydro: Noun$1,
      intro: Noun$1,
      macro: Noun$1,
      micro: Noun$1,
      milli: Noun$1,
      nitro: Noun$1,
      penta: Noun$1,
      quasi: Adj$1,
      radio: Noun$1,
      tetra: Noun$1,
      'omni-': Adj$1,
      'post-': Adj$1,
    },
    {
      // 6-letter
      pseudo: Adj$1,
      'extra-': Adj$1,
      'hyper-': Adj$1,
      'inter-': Adj$1,
      'intra-': Adj$1,
      'deca-': Adj$1,
      // 'trans-': Noun,
    },
    {
      // 7-letter
      electro: Noun$1,
    },
  ];

  //regex suffix patterns and their most common parts of speech,
  //built using wordnet, by spencer kelly.
  //this mapping shrinks-down the uglified build
  const Adj = 'Adjective';
  const Inf = 'Infinitive';
  const Pres = 'PresentTense';
  const Sing = 'Singular';
  const Past = 'PastTense';
  const Adverb = 'Adverb';
  const Exp = 'Expression';
  const Actor = 'Actor';
  const Verb = 'Verb';
  const Noun = 'Noun';
  const Last = 'LastName';

  var endsWith = {
    a: [
      [/.[aeiou]na$/, Noun, 'tuna'],
      [/.[oau][wvl]ska$/, Last],
      [/.[^aeiou]ica$/, Sing, 'harmonica'],
      [/^([hyj]a+)+$/, Exp, 'haha'], //hahah
    ],
    c: [[/.[^aeiou]ic$/, Adj]],
    d: [
      //==-ed==
      //double-consonant
      [/[aeiou](pp|ll|ss|ff|gg|tt|rr|bb|nn|mm)ed$/, Past, 'popped'],
      //double-vowel
      [/.[aeo]{2}[bdgmnprvz]ed$/, Past, 'rammed'],
      //-hed
      [/.[aeiou][sg]hed$/, Past, 'gushed'],
      //-rd
      [/.[aeiou]red$/, Past, 'hired'],
      [/.[aeiou]r?ried$/, Past, 'hurried'],
      // ard
      [/[^aeiou]ard$/, Sing, 'steward'],
      // id
      [/[aeiou][^aeiou]id$/, Adj, ''],
      [/.[vrl]id$/, Adj, 'livid'],

      // ===== -ed ======
      //-led
      [/..led$/, Past, 'hurled'],
      //-sed
      [/.[iao]sed$/, Past, ''],
      [/[aeiou]n?[cs]ed$/, Past, ''],
      //-med
      [/[aeiou][rl]?[mnf]ed$/, Past, ''],
      //-ked
      [/[aeiou][ns]?c?ked$/, Past, 'bunked'],
      //-gned
      [/[aeiou]gned$/, Past],
      //-ged
      [/[aeiou][nl]?ged$/, Past],
      //-ted
      [/.[tdbwxyz]ed$/, Past],
      [/[^aeiou][aeiou][tvx]ed$/, Past],
      //-ied
      [/.[cdflmnprstv]ied$/, Past, 'emptied'],
    ],
    e: [
      [/.[lnr]ize$/, Inf, 'antagonize'],
      [/.[^aeiou]ise$/, Inf, 'antagonise'],
      [/.[aeiou]te$/, Inf, 'bite'],
      [/.[^aeiou][ai]ble$/, Adj, 'fixable'],
      [/.[^aeiou]eable$/, Adj, 'maleable'],
      [/.[ts]ive$/, Adj, 'festive'],
      [/[a-z]-like$/, Adj, 'woman-like'],
    ],
    h: [
      [/.[^aeiouf]ish$/, Adj, 'cornish'],
      [/.v[iy]ch$/, Last, '..ovich'],
      [/^ug?h+$/, Exp, 'ughh'],
      [/^uh[ -]?oh$/, Exp, 'uhoh'],
      [/[a-z]-ish$/, Adj, 'cartoon-ish'],
    ],
    i: [[/.[oau][wvl]ski$/, Last, 'polish-male']],
    k: [
      [/^(k){2}$/, Exp, 'kkkk'], //kkkk
    ],
    l: [
      [/.[gl]ial$/, Adj, 'familial'],
      [/.[^aeiou]ful$/, Adj, 'fitful'],
      [/.[nrtumcd]al$/, Adj, 'natal'],
      [/.[^aeiou][ei]al$/, Adj, 'familial'],
    ],
    m: [
      [/.[^aeiou]ium$/, Sing, 'magnesium'],
      [/[^aeiou]ism$/, Sing, 'schism'],
      [/^[hu]m+$/, Exp, 'hmm'],
      [/^\d+ ?[ap]m$/, 'Date', '3am'],
    ],
    n: [
      [/.[lsrnpb]ian$/, Adj, 'republican'],
      [/[^aeiou]ician$/, Actor, 'musician'],
      [/[aeiou][ktrp]in'$/, 'Gerund', "cookin'"], // 'cookin', 'hootin'
    ],
    o: [
      [/^no+$/, Exp, 'noooo'],
      [/^(yo)+$/, Exp, 'yoo'],
      [/^wo{2,}[pt]?$/, Exp, 'woop'], //woo
    ],
    r: [
      [/.[bdfklmst]ler$/, 'Noun'],
      [/[aeiou][pns]er$/, Sing],
      [/[^i]fer$/, Inf],
      [/.[^aeiou][ao]pher$/, Actor],
      [/.[lk]er$/, 'Noun'],
      [/.ier$/, 'Comparative'],
    ],
    t: [
      [/.[di]est$/, 'Superlative'],
      [/.[icldtgrv]ent$/, Adj],
      [/[aeiou].*ist$/, Adj],
      [/^[a-z]et$/, Verb],
    ],
    s: [
      [/.[^aeiou]ises$/, Pres],
      [/.[rln]ates$/, Pres],
      [/.[^z]ens$/, Verb],
      [/.[lstrn]us$/, Sing],
      [/.[aeiou]sks$/, Pres],
      [/.[aeiou]kes$/, Pres],
      [/[aeiou][^aeiou]is$/, Sing],
      [/[a-z]'s$/, Noun],
      [/^yes+$/, Exp], //yessss
    ],
    v: [
      [/.[^aeiou][ai][kln]ov$/, Last], //east-europe
    ],
    y: [
      [/.[cts]hy$/, Adj],
      [/.[st]ty$/, Adj],
      [/.[tnl]ary$/, Adj],
      [/.[oe]ry$/, Sing],
      [/[rdntkbhs]ly$/, Adverb],
      [/.(gg|bb|zz)ly$/, Adj],
      [/...lly$/, Adverb],
      [/.[gk]y$/, Adj],
      [/[bszmp]{2}y$/, Adj],
      [/.[ai]my$/, Adj],
      [/[ea]{2}zy$/, Adj],
      [/.[^aeiou]ity$/, Sing],
    ],
  };

  const vb = 'Verb';
  const nn = 'Noun';

  var neighbours$2 = {
    // looking at the previous word's tags:
    leftTags: [
      ['Adjective', nn],
      ['Possessive', nn],
      ['Determiner', nn],
      ['Adverb', vb],
      ['Pronoun', vb],
      ['Value', nn],
      ['Ordinal', nn],
      ['Modal', vb],
      ['Superlative', nn],
      ['Demonym', nn],
      ['Honorific', 'Person'], //dr. Smith
    ],
    // looking at the previous word:
    leftWords: [
      ['i', vb],
      ['first', nn],
      ['it', vb],
      ['there', vb],
      ['not', vb],
      ['because', nn],
      ['if', nn],
      ['but', nn],
      ['who', vb],
      ['this', nn],
      ['his', nn],
      ['when', nn],
      ['you', vb],
      ['very', 'Adjective'],
      ['old', nn],
      ['never', vb],
      ['before', nn],
      ['a', 'Singular'],
      ['the', nn],
      ['been', vb],
    ],

    // looking at the next word's tags:
    rightTags: [
      ['Copula', nn],
      ['PastTense', nn],
      ['Conjunction', nn],
      ['Modal', nn],
    ],
    // looking at the next word:
    rightWords: [
      ['there', vb],
      ['me', vb],
      ['man', 'Adjective'],
      ['only', vb],
      ['him', vb],
      ['it', vb],//relaunch it
      ['were', nn],
      ['took', nn],
      ['himself', vb],
      ['went', nn],
      ['who', nn],
      ['jr', 'Person'],
    ],
  };

  // generated in ./lib/pairs
  var data = {
    "Comparative": {
      "rules": "ig|2ger,ng|2er,hin|3ner,n|1er,ot|2ter,lat|3ter,t|1er,ray|3er,y|ier,ross|4er,im|2mer,m|1er,f|1er,b|1er,er|2,r|1er,p|1er,h|1er,w|1er,k|1er,l|1er,d|1er,e|1r",
      "exceptions": "good|better,bad|worse,wet|3ter,lay|3er,neat|4ter,fat|3ter,mad|3der,sad|3der,wide|4r,late|4r,safe|4r,fine|4r,dire|4r,fake|4r,pale|4r,rare|4r,rude|4r,sore|4r",
      "rev": "arger|4,esser|5,igger|2,impler|5,reer|3,hinner|3,remier|6,urer|3,aucher|5,almer|3,raver|4,uter|3,iviner|5,erier|4,enuiner|6,rosser|4,uger|3,andomer|5,emoter|5,quarer|5,taler|4,iper|3,hiter|4,rther|5,rmer|2,ayer|2,immer|2,somer|4,amer|3,adder|2,nger|2,fer|1,tler|3,cer|2,ber|1,uer|2,bler|3,tter|1,rer|1,ser|2,per|1,her|1,wer|1,ker|1,ner|1,ler|1,ter|1,der|1,ier|y"
    },
    "Gerund": {
      "rules": "omoting|4e,haring|3e,ploring|4e,mbining|4e,nviting|4e,belling|3,ntoring|4e,uiding|3e,orging|3e,dhering|4e,alysing|4e,nciling|4e,mpeding|4e,uoting|3e,evoting|4e,nsating|4e,gnoring|4e,roding|3e,iaising|4e,esaling|4e,rowsing|4e,rfering|4e,kating|3e,robing|3e,tponing|4e,mmuting|4e,laning|3e,moking|3e,nfining|4e,nduring|4e,nciting|4e,busing|3e,eleting|4e,esiring|4e,rbating|4e,larging|4e,ploding|4e,haking|3e,hading|3e,biding|3e,udding|2,neating|4e,craping|4e,efuting|4e,thoring|4e,eusing|3e,agining|4e,rekking|3,suading|4e,ubating|4e,ronzing|4e,euvring|4e,bliging|4e,laking|3e,riming|3e,asising|4e,lunging|4e,cilling|3,pinging|4e,hoking|3e,creting|4e,ralling|3,miling|3e,wathing|4e,edoring|4e,odding|2,aloging|4e,rseding|4e,xcusing|4e,halling|3,ialling|3,inuting|4e,xciting|4e,chuting|4e,hrining|4e,eciting|4e,xuding|3e,isusing|4e,uizzing|3,ithing|3e,izzling|4e,haling|3e,dmiring|4e,rsaking|4e,parging|4e,ixating|4e,anuring|4e,iecing|3e,erusing|4e,eething|4e,entring|4e,goating|4e,langing|4e,stining|4e,lescing|4e,erlying|3ie,pleting|4e,ausing|3e,ciding|3e,enging|3e,casing|3e,cising|3e,esiding|4e,uning|2e,delling|3,storing|4e,tiring|3e,leging|3e,piling|3e,tising|3e,ecuting|4e,eduling|4e,uelling|3,liding|3e,uging|2e,celling|3,ubing|2e,laming|3e,ebating|4e,njuring|4e,scaping|4e,truding|4e,chising|4e,vading|3e,shaping|4e,iping|2e,naming|3e,ulging|3e,raking|3e,fling|2e,taping|3e,noting|3e,lading|3e,scaling|4e,riding|3e,rasing|3e,coping|3e,ruling|3e,wining|3e,viding|3e,quiring|4e,velling|3,alyzing|4e,laring|3e,coring|3e,ranging|4e,ousing|3e,puting|3e,vening|3e,idding|2,hining|3e,urging|3e,coding|3e,niting|3e,nelling|3,dising|3e,uising|3e,caring|3e,lapsing|4e,erging|3e,pating|3e,mining|3e,ibuting|4e,coming|3e,paring|3e,taking|3e,hasing|3e,vising|3e,ituting|4e,writing|4e,eezing|3e,piring|3e,luting|3e,voking|3e,iguring|4e,uming|2e,curing|3e,mising|3e,iking|2e,edding|2,luding|3e,suring|3e,rising|3e,ribing|3e,rading|3e,ceding|3e,nsing|2e,kling|2e,fusing|3e,azing|2e,cling|2e,nising|3e,ducing|3e,rcing|2e,gling|2e,easing|3e,uating|3e,lising|3e,lining|3e,mating|3e,mming|1,pling|2e,bbing|1,vating|3e,dling|2e,dating|3e,rsing|2e,dging|2e,tling|2e,turing|3e,icing|2e,acing|2e,gating|3e,gging|1,tating|3e,rring|1,nning|1,uing|1e,bling|2e,iating|3e,cating|3e,aging|2e,osing|2e,ncing|2e,nating|3e,pping|1,lating|3e,tting|1,rating|3e,ving|1e,izing|2e,ing|",
      "exceptions": "being|is,using|2e,making|3e,creating|5e,changing|5e,owing|2e,raising|4e,competing|6e,defining|5e,counselling|7,hiring|3e,filing|3e,controlling|7,totalling|5,infringing|7e,citing|3e,dying|1ie,doping|3e,baking|3e,hoping|3e,refining|5e,exchanging|7e,charging|5e,stereotyping|9e,voting|3e,tying|1ie,discharging|8e,basing|3e,lying|1ie,expediting|7e,typing|3e,breathing|6e,framing|4e,boring|3e,dining|3e,firing|3e,hiding|3e,appraising|7e,tasting|4e,waning|3e,distilling|6,baling|3e,boning|3e,faring|3e,honing|3e,wasting|4e,phoning|4e,luring|3e,propelling|6,timing|3e,wading|3e,abating|4e,compelling|6,vying|1ie,fading|3e,biting|3e,zoning|3e,dispelling|6,pasting|4e,praising|5e,telephoning|8e,daring|3e,waking|3e,shoring|4e,gaming|3e,padding|3,rerouting|6e,fringing|5e,braising|5e,coking|3e,recreating|7e,sloping|4e,sunbathing|7e,overcharging|9e,everchanging|9e,patrolling|6,joking|3e,extolling|5,expelling|5,reappraising|9e,wadding|3,gaping|3e,poking|3e,persevering|8e,pining|3e,recordkeeping|10e,landfilling|7,liming|3e,interchanging|10e,toting|3e,roping|3e,wiring|3e,aching|3e,gassing|3,getting|3,travelling|6,putting|3,sitting|3,betting|3,mapping|3,tapping|3,letting|3,hitting|3,tanning|3,netting|3,popping|3,fitting|3,deterring|5,barring|3,banning|3,vetting|3,omitting|4,wetting|3,plotting|4,budding|3,clotting|4,hemming|3,slotting|4,singeing|5,reprogramming|9,jetting|3,kidding|3,befitting|5,podding|3,wedding|3,donning|3,warring|3,penning|3,gutting|3,cueing|3,refitting|5,petting|3,cramming|4,napping|3,tinning|3",
      "rev": "lan|3ning,egin|4ning,can|3ning,pan|3ning,hin|3ning,kin|3ning,win|3ning,un|2ning,pin|3ning,n|1ing,ounsel|6ling,otal|4ling,abel|4ling,evel|4ling,ancel|5ling,istil|5ling,xcel|4ling,tencil|6ling,piral|5ling,arshal|6ling,nitial|6ling,hrivel|6ling,xtol|4ling,andfil|6ling,trol|4ling,fuel|4ling,model|5ling,nnel|4ling,pel|3ling,l|1ing,ransfer|7ring,lur|3ring,tir|3ring,tar|3ring,pur|3ring,car|3ring,nfer|4ring,efer|4ring,cur|3ring,r|1ing,ermit|5ting,ransmit|7ting,ommit|5ting,nit|3ting,orget|5ting,abysit|6ting,dmit|4ting,hut|3ting,hat|3ting,utfit|5ting,but|3ting,egret|5ting,llot|4ting,mat|3ting,pot|3ting,lit|3ting,emit|4ting,submit|6ting,pit|3ting,rot|3ting,quit|4ting,cut|3ting,set|3ting,t|1ing,tem|3ming,wim|3ming,kim|3ming,um|2ming,rim|3ming,m|1ing,tep|3ping,wap|3ping,top|3ping,hop|3ping,cap|3ping,rop|3ping,rap|3ping,lap|3ping,ip|2ping,p|1ing,ye|2ing,oe|2ing,ie|ying,ee|2ing,e|ing,hed|3ding,hred|4ding,bed|3ding,bid|3ding,d|1ing,ki|2ing,rek|3king,k|1ing,isc|3ing,echarg|6ing,ng|2ing,g|1ging,uiz|3zing,z|1ing,mb|2ing,rb|2ing,b|1bing,o|1ing,x|1ing,f|1ing,s|1ing,w|1ing,y|1ing,h|1ing"
    },
    "Participle": {
      "rules": "roken|1ake,hosen|2ose,allen|3,rozen|1eeze,asten|4,engthen|5,essen|3,hrunken|2ink,lain|2y,poken|1eak,tolen|1eal,eaten|3,un|in,itten|2e,gotten|1et,ighten|4,idden|2e,worn|1ear,sen|2,aken|3,ven|2,wn|1,rought|1ing,uilt|3d,urst|4,ealt|3,reamt|4,urt|3,nelt|2el,eapt|3,eft|1ave,eant|3,hot|2ot,pat|1it,et|2,ut|2,it|2,ent|2d,ept|1ep,urned|3,reated|5,eard|3,eld|old,ead|3,lid|3e,old|ell,ped|2ed,pilled|4,ound|ind,ved|2,aid|1y,ug|ig,ung|ing,ade|1ke,hone|1ine,come|4,gone|2,nuck|1eak,unk|ink",
      "exceptions": "been|2,bled|3ed,bought|1uy,fed|2ed,fled|3e,flown|2y,fought|1ight,had|2ve,hung|1ang,led|2ad,lit|2ght,met|2et,run|3,sat|1eat,seen|3,sought|1eek,woven|1eave,bet|3,brought|2ing,dealt|4,dived|4,heard|4,left|2ave,made|2ke,read|4,shaved|5,slain|3y",
      "rev": "uy|ought,ly|1own,ay|1id,rake|1oken,hoose|2sen,reate|5d,lee|2d,reeze|1ozen,aste|4n,rove|4n,hine|1one,lide|3,hrive|5d,come|4,ite|2ten,ide|2den,se|2n,ake|3n,ive|3n,uild|3t,old|eld,ind|ound,eed|1d,end|2t,urn|3ed,ean|3t,un|2,in|un,urst|4,right|5en,eight|5en,urt|3,eet|1t,hoot|2t,pit|1at,eat|3en,get|1otten,set|3,ut|2,it|2,ream|4t,ig|ug,ang|ung,ing|ung,all|3en,neel|2lt,ell|old,pill|4ed,teal|1olen,eap|3t,eep|1pt,ength|5en,ess|3en,hrink|2unken,neak|1uck,eek|ought,peak|1oken,ink|unk,wear|1orn,go|2ne,w|1n"
    },
    "PastTense": {
      "rules": "een|1,egan|2in,on|in,pun|1in,hun|3ned,wn|1,ave|ive,poke|1eak,hose|2ose,roke|1eak,roze|1eeze,ode|ide,orbade|3id,hone|1ine,tole|1eal,ollide|6d,rose|1ise,woke|1ake,wrote|2ite,made|2ke,came|1ome,ove|ive,ore|ear,elped|3,elcomed|6,hared|4,nvited|5,eclared|6,eard|3,avelled|4,ombined|6,uided|4,etired|5,choed|3,ncelled|4,epeated|5,moked|4,entred|5,dhered|5,esired|5,ompeted|6,erseded|6,ramed|4,qualled|4,iloted|4,stponed|6,uelled|3,opelled|4,gnored|5,xtruded|6,caled|4,ndured|5,lamed|4,quared|5,mpeded|5,rouped|4,efeated|5,robed|4,lid|3e,magined|6,nselled|4,uthored|6,ebuted|4,shrined|6,tialled|4,erfered|6,eaped|3,yped|3,laked|4,tirred|3,ooted|3,leated|4,ncited|5,oubted|4,mpelled|4,nnulled|4,pined|4,ircled|5,ecited|5,reathed|6,nvaded|5,onfided|6,pedited|6,alcined|6,ycotted|5,dmired|5,xcreted|6,ubed|3,taked|4,onfined|6,heated|4,rimed|4,amelled|4,achined|6,litzed|4,xcited|5,xpelled|4,xtolled|4,ouled|3,imicked|4,ivalled|4,eeped|3,naked|4,tyled|4,iased|3,nhaled|5,oeuvred|6,grammed|6,kied|2,miled|4,pited|4,lodded|3,eterred|4,hoked|4,kidded|3,rod|3ded,pleted|5,cided|4,plored|5,stored|5,longed|4,filed|4,rbed|2,suaded|5,ciled|4,edded|2,tined|4,phoned|5,fled|3,nited|4,iped|3,hauled|4,treated|5,nnelled|4,basted|5,njured|5,twined|5,uzzed|3,did|1o,vided|4,old|ell,pared|4,mbed|2,stood|2and,pired|4,held|1old,vened|4,cored|4,read|4,piled|4,aped|3,gled|3,named|4,arred|2,oated|3,kled|3,ooled|3,uned|3,figured|6,bid|3,ound|ind,oped|2,ibed|3,quired|5,uled|3,oded|3,mmed|1,ceded|4,cured|4,sided|4,voked|4,rled|2,outed|3,mined|4,urred|2,ighted|4,umed|3,sured|4,iked|3,pled|3,fed|1,bbed|1,eled|2,luded|4,aid|1y,ferred|3,tled|3,dled|3,raded|4,oted|3,eed|2,aled|2,lined|4,mped|2,fted|2,lted|2,gged|1,eted|2,xed|1,bled|3,pted|2,tured|4,uted|3,nned|1,ued|2,iled|2,yed|1,rted|2,pped|1,tted|1,wed|1,lled|2,ited|2,med|1,sted|2,ssed|2,ged|2,ved|2,nted|2,ked|1,cted|2,ced|2,ied|y,hed|1,sed|2,ded|1,zed|2,ned|1,red|1,ated|3,ell|all,ulfil|5led,rought|1ing,hought|1ink,eft|1ave,eant|3,ealt|3,eat|3,hot|2ot,urt|3,eapt|3,elt|1el,went|go,built|4d,at|it,got|1et,ut|2,it|2,et|2,ent|2d,ept|1ep,st|2,truck|2ike,nuck|1eak,tunk|1ink,ank|ink,ook|ake,lew|1y,utgrow|4ew,drew|2aw,saw|1ee,ew|ow,ug|ig,ang|ing,ung|ing,nderlay|5ie,dezvous|7,wam|1im,lam|3med",
      "exceptions": "was|is,were|are,had|2ve,led|2ad,met|2et,cited|4,focused|5,sought|1eek,lost|3e,defined|6,died|3,hired|4,bought|1uy,ran|1un,controlled|7,taught|1each,hoped|4,shed|4,refined|6,caught|2tch,owed|3,fought|1ight,fired|4,fed|2ed,pied|3,fared|4,tied|3,fled|3e,cared|4,ate|eat,dyed|3,lit|2ght,winged|4,bred|3ed,pent|3,wired|4,persevered|9,baked|4,dined|4,fined|4,shored|5,hid|3e,padded|3,waned|4,wove|1eave,lied|3,wasted|5,sloped|5,joked|4,ached|4,baled|4,bit|3e,bled|3ed,boned|4,caned|4,dispelled|6,egged|3,hung|1ang,patrolled|6,tasted|5,faked|4,bored|4,eyed|3,gamed|4,gassed|3,pored|4,timed|4,toned|4,zoned|4,poked|4,dared|4,been|2,said|2y,found|1ind,took|1ake,came|1ome,gave|1ive,fell|1all,brought|2ing,rose|1ise,grew|2ow,put|3,sent|3d,spent|4d,spoke|2eak,left|2ave,won|1in,told|1ell,meant|4,heard|4,got|1et,arose|2ise,read|4,let|3,hit|3,cost|4,dealt|4,laid|2y,drove|2ive,sat|1it,cast|4,beat|4,flew|2y,lent|3d,sang|1ing,banned|3,jarred|3,wound|1ind,omitted|4,quit|4,rang|1ing,fit|3,rent|3d,bet|3,sank|1ink,reaped|4,manned|3,rode|1ide,rebutted|5,bound|1ind,barred|3,recast|6,netted|3,tanned|3,plotted|4,tore|1ear,spun|2in,pitted|3,shone|2ine,donned|3,dove|1ive,spat|2it,bent|3d,blown|4,leapt|4,seeped|4,sewn|3,twinned|4,wrung|2ing,deterred|5",
      "rev": "egin|2an,lan|3ned,nderpin|7ned,kin|3ned,tun|3ned,hin|3ned,pan|3ned,can|3ned,n|1ed,ecome|2ame,hoose|2se,trike|2uck,lee|2d,trive|2ove,vercome|4ame,lide|3,reeze|1oze,hake|1ook,nderlie|5ay,istake|3ook,etake|2ook,wake|1oke,write|2ote,make|2de,rtake|2ook,see|1aw,e|1d,elp|3ed,roup|4ed,oop|3ed,velop|5ed,eep|1pt,mp|2ed,p|1ped,hink|1ought,eek|ought,reak|1oke,neak|1uck,tink|1unk,rink|1ank,k|1ed,ommit|5ted,ermit|5ted,oadcast|7,dmit|4ted,hoot|2t,plit|4,hut|3,llot|4ted,nit|3ted,orget|3ot,egret|5ted,hrust|5,ormat|5ted,hat|3ted,lat|3ted,urt|3,cquit|5ted,urst|4,ransmit|7ted,emit|4ted,pot|3ted,cut|3,submit|6ted,set|3,t|1ed,now|1ew,trew|4n,utgrew|4ow,draw|2ew,throw|3ew,w|1ed,uy|ought,ey|2ed,pay|2id,oy|2ed,ay|2ed,y|ied,ravel|5led,ancel|5led,qual|4led,uel|3led,ounsel|6led,nitial|6led,nnul|4led,namel|5led,xtol|4led,ival|4led,teal|1ole,eel|1lt,trol|4led,sell|1old,nnel|4led,pel|3led,l|1ed,ransfer|7red,pur|3red,lur|3red,tir|3red,par|3red,nfer|4red,wear|1ore,bear|1ore,efer|4red,cur|3red,r|1ed,pread|5,hed|3,rind|1ound,mbed|4ded,reed|2d,hred|4ded,eread|5,orbid|3ade,leed|2d,lod|3ded,kid|3ded,ollided|6,lammed|3,hunned|3,rodded|3,lfilled|4,build|4t,stand|2ood,hold|1eld,bid|3,d|1ed,cho|3ed,go|went,do|1id,tem|3med,um|2med,rim|3med,kim|3med,wim|1am,m|1ed,lug|3ged,ig|ug,pring|2ang,gg|2ed,ang|ung,long|4ed,og|2ged,ling|1ung,ag|2ged,ub|2bed,ib|2bed,ob|2bed,rb|2ed,ab|2bed,mb|2ed,imic|4ked,dezvous|7,s|1ed,ki|2ed,z|1ed,f|1ed,x|1ed,h|1ed"
    },
    "PresentTense": {
      "rules": "as|1ve,tudies|3y,mbodies|4y,evies|2y,arties|3y,emedies|4y,mpties|3y,eadies|3y,obbies|3y,ullies|3y,nesties|4y,zzes|2,pies|1y,nies|1y,oes|1,xes|1,plies|2y,ries|1y,shes|2,sses|2,ches|2,fies|1y,s|",
      "exceptions": "are|is,focuses|5,relies|3y,flies|2y,gasses|3,has|2ve",
      "rev": "uy|2s,oy|2s,ey|2s,ay|2s,y|ies,adio|4s,aboo|4s,o|1es,tograph|7s,erth|4s,gh|2s,h|1es,as|2ses,s|1es,ic|2s,zz|2es,x|1es,f|1s,b|1s,g|1s,m|1s,w|1s,p|1s,k|1s,l|1s,d|1s,n|1s,r|1s,t|1s,e|1s"
    },
    "Superlative": {
      "rules": "east|4,uthwest|7,ot|2test,it|2test,lat|3test,weet|4test,t|1est,ig|2gest,ng|2est,hin|3nest,n|1est,nner|4most,uter|4most,r|1est,rey|3est,ricey|3iest,y|iest,ross|4est,f|1est,b|1est,m|1est,p|1est,h|1est,w|1est,k|1est,l|1est,d|1est,e|1st",
      "exceptions": "good|best,bad|worst,wet|3test,far|1urthest,gay|3est,neat|4test,shy|3est,fat|3test,late|4st,wide|4st,fine|4st,severe|6st,fake|4st,pale|4st,rare|4st,rude|4st,sore|4st,dire|4st",
      "rev": "east|4,argest|4,iggest|2,implest|5,afest|3,uthwest|7,hinnest|3,ncerest|5,urthest|ar,ravest|4,utest|3,eriest|4,rossest|4,dsomest|5,ugest|3,riciest|3ey,emotest|5,quarest|5,rangest|5,ipest|3,urest|3,cest|2,ermost|2,fest|1,best|1,amest|3,itest|3,ngest|2,uest|2,yest|1,tlest|3,mest|1,blest|3,sest|2,pest|1,hest|1,ttest|1,west|1,rest|1,kest|1,nest|1,lest|1,test|1,dest|1,iest|y"
    }
  };

  const prefix$3 = /^.([0-9]+)/;

  // handle compressed form of key-value pair
  const getKeyVal = function (word, model) {
    let val = model.exceptions[word];
    let m = val.match(prefix$3);
    if (m === null) {
      // return not compressed form
      return model.exceptions[word]
    }
    // uncompress it
    let num = Number(m[1]) || 0;
    let pre = word.substr(0, num);
    return pre + val.replace(prefix$3, '')
  };

  // get suffix-rules according to last char of word
  const getRules = function (word, rules = {}) {
    let char = word[word.length - 1];
    let list = rules[char] || [];
    // do we have a generic suffix?
    if (rules['']) {
      list = list.concat(rules['']);
    }
    return list
  };

  const convert = function (word, model, debug) {
    // check list of irregulars
    if (model.exceptions.hasOwnProperty(word)) {
      if (debug) {
        console.log("exception, ", word, model.exceptions[word]);
      }
      return getKeyVal(word, model)
    }
    // if model is reversed, try rev rules
    let rules = model.rules;
    if (model.reversed) {
      rules = model.rev;
    }
    // try suffix rules
    rules = getRules(word, rules);
    for (let i = 0; i < rules.length; i += 1) {
      let suffix = rules[i][0];
      if (word.endsWith(suffix)) {
        if (debug) {
          console.log("rule, ", rules[i]);
        }
        let reg = new RegExp(suffix + '$');
        return word.replace(reg, rules[i][1])
      }
    }
    if (debug) {
      console.log(' x - ' + word);
    }
    // return the original word unchanged
    return word
  };
  var convert$1 = convert;

  // index rules by last-char
  const indexRules = function (rules) {
    let byChar = {};
    rules.forEach((a) => {
      let suff = a[0] || '';
      let char = suff[suff.length - 1] || '';
      byChar[char] = byChar[char] || [];
      byChar[char].push(a);
    });
    return byChar
  };

  const prefix$2 = /^([0-9]+)/;

  const expand$2 = function (key = '', val = '') {
    val = String(val);
    let m = val.match(prefix$2);
    if (m === null) {
      return [key, val]
    }
    let num = Number(m[1]) || 0;
    let pre = key.substring(0, num);
    let full = pre + val.replace(prefix$2, '');
    return [key, full]
  };

  const toArray$2 = function (txt) {
    const pipe = /\|/;
    return txt.split(/,/).map(str => {
      let a = str.split(pipe);
      return expand$2(a[0], a[1])
    })
  };

  const uncompress = function (model = {}) {
    model = Object.assign({}, model);

    // compress fwd rules
    model.rules = toArray$2(model.rules);
    model.rules = indexRules(model.rules);

    // compress reverse rules
    if (model.rev) {
      model.rev = toArray$2(model.rev);
      model.rev = indexRules(model.rev);
    }

    // compress exceptions
    model.exceptions = toArray$2(model.exceptions);
    model.exceptions = model.exceptions.reduce((h, a) => {
      h[a[0]] = a[1];
      return h
    }, {});
    return model
  };
  var uncompress$1 = uncompress;

  // console.log(expand('fixture', '6ing'))
  // console.log(toArray('heard|4'))

  const reverseObj = function (obj) {
    return Object.entries(obj).reduce((h, a) => {
      h[a[1]] = a[0];
      return h
    }, {})
  };

  const reverse = function (model) {
    let { rules, exceptions, rev } = model;
    exceptions = reverseObj(exceptions);
    return {
      reversed: !Boolean(model.reversed),//toggle this
      rules,
      exceptions,
      rev
    }
  };
  var reverse$1 = reverse;

  // import { reverse, uncompress } from '/Users/spencer/mountain/suffix-thumb'
  // const uncompress = function () { }
  // const reverse = function () { }
  const fromPast = uncompress$1(data.PastTense);
  const fromPresent = uncompress$1(data.PresentTense);
  const fromGerund = uncompress$1(data.Gerund);
  const fromParticiple = uncompress$1(data.Participle);

  const toPast$4 = reverse$1(fromPast);
  const toPresent$4 = reverse$1(fromPresent);
  const toGerund$3 = reverse$1(fromGerund);
  const toParticiple = reverse$1(fromParticiple);

  const toComparative = uncompress$1(data.Comparative);
  const toSuperlative = uncompress$1(data.Superlative);
  const fromComparative = reverse$1(toComparative);
  const fromSuperlative = reverse$1(toSuperlative);

  var models = {
    fromPast,
    fromPresent,
    fromGerund,
    fromParticiple,
    toPast: toPast$4,
    toPresent: toPresent$4,
    toGerund: toGerund$3,
    toParticiple,
    // adjectives
    toComparative,
    toSuperlative,
    fromComparative,
    fromSuperlative
  };
  // console.log(convert('collide', toPast))

  var regexNormal = [
    //web tags
    [/^[\w.]+@[\w.]+\.[a-z]{2,3}$/, 'Email'],
    [/^(https?:\/\/|www\.)+\w+\.[a-z]{2,3}/, 'Url', 'http..'],
    [/^[a-z0-9./].+\.(com|net|gov|org|ly|edu|info|biz|dev|ru|jp|de|in|uk|br|io|ai)/, 'Url', '.com'],

    // timezones
    [/^[PMCE]ST$/, 'Timezone', 'EST'],

    //names
    [/^ma?c'.*/, 'LastName', "mc'neil"],
    [/^o'[drlkn].*/, 'LastName', "o'connor"],
    [/^ma?cd[aeiou]/, 'LastName', 'mcdonald'],

    //slang things
    [/^(lol)+[sz]$/, 'Expression', 'lol'],
    [/^wo{2,}a*h?$/, 'Expression', 'wooah'],
    [/^(hee?){2,}h?$/, 'Expression', 'hehe'],
    [/^(un|de|re)\\-[a-z\u00C0-\u00FF]{2}/, 'Verb', 'un-vite'],

    // m/h
    [/^(m|k|cm|km)\/(s|h|hr)$/, 'Unit', '5 k/m'],
    // μg/g
    [/^(ug|ng|mg)\/(l|m3|ft3)$/, 'Unit', 'ug/L'],
  ];

  var regexText = [
    // #coolguy
    [/^#[\p{Number}_]*\p{Letter}/u, 'HashTag'],// can't be all numbers

    // @spencermountain
    [/^@\w{2,}$/, 'AtMention'],

    // period-ones acronyms - f.b.i.
    [/^([A-Z]\.){2}[A-Z]?/i, ['Acronym', 'Noun'], 'F.B.I'], //ascii-only

    // ending-apostrophes
    [/.{3}[lkmnp]in['‘’‛‵′`´]$/, 'Gerund', "chillin'"],
    [/.{4}s['‘’‛‵′`´]$/, 'Possessive', "flanders'"],

    //from https://www.regextester.com/106421
    // [/^([\u00a9\u00ae\u2319-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/, 'Emoji', 'emoji-range']
    // unicode character range
    [/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]/u, 'Emoji', 'emoji-class']
  ];

  var regexNumbers = [

    [/^@1?[0-9](am|pm)$/i, 'Time', '3pm'],
    [/^@1?[0-9]:[0-9]{2}(am|pm)?$/i, 'Time', '3:30pm'],
    [/^'[0-9]{2}$/, 'Year'],
    // times
    [/^[012]?[0-9](:[0-5][0-9])(:[0-5][0-9])$/, 'Time', '3:12:31'],
    [/^[012]?[0-9](:[0-5][0-9])?(:[0-5][0-9])? ?(am|pm)$/i, 'Time', '1:12pm'],
    [/^[012]?[0-9](:[0-5][0-9])(:[0-5][0-9])? ?(am|pm)?$/i, 'Time', '1:12:31pm'], //can remove?

    // iso-dates
    [/^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}/i, 'Date', 'iso-date'],
    [/^[0-9]{1,4}-[0-9]{1,2}-[0-9]{1,4}$/, 'Date', 'iso-dash'],
    [/^[0-9]{1,4}\/[0-9]{1,2}\/[0-9]{1,4}$/, 'Date', 'iso-slash'],
    [/^[0-9]{1,4}\.[0-9]{1,2}\.[0-9]{1,4}$/, 'Date', 'iso-dot'],
    [/^[0-9]{1,4}-[a-z]{2,9}-[0-9]{1,4}$/i, 'Date', '12-dec-2019'],

    // timezones
    [/^utc ?[+-]?[0-9]+$/, 'Timezone', 'utc-9'],
    [/^(gmt|utc)[+-][0-9]{1,2}$/i, 'Timezone', 'gmt-3'],

    //phone numbers
    [/^[0-9]{3}-[0-9]{4}$/, 'PhoneNumber', '421-0029'],
    [/^(\+?[0-9][ -])?[0-9]{3}[ -]?[0-9]{3}-[0-9]{4}$/, 'PhoneNumber', '1-800-'],


    //money
    //like $5.30
    [
      /^[-+]?\p{Currency_Symbol}[-+]?[0-9]+(,[0-9]{3})*(\.[0-9]+)?([kmb]|bn)?\+?$/u,
      ['Money', 'Value'],
      '$5.30',
    ],
    //like 5.30$
    [
      /^[-+]?[0-9]+(,[0-9]{3})*(\.[0-9]+)?\p{Currency_Symbol}\+?$/u,
      ['Money', 'Value'],
      '5.30£',
    ],
    //like
    [/^[-+]?[$£]?[0-9]([0-9,.])+(usd|eur|jpy|gbp|cad|aud|chf|cny|hkd|nzd|kr|rub)$/i, ['Money', 'Value'], '$400usd'],

    //numbers
    // 50 | -50 | 3.23  | 5,999.0  | 10+
    [/^[-+]?[0-9]+(,[0-9]{3})*(\.[0-9]+)?\+?$/, ['Cardinal', 'NumericValue'], '5,999'],
    [/^[-+]?[0-9]+(,[0-9]{3})*(\.[0-9]+)?(st|nd|rd|r?th)$/, ['Ordinal', 'NumericValue'], '53rd'],
    // .73th
    [/^\.[0-9]+\+?$/, ['Cardinal', 'NumericValue'], '.73th'],
    //percent
    [/^[-+]?[0-9]+(,[0-9]{3})*(\.[0-9]+)?%\+?$/, ['Percent', 'Cardinal', 'NumericValue'], '-4%'],
    [/^\.[0-9]+%$/, ['Percent', 'Cardinal', 'NumericValue'], '.3%'],
    //fraction
    [/^[0-9]{1,4}\/[0-9]{1,4}(st|nd|rd|th)?s?$/, ['Fraction', 'NumericValue'], '2/3rds'],
    //range
    [/^[0-9.]{1,3}[a-z]{0,2}[-–—][0-9]{1,3}[a-z]{0,2}$/, ['Value', 'NumberRange'], '3-4'],
    //time-range
    [/^[0-9]{1,2}(:[0-9][0-9])?(am|pm)? ?[-–—] ?[0-9]{1,2}(:[0-9][0-9])?(am|pm)$/, ['Time', 'NumberRange'], '3-4pm'],
    //number with unit
    [/^[0-9.]+([a-z]{1,4})$/, 'Value', '9km'],
  ];

  //nouns that also signal the title of an unknown organization
  //todo remove/normalize plural forms
  var orgWords$1 = [
    'academy',
    'administration',
    'agence',
    'agences',
    'agencies',
    'agency',
    'airlines',
    'airways',
    'army',
    'assoc',
    'associates',
    'association',
    'assurance',
    'authority',
    'autorite',
    'aviation',
    'bank',
    'banque',
    'board',
    'boys',
    'brands',
    'brewery',
    'brotherhood',
    'brothers',
    'bureau',
    'cafe',
    'co',
    'caisse',
    'capital',
    'care',
    'cathedral',
    'center',
    'centre',
    'chemicals',
    'choir',
    'chronicle',
    'church',
    'circus',
    'clinic',
    'clinique',
    'club',
    'co',
    'coalition',
    'coffee',
    'collective',
    'college',
    'commission',
    'committee',
    'communications',
    'community',
    'company',
    'comprehensive',
    'computers',
    'confederation',
    'conference',
    'conseil',
    'consulting',
    'containers',
    'corporation',
    'corps',
    'corp',
    'council',
    'crew',
    'data',
    'departement',
    'department',
    'departments',
    'design',
    'development',
    'directorate',
    'division',
    'drilling',
    'education',
    'eglise',
    'electric',
    'electricity',
    'energy',
    'ensemble',
    'enterprise',
    'enterprises',
    'entertainment',
    'estate',
    'etat',
    'faculty',
    'federation',
    'financial',
    'fm',
    'foundation',
    'fund',
    'gas',
    'gazette',
    'girls',
    'government',
    'group',
    'guild',
    'herald',
    'holdings',
    'hospital',
    'hotel',
    'hotels',
    'inc',
    'industries',
    'institut',
    'institute',
    'institutes',
    'insurance',
    'international',
    'interstate',
    'investment',
    'investments',
    'investors',
    'journal',
    'laboratory',
    'labs',
    'llc',
    'ltd',
    'limited',
    'machines',
    'magazine',
    'management',
    'marine',
    'marketing',
    'markets',
    'media',
    'memorial',
    'ministere',
    'ministry',
    'military',
    'mobile',
    'motor',
    'motors',
    'musee',
    'museum',
    'news',
    'observatory',
    'office',
    'oil',
    'optical',
    'orchestra',
    'organization',
    'partners',
    'partnership',
    'petrol',
    'petroleum',
    'pharmacare',
    'pharmaceutical',
    'pharmaceuticals',
    'pizza',
    'plc',
    'police',
    'polytechnic',
    'post',
    'power',
    'press',
    'productions',
    'quartet',
    'radio',
    'reserve',
    'resources',
    'restaurant',
    'restaurants',
    'savings',
    'school',
    'securities',
    'service',
    'services',
    'societe',
    'society',
    'sons',
    // 'standard',
    'subcommittee',
    'syndicat',
    'systems',
    'telecommunications',
    'telegraph',
    'television',
    'times',
    'tribunal',
    'tv',
    'union',
    'university',
    'utilities',
    'workers',
  ].reduce((h, str) => {
    h[str] = true;
    return h
  }, {});

  var rules$1 = [
    [/([^v])ies$/i, '$1y'],
    [/(ise)s$/i, '$1'],//promises
    [/(kn|[^o]l|w)ives$/i, '$1ife'],
    [/^((?:ca|e|ha|(?:our|them|your)?se|she|wo)l|lea|loa|shea|thie)ves$/i, '$1f'],
    [/^(dwar|handkerchie|hoo|scar|whar)ves$/i, '$1f'],
    [/(antenn|formul|nebul|vertebr|vit)ae$/i, '$1a'],
    [/(octop|vir|radi|nucle|fung|cact|stimul)(i)$/i, '$1us'],
    [/(buffal|tomat|tornad)(oes)$/i, '$1o'],

    [/(ause)s$/i, '$1'],//causes
    [/(ease)s$/i, '$1'],//diseases
    [/(ious)es$/i, '$1'],//geniouses
    [/(ouse)s$/i, '$1'],//houses
    [/(ose)s$/i, '$1'],//roses

    [/(..[aeiu]s)es$/i, '$1'],
    [/(vert|ind|cort)(ices)$/i, '$1ex'],
    [/(matr|append)(ices)$/i, '$1ix'],
    [/([xo]|ch|ss|sh)es$/i, '$1'],
    [/men$/i, 'man'],
    [/(n)ews$/i, '$1ews'],
    [/([ti])a$/i, '$1um'],
    [/([^aeiouy]|qu)ies$/i, '$1y'],
    [/(s)eries$/i, '$1eries'],
    [/(m)ovies$/i, '$1ovie'],
    [/(cris|ax|test)es$/i, '$1is'],
    [/(alias|status)es$/i, '$1'],
    [/(ss)$/i, '$1'],
    [/(ic)s$/i, '$1'],
    [/s$/i, ''],
  ];

  const invertObj = function (obj) {
    return Object.keys(obj).reduce((h, k) => {
      h[obj[k]] = k;
      return h
    }, {})
  };

  const toSingular$2 = function (str, model) {
    const { irregularPlurals } = model.two;
    let invert = invertObj(irregularPlurals); //(not very efficient)
    // check irregulars list
    if (invert.hasOwnProperty(str)) {
      return invert[str]
    }
    // go through our regexes
    for (let i = 0; i < rules$1.length; i++) {
      if (rules$1[i][0].test(str) === true) {
        // console.log(rules[i])
        str = str.replace(rules$1[i][0], rules$1[i][1]);
        return str
      }
    }
    return str
  };
  var nounToSingular = toSingular$2;

  let guessVerb = {
    Gerund: ['ing'],
    Actor: ['erer'],
    Infinitive: [
      'ate',
      'ize',
      'tion',
      'rify',
      'then',
      'ress',
      'ify',
      'age',
      'nce',
      'ect',
      'ise',
      'ine',
      'ish',
      'ace',
      'ash',
      'ure',
      'tch',
      'end',
      'ack',
      'and',
      'ute',
      'ade',
      'ock',
      'ite',
      'ase',
      'ose',
      'use',
      'ive',
      'int',
      'nge',
      'lay',
      'est',
      'ain',
      'ant',
      'ent',
      'eed',
      'er',
      'le',
      'unk',
      'ung',
      'upt',
      'en',
    ],
    PastTense: ['ept', 'ed', 'lt', 'nt', 'ew', 'ld'],
    PresentTense: [
      'rks',
      'cks',
      'nks',
      'ngs',
      'mps',
      'tes',
      'zes',
      'ers',
      'les',
      'acks',
      'ends',
      'ands',
      'ocks',
      'lays',
      'eads',
      'lls',
      'els',
      'ils',
      'ows',
      'nds',
      'ays',
      'ams',
      'ars',
      'ops',
      'ffs',
      'als',
      'urs',
      'lds',
      'ews',
      'ips',
      'es',
      'ts',
      'ns',
    ],
    Participle: ['ken', 'wn']
  };
  //flip it into a lookup object
  guessVerb = Object.keys(guessVerb).reduce((h, k) => {
    guessVerb[k].forEach(a => (h[a] = k));
    return h
  }, {});
  var guess = guessVerb;

  /** it helps to know what we're conjugating from */
  const getTense$1 = function (str) {
    let three = str.substring(str.length - 3);
    if (guess.hasOwnProperty(three) === true) {
      return guess[three]
    }
    let two = str.substring(str.length - 2);
    if (guess.hasOwnProperty(two) === true) {
      return guess[two]
    }
    let one = str.substring(str.length - 1);
    if (one === 's') {
      return 'PresentTense'
    }
    return null
  };
  var getTense$2 = getTense$1;

  const toParts = function (str, model) {
    let prefix = '';
    let prefixes = {};
    if (model.one && model.one.prefixes) {
      prefixes = model.one.prefixes;
    }
    // pull-apart phrasal verb 'fall over'
    let [verb, particle] = str.split(/ /);
    // support 'over cleaned'
    if (particle && prefixes[verb] === true) {
      prefix = verb;
      verb = particle;
      particle = '';
    }
    return {
      prefix, verb, particle
    }
  };


  // dunno about these..
  const copulaMap = {
    are: 'be',
    were: 'be',
    been: 'be',
    is: 'be',
    am: 'be',
    was: 'be',
    be: 'be',
    being: 'be',
  };

  const toInfinitive$6 = function (str, model, tense) {
    const { fromPast, fromPresent, fromGerund, fromParticiple } = model.two.models;
    // if (str.length < 3) {
    //   return str
    // }
    let { prefix, verb, particle } = toParts(str, model);
    let inf = '';
    if (!tense) {
      tense = getTense$2(str);
    }
    if (copulaMap.hasOwnProperty(str)) {
      inf = copulaMap[str];
    } else if (tense === 'Participle') {
      inf = convert$1(verb, fromParticiple);
    } else if (tense === 'PastTense') {
      inf = convert$1(verb, fromPast);
    } else if (tense === 'PresentTense') {
      inf = convert$1(verb, fromPresent);
    } else if (tense === 'Gerund') {
      inf = convert$1(verb, fromGerund);
    } else {
      return str
    }

    // stitch phrasal back on
    if (particle) {
      inf += ' ' + particle;
    }
    // stitch prefix back on
    if (prefix) {
      inf = prefix + ' ' + inf;
    }
    return inf
  };
  var toInfinitive$7 = toInfinitive$6;

  // console.log(toInfinitive('snarled', { one: {} }))
  // console.log(convert('snarled', fromPast))

  // import { toPast, toPresent, toGerund, toParticiple } from '../../../../model/models/index.js'

  // pull-apart phrasal verb 'fall over'
  const parse$6 = (inf) => {
    if (/ /.test(inf)) {
      return inf.split(/ /)
    }
    return [inf, '']
  };

  //we run this on every verb in the lexicon, so please keep it fast
  //we assume the input word is a proper infinitive
  const conjugate = function (inf, model) {
    const { toPast, toPresent, toGerund, toParticiple } = model.two.models;
    // ad-hoc Copula response
    if (inf === 'be') {
      return {
        Infinitive: inf,
        Gerund: 'being',
        PastTense: 'was',
        PresentTense: 'is',
      }
    }
    let [str, particle] = parse$6(inf);
    let found = {
      Infinitive: inf,
      PastTense: convert$1(str, toPast),
      PresentTense: convert$1(str, toPresent),
      Gerund: convert$1(str, toGerund),
      FutureTense: 'will ' + inf
    };
    // add past-participle if it's interesting
    // drive -> driven (not drove)
    let pastPrt = convert$1(str, toParticiple);
    if (pastPrt !== inf && pastPrt !== found.PastTense) {
      found.Participle = pastPrt;
    }
    // put phrasal-verbs back together again
    if (particle) {
      Object.keys(found).forEach(k => {
        found[k] += ' ' + particle;
      });
    }
    return found
  };

  var conjugate$1 = conjugate;

  // console.log(toPresent.rules.y)
  // console.log(convert('buy', toPresent))

  //sweep-through all suffixes
  const suffixLoop$1 = function (str = '', suffixes = []) {
    const len = str.length;
    let max = len <= 6 ? len - 1 : 6;
    for (let i = max; i >= 1; i -= 1) {
      let suffix = str.substring(len - i, str.length);
      if (suffixes[suffix.length].hasOwnProperty(suffix) === true) {
        let pre = str.slice(0, len - i);
        let post = suffixes[suffix.length][suffix];
        return pre + post
      }
    }
    return null
  };
  var doRules = suffixLoop$1;

  const s = 'ically';
  const ical = new Set([
    'analyt' + s, //analytical
    'chem' + s,// chemical
    'class' + s, //classical
    'clin' + s, // clinical
    'crit' + s,// critical
    'ecolog' + s,// ecological
    'electr' + s,// electrical
    'empir' + s, // empirical
    'frant' + s, // frantical
    'grammat' + s,// grammatical
    'ident' + s, // identical
    'ideolog' + s, // ideological
    'log' + s, // logical
    'mag' + s, //magical
    'mathemat' + s,// mathematical
    'mechan' + s,// mechanical
    'med' + s,// medical
    'method' + s, // methodical
    'method' + s,// methodical
    'mus' + s, // musical
    'phys' + s, // physical
    'phys' + s,// physical
    'polit' + s,// political
    'pract' + s,// practical
    'rad' + s, //radical
    'satir' + s, // satirical
    'statist' + s, // statistical
    'techn' + s,// technical
    'technolog' + s, // technological
    'theoret' + s,// theoretical
    'typ' + s,// typical
    'vert' + s,// vertical
    'whims' + s,// whimsical
  ]);

  const suffixes$3 = [
    null,
    {},
    { 'ly': '' },
    {
      'ily': 'y',
      'bly': 'ble',
      'ply': 'ple',
    },
    {
      'ally': 'al',
      'rply': 'rp',
    },
    {
      'ually': 'ual',
      'ially': 'ial',
      'cally': 'cal',
      'eally': 'eal',
      'rally': 'ral',
      'nally': 'nal',
      'mally': 'mal',
      'eeply': 'eep',
      'eaply': 'eap',
    },
    {
      ically: 'ic',
    }
  ];

  const noAdj = new Set([
    'early',
    'only',
    'hourly',
    'daily',
    'weekly',
    'monthly',
    'yearly',
    'mostly',
    'duly',
    'unduly',
    'especially',
    'undoubtedly',
    'conversely',
    'namely',
    'exceedingly',
    'presumably',
    'accordingly',
    'overly',
    'best',
    'latter',
    'little',
    'long',
    'low'
  ]);

  // exceptions to rules
  const exceptions$3 = {
    wholly: 'whole',
    fully: 'full',
    truly: 'true',
    gently: 'gentle',
    singly: 'single',
    customarily: 'customary',
    idly: 'idle',
    publically: 'public',
    quickly: 'fast',

    well: 'good',// -?
  };


  const toAdjective = function (str) {
    if (!str.endsWith('ly')) {
      return null
    }
    // 'electronic' vs 'electronical'
    if (ical.has(str)) {
      return str.replace(/ically/, 'ical')
    }
    if (noAdj.has(str)) {
      return null
    }
    if (exceptions$3.hasOwnProperty(str)) {
      return exceptions$3[str]
    }
    return doRules(str, suffixes$3) || str
  };
  var advToAdjective = toAdjective;

  // console.log(toAdjective('emphatically'))
  // console.log(toAdjective('usually'))
  // console.log(toAdjective('mechanically'))
  // console.log(toAdjective('vertically'))

  const suffixes$2 = [
    null,
    {
      y: 'ily'
    },
    {
      ly: 'ly',//unchanged
      ic: 'ically'
    },
    {
      ial: 'ially',
      ual: 'ually',
      tle: 'tly',
      ble: 'bly',
      ple: 'ply',
      ary: 'arily',
    },
    {},
    {},
    {},
  ];

  const exceptions$2 = {
    cool: 'cooly',
    whole: 'wholly',
    full: 'fully',
    good: 'well',
    idle: 'idly',
    public: 'publicly',
    single: 'singly',
    special: 'especially',
  };

  // a lot of adjectives *don't really* have a adverb
  // 'roomy' -> 'roomily'
  // but here, conjugate what it would be, if it made sense to
  const toAdverb = function (str) {
    if (exceptions$2.hasOwnProperty(str)) {
      return exceptions$2[str]
    }
    let res = doRules(str, suffixes$2);
    if (res) {
      return res
    }
    return str + 'ly'
  };
  var adjToAdverb = toAdverb;
  // console.log(toAdverb('unsightly'))

  const suffixes$1 = [
    null,
    {
      'y': 'iness',
    },
    {
      'le': 'ility',
      'al': 'ality',
      'ay': 'ayness',
    },
    {
      'ial': 'y',
      'ing': 'ment',
      'ess': 'essness',
      'ous': 'ousness',
      'ive': 'ivity',
      'ect': 'ection'
    },
    {
      'ting': 'ting',
      'ring': 'ring',
      'cial': 'ciality',
      'nate': 'nation',
      'rate': 'ration',
      'bing': 'bingness',
      'atic': 'acy',//democratic
      'sing': 'se',
      'iful': 'y',//beautify, merciful
      'ible': 'ibility'//credible
    },
    {
      'erate': 'eration'

    },
    {
      'ionate': 'ion'
    },
  ];

  const exceptions$1 = {
    clean: 'cleanliness',
    naive: 'naivety',
    dramatic: 'drama',
    ironic: 'irony',
    deep: 'depth',
    automatic: 'automation',
    simple: 'simplicity',
    boring: 'boredom',
    free: 'freedom',
    wise: 'wisdom',
    fortunate: 'fortune',
    gentle: 'gentleness',
    quiet: 'quiet',
    expensive: 'expense',
    offensive: 'offence'
  };

  const dontDo = new Set([
    'terrible',
    'annoying',
  ]);

  // a lot of adjectives *don't really* have a noun-form
  // 'broken' -> 'brokeness'?
  // 'surreal' -> 'surrealness'?
  // but here, conjugate what it would be, if it made sense to
  const toNoun = function (str) {
    if (exceptions$1.hasOwnProperty(str)) {
      return exceptions$1[str]
    }
    if (dontDo.has(str)) {
      return null
    }
    let res = doRules(str, suffixes$1);
    if (res) {
      return res
    }
    return str + 'ness'
  };
  var adjToNoun = toNoun;
  // console.log(toNoun('clever'))

  const adjToSuperlative = function (adj, model) {
    const mod = model.two.models.toSuperlative;
    return convert$1(adj, mod)
  };
  const adjToComparative = function (adj, model) {
    const mod = model.two.models.toComparative;
    return convert$1(adj, mod)
  };
  const adjFromComparative = function (adj, model) {
    const mod = model.two.models.fromComparative;
    return convert$1(adj, mod)
  };
  const adjFromSuperlative = function (adj, model) {
    const mod = model.two.models.fromSuperlative;
    return convert$1(adj, mod)
  };

  var transform = {
    nounToPlural, nounToSingular,
    verbToInfinitive: toInfinitive$7, getTense: getTense$2,
    verbConjugate: conjugate$1,

    adjToSuperlative, adjToComparative, adjFromSuperlative, adjFromComparative,

    advToAdjective, adjToAdverb, adjToNoun
  };

  // transformations to make on our lexicon
  var fancyThings = {
    // add plural forms of singular nouns
    Singular: (word, lex, methods, model) => {
      let already = model.one.lexicon;
      let plural = methods.two.transform.nounToPlural(word, model);
      if (!already[plural]) {
        lex[plural] = lex[plural] || 'Plural';
      }
    },

    // superlative/ comparative forms for adjectives
    Comparable: (word, lex, methods, model) => {
      let already = model.one.lexicon;
      // fast -> fastest
      let sup = methods.two.transform.adjToSuperlative(word, model);
      if (!already[sup]) {
        lex[sup] = lex[sup] || 'Superlative';
      }
      // fast -> faster
      let comp = methods.two.transform.adjToComparative(word, model);
      if (!already[comp]) {
        lex[comp] = lex[comp] || 'Comparative';
      }
      // overwrite
      lex[word] = 'Adjective';
    },

    // 'german' -> 'germans'
    Demonym: (word, lex, methods, model) => {
      let plural = methods.two.transform.nounToPlural(word, model);
      lex[plural] = lex[plural] || ['Demonym', 'Plural'];
    },

    // conjugate all forms of these verbs
    Infinitive: (word, lex, methods, model) => {
      let already = model.one.lexicon;
      let all = methods.two.transform.verbConjugate(word, model);
      Object.entries(all).forEach(a => {
        if (!already[a[1]] && !lex[a[1]]) {
          lex[a[1]] = a[0];
        }
      });
    },

    // 'walk up' should conjugate, too
    PhrasalVerb: (word, lex, methods, model) => {
      let already = model.one.lexicon;
      lex[word] = ['PhrasalVerb', 'Infinitive'];
      let _multi = model.one._multiCache;
      let [inf, rest] = word.split(' ');
      // add root verb
      if (!already[inf]) {
        lex[inf] = lex[inf] || 'Infinitive';
      }
      // conjugate it
      let all = methods.two.transform.verbConjugate(inf, model);
      Object.entries(all).forEach(a => {
        // not 'walker up', or 'had taken up'
        if (a[0] === 'Actor' || a[1] === '') {
          return
        }
        // add the root verb, alone
        if (!lex[a[1]] && !already[a[1]]) {
          lex[a[1]] = a[0];
        }
        _multi[a[1]] = true;
        let str = a[1] + ' ' + rest;
        lex[str] = lex[str] || [a[0], 'PhrasalVerb'];
      });
    },

    // expand 'million'
    Multiple: (word, lex) => {
      lex[word] = ['Multiple', 'Cardinal'];
      // 'millionth'
      lex[word + 'th'] = ['Multiple', 'Ordinal'];
      // 'millionths'
      lex[word + 'ths'] = ['Multiple', 'Fraction'];
    },
    // expand number-words
    Cardinal: (word, lex) => {
      lex[word] = ['TextValue', 'Cardinal'];
    },

    // 'millionth'
    Ordinal: (word, lex) => {
      lex[word] = ['TextValue', 'Ordinal'];
      lex[word + 's'] = ['TextValue', 'Fraction'];
    },
  };

  // derive clever things from our lexicon key-value pairs
  // this method runs as the pre-tagger plugin gets loaded
  const expand$1 = function (words, world) {
    const { methods, model } = world;
    let lex = {};
    // console.log('start:', Object.keys(lex).length)
    let _multi = {};
    // go through each word in this key-value obj:
    Object.keys(words).forEach(word => {
      let tag = words[word];
      // normalize lexicon a little bit
      word = word.toLowerCase().trim();
      word = word.replace(/'s\b/, '');
      // cache multi-word terms
      let split = word.split(/ /);
      if (split.length > 1) {
        _multi[split[0]] = true;
      }
      // do any clever-business, by it's tag
      if (fancyThings.hasOwnProperty(tag) === true) {
        fancyThings[tag](word, lex, methods, model);
      }
      lex[word] = lex[word] || tag;
    });
    // cleanup
    delete lex[''];
    delete lex[null];
    delete lex[' '];
    return { lex, _multi }
  };
  var expandLexicon$2 = expand$1;

  // roughly, split a document by comma or semicolon

  const splitOn = function (terms, i) {
    const isNum = /^[0-9]+$/;
    let term = terms[i];
    // early on, these may not be dates yet:
    if (!term) {
      return false
    }
    const maybeDate = new Set(['may', 'april', 'august', 'jan']);
    // veggies, like figs
    if (term.normal === 'like' || maybeDate.has(term.normal)) {
      return false
    }
    // toronto, canada  - tuesday, march
    if (term.tags.has('Place') || term.tags.has('Date')) {
      return false
    }
    if (terms[i - 1]) {
      if (terms[i - 1].tags.has('Date') || maybeDate.has(terms[i - 1].normal)) {
        return false
      }
    }
    // don't split numbers, yet
    let str = term.normal;
    if (str.length === 1 || str.length === 2 || str.length === 4) {
      if (isNum.test(str)) {
        return false
      }
    }
    return true
  };

  // kind-of a dirty sentence chunker
  const quickSplit = function (document) {
    const splitHere = /[,:;]/;
    let arr = [];
    document.forEach(terms => {
      let start = 0;
      terms.forEach((term, i) => {
        // does it have a comma/semicolon ?
        if (splitHere.test(term.post) && splitOn(terms, i + 1)) {
          arr.push(terms.slice(start, i + 1));
          start = i + 1;
        }
      });
      if (start < terms.length) {
        arr.push(terms.slice(start, terms.length));
      }
    });
    return arr
  };

  var quickSplit$1 = quickSplit;

  var methods$1 = {
    two: {
      quickSplit: quickSplit$1,
      expandLexicon: expandLexicon$2,
      transform,
    },
  };

  // import irregularVerbs from './conjugations.js'
  // harvest list of irregulars for any juicy word-data
  const expandIrregulars = function (model) {
    const { irregularPlurals } = model.two;
    const { lexicon } = model.one;
    Object.entries(irregularPlurals).forEach(a => {
      lexicon[a[0]] = lexicon[a[0]] || 'Singular';
      lexicon[a[1]] = lexicon[a[1]] || 'Plural';
    });
    return model
  };
  var expandIrregulars$1 = expandIrregulars;

  const getWords$2 = function (model, left, right) {
    return Object.entries(model.exceptions).reduce((h, a) => {
      if (left) {
        h[a[0]] = left;
      }
      h[a[1]] = right;
      return h
    }, {})
  };


  const expandModels = function (model) {
    let { lexicon } = model.one;
    const { toPast, toPresent, toGerund, toSuperlative, toComparative } = model.two.models;
    let res = {};
    let words = {};
    // past-tense
    words = getWords$2(toPast, 'Infinitive', 'PastTense');
    Object.assign(res, words);
    // present-tense
    words = getWords$2(toPresent, 'Infinitive', 'Verb');
    Object.assign(res, words);
    // gerund-form
    words = getWords$2(toGerund, 'Infinitive', 'Gerund');
    Object.assign(res, words);
    // superlative
    words = getWords$2(toSuperlative, 'Adjective', 'Superlative');
    Object.assign(res, words);
    // comparative
    words = getWords$2(toComparative, 'Adjective', 'Comparative');
    Object.assign(res, words);

    model.one.lexicon = Object.assign(res, lexicon);

    return model
  };
  var expandModels$1 = expandModels;

  let tmpModel = {
    two: { models }
  };

  // defaults for switches
  const switchDefaults = {
    // 'amusing'
    'Adj|Gerund': 'Adjective', //+conjugations
    // 'standard'
    'Adj|Noun': 'Adjective',
    // 'boiled'
    'Adj|Past': 'Adjective', //+conjugations
    // 'smooth'
    'Adj|Present': 'Adjective',//+conjugations
    // 'box'
    'Noun|Verb': 'Singular', //+conjugations (no-present)
    //'singing'
    'Noun|Gerund': 'Gerund', //+conjugations
    // 'hope'
    'Person|Noun': 'Noun',
    // 'April'
    'Person|Date': 'Month',
    // 'rob'
    'Person|Verb': 'Person',//+conjugations
    // 'victoria'
    'Person|Place': 'Person',
    // 'boxes'
    'Plural|Verb': 'Plural', //(these are already derivative)
    // 'miles'
    'Unit|Noun': 'Noun',
  };

  const expandLexicon = function (words, model) {
    // do clever tricks to grow the words
    const world = { model, methods: methods$1 };
    let { lex, _multi } = methods$1.two.expandLexicon(words, world);
    // store multiple-word terms in a cache
    Object.assign(model.one.lexicon, lex);
    Object.assign(model.one._multiCache, _multi);
    return model
  };

  // these words have no singular/plural conjugation
  const addUncountables = function (words, model) {
    Object.keys(words).forEach(k => {
      if (words[k] === 'Uncountable') {
        model.two.uncountable[k] = true;
        words[k] = 'Uncountable';
      }
    });
    return model
  };

  const expandVerb = function (str, words, doPresent) {
    let obj = conjugate$1(str, tmpModel);
    words[obj.PastTense] = words[obj.PastTense] || 'PastTense';
    words[obj.Gerund] = words[obj.Gerund] || 'Gerund';
    if (doPresent === true) {
      // is this plural noun, or present-tense?
      words[obj.PresentTense] = words[obj.PresentTense] || 'PresentTense';
    }
  };

  const expandAdjective = function (str, words, model) {
    let sup = adjToSuperlative(str, model);
    words[sup] = words[sup] || 'Superlative';
    let comp = adjToComparative(str, model);
    words[comp] = words[comp] || 'Comparative';
  };

  // harvest ambiguous words for any conjugations
  const expandVariable = function (switchWords, model) {
    let words = {};
    const lex = model.one.lexicon;
    //add first tag as an assumption for each variable word
    Object.keys(switchWords).forEach(w => {
      const name = switchWords[w];
      words[w] = switchDefaults[name];
      // conjugate some verbs
      if (name === 'Noun|Verb' || name === 'Person|Verb') {
        expandVerb(w, lex, false);
      }
      if (name === 'Adj|Present') {
        expandVerb(w, lex, true);
        expandAdjective(w, lex, model);
      }
      if (name === 'Adj|Gerund' || name === 'Noun|Gerund') {
        let inf = toInfinitive$7(w, tmpModel, 'Gerund');
        if (!lex[inf]) {
          words[inf] = 'Infinitive'; //expand it later
        }
      }
      if (name === 'Adj|Past') {
        let inf = toInfinitive$7(w, tmpModel, 'PastTense');
        if (!lex[inf]) {
          words[inf] = 'Infinitive'; //expand it later
        }
      }
    });
    // add conjugations
    model = expandLexicon(words, model);
    return model
  };

  const expand = function (model) {
    model = expandLexicon(model.one.lexicon, model);
    model = addUncountables(model.one.lexicon, model);
    model = expandVariable(model.two.switches, model);
    model = expandModels$1(model);
    model = expandIrregulars$1(model);
    return model
  };
  var expandLexicon$1 = expand;

  let model$1 = {
    one: {
      _multiCache: {},
      lexicon,
    },
    two: {
      irregularPlurals,
      models,

      suffixPatterns,
      prefixPatterns,
      endsWith,
      neighbours: neighbours$2,

      regexNormal,
      regexText,
      regexNumbers,

      switches: switches$1,
      clues: clues$1,

      uncountable: {},

      orgWords: orgWords$1,
    },

  };
  model$1 = expandLexicon$1(model$1);
  var model$2 = model$1;

  // console.log(model.one.lexicon.see)

  const prefix$1 = /^(under|over|mis|re|un|dis|semi)-?/;

  const tagSwitch = function (terms, i, model) {
    const switches = model.two.switches;
    let term = terms[i];
    if (switches.hasOwnProperty(term.normal)) {
      term.switch = switches[term.normal];
      return
    }
    // support 'restrike' -> 'strike'
    if (prefix$1.test(term.normal)) {
      let stem = term.normal.replace(prefix$1, '');
      if (stem.length > 3 && switches.hasOwnProperty(stem)) {
        term.switch = switches[stem];
      }
    }
  };
  var tagSwitch$1 = tagSwitch;

  // verbose-mode tagger debuging
  const log = (term, tag, reason = '') => {
    const yellow = str => '\x1b[33m\x1b[3m' + str + '\x1b[0m';
    const i = str => '\x1b[3m' + str + '\x1b[0m';
    let word = term.text || '[' + term.implicit + ']';
    if (typeof tag !== 'string' && tag.length > 2) {
      tag = tag.slice(0, 2).join(', #') + ' +'; //truncate the list of tags
    }
    tag = typeof tag !== 'string' ? tag.join(', #') : tag;
    console.log(` ${yellow(word).padEnd(24)} \x1b[32m→\x1b[0m #${tag.padEnd(22)}  ${i(reason)}`); // eslint-disable-line
  };

  // a faster version than the user-facing one in ./methods
  const setTag = function (term, tag, reason) {
    if (!tag || tag.length === 0) {
      return
    }
    // some logging for debugging
    const env = typeof process === 'undefined' || !process.env ? self.env || {} : process.env;
    if (env && env.DEBUG_TAGS) {
      log(term, tag, reason);
    }
    term.tags = term.tags || new Set();
    if (typeof tag === 'string') {
      term.tags.add(tag);
    } else {
      tag.forEach(tg => term.tags.add(tg));
    }
  };

  var fastTag = setTag;

  //similar to plural/singularize rules, but not the same
  const isPlural$4 = {
    e: [
      'mice',
      'louse',
      'antennae',
      'formulae',
      'nebulae',
      'vertebrae',
      'vitae',
    ],
    i: [
      'tia',
      'octopi',
      'viri',
      'radii',
      'nuclei',
      'fungi',
      'cacti',
      'stimuli',
    ],
    n: [
      'men',
    ],
    t: [
      'feet'
    ]
  };
  // plural words as exceptions to suffix-rules
  const exceptions = new Set([
    'formulas',
    'koalas',
    'israelis',
    'menus',
  ]);

  const notPlural$1 = [
    'bus',
    'mas',//christmas
    'was',
    'las',
    'ias',//alias
    'xas',
    'vas',
    'cis',//probocis
    'lis',
    'nis',//tennis
    'ois',
    'ris',
    'sis',//thesis
    'tis',//mantis, testis
    'xis',
    'aus',
    'cus',
    'eus',//nucleus
    'fus',//doofus
    'gus',//fungus
    'ius',//radius
    'lus',//stimulus
    'nus',
    'ous',
    'pus',//octopus
    'rus',//virus
    'sus',//census
    'tus',//status,cactus
    'xus',
    '\'s',
    'ss',
  ];

  const looksPlural = function (str) {
    // not long enough to be plural
    if (!str || str.length <= 3) {
      return false
    }
    // 'menus' etc
    if (exceptions.has(str)) {
      return true
    }
    let end = str[str.length - 1];
    // look at 'firemen'
    if (isPlural$4.hasOwnProperty(end)) {
      return isPlural$4[end].find(suff => str.endsWith(suff))
    }
    if (end !== 's') {
      return false
    }
    // look for 'virus'
    if (notPlural$1.find(suff => str.endsWith(suff))) {
      return false
    }
    // ends with an s, seems plural i guess.
    return true
  };
  var looksPlural$1 = looksPlural;

  // tags that are neither plural or singular
  const uncountable = [
    'Acronym',
    'Abbreviation',
    'ProperNoun',
    'Uncountable',
    'Possessive',
    'Pronoun',
    'Activity',
    'Honorific',
  ];
  // try to guess if each noun is a plural/singular
  const setPluralSingular = function (term) {
    if (!term.tags.has('Noun') || term.tags.has('Plural') || term.tags.has('Singular') || term.tags.has('Date')) {
      return
    }
    if (uncountable.find(tag => term.tags.has(tag))) {
      return
    }
    if (looksPlural$1(term.normal)) {
      fastTag(term, 'Plural', '3-plural-guess');
    } else {
      fastTag(term, 'Singular', '3-singular-guess');
    }
  };

  // try to guess the tense of a naked verb
  const setTense = function (term) {
    let tags = term.tags;
    if (tags.has('Verb') && tags.size === 1) {
      let guess = getTense$2(term.normal);
      if (guess) {
        fastTag(term, guess, '3-verb-tense-guess');
      }
    }
  };

  //add deduced parent tags to our terms
  const fillTags = function (terms, i, model) {
    let term = terms[i];
    //there is probably just one tag, but we'll allow more
    let tags = Array.from(term.tags);
    for (let k = 0; k < tags.length; k += 1) {
      if (model.one.tagSet[tags[k]]) {
        let toAdd = model.one.tagSet[tags[k]].parents;
        fastTag(term, toAdd, ` -inferred by #${tags[k]}`);
      }
    }
    // turn 'Noun' into Plural/Singular
    setPluralSingular(term);
    // turn 'Verb' into Present/PastTense
    setTense(term);
  };
  var fillTags$1 = fillTags;

  const titleCase$1 = /^\p{Lu}[\p{Ll}'’]/u;
  const hasNumber = /[0-9]/;

  const notProper = ['Date', 'Month', 'WeekDay', 'Unit'];

  // https://stackoverflow.com/a/267405/168877
  const romanNumeral = /^[IVXLCDM]{2,}$/;
  const romanNumValid = /^M{0,4}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/;
  const nope = {
    li: true,
    dc: true,
    md: true,
    dm: true,
    ml: true,
  };


  // if it's a unknown titlecase word, it's a propernoun
  const checkCase = function (terms, i, model) {
    let term = terms[i];
    // assume terms are already indexed
    term.index = term.index || [0, 0];
    let index = term.index[1];
    let str = term.text || ''; //need case info
    // titlecase and not first word of sentence
    if (index !== 0 && titleCase$1.test(str) === true && hasNumber.test(str) === false) {
      if (notProper.find(tag => term.tags.has(tag))) {
        return null
      }
      fillTags$1(terms, i, model);
      if (!term.tags.has('Noun')) {
        term.tags.clear();
      }
      fastTag(term, 'ProperNoun', '2-titlecase');
      return true
    }
    //roman numberals - XVII
    if (str.length >= 2 && romanNumeral.test(str) && romanNumValid.test(str) && !nope[term.normal]) {
      fastTag(term, 'RomanNumeral', '2-xvii');
      return true
    }

    return null
  };
  var checkCase$1 = checkCase;

  //sweep-through all suffixes
  const suffixLoop = function (str = '', suffixes = []) {
    const len = str.length;
    let max = 7;
    if (len <= max) {
      max = len - 1;
    }
    for (let i = max; i > 1; i -= 1) {
      let suffix = str.substring(len - i, len);
      if (suffixes[suffix.length].hasOwnProperty(suffix) === true) {
        // console.log(suffix)
        let tag = suffixes[suffix.length][suffix];
        return tag
      }
    }
    return null
  };

  // decide tag from the ending of the word
  const tagBySuffix = function (terms, i, model) {
    let term = terms[i];
    if (term.tags.size === 0) {
      let tag = suffixLoop(term.normal, model.two.suffixPatterns);
      if (tag !== null) {
        fastTag(term, tag, '2-suffix');
        term.confidence = 0.7;
        return true
      }
      // try implicit form of word, too
      if (term.implicit) {
        tag = suffixLoop(term.implicit, model.two.suffixPatterns);
        if (tag !== null) {
          fastTag(term, tag, '2-implicit-suffix');
          term.confidence = 0.7;
          return true
        }
      }
      // Infinitive suffix + 's' can be PresentTense
      // if (term.normal[term.normal.length - 1] === 's') {
      //   let str = term.normal.replace(/s$/, '')
      //   if (suffixLoop(str, model.two.suffixPatterns) === 'Infinitive') {
      //     console.log(str)
      //     fastTag(term, 'PresentTense', '2-implied-present')
      //     term.confidence = 0.5
      //     return true
      //   }
      // }
    }
    return null
  };
  var checkSuffix = tagBySuffix;

  const hasApostrophe = /['‘’‛‵′`´]/;

  // normal regexes
  const doRegs = function (str, regs) {
    for (let i = 0; i < regs.length; i += 1) {
      if (regs[i][0].test(str) === true) {
        return regs[i]
      }
    }
    return null
  };
  // suffix-regexes, indexed by last-character
  const doEndsWith = function (str = '', byEnd) {
    let char = str[str.length - 1];
    if (byEnd.hasOwnProperty(char) === true) {
      let regs = byEnd[char] || [];
      for (let r = 0; r < regs.length; r += 1) {
        if (regs[r][0].test(str) === true) {
          return regs[r]
        }
      }
    }
    return null
  };

  const checkRegex = function (terms, i, model, world) {
    const setTag = world.methods.one.setTag;
    let { regexText, regexNormal, regexNumbers, endsWith } = model.two;
    let term = terms[i];
    let normal = term.machine || term.normal;
    let text = term.text;
    // keep dangling apostrophe?
    if (hasApostrophe.test(term.post) && !hasApostrophe.test(term.pre)) {
      text += term.post.trim();
    }
    let arr = doRegs(text, regexText) || doRegs(normal, regexNormal);
    // hide a bunch of number regexes behind this one
    if (!arr && /[0-9]/.test(normal)) {
      arr = doRegs(normal, regexNumbers);
    }
    // only run endsWith if we're desperate
    if (!arr && term.tags.size === 0) {
      arr = doEndsWith(normal, endsWith);
    }
    if (arr) {
      setTag([term], arr[1], world, null, `2-regex-'${arr[2] || arr[0]}'`);
      term.confidence = 0.6;
      return true
    }
    return null
  };
  var checkRegex$1 = checkRegex;

  // const prefixes = /^(anti|re|un|non|extra|inter|intra|over)([a-z-]{3})/

  //sweep-through all prefixes
  const prefixLoop = function (str = '', prefixes = []) {
    const len = str.length;
    let max = 7;
    if (max > len - 3) {
      max = len - 3;
    }
    for (let i = max; i > 2; i -= 1) {
      let prefix = str.substring(0, i);
      if (prefixes[prefix.length].hasOwnProperty(prefix) === true) {
        let tag = prefixes[prefix.length][prefix];
        return tag
      }
    }
    return null
  };

  // give 'overwork' the same tag as 'work'
  const checkPrefix = function (terms, i, model) {
    let term = terms[i];
    if (term.tags.size === 0) {
      let tag = prefixLoop(term.normal, model.two.prefixPatterns);
      if (tag !== null) {
        // console.log(term.normal, '->', tag)
        fastTag(term, tag, '2-prefix');
        term.confidence = 0.5;
        return true
      }
    }
    return null
  };
  var checkPrefix$1 = checkPrefix;

  const min = 1400;
  const max = 2100;

  const dateWords = new Set([
    'in',
    'on',
    'by',
    'until',
    'for',
    'to',
    'during',
    'throughout',
    'through',
    'within',
    'before',
    'after',
    'of',
    'this',
    'next',
    'last',
    'circa',
    'around',
    'post',
    'pre',
    'budget',
    'classic',
    'plan',
    'may'
  ]);

  const seemsGood = function (term) {
    if (!term) {
      return false
    }
    let str = term.normal || term.implicit;
    if (dateWords.has(str)) {
      return true
    }
    if (term.tags.has('Date') || term.tags.has('Month') || term.tags.has('WeekDay') || term.tags.has('Year')) {
      return true
    }
    // 1999 Film Festival
    if (term.tags.has('ProperNoun')) {
      return true
    }
    return false
  };

  const seemsOkay = function (term) {
    if (!term) {
      return false
    }
    if (term.tags.has('Ordinal')) {
      return true
    }
    // untagged 'june 13 2007'
    if (term.tags.has('Cardinal') && term.normal.length < 3) {
      return true
    }
    // 2020 was ..
    if (term.normal === 'is' || term.normal === 'was') {
      return true
    }
    return false
  };

  const seemsFine = function (term) {
    return term && (term.tags.has('Date') || term.tags.has('Month') || term.tags.has('WeekDay') || term.tags.has('Year'))
  };

  // recognize '1993' as a year
  const tagYear = function (terms, i) {
    const term = terms[i];
    if (term.tags.has('NumericValue') && term.tags.has('Cardinal') && term.normal.length === 4) {
      let num = Number(term.normal);
      // number between 1400 and 2100
      if (num && !isNaN(num)) {
        if (num > min && num < max) {
          let lastTerm = terms[i - 1];
          let nextTerm = terms[i + 1];
          if (seemsGood(lastTerm) || seemsGood(nextTerm)) {
            return fastTag(term, 'Year', '2-tagYear')
          }
          // or is it really-close to a year?
          if (num >= 1920 && num < 2025) {
            // look at neighbours
            if (seemsOkay(lastTerm) || seemsOkay(nextTerm)) {
              return fastTag(term, 'Year', '2-tagYear-close')
            }
            // look at far-neighbours
            if (seemsFine(terms[i - 2]) || seemsFine(terms[i + 2])) {
              return fastTag(term, 'Year', '2-tagYear-far')
            }
            // 'the 2002 hit', 'my 1950 convertable'
            if (lastTerm && (lastTerm.tags.has('Determiner') || lastTerm.tags.has('Possessive'))) {
              if (nextTerm && nextTerm.tags.has('Noun') && !nextTerm.tags.has('Plural')) {
                return fastTag(term, 'Year', '2-tagYear-noun')
              }
            }
          }
        }
      }
    }
    return null
  };

  var checkYear = tagYear;

  const oneLetterAcronym = /^[A-Z]('s|,)?$/;
  const isUpperCase = /^[A-Z-]+$/;
  const periodAcronym = /([A-Z]\.)+[A-Z]?,?$/;
  const noPeriodAcronym = /[A-Z]{2,}('s|,)?$/;
  const lowerCaseAcronym = /([a-z]\.)+[a-z]\.?$/;

  const oneLetterWord = {
    I: true,
    A: true,
  };
  // just uppercase acronyms, no periods - 'UNOCHA'
  const isNoPeriodAcronym = function (term, model) {
    let str = term.text;
    // ensure it's all upper-case
    if (isUpperCase.test(str) === false) {
      return false
    }
    // long capitalized words are not usually either
    if (str.length > 5) {
      return false
    }
    // 'I' is not a acronym
    if (oneLetterWord.hasOwnProperty(str)) {
      return false
    }
    // known-words, like 'PIZZA' is not an acronym.
    if (model.one.lexicon.hasOwnProperty(term.normal)) {
      return false
    }
    //like N.D.A
    if (periodAcronym.test(str) === true) {
      return true
    }
    //like c.e.o
    if (lowerCaseAcronym.test(str) === true) {
      return true
    }
    //like 'F.'
    if (oneLetterAcronym.test(str) === true) {
      return true
    }
    //like NDA
    if (noPeriodAcronym.test(str) === true) {
      return true
    }
    return false
  };

  const isAcronym = function (terms, i, model) {
    let term = terms[i];
    //these are not acronyms
    if (term.tags.has('RomanNumeral') || term.tags.has('Acronym')) {
      return null
    }
    //non-period ones are harder
    if (isNoPeriodAcronym(term, model)) {
      term.tags.clear();
      fastTag(term, ['Acronym', 'Noun'], '3-no-period-acronym');
      return true
    }
    // one-letter acronyms
    if (!oneLetterWord.hasOwnProperty(term.text) && oneLetterAcronym.test(term.text)) {
      term.tags.clear();
      fastTag(term, ['Acronym', 'Noun'], '3-one-letter-acronym');
      return true
    }
    //if it's a very-short organization?
    if (term.tags.has('Organization') && term.text.length <= 3) {
      fastTag(term, 'Acronym', '3-org-acronym');
      return true
    }
    // upper-case org, like UNESCO
    if (term.tags.has('Organization') && isUpperCase.test(term.text) && term.text.length <= 6) {
      fastTag(term, 'Acronym', '3-titlecase-acronym');
      return true
    }
    return null
  };
  var checkAcronym = isAcronym;

  const lookAtWord = function (term, words) {
    if (!term) {
      return null
    }
    // look at prev word <-
    let found = words.find(a => term.normal === a[0]);
    if (found) {
      return found[1]
    }
    return null
  };

  const lookAtTag = function (term, tags) {
    if (!term) {
      return null
    }
    let found = tags.find(a => term.tags.has(a[0]));
    if (found) {
      return found[1]
    }
    return null
  };

  // look at neighbours for hints on unknown words
  const neighbours = function (terms, i, model) {
    const { leftTags, leftWords, rightWords, rightTags } = model.two.neighbours;
    let term = terms[i];
    if (term.tags.size === 0) {
      let tag = null;
      // look left <-
      tag = tag || lookAtWord(terms[i - 1], leftWords);
      // look right ->
      tag = tag || lookAtWord(terms[i + 1], rightWords);
      // look left <-
      tag = tag || lookAtTag(terms[i - 1], leftTags);
      // look right ->
      tag = tag || lookAtTag(terms[i + 1], rightTags);
      if (tag) {
        fastTag(term, tag, '3-[neighbour]');
        fillTags$1(terms, i, model);
        terms[i].confidence = 0.2;
        return true
      }
    }
    return null
  };
  var neighbours$1 = neighbours;

  const isTitleCase = (str) => /^\p{Lu}[\p{Ll}'’]/u.test(str);

  const isOrg = function (term, i) {
    if (!term) {
      return false
    }
    if (term.tags.has('FirstName') || term.tags.has('Place')) {
      return false
    }
    if (term.tags.has('ProperNoun') || term.tags.has('Organization') || term.tags.has('Acronym')) {
      return true
    }
    // allow anything titlecased to be an org
    if (isTitleCase(term.text)) {
      // only tag a titlecased first-word, if it checks-out
      if (i === 0) {
        return term.tags.has('Singular')
      }
      return true
    }
    return false
  };

  const tagOrgs = function (terms, i, world) {
    const orgWords = world.model.two.orgWords;
    const setTag = world.methods.one.setTag;
    let term = terms[i];
    let str = term.machine || term.normal;
    if (orgWords[str] === true && isOrg(terms[i - 1])) {
      setTag([terms[i]], 'Organization', world, null, '3-[org-word]');
      // loop backwards, tag organization-like things
      for (let t = i; t >= 0; t -= 1) {
        if (isOrg(terms[t], t)) {
          setTag([terms[t]], 'Organization', world, null, '3-[org-word]');
        } else {
          break
        }
      }
    }
    return null
  };
  var orgWords = tagOrgs;

  const nounFallback = function (terms, i, model) {
    if (terms[i].tags.size === 0) {
      fastTag(terms[i], 'Noun', '3-[fallback]');
      // try to give it singluar/plural tags, too
      fillTags$1(terms, i, model);
      terms[i].confidence = 0.1;
    }
  };
  var nounFallback$1 = nounFallback;

  const isCapital = (terms, i) => {
    if (terms[i].tags.has('ProperNoun')) {// 'Comfort Inn'
      return 'Noun'
    }
    return null
  };
  const isAloneVerb = (terms, i, tag) => {
    if (i === 0 && !terms[1]) {// 'Help'
      return tag
    }
    return null
  };

  // 'a rental'
  const isEndNoun = function (terms, i) {
    if (!terms[i + 1] && terms[i - 1] && terms[i - 1].tags.has('Determiner')) {
      return 'Noun'
    }
    return null
  };

  const adhoc = {
    'Adj|Gerund': (terms, i) => {
      return isCapital(terms, i)
    },
    'Adj|Noun': (terms, i) => {
      return isCapital(terms, i) || isEndNoun(terms, i)
    },
    'Adj|Past': (terms, i) => {
      return isCapital(terms, i)
    },
    'Adj|Present': (terms, i) => {
      return isCapital(terms, i)
    },
    'Noun|Gerund': (terms, i) => {
      return isCapital(terms, i)
    },
    'Noun|Verb': (terms, i) => {
      return isCapital(terms, i) || isAloneVerb(terms, i, 'Infinitive')
    },
    'Plural|Verb': (terms, i) => {
      return isCapital(terms, i) || isAloneVerb(terms, i, 'PresentTense')
    },
    'Person|Noun': (terms, i) => {
      return isCapital(terms, i)
    },
    'Person|Verb': (terms, i) => {
      return i !== 0 && isCapital(terms, i)
    },
  };
  var adhoc$1 = adhoc;

  const env = typeof process === 'undefined' || !process.env ? self.env || {} : process.env; // eslint-disable-line
  const prefix = /^(under|over|mis|re|un|dis|semi)-?/;

  const checkWord = (term, obj) => {
    if (!term || !obj) {
      return null
    }
    let str = term.normal || term.implicit;
    const found = obj[str];
    if (found && env.DEBUG_TAGS) {
      console.log(`\n  \x1b[2m\x1b[3m     ↓ - '${str}' \x1b[0m`);//eslint-disable-line
    }
    return found
  };

  const checkTag = (term, obj = {}, tagSet) => {
    if (!term || !obj) {
      return null
    }
    // rough sort, so 'Noun' is after ProperNoun, etc
    let tags = Array.from(term.tags).sort((a, b) => {
      let numA = tagSet[a] ? tagSet[a].parents.length : 0;
      let numB = tagSet[b] ? tagSet[b].parents.length : 0;
      return numA > numB ? -1 : 1
    });
    let found = tags.find(tag => obj[tag]);
    if (found && env.DEBUG_TAGS) {
      console.log(`  \x1b[2m\x1b[3m      ↓ - '${term.normal || term.implicit}' (#${found})  \x1b[0m`);//eslint-disable-line
    }
    found = obj[found];
    return found
  };

  const pickTag = function (terms, i, clues, model) {
    if (!clues) {
      return null
    }
    const tagSet = model.one.tagSet;
    // look -> right word, first
    let tag = checkWord(terms[i + 1], clues.afterWords);
    // look <- left word, second
    tag = tag || checkWord(terms[i - 1], clues.beforeWords);
    // look <- left tag 
    tag = tag || checkTag(terms[i - 1], clues.beforeTags, tagSet);
    // look -> right tag
    tag = tag || checkTag(terms[i + 1], clues.afterTags, tagSet);
    // console.log(clues)
    return tag
  };

  // words like 'bob' that can change between two tags
  const doSwitches = function (terms, i, world) {
    const model = world.model;
    const setTag = world.methods.one.setTag;
    const { switches, clues } = model.two;
    const term = terms[i];
    let str = term.normal || term.implicit || '';
    // support prefixes for switching words
    if (prefix.test(str) && !switches[str]) {
      str = str.replace(prefix, ''); // could use some guards, here
    }
    if (term.switch) {
      let form = term.switch;
      // skip propernouns, acronyms, etc
      if (term.tags.has('Acronym') || term.tags.has('PhrasalVerb')) {
        return
      }
      let tag = pickTag(terms, i, clues[form], model);
      // lean-harder on some variable forms
      if (adhoc$1[form]) {
        tag = adhoc$1[form](terms, i) || tag;
      }
      // did we find anything?
      if (tag) {
        // tag it
        setTag([term], tag, world, null, `3-[variable] (${form})`);
        // add plural/singular etc.
        fillTags$1(terms, i, model);
      } else if (env.DEBUG_TAGS) {
        console.log(`\n -> X  - '${str}'  : (${form})  `);//eslint-disable-line
      }
    }
  };
  var switches = doSwitches;

  // 'out lived' is a verb-phrase
  // 'over booked' is too
  // 'macro-nutrient', too
  const doPrefix = function (terms, i, model) {
    let nextTerm = terms[i + 1];
    if (!nextTerm) {
      return
    }
    let { prefixes } = model.one;
    let term = terms[i];

    // word like 'over'
    if (prefixes[term.normal] === true) {
      // 'over cooked'
      if (nextTerm.tags.has('Verb')) {
        fastTag(term, 'Verb', '3-[prefix]');
        fastTag(term, 'Prefix', '3-[prefix]');
      }
      // 'pseudo clean'
      if (nextTerm.tags.has('Adjective')) {
        fastTag(term, 'Adjective', '3-[prefix]');
        fastTag(term, 'Prefix', '3-[prefix]');
      }
    }

  };
  var checkHyphen = doPrefix;

  const second = {
    tagSwitch: tagSwitch$1,
    checkSuffix,
    checkRegex: checkRegex$1,
    checkCase: checkCase$1,
    checkPrefix: checkPrefix$1,
    checkHyphen,
    checkYear,
  };

  const third = {
    checkAcronym,
    neighbours: neighbours$1,
    orgWords,
    nounFallback: nounFallback$1,
    switches,
  };

  //
  // these methods don't care about word-neighbours
  const secondPass = function (terms, model, world) {
    for (let i = 0; i < terms.length; i += 1) {
      // mark Noun|Verb on term metadata
      second.tagSwitch(terms, i, model);
      //  is it titlecased?
      second.checkCase(terms, i, model);
      // look at word ending
      second.checkSuffix(terms, i, model);
      // try look-like rules
      second.checkRegex(terms, i, model, world);
      // check for recognized prefix, like 'micro-'
      second.checkPrefix(terms, i, model);
      // turn '1993' into a year
      second.checkYear(terms, i, model);
    }
  };

  const thirdPass = function (terms, model, world) {
    for (let i = 0; i < terms.length; i += 1) {
      // let these tags get layered
      let found = third.checkAcronym(terms, i, model);
      // deduce parent tags
      fillTags$1(terms, i, model);
      // look left+right for hints
      found = found || third.neighbours(terms, i, model);
      //  ¯\_(ツ)_/¯ - found nothing
      found = found || third.nounFallback(terms, i, model);
    }
    for (let i = 0; i < terms.length; i += 1) {
      // Johnson LLC
      third.orgWords(terms, i, world);
      // support 'out-lived'
      second.checkHyphen(terms, i, model);
      // verb-noun disambiguation, etc
      third.switches(terms, i, world);
    }
  };

  const preTagger = function (view) {
    const { methods, model, world } = view;
    // assign known-words
    // view.compute('lexicon')
    // roughly split sentences up by clause
    let document = methods.two.quickSplit(view.docs);
    // start with all terms
    for (let n = 0; n < document.length; n += 1) {
      let terms = document[n];
      // firstPass(terms, model)
      // guess by the letters
      secondPass(terms, model, world);
      // guess by the neighbours
      thirdPass(terms, model, world);
    }
    return document
  };

  var preTagger$1 = preTagger;

  const toRoot$1 = {
    // 'spencer's' -> 'spencer'
    'Possessive': (term) => {
      let str = term.machine || term.normal || term.text;
      str = str.replace(/'s$/, '');
      return str
    },
    // 'drinks' -> 'drink'
    'Plural': (term, world) => {
      let str = term.machine || term.normal || term.text;
      return world.methods.two.transform.nounToSingular(str, world.model)
    },
    // ''
    'Copula': () => {
      return 'is'
    },
    // 'walked' -> 'walk'
    'PastTense': (term, world) => {
      let str = term.machine || term.normal || term.text;
      return world.methods.two.transform.verbToInfinitive(str, world.model, 'PastTense')
    },
    // 'walking' -> 'walk'
    'Gerund': (term, world) => {
      let str = term.machine || term.normal || term.text;
      return world.methods.two.transform.verbToInfinitive(str, world.model, 'Gerund')
    },
    // 'walks' -> 'walk'
    'PresentTense': (term, world) => {
      let str = term.machine || term.normal || term.text;
      if (term.tags.has('Infinitive')) {
        return str
      }
      return world.methods.two.transform.verbToInfinitive(str, world.model, 'PresentTense')
    },
    // 'quieter' -> 'quiet'
    'Comparative': (term, world) => {
      let str = term.machine || term.normal || term.text;
      return world.methods.two.transform.adjFromComparative(str, world.model)
    },
    // 'quietest' -> 'quiet'
    'Superlative': (term, world) => {
      let str = term.machine || term.normal || term.text;
      return world.methods.two.transform.adjFromSuperlative(str, world.model)
    },
    // 'suddenly' -> 'sudden'
    'Adverb': (term, world) => {
      const toAdj = world.methods.two.transform.advToAdjective;
      let str = term.machine || term.normal || term.text;
      return toAdj(str)
    },
  };

  const getRoot$2 = function (view) {
    const world = view.world;
    const keys = Object.keys(toRoot$1);
    view.docs.forEach(terms => {
      for (let i = 0; i < terms.length; i += 1) {
        const term = terms[i];
        for (let k = 0; k < keys.length; k += 1) {
          if (term.tags.has(keys[k])) {
            const fn = toRoot$1[keys[k]];
            let root = fn(term, world);
            if (term.normal !== root) {
              term.root = root;
            }
            break
          }
        }
      }
    });
  };
  var root = getRoot$2;

  // rough connection between compromise tagset and Penn Treebank
  // https://www.ling.upenn.edu/courses/Fall_2003/ling001/penn_treebank_pos.html

  const mapping$1 = {
    // adverbs
    // 'Comparative': 'RBR',
    // 'Superlative': 'RBS',
    'Adverb': 'RB',

    // adjectives
    'Comparative': 'JJR',
    'Superlative': 'JJS',
    'Adjective': 'JJ',
    'TO': 'Conjunction',

    // verbs
    'Modal': 'MD',
    'Auxiliary': 'MD',
    'Gerund': 'VBG', //throwing
    'PastTense': 'VBD', //threw
    'Participle': 'VBN', //thrown
    'PresentTense': 'VBZ', //throws
    'Infinitive': 'VB', //throw
    'Particle': 'RP', //phrasal particle
    'Verb': 'VB', // throw

    // pronouns
    'Pronoun': 'PRP',

    // misc
    'Cardinal': 'CD',
    'Conjunction': 'CC',
    'Determiner': 'DT',
    'Preposition': 'IN',
    // 'Determiner': 'WDT',
    // 'Expression': 'FW',
    'QuestionWord': 'WP',
    'Expression': 'UH',

    //nouns
    'Possessive': 'POS',
    'ProperNoun': 'NNP',
    'Person': 'NNP',
    'Place': 'NNP',
    'Organization': 'NNP',
    'Singular': 'NNP',
    'Plural': 'NNS',
    'Noun': 'NN',

    // 'Noun':'EX', //'there'
    // 'Adverb':'WRB',
    // 'Noun':'PDT', //predeterminer
    // 'Noun':'SYM', //symbol
    // 'Noun':'NFP', //

    //  WDT 	Wh-determiner
    // 	WP 	Wh-pronoun
    // 	WP$ 	Possessive wh-pronoun
    // 	WRB 	Wh-adverb 
  };

  const toPenn = function (term) {
    // try some ad-hoc ones
    if (term.tags.has('ProperNoun') && term.tags.has('Plural')) {
      return 'NNPS'
    }
    if (term.tags.has('Possessive') && term.tags.has('Pronoun')) {
      return 'PRP$'
    }
    if (term.normal === 'there') {
      return 'EX'
    }
    if (term.normal === 'to') {
      return 'TO'
    }
    // run through an ordered list of tags
    let arr = term.tagRank || [];
    for (let i = 0; i < arr.length; i += 1) {
      if (mapping$1.hasOwnProperty(arr[i])) {
        return mapping$1[arr[i]]
      }
    }
    return null
  };

  const pennTag = function (view) {
    view.compute('tagRank');
    view.docs.forEach(terms => {
      terms.forEach(term => {
        term.penn = toPenn(term);
      });
    });
  };
  var penn = pennTag;

  var compute$3 = { preTagger: preTagger$1, root, penn };

  const entity = ['Person', 'Place', 'Organization'];

  var nouns$1 = {
    Noun: {
      not: ['Verb', 'Adjective', 'Adverb', 'Value', 'Determiner'],
    },
    Singular: {
      is: 'Noun',
      not: ['Plural', 'Uncountable'],
    },
    // 'Canada'
    ProperNoun: {
      is: 'Noun',
    },
    Person: {
      is: 'Singular',
      also: ['ProperNoun'],
      not: ['Place', 'Organization', 'Date'],
    },
    FirstName: {
      is: 'Person',
    },
    MaleName: {
      is: 'FirstName',
      not: ['FemaleName', 'LastName'],
    },
    FemaleName: {
      is: 'FirstName',
      not: ['MaleName', 'LastName'],
    },
    LastName: {
      is: 'Person',
      not: ['FirstName'],
    },
    // 'dr.'
    Honorific: {
      is: 'Noun',
      not: ['FirstName', 'LastName', 'Value'],
    },
    Place: {
      is: 'Singular',
      not: ['Person', 'Organization'],
    },
    Country: {
      is: 'Place',
      also: ['ProperNoun'],
      not: ['City'],
    },
    City: {
      is: 'Place',
      also: ['ProperNoun'],
      not: ['Country'],
    },
    // 'california'
    Region: {
      is: 'Place',
      also: ['ProperNoun'],
    },
    Address: {
      // is: 'Place',
    },
    Organization: {
      is: 'ProperNoun',
      not: ['Person', 'Place'],
    },
    SportsTeam: {
      is: 'Organization',
    },
    School: {
      is: 'Organization',
    },
    Company: {
      is: 'Organization',
    },
    Plural: {
      is: 'Noun',
      not: ['Singular', 'Uncountable'],
    },
    // 'gravity'
    Uncountable: {
      is: 'Noun',
    },
    // 'it'
    Pronoun: {
      is: 'Noun',
      not: entity,
    },
    // 'swimmer'
    Actor: {
      is: 'Noun',
      not: entity,
    },
    // walking
    Activity: {
      is: 'Noun',
      not: ['Person', 'Place'],
    },
    // kilometres
    Unit: {
      is: 'Noun',
      not: entity,
    },
    // canadian
    Demonym: {
      is: 'Noun',
      also: ['ProperNoun'],
      not: entity,
    },
    // [spencer's] hat
    Possessive: {
      is: 'Noun',
    },
    // 'yourself'
    Reflexive: {
      is: 'Pronoun',
    },
  };

  var verbs$2 = {
    Verb: {
      not: ['Noun', 'Adjective', 'Adverb', 'Value', 'Expression'],
    },
    // 'he [walks]'
    PresentTense: {
      is: 'Verb',
      not: ['PastTense'],
    },
    // 'will [walk]'
    Infinitive: {
      is: 'PresentTense',
      not: ['Gerund'],
    },
    // '[walk] now!'
    Imperative: {
      is: 'Infinitive',
    },
    // walking
    Gerund: {
      is: 'PresentTense',
      not: ['Copula'],
    },
    // walked
    PastTense: {
      is: 'Verb',
      not: ['PresentTense', 'Gerund'],
    },
    // is/was
    Copula: {
      is: 'Verb',
    },
    // '[could] walk'
    Modal: {
      is: 'Verb',
      not: ['Infinitive'],
    },
    // 'awaken'
    Participle: {
      is: 'PastTense',
    },
    // '[will have had] walked'
    Auxiliary: {
      is: 'Verb',
      not: ['PastTense', 'PresentTense', 'Gerund', 'Conjunction'],
    },
    // 'walk out'
    PhrasalVerb: {
      is: 'Verb',
    },
    // 'walk [out]'
    Particle: {
      is: 'PhrasalVerb',
      not: ['PastTense', 'PresentTense', 'Copula', 'Gerund'],
    },
  };

  var values = {
    Value: {
      not: ['Verb', 'Adjective', 'Adverb'],
    },
    Ordinal: {
      is: 'Value',
      not: ['Cardinal'],
    },
    Cardinal: {
      is: 'Value',
      not: ['Ordinal'],
    },
    Fraction: {
      is: 'Value',
      not: ['Noun'],
    },
    Multiple: {
      is: 'TextValue',
    },
    RomanNumeral: {
      is: 'Cardinal',
      not: ['TextValue'],
    },
    TextValue: {
      is: 'Value',
      not: ['NumericValue'],
    },
    NumericValue: {
      is: 'Value',
      not: ['TextValue'],
    },
    Money: {
      is: 'Cardinal',
    },
    Percent: {
      is: 'Value',
    },
  };

  var dates$1 = {
    Date: {
      not: ['Verb', 'Adverb', 'Adjective'],
    },
    Month: {
      is: 'Singular',
      also: ['Date'],
      not: ['Year', 'WeekDay', 'Time'],
    },
    WeekDay: {
      is: 'Noun',
      also: ['Date'],
    },
    Year: {
      is: 'Date',
      not: ['RomanNumeral'],
    },
    FinancialQuarter: {
      is: 'Date',
      not: 'Fraction',
    },
    // 'easter'
    Holiday: {
      is: 'Date',
      also: ['Noun'],
    },
    // 'summer'
    Season: {
      is: 'Date',
    },
    Timezone: {
      is: 'Noun',
      also: ['Date'],
      not: ['ProperNoun'],
    },
    Time: {
      is: 'Date',
      not: ['AtMention'],
    },
    // 'months'
    Duration: {
      is: 'Date',
      also: ['Noun'],
    },
  };

  const anything = ['Noun', 'Verb', 'Adjective', 'Adverb', 'Value', 'QuestionWord'];

  var misc$2 = {
    Adjective: {
      not: ['Noun', 'Verb', 'Adverb', 'Value'],
    },
    Comparable: {
      is: 'Adjective',
    },
    Comparative: {
      is: 'Adjective',
    },
    Superlative: {
      is: 'Adjective',
      not: ['Comparative'],
    },
    NumberRange: {},
    Adverb: {
      not: ['Noun', 'Verb', 'Adjective', 'Value'],
    },

    Determiner: {
      not: ['Noun', 'Verb', 'Adjective', 'Adverb', 'QuestionWord', 'Conjunction'], //allow 'a' to be a Determiner/Value
    },
    Conjunction: {
      not: anything,
    },
    Preposition: {
      not: ['Noun', 'Verb', 'Adjective', 'Adverb', 'QuestionWord', 'Determiner'],
    },
    QuestionWord: {
      not: ['Determiner'],
    },
    Currency: {
      is: 'Noun',
    },
    Expression: {
      not: ['Noun', 'Adjective', 'Verb', 'Adverb'],
    },
    Abbreviation: {},
    Url: {
      not: ['HashTag', 'PhoneNumber', 'Verb', 'Adjective', 'Value', 'AtMention', 'Email'],
    },
    PhoneNumber: {
      not: ['HashTag', 'Verb', 'Adjective', 'Value', 'AtMention', 'Email'],
    },
    HashTag: {},
    AtMention: {
      is: 'Noun',
      not: ['HashTag', 'Email'],
    },
    Emoji: {
      not: ['HashTag', 'Verb', 'Adjective', 'Value', 'AtMention'],
    },
    Emoticon: {
      not: ['HashTag', 'Verb', 'Adjective', 'Value', 'AtMention'],
    },
    Email: {
      not: ['HashTag', 'Verb', 'Adjective', 'Value', 'AtMention'],
    },
    Acronym: {
      not: ['Plural', 'RomanNumeral'],
    },
    Negative: {
      not: ['Noun', 'Adjective', 'Value', 'Expression'],
    },
    Condition: {
      not: ['Verb', 'Adjective', 'Noun', 'Value'],
    }
  };

  let allTags = Object.assign({}, nouns$1, verbs$2, values, dates$1, misc$2);
  // const tagSet = compute(allTags)
  var tags = allTags;

  var preTag = {
    compute: compute$3,
    methods: methods$1,
    model: model$2,
    tags,
    hooks: ['preTagger'],
  };

  const postPunct = /[,)"';:\-–—.…]/;

  const setContraction = function (m, suffix) {
    if (!m.found) {
      return
    }
    let terms = m.termList();
    //avoid any problematic punctuation
    for (let i = 0; i < terms.length - 1; i++) {
      const t = terms[i];
      if (postPunct.test(t.post)) {
        return
      }
    }
    // set first word as full text
    terms[0].implicit = terms[0].normal;
    terms[0].text += suffix;
    terms[0].normal += suffix;
    // clean-up the others
    terms.slice(1).forEach(t => {
      t.implicit = t.normal;
      t.text = '';
      t.normal = '';
    });
    for (let i = 0; i < terms.length - 1; i++) {
      terms[i].post = terms[i].post.replace(/ /, '');
    }
  };

  /** turn 'i am' into i'm */
  const contract = function () {
    let doc = this.not('@hasContraction');
    // we are -> we're
    let m = doc.match('(we|they|you) are');
    setContraction(m, `'re`);
    // they will -> they'll
    m = doc.match('(he|she|they|it|we|you) will');
    setContraction(m, `'ll`);
    // she is -> she's
    m = doc.match('(he|she|they|it|we) is');
    setContraction(m, `'s`);
    // spencer is -> spencer's
    m = doc.match('#Person is');
    setContraction(m, `'s`);
    // spencer would -> spencer'd
    m = doc.match('#Person would');
    setContraction(m, `'d`);
    // would not -> wouldn't
    m = doc.match('(is|was|had|would|should|could|do|does|have|has|can) not');
    setContraction(m, `n't`);
    // i have -> i've
    m = doc.match('(i|we|they) have');
    setContraction(m, `'ve`);
    // would have -> would've
    m = doc.match('(would|should|could) have');
    setContraction(m, `'ve`);
    // i am -> i'm
    m = doc.match('i am');
    setContraction(m, `'m`);
    // going to -> gonna
    m = doc.match('going to');
    return this
  };
  var contract$1 = contract;

  const titleCase = /^\p{Lu}[\p{Ll}'’]/u; //upercase, then lowercase

  const toTitleCase = function (str = '') {
    str = str.replace(/^ *[a-z\u00C0-\u00FF]/, x => x.toUpperCase()); //TODO: support unicode
    return str
  };

  const api$l = function (View) {
    /** */
    class Contractions extends View {
      constructor(document, pointer, groups) {
        super(document, pointer, groups);
        this.viewType = 'Contraction';
      }
      /** i've -> 'i have' */
      expand() {
        this.docs.forEach(terms => {
          let isTitleCase = titleCase.test(terms[0].text);
          terms.forEach((t, i) => {
            t.text = t.implicit;
            delete t.implicit;
            //add whitespace
            if (i < terms.length - 1 && t.post === '') {
              t.post += ' ';
            }
            // flag it as dirty
            t.dirty = true;
          });
          // make the first word title-case?
          if (isTitleCase) {
            terms[0].text = toTitleCase(terms[0].text);
          }
        });
        this.compute('normal'); //re-set normalized text
        return this
      }
    }
    // add fn to View
    View.prototype.contractions = function () {
      let m = this.match('@hasContraction+');
      return new Contractions(this.document, m.pointer)
    };
    View.prototype.contract = contract$1;
  };

  var api$m = api$l;

  // put n new words where 1 word was
  const insertContraction = function (document, point, words) {
    let [n, w] = point;
    if (!words || words.length === 0) {
      return
    }
    words = words.map((word, i) => {
      word.implicit = word.text;
      word.machine = word.text;
      word.pre = '';
      word.post = '';
      word.text = '';
      word.normal = '';
      word.index = [n, w + i];
      return word
    });
    if (words[0]) {
      // move whitespace over
      words[0].pre = document[n][w].pre;
      words[words.length - 1].post = document[n][w].post;
      // add the text/normal to the first term
      words[0].text = document[n][w].text;
      words[0].normal = document[n][w].normal; // move tags too?
    }
    // do the splice
    document[n].splice(w, 1, ...words);
  };
  var splice = insertContraction;

  const hasContraction$1 = /'/;

  const isHas = (terms, i) => {
    //look for a past-tense verb
    let after = terms.slice(i + 1, i + 3);
    return after.some(t => t.tags.has('PastTense'))
  };

  // 's -> [possessive, 'has', or 'is']
  const apostropheS$1 = function (terms, i) {
    // possessive, is/has
    let before = terms[i].normal.split(hasContraction$1)[0];
    // spencer's got -> 'has'
    if (isHas(terms, i)) {
      return [before, 'has']
    }
    // let's
    if (before === 'let') {
      return [before, 'us']
    }
    // allow slang "there's" -> there are
    if (before === 'there') {
      let nextTerm = terms[i + 1];
      if (nextTerm && nextTerm.tags.has('Plural')) {
        return [before, 'are']
      }
    }
    return [before, 'is']
  };
  var apostropheS$2 = apostropheS$1;

  const hasContraction = /'/;
  //look for a past-tense verb
  const hasPastTense = (terms, i) => {
    let after = terms.slice(i + 1, i + 3);
    return after.some(t => t.tags.has('PastTense'))
  };
  // he'd walked -> had
  // how'd -> did
  // he'd go -> would
  const _apostropheD = function (terms, i) {
    let before = terms[i].normal.split(hasContraction)[0];
    // what'd, how'd
    if (before === 'how' || before === 'what') {
      return [before, 'did']
    }
    if (hasPastTense(terms, i) === true) {
      return [before, 'had']
    }
    // had/would/did
    return [before, 'would']
  };
  var apostropheD = _apostropheD;

  const lastNoun$1 = function (terms, i) {
    for (let n = i - 1; n >= 0; n -= 1) {
      if (
        terms[n].tags.has('Noun') ||
        terms[n].tags.has('Pronoun') ||
        terms[n].tags.has('Plural') ||
        terms[n].tags.has('Singular')
      ) {
        return terms[n]
      }
    }
    return null
  };

  //ain't -> are/is not
  const apostropheT = function (terms, i) {
    if (terms[i].normal === "ain't" || terms[i].normal === 'aint') {
      // we aint -> are not,   she aint -> is not
      let noun = lastNoun$1(terms, i);
      if (noun) {
        // plural/singular pronouns
        if (noun.normal === 'we' || noun.normal === 'they') {
          return ['are', 'not']
        }
        // plural/singular tags
        if (noun.tags && noun.tags.has('Plural')) {
          return ['are', 'not']
        }
      }
      return ['is', 'not']
    }
    let before = terms[i].normal.replace(/n't/, '');
    return [before, 'not']
  };

  var apostropheT$1 = apostropheT;

  const banList = {
    that: true,
    there: true,
    let: true,
    here: true,
    everywhere: true,
  };

  const beforePossessive = {
    in: true,//in sunday's
    by: true,//by sunday's
    for: true,//for sunday's
  };

  const isPossessive = (terms, i) => {
    let term = terms[i];
    // these can't be possessive
    if (banList.hasOwnProperty(term.machine || term.normal)) {
      return false
    }
    // if we already know it
    if (term.tags.has('Possessive')) {
      return true
    }
    //a pronoun can't be possessive - "he's house"
    if (term.tags.has('Pronoun') || term.tags.has('QuestionWord')) {
      return false
    }
    //if end of sentence, it is possessive - "was spencer's"
    let nextTerm = terms[i + 1];
    if (!nextTerm) {
      return true
    }
    //a gerund suggests 'is walking'
    if (nextTerm.tags.has('Verb')) {
      //fix 'jamie's bite'
      if (nextTerm.tags.has('Infinitive')) {
        return true
      }
      //fix 'spencer's runs'
      if (nextTerm.tags.has('PresentTense')) {
        return true
      }
      return false
    }
    //spencer's house
    if (nextTerm.tags.has('Noun')) {
      let nextStr = nextTerm.machine || nextTerm.normal;
      // 'spencer's here'
      if (nextStr === 'here' || nextStr === 'there' || nextStr === 'everywhere') {
        return false
      }
      // the chair's his
      if (nextTerm.tags.has('Possessive')) {
        return false
      }
      // the captain's John 
      if (nextTerm.tags.has('ProperNoun') && !term.tags.has('ProperNoun')) {
        return false
      }
      return true
    }
    // by sunday's final
    if (terms[i - 1] && beforePossessive[terms[i - 1].normal] === true) {
      return true
    }
    //rocket's red glare
    let twoTerm = terms[i + 2];
    if (twoTerm && twoTerm.tags.has('Noun') && !twoTerm.tags.has('Pronoun')) {
      return true
    }
    //othwerwise, an adjective suggests 'is good'
    if (nextTerm.tags.has('Adjective') || nextTerm.tags.has('Adverb') || nextTerm.tags.has('Verb')) {
      return false
    }
    return false
  };
  var isPossessive$1 = isPossessive;

  const byApostrophe = /'/;

  // poor-mans reindexing of this sentence only
  const reIndex = function (terms) {
    terms.forEach((t, i) => {
      if (t.index) {
        t.index[1] = i;
      }
    });
  };

  // run tagger on our new implicit terms
  const reTag = function (terms, view, start, len) {
    let tmp = view.update();
    tmp.document = [terms];
    // offer to re-tag neighbours, too
    let end = start + len;
    if (start > 0) {
      start -= 1;
    }
    if (terms[end]) {
      end += 1;
    }
    tmp.ptrs = [[0, start, end]];
    tmp.compute(['lexicon', 'preTagger']);
    // don't for a reindex of the whole document
    reIndex(terms);
  };

  const byEnd = {
    // how'd
    d: (terms, i) => apostropheD(terms, i),
    // we ain't
    t: (terms, i) => apostropheT$1(terms, i),
    // bob's
    s: (terms, i, world) => {
      // [bob's house] vs [bob's cool]
      if (isPossessive$1(terms, i)) {
        return world.methods.one.setTag([terms[i]], 'Possessive', world, '2-contraction')
      }
      return apostropheS$2(terms, i)
    },
  };

  const toDocs = function (words, view) {
    let doc = view.fromText(words.join(' '));
    doc.compute('id');
    return doc.docs[0]
  };


  //really easy ones
  const contractionTwo$1 = (view) => {
    let { world, document } = view;
    // each sentence
    document.forEach((terms, n) => {
      // loop through terms backwards
      for (let i = terms.length - 1; i >= 0; i -= 1) {
        // is it already a contraction
        if (terms[i].implicit) {
          return
        }
        let after = null;
        if (byApostrophe.test(terms[i].normal) === true) {
          [, after] = terms[i].normal.split(byApostrophe);
        }
        let words = null;
        // any known-ones, like 'dunno'?
        // ['foo', 's']
        if (byEnd.hasOwnProperty(after)) {
          words = byEnd[after](terms, i, world);
        }
        // actually insert the new terms
        if (words) {
          words = toDocs(words, view);
          splice(document, [n, i], words);
          reTag(document[n], view, i, words.length);
          continue
        }
      }
    });
  };
  var compute$2 = { contractionTwo: contractionTwo$1 };

  var contractionTwo = {
    compute: compute$2,
    api: api$m,
    hooks: ['contractionTwo']
  };

  var adj = [
    // all fell apart
    { match: '[(all|both)] #Determiner #Noun', group: 0, tag: 'Noun', reason: 'all-noun' },
    //sometimes not-adverbs
    { match: '#Copula [(just|alone)]$', group: 0, tag: 'Adjective', reason: 'not-adverb' },
    //jack is guarded
    { match: '#Singular is #Adverb? [#PastTense$]', group: 0, tag: 'Adjective', reason: 'is-filled' },
    // smoked poutine is
    { match: '[#PastTense] #Singular is', group: 0, tag: 'Adjective', reason: 'smoked-poutine' },
    // baked onions are
    { match: '[#PastTense] #Plural are', group: 0, tag: 'Adjective', reason: 'baked-onions' },
    // well made
    { match: 'well [#PastTense]', group: 0, tag: 'Adjective', reason: 'well-made' },
    // is f*ed up
    { match: '#Copula [fucked up?]', group: 0, tag: 'Adjective', reason: 'swears-adjective' },
    //jack seems guarded
    { match: '#Singular (seems|appears) #Adverb? [#PastTense$]', group: 0, tag: 'Adjective', reason: 'seems-filled' },
    // jury is out - preposition ➔ adjective
    { match: '#Copula #Adjective? [(out|in|through)]$', group: 0, tag: 'Adjective', reason: 'still-out' },
    // shut the door
    { match: '^[#Adjective] (the|your) #Noun', group: 0, ifNo: ['all', 'even'], tag: 'Infinitive', reason: 'shut-the' },
    // the said card
    { match: 'the [said] #Noun', group: 0, tag: 'Adjective', reason: 'the-said-card' },
    // a myth that uncovered wounds heal
    {
      match: '#Noun (that|which|whose) [#PastTense] #Noun',
      ifNo: '#Copula',
      group: 0,
      tag: 'Adjective',
      reason: 'that-past-noun',
    },

    { match: 'too much', tag: 'Adverb Adjective', reason: 'bit-4' },
    { match: 'a bit much', tag: 'Determiner Adverb Adjective', reason: 'bit-3' },
  ];

  const adverbAdj = `(dark|bright|flat|light|soft|pale|dead|dim|faux|little|wee|sheer|most|near|good|extra|all)`;
  var advAdj = [
    // kinda sparkly
    // { match: `#Adverb [#Adverb]$`, ifNo: ['very', 'really', 'so'], group: 0, tag: 'Adjective', reason: 'kinda-sparkly' },
    { match: `#Adverb [#Adverb] (and|or|then)`, group: 0, tag: 'Adjective', reason: 'kinda-sparkly-and' },
    // dark green
    { match: `[${adverbAdj}] #Adjective`, group: 0, tag: 'Adverb', reason: 'dark-green' },
  ];

  var gerundAdj = [
    // Gerund-Adjectives - 'amusing, annoying'
    //a staggering cost
    { match: '(a|an) [#Gerund]', group: 0, tag: 'Adjective', reason: 'a|an' },
    //as amusing as
    { match: 'as [#Gerund] as', group: 0, tag: 'Adjective', reason: 'as-gerund-as' },
    // more amusing than
    { match: 'more [#Gerund] than', group: 0, tag: 'Adjective', reason: 'more-gerund-than' },
    // very amusing
    { match: '(so|very|extremely) [#Gerund]', group: 0, tag: 'Adjective', reason: 'so-gerund' },
    // it was amusing
    // {
    //   match: '(it|he|she|everything|something) #Adverb? was #Adverb? [#Gerund]',
    //   group: 0,
    //   tag: 'Adjective',
    //   reason: 'it-was-gerund',
    // },
    // found it amusing
    { match: '(found|found) it #Adverb? [#Gerund]', group: 0, tag: 'Adjective', reason: 'found-it-gerund' },
    // a bit amusing
    { match: 'a (little|bit|wee) bit? [#Gerund]', group: 0, tag: 'Adjective', reason: 'a-bit-gerund' },
    // the amusing world
    // { match: '(#Determiner|#Possessive) [%Adj|Gerund%] #Noun', group: 0, tag: 'Adjective', reason: 'amusing-world' },
  ];

  var nounAdj = [
    //the above is clear
    { match: '#Determiner [#Adjective] #Copula', group: 0, tag: 'Noun', reason: 'the-adj-is' },
    //real evil is
    { match: '#Adjective [#Adjective] #Copula', group: 0, tag: 'Noun', reason: 'adj-adj-is' },
    //his fine
    { match: '(his|its) [%Adj|Noun%]', group: 0, tag: 'Noun', reason: 'his-fine' },
    //is all
    { match: '#Copula #Adverb? [all]', group: 0, tag: 'Noun', reason: 'is-all' },
    // have fun
    { match: `(have|had) [#Adjective] #Preposition .`, group: 0, tag: 'Noun', reason: 'have-fun' },
    // brewing giant
    { match: `#Gerund (giant|capital|center|zone|application)`, tag: 'Noun', reason: 'brewing-giant' },
    // in an instant
    { match: `#Preposition (a|an) [#Adjective]$`, group: 0, tag: 'Noun', reason: 'an-instant' },
  ];

  var adjVerb = [
    // amusing his aunt
    // { match: '[#Adjective] #Possessive #Noun', group: 0, tag: 'Verb', reason: 'gerund-his-noun' },
    // loving you
    // { match: '[#Adjective] (us|you)', group: 0, tag: 'Gerund', reason: 'loving-you' },
    // slowly stunning
    { match: '(slowly|quickly) [#Adjective]', group: 0, tag: 'Verb', reason: 'slowly-adj' },
    // does mean
    { match: 'does (#Adverb|not)? [#Adjective]', group: 0, tag: 'PresentTense', reason: 'does-mean' },
    // okay by me
    { match: '[(fine|okay|cool|ok)] by me', group: 0, tag: 'Adjective', reason: 'okay-by-me' },
    // i mean
    { match: 'i (#Adverb|do)? not? [mean]', group: 0, tag: 'PresentTense', reason: 'i-mean' },
    //will secure our
    { match: 'will #Adjective', tag: 'Auxiliary Infinitive', reason: 'will-adj' },
    //he disguised the thing
    { match: '#Pronoun [#Adjective] #Determiner #Adjective? #Noun', group: 0, tag: 'Verb', reason: 'he-adj-the' },
    //is eager to go
    { match: '#Copula [%Adj|Present%] to #Verb', group: 0, tag: 'Verb', reason: 'adj-to' },
    // rude and insulting
    { match: '#Adjective and [#Gerund] !#Preposition?', group: 0, tag: 'Adjective', reason: 'rude-and-x' },
    // were over cooked
    { match: '#Copula #Adverb? (over|under) [#PastTense]', group: 0, tag: 'Adjective', reason: 'over-cooked' },
    // was bland and overcooked
    { match: '#Copula #Adjective+ (and|or) [#PastTense]$', group: 0, tag: 'Adjective', reason: 'bland-and-overcooked' },
    // got tired of
    { match: 'got #Adverb? [#PastTense] of', group: 0, tag: 'Adjective', reason: 'got-tired-of' },
    //felt loved
    { match: '(seem|seems|seemed|appear|appeared|appears|feel|feels|felt|sound|sounds|sounded) (#Adverb|#Adjective)? [#PastTense]', group: 0, tag: 'Adjective', reason: 'felt-loved' },
    // seem confused
    { match: '(seem|feel|seemed|felt) [#PastTense]', group: 0, tag: 'Adjective', reason: 'seem-confused' },
    // a bit confused
    { match: 'a (bit|little|tad) [#PastTense]', group: 0, tag: 'Adjective', reason: 'a-bit-confused' },
  ];

  // const adverbAdj = '(dark|bright|flat|light|soft|pale|dead|dim|faux|little|wee|sheer|most|near|good|extra|all)'

  var adv = [
    //still good
    { match: '[still] #Adjective', group: 0, tag: 'Adverb', reason: 'still-advb' },
    //still make
    { match: '[still] #Verb', group: 0, tag: 'Adverb', reason: 'still-verb' },
    // so hot
    { match: '[so] #Adjective', group: 0, tag: 'Adverb', reason: 'so-adv' },
    // way hotter
    { match: '[way] #Comparative', group: 0, tag: 'Adverb', reason: 'way-adj' },
    // way too hot
    { match: '[way] #Adverb #Adjective', group: 0, tag: 'Adverb', reason: 'way-too-adj' },
    // all singing
    { match: '[all] #Verb', group: 0, tag: 'Adverb', reason: 'all-verb' },
    // sing like an angel
    { match: '#Verb  [like]', group: 0, ifNo: ['#Modal', '#PhrasalVerb'], tag: 'Adverb', reason: 'verb-like' },
    //barely even walk
    { match: '(barely|hardly) even', tag: 'Adverb', reason: 'barely-even' },
    //even held
    { match: '[even] #Verb', group: 0, tag: 'Adverb', reason: 'even-walk' },
    // even the greatest
    { match: '[even] (#Determiner|#Possessive)', group: 0, tag: '#Adverb', reason: 'even-the' },
    // even left
    { match: 'even left', tag: '#Adverb #Verb', reason: 'even-left' },
    // way over
    { match: '[way] #Adjective', group: 0, tag: '#Adverb', reason: 'way-over' },
    //cheering hard - dropped -ly's
    {
      match: '#PresentTense [(hard|quick|long|bright|slow|fast|backwards|forwards)]',
      ifNo: '#Copula',
      group: 0,
      tag: 'Adverb',
      reason: 'lazy-ly',
    },
    // much appreciated
    { match: '[much] #Adjective', group: 0, tag: 'Adverb', reason: 'bit-1' },
    // is well
    { match: '#Copula [#Adverb]$', group: 0, tag: 'Adjective', reason: 'is-well' },
    // a bit cold
    { match: 'a [(little|bit|wee) bit?] #Adjective', group: 0, tag: 'Adverb', reason: 'a-bit-cold' },
    // super strong
    { match: `[(super|pretty)] #Adjective`, group: 0, tag: 'Adverb', reason: 'super-strong' },
    // become overly weakened
    { match: '(become|fall|grow) #Adverb? [#PastTense]', group: 0, tag: 'Adjective', reason: 'overly-weakened' },
    // a completely beaten man
    { match: '(a|an) #Adverb [#Participle] #Noun', group: 0, tag: 'Adjective', reason: 'completely-beaten' },
    //a close
    { match: '#Determiner #Adverb? [close]', group: 0, tag: 'Adjective', reason: 'a-close' },
    //walking close
    { match: '#Gerund #Adverb? [close]', group: 0, tag: 'Adverb', reason: 'being-close' },
    // a blown motor
    { match: '(the|those|these|a|an) [#Participle] #Noun', group: 0, tag: 'Adjective', reason: 'blown-motor' },
    // charged back
    { match: '(#PresentTense|#PastTense) [back]', group: 0, tag: 'Adverb', reason: 'charge-back' },
  ];

  var dates = [
    // ==== Holiday ====
    { match: '#Holiday (day|eve)', tag: 'Holiday', reason: 'holiday-day' },
    //5th of March
    { match: '#Value of #Month', tag: 'Date', reason: 'value-of-month' },
    //5 March
    { match: '#Cardinal #Month', tag: 'Date', reason: 'cardinal-month' },
    //march 5 to 7
    { match: '#Month #Value to #Value', tag: 'Date', reason: 'value-to-value' },
    //march the 12th
    { match: '#Month the #Value', tag: 'Date', reason: 'month-the-value' },
    //june 7
    { match: '(#WeekDay|#Month) #Value', tag: 'Date', reason: 'date-value' },
    //7 june
    { match: '#Value (#WeekDay|#Month)', tag: 'Date', reason: 'value-date' },
    //may twenty five
    { match: '(#TextValue && #Date) #TextValue', tag: 'Date', reason: 'textvalue-date' },
    // 'aug 20-21'
    { match: `#Month #NumberRange`, tag: 'Date', reason: 'aug 20-21' },
    // wed march 5th
    { match: `#WeekDay #Month #Ordinal`, tag: 'Date', reason: 'week mm-dd' },
    // aug 5th 2021
    { match: `#Month #Ordinal #Cardinal`, tag: 'Date', reason: 'mm-dd-yyy' },

    // === timezones ===
    // china standard time
    { match: `(#Place|#Demonmym|#Time) (standard|daylight|central|mountain)? time`, tag: 'Timezone', reason: 'std-time' },
    // eastern time
    {
      match: `(eastern|mountain|pacific|central|atlantic) (standard|daylight|summer)? time`,
      tag: 'Timezone',
      reason: 'eastern-time',
    },
    // 5pm central
    { match: `#Time [(eastern|mountain|pacific|central|est|pst|gmt)]`, group: 0, tag: 'Timezone', reason: '5pm-central' },
    // central european time
    { match: `(central|western|eastern) european time`, tag: 'Timezone', reason: 'cet' },
  ];

  var ambigDates = [
    // ==== WeekDay ====
    // sun the 5th
    { match: '[sun] the #Ordinal', tag: 'WeekDay', reason: 'sun-the-5th' },
    //sun feb 2
    { match: '[sun] #Date', group: 0, tag: 'WeekDay', reason: 'sun-feb' },
    //1pm next sun
    { match: '#Date (on|this|next|last|during)? [sun]', group: 0, tag: 'WeekDay', reason: '1pm-sun' },
    //this sat
    { match: `(in|by|before|during|on|until|after|of|within|all) [sat]`, group: 0, tag: 'WeekDay', reason: 'sat' },
    { match: `(in|by|before|during|on|until|after|of|within|all) [wed]`, group: 0, tag: 'WeekDay', reason: 'wed' },
    { match: `(in|by|before|during|on|until|after|of|within|all) [march]`, group: 0, tag: 'Month', reason: 'march' },
    //sat november
    { match: '[sat] #Date', group: 0, tag: 'WeekDay', reason: 'sat-feb' },

    // ==== Month ====
    //all march
    { match: `#Preposition [(march|may)]`, group: 0, tag: 'Month', reason: 'in-month' },
    //this march
    { match: `(this|next|last) [(march|may)]`, tag: '#Date #Month', reason: 'this-month' },
    // march 5th
    { match: `(march|may) the? #Value`, tag: '#Month #Date #Date', reason: 'march-5th' },
    // 5th of march
    { match: `#Value of? (march|may)`, tag: '#Date #Date #Month', reason: '5th-of-march' },
    // march and feb
    { match: `[(march|may)] .? #Date`, group: 0, tag: 'Month', reason: 'march-and-feb' },
    // feb to march
    { match: `#Date .? [(march|may)]`, group: 0, tag: 'Month', reason: 'feb-and-march' },
    //quickly march
    { match: `#Adverb [(march|may)]`, group: 0, tag: 'Verb', reason: 'quickly-march' },
    //march quickly
    { match: `[(march|may)] #Adverb`, group: 0, tag: 'Verb', reason: 'march-quickly' },
  ];

  const infNouns =
    '(feel|sense|process|rush|side|bomb|bully|challenge|cover|crush|dump|exchange|flow|function|issue|lecture|limit|march|process)';
  var noun = [
    //'more' is not always an adverb
    { match: 'more #Noun', tag: 'Noun', reason: 'more-noun' },
    { match: '(right|rights) of .', tag: 'Noun', reason: 'right-of' },
    { match: 'a [bit]', group: 0, tag: 'Noun', reason: 'bit-2' },

    //some pressing issues
    { match: 'some [#Verb] #Plural', group: 0, tag: 'Noun', reason: 'determiner6' },
    // my first thought
    { match: '#Possessive #Ordinal [#PastTense]', group: 0, tag: 'Noun', reason: 'first-thought' },
    //the nice swim
    { match: '(the|this|those|these) #Adjective [%Verb|Noun%]', group: 0, tag: 'Noun', ifNo: '#Copula', reason: 'the-adj-verb' },
    // the truly nice swim
    { match: '(the|this|those|these) #Adverb #Adjective [#Verb]', group: 0, tag: 'Noun', reason: 'determiner4' },
    //the wait to vote
    { match: 'the [#Verb] #Preposition .', group: 0, tag: 'Noun', reason: 'determiner1' },
    //a sense of
    { match: '#Determiner [#Verb] of', group: 0, tag: 'Noun', reason: 'the-verb-of' },
    //the threat of force
    { match: '#Determiner #Noun of [#Verb]', group: 0, tag: 'Noun', ifNo: '#Gerund', reason: 'noun-of-noun' },
    //Grandma's cooking, my tiptoing
    // { match: '#Possessive [#Gerund]', group: 0, tag: 'Noun', reason: 'grandmas-cooking' },
    // ended in ruins
    { match: '#PastTense #Preposition [#PresentTense]', group: 0, ifNo: ['#Gerund'], tag: 'Noun', reason: 'ended-in-ruins' },

    //'u' as pronoun
    { match: '#Conjunction [u]', group: 0, tag: 'Pronoun', reason: 'u-pronoun-2' },
    { match: '[u] #Verb', group: 0, tag: 'Pronoun', reason: 'u-pronoun-1' },
    //the western line
    {
      match: '#Determiner [(western|eastern|northern|southern|central)] #Noun',
      group: 0,
      tag: 'Noun',
      reason: 'western-line',
    },
    //linear algebra
    // {
    //   match: '(#Determiner|#Value) [(linear|binary|mobile|lexical|technical|computer|scientific|formal)] #Noun',
    //   group: 0,
    //   tag: 'Noun',
    //   reason: 'technical-noun',
    // },
    //air-flow
    { match: '(#Singular && @hasHyphen) #PresentTense', tag: 'Noun', reason: 'hyphen-verb' },
    //is no walk
    { match: 'is no [#Verb]', group: 0, tag: 'Noun', reason: 'is-no-verb' },
    //different views than
    // { match: '[#Verb] than', group: 0, tag: 'Noun', reason: 'verb-than' },
    //do so
    { match: 'do [so]', group: 0, tag: 'Noun', reason: 'so-noun' },
    // what the hell
    { match: '#Determiner [(shit|damn|hell)]', group: 0, tag: 'Noun', reason: 'swears-noun' },
    // go to shit
    { match: 'to [(shit|hell)]', group: 0, tag: 'Noun', reason: 'to-swears' },
    // the staff were
    { match: '(the|these) [#Singular] (were|are)', group: 0, tag: 'Plural', reason: 'singular-were' },
    // a comdominium, or simply condo
    { match: `a #Noun+ or #Adverb+? [#Verb]`, group: 0, tag: 'Noun', reason: 'noun-or-noun' },
    // walk the walk
    { match: '(the|those|these|a|an) #Adjective? [#Infinitive]', group: 0, tag: 'Noun', reason: 'det-inf' },
    {
      match: '(the|those|these|a|an) #Adjective? [#PresentTense]',
      ifNo: ['#Gerund', '#Copula'],
      group: 0,
      tag: 'Noun',
      reason: 'det-pres',
    },
    // { match: '(the|those|these|a|an) #Adjective? [#PastTense]', group: 0, tag: 'Noun', reason: 'det-past' },

    // ==== Actor ====
    //Aircraft designer
    { match: '#Noun #Actor', tag: 'Actor', reason: 'thing-doer' },
    // co-founder
    { match: `co #Singular`, tag: 'Actor', reason: 'co-noun' },

    // ==== Singular ====
    //the sun
    { match: '#Determiner [sun]', group: 0, tag: 'Singular', reason: 'the-sun' },
    //did a 900, paid a 20
    { match: '#Verb (a|an) [#Value]', group: 0, tag: 'Singular', reason: 'did-a-value' },
    //'the can'
    { match: 'the [(can|will|may)]', group: 0, tag: 'Singular', reason: 'the can' },

    // ==== Possessive ====
    //spencer kelly's
    { match: '#FirstName #Acronym? (#Possessive && #LastName)', tag: 'Possessive', reason: 'name-poss' },
    //Super Corp's fundraiser
    { match: '#Organization+ #Possessive', tag: 'Possessive', reason: 'org-possessive' },
    //Los Angeles's fundraiser
    { match: '#Place+ #Possessive', tag: 'Possessive', reason: 'place-possessive' },
    // 10th of a second
    { match: '#Value of a [second]', group: 0, unTag: 'Value', tag: 'Singular', reason: '10th-of-a-second' },
    // 10 seconds
    { match: '#Value [seconds]', group: 0, unTag: 'Value', tag: 'Plural', reason: '10-seconds' },
    // in time
    { match: 'in [#Infinitive]', group: 0, tag: 'Singular', reason: 'in-age' },
    // a minor in
    { match: 'a [#Adjective] #Preposition', group: 0, tag: 'Noun', reason: 'a-minor-in' },

    //the repairer said
    { match: '#Determiner [#Singular] said', group: 0, tag: 'Actor', reason: 'the-actor-said' },
    //the euro sense
    {
      match: `#Determiner #Noun [${infNouns}] !(#Preposition|to|#Adverb)?`,
      group: 0,
      tag: 'Noun',
      reason: 'the-noun-sense',
    },
    // photographs of a computer are
    { match: '[#PresentTense] (of|by|for) (a|an|the) #Noun #Copula', group: 0, tag: 'Plural', reason: 'photographs-of' },
    // soft music playing
    // { match: '%Noun|Gerund%$', tag: 'Noun', reason: 'music-playing' },
    // fight and win
    { match: '#Infinitive and [%Noun|Verb%]', group: 0, tag: 'Infinitive', reason: 'fight and win' },
    // bride and groom
    { match: '#Noun and [%Noun|Verb%]', group: 0, tag: 'Singular', ifNo: ['#ProperNoun'], reason: 'bride-and-groom' },
    // an impressionist painting
    // { match: '#Determiner [%Adj|Noun%] #Noun', group: 0, tag: 'Adjective', ifNo: ['#ProperNoun', '#Pronoun'], reason: 'a-complex-relationship' },
    // the 1992 classic
    { match: 'the #Cardinal [%Adj|Noun%]', group: 0, tag: 'Noun', reason: 'the-1992-classic' },

    // 
    // { match: '[%Adj|Noun%] #ProperNoun', group: 0, tag: 'Adjective', ifNo: ['#ProperNoun'], reason: 'epic-instagram' },
  ];

  var gerundNouns = [
    // the planning processes
    { match: '(this|that|the|a|an) [#Gerund #Infinitive]', group: 0, tag: 'Singular', reason: 'the-planning-process' },
    // the paving stones
    { match: '(that|the) [#Gerund #PresentTense]', group: 0, tag: 'Plural', reason: 'the-paving-stones' },
    // this swimming
    // { match: '(this|that|the) [#Gerund]', group: 0, tag: 'Noun', reason: 'this-gerund' },
    // the remaining claims
    { match: '#Determiner [#Gerund] #Noun', group: 0, tag: 'Adjective', reason: 'the-gerund-noun' },
    // i think tipping sucks
    { match: `#Pronoun #Infinitive [#Gerund] #PresentTense`, group: 0, tag: 'Noun', reason: 'tipping-sucks' },
    // early warning
    { match: '#Adjective [#Gerund]', group: 0, tag: 'Noun', reason: 'early-warning' },
    //walking is cool
    { match: '[#Gerund] #Adverb? not? #Copula', group: 0, tag: 'Activity', reason: 'gerund-copula' },
    //walking should be fun
    { match: '[#Gerund] #Modal', group: 0, tag: 'Activity', reason: 'gerund-modal' },
    // finish listening
    // { match: '#Infinitive [#Gerund]', group: 0, tag: 'Activity', reason: 'finish-listening' },
    // the ruling party
  ];

  var presNouns = [
    // do the dance
    { match: '#Infinitive (this|that|the) [#Infinitive]', group: 0, tag: 'Noun', reason: 'do-this-dance' },
    //running-a-show
    { match: '#Gerund #Determiner [#Infinitive]', group: 0, tag: 'Noun', reason: 'running-a-show' },
    //the-only-reason
    { match: '#Determiner #Adverb [#Infinitive]', group: 0, tag: 'Noun', reason: 'the-reason' },
    // a stream runs
    { match: '(the|this|a|an) [#Infinitive] #Adverb? #Verb', group: 0, tag: 'Noun', reason: 'determiner5' },
    //the test string
    { match: '#Determiner [#Infinitive] #Noun', group: 0, tag: 'Noun', reason: 'determiner7' },
    //a nice deal
    { match: '#Determiner #Adjective #Adjective? [#Infinitive]', group: 0, tag: 'Noun', reason: 'a-nice-inf' },
    // the mexican train
    { match: '#Determiner #Demonym [#PresentTense]', group: 0, tag: 'Noun', reason: 'mexican-train' },
    //next career move
    { match: '#Adjective #Noun+ [#Infinitive] #Copula', group: 0, tag: 'Noun', reason: 'career-move' },
    // at some point
    { match: 'at some [#Infinitive]', group: 0, tag: 'Noun', reason: 'at-some-inf' },
    // goes to sleep
    { match: '(go|goes|went) to [#Infinitive]', group: 0, tag: 'Noun', reason: 'goes-to-verb' },
    //a close watch on
    { match: '(a|an) #Adjective? #Noun [#Infinitive] (#Preposition|#Noun)', group: 0, tag: 'Noun', reason: 'a-noun-inf' },
    //a tv show
    { match: '(a|an) #Noun [#Infinitive]$', group: 0, tag: 'Noun', reason: 'a-noun-inf2' },
    //is mark hughes
    { match: '#Copula [#Infinitive] #Noun', group: 0, tag: 'Noun', reason: 'is-pres-noun' },
    // good wait staff
    // { match: '#Adjective [#Infinitive] #Noun', group: 0, tag: 'Noun', reason: 'good-wait-staff' },
    // running for congress
    { match: '#Gerund #Adjective? for [#Infinitive]', group: 0, tag: 'Noun', reason: 'running-for' },
    // running to work
    { match: '#Gerund #Adjective to [#Infinitive]', group: 0, tag: 'Noun', reason: 'running-to' },
    // 1 train
    { match: '(one|1) [#Infinitive]', group: 0, tag: 'Singular', reason: '1-trains' },
    // about love
    { match: 'about [#Infinitive]', group: 0, tag: 'Singular', reason: 'about-love' },
    // on stage
    { match: 'on [#Infinitive]', group: 0, tag: 'Noun', reason: 'on-stage' },
    // any charge
    { match: 'any [#Infinitive]', group: 0, tag: 'Noun', reason: 'any-charge' },
    // no doubt
    { match: 'no [#Infinitive]', group: 0, tag: 'Noun', reason: 'no-doubt' },
    // number of seats
    { match: 'number of [#PresentTense]', group: 0, tag: 'Noun', reason: 'number-of-x' },
    // teaches/taught
    { match: '(taught|teaches|learns|learned) [#PresentTense]', group: 0, tag: 'Noun', reason: 'teaches-x' },

    // use reverse
    {
      match: '(try|use|attempt|build|make) [#Verb]',
      ifNo: ['#Copula', '#PhrasalVerb'],
      group: 0,
      tag: 'Noun',
      reason: 'do-verb',
    },

    // checkmate is
    { match: '^[#Infinitive] (is|was)', group: 0, tag: 'Noun', reason: 'checkmate-is' },
    // get much sleep
    { match: '#Infinitive much [#Infinitive]', group: 0, tag: 'Noun', reason: 'get-much' },
    // cause i gotta
    { match: '[cause] #Pronoun #Verb', group: 0, tag: 'Conjunction', reason: 'cause-cuz' },
    // the cardio dance party
    { match: 'the #Singular [#Infinitive] #Noun', group: 0, tag: 'Noun', reason: 'cardio-dance' },
    // the dining experience
    // { match: 'the #Noun [#Infinitive] #Copula', group: 0, tag: 'Noun', reason: 'dining-experience' },

    // that should smoke
    { match: '#Determiner #Modal [#Noun]', group: 0, tag: 'PresentTense', reason: 'should-smoke' },
    //this rocks
    { match: '(this|that) [#Plural]', group: 0, tag: 'PresentTense', reason: 'this-verbs' },
    //let him glue
    {
      match: '(let|make|made) (him|her|it|#Person|#Place|#Organization)+ [#Singular] (a|an|the|it)',
      group: 0,
      tag: 'Infinitive',
      reason: 'let-him-glue',
    },

    // assign all tasks
    {
      match: '#Verb (all|every|each|most|some|no) [#PresentTense]',
      ifNo: '#Modal',
      group: 0,
      tag: 'Noun',
      reason: 'all-presentTense',
    },
    // PresentTense/Noun ambiguities
    // big dreams, critical thinking
    // have big dreams
    { match: '(had|have|#PastTense) #Adjective [#PresentTense]', group: 0, tag: 'Noun', reason: 'adj-presentTense' },
    // excellent answer spencer
    // { match: '^#Adjective [#PresentTense]', group: 0, tag: 'Noun', reason: 'start adj-presentTense' },
    // one big reason
    { match: '#Value #Adjective [#PresentTense]', group: 0, tag: 'Noun', reason: 'one-big-reason' },
    // won widespread support
    { match: '#PastTense #Adjective+ [#PresentTense]', group: 0, tag: 'Noun', reason: 'won-wide-support' },
    // many poses
    { match: '(many|few|several|couple) [#PresentTense]', group: 0, tag: 'Noun', reason: 'many-poses' },
    // very big dreams
    { match: '#Adverb #Adjective [#PresentTense]', group: 0, tag: 'Noun', reason: 'very-big-dream' },
    // adorable little store
    { match: '#Adjective #Adjective [#PresentTense]', group: 0, tag: 'Noun', reason: 'adorable-little-store' },
    // of basic training
    // { match: '#Preposition #Adjective [#PresentTense]', group: 0, tag: 'Noun', reason: 'of-basic-training' },
    // justifiying higher costs
    { match: '#Gerund #Adverb? #Comparative [#PresentTense]', group: 0, tag: 'Noun', reason: 'higher-costs' },

    { match: '(#Noun && @hasComma) #Noun (and|or) [#PresentTense]', group: 0, tag: 'Noun', reason: 'noun-list' },

    // any questions for
    { match: '(many|any|some|several) [#PresentTense] for', group: 0, tag: 'Noun', reason: 'any-verbs-for' },
    // to facilitate gas exchange with
    { match: `to #PresentTense #Noun [#PresentTense] #Preposition`, group: 0, tag: 'Noun', reason: 'gas-exchange' },
    // waited until release
    {
      match: `#PastTense (until|as|through|without) [#PresentTense]`,
      group: 0,
      tag: 'Noun',
      reason: 'waited-until-release',
    },
    // selling like hot cakes
    { match: `#Gerund like #Adjective? [#PresentTense]`, group: 0, tag: 'Plural', reason: 'like-hot-cakes' },
    // some valid reason
    { match: `some #Adjective [#PresentTense]`, group: 0, tag: 'Noun', reason: 'some-reason' },
    // for some reason
    { match: `for some [#PresentTense]`, group: 0, tag: 'Noun', reason: 'for-some-reason' },
    // same kind of shouts
    { match: `(same|some|the|that|a) kind of [#PresentTense]`, group: 0, tag: 'Noun', reason: 'some-kind-of' },
    // a type of shout
    { match: `(same|some|the|that|a) type of [#PresentTense]`, group: 0, tag: 'Noun', reason: 'some-type-of' },
    // doing better for fights
    { match: `#Gerund #Adjective #Preposition [#PresentTense]`, group: 0, tag: 'Noun', reason: 'doing-better-for-x' },
    // get better aim
    { match: `(get|got|have|had) #Comparative [#PresentTense]`, group: 0, tag: 'Noun', reason: 'got-better-aim' },
    // whose name was
    { match: 'whose [#PresentTense] #Copula', group: 0, tag: 'Noun', reason: 'whos-name-was' },
    // give up on reason
    { match: `#PhrasalVerb #PhrasalVerb #Preposition [#PresentTense]`, group: 0, tag: 'Noun', reason: 'given-up-on-x' },
    //there are reasons
    { match: 'there (are|were) #Adjective? [#PresentTense]', group: 0, tag: 'Plural', reason: 'there-are' },

    // 30 trains
    {
      match: '#Value [#PresentTense]',
      group: 0,
      ifNo: ['one', '1', '#Copula', '#Infinitive'],
      tag: 'Plural',
      reason: '2-trains',
    },
    // compromises are possible
    { match: '[#PresentTense] (are|were|was) #Adjective', group: 0, tag: 'Plural', reason: 'compromises-are-possible' },
    // hope i helped
    { match: '^[(hope|guess|thought|think)] #Pronoun #Verb', group: 0, tag: 'Infinitive', reason: 'suppose-i' },
    //pursue its dreams
    { match: '#PresentTense #Possessive [#PresentTense]', group: 0, tag: 'Plural', reason: 'pursue-its-dreams' },
    // our unyielding support
    { match: '#Possessive #Adjective [#Verb]', group: 0, tag: 'Noun', reason: 'our-full-support' },
    // they do serve fish
    { match: '(do|did|will) [#Singular] #Noun', group: 0, tag: 'PresentTense', reason: 'do-serve-fish' },
    // tastes good
    { match: '[(tastes|smells)] #Adverb? #Adjective', group: 0, tag: 'PresentTense', reason: 'tastes-good' },
    // are you plauing golf
    { match: '^are #Pronoun [#Noun]', group: 0, ifNo: ['here', 'there'], tag: 'Verb', reason: 'are-you-x' },
    // ignoring commute
    {
      match: '#Copula #Gerund [#PresentTense] !by?',
      group: 0,
      tag: 'Noun',
      ifNo: ['going'],
      reason: 'ignoring-commute',
    },
    // noun-pastTense variables
    { match: '#Determiner #Adjective? [(shed|thought|rose|bid|saw|spelt)]', group: 0, tag: 'Noun', reason: 'noun-past' },
  ];

  var money = [
    { match: '#Money and #Money #Currency?', tag: 'Money', reason: 'money-and-money' },

    // // $5.032 is invalid money
    // doc
    //   .match('#Money')
    //   .not('#TextValue')
    //   .match('/\\.[0-9]{3}$/')
    //   .unTag('#Money', 'three-decimal money')

    // cleanup currency false-positives
    // { match: '#Currency #Verb', ifNo: '#Value', unTag: 'Currency', reason: 'no-currency' },
    // 6 dollars and 5 cents
    { match: '#Value #Currency [and] #Value (cents|ore|centavos|sens)', group: 0, tag: 'money', reason: 'and-5-cents' },
    // maybe currencies
    { match: '#Value (mark|rand|won|rub|ore)', tag: '#Money #Currency', reason: '4 mark' },
  ];

  //   {match:'', tag:'',reason:''},
  //   {match:'', tag:'',reason:''},
  //   {match:'', tag:'',reason:''},

  var fractions$1 = [
    // half a penny
    { match: '[(half|quarter)] of? (a|an)', group: 0, tag: 'Fraction', reason: 'millionth' },
    // nearly half
    { match: '#Adverb [half]', group: 0, tag: 'Fraction', reason: 'nearly-half' },
    // half the
    { match: '[half] the', group: 0, tag: 'Fraction', reason: 'half-the' },
    // and a half
    { match: '#Cardinal and a half', tag: 'Fraction', reason: 'and-a-half' },
    // two-halves
    { match: '#Value (halves|halfs|quarters)', tag: 'Fraction', reason: 'two-halves' },

    // ---ordinals as fractions---
    // a fifth
    { match: 'a #Ordinal', tag: 'Fraction', reason: 'a-quarter' },
    // seven fifths
    { match: '[#Cardinal+] (#Fraction && /s$/)', tag: 'Fraction', reason: 'seven-fifths' },
    // doc.match('(#Fraction && /s$/)').lookBefore('#Cardinal+$').tag('Fraction')
    // one third of ..
    { match: '[#Cardinal+ #Ordinal] of .', group: 0, tag: 'Fraction', reason: 'ordinal-of' },
    // 100th of
    { match: '[(#NumericValue && #Ordinal)] of .', group: 0, tag: 'Fraction', reason: 'num-ordinal-of' },
    // a twenty fifth
    { match: '(a|one) #Cardinal?+ #Ordinal', tag: 'Fraction', reason: 'a-ordinal' },

    // //  '3 out of 5'
    { match: '#Cardinal+ out? of every? #Cardinal', tag: 'Fraction', reason: 'out-of' },
  ];

  // {match:'', tag:'',reason:''},

  var numbers$2 = [
    // ==== Ambiguous numbers ====
    // 'second'
    { match: `#Cardinal [second]`, tag: 'Unit', reason: 'one-second' },
    //'a/an' can mean 1 - "a hour"
    {
      match: '!once? [(a|an)] (#Duration|hundred|thousand|million|billion|trillion)',
      group: 0,
      tag: 'Value',
      reason: 'a-is-one',
    },
    // ==== PhoneNumber ====
    //1 800 ...
    { match: '1 #Value #PhoneNumber', tag: 'PhoneNumber', reason: '1-800-Value' },
    //(454) 232-9873
    { match: '#NumericValue #PhoneNumber', tag: 'PhoneNumber', reason: '(800) PhoneNumber' },

    // ==== Currency ====
    // chinese yuan
    { match: '#Demonym #Currency', tag: 'Currency', reason: 'demonym-currency' },
    // ten bucks
    { match: '#Value [(buck|bucks|grand)]', group: 0, tag: 'Currency', reason: 'value-bucks' },
    // ==== Money ====
    { match: '[#Value+] #Currency', group: 0, tag: 'Money', reason: '15 usd' },

    // ==== Ordinal ====
    { match: '[second] #Noun', group: 0, tag: 'Ordinal', reason: 'second-noun' },

    // ==== Units ====
    //5 yan
    { match: '#Value+ [#Currency]', group: 0, tag: 'Unit', reason: '5-yan' },
    { match: '#Value [(foot|feet)]', group: 0, tag: 'Unit', reason: 'foot-unit' },
    //5 kg.
    { match: '#Value [#Abbreviation]', group: 0, tag: 'Unit', reason: 'value-abbr' },
    { match: '#Value [k]', group: 0, tag: 'Unit', reason: 'value-k' },
    { match: '#Unit an hour', tag: 'Unit', reason: 'unit-an-hour' },

    // ==== Magnitudes ====
    //minus 7
    { match: '(minus|negative) #Value', tag: 'Value', reason: 'minus-value' },
    //seven point five
    { match: '#Value (point|decimal) #Value', tag: 'Value', reason: 'value-point-value' },
    //quarter million
    { match: '#Determiner [(half|quarter)] #Ordinal', group: 0, tag: 'Value', reason: 'half-ordinal' },
    // thousand and two
    { match: `#Multiple+ and #Value`, tag: 'Value', reason: 'magnitude-and-value' },
    // ambiguous units like 'gb'
    // { match: '#Value square? [(kb|mb|gb|tb|ml|pt|qt|tbl|tbsp|km|cm|mm|mi|ft|yd|kg|hg|mg|oz|lb|mph|pa|miles|yard|yards|pound|pounds)]', group: 0, tag: 'Unit', reason: '12-gb' },
    // 5 miles per hour
    { match: '#Value #Unit [(per|an) (hr|hour|sec|second|min|minute)]', group: 0, tag: 'Unit', reason: '12-miles-per-second' },
    // 5 square miles
    { match: '#Value [(square|cubic)] #Unit', group: 0, tag: 'Unit', reason: 'square-miles' },
  ];

  var person = [
    // ==== Honorifics ====
    { match: '[(1st|2nd|first|second)] #Honorific', group: 0, tag: 'Honorific', reason: 'ordinal-honorific' },
    {
      match: '[(private|general|major|corporal|lord|lady|secretary|premier)] #Honorific? #Person',
      group: 0,
      tag: 'Honorific',
      reason: 'ambg-honorifics',
    },
    // ==== FirstNames ====
    //is foo Smith
    { match: '#Copula [(#Noun|#PresentTense)] #LastName', group: 0, tag: 'FirstName', reason: 'copula-noun-lastname' },
    //pope francis
    {
      match: '(lady|queen|sister|king|pope|father) #ProperNoun',
      tag: 'Person',
      reason: 'lady-titlecase',
      safe: true,
    },

    // ==== Nickname ====
    // Dwayne 'the rock' Johnson
    { match: '#FirstName [#Determiner #Noun] #LastName', group: 0, tag: 'Person', reason: 'first-noun-last' },
    {
      match: '#ProperNoun (b|c|d|e|f|g|h|j|k|l|m|n|o|p|q|r|s|t|u|v|w|x|y|z) #ProperNoun',
      tag: 'Person',
      reason: 'titlecase-acronym-titlecase',
      safe: true,
    },
    { match: '#Acronym #LastName', tag: 'Person', reason: 'acronym-lastname', safe: true },
    { match: '#Person (jr|sr|md)', tag: 'Person', reason: 'person-honorific' },
    //remove single 'mr'
    { match: '#Honorific #Acronym', tag: 'Person', reason: 'Honorific-TitleCase' },
    { match: '#Person #Person the? #RomanNumeral', tag: 'Person', reason: 'roman-numeral' },
    { match: '#FirstName [/^[^aiurck]$/]', group: 0, tag: ['Acronym', 'Person'], reason: 'john-e' },
    //j.k Rowling
    { match: '#Noun van der? #Noun', tag: 'Person', reason: 'van der noun', safe: true },
    //king of spain
    { match: '(king|queen|prince|saint|lady) of #Noun', tag: 'Person', reason: 'king-of-noun', safe: true },
    //lady Florence
    { match: '(prince|lady) #Place', tag: 'Person', reason: 'lady-place' },
    //saint Foo
    { match: '(king|queen|prince|saint) #ProperNoun', tag: 'Person', reason: 'saint-foo' },

    // al sharpton
    { match: 'al (#Person|#ProperNoun)', tag: 'Person', reason: 'al-borlen', safe: true },
    //ferdinand de almar
    { match: '#FirstName de #Noun', tag: 'Person', reason: 'bill-de-noun' },
    //Osama bin Laden
    { match: '#FirstName (bin|al) #Noun', tag: 'Person', reason: 'bill-al-noun' },
    //John L. Foo
    { match: '#FirstName #Acronym #ProperNoun', tag: 'Person', reason: 'bill-acronym-title' },
    //Andrew Lloyd Webber
    { match: '#FirstName #FirstName #ProperNoun', tag: 'Person', reason: 'bill-firstname-title' },
    //Mr Foo
    { match: '#Honorific #FirstName? #ProperNoun', tag: 'Person', reason: 'dr-john-Title' },
    //peter the great
    { match: '#FirstName the #Adjective', tag: 'Person', reason: 'name-the-great' },

    // dick van dyke
    { match: '#ProperNoun (van|al|bin) #ProperNoun', tag: 'Person', reason: 'title-van-title', safe: true },
    //jose de Sucre
    { match: '#ProperNoun (de|du) la? #ProperNoun', tag: 'Person', reason: 'title-de-title' },
    //Jani K. Smith
    { match: '#Singular #Acronym #LastName', tag: '#FirstName #Person .', reason: 'title-acro-noun', safe: true },
    //Foo Ford
    { match: '[#ProperNoun] #Person', group: 0, tag: 'Person', reason: 'proper-person', safe: true },
    // john keith jones
    { match: '#Person [#ProperNoun #ProperNoun]', group: 0, tag: 'Person', ifNo: '#Possessive', reason: 'three-name-person', safe: true },
    //John Foo
    { match: '#FirstName #Acronym? [#ProperNoun]', group: 0, tag: 'LastName', ifNo: '#Possessive', reason: 'firstname-titlecase' },
    // john stewart
    { match: '#FirstName [#FirstName]', group: 0, tag: 'LastName', reason: 'firstname-firstname' },
    //Joe K. Sombrero
    { match: '#FirstName #Acronym #Noun', tag: 'Person', reason: 'n-acro-noun', safe: true },
    //Anthony de Marco
    { match: '#FirstName [(de|di|du|van|von)] #Person', group: 0, tag: 'LastName', reason: 'de-firstname' },
    //Joe springer sr
    { match: '#ProperNoun [#Honorific]', group: 0, tag: 'Person', reason: 'last-sr' },
    // dr john foobar
    { match: '#Honorific #FirstName [#Singular]', group: 0, tag: 'LastName', ifNo: '#Possessive', reason: 'dr-john-foo', safe: true },
    //his-excellency
    {
      match: '[(his|her) (majesty|honour|worship|excellency|honorable)] #Person',
      group: 0,
      tag: ['Honorific', 'Person'],
      reason: 'his-excellency',
    },
    //general pearson
    { match: '#Honorific #Person', tag: 'Person', reason: 'honorific-person' },
  ];

  const personAdj = '(misty|rusty|dusty|rich|randy|sandy|young|earnest|frank|brown)';

  var personName = [
    // ===person-date===
    // in june
    // { match: `(in|during|on|by|after|#Date) [${personDate}]`, group: 0, tag: 'Date', reason: 'in-june' },
    // // june 1992
    // { match: `${personDate} (#Value|#Date)`, tag: 'Date', reason: 'june-5th' },
    // // June Smith
    // { match: `${personDate} #ProperNoun`, tag: 'Person', reason: 'june-smith', safe: true },
    // // june m. Cooper
    // { match: `${personDate} #Acronym? #ProperNoun`, tag: 'Person', ifNo: '#Month', reason: 'june-smith-jr' },
    // // ---person-month---
    // //give to april
    // {
    //   match: `#Infinitive #Determiner? #Adjective? #Noun? (to|for) [${personMonth}]`,
    //   group: 0,
    //   tag: 'Person',
    //   reason: 'ambig-person',
    // },
    // // remind june
    // { match: `#Infinitive [${personMonth}]`, group: 0, tag: 'Person', reason: 'infinitive-person' },
    // // april will
    // { match: `[${personMonth}] #Modal`, group: 0, tag: 'Person', reason: 'ambig-modal' },
    // // would april
    // { match: `#Modal [${personMonth}]`, group: 0, tag: 'Person', reason: 'modal-ambig' },
    // // it is may
    // { match: `#Copula [${personMonth}]`, group: 0, tag: 'Person', reason: 'is-may' },
    // may is
    // { match: `[%Person|Date%] #Copula`, group: 0, tag: 'Person', reason: 'may-is' },
    // may the
    // { match: `[%Person|Date%] the`, group: 0, tag: 'Date', reason: 'may-the' },
    // of may
    // { match: `of [%Person|Date%]`, group: 0, tag: 'Date', reason: 'of-may' },
    // // with april
    // { match: `(that|with|for) [${personMonth}]`, group: 0, tag: 'Person', reason: 'that-month' },
    // // may 5th
    // { match: `[${personMonth}] the? #Value`, group: 0, tag: 'Month', reason: 'may-5th' },

    // ===person-date===
    { match: '%Person|Date% #Acronym? #ProperNoun', tag: 'Person', reason: 'jan-thierson' },
    // ===person-noun===
    //Cliff Clavin
    { match: '%Person|Noun% #Acronym? #ProperNoun', tag: 'Person', reason: 'switch-person', safe: true },
    // olive garden
    { match: '%Person|Noun% #Organization', tag: 'Organization', reason: 'olive-garden' },
    // ===person-verb===
    // ollie faroo
    { match: '%Person|Verb% #Acronym? #ProperNoun', tag: 'Person', reason: 'verb-propernoun' },
    // chuck will ...
    { match: `[%Person|Verb%] (will|had|has|said|says|told|did|learned|wants|wanted)`, group: 0, tag: 'Person', reason: 'person-said' },

    // ===person-place===
    //sydney harbour
    { match: `[%Person|Place%] (harbor|harbour|pier|town|city|place|dump|landfill)`, group: 0, tag: 'Place', reason: 'sydney-harbour' },
    // east sydney
    { match: `(west|east|north|south) [%Person|Place%]`, group: 0, tag: 'Place', reason: 'east-sydney' },

    // ===person-adjective===
    // rusty smith
    { match: `${personAdj} #Person`, tag: 'Person', reason: 'randy-smith' },
    // rusty a. smith
    { match: `${personAdj} #Acronym? #ProperNoun`, tag: 'Person', reason: 'rusty-smith' },
    // very rusty
    { match: `#Adverb [${personAdj}]`, group: 0, tag: 'Adjective', reason: 'really-rich' },

    // ===person-verb===
    // would wade
    { match: `#Modal [%Person|Verb%]`, group: 0, tag: 'Verb', reason: 'would-mark' },
    // really wade
    { match: `#Adverb [%Person|Verb%]`, group: 0, tag: 'Verb', reason: 'really-mark' },
    // drew closer
    { match: `[%Person|Verb%] (#Adverb|#Comparative)`, group: 0, tag: 'Verb', reason: 'drew-closer' },
    // wade smith
    { match: `%Person|Verb% #Person`, tag: 'Person', reason: 'rob-smith' },
    // wade m. Cooper
    { match: `%Person|Verb% #Acronym #ProperNoun`, tag: 'Person', reason: 'rob-a-smith' },
    // will go
    { match: '[will] #Verb', group: 0, tag: 'Modal', reason: 'will-verb' },
    // will Pharell
    { match: '(will && @isTitleCase) #ProperNoun', tag: 'Person', reason: 'will-name' },
  ];

  var verbs$1 = [
    //sometimes adverbs - 'pretty good','well above'
    {
      match: '#Copula (pretty|dead|full|well|sure) (#Adjective|#Noun)',
      tag: '#Copula #Adverb #Adjective',
      reason: 'sometimes-adverb',
    },
    //i better ..
    { match: '(#Pronoun|#Person) (had|#Adverb)? [better] #PresentTense', group: 0, tag: 'Modal', reason: 'i-better' },
    // adj -> gerund
    // like
    { match: '(#Modal|i|they|we|do) not? [like]', group: 0, tag: 'PresentTense', reason: 'modal-like' },
    // ==== Tense ====
    //he left
    { match: '#Noun #Adverb? [left]', group: 0, tag: 'PastTense', reason: 'left-verb' },

    // ==== Copula ====
    //will be running (not copula)
    { match: 'will #Adverb? not? #Adverb? [be] #Gerund', group: 0, tag: 'Copula', reason: 'will-be-copula' },
    //for more complex forms, just tag 'be'
    { match: 'will #Adverb? not? #Adverb? [be] #Adjective', group: 0, tag: 'Copula', reason: 'be-copula' },
    // ==== Infinitive ====
    //march to
    { match: '[march] (up|down|back|toward)', notIf: ['#Date'], group: 0, tag: 'Infinitive', reason: 'march-to' },
    //must march
    { match: '#Modal [march]', group: 0, tag: 'Infinitive', reason: 'must-march' },
    // may be
    { match: `[may] be`, group: 0, tag: 'Verb', reason: 'may-be' },
    // subject to
    { match: `[(subject|subjects|subjected)] to`, group: 0, tag: 'Verb', reason: 'subject to' },
    // subject to
    { match: `[home] to`, group: 0, tag: 'PresentTense', reason: 'home to' },

    // === misc==
    // side with
    // { match: '[(side|fool|monkey)] with', group: 0, tag: 'Infinitive', reason: 'fool-with' },
    // open the door
    { match: '[open] #Determiner', group: 0, tag: 'Infinitive', reason: 'open-the' },
    //were being run
    { match: `(were|was) being [#PresentTense]`, group: 0, tag: 'PastTense', reason: 'was-being' },
    //had been broken
    { match: `(had|has|have) [been /en$/]`, group: 0, tag: 'Auxiliary Participle', reason: 'had-been-broken' },
    //had been smoked
    { match: `(had|has|have) [been /ed$/]`, group: 0, tag: 'Auxiliary PastTense', reason: 'had-been-smoked' },
    //were being run
    { match: `(had|has) #Adverb? [been] #Adverb? #PastTense`, group: 0, tag: 'Auxiliary', reason: 'had-been-adj' },
    //had to walk
    { match: `(had|has) to [#Noun] (#Determiner|#Possessive)`, group: 0, tag: 'Infinitive', reason: 'had-to-noun' },
    // have read
    { match: `have [#PresentTense]`, group: 0, tag: 'PastTense', ifNo: ['come', 'gotten'], reason: 'have-read' },
    // does that work
    { match: `(does|will|#Modal) that [work]`, group: 0, tag: 'PastTense', reason: 'does-that-work' },
    // sounds fun
    { match: `[(sound|sounds)] #Adjective`, group: 0, tag: 'PresentTense', reason: 'sounds-fun' },
    // look good
    { match: `[(look|looks)] #Adjective`, group: 0, tag: 'PresentTense', reason: 'looks-good' },
    // needs to learn
    { match: `[(need|needs)] to #Infinitive`, group: 0, tag: 'PresentTense', reason: 'need-to-learn' },
    // stops thinking
    { match: `[(start|starts|stop|stops|begin|begins)] #Gerund`, group: 0, tag: 'Verb', reason: 'starts-thinking' },
    //were under cooked
    {
      match: `(is|was|were) [(under|over) #PastTense]`,
      group: 0,
      tag: 'Adverb Adjective',
      reason: 'was-under-cooked',
    },

    // damn them
    { match: '[shit] (#Determiner|#Possessive|them)', group: 0, tag: 'Verb', reason: 'swear1-verb' },
    { match: '[damn] (#Determiner|#Possessive|them)', group: 0, tag: 'Verb', reason: 'swear2-verb' },
    { match: '[fuck] (#Determiner|#Possessive|them)', group: 0, tag: 'Verb', reason: 'swear3-verb' },

    // jobs that fit
    { match: '#Plural that %Noun|Verb%', tag: '. #Preposition #Infinitive', reason: 'jobs-that-work' },
    // works for me
    { match: '[works] for me', group: 0, tag: 'PresentTense', reason: 'works-for-me' },
    // no no no
    // { match: 'no+', tag: 'Expression', reason: 'no-no' },


    // { match: '%Plural|Verb% %Noun|Verb%', tag: '#Plural #PresentTense', reason: 'banks-wear' },
  ];

  // these are some of our heaviest-used matches
  var auxiliary = [
    // ==== Auxiliary ====
    // have been
    { match: `will (#Adverb|not)+? [have] (#Adverb|not)+? #Verb`, group: 0, tag: 'Auxiliary', reason: 'will-have-vb' },
    //was walking
    { match: `[#Copula] (#Adverb|not)+? (#Gerund|#PastTense)`, group: 0, tag: 'Auxiliary', reason: 'copula-walking' },
    //would walk
    { match: `#Adverb+? [(#Modal|did)+] (#Adverb|not)+? #Verb`, group: 0, tag: 'Auxiliary', reason: 'modal-verb' },
    //would have had
    { match: `#Modal (#Adverb|not)+? [have] (#Adverb|not)+? [had] (#Adverb|not)+? #Verb`, group: 0, tag: 'Auxiliary', reason: 'would-have' },
    //support a splattering of auxillaries before a verb
    { match: `[(has|had)] (#Adverb|not)+? #PastTense`, group: 0, tag: 'Auxiliary', reason: 'had-walked' },
    // will walk
    { match: '[(do|does|did|will|have|had|has|got)] (not|#Adverb)+? #Verb', group: 0, tag: 'Auxiliary', reason: 'have-had' },
    // about to go
    { match: '[about to] #Adverb? #Verb', group: 0, tag: ['Auxiliary', 'Verb'], reason: 'about-to' },
    //would be walking
    { match: `#Modal (#Adverb|not)+? [be] (#Adverb|not)+? #Verb`, group: 0, tag: 'Auxiliary', reason: 'would-be' },
    //had been walking
    { match: `[(#Modal|had|has)] (#Adverb|not)+? [been] (#Adverb|not)+? #Verb`, group: 0, tag: 'Auxiliary', reason: 'had-been' },
    // was being driven
    { match: '[(be|being|been)] #Participle', group: 0, tag: 'Auxiliary', reason: 'being-driven' },
    // may want
    { match: '[may] #Adverb? #Infinitive', group: 0, tag: 'Auxiliary', reason: 'may-want' },
    // was being walked
    { match: '#Copula (#Adverb|not)+? [(be|being|been)] #Adverb+? #PastTense', group: 0, tag: 'Auxiliary', reason: 'being-walked' },
    // will be walked
    { match: 'will [be] #PastTense', group: 0, tag: 'Auxiliary', reason: 'will-be-x' },
    // been walking
    { match: '[(be|been)] (#Adverb|not)+? #Gerund', group: 0, tag: 'Auxiliary', reason: 'been-walking' },
    // used to walk
    { match: '[used to] #PresentTense', group: 0, tag: 'Auxiliary', reason: 'used-to-walk' },
    // was going to walk
    { match: '#Copula (#Adverb|not)+? [going to] #Adverb+? #PresentTense', group: 0, tag: 'Auxiliary', reason: 'going-to-walk' },
    // tell me
    { match: '#Imperative [(me|him|her)]', group: 0, tag: 'Reflexive', reason: 'tell-him' },
    // there is no x
    { match: '(is|was) #Adverb? [no]', group: 0, tag: 'Negative', reason: 'is-no' },
  ];

  var phrasal = [
    // ==== Phrasal ====
    //'foo-up'
    { match: '(#Verb && @hasHyphen) up', tag: 'PhrasalVerb', reason: 'foo-up' },
    { match: '(#Verb && @hasHyphen) off', tag: 'PhrasalVerb', reason: 'foo-off' },
    { match: '(#Verb && @hasHyphen) over', tag: 'PhrasalVerb', reason: 'foo-over' },
    { match: '(#Verb && @hasHyphen) out', tag: 'PhrasalVerb', reason: 'foo-out' },
    // walk in on
    {
      match: '[#Verb (in|out|up|down|off|back)] (on|in)',
      ifNo: ['#Copula'],
      tag: 'PhrasalVerb Particle',
      reason: 'walk-in-on',
    },
    //fall over
    { match: '#PhrasalVerb [#PhrasalVerb]', group: 0, tag: 'Particle', reason: 'phrasal-particle' },
    // went on for
    { match: '(lived|went|crept|go) [on] for', group: 0, tag: 'PhrasalVerb', reason: 'went-on' },
    // got me thinking
    // { match: '(got|had) me [#Noun]', group: 0, tag: 'Verb', reason: 'got-me-gerund' },
    // help stop
    { match: 'help [(stop|end|make|start)]', group: 0, tag: 'Infinitive', reason: 'help-stop' },
    // start listening
    { match: '[(stop|start|finish|help)] #Gerund', group: 0, tag: 'Infinitive', reason: 'start-listening' },
    // mis-fired
    // { match: '[(mis)] #Verb', group: 0, tag: 'Verb', reason: 'mis-firedsa' },
    //back it up
    {
      match: '#Verb (him|her|it|us|himself|herself|itself|everything|something) [(up|down)]',
      group: 0,
      tag: 'Adverb',
      reason: 'phrasal-pronoun-advb',
    },
  ];

  // this is really hard to do
  const notIf = ['i', 'we', 'they']; //we do not go
  var imperative = [
    // do not go
    { match: '^do not? [#Infinitive #Particle?]', notIf, group: 0, tag: 'Imperative', reason: 'do-eat' },
    // please go
    { match: '^please do? not? [#Infinitive #Particle?]', group: 0, tag: 'Imperative', reason: 'please-go' },
    // just go
    { match: '^just do? not? [#Infinitive #Particle?]', group: 0, tag: 'Imperative', reason: 'just-go' },
    // do it better
    { match: '^[#Infinitive] it #Comparative', notIf, group: 0, tag: 'Imperative', reason: 'do-it-better' },
    // do it again
    { match: '^[#Infinitive] it (please|now|again|plz)', notIf, group: 0, tag: 'Imperative', reason: 'do-it-please' },
    // go!
    // { match: '^[#Infinitive]$', group: 0, tag: 'Imperative', reason: 'go' },
    // go quickly.
    { match: '^[#Infinitive] (#Adjective|#Adverb)$', group: 0, tag: 'Imperative', ifNo: ['so', 'such', 'rather', 'enough'], reason: 'go-quickly' },
    // turn down the noise
    { match: '^[#Infinitive] (up|down|over) #Determiner', group: 0, tag: 'Imperative', reason: 'turn-down' },
    // eat my shorts
    { match: '^[#Infinitive] (your|my|the|some|a|an)', group: 0, ifNo: 'like', tag: 'Imperative', reason: 'eat-my-shorts' },
    // tell him the story
    { match: '^[#Infinitive] (him|her|it|us|me)', group: 0, tag: 'Imperative', reason: 'tell-him' },
    // avoid loud noises
    { match: '^[#Infinitive] #Adjective #Noun$', group: 0, tag: 'Imperative', reason: 'avoid-loud-noises' },
    // one-word imperatives
    { match: '^(go|stop|wait|hurry) please?$', tag: 'Imperative', reason: 'go' },
    // somebody call
    { match: '^(somebody|everybody) [#Infinitive]', group: 0, tag: 'Imperative', reason: 'somebody-call' },
    // let's leave
    { match: '^let (us|me) [#Infinitive]', group: 0, tag: 'Imperative', reason: 'lets-leave' },
    // shut the door
    { match: '^[(shut|close|open|start|stop|end|keep)] #Determiner #Noun', group: 0, tag: 'Imperative', reason: 'shut-the-door' },
    // go to toronto
    { match: '^[go] to .', group: 0, tag: 'Imperative', reason: 'go-to-toronto' },
    // would you recommend
    { match: '^#Modal you [#Infinitive]', group: 0, tag: 'Imperative', reason: 'would-you-' },
    // never say
    { match: '^never [#Infinitive]', group: 0, tag: 'Imperative', reason: 'never-stop' },
    // stay away
    { match: '^stay (out|away|back)', tag: 'Imperative', reason: 'stay-away' },
    // stay cool
    { match: '^[stay] #Adjective', tag: 'Imperative', reason: 'stay-cool' },
    // keep it silent
    { match: '^[keep it] #Adjective', group: 0, tag: 'Imperative', reason: 'keep-it-cool' },
    // don't be late
    { match: '^do not [#Infinitive]', group: 0, tag: 'Imperative', reason: 'do-not-be' },
    // allow yourself
    { match: '[#Infinitive] (yourself|yourselves)', group: 0, tag: 'Imperative', reason: 'allow-yourself' },
  ];

  var adjGerund = [
    // that were growing
    { match: '(that|which) were [%Adj|Gerund%]', group: 0, tag: 'Gerund', reason: 'that-were-growing' },


    // { match: '(that|which) were [%Adj|Gerund%]', group: 0, tag: 'Gerund', reason: 'that-were-growing' },

  ];

  // order matters
  let matches$1 = [
    // u r cool
    { match: 'u r', tag: '#Pronoun #Copula', reason: 'u r' },
    { match: '#Noun [(who|whom)]', group: 0, tag: 'Determiner', reason: 'captain-who' },

    // ==== Conditions ====
    // had he survived,
    { match: '[had] #Noun+ #PastTense', group: 0, tag: 'Condition', reason: 'had-he' },
    // were he to survive
    { match: '[were] #Noun+ to #Infinitive', group: 0, tag: 'Condition', reason: 'were-he' },

    //swear-words as non-expression POS
    { match: 'holy (shit|fuck|hell)', tag: 'Expression', reason: 'swears-expression' },
    // well..
    { match: '^(well|so|okay|now)', tag: 'Expression', reason: 'well-' },
    // some sort of
    { match: 'some sort of', tag: 'Adjective Noun Conjunction', reason: 'some-sort-of' },
    // some of
    // { match: 'some of', tag: 'Noun Conjunction', reason: 'some-of' },
    // of some sort
    { match: 'of some sort', tag: 'Conjunction Adjective Noun', reason: 'of-some-sort' },

    // such skill
    { match: '[such] (a|an|is)? #Noun', group: 0, tag: 'Determiner', reason: 'such-skill' },
    // that is
    // { match: '^[that] (is|was)', group: 0, tag: 'Noun', reason: 'that-is' },

    // sorry
    { match: '(say|says|said) [sorry]', group: 0, tag: 'Expression', reason: 'say-sorry' },

    // double-prepositions
    // rush out of
    {
      match: '#Verb [(out|for|through|about|around|in|down|up|on|off)] #Preposition',
      group: 0,
      ifNo: ['#Copula'],//were out
      tag: 'Particle',
      reason: 'rush-out',
    },
    // at about
    { match: '#Preposition [about]', group: 0, tag: 'Adjective', reason: 'at-about' },
    // dude we should
    { match: '^[(dude|man|girl)] #Pronoun', group: 0, tag: 'Expression', reason: 'dude-i' },
    // are welcome
    // { match: '#Copula [#Expression]', group: 0, tag: 'Noun', reason: 'are-welcome' },
  ];
  var misc$1 = matches$1;

  // import orgWords from './_orgWords.js'
  // let orgMap = `(${orgWords.join('|')})`

  /*
  const multi = [
    'building society',
    'central bank',
    'department store',
    'institute of technology',
    'liberation army',
    'people party',
    'social club',
    'state police',
    'state university',
  ]
  */

  var orgs$1 = [
    // Foo University
    // { match: `#Noun ${orgMap}`, tag: 'Organization', safe: true, reason: 'foo-university' },
    // // University of Toronto
    // { match: `${orgMap} of #Place`, tag: 'Organization', safe: true, reason: 'university-of-foo' },

    // // foo regional health authority
    // { match: `${orgMap} (health|local|regional)+ authority`, tag: 'Organization', reason: 'regional-health' },
    // // foo stock exchange
    // { match: `${orgMap} (stock|mergantile)+ exchange`, tag: 'Organization', reason: 'stock-exchange' },
    // // foo news service
    // { match: `${orgMap} (daily|evening|local)+ news service?`, tag: 'Organization', reason: 'foo-news' },

    //John & Joe's
    { match: '#Noun (&|n) #Noun', tag: 'Organization', reason: 'Noun-&-Noun' },
    // teachers union of Ontario
    { match: '#Organization of the? #ProperNoun', tag: 'Organization', reason: 'org-of-place', safe: true },
    //walmart USA
    { match: '#Organization #Country', tag: 'Organization', reason: 'org-country' },
    //organization
    { match: '#ProperNoun #Organization', tag: 'Organization', reason: 'titlecase-org' },
    //FitBit Inc
    { match: '#ProperNoun (ltd|co|inc|dept|assn|bros)', tag: 'Organization', reason: 'org-abbrv' },
    // the OCED
    { match: 'the [#Acronym]', group: 0, tag: 'Organization', reason: 'the-acronym', safe: true },
    // global trade union
    {
      match: '(world|global|international|national|#Demonym) #Organization',
      tag: 'Organization',
      reason: 'global-org',
    },
    // schools
    { match: '#Noun+ (public|private) school', tag: 'School', reason: 'noun-public-school' },
  ];

  var places$1 = [
    // ==== Region ====
    //West Norforlk
    {
      match: '(west|north|south|east|western|northern|southern|eastern)+ #Place',
      tag: 'Region',
      reason: 'west-norfolk',
    },
    //some us-state acronyms (exlude: al, in, la, mo, hi, me, md, ok..)
    {
      match: '#City [(al|ak|az|ar|ca|ct|dc|fl|ga|id|il|nv|nh|nj|ny|oh|pa|sc|tn|tx|ut|vt|pr)]',
      group: 0,
      tag: 'Region',
      reason: 'us-state',
    },
    // portland oregon
    {
      match: 'portland [or]',
      group: 0,
      tag: 'Region',
      reason: 'portland-or',
    },
    //Foo District
    {
      match: '#ProperNoun+ (district|region|province|county|prefecture|municipality|territory|burough|reservation)',
      tag: 'Region',
      reason: 'foo-district',
    },
    //District of Foo
    {
      match: '(district|region|province|municipality|territory|burough|state) of #ProperNoun',
      tag: 'Region',
      reason: 'district-of-Foo',
    },
    // in Foo California
    {
      match: 'in [#ProperNoun] #Place',
      group: 0,
      tag: 'Place',
      reason: 'propernoun-place',
    },
    // ==== Address ====
    {
      match: '#Value #Noun (st|street|rd|road|crescent|cr|way|tr|terrace|avenue|ave)',
      tag: 'Address',
      reason: 'address-st',
    },
  ];

  var conjunctions = [
    // ==== Conjunctions ====
    { match: '[so] #Noun', group: 0, tag: 'Conjunction', reason: 'so-conj' },
    //how he is driving
    {
      match: '[(who|what|where|why|how|when)] #Noun #Copula #Adverb? (#Verb|#Adjective)',
      group: 0,
      tag: 'Conjunction',
      reason: 'how-he-is-x',
    },
    // when he
    { match: '#Copula [(who|what|where|why|how|when)] #Noun', group: 0, tag: 'Conjunction', reason: 'when-he' },
    // says that he..
    { match: '#Verb [that] #Pronoun', group: 0, tag: 'Conjunction', reason: 'said-that-he' },
    // things that are required
    { match: '#Noun [that] #Copula', group: 0, tag: 'Conjunction', reason: 'that-are' },
    // things that seem cool
    { match: '#Noun [that] #Verb #Adjective', group: 0, tag: 'Conjunction', reason: 'that-seem' },
    // wasn't that wide..
    { match: '#Noun #Copula not? [that] #Adjective', group: 0, tag: 'Adverb', reason: 'that-adj' },

    // ==== Prepositions ====
    //all students
    { match: '#Verb #Adverb? #Noun [(that|which)]', group: 0, tag: 'Preposition', reason: 'that-prep' },
    //work, which has been done.
    { match: '@hasComma [which] (#Pronoun|#Verb)', group: 0, tag: 'Preposition', reason: 'which-copula' },
    //folks like her
    { match: '#Noun [like] #Noun', group: 0, tag: 'Preposition', reason: 'noun-like' },
    //like the time
    { match: '^[like] #Determiner', group: 0, tag: 'Preposition', reason: 'like-the' },
    // really like
    { match: '#Adverb [like]', group: 0, tag: 'Verb', reason: 'really-like' },
    // nothing like
    { match: '(not|nothing|never) [like]', group: 0, tag: 'Preposition', reason: 'nothing-like' },
    // treat them like
    { match: '#Verb #Pronoun [like]', group: 0, tag: 'Preposition', reason: 'treat-them-like' },




    // ==== Questions ====
    // where
    // why
    // when
    // who
    // whom
    // whose
    // what
    // which
    //the word 'how many'
    // { match: '^(how|which)', tag: 'QuestionWord', reason: 'how-question' },
    // how-he, when the
    { match: '[#QuestionWord] (#Pronoun|#Determiner)', group: 0, tag: 'Preposition', reason: 'how-he' },
    // when stolen
    { match: '[#QuestionWord] #Participle', group: 0, tag: 'Preposition', reason: 'when-stolen' },
    // how is
    { match: '[how] (#Determiner|#Copula|#Modal|#PastTense)', group: 0, tag: 'QuestionWord', reason: 'how-is' },
    // children who dance
    { match: '#Plural [(who|which|when)] .', group: 0, tag: 'Preposition', reason: 'people-who' },
  ];

  let matches = [].concat(
    adj,
    advAdj,
    gerundAdj,
    nounAdj,
    adv,
    ambigDates,
    dates,
    noun,
    gerundNouns,
    presNouns,
    money,
    fractions$1,
    numbers$2,
    person,
    personName,
    verbs$1,
    adjVerb,
    auxiliary,
    phrasal,
    imperative,
    adjGerund,
    misc$1,
    orgs$1,
    places$1,
    conjunctions
  );
  var model = {
    two: {
      matches,
    },
  };

  let net$1 = null;

  // runs all match/tag patterns in model.two.matches
  const postTagger = function (view) {
    const { world } = view;
    const { model, methods } = world;
    net$1 = net$1 || methods.one.buildNet(model.two.matches, world);
    // perform these matches on a comma-seperated document
    let document = methods.two.quickSplit(view.document);
    let ptrs = document.map(terms => {
      let t = terms[0];
      return [t.index[0], t.index[1], t.index[1] + terms.length]
    });
    let m = view.update(ptrs);
    m.cache();
    m.sweep(net$1);
    view.uncache();
    // view.cache()
    return view
  };

  // helper function for compute('tagger')
  const tagger = (view) => view.compute(['lexicon', 'preTagger', 'postTagger']);

  var compute$1 = { postTagger, tagger };

  const round$1 = n => Math.round(n * 100) / 100;

  function api$k (View) {
    // average tagger score
    View.prototype.confidence = function () {
      let sum = 0;
      let count = 0;
      this.docs.forEach(terms => {
        terms.forEach(term => {
          count += 1;
          sum += term.confidence || 1;
        });
      });
      if (count === 0) {
        return 1
      }
      return round$1(sum / count)
    };

    // (re-) run the POS-tagger
    View.prototype.tagger = function () {
      return this.compute(['tagger'])
    };
  }

  const plugin$3 = {
    api: api$k,
    compute: compute$1,
    model,
    hooks: ['postTagger'],
  };
  var postTag = plugin$3;

  const getWords$1 = function (net) {
    return Object.keys(net.hooks).filter(w => !w.startsWith('#') && !w.startsWith('%'))
  };

  const maybeMatch$2 = function (doc, net) {
    // must have *atleast* one of these words
    let words = getWords$1(net);
    if (words.length === 0) {
      return doc
    }
    if (!doc._cache) {
      doc.cache();
    }
    let cache = doc._cache;
    // return sentences that have one of our needed words
    return doc.filter((_m, i) => {
      return words.some(str => cache[i].has(str))
    })
  };
  var maybeMatch$3 = maybeMatch$2;

  // tokenize first, then only tag sentences required
  const lazyParse$2 = function (input, reg) {
    let net = reg;
    if (typeof reg === 'string') {
      net = this.buildNet([{ match: reg }]);
    }
    let doc = this.tokenize(input);
    let m = maybeMatch$3(doc, net);
    if (m.found) {
      m.compute(['index', 'tagger']);
      return m.match(reg)
    }
    return doc.none()
  };
  var lazy$2 = lazyParse$2;

  var lazy$1 = {
    lib: {
      lazy: lazy$2
    }
  };

  const matchVerb = function (m, lemma) {
    const conjugate = m.methods.two.transform.verbConjugate;
    let all = conjugate(lemma, m.model);
    if (m.has('#PastTense')) {
      return all.PastTense
    }
    if (m.has('#PresentTense')) {
      return all.PresentTense
    }
    if (m.has('#Gerund')) {
      return all.Gerund
    }
    return lemma
  };

  const swapVerb = function (m, lemma) {
    let str = lemma;
    if (!m.has('#Infinitive')) {
      str = matchVerb(m, lemma);
    }
    m.replaceWith(str);
  };
  var swapVerb$1 = swapVerb;

  const swapNoun = function (m, lemma) {
    let str = lemma;
    if (m.has('#Plural')) {
      const toPlural = m.methods.two.transform.nounToPlural;
      str = toPlural(lemma, m.model);
    }
    m.replaceWith(str);
  };

  const swapAdverb = function (m, lemma) {
    const toAdverb = m.methods.two.transform.adjToAdverb;
    let str = lemma;
    let adv = toAdverb(str);
    if (adv) {
      m.replaceWith(adv);
    }
  };

  const swap$1 = function (from, to, tag) {
    let m = this.match(`{${from}}`);
    // guard against some homonyms
    if (tag) {
      m = m.if(tag);
    }
    if (m.has('#Verb')) {
      return swapVerb$1(m, to)
    }
    if (m.has('#Noun')) {
      return swapNoun(m, to)
    }
    if (m.has('#Adverb')) {
      return swapAdverb(m, to)
    }
    return this
  };
  var swap$2 = swap$1;

  const api$j = function (View) {
    View.prototype.swap = swap$2;
  };

  var swap = {
    api: api$j
  };

  nlp$1.plugin(preTag); //~103kb  
  nlp$1.plugin(contractionTwo); //
  nlp$1.plugin(postTag); //~33kb
  nlp$1.plugin(lazy$1); //
  nlp$1.plugin(swap); //

  const clauses = function (n) {
    // an awkward way to disambiguate a comma use
    let commas = this.if('@hasComma')
      .ifNo('@hasComma @hasComma') //fun, cool...
      .ifNo('@hasComma (and|or) .') //cool, and fun
      .ifNo('(#City && @hasComma) #Country') //'toronto, canada'
      .ifNo('(#WeekDay && @hasComma) #Date') //'tuesday, march 2nd'
      .ifNo('(#Date+ && @hasComma) #Value') //'july 6, 1992'
      .ifNo('@hasComma (too|also)$') //at end of sentence
      .match('@hasComma');
    let found = this.splitAfter(commas);

    // let quotes = found.quotations()
    // found = found.splitOn(quotes)

    // let parentheses = found.parentheses()
    // found = found.splitOn(parentheses)

    // it is cool and it is ..
    let conjunctions = found.if('#Copula #Adjective #Conjunction (#Pronoun|#Determiner) #Verb').match('#Conjunction');
    found = found.splitBefore(conjunctions);

    // if it is this then that
    let condition = found.if('if .{2,9} then .').match('then');
    found = found.splitBefore(condition);

    // misc clause partitions
    found = found.splitBefore('as well as .');
    found = found.splitBefore('such as .');
    found = found.splitBefore('in addition to .');

    // semicolons, dashes
    found = found.splitAfter('@hasSemicolon');
    found = found.splitAfter('@hasDash');

    // passive voice verb - '.. which was robbed is empty'
    // let passive = found.match('#Noun (which|that) (was|is) #Adverb? #PastTense #Adverb?')
    // if (passive.found) {
    //   found = found.splitAfter(passive)
    // }
    // //which the boy robbed
    // passive = found.match('#Noun (which|that) the? #Noun+ #Adverb? #PastTense #Adverb?')
    // if (passive.found) {
    //   found = found.splitAfter(passive)
    // }
    // does there appear to have relative/subordinate clause still?
    let tooLong = found.filter(d => d.wordCount() > 5 && d.match('#Verb+').length >= 2);
    if (tooLong.found) {
      let m = tooLong.splitAfter('#Noun .* #Verb .* #Noun+');
      found = found.splitOn(m.eq(0));
    }

    if (typeof n === 'number') {
      found = found.get(n);
    }
    return found
  };

  var clauses$1 = clauses;

  const chunks = function () {
    let carry = [];
    let ptr = null;
    let current = null;
    this.docs.forEach(terms => {
      terms.forEach(term => {
        // start a new chunk
        if (term.chunk !== current) {
          if (ptr) {
            ptr[2] = term.index[1];
            carry.push(ptr);
          }
          current = term.chunk;
          ptr = [term.index[0], term.index[1]];
        }
      });
    });
    if (ptr) {
      carry.push(ptr);
    }
    let parts = this.update(carry);
    // split up verb-phrases, and noun-phrases
    parts = parts.map(c => {
      if (c.has('<Noun>')) {
        return c.nouns()
      }
      // if (c.has('<Verb>')) {
      //   if (c.verbs().length > 1) {
      //     console.log(c.text())
      //   }
      // }
      return c
    });
    return parts
  };
  var getChunks = chunks;

  const api$h = function (View) {
    View.prototype.chunks = getChunks;
    View.prototype.clauses = clauses$1;
  };
  var api$i = api$h;

  const byWord = {
    this: 'Noun',
    then: 'Pivot'
  };

  // simply chunk Nouns as <Noun>
  const easyMode = function (document) {
    for (let n = 0; n < document.length; n += 1) {
      for (let t = 0; t < document[n].length; t += 1) {
        let term = document[n][t];

        if (byWord.hasOwnProperty(term.normal) === true) {
          term.chunk = byWord[term.normal];
          continue
        }
        if (term.tags.has('Verb')) {
          term.chunk = 'Verb';
          continue
        }
        if (term.tags.has('Noun') || term.tags.has('Determiner')) {
          term.chunk = 'Noun';
          continue
        }
        // 100 cats
        if (term.tags.has('Value')) {
          term.chunk = 'Noun';
          continue
        }
        //
        if (term.tags.has('QuestionWord')) {
          term.chunk = 'Pivot';
          continue
        }

      }
    }
  };
  var easyMode$1 = easyMode;

  // simply chunk Nouns as <Noun>
  const byNeighbour = function (document) {
    for (let n = 0; n < document.length; n += 1) {
      for (let t = 0; t < document[n].length; t += 1) {
        let term = document[n][t];
        if (term.chunk) {
          continue
        }
        // based on next-term
        let onRight = document[n][t + 1];
        // based on last-term
        let onLeft = document[n][t - 1];

        //'is cool' vs 'the cool dog'
        if (term.tags.has('Adjective')) {
          // 'is cool'
          if (onLeft && onLeft.tags.has('Copula')) {
            term.chunk = 'Adjective';
            continue
          }
          // 'the cool'
          if (onLeft && onLeft.tags.has('Determiner')) {
            term.chunk = 'Noun';
            continue
          }
          // 'cool dog'
          if (onRight && onRight.tags.has('Noun')) {
            term.chunk = 'Noun';
            continue
          }
          continue
        }
        // 'really swimming' vs 'really cool'
        if (term.tags.has('Adverb') || term.tags.has('Negative')) {
          if (onLeft && onLeft.tags.has('Adjective')) {
            term.chunk = 'Adjective';
            continue
          }
          if (onLeft && onLeft.tags.has('Verb')) {
            term.chunk = 'Verb';
            continue
          }

          if (onRight && onRight.tags.has('Adjective')) {
            term.chunk = 'Adjective';
            continue
          }
          if (onRight && onRight.tags.has('Verb')) {
            term.chunk = 'Verb';
            continue
          }
        }
      }
    }
  };
  var byNeighbour$1 = byNeighbour;

  const rules = [
    // === Conjunction ===
    // that the houses
    { match: '[that] #Determiner #Noun', group: 0, chunk: 'Pivot' },
    // estimated that
    { match: '#PastTense [that]', group: 0, chunk: 'Pivot' },

    // === Adjective ===
    // was really nice
    { match: '#Copula #Adverb+? [#Adjective]', group: 0, chunk: 'Adjective' },
    // was nice
    // { match: '#Copula [#Adjective]', group: 0, chunk: 'Adjective' },
    // nice and cool
    { match: '#Adjective and #Adjective', chunk: 'Adjective' },
    // really nice
    // { match: '#Adverb+ #Adjective', chunk: 'Adjective' },

    // === Verb ===
    // quickly run
    // { match: '#Adverb+ {Verb}', chunk: 'Verb' },
    // quickly and suddenly run
    { match: '#Adverb+ and #Adverb #Verb', chunk: 'Verb' },
    // run quickly
    // { match: '{Verb} #Adverb+', chunk: 'Verb' },
    // sitting near
    { match: '#Gerund #Adjective', chunk: 'Verb' },
    // going to walk
    { match: '#Gerund to #Verb', chunk: 'Verb' },
    // is no
    // { match: '#Copula no', chunk: 'Verb' },
    // had not
    // { match: '#Verb #Negative', chunk: 'Verb' },
    // not seen
    // { match: '#Negative #Verb', chunk: 'Verb' },
    // not really
    // { match: '#Negative #Adverb ', chunk: 'Verb' },
    // really not
    { match: '#Adverb #Negative', chunk: 'Verb' },
    // want to see
    { match: '(want|wants|wanted) to #Infinitive', chunk: 'Verb' },
    // walk ourselves
    { match: '#Verb #Reflexive', chunk: 'Verb' },
    // tell him the story
    { match: '#PresentTense [#Pronoun] #Determiner', group: 0, chunk: 'Verb' },
    // tries to walk
    { match: '#Verb [to] #Adverb? #Infinitive', group: 0, chunk: 'Verb' },
    // upon seeing
    { match: '[#Preposition] #Gerund', group: 0, chunk: 'Verb' },

    // === Noun ===
    // the brown fox
    // { match: '#Determiner #Adjective+ #Noun', chunk: 'Noun' },
    // the fox
    // { match: '(the|this) <Noun>', chunk: 'Noun' },
    // brown fox
    // { match: '#Adjective+ <Noun>', chunk: 'Noun' },
    // --- of ---
    // son of a gun
    { match: '#Noun of #Determiner? #Noun', chunk: 'Noun' },
    // --- in ---
    { match: '#Noun in #Determiner? #Noun', chunk: 'Noun' },
    // indoor and outdoor seating
    { match: '#Singular and #Determiner? #Singular', chunk: 'Noun' },
    // that is why
    // { match: '[that] (is|was)', group: 0, chunk: 'Noun' },
  ];

  let net = null;
  const matcher = function (view, _, world) {
    const { methods } = world;
    net = net || methods.one.buildNet(rules, world);
    view.sweep(net);
  };
  var matcher$1 = matcher;

  const setChunk = function (term, chunk) {
    const env = typeof process === 'undefined' || !process.env ? self.env || {} : process.env;
    if (env.DEBUG_CHUNKS) {
      let str = (term.normal + "'").padEnd(8);
      console.log(`  | '${str}  →  \x1b[34m${chunk.padEnd(12)}\x1b[0m \x1b[2m -fallback- \x1b[0m`); // eslint-disable-line
    }
    term.chunk = chunk;
  };

  // ensure everything has a chunk
  const fallback = function (document) {
    for (let n = 0; n < document.length; n += 1) {
      for (let t = 0; t < document[n].length; t += 1) {
        let term = document[n][t];
        if (term.chunk === undefined) {
          // conjunctions stand alone
          if (term.tags.has('Conjunction')) {
            setChunk(term, 'Pivot');
          } else if (term.tags.has('Preposition')) {
            setChunk(term, 'Pivot');
          } else if (term.tags.has('Adverb')) {
            setChunk(term, 'Verb');
          }
          // just take the chunk on the right?
          // else if (document[n][t + 1] && document[n][t + 1].chunk) {
          //   setChunk(term, document[n][t + 1].chunk)
          // }
          // // or take the chunk on the left
          // else if (document[n][t - 1] && document[n][t - 1].chunk) {
          //   setChunk(term, document[n][t - 1].chunk)
          else {
            //  ¯\_(ツ)_/¯
            term.chunk = 'Noun';
          }
        }
      }
    }
  };
  var fallback$1 = fallback;

  const fixUp = function (docs) {
    let byChunk = [];
    let current = null;
    docs.forEach(terms => {
      // ensure an adjective chunk is preceded by a copula
      for (let i = 0; i < terms.length; i += 1) {
        let term = terms[i];
        if (current && term.chunk === current) {
          byChunk[byChunk.length - 1].terms.push(term);
        } else {
          byChunk.push({ chunk: term.chunk, terms: [term] });
          current = term.chunk;
        }
      }
    });
    // ensure every verb-phrase actually has a verb
    byChunk.forEach(c => {
      if (c.chunk === 'Verb') {
        const hasVerb = c.terms.find(t => t.tags.has('Verb'));
        if (!hasVerb) {
          c.terms.forEach(t => t.chunk = null);
        }
      }
    });
  };
  var fixUp$1 = fixUp;

  /* Chunks:
      Noun
      Verb
      Adjective
      Pivot
  */

  const findChunks = function (view) {
    const { document, world } = view;
    easyMode$1(document);
    byNeighbour$1(document);
    matcher$1(view, document, world);
    // matcher(view, document, world) //run it 2nd time
    fallback$1(document);
    fixUp$1(document);
  };
  var compute = { chunks: findChunks };

  var chunker = {
    compute: compute,
    api: api$i,
    hooks: ['chunks'],
  };

  // return the nth elem of a doc
  const getNth$f = (doc, n) => (typeof n === 'number' ? doc.eq(n) : doc);
  const apostropheS = /'s$/;

  const find$b = function (doc) {
    let m = doc.match('#Possessive+');
    // expand it to include 'john smith's'
    if (m.has('#Person')) {
      m = m.growLeft('#Person+');
    }
    if (m.has('#Place')) {
      m = m.growLeft('#Place+');
    }
    if (m.has('#Organization')) {
      m = m.growLeft('#Organization+');
    }
    return m
  };


  const api$g = function (View) {

    class Possessives extends View {
      constructor(document, pointer, groups) {
        super(document, pointer, groups);
        this.viewType = 'Possessives';
      }
      strip() {
        this.docs.forEach(terms => {
          terms.forEach(term => {
            term.text = term.text.replace(apostropheS, '');
            term.normal = term.normal.replace(apostropheS, '');
          });
        });
        return this
      }
    }

    View.prototype.possessives = function (n) {
      let m = find$b(this);
      m = getNth$f(m, n);
      return new Possessives(m.document, m.pointer)
    };
  };
  var addPossessives = api$g;

  const hasOpen$1 = /\(/;
  const hasClosed$1 = /\)/;

  const findEnd$1 = function (terms, i) {
    for (; i < terms.length; i += 1) {
      if (terms[i].post && hasClosed$1.test(terms[i].post)) {
        return i
      }
    }
    return null
  };

  const find$a = function (doc) {
    let ptrs = [];
    doc.docs.forEach(terms => {
      for (let i = 0; i < terms.length; i += 1) {
        let term = terms[i];
        if (term.pre && hasOpen$1.test(term.pre)) {
          let end = findEnd$1(terms, i);
          if (end !== null) {
            let [n, start] = terms[i].index;
            ptrs.push([n, start, end + 1, terms[i].id]);
            i = end;
          }
        }
      }
    });
    return doc.update(ptrs)
  };

  const strip$1 = function (m) {
    m.docs.forEach(terms => {
      terms[0].pre = terms[0].pre.replace(hasOpen$1, '');
      let last = terms[terms.length - 1];
      last.post = last.post.replace(hasClosed$1, '');
    });
    return m
  };

  const getNth$e = (doc, n) => (typeof n === 'number' ? doc.eq(n) : doc);

  const api$f = function (View) {

    class Parentheses extends View {
      constructor(document, pointer, groups) {
        super(document, pointer, groups);
        this.viewType = 'Possessives';
      }
      strip() {
        return strip$1(this)
      }
    }

    View.prototype.parentheses = function (n) {
      let m = find$a(this);
      m = getNth$e(m, n);
      return new Parentheses(m.document, m.pointer)
    };
  };
  var addParentheses = api$f;

  const pairs = {
    '\u0022': '\u0022', // 'StraightDoubleQuotes'
    '\uFF02': '\uFF02', // 'StraightDoubleQuotesWide'
    '\u0027': '\u0027', // 'StraightSingleQuotes'
    '\u201C': '\u201D', // 'CommaDoubleQuotes'
    '\u2018': '\u2019', // 'CommaSingleQuotes'
    '\u201F': '\u201D', // 'CurlyDoubleQuotesReversed'
    '\u201B': '\u2019', // 'CurlySingleQuotesReversed'
    '\u201E': '\u201D', // 'LowCurlyDoubleQuotes'
    '\u2E42': '\u201D', // 'LowCurlyDoubleQuotesReversed'
    '\u201A': '\u2019', // 'LowCurlySingleQuotes'
    '\u00AB': '\u00BB', // 'AngleDoubleQuotes'
    '\u2039': '\u203A', // 'AngleSingleQuotes'
    // Prime 'non quotation'
    '\u2035': '\u2032', // 'PrimeSingleQuotes'
    '\u2036': '\u2033', // 'PrimeDoubleQuotes'
    '\u2037': '\u2034', // 'PrimeTripleQuotes'
    // Prime 'quotation' variation
    '\u301D': '\u301E', // 'PrimeDoubleQuotes'
    '\u0060': '\u00B4', // 'PrimeSingleQuotes'
    '\u301F': '\u301E', // 'LowPrimeDoubleQuotesReversed'
  };

  const hasOpen = RegExp('(' + Object.keys(pairs).join('|') + ')');
  const hasClosed = RegExp('(' + Object.values(pairs).join('|') + ')');

  const findEnd = function (terms, i) {
    const have = terms[i].pre.match(hasOpen)[0] || '';
    if (!have || !pairs[have]) {
      return null
    }
    const want = pairs[have];
    for (; i < terms.length; i += 1) {
      if (terms[i].post && terms[i].post.match(want)) {
        return i
      }
    }
    return null
  };

  const find$9 = function (doc) {
    let ptrs = [];
    doc.docs.forEach(terms => {
      for (let i = 0; i < terms.length; i += 1) {
        let term = terms[i];
        if (term.pre && hasOpen.test(term.pre)) {
          let end = findEnd(terms, i);
          if (end !== null) {
            let [n, start] = terms[i].index;
            ptrs.push([n, start, end + 1, terms[i].id]);
            i = end;
          }
        }
      }
    });
    return doc.update(ptrs)
  };

  const strip = function (m) {
    m.docs.forEach(terms => {
      terms[0].pre = terms[0].pre.replace(hasOpen, '');
      let lastTerm = terms[terms.length - 1];
      lastTerm.post = lastTerm.post.replace(hasClosed, '');
    });
  };

  const getNth$d = (doc, n) => (typeof n === 'number' ? doc.eq(n) : doc);

  const api$e = function (View) {

    class Quotations extends View {
      constructor(document, pointer, groups) {
        super(document, pointer, groups);
        this.viewType = 'Possessives';
      }
      strip() {
        return strip(this)
      }
    }

    View.prototype.quotations = function (n) {
      let m = find$9(this);
      m = getNth$d(m, n);
      return new Quotations(m.document, m.pointer)
    };
  };
  var addQuotations = api$e;

  // return the nth elem of a doc
  const getNth$c = (doc, n) => (typeof n === 'number' ? doc.eq(n) : doc);
  const hasPeriod = /\./g;

  const api$d = function (View) {

    class Acronyms extends View {
      constructor(document, pointer, groups) {
        super(document, pointer, groups);
        this.viewType = 'Acronyms';
      }
      strip() {
        this.docs.forEach(terms => {
          terms.forEach(term => {
            term.text = term.text.replace(hasPeriod, '');
            term.normal = term.normal.replace(hasPeriod, '');
          });
        });
        return this
      }
      addPeriods() {
        this.docs.forEach(terms => {
          terms.forEach(term => {
            term.text = term.text.replace(hasPeriod, '');
            term.normal = term.normal.replace(hasPeriod, '');
            term.text = term.text.split('').join('.') + '.';
            term.normal = term.normal.split('').join('.') + '.';
          });
        });
        return this
      }
    }

    View.prototype.acronyms = function (n) {
      let m = this.match('#Acronym');
      m = getNth$c(m, n);
      return new Acronyms(m.document, m.pointer)
    };
  };
  var addAcronyms = api$d;

  // return the nth elem of a doc
  const getNth$b = (doc, n) => (typeof n === 'number' ? doc.eq(n) : doc);

  const api$c = function (View) {

    class Adverbs extends View {
      constructor(document, pointer, groups) {
        super(document, pointer, groups);
        this.viewType = 'Adverbs';
      }
      json(opts = {}) {
        const toAdj = this.methods.two.transform.advToAdjective;
        opts.normal = true;
        return this.map(m => {
          let json = m.toView().json(opts)[0] || {};
          json.adverb = {
            adjective: toAdj(json.normal)
          };
          return json
        }, [])
      }
    }

    View.prototype.adverbs = function (n) {
      let m = this.match('#Adverb');
      m = getNth$b(m, n);
      return new Adverbs(m.document, m.pointer)
    };
  };
  var addAdverbs = api$c;

  // return the nth elem of a doc
  const getNth$a = (doc, n) => (typeof n === 'number' ? doc.eq(n) : doc);

  // guard against superlative+comparative forms
  const toRoot = function (adj) {
    const { adjFromComparative, adjFromSuperlative } = adj.methods.two.transform;
    let str = adj.text('normal');
    if (adj.has('#Comparative')) {
      return adjFromComparative(str, adj.model)
    }
    if (adj.has('#Superlative')) {
      return adjFromSuperlative(str, adj.model)
    }
    return str
  };

  const api$b = function (View) {

    class Adjectives extends View {
      constructor(document, pointer, groups) {
        super(document, pointer, groups);
        this.viewType = 'Adjectives';
      }
      json(opts = {}) {
        const { adjToAdverb, adjToNoun, adjToSuperlative, adjToComparative } = this.methods.two.transform;
        opts.normal = true;
        return this.map(m => {
          let json = m.toView().json(opts)[0] || {};
          let str = toRoot(m);
          json.adjective = {
            adverb: adjToAdverb(str),
            noun: adjToNoun(str),
            superlative: adjToSuperlative(str, this.model),
            comparative: adjToComparative(str, this.model),
          };
          return json
        }, [])
      }
      adverbs() {
        return this.before('#Adverb+$').concat(this.after('^#Adverb+'))
      }

      toComparative(n) {
        const { adjToComparative } = this.methods.two.transform;
        return getNth$a(this, n).map(adj => {
          let root = toRoot(adj);
          let str = adjToComparative(root, this.model);
          return adj.replaceWith(str)
        })
      }
      toSuperlative(n) {
        const { adjToSuperlative } = this.methods.two.transform;
        return getNth$a(this, n).map(adj => {
          let root = toRoot(adj);
          let str = adjToSuperlative(root, this.model);
          return adj.replaceWith(str)
        })
      }
      toAdverb(n) {
        const { adjToAdverb } = this.methods.two.transform;
        return getNth$a(this, n).map(adj => {
          let root = toRoot(adj);
          let str = adjToAdverb(root, this.model);
          return adj.replaceWith(str)
        })
      }
      toNoun(n) {
        const { adjToNoun } = this.methods.two.transform;
        return getNth$a(this, n).map(adj => {
          let root = toRoot(adj);
          let str = adjToNoun(root, this.model);
          return adj.replaceWith(str)
        })
      }
    }

    View.prototype.adjectives = function (n) {
      let m = this.match('#Adjective');
      m = getNth$a(m, n);
      return new Adjectives(m.document, m.pointer)
    };
    View.prototype.superlatives = function (n) {
      let m = this.match('#Superlative');
      m = getNth$a(m, n);
      return new Adjectives(m.document, m.pointer)
    };
    View.prototype.comparatives = function (n) {
      let m = this.match('#Comparative');
      m = getNth$a(m, n);
      return new Adjectives(m.document, m.pointer)
    };
  };
  var addAdjectives = api$b;

  // return the nth elem of a doc
  const getNth$9 = (doc, n) => (typeof n === 'number' ? doc.eq(n) : doc);

  /** return anything tagged as a phone number */
  const phoneNumbers = function (n) {
    let m = this.splitAfter('@hasComma');
    m = m.match('#PhoneNumber+');
    m = getNth$9(m, n);
    return m
  };

  // setup easy helper methods
  const selections = [
    ['hyphenated', '@hasHyphen .'],
    ['hashTags', '#HashTag'],
    ['emails', '#Email'],
    ['emoji', '#Emoji'],
    ['emoticons', '#Emoticon'],
    ['atMentions', '#AtMention'],
    ['urls', '#Url'],
    ['pronouns', '#Pronoun'],
    ['conjunctions', '#Conjunction'],
    ['prepositions', '#Preposition'],
    ['abbreviations', '#Abbreviation'],
    ['honorifics', '#Honorific'],
  ];

  // aliases
  let aliases = [
    ['emojis', 'emoji'],
    ['atmentions', 'atMentions'],
  ];

  const addMethods = function (View) {
    // add a list of new helper methods
    selections.forEach(a => {
      View.prototype[a[0]] = function (n) {
        let m = this.match(a[1]);
        return typeof n === 'number' ? m.get(n) : m
      };
    });
    View.prototype.phoneNumbers = phoneNumbers;
    // add aliases
    aliases.forEach(a => {
      View.prototype[a[0]] = View.prototype[a[1]];
    });
  };

  var addSelections = addMethods;

  var misc = {
    api: function (View) {
      addSelections(View);
      addPossessives(View);
      addParentheses(View);
      addQuotations(View);
      addAdjectives(View);
      addAdverbs(View);
      addAcronyms(View);
    }
  };

  const termLoop = function (view, cb) {
    view.docs.forEach(terms => {
      terms.forEach(cb);
    });
  };

  var methods = {
    // remove titlecasing, uppercase
    'case': (doc) => {
      termLoop(doc, (term) => {
        term.text = term.text.toLowerCase();
      });
    },
    // visually romanize/anglicize 'Björk' into 'Bjork'.
    'unicode': (doc) => {
      const world = doc.world;
      const killUnicode = world.methods.one.killUnicode;
      termLoop(doc, (term) => term.text = killUnicode(term.text, world));
    },
    // remove hyphens, newlines, and force one space between words
    'whitespace': (doc) => {
      termLoop(doc, (term) => {
        // one space between words
        term.post = term.post.replace(/\s+/g, ' ');
        term.post = term.post.replace(/\s([.,?!:;])/g, '$1');//no whitespace before a period, etc
        // no whitepace before a word
        term.pre = term.pre.replace(/\s+/g, '');
      });
    },
    // remove commas, semicolons - but keep sentence-ending punctuation
    'punctuation': (doc) => {
      termLoop(doc, (term) => {
        // turn dashes to spaces
        term.post = term.post.replace(/[–—-]/g, ' ');
        // remove comma, etc 
        term.post = term.post.replace(/[,:;]/g, '');
        // remove elipses
        term.post = term.post.replace(/\.{2,}/g, '');
        // remove repeats
        term.post = term.post.replace(/\?{2,}/g, '?');
        term.post = term.post.replace(/!{2,}/g, '!');
        // replace ?!
        term.post = term.post.replace(/\?!+/g, '?');
      });
      // trim end
      let docs = doc.docs;
      let terms = docs[docs.length - 1];
      if (terms && terms.length > 0) {
        let lastTerm = terms[terms.length - 1];
        lastTerm.post = lastTerm.post.replace(/ /g, '');
      }
    },

    // ====== subsets ===

    // turn "isn't" to "is not"
    'contractions': (doc) => {
      doc.contractions().expand();
    },
    //remove periods from acronyms, like 'F.B.I.'
    'acronyms': (doc) => {
      doc.acronyms().strip();
    },
    //remove words inside brackets (like these)
    'parentheses': (doc) => {
      doc.parentheses().strip();
    },
    // turn "Google's tax return" to "Google tax return"
    'possessives': (doc) => {
      doc.possessives().strip();
    },
    // turn "tax return" to tax return
    'quotations': (doc) => {
      doc.quotations().strip();
    },

    // remove them
    'emoji': (doc) => {
      doc.emojis().remove();
    },
    //turn 'Vice Admiral John Smith' to 'John Smith'
    'honorifics': (doc) => {
      doc.match('#Honorific+ #Person').honorifics().remove();
    },
    // remove needless adverbs
    'adverbs': (doc) => {
      doc.adverbs().remove();
    },

    // turn "batmobiles" into "batmobile"
    'nouns': (doc) => {
      doc.nouns().toSingular();
    },
    // turn all verbs into Infinitive form - "I walked" → "I walk"
    'verbs': (doc) => {
      doc.verbs().toInfinitive();
    },
    // turn "fifty" into "50"
    'numbers': (doc) => {
      doc.numbers().toNumber();
    },

  };

  // turn presets into key-vals
  const split = (str) => {
    return str.split('|').reduce((h, k) => {
      h[k] = true;
      return h
    }, {})
  };

  const light = 'unicode|punctuation|whitespace|acronyms';
  const medium = '|case|contractions|parentheses|quotations|emoji|honorifics';
  const heavy = '|possessives|adverbs|nouns|verbs';
  const presets = {
    light: split(light),
    medium: split(light + medium),
    heavy: split(light + medium + heavy)
  };

  function api$a (View) {
    View.prototype.normalize = function (opts = 'light') {
      if (typeof opts === 'string') {
        opts = presets[opts];
      }
      // run each method
      Object.keys(opts).forEach(fn => {
        if (methods.hasOwnProperty(fn)) {
          methods[fn](this, opts[fn]);
        }
      });
      return this
    };
  }

  var normalize = {
    api: api$a
  };

  const findNouns = function (doc) {
    let m = doc.match('<Noun>');
    let commas = m.match('@hasComma');
    // allow toronto, ontario
    commas = commas.not('#Place');
    if (commas.found) {
      m = m.splitAfter(commas);
    }
    // yo there
    m = m.splitOn('#Expression');
    // these are individual nouns
    m = m.splitOn('(he|she|we|you|they)');
    // a client i saw
    m = m.splitOn('(#Noun|#Adjective) [#Pronoun]', 0);
    // give him the best
    m = m.splitOn('[#Pronoun] (#Determiner|#Value)', 0);
    // the noise the slide makes
    m = m.splitBefore('#Noun [(the|a|an)] #Adjective? #Noun', 0);
    // here spencer slept
    m = m.splitOn('[(here|there)] #Noun', 0);
    // put it there
    m = m.splitOn('[#Noun] (here|there)', 0);
    // its great purposes
    // m = m.splitAfter('#Possessive')
    // his excuses
    // m = m.splitAfter('(his|hers|yours|ours|theirs)')
    //ensure there's actually a noun
    m = m.if('#Noun');
    return m
  };
  var find$8 = findNouns;

  // https://www.trentu.ca/history/subordinate-clause-and-complex-sentence
  const list$1 = [
    'after',
    'although',
    'as if',
    'as long as',
    'as',
    'because',
    'before',
    'even if',
    'even though',
    'ever since',
    'if',
    'in order that',
    'provided that',
    'since',
    'so that',
    'than',
    'that',
    'though',
    'unless',
    'until',
    'what',
    'whatever',
    'when',
    'whenever',
    'where',
    'whereas',
    'wherever',
    'whether',
    'which',
    'whichever',
    'who',
    'whoever',
    'whom',
    'whomever',
    'whose',
  ];

  const isSubordinate = function (m) {
    // athletes from toronto, days since december
    if (m.before('#Preposition$').found) {
      return true
    }
    let leadIn = m.before();
    if (!leadIn.found) {
      return false
    }
    for (let i = 0; i < list$1.length; i += 1) {
      if (m.has(list$1[i])) {
        return true
      }
    }
    return false
  };
  var isSubordinate$1 = isSubordinate;

  const notPlural = '(#Pronoun|#Place|#Value|#Person|#Uncountable|#Month|#WeekDay|#Holiday|#Possessive)';

  const isPlural$2 = function (m, root) {
    // const { looksPlural } = m.world.methods.two
    if (m.has('#Plural')) {
      return true
    }
    // two singular nouns are plural noun phrase
    if (m.has('#Noun and #Noun')) {
      return true
    }
    if (m.has('(we|they)')) {
      return true
    }
    // these can't be plural
    if (root.has(notPlural) === true) {
      return false
    }
    if (m.has('#Singular')) {
      return false
    }
    // word-reg fallback
    let str = root.text('normal');
    // ends with a brutal s fallback
    return str.length > 3 && str.endsWith('s') && !str.endsWith('ss')
  };
  var isPlural$3 = isPlural$2;

  const getRoot$1 = function (m) {
    let tmp = m.clone();
    tmp = tmp.match('#Noun+');
    tmp = tmp.remove('(#Adjective|#Preposition|#Determiner|#Value)');
    // team's captain
    // if (tmp.has('#Possessive .? #Noun')) {
    tmp = tmp.not('#Possessive');
    // }
    return tmp.first()
  };

  const parseNoun = function (m) {
    let root = getRoot$1(m);
    return {
      determiner: m.match('#Determiner').eq(0),
      adjectives: m.match('#Adjective'),
      number: m.values(),
      isPlural: isPlural$3(m, root),
      isSubordinate: isSubordinate$1(m),
      root: root,
    }
  };
  var parseNoun$1 = parseNoun;

  const toText$2 = m => m.text();
  const toArray$1 = m => m.json({ terms: false, normal: true }).map(s => s.normal);

  const getNum = function (m) {
    let num = null;
    if (!m.found) {
      return num
    }
    let val = m.values(0);
    if (val.found) {
      let obj = val.parse()[0] || {};
      return obj.num
    }
    return num
  };

  const toJSON$2 = function (m) {
    let res = parseNoun$1(m);
    return {
      root: toText$2(res.root),
      number: getNum(res.number),
      determiner: toText$2(res.determiner),
      adjectives: toArray$1(res.adjectives),
      isPlural: res.isPlural,
      isSubordinate: res.isSubordinate,
    }
  };
  var toJSON$3 = toJSON$2;

  const keep$7 = { tags: true };

  const hasPlural = function (parsed) {
    let { root } = parsed;
    if (root.has('^(#Uncountable|#Possessive|#ProperNoun|#Place|#Pronoun)+$')) {
      return false
    }
    return true
  };

  const toPlural = function (m, parsed) {
    // already plural?
    if (parsed.isPlural === true) {
      return m
    }
    // is a plural appropriate?
    if (!hasPlural(parsed)) {
      return m
    }
    const { methods, model } = m.world;
    const { nounToPlural } = methods.two.transform;
    // inflect the root noun
    let str = parsed.root.text('normal');
    let plural = nounToPlural(str, model);
    m.match(parsed.root).replaceWith(plural, keep$7).tag('Plural', 'toPlural');
    // should we change the determiner/article?
    if (parsed.determiner.has('(a|an)')) {
      // 'a captain' -> 'the captains'
      m.replace(parsed.determiner, 'the', keep$7);
    }
    return m
  };
  var toPlural$1 = toPlural;

  const keep$6 = { tags: true };

  const toSingular = function (m, parsed) {
    // already singular?
    if (parsed.isPlural === false) {
      return m
    }
    const { methods, model } = m.world;
    const { nounToSingular } = methods.two.transform;
    // inflect the root noun
    let str = parsed.root.text('normal');
    let single = nounToSingular(str, model);
    m.replace(parsed.root, single, keep$6).tag('Singular', 'toPlural');
    // should we change the determiner/article?
    // m.debug()
    return m
  };
  var toSingular$1 = toSingular;

  // return the nth elem of a doc
  const getNth$8 = (doc, n) => (typeof n === 'number' ? doc.eq(n) : doc);
  // const isObject = val => Object.prototype.toString.call(val) === '[object Object]'

  const api$8 = function (View) {
    class Nouns extends View {
      constructor(document, pointer, groups) {
        super(document, pointer, groups);
        this.viewType = 'Nouns';
      }

      parse(n) {
        return getNth$8(this, n).map(parseNoun$1)
      }

      json(opts = {}) {
        return this.map(m => {
          let json = m.toView().json(opts)[0] || {};
          if (opts && opts.noun !== true) {
            json.noun = toJSON$3(m);
          }
          return json
        }, [])
      }

      isPlural(n) {
        let arr = this.filter(m => parseNoun$1(m).isPlural);
        return getNth$8(arr, n)
      }

      adjectives(n) {
        let list = this.update([]);
        this.forEach(m => {
          let adj = parseNoun$1(m).adjectives;
          if (adj.found) {
            list = list.concat(adj);
          }
        });
        return getNth$8(list, n)
      }

      toPlural(n) {
        return getNth$8(this, n).map(m => {
          return toPlural$1(m, parseNoun$1(m))
        })
        // return new Nouns(all.document, all.pointer)
      }

      toSingular(n) {
        return getNth$8(this, n).map(m => {
          let res = parseNoun$1(m);
          return toSingular$1(m, res)
        })
      }
      // create a new View, from this one
      update(pointer) {
        let m = new Nouns(this.document, pointer);
        m._cache = this._cache; // share this full thing
        return m
      }
    }
    View.prototype.nouns = function (n) {
      let m = find$8(this);
      m = getNth$8(m, n);
      return new Nouns(this.document, m.pointer)
    };
  };
  var api$9 = api$8;

  var nouns = {
    api: api$9,
  };

  const findFractions = function (doc, n) {
    // five eighths
    let m = doc.match('#Fraction+');
    // remove 'two and five eights'
    m = m.filter(r => {
      return !r.lookBehind('#Value and$').found
    });
    // thirty seconds
    m = m.notIf('#Value seconds');

    if (typeof n === 'number') {
      m = m.eq(n);
    }
    return m
  };
  var find$7 = findFractions;

  //support global multipliers, like 'half-million' by doing 'million' then multiplying by 0.5
  const findModifiers = str => {
    const mults = [
      {
        reg: /^(minus|negative)[\s-]/i,
        mult: -1,
      },
      {
        reg: /^(a\s)?half[\s-](of\s)?/i,
        mult: 0.5,
      },
      //  {
      //   reg: /^(a\s)?quarter[\s\-]/i,
      //   mult: 0.25
      // }
    ];
    for (let i = 0; i < mults.length; i++) {
      if (mults[i].reg.test(str) === true) {
        return {
          amount: mults[i].mult,
          str: str.replace(mults[i].reg, ''),
        }
      }
    }
    return {
      amount: 1,
      str: str,
    }
  };

  var findModifiers$1 = findModifiers;

  var words = {
    ones: {
      zeroth: 0,
      first: 1,
      second: 2,
      third: 3,
      fourth: 4,
      fifth: 5,
      sixth: 6,
      seventh: 7,
      eighth: 8,
      ninth: 9,
      zero: 0,
      one: 1,
      two: 2,
      three: 3,
      four: 4,
      five: 5,
      six: 6,
      seven: 7,
      eight: 8,
      nine: 9,
    },
    teens: {
      tenth: 10,
      eleventh: 11,
      twelfth: 12,
      thirteenth: 13,
      fourteenth: 14,
      fifteenth: 15,
      sixteenth: 16,
      seventeenth: 17,
      eighteenth: 18,
      nineteenth: 19,
      ten: 10,
      eleven: 11,
      twelve: 12,
      thirteen: 13,
      fourteen: 14,
      fifteen: 15,
      sixteen: 16,
      seventeen: 17,
      eighteen: 18,
      nineteen: 19,
    },
    tens: {
      twentieth: 20,
      thirtieth: 30,
      fortieth: 40,
      fourtieth: 40,
      fiftieth: 50,
      sixtieth: 60,
      seventieth: 70,
      eightieth: 80,
      ninetieth: 90,
      twenty: 20,
      thirty: 30,
      forty: 40,
      fourty: 40,
      fifty: 50,
      sixty: 60,
      seventy: 70,
      eighty: 80,
      ninety: 90,
    },
    multiples: {
      hundredth: 100,
      thousandth: 1000,
      millionth: 1e6,
      billionth: 1e9,
      trillionth: 1e12,
      quadrillionth: 1e15,
      quintillionth: 1e18,
      sextillionth: 1e21,
      septillionth: 1e24,
      hundred: 100,
      thousand: 1000,
      million: 1e6,
      billion: 1e9,
      trillion: 1e12,
      quadrillion: 1e15,
      quintillion: 1e18,
      sextillion: 1e21,
      septillion: 1e24,
      grand: 1000,
    },
  };

  //prevent things like 'fifteen ten', and 'five sixty'
  const isValid = (w, has) => {
    if (words.ones.hasOwnProperty(w)) {
      if (has.ones || has.teens) {
        return false
      }
    } else if (words.teens.hasOwnProperty(w)) {
      if (has.ones || has.teens || has.tens) {
        return false
      }
    } else if (words.tens.hasOwnProperty(w)) {
      if (has.ones || has.teens || has.tens) {
        return false
      }
    }
    return true
  };
  var isValid$1 = isValid;

  //concatenate into a string with leading '0.'
  const parseDecimals = function (arr) {
    let str = '0.';
    for (let i = 0; i < arr.length; i++) {
      let w = arr[i];
      if (words.ones.hasOwnProperty(w) === true) {
        str += words.ones[w];
      } else if (words.teens.hasOwnProperty(w) === true) {
        str += words.teens[w];
      } else if (words.tens.hasOwnProperty(w) === true) {
        str += words.tens[w];
      } else if (/^[0-9]$/.test(w) === true) {
        str += w;
      } else {
        return 0
      }
    }
    return parseFloat(str)
  };

  var parseDecimals$1 = parseDecimals;

  //parse a string like "4,200.1" into Number 4200.1
  const parseNumeric$1 = str => {
    //remove ordinal - 'th/rd'
    str = str.replace(/1st$/, '1');
    str = str.replace(/2nd$/, '2');
    str = str.replace(/3rd$/, '3');
    str = str.replace(/([4567890])r?th$/, '$1');
    //remove prefixes
    str = str.replace(/^[$€¥£¢]/, '');
    //remove suffixes
    str = str.replace(/[%$€¥£¢]$/, '');
    //remove commas
    str = str.replace(/,/g, '');
    //split '5kg' from '5'
    str = str.replace(/([0-9])([a-z\u00C0-\u00FF]{1,2})$/, '$1');
    return str
  };

  var parseNumeric$2 = parseNumeric$1;

  const improperFraction = /^([0-9,. ]+)\/([0-9,. ]+)$/;

  //some numbers we know
  const casualForms = {
    'a few': 3,
    'a couple': 2,
    'a dozen': 12,
    'two dozen': 24,
    zero: 0,
  };

  // a 'section' is something like 'fifty-nine thousand'
  // turn a section into something we can add to - like 59000
  const section_sum = obj => {
    return Object.keys(obj).reduce((sum, k) => {
      sum += obj[k];
      return sum
    }, 0)
  };

  //turn a string into a number
  const parse$5 = function (str) {
    //convert some known-numbers
    if (casualForms.hasOwnProperty(str) === true) {
      return casualForms[str]
    }
    //'a/an' is 1
    if (str === 'a' || str === 'an') {
      return 1
    }
    const modifier = findModifiers$1(str);
    str = modifier.str;
    let last_mult = null;
    let has = {};
    let sum = 0;
    let isNegative = false;
    const terms = str.split(/[ -]/);
    // const isFraction = findFraction(terms)
    for (let i = 0; i < terms.length; i++) {
      let w = terms[i];
      w = parseNumeric$2(w);

      if (!w || w === 'and') {
        continue
      }
      if (w === '-' || w === 'negative') {
        isNegative = true;
        continue
      }
      if (w.charAt(0) === '-') {
        isNegative = true;
        w = w.substring(1);
      }

      //decimal mode
      if (w === 'point') {
        sum += section_sum(has);
        sum += parseDecimals$1(terms.slice(i + 1, terms.length));
        sum *= modifier.amount;
        return sum
      }

      //improper fraction
      const fm = w.match(improperFraction);
      if (fm) {
        const num = parseFloat(fm[1].replace(/[, ]/g, ''));
        const denom = parseFloat(fm[2].replace(/[, ]/g, ''));
        if (denom) {
          sum += num / denom || 0;
        }
        continue
      }
      // try to support 'two fifty'
      if (words.tens.hasOwnProperty(w)) {
        if (has.ones && Object.keys(has).length === 1) {
          sum = has.ones * 100;
          has = {};
        }
      }

      //prevent mismatched units, like 'seven eleven' if not a fraction
      if (isValid$1(w, has) === false) {
        return null
      }

      //buildOut section, collect 'has' values
      if (/^[0-9.]+$/.test(w)) {
        has.ones = parseFloat(w); //not technically right
      } else if (words.ones.hasOwnProperty(w) === true) {
        has.ones = words.ones[w];
      } else if (words.teens.hasOwnProperty(w) === true) {
        has.teens = words.teens[w];
      } else if (words.tens.hasOwnProperty(w) === true) {
        has.tens = words.tens[w];
      } else if (words.multiples.hasOwnProperty(w) === true) {
        let mult = words.multiples[w];

        //something has gone wrong : 'two hundred five hundred'
        //possibly because it's a fraction
        if (mult === last_mult) {
          return null
        }
        //support 'hundred thousand'
        //this one is tricky..
        if (mult === 100 && terms[i + 1] !== undefined) {
          const w2 = terms[i + 1];
          if (words.multiples[w2]) {
            mult *= words.multiples[w2]; //hundredThousand/hundredMillion
            i += 1;
          }
        }
        //natural order of things
        //five thousand, one hundred..
        if (last_mult === null || mult < last_mult) {
          sum += (section_sum(has) || 1) * mult;
          last_mult = mult;
          has = {};
        } else {
          //maybe hundred .. thousand
          sum += section_sum(has);
          last_mult = mult;
          sum = (sum || 1) * mult;
          has = {};
        }
      }
    }
    //dump the remaining has values
    sum += section_sum(has);
    //post-process add modifier
    sum *= modifier.amount;
    sum *= isNegative ? -1 : 1;
    //dont return 0, if it went straight-through
    if (sum === 0 && Object.keys(has).length === 0) {
      return null
    }
    return sum
  };

  var parseText = parse$5;

  const endS = /s$/;

  // just using .toNumber() again may risk an infinite-loop
  const parseNumber$1 = function (m) {
    let str = m.text('reduced');
    return parseText(str)
  };

  let mapping = {
    half: 2,
    halve: 2,
    quarter: 4,
  };

  const slashForm = function (m) {
    let str = m.text('reduced');
    let found = str.match(/^([-+]?[0-9]+)\/([-+]?[0-9]+)(st|nd|rd|th)?s?$/);
    if (found && found[1] && found[0]) {
      return {
        numerator: Number(found[1]),
        denominator: Number(found[2]),
      }
    }
    return null
  };

  // parse '4 out of 4'
  const nOutOfN = function (m) {
    let found = m.match('[<num>#Value+] out of every? [<den>#Value+]');
    if (found.found !== true) {
      return null
    }
    let { num, den } = found.groups();
    if (!num || !den) {
      return null
    }
    num = parseNumber$1(num);
    den = parseNumber$1(den);
    if (!num || !den) {
      return null
    }
    if (typeof num === 'number' && typeof den === 'number') {
      return {
        numerator: num,
        denominator: den,
      }
    }
    return null
  };

  // parse 'five thirds'
  const nOrinalth = function (m) {
    let found = m.match('[<num>(#Cardinal|a)+] [<den>#Fraction+]');
    if (found.found !== true) {
      return null
    }
    let { num, den } = found.groups();
    // -- parse numerator---
    // quick-support for 'a third'
    if (num.has('a')) {
      num = 1;
    } else {
      // abuse the number-parser for 'thirty three'
      // let tmp = num.clone().unTag('Fraction')
      // num = tmp.numbers().get()[0]
      num = parseNumber$1(num);
    }
    // -- parse denominator --
    // turn 'thirds' into third
    let str = den.text('reduced');
    if (endS.test(str)) {
      str = str.replace(endS, '');
      den = den.replaceWith(str);
    }
    // support 'one half' as '1/2'
    if (mapping.hasOwnProperty(str)) {
      den = mapping[str];
    } else {
      // dem = dem.numbers().get()[0]
      den = parseNumber$1(den);
    }
    if (typeof num === 'number' && typeof den === 'number') {
      return {
        numerator: num,
        denominator: den,
      }
    }
    return null
  };

  // implied 1 in '100th of a', 'fifth of a'
  const oneNth = function (m) {
    let found = m.match('^#Ordinal$');
    if (found.found !== true) {
      return null
    }
    // ensure it's '100th of a '
    if (m.lookAhead('^of .')) {
      // let num = found.numbers().get()[0]
      let num = parseNumber$1(found);
      return {
        numerator: 1,
        denominator: num,
      }
    }
    return null
  };

  // 'half'
  const named = function (m) {
    let str = m.text('reduced');
    if (mapping.hasOwnProperty(str)) {
      return { numerator: 1, denominator: mapping[str] }
    }
    return null
  };

  const round = n => {
    let rounded = Math.round(n * 1000) / 1000;
    // don't round 1 millionth down into 0
    if (rounded === 0 && n !== 0) {
      return n
    }
    return rounded
  };

  const parseFraction = function (m) {
    m = m.clone();
    let res = named(m) || slashForm(m) || nOutOfN(m) || nOrinalth(m) || oneNth(m) || null;
    if (res !== null) {
      // do the math
      if (res.numerator && res.denominator) {
        res.decimal = res.numerator / res.denominator;
        res.decimal = round(res.decimal);
      }
    }
    return res
  };
  var parseFraction$1 = parseFraction;

  /**
   * turn big numbers, like 2.3e+22, into a string with a ton of trailing 0's
   * */
  const numToString = function (n) {
    if (n < 1000000) {
      return String(n)
    }
    let str;
    if (typeof n === 'number') {
      str = n.toFixed(0);
    } else {
      str = n;
    }
    if (str.indexOf('e+') === -1) {
      return str
    }
    return str
      .replace('.', '')
      .split('e+')
      .reduce(function (p, b) {
        return p + Array(b - p.length + 2).join(0)
      })
  };
  var toString = numToString;
  // console.log(numToString(2.5e+22));

  const tens_mapping = [
    ['ninety', 90],
    ['eighty', 80],
    ['seventy', 70],
    ['sixty', 60],
    ['fifty', 50],
    ['forty', 40],
    ['thirty', 30],
    ['twenty', 20],
  ];
  const ones_mapping = [
    '',
    'one',
    'two',
    'three',
    'four',
    'five',
    'six',
    'seven',
    'eight',
    'nine',
    'ten',
    'eleven',
    'twelve',
    'thirteen',
    'fourteen',
    'fifteen',
    'sixteen',
    'seventeen',
    'eighteen',
    'nineteen',
  ];

  const sequence = [
    [1e24, 'septillion'],
    [1e20, 'hundred sextillion'],
    [1e21, 'sextillion'],
    [1e20, 'hundred quintillion'],
    [1e18, 'quintillion'],
    [1e17, 'hundred quadrillion'],
    [1e15, 'quadrillion'],
    [1e14, 'hundred trillion'],
    [1e12, 'trillion'],
    [1e11, 'hundred billion'],
    [1e9, 'billion'],
    [1e8, 'hundred million'],
    [1e6, 'million'],
    [100000, 'hundred thousand'],
    [1000, 'thousand'],
    [100, 'hundred'],
    [1, 'one'],
  ];

  /**
   * turns an integer/float into.ber, like 'fifty-five'
   */

  //turn number into an array of magnitudes, like [[5, million], [2, hundred]]
  const breakdown_magnitudes = function (num) {
    let working = num;
    let have = [];
    sequence.forEach(a => {
      if (num >= a[0]) {
        let howmany = Math.floor(working / a[0]);
        working -= howmany * a[0];
        if (howmany) {
          have.push({
            unit: a[1],
            count: howmany,
          });
        }
      }
    });
    return have
  };

  //turn numbers from 100-0 into their text
  const breakdown_hundred = function (num) {
    let arr = [];
    if (num > 100) {
      return arr //something bad happened..
    }
    for (let i = 0; i < tens_mapping.length; i++) {
      if (num >= tens_mapping[i][1]) {
        num -= tens_mapping[i][1];
        arr.push(tens_mapping[i][0]);
      }
    }
    //(hopefully) we should only have 20-0 now
    if (ones_mapping[num]) {
      arr.push(ones_mapping[num]);
    }
    return arr
  };

  /** print-out 'point eight nine'*/
  const handle_decimal = num => {
    const names = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
    let arr = [];
    //parse it out like a string, because js math is such shit
    let str = toString(num);
    let decimal = str.match(/\.([0-9]+)/);
    if (!decimal || !decimal[0]) {
      return arr
    }
    arr.push('point');
    let decimals = decimal[0].split('');
    for (let i = 0; i < decimals.length; i++) {
      arr.push(names[decimals[i]]);
    }
    return arr
  };

  /** turns an integer into a textual number */
  const toText$1 = function (obj) {
    let num = obj.num;
    // handle zero, quickly
    if (num === 0 || num === '0') {
      return 'zero' // no?
    }
    //big numbers, north of sextillion, aren't gonna work well..
    //keep them small..
    if (num > 1e21) {
      num = toString(num);
    }
    let arr = [];
    //handle negative numbers
    if (num < 0) {
      arr.push('minus');
      num = Math.abs(num);
    }
    //break-down into units, counts
    let units = breakdown_magnitudes(num);
    //build-up the string from its components
    for (let i = 0; i < units.length; i++) {
      let unit_name = units[i].unit;
      if (unit_name === 'one') {
        unit_name = '';
        //put an 'and' in here
        if (arr.length > 1) {
          arr.push('and');
        }
      }
      arr = arr.concat(breakdown_hundred(units[i].count));
      arr.push(unit_name);
    }
    //also support decimals - 'point eight'
    arr = arr.concat(handle_decimal(num));
    //remove empties
    arr = arr.filter(s => s);
    if (arr.length === 0) {
      arr[0] = '';
    }
    return arr.join(' ')
  };

  var textCardinal = toText$1;

  // console.log(to_text(-1000.8));

  const toCardinal = function (obj) {
    if (!obj.numerator || !obj.denominator) {
      return ''
    }
    let a = textCardinal({ num: obj.numerator });
    let b = textCardinal({ num: obj.denominator });
    return `${a} out of ${b}`
  };
  var toCardinal$1 = toCardinal;

  const irregulars = {
    one: 'first',
    two: 'second',
    three: 'third',
    five: 'fifth',
    eight: 'eighth',
    nine: 'ninth',
    twelve: 'twelfth',
    twenty: 'twentieth',
    thirty: 'thirtieth',
    forty: 'fortieth',
    fourty: 'fourtieth',
    fifty: 'fiftieth',
    sixty: 'sixtieth',
    seventy: 'seventieth',
    eighty: 'eightieth',
    ninety: 'ninetieth',
  };

  /**
   * convert a javascript number to 'twentieth' format
   * */
  const textOrdinal = obj => {
    let words = textCardinal(obj).split(' ');
    //convert the last number to an ordinal
    let last = words[words.length - 1];
    if (irregulars.hasOwnProperty(last)) {
      words[words.length - 1] = irregulars[last];
    } else {
      words[words.length - 1] = last.replace(/y$/, 'i') + 'th';
    }
    return words.join(' ')
  };

  var textOrdinal$1 = textOrdinal;

  const toOrdinal = function (obj) {
    // don't divide by zero!
    if (!obj.numerator || !obj.denominator) {
      return ''
    }
    // create [two] [fifths]
    let start = textCardinal({ num: obj.numerator });
    let end = textOrdinal$1({ num: obj.denominator });
    // 'one secondth' -> 'one half'
    if (obj.denominator === 2) {
      end = 'half';
    }
    if (start && end) {
      if (obj.numerator !== 1) {
        end += 's';
      }
      return `${start} ${end}`
    }
    return ''
  };
  var toOrdinal$1 = toOrdinal;

  // return the nth elem of a doc
  const getNth$7 = (doc, n) => (typeof n === 'number' ? doc.eq(n) : doc);

  const plugin$2 = function (View) {
    /**
     */
    class Fractions extends View {
      constructor(document, pointer, groups) {
        super(document, pointer, groups);
        this.viewType = 'Fractions';
      }
      parse(n) {
        return getNth$7(this, n).map(parseFraction$1)
      }
      get(n) {
        return getNth$7(this, n).map(parseFraction$1)
      }
      json(n) {
        return getNth$7(this, n).map(p => {
          let json = p.toView().json(n)[0];
          let parsed = parseFraction$1(p);
          json.fraction = parsed;
          return json
        }, [])
      }
      // become 0.5
      toDecimal(n) {
        getNth$7(this, n).forEach(m => {
          let { decimal } = parseFraction$1(m);
          m = m.replaceWith(String(decimal), true);
          m.tag('NumericValue');
          m.unTag('Fraction');
        });
        return this
      }
      toFraction(n) {
        getNth$7(this, n).forEach(m => {
          let obj = parseFraction$1(m);
          if (obj && typeof obj.numerator === 'number' && typeof obj.denominator === 'number') {
            let str = `${obj.numerator}/${obj.denominator}`;
            this.replace(m, str);
          }
        });
        return this
      }
      toOrdinal(n) {
        getNth$7(this, n).forEach(m => {
          let obj = parseFraction$1(m);
          let str = toOrdinal$1(obj);
          if (m.after('^#Noun').found) {
            str += ' of'; // three fifths of dentists
          }
          m.replaceWith(str);
        });
        return this
      }
      toCardinal(n) {
        getNth$7(this, n).forEach(m => {
          let obj = parseFraction$1(m);
          let str = toCardinal$1(obj);
          m.replaceWith(str);
        });
        return this
      }
      toPercentage(n) {
        getNth$7(this, n).forEach(m => {
          let { decimal } = parseFraction$1(m);
          let percent = decimal * 100;
          percent = Math.round(percent * 100) / 100; // round it
          m.replaceWith(`${percent}%`);
        });
        return this
      }
    }

    View.prototype.fractions = function (n) {
      let m = find$7(this);
      m = getNth$7(m, n);
      return new Fractions(this.document, m.pointer)
    };
  };

  var fractions = plugin$2;

  const ones = 'one|two|three|four|five|six|seven|eight|nine';
  const tens = 'twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|fourty';
  const teens = 'eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen';

  // this is a bit of a mess
  // segment consecutive number-words into sensible chunks
  const findNumbers = function (doc) {
    let m = doc.match('#Value+');

    //"50 83"
    if (m.has('#NumericValue #NumericValue')) {
      //a comma may mean two numbers
      if (m.has('#Value @hasComma #Value')) {
        m.splitAfter('@hasComma');
      } else if (m.has('#NumericValue #Fraction')) {
        m.splitAfter('#NumericValue #Fraction');
      } else {
        m = m.splitAfter('#NumericValue');
      }
    }

    //three-length
    if (m.has('#Value #Value #Value') && !m.has('#Multiple')) {
      //twenty-five-twenty
      if (m.has('(' + tens + ') #Cardinal #Cardinal')) {
        m = m.splitAfter('(' + tens + ') #Cardinal');
      }
    }

    //two-length ones
    if (m.has('#Value #Value')) {
      //june 21st 1992 is two seperate values
      if (m.has('#NumericValue #NumericValue')) {
        m = m.splitOn('#Year');
      }
      //sixty fifteen
      if (m.has('(' + tens + ') (' + teens + ')')) {
        m = m.splitAfter('(' + tens + ')');
      }

      //"72 82"
      let double = m.match('#Cardinal #Cardinal');
      if (double.found && !m.has('(point|decimal|#Fraction)')) {
        //not 'two hundred'
        if (!double.has('#Cardinal (#Multiple|point|decimal)')) {
          // two fifty five
          let noMultiple = m.has(`(${ones}) (${tens})`);
          // twenty one
          let tensVal = double.has('(' + tens + ') #Cardinal');
          // hundredOne
          let multVal = double.has('#Multiple #Value');
          //one proper way, 'twenty one', or 'hundred one'
          if (!noMultiple && !tensVal && !multVal) {
            // double = double.firstTerm()
            double.terms().forEach(d => {
              m = m.splitOn(d);
            });
          }
        }
      }

      //seventh fifth
      if (m.match('#Ordinal #Ordinal').match('#TextValue').found && !m.has('#Multiple')) {
        //the one proper way, 'twenty first'
        if (!m.has('(' + tens + ') #Ordinal')) {
          m = m.splitAfter('#Ordinal');
        }
      }
      //fifth five
      m = m.splitBefore('#Ordinal [#Cardinal]', 0);
      //five 2017 (support '5 hundred', and 'twenty 5'
      if (m.has('#TextValue #NumericValue') && !m.has('(' + tens + '|#Multiple)')) {
        m = m.splitBefore('#TextValue #NumericValue');
      }
    }

    //5-8
    m = m.splitAfter('#NumberRange');
    // june 5th 1999
    m = m.splitBefore('#Year');
    return m
  };

  var find$6 = findNumbers;

  const parseNumeric = function (str, m) {
    str = str.replace(/,/g, '');
    //parse a numeric-number
    let arr = str.split(/([0-9.,]*)/);
    let [prefix, num] = arr;
    let suffix = arr.slice(2).join('');
    if (num !== '' && m.length < 2) {
      num = Number(num || str);
      //ensure that num is an actual number
      if (typeof num !== 'number') {
        num = null;
      }
      // strip an ordinal off the suffix
      suffix = suffix || '';
      if (suffix === 'st' || suffix === 'nd' || suffix === 'rd' || suffix === 'th') {
        suffix = '';
      }
      // support M for million, k for thousand
      // if (suffix === 'm' || suffix === 'M') {
      //   num *= 1000000
      //   suffix = ''
      // }
      // if (suffix === 'k' || suffix === 'k') {
      //   num *= 1000
      //   suffix = ''
      // }
      return {
        prefix: prefix || '',
        num: num,
        suffix: suffix,
      }
    }
    return null
  };

  // get a numeric value from this phrase
  const parseNumber = function (m) {
    if (typeof m === 'string') {
      return { num: parseText(m) }
    }
    let str = m.text('reduced');
    // reach for '12 litres'
    let unit = m.growRight('#Unit').match('#Unit$').text('machine');
    // is it in '3,123' format?
    let hasComma = /[0-9],[0-9]/.test(m.text('text'));
    // parse a numeric-number like '$4.00'
    if (m.terms().length === 1 && !m.has('#Multiple')) {
      let res = parseNumeric(str, m);
      if (res !== null) {
        res.hasComma = hasComma;
        res.unit = unit;
        return res
      }
    }
    // -- parse text-formats --
    // Fractions: remove 'and a half' etc. from the end
    let frPart = m.match('#Fraction{2,}$');
    frPart = frPart.found === false ? m.match('^#Fraction$') : frPart;
    let fraction = null;
    if (frPart.found) {
      if (frPart.has('#Value and #Value #Fraction')) {
        frPart = frPart.match('and #Value #Fraction');
      }
      fraction = parseFraction$1(frPart);
      // remove it from our string
      m = m.not(frPart);
      m = m.not('and$');
      str = m.text('reduced');
    }
    let num = 0;
    if (str) {
      num = parseText(str) || 0;
    }
    // apply numeric fraction
    if (fraction && fraction.decimal) {
      num += fraction.decimal;
    }


    return {
      hasComma,
      prefix: '',
      num,
      suffix: '',
      isOrdinal: m.has('#Ordinal'),
      isText: m.has('#TextValue'),
      isFraction: m.has('#Fraction'),
      isMoney: m.has('#Money'),
      unit
    }
  };
  var parse$4 = parseNumber;

  /**
   * turn a number like 5 into an ordinal like 5th
   */
  const numOrdinal = function (obj) {
    let num = obj.num;
    if (!num && num !== 0) {
      return null
    }
    //the teens are all 'th'
    let tens = num % 100;
    if (tens > 10 && tens < 20) {
      return String(num) + 'th'
    }
    //the rest of 'em
    const mapping = {
      0: 'th',
      1: 'st',
      2: 'nd',
      3: 'rd',
    };
    let str = toString(num);
    let last = str.slice(str.length - 1, str.length);
    if (mapping[last]) {
      str += mapping[last];
    } else {
      str += 'th';
    }
    return str
  };

  var numOrdinal$1 = numOrdinal;

  const prefixes = {
    '¢': 'cents',
    $: 'dollars',
    '£': 'pounds',
    '¥': 'yen',
    '€': 'euros',
    '₡': 'colón',
    '฿': 'baht',
    '₭': 'kip',
    '₩': 'won',
    '₹': 'rupees',
    '₽': 'ruble',
    '₺': 'liras',
  };
  const suffixes = {
    '%': 'percent',
    // s: 'seconds',
    // cm: 'centimetres',
    // km: 'kilometres',
    // ft: 'feet',
    '°': 'degrees'
  };

  const addSuffix = function (obj) {
    let res = {
      suffix: '',
      prefix: obj.prefix,
    };
    // $5 to 'five dollars'
    if (prefixes.hasOwnProperty(obj.prefix)) {
      res.suffix += ' ' + prefixes[obj.prefix];
      res.prefix = '';
    }
    // 5% to 'five percent'
    if (suffixes.hasOwnProperty(obj.suffix)) {
      res.suffix += ' ' + suffixes[obj.suffix];
    }
    if (res.suffix && obj.num === 1) {
      res.suffix = res.suffix.replace(/s$/, '');
    }
    // misc other suffixes
    if (!res.suffix && obj.suffix) {
      res.suffix += ' ' + obj.suffix;
    }
    return res
  };

  var makeSuffix = addSuffix;

  const format = function (obj, fmt) {
    if (fmt === 'TextOrdinal') {
      let { prefix, suffix } = makeSuffix(obj);
      return prefix + textOrdinal$1(obj) + suffix
    }
    if (fmt === 'Ordinal') {
      return obj.prefix + numOrdinal$1(obj) + obj.suffix
    }
    if (fmt === 'TextCardinal') {
      let { prefix, suffix } = makeSuffix(obj);
      return prefix + textCardinal(obj) + suffix
    }
    // assume Cardinal
    let num = obj.num;
    if (obj.hasComma) {
      num = num.toLocaleString();
    }
    return obj.prefix + String(num) + obj.suffix
  };
  var format$1 = format;

  // return the nth elem of a doc
  const getNth$6 = (doc, n) => (typeof n === 'number' ? doc.eq(n) : doc);

  const addMethod$2 = function (View) {
    /**   */
    class Numbers extends View {
      constructor(document, pointer, groups) {
        super(document, pointer, groups);
        this.viewType = 'Numbers';
      }
      parse(n) {
        return getNth$6(this, n).map(parse$4)
      }
      get(n) {
        return getNth$6(this, n).map(parse$4).map(o => o.num)
      }
      json(n) {
        let doc = getNth$6(this, n);
        return doc.map(p => {
          let json = p.toView().json(n)[0];
          let parsed = parse$4(p);
          json.number = {
            prefix: parsed.prefix,
            num: parsed.num,
            suffix: parsed.suffix,
            hasComma: parsed.hasComma,
            unit: parsed.unit
          };
          return json
        }, [])
      }
      /** any known measurement unit, for the number */
      units() {
        return this.growRight('#Unit').match('#Unit$')
      }
      /** return only ordinal numbers */
      isOrdinal() {
        return this.if('#Ordinal')
      }
      /** return only cardinal numbers*/
      isCardinal() {
        return this.if('#Cardinal')
      }

      /** convert to numeric form like '8' or '8th' */
      toNumber() {
        let m = this.if('#TextValue');
        m.forEach(val => {
          let obj = parse$4(val);
          if (obj.num === null) {
            return
          }
          let fmt = val.has('#Ordinal') ? 'Ordinal' : 'Cardinal';
          let str = format$1(obj, fmt);
          val.replaceWith(str, { tags: true });
          val.tag('NumericValue');
        });
        return this
      }
      /** add commas, or nicer formatting for numbers */
      toLocaleString() {
        let m = this;
        m.forEach((val) => {
          let obj = parse$4(val);
          if (obj.num === null) {
            return
          }
          let num = obj.num.toLocaleString();
          // support ordinal ending, too
          if (val.has('#Ordinal')) {
            let str = format$1(obj, 'Ordinal');
            let end = str.match(/[a-z]+$/);
            if (end) {
              num += end[0] || '';
            }
          }
          val.replaceWith(num, { tags: true });
        });
        return this
      }
      /** convert to numeric form like 'eight' or 'eighth' */
      toText() {
        let m = this;
        let res = m.map(val => {
          if (val.has('#TextValue')) {
            return val
          }
          let obj = parse$4(val);
          if (obj.num === null) {
            return val
          }
          let fmt = val.has('#Ordinal') ? 'TextOrdinal' : 'TextCardinal';
          let str = format$1(obj, fmt);
          val.replaceWith(str, { tags: true });
          val.tag('TextValue');
          return val
        });
        return new Numbers(res.document, res.pointer)
      }
      /** convert ordinal to cardinal form, like 'eight', or '8' */
      toCardinal() {
        let m = this;
        let res = m.map(val => {
          if (!val.has('#Ordinal')) {
            return val
          }
          let obj = parse$4(val);
          if (obj.num === null) {
            return val
          }
          let fmt = val.has('#TextValue') ? 'TextCardinal' : 'Cardinal';
          let str = format$1(obj, fmt);
          val.replaceWith(str, { tags: true });
          val.tag('Cardinal');
          return val
        });
        return new Numbers(res.document, res.pointer)
      }
      /** convert cardinal to ordinal form, like 'eighth', or '8th' */
      toOrdinal() {
        let m = this;
        let res = m.map(val => {
          if (val.has('#Ordinal')) {
            return val
          }
          let obj = parse$4(val);
          if (obj.num === null) {
            return val
          }
          let fmt = val.has('#TextValue') ? 'TextOrdinal' : 'Ordinal';
          let str = format$1(obj, fmt);
          val.replaceWith(str, { tags: true });
          val.tag('Ordinal');
          return val
        });
        return new Numbers(res.document, res.pointer)
      }

      /** return only numbers that are == n */
      isEqual(n) {
        return this.filter((val) => {
          let num = parse$4(val).num;
          return num === n
        })
      }
      /** return only numbers that are > n*/
      greaterThan(n) {
        return this.filter((val) => {
          let num = parse$4(val).num;
          return num > n
        })
      }
      /** return only numbers that are < n*/
      lessThan(n) {
        return this.filter((val) => {
          let num = parse$4(val).num;
          return num < n
        })
      }
      /** return only numbers > min and < max */
      between(min, max) {
        return this.filter((val) => {
          let num = parse$4(val).num;
          return num > min && num < max
        })
      }
      /** set these number to n */
      set(n) {
        if (n === undefined) {
          return this // don't bother
        }
        if (typeof n === 'string') {
          n = parse$4(n).num;
        }
        let m = this;
        let res = m.map((val) => {
          let obj = parse$4(val);
          obj.num = n;
          if (obj.num === null) {
            return val
          }
          let fmt = val.has('#Ordinal') ? 'Ordinal' : 'Cardinal';
          if (val.has('#TextValue')) {
            fmt = val.has('#Ordinal') ? 'TextOrdinal' : 'TextCardinal';
          }
          let str = format$1(obj, fmt);
          // add commas to number
          if (obj.hasComma && fmt === 'Cardinal') {
            str = Number(str).toLocaleString();
          }
          val = val.not('#Currency');
          val.replaceWith(str, { tags: true });
          // handle plural/singular unit
          // agreeUnits(agree, val, obj)
          return val
        });
        return new Numbers(res.document, res.pointer)
      }
      add(n) {
        if (!n) {
          return this // don't bother
        }
        if (typeof n === 'string') {
          n = parse$4(n).num;
        }
        let m = this;
        let res = m.map((val) => {
          let obj = parse$4(val);
          if (obj.num === null) {
            return val
          }
          obj.num += n;
          let fmt = val.has('#Ordinal') ? 'Ordinal' : 'Cardinal';
          if (obj.isText) {
            fmt = val.has('#Ordinal') ? 'TextOrdinal' : 'TextCardinal';
          }
          let str = format$1(obj, fmt);
          val.replaceWith(str, { tags: true });
          // handle plural/singular unit
          // agreeUnits(agree, val, obj)
          return val
        });
        return new Numbers(res.document, res.pointer)
      }
      /** decrease each number by n*/
      subtract(n, agree) {
        return this.add(n * -1, agree)
      }
      /** increase each number by 1 */
      increment(agree) {
        return this.add(1, agree)
      }
      /** decrease each number by 1 */
      decrement(agree) {
        return this.add(-1, agree)
      }
      // overloaded - keep Numbers class
      update(pointer) {
        let m = new Numbers(this.document, pointer);
        m._cache = this._cache; // share this full thing
        return m
      }
    }
    // aliases
    Numbers.prototype.toNice = Numbers.prototype.toLocaleString;
    Numbers.prototype.isBetween = Numbers.prototype.between;
    Numbers.prototype.minus = Numbers.prototype.subtract;
    Numbers.prototype.plus = Numbers.prototype.add;
    Numbers.prototype.equals = Numbers.prototype.isEqual;

    View.prototype.numbers = function (n) {
      let m = find$6(this);
      m = getNth$6(m, n);
      return new Numbers(this.document, m.pointer)
    };
    View.prototype.percentages = function (n) {
      let m = find$6(this);
      m = m.filter(v => v.has('#Percent') || v.after('^percent'));
      m = getNth$6(m, n);
      return new Numbers(this.document, m.pointer)
    };
    View.prototype.money = function (n) {
      let m = find$6(this);
      m = m.filter(v => v.has('#Money') || v.after('^#Currency'));
      m = getNth$6(m, n);
      return new Numbers(this.document, m.pointer)
    };
    // alias
    View.prototype.values = View.prototype.numbers;
  };
  var numbers$1 = addMethod$2;

  const api$7 = function (View) {
    fractions(View);
    numbers$1(View);
  };

  var numbers = {
    api: api$7,
  };

  const defaults = {
    people: true,
    emails: true,
    phoneNumbers: true,
    places: true,
  };

  const redact = function (opts = {}) {
    opts = Object.assign({}, defaults, opts);
    if (opts.people !== false) {
      this.people().replaceWith('██████████');
    }
    if (opts.emails !== false) {
      this.emails().replaceWith('██████████');
    }
    if (opts.places !== false) {
      this.places().replaceWith('██████████');
    }
    if (opts.phoneNumbers !== false) {
      this.phoneNumbers().replaceWith('███████');
    }
    return this
  };

  const plugin$1 = {
    api: function (View) {
      View.prototype.redact = redact;
    }
  };
  var redact$1 = plugin$1;

  //is this sentence asking a question?
  const isQuestion = function (doc) {
    let clauses = doc.clauses();

    // Has ellipsis at the end means it's probably not a question
    // e.g., Is this just fantasy...
    if (/\.\.$/.test(doc.out('text'))) {
      return false
    }

    // Starts with question word, but has a comma, so probably not a question
    // e.g., Why are we caught in a land slide, no escape from reality
    if (doc.has('^#QuestionWord') && doc.has('@hasComma')) {
      return false
    }

    // do you see it or not
    if (doc.has('or not$')) {
      return true
    }

    // Starts with a #QuestionWord
    // e.g., What open your eyes look up to the skies and see
    if (doc.has('^#QuestionWord')) {
      return true
    }

    // Second word is a #QuestionWord
    // e.g., I'm what a poor boy
    // case ts.has('^\w+\s#QuestionWord'):
    // return true;

    // is it, do you - start of sentence
    // e.g., Do I need no sympathy
    if (doc.has('^(do|does|did|is|was|can|could|will|would|may) #Noun')) {
      return true
    }

    // these are a little more loose..
    // e.g., Must I be come easy come easy go
    if (doc.has('^(have|must) you')) {
      return true
    }

    // Clause starts with a question word
    // e.g., Anyway the wind blows, what doesn't really matter to me
    // if (clauses.has('^#QuestionWord')) {
    //   return true
    // }

    //is wayne gretskzy alive
    if (clauses.has('(do|does|is|was) #Noun+ #Adverb? (#Adjective|#Infinitive)$')) {
      return true
    }

    // Probably not a question
    return false
  };

  const findQuestions = function (view) {
    const hasQ = /\?/;
    const { document } = view;
    return view.filter(m => {
      let terms = m.docs[0] || [];
      let lastTerm = terms[terms.length - 1];
      // is it not a full sentence?
      if (!lastTerm || document[lastTerm.index[0]].length !== terms.length) {
        return false
      }
      // does it end with a question mark?
      if (hasQ.test(lastTerm.post)) {
        return true
      }
      // try to guess a sentence without a question-mark
      return isQuestion(m)
    })
  };
  var isQuestion$1 = findQuestions;

  // if a clause starts with these, it's not a main clause
  const subordinate = `(after|although|as|because|before|if|since|than|that|though|when|whenever|where|whereas|wherever|whether|while|why|unless|until|once)`;
  const relative = `(that|which|whichever|who|whoever|whom|whose|whomever)`;

  //try to remove secondary clauses
  const mainClause = function (s) {
    let m = s;
    if (m.length === 1) {
      return m
    }
    // if there's no verb, it's dependent
    m = m.if('#Verb');
    if (m.length === 1) {
      return m
    }
    // this is a signal for subordinate-clauses
    m = m.ifNo(subordinate);
    m = m.ifNo('^even (if|though)');
    m = m.ifNo('^so that');
    m = m.ifNo('^rather than');
    m = m.ifNo('^provided that');
    if (m.length === 1) {
      return m
    }
    // relative clauses
    m = m.ifNo(relative);
    if (m.length === 1) {
      return m
    }

    m = m.ifNo('(despite|during|before|through|throughout)');
    if (m.length === 1) {
      return m
    }
    // did we go too far?
    if (m.length === 0) {
      m = s;
    }
    // choose the first one?
    return m.eq(0)
  };
  var findMain = mainClause;

  const parse$2 = function (s) {
    let clauses = s.clauses();
    let main = findMain(clauses);
    let chunks = main.chunks();
    let subj = s.none();
    let verb = s.none();
    let pred = s.none();
    chunks.forEach((ch, i) => {
      if (i === 0 && !ch.has('<Verb>')) {
        subj = ch;
        return
      }
      if (!verb.found && ch.has('<Verb>')) {
        verb = ch;
        return
      }
      if (verb.found) {
        pred = pred.concat(ch);
      }
    });
    // cleanup a missed parse
    if (verb.found && !subj.found) {
      subj = verb.before('<Noun>+').first();
    }
    return {
      subj,
      verb,
      pred
    }
  };
  var parse$3 = parse$2;

  const toPast$2 = function (s) {
    let verbs = s.verbs();
    // translate the first verb, no-stress
    let first = verbs.eq(0);
    // already past
    if (first.has('#PastTense')) {
      return s
    }
    first.toPastTense();

    // force agreement with any 2nd/3rd verbs:
    if (verbs.length > 1) {
      verbs = verbs.slice(1);
      // remove any sorta infinitive - 'to engage'
      verbs = verbs.filter((v) => !v.lookBehind('to$').found);

      // keep -ing verbs
      verbs = verbs.if('#PresentTense');
      verbs = verbs.notIf('#Gerund');

      //run-on infinitive-list - 'to walk, sit and eat'
      let list = s.match('to #Verb+ #Conjunction #Verb').terms();
      verbs = verbs.not(list);

      // otherwise, I guess so?
      if (verbs.found) {
        verbs.verbs().toPastTense();
      }
    }

    // s.compute('chunks')
    return s
  };
  var toPast$3 = toPast$2;

  const toPresent$2 = function (s) {
    let verbs = s.verbs();
    // translate the first verb, no-stress
    let first = verbs.eq(0);
    // already present
    // if (first.has('#PresentTense')) {
    //   return s
    // }
    first.toPresentTense();

    // force agreement with any 2nd/3rd verbs:
    if (verbs.length > 1) {
      verbs = verbs.slice(1);
      // remove any sorta infinitive - 'to engage'
      verbs = verbs.filter((v) => !v.lookBehind('to$').found);

      // keep -ing verbs
      // verbs = verbs.if('#PresentTense')
      verbs = verbs.notIf('#Gerund');

      //run-on infinitive-list - 'to walk, sit and eat'
      // let list = s.match('to #Verb+ #Conjunction #Verb').terms()
      // verbs = verbs.not(list)

      // otherwise, I guess so?
      if (verbs.found) {
        verbs.verbs().toPresentTense();
      }
    }

    // s.compute('chunks')
    return s
  };
  var toPresent$3 = toPresent$2;

  const toFuture$2 = function (s) {
    let verbs = s.verbs();
    // translate the first verb, no-stress
    let first = verbs.eq(0);
    first.toFutureTense();
    s = s.fullSentence();
    verbs = s.verbs();//re-do it
    // verbs.debug()
    // force agreement with any 2nd/3rd verbs:
    if (verbs.length > 1) {
      verbs = verbs.slice(1);
      // which following-verbs should we also change?
      let toChange = verbs.filter((vb) => {
        // remove any sorta infinitive - 'to engage'
        if (vb.lookBehind('to$').found) {
          return false
        }
        // is watching
        if (vb.has('#Copula #Gerund')) {
          return true
        }
        // keep -ing verbs
        if (vb.has('#Gerund')) {
          return false
        }
        // he is green and he is friendly
        if (vb.has('#Copula')) {
          return true
        }
        // 'he will see when he watches'
        if (vb.has('#PresentTense') && s.has('(when|as|how)')) {
          return false
        }
        return true
      });
      // otherwise, change em too
      if (toChange.found) {
        toChange.toInfinitive();
      }
    }
    return s
  };
  var toFuture$3 = toFuture$2;

  const toNegative$2 = function (s) {
    s.verbs().first().toNegative().compute('chunks');
    return s
  };
  const toPositive = function (s) {
    s.verbs().first().toPositive().compute('chunks');
    return s
  };

  const toInfinitive$4 = function (s) {
    s.verbs().toInfinitive();
    // s.compute('chunks')
    return s
  };
  var toInfinitive$5 = toInfinitive$4;

  // return the nth elem of a doc
  const getNth$5 = (doc, n) => (typeof n === 'number' ? doc.eq(n) : doc);

  const api$5 = function (View) {
    class Sentences extends View {
      constructor(document, pointer, groups) {
        super(document, pointer, groups);
        this.viewType = 'Sentences';
      }
      json(opts = {}) {
        return this.map(m => {
          let json = m.toView().json(opts)[0] || {};
          let { subj, verb, pred } = parse$3(m);
          json.sentence = {
            subject: subj.text('normal'),
            verb: verb.text('normal'),
            predicate: pred.text('normal'),
          };
          return json
        }, [])
      }
      toPastTense(n) {
        return getNth$5(this, n).map(s => {
          parse$3(s);
          return toPast$3(s)
        })
      }
      toPresentTense(n) {
        return getNth$5(this, n).map(s => {
          parse$3(s);
          return toPresent$3(s)
        })
      }
      toFutureTense(n) {
        return getNth$5(this, n).map(s => {
          parse$3(s);
          s = toFuture$3(s);
          return s
        })
      }
      toInfinitive(n) {
        return getNth$5(this, n).map(s => {
          parse$3(s);
          return toInfinitive$5(s)
        })
      }
      toNegative(n) {
        return getNth$5(this, n).map(vb => {
          parse$3(vb);
          return toNegative$2(vb)
        })
      }
      toPositive(n) {
        return getNth$5(this, n).map(vb => {
          parse$3(vb);
          return toPositive(vb)
        })
      }
      isQuestion(n) {
        return this.questions(n)
      }
      isExclamation(n) {
        let res = this.filter(s => s.lastTerm().has('@hasExclamation'));
        return getNth$5(res, n)
      }
      isStatement(n) {
        let res = this.filter(s => !s.isExclamation().found && !s.isQuestion().found);
        return getNth$5(res, n)
      }
      // overloaded - keep Sentences class
      update(pointer) {
        let m = new Sentences(this.document, pointer);
        m._cache = this._cache; // share this full thing
        return m
      }
    }
    // aliases
    Sentences.prototype.toPresent = Sentences.prototype.toPresentTense;
    Sentences.prototype.toPast = Sentences.prototype.toPastTense;
    Sentences.prototype.toFuture = Sentences.prototype.toFutureTense;

    const methods = {
      sentences: function (n) {
        let m = this.map(s => s.fullSentence());
        m = getNth$5(m, n);
        return new Sentences(this.document, m.pointer)
      },
      questions: function (n) {
        let m = isQuestion$1(this);
        return getNth$5(m, n)
      },
    };

    Object.assign(View.prototype, methods);
  };
  var api$6 = api$5;

  var sentences = { api: api$6 };

  const find$4 = function (doc) {
    let m = doc.match('#Honorific+? #Person+');
    return m
  };
  var find$5 = find$4;

  const parse = function (m) {
    let res = {};
    res.firstName = m.match('#FirstName+');
    res.lastName = m.match('#LastName+');
    res.honorific = m.match('#Honorific+');

    let last = res.lastName;
    let first = res.firstName;
    if (!first.found || !last.found) {
      // let p = m.clone()
      // assume 'Mr Springer' is a last-name
      if (!first.found && !last.found && m.has('^#Honorific .$')) {
        res.lastName = m.match('.$');
        return res
      }
    }
    return res
  };
  var parse$1 = parse;

  /*
    Important notice - 
    this method makes many assumptions about gender-identity, in-order to assign grammatical gender.
    it should not be used for any other purposes, other than resolving pronouns in english
  */
  const m = 'male';
  const f = 'female';

  // known gendered honorifics
  const honorifics = {
    mr: m,
    mrs: f,
    miss: f,
    madam: f,

    // british stuff
    king: m,
    queen: f,
    duke: m,
    duchess: f,
    baron: m,
    baroness: f,
    count: m,
    countess: f,
    prince: m,
    princess: f,
    sire: m,
    dame: f,
    lady: f,

    ayatullah: m, //i think?

    congressman: m,
    congresswoman: f,
    'first lady': f,

    // marked as non-binary
    mx: null,
  };

  const predictGender = function (parsed, person) {
    let { firstName, honorific } = parsed;
    // use first-name as signal-signal
    if (firstName.has('#FemaleName')) {
      return f
    }
    if (firstName.has('#MaleName')) {
      return m
    }
    // use honorics as gender-signal
    if (honorific.found) {
      let hon = honorific.text('normal');
      hon = hon.replace(/\./g, ''); //clean it up a bit
      if (honorifics.hasOwnProperty(hon)) {
        return honorifics[hon]
      }
      // her excelency
      if (/^her /.test(hon)) {
        return f
      }
      if (/^his /.test(hon)) {
        return m
      }
    }
    // offer used-pronouns as a signal
    let after = person.after();
    if (!after.has('#Person') && after.has('#Pronoun')) {
      let pro = after.match('#Pronoun');
      // manual use of gender-neutral
      if (pro.has('(they|their)')) {
        return null
      }
      let hasMasc = pro.has('(he|his)');
      let hasFem = pro.has('(she|her|hers)');
      if (hasMasc && !hasFem) {
        return m
      }
      if (hasFem && !hasMasc) {
        return f
      }
    }
    return null
  };
  var gender = predictGender;

  // return the nth elem of a doc
  const getNth$4 = (doc, n) => (typeof n === 'number' ? doc.eq(n) : doc);

  const addMethod$1 = function (View) {
    /**
     *
     */
    class People extends View {
      constructor(document, pointer, groups) {
        super(document, pointer, groups);
        this.viewType = 'People';
      }
      parse(n) {
        return getNth$4(this, n).map(parse$1)
      }
      json(n) {
        let doc = getNth$4(this, n);
        return doc.map(p => {
          let json = p.toView().json(n)[0];
          let parsed = parse$1(p);
          json.person = {
            firstName: parsed.firstName.text('normal'),
            lastName: parsed.lastName.text('normal'),
            honorific: parsed.honorific.text('normal'),
            presumed_gender: gender(parsed, p),
          };
          return json
        }, [])
      }
      // overloaded - keep People class
      update(pointer) {
        let m = new People(this.document, pointer);
        m._cache = this._cache; // share this full thing
        return m
      }
    }

    View.prototype.people = function (n) {
      let m = find$5(this);
      m = getNth$4(m, n);
      return new People(this.document, m.pointer)
    };
  };
  var people = addMethod$1;

  const find$2 = function (doc) {
    let m = doc.match('(#Place|#Address)+');

    // split all commas except for 'paris, france'
    let splits = m.match('@hasComma');
    splits = splits.filter(c => {
      // split 'europe, china'
      if (c.has('(asia|africa|europe|america)$')) {
        return true
      }
      // don't split 'paris, france'
      if (c.has('(#City|#Region|#ProperNoun)$') && c.after('^(#Country|#Region)').found) {
        return false
      }
      return true
    });
    m = m.splitAfter(splits);
    return m
  };
  var find$3 = find$2;

  // return the nth elem of a doc
  const getNth$3 = (doc, n) => (typeof n === 'number' ? doc.eq(n) : doc);

  const addMethod = function (View) {
    View.prototype.places = function (n) {
      let m = find$3(this);
      m = getNth$3(m, n);
      return new View(this.document, m.pointer)
    };
  };
  var places = addMethod;

  // return the nth elem of a doc
  const getNth$2 = (doc, n) => (typeof n === 'number' ? doc.eq(n) : doc);

  const api$4 = function (View) {
    View.prototype.organizations = function (n) {
      let m = this.match('#Organization+');
      return getNth$2(m, n)
    };
  };
  var orgs = api$4;

  // return the nth elem of a doc
  const getNth$1 = (doc, n) => (typeof n === 'number' ? doc.eq(n) : doc);

  //combine them with .topics() method
  const find$1 = function (n) {
    let r = this.clauses();
    // Find people, places, and organizations
    let m = r.people();
    m = m.concat(r.places());
    m = m.concat(r.organizations());
    m = m.not('(someone|man|woman|mother|brother|sister|father)');
    //return them to normal ordering
    m = m.sort('seq');
    // m = m.unique()
    m = getNth$1(m, n);
    return m
  };

  const api$3 = function (View) {
    View.prototype.topics = find$1;
  };
  var topics$1 = api$3;

  const api$2 = function (View) {
    people(View);
    places(View);
    orgs(View);
    topics$1(View);
  };
  var topics = { api: api$2 };

  const findVerbs = function (doc) {
    let m = doc.match('<Verb>');

    m = m.splitAfter('@hasComma');

    // the reason he will is ...
    // all i do is talk
    m = m.splitAfter('[(do|did|am|was|is|will)] (is|was)', 0);
    // m = m.splitAfter('[(do|did|am|was|is|will)] #PresentTense', 0)

    // cool

    // like being pampered
    m = m.splitBefore('(#Verb && !#Copula) [being] #Verb', 0);
    // like to be pampered
    m = m.splitBefore('#Verb [to be] #Verb', 0);

    // implicit conjugation - 'help fix'

    m = m.splitAfter('[help] #PresentTense', 0);
    // what i can sell is..
    m = m.splitBefore('(#PresentTense|#PastTense) [#Copula]$', 0);
    // what i can sell will be
    m = m.splitBefore('(#PresentTense|#PastTense) [will be]$', 0);

    // professes love
    let toVerbs = m.match('(#PresentTense|#PastTense) #Infinitive');
    if (toVerbs.found && !toVerbs.has('^go')) {
      m = m.splitBefore('(#PresentTense|#PastTense) [#Infinitive]', 0);
    }
    // 'allow yourself'
    m = m.not('#Reflexive$');
    //ensure there's actually a verb
    m = m.if('#Verb');
    // the reason he will is ...
    // ensure it's not two verbs
    return m
  };
  var find = findVerbs;

  // find the main verb, from a verb phrase
  const getMain = function (vb) {
    let root = vb;
    if (vb.wordCount() > 1) {
      root = vb.not('(#Negative|#Auxiliary|#Modal|#Adverb|#Prefix)');
    }
    // fallback to just the last word, sometimes
    if (root.length > 1 && !root.has('#Phrasal #Particle')) {
      root = root.last();
    }
    // look for more modals
    root = root.not('(want|wants|wanted) to');

    // fallback
    if (!root.found) {
      root = vb.not('#Negative');
      return root
    }
    return root
  };
  var getRoot = getMain;

  // split adverbs as before/after the root
  const getAdverbs = function (vb, root) {
    let res = {
      pre: vb.none(),
      post: vb.none(),
    };
    if (!vb.has('#Adverb')) {
      return res
    }
    // pivot on the main verb
    let parts = vb.splitOn(root);
    if (parts.length === 3) {
      return {
        pre: parts.eq(0).adverbs(),
        post: parts.eq(2).adverbs(),
      }
    }
    // it must be the second one
    if (parts.eq(0).isDoc(root)) {
      res.post = parts.eq(1).adverbs();
      return res
    }
    res.pre = parts.eq(0).adverbs();
    return res
  };
  var getAdverbs$1 = getAdverbs;

  const getAuxiliary = function (vb, root) {
    let parts = vb.splitBefore(root);
    if (parts.length <= 1) {
      return vb.none()
    }
    let aux = parts.eq(0);
    aux = aux.not('(#Adverb|#Negative|#Prefix)');
    return aux
  };

  const getNegative = function (vb) {
    return vb.match('#Negative')
  };

  // pull-apart phrasal-verb into verb-particle
  const getPhrasal = function (root) {
    let particle = root.match('#Particle$');
    return {
      verb: root.not(particle),
      particle: particle,
    }
  };

  const parseVerb = function (view) {
    let vb = view.clone();
    vb.contractions().expand();
    const root = getRoot(vb);
    let res = {
      root: root,
      prefix: vb.match('#Prefix'),
      adverbs: getAdverbs$1(vb, root),
      auxiliary: getAuxiliary(vb, root),
      negative: getNegative(vb),
      phrasal: getPhrasal(root),
    };
    return res
  };
  var parseVerb$1 = parseVerb;

  const present = { tense: 'PresentTense' };
  const conditional = { conditional: true };
  const future = { tense: 'FutureTense' };
  const prog = { progressive: true };
  const past = { tense: 'PastTense' };
  const complete = { complete: true, progressive: false };
  const passive = { passive: true };
  const plural = { plural: true };
  const singular = { plural: false };

  const getData = function (tags) {
    let data = {};
    tags.forEach(o => {
      Object.assign(data, o);
    });
    return data
  };

  const verbForms = {
    // === Simple ===
    'imperative': [
      // walk!
      ['#Imperative', []],
    ],

    'want-infinitive': [
      ['^(want|wants|wanted) to #Infinitive$', [present]],
      ['^wanted to #Infinitive$', [past]],
      ['^will want to #Infinitive$', [future]],
    ],

    'gerund-phrase': [
      // started looking
      ['^#PastTense #Gerund$', [past]],
      // starts looking
      ['^#PresentTense #Gerund$', [present]],
      // start looking
      ['^#Infinitive #Gerund$', [present]],
      // will start looking
      ['^will #Infinitive #Gerund$', [future]],
      // have started looking
      ['^have #PastTense #Gerund$', [past]],
      // will have started looking
      ['^will have #PastTense #Gerund$', [past]],
    ],

    'simple-present': [
      // he walks',
      ['^#PresentTense$', [present]],
      // we walk
      ['^#Infinitive$', [present]],
    ],
    'simple-past': [
      // he walked',
      ['^#PastTense$', [past]],
    ],
    'simple-future': [
      // he will walk
      ['^will #Adverb? #Infinitive', [future]],
    ],

    // === Progressive ===
    'present-progressive': [
      // he is walking
      ['^(is|are|am) #Gerund$', [present, prog]],
    ],
    'past-progressive': [
      // he was walking
      ['^(was|were) #Gerund$', [past, prog]],
    ],
    'future-progressive': [
      // he will be
      ['^will be #Gerund$', [future, prog]],
    ],

    // === Perfect ===
    'present-perfect': [
      // he has walked
      ['^(has|have) #PastTense$', [past, complete]], //past?
    ],
    'past-perfect': [
      // he had walked
      ['^had #PastTense$', [past, complete]],
      // had been to see
      ['^had #PastTense to #Infinitive', [past, complete]],
    ],
    'future-perfect': [
      // he will have
      ['^will have #PastTense$', [future, complete]],
    ],

    // === Progressive-perfect ===
    'present-perfect-progressive': [
      // he has been walking
      ['^(has|have) been #Gerund$', [past, prog]], //present?
    ],
    'past-perfect-progressive': [
      // he had been
      ['^had been #Gerund$', [past, prog]],
    ],
    'future-perfect-progressive': [
      // will have been
      ['^will have been #Gerund$', [future, prog]],
    ],

    // ==== Passive ===
    'passive-past': [
      // got walked, was walked, were walked
      ['(got|were|was) (#PastTense|#Participle)', [past, passive]],
      // was being walked
      ['^(was|were) being (#PastTense|#Participle)', [past, passive]],
      // had been walked, have been eaten
      ['^(had|have) been (#PastTense|#Participle)', [past, passive]],
    ],
    'passive-present': [
      // is walked, are stolen
      ['^(is|are|am) (#PastTense|#Participle)', [present, passive]],
      // is being walked
      ['^(is|are|am) being (#PastTense|#Participle)', [present, passive]],
      // has been cleaned
      ['^has been (#PastTense|#Participle)', [present, passive]],
    ],
    'passive-future': [
      // will have been walked
      ['will have been (#PastTense|#Participle)', [future, passive, conditional]],
      // will be cleaned
      ['will be being? (#PastTense|#Participle)', [future, passive, conditional]],
    ],

    // === Conditional ===
    'present-conditional': [
      // would be walked
      ['would be #PastTense', [present, conditional]],
    ],
    'past-conditional': [
      // would have been walked
      ['would have been #PastTense', [past, conditional]],
    ],

    // ==== Auxiliary ===
    'auxiliary-future': [
      // going to drink
      ['(is|are|am|was) going to (#Infinitive|#PresentTense)', [future]],
    ],
    'auxiliary-past': [
      // he did walk
      ['^did #Infinitive$', [past, singular]],
      // used to walk
      ['^used to #Infinitive$', [past, complete]],
    ],
    'auxiliary-present': [
      // we do walk
      ['^(does|do) #Infinitive$', [present, complete, plural]],
    ],

    // === modals ===
    'modal-past': [
      // he could have walked
      ['^(could|must|should|shall) have #PastTense$', [past]],
    ],
    'modal-infinitive': [
      // he can walk
      ['^#Modal #Infinitive$', []],
    ],

    'infinitive': [
      // walk
      ['^#Infinitive$', []],
    ],
  };

  let list = [];
  Object.keys(verbForms).map(k => {
    verbForms[k].forEach(a => {
      list.push({
        name: k,
        match: a[0],
        data: getData(a[1]),
      });
    });
  });

  var forms$4 = list;

  const cleanUp = function (vb, res) {
    vb = vb.clone();
    // remove adverbs
    if (res.adverbs.post && res.adverbs.post.found) {
      vb.remove(res.adverbs.post);
    }
    if (res.adverbs.pre && res.adverbs.pre.found) {
      vb.remove(res.adverbs.pre);
    }
    // remove negatives
    if (vb.has('#Negative')) {
      vb = vb.remove('#Negative');
    }
    // remove prefixes like 'anti'
    if (vb.has('#Prefix')) {
      vb = vb.remove('#Prefix');
    }
    // cut-off phrasal-verb
    if (res.root.has('#PhrasalVerb #Particle')) {
      vb.remove('#Particle$');
    }
    // did we miss any of these?
    // vb = vb.remove('#Adverb')
    vb = vb.not('#Adverb');
    return vb
  };

  const getGrammar = function (vb, res) {
    let grammar = {};
    // make it easy to classify, first
    vb = cleanUp(vb, res);
    for (let i = 0; i < forms$4.length; i += 1) {
      let todo = forms$4[i];
      if (vb.has(todo.match) === true) {
        grammar.form = todo.name;
        Object.assign(grammar, todo.data);
        break //only match one
      }
    }
    // did we find nothing?
    if (!grammar.form) {
      if (vb.has('^#Verb$')) {
        grammar.form = 'infinitive';
      }
    }
    // fallback to 'naiive' tense detection
    if (!grammar.tense) {
      grammar.tense = res.root.has('#PastTense') ? 'PastTense' : 'PresentTense';
    }
    grammar.copula = res.root.has('#Copula');
    return grammar
  };

  var getGrammar$1 = getGrammar;

  const shouldSkip = function (last) {
    // is it our only choice?
    if (last.length <= 1) {
      return false
    }
    let obj = last.parse()[0] || {};
    return obj.isSubordinate
  };

  // try to chop-out any obvious conditional phrases
  // he wore, [if it was raining], a raincoat.
  const noSubClause = function (before) {
    let parts = before.clauses();
    parts = parts.filter((m, i) => {
      // if it was raining..
      if (m.has('^(if|unless|while|but|for|per|at|by|that|which|who|from)')) {
        return false
      }
      // bowed to her,
      if (i > 0 && m.has('^#Verb . #Noun+$')) {
        return false
      }
      // the fog, suddenly increasing in..
      if (i > 0 && m.has('^#Adverb')) {
        return false
      }
      return true
    });
    // don't drop the whole thing.
    if (parts.length === 0) {
      return before
    }
    return parts
  };

  //
  const lastNoun = function (vb) {
    let before = vb.before();
    // try to drop any mid-sentence clauses
    before = noSubClause(before);
    // parse-out our preceding nouns
    let nouns = before.nouns();
    // look for any dead-ringers
    let last = nouns.last();
    // i/she/he/they are very strong
    let pronoun = last.match('(i|he|she|we|you|they)');
    if (pronoun.found) {
      return pronoun.nouns()
    }
    // these are also good hints
    let det = nouns.if('^(that|this|those)');
    if (det.found) {
      return det
    }
    if (nouns.found === false) {
      det = before.match('^(that|this|those)');
      if (det.found) {
        return det
      }
    }

    // should we skip a subbordinate clause or two?
    last = nouns.last();
    if (shouldSkip(last)) {
      nouns.remove(last);
      last = nouns.last();
    }
    // i suppose we can skip two?
    if (shouldSkip(last)) {
      nouns.remove(last);
      last = nouns.last();
    }
    return last
  };

  const isPlural$1 = function (subj, vb) {
    // 'we are' vs 'he is'
    if (vb.has('(are|were|does)')) {
      return true
    }
    if (subj.has('(those|they|we)')) {
      return true
    }
    if (subj.found && subj.isPlural) {
      return subj.isPlural().found
    }
    return false
  };

  const getSubject = function (vb) {
    let subj = lastNoun(vb);
    return {
      subject: subj,
      plural: isPlural$1(subj, vb),
    }
  };
  var getSubject$1 = getSubject;

  const noop = vb => vb;

  const isPlural = (vb, parsed) => {
    let subj = getSubject$1(vb);
    let m = subj.subject;
    if (m.has('i') || m.has('we')) {
      return true
    }
    return subj.plural
  };

  const wasWere = (vb, parsed) => {
    let { subject, plural } = getSubject$1(vb);
    if (plural || subject.has('we')) {
      return 'were'
    }
    return 'was'
  };

  // present-tense copula
  const isAreAm = function (vb, parsed) {
    // 'people were' -> 'people are'
    if (vb.has('were')) {
      return 'are'
    }
    // 'i was' -> i am
    let { subject, plural } = getSubject$1(vb);
    if (subject.has('i')) {
      return 'am'
    }
    if (subject.has('we') || plural) {
      return 'are'
    }
    // 'he was' -> he is
    return 'is'
  };


  const doDoes = function (vb, parsed) {
    let subj = getSubject$1(vb);
    let m = subj.subject;
    if (m.has('i') || m.has('we')) {
      return 'do'
    }
    if (subj.plural) {
      return 'do'
    }
    return 'does'
  };

  const getTense = function (m) {
    if (m.has('#Infinitive')) {
      return 'Infinitive'
    }
    if (m.has('#Participle')) {
      return 'Participle'
    }
    if (m.has('#PastTense')) {
      return 'PastTense'
    }
    if (m.has('#Gerund')) {
      return 'Gerund'
    }
    if (m.has('#PresentTense')) {
      return 'PresentTense'
    }
    return undefined
  };

  const toInf = function (vb, parsed) {
    const { verbToInfinitive } = vb.methods.two.transform;
    let str = parsed.root.text({ keepPunct: false });
    str = verbToInfinitive(str, vb.model, getTense(vb));
    if (str) {
      vb.replace(parsed.root, str);
    }
    return vb
  };



  // i will start looking -> i started looking
  // i will not start looking -> i did not start looking
  const noWill = (vb) => {
    if (vb.has('will not')) {
      return vb.replace('will not', 'have not')
    }
    return vb.remove('will')
  };

  const toArray = function (m) {
    if (!m || !m.isView) {
      return []
    }
    const opts = { normal: true, terms: false, text: false };
    return m.json(opts).map(s => s.normal)
  };

  const toText = function (m) {
    if (!m || !m.isView) {
      return ''
    }
    return m.text('normal')
  };

  const toInfinitive$3 = function (root) {
    const { verbToInfinitive } = root.methods.two.transform;
    let str = root.text('normal');
    return verbToInfinitive(str, root.model, getTense(root))
  };

  const toJSON = function (vb) {
    let parsed = parseVerb$1(vb);
    vb = vb.clone().toView();
    const info = getGrammar$1(vb, parsed);
    return {
      root: parsed.root.text(),
      preAdverbs: toArray(parsed.adverbs.pre),
      postAdverbs: toArray(parsed.adverbs.post),
      auxiliary: toText(parsed.auxiliary),
      negative: parsed.negative.found,
      prefix: toText(parsed.prefix),
      infinitive: toInfinitive$3(parsed.root),
      grammar: info,
    }
  };
  var toJSON$1 = toJSON;

  const keep$5 = { tags: true };

  // all verb forms are the same
  const toInfinitive$1 = function (vb, parsed) {
    const { verbToInfinitive } = vb.methods.two.transform;
    const { root, auxiliary } = parsed;
    let aux = auxiliary.terms().harden();
    let str = root.text('normal');
    str = verbToInfinitive(str, vb.model, getTense(root));
    if (str) {
      vb.replace(root, str, keep$5).tag('Verb').firstTerm().tag('Infinitive');
    }
    // remove any auxiliary terms
    if (aux.found) {
      vb.remove(aux);
    }
    // there is no real way to do this
    // 'i not walk'?  'i walk not'?
    if (parsed.negative.found) {
      if (!vb.has('not')) {
        vb.prepend('not');
      }
      let does = doDoes(vb);
      vb.prepend(does);
    }
    vb.fullSentence().compute(['lexicon', 'preTagger', 'postTagger', 'chunks']);
    return vb
  };
  var toInfinitive$2 = toInfinitive$1;

  const keep$4 = { tags: true };

  const fns = {

    noAux: (vb, parsed) => {
      if (parsed.auxiliary.found) {
        vb = vb.remove(parsed.auxiliary);
      }
      return vb
    },

    // walk->walked
    simple: (vb, parsed) => {
      const { verbConjugate, verbToInfinitive } = vb.methods.two.transform;
      const root = parsed.root;
      // 'i may'
      if (root.has('#Modal')) {
        return vb
      }
      let str = root.text({ keepPunct: false });
      str = verbToInfinitive(str, vb.model, getTense(root));
      let all = verbConjugate(str, vb.model);
      // 'driven' || 'drove'
      str = all.PastTense;
      // all.Participle || all.PastTense
      // but skip the 'is' participle..
      str = str === 'been' ? 'was' : str;
      if (str === 'was') {
        str = wasWere(vb);
      }
      if (str) {
        vb.replace(root, str, keep$4);
      }
      return vb
    },

    both: function (vb, parsed) {
      // 'he did not walk'
      if (parsed.negative.found) {
        vb.replace('will', 'did');
        return vb
      }
      // 'he walked'
      vb = fns.simple(vb, parsed);
      vb = fns.noAux(vb, parsed);
      return vb
    },

    hasHad: vb => {
      vb.replace('has', 'had', keep$4);
      return vb
    },

    // some verbs have this weird past-tense form
    // drive -> driven, (!drove)
    hasParticiple: (vb, parsed) => {
      const { verbConjugate, verbToInfinitive } = vb.methods.two.transform;
      const root = parsed.root;
      let str = root.text('normal');
      str = verbToInfinitive(str, vb.model, getTense(root));
      return verbConjugate(str, vb.model).Participle
    },



  };


  const forms$3 = {
    // walk -> walked
    'infinitive': fns.simple,
    // he walks -> he walked
    'simple-present': fns.simple,
    // he walked
    'simple-past': noop,
    // he will walk -> he walked
    'simple-future': fns.both,

    // he is walking
    'present-progressive': vb => {
      vb.replace('are', 'were', keep$4);
      vb.replace('(is|are|am)', 'was', keep$4);
      return vb
    },
    // he was walking
    'past-progressive': noop,
    // he will be walking
    'future-progressive': (vb, parsed) => {
      vb.match(parsed.root).insertBefore('was');
      vb.remove('(will|be)');
      return vb
    },

    // has walked -> had walked (?)
    'present-perfect': fns.hasHad,
    // had walked
    'past-perfect': noop,
    // will have walked -> had walked
    'future-perfect': (vb, parsed) => {
      vb.match(parsed.root).insertBefore('had');
      if (vb.has('will')) {
        vb = noWill(vb);
      }
      vb.remove('have');
      return vb
    },

    // has been walking -> had been
    'present-perfect-progressive': fns.hasHad,
    // had been walking
    'past-perfect-progressive': noop,
    // will have been -> had
    'future-perfect-progressive': vb => {
      vb.remove('will');
      vb.replace('have', 'had', keep$4);
      return vb
    },

    // got walked
    'passive-past': vb => {
      // 'have been walked' -> 'had been walked'
      vb.replace('have', 'had', keep$4);
      return vb
    },
    // is being walked  -> 'was being walked'
    'passive-present': vb => {
      vb.replace('(is|are)', 'was', keep$4);
      return vb
    },
    // will be walked -> had been walked
    'passive-future': (vb, parsed) => {
      if (parsed.auxiliary.has('will be')) {
        vb.match(parsed.root).insertBefore('had been');
        vb.remove('(will|be)');
      }
      // will have been walked -> had been walked
      if (parsed.auxiliary.has('will have been')) {
        vb.replace('have', 'had', keep$4);
        vb.remove('will');
      }
      return vb
    },

    // would be walked -> 'would have been walked'
    'present-conditional': vb => {
      vb.replace('be', 'have been');
      return vb
    },
    // would have been walked
    'past-conditional': noop,

    // is going to drink -> was going to drink
    'auxiliary-future': vb => {
      vb.replace('(is|are|am)', 'was', keep$4);
      return vb
    },
    // used to walk
    'auxiliary-past': noop,
    // we do walk -> we did walk
    'auxiliary-present': vb => {
      vb.replace('(do|does)', 'did', keep$4);
      return vb
    },

    // must walk -> 'must have walked'
    'modal-infinitive': (vb, parsed) => {
      // this modal has a clear tense
      if (vb.has('can')) {
        // can drive -> could drive
        vb.replace('can', 'could', keep$4);
      } else {
        // otherwise, 
        //  walk -> have walked
        //  drive -> have driven
        fns.simple(vb, parsed);
        vb.match('#Modal').insertAfter('have').tag('Auxiliary');
      }
      return vb
    },
    // must have walked
    'modal-past': noop,
    // wanted to walk
    'want-infinitive': vb => {
      vb.replace('(want|wants)', 'wanted', keep$4);
      vb.remove('will');
      return vb
    },
    // started looking
    'gerund-phrase': (vb, parsed) => {
      parsed.root = parsed.root.not('#Gerund$');
      fns.simple(vb, parsed);
      noWill(vb);
      return vb
    },
  };

  const toPast = function (vb, parsed, form) {
    // console.log(form)
    if (forms$3.hasOwnProperty(form)) {
      vb = forms$3[form](vb, parsed);
      vb.fullSentence().compute(['tagger', 'chunks']);
      return vb
    }
    // do nothing i guess?
    return vb
  };
  var toPast$1 = toPast;

  const keep$3 = { tags: true };

  // walk->walked
  const simple$1 = (vb, parsed) => {
    const { verbConjugate, verbToInfinitive } = vb.methods.two.transform;
    const root = parsed.root;
    let str = root.text('normal');
    str = verbToInfinitive(str, vb.model, getTense(root));
    // 'i walk' vs 'he walks'
    if (isPlural(vb) === false) {
      str = verbConjugate(str, vb.model).PresentTense;
    }
    // handle copula
    if (root.has('#Copula')) {
      str = isAreAm(vb);
    }
    if (str) {
      vb = vb.replace(root, str, keep$3);
      vb.not('#Particle').tag('PresentTense');
    }
    // vb.replace('not ' + str, str + ' not')
    return vb
  };

  const toGerund$2 = (vb, parsed) => {
    const { verbConjugate, verbToInfinitive } = vb.methods.two.transform;
    const root = parsed.root;
    let str = root.text('normal');
    str = verbToInfinitive(str, vb.model, getTense(root));
    // 'i walk' vs 'he walks'
    if (isPlural(vb) === false) {
      str = verbConjugate(str, vb.model).Gerund;
    }
    if (str) {
      vb = vb.replace(root, str, keep$3);
      vb.not('#Particle').tag('Gerund');
    }
    return vb
  };

  const toInfinitive = (vb, parsed) => {
    const { verbToInfinitive } = vb.methods.two.transform;
    const root = parsed.root;
    let str = parsed.root.text('normal');
    str = verbToInfinitive(str, vb.model, getTense(root));
    if (str) {
      vb = vb.replace(parsed.root, str, keep$3);
    }
    return vb
  };



  const forms$2 = {
    // walk
    'infinitive': simple$1,
    // he walks -> he walked
    'simple-present': (vb, parsed) => {
      const { verbConjugate } = vb.methods.two.transform;
      let { root } = parsed;
      // is it *only* a infinitive? - 'we buy' etc
      if (root.has('#Infinitive')) {
        let subj = getSubject$1(vb);
        let m = subj.subject;
        if (isPlural(vb) || m.has('i')) {
          // keep it infinitive
          return vb
        }
        let str = root.text('normal');
        let pres = verbConjugate(str, vb.model).PresentTense;
        if (str !== pres) {
          vb.replace(root, pres, keep$3);
        }
      } else {
        return simple$1(vb, parsed)
      }
      return vb
    },
    // he walked
    'simple-past': simple$1,
    // he will walk -> he walked
    'simple-future': (vb, parsed) => {
      const { root, auxiliary } = parsed;
      // handle 'will be'
      if (auxiliary.has('will') && root.has('be')) {
        let str = isAreAm(vb);
        vb.replace(root, str);
        vb = vb.remove('will');
        vb.replace('not ' + str, str + ' not');
      } else {
        simple$1(vb, parsed);
        vb = vb.remove('will');
      }
      return vb
    },

    // is walking ->
    'present-progressive': noop,
    // was walking -> is walking
    'past-progressive': (vb, parsed) => {
      let str = isAreAm(vb);
      return vb.replace('(were|was)', str, keep$3)
    },
    // will be walking -> is walking
    'future-progressive': vb => {
      vb.match('will').insertBefore('is');
      vb.remove('be');
      return vb.remove('will')
    },

    // has walked ->  (?)
    'present-perfect': (vb, parsed) => {
      simple$1(vb, parsed);
      vb = vb.remove('(have|had|has)');
      return vb
    },

    // had walked -> has walked
    'past-perfect': (vb, parsed) => {
      // not 'we has walked'
      let subj = getSubject$1(vb);
      let m = subj.subject;
      if (isPlural(vb) || m.has('i')) {
        vb = toInf(vb, parsed);// we walk
        vb.remove('had');
        return vb
      }
      vb.replace('had', 'has', keep$3);
      return vb
    },
    // will have walked -> has walked
    'future-perfect': vb => {
      vb.match('will').insertBefore('has');
      return vb.remove('have').remove('will')
    },

    // has been walking
    'present-perfect-progressive': noop,
    // had been walking
    'past-perfect-progressive': vb => vb.replace('had', 'has', keep$3),
    // will have been -> has been
    'future-perfect-progressive': vb => {
      vb.match('will').insertBefore('has');
      return vb.remove('have').remove('will')
    },

    // got walked -> is walked
    // was walked -> is walked
    // had been walked -> is walked
    'passive-past': (vb, parsed) => {
      let str = isAreAm(vb);
      if (vb.has('(had|have|has)') && vb.has('been')) {
        vb.replace('(had|have|has)', str, keep$3);
        vb.replace('been', 'being');
        return vb
      }
      return vb.replace('(got|was|were)', str)
    },
    // is being walked  ->
    'passive-present': noop,
    // will be walked -> is being walked
    'passive-future': vb => {
      vb.replace('will', 'is');
      return vb.replace('be', 'being')
    },

    // would be walked ->
    'present-conditional': noop,
    // would have been walked ->
    'past-conditional': vb => {
      vb.replace('been', 'be');
      return vb.remove('have')
    },

    // is going to drink -> is drinking
    'auxiliary-future': (vb, parsed) => {
      toGerund$2(vb, parsed);
      vb.remove('(going|to)');
      return vb
    },
    // used to walk -> is walking
    // did walk -> is walking
    'auxiliary-past': (vb, parsed) => {
      // 'did provide' -> 'does provide'
      if (parsed.auxiliary.has('did')) {
        let str = doDoes(vb);
        vb.replace(parsed.auxiliary, str);
        return vb
      }
      toGerund$2(vb, parsed);
      vb.replace(parsed.auxiliary, 'is');
      return vb
    },
    // we do walk ->
    'auxiliary-present': noop,

    // must walk -> 'must have walked'
    'modal-infinitive': noop,
    // must have walked
    'modal-past': (vb, parsed) => {
      toInfinitive(vb, parsed);
      return vb.remove('have')
    },
    // started looking
    'gerund-phrase': (vb, parsed) => {
      parsed.root = parsed.root.not('#Gerund$');
      simple$1(vb, parsed);
      return vb.remove('(will|have)')
    },
    // wanted to walk
    'want-infinitive': (vb, parsed) => {
      let str = 'wants';
      if (isPlural(vb)) {
        str = 'want';//we want
      }
      vb.replace('(want|wanted|wants)', str, keep$3);
      vb.remove('will');
      return vb
    },
  };

  const toPresent = function (vb, parsed, form) {
    // console.log(form)
    if (forms$2.hasOwnProperty(form)) {
      vb = forms$2[form](vb, parsed);
      vb.fullSentence().compute(['tagger', 'chunks']);
      return vb
    }
    return vb
  };
  var toPresent$1 = toPresent;

  const keep$2 = { tags: true };

  const simple = (vb, parsed) => {
    const { verbToInfinitive } = vb.methods.two.transform;
    const { root, auxiliary } = parsed;
    // 'i may'
    if (root.has('#Modal')) {
      return vb
    }
    let str = root.text('normal');
    str = verbToInfinitive(str, vb.model, getTense(root));
    if (str) {
      vb = vb.replace(root, str, keep$2);
      vb.not('#Particle').tag('Verb');
    }
    vb.prepend('will').match('will').tag('Auxiliary');
    vb.remove(auxiliary);
    return vb
  };

  // 'will be walking'
  const progressive = (vb, parsed) => {
    const { verbConjugate, verbToInfinitive } = vb.methods.two.transform;
    const { root, auxiliary } = parsed;
    let str = root.text('normal');
    str = verbToInfinitive(str, vb.model, getTense(root));
    if (str) {
      str = verbConjugate(str, vb.model).Gerund;
      vb.replace(root, str, keep$2);
      vb.not('#Particle').tag('PresentTense');
    }
    vb.remove(auxiliary);
    vb.prepend('will be').match('will be').tag('Auxiliary');
    return vb
  };

  const forms$1 = {
    // walk ->
    'infinitive': simple,
    // he walks ->
    'simple-present': simple,
    // he walked
    'simple-past': simple,
    // he will walk ->
    'simple-future': noop,

    // is walking ->
    'present-progressive': progressive,
    // was walking ->
    'past-progressive': progressive,
    // will be walking ->
    'future-progressive': noop,

    // has walked ->
    'present-perfect': (vb) => {
      vb.match('(have|has)').replaceWith('will have');
      return vb
    },
    // had walked ->
    'past-perfect': vb => vb.replace('(had|has)', 'will have'),
    // will have walked ->
    'future-perfect': noop,

    // has been walking
    'present-perfect-progressive': vb => vb.replace('has', 'will have'),
    // had been walking
    'past-perfect-progressive': vb => vb.replace('had', 'will have'),
    // will have been ->
    'future-perfect-progressive': noop,

    // got walked ->
    // was walked ->
    // was being walked ->
    // had been walked ->
    'passive-past': vb => {
      if (vb.has('got')) {
        return vb.replace('got', 'will get')
      }
      if (vb.has('(was|were)')) {
        vb.replace('(was|were)', 'will be');
        return vb.remove('being')
      }
      if (vb.has('(have|has|had) been')) {
        return vb.replace('(have|has|had) been', 'will be')
      }
      return vb
    },
    // is being walked  ->
    'passive-present': vb => {
      vb.replace('being', 'will be');
      vb.remove('(is|are|am)');
      return vb
    },
    // will be walked ->
    'passive-future': noop,
    // would be walked ->
    'present-conditional': vb => vb.replace('would', 'will'),
    // would have been walked ->
    'past-conditional': vb => vb.replace('would', 'will'),

    // is going to drink ->
    'auxiliary-future': noop,
    // used to walk -> is walking
    // did walk -> is walking
    'auxiliary-past': vb => {
      if (vb.has('used') && vb.has('to')) {
        vb.replace('used', 'will');
        return vb.remove('to')
      }
      vb.replace('did', 'will');
      return vb
    },
    // we do walk ->
    // he does walk ->
    'auxiliary-present': vb => {
      return vb.replace('(do|does)', 'will')
    },

    // must walk ->
    'modal-infinitive': noop,
    // must have walked
    'modal-past': noop,
    // started looking
    'gerund-phrase': (vb, parsed) => {
      parsed.root = parsed.root.not('#Gerund$');
      simple(vb, parsed);
      return vb.remove('(had|have)')
    },
    // wanted to walk
    'want-infinitive': vb => {
      vb.replace('(want|wants|wanted)', 'will want');
      return vb
    },
  };

  const toFuture = function (vb, parsed, form) {
    // console.log(form)
    // is it already future-tense?
    if (vb.has('will') || vb.has('going to')) {
      return vb
    }
    if (forms$1.hasOwnProperty(form)) {
      vb = forms$1[form](vb, parsed);
      vb.fullSentence().compute(['tagger', 'chunks']);
      return vb
    }
    return vb
  };
  var toFuture$1 = toFuture;

  const keep$1 = { tags: true };

  // all verb forms are the same
  const toGerund = function (vb, parsed) {
    // console.log(form)
    const { verbToInfinitive, verbConjugate } = vb.methods.two.transform;
    const { root, auxiliary } = parsed;
    if (vb.has('#Gerund')) {
      return vb
    }

    // conjugate '-ing' verb
    let str = root.text('normal');
    str = verbToInfinitive(str, vb.model, getTense(root));
    let gerund = verbConjugate(str, vb.model).Gerund;
    // 'are walking', 'is walking'
    if (gerund) {
      gerund = `${isAreAm(vb)} ${gerund}`;
      // console.log(root, gerund)
      // vb.match(root).debug()
      vb.replace(root, gerund, keep$1);
    }

    // remove any existing auxiliary
    if (auxiliary.found) {
      vb.remove(auxiliary);
    }
    vb.replace('not is', 'is not');
    vb.replace('not are', 'are not');
    vb.fullSentence().compute(['tagger', 'chunks']);
    return vb
  };
  var toGerund$1 = toGerund;

  const keep = { tags: true };

  // do/does not walk 
  const doesNot = function (vb, parsed) {
    let does = doDoes(vb);
    vb.prepend(does + ' not');
    return vb
  };

  const isWas = function (vb) {
    // not be
    let m = vb.match('be');
    if (m.found) {
      m.prepend('not');
      return vb
    }
    // will not
    m = vb.match('(is|was|am|are|will|were)');
    if (m.found) {
      m.append('not');
      return vb
    }
    return vb
  };

  const hasCopula = (vb) => vb.has('(is|was|am|are|will|were|be)');

  //vaguely, turn 'he is cool' into 'he is not cool'
  const forms = {


    // he walks' -> 'he does not walk'
    'simple-present': (vb, parsed) => {
      // is/was
      if (hasCopula(vb) === true) {
        return isWas(vb)
      }
      // he walk
      vb = toInf(vb, parsed);
      // does not 
      vb = doesNot(vb);
      return vb
    },
    // 'he walked' -> 'he did not walk'
    'simple-past': (vb, parsed) => {
      // is/was
      if (hasCopula(vb) === true) {
        return isWas(vb)
      }
      // he walk
      vb = toInf(vb, parsed);
      // vb.debug()
      // did not walk
      vb.prepend('did not');
      return vb
    },

    // walk! -> 'do not walk'
    'imperative': (vb) => {
      vb.prepend('do not');
      return vb
    },
    // walk -> does not walk
    'infinitive': (vb, parsed) => {
      if (hasCopula(vb) === true) {
        return isWas(vb)
      }
      return doesNot(vb)
    },

    'passive-past': (vb) => {
      // got walked -> did not get walked
      if (vb.has('got')) {
        vb.replace('got', 'get', keep);
        vb.prepend('did not');
        return vb
      }
      // was walked, were walked
      // was being walked
      // had been walked, have been eaten
      let m = vb.match('(was|were|had|have)');
      if (m.found) {
        m.append('not');
      }
      return vb
    },
    'auxiliary-past': (vb) => {
      // used to walk
      if (vb.has('used')) {
        vb.prepend('did not');
        return vb
      }
      // he did walk
      let m = vb.match('(did|does|do)');
      if (m.found) {
        m.append('not');
      }
      return vb
    },

    // wants to walk
    'want-infinitive': (vb, parsed) => {
      // does not 
      vb = doesNot(vb);
      // want
      vb = vb.replace('wants', 'want', keep);
      return vb
    },

  };

  const toNegative = function (vb, parsed, form) {
    // console.log(form)
    if (vb.has('#Negative')) {
      return vb
    }
    if (forms.hasOwnProperty(form)) {
      vb = forms[form](vb, parsed);
      return vb
    }

    // 'not be'
    let m = vb.matchOne('be');
    if (m.found) {
      m.prepend('not');
      return vb
    }
    // is/was not
    if (hasCopula(vb) === true) {
      return isWas(vb)
    }

    // 'would not'
    m = vb.matchOne('(will|had|have|has|did|does|do|#Modal)');
    if (m.found) {
      m.append('not');
      return vb
    }
    // do nothing i guess?
    return vb
  };
  var toNegative$1 = toNegative;

  // import debug from './debug.js'


  // return the nth elem of a doc
  const getNth = (doc, n) => (typeof n === 'number' ? doc.eq(n) : doc);

  const api = function (View) {
    class Verbs extends View {
      constructor(document, pointer, groups) {
        super(document, pointer, groups);
        this.viewType = 'Verbs';
      }
      parse(n) {
        return getNth(this, n).map(parseVerb$1)
      }
      json(opts, n) {
        let m = getNth(this, n);
        let arr = m.map(vb => {
          let json = vb.toView().json(opts)[0] || {};
          json.verb = toJSON$1(vb);
          return json
        }, []);
        return arr
      }
      subjects(n) {
        return getNth(this, n).map(vb => {
          parseVerb$1(vb);
          return getSubject$1(vb).subject
        })
      }
      adverbs(n) {
        return getNth(this, n).map(vb => vb.match('#Adverb'))
      }
      isSingular(n) {
        return getNth(this, n).filter(vb => {
          return getSubject$1(vb).plural !== true
        })
      }
      isPlural(n) {
        return getNth(this, n).filter(vb => {
          return getSubject$1(vb).plural === true
        })
      }
      isImperative(n) {
        return getNth(this, n).filter(vb => vb.has('#Imperative'))
      }
      toInfinitive(n) {
        return getNth(this, n).map(vb => {
          let parsed = parseVerb$1(vb);
          let info = getGrammar$1(vb, parsed);
          return toInfinitive$2(vb, parsed, info.form)
        })
      }
      toPresentTense(n) {
        return getNth(this, n).map(vb => {
          let parsed = parseVerb$1(vb);
          let info = getGrammar$1(vb, parsed);
          return toPresent$1(vb, parsed, info.form)
        })
      }
      toPastTense(n) {
        return getNth(this, n).map(vb => {
          let parsed = parseVerb$1(vb);
          let info = getGrammar$1(vb, parsed);
          return toPast$1(vb, parsed, info.form)
        })
      }
      toFutureTense(n) {
        return getNth(this, n).map(vb => {
          let parsed = parseVerb$1(vb);
          let info = getGrammar$1(vb, parsed);
          return toFuture$1(vb, parsed, info.form)
        })
      }
      toGerund(n) {
        return getNth(this, n).map(vb => {
          let parsed = parseVerb$1(vb);
          let info = getGrammar$1(vb, parsed);
          return toGerund$1(vb, parsed, info.form)
        })
      }
      conjugate(n) {
        return getNth(this, n).map(vb => {
          let parsed = parseVerb$1(vb);
          let info = getGrammar$1(vb, parsed);
          // allow imperatives like 'go!' to be conjugated here (only)
          if (info.form === 'imperative') {
            info.form = 'simple-present';
          }
          return {
            Infinitive: toInfinitive$2(vb.clone(), parsed, info.form).text('normal'),
            PastTense: toPast$1(vb.clone(), parsed, info.form).text('normal'),
            PresentTense: toPresent$1(vb.clone(), parsed, info.form).text('normal'),
            FutureTense: toFuture$1(vb.clone(), parsed, info.form).text('normal'),
          }
        }, [])
      }

      /** return only verbs with 'not'*/
      isNegative() {
        return this.if('#Negative')
      }
      /**  return only verbs without 'not'*/
      isPositive() {
        return this.ifNo('#Negative')
      }
      /** remove 'not' from these verbs */
      toPositive() {
        let m = this.match('do not #Verb');
        if (m.found) {
          m.remove('do not');
        }
        return this.remove('#Negative')
      }
      toNegative(n) {
        return getNth(this, n).map(vb => {
          let parsed = parseVerb$1(vb);
          let info = getGrammar$1(vb, parsed);
          return toNegative$1(vb, parsed, info.form)
        })
      }
      // overloaded - keep Verb class
      update(pointer) {
        let m = new Verbs(this.document, pointer);
        m._cache = this._cache; // share this full thing
        return m
      }
    }
    Verbs.prototype.toPast = Verbs.prototype.toPastTense;
    Verbs.prototype.toPresent = Verbs.prototype.toPresentTense;
    Verbs.prototype.toFuture = Verbs.prototype.toFutureTense;

    View.prototype.verbs = function (n) {
      let vb = find(this);
      vb = getNth(vb, n);
      return new Verbs(this.document, vb.pointer)
    };
  };
  var api$1 = api;

  var verbs = {
    api: api$1,
  };

  nlp$1.plugin(chunker); //
  nlp$1.plugin(misc); //
  nlp$1.plugin(normalize); //
  nlp$1.plugin(nouns); //
  nlp$1.plugin(numbers); //
  nlp$1.plugin(redact$1); //
  nlp$1.plugin(sentences); //
  nlp$1.plugin(topics); //
  nlp$1.plugin(verbs); //

  let world = nlp$1.world();
  const splitSentences = nlp$1.methods().one.tokenize.splitSentences;

  const fastSplit = function (str, numChunks = 1) {
    const size = Math.ceil(str.length / numChunks);
    const chunks = new Array(numChunks);
    for (let i = 0, o = 0; i < numChunks; ++i, o += size) {
      chunks[i] = str.substr(o, size);
    }
    return chunks
  };

  const pluckStarts = function (arr) {
    for (let i = 1; i < arr.length; i += 1) {
      let top = arr[i].substr(0, 200);
      let first = splitSentences(top, world)[0];
      // move the first (part) sentence onto the end of the last one
      let len = first.length;
      arr[i - 1] += first;
      arr[i] = arr[i].substring(len);
    }
    return arr
  };

  // split a text quickly, then repair splits by sentence
  const rip = function (txt, parts = 1) {
    let arr = fastSplit(txt, parts);
    arr = pluckStarts(arr);
    return arr
  };
  var rip$1 = rip;

  // let res = rip('one, two, three. four five six. seven eight nine', 4)
  // console.log(JSON.stringify(res, null, 2))

  const dir = path__default["default"].dirname(url.fileURLToPath((typeof document === 'undefined' && typeof location === 'undefined' ? new (require('u' + 'rl').URL)('file:' + __filename).href : typeof document === 'undefined' ? location.href : (document.currentScript && document.currentScript.src || new URL('compromise-speed.cjs', document.baseURI).href))));

  const makePool = function (count, reg) {
    let workers = [];
    for (let i = 0; i < count; i += 1) {
      let info = {
        workerData: {
          workerIndex: i,
          workerCount: count,
          reg
        }
      };
      const file = path__default["default"].join(dir, './worker.js');
      const worker = new worker_threads.Worker(file, info);
      worker.on('error', (err) => console.error(err));// eslint-disable-line
      workers.push(worker);
    }
    return workers
  };
  var makePool$1 = makePool;

  const cpuCount = os__default["default"].cpus().length;
  let workerCount = cpuCount;

  const workerPool$1 = function (txt, reg) {
    let nlp = this;
    if (typeof reg === 'string') {
      reg = nlp.parseMatch(reg);
    }

    let workers = makePool$1(workerCount, reg);
    let parts = rip$1(txt, workerCount);
    // console.log(parts.length)
    let results = [];
    let isRunning = workers.map(_ => true);// eslint-disable-line

    // workers.foreach
    workers.forEach((worker, i) => {
      worker.postMessage({ type: 'work', work: parts[i] || [] });
    });

    return new Promise((resolve) => {
      // setup listeners
      workers.forEach(worker => {
        worker.on('message', (msg) => {
          if (msg.type === 'match') {
            msg.match.forEach(m => {
              results.push(m);
            });
          }
          if (msg.type === 'drained') {
            let index = msg.status.workerIndex;
            isRunning[index] = false;
            // console.log(index, 'drained')
            if (isRunning.every(b => b === false)) {
              let doc = nlp('');
              doc.document = results;
              workers.forEach(w => w.terminate());
              // console.log('done!')
              resolve(doc);
            }
          }
        });
      });
    })
  };
  var workerPool$2 = workerPool$1;

  var workerPool = {
    lib: {
      workerPool: workerPool$2
    }
  };

  const getWords = function (net) {
    return Object.keys(net.hooks).filter(w => !w.startsWith('#') && !w.startsWith('%'))
  };

  const maybeMatch = function (doc, net) {
    // must have *atleast* one of these words
    let words = getWords(net);
    if (words.length === 0) {
      return doc
    }
    if (!doc._cache) {
      doc.cache();
    }
    let cache = doc._cache;
    // return sentences that have one of our needed words
    return doc.filter((_m, i) => {
      return words.some(str => cache[i].has(str))
    })
  };
  var maybeMatch$1 = maybeMatch;

  // tokenize first, then only tag sentences required
  const lazyParse$1 = function (input, reg) {
    let net = reg;
    if (typeof reg === 'string') {
      net = this.buildNet([{ match: reg }]);
    }
    let doc = this.tokenize(input);
    let m = maybeMatch$1(doc, net);
    if (m.found) {
      m.compute(['index', 'tagger']);
      return m.match(reg)
    }
    return doc.none()
  };
  var lazy = lazyParse$1;

  var lazyParse = {
    lib: {
      lazy
    }
  };

  // combine all the plugins
  const plugin = {
    lib: Object.assign({}, streamFile$1.lib, keyPress$1.lib, workerPool.lib, lazyParse.lib),
  };

  exports["default"] = plugin;
  exports.keyPress = keyPress$1;
  exports.lazyParse = lazyParse;
  exports.streamFile = streamFile$1;
  exports.workerPool = workerPool;

  Object.defineProperty(exports, '__esModule', { value: true });

}));

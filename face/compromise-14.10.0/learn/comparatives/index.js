import data from './data.js'

// incapable|less capable
// inflexible|less flexible
// insensitive|less sensitive
// unambitious|less ambitious
// unattractive|less attractive
// uncreative|less creative
// unfaithful|less faithful
// unfriendly|less friendly
// unhealthy|less healthy
// unhelpful|less helpful
// unimaginative|less imaginative
// unimportant|less important
// unpopular|less popular
// unrealistic|less realistic
// unreliable|less reliable
// unsuccessful|less successful
// unsympathetic|less sympathetic

Object.keys(data).forEach(k => {
  if (k === data[k]) {
    console.log(k, data[k])
  }
})
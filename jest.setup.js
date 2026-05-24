// Polyfill for Web API Request/Response/Headers in Jest (Node.js)
const fetchPkg = require('cross-fetch');
if (typeof global.fetch === 'undefined') {
  global.fetch = fetchPkg;
}
if (typeof global.Request === 'undefined') {
  global.Request = fetchPkg.Request;
}
if (typeof global.Response === 'undefined') {
  global.Response = fetchPkg.Response;
}
if (typeof global.Headers === 'undefined') {
  global.Headers = fetchPkg.Headers;
}

// Polyfill for TextEncoder/TextDecoder which are missing in JSDOM environments
const { TextEncoder, TextDecoder } = require('util');
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder;
}

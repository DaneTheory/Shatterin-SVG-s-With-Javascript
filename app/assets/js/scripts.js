/*!
 * shatterin-svgs-with-javascript
 * 
 * https://HosseinKarami.github.io/fastshell
 * @author Branden Dane
 * @version 1.0.5
 * Copyright 2018. MIT licensed.
 */
(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function(self) {
  'use strict';

  if (self.fetch) {
    return
  }

  var support = {
    searchParams: 'URLSearchParams' in self,
    iterable: 'Symbol' in self && 'iterator' in Symbol,
    blob: 'FileReader' in self && 'Blob' in self && (function() {
      try {
        new Blob()
        return true
      } catch(e) {
        return false
      }
    })(),
    formData: 'FormData' in self,
    arrayBuffer: 'ArrayBuffer' in self
  }

  if (support.arrayBuffer) {
    var viewClasses = [
      '[object Int8Array]',
      '[object Uint8Array]',
      '[object Uint8ClampedArray]',
      '[object Int16Array]',
      '[object Uint16Array]',
      '[object Int32Array]',
      '[object Uint32Array]',
      '[object Float32Array]',
      '[object Float64Array]'
    ]

    var isDataView = function(obj) {
      return obj && DataView.prototype.isPrototypeOf(obj)
    }

    var isArrayBufferView = ArrayBuffer.isView || function(obj) {
      return obj && viewClasses.indexOf(Object.prototype.toString.call(obj)) > -1
    }
  }

  function normalizeName(name) {
    if (typeof name !== 'string') {
      name = String(name)
    }
    if (/[^a-z0-9\-#$%&'*+.\^_`|~]/i.test(name)) {
      throw new TypeError('Invalid character in header field name')
    }
    return name.toLowerCase()
  }

  function normalizeValue(value) {
    if (typeof value !== 'string') {
      value = String(value)
    }
    return value
  }

  // Build a destructive iterator for the value list
  function iteratorFor(items) {
    var iterator = {
      next: function() {
        var value = items.shift()
        return {done: value === undefined, value: value}
      }
    }

    if (support.iterable) {
      iterator[Symbol.iterator] = function() {
        return iterator
      }
    }

    return iterator
  }

  function Headers(headers) {
    this.map = {}

    if (headers instanceof Headers) {
      headers.forEach(function(value, name) {
        this.append(name, value)
      }, this)
    } else if (Array.isArray(headers)) {
      headers.forEach(function(header) {
        this.append(header[0], header[1])
      }, this)
    } else if (headers) {
      Object.getOwnPropertyNames(headers).forEach(function(name) {
        this.append(name, headers[name])
      }, this)
    }
  }

  Headers.prototype.append = function(name, value) {
    name = normalizeName(name)
    value = normalizeValue(value)
    var oldValue = this.map[name]
    this.map[name] = oldValue ? oldValue+','+value : value
  }

  Headers.prototype['delete'] = function(name) {
    delete this.map[normalizeName(name)]
  }

  Headers.prototype.get = function(name) {
    name = normalizeName(name)
    return this.has(name) ? this.map[name] : null
  }

  Headers.prototype.has = function(name) {
    return this.map.hasOwnProperty(normalizeName(name))
  }

  Headers.prototype.set = function(name, value) {
    this.map[normalizeName(name)] = normalizeValue(value)
  }

  Headers.prototype.forEach = function(callback, thisArg) {
    for (var name in this.map) {
      if (this.map.hasOwnProperty(name)) {
        callback.call(thisArg, this.map[name], name, this)
      }
    }
  }

  Headers.prototype.keys = function() {
    var items = []
    this.forEach(function(value, name) { items.push(name) })
    return iteratorFor(items)
  }

  Headers.prototype.values = function() {
    var items = []
    this.forEach(function(value) { items.push(value) })
    return iteratorFor(items)
  }

  Headers.prototype.entries = function() {
    var items = []
    this.forEach(function(value, name) { items.push([name, value]) })
    return iteratorFor(items)
  }

  if (support.iterable) {
    Headers.prototype[Symbol.iterator] = Headers.prototype.entries
  }

  function consumed(body) {
    if (body.bodyUsed) {
      return Promise.reject(new TypeError('Already read'))
    }
    body.bodyUsed = true
  }

  function fileReaderReady(reader) {
    return new Promise(function(resolve, reject) {
      reader.onload = function() {
        resolve(reader.result)
      }
      reader.onerror = function() {
        reject(reader.error)
      }
    })
  }

  function readBlobAsArrayBuffer(blob) {
    var reader = new FileReader()
    var promise = fileReaderReady(reader)
    reader.readAsArrayBuffer(blob)
    return promise
  }

  function readBlobAsText(blob) {
    var reader = new FileReader()
    var promise = fileReaderReady(reader)
    reader.readAsText(blob)
    return promise
  }

  function readArrayBufferAsText(buf) {
    var view = new Uint8Array(buf)
    var chars = new Array(view.length)

    for (var i = 0; i < view.length; i++) {
      chars[i] = String.fromCharCode(view[i])
    }
    return chars.join('')
  }

  function bufferClone(buf) {
    if (buf.slice) {
      return buf.slice(0)
    } else {
      var view = new Uint8Array(buf.byteLength)
      view.set(new Uint8Array(buf))
      return view.buffer
    }
  }

  function Body() {
    this.bodyUsed = false

    this._initBody = function(body) {
      this._bodyInit = body
      if (!body) {
        this._bodyText = ''
      } else if (typeof body === 'string') {
        this._bodyText = body
      } else if (support.blob && Blob.prototype.isPrototypeOf(body)) {
        this._bodyBlob = body
      } else if (support.formData && FormData.prototype.isPrototypeOf(body)) {
        this._bodyFormData = body
      } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
        this._bodyText = body.toString()
      } else if (support.arrayBuffer && support.blob && isDataView(body)) {
        this._bodyArrayBuffer = bufferClone(body.buffer)
        // IE 10-11 can't handle a DataView body.
        this._bodyInit = new Blob([this._bodyArrayBuffer])
      } else if (support.arrayBuffer && (ArrayBuffer.prototype.isPrototypeOf(body) || isArrayBufferView(body))) {
        this._bodyArrayBuffer = bufferClone(body)
      } else {
        throw new Error('unsupported BodyInit type')
      }

      if (!this.headers.get('content-type')) {
        if (typeof body === 'string') {
          this.headers.set('content-type', 'text/plain;charset=UTF-8')
        } else if (this._bodyBlob && this._bodyBlob.type) {
          this.headers.set('content-type', this._bodyBlob.type)
        } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
          this.headers.set('content-type', 'application/x-www-form-urlencoded;charset=UTF-8')
        }
      }
    }

    if (support.blob) {
      this.blob = function() {
        var rejected = consumed(this)
        if (rejected) {
          return rejected
        }

        if (this._bodyBlob) {
          return Promise.resolve(this._bodyBlob)
        } else if (this._bodyArrayBuffer) {
          return Promise.resolve(new Blob([this._bodyArrayBuffer]))
        } else if (this._bodyFormData) {
          throw new Error('could not read FormData body as blob')
        } else {
          return Promise.resolve(new Blob([this._bodyText]))
        }
      }

      this.arrayBuffer = function() {
        if (this._bodyArrayBuffer) {
          return consumed(this) || Promise.resolve(this._bodyArrayBuffer)
        } else {
          return this.blob().then(readBlobAsArrayBuffer)
        }
      }
    }

    this.text = function() {
      var rejected = consumed(this)
      if (rejected) {
        return rejected
      }

      if (this._bodyBlob) {
        return readBlobAsText(this._bodyBlob)
      } else if (this._bodyArrayBuffer) {
        return Promise.resolve(readArrayBufferAsText(this._bodyArrayBuffer))
      } else if (this._bodyFormData) {
        throw new Error('could not read FormData body as text')
      } else {
        return Promise.resolve(this._bodyText)
      }
    }

    if (support.formData) {
      this.formData = function() {
        return this.text().then(decode)
      }
    }

    this.json = function() {
      return this.text().then(JSON.parse)
    }

    return this
  }

  // HTTP methods whose capitalization should be normalized
  var methods = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT']

  function normalizeMethod(method) {
    var upcased = method.toUpperCase()
    return (methods.indexOf(upcased) > -1) ? upcased : method
  }

  function Request(input, options) {
    options = options || {}
    var body = options.body

    if (input instanceof Request) {
      if (input.bodyUsed) {
        throw new TypeError('Already read')
      }
      this.url = input.url
      this.credentials = input.credentials
      if (!options.headers) {
        this.headers = new Headers(input.headers)
      }
      this.method = input.method
      this.mode = input.mode
      if (!body && input._bodyInit != null) {
        body = input._bodyInit
        input.bodyUsed = true
      }
    } else {
      this.url = String(input)
    }

    this.credentials = options.credentials || this.credentials || 'omit'
    if (options.headers || !this.headers) {
      this.headers = new Headers(options.headers)
    }
    this.method = normalizeMethod(options.method || this.method || 'GET')
    this.mode = options.mode || this.mode || null
    this.referrer = null

    if ((this.method === 'GET' || this.method === 'HEAD') && body) {
      throw new TypeError('Body not allowed for GET or HEAD requests')
    }
    this._initBody(body)
  }

  Request.prototype.clone = function() {
    return new Request(this, { body: this._bodyInit })
  }

  function decode(body) {
    var form = new FormData()
    body.trim().split('&').forEach(function(bytes) {
      if (bytes) {
        var split = bytes.split('=')
        var name = split.shift().replace(/\+/g, ' ')
        var value = split.join('=').replace(/\+/g, ' ')
        form.append(decodeURIComponent(name), decodeURIComponent(value))
      }
    })
    return form
  }

  function parseHeaders(rawHeaders) {
    var headers = new Headers()
    rawHeaders.split(/\r?\n/).forEach(function(line) {
      var parts = line.split(':')
      var key = parts.shift().trim()
      if (key) {
        var value = parts.join(':').trim()
        headers.append(key, value)
      }
    })
    return headers
  }

  Body.call(Request.prototype)

  function Response(bodyInit, options) {
    if (!options) {
      options = {}
    }

    this.type = 'default'
    this.status = 'status' in options ? options.status : 200
    this.ok = this.status >= 200 && this.status < 300
    this.statusText = 'statusText' in options ? options.statusText : 'OK'
    this.headers = new Headers(options.headers)
    this.url = options.url || ''
    this._initBody(bodyInit)
  }

  Body.call(Response.prototype)

  Response.prototype.clone = function() {
    return new Response(this._bodyInit, {
      status: this.status,
      statusText: this.statusText,
      headers: new Headers(this.headers),
      url: this.url
    })
  }

  Response.error = function() {
    var response = new Response(null, {status: 0, statusText: ''})
    response.type = 'error'
    return response
  }

  var redirectStatuses = [301, 302, 303, 307, 308]

  Response.redirect = function(url, status) {
    if (redirectStatuses.indexOf(status) === -1) {
      throw new RangeError('Invalid status code')
    }

    return new Response(null, {status: status, headers: {location: url}})
  }

  self.Headers = Headers
  self.Request = Request
  self.Response = Response

  self.fetch = function(input, init) {
    return new Promise(function(resolve, reject) {
      var request = new Request(input, init)
      var xhr = new XMLHttpRequest()

      xhr.onload = function() {
        var options = {
          status: xhr.status,
          statusText: xhr.statusText,
          headers: parseHeaders(xhr.getAllResponseHeaders() || '')
        }
        options.url = 'responseURL' in xhr ? xhr.responseURL : options.headers.get('X-Request-URL')
        var body = 'response' in xhr ? xhr.response : xhr.responseText
        resolve(new Response(body, options))
      }

      xhr.onerror = function() {
        reject(new TypeError('Network request failed'))
      }

      xhr.ontimeout = function() {
        reject(new TypeError('Network request failed'))
      }

      xhr.open(request.method, request.url, true)

      if (request.credentials === 'include') {
        xhr.withCredentials = true
      }

      if ('responseType' in xhr && support.blob) {
        xhr.responseType = 'blob'
      }

      request.headers.forEach(function(value, name) {
        xhr.setRequestHeader(name, value)
      })

      xhr.send(typeof request._bodyInit === 'undefined' ? null : request._bodyInit)
    })
  }
  self.fetch.polyfill = true
})(typeof self !== 'undefined' ? self : this);

},{}],2:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

require('whatwg-fetch');

var AuthVerification = function AuthVerification() {
  var sumbitBttn = document.querySelector('#verificationSumbitButton');
  var authInputEl = document.querySelector('#inputAuth');
  var authEndpoint = '/Prod/login';

  var successEl = document.querySelector('.done');
  var failEl = document.querySelector('.failed');

  var isLoading = void 0;

  var beginFetch = function beginFetch() {
    sumbitBttn.classList.remove('verificationSumbitButton');
    sumbitBttn.classList.add('spinner');
    return reqApi();
  };

  var endFetch = function endFetch() {
    sumbitBttn.classList.remove('spinner');
    return reqApi();
  };

  var reqApi = async function reqApi(resStatus) {
    var mockReq = await setTimeout(function () {
      resStatus = true;
      return resStatus ? onSuccess() : onFailure();
    }, 5000);
    return mockReq;
  };

  var onSuccess = async function onSuccess() {
    var mockSuccess = async function mockSuccess() {
      sumbitBttn.classList.add('hide-loading');
      sumbitBttn.classList.remove('spinner');
      return document.getElementById('login_success').style.visibility = 'visible';
    };
    return await mockSuccess().then(function () {
      return resetSubmitState();
    }).catch(function (e) {
      var err = new Error(e);
      console.log(e);
      return err;
    });
  };

  var onFailure = async function onFailure() {
    var mockFailure = async function mockFailure() {
      sumbitBttn.classList.add('hide-loading');
      sumbitBttn.classList.remove('spinner');
      return document.getElementById('login_fail').style.visibility = 'visible';
    };
    return await mockFailure().then(function () {
      return resetSubmitState();
    }).catch(function (e) {
      var err = new Error(e);
      console.log(e);
      return err;
    });
  };

  var resetSubmitState = async function resetSubmitState() {
    var reset = await setTimeout(function () {
      sumbitBttn.classList.remove('hide-loading');
      document.getElementById('login_success').style.visibility = 'hidden';
      document.getElementById('login_fail').style.visibility = 'hidden';
      sumbitBttn.classList.add('verificationSumbitButton');
    }, 2500);
    return reset;
  };

  var validateEmailHandler = function validateEmailHandler(emailAddress) {
    return (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(emailAddress) ? true : false
    );
  };

  var loginWithEmailAddress = async function loginWithEmailAddress(emailVal) {
    try {
      var login = await fetch(authEndpoint, {
        credentials: 'include',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: emailVal
        })
      });
      return login;
    } catch (e) {
      var err = new Error(e);
      console.log(err);
      return err;
    }
  };

  var submitUserInput = function submitUserInput() {
    var authSuccessRes = 'Authentication successful';

    isLoading = false;
    var isInValidEmailInputMessage = 'The email address provided is not a valid email format';
    var isInValidEmailMessage = 'The email address provided is not authorized for access';

    return Promise.resolve(isLoading).then(function () {
      return validateEmailHandler(authInputEl.value);
    }).then(function (isVaildFormatCheck) {
      return isVaildFormatCheck ? function () {
        document.querySelector('#verification_message').textContent = '';
        return true;
      }() : function () {
        document.querySelector('#verification_message').textContent = isInValidEmailInputMessage;
        return false;
      }();
    }).then(function (inputVal) {
      return inputVal ? loginWithEmailAddress(authInputEl.value) : null;
    }).then(function (res) {
      // console.log(res.json())
      return res.json();
    }).then(function (data) {
      // console.log(data)
      // console.log(data.message)
      return data.message === authSuccessRes ? true : false;
    }).then(function (res) {
      // console.log(res)
      // console.log(window.location.pathname)
      return res ? window.location.replace(window.location.pathname = '/') : null;
    })
    // .then(inputVal => inputVal ? beginFetch(isLoading) : endFetch(isLoading))
    .catch(function (e) {
      var err = new Error(e);
      console.log(e);
      return err;
    });
  };

  sumbitBttn.addEventListener('click', submitUserInput, false);
};

exports.default = AuthVerification;

},{"whatwg-fetch":1}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var TMaxConfig = exports.TMaxConfig = {
  logoPathsArray: Array.from(document.querySelectorAll('#logo *:not(.logo_icon)')),
  animationOptions: {
    onStart: function onStart() {
      return console.log('');
    },
    onComplete: function onComplete() {
      return console.log('');
    },
    onCompleteAll: function onCompleteAll() {
      return console.log('');
    },
    immediateRender: true,
    lazy: true,
    repeat: 0,
    repeatDelay: 0,
    yoyo: false,
    timeScaleVal: 0.45
  },
  staggerOptions: {
    duration: 1,
    val: 0.01111115,
    result: {
      x: 0,
      y: 0,
      opacity: 1,
      scale: 1,
      rotation: 0
    }
  }
};

},{}],4:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TlMax = undefined;

var _Configs = require('./Configs');

var TlMax = exports.TlMax = function () {
  var tlMax = new TimelineMax(_Configs.TMaxConfig.animationOptions);
  CSSPlugin.useSVGTransformAttr = true;
  tlMax.data = {
    someData: 'hello'
  };
  tlMax.smoothChildTiming = true;
  tlMax.timeScale(_Configs.TMaxConfig.animationOptions.timeScaleVal);
  return tlMax;
}();

},{"./Configs":3}],5:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _Globals = require('./Globals');

var _Configs = require('./Configs');

var _Utils = require('./Utils');

var LogoAnimation = function LogoAnimation() {
  return Promise.resolve().then(function () {
    var cssToAnimate = function cssToAnimate(svgPath) {
      return _Globals.TlMax.set(svgPath, {
        x: (0, _Utils.Randomize)(-3000, 1500),
        y: (0, _Utils.Randomize)(-1000, 2500),
        rotation: (0, _Utils.Randomize)(-520, 520),
        scale: (0, _Utils.Randomize)(0, 15),
        opacity: (0, _Utils.Randomize)(-5, -1)
      });
    };
    return _Configs.TMaxConfig.logoPathsArray.map(function (path) {
      return cssToAnimate(path);
    });
  }).then(function () {
    return _Globals.TlMax.staggerTo(_Configs.TMaxConfig.logoPathsArray, _Configs.TMaxConfig.staggerOptions.duration, _Configs.TMaxConfig.staggerOptions.result, _Configs.TMaxConfig.staggerOptions.val);
  }).catch(function (e) {
    var errObj = new Error(e);
    console.log(errObj);
    return errObj;
  });
};

exports.default = LogoAnimation;

},{"./Configs":3,"./Globals":4,"./Utils":6}],6:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var Randomize = exports.Randomize = function Randomize(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

var Extend = exports.Extend = function Extend(a, b) {
  for (var key in b) {
    if (b.hasOwnProperty(key)) {
      a[key] = b[key];
    }
  }
  return a;
};

var CreateDOMEl = exports.CreateDOMEl = function CreateDOMEl(type, className, content) {
  var el = document.createElement(type);
  el.className = className || '';
  el.innerHTML = content || '';
  return el;
};

},{}],7:[function(require,module,exports){
'use strict';

var _LogoAnimation = require('./LogoAnimation');

var _LogoAnimation2 = _interopRequireDefault(_LogoAnimation);

var _AuthVerification = require('./AuthVerification');

var _AuthVerification2 = _interopRequireDefault(_AuthVerification);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(function (window, document, undefined) {

  // SVG Logo Animation
  (0, _LogoAnimation2.default)();

  // Verify Auth Access
  (0, _AuthVerification2.default)();
})(window, document);

},{"./AuthVerification":2,"./LogoAnimation":5}]},{},[7])

//# sourceMappingURL=scripts.js.map

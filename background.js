const apiUrl = 'https://client-s.gateway.messenger.live.com/v1/users/ME/endpoints/SELF/subscriptions/0/poll'
const localUrl = 'http://127.0.0.1:12345/'
const interval = 1000

const pipeMessage = throttle((token) => {
  fetch(apiUrl, {
    method: 'post',
    headers: {
      [token.name]: token.value,
    }
  })
  .then(r => r.json())
  .then(data => {
    if (!Object.keys(data).length) { return }

    console.log(data)

    fetch(localUrl, {
      method: 'post',
      body: JSON.stringify(data),
    })

    return data
  })
}, interval)

function throttle (func, wait, options) {
  var context, args, result
  var timeout = null
  var previous = 0
  options = options || {}
  var later = function() {
    previous = options.leading === false ? 0 : Date.now()
    timeout = null
    result = func.apply(context, args)
    context = args = null
  }
  return function() {
    var now = Date.now()
    if (!previous && options.leading === false) {
      previous = now
    }
    var remaining = wait - (now - previous)
    context = this
    args = arguments
    if (remaining <= 0) {
      clearTimeout(timeout)
      timeout = null
      previous = now
      result = func.apply(context, args)
      context = args = null
    } else if (!timeout && options.trailing !== false) {
      timeout = setTimeout(later, remaining)
    }
    return result
  }
}


chrome.webRequest.onBeforeSendHeaders.addListener(
  function(info) {
    if (!info.requestHeaders) { return }
    if (info.tabId < 0) { return } // Sent by me.

    const tokenField = {}

    const isMsgReq = info.requestHeaders.some((field, index) => {
      if (field.name.toLowerCase() === 'registrationtoken') {
        Object.assign(tokenField, field) // Get the token.
        field.value = ':(' // Break the request
        return true
      }
    })

    if (!isMsgReq) { return }

    pipeMessage(tokenField)
    return {requestHeaders: info.requestHeaders}
  },
  //filter
  {
    urls: [apiUrl],
  },
  // feature flag
  ['requestHeaders', 'blocking']
)

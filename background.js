const apiUrl = 'https://client-s.gateway.messenger.live.com/v1/users/ME/endpoints/SELF/subscriptions/0/poll'
const localUrl = 'http://localhost:12345/'
const interval = 5000

const pipeMessage = function (token) {
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

    return fetch(localUrl, {
      method: 'post',
      body: JSON.stringify(data),
    })
  })
  .then(r => r.json())
  .then(res => {
    if (!res) {
      console.info('Nothing returned.')
      return
    }

    res.payload.clientmessageid = Date.now() + ''

    fetch(res.url, {
      method: 'post',
      headers: { [token.name]: token.value },
      body: JSON.stringify(res.payload)
    })
  }, err => console.error.bind(console))
}

const tokenField = {}
chrome.webRequest.onBeforeSendHeaders.addListener(
  function(info) {
    if (!info.requestHeaders) { return }
    if (info.tabId < 0) { return } // Sent by me.

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

setTimeout(function poll() {
  if (Object.keys(tokenField).length) {
    pipeMessage(tokenField)
  } else {
    console.info('Skype online isnt connected')
  }

  setTimeout(poll, interval)
}, interval)

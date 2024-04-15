const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiYmFraW5fdGVzdCIsImFkbWluIjpmYWxzZSwiY29tcGFueSI6IiIsInN1cHBsaWVyX2lkIjowLCJleHAiOjE3MTMyMjU3MjV9.syl5CU8a4sps5R63UvqQaVlPQZHkCGWkypBETgAHsCo'

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.command === 'checkEnable') {
    // check('https://static.tildacdn.com/tild3039-6432-4739-b839-313265366638/d2d4e200-dc87-4d6c-a.svg')
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      chrome.tabs.sendMessage(tabs[0].id, 200);
    })
  }

  if (message.command === 'getSearchRequest') {
    let searchResults = []
    let cnt = 0
    getSearchRequestFromWb(message.query).then(response => {
      let data = response?.data?.products;
      if (data) {
        for (let i = 0; i < data.length; i++) {
          searchResults.push({
            id: data[i].id,
            name: data[i].name,
            brand: data[i].brand,
            cpm: data[i]?.log?.cpm
          })
        }
      }
      chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        if (tabs.length > 0) {
          chrome.tabs.sendMessage(tabs[0].id, { msg: 'getSearchResults', searchResults: searchResults })
        } else {
          console.log('не найдены активные вкладки');
        }
      })
    })

    getSearchRequestFromQuery(message.query?.searchText).then(response => {
      cnt = getLastItem(response?.data[0]?.stats)?.cnt;
      chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        if (tabs.length > 0) {
          chrome.tabs.sendMessage(tabs[0].id, { msg: 'getCnt', cnt: cnt })
        } else {
          console.log('не найдены активные вкладки');
        }
      })
    });

    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      if (tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, { msg: 'getSearchResults', searchResults: searchResults })
      } else {
        console.log('не найдены активные вкладки');
      }
    })
  }
});




async function getSearchRequestFromWb(query) {
  console.log(query);
  var data;
  await fetch(`https://search.wb.ru/exactmatch/ru/common/v5/search?ab_testing=false&appType=1&curr=rub&dest=-1257484&query=${query?.searchText}&resultset=catalog&sort=popular&spp=30&suppressSpellcheck=false${query?.page ? `&page=${query?.page}` : ''}`,
    {
      method: 'GET',
    }).then(response => response.ok ? response.text() : null)
    .then(response => {
      data = response ? JSON.parse(response) : null;
    })
  return data;
}

async function getSearchRequestFromQuery(query) {
  var data;
  const requestBody = JSON.stringify([query]);
  await fetch(`https://report.wild-expert.ru/api/v1/mpstat_counts`,
    {
      method: 'POST',
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json" // Указываем тип контента как JSON
      },
      body: requestBody
    })
    .then(response => response.ok ? response.text() : null)
    .then(response => {
      data = response ? JSON.parse(response) : null;
    });
  return data;
}


async function check(url) {
  await fetch(url).then((response) => {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      chrome.tabs.sendMessage(tabs[0].id, response.status);
    })
  })
}

function getLastItem(obj) {//последний элемент в словаре
  const keys = Object.keys(obj);
  const lastKey = keys[keys.length - 1];
  return obj[lastKey];
}
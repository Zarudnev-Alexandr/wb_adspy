// const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiYmFraW5fdGVzdCIsImFkbWluIjpmYWxzZSwiY29tcGFueSI6IiIsInN1cHBsaWVyX2lkIjowLCJleHAiOjE3MTMzODU0ODB9.4r-aNwwWxheRTVQ5E3OvCaWPAzWBjDWFlD4cgx5Y6-A'

chrome.runtime.onMessage.addListener(async function (message, sender, sendResponse) {
  if (message.command === 'checkEnable') {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      chrome.tabs.sendMessage(tabs[0].id, 200);
    })
  }

  if (message.command === 'getSearchRequest') {
    let searchResults = [];
    let cnt = 0;

    // Ожидаем получения данных и присваиваем их переменным searchResults и cnt
    try {
      searchResults = await getSearchRequestFromWb(message.query);
      cnt = await getSearchRequestFromQuery(message.query?.searchText);
    } catch (error) {
      console.error('Ошибка при получении данных:', error);
      return;
    }

    // Отправляем данные на содержимые страницы
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      if (tabs.length > 0) {
        if (cnt !== 0 && searchResults.length !== 0) {
          chrome.tabs.sendMessage(tabs[0].id, { msg: 'allGoodCards', cnt: cnt, searchResults: searchResults });
        }
      } else {
        console.log('Не найдены активные вкладки');
      }
    });
  }
});


async function getSearchRequestFromWb(query) {
  console.log(query);
  let data;
  let searchResults = [];
  await fetch(`https://search.wb.ru/exactmatch/ru/common/v5/search?ab_testing=false&appType=1&curr=rub&dest=-1257484&query=${encodeURIComponent(query?.searchText)}&resultset=catalog&sort=popular&spp=30&suppressSpellcheck=false${query?.page ? `&page=${query?.page}` : ''}`,
    {
      method: 'GET',
    }).then(response => response.ok ? response.text() : null)
    .then(response => {
      let fetchData = response ? JSON.parse(response) : null;
      data = fetchData?.data?.products;
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

    })
  return searchResults;
}



async function getSearchRequestFromQuery(query) {
  const token = await getToken(); // Получаем токен из локального хранилища
  if (!token) return; // Если токен не найден, выходим из функции


  var data;
  let cnt;
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
      cnt = getLastItem(data?.data[0]?.stats)?.cnt
    });
  return cnt;
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

async function getToken() {
  try {
    const token = await new Promise((resolve, reject) => {
      chrome.storage.local.get('token', (result) => {
        const token = result.token;
        if (token) {
          resolve(token);
        } else {
          reject(new Error('Token not found'));
        }
      });
    });
    return token;
  } catch (error) {
    console.error('Ошибка при получении токена из хранилища:', error);
    return null;
  }
}

// async function getSearchRequestFromWb(query) {
//   let data;
//   let searchResults = [];

//   const fetchWithCustomUserAgent = async (url, options) => {
//     const userAgents = [
//       'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.99 Safari/537.36',
//       'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:97.0) Gecko/20100101 Firefox/97.0',
//       // Другие User-Agent'ы,
//     ];

//     let response;
//     for (const userAgent of userAgents) {
//       const requestOptions = { ...options };
//       if (!requestOptions.headers) {
//         requestOptions.headers = {};
//       }
//       requestOptions.headers['User-Agent'] = userAgent;

//       // Отправка запроса
//       response = await fetch(url, requestOptions);

//       // Проверка успешности запроса и наличия данных
//       if (response.ok) {
//         const responseData = await response.clone().json();
//         if (responseData && responseData.data && responseData.data.products.length !== 1) {
//           break;
//         }
//       }
//     }
//     return response;
//   };

//   const response = await fetchWithCustomUserAgent(`https://search.wb.ru/exactmatch/ru/common/v5/search?ab_testing=false&appType=1&curr=rub&dest=-1257484&query=${encodeURIComponent(query?.searchText)}&resultset=catalog&sort=popular&spp=30&suppressSpellcheck=false${query?.page ? `&page=${query?.page}` : ''}`, { method: 'GET' });

//   if (response.ok) {
//     const responseData = await response.json();
//     data = responseData?.data?.products;
//   }

//   if (data) {
//     for (let i = 0; i < data.length; i++) {
//       searchResults.push({
//         id: data[i].id,
//         name: data[i].name,
//         brand: data[i].brand,
//         cpm: data[i]?.log?.cpm
//       });
//     }
//   }

//   return searchResults;
// }
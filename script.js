function reloadPageOnNavigation() {
  console.log('Обновляем страницу');
  // location.reload();
}

window.addEventListener('beforeunload', reloadPageOnNavigation);

// Дополнительный код, если необходимо
let searchText = {};
let currentUrl = location.href;

const checkPageTransition = () => {
  requestAnimationFrame(() => {
    if (currentUrl !== window.location.href) {
      chrome.runtime.sendMessage({ command: 'checkEnable' }, (response) => { });
      clearData();
    }
    currentUrl = window.location.href;
  }, true);
};

document.body.addEventListener('click', checkPageTransition);
document.body.addEventListener('keyup', (e) => {
  if (e.code === 'Enter' || e.code === 'Space') checkPageTransition();
});

document.addEventListener('DOMContentLoaded', chrome.runtime.sendMessage({ command: 'checkEnable' }));

function getSearchQuery() {
  currentUrl = window.location.href;
  if (currentUrl.includes('search=')) {
    chrome.runtime.sendMessage({ command: 'getSearchRequest', query: getQueryFromSearch() }, (response) => { })
  }
}



let cnt = 0;
let searchResults = [];

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.msg) {
    switch (request.msg) {
      case 'allGoodCards':
        console.log(request);
        searchResults = request.searchResults;
        cnt = request.cnt;
        fillQueryCards()
      default:
        break;
    }

    
  } else if (request === 200) {
    getSearchQuery();
  }
});


//======================
//функции заполнения====
//======================


function fillQueryCards(wheel) {
  if (searchResults.length !== 0 && cnt !== 0) {
    waitForElm('.product-card-list').then(elm => {
      var cards = [...document.getElementsByClassName('product-card__link j-card-link')];
      // if (wheel && cards.length > 15) {
      //   cards = cards.slice(-15);
      // }
      if (searchResults.length !== 0) {
        searchResults.forEach(item => {
          let foundCard = cards.find(card => {
            if ((card.attributes[2].value.includes(`/${item.id}/`)) && (card.classList.contains('wb__adspy--active') === false)) {
              card.classList.add('wb__adspy--active')
              return true
            }
          });

          if (foundCard && item.cpm) {
            let parentElement = foundCard.parentNode;
            let childElement = parentElement.querySelector('.product-card__middle-wrap');
            if (childElement) {
              let childElement1 = childElement.querySelector('.product-card__brand-wrap');
              if (childElement1) {
                childElement1.insertAdjacentHTML('beforeend', `
                  <p>
                    <b>Реклама в мес: ${Math.floor(cnt / 1000 * item.cpm).toLocaleString('ru-RU')} ₽</b>
                  </p>
                `)
              }
            }
          }
        });
      }
    });
  }
}


function getQueryFromSearch() {
  // Находим индекс начала параметра "page"
  let pageBegin = currentUrl.indexOf('?page=');
  if (pageBegin === -1) {
    // Если параметр "page" не найден, проверяем наличие параметра "search" сразу после символа "?"
    let searchTextBegin = currentUrl.indexOf('?search=');
    if (searchTextBegin !== -1) {
      // Если параметр "search" найден, получаем поисковую строку
      let searchTextEnd = currentUrl.indexOf('&', searchTextBegin + 1);
      if (searchTextEnd === -1) {
        searchTextEnd = currentUrl.length;
      }
      let searchText = currentUrl.slice(searchTextBegin + 8, searchTextEnd);
      searchText = searchText.replaceAll('+', '%20');
      searchText = decodeURI(searchText);
      return { searchText: searchText };
    } else {
      // Если ни параметр "page", ни параметр "search" не найдены, возвращаем пустую строку
      return { searchText: '' };
    }
  }

  // Если параметр "page" найден, то находим индекс начала параметра "search"
  let searchTextBegin = currentUrl.indexOf('&search=', pageBegin);
  if (searchTextBegin === -1) {
    return { searchText: '' }; // Если параметр "search" не найден, возвращаем пустую строку
  }

  // Находим конец поискового запроса
  let searchTextEnd = currentUrl.indexOf('&', searchTextBegin + 1);
  if (searchTextEnd === -1) {
    searchTextEnd = currentUrl.length; // Если символ "&" не найден, конец поискового запроса - конец строки
  }

  // Получаем поисковую строку
  let searchText = currentUrl.slice(searchTextBegin + 8, searchTextEnd);
  searchText = searchText.replaceAll('+', '%20');
  searchText = decodeURI(searchText);

  // Получаем номер страницы
  let pageEnd = currentUrl.indexOf('&', pageBegin + 1);
  let page = parseInt(currentUrl.slice(pageBegin + 6, pageEnd !== -1 ? pageEnd : undefined));

  return { searchText: searchText, page: page };
}

function waitForElm(selector) {//Важнейшая функция, описание выше
  return new Promise((resolve) => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector));
    }
    const observer = new MutationObserver((mutations) => {
      if (document.querySelector(selector)) {
        resolve(document.querySelector(selector));
        observer.disconnect();
      }
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  });
}

document.body.addEventListener('wheel', (event) => {
  event.wheelDeltaY < 0 ? fillQueryCards(true) : 
    event.wheelDeltaY > 0 ? fillQueryCards(true) : null;
})


function clearData() {
  const currentUrl = window.location.href;

  
    cnt = 0;
    searchResults = [];
  
  console.log('clearData', searchResults, cnt);
}
document.addEventListener('DOMContentLoaded', function () {
  const tokenInput = document.getElementById('token-input'); 
  const saveButton = document.getElementById('save-button'); 

  // Обработчик для кнопки сохранения
  saveButton.addEventListener('click', function () {
    const token = tokenInput.value.trim();
    chrome.storage.local.set({ 'token': token }, function () {
      console.log('Token saved:', token); 
      location.reload()
    });
  });

  // При загрузке попапа, попытаться получить сохранённый токен и отобразить его в поле ввода
  chrome.storage.local.get('token', function (result) {
    const savedToken = result.token;
    if (savedToken) {
      tokenInput.value = savedToken;
    }
  });
});
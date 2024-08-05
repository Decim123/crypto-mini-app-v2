document.addEventListener('DOMContentLoaded', function () {
    const tg = window.Telegram.WebApp;
    const tg_id = tg.initDataUnsafe.user.id;

    // Инициализация TON Connect UI
    const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
        manifestUrl: 'https://yourdomain.com/tonconnect-manifest.json', // Обязательно укажите путь к вашему манифесту
        buttonRootId: 'wallet-container'  // ID элемента, куда будет добавлена кнопка подключения
    });

    // Функция для обработки изменения статуса подключения
    const unsubscribe = tonConnectUI.onStatusChange((wallet) => {
        if (wallet) {
            // Кошелек подключен
            console.log('Connected to wallet:', wallet);

            // Обновляем интерфейс с данными кошелька
            const walletAddress = wallet.account.address;
            displayWalletAddress(walletAddress);

            // Отправляем данные на сервер
            fetch('/wallet', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    tg_id: tg_id,
                    account: { address: walletAddress }
                }),
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    console.log('Wallet address saved successfully.');
                }
            });
        } else {
            // Кошелек отключен
            console.log('Wallet disconnected.');
        }
    });

    function displayWalletAddress(walletAddress) {
        const walletContainer = document.getElementById('wallet-container');
        walletContainer.innerHTML = `<div class="wallet-display">${walletAddress.slice(0, 3)}...${walletAddress.slice(-3)}</div>`;
    }

    // Подписка на изменение состояния модального окна (опционально)
    const modalUnsubscribe = tonConnectUI.onModalStateChange((state) => {
        console.log('Modal state changed:', state);
    });

    // Открытие модального окна вручную, если необходимо
    // await tonConnectUI.openModal();

    // Остальной код для работы с пользовательским интерфейсом

    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const targetPage = item.getAttribute('data-target');
            if (targetPage === '/main') {
                // Do nothing if the target page is '/main'
                return;
            }
            if (targetPage === '/leaderboard' || targetPage === '/friends' || targetPage === '/tasks') {
                window.location.href = `${targetPage}?tg_id=${tg_id}`;
            } else {
                window.location.href = `${targetPage}`;
            }
        });
    });

    fetch(`/user_data?tg_id=${tg_id}`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                window.location.href = `/start`;
            } else {
                document.querySelector('.coin-amount').textContent = data.coins.toLocaleString();

                const walletContainer = document.getElementById('wallet-container');
                walletContainer.innerHTML = '';

                if (data.wallet) {
                    const walletDisplay = document.createElement('div');
                    walletDisplay.className = 'wallet-display';
                    walletDisplay.textContent = `${data.wallet.slice(0, 3)}...${data.wallet.slice(-3)}`;
                    walletContainer.appendChild(walletDisplay);
                } else {
                    // Кнопка подключения TON Connect UI будет добавлена через SDK
                }

                const languageDropdown = document.getElementById('language-dropdown');
                if (data.lang) {
                    languageDropdown.value = data.lang;
                }
                languageDropdown.addEventListener('change', () => {
                    const selectedLanguage = languageDropdown.value;
                    fetch('/update_language', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            tg_id: tg_id,
                            lang: selectedLanguage
                        }),
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.status === 'success') {
                            console.log('Language updated successfully');
                            window.location.reload(); // Перезагрузка страницы после успешного обновления языка
                        }
                    });
                });
            }
        });

    fetch('/get_news')
        .then(response => response.json())
        .then(newsData => {
            const slidesContainer = document.querySelector('.news-slide');
            const dotsContainer = document.querySelector('.slider-dots');

            let currentIndex = 0;

            newsData.forEach((news, index) => {
                const slide = document.createElement('div');
                slide.className = 'news-item';
                slide.innerHTML = `<p>${news.text}</p>`;
                
                const buttonText = news.link && news.link !== 'No Link' ? 'Open' : ':)';
                const buttonClass = news.link && news.link !== 'No Link' ? 'news-button' : 'news-button disabled';

                slide.innerHTML += `<button class="${buttonClass}" ${news.link && news.link !== 'No Link' ? `onclick="window.open('${news.link}', '_blank')"` : ''}>${buttonText}</button>`;
                
                slidesContainer.appendChild(slide);

                const dot = document.createElement('span');
                dot.className = 'dot';
                dot.addEventListener('click', () => {
                    showSlide(index);
                });
                dotsContainer.appendChild(dot);
            });

            function showSlide(index) {
                const slides = document.querySelectorAll('.news-item');
                const dots = document.querySelectorAll('.dot');

                slides.forEach((slide, i) => {
                    slide.style.display = (i === index) ? 'block' : 'none';
                    dots[i].classList.toggle('active', i === index);
                });

                currentIndex = index;
            }

            function nextSlide() {
                currentIndex = (currentIndex + 1) % newsData.length;
                showSlide(currentIndex);
            }

            function prevSlide() {
                currentIndex = (currentIndex - 1 + newsData.length) % newsData.length;
                showSlide(currentIndex);
            }

            let startX = 0;

            document.querySelector('.news-slider').addEventListener('touchstart', (e) => {
                startX = e.touches[0].clientX;
            });

            document.querySelector('.news-slider').addEventListener('touchend', (e) => {
                const endX = e.changedTouches[0].clientX;
                if (startX > endX + 30) {
                    nextSlide();
                } else if (startX < endX - 30) {
                    prevSlide();
                }
            });

            showSlide(currentIndex);
        });
});

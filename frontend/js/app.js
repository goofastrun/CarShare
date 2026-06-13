let currentPage = 'home';

function navigate(page) {
    currentPage = page;
    renderNav();
    renderPage(page);
}

function renderNav() {
    const user = authModule.user;
    const linksEl = document.getElementById('nav-links');
    const userEl = document.getElementById('nav-user');

    if (!user) {
        linksEl.innerHTML = '';
        userEl.innerHTML = `
            <button class="btn btn-outline btn-sm" onclick="navigate('login')">Войти</button>
            <button class="btn btn-primary btn-sm" onclick="navigate('register')">Регистрация</button>`;
        return;
    }

    const roleLabel = { client: 'Клиент', manager: 'Менеджер', admin: 'Администратор' };
    const roleClass = { client: '', manager: 'manager', admin: 'admin' };

    const links = [
        { page: 'cars', label: '🚗 Автомобили' },
    ];
    if (user.role === 'client') links.push({ page: 'bookings', label: '📋 Мои бронирования' });
    if (user.role === 'manager') links.push({ page: 'bookings', label: '📋 Заявки' });
    if (user.role === 'admin') links.push({ page: 'bookings', label: '📋 Заявки' });
    if (user.role === 'admin') links.push({ page: 'admin', label: '⚙️ Админ' });

    linksEl.innerHTML = links.map(l =>
        `<a onclick="navigate('${l.page}')" class="${currentPage === l.page ? 'active' : ''}">${l.label}</a>`
    ).join('');

    userEl.innerHTML = `
        <span class="user-badge ${roleClass[user.role] || ''}">${roleLabel[user.role] || user.role}</span>
        <span style="color:var(--text-muted);font-size:13px">${user.username}</span>
        <button class="btn btn-secondary btn-sm" onclick="authModule.logout()">Выйти</button>`;
}

async function renderPage(page) {
    const user = authModule.user;

    if (!user && !['home', 'login', 'register'].includes(page)) {
        navigate('login');
        return;
    }

    switch (page) {
        case 'home': renderHome(); break;
        case 'login':
            document.getElementById('main-content').innerHTML = authModule.renderLoginForm();
            authModule.bindLoginForm();
            break;
        case 'register':
            document.getElementById('main-content').innerHTML = authModule.renderRegisterForm();
            authModule.bindRegisterForm();
            break;
        case 'cars': await carsModule.render(); break;
        case 'bookings': await bookingsModule.render(); break;
        case 'admin':
            if (user?.role === 'admin') await adminModule.render();
            else navigate('home');
            break;
        default: renderHome();
    }
}

function renderHome() {
    const user = authModule.user;
    document.getElementById('main-content').innerHTML = `
    <div class="hero">
      <h1>Современный <span>каршеринг</span><br>для вашего города</h1>
      <p>Арендуйте автомобиль на часы или дни. Быстро, удобно и доступно.</p>
      <div class="hero-actions">
        ${user
            ? `<button class="btn btn-primary btn-lg" onclick="navigate('cars')">🚗 Смотреть автомобили</button>
               ${user.role === 'client' ? `<button class="btn btn-outline btn-lg" onclick="navigate('bookings')">📋 Мои бронирования</button>` : ''}`
            : `<button class="btn btn-primary btn-lg" onclick="navigate('register')">Начать сейчас</button>
               <button class="btn btn-outline btn-lg" onclick="navigate('login')">Войти</button>`
        }
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:20px;margin-top:40px">
      <div class="card"><div class="card-body" style="text-align:center;padding:32px 20px">
        <div style="font-size:40px;margin-bottom:12px">🚀</div>
        <div style="font-weight:600;margin-bottom:8px">Быстрое бронирование</div>
        <div style="color:var(--text-muted);font-size:13px">Выберите авто и забронируйте за несколько кликов</div>
      </div></div>
      <div class="card"><div class="card-body" style="text-align:center;padding:32px 20px">
        <div style="font-size:40px;margin-bottom:12px">💰</div>
        <div style="font-weight:600;margin-bottom:8px">Прозрачные цены</div>
        <div style="color:var(--text-muted);font-size:13px">Оплата только за фактическое время аренды</div>
      </div></div>
      <div class="card"><div class="card-body" style="text-align:center;padding:32px 20px">
        <div style="font-size:40px;margin-bottom:12px">🔒</div>
        <div style="font-weight:600;margin-bottom:8px">Безопасность</div>
        <div style="color:var(--text-muted);font-size:13px">Все автомобили застрахованы и проходят ТО</div>
      </div></div>
      <div class="card"><div class="card-body" style="text-align:center;padding:32px 20px">
        <div style="font-size:40px;margin-bottom:12px">📱</div>
        <div style="font-weight:600;margin-bottom:8px">Удобный интерфейс</div>
        <div style="color:var(--text-muted);font-size:13px">Управляйте арендой с любого устройства</div>
      </div></div>
    </div>`;
}

(async () => {
    await authModule.init();
    renderNav();
    const hash = location.hash.replace('#', '') || 'home';
    renderPage(hash);
})();

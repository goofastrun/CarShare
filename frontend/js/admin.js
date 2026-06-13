const adminModule = {
    users: [],
    stats: null,

    async loadUsers() {
        const res = await api.get('/auth/users/');
        if (res && res.ok) this.users = await res.json();
        else this.users = [];
    },

    async loadStats() {
        const [carsRes, bookingsRes] = await Promise.all([
            api.get('/cars/'),
            api.get('/bookings/'),
        ]);
        const cars = carsRes && carsRes.ok ? await carsRes.json() : [];
        const bookings = bookingsRes && bookingsRes.ok ? await bookingsRes.json() : [];
        this.stats = { cars, bookings };
    },

    async render() {
        const main = document.getElementById('main-content');
        main.innerHTML = `
        <div class="page-header" style="margin-bottom:24px">
          <div class="page-title">⚙️ Панель администратора</div>
        </div>
        <div class="tabs">
          <button class="tab-btn active" data-tab="users" onclick="adminModule.switchTab('users',this)">👥 Пользователи</button>
          <button class="tab-btn" data-tab="stats" onclick="adminModule.switchTab('stats',this)">📊 Статистика</button>
        </div>
        <div id="admin-content"><div class="empty-state"><div class="empty-icon">⏳</div><div>Загрузка...</div></div></div>`;
        await this.loadUsers();
        this.renderUsers();
    },

    async switchTab(tab, btn) {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (tab === 'users') {
            await this.loadUsers();
            this.renderUsers();
        } else {
            await this.loadStats();
            this.renderStats();
        }
    },

    renderUsers() {
        const roleMap = { client: 'Клиент', manager: 'Менеджер', admin: 'Администратор' };
        const badgeMap = { client: '', manager: 'manager', admin: 'admin' };
        const content = document.getElementById('admin-content');

        const filterBar = `
        <div class="filters" style="margin-bottom:16px">
          <div class="search-box">
            <span class="search-icon">🔍</span>
            <input type="text" class="form-control" id="user-search" placeholder="Поиск по email или имени..." oninput="adminModule.filterUsers()">
          </div>
          <select class="form-control" id="user-role-filter" onchange="adminModule.filterUsers()" style="max-width:180px">
            <option value="">Все роли</option>
            <option value="client">Клиент</option>
            <option value="manager">Менеджер</option>
            <option value="admin">Администратор</option>
          </select>
        </div>`;

        const rows = this.users.map(u => `
        <tr data-email="${u.email.toLowerCase()}" data-username="${u.username.toLowerCase()}" data-role="${u.role}">
          <td style="color:var(--text-muted);font-size:13px">#${u.id}</td>
          <td><strong>${u.email}</strong></td>
          <td>${u.username}</td>
          <td><span class="user-badge ${badgeMap[u.role] || ''}">${roleMap[u.role] || u.role}</span></td>
          <td style="font-size:13px;color:var(--text-muted)">${u.phone || '—'}</td>
          <td>${u.is_active
            ? '<span class="badge badge-available">Активен</span>'
            : '<span class="badge badge-unavailable">Заблокирован</span>'}
          </td>
          <td>
            <div style="display:flex;gap:6px">
              <button class="btn btn-secondary btn-sm" onclick="adminModule.editUser(${u.id})" title="Редактировать">✏️</button>
              ${u.id !== authModule.user.id
                ? `<button class="btn ${u.is_active ? 'btn-danger' : 'btn-success'} btn-sm"
                     onclick="adminModule.toggleUser(${u.id},${u.is_active})"
                     title="${u.is_active ? 'Заблокировать' : 'Разблокировать'}">
                     ${u.is_active ? '🚫' : '✅'}
                   </button>`
                : '<span style="color:var(--text-muted);font-size:11px;padding:0 6px">Вы</span>'}
            </div>
          </td>
        </tr>`).join('');

        content.innerHTML = `
        ${filterBar}
        <div class="card">
          <div class="card-header">
            <div class="card-title">Пользователи <span style="color:var(--text-muted);font-weight:400;font-size:14px">(${this.users.length})</span></div>
          </div>
          <div class="table-wrapper">
            <table id="users-table">
              <thead>
                <tr>
                  <th>ID</th><th>Email</th><th>Имя</th><th>Роль</th><th>Телефон</th><th>Статус</th><th>Действия</th>
                </tr>
              </thead>
              <tbody id="users-tbody">${rows}</tbody>
            </table>
          </div>
        </div>`;
    },

    filterUsers() {
        const search = (document.getElementById('user-search')?.value || '').toLowerCase();
        const role = document.getElementById('user-role-filter')?.value || '';
        document.querySelectorAll('#users-tbody tr').forEach(row => {
            const emailMatch = row.dataset.email.includes(search);
            const nameMatch = row.dataset.username.includes(search);
            const roleMatch = !role || row.dataset.role === role;
            row.style.display = (emailMatch || nameMatch) && roleMatch ? '' : 'none';
        });
    },

    editUser(id) {
        const user = this.users.find(u => u.id === id);
        if (!user) return;
        const isSelf = user.id === authModule.user.id;
        setModal(`
        <div class="modal-header"><div class="modal-title">Редактировать пользователя</div></div>
        <div class="modal-body">
          <form id="edit-user-form">
            <div class="form-group">
              <label class="form-label">Email</label>
              <input class="form-control" value="${user.email}" disabled style="opacity:0.6">
            </div>
            <div class="form-group">
              <label class="form-label">Имя пользователя</label>
              <input class="form-control" id="eu-username" value="${user.username}">
            </div>
            <div class="form-group">
              <label class="form-label">Роль</label>
              <select class="form-control" id="eu-role" ${isSelf ? 'disabled' : ''}>
                <option value="client" ${user.role === 'client' ? 'selected' : ''}>Клиент</option>
                <option value="manager" ${user.role === 'manager' ? 'selected' : ''}>Менеджер</option>
                <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Администратор</option>
              </select>
              ${isSelf ? '<div style="font-size:12px;color:var(--text-muted);margin-top:4px">Нельзя изменить свою роль</div>' : ''}
            </div>
            <div class="form-group">
              <label class="form-label">Телефон</label>
              <input class="form-control" id="eu-phone" value="${user.phone || ''}">
            </div>
            <div class="form-group" style="display:flex;align-items:center;gap:10px">
              <input type="checkbox" id="eu-verified" ${user.is_verified ? 'checked' : ''} style="width:16px;height:16px;cursor:pointer">
              <label for="eu-verified" style="cursor:pointer;margin:0">Верифицирован</label>
            </div>
            <div id="eu-error" class="form-error" style="margin-bottom:8px"></div>
            <div style="display:flex;gap:8px;justify-content:flex-end">
              <button type="button" class="btn btn-secondary" onclick="closeModal()">Отмена</button>
              <button type="submit" class="btn btn-primary">Сохранить</button>
            </div>
          </form>
        </div>`);

        document.getElementById('edit-user-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button[type=submit]');
            btn.disabled = true; btn.textContent = 'Сохранение...';
            const payload = {
                username: document.getElementById('eu-username').value,
                phone: document.getElementById('eu-phone').value,
                is_verified: document.getElementById('eu-verified').checked,
            };
            if (!isSelf) payload.role = document.getElementById('eu-role').value;
            const res = await api.patch(`/auth/users/${id}/`, payload);
            if (res && res.ok) {
                showToast('Пользователь обновлён', 'success');
                closeModal();
                await this.loadUsers();
                this.renderUsers();
            } else {
                const data = await res.json().catch(() => ({}));
                document.getElementById('eu-error').textContent = Object.values(data).flat().join(' ') || 'Ошибка';
                btn.disabled = false; btn.textContent = 'Сохранить';
            }
        });
    },

    async toggleUser(id, isActive) {
        const action = isActive ? 'заблокировать' : 'разблокировать';
        if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} пользователя?`)) return;
        const res = await api.patch(`/auth/users/${id}/`, { is_active: !isActive });
        if (res && res.ok) {
            showToast(isActive ? 'Пользователь заблокирован' : 'Пользователь разблокирован', 'success');
            await this.loadUsers();
            this.renderUsers();
        } else {
            showToast('Ошибка', 'error');
        }
    },

    renderStats() {
        if (!this.stats) return;
        const { cars, bookings } = this.stats;
        const available = cars.filter(c => c.status === 'available').length;
        const booked = cars.filter(c => c.status === 'booked').length;
        const maintenance = cars.filter(c => c.status === 'maintenance').length;
        const revenue = bookings.filter(b => b.status === 'completed')
            .reduce((s, b) => s + parseFloat(b.total_price || 0), 0);
        const pending = bookings.filter(b => b.status === 'pending').length;
        const active = bookings.filter(b => b.status === 'active').length;
        const completed = bookings.filter(b => b.status === 'completed').length;
        const cancelled = bookings.filter(b => b.status === 'cancelled').length;
        const roleMap = { client: 'Клиент', manager: 'Менеджер', admin: 'Администратор' };

        const content = document.getElementById('admin-content');
        content.innerHTML = `
        <div class="stats-grid">
          <div class="stat-card"><div class="stat-icon">🚗</div><div><div class="stat-num">${cars.length}</div><div class="stat-label">Всего автомобилей</div></div></div>
          <div class="stat-card"><div class="stat-icon">✅</div><div><div class="stat-num">${available}</div><div class="stat-label">Доступно</div></div></div>
          <div class="stat-card"><div class="stat-icon">📅</div><div><div class="stat-num">${booked}</div><div class="stat-label">Забронировано</div></div></div>
          <div class="stat-card"><div class="stat-icon">🔧</div><div><div class="stat-num">${maintenance}</div><div class="stat-label">На обслуживании</div></div></div>
          <div class="stat-card"><div class="stat-icon">📋</div><div><div class="stat-num">${bookings.length}</div><div class="stat-label">Всего бронирований</div></div></div>
          <div class="stat-card"><div class="stat-icon">⏳</div><div><div class="stat-num">${pending}</div><div class="stat-label">Ожидают</div></div></div>
          <div class="stat-card"><div class="stat-icon">▶️</div><div><div class="stat-num">${active}</div><div class="stat-label">Активные</div></div></div>
          <div class="stat-card"><div class="stat-icon">✔️</div><div><div class="stat-num">${completed}</div><div class="stat-label">Завершено</div></div></div>
          <div class="stat-card"><div class="stat-icon">👥</div><div><div class="stat-num">${this.users.length}</div><div class="stat-label">Пользователей</div></div></div>
          <div class="stat-card"><div class="stat-icon">💰</div><div><div class="stat-num">${formatPrice(revenue)}</div><div class="stat-label">Выручка</div></div></div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:20px">
          <div class="card">
            <div class="card-header"><div class="card-title">Пользователи по ролям</div></div>
            <div class="card-body">
              ${this.users.reduce((acc, u) => {
                acc[u.role] = (acc[u.role] || 0) + 1; return acc;
              }, {}) && Object.entries(
                this.users.reduce((acc, u) => { acc[u.role] = (acc[u.role] || 0) + 1; return acc; }, {})
              ).map(([role, count]) => `
                <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">
                  <span class="user-badge ${role === 'admin' ? 'admin' : role === 'manager' ? 'manager' : ''}">${roleMap[role] || role}</span>
                  <strong>${count}</strong>
                </div>`).join('')}
            </div>
          </div>
          <div class="card">
            <div class="card-header"><div class="card-title">Бронирования по статусам</div></div>
            <div class="card-body">
              ${[['pending','⏳','Ожидают'],['confirmed','✅','Подтверждены'],['active','▶️','Активные'],['completed','✔️','Завершены'],['cancelled','❌','Отменены']]
                .map(([s, icon, label]) => `
                <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">
                  <span style="font-size:13px">${icon} ${label}</span>
                  <strong>${bookings.filter(b => b.status === s).length}</strong>
                </div>`).join('')}
            </div>
          </div>
        </div>`;
    },
};

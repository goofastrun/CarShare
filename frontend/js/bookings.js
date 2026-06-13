const bookingsModule = {
    bookings: [],

    async load(all = false) {
        const url = (all || authModule.isManager()) ? '/bookings/' : '/bookings/my/';
        const res = await api.get(url);
        if (res && res.ok) this.bookings = await res.json();
    },

    async render() {
        const isManager = authModule.isManager();
        const main = document.getElementById('main-content');
        const title = isManager ? 'Заявки на бронирование' : 'Мои бронирования';
        main.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px">
          <div class="page-title">${title}</div>
        </div>
        <div id="bookings-list"><div class="empty-state"><div class="empty-icon">⏳</div><div>Загрузка...</div></div></div>`;
        await this.load(isManager);
        this.renderList(isManager);
    },

    async switchTab(mode, btn) {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const all = mode === 'all';
        await this.load(all);
        this.renderList(all);
    },

    renderList(all = false) {
        const list = document.getElementById('bookings-list');
        if (!list) return;
        if (!this.bookings.length) {
            list.innerHTML = `<div class="empty-state"><div class="empty-icon">📋</div><div class="empty-title">Нет бронирований</div></div>`;
            return;
        }
        list.innerHTML = this.bookings.map(b => this.renderCard(b, all)).join('');
    },

    renderCard(b, showClient = false) {
        const car = b.car_details;
        const client = b.client_details;
        return `
        <div class="booking-card">
          <div style="flex:1">
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
              <div class="booking-car">${car ? `${car.brand} ${car.model}` : '—'} <span style="color:var(--text-muted);font-weight:400">${car ? car.license_plate : ''}</span></div>
              ${statusBadge(b.status)}
            </div>
            ${showClient && client ? `<div style="font-size:12px;color:var(--text-muted);margin-bottom:4px">👤 ${client.email}</div>` : ''}
            <div class="booking-dates">📅 ${formatDate(b.start_datetime)} → ${formatDate(b.end_datetime)}</div>
            ${b.notes ? `<div style="font-size:12px;color:var(--text-muted);margin-top:4px">💬 ${b.notes}</div>` : ''}
          </div>
          <div style="text-align:right">
            <div class="booking-price">${b.total_price ? formatPrice(b.total_price) : '—'}</div>
            <div class="booking-actions" style="justify-content:flex-end">
              ${authModule.isManager() && b.status === 'pending' ? `
                <button class="btn btn-success btn-sm" onclick="bookingsModule.updateStatus(${b.id},'confirmed')">✓ Подтвердить</button>
                <button class="btn btn-danger btn-sm" onclick="bookingsModule.updateStatus(${b.id},'cancelled')">✕ Отклонить</button>
              ` : ''}
              ${authModule.isManager() && b.status === 'confirmed' ? `
                <button class="btn btn-primary btn-sm" onclick="bookingsModule.updateStatus(${b.id},'active')">▶ Активировать</button>
              ` : ''}
              ${authModule.isManager() && b.status === 'active' ? `
                <button class="btn btn-secondary btn-sm" onclick="bookingsModule.updateStatus(${b.id},'completed')">✓ Завершить</button>
              ` : ''}
              ${!authModule.isManager() && ['pending','confirmed'].includes(b.status) ? `
                <button class="btn btn-danger btn-sm" onclick="bookingsModule.cancel(${b.id})">Отменить</button>
              ` : ''}
            </div>
          </div>
        </div>`;
    },

    async updateStatus(id, status) {
        const res = await api.patch(`/bookings/${id}/`, { status });
        if (res && res.ok) {
            showToast('Статус обновлён', 'success');
            const all = authModule.isManager();
            await this.load(all);
            this.renderList(all);
        } else {
            showToast('Ошибка обновления', 'error');
        }
    },

    async cancel(id) {
        if (!confirm('Отменить бронирование?')) return;
        const res = await api.delete(`/bookings/${id}/`);
        const data = res ? await res.json() : {};
        if (res && res.ok) {
            showToast(data.detail || 'Бронирование отменено', 'success');
            await this.load(false);
            this.renderList(false);
        } else {
            showToast(data.detail || 'Ошибка', 'error');
        }
    },

    async showCreateForm(carId) {
        const res = await api.get(`/cars/${carId}/`);
        if (!res || !res.ok) return;
        const car = await res.json();
        const now = new Date();
        const later = new Date(now.getTime() + 3600000);
        const fmt = d => d.toISOString().slice(0,16);
        setModal(`
        <div class="modal-header">
          <div class="modal-title">Забронировать автомобиль</div>
          <div class="modal-subtitle">${car.brand} ${car.model} ${car.year} · ${car.license_plate}</div>
        </div>
        <div class="modal-body">
          <div style="background:var(--primary-light);border-radius:8px;padding:12px;margin-bottom:20px;display:flex;justify-content:space-between">
            <span>💰 ${formatPrice(car.price_per_hour)}/час</span>
            <span>📅 ${formatPrice(car.price_per_day)}/день</span>
          </div>
          <form id="booking-form">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Начало аренды</label>
                <input type="datetime-local" class="form-control" id="bf-start" value="${fmt(now)}" required>
              </div>
              <div class="form-group">
                <label class="form-label">Конец аренды</label>
                <input type="datetime-local" class="form-control" id="bf-end" value="${fmt(later)}" required>
              </div>
            </div>
            <div id="price-preview" style="background:var(--bg);border-radius:8px;padding:12px;margin-bottom:16px;text-align:center;font-size:18px;font-weight:700;color:var(--primary)"></div>
            <div class="form-group">
              <label class="form-label">Примечания</label>
              <textarea class="form-control" id="bf-notes" placeholder="Необязательно..."></textarea>
            </div>
            <div id="booking-error" class="form-error" style="margin-bottom:8px"></div>
            <div style="display:flex;gap:8px;justify-content:flex-end">
              <button type="button" class="btn btn-secondary" onclick="closeModal()">Отмена</button>
              <button type="submit" class="btn btn-primary">Забронировать</button>
            </div>
          </form>
        </div>`);

        const calcPrice = () => {
            const s = new Date(document.getElementById('bf-start').value);
            const e = new Date(document.getElementById('bf-end').value);
            if (isNaN(s) || isNaN(e) || e <= s) { document.getElementById('price-preview').textContent = ''; return; }
            const hours = (e - s) / 3600000;
            let price;
            if (hours >= 24) {
                const days = Math.floor(hours / 24);
                const rem = hours - days * 24;
                price = days * car.price_per_day + rem * car.price_per_hour;
            } else {
                price = hours * car.price_per_hour;
            }
            document.getElementById('price-preview').textContent = `Итого: ${formatPrice(price.toFixed(2))}`;
        };
        document.getElementById('bf-start').addEventListener('change', calcPrice);
        document.getElementById('bf-end').addEventListener('change', calcPrice);
        calcPrice();

        document.getElementById('booking-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button[type=submit]');
            btn.disabled = true;
            const body = {
                car: carId,
                start_datetime: document.getElementById('bf-start').value + ':00',
                end_datetime: document.getElementById('bf-end').value + ':00',
                notes: document.getElementById('bf-notes').value,
            };
            const res = await api.post('/bookings/', body);
            const data = await res.json();
            if (res.ok) {
                showToast('Бронирование создано!', 'success');
                closeModal();
                navigate('bookings');
            } else {
                document.getElementById('booking-error').textContent = Object.values(data).flat().join(' ');
            }
            btn.disabled = false;
        });
    },
};

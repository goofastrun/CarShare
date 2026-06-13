const carsModule = {
    cars: [],
    filters: { search: '', status: '', transmission: '', fuel_type: '' },

    async load() {
        const params = new URLSearchParams();
        if (this.filters.search) params.set('search', this.filters.search);
        if (this.filters.status) params.set('status', this.filters.status);
        if (this.filters.transmission) params.set('transmission', this.filters.transmission);
        if (this.filters.fuel_type) params.set('fuel_type', this.filters.fuel_type);
        const res = await api.get(`/cars/?${params}`);
        if (res && res.ok) this.cars = await res.json();
    },

    carIcon(fuel) {
        const map = { electric: '⚡', hybrid: '🌿', diesel: '🚛' };
        return map[fuel] || '🚗';
    },

    renderCard(car) {
        const imgHtml = car.image
            ? `<img src="${car.image}" alt="${car.brand} ${car.model}">`
            : `<span style="font-size:64px">${this.carIcon(car.fuel_type)}</span>`;
        return `
        <div class="car-card" onclick="carsModule.showDetail(${car.id})">
          <div class="car-img">
            ${imgHtml}
            <span class="car-status-badge badge badge-${car.status}">${car.status_display || car.status}</span>
          </div>
          <div class="car-info">
            <div class="car-name">${car.brand} ${car.model} ${car.year}</div>
            <div class="car-plate">${car.license_plate} · ${car.location}</div>
            <div class="car-specs">
              <span class="spec-item">💺 ${car.seats}</span>
              <span class="spec-item">⚙️ ${car.transmission_display || car.transmission}</span>
              <span class="spec-item">⛽ ${car.fuel_type_display || car.fuel_type}</span>
            </div>
            <div class="car-price">
              <div>
                <div class="price-main">${formatPrice(car.price_per_hour)}/час</div>
                <div class="price-sub">${formatPrice(car.price_per_day)}/день</div>
              </div>
              ${car.status === 'available' && authModule.isClient() ? `<button class="btn btn-primary btn-sm" onclick="event.stopPropagation();bookingsModule.showCreateForm(${car.id})">Забронировать</button>` : ''}
            </div>
          </div>
        </div>`;
    },

    renderFilters() {
        return `
        <div class="filters">
          <div class="search-box">
            <span class="search-icon">🔍</span>
            <input type="text" class="form-control" id="car-search" placeholder="Поиск по марке, модели..." value="${this.filters.search}">
          </div>
          <select class="form-control" id="filter-status">
            <option value="">Все статусы</option>
            <option value="available" ${this.filters.status==='available'?'selected':''}>Доступны</option>
            <option value="booked" ${this.filters.status==='booked'?'selected':''}>Забронированы</option>
            <option value="maintenance" ${this.filters.status==='maintenance'?'selected':''}>Обслуживание</option>
          </select>
          <select class="form-control" id="filter-trans">
            <option value="">Любая КПП</option>
            <option value="auto" ${this.filters.transmission==='auto'?'selected':''}>Автомат</option>
            <option value="manual" ${this.filters.transmission==='manual'?'selected':''}>Механика</option>
          </select>
          <select class="form-control" id="filter-fuel">
            <option value="">Любое топливо</option>
            <option value="petrol" ${this.filters.fuel_type==='petrol'?'selected':''}>Бензин</option>
            <option value="diesel" ${this.filters.fuel_type==='diesel'?'selected':''}>Дизель</option>
            <option value="electric" ${this.filters.fuel_type==='electric'?'selected':''}>Электро</option>
            <option value="hybrid" ${this.filters.fuel_type==='hybrid'?'selected':''}>Гибрид</option>
          </select>
          ${authModule.isManager() ? `<button class="btn btn-primary" onclick="carsModule.showAddForm()">+ Добавить</button>` : ''}
        </div>`;
    },

    async render() {
        const main = document.getElementById('main-content');
        main.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px">
          <div class="page-title">Автомобили</div>
        </div>
        ${this.renderFilters()}
        <div id="cars-grid" class="cars-grid"><div class="empty-state"><div class="empty-icon">⏳</div><div>Загрузка...</div></div></div>`;
        this.bindFilters();
        await this.load();
        this.renderGrid();
    },

    renderGrid() {
        const grid = document.getElementById('cars-grid');
        if (!grid) return;
        if (!this.cars.length) {
            grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">🚫</div><div class="empty-title">Автомобили не найдены</div></div>`;
            return;
        }
        grid.innerHTML = this.cars.map(c => this.renderCard(c)).join('');
    },

    bindFilters() {
        let timeout;
        document.getElementById('car-search')?.addEventListener('input', (e) => {
            clearTimeout(timeout);
            timeout = setTimeout(async () => {
                this.filters.search = e.target.value;
                await this.load();
                this.renderGrid();
            }, 350);
        });
        ['filter-status','filter-trans','filter-fuel'].forEach((id, i) => {
            const keys = ['status','transmission','fuel_type'];
            document.getElementById(id)?.addEventListener('change', async (e) => {
                this.filters[keys[i]] = e.target.value;
                await this.load();
                this.renderGrid();
            });
        });
    },

    async showDetail(id) {
        const res = await api.get(`/cars/${id}/`);
        if (!res || !res.ok) return;
        const car = await res.json();
        const imgHtml = car.image
            ? `<img src="${car.image}" style="width:100%;height:200px;object-fit:cover;border-radius:8px;margin-bottom:16px">`
            : `<div style="font-size:80px;text-align:center;padding:20px">${this.carIcon(car.fuel_type)}</div>`;
        const canManage = authModule.isManager();
        setModal(`
        <div class="modal-header">
          <div class="modal-title">${car.brand} ${car.model} ${car.year}</div>
          <div class="modal-subtitle">${statusBadge(car.status)}</div>
        </div>
        <div class="modal-body">
          ${imgHtml}
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
            <div><div style="color:var(--text-muted);font-size:12px">Гос. номер</div><b>${car.license_plate}</b></div>
            <div><div style="color:var(--text-muted);font-size:12px">Цвет</div><b>${car.color}</b></div>
            <div><div style="color:var(--text-muted);font-size:12px">КПП</div><b>${car.transmission_display||car.transmission}</b></div>
            <div><div style="color:var(--text-muted);font-size:12px">Топливо</div><b>${car.fuel_type_display||car.fuel_type}</b></div>
            <div><div style="color:var(--text-muted);font-size:12px">Мест</div><b>${car.seats}</b></div>
            <div><div style="color:var(--text-muted);font-size:12px">Пробег</div><b>${car.mileage} км</b></div>
            <div><div style="color:var(--text-muted);font-size:12px">Цена/час</div><b style="color:var(--primary)">${formatPrice(car.price_per_hour)}</b></div>
            <div><div style="color:var(--text-muted);font-size:12px">Цена/день</div><b style="color:var(--primary)">${formatPrice(car.price_per_day)}</b></div>
          </div>
          <div style="color:var(--text-muted);font-size:12px;margin-bottom:4px">Местонахождение</div>
          <div style="margin-bottom:16px">📍 ${car.location}</div>
          ${car.description ? `<div style="color:var(--text-muted);font-size:13px">${car.description}</div>` : ''}
        </div>
        <div class="modal-footer">
          ${canManage ? `
            <button class="btn btn-secondary btn-sm" onclick="carsModule.showEditForm(${car.id})">✏️ Изменить</button>
            <button class="btn btn-danger btn-sm" onclick="carsModule.deleteCar(${car.id})">🗑 Удалить</button>
          ` : ''}
          ${car.status === 'available' && authModule.isClient() ? `<button class="btn btn-primary" onclick="closeModal();bookingsModule.showCreateForm(${car.id})">Забронировать</button>` : ''}
        </div>`);
    },

    showAddForm() {
        setModal(`
        <div class="modal-header"><div class="modal-title">Добавить автомобиль</div></div>
        <div class="modal-body">
          <form id="car-form">
            <div class="form-row">
              <div class="form-group"><label class="form-label">Марка</label><input class="form-control" id="cf-brand" required></div>
              <div class="form-group"><label class="form-label">Модель</label><input class="form-control" id="cf-model" required></div>
            </div>
            <div class="form-row">
              <div class="form-group"><label class="form-label">Год</label><input type="number" class="form-control" id="cf-year" min="1990" max="2030" value="2023" required></div>
              <div class="form-group"><label class="form-label">Гос. номер</label><input class="form-control" id="cf-plate" required></div>
            </div>
            <div class="form-row">
              <div class="form-group"><label class="form-label">Цвет</label><input class="form-control" id="cf-color" required></div>
              <div class="form-group"><label class="form-label">Мест</label><input type="number" class="form-control" id="cf-seats" value="5" min="1" max="20" required></div>
            </div>
            <div class="form-row">
              <div class="form-group"><label class="form-label">КПП</label>
                <select class="form-control" id="cf-trans"><option value="auto">Автомат</option><option value="manual">Механика</option></select>
              </div>
              <div class="form-group"><label class="form-label">Топливо</label>
                <select class="form-control" id="cf-fuel"><option value="petrol">Бензин</option><option value="diesel">Дизель</option><option value="electric">Электро</option><option value="hybrid">Гибрид</option></select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group"><label class="form-label">Цена/час (₽)</label><input type="number" class="form-control" id="cf-hour" min="0" step="10" required></div>
              <div class="form-group"><label class="form-label">Цена/день (₽)</label><input type="number" class="form-control" id="cf-day" min="0" step="100" required></div>
            </div>
            <div class="form-group"><label class="form-label">Местонахождение</label><input class="form-control" id="cf-loc" required></div>
            <div class="form-row">
              <div class="form-group"><label class="form-label">Пробег (км)</label><input type="number" class="form-control" id="cf-mileage" value="0" min="0"></div>
              <div class="form-group"><label class="form-label">Статус</label>
                <select class="form-control" id="cf-status"><option value="available">Доступна</option><option value="maintenance">Обслуживание</option><option value="unavailable">Недоступна</option></select>
              </div>
            </div>
            <div class="form-group"><label class="form-label">Описание</label><textarea class="form-control" id="cf-desc"></textarea></div>
            <div id="car-form-error" class="form-error" style="margin-bottom:8px"></div>
            <div style="display:flex;gap:8px;justify-content:flex-end">
              <button type="button" class="btn btn-secondary" onclick="closeModal()">Отмена</button>
              <button type="submit" class="btn btn-primary">Добавить</button>
            </div>
          </form>
        </div>`);
        document.getElementById('car-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.submitCarForm(null);
        });
    },

    async showEditForm(id) {
        const res = await api.get(`/cars/${id}/`);
        if (!res || !res.ok) return;
        const car = await res.json();
        this.showAddForm();
        // Wait for modal DOM, then fill
        setTimeout(() => {
            document.getElementById('cf-brand').value = car.brand;
            document.getElementById('cf-model').value = car.model;
            document.getElementById('cf-year').value = car.year;
            document.getElementById('cf-plate').value = car.license_plate;
            document.getElementById('cf-color').value = car.color;
            document.getElementById('cf-seats').value = car.seats;
            document.getElementById('cf-trans').value = car.transmission;
            document.getElementById('cf-fuel').value = car.fuel_type;
            document.getElementById('cf-hour').value = car.price_per_hour;
            document.getElementById('cf-day').value = car.price_per_day;
            document.getElementById('cf-loc').value = car.location;
            document.getElementById('cf-mileage').value = car.mileage;
            document.getElementById('cf-status').value = car.status;
            document.getElementById('cf-desc').value = car.description || '';
            document.querySelector('.modal-title').textContent = 'Редактировать автомобиль';
            document.getElementById('car-form').onsubmit = async (e) => {
                e.preventDefault();
                await this.submitCarForm(id);
            };
        }, 50);
    },

    async submitCarForm(id) {
        const btn = document.querySelector('#car-form button[type=submit]');
        btn.disabled = true;
        const body = {
            brand: document.getElementById('cf-brand').value,
            model: document.getElementById('cf-model').value,
            year: parseInt(document.getElementById('cf-year').value),
            license_plate: document.getElementById('cf-plate').value,
            color: document.getElementById('cf-color').value,
            seats: parseInt(document.getElementById('cf-seats').value),
            transmission: document.getElementById('cf-trans').value,
            fuel_type: document.getElementById('cf-fuel').value,
            price_per_hour: document.getElementById('cf-hour').value,
            price_per_day: document.getElementById('cf-day').value,
            location: document.getElementById('cf-loc').value,
            mileage: parseInt(document.getElementById('cf-mileage').value),
            status: document.getElementById('cf-status').value,
            description: document.getElementById('cf-desc').value,
        };
        try {
            const res = id ? await api.put(`/cars/${id}/`, body) : await api.post('/cars/create/', body);
            const data = await res.json();
            if (res.ok) {
                showToast(id ? 'Автомобиль обновлён' : 'Автомобиль добавлен', 'success');
                closeModal();
                await this.render();
            } else {
                document.getElementById('car-form-error').textContent = Object.values(data).flat().join(' ');
            }
        } catch {
            document.getElementById('car-form-error').textContent = 'Ошибка сервера';
        }
        btn.disabled = false;
    },

    async deleteCar(id) {
        if (!confirm('Удалить автомобиль?')) return;
        const res = await api.delete(`/cars/${id}/`);
        if (res && (res.ok || res.status === 204)) {
            showToast('Автомобиль удалён', 'success');
            closeModal();
            await this.render();
        } else {
            showToast('Ошибка удаления', 'error');
        }
    },
};

const API_BASE = '/api';

const api = {
    getToken() { return localStorage.getItem('access_token'); },
    getRefresh() { return localStorage.getItem('refresh_token'); },

    async request(method, url, data = null, auth = true) {
        const headers = { 'Content-Type': 'application/json' };
        if (auth) headers['Authorization'] = `Bearer ${this.getToken()}`;

        const opts = { method, headers };
        if (data) opts.body = JSON.stringify(data);

        let res = await fetch(`${API_BASE}${url}`, opts);

        if (res.status === 401 && auth) {
            const refreshed = await this.refreshToken();
            if (refreshed) {
                headers['Authorization'] = `Bearer ${this.getToken()}`;
                res = await fetch(`${API_BASE}${url}`, { method, headers, body: opts.body });
            } else {
                authModule.logout();
                return null;
            }
        }
        return res;
    },

    async refreshToken() {
        const refresh = this.getRefresh();
        if (!refresh) return false;
        try {
            const res = await fetch(`${API_BASE}/auth/token/refresh/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh })
            });
            if (res.ok) {
                const data = await res.json();
                localStorage.setItem('access_token', data.access);
                if (data.refresh) localStorage.setItem('refresh_token', data.refresh);
                return true;
            }
        } catch {}
        return false;
    },

    async get(url, auth = true) { return this.request('GET', url, null, auth); },
    async post(url, data, auth = true) { return this.request('POST', url, data, auth); },
    async put(url, data) { return this.request('PUT', url, data); },
    async patch(url, data) { return this.request('PATCH', url, data); },
    async delete(url) { return this.request('DELETE', url); },
};

function showToast(msg, type = 'info', duration = 3500) {
    const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<span>${icons[type] || ''}</span><span>${msg}</span>`;
    document.getElementById('toast-container').appendChild(el);
    setTimeout(() => el.remove(), duration);
}

function openModal() {
    document.getElementById('modal-overlay').classList.add('open');
    document.body.style.overflow = 'hidden';
}
function closeModal() {
    document.getElementById('modal-overlay').classList.remove('open');
    document.body.style.overflow = '';
}
function setModal(html) {
    document.getElementById('modal-content').innerHTML = html;
    openModal();
}

function formatDate(d) {
    return new Date(d).toLocaleString('ru-RU', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
}
function formatPrice(p) {
    return Number(p).toLocaleString('ru-RU') + ' ₽';
}
function statusBadge(s) {
    const map = {
        available: ['available','Доступна'], booked: ['booked','Забронирована'],
        maintenance: ['maintenance','Обслуживание'], unavailable: ['unavailable','Недоступна'],
        pending: ['pending','Ожидает'], confirmed: ['confirmed','Подтверждено'],
        active: ['active','Активно'], completed: ['completed','Завершено'],
        cancelled: ['cancelled','Отменено'],
    };
    const [cls, label] = map[s] || ['', s];
    return `<span class="badge badge-${cls}">${label}</span>`;
}

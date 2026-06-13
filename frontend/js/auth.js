const authModule = {
    user: null,

    async init() {
        if (api.getToken()) await this.loadProfile();
    },

    async loadProfile() {
        const res = await api.get('/auth/profile/');
        if (res && res.ok) {
            this.user = await res.json();
        } else {
            this.user = null;
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
        }
    },

    async login(email, password) {
        const res = await api.post('/auth/login/', { email, password }, false);
        if (!res) return false;
        const data = await res.json();
        if (res.ok) {
            localStorage.setItem('access_token', data.access);
            localStorage.setItem('refresh_token', data.refresh);
            await this.loadProfile();
            return true;
        }
        const msg = data.detail || 'Неверный логин или пароль.';
        throw new Error(msg);
    },

    async register(formData) {
        const res = await api.post('/auth/register/', formData, false);
        const data = await res.json();
        if (res.ok) return data;
        const errors = Object.values(data).flat().join(' ');
        throw new Error(errors);
    },

    logout() {
        const refresh = api.getRefresh();
        if (refresh) api.post('/auth/logout/', { refresh }).catch(() => {});
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        this.user = null;
        navigate('home');
        renderNav();
    },

    isLoggedIn() { return !!this.user; },
    isClient() { return this.user && this.user.role === 'client'; },
    isManager() { return this.user && ['manager', 'admin'].includes(this.user.role); },
    isAdmin() { return this.user && this.user.role === 'admin'; },

    renderLoginForm() {
        return `
        <div class="auth-page">
          <div class="auth-card">
            <div class="auth-title">Вход в аккаунт</div>
            <div class="auth-sub">Войдите, чтобы пользоваться сервисом</div>
            <form id="login-form">
              <div class="form-group">
                <label class="form-label">Email</label>
                <input type="email" class="form-control" id="login-email" placeholder="your@email.com" required>
              </div>
              <div class="form-group">
                <label class="form-label">Пароль</label>
                <input type="password" class="form-control" id="login-pass" placeholder="••••••••" required>
              </div>
              <div id="login-error" class="form-error" style="margin-bottom:12px"></div>
              <button type="submit" class="btn btn-primary btn-block btn-lg">Войти</button>
            </form>
            <div class="auth-switch">Нет аккаунта? <a onclick="navigate('register')">Зарегистрироваться</a></div>
          </div>
        </div>`;
    },

    renderRegisterForm() {
        return `
        <div class="auth-page">
          <div class="auth-card" style="max-width:520px">
            <div class="auth-title">Регистрация</div>
            <div class="auth-sub">Создайте аккаунт для начала работы</div>
            <form id="register-form">
              <div class="form-group">
                <label class="form-label">Выберите роль</label>
                <div class="role-grid">
                  <label class="role-option">
                    <input type="radio" name="role" value="client" checked onchange="authModule.onRoleChange('client')">
                    <div class="role-label">
                      <div class="role-icon">👤</div>
                      <div class="role-name">Клиент</div>
                      <div class="role-desc">Аренда автомобилей</div>
                    </div>
                  </label>
                  <label class="role-option">
                    <input type="radio" name="role" value="manager" onchange="authModule.onRoleChange('manager')">
                    <div class="role-label">
                      <div class="role-icon">🔧</div>
                      <div class="role-name">Менеджер</div>
                      <div class="role-desc">Управление парком и бронированиями</div>
                    </div>
                  </label>
                  <label class="role-option">
                    <input type="radio" name="role" value="admin" onchange="authModule.onRoleChange('admin')">
                    <div class="role-label">
                      <div class="role-icon">⚙️</div>
                      <div class="role-name">Администратор</div>
                      <div class="role-desc">Полный доступ к системе</div>
                    </div>
                  </label>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Email</label>
                  <input type="email" class="form-control" id="reg-email" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Имя пользователя</label>
                  <input type="text" class="form-control" id="reg-username" required>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Пароль</label>
                  <input type="password" class="form-control" id="reg-pass" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Повторите пароль</label>
                  <input type="password" class="form-control" id="reg-pass2" required>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Телефон</label>
                <input type="tel" class="form-control" id="reg-phone" placeholder="+7 (999) 000-00-00">
              </div>
              <div class="form-group" id="license-field">
                <label class="form-label">Водительское удостоверение</label>
                <input type="text" class="form-control" id="reg-license" placeholder="Серия и номер">
              </div>
              <div id="reg-error" class="form-error" style="margin-bottom:12px"></div>
              <button type="submit" class="btn btn-primary btn-block btn-lg">Зарегистрироваться</button>
            </form>
            <div class="auth-switch">Уже есть аккаунт? <a onclick="navigate('login')">Войти</a></div>
          </div>
        </div>`;
    },

    onRoleChange(role) {
        const licenseField = document.getElementById('license-field');
        if (!licenseField) return;
        if (role === 'client') {
            licenseField.style.display = '';
        } else {
            licenseField.style.display = 'none';
            const inp = document.getElementById('reg-license');
            if (inp) inp.value = '';
        }
    },

    bindLoginForm() {
        document.getElementById('login-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button[type=submit]');
            btn.disabled = true; btn.textContent = 'Вход...';
            try {
                await this.login(
                    document.getElementById('login-email').value,
                    document.getElementById('login-pass').value
                );
                renderNav();
                navigate(authModule.isAdmin() ? 'admin' : 'cars');
                showToast('Добро пожаловать!', 'success');
            } catch (err) {
                document.getElementById('login-error').textContent = err.message;
            } finally {
                btn.disabled = false; btn.textContent = 'Войти';
            }
        });
    },

    bindRegisterForm() {
        document.getElementById('register-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button[type=submit]');
            btn.disabled = true; btn.textContent = 'Регистрация...';
            const role = document.querySelector('input[name=role]:checked')?.value || 'client';
            const payload = {
                email: document.getElementById('reg-email').value,
                username: document.getElementById('reg-username').value,
                password: document.getElementById('reg-pass').value,
                password2: document.getElementById('reg-pass2').value,
                role,
                phone: document.getElementById('reg-phone').value,
                driver_license: role === 'client' ? document.getElementById('reg-license').value : '',
            };
            try {
                await this.register(payload);
                showToast('Аккаунт создан! Войдите в систему.', 'success');
                navigate('login');
            } catch (err) {
                document.getElementById('reg-error').textContent = err.message;
            } finally {
                btn.disabled = false; btn.textContent = 'Зарегистрироваться';
            }
        });
    },
};

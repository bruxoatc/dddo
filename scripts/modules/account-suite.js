export function initAccountSuite({ AppState, Utils, Modal }, options = {}) {
    const settings = {
        autoShowAuth: options.autoShowAuth !== undefined ? options.autoShowAuth : true,
        persistAuthOnLogin: options.persistAuthOnLogin === true,
        profilePortalUrl: typeof options.profilePortalUrl === 'string' && options.profilePortalUrl.trim()
            ? options.profilePortalUrl.trim()
            : null,
        profilePortalTarget: options.profilePortalTarget === '_self' ? '_self' : '_blank'
    };

    function openProfilePortal() {
        if (!settings.profilePortalUrl) {
            return false;
        }

        if (settings.profilePortalTarget === '_self') {
            window.location.href = settings.profilePortalUrl;
            return true;
        }

        const newWindow = window.open(settings.profilePortalUrl, '_blank');
        if (newWindow) {
            newWindow.opener = null;
            return true;
        }
        return false;
    }

    const ChatWidget = {
        window: null,
        body: null,
        form: null,
        input: null,
        closeBtn: null,
        openBtn: null,
        isOpen: false,
        hasWelcomed: false,

        init() {
            this.window = document.getElementById('chatWindow');
            this.body = document.getElementById('chatBody');
            this.form = document.getElementById('chatForm');
            this.input = document.getElementById('chatMessage');
            this.closeBtn = document.getElementById('chatCloseBtn');
            this.openBtn = document.getElementById('supportChatBtn');

            if (!this.window || !this.body) {
                return;
            }

            if (this.form) {
                this.form.addEventListener('submit', (event) => {
                    event.preventDefault();
                    this.sendMessage();
                });
            }

            if (this.closeBtn) {
                this.closeBtn.addEventListener('click', () => this.close());
            }

            if (this.openBtn) {
                this.openBtn.setAttribute('aria-expanded', 'false');
                this.openBtn.addEventListener('click', () => this.toggle());
            }

            this.window.setAttribute('aria-hidden', 'true');
            this.ensureGreeting();
        },

        ensureGreeting() {
            if (this.hasWelcomed) {
                return;
            }
            this.appendMessage('bot', 'Olá! Sou da equipe Amex Store. Como posso ajudar você hoje?');
            this.hasWelcomed = true;
        },

        open() {
            if (!this.window) return;
            this.window.classList.add('active');
            this.window.setAttribute('aria-hidden', 'false');
            this.isOpen = true;
            if (this.openBtn) {
                this.openBtn.classList.add('open');
                this.openBtn.setAttribute('aria-expanded', 'true');
                this.openBtn.setAttribute('aria-label', 'Fechar chat de suporte ao vivo');
            }
            this.ensureGreeting();
            if (this.input) {
                requestAnimationFrame(() => this.input.focus());
            }
            this.scrollToBottom();
        },

        close() {
            if (!this.window) return;
            this.window.classList.remove('active');
            this.window.setAttribute('aria-hidden', 'true');
            this.isOpen = false;
            if (this.openBtn) {
                this.openBtn.classList.remove('open');
                this.openBtn.setAttribute('aria-expanded', 'false');
                this.openBtn.setAttribute('aria-label', 'Abrir chat de suporte ao vivo');
            }
            if (this.input) {
                this.input.blur();
            }
        },

        toggle() {
            if (this.isOpen) {
                this.close();
            } else {
                this.open();
            }
        },

        appendMessage(type, text) {
            if (!this.body) {
                return;
            }
            const wrapper = document.createElement('div');
            wrapper.className = `chat-message ${type}`;
            const content = document.createElement('span');
            content.textContent = text;
            wrapper.appendChild(content);
            this.body.appendChild(wrapper);
            this.scrollToBottom();
        },

        generateReply(message) {
            const text = message.toLowerCase();
            if (text.includes('prazo') || text.includes('entrega')) {
                return 'Os produtos digitais são liberados automaticamente após a confirmação do pagamento. Se tiver algum atraso, me envie o comprovante.';
            }
            if (text.includes('garantia') || text.includes('reembolso')) {
                return 'Oferecemos garantia imediata durante o processo de entrega. Assim que receber seus dados, teste e fale conosco se notar algo fora do esperado.';
            }
            if (text.includes('pagamento') || text.includes('pix')) {
                return 'Aceitamos Pix e alguns cartões via parceiros. Após pagar, envie o comprovante para agilizar a ativação.';
            }
            if (text.includes('contato') || text.includes('whatsapp') || text.includes('discord')) {
                return 'Pode chamar a gente pelo WhatsApp (16) 99276-4211 ou Discord 9797x. Estamos online na maior parte do dia.';
            }
            return 'Entendi! Se precisar de algo específico, me conte com detalhes e eu te direciono para o melhor caminho.';
        },

        sendMessage() {
            if (!this.input) {
                return;
            }
            const message = this.input.value.trim();
            if (!message) {
                return;
            }
            this.appendMessage('user', message);
            this.input.value = '';

            setTimeout(() => {
                this.appendMessage('bot', this.generateReply(message));
            }, 600);
        },

        scrollToBottom() {
            if (!this.body) {
                return;
            }
            this.body.scrollTop = this.body.scrollHeight;
        }
    };

    const Profile = {
        button: null,
        label: null,
        avatar: null,
        modal: null,
        closeBtn: null,
        form: null,
        nameInput: null,
        emailInput: null,
        passwordInput: null,
        summaryName: null,
        summaryEmail: null,
        summaryAvatar: null,
        logoutBtn: null,
        avatarInput: null,
        avatarTrigger: null,
        avatarReset: null,
        historyList: null,
        historyEmpty: null,
        historyRefresh: null,

        init() {
            this.button = document.getElementById('profileBtn');
            this.label = this.button ? this.button.querySelector('.profile-label') : null;
            this.avatar = this.button ? this.button.querySelector('.profile-avatar') : null;
            this.modal = document.getElementById('profileModal');
            this.closeBtn = document.getElementById('closeProfileModal');
            this.form = document.getElementById('profileForm');
            this.nameInput = document.getElementById('profileName');
            this.emailInput = document.getElementById('profileEmail');
            this.passwordInput = document.getElementById('profilePassword');
            this.summaryName = document.getElementById('profileSummaryName');
            this.summaryEmail = document.getElementById('profileSummaryEmail');
            this.summaryAvatar = document.getElementById('profileSummaryAvatar');
            this.logoutBtn = document.getElementById('logoutBtn');
            this.avatarInput = document.getElementById('profileAvatarInput');
            this.avatarTrigger = document.getElementById('profileAvatarTrigger');
            this.avatarReset = document.getElementById('profileAvatarReset');
            this.historyList = document.getElementById('profileHistoryList');
            this.historyEmpty = document.getElementById('profileHistoryEmpty');
            this.historyRefresh = document.getElementById('profileHistoryRefresh');

            if (this.button) {
                if (settings.profilePortalUrl) {
                    this.button.addEventListener('click', (event) => {
                        event.preventDefault();
                        openProfilePortal();
                    });
                } else {
                    this.button.addEventListener('click', () => {
                        if (!Auth.isAuthenticated() || !AppState.currentUser) {
                            Auth.show('loginForm');
                            return;
                        }
                        Auth.show('accountForm');
                    });
                }
            }

            if (this.closeBtn) {
                this.closeBtn.addEventListener('click', () => {
                    Modal.close('profileModal');
                    if (settings.persistAuthOnLogin) {
                        Auth.show('accountForm');
                    }
                });
            }

            if (this.form) {
                this.form.addEventListener('submit', (event) => {
                    event.preventDefault();
                    this.saveProfile();
                });
            }

            if (this.logoutBtn) {
                this.logoutBtn.addEventListener('click', () => {
                    Modal.close('profileModal');
                    Auth.logout();
                });
            }

            if (this.avatarTrigger && this.avatarInput) {
                this.avatarTrigger.addEventListener('click', () => {
                    if (!Auth.isAuthenticated() || !AppState.currentUser) {
                        Auth.show('loginForm');
                        return;
                    }
                    this.avatarInput.click();
                });
            }

            if (this.avatarInput) {
                this.avatarInput.addEventListener('change', (event) => {
                    const file = event.target.files && event.target.files[0];
                    if (!file) {
                        return;
                    }
                    this.handleAvatarFile(file);
                    event.target.value = '';
                });
            }

            if (this.avatarReset) {
                this.avatarReset.addEventListener('click', () => this.resetAvatar());
            }

            if (this.historyRefresh) {
                this.historyRefresh.addEventListener('click', () => this.renderPurchases(true));
            }

            this.updateUI();
            this.renderPurchases();
            this.updateAvatarControls();
        },

        populateForm() {
            if (!AppState.currentUser) {
                return;
            }

            if (this.nameInput) {
                this.nameInput.value = AppState.currentUser.name || '';
            }
            if (this.emailInput) {
                this.emailInput.value = AppState.currentUser.email || '';
            }
            if (this.passwordInput) {
                this.passwordInput.value = '';
            }

            this.updateSummary(AppState.currentUser);
            this.updateAvatarControls();
            this.renderPurchases();
        },

        openModal() {
            if (!Auth.isAuthenticated() || !AppState.currentUser) {
                Auth.show('loginForm');
                return;
            }
            this.populateForm();
            Auth.hide();
            Modal.open('profileModal');
        },

        saveProfile() {
            if (!AppState.currentUser) {
                Utils.showToast('Faca login para editar o perfil.', 'warning');
                return;
            }

            const name = (this.nameInput ? this.nameInput.value : '').trim();
            const email = (this.emailInput ? this.emailInput.value : '').trim().toLowerCase();
            const password = (this.passwordInput ? this.passwordInput.value : '').trim();

            if (!name) {
                Utils.showToast('Informe um nome valido.', 'warning');
                return;
            }

            if (!email) {
                Utils.showToast('Informe um e-mail valido.', 'warning');
                return;
            }

            const previousEmail = AppState.currentUser.email;
            if (email !== previousEmail && Auth.users.some(user => user.email === email)) {
                Utils.showToast('Este e-mail ja esta em uso.', 'error');
                return;
            }

            const userIndex = Auth.users.findIndex(user => user.email === previousEmail);
            if (userIndex === -1) {
                Utils.showToast('Conta nao encontrada. Faca login novamente.', 'error');
                Auth.logout();
                return;
            }

            Auth.users[userIndex].name = name;
            Auth.users[userIndex].email = email;
            if (password) {
                Auth.users[userIndex].password = password;
            }
            localStorage.setItem('amexUsers', JSON.stringify(Auth.users));

            AppState.currentUser = { name, email };
            localStorage.setItem('amexCurrentUser', JSON.stringify(AppState.currentUser));

            const loginEmailInput = document.getElementById('loginEmail');
            if (loginEmailInput) {
                loginEmailInput.value = email;
            }
            if (this.passwordInput) {
                this.passwordInput.value = '';
            }

            this.updateSummary(AppState.currentUser);
            this.updateAvatarControls();
            this.renderPurchases();
            this.updateUI();
            Auth.updateAccountState();
            Utils.showToast('Perfil atualizado com sucesso!', 'success');
        },

        updateSummary(user) {
            if (!user) {
                if (this.summaryName) this.summaryName.textContent = 'Visitante';
                if (this.summaryEmail) this.summaryEmail.textContent = '---';
                this.applyAvatarToElement(this.summaryAvatar, '', '?');
                return;
            }

            if (this.summaryName) {
                this.summaryName.textContent = user.name || 'Visitante';
            }
            if (this.summaryEmail) {
                this.summaryEmail.textContent = user.email || '---';
            }
            this.applyAvatarToElement(this.summaryAvatar, user.name, '?');
        },

        updateUI() {
            const isLogged = Auth.isAuthenticated() && !!AppState.currentUser;

            if (this.button) {
                this.button.classList.toggle('logged', isLogged);
            }

            const name = isLogged && AppState.currentUser ? AppState.currentUser.name : '';
            if (this.label) {
                this.label.textContent = isLogged ? this.getFirstName(name) : 'Entrar';
            }

            this.applyAvatarToElement(this.avatar, name, '?');
            this.updateSummary(isLogged ? AppState.currentUser : null);
            this.updateAvatarControls();
        },

        updateAvatarControls() {
            if (this.avatarReset) {
                const canReset = !!AppState.profileAvatar && Auth.isAuthenticated() && !!AppState.currentUser;
                this.avatarReset.disabled = !canReset;
            }
        },

        handleAvatarFile(file) {
            if (!Auth.isAuthenticated() || !AppState.currentUser) {
                Auth.show('loginForm');
                return;
            }

            const maxSize = 2 * 1024 * 1024;
            if (!file.type || !file.type.startsWith('image/')) {
                Utils.showToast('Selecione uma imagem valida.', 'warning');
                return;
            }
            if (file.size > maxSize) {
                Utils.showToast('Escolha uma imagem menor que 2MB.', 'warning');
                return;
            }

            const reader = new FileReader();
            reader.onload = () => {
                AppState.profileAvatar = reader.result;
                Utils.saveToStorage();
                this.updateUI();
                Utils.showToast('Foto de perfil atualizada!', 'success');
            };
            reader.onerror = () => {
                Utils.showToast('Nao foi possivel carregar a imagem.', 'error');
            };
            reader.readAsDataURL(file);
        },

        resetAvatar() {
            if (!Auth.isAuthenticated() || !AppState.currentUser) {
                Auth.show('loginForm');
                return;
            }
            if (!AppState.profileAvatar) {
                return;
            }
            AppState.profileAvatar = null;
            Utils.saveToStorage();
            this.updateUI();
            Utils.showToast('Foto de perfil removida.', 'info');
        },

        applyAvatarToElement(element, name = '', fallback = '?') {
            if (!element) {
                return;
            }
            const hasPhoto = !!AppState.profileAvatar && Auth.isAuthenticated() && !!AppState.currentUser;
            element.classList.toggle('has-photo', hasPhoto);
            if (hasPhoto) {
                element.style.backgroundImage = 'url(' + AppState.profileAvatar + ')';
                element.style.backgroundSize = 'cover';
                element.style.backgroundPosition = 'center';
                element.style.backgroundRepeat = 'no-repeat';
                element.style.backgroundColor = '#0f1e19';
                element.textContent = '';
            } else {
                element.style.backgroundImage = '';
                element.style.backgroundSize = '';
                element.style.backgroundPosition = '';
                element.style.backgroundRepeat = '';
                element.style.backgroundColor = '';
                const initial = this.getInitial(name) || fallback;
                element.textContent = initial;
            }
        },

        renderPurchases(showToast = false) {
            if (!this.historyList || !this.historyEmpty) {
                return;
            }

            const isLogged = Auth.isAuthenticated() && !!AppState.currentUser;
            const purchases = Array.isArray(AppState.purchases) ? AppState.purchases : [];

            this.historyList.innerHTML = '';

            if (!isLogged) {
                this.historyEmpty.textContent = 'Entre para visualizar suas compras.';
                this.historyEmpty.hidden = false;
                this.historyList.hidden = true;
                return;
            }

            if (!purchases.length) {
                this.historyEmpty.textContent = 'Voce ainda nao realizou nenhuma compra.';
                this.historyEmpty.hidden = false;
                this.historyList.hidden = true;
                return;
            }

            this.historyEmpty.hidden = true;
            this.historyList.hidden = false;

            purchases.forEach((purchase) => {
                const status = this.getPurchaseStatus(purchase);
                const purchaseDate = this.formatDate(purchase.purchaseDate);
                const expiresDate = purchase.expiresAt ? this.formatDate(purchase.expiresAt) : 'Sem data de expiracao';
                const item = document.createElement('li');
                item.className = 'profile-history-item';
                const detailsWrapper = document.createElement('div');
                const title = document.createElement('h5');
                title.textContent = purchase.name;
                detailsWrapper.appendChild(title);

                const meta = document.createElement('div');
                meta.className = 'profile-history-meta';

                [
                    { icon: 'fa-calendar-alt', text: purchaseDate },
                    { icon: 'fa-stopwatch', text: purchase.duration || '---' },
                    { icon: 'fa-wallet', text: Utils.formatPrice(purchase.price || 0) },
                    { icon: 'fa-hourglass-half', text: expiresDate },
                ].forEach(({ icon, text }) => {
                    const span = document.createElement('span');
                    const iconEl = document.createElement('i');
                    iconEl.className = 'fas ' + icon;
                    iconEl.setAttribute('aria-hidden', 'true');
                    span.appendChild(iconEl);
                    span.appendChild(document.createTextNode(' ' + text));
                    meta.appendChild(span);
                });

                detailsWrapper.appendChild(meta);

                const statusEl = document.createElement('div');
                statusEl.className = 'profile-history-status ' + status.className;
                const statusIcon = document.createElement('i');
                statusIcon.className = 'fas ' + status.icon;
                statusIcon.setAttribute('aria-hidden', 'true');
                const statusText = document.createElement('span');
                statusText.textContent = status.label;
                statusEl.append(statusIcon, statusText);

                item.append(detailsWrapper, statusEl);
                this.historyList.appendChild(item);
            });

            if (showToast) {
                Utils.showToast('Historico atualizado!', 'info');
            }
        },

        getPurchaseStatus(purchase) {
            if (!purchase || !purchase.expiresAt) {
                return { label: 'Acesso vitalicio', className: 'permanent', icon: 'fa-infinity' };
            }
            const expires = new Date(purchase.expiresAt);
            if (Number.isNaN(expires.getTime())) {
                return { label: 'Validade indisponivel', className: 'permanent', icon: 'fa-question-circle' };
            }
            const now = new Date();
            const diffMs = expires.getTime() - now.getTime();
            if (diffMs <= 0) {
                const overdueDays = Math.max(1, Math.floor(Math.abs(diffMs) / (1000 * 60 * 60 * 24)));
                return { label: overdueDays <= 1 ? 'Expirado' : 'Expirado ha ' + overdueDays + ' dias', className: 'expired', icon: 'fa-exclamation-triangle' };
            }
            const remainingDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
            if (remainingDays <= 1) {
                return { label: 'Expira em menos de 24h', className: 'valid', icon: 'fa-clock' };
            }
            return { label: 'Expira em ' + remainingDays + ' dias', className: 'valid', icon: 'fa-clock' };
        },

        formatDate(isoDate) {
            if (!isoDate) {
                return '--';
            }
            try {
                return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(isoDate));
            } catch (error) {
                return new Date(isoDate).toLocaleString('pt-BR');
            }
        },

        getInitial(value = '') {
            const trimmed = value.trim();
            return trimmed ? trimmed.charAt(0).toUpperCase() : '?';
        },

        getFirstName(value = '') {
            const trimmed = value.trim();
            if (!trimmed) {
                return 'Perfil';
            }
            const parts = trimmed.split(/\s+/);
            return parts.length ? parts[0] : trimmed;
        },

        onLogin() {
            this.updateUI();
            this.renderPurchases();
            Auth.updateAccountState();
        },

        onLogout() {
            if (this.modal) {
                Modal.close('profileModal');
            }
            if (this.passwordInput) {
                this.passwordInput.value = '';
            }
            this.renderPurchases();
            this.updateUI();
            Auth.updateAccountState();
        },

        onPurchaseRecorded() {
            this.renderPurchases(true);
        }
    };

    const Onboarding = {
        element: null,
        closeBtn: null,
        message: null,
        dismissed: false,

        init() {
            this.element = document.getElementById('onboardingTips');
            if (!this.element) {
                return;
            }

            this.closeBtn = document.getElementById('closeOnboardingTips');
            this.message = document.getElementById('onboardingMessage');
            this.dismissed = localStorage.getItem('amexOnboardingDismissed') === 'true';

            if (this.closeBtn) {
                this.closeBtn.addEventListener('click', () => this.hide(true));
            }

            this.element.querySelectorAll('[data-scroll-target]').forEach(card => {
                const target = card.getAttribute('data-scroll-target');
                if (!target) {
                    return;
                }

                card.addEventListener('click', (event) => {
                    if (event.target.closest('button')) {
                        return;
                    }
                    this.scrollTo(target);
                    this.hide(false);
                });

                const button = card.querySelector('button');
                if (button) {
                    button.addEventListener('click', (event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        this.scrollTo(target);
                        this.hide(false);
                    });
                }
            });

            this.element.querySelectorAll('[data-open-support]').forEach(node => {
                node.addEventListener('click', (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    Utils.openSupportChannel();
                    this.hide(false);
                });

                const button = node.querySelector('button');
                if (button) {
                    button.addEventListener('click', (event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        Utils.openSupportChannel();
                        this.hide(false);
                    });
                }
            });

            const reopenBtn = document.getElementById('accountGuideBtn');
            if (reopenBtn) {
                reopenBtn.addEventListener('click', () => {
                    this.dismissed = false;
                    localStorage.removeItem('amexOnboardingDismissed');
                    Auth.hide();
                    this.show(AppState.currentUser ? AppState.currentUser.name : '', { force: true });
                });
            }
        },

        show(name = '', options = {}) {
            if (!this.element) {
                return;
            }

            const force = options.force === true;
            if (force) {
                this.dismissed = false;
            }

            if (this.dismissed && !force) {
                return;
            }

            if (this.message) {
                if (name) {
                    const firstName = name.trim().split(/\s+/)[0] || name;
                    this.message.textContent = `Oi, ${firstName}! Comece com uma destas sugestoes.`;
                } else {
                    this.message.textContent = 'Comece com uma destas sugestoes para aproveitar melhor a loja.';
                }
            }

            this.element.removeAttribute('hidden');
            this.element.classList.add('visible');
            this.element.setAttribute('aria-hidden', 'false');

            requestAnimationFrame(() => {
                this.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            });
        },

        hide(saveState = false) {
            if (!this.element) {
                return;
            }
            this.element.classList.remove('visible');
            this.element.setAttribute('hidden', '');
            this.element.setAttribute('aria-hidden', 'true');
            if (saveState) {
                this.dismissed = true;
                localStorage.setItem('amexOnboardingDismissed', 'true');
            }
        },

        scrollTo(selector) {
            if (!selector) {
                return;
            }
            const target = document.querySelector(selector);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    };

    const Auth = {
        overlay: null,
        tabContainer: null,
        tabIndicator: null,
        tabs: [],
        forms: [],
        users: [],
        activeTabId: 'loginForm',
        handleResize: null,
        accountTab: null,
        loginTab: null,
        registerTab: null,
        accountForm: null,
        accountNameEl: null,
        accountEmailEl: null,
        accountAvatarEl: null,
        accountProfileBtn: null,
        accountLogoutBtn: null,

        init() {
            this.overlay = document.getElementById('authOverlay');
            if (!this.overlay) return;

            this.tabContainer = this.overlay.querySelector('.auth-tabs');
            this.tabIndicator = this.overlay.querySelector('.auth-tab-indicator');
            this.tabs = Array.from(this.overlay.querySelectorAll('.auth-tab'));
            this.forms = Array.from(this.overlay.querySelectorAll('.auth-form'));
            this.users = JSON.parse(localStorage.getItem('amexUsers') || '[]');
            this.accountTab = this.overlay.querySelector('.auth-tab.account-tab');
            this.loginTab = this.overlay.querySelector('.auth-tab[data-target=\"loginForm\"]');
            this.registerTab = this.overlay.querySelector('.auth-tab[data-target=\"registerForm\"]');
            this.accountForm = document.getElementById('accountForm');
            this.accountNameEl = document.getElementById('accountUserName');
            this.accountEmailEl = document.getElementById('accountUserEmail');
            this.accountAvatarEl = document.getElementById('accountAvatar');
            this.accountProfileBtn = document.getElementById('accountProfileBtn');
            this.accountLogoutBtn = document.getElementById('accountLogoutBtn');
            this.activeTabId = 'loginForm';
            if (this.tabContainer) {
                this.tabContainer.setAttribute('data-tab-count', '2');
            }

            if (this.handleResize) {
                window.removeEventListener('resize', this.handleResize);
            }
            this.handleResize = () => this.moveIndicatorTo(this.activeTabId);
            window.addEventListener('resize', this.handleResize);

            this.bindTabEvents();
            this.bindFormEvents();
            this.bindPasswordToggle();
            this.bindAccountActions();
            this.updateAccountState();

            const isLogged = this.isAuthenticated() && !!AppState.currentUser;
            if (isLogged) {
                Profile.onLogin();
                this.activate('accountForm');
                if (settings.persistAuthOnLogin) {
                    this.show('accountForm');
                } else {
                    this.hide();
                }
            } else {
                Profile.onLogout();
                this.activate('loginForm');
                if (settings.autoShowAuth || settings.persistAuthOnLogin) {
                    this.show('loginForm');
                } else {
                    this.hide();
                }
            }
        },

        bindTabEvents() {
            this.tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    const target = tab.dataset.target;
                    if (target === 'accountForm' && !this.isAuthenticated()) {
                        this.activate('loginForm');
                        return;
                    }
                    this.activate(target);
                });
            });

            this.overlay.querySelectorAll('.auth-switch a').forEach(link => {
                link.addEventListener('click', (event) => {
                    event.preventDefault();
                    const target = link.dataset.target;
                    if (target) {
                        this.activate(target);
                    }
                });
            });
        },

        moveIndicatorTo(targetId) {
            if (!this.tabIndicator || !this.tabContainer) {
                return;
            }

            const desiredTarget = targetId || this.activeTabId || 'loginForm';
            const activeTab = this.tabContainer.querySelector(`.auth-tab[data-target=\"${desiredTarget}\"]`);

            if (!activeTab || activeTab.offsetParent === null) {
                this.tabIndicator.style.opacity = '0';
                return;
            }

            window.requestAnimationFrame(() => {
                const { offsetLeft, offsetWidth } = activeTab;
                this.tabIndicator.style.opacity = '1';
                this.tabIndicator.style.transform = `translateX(${offsetLeft}px)`;
                this.tabIndicator.style.width = `${offsetWidth}px`;
            });
        },

        bindPasswordToggle() {
            this.overlay.querySelectorAll('.toggle-password').forEach(button => {
                button.addEventListener('click', () => {
                    const input = document.getElementById(button.dataset.target);
                    if (!input) return;
                    const isPassword = input.type === 'password';
                    input.type = isPassword ? 'text' : 'password';
                    button.innerHTML = isPassword
                        ? '<i class=\"fas fa-eye-slash\"></i>'
                        : '<i class=\"fas fa-eye\"></i>';
                });
            });
        },

        bindAccountActions() {
            if (this.accountProfileBtn) {
                this.accountProfileBtn.addEventListener('click', (event) => {
                    if (settings.profilePortalUrl) {
                        event.preventDefault();
                        openProfilePortal();
                        return;
                    }
                    Profile.openModal();
                });
            }

            if (this.accountLogoutBtn) {
                this.accountLogoutBtn.addEventListener('click', () => {
                    this.logout();
                });
            }
        },

        bindFormEvents() {
            const loginForm = document.getElementById('loginForm');
            const registerForm = document.getElementById('registerForm');

            if (loginForm) {
                loginForm.addEventListener('submit', (event) => {
                    event.preventDefault();
                    const email = loginForm.querySelector('#loginEmail').value.trim().toLowerCase();
                    const password = loginForm.querySelector('#loginPassword').value;
                    const user = this.users.find(u => u.email === email && u.password === password);

                    if (!user) {
                        Utils.showToast('Credenciais invalidas. Verifique e tente novamente.', 'error');
                        return;
                    }

                    localStorage.setItem('amexAuth', 'true');
                    AppState.currentUser = { name: user.name, email: user.email };
                    localStorage.setItem('amexCurrentUser', JSON.stringify(AppState.currentUser));

                    Profile.onLogin();
                    loginForm.reset();
                    if (settings.persistAuthOnLogin) {
                        this.activate('accountForm');
                        this.show('accountForm');
                    } else {
                        this.hide();
                    }

                    setTimeout(() => {
                        Utils.showWelcomeToast(user.name);
                        const pending = sessionStorage.getItem('amexPendingOnboardingName');
                        if (pending) {
                            Onboarding.show(user.name, { force: true });
                            sessionStorage.removeItem('amexPendingOnboardingName');
                        } else {
                            Onboarding.show(user.name);
                        }
                    }, 200);
                });
            }

            if (registerForm) {
                registerForm.addEventListener('submit', (event) => {
                    event.preventDefault();
                    const nickname = registerForm.querySelector('#registerName').value.trim();
                    if (!nickname) {
                        Utils.showToast('Informe um nome de usuario valido.', 'warning');
                        return;
                    }
                    const email = registerForm.querySelector('#registerEmail').value.trim().toLowerCase();
                    const password = registerForm.querySelector('#registerPassword').value;

                    if (password.length < 6) {
                        Utils.showToast('A senha deve ter pelo menos 6 caracteres.', 'warning');
                        return;
                    }

                    if (this.users.some(u => u.email === email)) {
                        Utils.showToast('Ja existe uma conta com este e-mail.', 'error');
                        this.activate('loginForm');
                        return;
                    }

                    const newUser = { name: nickname, email, password };
                    this.users.push(newUser);
                    localStorage.setItem('amexUsers', JSON.stringify(this.users));
                    sessionStorage.setItem('amexPendingOnboardingName', nickname);
                    localStorage.removeItem('amexOnboardingDismissed');
                    Utils.showToast('Cadastro realizado com sucesso, ' + nickname + '! Agora faca login.', 'success');
                    registerForm.reset();
                    this.activate('loginForm');
                    const loginEmailInput = document.getElementById('loginEmail');
                    if (loginEmailInput) {
                        loginEmailInput.value = email;
                        loginEmailInput.focus();
                    }
                    const loginPasswordInput = document.getElementById('loginPassword');
                    if (loginPasswordInput) {
                        loginPasswordInput.value = '';
                    }
                });
            }
        },

        activate(targetId = 'loginForm') {
            const isLogged = this.isAuthenticated() && !!AppState.currentUser;
            if (targetId === 'accountForm' && !isLogged) {
                targetId = 'loginForm';
            }
            if (isLogged && (targetId === 'loginForm' || targetId === 'registerForm')) {
                targetId = 'accountForm';
            }

            this.activeTabId = targetId;

            this.forms.forEach(form => {
                const isActive = form.id === targetId;
                form.classList.toggle('active', isActive);
                form.toggleAttribute('hidden', !isActive);
                form.setAttribute('aria-hidden', isActive ? 'false' : 'true');
            });
            this.tabs.forEach(tab => {
                const isActive = tab.dataset.target === targetId;
                tab.classList.toggle('active', isActive);
                tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
                tab.setAttribute('tabindex', isActive ? '0' : '-1');
            });

            this.moveIndicatorTo(targetId);
        },

        show(targetId = 'loginForm') {
            const isLogged = this.isAuthenticated() && !!AppState.currentUser;
            if (targetId === 'accountForm' && !isLogged) {
                targetId = 'loginForm';
            }
            if (isLogged && (targetId === 'loginForm' || targetId === 'registerForm')) {
                targetId = 'accountForm';
            }
            this.updateAccountState();
            this.updateCloseButton();
            this.activate(targetId);
            if (document.body.classList.contains('account-standalone')) {
                document.body.classList.remove('auth-locked');
            } else {
                document.body.classList.add('auth-locked');
            }
            this.overlay.classList.add('active');
        },

        hide() {
            document.body.classList.remove('auth-locked');
            this.overlay.classList.remove('active');
        },

        logout() {
            localStorage.removeItem('amexAuth');
            localStorage.removeItem('amexCurrentUser');
            AppState.currentUser = null;
            Profile.onLogout();
            this.show('loginForm');
            Utils.showToast('Sessao encerrada. Faca login para continuar.', 'info');
        },

        updateCloseButton() {
            const closeBtn = document.getElementById('authModalClose');
            if (!closeBtn) {
                return;
            }
            const isLogged = this.isAuthenticated() && !!AppState.currentUser;
            closeBtn.classList.toggle('visible', isLogged);
            closeBtn.setAttribute('aria-hidden', isLogged ? 'false' : 'true');
            closeBtn.removeEventListener('click', this.handleCloseClick);
            if (isLogged) {
                closeBtn.addEventListener('click', this.handleCloseClick);
            }
        },

        handleCloseClick: () => {
            Auth.hide();
        },

        updateAccountState() {
            const isLogged = this.isAuthenticated() && !!AppState.currentUser;

            if (this.accountTab) {
                this.accountTab.classList.toggle('visible', isLogged);
                this.accountTab.setAttribute('aria-hidden', isLogged ? 'false' : 'true');
                this.accountTab.toggleAttribute('disabled', !isLogged);
                this.accountTab.toggleAttribute('hidden', !isLogged);
                this.accountTab.setAttribute('tabindex', isLogged && this.accountTab.classList.contains('active') ? '0' : '-1');
                if (!isLogged) {
                    this.accountTab.blur();
                }
            }
            if (this.loginTab) {
                this.loginTab.classList.toggle('hidden', isLogged);
                this.loginTab.setAttribute('aria-hidden', isLogged ? 'true' : 'false');
                this.loginTab.toggleAttribute('hidden', isLogged);
            }
            if (this.registerTab) {
                this.registerTab.classList.toggle('hidden', isLogged);
                this.registerTab.setAttribute('aria-hidden', isLogged ? 'true' : 'false');
                this.registerTab.toggleAttribute('hidden', isLogged);
            }

            if (this.tabContainer) {
                this.tabContainer.setAttribute('data-tab-count', isLogged ? '3' : '2');
            }

            if (this.accountForm) {
                this.accountForm.classList.toggle('available', isLogged);
                this.accountForm.setAttribute('aria-hidden', isLogged ? 'false' : 'true');
                this.accountForm.toggleAttribute('hidden', !isLogged);
                if (!isLogged && this.accountForm.classList.contains('active')) {
                    this.activate('loginForm');
                }
            }

            if (this.accountNameEl) {
                this.accountNameEl.textContent = isLogged && AppState.currentUser
                    ? AppState.currentUser.name
                    : 'Visitante';
            }

            if (this.accountEmailEl) {
                this.accountEmailEl.textContent = isLogged && AppState.currentUser
                    ? AppState.currentUser.email
                    : '---';
            }

            if (this.accountAvatarEl) {
                const name = isLogged && AppState.currentUser ? AppState.currentUser.name : '';
                const initial = name ? name.trim().charAt(0).toUpperCase() : '?';
                this.accountAvatarEl.textContent = initial || '?';
            }
            this.updateCloseButton();
            this.moveIndicatorTo(this.activeTabId);
        },

        isAuthenticated() {
            return localStorage.getItem('amexAuth') === 'true';
        }
    };

    let initialized = false;

    function initialize() {
        if (initialized) {
            return;
        }
        initialized = true;
        ChatWidget.init();
        Onboarding.init();
        Profile.init();
        Auth.init();
    }

    return {
        ChatWidget,
        Profile,
        Auth,
        Onboarding,
        initialize,
        isInitialized: () => initialized
    };
}






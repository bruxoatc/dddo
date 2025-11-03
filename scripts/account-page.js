import { initAccountSuite } from './modules/account-suite.js';

const AppState = {
    cart: JSON.parse(localStorage.getItem('amexCart')) || [],
    favorites: JSON.parse(localStorage.getItem('amexFavorites')) || [],
    theme: localStorage.getItem('amexTheme') || 'light',
    currentUser: JSON.parse(localStorage.getItem('amexCurrentUser')) || null,
    purchases: JSON.parse(localStorage.getItem('amexPurchases') || '[]'),
    profileAvatar: localStorage.getItem('amexProfileAvatar') || null
};

const Utils = {
    formatPrice: (price) => {
        const value = Number.parseFloat(price || 0);
        return `R$ ${value.toFixed(2).replace('.', ',')}`;
    },

    openSupportChannel: () => {
        window.open('https://wa.me/5516992764211?text=Ola%2C%20preciso%20de%20ajuda%20com%20minha%20conta.', '_blank');
    },

    showToast: (message, type = 'info') => {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="toast-icon fas ${type === 'success' ? 'fa-check-circle' :
            type === 'error' ? 'fa-exclamation-circle' :
            type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'}"></i>
            <span class="toast-message">${message}</span>
            <button class="toast-close" type="button" aria-label="Fechar notifica&ccedil;&atilde;o">&times;</button>
        `;

        const container = document.getElementById('toastContainer');
        if (!container) {
            return;
        }

        while (container.children.length >= 4) {
            container.removeChild(container.firstElementChild);
        }
        container.appendChild(toast);

        const removeToast = () => {
            if (toast.parentNode) {
                toast.remove();
            }
        };

        toast.querySelector('.toast-close')?.addEventListener('click', removeToast);
        setTimeout(removeToast, 6000);
    },

    showWelcomeToast: (fullName = '') => {
        const firstName = (fullName || '').trim().split(/\s+/)[0] || 'Amigo';
        Utils.showToast(`Bem-vindo de volta, ${firstName}!`, 'success');
    },

    saveToStorage: () => {
        localStorage.setItem('amexCart', JSON.stringify(AppState.cart || []));
        localStorage.setItem('amexFavorites', JSON.stringify(AppState.favorites || []));
        localStorage.setItem('amexTheme', AppState.theme || 'light');
        localStorage.setItem('amexPurchases', JSON.stringify(AppState.purchases || []));
        if (AppState.profileAvatar) {
            localStorage.setItem('amexProfileAvatar', AppState.profileAvatar);
        } else {
            localStorage.removeItem('amexProfileAvatar');
        }
    }
};

const Modal = {
    open: (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            modal.hidden = false;
        }
    },
    close: (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            modal.hidden = true;
        }
    }
};

const applyTheme = () => {
    if (AppState.theme === 'dark') {
        document.body.classList.add('dark-theme');
    } else {
        document.body.classList.remove('dark-theme');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    applyTheme();

    const suite = initAccountSuite({ AppState, Utils, Modal }, {
        autoShowAuth: false,
        persistAuthOnLogin: false,
        profilePortalUrl: null,
        profilePortalTarget: '_self'
    });
    suite.initialize();

    const { Profile, Auth } = suite;

    if (Auth?.hide) {
        Auth.hide();
    }

    const guards = Array.from(document.querySelectorAll('[data-auth-guard]'));
    const actionButtons = Array.from(document.querySelectorAll('[data-action]'));

    const getFirstName = (name = '') => {
        const trimmed = name.trim();
        if (!trimmed) return '';
        return trimmed.split(/\s+/)[0];
    };

    const applyGuards = (logged) => {
        guards.forEach((element) => {
            const guard = element.dataset.authGuard;
            const shouldShow = guard === 'auth' ? logged : !logged;
            element.classList.toggle('guard-hidden', !shouldShow);
            element.setAttribute('aria-hidden', shouldShow ? 'false' : 'true');
        });
    };

    const updateChecklist = ({ logged = false, hasPurchases = false, hasActive = false } = {}) => {
        const container = document.getElementById('postPurchaseChecklist');
        if (!container) {
            return;
        }

        const setState = (step, completed) => {
            const item = container.querySelector(`[data-step="${step}"]`);
            if (!item) {
                return;
            }
            item.dataset.state = completed ? 'complete' : 'pending';
            const status = item.querySelector('[data-status]');
            if (status) {
                status.textContent = completed ? 'Concluído' : 'Pendente';
            }
        };

        setState('login', logged);
        setState('download', hasPurchases);
        setState('activate', hasActive);
        setState('support', false);
    };

    const updateDashboardStats = (logged = false) => {
        const totalEl = document.getElementById('dashboardStatTotal');
        const activeEl = document.getElementById('dashboardStatActive');
        const nextEl = document.getElementById('dashboardStatNext');
        const nextLabelEl = document.getElementById('dashboardStatNextLabel');
        const favoritesEl = document.getElementById('dashboardStatFavorites');
        const statusEl = document.getElementById('dashboardStatus');

        if (!Profile) {
            return;
        }

        const purchases = Array.isArray(AppState.purchases) ? [...AppState.purchases] : [];
        const now = Date.now();
        const dayMs = 1000 * 60 * 60 * 24;

        const statuses = purchases.map((purchase) => Profile.getPurchaseStatus
            ? Profile.getPurchaseStatus(purchase)
            : { className: 'valid' });

        const activePurchases = purchases.filter((purchase, index) => statuses[index]?.className !== 'expired');
        const upcomingExpirations = purchases
            .filter((purchase) => purchase.expiresAt)
            .map((purchase) => {
                const expiresAt = new Date(purchase.expiresAt);
                return {
                    purchase,
                    diffMs: expiresAt.getTime() - now
                };
            })
            .filter(({ diffMs }) => diffMs > 0)
            .sort((a, b) => a.diffMs - b.diffMs);

        const nextExpiration = upcomingExpirations[0] || null;
        let nextValue = '--';
        let nextLabel = 'Nenhuma expiracao proxima.';
        if (nextExpiration) {
            const days = Math.ceil(nextExpiration.diffMs / dayMs);
            nextValue = days <= 1 ? '<24h' : `${days}d`;
            nextLabel = days <= 1
                ? 'Expira em menos de 24 horas.'
                : `Renove em ate ${days} dias.`;
        }

        if (totalEl) totalEl.textContent = purchases.length.toString();
        if (activeEl) activeEl.textContent = activePurchases.length.toString();
        if (nextEl) nextEl.textContent = nextValue;
        if (nextLabelEl) nextLabelEl.textContent = nextLabel;

        const favoritesCount = Array.isArray(AppState.favorites) ? AppState.favorites.length : 0;
        if (favoritesEl) favoritesEl.textContent = favoritesCount.toString();

        if (statusEl) {
            if (purchases.length === 0) {
                statusEl.textContent = activePurchases.length ? 'Cliente ativo' : (logged ? 'Conta cadastrada' : 'Conta convidada');
            } else if (activePurchases.length > 0) {
                statusEl.textContent = 'Cliente ativo';
            } else {
                statusEl.textContent = 'Ultimas compras expiradas';
            }
        }

        updateChecklist({
            logged,
            hasPurchases: purchases.length > 0,
            hasActive: activePurchases.length > 0
        });
    };

    const applyDashboardState = () => {
        const logged = Auth?.isAuthenticated() && !!AppState.currentUser;
        applyGuards(!!logged);

        const nameEl = document.getElementById('dashboardUserName');
        const emailEl = document.getElementById('dashboardUserEmail');
        const avatarEl = document.getElementById('dashboardAvatar');
        const statusChip = document.getElementById('dashboardStatus');

        if (!logged) {
            if (nameEl) nameEl.textContent = 'Ola, visitante';
            if (emailEl) emailEl.textContent = 'Entre para visualizar suas informacoes e beneficios.';
            if (avatarEl) {
                avatarEl.classList.remove('has-photo');
                avatarEl.style.backgroundImage = '';
                avatarEl.textContent = '?';
            }
            updateDashboardStats(false);
            if (statusChip) {
                statusChip.textContent = 'Conta convidada';
            }
            return;
        }

        const fullName = AppState.currentUser?.name || 'Cliente Amex';
        const firstName = getFirstName(fullName) || 'Cliente';
        if (nameEl) {
            nameEl.textContent = `Ola, ${firstName}`;
        }
        if (emailEl) {
            emailEl.textContent = `Voce esta autenticado como ${AppState.currentUser.email}`;
        }
        if (avatarEl && Profile?.applyAvatarToElement) {
            Profile.applyAvatarToElement(avatarEl, fullName, firstName.charAt(0).toUpperCase());
        }

        updateDashboardStats(true);
    };

    const wrapProfileMethod = (methodName) => {
        if (!Profile || typeof Profile[methodName] !== 'function') {
            return;
        }
        const original = Profile[methodName].bind(Profile);
        Profile[methodName] = (...args) => {
            const result = original(...args);
            applyDashboardState();
            return result;
        };
    };

    ['updateUI', 'renderPurchases', 'onLogin', 'onLogout', 'onPurchaseRecorded'].forEach(wrapProfileMethod);
    applyDashboardState();

    const focusHistorySection = () => {
        const historySection = document.getElementById('dashboardHistory');
        if (!historySection) {
            return;
        }
        Profile?.renderPurchases();
        historySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const handleAction = (action) => {
        if (!action) {
            return;
        }
        const logged = Auth?.isAuthenticated() && !!AppState.currentUser;
        switch (action) {
            case 'edit-profile':
                if (!logged) {
                    Auth?.show('loginForm');
                    return;
                }
                Modal.open('profileModal');
                requestAnimationFrame(() => {
                    document.getElementById('profileModal')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    document.getElementById('profileName')?.focus();
                });
                break;
            case 'view-history':
            case 'open-history':
                if (!logged) {
                    Auth?.show('loginForm');
                    return;
                }
                focusHistorySection();
                break;
            case 'open-support':
                Utils.openSupportChannel();
                break;
            case 'open-login':
                Auth?.show('loginForm');
                break;
            case 'open-register':
                Auth?.show('registerForm');
                break;
            case 'manage-avatar':
                if (!logged) {
                    Auth?.show('loginForm');
                    return;
                }
                Modal.open('profileModal');
                requestAnimationFrame(() => {
                    document.getElementById('profileModal')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    document.getElementById('profileAvatarTrigger')?.focus();
                });
                break;
            case 'open-faq':
                window.open('amexstore.html#faq', '_blank');
                break;
            case 'open-preferences':
                Utils.showToast('Em breve: central de preferencias personalizadas.', 'info');
                break;
            default:
                break;
        }
    };

    actionButtons.forEach((button) => {
        button.addEventListener('click', (event) => {
            event.preventDefault();
            handleAction(button.dataset.action);
        });
    });

    const closeProfileModalBtn = document.getElementById('closeProfileModal');
    if (closeProfileModalBtn) {
        closeProfileModalBtn.addEventListener('click', () => {
            Modal.close('profileModal');
        });
    }

    const logoTrigger = document.querySelector('.account-brand');
    if (logoTrigger) {
        logoTrigger.addEventListener('click', () => {
            window.location.href = 'amexstore.html';
        });
    }

    window.addEventListener('storage', (event) => {
        if (event.key === 'amexTheme') {
            AppState.theme = event.newValue || 'light';
            applyTheme();
        } else if (event.key === 'amexPurchases') {
            try {
                AppState.purchases = JSON.parse(event.newValue || '[]');
            } catch {
                AppState.purchases = [];
            }
            applyDashboardState();
        } else if (event.key === 'amexFavorites') {
            try {
                AppState.favorites = JSON.parse(event.newValue || '[]');
            } catch {
                AppState.favorites = [];
            }
            applyDashboardState();
        } else if (event.key === 'amexProfileAvatar') {
            AppState.profileAvatar = event.newValue || null;
            applyDashboardState();
        }
    });
});

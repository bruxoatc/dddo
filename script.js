// Amex Store JavaScript - Sistema Completo de E-commerce

console.log('Amex Store carregada com sucesso!');
console.log('Dica: Tente o código Konami para uma surpresa especial!');

// Estado global da aplicação
const AppState = {
    cart: JSON.parse(localStorage.getItem('amexCart')) || [],
    favorites: JSON.parse(localStorage.getItem('amexFavorites')) || [],
    theme: localStorage.getItem('amexTheme') || 'light',
    currentUser: JSON.parse(localStorage.getItem('amexCurrentUser')) || null,
    purchases: JSON.parse(localStorage.getItem('amexPurchases') || '[]'),
    profileAvatar: localStorage.getItem('amexProfileAvatar') || null,
    coupons: {
        'DESCONTO10': { discount: 0.10, description: '10% de desconto' },
        'WELCOME': { discount: 0.15, description: '15% de desconto para novos clientes' },
        'AMEX2024': { discount: 0.20, description: '20% de desconto especial' }
    },
    appliedCoupon: null
};

// Dados dos produtos
// Referências em cache para evitar recálculos custosos
const DOMRefs = {
    cards: [],
    cardMap: new Map()
};

const AssetUtils = {
    buildSources(imagePath) {
        if (!imagePath || typeof imagePath !== 'string') {
            return null;
        }
        const base = imagePath.replace(/\.[^/.]+$/, '');
        return {
            avif: encodeURI(`${base}.avif`),
            webp: encodeURI(`${base}.webp`),
            fallback: encodeURI(imagePath)
        };
    }
};

const PriceRangeUtils = {
    parse(range) {
        if (!range || range === 'all') {
            return { min: 0, max: Infinity };
        }
        if (/\+$/.test(range)) {
            const value = parseFloat(range.replace('+', ''));
            return {
                min: Number.isFinite(value) ? value : 0,
                max: Infinity
            };
        }
        const parts = range.split('-').map(value => parseFloat(value));
        const min = Number.isFinite(parts[0]) ? parts[0] : 0;
        const max = Number.isFinite(parts[1]) ? parts[1] : Infinity;
        return { min, max };
    }
};

const PWAInstall = {
    deferredPrompt: null,
    container: null,
    installButton: null,
    dismissButton: null,
    storageKey: 'amexInstallDismissed',

    init() {
        if (typeof window === 'undefined') {
            return;
        }
        this.container = document.getElementById('installPrompt');
        if (!this.container) {
            return;
        }

        let dismissed = false;
        try {
            dismissed = localStorage.getItem(this.storageKey) === 'true';
        } catch (error) {
            console.warn('Não foi possível ler a preferência de instalação.', error);
        }
        if (dismissed) {
            return;
        }

        this.installButton = document.getElementById('installPromptAccept');
        this.dismissButton = document.getElementById('installPromptDismiss');

        window.addEventListener('beforeinstallprompt', (event) => {
            event.preventDefault();
            this.deferredPrompt = event;
            this.show();
        });

        window.addEventListener('appinstalled', () => {
            this.hide(true);
            this.deferredPrompt = null;
        });

        if (this.installButton) {
            this.installButton.addEventListener('click', () => this.install());
        }

        if (this.dismissButton) {
            this.dismissButton.addEventListener('click', () => this.hide(true));
        }
    },

    show() {
        if (!this.container) {
            return;
        }
        this.container.hidden = false;
        this.container.classList.add('visible');
    },

    hide(permanent = false) {
        if (this.container) {
            this.container.classList.remove('visible');
            this.container.hidden = true;
        }
        if (permanent) {
            try {
                localStorage.setItem(this.storageKey, 'true');
            } catch (error) {
                console.warn('Não foi possível salvar a preferência de instalação.', error);
            }
        }
    },

    async install() {
        if (!this.deferredPrompt) {
            this.hide();
            return;
        }
        if (this.installButton) {
            this.installButton.disabled = true;
        }

        try {
            this.deferredPrompt.prompt();
            const choice = await this.deferredPrompt.userChoice;
            if (choice.outcome === 'accepted') {
                Utils.showToast('Instalação iniciada. Obrigado!', 'success');
                this.hide(true);
            } else {
                Utils.showToast('Tudo bem! Você pode instalar mais tarde.', 'info');
                this.hide(false);
            }
        } catch (error) {
            console.warn('Falha ao iniciar instalação PWA.', error);
            Utils.showToast('Não foi possível iniciar a instalação agora.', 'error');
            this.hide(false);
        } finally {
            if (this.installButton) {
                this.installButton.disabled = false;
            }
            this.deferredPrompt = null;
        }
    }
};

const profileButtonInitial = typeof document !== 'undefined' ? document.getElementById('profileBtn') : null;
const profilePortalUrl = profileButtonInitial ? (profileButtonInitial.dataset.profileUrl || null) : null;
const profilePortalTarget = profileButtonInitial ? (profileButtonInitial.dataset.profileTarget || '_blank') : '_blank';

const products = [
    {
        id: 1,
        name: 'VALORANT AIM COLOR',
        description: 'Versão otimizada, super leve e fácil de usar',
        prices: [
            { duration: '1 Dia', price: 20.00, stock: 15, paymentUrl: 'https://pag.ae/7_RdWGnKn' },
            { duration: '7 Dias', price: 75.00, stock: 6, paymentUrl: 'https://pag.ae/7_RdWwvTH' },
            { duration: '30 Dias', price: 150.00, stock: 10, paymentUrl: 'https://pag.ae/7_RdW5LS2' },
            { duration: 'Lifetime', price: 375.00, stock: 5, paymentUrl: 'https://pag.ae/7_RdVct7H' }
        ],
        category: 'valorant',
        featured: true,
        inStock: true,
        image: 'Pngs/valorant aim color.png',
        rating: 4.9,
        reviews: 234,
        price: 20.00
    },
    {
        id: 2,
        name: 'VALORANT BYPASS',
        description: 'Corrija de forma rápida e prática os erros do Valorant relacionados ao TPM, Secure Boot e HVCI!',
        prices: [
            { duration: '1 Dia', price: 17.00, stock: 6, paymentUrl: 'https://pag.ae/7_RdXuVGa' },
            { duration: '7 Dias', price: 55.00, stock: 10, paymentUrl: 'https://pag.ae/7_RdXh6B2' },
            { duration: '30 Dias', price: 80.00, stock: 10, paymentUrl: 'https://pag.ae/7_RdX3rps' }
        ],
        category: 'valorant',
        featured: false,
        inStock: true,
        image: 'Pngs/VALORANT BYPASS.png',
        rating: 4.8,
        reviews: 187,
        price: 17.00
    },
    {
        id: 3,
        name: 'VALORANT NFA',
        description: 'Contas NFA verificadas e revisadas manualmente',
        prices: [
            { duration: 'Random 1-10 Skins', price: 7.00, stock: 15, paymentUrl: 'https://pag.ae/7_RqrwrsN' },
            { duration: 'Random 11-20 Skins', price: 13.00, stock: 27, paymentUrl: 'https://pag.ae/7_RqrRuHH' },
            { duration: 'Random 21-30 Skins', price: 17.00, stock: 11, paymentUrl: 'https://pag.ae/7_Rqs5Yba' },
            { duration: 'Random 31-40 Skins', price: 25.00, stock: 0, paymentUrl: null },
            { duration: 'Random 41-50 Skins', price: 30.00, stock: 2, paymentUrl: 'https://pag.ae/7_RqsMzTR' },
            { duration: 'Random 51-80 Skins', price: 35.00, stock: 2, paymentUrl: 'https://pag.ae/7_RqtiT9s' },
            { duration: 'Random 81-100 Skins', price: 40.00, stock: 0, paymentUrl: null },
            { duration: 'Random 100-150 Skins', price: 45.00, stock: 1, paymentUrl: 'https://pag.ae/7_RqtNSm9' },
            { duration: 'Random 150-200 Skins', price: 60.00, stock: 0, paymentUrl: null },
            { duration: '200+ Skins', price: 75.00, stock: 0, paymentUrl: null }
        ],
        category: 'valorant',
        featured: false,
        inStock: true,
        image: 'Pngs/VALORANT NFA.png',
        rating: 4.7,
        reviews: 412,
        price: 7.00
    },
    {
        id: 4,
        name: 'LEAGUEOF',
        description: 'Ferramentas avançadas para League of Legends',
        prices: [
            { duration: '7 Dias', price: 75.00, stock: Infinity, paymentUrl: 'https://pag.ae/7_RWGq_B9' },
            { duration: '30 Dias', price: 100.00, stock: Infinity, paymentUrl: 'https://pag.ae/7_RWGUnHP' }
        ],
        category: 'league',
        featured: false,
        inStock: true,
        image: 'Pngs/LEAGUEOFMENU.png',
        rating: 4.6,
        reviews: 158,
        price: 75.00
    },
    {
        id: 5,
        name: 'VALORANT NFA ALEATÓRIA',
        description: 'Conta Valorant NFA com conteúdo aleatório',
        prices: [
            { duration: 'Conta Aleatória', price: 5.00, stock: 175, paymentUrl: 'https://pag.ae/7_RWNVFNP' }
        ],
        category: 'valorant',
        featured: false,
        inStock: true,
        image: 'Pngs/VAVAALE.png',
        rating: 4.5,
        reviews: 289,
        price: 5.00
    }
];

const productMap = new Map(products.map(product => [product.id, product]));

function cacheProductCards() {
    const cards = Array.from(document.querySelectorAll('.product-card'));
    DOMRefs.cards = cards;
    DOMRefs.cardMap.clear();

    cards.forEach(card => {
        const id = parseInt(card.dataset.productId, 10);
        const product = productMap.get(id);
        if (!product) {
            return;
        }

        DOMRefs.cardMap.set(id, { card, product });
        card.dataset.searchText = `${product.name} ${product.description} ${product.category}`.toLowerCase();
        card.dataset.category = product.category || 'uncategorized';

        const basePrice = typeof product.price === 'number'
            ? product.price
            : (Array.isArray(product.prices) && product.prices.length ? product.prices[0].price : 0);
        const hasStock = (() => {
            if (product.inStock === false) {
                return false;
            }
            if (Array.isArray(product.prices)) {
                return product.prices.some(option => typeof option.stock !== 'number' || option.stock > 0);
            }
            return true;
        })();

        card.dataset.price = Number.isFinite(basePrice) ? String(basePrice) : '';
        card.dataset.stock = hasStock ? 'available' : 'out';
    });
}

function ensureProductCache() {
    if (DOMRefs.cards.length === 0) {
        cacheProductCards();
    }
}

// Utilitários
const Utils = {
    formatPrice: (price) => `R$ ${price.toFixed(2).replace('.', ',')}`,

    openSupportChannel: () => {
        const fallback = () => {
            console.warn('ChatWidget indisponivel, usando fallback para WhatsApp.');
            window.open('https://wa.me/5516992764211?text=Ola%2C%20preciso%20de%20ajuda%20com%20minha%20compra.', '_blank');
        };

        loadAccountSuite()
            .then((suite) => {
                try {
                    suite.initialize();
                    if (suite.ChatWidget && typeof suite.ChatWidget.open === 'function') {
                        suite.ChatWidget.open();
                    } else {
                        fallback();
                    }
                } catch (error) {
                    console.warn('Falha ao abrir ChatWidget, usando fallback.', error);
                    fallback();
                }
            })
            .catch((error) => {
                console.warn('Nao foi possivel carregar modulo de suporte.', error);
                fallback();
            });
    },
    
    showToast: (message, type = 'info') => {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="toast-icon fas ${type === 'success' ? 'fa-check-circle' : 
                                    type === 'error' ? 'fa-exclamation-circle' : 
                                    type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'}"></i>
            <span class="toast-message">${message}</span>
            <button class="toast-close">&times;</button>
        `;
        
        const container = document.getElementById('toastContainer');
        if (container) {
            while (container.children.length >= 4) {
                container.removeChild(container.firstElementChild);
            }
            container.appendChild(toast);
            
            // Auto remove after 5 seconds
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 5000);
            
            // Manual close
            toast.querySelector('.toast-close').addEventListener('click', () => {
                toast.remove();
            });
        }
    },

    showWelcomeToast: (fullName = '') => {
        const container = document.getElementById('toastContainer');
        if (!container) {
            return;
        }

        while (container.children.length >= 4) {
            container.removeChild(container.firstElementChild);
        }

        const toast = document.createElement('div');
        toast.className = 'toast success welcome-toast';

        const main = document.createElement('div');
        main.className = 'toast-main';

        const icon = document.createElement('i');
        icon.className = 'toast-icon fas fa-hand-peace';

        const message = document.createElement('span');
        message.className = 'toast-message';
        const firstName = fullName.trim().split(/\s+/)[0] || 'amigo';
        message.innerHTML = `<strong>Que bom te ver, ${firstName}!</strong><small>Escolha um atalho para continuar agora mesmo.</small>`;

        const close = document.createElement('button');
        close.className = 'toast-close';
        close.setAttribute('aria-label', 'Fechar notificacao');
        close.innerHTML = '&times;';

        main.append(icon, message);

        const actions = document.createElement('div');
        actions.className = 'toast-actions';

        const recommendedBtn = document.createElement('button');
        recommendedBtn.className = 'toast-action primary';
        recommendedBtn.innerHTML = '<i class="fas fa-star"></i> Produtos';

        const cartBtn = document.createElement('button');
        cartBtn.className = 'toast-action secondary';
        cartBtn.innerHTML = '<i class="fas fa-shopping-cart"></i> Carrinho';

        actions.append(recommendedBtn, cartBtn);
        toast.append(main, actions, close);
        container.appendChild(toast);

        const removeToast = () => {
            if (toast.parentNode) {
                toast.remove();
            }
        };

        close.addEventListener('click', removeToast);

        recommendedBtn.addEventListener('click', () => {
            const productsSection = document.getElementById('produtos');
            if (productsSection) {
                productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            removeToast();
        });

        cartBtn.addEventListener('click', () => {
            const cartModal = document.getElementById('cartModal');
            if (cartModal) {
                Modal.open('cartModal');
            } else {
                Utils.showToast('Carrinho em breve!', 'info');
            }
            removeToast();
        });

        setTimeout(removeToast, 8000);
    },
    
    showLoading: (show = true) => {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            if (show) {
                overlay.classList.add('active');
            } else {
                overlay.classList.remove('active');
            }
        }
    },
    
    saveToStorage: () => {
        localStorage.setItem('amexCart', JSON.stringify(AppState.cart));
        localStorage.setItem('amexFavorites', JSON.stringify(AppState.favorites));
        localStorage.setItem('amexTheme', AppState.theme);
        localStorage.setItem('amexPurchases', JSON.stringify(AppState.purchases || []));
        if (AppState.profileAvatar) {
            localStorage.setItem('amexProfileAvatar', AppState.profileAvatar);
        } else {
            localStorage.removeItem('amexProfileAvatar');
        }
    },
    
    showConfirmModal: (title, message, contacts, warning, onConfirm, onCancel) => {
        // Remover modal existente se houver
        const existingModal = document.getElementById('confirmModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Criar modal personalizado
        const modal = document.createElement('div');
        modal.id = 'confirmModal';
        modal.className = 'modal confirm-modal active';
        modal.innerHTML = `
            <div class="modal-content confirm-modal-content">
                <div class="confirm-header">
                    <i class="fas fa-exclamation-triangle warning-icon"></i>
                    <h3>${title}</h3>
                </div>
                
                <div class="confirm-body">
                    <p class="confirm-message">${message}</p>
                    
                    <div class="contact-list">
                        ${contacts.map(contact => `
                            <div class="contact-item">
                                <i class="${contact.icon}" style="color: ${contact.color}"></i>
                                <span>${contact.text}</span>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="warning-message">
                        <i class="fas fa-exclamation-circle"></i>
                        <strong>${warning}</strong>
                    </div>
                    
                    <p class="confirm-question">Deseja continuar com a compra?</p>
                </div>
                
                <div class="confirm-actions">
                    <button class="btn-cancel" id="confirmCancel">
                        <i class="fas fa-times"></i>
                        Cancelar
                    </button>
                    <button class="btn-confirm" id="confirmOk">
                        <i class="fas fa-check"></i>
                        Continuar
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Event listeners
        document.getElementById('confirmOk').addEventListener('click', () => {
            modal.remove();
            onConfirm();
        });
        
        document.getElementById('confirmCancel').addEventListener('click', () => {
            modal.remove();
            onCancel();
        });
        
        // Fechar clicando fora
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
                onCancel();
            }
        });
        
        // Fechar com ESC
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                onCancel();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
    }
};

let accountSuitePromise = null;
const baseAccountSuiteOptions = {
    autoShowAuth: true,
    persistAuthOnLogin: false,
    profilePortalUrl,
    profilePortalTarget
};
const accountSuiteOptions = typeof window !== 'undefined' && window.AmexAccountConfig
    ? { ...baseAccountSuiteOptions, ...window.AmexAccountConfig }
    : baseAccountSuiteOptions;

function loadAccountSuite() {
    if (!accountSuitePromise) {
        accountSuitePromise = import('./scripts/modules/account-suite.js')
            .then(({ initAccountSuite }) => initAccountSuite({ AppState, Utils, Modal }, accountSuiteOptions))
            .catch((error) => {
                accountSuitePromise = null;
                throw error;
            });
    }
    return accountSuitePromise;
}

function parseDurationToDays(label = '') {
    if (!label) {
        return null;
    }
    const normalized = label.toLowerCase();
    const plain = normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (/lifetime|vitalicio|permanente|sem validade/.test(plain)) {
        return null;
    }
    const dayMatch = plain.match(/(\d+)\s*(dia|dias)/);
    if (dayMatch) {
        return Number.parseInt(dayMatch[1], 10);
    }
    const weekMatch = plain.match(/(\d+)\s*(semana|semanas)/);
    if (weekMatch) {
        return Number.parseInt(weekMatch[1], 10) * 7;
    }
    const monthMatch = plain.match(/(\d+)\s*(mes|meses)/);
    if (monthMatch) {
        return Number.parseInt(monthMatch[1], 10) * 30;
    }
    const yearMatch = plain.match(/(\d+)\s*(ano|anos)/);
    if (yearMatch) {
        return Number.parseInt(yearMatch[1], 10) * 365;
    }
    return null;
}

function recordPurchase(product, selectedPrice) {
    if (!product || !selectedPrice) {
        return null;
    }
    const now = new Date();
    const days = parseDurationToDays(selectedPrice.duration);
    const expiresAt = days ? new Date(now.getTime() + days * 24 * 60 * 60 * 1000) : null;

    const useCrypto = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function';
    const purchase = {
        id: useCrypto ? crypto.randomUUID() : `${product.id}-${Date.now()}`,
        productId: product.id,
        name: product.name,
        duration: selectedPrice.duration,
        price: selectedPrice.price,
        purchaseDate: now.toISOString(),
        expiresAt: expiresAt ? expiresAt.toISOString() : null
    };

    if (!Array.isArray(AppState.purchases)) {
        AppState.purchases = [];
    }
    AppState.purchases.unshift(purchase);
    if (AppState.purchases.length > 50) {
        AppState.purchases.length = 50;
    }
    Utils.saveToStorage();

    loadAccountSuite()
        .then(({ Profile }) => {
            if (Profile && typeof Profile.onPurchaseRecorded === 'function') {
                Profile.onPurchaseRecorded();
            }
        })
        .catch(() => {});

    return purchase;
}

// Sistema de Carrinho
const Cart = {
    add: (productId, priceOption = null) => {
        const product = productMap.get(productId);
        if (!product || !product.inStock) {
            Utils.showToast('Produto indisponível', 'error');
            return;
        }
        
        // Para produtos com múltiplas opções de preço, usar a primeira opção como padrão
        let selectedPrice = priceOption;
        if (!selectedPrice && product.prices && product.prices.length > 0) {
            selectedPrice = product.prices[0];
        }
        
        const itemKey = `${productId}-${selectedPrice ? selectedPrice.duration : 'default'}`;
        const existingItem = AppState.cart.find(item => item.key === itemKey);
        if (existingItem) {
            Utils.showToast('Produto já está no carrinho', 'warning');
            return;
        }
        
        AppState.cart.push({
            id: product.id,
            key: itemKey,
            name: product.name,
            duration: selectedPrice ? selectedPrice.duration : null,
            price: selectedPrice ? selectedPrice.price : (product.price || 0),
            quantity: 1
        });
        
        Cart.updateUI();
        Utils.saveToStorage();
        Utils.showToast('Produto adicionado ao carrinho!', 'success');
    },
    
    remove: (productId) => {
        AppState.cart = AppState.cart.filter(item => item.id !== productId);
        Cart.updateUI();
        Utils.saveToStorage();
        Utils.showToast('Produto removido do carrinho', 'info');
    },
    
    clear: () => {
        AppState.cart = [];
        AppState.appliedCoupon = null;
        Cart.updateUI();
        Utils.saveToStorage();
        Utils.showToast('Carrinho limpo', 'info');
    },
    
    updateUI: () => {
        const cartCount = document.querySelector('.cart-count');
        const cartItems = document.getElementById('cartItems');
        const cartTotal = document.getElementById('cartTotal');
        
        if (cartCount) {
            cartCount.textContent = AppState.cart.length;
        }
        
        if (cartItems) {
            if (AppState.cart.length === 0) {
                cartItems.innerHTML = '<p class="empty-cart">Seu carrinho está vazio</p>';
                if (cartTotal) cartTotal.style.display = 'none';
            } else {
                cartItems.innerHTML = AppState.cart.map(item => `
                    <div class="cart-item">
                        <div class="cart-item-info">
                            <div class="cart-item-name">${item.name}</div>
                            <div class="cart-item-price">${Utils.formatPrice(item.price)}</div>
                        </div>
                        <button class="cart-item-remove" onclick="Cart.remove(${item.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `).join('');
                
                Cart.updateTotal();
                if (cartTotal) cartTotal.style.display = 'block';
            }
        }
    },
    
    updateTotal: () => {
        const subtotal = AppState.cart.reduce((sum, item) => sum + item.price, 0);
        let discount = 0;
        
        if (AppState.appliedCoupon) {
            discount = subtotal * AppState.appliedCoupon.discount;
        }
        
        const total = subtotal - discount;
        
        const subtotalEl = document.getElementById('subtotal');
        const finalTotalEl = document.getElementById('finalTotal');
        const discountLine = document.getElementById('discountLine');
        const discountAmount = document.getElementById('discountAmount');
        
        if (subtotalEl) subtotalEl.textContent = Utils.formatPrice(subtotal);
        if (finalTotalEl) finalTotalEl.textContent = Utils.formatPrice(total);
        
        if (discountLine && discountAmount) {
            if (discount > 0) {
                discountAmount.textContent = `-${Utils.formatPrice(discount)}`;
                discountLine.style.display = 'flex';
            } else {
                discountLine.style.display = 'none';
            }
        }
    },
    
    applyCoupon: (code) => {
        const coupon = AppState.coupons[code.toUpperCase()];
        if (!coupon) {
            Utils.showToast('Cupom inválido', 'error');
            return;
        }
        
        if (AppState.cart.length === 0) {
            Utils.showToast('Adicione produtos ao carrinho primeiro', 'warning');
            return;
        }
        
        AppState.appliedCoupon = coupon;
        Cart.updateTotal();
        Utils.showToast(`Cupom aplicado: ${coupon.description}`, 'success');
        const couponInput = document.getElementById('couponInput');
        if (couponInput) couponInput.value = '';
    }
};

// Sistema de Favoritos
const Favorites = {
    toggle: (productId) => {
        const index = AppState.favorites.indexOf(productId);
        if (index === -1) {
            AppState.favorites.push(productId);
            Utils.showToast('Produto adicionado aos favoritos!', 'success');
        } else {
            AppState.favorites.splice(index, 1);
            Utils.showToast('Produto removido dos favoritos', 'info');
        }
        
        Favorites.updateUI();
        Utils.saveToStorage();
    },
    
    updateUI: () => {
        const favoritesCount = document.querySelector('.favorites-count');
        const favoritesItems = document.getElementById('favoritesItems');
        
        if (favoritesCount) {
            favoritesCount.textContent = AppState.favorites.length;
        }
        
        if (favoritesItems) {
            if (AppState.favorites.length === 0) {
                favoritesItems.innerHTML = '<p class="empty-favorites">Nenhum produto favoritado</p>';
            } else {
                const favoriteProducts = AppState.favorites
                    .map(id => productMap.get(id))
                    .filter(Boolean);
                favoritesItems.innerHTML = favoriteProducts.map(product => {
                    const displayPrice = typeof product.price === 'number'
                        ? product.price
                        : (product.prices && product.prices.length ? product.prices[0].price : 0);
                    return `
                    <div class="cart-item">
                        <div class="cart-item-info">
                            <div class="cart-item-name">${product.name}</div>
                            <div class="cart-item-price">${Utils.formatPrice(displayPrice)}</div>
                        </div>
                        <button class="cart-item-remove" onclick="Favorites.toggle(${product.id})">
                            <i class="fas fa-heart-broken"></i>
                        </button>
                    </div>
                `;
                }).join('');
            }
        }
    }
};

const FilterState = {
    searchTerm: '',
    category: 'all',
    priceRange: 'all',
    stock: 'all'
};

function applyProductVisibility() {
    ensureProductCache();
    const {
        searchTerm,
        category,
        priceRange,
        stock
    } = FilterState;

    DOMRefs.cards.forEach(card => {
        const text = card.dataset.searchText || '';
        const matchesSearch = !searchTerm || text.includes(searchTerm);
        const matchesCategory = category === 'all' || card.dataset.category === category;

        const id = parseInt(card.dataset.productId, 10);
        const entry = DOMRefs.cardMap.get(id);
        const product = entry ? entry.product : null;

        let matchesPrice = true;
        if (priceRange !== 'all' && product) {
            const basePrice = typeof product.price === 'number'
                ? product.price
                : (Array.isArray(product.prices) && product.prices.length ? product.prices[0].price : 0);
            const { min, max } = PriceRangeUtils.parse(priceRange);
            matchesPrice = basePrice >= min && basePrice <= max;
        }

        let matchesStock = true;
        if (stock !== 'all' && product) {
            const hasStock = product.inStock !== false && (
                !Array.isArray(product.prices) ||
                product.prices.some(option => typeof option.stock !== 'number' || option.stock > 0)
            );
            matchesStock = stock === 'available' ? hasStock : !hasStock;
        }

        const isVisible = matchesSearch && matchesCategory && matchesPrice && matchesStock;
        card.style.display = isVisible ? '' : 'none';
    });
}

// Sistema de Busca
const Highlights = {
    container: null,
    init() {
        this.container = document.getElementById('highlightsGrid');
        if (!this.container) {
            return;
        }

        const ranked = [...products]
            .filter(product => typeof product.rating === 'number')
            .sort((a, b) => {
                if (b.rating === a.rating) {
                    return (b.reviews || 0) - (a.reviews || 0);
                }
                return b.rating - a.rating;
            })
            .slice(0, 3);

        this.container.innerHTML = ranked.map(product => {
            const sources = AssetUtils.buildSources(product.image);
            const badge = product.rating >= 4.8 ? 'Mais vendidos' : 'Novidade';
            const description = (product.description || '').split('.').slice(0, 1).join('.').trim();
            const priceLabel = typeof product.price === 'number'
                ? `R$ ${product.price.toFixed(2).replace('.', ',')}`
                : '';
            return `
                <article class="highlight-card" data-product-id="${product.id}">
                    <div class="highlight-badge">${badge}</div>
                    ${sources ? `
                        <picture>
                            <source type="image/avif" srcset="${sources.avif}">
                            <source type="image/webp" srcset="${sources.webp}">
                            <img src="${sources.fallback}" alt="${product.name}" class="highlight-image" loading="lazy" decoding="async">
                        </picture>
                    ` : ''}
                    <div class="highlight-body">
                        <h3>${product.name}</h3>
                        <div class="highlight-meta">
                            <span class="highlight-rating"><i class="fas fa-star"></i> ${product.rating.toFixed(1)}</span>
                            <span class="highlight-reviews">${product.reviews || 0} avaliações</span>
                        </div>
                        ${description ? `<p>${description}</p>` : ''}
                        <div class="highlight-footer">
                            ${priceLabel ? `<span class="highlight-price">${priceLabel}</span>` : ''}
                            <button type="button" class="highlight-cta" data-product-id="${product.id}">
                                Ver detalhes
                            </button>
                        </div>
                    </div>
                </article>
            `;
        }).join('');

        this.container.querySelectorAll('.highlight-card, .highlight-cta').forEach(element => {
            const item = element.closest('[data-product-id]');
            if (!item) {
                return;
            }
            element.addEventListener('click', () => {
                const id = parseInt(item.dataset.productId, 10);
                Search.focusProduct(id);
            });
        });
    }
};

const CategoryTabs = {
    container: null,
    buttons: [],
    init() {
        this.container = document.getElementById('categoryTabs');
        if (!this.container) {
            return;
        }

        const categories = Array.from(new Set(products.map(product => product.category))).filter(Boolean).sort();
        const items = [{ id: 'all', label: 'Todos' }].concat(categories.map(category => ({
            id: category,
            label: category.charAt(0).toUpperCase() + category.slice(1)
        })));

        this.container.innerHTML = items.map(item => `
            <button type="button" class="category-tab" data-category="${item.id}" aria-pressed="false">${item.label}</button>
        `).join('');

        this.buttons = Array.from(this.container.querySelectorAll('.category-tab'));
        this.buttons.forEach(button => {
            button.addEventListener('click', () => {
                this.activate(button.dataset.category);
            });
        });

        this.activate('all', { skipApply: false });
    },
    activate(category, { skipApply = false } = {}) {
        FilterState.category = category;
        this.buttons.forEach(button => {
            const isActive = button.dataset.category === category;
            button.classList.toggle('active', isActive);
            button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });
        if (Filters && typeof Filters.syncCategory === 'function') {
            Filters.syncCategory(category);
        }
        if (!skipApply) {
            applyProductVisibility();
        }
    }
};

const Ratings = {
    render() {
        ensureProductCache();
        DOMRefs.cardMap.forEach(({ card, product }) => {
            if (typeof product.rating !== 'number') {
                return;
            }

            const info = card.querySelector('.product-info');
            if (!info) {
                return;
            }

            let ratingContainer = card.querySelector('.product-rating');
            if (!ratingContainer) {
                ratingContainer = document.createElement('div');
                ratingContainer.className = 'product-rating';
                const heading = info.querySelector('h3');
                if (heading) {
                    heading.insertAdjacentElement('afterend', ratingContainer);
                } else {
                    info.insertBefore(ratingContainer, info.firstChild);
                }
            }

            const reviewsTotal = product.reviews || 0;
            const badgeLabel = `Avaliação ${product.rating.toFixed(1)} de ${reviewsTotal} avaliações`;
            ratingContainer.innerHTML = `
                <span class="rating-badge" aria-label="${badgeLabel}">
                    <i class="fas fa-star"></i> ${product.rating.toFixed(1)}
                </span>
                <span class="rating-reviews">${reviewsTotal.toLocaleString('pt-BR')} avaliações</span>
            `;
        });
    }
};
const Search = {
    filter: (query = '') => {
        ensureProductCache();
        const searchTerm = query.trim().toLowerCase();
        FilterState.searchTerm = searchTerm;
        applyProductVisibility();

        const resultsContainer = document.getElementById('searchResults');
        const matchesFound = [];

        if (!resultsContainer) {
            return;
        }

        if (!searchTerm) {
            resultsContainer.innerHTML = '';
            resultsContainer.classList.remove('visible');
            return;
        }

        const normalizedTerm = searchTerm.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        products.forEach(product => {
            if (!product) {
                return;
            }
            const tokens = [
                product.name,
                product.category,
                product.description,
                ...(product.prices || []).map(price => `${price.duration} ${price.price}`)
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            const normalizedTokens = tokens.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            if (normalizedTokens.includes(normalizedTerm)) {
                matchesFound.push({
                    id: product.id,
                    product,
                    score: normalizedTokens.indexOf(normalizedTerm)
                });
            }
        });

        matchesFound.sort((a, b) => {
            const ratingDiff = (b.product.rating || 0) - (a.product.rating || 0);
            if (ratingDiff !== 0) {
                return ratingDiff;
            }
            const reviewsDiff = (b.product.reviews || 0) - (a.product.reviews || 0);
            if (reviewsDiff !== 0) {
                return reviewsDiff;
            }
            return a.score - b.score;
        });

        if (matchesFound.length === 0) {
            resultsContainer.innerHTML = '<div class="search-results-empty">Nenhum produto encontrado.</div>';
            resultsContainer.classList.add('visible');
            return;
        }

        const maxItems = 8;
        resultsContainer.innerHTML = matchesFound.slice(0, maxItems).map(match => {
            const { id, product } = match;
            const priceLabel = typeof product.price === 'number'
                ? `R$ ${product.price.toFixed(2).replace('.', ',')}`
                : '';
            const sources = AssetUtils.buildSources(product.image);
            const description = (product.description || '').split('.').slice(0, 1).join('.').trim();
            return `
                <button type="button" class="search-results-item" data-product-id="${id}">
                    ${sources ? `
                        <picture>
                            <source type="image/avif" srcset="${sources.avif}">
                            <source type="image/webp" srcset="${sources.webp}">
                            <img src="${sources.fallback}" alt="${product.name}" class="search-result-thumb" loading="lazy" decoding="async">
                        </picture>
                    ` : ''}
                    <div class="item-info">
                        <span class="item-name">${product.name}</span>
                        ${description ? `<span class="item-desc">${description}</span>` : ''}
                    </div>
                    <span class="item-price">${priceLabel}</span>
                </button>
            `;
        }).join('');

        resultsContainer.classList.add('visible');

        Array.from(resultsContainer.querySelectorAll('.search-results-item')).forEach(item => {
            item.addEventListener('click', () => {
                const productId = parseInt(item.dataset.productId, 10);
                Search.focusProduct(productId);
                resultsContainer.classList.remove('visible');
            });
        });
    },

    focusProduct: (productId) => {
        if (CategoryTabs && typeof CategoryTabs.activate === 'function') {
            CategoryTabs.activate('all', { skipApply: false });
        }
        const card = document.querySelector(`.product-card[data-product-id="${productId}"]`);
        if (!card) {
            return;
        }

        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        card.classList.add('search-highlight');

        setTimeout(() => {
            card.classList.remove('search-highlight');
        }, 1600);
    }
};

// Sistema de Filtros
const Filters = {
    panel: null,
    form: null,
    categorySelect: null,
    priceSelect: null,
    stockSelect: null,
    toggleButton: null,
    resetButton: null,
    overlay: null,
    activeSummary: null,
    activeCountLabel: null,
    toggleCount: null,
    resizeHandler: null,

    init() {
        this.panel = document.getElementById('filtersPanel');
        this.form = document.getElementById('filtersForm');
        this.categorySelect = document.getElementById('filterCategory');
        this.priceSelect = document.getElementById('filterPrice');
        this.stockSelect = document.getElementById('filterStock');
        this.toggleButton = document.getElementById('filtersToggle');
        this.resetButton = document.getElementById('filtersReset');
        this.overlay = document.getElementById('filtersOverlay');
        this.activeSummary = document.getElementById('filtersActiveSummary');
        this.activeCountLabel = document.getElementById('filtersActiveCount');
        this.toggleCount = document.getElementById('filtersToggleCount');

        this.populateCategories();

        if (this.form) {
            this.form.addEventListener('change', () => this.apply());
        }

        if (this.toggleButton && this.panel) {
            this.toggleButton.addEventListener('click', () => {
                const isOpen = this.panel.classList.toggle('filters-panel--open');
                this.toggleButton.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
                if (this.overlay) {
                    this.overlay.hidden = !isOpen;
                }
                if (isOpen && typeof this.panel.focus === 'function') {
                    this.panel.focus();
                }
                this.updatePanelA11y();
            });
        }

        if (this.overlay) {
            this.overlay.addEventListener('click', () => this.close());
        }

        if (this.resetButton) {
            this.resetButton.addEventListener('click', () => this.clear());
        }

        this.apply({ skipToast: true, skipSyncCategory: true });
        this.updateActiveSummary();
        this.updatePanelA11y();

        if (typeof window !== 'undefined') {
            this.resizeHandler = () => this.updatePanelA11y();
            window.addEventListener('resize', this.resizeHandler);
        }
    },

    populateCategories() {
        if (!this.categorySelect) {
            return;
        }

        const categories = Array.from(new Set(
            products.map(product => product.category).filter(Boolean)
        )).sort();

        const options = ['<option value="all">Todas</option>'].concat(
            categories.map(category => `<option value="${category}">${category.charAt(0).toUpperCase()}${category.slice(1)}</option>`)
        );

        this.categorySelect.innerHTML = options.join('');
        this.categorySelect.value = FilterState.category || 'all';
    },

    apply({ skipToast = false, skipSyncCategory = false } = {}) {
        const previousState = { ...FilterState };

        if (this.categorySelect) {
            const categoryValue = this.categorySelect.value || 'all';
            if (FilterState.category !== categoryValue) {
                FilterState.category = categoryValue;
                if (!skipSyncCategory && CategoryTabs && typeof CategoryTabs.activate === 'function') {
                    CategoryTabs.activate(categoryValue, { skipApply: true });
                }
            }
        }

        if (this.priceSelect) {
            FilterState.priceRange = this.priceSelect.value || 'all';
        }

        if (this.stockSelect) {
            FilterState.stock = this.stockSelect.value || 'all';
        }

        applyProductVisibility();
        this.updateActiveSummary();

        const hasChanged = previousState.category !== FilterState.category ||
            previousState.priceRange !== FilterState.priceRange ||
            previousState.stock !== FilterState.stock;

        if (!skipToast && hasChanged) {
            Utils.showToast('Filtros atualizados', 'info');
        }

        if (window.matchMedia('(max-width: 1024px)').matches) {
            this.close();
        }

        this.updatePanelA11y();
    },

    clear() {
        const hadActive = this.getActiveCount() > 0;

        if (this.categorySelect) {
            this.categorySelect.value = 'all';
        }
        if (this.priceSelect) {
            this.priceSelect.value = 'all';
        }
        if (this.stockSelect) {
            this.stockSelect.value = 'all';
        }

        if (CategoryTabs && typeof CategoryTabs.activate === 'function') {
            CategoryTabs.activate('all', { skipApply: true });
        }

        this.apply({ skipToast: true, skipSyncCategory: true });
        if (hadActive) {
            Utils.showToast('Filtros limpos', 'success');
        }
        this.close();
    },

    close() {
        if (this.panel) {
            this.panel.classList.remove('filters-panel--open');
        }
        if (this.toggleButton) {
            this.toggleButton.setAttribute('aria-expanded', 'false');
        }
        if (this.overlay) {
            this.overlay.hidden = true;
        }
        this.updatePanelA11y();
    },

    syncCategory(category) {
        if (this.categorySelect) {
            this.categorySelect.value = category || 'all';
        }
        this.updateActiveSummary();
    },

    updateActiveSummary() {
        const activeCount = this.getActiveCount();
        if (this.activeSummary && this.activeCountLabel) {
            if (activeCount === 0) {
                this.activeSummary.hidden = true;
            } else {
                this.activeSummary.hidden = false;
                this.activeCountLabel.textContent = activeCount === 1
                    ? '1 filtro ativo'
                    : `${activeCount} filtros ativos`;
            }
        }

        if (this.toggleCount) {
            if (activeCount === 0) {
                this.toggleCount.hidden = true;
            } else {
                this.toggleCount.hidden = false;
                this.toggleCount.textContent = activeCount;
            }
        }
    },

    getActiveCount() {
        let count = 0;
        if (FilterState.category !== 'all') count += 1;
        if (FilterState.priceRange !== 'all') count += 1;
        if (FilterState.stock !== 'all') count += 1;
        return count;
    },

    updatePanelA11y() {
        if (!this.panel) {
            return;
        }
        if (typeof window === 'undefined') {
            this.panel.setAttribute('aria-hidden', 'false');
            return;
        }
        const isMobile = window.matchMedia('(max-width: 1024px)').matches;
        const isOpen = this.panel.classList.contains('filters-panel--open');
        this.panel.setAttribute('aria-hidden', isMobile && !isOpen ? 'true' : 'false');
        if (!isMobile && this.overlay) {
            this.overlay.hidden = true;
        }
    }
};

// Sistema de Tema
const Theme = {
    toggle: () => {
        AppState.theme = AppState.theme === 'light' ? 'dark' : 'light';
        Theme.apply();
        Utils.saveToStorage();
        
        const icon = document.querySelector('#themeToggle i');
        if (icon) {
            icon.className = AppState.theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
        
        Utils.showToast(`Tema ${AppState.theme === 'dark' ? 'escuro' : 'claro'} ativado`, 'success');
    },
    
    apply: () => {
        if (AppState.theme === 'dark') {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
    }
};

// Sistema de Modais
const Modal = {
    open: (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
        }
    },
    
    close: (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
    }
};
// Botão Voltar ao Topo
const BackToTop = {
    init: () => {
        const button = document.getElementById('backToTop');
        if (!button) return;
        
        const updateVisibility = () => {
            const shouldShow = window.pageYOffset > 300;
            button.classList.toggle('visible', shouldShow);
        };

        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    updateVisibility();
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
        updateVisibility();
        
        button.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
};

// Função para adicionar ao carrinho com opção específica
function addToCartWithOption(productId, priceIndex, buttonElement) {
    const product = productMap.get(productId);
    if (!product || !product.inStock) {
        Utils.showToast('Produto indisponível', 'error');
        return;
    }
    
    if (!product.prices || !product.prices[priceIndex]) {
        Utils.showToast('Opção de preço inválida', 'error');
        return;
    }
    
    const selectedPrice = product.prices[priceIndex];
    
    // Verificar estoque
    if (typeof selectedPrice.stock === 'number' && selectedPrice.stock <= 0) {
        Utils.showToast('Produto fora de estoque', 'error');
        return;
    }
    
    if (!selectedPrice.paymentUrl) {
        Utils.showToast('Link de pagamento indisponível para esta opção', 'error');
        return;
    }
    
    // Adicionar loading ao botão
    const button = buttonElement || (typeof event !== 'undefined' ? (event.currentTarget || event.target) : null);
    const originalText = button ? button.innerHTML : '';
    
    if (button) {
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';
        button.disabled = true;
    }
    
    // Mostrar modal personalizado de confirmação
    Utils.showConfirmModal(
        'IMPORTANTE - LEIA COM ATENÇÃO',
        `Após realizar o pagamento, você DEVE enviar o comprovante para:`,
        [
            { icon: 'fab fa-whatsapp', text: 'WhatsApp: (16) 99276-4211', color: '#25D366' },
            { icon: 'fab fa-discord', text: 'Discord: 9797x', color: '#5865F2' }
        ],
        'Sem o comprovante, seu produto NÃO será entregue!',
        () => {
            // Callback de confirmação
            proceedWithPurchase(productId, priceIndex, selectedPrice, button, originalText);
        },
        () => {
            // Callback de cancelamento
            if (button) {
                button.innerHTML = originalText;
                button.disabled = false;
            }
            Utils.showToast('Compra cancelada', 'info');
        }
    );
}


if (typeof window !== 'undefined') {
    window.addToCartWithOption = addToCartWithOption;
}

function proceedWithPurchase(productId, priceIndex, selectedPrice, button, originalText) {
    const product = productMap.get(productId);
    
    // Limpar carrinho (apenas 1 produto por compra)
    AppState.cart = [];
    
    // Adicionar produto ao carrinho
    const itemKey = `${productId}-${priceIndex}`;
    AppState.cart.push({
        id: product.id,
        key: itemKey,
        name: `${product.name} (${selectedPrice.duration})`,
        price: selectedPrice.price,
        duration: selectedPrice.duration,
        quantity: 1,
        paymentUrl: selectedPrice.paymentUrl
    });
    
    Cart.updateUI();
    Utils.saveToStorage();
    
    // Mostrar feedback visual melhorado
    if (button) {
        button.innerHTML = '<i class="fas fa-check"></i> Adicionado!';
        button.style.background = '#10b981';
    }
    
    // Mostrar toast e redirecionar automaticamente
    Utils.showToast(`${product.name} (${selectedPrice.duration}) adicionado! Redirecionando para pagamento...`, 'success');
    
    // Redirecionar para a página de pagamento após 2 segundos
    setTimeout(() => {
        if (selectedPrice.paymentUrl) {
            window.open(selectedPrice.paymentUrl, '_blank');
            // Restaurar botão após redirecionamento
            if (button) {
                setTimeout(() => {
                    button.innerHTML = originalText;
                    button.disabled = false;
                    button.style.background = '';
                }, 1000);
            }
        } else if (button) {
            Utils.showToast('Link de pagamento não encontrado', 'error');
            button.innerHTML = originalText;
            button.disabled = false;
            button.style.background = '';
        }
    }, 2000);
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    const ensureAccountSuite = () => loadAccountSuite().then((suite) => {
        suite.initialize();
        return suite;
    });

    cacheProductCards();
    Filters.init();
    PWAInstall.init();
    Highlights.init();
    CategoryTabs.init();
    Ratings.render();
    applyProductVisibility();

    if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
            ensureAccountSuite().catch(() => {});
        });
    } else {
        setTimeout(() => {
            ensureAccountSuite().catch(() => {});
        }, 1200);
    }

    const profileButton = document.getElementById('profileBtn');
    if (profileButton) {
        let profileWarmed = false;
        const warmupProfile = () => {
            if (profileWarmed) {
                return;
            }
            profileWarmed = true;
            ensureAccountSuite().catch(() => {});
        };

        const openProfileArea = (event) => {
            warmupProfile();
            const targetUrl = profilePortalUrl;
            if (targetUrl) {
                event.preventDefault();
                if (profilePortalTarget === '_self') {
                    window.location.href = targetUrl;
                } else {
                    const newWindow = window.open(targetUrl, '_blank');
                    if (newWindow) {
                        newWindow.opener = null;
                    } else {
                        Utils.showToast('Permita pop-ups para abrir a area de conta.', 'warning');
                    }
                }
                return;
            }

            ensureAccountSuite()
                .then(({ Auth }) => {
                    if (!Auth.isAuthenticated() || !AppState.currentUser) {
                        Auth.show('loginForm');
                    } else {
                        Auth.show('accountForm');
                    }
                })
                .catch(() => {
                    Utils.showToast('Nao foi possivel carregar o modulo de conta. Tente novamente.', 'error');
                });
        };

        profileButton.addEventListener('click', openProfileArea);
        profileButton.addEventListener('pointerenter', warmupProfile, { once: true });
        profileButton.addEventListener('mouseenter', warmupProfile, { once: true });
        profileButton.addEventListener('focus', warmupProfile, { once: true });
    }

    const supportButton = document.getElementById('supportChatBtn');
    if (supportButton) {
        let chatWarmed = false;
        const warmupChat = () => {
            if (chatWarmed) {
                return;
            }
            chatWarmed = true;
            ensureAccountSuite().catch(() => {});
        };

        supportButton.addEventListener('pointerenter', warmupChat, { once: true });
        supportButton.addEventListener('mouseenter', warmupChat, { once: true });

        const preloadChat = (event) => {
            warmupChat();
            event.preventDefault();
            ensureAccountSuite()
                .then(({ ChatWidget }) => {
                    if (ChatWidget && typeof ChatWidget.open === 'function') {
                        ChatWidget.open();
                    } else {
                        Utils.openSupportChannel();
                    }
                })
                .catch(() => Utils.openSupportChannel());
        };
        supportButton.addEventListener('click', preloadChat, { once: true });
    }
    cacheProductCards();

    // Aplicar tema salvo
    Theme.apply();
    
    // Atualizar UIs
    Cart.updateUI();
    Favorites.updateUI();
    
    // Inicializar botão voltar ao topo
    BackToTop.init();
    
    // Event Listeners
    
    // Busca
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const searchResults = document.getElementById('searchResults');
    const searchContainer = searchInput ? searchInput.closest('.search-container') : null;
    
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const value = e.target.value;
            searchTimeout = setTimeout(() => Search.filter(value), 120);
        });

        searchInput.addEventListener('focus', () => {
            if (searchResults && searchInput.value.trim()) {
                Search.filter(searchInput.value);
            }
        });

        searchInput.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && searchResults) {
                searchResults.classList.remove('visible');
                searchResults.innerHTML = '';
            } else if (event.key === 'Enter') {
                event.preventDefault();
                Search.filter(searchInput.value);
            }
        });
    }
    
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            if (searchInput) {
                Search.filter(searchInput.value);
            }
        });
    }

    if (searchResults && searchContainer) {
        document.addEventListener('click', (event) => {
            if (!searchContainer.contains(event.target)) {
                searchResults.classList.remove('visible');
            }
        });
    }
    
    // Tema
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', Theme.toggle);
    }
    
    // Carrinho
    const cartBtn = document.getElementById('cartBtn');
    const closeCartModal = document.getElementById('closeCartModal');
    const clearCart = document.getElementById('clearCart');
    
    if (cartBtn) cartBtn.addEventListener('click', () => Modal.open('cartModal'));
    if (closeCartModal) closeCartModal.addEventListener('click', () => Modal.close('cartModal'));
    if (clearCart) clearCart.addEventListener('click', Cart.clear);
    
    // Favoritos
    const favoritesBtn = document.getElementById('favoritesBtn');
    const closeFavoritesModal = document.getElementById('closeFavoritesModal');
    
    if (favoritesBtn) favoritesBtn.addEventListener('click', () => Modal.open('favoritesModal'));
    if (closeFavoritesModal) closeFavoritesModal.addEventListener('click', () => Modal.close('favoritesModal'));

    ensureAccountSuite()
        .then(({ Auth, Onboarding }) => {
            if (Auth.isAuthenticated() && AppState.currentUser) {
                setTimeout(() => {
                    Onboarding.show(AppState.currentUser.name);
                }, 200);
            }
        })
        .catch(() => {});
    
    // Cupons
    const applyCoupon = document.getElementById('applyCoupon');
    if (applyCoupon) {
        applyCoupon.addEventListener('click', () => {
            const couponInput = document.getElementById('couponInput');
            if (couponInput && couponInput.value) {
                Cart.applyCoupon(couponInput.value);
            }
        });
    }
    
    // Checkout
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (AppState.cart.length === 0) {
                Utils.showToast('Carrinho vazio', 'warning');
                return;
            }
            
            // Pegar o primeiro item do carrinho (só pode ter 1)
            const cartItem = AppState.cart[0];
            if (!cartItem || !cartItem.paymentUrl) {
                Utils.showToast('Link de pagamento não encontrado', 'error');
                return;
            }
            
            // Fechar modal do carrinho primeiro
            Modal.close('cartModal');
            
            // Mostrar modal personalizado de confirmação
            Utils.showConfirmModal(
                'IMPORTANTE - LEIA COM ATENÇÃO',
                `Após realizar o pagamento, você DEVE enviar o comprovante para:`,
                [
                    { icon: 'fab fa-whatsapp', text: 'WhatsApp: (16) 99276-4211', color: '#25D366' },
                    { icon: 'fab fa-discord', text: 'Discord: 9797x', color: '#5865F2' }
                ],
                'Sem o comprovante, seu produto NÃO será entregue!',
                () => {
                    // Callback de confirmação
                    Utils.showLoading(true);
                    
                    setTimeout(() => {
                        Utils.showLoading(false);
                        Utils.showToast('Redirecionando para pagamento...', 'success');
                        
                        // Redirecionar para o link de pagamento específico
                        setTimeout(() => {
                            window.open(cartItem.paymentUrl, '_blank');
                        }, 1000);
                    }, 1000);
                },
                () => {
                    // Callback de cancelamento
                    Utils.showToast('Compra cancelada', 'info');
                }
            );
        });
    }
    
    // Botões de compra
    document.querySelectorAll('.buy-btn:not(.disabled)').forEach((button, index) => {
        button.addEventListener('click', () => {
            const product = products[index];
            if (product && product.inStock) {
                // Adicionar loading state
                const originalText = button.innerHTML;
                button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adicionando...';
                button.disabled = true;
                
                setTimeout(() => {
                    Cart.add(product.id);
                    button.innerHTML = originalText;
                    button.disabled = false;
                }, 1000);
            }
        });
    });
    
    // Fechar modais clicando fora
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
});

// Código Konami (Easter Egg)
let konamiCode = [];
const konamiSequence = [
    'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
    'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
    'KeyB', 'KeyA'
];

document.addEventListener('keydown', (e) => {
    konamiCode.push(e.code);
    
    if (konamiCode.length > konamiSequence.length) {
        konamiCode.shift();
    }
    
    if (JSON.stringify(konamiCode) === JSON.stringify(konamiSequence)) {
        console.log('🎉 Código Konami ativado!');
        document.body.style.transform = 'rotate(360deg)';
        document.body.style.transition = 'transform 2s ease';
        
        setTimeout(() => {
            document.body.style.transform = '';
            Utils.showToast('🎮 Easter Egg encontrado! Parabéns! 🎉', 'success');
        }, 2000);
        
        konamiCode = [];
    }
});

// Contar produtos em destaque
const featuredCount = products.filter(product => product.featured).length;
console.log(`${featuredCount} produto(s) em destaque encontrado(s)`);

// Smooth scroll para links internos
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Animação de entrada dos cards
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observar cards de produtos
ensureProductCache();
DOMRefs.cards.forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(card);
});





















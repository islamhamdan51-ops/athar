/**
 * PWAController — أَثَر | ATHAR
 * إدارة كاملة لدورة حياة تطبيق الويب التقدمي (PWA)
 * تسجيل Service Worker، إشعارات التثبيت على أندرويد وآيفون وسطح المكتب
 */

export class AtharPWAController {
  constructor() {
    this.deferredPrompt = null;
    this.isStandalone = this.checkIsStandalone();
    this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

    this.initDOM();
    this.registerServiceWorker();
    this.initInstallEvents();
    this.initNetworkStatusEvents();
  }

  checkIsStandalone() {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      document.referrer.includes('android-app://')
    );
  }

  initDOM() {
    this.headerBtn = document.getElementById('pwaHeaderInstallBtn');
    this.drawerItem = document.getElementById('pwaDrawerInstallItem');
    this.drawerBtn = document.getElementById('pwaDrawerInstallBtn');
    this.banner = document.getElementById('pwaInstallBanner');
    this.bannerInstallBtn = document.getElementById('pwaBannerInstallBtn');
    this.bannerDismissBtn = document.getElementById('pwaBannerDismissBtn');
    this.iosModal = document.getElementById('iosInstallModal');
    this.iosCloseBtn = document.getElementById('iosModalCloseBtn');
    this.iosConfirmBtn = document.getElementById('iosModalConfirmBtn');

    if (this.isStandalone) {
      document.documentElement.classList.add('is-pwa-standalone');
      return;
    }

    // On iOS Safari outside standalone, show install options
    if (this.isIOS && !this.isStandalone) {
      if (this.drawerItem) this.drawerItem.style.display = 'block';
      if (this.headerBtn) this.headerBtn.style.display = 'inline-flex';
    }
  }

  registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js', { scope: '/' })
          .then((registration) => {
            console.log('ATHAR PWA ServiceWorker registered with scope:', registration.scope);

            // Check for updates
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    console.log('ATHAR PWA New version available!');
                  }
                });
              }
            });
          })
          .catch((err) => {
            console.warn('ATHAR PWA ServiceWorker registration failed:', err);
          });
      });
    }
  }

  initInstallEvents() {
    // Intercept native beforeinstallprompt (Android / Chrome / Edge)
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;

      // Reveal install triggers
      if (this.headerBtn) this.headerBtn.style.display = 'inline-flex';
      if (this.drawerItem) this.drawerItem.style.display = 'block';

      // Check if user dismissed recently
      const dismissedTime = localStorage.getItem('athar-pwa-dismissed');
      const now = Date.now();
      const threeDaysMs = 3 * 24 * 60 * 60 * 1000;

      if (!dismissedTime || (now - parseInt(dismissedTime, 10)) > threeDaysMs) {
        setTimeout(() => {
          if (this.banner && !this.isStandalone) {
            this.banner.style.display = 'block';
          }
        }, 3000);
      }
    });

    // Handle install clicks
    const triggerInstall = () => {
      if (this.deferredPrompt) {
        this.deferredPrompt.prompt();
        this.deferredPrompt.userChoice.then((choice) => {
          if (choice.outcome === 'accepted') {
            console.log('ATHAR PWA installation accepted by user');
            this.hideAllInstallPrompts();
          }
          this.deferredPrompt = null;
        });
      } else if (this.isIOS) {
        this.showIOSModal();
      }
    };

    if (this.headerBtn) this.headerBtn.addEventListener('click', triggerInstall);
    if (this.drawerBtn) this.drawerBtn.addEventListener('click', triggerInstall);
    if (this.bannerInstallBtn) this.bannerInstallBtn.addEventListener('click', triggerInstall);

    if (this.bannerDismissBtn) {
      this.bannerDismissBtn.addEventListener('click', () => {
        if (this.banner) this.banner.style.display = 'none';
        localStorage.setItem('athar-pwa-dismissed', Date.now().toString());
      });
    }

    // App successfully installed
    window.addEventListener('appinstalled', () => {
      console.log('ATHAR PWA Installed successfully!');
      this.hideAllInstallPrompts();
      document.documentElement.classList.add('is-pwa-standalone');
    });

    // Wire iOS modal buttons
    if (this.iosCloseBtn) this.iosCloseBtn.addEventListener('click', () => this.hideIOSModal());
    if (this.iosConfirmBtn) this.iosConfirmBtn.addEventListener('click', () => this.hideIOSModal());
  }

  showIOSModal() {
    if (this.iosModal) this.iosModal.style.display = 'flex';
  }

  hideIOSModal() {
    if (this.iosModal) this.iosModal.style.display = 'none';
  }

  hideAllInstallPrompts() {
    if (this.banner) this.banner.style.display = 'none';
    if (this.headerBtn) this.headerBtn.style.display = 'none';
    if (this.drawerItem) this.drawerItem.style.display = 'none';
  }

  initNetworkStatusEvents() {
    const showToast = (message, isOnline) => {
      let toast = document.getElementById('pwaNetworkToast');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'pwaNetworkToast';
        toast.style.cssText = `
          position: fixed;
          top: calc(var(--header-height) + 12px);
          left: 50%;
          transform: translateX(-50%);
          z-index: 999;
          padding: 8px 18px;
          border-radius: var(--radius-full);
          font-size: 0.88rem;
          font-weight: 600;
          box-shadow: var(--shadow-lg);
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        `;
        document.body.appendChild(toast);
      }

      if (isOnline) {
        toast.style.background = 'rgba(16, 185, 129, 0.95)';
        toast.style.color = '#06110c';
        toast.innerHTML = `<span>🟢</span><span>تمت استعادة الاتصال بالإنترنت</span>`;
      } else {
        toast.style.background = 'rgba(245, 158, 11, 0.95)';
        toast.style.color = '#06110c';
        toast.innerHTML = `<span>⚡</span><span>أنت تتصفح أثر دون اتصال بالإنترنت (الوضع المحفوظ)</span>`;
      }

      toast.style.display = 'flex';
      setTimeout(() => {
        if (toast) toast.style.display = 'none';
      }, 4000);
    };

    window.addEventListener('online', () => showToast('online', true));
    window.addEventListener('offline', () => showToast('offline', false));
  }
}

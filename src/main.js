/**
 * أَثَر | ATHAR — المنصة الرقمية للأناشيد والذاكرة البصرية
 * التطبيق الرئيسي وإدارة الحالة والتنقل السلس
 */

import { GHARSA_ALBUM, REHLA_ALBUM_TEASER } from './data/tracks.js';
import { GALLERY_ITEMS, GALLERY_CATEGORIES } from './data/gallery.js';
import { PARTNERS_INFO } from './data/partners.js';
import { AtharAudioPlayer } from './components/AudioPlayer.js';
import { MemoryGallery } from './components/MemoryGallery.js';
import { AtharPWAController } from './components/PWAController.js';

class AtharApp {
  constructor() {
    this.currentView = 'home';
    this.currentLyricsTrackIndex = 0;
    this.tracks = GHARSA_ALBUM.tracks;
    this.galleryItems = GALLERY_ITEMS;

    // Initialize Audio Player once (Persistent)
    this.player = new AtharAudioPlayer(this.tracks, (track, index) => {
      this.handleTrackChange(track, index);
    });

    // Register live photo slideshow listener
    this.player.registerPhotoListener((photo, index) => {
      this.handlePhotoChange(photo, index);
    });

    // Initialize Progressive Web App (PWA) controller
    this.pwa = new AtharPWAController();

    this.initDOM();
    this.initTheme();
    this.initEvents();
    this.render();
  }

  initDOM() {
    this.appContent = document.getElementById('appContent');
    this.navButtons = document.querySelectorAll('.nav-link-btn');
    this.mobileToggle = document.getElementById('mobileMenuToggle');
    this.navLinksMenu = document.getElementById('mainNavLinks');
  }

  initTheme() {
    const themeBtn = document.getElementById('themeToggleBtn');
    const mobileThemeBtn = document.getElementById('mobileThemeToggleBtn');
    const mobileIcon = document.getElementById('mobileThemeIcon');
    const mobileBadge = document.getElementById('mobileThemeBadge');

    const sunSVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
    const moonSVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;

    const updateThemeDisplay = (theme) => {
      const isLight = theme === 'light';
      if (themeBtn) {
        themeBtn.innerHTML = isLight ? moonSVG : sunSVG;
        themeBtn.setAttribute('title', isLight ? 'تفعيل الوضع الليلي' : 'تفعيل الوضع النهاري');
        themeBtn.setAttribute('aria-label', isLight ? 'تفعيل الوضع الليلي' : 'تفعيل الوضع النهاري');
      }
      if (mobileIcon) mobileIcon.textContent = isLight ? '🌙' : '☀️';
      if (mobileBadge) {
        mobileBadge.textContent = isLight ? 'نهاري' : 'ليلي';
        mobileBadge.className = isLight ? 'badge badge-sand' : 'badge badge-emerald';
      }
    };

    const toggleTheme = () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = current === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('athar-theme', next);
      updateThemeDisplay(next);
    };

    if (themeBtn) themeBtn.addEventListener('click', toggleTheme);
    if (mobileThemeBtn) mobileThemeBtn.addEventListener('click', toggleTheme);

    const initial = document.documentElement.getAttribute('data-theme') || 'dark';
    updateThemeDisplay(initial);
  }

  initEvents() {
    // Navigation routing
    this.navButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const view = btn.getAttribute('data-view');
        this.navigateTo(view);
      });
    });

    // Brand logo returns to home
    const brandHome = document.getElementById('brandNavHome');
    if (brandHome) {
      brandHome.addEventListener('click', () => this.navigateTo('home'));
    }

    // Mobile menu toggle
    if (this.mobileToggle && this.navLinksMenu) {
      this.mobileToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        this.navLinksMenu.classList.toggle('mobile-open');
      });

      // Close mobile menu when clicking outside
      document.addEventListener('click', (e) => {
        if (this.navLinksMenu.classList.contains('mobile-open')) {
          if (!this.navLinksMenu.contains(e.target) && !this.mobileToggle.contains(e.target)) {
            this.navLinksMenu.classList.remove('mobile-open');
          }
        }
      });
    }

    // Player controls wiring
    this.initPlayerControls();

    // Global keyboard shortcuts
    window.addEventListener('keydown', (e) => {
      // Don't trigger if user is in an input or modal is open
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.code === 'Space') {
        e.preventDefault();
        this.player.togglePlay();
      } else if (e.code === 'ArrowRight' && !document.getElementById('lightboxModal')?.classList.contains('active')) {
        // In RTL: ArrowRight seeks backward 5s or forward depending on preference
        this.player.audio.currentTime = Math.min(this.player.audio.duration || 0, this.player.audio.currentTime + 5);
      } else if (e.code === 'ArrowLeft' && !document.getElementById('lightboxModal')?.classList.contains('active')) {
        this.player.audio.currentTime = Math.max(0, this.player.audio.currentTime - 5);
      } else if (e.key === 'm' || e.key === 'M') {
        this.player.toggleMute();
      }
    });
  }

  initPlayerControls() {
    const playBtn = document.getElementById('playerPlayBtn');
    const nextBtn = document.getElementById('playerNextBtn');
    const prevBtn = document.getElementById('playerPrevBtn');
    const loopBtn = document.getElementById('playerLoopBtn');
    const shuffleBtn = document.getElementById('playerShuffleBtn');
    const muteBtn = document.getElementById('playerMuteBtn');
    const volSlider = document.getElementById('playerVolumeSlider');
    const visualBtn = document.getElementById('playerVisualBtn');
    const videoModalClose = document.getElementById('videoModalCloseBtn');

    if (playBtn) playBtn.addEventListener('click', () => this.player.togglePlay());
    if (nextBtn) nextBtn.addEventListener('click', () => this.player.next());
    if (prevBtn) prevBtn.addEventListener('click', () => this.player.prev());
    if (loopBtn) loopBtn.addEventListener('click', () => this.player.toggleLoop());
    if (shuffleBtn) shuffleBtn.addEventListener('click', () => this.player.toggleShuffle());
    if (muteBtn) muteBtn.addEventListener('click', () => this.player.toggleMute());

    if (volSlider) {
      volSlider.addEventListener('input', (e) => {
        this.player.setVolume(e.target.value / 100);
      });
    }

    if (visualBtn) {
      visualBtn.addEventListener('click', () => this.player.openVideoModal());
    }

    if (videoModalClose) {
      videoModalClose.addEventListener('click', () => this.player.closeVideoModal());
    }

    // Direct Lyrics Reader and Speed Controls in Player Bar
    const lyricsBtn = document.getElementById('playerLyricsBtn');
    if (lyricsBtn) {
      lyricsBtn.addEventListener('click', () => {
        this.player.openLyricsModal(this.player.currentTrackIndex);
      });
    }

    const speedBtn = document.getElementById('playerSpeedBtn');
    if (speedBtn) {
      speedBtn.addEventListener('click', () => {
        this.player.cyclePlaybackRate();
      });
    }

    // Lyrics Modal Inner Controls (الحفظ والمتابعة والتكرار)
    const lyricsCloseBtn = document.getElementById('lyricsModalCloseBtn');
    if (lyricsCloseBtn) lyricsCloseBtn.addEventListener('click', () => this.player.closeLyricsModal());

    const lyricsPlayBtn = document.getElementById('lyricsModalPlayBtn');
    if (lyricsPlayBtn) {
      lyricsPlayBtn.addEventListener('click', () => {
        this.player.togglePlay();
        const textEl = document.getElementById('lyricsModalPlayText');
        if (textEl) {
          textEl.textContent = this.player.isPlaying ? 'إيقاف مؤقت' : 'تشغيل النشيد';
        }
      });
    }

    const lyricsLoopBtn = document.getElementById('lyricsModalLoopBtn');
    if (lyricsLoopBtn) {
      lyricsLoopBtn.addEventListener('click', () => {
        this.player.toggleLoop();
        lyricsLoopBtn.classList.toggle('active', this.player.isLooping);
        if (this.player.isLooping) {
          lyricsLoopBtn.style.color = 'var(--brand-emerald)';
        } else {
          lyricsLoopBtn.style.color = '';
        }
      });
    }

    const lyricsSpeedBtn = document.getElementById('lyricsModalSpeedBtn');
    if (lyricsSpeedBtn) {
      lyricsSpeedBtn.addEventListener('click', () => {
        const newRate = this.player.cyclePlaybackRate();
        lyricsSpeedBtn.textContent = `السرعة: ${newRate}x`;
      });
    }

    const lyricsCopyBtn = document.getElementById('lyricsModalCopyBtn');
    if (lyricsCopyBtn) {
      lyricsCopyBtn.addEventListener('click', () => {
        const currentTrack = this.tracks[this.player.currentTrackIndex];
        if (currentTrack && (currentTrack.lyrics || currentTrack.lyricsPreview)) {
          const textToCopy = currentTrack.lyrics || currentTrack.lyricsPreview;
          navigator.clipboard.writeText(textToCopy).then(() => {
            const originalHTML = lyricsCopyBtn.innerHTML;
            lyricsCopyBtn.innerHTML = `<span>✓ تم النسخ</span>`;
            setTimeout(() => { lyricsCopyBtn.innerHTML = originalHTML; }, 2000);
          }).catch(() => {
            alert('تم نسخ الكلمات بنجاح');
          });
        }
      });
    }

    const lyricsModal = document.getElementById('lyricsReaderModal');
    if (lyricsModal) {
      lyricsModal.addEventListener('click', (e) => {
        if (e.target === lyricsModal) this.player.closeLyricsModal();
      });
    }

    // Top slim seeker & bottom time slider
    const topSeeker = document.getElementById('playerTopProgressContainer');
    const timeTrack = document.getElementById('playerTimeTrack');

    const handleSeek = (e, trackEl) => {
      const rect = trackEl.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      // In RTL: from right to left or standard? Standard horizontal offset
      const percent = Math.max(0, Math.min(1, clickX / rect.width));
      this.player.seek(percent);
    };

    if (topSeeker) topSeeker.addEventListener('click', (e) => handleSeek(e, topSeeker));
    if (timeTrack) timeTrack.addEventListener('click', (e) => handleSeek(e, timeTrack));
  }

  navigateTo(view) {
    this.currentView = view;

    // Update active class on nav links
    this.navButtons.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-view') === view);
      if (btn.getAttribute('data-view') === view) {
        btn.setAttribute('aria-current', 'page');
      } else {
        btn.removeAttribute('aria-current');
      }
    });

    // Close mobile menu if open
    if (this.navLinksMenu) {
      this.navLinksMenu.classList.remove('mobile-open');
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    this.render();
  }

  handleTrackChange(track, index) {
    // Re-highlight cards in the view
    this.player.updateUI();

    // Update player download button
    const downloadBtn = document.getElementById('playerDownloadBtn');
    if (downloadBtn && track) {
      downloadBtn.setAttribute('href', track.audioSrc);
      downloadBtn.setAttribute('download', `${track.title}.mp4`);
      downloadBtn.setAttribute('title', `تحميل ${track.title}`);
    }

    // Refresh lyrics modal if currently open
    const lyricsModal = document.getElementById('lyricsReaderModal');
    if (lyricsModal && lyricsModal.classList.contains('active')) {
      this.player.openLyricsModal(index);
    }

    // If on lyrics view, update active tab highlight
    const tabs = document.querySelectorAll('.lyrics-tab-btn');
    tabs.forEach(t => {
      const tIdx = parseInt(t.getAttribute('data-track-index'), 10);
      t.classList.toggle('active', tIdx === index);
    });
  }

  handlePhotoChange(photo, index) {
    // Smoothly update live hero banner photo if on home view
    const heroImg = document.getElementById('heroFeaturedImg');
    const heroText = document.getElementById('heroPhotoSyncText');
    if (heroImg && this.player.isPlaying) {
      heroImg.style.transition = 'opacity 0.35s ease-in-out';
      heroImg.style.opacity = '0.3';
      setTimeout(() => {
        heroImg.src = photo.src;
        heroImg.alt = photo.title;
        heroImg.style.opacity = '1';
      }, 180);
      if (heroText) {
        heroText.textContent = `صورة ${index + 1}: ${photo.title}`;
      }
    }
  }

  render() {
    switch (this.currentView) {
      case 'lyrics':
        this.appContent.innerHTML = this.renderLyricsView();
        this.initLyricsViewEvents();
        break;
      case 'gallery':
        this.appContent.innerHTML = this.renderGalleryView();
        this.initGalleryComponent();
        break;
      case 'rehla':
        this.appContent.innerHTML = this.renderRehlaView();
        break;
      case 'about':
        this.appContent.innerHTML = this.renderAboutView();
        break;
      case 'gharsa':
      case 'home':
      default:
        this.appContent.innerHTML = this.renderHomeView();
        this.bindTrackCardEvents();
        this.initHomeGalleryTeaser();
        break;
    }
  }

  bindTrackCardEvents() {
    const cards = document.querySelectorAll('.track-card');
    cards.forEach(card => {
      card.addEventListener('click', (e) => {
        // Prevent click if clicked on lyrics button or download link
        if (e.target.closest('.btn-track-download') || e.target.closest('.btn-track-lyrics')) {
          return;
        }
        const trackIdx = parseInt(card.getAttribute('data-track-index'), 10);
        if (this.player.currentTrackIndex === trackIdx && this.player.isPlaying) {
          this.player.togglePlay();
        } else {
          this.player.loadTrack(trackIdx, true, false); // Pure audio play, no intrusive modals!
        }
      });
    });

    // Wire individual lyrics triggers on track cards
    const lyricsBtns = document.querySelectorAll('.btn-track-lyrics');
    lyricsBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const trackIdx = parseInt(btn.getAttribute('data-track-index'), 10);
        this.player.openLyricsModal(trackIdx);
      });
    });
  }

  /* ========================================================================
     VIEW: Home
     ======================================================================== */
  renderHomeView() {
    return `
      <!-- Clean, Focused Hero Section -->
      <section class="hero-section" aria-labelledby="heroTitle">
        <div class="container hero-grid" style="align-items: center;">
          
          <div class="hero-content">
            <div class="hero-badge-row">
              <span class="badge badge-emerald">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>
                ألبوم غرسة الإنشادي
              </span>
              <span class="badge badge-sand">رِحلة × غرسة</span>
            </div>

            <h1 class="hero-title" id="heroTitle">
              استمع.. احفظ.. <span class="gradient-text">واغرس الأثر</span>
            </h1>

            <p class="hero-desc">
              المساحة الرقمية المخصصة لسواعد المتطوعين والمتطوعات؛ للاستماع لأناشيد غرسة، حفظ وترديد كلماتها، وتحميل المسارات مباشرة دون أي تشتت.
            </p>

            <div class="hero-buttons">
              <button class="btn-primary" id="btnHeroPlayGharsa" onclick="window.app.player.loadTrack(0, true, false)">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                <span>تشغيل الألبوم كاملاً</span>
              </button>
              
              <button class="btn-secondary" onclick="window.app.navigateTo('lyrics')">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
                <span>كلمات الأناشيد للحفظ</span>
              </button>
            </div>
          </div>

          <!-- Featured Album Presentation Card -->
          <div class="hero-featured-card" id="heroFeaturedCard">
            <img src="${GHARSA_ALBUM.cover}" alt="غلاف ألبوم غرسة" class="hero-featured-banner" id="heroFeaturedImg" />
            <div class="hero-featured-info">
              <div>
                <span class="badge badge-sand" style="margin-bottom:6px;">الإصدار الإنشادي الأول</span>
                <h3 style="font-size:1.25rem; margin-bottom:4px;">${GHARSA_ALBUM.title}</h3>
                <p style="font-size:0.85rem; color:var(--text-muted);">6 مسارات إنشادية واستوديو • جودة عالية</p>
              </div>
              <button class="btn-primary" style="padding:10px 18px;" onclick="window.app.player.loadTrack(0, true, false)">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                <span>استماع</span>
              </button>
            </div>
          </div>

        </div>

        <!-- Verified Impact Stats Ribbon -->
        <div class="container">
          <div class="stats-ribbon">
            <div class="stat-item">
              <span class="stat-num">6</span>
              <span class="stat-label">أناشيد رسمية واستوديو (ألبوم غرسة)</span>
            </div>
            <div class="stat-item">
              <span class="stat-num">33</span>
              <span class="stat-label">صورة ميدانية موثقة للمتطوعين</span>
            </div>
            <div class="stat-item">
              <span class="stat-num">27,000</span>
              <span class="stat-label">شجرة مستهدفة بحلول 2027 (مشروع غرسة)</span>
            </div>
            <div class="stat-item">
              <span class="stat-num">450+</span>
              <span class="stat-label">متطوعاً نشطاً في برامج منظمة رِحلة</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Complete 6 Anthems Section -->
      <section class="container" style="margin-top: 50px;" aria-labelledby="featuredTracksTitle">
        <div class="section-header">
          <div class="section-title-wrap">
            <span class="section-subtitle">أصوات النماء والعطاء</span>
            <h2 class="section-main-title" id="featuredTracksTitle">قائمة الأناشيد (${this.tracks.length} مسارات)</h2>
            <p style="color: var(--text-muted); font-size: 0.95rem; margin-top: 4px;">
              انقر على أي نشيد للاستماع، أو اضغط «الكلمات» للحفظ والمتابعة، أو «تحميل» لحفظه على هاتفك.
            </p>
          </div>
          <button class="btn-secondary" onclick="window.app.navigateTo('lyrics')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
            <span>مركز التحفيظ والكلمات</span>
          </button>
        </div>

        <div style="display: flex; flex-direction: column; gap: 12px;">
          ${this.tracks.map((track, idx) => `
            <div class="track-card ${this.player.currentTrackIndex === idx ? 'active' : ''}" data-track-index="${idx}">
              <div class="track-card-left">
                <button class="track-play-trigger" aria-label="تشغيل ${track.title}">
                  ${(this.player.currentTrackIndex === idx && this.player.isPlaying)
                    ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`
                    : `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`
                  }
                </button>
                <div>
                  <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                    <span style="font-weight: 700; color: var(--brand-emerald); font-size: 0.9rem;">#${track.trackNumber}</span>
                    <h4 class="track-meta-title" style="margin: 0;">${track.title}</h4>
                    <span style="font-size: 0.8rem; color: var(--text-muted);">(${track.englishTitle})</span>
                  </div>
                  <p class="track-meta-desc" style="margin-top: 2px;">${track.theme}</p>
                  <p style="font-size: 0.82rem; color: var(--brand-lime); margin-top: 2px; font-style: italic;">«${track.lyricsPreview}»</p>
                </div>
              </div>

              <div class="track-card-right">
                <div class="sound-bars ${this.player.currentTrackIndex === idx && this.player.isPlaying ? 'playing' : ''}">
                  <span class="sound-bar"></span>
                  <span class="sound-bar"></span>
                  <span class="sound-bar"></span>
                </div>
                
                <span class="track-duration-pill">${track.duration}</span>

                <button class="btn-track-lyrics" data-track-index="${idx}" title="عرض الكلمات للحفظ والمتابعة">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
                  <span>الكلمات</span>
                </button>

                <a href="${track.audioSrc}" download="${track.title}.mp4" class="btn-track-download" title="تحميل وحفظ النشيد (MP4)">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  <span>تحميل</span>
                </a>
              </div>
            </div>
          `).join('')}
        </div>
      </section>

      <!-- Visual Memory Teaser Section -->
      <section class="container" style="margin-top: 80px;" aria-labelledby="memoryTeaserTitle">
        <div class="section-header">
          <div class="section-title-wrap">
            <span class="section-subtitle">الذاكرة البصرية التوثيقية</span>
            <h2 class="section-main-title" id="memoryTeaserTitle">لحظات من قلب الميدان والمدارس</h2>
          </div>
          <button class="btn-secondary" onclick="window.app.navigateTo('gallery')">
            <span>تصفح كامل المعرض</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
        </div>

        <div class="gallery-grid" id="homeGalleryTeaserGrid">
          <!-- Rendered by initHomeGalleryTeaser -->
        </div>
      </section>

      <!-- Institutional Partnership Spotlight -->
      <section class="container" style="margin-top: 80px;">
        <div class="glass-panel partnership-spotlight-card">
          <div>
            <span class="badge badge-lime" style="margin-bottom: 12px;">تكامل الرؤية والأثر</span>
            <h2 style="font-size: 1.8rem; margin-bottom: 16px;">رِحلة وغرسة: شريكان في بناء الإنسان والبيئة</h2>
            <p style="color: var(--text-body); margin-bottom: 24px; font-size: 0.98rem; line-height: 1.8;">
              تمثل منظمة رِحلة للتنمية المستدامة الحاضنة المجتمعية التي تبدأ من الناس وتصغي لحكاياتهم، 
              بينما ينطلق مشروع غرسة كمبادرة وطنية تحمي البيئة من التصحر وتغرس قيم العمل التطوعي لدى أجيال المدارس. 
              منصة «أَثَر» هي الوعاء الرقمي المشترك لتوثيق صوتهم وذاكرتهم.
            </p>
            <div class="partnership-cta-buttons">
              <a href="https://gharsa.ly" target="_blank" rel="noopener noreferrer" class="btn-primary">
                <span>زيارة موقع غرسة</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              </a>
              <a href="https://rehlaa.org" target="_blank" rel="noopener noreferrer" class="btn-secondary">
                <span>زيارة موقع رِحلة</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              </a>
            </div>
          </div>
          <div style="background: rgba(16, 185, 129, 0.05); padding: 30px; border-radius: var(--radius-md); border: 1px solid rgba(16, 185, 129, 0.15);">
            <h3 style="font-size: 1.2rem; color: var(--brand-emerald); margin-bottom: 12px;">تجربة استماع واستكشاف موحدة</h3>
            <p style="font-size: 0.95rem; color: var(--text-body); line-height: 1.8;">
              يعمل المشغل الصوتي باستمرار أثناء تنقلك بين كافة أقسام المنصة، لتستمتع بأناشيد ألبوم غرسة في الوقت نفسه الذي تستعرض فيه صور الأنشطة والتوثيق الميداني.
            </p>
          </div>
        </div>
      </section>

      ${this.renderFooter()}
    `;
  }

  initHomeGalleryTeaser() {
    const grid = document.getElementById('homeGalleryTeaserGrid');
    if (!grid) return;

    // Pick 6 varied photos for home preview
    const samplePhotos = [
      this.galleryItems[0],
      this.galleryItems[4],
      this.galleryItems[11],
      this.galleryItems[16],
      this.galleryItems[22],
      this.galleryItems[28]
    ];

    grid.innerHTML = samplePhotos.map((item, idx) => `
      <div class="gallery-item ${idx === 0 ? 'featured' : ''}" data-index="${idx}" tabindex="0" role="button" aria-label="${item.title}">
        <img src="${item.src}" alt="${item.title}" class="gallery-img" loading="lazy" />
        <div class="gallery-item-overlay">
          <span class="badge badge-emerald gallery-overlay-badge">${item.category}</span>
          <h4 class="gallery-overlay-title">${item.title}</h4>
        </div>
      </div>
    `).join('');

    grid.querySelectorAll('.gallery-item').forEach((el, index) => {
      el.addEventListener('click', () => {
        window.app.navigateTo('gallery');
      });
    });
  }

  /* ========================================================================
     VIEW: Lyrics Hub (مركز كلمات الأناشيد للترديد والحفظ)
     ======================================================================== */
  renderLyricsView() {
    const curIdx = this.currentLyricsTrackIndex || 0;
    const activeTrack = this.tracks[curIdx] || this.tracks[0];
    const rawLyrics = activeTrack.lyrics || activeTrack.lyricsPreview || '';
    const stanzas = rawLyrics.split('\n\n');

    return `
      <div class="container" style="padding-top: 40px;">
        <div class="lyrics-hub-hero">
          <span class="badge badge-emerald" style="margin-bottom: 12px;">مركز تحفيظ الأناشيد</span>
          <h1 style="font-size: clamp(1.8rem, 3.5vw, 2.6rem); margin-bottom: 10px;">كلمات الأناشيد للترديد والحفظ</h1>
          <p style="color: var(--text-body); max-width: 680px; margin: 0 auto; line-height: 1.8;">
            اختر النشيد لقراءة كلماته المشكولة، الاستماع إليه بالسرعة المناسبة، وتكراره حتى الحفظ التام لسواعد المتطوعين.
          </p>
        </div>

        <!-- Track Selection Tabs -->
        <div class="lyrics-hub-tabs" id="lyricsHubTabs">
          ${this.tracks.map((t, idx) => `
            <button class="lyrics-tab-btn ${idx === curIdx ? 'active' : ''}" data-track-index="${idx}">
              <span>${t.trackNumber}. ${t.title}</span>
            </button>
          `).join('')}
        </div>

        <!-- Selected Track Lyrics Card -->
        <div class="lyrics-display-card">
          <div style="border-bottom: 1px solid var(--border-subtle); padding-bottom: 20px; margin-bottom: 24px;">
            <div style="display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 8px;">
              <span class="badge badge-sand">النشيد #${activeTrack.trackNumber}</span>
              <h2 style="font-size: 1.7rem; margin: 0;">${activeTrack.title}</h2>
            </div>
            <p style="color: var(--text-muted); font-size: 0.95rem; margin: 0;">${activeTrack.theme} • المدة: ${activeTrack.duration}</p>
          </div>

          <!-- Memorization Control Toolbar -->
          <div class="lyrics-memorize-toolbar" style="border-radius: var(--radius-md); margin-bottom: 28px; justify-content: center;">
            <button class="btn-primary" id="hubPlayTrackBtn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              <span id="hubPlayTrackText">${this.player.currentTrackIndex === curIdx && this.player.isPlaying ? 'إيقاف مؤقت' : 'تشغيل النشيد'}</span>
            </button>

            <button class="btn-secondary ${this.player.isLooping ? 'active' : ''}" id="hubLoopTrackBtn" title="تكرار مستمر للنشيد للمساعدة في الحفظ">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
              <span>تكرار مستمر</span>
            </button>

            <button class="btn-secondary" id="hubSpeedTrackBtn" title="تغيير سرعة الإلقاء لتسهيل الحفظ">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span>السرعة: ${this.player.playbackRate || 1.0}x</span>
            </button>

            <button class="btn-secondary" id="hubCopyTrackBtn" title="نسخ كلمات النشيد">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
              <span>نسخ الكلمات</span>
            </button>

            <a href="${activeTrack.audioSrc}" download="${activeTrack.title}.mp4" class="btn-secondary" title="تحميل النشيد للاستماع والحفظ دون إنترنت">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              <span>تحميل النشيد</span>
            </a>
          </div>

          <!-- Stanzas Display -->
          <div class="lyrics-stanzas-wrap">
            ${stanzas.map(stanza => `
              <div class="lyrics-stanza">
                ${stanza.split('\n').map(l => `<p class="lyrics-line">${l.trim()}</p>`).join('')}
              </div>
            `).join('')}
          </div>
        </div>
      </div>
      ${this.renderFooter()}
    `;
  }

  initLyricsViewEvents() {
    const tabs = document.querySelectorAll('.lyrics-tab-btn');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const idx = parseInt(tab.getAttribute('data-track-index'), 10);
        this.currentLyricsTrackIndex = idx;
        this.appContent.innerHTML = this.renderLyricsView();
        this.initLyricsViewEvents();
      });
    });

    const playBtn = document.getElementById('hubPlayTrackBtn');
    if (playBtn) {
      playBtn.addEventListener('click', () => {
        const curIdx = this.currentLyricsTrackIndex || 0;
        if (this.player.currentTrackIndex === curIdx && this.player.isPlaying) {
          this.player.togglePlay();
        } else {
          this.player.loadTrack(curIdx, true, false);
        }
        const textEl = document.getElementById('hubPlayTrackText');
        if (textEl) {
          textEl.textContent = this.player.isPlaying ? 'إيقاف مؤقت' : 'تشغيل النشيد';
        }
      });
    }

    const loopBtn = document.getElementById('hubLoopTrackBtn');
    if (loopBtn) {
      loopBtn.addEventListener('click', () => {
        this.player.toggleLoop();
        loopBtn.classList.toggle('active', this.player.isLooping);
        if (this.player.isLooping) {
          loopBtn.style.color = 'var(--brand-emerald)';
        } else {
          loopBtn.style.color = '';
        }
      });
    }

    const speedBtn = document.getElementById('hubSpeedTrackBtn');
    if (speedBtn) {
      speedBtn.addEventListener('click', () => {
        const newRate = this.player.cyclePlaybackRate();
        speedBtn.querySelector('span').textContent = `السرعة: ${newRate}x`;
      });
    }

    const copyBtn = document.getElementById('hubCopyTrackBtn');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const track = this.tracks[this.currentLyricsTrackIndex || 0];
        if (track && (track.lyrics || track.lyricsPreview)) {
          navigator.clipboard.writeText(track.lyrics || track.lyricsPreview).then(() => {
            const originalHTML = copyBtn.innerHTML;
            copyBtn.innerHTML = `<span>✓ تم النسخ</span>`;
            setTimeout(() => { copyBtn.innerHTML = originalHTML; }, 2000);
          }).catch(() => {
            alert('تم نسخ الكلمات بنجاح');
          });
        }
      });
    }
  }

  /* ========================================================================
     VIEW: Memory Gallery (33 Verified Field Photos)
     ======================================================================== */
  renderGalleryView() {
    return `
      <div class="container" style="padding-top: 40px;">
        
        <div class="section-header">
          <div class="section-title-wrap">
            <span class="section-subtitle">الأرشيف البصري الميداني</span>
            <h1 class="section-main-title">ذاكرة غرسة ورِحلة</h1>
            <p style="color: var(--text-muted); max-width: 700px; margin-top: 6px;">
              توثيق مصور وحقيقي لأنشطة غرس الأشجار، ومشاركة طلاب المدارس، وجهود المتطوعين والمتطوعات في الميدان.
              انقر على أي صورة لمعاينتها بالحجم الكامل والتنقل عبر الأسهم أو لوحة المفاتيح.
            </p>
          </div>
        </div>

        <!-- Category Filters -->
        <div class="filter-tabs" id="galleryFilterTabs">
          <button class="filter-tab-btn active" data-filter="all">كافة الصور</button>
          <button class="filter-tab-btn" data-filter="planting">غرس الشتلات</button>
          <button class="filter-tab-btn" data-filter="schools">حملات المدارس</button>
          <button class="filter-tab-btn" data-filter="volunteers">روح التطوع</button>
          <button class="filter-tab-btn" data-filter="workshops">الورش والميدان</button>
        </div>

        <!-- Grid Container -->
        <div class="gallery-grid" id="fullGalleryGrid">
          <!-- Populated by MemoryGallery class -->
        </div>

      </div>
      ${this.renderFooter()}
    `;
  }

  initGalleryComponent() {
    const gridEl = document.getElementById('fullGalleryGrid');
    if (!gridEl) return;

    this.galleryComponent = new MemoryGallery(this.galleryItems, gridEl);
    this.galleryComponent.render();

    // Wire filter buttons
    const filterBtns = document.querySelectorAll('.filter-tab-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.getAttribute('data-filter');
        this.galleryComponent.setFilter(filter);
      });
    });
  }

  /* ========================================================================
     VIEW: Rehla Album (Future Expansion)
     ======================================================================== */
  renderRehlaView() {
    return `
      <div class="container" style="padding-top: 40px;">
        
        <div class="glass-panel" style="padding: 44px; margin-bottom: 40px; text-align: center; max-width: 800px; margin-left: auto; margin-right: auto;">
          <div style="width: 90px; height: 90px; margin: 0 auto 20px; border-radius: 50%; background: rgba(130, 185, 57, 0.15); border: 2px solid var(--brand-lime); display: flex; align-items: center; justify-content: center; color: var(--brand-lime);">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
          </div>

          <span class="badge badge-lime" style="margin-bottom: 12px;">${REHLA_ALBUM_TEASER.badge}</span>
          <h1 style="font-size: 2.2rem; margin-bottom: 12px;">${REHLA_ALBUM_TEASER.title}</h1>
          <p style="font-size: 1.1rem; color: var(--text-body); line-height: 1.85; margin-bottom: 28px;">
            ${REHLA_ALBUM_TEASER.description}
          </p>

          <div style="background: rgba(255, 255, 255, 0.03); border: 1px dashed var(--border-medium); border-radius: var(--radius-md); padding: 24px; margin-bottom: 30px; text-align: right;">
            <h3 style="font-size: 1.1rem; color: var(--brand-lime); margin-bottom: 8px;">جاهزية الاستيعاب والتوسع المستقبلي:</h3>
            <p style="font-size: 0.92rem; color: var(--text-muted); line-height: 1.7;">
              صُممت منصة «أَثَر» ببنية معمارية مستقلة تفصل بين واجهات العرض ومصادر البيانات (JSON/Data Modules)، 
              مما يتيح لفريق منظمة رِحلة إضافة مسارات الألبوم القادم، والأغلفة، والكلمات دون الحاجة لإعادة برمجة الموقع.
            </p>
          </div>

          <a href="${REHLA_ALBUM_TEASER.officialLink}" target="_blank" rel="noopener noreferrer" class="btn-primary">
            <span>زيارة الموقع الرسمي لمنظمة رِحلة للتنمية المستدامة</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </a>
        </div>

      </div>
      ${this.renderFooter()}
    `;
  }

  /* ========================================================================
     VIEW: About Platform
     ======================================================================== */
  renderAboutView() {
    return `
      <div class="container" style="padding-top: 40px;">
        
        <div class="section-header" style="text-align: center; max-width: 800px; margin: 0 auto 50px;">
          <span class="section-subtitle">الرؤية والهدف والشركاء</span>
          <h1 class="section-main-title" style="margin-top: 8px;">عن منصة «أَثَر | ATHAR»</h1>
          <p style="color: var(--text-body); font-size: 1.1rem; margin-top: 14px; line-height: 1.85;">
            ${PARTNERS_INFO.athar.vision}
          </p>
        </div>

        <div class="about-partners-grid">
          
          <!-- Partner: Gharsa -->
          <div class="glass-panel" style="padding: 36px;">
            <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 18px;">
              <div style="width: 50px; height: 50px; border-radius: var(--radius-sm); background: rgba(16, 185, 129, 0.15); display: flex; align-items: center; justify-content: center;">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--brand-emerald)" stroke-width="2"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/></svg>
              </div>
              <div>
                <span class="badge badge-emerald" style="margin-bottom: 4px;">المبادرة البيئية الوطنية</span>
                <h3 style="font-size: 1.3rem;">${PARTNERS_INFO.gharsa.name}</h3>
              </div>
            </div>

            <p style="color: var(--text-body); font-size: 0.95rem; line-height: 1.8; margin-bottom: 20px;">
              ${PARTNERS_INFO.gharsa.tagline}
            </p>

            <ul style="list-style: none; display: flex; flex-direction: column; gap: 10px; margin-bottom: 24px;">
              ${PARTNERS_INFO.gharsa.stats.map(s => `
                <li style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-subtle); padding-bottom: 8px;">
                  <span style="color: var(--text-muted); font-size: 0.9rem;">${s.label}</span>
                  <strong style="color: var(--brand-emerald); font-size: 1.1rem;">${s.value}</strong>
                </li>
              `).join('')}
            </ul>

            <a href="${PARTNERS_INFO.gharsa.url}" target="_blank" rel="noopener noreferrer" class="btn-primary" style="width: 100%;">
              <span>زيارة الموقع الرسمي: gharsa.ly</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </a>
          </div>

          <!-- Partner: Rehla -->
          <div class="glass-panel" style="padding: 36px;">
            <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 18px;">
              <div style="width: 50px; height: 50px; border-radius: var(--radius-sm); background: rgba(130, 185, 57, 0.15); display: flex; align-items: center; justify-content: center;">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--brand-lime)" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <div>
                <span class="badge badge-lime" style="margin-bottom: 4px;">المنظمة الأم الحاضنة</span>
                <h3 style="font-size: 1.3rem;">${PARTNERS_INFO.rehla.name}</h3>
              </div>
            </div>

            <p style="color: var(--text-body); font-size: 0.95rem; line-height: 1.8; margin-bottom: 20px;">
              ${PARTNERS_INFO.rehla.tagline}
            </p>

            <ul style="list-style: none; display: flex; flex-direction: column; gap: 10px; margin-bottom: 24px;">
              ${PARTNERS_INFO.rehla.stats.map(s => `
                <li style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-subtle); padding-bottom: 8px;">
                  <span style="color: var(--text-muted); font-size: 0.9rem;">${s.label}</span>
                  <strong style="color: var(--brand-lime); font-size: 1.1rem;">${s.value}</strong>
                </li>
              `).join('')}
            </ul>

            <a href="${PARTNERS_INFO.rehla.url}" target="_blank" rel="noopener noreferrer" class="btn-secondary" style="width: 100%;">
              <span>زيارة الموقع الرسمي: rehlaa.org</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </a>
          </div>

        </div>

      </div>
      ${this.renderFooter()}
    `;
  }

  renderFooter() {
    return `
      <footer class="site-footer" role="contentinfo">
        <div class="container">
          <div class="footer-grid">
            
            <div class="footer-brand-col">
              <div class="brand-title">
                <span>أَثَر</span>
                <span class="en">ATHAR</span>
              </div>
              <p style="font-size: 0.88rem; color: var(--text-muted); line-height: 1.7;">
                المنصة الرقمية الموحدة للأناشيد والذاكرة البصرية التوثيقية لمنظمة رِحلة للتنمية المستدامة ومشروع غرسة الوطني للتشجير ومكافحة التصحر.
              </p>
              <span style="font-size: 0.85rem; color: var(--brand-lime); font-weight: 600;">«لكل أثر حكاية، ولكل حكاية صوت»</span>
            </div>

            <div>
              <h4 class="footer-col-title">أقسام المنصة</h4>
              <ul class="footer-links-list">
                <li><a href="#home" onclick="event.preventDefault(); window.app.navigateTo('home')">الأناشيد الرسمية</a></li>
                <li><a href="#lyrics" onclick="event.preventDefault(); window.app.navigateTo('lyrics')">كلمات للحفظ والترديد</a></li>
                <li><a href="#gallery" onclick="event.preventDefault(); window.app.navigateTo('gallery')">ذاكرة غرسة (الصور)</a></li>
                <li><a href="#about" onclick="event.preventDefault(); window.app.navigateTo('about')">عن المنصة</a></li>
              </ul>
            </div>

            <div>
              <h4 class="footer-col-title">المواقع والروابط الرسمية</h4>
              <ul class="footer-links-list">
                <li><a href="https://gharsa.ly" target="_blank" rel="noopener noreferrer">الموقع الرسمي لمشروع غرسة (gharsa.ly) ↗</a></li>
                <li><a href="https://rehlaa.org" target="_blank" rel="noopener noreferrer">منظمة رِحلة للتنمية المستدامة (rehlaa.org) ↗</a></li>
                <li><a href="https://rehlaa.org/ar/companions.html" target="_blank" rel="noopener noreferrer">برنامج رفاق رحلة التطوعي ↗</a></li>
                <li><a href="https://rehlaa.org/ar/south.html" target="_blank" rel="noopener noreferrer">برنامج رحلة الجنوب ↗</a></li>
              </ul>
            </div>

          </div>

          <div class="footer-bottom-bar" style="justify-content: center; text-align: center;">
            <span>© 2026 أَثَر | ATHAR — جميع الحقوق محفوظة لمنظمة رِحلة ومشروع غرسة.</span>
          </div>
        </div>
      </footer>
    `;
  }
}

// Instantiate and expose globally
window.addEventListener('DOMContentLoaded', () => {
  window.app = new AtharApp();
});

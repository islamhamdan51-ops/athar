/**
 * مشغل الصوت المستمر لمنصة أَثَر | ATHAR
 * يدعم تشغيل ملفات MP4 و MP3 مع تحكم زمني كامل وتزامن الواجهة
 * والمسرح البصري التفاعلي المتزامن لعرض صور الميدان الـ 33 مع الأناشيد
 */

import { GALLERY_ITEMS } from '../data/gallery.js';

export class AtharAudioPlayer {
  constructor(tracks, onTrackChange) {
    this.tracks = tracks;
    this.galleryItems = GALLERY_ITEMS;
    this.currentTrackIndex = 0;
    this.currentPhotoIndex = 0;
    this.isPhotoSlideshowRunning = true;
    this.photoTimer = null;
    this.photoProgressInterval = null;
    this.photoIntervalMs = 5000;
    this.photoProgressPercent = 0;
    this.photoListeners = [];

    this.isPlaying = false;
    this.isMuted = false;
    this.isLooping = false;
    this.isShuffled = false;
    this.isTheaterLyricsOpen = false;
    this.playbackRate = 1.0;
    this.volume = 0.85;
    this.onTrackChange = onTrackChange || (() => {});

    // Connect to real DOM audio element for high-priority mobile background playback
    const domAudio = document.getElementById('globalAtharAudio');
    this.audio = domAudio || new Audio();
    this.audio.preload = 'auto';
    this.audio.playsInline = true;
    this.audio.setAttribute('playsinline', '');
    this.audio.setAttribute('webkit-playsinline', '');
    this.audio.volume = this.volume;
    this.wakeLock = null;
    this._lastPositionUpdate = 0;

    this.initAudioEvents();
    this.initPhotoTheaterDOM();
  }

  get currentTrack() {
    return this.tracks[this.currentTrackIndex] || this.tracks[0];
  }

  initAudioEvents() {
    this.audio.addEventListener('play', () => {
      this.isPlaying = true;
      this.updateUI();
      this.updateMediaSession();
      this.requestWakeLock();
      if (this.isPhotoSlideshowRunning) {
        this.startPhotoSlideshow();
      }
    });

    this.audio.addEventListener('pause', () => {
      this.isPlaying = false;
      this.updateUI();
      this.releaseWakeLock();
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'paused';
      }
      this.stopPhotoSlideshow();
    });

    this.audio.addEventListener('timeupdate', () => {
      this.updateProgress();
      if (this.isPlaying && (!this._lastPositionUpdate || Date.now() - this._lastPositionUpdate > 1000)) {
        this._lastPositionUpdate = Date.now();
        this.syncPositionState();
      }
    });

    // Ensure uninterrupted playback and media session renewal when screen locks or tab changes
    document.addEventListener('visibilitychange', () => {
      if (this.isPlaying) {
        if (document.visibilityState === 'visible') {
          this.requestWakeLock();
        }
        this.updateMediaSession();
      }
    });

    this.audio.addEventListener('loadedmetadata', () => {
      this.updateDuration();
    });

    this.audio.addEventListener('ended', () => {
      if (this.isLooping) {
        this.audio.currentTime = 0;
        this.audio.play();
      } else {
        this.next();
      }
    });

    this.audio.addEventListener('error', (e) => {
      console.warn('Audio playback error, falling back:', e);
      const errEl = document.getElementById('playerErrorNotice');
      if (errEl) {
        errEl.textContent = 'تعذر تشغيل الملف الصوتي مباشرة، يرجى التحقق من الرابط.';
        errEl.style.display = 'block';
        setTimeout(() => { errEl.style.display = 'none'; }, 4000);
      }
    });
  }

  loadTrack(index, autoPlay = true) {
    if (index < 0 || index >= this.tracks.length) return;
    this.currentTrackIndex = index;
    const track = this.currentTrack;

    this.audio.src = track.audioSrc;
    this.audio.currentTime = 0;
    this.audio.playbackRate = this.playbackRate || 1.0;

    this.onTrackChange(track, index);
    this.updateTrackMetaUI();

    if (autoPlay) {
      this.audio.play().catch(err => {
        console.log('Autoplay prevented by browser, waiting for user click:', err);
      });
    }
  }

  togglePlay() {
    if (!this.audio.src || this.audio.src === '') {
      this.loadTrack(this.currentTrackIndex, true);
      return;
    }

    if (this.isPlaying) {
      this.audio.pause();
    } else {
      this.audio.play().catch(err => console.log('Play error:', err));
    }
  }

  next() {
    let nextIndex;
    if (this.isShuffled) {
      nextIndex = Math.floor(Math.random() * this.tracks.length);
      if (nextIndex === this.currentTrackIndex && this.tracks.length > 1) {
        nextIndex = (nextIndex + 1) % this.tracks.length;
      }
    } else {
      nextIndex = (this.currentTrackIndex + 1) % this.tracks.length;
    }
    this.loadTrack(nextIndex, true);
  }

  prev() {
    if (this.audio.currentTime > 3) {
      this.audio.currentTime = 0;
      return;
    }
    const prevIndex = (this.currentTrackIndex - 1 + this.tracks.length) % this.tracks.length;
    this.loadTrack(prevIndex, true);
  }

  seek(percentage) {
    if (!isNaN(this.audio.duration) && this.audio.duration > 0) {
      this.audio.currentTime = this.audio.duration * percentage;
    }
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    this.audio.volume = this.volume;
    this.isMuted = this.volume === 0;
    this.updateVolumeUI();
  }

  toggleMute() {
    if (this.isMuted) {
      this.audio.muted = false;
      this.isMuted = false;
      this.audio.volume = this.volume || 0.85;
    } else {
      this.audio.muted = true;
      this.isMuted = true;
    }
    this.updateVolumeUI();
  }

  toggleLoop() {
    this.isLooping = !this.isLooping;
    const loopBtn = document.getElementById('playerLoopBtn');
    if (loopBtn) {
      loopBtn.classList.toggle('active', this.isLooping);
      loopBtn.title = this.isLooping ? 'تكرار النشيد مفعّل' : 'تفعيل التكرار';
    }
  }

  toggleShuffle() {
    this.isShuffled = !this.isShuffled;
    const shuffleBtn = document.getElementById('playerShuffleBtn');
    if (shuffleBtn) {
      shuffleBtn.classList.toggle('active', this.isShuffled);
      shuffleBtn.title = this.isShuffled ? 'التشغيل العشوائي مفعّل' : 'تفعيل التشغيل العشوائي';
    }
  }

  formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  updateProgress() {
    const cur = this.audio.currentTime || 0;
    const dur = this.audio.duration || this.currentTrack.durationSeconds || 0;
    const percent = dur > 0 ? (cur / dur) * 100 : 0;

    const fill = document.getElementById('playerProgressFill');
    const topFill = document.getElementById('playerTopProgressBar');
    const curTimeEl = document.getElementById('playerCurrentTime');
    const theaterSeekerFill = document.getElementById('theaterSeekerFill');
    const theaterCurDurEl = document.getElementById('theaterCurrentTrackDur');

    if (fill) fill.style.width = `${percent}%`;
    if (topFill) topFill.style.width = `${percent}%`;
    if (curTimeEl) curTimeEl.textContent = this.formatTime(cur);
    if (theaterSeekerFill) theaterSeekerFill.style.width = `${percent}%`;
    if (theaterCurDurEl) theaterCurDurEl.textContent = `${this.formatTime(cur)} / ${this.formatTime(dur)}`;
  }

  updateDuration() {
    const dur = this.audio.duration || this.currentTrack.durationSeconds || 0;
    const durTimeEl = document.getElementById('playerDurationTime');
    if (durTimeEl) durTimeEl.textContent = this.formatTime(dur);
  }

  updateUI() {
    const playBtn = document.getElementById('playerPlayBtn');
    const theaterPlayBtn = document.getElementById('theaterPlayBtn');
    const soundBars = document.querySelectorAll('.sound-bars');
    const vinylCover = document.getElementById('playerVinylCover');

    const playSVG = `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`;
    const pauseSVG = `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`;

    if (playBtn) {
      playBtn.innerHTML = this.isPlaying ? pauseSVG : playSVG;
      playBtn.setAttribute('aria-label', this.isPlaying ? 'إيقاف مؤقت' : 'تشغيل');
    }

    if (theaterPlayBtn) {
      theaterPlayBtn.innerHTML = this.isPlaying
        ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`
        : `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`;
    }

    soundBars.forEach(sb => {
      sb.classList.toggle('playing', this.isPlaying);
    });

    if (vinylCover) {
      vinylCover.classList.toggle('spin-anim', this.isPlaying);
    }

    // Update active highlight on all track cards in pages
    document.querySelectorAll('.track-card').forEach((card, idx) => {
      const isCurrent = idx === this.currentTrackIndex;
      card.classList.toggle('active', isCurrent);
      const icon = card.querySelector('.track-play-trigger');
      if (icon) {
        icon.innerHTML = (isCurrent && this.isPlaying)
          ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`
          : `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`;
      }
    });
  }

  updateTrackMetaUI() {
    const track = this.currentTrack;
    const titleEl = document.getElementById('playerTrackTitle');
    const albumEl = document.getElementById('playerTrackAlbum');
    const durTimeEl = document.getElementById('playerDurationTime');
    const theaterTrackName = document.getElementById('theaterCurrentTrackName');
    const theaterTrackIndicator = document.getElementById('theaterTrackIndicator');

    if (titleEl) titleEl.textContent = track.title;
    if (albumEl) albumEl.textContent = track.theme || 'ألبوم غرسة';
    if (durTimeEl) durTimeEl.textContent = track.duration;
    if (theaterTrackName) theaterTrackName.textContent = track.title;
    if (theaterTrackIndicator) theaterTrackIndicator.textContent = `النشيد: ${track.title}`;

    this.updateTheaterLyrics();
    this.updateUI();
  }

  updateVolumeUI() {
    const volSlider = document.getElementById('playerVolumeSlider');
    const volBtn = document.getElementById('playerMuteBtn');
    const volFill = document.getElementById('playerVolumeFill');
    const volBadge = document.getElementById('playerVolumeLevelText');

    const pct = this.isMuted ? 0 : Math.round(this.volume * 100);

    if (volSlider) {
      volSlider.value = pct;
    }
    if (volFill) {
      volFill.style.width = `${pct}%`;
    }
    if (volBadge) {
      volBadge.textContent = this.isMuted ? 'مكتوم' : `${pct}%`;
      volBadge.style.color = (this.isMuted || pct === 0) ? '#f87171' : '';
    }

    if (volBtn) {
      if (this.isMuted || this.volume === 0) {
        volBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>`;
        volBtn.setAttribute('title', 'إلغاء كتم الصوت');
      } else {
        volBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`;
        volBtn.setAttribute('title', 'كتم الصوت');
      }
    }
  }

  updateMediaSession() {
    if (!('mediaSession' in navigator)) return;

    const track = this.currentTrack;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: 'مشروع غرسة & منظمة رِحلة',
      album: 'ألبوم غرسة الإنشادي — 27,000 شجرة',
      artwork: [
        { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png' },
        { src: '/media/brand/gharsa-album-cover.jpg', sizes: '1024x571', type: 'image/jpeg' }
      ]
    });

    navigator.mediaSession.playbackState = this.isPlaying ? 'playing' : 'paused';
    this.syncPositionState();

    try {
      navigator.mediaSession.setActionHandler('play', () => this.togglePlay());
      navigator.mediaSession.setActionHandler('pause', () => this.togglePlay());
      navigator.mediaSession.setActionHandler('previoustrack', () => this.prev());
      navigator.mediaSession.setActionHandler('nexttrack', () => this.next());
      
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.fastSeek && 'fastSeek' in this.audio) {
          this.audio.fastSeek(details.seekTime);
        } else {
          this.audio.currentTime = details.seekTime;
        }
        this.updateProgress();
        this.syncPositionState();
      });

      navigator.mediaSession.setActionHandler('seekbackward', (details) => {
        const skip = details.seekOffset || 10;
        this.audio.currentTime = Math.max(0, this.audio.currentTime - skip);
        this.updateProgress();
        this.syncPositionState();
      });

      navigator.mediaSession.setActionHandler('seekforward', (details) => {
        const skip = details.seekOffset || 10;
        this.audio.currentTime = Math.min(this.audio.duration || 0, this.audio.currentTime + skip);
        this.updateProgress();
        this.syncPositionState();
      });

      navigator.mediaSession.setActionHandler('stop', () => {
        this.audio.pause();
        this.audio.currentTime = 0;
        if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'none';
      });
    } catch (e) {
      console.warn('MediaSession handler warning:', e);
    }
  }

  syncPositionState() {
    if ('mediaSession' in navigator && 'setPositionState' in navigator.mediaSession) {
      const dur = this.audio.duration || this.currentTrack.durationSeconds || 0;
      if (!isNaN(dur) && dur > 0) {
        try {
          navigator.mediaSession.setPositionState({
            duration: dur,
            playbackRate: this.audio.playbackRate || 1.0,
            position: Math.min(this.audio.currentTime || 0, dur)
          });
        } catch (err) {}
      }
    }
  }

  async requestWakeLock() {
    if ('wakeLock' in navigator && !this.wakeLock) {
      try {
        this.wakeLock = await navigator.wakeLock.request('screen');
        this.wakeLock.addEventListener('release', () => {
          this.wakeLock = null;
        });
      } catch (e) {}
    }
  }

  releaseWakeLock() {
    if (this.wakeLock) {
      try {
        this.wakeLock.release();
      } catch (e) {}
      this.wakeLock = null;
    }
  }

  /* ========================================================================
     Modern Dynamic Visual Theater System (المسرح البصري التفاعلي للأثر)
     ======================================================================== */
  initPhotoTheaterDOM() {
    const modal = document.getElementById('photoTheaterModal');
    if (!modal) return;

    // Buttons inside Theater
    const closeBtn = document.getElementById('theaterCloseBtn');
    const prevBtn = document.getElementById('theaterPrevBtn');
    const nextBtn = document.getElementById('theaterNextBtn');
    const toggleTimerBtn = document.getElementById('theaterToggleTimerBtn');
    const fullscreenBtn = document.getElementById('theaterFullscreenBtn');
    const toggleLyricsBtn = document.getElementById('theaterToggleLyricsBtn');
    const closeLyricsBtn = document.getElementById('theaterCloseLyricsBtn');

    // Trigger buttons from outside
    const playerPhotoBtn = document.getElementById('playerPhotoSlideBtn');
    const vinylCover = document.getElementById('playerVinylCover');

    if (closeBtn) closeBtn.addEventListener('click', () => this.closePhotoTheater());
    if (prevBtn) prevBtn.addEventListener('click', () => this.prevPhoto());
    if (nextBtn) nextBtn.addEventListener('click', () => this.nextPhoto());
    if (toggleTimerBtn) toggleTimerBtn.addEventListener('click', () => this.togglePhotoTimer());
    if (playerPhotoBtn) playerPhotoBtn.addEventListener('click', () => this.openPhotoTheater());
    if (vinylCover) {
      vinylCover.style.cursor = 'pointer';
      vinylCover.title = 'انقر لفتح المسرح البصري للصور';
      vinylCover.addEventListener('click', () => this.openPhotoTheater());
    }

    if (fullscreenBtn) {
      fullscreenBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          modal.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      });
    }

    if (toggleLyricsBtn) {
      toggleLyricsBtn.addEventListener('click', () => this.toggleTheaterLyrics());
    }
    if (closeLyricsBtn) {
      closeLyricsBtn.addEventListener('click', () => this.toggleTheaterLyrics(false));
    }

    // Theater Playback Controls
    const thPlayBtn = document.getElementById('theaterPlayBtn');
    const thPrevBtn = document.getElementById('theaterPrevTrackBtn');
    const thNextBtn = document.getElementById('theaterNextTrackBtn');
    const thSeeker = document.getElementById('theaterSeekerContainer');

    if (thPlayBtn) thPlayBtn.addEventListener('click', () => this.togglePlay());
    if (thPrevBtn) thPrevBtn.addEventListener('click', () => this.prev());
    if (thNextBtn) thNextBtn.addEventListener('click', () => this.next());
    if (thSeeker) {
      thSeeker.addEventListener('click', (e) => {
        const rect = thSeeker.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const pct = Math.max(0, Math.min(1, clickX / rect.width));
        this.seek(pct);
      });
    }

    // Populate Interactive Filmstrip (33 Thumbnails)
    const strip = document.getElementById('theaterThumbstrip');
    if (strip && strip.children.length === 0) {
      strip.innerHTML = this.galleryItems.map((item, idx) => `
        <div class="theater-thumb-item ${idx === 0 ? 'active' : ''}" data-photo-idx="${idx}" title="${item.title}">
          <img src="${item.src}" alt="${item.title}" loading="lazy" />
        </div>
      `).join('');

      strip.querySelectorAll('.theater-thumb-item').forEach(thumb => {
        thumb.addEventListener('click', () => {
          const idx = parseInt(thumb.getAttribute('data-photo-idx'), 10);
          this.goToPhoto(idx);
        });
      });
    }

    // Keyboard Shortcuts for Theater
    window.addEventListener('keydown', (e) => {
      if (!modal.classList.contains('active')) return;
      if (e.key === 'Escape') {
        this.closePhotoTheater();
      } else if (e.key === 'ArrowRight') {
        this.prevPhoto();
      } else if (e.key === 'ArrowLeft') {
        this.nextPhoto();
      } else if (e.key === ' ' && e.target.tagName !== 'INPUT') {
        e.preventDefault();
        this.togglePlay();
      }
    });

    // Close when clicking ambient backdrop
    modal.addEventListener('click', (e) => {
      if (e.target === modal || e.target.id === 'theaterAmbientBackdrop') {
        this.closePhotoTheater();
      }
    });
  }

  openPhotoTheater() {
    const modal = document.getElementById('photoTheaterModal');
    if (!modal) return;

    this.updatePhotoTheaterUI();
    modal.classList.add('active');

    if (!this.isPlaying) {
      this.togglePlay();
    } else {
      this.startPhotoSlideshow();
    }
  }

  closePhotoTheater() {
    const modal = document.getElementById('photoTheaterModal');
    if (modal) {
      modal.classList.remove('active');
    }
    this.stopPhotoSlideshow();
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  }

  goToPhoto(idx) {
    if (idx < 0 || idx >= this.galleryItems.length) return;
    this.currentPhotoIndex = idx;
    this.photoProgressPercent = 0;
    this.updatePhotoTheaterUI();
  }

  nextPhoto() {
    this.currentPhotoIndex = (this.currentPhotoIndex + 1) % this.galleryItems.length;
    this.photoProgressPercent = 0;
    this.updatePhotoTheaterUI();
  }

  prevPhoto() {
    this.currentPhotoIndex = (this.currentPhotoIndex - 1 + this.galleryItems.length) % this.galleryItems.length;
    this.photoProgressPercent = 0;
    this.updatePhotoTheaterUI();
  }

  togglePhotoTimer() {
    this.isPhotoSlideshowRunning = !this.isPhotoSlideshowRunning;
    const btnText = document.getElementById('theaterTimerStateText');
    if (btnText) {
      btnText.textContent = this.isPhotoSlideshowRunning ? 'تلقائي: 5ث' : 'تلقائي: متوقف';
    }
    if (this.isPhotoSlideshowRunning && this.isPlaying) {
      this.startPhotoSlideshow();
    } else {
      this.stopPhotoSlideshow();
    }
  }

  startPhotoSlideshow() {
    this.stopPhotoSlideshow();
    if (!this.isPhotoSlideshowRunning) return;

    const progressBar = document.getElementById('theaterSlideProgressBar');
    const intervalTickMs = 50;
    const stepPct = (intervalTickMs / this.photoIntervalMs) * 100;

    this.photoProgressInterval = setInterval(() => {
      if (!this.isPlaying || !this.isPhotoSlideshowRunning) return;

      this.photoProgressPercent += stepPct;
      if (progressBar) {
        progressBar.style.width = `${Math.min(100, this.photoProgressPercent)}%`;
      }

      if (this.photoProgressPercent >= 100) {
        this.photoProgressPercent = 0;
        this.nextPhoto();
      }
    }, intervalTickMs);
  }

  stopPhotoSlideshow() {
    if (this.photoProgressInterval) {
      clearInterval(this.photoProgressInterval);
      this.photoProgressInterval = null;
    }
    const progressBar = document.getElementById('theaterSlideProgressBar');
    if (progressBar) {
      progressBar.style.width = '0%';
    }
  }

  toggleTheaterLyrics(forceState = null) {
    const overlay = document.getElementById('theaterLyricsOverlay');
    const btn = document.getElementById('theaterToggleLyricsBtn');
    if (!overlay) return;

    this.isTheaterLyricsOpen = forceState !== null ? forceState : !this.isTheaterLyricsOpen;
    overlay.classList.toggle('active', this.isTheaterLyricsOpen);
    if (btn) btn.classList.toggle('active', this.isTheaterLyricsOpen);

    if (this.isTheaterLyricsOpen) {
      this.updateTheaterLyrics();
    }
  }

  updateTheaterLyrics() {
    const content = document.getElementById('theaterLyricsContent');
    if (!content) return;
    const track = this.currentTrack;
    const text = track.lyrics || track.lyricsPreview || '';
    const stanzas = text.split('\n\n');
    content.innerHTML = stanzas.map(s => `
      <div style="margin-bottom:12px; border-bottom:1px solid rgba(255,255,255,0.06); padding-bottom:8px;">
        ${s.split('\n').map(l => `<p style="margin:2px 0; color:#ffffff;">${l.trim()}</p>`).join('')}
      </div>
    `).join('');
  }

  updatePhotoTheaterUI() {
    const photo = this.galleryItems[this.currentPhotoIndex];
    if (!photo) return;

    const img = document.getElementById('theaterMainImg');
    const backdrop = document.getElementById('theaterAmbientBackdrop');
    const counter = document.getElementById('theaterCounter');
    const title = document.getElementById('theaterTitle');
    const cat = document.getElementById('theaterCategoryBadge');
    const trackIndicator = document.getElementById('theaterTrackIndicator');

    if (img) {
      img.style.opacity = '0.35';
      img.src = photo.src;
      img.alt = photo.title;
      // Alternate subtle Ken-Burns direction
      img.className = 'theater-main-img ' + (this.currentPhotoIndex % 2 === 0 ? 'ken-burns' : 'ken-burns-alt');
      setTimeout(() => { img.style.opacity = '1'; }, 50);
    }

    if (backdrop) {
      backdrop.style.backgroundImage = `url("${photo.src}")`;
    }

    if (counter) counter.textContent = `${this.currentPhotoIndex + 1} / ${this.galleryItems.length}`;
    if (title) title.textContent = photo.title;
    if (cat) cat.textContent = photo.category;
    if (trackIndicator) trackIndicator.textContent = `النشيد: ${this.currentTrack.title}`;

    // Update active highlight in filmstrip & scroll into view
    const thumbs = document.querySelectorAll('.theater-thumb-item');
    thumbs.forEach(t => {
      const idx = parseInt(t.getAttribute('data-photo-idx'), 10);
      const isCur = idx === this.currentPhotoIndex;
      t.classList.toggle('active', isCur);
      if (isCur) {
        t.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    });

    this.updateProgress();
    this.updateUI();
  }

  /* ========================================================================
     Lyrics Memorization System (قارئ الكلمات للمتطوعين للحفظ والمتابعة)
     ======================================================================== */
  openLyricsModal(trackIndex = null) {
    const idx = trackIndex !== null ? trackIndex : this.currentTrackIndex;
    const track = this.tracks[idx];
    if (!track) return;

    const modal = document.getElementById('lyricsReaderModal');
    const title = document.getElementById('lyricsModalTitle');
    const subtitle = document.getElementById('lyricsModalSubtitle');
    const content = document.getElementById('lyricsModalContent');
    const downloadBtn = document.getElementById('lyricsModalDownloadBtn');
    const playBtnText = document.getElementById('lyricsModalPlayText');

    if (title) title.textContent = track.title;
    if (subtitle) subtitle.textContent = `${track.theme} • المدة: ${track.duration}`;
    if (downloadBtn) {
      downloadBtn.href = track.audioSrc;
      const ext = track.audioSrc.endsWith('.mp3') ? 'mp3' : 'mp4';
      downloadBtn.download = `${track.title}.${ext}`;
    }
    if (playBtnText) {
      playBtnText.textContent = (this.currentTrackIndex === idx && this.isPlaying) ? 'إيقاف مؤقت' : 'تشغيل النشيد';
    }

    if (content) {
      const text = track.lyrics || track.lyricsPreview || '';
      const stanzas = text.split('\n\n');
      content.innerHTML = stanzas.map(stanza => `
        <div class="lyrics-stanza">
          ${stanza.split('\n').map(l => `<p class="lyrics-line">${l.trim()}</p>`).join('')}
        </div>
      `).join('');
    }

    if (modal) modal.classList.add('active');
  }

  closeLyricsModal() {
    const modal = document.getElementById('lyricsReaderModal');
    if (modal) modal.classList.remove('active');
  }

  setPlaybackRate(rate) {
    this.playbackRate = rate;
    this.audio.playbackRate = rate;
    const btns = document.querySelectorAll('.player-speed-indicator, #lyricsModalSpeedBtn, #playerSpeedBtn');
    btns.forEach(b => {
      b.textContent = `السرعة: ${rate}x`;
    });
  }

  cyclePlaybackRate() {
    const rates = [1.0, 0.8, 1.2];
    const curIdx = rates.indexOf(this.playbackRate || 1.0);
    const nextRate = rates[(curIdx + 1) % rates.length];
    this.setPlaybackRate(nextRate);
    return nextRate;
  }
}

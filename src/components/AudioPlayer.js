/**
 * مشغل الصوت المستمر لمنصة أَثَر | ATHAR
 * يدعم تشغيل ملفات MP4 و MP3 مع تحكم زمني كامل وتزامن الواجهة
 * وميزة العرض التلقائي لصور الميدان المصاحبة للأناشيد
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
    this.photoIntervalMs = 4500;
    this.photoListeners = [];

    this.isPlaying = false;
    this.isMuted = false;
    this.isLooping = false;
    this.isShuffled = false;
    this.volume = 0.85;
    this.onTrackChange = onTrackChange || (() => {});

    // Create native audio element
    this.audio = new Audio();
    this.audio.preload = 'metadata';
    this.audio.volume = this.volume;

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
      this.startPhotoSlideshow();
    });

    this.audio.addEventListener('pause', () => {
      this.isPlaying = false;
      this.updateUI();
      this.stopPhotoSlideshow();
    });

    this.audio.addEventListener('timeupdate', () => {
      this.updateProgress();
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
    // If playing for more than 3 seconds, replay track from start
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

    if (fill) fill.style.width = `${percent}%`;
    if (topFill) topFill.style.width = `${percent}%`;
    if (curTimeEl) curTimeEl.textContent = this.formatTime(cur);
  }

  updateDuration() {
    const dur = this.audio.duration || this.currentTrack.durationSeconds || 0;
    const durTimeEl = document.getElementById('playerDurationTime');
    if (durTimeEl) durTimeEl.textContent = this.formatTime(dur);
  }

  updateUI() {
    const playBtn = document.getElementById('playerPlayBtn');
    const soundBars = document.querySelectorAll('.sound-bars');
    const vinylCover = document.getElementById('playerVinylCover');

    if (playBtn) {
      playBtn.innerHTML = this.isPlaying
        ? `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`
        : `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`;
      playBtn.setAttribute('aria-label', this.isPlaying ? 'إيقاف مؤقت' : 'تشغيل');
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

    if (titleEl) titleEl.textContent = track.title;
    if (albumEl) albumEl.textContent = track.theme || 'ألبوم غرسة';
    if (durTimeEl) durTimeEl.textContent = track.duration;

    this.updateUI();
  }

  updateVolumeUI() {
    const volSlider = document.getElementById('playerVolumeSlider');
    const volBtn = document.getElementById('playerMuteBtn');

    if (volSlider) {
      volSlider.value = this.isMuted ? 0 : this.volume * 100;
    }

    if (volBtn) {
      if (this.isMuted || this.volume === 0) {
        volBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>`;
      } else {
        volBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`;
      }
    }
  }

  updateMediaSession() {
    if ('mediaSession' in navigator) {
      const track = this.currentTrack;
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: 'مشروع غرسة & منظمة رِحلة',
        album: 'ألبوم غرسة الإنشادي',
        artwork: [
          { src: '/media/brand/gharsa-album-cover.jpg', sizes: '512x512', type: 'image/jpeg' }
        ]
      });

      navigator.mediaSession.setActionHandler('play', () => this.audio.play());
      navigator.mediaSession.setActionHandler('pause', () => this.audio.pause());
      navigator.mediaSession.setActionHandler('previoustrack', () => this.prev());
      navigator.mediaSession.setActionHandler('nexttrack', () => this.next());
    }
  }

  openVideoModal() {
    const track = this.currentTrack;
    if (!track.videoSrc) {
      // For audio tracks without MP4 video, open the Photo Theater Slideshow directly!
      this.openPhotoTheater();
      return;
    }

    const modal = document.getElementById('videoPreviewModal');
    const modalVideo = document.getElementById('modalVideoPlayer');
    const modalTitle = document.getElementById('modalVideoTitle');

    if (modal && modalVideo) {
      modalTitle.textContent = `${track.title} — العرض المرئي`;
      modalVideo.src = track.videoSrc;
      modal.classList.add('active');
      modalVideo.play().catch(e => console.log(e));

      // Pause background audio while video plays
      if (this.isPlaying) {
        this.audio.pause();
      }
    }
  }

  closeVideoModal() {
    const modal = document.getElementById('videoPreviewModal');
    const modalVideo = document.getElementById('modalVideoPlayer');
    if (modal && modalVideo) {
      modalVideo.pause();
      modalVideo.src = '';
      modal.classList.remove('active');
    }
  }

  /* ========================================================================
     Photo Slideshow Theater System (العرض التلقائي للصور مع النشيد)
     ======================================================================== */
  initPhotoTheaterDOM() {
    // Bind buttons in photo theater modal
    const closeBtn = document.getElementById('theaterCloseBtn');
    const prevBtn = document.getElementById('theaterPrevBtn');
    const nextBtn = document.getElementById('theaterNextBtn');
    const toggleTimerBtn = document.getElementById('theaterToggleTimerBtn');
    const playerPhotoBtn = document.getElementById('playerPhotoSlideBtn');

    if (closeBtn) closeBtn.addEventListener('click', () => this.closePhotoTheater());
    if (prevBtn) prevBtn.addEventListener('click', () => this.prevPhoto());
    if (nextBtn) nextBtn.addEventListener('click', () => this.nextPhoto());
    if (toggleTimerBtn) toggleTimerBtn.addEventListener('click', () => this.togglePhotoTimer());
    if (playerPhotoBtn) playerPhotoBtn.addEventListener('click', () => this.openPhotoTheater());

    // Close on Escape or click outside
    window.addEventListener('keydown', (e) => {
      const modal = document.getElementById('photoTheaterModal');
      if (modal && modal.classList.contains('active')) {
        if (e.key === 'Escape') this.closePhotoTheater();
        if (e.key === 'ArrowRight') this.prevPhoto();
        if (e.key === 'ArrowLeft') this.nextPhoto();
        if (e.key === ' ') {
          e.preventDefault();
          this.togglePlay();
        }
      }
    });

    const modal = document.getElementById('photoTheaterModal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closePhotoTheater();
      });
    }
  }

  registerPhotoListener(callback) {
    if (typeof callback === 'function') {
      this.photoListeners.push(callback);
    }
  }

  notifyPhotoChange() {
    const photo = this.galleryItems[this.currentPhotoIndex];
    if (!photo) return;

    this.photoListeners.forEach(cb => {
      try { cb(photo, this.currentPhotoIndex); } catch(e) {}
    });

    this.updatePhotoTheaterUI();
  }

  startPhotoSlideshow() {
    if (this.photoTimer) clearInterval(this.photoTimer);
    if (!this.isPhotoSlideshowRunning) return;

    this.notifyPhotoChange();
    this.photoTimer = setInterval(() => {
      if (this.isPlaying && this.isPhotoSlideshowRunning) {
        this.currentPhotoIndex = (this.currentPhotoIndex + 1) % this.galleryItems.length;
        this.notifyPhotoChange();
      }
    }, this.photoIntervalMs);
  }

  stopPhotoSlideshow() {
    if (this.photoTimer) {
      clearInterval(this.photoTimer);
      this.photoTimer = null;
    }
  }

  togglePhotoTimer() {
    this.isPhotoSlideshowRunning = !this.isPhotoSlideshowRunning;
    const btn = document.getElementById('theaterTimerStateText');
    if (btn) {
      btn.textContent = this.isPhotoSlideshowRunning ? 'تبديل تلقائي: نشط (4.5ث)' : 'تبديل تلقائي: متوقف';
    }
    if (this.isPhotoSlideshowRunning && this.isPlaying) {
      this.startPhotoSlideshow();
    } else {
      this.stopPhotoSlideshow();
    }
  }

  nextPhoto() {
    this.currentPhotoIndex = (this.currentPhotoIndex + 1) % this.galleryItems.length;
    this.notifyPhotoChange();
  }

  prevPhoto() {
    this.currentPhotoIndex = (this.currentPhotoIndex - 1 + this.galleryItems.length) % this.galleryItems.length;
    this.notifyPhotoChange();
  }

  openPhotoTheater() {
    const modal = document.getElementById('photoTheaterModal');
    if (!modal) return;
    this.updatePhotoTheaterUI();
    modal.classList.add('active');

    if (!this.isPlaying) {
      this.audio.play().catch(() => {});
    }
  }

  closePhotoTheater() {
    const modal = document.getElementById('photoTheaterModal');
    if (modal) {
      modal.classList.remove('active');
    }
  }

  updatePhotoTheaterUI() {
    const photo = this.galleryItems[this.currentPhotoIndex];
    if (!photo) return;

    const img = document.getElementById('theaterMainImg');
    const counter = document.getElementById('theaterCounter');
    const title = document.getElementById('theaterTitle');
    const cat = document.getElementById('theaterCategoryBadge');
    const trackInd = document.getElementById('theaterTrackIndicator');

    if (img) {
      if (img.getAttribute('data-src') !== photo.src) {
        img.style.opacity = '0.3';
        img.src = photo.src;
        img.setAttribute('data-src', photo.src);
        img.alt = photo.title;
        setTimeout(() => { img.style.opacity = '1'; }, 40);
      }
    }
    if (counter) counter.textContent = `${this.currentPhotoIndex + 1} / ${this.galleryItems.length}`;
    if (title) title.textContent = photo.title;
    if (cat) cat.textContent = photo.category;
    if (trackInd) trackInd.textContent = `النشيد: ${this.currentTrack.title}`;
  }
}

/**
 * معرض ذاكرة غرسة ورِحلة التفاعلي — Lightbox & Filterable Gallery
 */

export class MemoryGallery {
  constructor(items, containerEl) {
    this.items = items;
    this.containerEl = containerEl;
    this.currentFilter = 'all';
    this.activePhotoIndex = 0;
    this.filteredItems = [...this.items];

    this.initLightbox();
  }

  setFilter(filterId) {
    this.currentFilter = filterId;
    if (filterId === 'all') {
      this.filteredItems = [...this.items];
    } else if (filterId === 'planting') {
      this.filteredItems = this.items.filter(item => item.category.includes('غرس'));
    } else if (filterId === 'schools') {
      this.filteredItems = this.items.filter(item => item.category.includes('المدارس'));
    } else if (filterId === 'volunteers') {
      this.filteredItems = this.items.filter(item => item.category.includes('التطوع'));
    } else if (filterId === 'workshops') {
      this.filteredItems = this.items.filter(item => item.category.includes('الورش'));
    } else {
      this.filteredItems = [...this.items];
    }

    this.render();
  }

  render() {
    if (!this.containerEl) return;

    this.containerEl.innerHTML = this.filteredItems.map((item, idx) => {
      // determine aspect class
      let aspectClass = '';
      if (item.aspectRatio === '3:2') aspectClass = 'aspect-3-2';
      else if (item.aspectRatio === '16:9') aspectClass = 'aspect-16-9';

      const isFeatured = (idx % 7 === 0) ? 'featured' : '';

      return `
        <div class="gallery-item ${aspectClass} ${isFeatured}" data-index="${idx}" tabindex="0" role="button" aria-label="عرض صورة: ${item.title}">
          <img 
            src="${item.src}" 
            alt="توثيق ميداني لأنشطة غرسة ورِحلة التطوعية" 
            class="gallery-img" 
            loading="lazy" 
            decoding="async"
          />
          <div class="gallery-item-overlay">
            <span class="badge badge-emerald gallery-overlay-badge">${item.category}</span>
            <h4 class="gallery-overlay-title">${item.title}</h4>
            <span class="gallery-overlay-meta">أبعاد الصورة: ${item.width} × ${item.height} px</span>
          </div>
        </div>
      `;
    }).join('');

    // Bind click and Enter key events
    this.containerEl.querySelectorAll('.gallery-item').forEach(el => {
      el.addEventListener('click', () => {
        const idx = parseInt(el.getAttribute('data-index'), 10);
        this.openLightbox(idx);
      });
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const idx = parseInt(el.getAttribute('data-index'), 10);
          this.openLightbox(idx);
        }
      });
    });
  }

  initLightbox() {
    // Keyboard navigation
    window.addEventListener('keydown', (e) => {
      const modal = document.getElementById('lightboxModal');
      if (modal && modal.classList.contains('active')) {
        if (e.key === 'Escape') this.closeLightbox();
        // In RTL: ArrowRight usually means Next, ArrowLeft means Prev
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') this.prevPhoto();
        if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') this.nextPhoto();
      }
    });

    // Close button
    const closeBtn = document.getElementById('lightboxCloseBtn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeLightbox());
    }

    // Prev / Next buttons
    const prevBtn = document.getElementById('lightboxPrevBtn');
    const nextBtn = document.getElementById('lightboxNextBtn');
    if (prevBtn) prevBtn.addEventListener('click', () => this.prevPhoto());
    if (nextBtn) nextBtn.addEventListener('click', () => this.nextPhoto());

    // Click backdrop to close
    const modal = document.getElementById('lightboxModal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeLightbox();
      });

      // Mobile touch swipe gestures
      let touchStartX = 0;
      let touchEndX = 0;
      modal.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
      }, { passive: true });

      modal.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        const diff = touchEndX - touchStartX;
        if (Math.abs(diff) > 40) {
          if (diff > 0) {
            this.prevPhoto();
          } else {
            this.nextPhoto();
          }
        }
      }, { passive: true });
    }
  }

  openLightbox(index) {
    if (index < 0 || index >= this.filteredItems.length) return;
    this.activePhotoIndex = index;
    const item = this.filteredItems[index];

    const modal = document.getElementById('lightboxModal');
    const imgEl = document.getElementById('lightboxMainImg');
    const counterEl = document.getElementById('lightboxCounter');
    const titleEl = document.getElementById('lightboxTitle');
    const catEl = document.getElementById('lightboxCategory');

    if (modal && imgEl) {
      imgEl.src = item.src;
      imgEl.alt = item.title;
      if (counterEl) counterEl.textContent = `${index + 1} / ${this.filteredItems.length}`;
      if (titleEl) titleEl.textContent = item.title;
      if (catEl) catEl.textContent = `${item.category} • تم التحقق والاعتماد للنشر`;

      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  closeLightbox() {
    const modal = document.getElementById('lightboxModal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  nextPhoto() {
    const nextIdx = (this.activePhotoIndex + 1) % this.filteredItems.length;
    this.openLightbox(nextIdx);
  }

  prevPhoto() {
    const prevIdx = (this.activePhotoIndex - 1 + this.filteredItems.length) % this.filteredItems.length;
    this.openLightbox(prevIdx);
  }
}

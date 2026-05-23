/**
 * Venture Safaries — Public Website Dynamic Engine
 * 
 * Manages dynamic rendering of all landing page blocks, filters, 
 * details popups, form validation, and local storage bindings.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Ensure the localStorage has seed data
  if (typeof DataService !== 'undefined') {
    DataService.seed();
  } else {
    console.error('DataService is not loaded. Shared database calls will fail.');
  }

  // Initialize all elements
  initBrandColors();
  initHeaderScroll();
  initMobileMenu();
  renderNavbar();
  renderHero();
  renderAbout();
  renderStats();
  renderPackages();
  renderDestinations();
  renderReviews();
  renderGallery();
  renderFAQs();
  renderFooter();
  initBookingForm();
  initDetailModalHandlers();
});

/* ─── STYLE ACCENTS & BRAND OVERRIDES ─── */
function initBrandColors() {
  const settings = DataService.get('vs_settings');
  if (settings && settings.primaryColor) {
    const styleTag = document.createElement('style');
    styleTag.innerHTML = `
      :root {
        --accent-gold: ${settings.primaryColor};
        --accent-gold-hover: ${adjustColorBrightness(settings.primaryColor, 15)};
        --accent-gold-rgb: ${hexToRgb(settings.primaryColor)};
      }
    `;
    document.head.appendChild(styleTag);
  }
}

// Helper to make hover gold color slightly brighter
function adjustColorBrightness(hex, percent) {
  let R = parseInt(hex.substring(1, 3), 16);
  let G = parseInt(hex.substring(3, 5), 16);
  let B = parseInt(hex.substring(5, 7), 16);

  R = parseInt((R * (100 + percent)) / 100);
  G = parseInt((G * (100 + percent)) / 100);
  B = parseInt((B * (100 + percent)) / 100);

  R = R < 255 ? R : 255;
  G = G < 255 ? G : 255;
  B = B < 255 ? B : 255;

  const rHex = R.toString(16).padStart(2, '0');
  const gHex = G.toString(16).padStart(2, '0');
  const bHex = B.toString(16).padStart(2, '0');

  return `#${rHex}${gHex}${bHex}`;
}

function hexToRgb(hex) {
  const r = parseInt(hex.substring(1, 3), 16);
  const g = parseInt(hex.substring(3, 5), 16);
  const b = parseInt(hex.substring(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}

/* ─── DYNAMIC NAV AND MOBILE MENUS ─── */
function initHeaderScroll() {
  const header = document.getElementById('main-header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
}

function initMobileMenu() {
  const hamburger = document.getElementById('hamburger-btn');
  const navMenu = document.getElementById('nav-menu');
  const links = document.querySelectorAll('.nav-link');

  hamburger.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    hamburger.querySelector('i').classList.toggle('fa-bars');
    hamburger.querySelector('i').classList.toggle('fa-times');
  });

  links.forEach(link => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('active');
      hamburger.querySelector('i').classList.add('fa-bars');
      hamburger.querySelector('i').classList.remove('fa-times');
    });
  });
}

function renderNavbar() {
  const settings = DataService.get('vs_settings');
  if (settings && settings.siteName) {
    const logoEl = document.getElementById('site-logo');
    const words = settings.siteName.split(' ');
    if (words.length > 1) {
      logoEl.innerHTML = `<span class="logo-accent">${words[0]}</span> ${words.slice(1).join(' ')}`;
    } else {
      logoEl.innerHTML = `<span class="logo-accent">${settings.siteName}</span>`;
    }
  }
}

/* ─── PAGE CONTAINER INJECTIONS ─── */
function renderHero() {
  const homepage = DataService.get('vs_homepage');
  if (homepage) {
    const heroSec = document.getElementById('hero');
    const heroTitle = document.getElementById('hero-title');
    const heroDesc = document.getElementById('hero-desc');
    const heroBtn = document.getElementById('hero-cta-btn');

    if (homepage.heroImage) {
      heroSec.style.backgroundImage = `url('${homepage.heroImage}')`;
    }
    heroTitle.textContent = homepage.heroTitle || 'Discover the World\'s Most Breathtaking Spots';
    heroDesc.textContent = homepage.heroSubtitle || '';
    if (homepage.ctaText) {
      heroBtn.textContent = homepage.ctaText;
    }
  }
}

function renderAbout() {
  const homepage = DataService.get('vs_homepage');
  if (homepage) {
    const aboutTitle = document.getElementById('about-title');
    const aboutImg = document.getElementById('about-img');
    const aboutTextContainer = document.getElementById('about-text-container');

    aboutTitle.textContent = homepage.aboutTitle || 'Your Journey, Our Passion';
    if (homepage.aboutImage) {
      aboutImg.src = homepage.aboutImage;
      aboutImg.onerror = () => {
        aboutImg.src = 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80';
      };
    }

    if (homepage.aboutText) {
      const paragraphs = homepage.aboutText.split('\n\n');
      aboutTextContainer.innerHTML = paragraphs.map(p => `<p>${p}</p>`).join('');
    }
  }
}

function renderStats() {
  const homepage = DataService.get('vs_homepage');
  const statsContainer = document.getElementById('stats-container');
  if (!statsContainer) return;

  if (homepage && homepage.stats && homepage.stats.length > 0) {
    statsContainer.innerHTML = homepage.stats.map(stat => `
      <div class="stat-item">
        <span class="stat-icon">${stat.icon || '⭐'}</span>
        <div class="stat-number">${stat.value}</div>
        <div class="stat-label">${stat.label}</div>
      </div>
    `).join('');
  } else {
    statsContainer.style.display = 'none';
  }
}

/* ─── TRAVEL PACKAGES GRID & FILTERS ─── */
function renderPackages() {
  const packages = DataService.getAll('vs_packages');
  const grid = document.getElementById('packages-grid');
  const filterBtns = document.querySelectorAll('#packages-filters .filter-btn');

  if (!grid) return;

  // Add click events to filter buttons
  filterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const filterValue = btn.getAttribute('data-filter');
      filterAndRenderPackages(filterValue, packages, grid);
    });
  });

  // Initial render (all packages)
  filterAndRenderPackages('all', packages, grid);
}

function filterAndRenderPackages(filter, allPackages, container) {
  let filtered = [...allPackages];

  if (filter === 'featured') {
    filtered = allPackages.filter(p => p.featured === true || p.featured === 'true');
  } else if (filter === 'short') {
    filtered = allPackages.filter(p => {
      const days = extractDays(p.duration);
      return days > 0 && days <= 7;
    });
  } else if (filter === 'long') {
    filtered = allPackages.filter(p => {
      const days = extractDays(p.duration);
      return days > 7;
    });
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="glass-card text-center" style="grid-column: 1 / -1; padding: 4rem 2rem;">
        <i class="fa-solid fa-suitcase" style="font-size: 3rem; color: var(--accent-gold); margin-bottom: 1.5rem; display: block;"></i>
        <h3>No Packages Found</h3>
        <p style="margin-top: 0.5rem;">We couldn't find any travel packages matching this filter right now. Try checking other categories!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(pkg => `
    <div class="card">
      <div class="card-img-wrapper">
        <img src="${pkg.image}" alt="${pkg.title}" class="card-img" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1516426122078-c23e76b4f964?w=600&q=80';">
        ${(pkg.featured === true || pkg.featured === 'true') ? `<span class="card-tag">Featured</span>` : ''}
      </div>
      <div class="card-body">
        <div class="card-meta">
          <div class="card-duration">
            <i class="fa-regular fa-clock"></i>
            <span>${pkg.duration}</span>
          </div>
          <div>
            <i class="fa-solid fa-location-dot"></i>
            <span>${pkg.destination.split(',')[0]}</span>
          </div>
        </div>
        <h3 class="card-title">${pkg.title}</h3>
        <p class="card-desc">${pkg.description}</p>
        <div class="card-footer">
          <div class="card-price">
            <span class="price-label">Price per person</span>
            <span class="price-value">$${pkg.price.toLocaleString()}</span>
          </div>
          <button class="btn btn-outline" onclick="openPackageDetails('${pkg.id}')" style="padding: 0.6rem 1.2rem; font-size: 0.85rem;">View Details</button>
        </div>
      </div>
    </div>
  `).join('');
}

// Helper to extract days from strings like "10 Days / 9 Nights" or "7 Days"
function extractDays(durationStr) {
  if (!durationStr) return 0;
  const match = durationStr.match(/(\d+)\s*(?:Day|day)/);
  return match ? parseInt(match[1]) : 0;
}

/* ─── TOP DESTINATIONS SECTION ─── */
function renderDestinations() {
  const destinations = DataService.getAll('vs_destinations');
  const grid = document.getElementById('destinations-grid');
  if (!grid) return;

  if (destinations.length === 0) {
    grid.innerHTML = `
      <div class="glass-card text-center" style="grid-column: 1 / -1; padding: 4rem 2rem;">
        <i class="fa-solid fa-earth-americas" style="font-size: 3rem; color: var(--accent-gold); margin-bottom: 1.5rem; display: block;"></i>
        <h3>No Destinations Listed</h3>
        <p style="margin-top: 0.5rem;">Check back later. Our travel curators are designing new luxury locations.</p>
      </div>
    `;
    return;
  }

  // Render top 6 first (featured or recently added)
  const sorted = [...destinations].sort((a,b) => {
    const aFeatured = a.featured === true || a.featured === 'true';
    const bFeatured = b.featured === true || b.featured === 'true';
    if (aFeatured && !bFeatured) return -1;
    if (!aFeatured && bFeatured) return 1;
    return 0;
  }).slice(0, 6);

  grid.innerHTML = sorted.map(dest => `
    <div class="dest-card" onclick="openDestinationDetails('${dest.id}')">
      <img src="${dest.image}" alt="${dest.name}" class="dest-img" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&q=80';">
      <div class="dest-overlay">
        <span class="dest-country">${dest.country}</span>
        <h3 class="dest-title">${dest.name}</h3>
        <p class="dest-desc">${dest.description}</p>
      </div>
    </div>
  `).join('');
}

/* ─── PUBLIC REVIEWS & TESTIMONIAL CAROUSEL ─── */
function renderReviews() {
  const reviews = DataService.getAll('vs_reviews');
  const container = document.getElementById('reviews-container');
  if (!container) return;

  if (reviews.length === 0) {
    container.innerHTML = `
      <div class="glass-card text-center" style="width: 100%; padding: 4rem 2rem;">
        <i class="fa-solid fa-star" style="font-size: 2.5rem; color: var(--accent-gold); margin-bottom: 1rem; display: block;"></i>
        <h3>No Reviews Yet</h3>
        <p style="margin-top: 0.5rem;">Be the first to leave a feedback on our booking inquiries!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = reviews.map(rev => {
    const starsHtml = '<i class="fa-solid fa-star"></i>'.repeat(rev.rating) + '<i class="fa-regular fa-star"></i>'.repeat(5 - rev.rating);
    const avatar = rev.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(rev.name)}&background=0d1020&color=d4a853&bold=true`;
    return `
      <div class="glass-card review-card">
        <div class="review-stars">${starsHtml}</div>
        <p class="review-text">"${rev.text}"</p>
        <div class="review-author">
          <img src="${avatar}" alt="${rev.name}" class="author-img" onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(rev.name)}&background=0d1020&color=d4a853';">
          <div class="author-info">
            <h4>${rev.name}</h4>
            <span>Travelled to ${rev.package || 'Exotic Spot'}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

/* ─── DYNAMIC MEDIA GRID GALLERY ─── */
function renderGallery() {
  const gallery = DataService.getAll('vs_gallery');
  const grid = document.getElementById('gallery-grid');
  if (!grid) return;

  if (gallery.length === 0) {
    grid.innerHTML = `
      <div class="glass-card text-center" style="grid-column: 1 / -1; padding: 4rem 2rem;">
        <i class="fa-solid fa-images" style="font-size: 2.5rem; color: var(--accent-gold); margin-bottom: 1rem; display: block;"></i>
        <h3>Gallery is Empty</h3>
      </div>
    `;
    return;
  }

  // Render top 8 images
  const items = gallery.slice(0, 8);
  grid.innerHTML = items.map(item => `
    <div class="gallery-item">
      <img src="${item.image}" alt="${item.caption}" class="gallery-img" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=600&q=80';">
      <div class="gallery-hover">
        <span class="gallery-category">${item.category}</span>
        <h4 class="gallery-caption">${item.caption}</h4>
      </div>
    </div>
  `).join('');
}

/* ─── CONTACTS AND FOOTER INFOS ─── */
function renderFooter() {
  const homepage = DataService.get('vs_homepage');
  const settings = DataService.get('vs_settings');

  if (homepage) {
    // Footer description & branding
    const footDesc = document.getElementById('footer-desc');
    const footPhone = document.getElementById('contact-phone');
    const footEmail = document.getElementById('contact-email');
    const footAddress = document.getElementById('contact-address');
    const footerLogo = document.getElementById('footer-logo');

    if (footDesc && homepage.footerText) {
      footDesc.textContent = homepage.footerText;
    }
    if (footPhone && homepage.footerPhone) {
      footPhone.textContent = homepage.footerPhone;
    }
    if (footEmail && homepage.footerEmail) {
      footEmail.textContent = homepage.footerEmail;
    }
    if (footAddress && homepage.footerAddress) {
      footAddress.textContent = homepage.footerAddress;
    }

    // Dynamic copyright year
    const yr = new Date().getFullYear();
    const copyrightEl = document.getElementById('footer-copyright');
    if (copyrightEl) {
      copyrightEl.innerHTML = `&copy; ${yr} ${settings.siteName || 'Venture Safaries'}. All rights reserved. Crafted with absolute luxury.`;
    }

    // Mid Banner CTA update
    const ctaSec = document.getElementById('cta-banner');
    const ctaTitle = document.getElementById('cta-title');
    const ctaDesc = document.getElementById('cta-desc');
    const ctaBtn = document.getElementById('cta-button-text');

    if (ctaSec && homepage.bannerImage) {
      ctaSec.style.backgroundImage = `url('${homepage.bannerImage}')`;
    }
    if (ctaTitle && homepage.bannerText) {
      ctaTitle.textContent = homepage.bannerText;
    }
  }

  // Social Links
  const socialsContainer = document.getElementById('footer-socials');
  if (socialsContainer && settings && settings.socialLinks) {
    const s = settings.socialLinks;
    socialsContainer.innerHTML = `
      ${s.facebook ? `<a href="${s.facebook}" target="_blank" class="social-icon"><i class="fa-brands fa-facebook-f"></i></a>` : ''}
      ${s.instagram ? `<a href="${s.instagram}" target="_blank" class="social-icon"><i class="fa-brands fa-instagram"></i></a>` : ''}
      ${s.twitter ? `<a href="${s.twitter}" target="_blank" class="social-icon"><i class="fa-brands fa-twitter"></i></a>` : ''}
      ${s.youtube ? `<a href="${s.youtube}" target="_blank" class="social-icon"><i class="fa-brands fa-youtube"></i></a>` : ''}
    `;
  }
}

/* ─── DYNAMIC FAQS ACCORDION ─── */
function renderFAQs() {
  const faqs = DataService.getAll('vs_faqs');
  const container = document.getElementById('faq-list');
  if (!container) return;

  if (faqs.length === 0) {
    container.innerHTML = `
      <div class="glass-card text-center" style="padding: 3rem 1.5rem;">
        <p>No Frequently Asked Questions listed. Need support? Send us a booking inquiry directly!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = faqs.map(faq => `
    <div class="faq-item">
      <button class="faq-trigger" onclick="toggleAccordion(this)">
        <span class="faq-title">${faq.question}</span>
        <i class="fa-solid fa-plus faq-icon"></i>
      </button>
      <div class="faq-content">
        <p>${faq.answer}</p>
      </div>
    </div>
  `).join('');
}

function toggleAccordion(button) {
  const item = button.closest('.faq-item');
  const isActive = item.classList.contains('active');
  
  // Close all other FAQs
  document.querySelectorAll('.faq-item').forEach(i => {
    i.classList.remove('active');
    i.querySelector('.faq-content').style.maxHeight = null;
  });

  if (!isActive) {
    item.classList.add('active');
    const content = item.querySelector('.faq-content');
    content.style.maxHeight = content.scrollHeight + "px";
  }
}

/* ─── RESERVATIONS & BOOKING INQUIRIES ─── */
function initBookingForm() {
  const form = document.getElementById('booking-form');
  const select = document.getElementById('booking-package');
  if (!form) return;

  // Populate packages dropdown options
  const packages = DataService.getAll('vs_packages');
  select.innerHTML = `
    <option value="" disabled selected>Choose a package</option>
    ${packages.map(p => `<option value="${p.title}">${p.title} ($${p.price.toLocaleString()})</option>`).join('')}
    <option value="Custom Luxury Itinerary">Bespoke Custom Excursion (Create for me)</option>
  `;

  // Handle Form Submission
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('booking-name').value.trim();
    const phone = document.getElementById('booking-phone').value.trim();
    const email = document.getElementById('booking-email').value.trim();
    const packageChosen = select.value;
    const travelDate = document.getElementById('booking-date').value;
    const travelers = parseInt(document.getElementById('booking-travelers').value) || 1;
    const message = document.getElementById('booking-message').value.trim();

    // Basic Validations
    if (!name || !phone || !email || !packageChosen || !travelDate || travelers < 1) {
      showToast('Please fill out all required fields (*)', 'error');
      return;
    }

    if (!validateEmail(email)) {
      showToast('Please enter a valid email address.', 'error');
      return;
    }

    // Add Request to Storage database
    const newRequest = {
      name,
      phone,
      email,
      package: packageChosen,
      date: travelDate,
      travelers,
      message,
      status: 'New' // New / Contacted / Confirmed / Cancelled
    };

    const res = DataService.create('vs_requests', newRequest);
    if (res.success) {
      showToast('Your luxurious travel inquiry has been received! Our curators will reach out shortly.', 'success');
      form.reset();
    } else {
      showToast(res.error || 'Failed to submit inquiry. Please try again.', 'error');
    }
  });
}

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}

/* ─── DYNAMIC INFORMATION MODAL HANDLERS ─── */
function initDetailModalHandlers() {
  const overlay = document.getElementById('detail-modal');
  const closeBtn = document.getElementById('modal-close-btn');
  const tabBtns = document.querySelectorAll('.modal-tab-btn');

  if (!overlay) return;

  // Close triggers
  closeBtn.addEventListener('click', () => {
    overlay.classList.remove('active');
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.classList.remove('active');
    }
  });

  // Details Modal Tab Toggles
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const targetTabId = btn.getAttribute('data-tab');
      const tabContents = document.querySelectorAll('.modal-tab-content');
      
      tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === targetTabId) {
          content.classList.add('active');
        }
      });
    });
  });
}

// Global modal launch triggers (triggered from package cards)
window.openPackageDetails = function(packageId) {
  const pkg = DataService.getById('vs_packages', packageId);
  if (!pkg) {
    showToast('Failed to load package details.', 'error');
    return;
  }

  const overlay = document.getElementById('detail-modal');
  const modalHeaderImg = document.getElementById('modal-header-img');
  const modalSubtitle = document.getElementById('modal-subtitle');
  const modalTitle = document.getElementById('modal-title');
  const modalMetaGrid = document.getElementById('modal-meta-grid');
  const modalDesc = document.getElementById('modal-description');
  
  // Set basic modal contents
  modalHeaderImg.style.backgroundImage = `url('${pkg.image}')`;
  modalSubtitle.textContent = pkg.destination;
  modalTitle.textContent = pkg.title;
  modalDesc.textContent = pkg.description;

  // Meta statistics
  modalMetaGrid.innerHTML = `
    <div class="modal-meta-item">
      <span>Duration</span>
      <strong>${pkg.duration}</strong>
    </div>
    <div class="modal-meta-item">
      <span>Excursion Cost</span>
      <strong style="color: var(--accent-gold);">$${pkg.price.toLocaleString()}</strong>
    </div>
    <div class="modal-meta-item">
      <span>Highlights</span>
      <strong>Inclusions Included</strong>
    </div>
  `;

  // Reset tab active state to Itinerary
  resetModalTabs();

  // Load Itinerary Timeline
  const itineraryList = document.getElementById('modal-itinerary-list');
  if (pkg.itinerary && pkg.itinerary.length > 0) {
    itineraryList.innerHTML = pkg.itinerary.map((dayText, idx) => `
      <li class="itinerary-item">
        <h4>${dayText.split(':')[0]}</h4>
        <p>${dayText.split(':').slice(1).join(':') || 'Explore breathtaking landscapes and curated schedules.'}</p>
      </li>
    `).join('');
  } else {
    itineraryList.innerHTML = '<li>No detailed itinerary listed for this tour yet. Contact our travel curators.</li>';
  }

  // Load Inclusions / Perks
  const facilitiesGrid = document.getElementById('modal-facilities-grid');
  const allInclusions = [...(pkg.facilities || []), ...(pkg.activities || [])];
  if (allInclusions.length > 0) {
    facilitiesGrid.innerHTML = allInclusions.map(inc => `
      <div class="facility-item">
        <i class="fa-regular fa-circle-check facility-icon"></i>
        <span>${inc}</span>
      </div>
    `).join('');
  } else {
    facilitiesGrid.innerHTML = '<div>Inclusions detailed upon booking requests.</div>';
  }

  // Load Images Gallery
  const photosGrid = document.getElementById('modal-photos-grid');
  const allPhotos = [pkg.image, ...(pkg.gallery || [])];
  photosGrid.innerHTML = allPhotos.map(photo => `
    <img src="${photo}" alt="Tour Detail Thumbnail" class="modal-gallery-img" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=400&q=80';">
  `).join('');

  // Update Booking Selector pre-fill on Enquiry CTA
  const enquireCta = document.getElementById('modal-enquiry-cta');
  enquireCta.addEventListener('click', () => {
    overlay.classList.remove('active');
    const select = document.getElementById('booking-package');
    if (select) {
      select.value = pkg.title;
    }
  });

  // Open Modal
  overlay.classList.add('active');
};

window.openDestinationDetails = function(destId) {
  const dest = DataService.getById('vs_destinations', destId);
  if (!dest) {
    showToast('Failed to load destination details.', 'error');
    return;
  }

  const overlay = document.getElementById('detail-modal');
  const modalHeaderImg = document.getElementById('modal-header-img');
  const modalSubtitle = document.getElementById('modal-subtitle');
  const modalTitle = document.getElementById('modal-title');
  const modalMetaGrid = document.getElementById('modal-meta-grid');
  const modalDesc = document.getElementById('modal-description');
  
  // Set basic modal contents
  modalHeaderImg.style.backgroundImage = `url('${dest.image}')`;
  modalSubtitle.textContent = dest.country;
  modalTitle.textContent = dest.name;
  modalDesc.textContent = dest.description;

  // Meta stats
  modalMetaGrid.innerHTML = `
    <div class="modal-meta-item">
      <span>Location</span>
      <strong>${dest.country}</strong>
    </div>
    <div class="modal-meta-item">
      <span>Average Cost</span>
      <strong style="color: var(--accent-gold);">Custom Packages</strong>
    </div>
    <div class="modal-meta-item">
      <span>Status</span>
      <strong style="color: #2ea043;">Open to visit</strong>
    </div>
  `;

  // Reset tab active state to Inclusions/highlights
  resetModalTabs('tab-btn-facilities', 'tab-facilities');

  // Load Itinerary Tab (Just a placeholder since destination has no itinerary)
  const itineraryList = document.getElementById('modal-itinerary-list');
  itineraryList.innerHTML = `
    <li class="itinerary-item">
      <h4>Tailored Schedule Customization</h4>
      <p>Destinations can be booked using any of our existing packages or custom bespoke bookings. Our curators will design a specialized day-by-day plan exclusively for you.</p>
    </li>
  `;

  // Load Highlights
  const facilitiesGrid = document.getElementById('modal-facilities-grid');
  if (dest.highlights && dest.highlights.length > 0) {
    facilitiesGrid.innerHTML = dest.highlights.map(hl => `
      <div class="facility-item">
        <i class="fa-solid fa-map-pin facility-icon"></i>
        <span>${hl}</span>
      </div>
    `).join('');
  } else {
    facilitiesGrid.innerHTML = '<div>Curated highlights details are available upon reservations.</div>';
  }

  // Load Destination gallery
  const photosGrid = document.getElementById('modal-photos-grid');
  const allPhotos = [dest.image, ...(dest.gallery || [])];
  photosGrid.innerHTML = allPhotos.map(photo => `
    <img src="${photo}" alt="Dest Detail Thumbnail" class="modal-gallery-img" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=400&q=80';">
  `).join('');

  // Update Booking Selector to custom
  const enquireCta = document.getElementById('modal-enquiry-cta');
  enquireCta.addEventListener('click', () => {
    overlay.classList.remove('active');
    const select = document.getElementById('booking-package');
    if (select) {
      select.value = 'Custom Luxury Itinerary';
      const msgArea = document.getElementById('booking-message');
      if (msgArea) {
        msgArea.value = `I am interested in a customized luxury trip to ${dest.name}, ${dest.country}. Please help me build my itinerary!`;
      }
    }
  });

  // Open Modal
  overlay.classList.add('active');
};

function resetModalTabs(activeBtnId = 'tab-btn-itinerary', activeContentId = 'tab-itinerary') {
  const tabBtns = document.querySelectorAll('.modal-tab-btn');
  const tabContents = document.querySelectorAll('.modal-tab-content');

  tabBtns.forEach(btn => {
    btn.classList.remove('active');
    if (btn.id === activeBtnId) {
      btn.classList.add('active');
    }
  });

  tabContents.forEach(content => {
    content.classList.remove('active');
    if (content.id === activeContentId) {
      content.classList.add('active');
    }
  });
}

/* ─── LIVE DYNAMIC TOAST FEEDBACKS ─── */
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const icon = type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation';
  toast.innerHTML = `
    <i class="fa-solid ${icon}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  // Trigger anim
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);

  // Auto remove toast
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.remove();
    }, 400);
  }, 4000);
}

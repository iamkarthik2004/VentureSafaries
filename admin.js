/**
 * Venture Safaries — Admin Portal & CMS Engine
 * 
 * Manages SaaS session auth, real-time widget metrics, full CRUD controllers,
 * custom dynamic form fields, live home adjustments, and database settings.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Ensure the localStorage has seed data
  if (typeof DataService !== 'undefined') {
    DataService.seed();
  } else {
    console.error('DataService is not loaded. Shared database calls will fail.');
  }

  // Auth check on startup
  checkAuth();

  // Setup login handler
  initAdminLogin();

  // Reusable Confirmation Modal setup
  initConfirmModal();
});

/* ─── SYSTEM AUTHENTICATION & LOGIN ─── */
function checkAuth() {
  const isAuth = sessionStorage.getItem('vs_admin_auth') === 'true';
  const loginState = document.getElementById('login-state');
  const dashboardState = document.getElementById('dashboard-state');

  if (isAuth) {
    loginState.style.display = 'none';
    dashboardState.style.display = 'flex';
    
    // Boot the dashboard panels
    initDashboard();
  } else {
    loginState.style.display = 'flex';
    dashboardState.style.display = 'none';
  }
}

function initAdminLogin() {
  const form = document.getElementById('login-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value.trim();
    const pass = document.getElementById('login-password').value.trim();
    const settings = DataService.get('vs_settings');

    const adminEmail = (settings && settings.adminEmail) ? settings.adminEmail : 'admin@venturesafaries.com';
    const adminPass = (settings && settings.adminPassword) ? settings.adminPassword : 'admin123';

    if (email === adminEmail && pass === adminPass) {
      sessionStorage.setItem('vs_admin_auth', 'true');
      showAdminToast('Access granted. Welcome back, Administrator.', 'success');
      form.reset();
      checkAuth();
    } else {
      showAdminToast('Authentication failed. Invalid email or security password.', 'error');
    }
  });

  // Logout Handler
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      sessionStorage.removeItem('vs_admin_auth');
      showAdminToast('Signed out successfully.', 'success');
      checkAuth();
    });
  }
}

/* ─── CMS GENERAL DASHBOARD SETUP ─── */
function initDashboard() {
  initSidebarNav();
  initMobileSidebar();
  applySettingsBrandAccent();

  // Load Initial Panel: Dashboard
  switchPanel('panel-dashboard', 'Dashboard Overview', 'Real-time site metrics and operational activities.');
  loadDashboardStats();
  loadRecentRequests();

  // Hook Quick System Actions
  document.getElementById('dash-view-all-requests').addEventListener('click', () => {
    const navReq = document.querySelector('.nav-item[data-panel="panel-requests"]');
    if (navReq) navReq.click();
  });

  document.getElementById('dash-btn-add-package').addEventListener('click', () => {
    const navPkg = document.querySelector('.nav-item[data-panel="panel-packages"]');
    if (navPkg) navPkg.click();
    setTimeout(() => {
      document.getElementById('btn-create-package-modal').click();
    }, 100);
  });

  document.getElementById('dash-btn-add-destination').addEventListener('click', () => {
    const navDest = document.querySelector('.nav-item[data-panel="panel-destinations"]');
    if (navDest) navDest.click();
    setTimeout(() => {
      document.getElementById('btn-create-dest-modal').click();
    }, 100);
  });

  document.getElementById('dash-btn-edit-homepage').addEventListener('click', () => {
    const navHome = document.querySelector('.nav-item[data-panel="panel-homepage"]');
    if (navHome) navHome.click();
  });

  // Force Database Reseed
  const seedBtn = document.getElementById('dash-btn-seed-force');
  if (seedBtn) {
    seedBtn.addEventListener('click', () => {
      openConfirmModal(
        'Force Database Reset?',
        'This will wipe all custom bookings, packages, and destinations, restoring the default luxurious demo items. Proceed?',
        () => {
          DataService.seed(true);
          showAdminToast('Database reseeded successfully!', 'success');
          loadDashboardStats();
          loadRecentRequests();
        }
      );
    });
  }

  // Hook all CRUD Form builders
  initDynamicFieldsBuilders();
  initPackagesFormCRUD();
  initDestinationsFormCRUD();
  initRequestsCRUD();
  initHomepageFormCRUD();
  initReviewsFormCRUD();
  initGalleryFormCRUD();
  initFAQsFormCRUD();
  initSettingsFormCRUD();
}

function applySettingsBrandAccent() {
  const settings = DataService.get('vs_settings');
  if (settings && settings.primaryColor) {
    const styleTag = document.createElement('style');
    styleTag.innerHTML = `
      :root {
        --admin-accent: ${settings.primaryColor};
        --admin-accent-hover: ${settings.primaryColor}dd;
      }
    `;
    document.head.appendChild(styleTag);

    // Update Avatar initials name
    const avatar = document.getElementById('admin-avatar-initials');
    const profileName = document.getElementById('admin-profile-name');
    if (settings.siteName) {
      profileName.textContent = settings.siteName.split(' ')[0] + ' Staff';
      avatar.textContent = settings.siteName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    }
  }
}

function initSidebarNav() {
  const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      navItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');

      const panelId = item.getAttribute('data-panel');
      let title = 'Dashboard Overview';
      let subtitle = 'Real-time site metrics and operational activities.';

      switch (panelId) {
        case 'panel-dashboard':
          title = 'Dashboard Overview';
          subtitle = 'Real-time site metrics and operational activities.';
          loadDashboardStats();
          loadRecentRequests();
          break;
        case 'panel-packages':
          title = 'Manage Packages';
          subtitle = 'Create, update, and manage travel package listings.';
          loadPackagesList();
          break;
        case 'panel-destinations':
          title = 'Manage Destinations';
          subtitle = 'Create and edit visual location highlights pages.';
          loadDestinationsList();
          break;
        case 'panel-requests':
          title = 'Customer Requests';
          subtitle = 'Review and manage booking inquiries and reservations.';
          loadAllRequests();
          break;
        case 'panel-homepage':
          title = 'Homepage Editor';
          subtitle = 'Visual editor to customize landing text, banners, and stats.';
          loadHomepageEditor();
          break;
        case 'panel-reviews':
          title = 'Reviews Manager';
          subtitle = 'Approve, edit, or append user experience ratings.';
          loadReviewsList();
          break;
        case 'panel-gallery':
          title = 'Gallery Manager';
          subtitle = 'Update grid images, edit captions, and adjust media tags.';
          loadGalleryList();
          break;
        case 'panel-faqs':
          title = 'FAQ Manager';
          subtitle = 'Edit and append accordion sections on general inquiries.';
          loadFAQsList();
          break;
        case 'panel-settings':
          title = 'Site Brand & Security Settings';
          subtitle = 'Configure administrative credentials, brand colors, and logo assets.';
          loadSettings();
          break;
      }

      switchPanel(panelId, title, subtitle);
      
      // Auto close sidebar on mobile sizes
      const sidebar = document.getElementById('sidebar');
      if (window.innerWidth <= 992) {
        sidebar.classList.remove('active');
      }
    });
  });
}

function initMobileSidebar() {
  const sidebar = document.getElementById('sidebar');
  const openBtn = document.getElementById('sidebar-open');
  const closeBtn = document.getElementById('sidebar-close');

  if (openBtn && closeBtn) {
    openBtn.addEventListener('click', () => sidebar.classList.add('active'));
    closeBtn.addEventListener('click', () => sidebar.classList.remove('active'));
  }
}

function switchPanel(panelId, title, subtitle) {
  // Toggle visible panel
  document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
  const target = document.getElementById(panelId);
  if (target) target.classList.add('active');

  // Set titles
  document.getElementById('panel-title-text').textContent = title;
  document.getElementById('panel-subtitle-text').textContent = subtitle;
}

/* ─── DASHBOARD WIDGET METRICS ─── */
function loadDashboardStats() {
  const packages = DataService.getAll('vs_packages');
  const destinations = DataService.getAll('vs_destinations');
  const requests = DataService.getAll('vs_requests');
  const reviews = DataService.getAll('vs_reviews');

  const pendingRequests = requests.filter(r => r.status === 'New').length;

  document.getElementById('widget-count-packages').textContent = packages.length;
  document.getElementById('widget-count-destinations').textContent = destinations.length;
  document.getElementById('widget-count-requests').textContent = pendingRequests;
  document.getElementById('widget-count-reviews').textContent = reviews.length;
}

function loadRecentRequests() {
  const requests = DataService.getAll('vs_requests');
  const tbody = document.getElementById('dashboard-recent-requests-table');
  if (!tbody) return;

  if (requests.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center" style="color: var(--admin-text-muted);">No booking requests found.</td></tr>`;
    return;
  }

  // Sort by date/timestamp (newest first) and slice top 5
  const sorted = [...requests].sort((a,b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 5);

  tbody.innerHTML = sorted.map(req => {
    const badgeClass = getRequestBadgeClass(req.status);
    const dateFormatted = req.createdAt ? new Date(req.createdAt).toLocaleDateString() : (req.date || 'N/A');
    return `
      <tr>
        <td>
          <div style="font-weight: 600; color: #ffffff;">${req.name}</div>
          <div style="font-size: 0.75rem; color: var(--admin-text-secondary);">${req.email}</div>
        </td>
        <td>${req.package}</td>
        <td>${dateFormatted}</td>
        <td><span class="badge ${badgeClass}">${req.status}</span></td>
        <td>
          <button class="btn-admin btn-admin-outline" onclick="jumpToRequestsPanelAndSearch('${req.name}')" style="padding: 0.3rem 0.6rem; font-size: 0.75rem;">Manage</button>
        </td>
      </tr>
    `;
  }).join('');
}

window.jumpToRequestsPanelAndSearch = function(customerName) {
  const navReq = document.querySelector('.nav-item[data-panel="panel-requests"]');
  if (navReq) {
    navReq.click();
    setTimeout(() => {
      const search = document.getElementById('request-search-input');
      if (search) {
        search.value = customerName;
        search.dispatchEvent(new Event('input'));
      }
    }, 150);
  }
};

function getRequestBadgeClass(status) {
  switch (status) {
    case 'New': return 'badge-new';
    case 'Contacted': return 'badge-contacted';
    case 'Confirmed': return 'badge-confirmed';
    case 'Cancelled': return 'badge-cancelled';
    default: return 'badge-new';
  }
}

/* ─── DYNAMIC FORM LIST MULTI-FIELDS BUILDERS ─── */
function initDynamicFieldsBuilders() {
  // Itinerary Row Builder
  document.getElementById('btn-add-itinerary-row').addEventListener('click', () => {
    appendItineraryRow('', '');
  });

  // Facility Inclusions Builder
  document.getElementById('btn-add-facility-row').addEventListener('click', () => {
    appendFacilityRow('');
  });

  // Activities Builder
  document.getElementById('btn-add-activity-row').addEventListener('click', () => {
    appendActivityRow('');
  });

  // Package Gallery Photos Builder
  document.getElementById('btn-add-pkg-gallery-row').addEventListener('click', () => {
    appendPkgGalleryRow('');
  });

  // Destination Highlights Builder
  document.getElementById('btn-add-dest-highlight-row').addEventListener('click', () => {
    appendDestHighlightRow('');
  });

  // Destination Gallery Photos Builder
  document.getElementById('btn-add-dest-gallery-row').addEventListener('click', () => {
    appendDestGalleryRow('');
  });
}

function appendItineraryRow(title = '', detail = '') {
  const container = document.getElementById('pkg-itinerary-items');
  const dayNum = container.children.length + 1;
  const row = document.createElement('div');
  row.className = 'dynamic-list-row';
  row.innerHTML = `
    <span style="font-size: 0.8rem; color: var(--admin-text-secondary); width: 60px; display: inline-block; align-self: center;">Day ${dayNum}:</span>
    <input type="text" class="form-control pkg-day-title" style="flex: 1;" placeholder="Arrive & Welcome Dinner" value="${title || ''}" required>
    <input type="text" class="form-control pkg-day-detail" style="flex: 2;" placeholder="Curated dinner at luxury lounge..." value="${detail || ''}" required>
    <button type="button" class="action-btn action-btn-delete" onclick="this.closest('.dynamic-list-row').remove(); renumberItineraryDays();"><i class="fa-solid fa-trash"></i></button>
  `;
  container.appendChild(row);
}

function renumberItineraryDays() {
  const rows = document.querySelectorAll('#pkg-itinerary-items .dynamic-list-row');
  rows.forEach((row, idx) => {
    row.querySelector('span').textContent = `Day ${idx + 1}:`;
  });
}

function appendFacilityRow(value = '') {
  const container = document.getElementById('pkg-facilities-items');
  const row = document.createElement('div');
  row.className = 'dynamic-list-row';
  row.innerHTML = `
    <input type="text" class="form-control pkg-facility-input" style="flex: 1;" placeholder="Luxury Overwater Villa accommodation" value="${value || ''}" required>
    <button type="button" class="action-btn action-btn-delete" onclick="this.closest('.dynamic-list-row').remove();"><i class="fa-solid fa-trash"></i></button>
  `;
  container.appendChild(row);
}

function appendActivityRow(value = '') {
  const container = document.getElementById('pkg-activities-items');
  const row = document.createElement('div');
  row.className = 'dynamic-list-row';
  row.innerHTML = `
    <input type="text" class="form-control pkg-activity-input" style="flex: 1;" placeholder="Hot Air Balloon Safaris over Serengeti" value="${value || ''}" required>
    <button type="button" class="action-btn action-btn-delete" onclick="this.closest('.dynamic-list-row').remove();"><i class="fa-solid fa-trash"></i></button>
  `;
  container.appendChild(row);
}

function appendPkgGalleryRow(value = '') {
  const container = document.getElementById('pkg-gallery-items');
  const row = document.createElement('div');
  row.className = 'dynamic-list-row';
  row.innerHTML = `
    <input type="url" class="form-control pkg-gallery-input" style="flex: 1;" placeholder="https://images.unsplash.com/photo-..." value="${value || ''}">
    <button type="button" class="action-btn action-btn-delete" onclick="this.closest('.dynamic-list-row').remove();"><i class="fa-solid fa-trash"></i></button>
  `;
  container.appendChild(row);
}

function appendDestHighlightRow(value = '') {
  const container = document.getElementById('dest-highlights-items');
  const row = document.createElement('div');
  row.className = 'dynamic-list-row';
  row.innerHTML = `
    <input type="text" class="form-control dest-highlight-input" style="flex: 1;" placeholder="Jungfraujoch Glacier Pass Visit" value="${value || ''}" required>
    <button type="button" class="action-btn action-btn-delete" onclick="this.closest('.dynamic-list-row').remove();"><i class="fa-solid fa-trash"></i></button>
  `;
  container.appendChild(row);
}

function appendDestGalleryRow(value = '') {
  const container = document.getElementById('dest-gallery-items');
  const row = document.createElement('div');
  row.className = 'dynamic-list-row';
  row.innerHTML = `
    <input type="url" class="form-control dest-gallery-input" style="flex: 1;" placeholder="https://images.unsplash.com/photo-..." value="${value || ''}">
    <button type="button" class="action-btn action-btn-delete" onclick="this.closest('.dynamic-list-row').remove();"><i class="fa-solid fa-trash"></i></button>
  `;
  container.appendChild(row);
}

/* ─── A: MANAGE PACKAGES CRUD PANEL ─── */
function initPackagesFormCRUD() {
  const modal = document.getElementById('modal-package-editor-overlay');
  const trigger = document.getElementById('btn-create-package-modal');
  const form = document.getElementById('pkg-editor-form');
  const searchInput = document.getElementById('package-search-input');

  trigger.addEventListener('click', () => {
    // Open in Create mode
    form.reset();
    document.getElementById('pkg-field-id').value = '';
    document.getElementById('pkg-modal-title-text').textContent = 'Add New Travel Package';
    
    // Clear dynamic blocks
    document.getElementById('pkg-itinerary-items').innerHTML = '';
    document.getElementById('pkg-facilities-items').innerHTML = '';
    document.getElementById('pkg-activities-items').innerHTML = '';
    document.getElementById('pkg-gallery-items').innerHTML = '';

    // Append single starting row for each dynamic input
    appendItineraryRow('Day 1: Arrive & Check-in', 'Explore nearby landscapes and check in to premium resorts.');
    appendFacilityRow('Breakfast Included');
    appendActivityRow('Sightseeing Guided Walks');

    openAdminModal('modal-package-editor-overlay');
  });

  // Packages search
  searchInput.addEventListener('input', () => {
    loadPackagesList(searchInput.value);
  });

  // Form submission
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const id = document.getElementById('pkg-field-id').value;
    const title = document.getElementById('pkg-field-title').value.trim();
    const destination = document.getElementById('pkg-field-dest').value.trim();
    const duration = document.getElementById('pkg-field-duration').value.trim();
    const price = parseInt(document.getElementById('pkg-field-price').value) || 100;
    const featured = document.getElementById('pkg-field-featured').value === 'true';
    const image = document.getElementById('pkg-field-image').value.trim();
    const description = document.getElementById('pkg-field-desc').value.trim();

    // Compile Dynamic arrays
    const itinerary = [];
    document.querySelectorAll('#pkg-itinerary-items .dynamic-list-row').forEach((row, index) => {
      const dayTitle = row.querySelector('.pkg-day-title').value.trim();
      const dayDetail = row.querySelector('.pkg-day-detail').value.trim();
      itinerary.push(`Day ${index + 1}: ${dayTitle} - ${dayDetail}`);
    });

    const facilities = Array.from(document.querySelectorAll('.pkg-facility-input')).map(el => el.value.trim()).filter(Boolean);
    const activities = Array.from(document.querySelectorAll('.pkg-activity-input')).map(el => el.value.trim()).filter(Boolean);
    const gallery = Array.from(document.querySelectorAll('.pkg-gallery-input')).map(el => el.value.trim()).filter(Boolean);

    const payload = {
      title, destination, duration, price, featured, image, description,
      itinerary, facilities, activities, gallery
    };

    let res;
    if (id) {
      // Edit
      res = DataService.update('vs_packages', id, payload);
    } else {
      // Create
      res = DataService.create('vs_packages', payload);
    }

    if (res.success) {
      showAdminToast(id ? 'Package updated successfully!' : 'Package created successfully!', 'success');
      closeAdminModal('modal-package-editor-overlay');
      loadPackagesList();
    } else {
      showAdminToast(res.error || 'Operations failed.', 'error');
    }
  });
}

function loadPackagesList(query = '') {
  const packages = DataService.getAll('vs_packages');
  const tbody = document.getElementById('admin-packages-table-body');
  if (!tbody) return;

  const filtered = packages.filter(p => 
    p.title.toLowerCase().includes(query.toLowerCase()) || 
    p.destination.toLowerCase().includes(query.toLowerCase())
  );

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center" style="color: var(--admin-text-muted);">No packages found.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(pkg => `
    <tr>
      <td><img src="${pkg.image}" alt="${pkg.title}" class="table-img" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1516426122078-c23e76b4f964?w=100&q=80';"></td>
      <td style="font-weight: 600; color: #ffffff;">${pkg.title}</td>
      <td>${pkg.destination}</td>
      <td>${pkg.duration}</td>
      <td style="color: var(--admin-gold); font-weight: 600;">₹${pkg.price.toLocaleString()}</td>
      <td>
        <span class="badge ${(pkg.featured === true || pkg.featured === 'true') ? 'badge-confirmed' : 'badge-new'}">
          ${(pkg.featured === true || pkg.featured === 'true') ? 'Featured' : 'Standard'}
        </span>
      </td>
      <td>
        <div class="action-btn-group">
          <button class="action-btn action-btn-edit" onclick="editPackage('${pkg.id}')" title="Edit Package"><i class="fa-solid fa-pen"></i></button>
          <button class="action-btn action-btn-delete" onclick="deletePackage('${pkg.id}')" title="Delete Package"><i class="fa-solid fa-trash"></i></button>
        </div>
      </td>
    </tr>
  `).join('');
}

window.editPackage = function(pkgId) {
  const pkg = DataService.getById('vs_packages', pkgId);
  if (!pkg) return;

  const form = document.getElementById('pkg-editor-form');
  form.reset();

  document.getElementById('pkg-field-id').value = pkg.id;
  document.getElementById('pkg-modal-title-text').textContent = 'Edit Travel Package';

  document.getElementById('pkg-field-title').value = pkg.title;
  document.getElementById('pkg-field-dest').value = pkg.destination;
  document.getElementById('pkg-field-duration').value = pkg.duration;
  document.getElementById('pkg-field-price').value = pkg.price;
  document.getElementById('pkg-field-featured').value = pkg.featured ? 'true' : 'false';
  document.getElementById('pkg-field-image').value = pkg.image;
  document.getElementById('pkg-field-desc').value = pkg.description;

  // Builddynamic lists
  const itineraryContainer = document.getElementById('pkg-itinerary-items');
  itineraryContainer.innerHTML = '';
  if (pkg.itinerary && pkg.itinerary.length > 0) {
    pkg.itinerary.forEach(dayText => {
      const match = dayText.match(/Day \d+:\s*(.*?)\s*-\s*(.*)/);
      if (match) {
        appendItineraryRow(match[1], match[2]);
      } else {
        const parts = dayText.split(':');
        appendItineraryRow(parts[0], parts.slice(1).join(':'));
      }
    });
  }

  const facilityContainer = document.getElementById('pkg-facilities-items');
  facilityContainer.innerHTML = '';
  if (pkg.facilities && pkg.facilities.length > 0) {
    pkg.facilities.forEach(f => appendFacilityRow(f));
  }

  const activityContainer = document.getElementById('pkg-activities-items');
  activityContainer.innerHTML = '';
  if (pkg.activities && pkg.activities.length > 0) {
    pkg.activities.forEach(a => appendActivityRow(a));
  }

  const galleryContainer = document.getElementById('pkg-gallery-items');
  galleryContainer.innerHTML = '';
  if (pkg.gallery && pkg.gallery.length > 0) {
    pkg.gallery.forEach(url => appendPkgGalleryRow(url));
  }

  openAdminModal('modal-package-editor-overlay');
};

window.deletePackage = function(pkgId) {
  openConfirmModal(
    'Delete Travel Package?',
    'This will wipe this tour package from the customer listing. It cannot be recovered. Proceed?',
    () => {
      const res = DataService.remove('vs_packages', pkgId);
      if (res.success) {
        showAdminToast('Package wiped successfully.', 'success');
        loadPackagesList();
      } else {
        showAdminToast(res.error || 'Failed to delete package.', 'error');
      }
    }
  );
};

/* ─── B: DESTINATIONS CRUD PANEL ─── */
function initDestinationsFormCRUD() {
  const modal = document.getElementById('modal-dest-editor-overlay');
  const trigger = document.getElementById('btn-create-dest-modal');
  const form = document.getElementById('dest-editor-form');
  const searchInput = document.getElementById('dest-search-input');

  trigger.addEventListener('click', () => {
    form.reset();
    document.getElementById('dest-field-id').value = '';
    document.getElementById('dest-modal-title-text').textContent = 'Add Destination Spot';
    
    document.getElementById('dest-highlights-items').innerHTML = '';
    document.getElementById('dest-gallery-items').innerHTML = '';

    appendDestHighlightRow('Local Temple Gates Walks');
    
    openAdminModal('modal-dest-editor-overlay');
  });

  searchInput.addEventListener('input', () => {
    loadDestinationsList(searchInput.value);
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const id = document.getElementById('dest-field-id').value;
    const name = document.getElementById('dest-field-name').value.trim();
    const country = document.getElementById('dest-field-country').value.trim();
    const image = document.getElementById('dest-field-image').value.trim();
    const featured = document.getElementById('dest-field-featured').value === 'true';
    const description = document.getElementById('dest-field-desc').value.trim();

    const highlights = Array.from(document.querySelectorAll('.dest-highlight-input')).map(el => el.value.trim()).filter(Boolean);
    const gallery = Array.from(document.querySelectorAll('.dest-gallery-input')).map(el => el.value.trim()).filter(Boolean);

    const payload = { name, country, image, featured, description, highlights, gallery };

    let res;
    if (id) {
      res = DataService.update('vs_destinations', id, payload);
    } else {
      res = DataService.create('vs_destinations', payload);
    }

    if (res.success) {
      showAdminToast(id ? 'Destination updated successfully!' : 'Destination created successfully!', 'success');
      closeAdminModal('modal-dest-editor-overlay');
      loadDestinationsList();
    } else {
      showAdminToast(res.error || 'Failed to save.', 'error');
    }
  });
}

function loadDestinationsList(query = '') {
  const destinations = DataService.getAll('vs_destinations');
  const tbody = document.getElementById('admin-dest-table-body');
  if (!tbody) return;

  const filtered = destinations.filter(d => 
    d.name.toLowerCase().includes(query.toLowerCase()) || 
    d.country.toLowerCase().includes(query.toLowerCase())
  );

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center" style="color: var(--admin-text-muted);">No destinations found.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(dest => `
    <tr>
      <td><img src="${dest.image}" alt="${dest.name}" class="table-img" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=100&q=80';"></td>
      <td style="font-weight: 600; color: #ffffff;">${dest.name}</td>
      <td>${dest.country}</td>
      <td style="max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${dest.description}</td>
      <td>
        <span class="badge ${(dest.featured === true || dest.featured === 'true') ? 'badge-confirmed' : 'badge-new'}">
          ${(dest.featured === true || dest.featured === 'true') ? 'Featured' : 'Standard'}
        </span>
      </td>
      <td>
        <div class="action-btn-group">
          <button class="action-btn action-btn-edit" onclick="editDestination('${dest.id}')" title="Edit Destination"><i class="fa-solid fa-pen"></i></button>
          <button class="action-btn action-btn-delete" onclick="deleteDestination('${dest.id}')" title="Delete Destination"><i class="fa-solid fa-trash"></i></button>
        </div>
      </td>
    </tr>
  `).join('');
}

window.editDestination = function(destId) {
  const dest = DataService.getById('vs_destinations', destId);
  if (!dest) return;

  const form = document.getElementById('dest-editor-form');
  form.reset();

  document.getElementById('dest-field-id').value = dest.id;
  document.getElementById('dest-modal-title-text').textContent = 'Edit Destination Spot';

  document.getElementById('dest-field-name').value = dest.name;
  document.getElementById('dest-field-country').value = dest.country;
  document.getElementById('dest-field-featured').value = dest.featured ? 'true' : 'false';
  document.getElementById('dest-field-image').value = dest.image;
  document.getElementById('dest-field-desc').value = dest.description;

  // Build highlights
  const highlightsContainer = document.getElementById('dest-highlights-items');
  highlightsContainer.innerHTML = '';
  if (dest.highlights && dest.highlights.length > 0) {
    dest.highlights.forEach(h => appendDestHighlightRow(h));
  }

  // Build photos
  const galleryContainer = document.getElementById('dest-gallery-items');
  galleryContainer.innerHTML = '';
  if (dest.gallery && dest.gallery.length > 0) {
    dest.gallery.forEach(url => appendDestGalleryRow(url));
  }

  openAdminModal('modal-dest-editor-overlay');
};

window.deleteDestination = function(destId) {
  openConfirmModal(
    'Delete Destination?',
    'Wiping this spot removes it from all lists. Travel packages mapped here are unaffected but the visual page is deleted. Proceed?',
    () => {
      const res = DataService.remove('vs_destinations', destId);
      if (res.success) {
        showAdminToast('Destination deleted successfully.', 'success');
        loadDestinationsList();
      } else {
        showAdminToast(res.error || 'Failed to delete.', 'error');
      }
    }
  );
};

/* ─── C: BOOKING REQUESTS SYSTEM PANEL ─── */
function initRequestsCRUD() {
  const searchInput = document.getElementById('request-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      loadAllRequests(searchInput.value);
    });
  }
}

function loadAllRequests(query = '') {
  const requests = DataService.getAll('vs_requests');
  const tbody = document.getElementById('admin-requests-table-body');
  if (!tbody) return;

  const filtered = requests.filter(r => 
    r.name.toLowerCase().includes(query.toLowerCase()) || 
    r.package.toLowerCase().includes(query.toLowerCase()) ||
    r.email.toLowerCase().includes(query.toLowerCase())
  );

  // Sort: pending/New first, then timestamp
  filtered.sort((a, b) => {
    if (a.status === 'New' && b.status !== 'New') return -1;
    if (a.status !== 'New' && b.status === 'New') return 1;
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center" style="color: var(--admin-text-muted);">No booking requests found.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(req => {
    const badgeClass = getRequestBadgeClass(req.status);
    const dateFormatted = req.createdAt ? new Date(req.createdAt).toLocaleString() : (req.date || 'N/A');
    
    return `
      <tr>
        <td>
          <div style="font-weight: 600; color: #ffffff;">${req.name}</div>
          <div style="font-size: 0.8rem; color: var(--admin-text-secondary);">${req.email}</div>
          <div style="font-size: 0.75rem; color: var(--admin-text-muted);">${req.phone}</div>
        </td>
        <td style="font-weight: 500;">${req.package}</td>
        <td>
          <div><strong>Travel Date:</strong> ${req.date}</div>
          <div><strong>Travelers:</strong> ${req.travelers} Guests</div>
        </td>
        <td style="max-width: 250px; font-size: 0.85rem; color: var(--admin-text-secondary); white-space: normal;">
          ${req.message ? `"${req.message}"` : '<span style="color: var(--admin-text-muted);">No custom notes</span>'}
        </td>
        <td style="font-size: 0.8rem; color: var(--admin-text-secondary);">${dateFormatted}</td>
        <td>
          <select class="form-control" onchange="updateRequestStatus('${req.id}', this.value)" style="padding: 0.35rem 0.5rem; font-size: 0.8rem; background: var(--admin-bg-sidebar); border: 1px solid var(--admin-border); border-radius: 4px; color: #fff; width: 120px;">
            <option value="New" ${req.status === 'New' ? 'selected' : ''}>New</option>
            <option value="Contacted" ${req.status === 'Contacted' ? 'selected' : ''}>Contacted</option>
            <option value="Confirmed" ${req.status === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
            <option value="Cancelled" ${req.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
        </td>
        <td>
          <div class="action-btn-group">
            <a href="mailto:${req.email}?subject=Reservation for ${encodeURIComponent(req.package)} - Venture Safaries&body=Hi ${encodeURIComponent(req.name)}," class="action-btn action-btn-edit" title="Email Client"><i class="fa-solid fa-reply"></i></a>
            <button class="action-btn action-btn-delete" onclick="deleteRequest('${req.id}')" title="Delete Inquiry"><i class="fa-solid fa-trash"></i></button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

window.updateRequestStatus = function(reqId, newStatus) {
  const res = DataService.update('vs_requests', reqId, { status: newStatus });
  if (res.success) {
    showAdminToast(`Status changed to ${newStatus}.`, 'success');
  } else {
    showAdminToast(res.error || 'Failed to update status.', 'error');
  }
};

window.deleteRequest = function(reqId) {
  openConfirmModal(
    'Delete Booking Request?',
    'This will wipe this record completely from admin databases. Proceed?',
    () => {
      const res = DataService.remove('vs_requests', reqId);
      if (res.success) {
        showAdminToast('Request record deleted successfully.', 'success');
        loadAllRequests();
      } else {
        showAdminToast(res.error || 'Failed to delete record.', 'error');
      }
    }
  );
};

/* ─── D: VISUAL HOMEPAGE EDITOR PANEL ─── */
function initHomepageFormCRUD() {
  const form = document.getElementById('homepage-editor-form');
  if (!form) return;

  // Bind key up URL previews for images
  document.getElementById('home-hero-image').addEventListener('change', (e) => {
    document.getElementById('preview-hero-img').src = e.target.value;
  });

  document.getElementById('home-about-image').addEventListener('change', (e) => {
    document.getElementById('preview-about-img').src = e.target.value;
  });

  document.getElementById('home-banner-image').addEventListener('change', (e) => {
    document.getElementById('preview-banner-img').src = e.target.value;
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Compile stats
    const stats = [];
    document.querySelectorAll('.homepage-stat-input-row').forEach(row => {
      const icon = row.querySelector('.home-stat-icon').value.trim();
      const value = row.querySelector('.home-stat-value').value.trim();
      const label = row.querySelector('.home-stat-label').value.trim();
      stats.push({ icon, value, label });
    });

    const payload = {
      heroTitle: document.getElementById('home-hero-title').value.trim(),
      heroSubtitle: document.getElementById('home-hero-subtitle').value.trim(),
      heroImage: document.getElementById('home-hero-image').value.trim(),
      ctaText: document.getElementById('home-cta-text').value.trim(),
      aboutTitle: document.getElementById('home-about-title').value.trim(),
      aboutText: document.getElementById('home-about-text').value.trim(),
      aboutImage: document.getElementById('home-about-image').value.trim(),
      bannerImage: document.getElementById('home-banner-image').value.trim(),
      bannerText: document.getElementById('home-banner-text').value.trim(),
      footerText: document.getElementById('home-footer-text').value.trim(),
      footerPhone: document.getElementById('home-footer-phone').value.trim(),
      footerEmail: document.getElementById('home-footer-email').value.trim(),
      footerAddress: document.getElementById('home-footer-address').value.trim(),
      stats
    };

    const res = DataService.set('vs_homepage', payload);
    if (res) {
      showAdminToast('Homepage elements saved successfully!', 'success');
      loadHomepageEditor();
    } else {
      showAdminToast('Failed to save homepage modifications.', 'error');
    }
  });
}

function loadHomepageEditor() {
  const homepage = DataService.get('vs_homepage');
  if (!homepage) return;

  document.getElementById('home-hero-title').value = homepage.heroTitle || '';
  document.getElementById('home-hero-subtitle').value = homepage.heroSubtitle || '';
  document.getElementById('home-hero-image').value = homepage.heroImage || '';
  document.getElementById('home-cta-text').value = homepage.ctaText || '';
  
  document.getElementById('home-about-title').value = homepage.aboutTitle || '';
  document.getElementById('home-about-text').value = homepage.aboutText || '';
  document.getElementById('home-about-image').value = homepage.aboutImage || '';
  
  document.getElementById('home-banner-image').value = homepage.bannerImage || '';
  document.getElementById('home-banner-text').value = homepage.bannerText || '';
  
  document.getElementById('home-footer-text').value = homepage.footerText || '';
  document.getElementById('home-footer-phone').value = homepage.footerPhone || '';
  document.getElementById('home-footer-email').value = homepage.footerEmail || '';
  document.getElementById('home-footer-address').value = homepage.footerAddress || '';

  // Setup Image previews
  document.getElementById('preview-hero-img').src = homepage.heroImage || '';
  document.getElementById('preview-about-img').src = homepage.aboutImage || '';
  document.getElementById('preview-banner-img').src = homepage.bannerImage || '';

  // Load stats row editors
  const container = document.getElementById('stats-inputs-grid');
  container.innerHTML = '';
  
  const statsList = homepage.stats && homepage.stats.length > 0 ? homepage.stats : [
    { label: 'Happy Travelers', value: '15,000+', icon: '🌍' },
    { label: 'Destinations', value: '120+', icon: '📍' },
    { label: 'Expert Guides', value: '85+', icon: '🧭' },
    { label: 'Years Experience', value: '12+', icon: '⭐' }
  ];

  statsList.forEach((stat, idx) => {
    const row = document.createElement('div');
    row.className = 'form-row-3 homepage-stat-input-row';
    row.style.border = '1px solid var(--admin-border)';
    row.style.padding = '1rem';
    row.style.borderRadius = '4px';
    row.style.background = 'rgba(255,255,255,0.01)';
    row.innerHTML = `
      <div class="form-group">
        <label>Metric Icon ${idx+1}</label>
        <input type="text" class="form-control home-stat-icon" value="${stat.icon || ''}" required placeholder="🌍">
      </div>
      <div class="form-group">
        <label>Counter Value ${idx+1}</label>
        <input type="text" class="form-control home-stat-value" value="${stat.value || ''}" required placeholder="15,000+">
      </div>
      <div class="form-group">
        <label>Label Text ${idx+1}</label>
        <input type="text" class="form-control home-stat-label" value="${stat.label || ''}" required placeholder="Happy Travelers">
      </div>
    `;
    container.appendChild(row);
  });
}

/* ─── E: TRAVELERS REVIEWS MANAGER CRUD ─── */
function initReviewsFormCRUD() {
  const trigger = document.getElementById('btn-create-review-modal');
  const form = document.getElementById('rev-editor-form');

  trigger.addEventListener('click', () => {
    form.reset();
    document.getElementById('rev-field-id').value = '';
    document.getElementById('rev-modal-title-text').textContent = 'Add Traveler Review';
    
    // Populate packages dropdown options
    const select = document.getElementById('rev-field-package');
    const packages = DataService.getAll('vs_packages');
    select.innerHTML = `
      <option value="" disabled selected>Choose a package</option>
      ${packages.map(p => `<option value="${p.title}">${p.title}</option>`).join('')}
      <option value="General Excursions">General Inquiry Experience</option>
    `;

    openAdminModal('modal-review-editor-overlay');
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const id = document.getElementById('rev-field-id').value;
    const name = document.getElementById('rev-field-name').value.trim();
    const packageChosen = document.getElementById('rev-field-package').value;
    const rating = parseInt(document.getElementById('rev-field-rating').value) || 5;
    const avatar = document.getElementById('rev-field-avatar').value.trim();
    const text = document.getElementById('rev-field-text').value.trim();

    const payload = {
      name, rating, text,
      package: packageChosen,
      avatar,
      date: new Date().toISOString().split('T')[0]
    };

    let res;
    if (id) {
      res = DataService.update('vs_reviews', id, payload);
    } else {
      res = DataService.create('vs_reviews', payload);
    }

    if (res.success) {
      showAdminToast(id ? 'Review updated successfully!' : 'Review created successfully!', 'success');
      closeAdminModal('modal-review-editor-overlay');
      loadReviewsList();
    } else {
      showAdminToast(res.error || 'Operations failed.', 'error');
    }
  });
}

function loadReviewsList() {
  const reviews = DataService.getAll('vs_reviews');
  const tbody = document.getElementById('admin-reviews-table-body');
  if (!tbody) return;

  if (reviews.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center" style="color: var(--admin-text-muted);">No reviews listed.</td></tr>`;
    return;
  }

  tbody.innerHTML = reviews.map(rev => {
    const starIcons = '<i class="fa-solid fa-star" style="color: var(--admin-gold); font-size: 0.75rem;"></i>'.repeat(rev.rating);
    const authorImg = rev.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(rev.name)}&background=0b0e1a&color=d4a853&bold=true`;
    return `
      <tr>
        <td>
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <img src="${authorImg}" alt="${rev.name}" style="width: 32px; height: 32px; border-radius: 50%; border: 1px solid var(--admin-gold);" onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(rev.name)}&background=0b0e1a&color=d4a853';">
            <span style="font-weight: 600; color: #ffffff;">${rev.name}</span>
          </div>
        </td>
        <td>${rev.package || 'General Excursions'}</td>
        <td><div>${starIcons}</div></td>
        <td style="max-width: 300px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 0.85rem; color: var(--admin-text-secondary);">"${rev.text}"</td>
        <td>${rev.date || 'N/A'}</td>
        <td>
          <div class="action-btn-group">
            <button class="action-btn action-btn-edit" onclick="editReview('${rev.id}')" title="Edit Review"><i class="fa-solid fa-pen"></i></button>
            <button class="action-btn action-btn-delete" onclick="deleteReview('${rev.id}')" title="Delete Review"><i class="fa-solid fa-trash"></i></button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

window.editReview = function(revId) {
  const rev = DataService.getById('vs_reviews', revId);
  if (!rev) return;

  const form = document.getElementById('rev-editor-form');
  form.reset();

  document.getElementById('rev-field-id').value = rev.id;
  document.getElementById('rev-modal-title-text').textContent = 'Edit Traveler Review';

  document.getElementById('rev-field-name').value = rev.name;
  document.getElementById('rev-field-rating').value = rev.rating;
  document.getElementById('rev-field-avatar').value = rev.avatar || '';
  document.getElementById('rev-field-text').value = rev.text;

  const select = document.getElementById('rev-field-package');
  const packages = DataService.getAll('vs_packages');
  select.innerHTML = `
    <option value="" disabled>Choose a package</option>
    ${packages.map(p => `<option value="${p.title}" ${p.title === rev.package ? 'selected' : ''}>${p.title}</option>`).join('')}
    <option value="General Excursions" ${rev.package === 'General Excursions' ? 'selected' : ''}>General Inquiry Experience</option>
  `;

  openAdminModal('modal-review-editor-overlay');
};

window.deleteReview = function(revId) {
  openConfirmModal(
    'Delete Review?',
    'This will wipe this testimonial rating from the reviews slider. Proceed?',
    () => {
      const res = DataService.remove('vs_reviews', revId);
      if (res.success) {
        showAdminToast('Review wiped successfully.', 'success');
        loadReviewsList();
      } else {
        showAdminToast(res.error || 'Failed to delete review.', 'error');
      }
    }
  );
};

/* ─── F: SITE MEDIA GALLERY MANAGER CRUD ─── */
function initGalleryFormCRUD() {
  const trigger = document.getElementById('btn-create-gallery-modal');
  const form = document.getElementById('gal-editor-form');
  const filter = document.getElementById('gallery-category-filter');

  trigger.addEventListener('click', () => {
    form.reset();
    openAdminModal('modal-gallery-editor-overlay');
  });

  filter.addEventListener('change', () => {
    loadGalleryList(filter.value);
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const image = document.getElementById('gal-field-image').value.trim();
    const caption = document.getElementById('gal-field-caption').value.trim();
    const category = document.getElementById('gal-field-category').value;

    const res = DataService.create('vs_gallery', { image, caption, category });
    if (res.success) {
      showAdminToast('Photo uploaded successfully to visual galleries!', 'success');
      closeAdminModal('modal-gallery-editor-overlay');
      loadGalleryList();
    } else {
      showAdminToast(res.error || 'Failed to save photo link.', 'error');
    }
  });
}

function loadGalleryList(categoryFilter = 'all') {
  const gallery = DataService.getAll('vs_gallery');
  const grid = document.getElementById('admin-gallery-items-grid');
  const categorySelect = document.getElementById('gallery-category-filter');
  if (!grid) return;

  // Build unique categories options in select dropdown once
  const categories = ['Safari', 'Culture', 'Mountains', 'Beach', 'Adventure'];
  categorySelect.innerHTML = `
    <option value="all" ${categoryFilter === 'all' ? 'selected' : ''}>All Categories</option>
    ${categories.map(c => `<option value="${c}" ${categoryFilter === c ? 'selected' : ''}>${c}</option>`).join('')}
  `;

  const filtered = categoryFilter === 'all' ? gallery : gallery.filter(item => item.category === categoryFilter);

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-state-icon"><i class="fa-solid fa-images"></i></div>
        <h4 class="empty-state-title">No Media Photos Found</h4>
        <p class="empty-state-desc">Upload new images using the button above to seed the media grid.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(item => `
    <div class="admin-gallery-card">
      <img src="${item.image}" alt="${item.caption}" class="admin-gallery-img" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=200&q=80';">
      <div class="admin-gallery-info">
        <h4 class="admin-gallery-caption">${item.caption}</h4>
        <span class="admin-gallery-category">${item.category}</span>
      </div>
      <div class="admin-gallery-actions">
        <button class="admin-gallery-btn" onclick="deleteGalleryPhoto('${item.id}')" title="Delete Photo"><i class="fa-solid fa-trash"></i></button>
      </div>
    </div>
  `).join('');
}

window.deleteGalleryPhoto = function(photoId) {
  openConfirmModal(
    'Wipe Photo?',
    'This deletes this picture link from active grids. Proceed?',
    () => {
      const res = DataService.remove('vs_gallery', photoId);
      if (res.success) {
        showAdminToast('Photo wiped successfully.', 'success');
        loadGalleryList(document.getElementById('gallery-category-filter').value);
      } else {
        showAdminToast(res.error || 'Failed to wipe.', 'error');
      }
    }
  );
};

/* ─── G: FAQS ACCORDION CRUD PANEL ─── */
function initFAQsFormCRUD() {
  const trigger = document.getElementById('btn-create-faq-modal');
  const form = document.getElementById('faq-editor-form');

  trigger.addEventListener('click', () => {
    form.reset();
    document.getElementById('faq-field-id').value = '';
    document.getElementById('faq-modal-title-text').textContent = 'Create New FAQ Accordion';
    openAdminModal('modal-faq-editor-overlay');
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const id = document.getElementById('faq-field-id').value;
    const question = document.getElementById('faq-field-question').value.trim();
    const answer = document.getElementById('faq-field-answer').value.trim();

    let res;
    if (id) {
      res = DataService.update('vs_faqs', id, { question, answer });
    } else {
      res = DataService.create('vs_faqs', { question, answer });
    }

    if (res.success) {
      showAdminToast(id ? 'FAQ updated successfully!' : 'FAQ created successfully!', 'success');
      closeAdminModal('modal-faq-editor-overlay');
      loadFAQsList();
    } else {
      showAdminToast(res.error || 'Failed to save.', 'error');
    }
  });
}

function loadFAQsList() {
  const faqs = DataService.getAll('vs_faqs');
  const tbody = document.getElementById('admin-faqs-table-body');
  if (!tbody) return;

  if (faqs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3" class="text-center" style="color: var(--admin-text-muted);">No FAQs listed.</td></tr>`;
    return;
  }

  tbody.innerHTML = faqs.map(faq => `
    <tr>
      <td style="font-weight: 600; color: #ffffff;">${faq.question}</td>
      <td style="font-size: 0.85rem; color: var(--admin-text-secondary); max-width: 400px; white-space: normal;">${faq.answer}</td>
      <td>
        <div class="action-btn-group">
          <button class="action-btn action-btn-edit" onclick="editFAQ('${faq.id}')" title="Edit FAQ"><i class="fa-solid fa-pen"></i></button>
          <button class="action-btn action-btn-delete" onclick="deleteFAQ('${faq.id}')" title="Delete FAQ"><i class="fa-solid fa-trash"></i></button>
        </div>
      </td>
    </tr>
  `).join('');
}

window.editFAQ = function(faqId) {
  const faq = DataService.getById('vs_faqs', faqId);
  if (!faq) return;

  const form = document.getElementById('faq-editor-form');
  form.reset();

  document.getElementById('faq-field-id').value = faq.id;
  document.getElementById('faq-modal-title-text').textContent = 'Edit FAQ Accordion';
  document.getElementById('faq-field-question').value = faq.question;
  document.getElementById('faq-field-answer').value = faq.answer;

  openAdminModal('modal-faq-editor-overlay');
};

window.deleteFAQ = function(faqId) {
  openConfirmModal(
    'Delete FAQ Accordion?',
    'This removes the accordion item from active landing page help blocks. Proceed?',
    () => {
      const res = DataService.remove('vs_faqs', faqId);
      if (res.success) {
        showAdminToast('FAQ removed successfully.', 'success');
        loadFAQsList();
      } else {
        showAdminToast(res.error || 'Failed to remove FAQ.', 'error');
      }
    }
  );
};

/* ─── H: ADMIN SETTINGS CRUD PANEL ─── */
function initSettingsFormCRUD() {
  const form = document.getElementById('settings-editor-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const currentSettings = DataService.get('vs_settings');
    const adminEmail = document.getElementById('settings-admin-email').value.trim();
    const newPass = document.getElementById('settings-admin-pass').value.trim();
    const siteName = document.getElementById('settings-site-name').value.trim();
    const brandColor = document.getElementById('settings-brand-color').value;
    const logo = document.getElementById('settings-site-logo').value.trim();

    const facebook = document.getElementById('settings-social-fb').value.trim();
    const instagram = document.getElementById('settings-social-ig').value.trim();
    const twitter = document.getElementById('settings-social-tw').value.trim();
    const youtube = document.getElementById('settings-social-yt').value.trim();

    // Preserve previous pass if left blank
    const adminPassword = newPass || (currentSettings ? currentSettings.adminPassword : 'admin123');

    const payload = {
      adminEmail,
      adminPassword,
      siteName,
      primaryColor: brandColor,
      logo,
      socialLinks: { facebook, instagram, twitter, youtube }
    };

    const res = DataService.set('vs_settings', payload);
    if (res) {
      showAdminToast('Brand brandings and safety settings applied!', 'success');
      applySettingsBrandAccent();
      loadSettings();
    } else {
      showAdminToast('Settings update failed.', 'error');
    }
  });
}

function loadSettings() {
  const settings = DataService.get('vs_settings');
  if (!settings) return;

  document.getElementById('settings-admin-email').value = settings.adminEmail || '';
  document.getElementById('settings-admin-pass').value = ''; // Keep blank for secure updates
  document.getElementById('settings-site-name').value = settings.siteName || '';
  document.getElementById('settings-brand-color').value = settings.primaryColor || '#d4a853';
  document.getElementById('settings-site-logo').value = settings.logo || '';

  if (settings.socialLinks) {
    document.getElementById('settings-social-fb').value = settings.socialLinks.facebook || '';
    document.getElementById('settings-social-ig').value = settings.socialLinks.instagram || '';
    document.getElementById('settings-social-tw').value = settings.socialLinks.twitter || '';
    document.getElementById('settings-social-yt').value = settings.socialLinks.youtube || '';
  }
}

/* ─── SYSTEM REUSABLE DIALOG OVERLAYS ─── */
window.openAdminModal = function(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('active');
};

window.closeAdminModal = function(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('active');
};

let confirmApprovalCallback = null;

function initConfirmModal() {
  const overlay = document.getElementById('modal-confirm-overlay');
  const cancelBtn = document.getElementById('confirm-btn-cancel');
  const approveBtn = document.getElementById('confirm-btn-approve');

  if (!overlay) return;

  cancelBtn.addEventListener('click', () => {
    overlay.classList.remove('active');
    confirmApprovalCallback = null;
  });

  approveBtn.addEventListener('click', () => {
    if (confirmApprovalCallback) {
      confirmApprovalCallback();
    }
    overlay.classList.remove('active');
    confirmApprovalCallback = null;
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.classList.remove('active');
      confirmApprovalCallback = null;
    }
  });
}

window.openConfirmModal = function(title, description, approvalCallback) {
  const overlay = document.getElementById('modal-confirm-overlay');
  if (!overlay) return;

  document.getElementById('confirm-modal-title').textContent = title;
  document.getElementById('confirm-modal-desc').textContent = description;
  
  confirmApprovalCallback = approvalCallback;
  overlay.classList.add('active');
};

/* ─── LIVE SYSTEM ALERTS TOASTS ─── */
function showAdminToast(message, type = 'success') {
  const container = document.getElementById('admin-toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `admin-toast admin-toast-${type}`;
  
  const icon = type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation';
  toast.innerHTML = `
    <i class="fa-solid ${icon}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('show');
  }, 10);

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.remove();
    }, 400);
  }, 3500);
}

/* ============================================
   SSBD Admin Panel — SPA
   ============================================ */

const API = '/api';
const app = document.getElementById('app');
let currentPage = 'dashboard';
let sidebarOpen = false;

// ---- Utility ----
async function api(path, opts = {}) {
  const res = await fetch(API + path, {
    headers: { 'Content-Type': 'application/json', ...opts.headers },
    credentials: 'same-origin',
    ...opts,
  });
  if (res.status === 401 && !path.includes('/auth/')) {
    renderLogin();
    return null;
  }
  return res.json();
}

function toast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast show ${type}`;
  setTimeout(() => t.className = 'toast', 3000);
}

function el(tag, attrs = {}, ...children) {
  const e = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'className') e.className = v;
    else if (k === 'onclick' || k === 'oninput' || k === 'onchange' || k === 'onsubmit') e[k] = v;
    else if (k === 'html') e.innerHTML = v;
    else e.setAttribute(k, v);
  });
  children.forEach(c => {
    if (typeof c === 'string') e.appendChild(document.createTextNode(c));
    else if (c) e.appendChild(c);
  });
  return e;
}

// SVG Icons
const icons = {
  dashboard: '<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="1" width="7" height="7" rx="1.5"/><rect x="10" y="1" width="7" height="4" rx="1.5"/><rect x="1" y="10" width="7" height="4" rx="1.5"/><rect x="10" y="7" width="7" height="7" rx="1.5"/></svg>',
  pages: '<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 2h8l4 4v10a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z"/><path d="M11 2v4h4"/></svg>',
  blog: '<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 4h14M2 9h10M2 14h7"/></svg>',
  portfolio: '<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="3" width="16" height="12" rx="1.5"/><circle cx="6" cy="8" r="1.5"/><path d="M17 15l-5-4-3 2.5L5 11l-4 4"/></svg>',
  media: '<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="14" height="14" rx="2"/><circle cx="7" cy="7" r="2"/><path d="M16 12l-4-4-6 6"/></svg>',
  settings: '<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="9" cy="9" r="3"/><path d="M9 1v2m0 12v2M1 9h2m12 0h2m-2.6-5.4l-1.5 1.5M5.1 12.9l-1.5 1.5m0-10.8l1.5 1.5m7.8 7.8l1.5 1.5"/></svg>',
  languages: '<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="9" cy="9" r="7.5"/><path d="M1.5 9h15M9 1.5c2 2.5 3 5 3 7.5s-1 5-3 7.5M9 1.5c-2 2.5-3 5-3 7.5s1 5 3 7.5"/></svg>',
  logout: '<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 16H3a1 1 0 01-1-1V3a1 1 0 011-1h3M12 13l4-4-4-4M7 9h9"/></svg>',
};

const sidebarItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'pages', label: 'Pages', icon: 'pages' },
  { id: 'blog', label: 'Blog', icon: 'blog' },
  { id: 'portfolio', label: 'Portfolio', icon: 'portfolio' },
  { id: 'media', label: 'Media', icon: 'media' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
  { id: 'languages', label: 'Languages', icon: 'languages' },
];

// ---- Auth ----
async function checkAuth() {
  const data = await api('/auth/check');
  if (data?.authenticated) renderApp();
  else renderLogin();
}

function renderLogin() {
  app.innerHTML = '';
  const page = el('div', { className: 'login-page' });
  const box = el('div', { className: 'login-box' });
  box.innerHTML = `
    <div class="login-box__logo">SSBD <span>Admin</span></div>
    <p class="login-box__sub">Sign in to manage your website</p>
    <div class="login-error" id="login-error"></div>
    <form id="login-form">
      <div class="form-group">
        <label>Login</label>
        <input type="text" id="login-input" required autocomplete="username">
      </div>
      <div class="form-group">
        <label>Password</label>
        <input type="password" id="password-input" required autocomplete="current-password">
      </div>
      <button type="submit" class="btn btn-accent btn-block">Sign In</button>
    </form>
  `;
  page.appendChild(box);
  app.appendChild(page);

  document.getElementById('login-form').onsubmit = async (e) => {
    e.preventDefault();
    const login = document.getElementById('login-input').value;
    const password = document.getElementById('password-input').value;
    const data = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ login, password }),
    });
    if (data?.success) {
      renderApp();
    } else {
      const err = document.getElementById('login-error');
      err.textContent = data?.error || 'Login failed';
      err.classList.add('show');
    }
  };
}

// ---- App Shell ----
function renderApp() {
  app.innerHTML = '';

  // Sidebar toggle
  const toggle = el('button', { className: 'sidebar-toggle', html: '&#9776;', onclick: () => {
    sidebarOpen = !sidebarOpen;
    document.querySelector('.sidebar').classList.toggle('open', sidebarOpen);
  }});
  app.appendChild(toggle);

  // Sidebar
  const sidebar = el('div', { className: 'sidebar' });
  sidebar.innerHTML = `<div class="sidebar__logo">SSBD <span>Admin</span></div>`;
  const nav = el('nav', { className: 'sidebar__nav' });
  sidebarItems.forEach(item => {
    const link = el('button', {
      className: `sidebar__link ${item.id === currentPage ? 'active' : ''}`,
      html: `${icons[item.icon]}<span>${item.label}</span>`,
      onclick: () => navigateTo(item.id),
    });
    nav.appendChild(link);
  });
  sidebar.appendChild(nav);
  const bottom = el('div', { className: 'sidebar__bottom' });
  const logoutBtn = el('button', { className: 'sidebar__logout', html: `${icons.logout}<span>Log out</span>`, onclick: async () => {
    await api('/auth/logout', { method: 'POST' });
    renderLogin();
  }});
  bottom.appendChild(logoutBtn);
  sidebar.appendChild(bottom);
  app.appendChild(sidebar);

  // Main area
  const main = el('div', { className: 'main', id: 'main-content' });
  app.appendChild(main);

  renderPage(currentPage);
}

function navigateTo(page) {
  currentPage = page;
  document.querySelectorAll('.sidebar__link').forEach((el, i) => {
    el.classList.toggle('active', sidebarItems[i].id === page);
  });
  // Close mobile sidebar
  document.querySelector('.sidebar')?.classList.remove('open');
  sidebarOpen = false;
  renderPage(page);
}

function renderPage(page) {
  const main = document.getElementById('main-content');
  if (!main) return;
  main.innerHTML = '<p style="color:var(--muted)">Loading...</p>';

  switch (page) {
    case 'dashboard': renderDashboard(main); break;
    case 'pages': renderPages(main); break;
    case 'blog': renderBlog(main); break;
    case 'portfolio': renderPortfolio(main); break;
    case 'media': renderMedia(main); break;
    case 'settings': renderSettings(main); break;
    case 'languages': renderLanguages(main); break;
  }
}

// ---- Dashboard ----
async function renderDashboard(container) {
  const stats = await api('/settings/dashboard');
  if (!stats) return;

  container.innerHTML = `
    <div class="main__header">
      <h1 class="main__title">Dashboard</h1>
      <a href="/" target="_blank" class="btn btn-outline">Open Website &rarr;</a>
    </div>
    <div class="metrics">
      <div class="metric-card">
        <div class="metric-card__value">${stats.pages || 6}</div>
        <div class="metric-card__label">Pages</div>
      </div>
      <div class="metric-card">
        <div class="metric-card__value">${stats.blogArticles || 0}</div>
        <div class="metric-card__label">Blog Articles</div>
      </div>
      <div class="metric-card">
        <div class="metric-card__value">${stats.portfolioProjects || 0}</div>
        <div class="metric-card__label">Portfolio Projects</div>
      </div>
      <div class="metric-card">
        <div class="metric-card__value">${stats.mediaFiles || 0}</div>
        <div class="metric-card__label">Media Files</div>
      </div>
    </div>
    <div class="card-section">
      <div class="card-section__title">Quick Actions</div>
      <div class="quick-links">
        <button class="quick-link" onclick="navigateTo('blog')">+ Add Article</button>
        <button class="quick-link" onclick="navigateTo('portfolio')">+ Add Project</button>
        <button class="quick-link" onclick="navigateTo('media')">Upload Media</button>
        <button class="quick-link" onclick="navigateTo('pages')">Edit Pages</button>
        <button class="quick-link" onclick="navigateTo('languages')">Manage Translations</button>
      </div>
    </div>
    <div class="card-section">
      <div class="card-section__title">System Info</div>
      <ul class="activity-list">
        <li class="activity-item">
          <span class="activity-item__text">Admin panel running</span>
          <span class="activity-item__time">Port 3001</span>
        </li>
        <li class="activity-item">
          <span class="activity-item__text">Data storage</span>
          <span class="activity-item__time">JSON files</span>
        </li>
        <li class="activity-item">
          <span class="activity-item__text">Languages</span>
          <span class="activity-item__time">EN / RU</span>
        </li>
      </ul>
    </div>
  `;
}

// ---- Pages ----
async function renderPages(container) {
  const pages = await api('/pages');
  if (!pages) return;

  const pageList = [
    { slug: 'home', label: 'Home' },
    { slug: 'services-sound', label: 'Services — Sound' },
    { slug: 'services-lighting', label: 'Services — Lighting' },
    { slug: 'portfolio', label: 'Portfolio' },
    { slug: 'about', label: 'About' },
    { slug: 'contact', label: 'Contact' },
  ];

  container.innerHTML = `
    <div class="main__header">
      <h1 class="main__title">Pages</h1>
    </div>
    <div class="card-section">
      <table>
        <thead><tr><th>Page</th><th>Meta Title</th><th>Last Updated</th><th></th></tr></thead>
        <tbody id="pages-tbody"></tbody>
      </table>
    </div>
    <div id="page-editor" style="display:none"></div>
  `;

  const tbody = document.getElementById('pages-tbody');
  pageList.forEach(p => {
    const data = pages[p.slug] || {};
    const tr = el('tr');
    tr.innerHTML = `
      <td><strong>${p.label}</strong></td>
      <td style="color:var(--muted);max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${data.metaTitle || '—'}</td>
      <td style="color:var(--muted)">${data.updatedAt ? new Date(data.updatedAt).toLocaleDateString() : '—'}</td>
      <td><button class="btn btn-outline btn-sm" data-slug="${p.slug}">Edit</button></td>
    `;
    tr.querySelector('button').onclick = () => renderPageEditor(p.slug, p.label, pages);
    tbody.appendChild(tr);
  });
}

async function renderPageEditor(slug, label, allPages) {
  const page = allPages[slug] || {};
  const editor = document.getElementById('page-editor');
  editor.style.display = 'block';
  editor.innerHTML = `
    <div class="card-section" style="margin-top:24px">
      <div class="card-section__title">Edit: ${label}</div>
      <div class="lang-tabs">
        <button class="lang-tab active" data-lang="en">EN</button>
        <button class="lang-tab" data-lang="ru">RU</button>
      </div>
      <div class="form-group">
        <label>Meta Title <span class="char-count" id="mt-count">0/60</span></label>
        <input class="form-input" id="pe-metaTitle" maxlength="70" value="${page.metaTitle || ''}">
      </div>
      <div class="form-group">
        <label>Meta Description <span class="char-count" id="md-count">0/160</span></label>
        <textarea class="form-textarea" id="pe-metaDesc" maxlength="170" style="min-height:60px">${page.metaDescription || ''}</textarea>
      </div>
      <div class="form-group">
        <label>Page Title (H1) — EN</label>
        <input class="form-input" id="pe-title-en" value="${page.title_en || ''}">
      </div>
      <div class="form-group" id="pe-title-ru-wrap" style="display:none">
        <label>Page Title (H1) — RU</label>
        <input class="form-input" id="pe-title-ru" value="${page.title_ru || ''}">
      </div>
      <div class="form-group">
        <label>Content / Description — EN</label>
        <textarea class="form-textarea" id="pe-content-en" style="min-height:150px">${page.content_en || ''}</textarea>
      </div>
      <div class="form-group" id="pe-content-ru-wrap" style="display:none">
        <label>Content / Description — RU</label>
        <textarea class="form-textarea" id="pe-content-ru" style="min-height:150px">${page.content_ru || ''}</textarea>
      </div>
      <div style="display:flex;gap:12px;margin-top:16px">
        <button class="btn btn-accent" id="pe-save">Save Changes</button>
        <button class="btn btn-outline" onclick="document.getElementById('page-editor').style.display='none'">Cancel</button>
      </div>
    </div>
  `;

  // Char counters
  const mtInput = document.getElementById('pe-metaTitle');
  const mdInput = document.getElementById('pe-metaDesc');
  const updateCounts = () => {
    const mtc = document.getElementById('mt-count');
    const mdc = document.getElementById('md-count');
    mtc.textContent = `${mtInput.value.length}/60`;
    mtc.className = `char-count ${mtInput.value.length > 60 ? 'over' : ''}`;
    mdc.textContent = `${mdInput.value.length}/160`;
    mdc.className = `char-count ${mdInput.value.length > 160 ? 'over' : ''}`;
  };
  mtInput.oninput = updateCounts;
  mdInput.oninput = updateCounts;
  updateCounts();

  // Lang tabs
  editor.querySelectorAll('.lang-tab').forEach(tab => {
    tab.onclick = () => {
      editor.querySelectorAll('.lang-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const isRu = tab.dataset.lang === 'ru';
      document.getElementById('pe-title-en').closest('.form-group').style.display = isRu ? 'none' : '';
      document.getElementById('pe-title-ru-wrap').style.display = isRu ? '' : 'none';
      document.getElementById('pe-content-en').closest('.form-group').style.display = isRu ? 'none' : '';
      document.getElementById('pe-content-ru-wrap').style.display = isRu ? '' : 'none';
    };
  });

  // Save
  document.getElementById('pe-save').onclick = async () => {
    const btn = document.getElementById('pe-save');
    btn.textContent = 'Saving...';
    btn.disabled = true;
    await api(`/pages/${slug}`, {
      method: 'PUT',
      body: JSON.stringify({
        metaTitle: mtInput.value,
        metaDescription: mdInput.value,
        title_en: document.getElementById('pe-title-en').value,
        title_ru: document.getElementById('pe-title-ru').value,
        content_en: document.getElementById('pe-content-en').value,
        content_ru: document.getElementById('pe-content-ru').value,
      }),
    });
    btn.textContent = 'Saved ✓';
    toast('Page saved successfully');
    setTimeout(() => { btn.textContent = 'Save Changes'; btn.disabled = false; }, 2000);
  };
}

// ---- Blog ----
async function renderBlog(container) {
  const articles = await api('/blog') || [];

  container.innerHTML = `
    <div class="main__header">
      <h1 class="main__title">Blog</h1>
      <button class="btn btn-accent" id="new-article-btn">+ New Article</button>
    </div>
    <div class="card-section">
      <div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap">
        <input class="form-input" placeholder="Search articles..." id="blog-search" style="max-width:300px">
        <select class="form-select" id="blog-filter" style="max-width:160px">
          <option value="all">All</option>
          <option value="published">Published</option>
          <option value="draft">Drafts</option>
        </select>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Title</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody id="blog-tbody"></tbody>
        </table>
      </div>
      ${articles.length === 0 ? '<p style="color:var(--muted);padding:20px 0">No articles yet. Click "+ New Article" to create one.</p>' : ''}
    </div>
    <div id="blog-editor" style="display:none"></div>
  `;

  const tbody = document.getElementById('blog-tbody');

  function renderRows(filter = 'all', search = '') {
    tbody.innerHTML = '';
    articles.filter(a => {
      if (filter !== 'all' && a.status !== filter) return false;
      if (search && !a.title_en?.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    }).forEach(a => {
      const tr = el('tr');
      tr.innerHTML = `
        <td><strong>${a.title_en || 'Untitled'}</strong></td>
        <td style="color:var(--muted)">${a.datePublished || '—'}</td>
        <td><span class="status-badge status-badge--${a.status || 'draft'}">${a.status || 'draft'}</span></td>
        <td>
          <button class="btn btn-outline btn-sm edit-btn">Edit</button>
          <button class="btn btn-danger btn-sm del-btn" style="margin-left:6px">Delete</button>
        </td>
      `;
      tr.querySelector('.edit-btn').onclick = () => renderBlogEditor(a);
      tr.querySelector('.del-btn').onclick = async () => {
        if (!confirm('Delete this article?')) return;
        await api(`/blog/${a.id}`, { method: 'DELETE' });
        toast('Article deleted');
        navigateTo('blog');
      };
      tbody.appendChild(tr);
    });
  }
  renderRows();

  document.getElementById('blog-search').oninput = (e) => renderRows(document.getElementById('blog-filter').value, e.target.value);
  document.getElementById('blog-filter').onchange = (e) => renderRows(e.target.value, document.getElementById('blog-search').value);
  document.getElementById('new-article-btn').onclick = () => renderBlogEditor(null);
}

function renderBlogEditor(article) {
  const isNew = !article;
  const a = article || { title_en: '', title_ru: '', slug: '', metaTitle: '', metaDescription: '', content_en: '', content_ru: '', tag: 'general', status: 'draft', datePublished: new Date().toISOString().split('T')[0] };

  const editor = document.getElementById('blog-editor');
  editor.style.display = 'block';
  editor.scrollIntoView({ behavior: 'smooth' });

  editor.innerHTML = `
    <div class="card-section" style="margin-top:24px">
      <div class="card-section__title">${isNew ? 'New Article' : 'Edit Article'}</div>
      <div class="lang-tabs">
        <button class="lang-tab active" data-lang="en">EN</button>
        <button class="lang-tab" data-lang="ru">RU</button>
      </div>
      <div class="form-group" id="be-title-en-wrap">
        <label>Title (H1) — EN</label>
        <input class="form-input" id="be-title-en" value="${a.title_en || ''}">
      </div>
      <div class="form-group" id="be-title-ru-wrap" style="display:none">
        <label>Title (H1) — RU</label>
        <input class="form-input" id="be-title-ru" value="${a.title_ru || ''}">
      </div>
      <div class="form-group">
        <label>Slug (URL)</label>
        <input class="form-input" id="be-slug" value="${a.slug || ''}" placeholder="auto-generated-from-title">
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px">
        <div class="form-group">
          <label>Tag</label>
          <select class="form-select" id="be-tag">
            ${['general','corporate','wedding','private','outdoor','sound','lighting'].map(t => `<option value="${t}" ${a.tag === t ? 'selected' : ''}>${t.charAt(0).toUpperCase() + t.slice(1)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Status</label>
          <select class="form-select" id="be-status">
            <option value="draft" ${a.status === 'draft' ? 'selected' : ''}>Draft</option>
            <option value="published" ${a.status === 'published' ? 'selected' : ''}>Published</option>
          </select>
        </div>
        <div class="form-group">
          <label>Date Published</label>
          <input class="form-input" type="date" id="be-date" value="${a.datePublished || ''}">
        </div>
      </div>
      <div class="form-group">
        <label>Meta Title</label>
        <input class="form-input" id="be-meta-title" value="${a.metaTitle || ''}">
      </div>
      <div class="form-group">
        <label>Meta Description</label>
        <textarea class="form-textarea" id="be-meta-desc" style="min-height:60px">${a.metaDescription || ''}</textarea>
      </div>
      <div class="form-group" id="be-content-en-wrap">
        <label>Content — EN</label>
        <textarea class="form-textarea" id="be-content-en" style="min-height:300px">${a.content_en || ''}</textarea>
      </div>
      <div class="form-group" id="be-content-ru-wrap" style="display:none">
        <label>Content — RU</label>
        <textarea class="form-textarea" id="be-content-ru" style="min-height:300px">${a.content_ru || ''}</textarea>
      </div>
      <div style="display:flex;gap:12px;margin-top:16px">
        <button class="btn btn-accent" id="be-save">${isNew ? 'Create Article' : 'Save Changes'}</button>
        <button class="btn btn-outline" onclick="document.getElementById('blog-editor').style.display='none'">Cancel</button>
      </div>
    </div>
  `;

  // Auto slug
  document.getElementById('be-title-en').oninput = (e) => {
    if (isNew || !document.getElementById('be-slug').dataset.manual) {
      document.getElementById('be-slug').value = e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
  };
  document.getElementById('be-slug').oninput = () => { document.getElementById('be-slug').dataset.manual = '1'; };

  // Lang tabs
  editor.querySelectorAll('.lang-tab').forEach(tab => {
    tab.onclick = () => {
      editor.querySelectorAll('.lang-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const ru = tab.dataset.lang === 'ru';
      document.getElementById('be-title-en-wrap').style.display = ru ? 'none' : '';
      document.getElementById('be-title-ru-wrap').style.display = ru ? '' : 'none';
      document.getElementById('be-content-en-wrap').style.display = ru ? 'none' : '';
      document.getElementById('be-content-ru-wrap').style.display = ru ? '' : 'none';
    };
  });

  // Save
  document.getElementById('be-save').onclick = async () => {
    const btn = document.getElementById('be-save');
    btn.textContent = 'Saving...';
    btn.disabled = true;
    const body = {
      title_en: document.getElementById('be-title-en').value,
      title_ru: document.getElementById('be-title-ru').value,
      slug: document.getElementById('be-slug').value,
      tag: document.getElementById('be-tag').value,
      status: document.getElementById('be-status').value,
      datePublished: document.getElementById('be-date').value,
      metaTitle: document.getElementById('be-meta-title').value,
      metaDescription: document.getElementById('be-meta-desc').value,
      content_en: document.getElementById('be-content-en').value,
      content_ru: document.getElementById('be-content-ru').value,
    };
    if (isNew) {
      await api('/blog', { method: 'POST', body: JSON.stringify(body) });
      toast('Article created');
    } else {
      await api(`/blog/${a.id}`, { method: 'PUT', body: JSON.stringify(body) });
      toast('Article saved');
    }
    btn.textContent = 'Saved ✓';
    setTimeout(() => navigateTo('blog'), 1000);
  };
}

// ---- Portfolio ----
async function renderPortfolio(container) {
  const items = await api('/portfolio') || [];

  container.innerHTML = `
    <div class="main__header">
      <h1 class="main__title">Portfolio</h1>
      <button class="btn btn-accent" id="new-proj-btn">+ Add Project</button>
    </div>
    <div class="card-section">
      <div class="table-wrap">
        <table>
          <thead><tr><th>Project</th><th>Type</th><th>Location</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody id="port-tbody"></tbody>
        </table>
      </div>
      ${items.length === 0 ? '<p style="color:var(--muted);padding:20px 0">No projects yet.</p>' : ''}
    </div>
    <div id="port-editor" style="display:none"></div>
  `;

  const tbody = document.getElementById('port-tbody');
  items.forEach(p => {
    const tr = el('tr');
    tr.innerHTML = `
      <td><strong>${p.name_en || 'Untitled'}</strong></td>
      <td style="color:var(--muted)">${p.eventType || '—'}</td>
      <td style="color:var(--muted)">${p.location || '—'}</td>
      <td><span class="status-badge status-badge--${p.status || 'published'}">${p.status || 'published'}</span></td>
      <td>
        <button class="btn btn-outline btn-sm edit-btn">Edit</button>
        <button class="btn btn-danger btn-sm del-btn" style="margin-left:6px">Delete</button>
      </td>
    `;
    tr.querySelector('.edit-btn').onclick = () => renderPortfolioEditor(p);
    tr.querySelector('.del-btn').onclick = async () => {
      if (!confirm('Delete this project?')) return;
      await api(`/portfolio/${p.id}`, { method: 'DELETE' });
      toast('Project deleted');
      navigateTo('portfolio');
    };
    tbody.appendChild(tr);
  });

  document.getElementById('new-proj-btn').onclick = () => renderPortfolioEditor(null);
}

function renderPortfolioEditor(project) {
  const isNew = !project;
  const p = project || { name_en: '', name_ru: '', eventType: 'corporate', location: '', description_en: '', description_ru: '', services: 'both', status: 'published', date: '' };
  const editor = document.getElementById('port-editor');
  editor.style.display = 'block';
  editor.scrollIntoView({ behavior: 'smooth' });

  editor.innerHTML = `
    <div class="card-section" style="margin-top:24px">
      <div class="card-section__title">${isNew ? 'New Project' : 'Edit Project'}</div>
      <div class="lang-tabs">
        <button class="lang-tab active" data-lang="en">EN</button>
        <button class="lang-tab" data-lang="ru">RU</button>
      </div>
      <div id="proj-name-en-wrap" class="form-group"><label>Project Name — EN</label><input class="form-input" id="proj-name-en" value="${p.name_en || ''}"></div>
      <div id="proj-name-ru-wrap" class="form-group" style="display:none"><label>Project Name — RU</label><input class="form-input" id="proj-name-ru" value="${p.name_ru || ''}"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px">
        <div class="form-group"><label>Event Type</label>
          <select class="form-select" id="proj-type">
            ${['corporate','private','concert','wedding'].map(t => `<option value="${t}" ${p.eventType === t ? 'selected' : ''}>${t.charAt(0).toUpperCase() + t.slice(1)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group"><label>Services</label>
          <select class="form-select" id="proj-services">
            ${['sound','lighting','both'].map(s => `<option value="${s}" ${p.services === s ? 'selected' : ''}>${s.charAt(0).toUpperCase() + s.slice(1)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group"><label>Status</label>
          <select class="form-select" id="proj-status">
            <option value="published" ${p.status === 'published' ? 'selected' : ''}>Published</option>
            <option value="hidden" ${p.status === 'hidden' ? 'selected' : ''}>Hidden</option>
          </select>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
        <div class="form-group"><label>Location</label><input class="form-input" id="proj-location" value="${p.location || ''}"></div>
        <div class="form-group"><label>Date</label><input class="form-input" type="date" id="proj-date" value="${p.date || ''}"></div>
      </div>
      <div id="proj-desc-en-wrap" class="form-group"><label>Description — EN</label><textarea class="form-textarea" id="proj-desc-en">${p.description_en || ''}</textarea></div>
      <div id="proj-desc-ru-wrap" class="form-group" style="display:none"><label>Description — RU</label><textarea class="form-textarea" id="proj-desc-ru">${p.description_ru || ''}</textarea></div>
      <div class="form-group"><label>Featured Image URL</label><input class="form-input" id="proj-image" value="${p.image || ''}" placeholder="/uploads/images/..."></div>
      <div style="display:flex;gap:12px;margin-top:16px">
        <button class="btn btn-accent" id="proj-save">${isNew ? 'Create Project' : 'Save Changes'}</button>
        <button class="btn btn-outline" onclick="document.getElementById('port-editor').style.display='none'">Cancel</button>
      </div>
    </div>
  `;

  // Lang tabs
  editor.querySelectorAll('.lang-tab').forEach(tab => {
    tab.onclick = () => {
      editor.querySelectorAll('.lang-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const ru = tab.dataset.lang === 'ru';
      document.getElementById('proj-name-en-wrap').style.display = ru ? 'none' : '';
      document.getElementById('proj-name-ru-wrap').style.display = ru ? '' : 'none';
      document.getElementById('proj-desc-en-wrap').style.display = ru ? 'none' : '';
      document.getElementById('proj-desc-ru-wrap').style.display = ru ? '' : 'none';
    };
  });

  document.getElementById('proj-save').onclick = async () => {
    const btn = document.getElementById('proj-save');
    btn.textContent = 'Saving...'; btn.disabled = true;
    const body = {
      name_en: document.getElementById('proj-name-en').value,
      name_ru: document.getElementById('proj-name-ru').value,
      eventType: document.getElementById('proj-type').value,
      services: document.getElementById('proj-services').value,
      status: document.getElementById('proj-status').value,
      location: document.getElementById('proj-location').value,
      date: document.getElementById('proj-date').value,
      description_en: document.getElementById('proj-desc-en').value,
      description_ru: document.getElementById('proj-desc-ru').value,
      image: document.getElementById('proj-image').value,
    };
    if (isNew) await api('/portfolio', { method: 'POST', body: JSON.stringify(body) });
    else await api(`/portfolio/${p.id}`, { method: 'PUT', body: JSON.stringify(body) });
    toast(isNew ? 'Project created' : 'Project saved');
    btn.textContent = 'Saved ✓';
    setTimeout(() => navigateTo('portfolio'), 1000);
  };
}

// ---- Media ----
async function renderMedia(container) {
  const files = await api('/media') || [];

  container.innerHTML = `
    <div class="main__header">
      <h1 class="main__title">Media Library</h1>
      <label class="btn btn-accent" style="cursor:pointer">
        Upload File
        <input type="file" accept="image/jpeg,image/png,image/webp,video/mp4" id="media-upload" style="display:none">
      </label>
    </div>
    <div id="media-progress" style="display:none;margin-bottom:16px;color:var(--accent)">Uploading...</div>
    <div class="card-section" id="media-grid-wrap">
      ${files.length === 0 ? '<p style="color:var(--muted)">No media files yet. Upload your first file.</p>' : ''}
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:16px" id="media-grid"></div>
    </div>
  `;

  const grid = document.getElementById('media-grid');
  files.forEach(f => {
    const card = el('div', { style: 'background:var(--bg);border:1px solid var(--border);border-radius:8px;overflow:hidden' });
    const isImage = f.type === 'images';
    card.innerHTML = `
      <div style="aspect-ratio:1;background:#1A1A18;display:flex;align-items:center;justify-content:center;overflow:hidden">
        ${isImage ? `<img src="${f.path}" style="width:100%;height:100%;object-fit:cover" loading="lazy">` : `<span style="color:var(--muted);font-size:0.8rem">VIDEO</span>`}
      </div>
      <div style="padding:10px">
        <div style="font-size:0.75rem;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${f.name}</div>
        <div style="font-size:0.7rem;color:var(--muted);margin-top:2px">${(f.size / 1024).toFixed(0)} KB</div>
        <div style="display:flex;gap:6px;margin-top:8px">
          <button class="btn btn-outline btn-sm" onclick="navigator.clipboard.writeText('${f.path}');toast('Path copied')">Copy</button>
          <button class="btn btn-danger btn-sm" onclick="deleteMedia('${f.type}','${f.name}')">Del</button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });

  document.getElementById('media-upload').onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    document.getElementById('media-progress').style.display = 'block';
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/media/upload', { method: 'POST', body: fd, credentials: 'same-origin' });
    const data = await res.json();
    document.getElementById('media-progress').style.display = 'none';
    if (data.success) { toast('File uploaded'); navigateTo('media'); }
    else toast(data.error || 'Upload failed', 'error');
  };
}

window.deleteMedia = async (type, name) => {
  if (!confirm('Delete this file?')) return;
  await api(`/media/${type}/${name}`, { method: 'DELETE' });
  toast('File deleted');
  navigateTo('media');
};

// ---- Settings ----
async function renderSettings(container) {
  const settings = await api('/settings') || {};

  container.innerHTML = `
    <div class="main__header"><h1 class="main__title">Settings</h1></div>
    <div class="card-section">
      <div class="card-section__title">General</div>
      <div class="form-group"><label>Site Name</label><input class="form-input" id="s-name" value="${settings.siteName || 'Same Same But Different'}"></div>
      <div class="form-group"><label>Tagline</label><input class="form-input" id="s-tagline" value="${settings.tagline || 'Boutique sound & lighting rental in Dubai'}"></div>
      <div class="form-group"><label>Default Meta Description</label><textarea class="form-textarea" id="s-meta" style="min-height:60px">${settings.defaultMetaDesc || ''}</textarea></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
        <div class="form-group"><label>WhatsApp Number</label><input class="form-input" id="s-whatsapp" value="${settings.whatsapp || '+971XXXXXXXXX'}"></div>
        <div class="form-group"><label>Email</label><input class="form-input" id="s-email" value="${settings.email || 'hello@samesamebutdifferent.ae'}"></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
        <div class="form-group"><label>Instagram URL</label><input class="form-input" id="s-instagram" value="${settings.instagram || 'https://instagram.com/samesamebutdifferent'}"></div>
        <div class="form-group"><label>Google Analytics ID</label><input class="form-input" id="s-ga" value="${settings.gaId || ''}" placeholder="G-XXXXXXXXXX"></div>
      </div>
      <button class="btn btn-accent" id="s-save">Save Settings</button>
    </div>
    <div class="card-section">
      <div class="card-section__title">Change Password</div>
      <div class="form-group"><label>Current Password</label><input class="form-input" type="password" id="pw-current"></div>
      <div class="form-group"><label>New Password</label><input class="form-input" type="password" id="pw-new"></div>
      <div class="form-group"><label>Confirm New Password</label><input class="form-input" type="password" id="pw-confirm"></div>
      <button class="btn btn-outline" id="pw-save">Change Password</button>
    </div>
  `;

  document.getElementById('s-save').onclick = async () => {
    const btn = document.getElementById('s-save');
    btn.textContent = 'Saving...'; btn.disabled = true;
    await api('/settings', {
      method: 'PUT',
      body: JSON.stringify({
        siteName: document.getElementById('s-name').value,
        tagline: document.getElementById('s-tagline').value,
        defaultMetaDesc: document.getElementById('s-meta').value,
        whatsapp: document.getElementById('s-whatsapp').value,
        email: document.getElementById('s-email').value,
        instagram: document.getElementById('s-instagram').value,
        gaId: document.getElementById('s-ga').value,
      }),
    });
    btn.textContent = 'Saved ✓'; toast('Settings saved');
    setTimeout(() => { btn.textContent = 'Save Settings'; btn.disabled = false; }, 2000);
  };

  document.getElementById('pw-save').onclick = async () => {
    const newPw = document.getElementById('pw-new').value;
    if (newPw !== document.getElementById('pw-confirm').value) { toast('Passwords do not match', 'error'); return; }
    if (newPw.length < 6) { toast('Password too short', 'error'); return; }
    const res = await api('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword: document.getElementById('pw-current').value, newPassword: newPw }),
    });
    if (res?.success) toast('Password changed');
    else toast(res?.error || 'Failed', 'error');
  };
}

// ---- Languages ----
async function renderLanguages(container) {
  let translations = await api('/settings/translations') || {};
  if (!translations.en) translations = { en: {}, ru: {} };

  // Collect all keys
  const allKeys = [...new Set([...Object.keys(translations.en || {}), ...Object.keys(translations.ru || {})])].sort();
  const totalKeys = allKeys.length;
  const translatedRu = allKeys.filter(k => translations.ru?.[k]).length;

  container.innerHTML = `
    <div class="main__header">
      <h1 class="main__title">Languages</h1>
      <button class="btn btn-accent" id="lang-save">Save All</button>
    </div>
    <div class="card-section" style="margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <span style="font-size:0.85rem;color:var(--muted)">Russian translations: ${translatedRu} / ${totalKeys}</span>
        <input class="form-input" placeholder="Search keys..." id="lang-search" style="max-width:250px">
      </div>
      <div style="height:4px;background:var(--border);border-radius:2px;overflow:hidden">
        <div style="height:100%;background:var(--accent);width:${totalKeys ? (translatedRu / totalKeys * 100) : 0}%;transition:width 0.3s"></div>
      </div>
    </div>
    <div class="card-section">
      <div class="table-wrap">
        <table>
          <thead><tr><th style="width:25%">Key</th><th style="width:37.5%">English</th><th style="width:37.5%">Russian</th></tr></thead>
          <tbody id="lang-tbody"></tbody>
        </table>
      </div>
    </div>
  `;

  const tbody = document.getElementById('lang-tbody');

  function renderLangRows(search = '') {
    tbody.innerHTML = '';
    allKeys.filter(k => !search || k.includes(search.toLowerCase())).forEach(k => {
      const tr = el('tr');
      tr.innerHTML = `
        <td style="font-size:0.8rem;color:var(--muted);font-family:monospace">${k}</td>
        <td><input class="form-input" style="font-size:0.85rem" data-key="${k}" data-lang="en" value="${(translations.en?.[k] || '').replace(/"/g, '&quot;')}"></td>
        <td><input class="form-input" style="font-size:0.85rem" data-key="${k}" data-lang="ru" value="${(translations.ru?.[k] || '').replace(/"/g, '&quot;')}"></td>
      `;
      tbody.appendChild(tr);
    });
  }
  renderLangRows();

  document.getElementById('lang-search').oninput = (e) => renderLangRows(e.target.value);

  document.getElementById('lang-save').onclick = async () => {
    const btn = document.getElementById('lang-save');
    btn.textContent = 'Saving...'; btn.disabled = true;
    const updated = { en: {}, ru: {} };
    tbody.querySelectorAll('input[data-key]').forEach(input => {
      updated[input.dataset.lang][input.dataset.key] = input.value;
    });
    await api('/settings/translations', { method: 'PUT', body: JSON.stringify(updated) });
    toast('Translations saved & synced to website');
    btn.textContent = 'Saved ✓';
    setTimeout(() => { btn.textContent = 'Save All'; btn.disabled = false; }, 2000);
  };
}

// ---- Init ----
checkAuth();

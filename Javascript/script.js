document.addEventListener('DOMContentLoaded', () => {
  const authModal = document.getElementById('auth-modal');
  const submitBtn = document.getElementById('submit-btn');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const nameInput = document.getElementById('name');
  const modalTitle = document.getElementById('modal-title');
  const authToggle = document.getElementById('auth-toggle');
  const secondaryNav = document.querySelector('.secondary-nav');

  let teachers = JSON.parse(localStorage.getItem("teachers")) || [
    { email:"maurizio.minissale@davincimilazzo.edu.it", password:"davinci2026", name:"Prof. Minissale", role:"teacher" },
    { email:"rosita.artigliere@davincimilazzo.edu.it", password:"davinci2026", name:"Prof. Artigliere", role:"teacher" },
    { email:"antonio.caristia@davincimilazzo.edu.it", password:"davinci2026", name:"Prof. Caristia", role:"teacher" }
  ];

  let students = JSON.parse(localStorage.getItem("students")) || [];
  let currentUser = JSON.parse(localStorage.getItem("currentUser")) || null;
  let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
  let isRegistering = false;

  function clearSecondaryNav() {
    if (secondaryNav) secondaryNav.innerHTML = '';
  }

  function createNavItem(html) {
    const li = document.createElement("li");
    li.className = "nav-item";
    li.innerHTML = html;
    return li;
  }

  function showLoginButton() {
    if (!secondaryNav) return;
    clearSecondaryNav();

    const li = createNavItem(`
      <a href="#" class="nav-link" id="login-link">
        <span class="material-symbols-rounded">login</span>
        <span class="nav-label">Accedi</span>
      </a>
    `);

    secondaryNav.appendChild(li);

    document.getElementById("login-link")?.addEventListener("click", e => {
      e.preventDefault();
      showLoginModal();
    });
  }

  function showLoginModal() {
    isRegistering = false;
    modalTitle.textContent = "Accedi";
    submitBtn.textContent = "Accedi";
    if (nameInput) nameInput.style.display = "none";
    if (authToggle) authToggle.innerHTML = `Non hai un account? <a href="#" id="register-link">Registrati come studente</a>`;
    authModal.style.display = "flex";

    setTimeout(() => {
      document.getElementById('register-link')?.addEventListener('click', e => {
        e.preventDefault();
        showRegisterModal();
      });
    }, 100);
  }

  function showRegisterModal() {
    isRegistering = true;
    modalTitle.textContent = "Registrati come Studente";
    submitBtn.textContent = "Registrati";
    if (nameInput) nameInput.style.display = "block";
    if (authToggle) authToggle.innerHTML = `Hai già un account? <a href="#" id="login-link-switch">Accedi</a>`;

    setTimeout(() => {
      document.getElementById('login-link-switch')?.addEventListener('click', e => {
        e.preventDefault();
        showLoginModal();
      });
    }, 100);
  }

  function updateSidebar() {
    clearSecondaryNav();

    if (!currentUser) {
      showLoginButton();
      return;
    }

    if (currentUser.role === "teacher") {
      secondaryNav.appendChild(createNavItem(`
        <a href="${getUploadPath()}" class="nav-link">
          <span class="material-symbols-rounded">upload</span>
          <span class="nav-label">Carica Contenuti</span>
        </a>
      `));
    }

    if (currentUser.role === "student") {
      secondaryNav.appendChild(createNavItem(`
        <a href="${getFavoritesPath()}" class="nav-link">
          <span class="material-symbols-rounded">favorite</span>
          <span class="nav-label">Preferiti</span>
        </a>
      `));
    }

    const logout = createNavItem(`
      <a href="#" class="nav-link" id="sign-out">
        <span class="material-symbols-rounded">logout</span>
        <span class="nav-label">Esci</span>
      </a>
    `);

    secondaryNav.appendChild(logout);

    document.getElementById("sign-out")?.addEventListener("click", e => {
      e.preventDefault();
      localStorage.removeItem("currentUser");
      currentUser = null;
      showLoginButton();
      if (window.location.pathname.includes('favorites.html') || window.location.pathname.includes('upload.html')) {
        window.location.href = getHomePath();
      } else {
        showPosts();
      }
    });
  }

function getUploadPath() {
  return './upload.html';
}

function getFavoritesPath() {
  return './favorites.html';
}

function getHomePath() {
  return './Home.html';
}

  document.getElementById("close-modal")?.addEventListener("click", () => {
    authModal.style.display = "none";
  });

  submitBtn?.addEventListener("click", async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const name = nameInput?.value.trim();

    if (!email || !password) {
      alert("Inserisci email e password!");
      return;
    }

    if (isRegistering) {
      if (!name) {
        alert("Inserisci il tuo nome!");
        return;
      }

      if (teachers.find(t => t.email === email) || students.find(s => s.email === email)) {
        alert("Email già registrata!");
        return;
      }

      const newStudent = {
        email: email,
        password: password,
        name: name,
        role: "student"
      };

      students.push(newStudent);
      localStorage.setItem("students", JSON.stringify(students));

      currentUser = newStudent;
      localStorage.setItem("currentUser", JSON.stringify(currentUser));

      authModal.style.display = "none";
      alert("Registrazione completata!");
      updateSidebar();
      showPosts();
    } else {
      const teacher = teachers.find(t => t.email === email && t.password === password);
      const student = students.find(s => s.email === email && s.password === password);

      const user = teacher || student;

      if (!user) {
        alert("Credenziali non valide!");
        return;
      }

      currentUser = user;
      localStorage.setItem("currentUser", JSON.stringify(currentUser));

      authModal.style.display = "none";
      updateSidebar();
      showPosts();
    }
  });

  function detectContext() {
    const body = document.body;

    if (body.dataset.postsPath) {
      return {
        postsPath: body.dataset.postsPath,
        targetDiv: body.dataset.targetDiv || 'dashboard-section'
      };
    }

    const parts = location.pathname.split('/').filter(Boolean);
    const page = (parts.pop() || '').replace('.html','');

    if (['dashboard', 'home'].includes(page.toLowerCase())) {
      return { postsPath: 'posts.json', targetDiv: 'dashboard-section' };
    }

    if (page.startsWith('Dashboard_')) {
      const folder = parts.join('/');
      return {
        postsPath: folder ? `${folder}/posts.json` : 'posts.json',
        targetDiv: `dashboard-${page.split('_')[1].toLowerCase()}-section`
      };
    }

    const folder = parts.join('/');
    return {
      postsPath: folder ? `${folder}/${page}_posts.json` : `${page}_posts.json`,
      targetDiv: `section-${page}`
    };
  }

  async function safeFetchJson(path) {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) throw new Error(res.status);
    return await res.json();
  }

  function toggleFavorite(postId) {
    if (currentUser.role === "student") {
      if (!currentUser) {
        alert("Accedi per salvare i preferiti!");
        return;
      }

      const index = favorites.indexOf(postId);
      if (index > -1) {
        favorites.splice(index, 1);
      } else {
        favorites.push(postId);
      }
      localStorage.setItem("favorites", JSON.stringify(favorites));
      showPosts();
    }
  }

  function isFavorite(postId) {
    return favorites.includes(postId);
  }

  async function showPosts() {
    const { postsPath, targetDiv } = detectContext();
    const container = document.getElementById(targetDiv) || document.querySelector("[id$='-section']");

    if (!container) return;

    try {
      const posts = await safeFetchJson(postsPath);
      if (!Array.isArray(posts)) return;

      container.innerHTML = '';
      posts.sort((a,b) => (b.id || b.timestamp || 0) - (a.id || a.timestamp || 0));

      posts.forEach(post => {
        const card = document.createElement('div');
        card.className = 'post-card';

        let filesHTML = '';
        if (Array.isArray(post.files) && post.files.length > 0) {
          filesHTML = `<div class="post-files">` +
            post.files.map(f => {
              if (f.type?.startsWith('image/')) {
                return `<img src="../${f.data}" alt="${f.name || 'image'}" loading="lazy">`;
              }
              return `<a href="${f.data}" download class="file-link">
                <span class="material-symbols-rounded">download</span>
                ${f.name || 'file'}
              </a>`;
            }).join('') +
          `</div>`;
        }

        const favoriteClass = isFavorite(post.id) ? 'favorite-active' : '';
        const favoriteIcon = isFavorite(post.id) ? 'favorite' : 'favorite_border';

        if (currentUser && currentUser.role === "student") {
          card.innerHTML = `
            <div class="post-header">
              <div class="post-author">
                <div class="author-avatar">${(post.ownerName || 'U').charAt(0).toUpperCase()}</div>
                <div class="author-info">
                  <span class="author-name">${escapeHtml(post.ownerName || 'Utente')}</span>
                  <span class="post-date">${formatDate(post.timestamp)}</span>
                </div>
              </div>
              <button class="favorite-btn ${favoriteClass}" data-post-id="${post.id}" title="${isFavorite(post.id) ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}">
                <span class="material-symbols-rounded">${favoriteIcon}</span>
              </button>
            </div>
            <div class="post-content">
              <h3 class="post-title">${escapeHtml(post.title || 'Senza titolo')}</h3>
              <p class="post-text">${escapeHtml(post.text || post.desc || '')}</p>
            </div>
            ${filesHTML}
            <div class="post-footer">
            </div>
          `;
        } else {
          card.innerHTML = `
            <div class="post-header">
              <div class="post-author">
                <div class="author-avatar">${(post.ownerName || 'U').charAt(0).toUpperCase()}</div>
                <div class="author-info">
                  <span class="author-name">${escapeHtml(post.ownerName || 'Utente')}</span>
                  <span class="post-date">${formatDate(post.timestamp)}</span>
                </div>
              </div>
            </div>
            <div class="post-content">
              <h3 class="post-title">${escapeHtml(post.title || 'Senza titolo')}</h3>
              <p class="post-text">${escapeHtml(post.text || post.desc || '')}</p>
            </div>
            ${filesHTML}
            <div class="post-footer">
            </div>
          `;
        }

        if (currentUser && currentUser.role === "teacher" && post.ownerEmail === currentUser.email) {
          const deleteBtn = document.createElement('button');
          deleteBtn.className = 'delete-btn';
          deleteBtn.innerHTML = '<span class="material-symbols-rounded">delete</span> Elimina';
          deleteBtn.onclick = () => {
            if (confirm("Eliminare questo post?")) {
              fetch('../PHP/delete_post.php', {
                method: 'POST',
                headers: { 'Content-Type':'application/json' },
                body: JSON.stringify({ id: post.id })
              }).then(() => showPosts());
            }
          };
          card.querySelector('.post-footer').appendChild(deleteBtn);
        }

        card.querySelector('.favorite-btn')?.addEventListener('click', function() {
          toggleFavorite(post.id);
        });

        container.appendChild(card);
      });

    } catch (err) {
      console.error("Errore caricamento post:", err);
      if (container) {
        container.innerHTML = '<div class="no-posts">Nessun contenuto disponibile</div>';
      }
    }
  }

  function formatDate(timestamp) {
    if (!timestamp) return 'Data sconosciuta';
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes} minuti fa`;
    if (hours < 24) return `${hours} ore fa`;
    if (days < 7) return `${days} giorni fa`;
    return date.toLocaleDateString('it-IT');
  }

  function formatCategory(section) {
    return section.replace(/_/g, ' ').replace(/,/g, ', ').replace(/\//g, ' › ');
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#039;');
  }

  updateSidebar();
  showPosts();
});

  document.querySelector('.upload-btn')?.addEventListener('click', async () => {
  const title = document.querySelector('.upload-title').value.trim();
  const desc = document.querySelector('.upload-desc').value.trim();
  const sector = document.getElementById('sector').value;
  const subject = document.getElementById('subject').value;
  const filesInput = document.querySelector('.upload-file');

  if (!sector) {
    alert("Seleziona un settore!");
    return;
  }

  const section = subject ? `${sector}/${subject}` : sector;
  const formData = new FormData();
  formData.append('title', title);
  formData.append('desc', desc);
  formData.append('section', section);

  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  formData.append('ownerName', currentUser?.name || 'Utente');
  formData.append('ownerEmail', currentUser?.email || '');
  if (filesInput.files.length > 0) {
    for (let file of filesInput.files) {
      formData.append('files[]', file);
    }
  }

  try {
    const res = await fetch('PHP/upload_post.php', {
      method: 'POST',
      body: formData
    });

    const data = await res.json();

    if (data.success) {
      alert("Upload completato!");
      location.reload();
    } else {
      alert("Errore: " + data.error);
    }

  } catch (err) {
    console.error(err);
    alert("Errore durante l'upload!");
  }
});

const searchInput = document.getElementById('searchInput');
const iconClose = document.getElementById('iconClose');
const sectorCards = document.querySelectorAll('.sector-card');
const postCards = document.querySelectorAll('.post-card');

iconClose.addEventListener('click', () => {
    searchInput.value = '';
    filterSectors('');
    filterPosts('');
    searchInput.focus(); 
});

searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    filterSectors(searchTerm);
    filterPosts(searchTerm);
});

function filterSectors(term) {
    sectorCards.forEach(card => {
        const title = card.querySelector('h2').innerText.toLowerCase();
        const description = card.querySelector('p').innerText.toLowerCase();
        
        if (title.includes(term) || description.includes(term)) {
            card.style.display = "flex";
        } else {
            card.style.display = "none";
        }
    });
}

function filterPosts(term) {
    const postCards = document.querySelectorAll('.post-card');

    postCards.forEach(card => {
        const title = card.querySelector('.post-title')?.innerText.toLowerCase() || '';
        const description = card.querySelector('.post-text')?.innerText.toLowerCase() || '';
        
        if (title.includes(term) || description.includes(term)) {
            card.style.display = "block";
        } else {
            card.style.display = "none";
        }
    });
}
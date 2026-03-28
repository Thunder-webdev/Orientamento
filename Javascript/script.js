document.addEventListener('DOMContentLoaded', () => {
  const navbar = document.getElementById('navbar');
  const toggleBtn = document.getElementById('mobile-toggle');
  const subjectsDropdown = document.getElementById('subjects-dropdown');
  const subjectsToggle = document.getElementById('subjects-toggle');
  const secondaryNav = document.querySelector('.secondary-nav');
  const authModal = document.getElementById('auth-modal');
  const submitBtn = document.getElementById('submit-btn');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const carousel = document.getElementById("carousel");
  carousel.innerHTML += carousel.innerHTML;

  const sections = {};
  document.querySelectorAll("[id$='-section']").forEach(section => {
    sections[section.id.replace('-section', '')] = section;
  });

  let users = JSON.parse(localStorage.getItem("users")) || [
    { email:"maurizio.minissale@davincimilazzo.edu.it", password:"davinci2026", name:"Prof. Minissale", canUpload:true },
    { email:"rosita.artigliere@davincimilazzo.edu.it", password:"davinci2026", name:"Prof. Artigliere", canUpload:true },
    { email:"antonio.caristia@davincimilazzo.edu.it", password:"davinci2026", name:"Prof. Caristia", canUpload:true }
  ];

  let currentUser = localStorage.getItem("email") || null;

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
      authModal.style.display = "flex";
    });
  }

  function updateNavbar() {
    clearSecondaryNav();

    if (!currentUser) {
      showLoginButton();
      return;
    }

    const userObj = users.find(u => u.email === currentUser);

    if (userObj?.canUpload) {
      secondaryNav.appendChild(createNavItem(`
        <a href="../upload.html" class="nav-link">
          <span class="material-symbols-rounded">photo_camera</span>
          <span class="nav-label">Carica Contenuti</span>
        </a>
      `));
    }

    const logout = createNavItem(`
      <a href="#" class="nav-link" id="sign-out">
        <span class="material-symbols-rounded">logout</span>
        <span class="nav-label">Sign Out</span>
      </a>
    `);

    secondaryNav.appendChild(logout);

    document.getElementById("sign-out")?.addEventListener("click", e => {
      e.preventDefault();
      localStorage.removeItem("email");
      currentUser = null;
      showLoginButton();
      showPosts();
    });
  }

  document.getElementById("close-modal")?.addEventListener("click", () => {
    authModal.style.display = "none";
  });

  submitBtn?.addEventListener("click", () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      alert("Inserisci email e password");
      return;
    }

    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
      alert("Credenziali non valide");
      return;
    }

    currentUser = email;
    localStorage.setItem("email", email);
    authModal.style.display = "none";

    updateNavbar();
    showPosts();
  });

  toggleBtn?.addEventListener("click", () => {
    document.querySelector(".navbar-nav")?.classList.toggle("show");
    navbar?.classList.toggle("open-mobile");
  });

  subjectsToggle?.addEventListener("click", e => {
    e.preventDefault();
    subjectsDropdown?.classList.toggle("open");
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

    if (['dashboard','home'].includes(page.toLowerCase())) {
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

  async function showPosts() {
    const { postsPath, targetDiv } = detectContext();
    let container = document.getElementById(targetDiv) || document.querySelector("[id$='-section']");
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
        if (Array.isArray(post.files)) {
          filesHTML = `<div class="post-files">` +
            post.files.map(f => {
              if (f.type?.startsWith('image/')) {
                return `<img src="${f.data}" alt="">`;
              }
              return `<a href="${f.data}" download>${f.name || 'file'}</a>`;
            }).join('') +
          `</div>`;
        }

        card.innerHTML = `
          <div class="post-content">
            <div class="post-title">${escapeHtml(post.title || 'Senza titolo')}</div>
            <div class="post-text">
              <strong>${escapeHtml(post.ownerName || 'Utente')}</strong>:
              ${escapeHtml(post.text || '')}
            </div>
          </div>
          ${filesHTML}
        `;

        if (post.ownerEmail === currentUser) {
          const del = document.createElement('button');
          del.className = 'delete-btn';
          del.textContent = 'Elimina';
          del.onclick = () => {
            if (confirm("Eliminare il post?")) {
              fetch('../PHP/delete_post.php', {
                method: 'POST',
                headers: {'Content-Type':'application/json'},
                body: JSON.stringify({ id: post.id })
              }).then(showPosts);
            }
          };
          card.appendChild(del);
        }

        container.appendChild(card);
      });

    } catch (err) {
      console.error("Errore caricamento post", err);
    }
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#039;');
  }

  updateNavbar();
  showPosts();
});

const searchInput = document.getElementById('searchInput');
const iconClose = document.getElementById('iconClose');
const sectorCards = document.querySelectorAll('.sector-card');
iconClose.addEventListener('click', () => {
    searchInput.value = '';
    filterSectors('');
    searchInput.focus(); 
});

searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    filterSectors(searchTerm);
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
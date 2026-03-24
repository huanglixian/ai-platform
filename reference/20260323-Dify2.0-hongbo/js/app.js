// openDify - Simple navigation & interactions

document.addEventListener('DOMContentLoaded', () => {
  // Sidebar active state
  const sidebarItems = document.querySelectorAll('.sidebar-item[data-page]');
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';

  sidebarItems.forEach(item => {
    const page = item.getAttribute('data-page');
    if (page === currentPage) {
      item.classList.add('active');
    }
    item.addEventListener('click', () => {
      window.location.href = page;
    });
  });

  // Header tab switching (in-page)
  const headerTabs = document.querySelectorAll('.header-tab');
  headerTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      headerTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
    });
  });

  // Card clicks → navigate to detail pages
  const cards = document.querySelectorAll('.card[data-href]');
  cards.forEach(card => {
    card.addEventListener('click', () => {
      window.location.href = card.getAttribute('data-href');
    });
  });

  // Create card click
  const createCards = document.querySelectorAll('.card-create[data-href]');
  createCards.forEach(card => {
    card.addEventListener('click', () => {
      window.location.href = card.getAttribute('data-href');
    });
  });

  // Explore category filter
  const exploreCats = document.querySelectorAll('.explore-cat');
  exploreCats.forEach(cat => {
    cat.addEventListener('click', () => {
      exploreCats.forEach(c => c.classList.remove('active'));
      cat.classList.add('active');
    });
  });

  // Settings nav
  const settingsItems = document.querySelectorAll('.settings-nav-item');
  settingsItems.forEach(item => {
    item.addEventListener('click', () => {
      settingsItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
    });
  });

  // Simple search shortcut hint
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      alert('Search functionality coming soon!');
    }
  });
});

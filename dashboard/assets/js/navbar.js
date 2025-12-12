/**
 * Shared Navigation Component
 * Updates navbar in one place, applies to all pages
 */

(function() {
  'use strict';

  // Get current page path to determine active state
  function getCurrentPath() {
    const path = window.location.pathname;
    if (path === '/dashboard/' || path === '/dashboard') {
      return 'dashboard';
    }
    if (path.includes('/studio')) {
      return 'studio';
    }
    if (path.includes('/members')) {
      return 'members';
    }
    if (path.includes('/projects')) {
      return 'projects';
    }
    if (path.includes('/events')) {
      return 'events';
    }
    if (path.includes('/resources')) {
      return 'equipment';
    }
    if (path.includes('/sponsors')) {
      return 'supporters';
    }
    return '';
  }

  // Generate navbar HTML
  function generateNavbar() {
    const currentPath = getCurrentPath();
    
    const isDashboardActive = currentPath === 'dashboard' ? 'active' : '';
    const isStudioActive = currentPath === 'studio' ? 'active' : '';
    const isEquipmentActive = currentPath === 'equipment' ? 'active' : '';
    const isUsersActive = (currentPath === 'members' || currentPath === 'supporters') ? 'active' : '';
    const isMembersActive = currentPath === 'members' ? 'active' : '';
    const isSupportersActive = currentPath === 'supporters' ? 'active' : '';
    const isProjectsActive = currentPath === 'projects' ? 'active' : '';
    const isEventsActive = currentPath === 'events' ? 'active' : '';

    return `
    <nav class="navbar navbar-expand-lg navbar-dark">
        <div class="container-fluid">
            <a class="navbar-brand" href="/dashboard">StrategyHub</a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav ms-auto">
                    <li class="nav-item">
                        <a class="nav-link ${isDashboardActive}" href="/dashboard">Dashboard</a>
                    </li>
                    <li class="nav-item dropdown">
                        <a class="nav-link dropdown-toggle ${isStudioActive}" href="#" id="studioDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">Studio</a>
                        <ul class="dropdown-menu" aria-labelledby="studioDropdown">
                            <li><a class="dropdown-item ${isStudioActive}" href="/dashboard/studio">Book Studio</a></li>
                            <li><a class="dropdown-item ${isEquipmentActive}" href="/dashboard/resources">Equipment</a></li>
                        </ul>
                    </li>
                    <li class="nav-item dropdown">
                        <a class="nav-link dropdown-toggle ${isUsersActive}" href="#" id="usersDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">Users</a>
                        <ul class="dropdown-menu" aria-labelledby="usersDropdown">
                            <li><a class="dropdown-item ${isMembersActive}" href="/dashboard/members">Members</a></li>
                            <li><a class="dropdown-item ${isSupportersActive}" href="/dashboard/sponsors">Supporters</a></li>
                        </ul>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link ${isProjectsActive}" href="/dashboard/projects">Projects</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link ${isEventsActive}" href="/dashboard/events">Events</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="#" id="logout-link">Logout</a>
                    </li>
                </ul>
            </div>
        </div>
    </nav>`;
  }

  // Initialize navbar when DOM is ready
  function initNavbar() {
    // Find placeholder or existing nav element
    const placeholder = document.getElementById('navbar-placeholder');
    const existingNav = document.querySelector('nav.navbar, nav.nav');
    
    if (placeholder) {
      placeholder.outerHTML = generateNavbar();
    } else if (existingNav) {
      existingNav.outerHTML = generateNavbar();
    } else {
      // If no nav found, prepend to body
      const body = document.body;
      if (body) {
        body.insertAdjacentHTML('afterbegin', generateNavbar());
      }
    }

    // Setup logout handler
    const logoutLink = document.getElementById('logout-link');
    if (logoutLink && typeof auth !== 'undefined') {
      logoutLink.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
          if (typeof toast !== 'undefined') {
            toast.info('Logging out...');
          }
          await auth.logout();
        } catch (error) {
          console.error('Logout failed:', error);
          if (typeof auth !== 'undefined') {
            auth.clearToken();
          }
          window.location.href = '/dashboard/login.html';
        }
      });
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavbar);
  } else {
    initNavbar();
  }
})();


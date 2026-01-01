/**
 * Pagination Component Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Pagination class (matching pagination.js)
class Pagination {
  constructor(options = {}) {
    this.currentPage = options.currentPage || 1;
    this.pageSize = options.pageSize || 20;
    this.totalItems = options.totalItems || 0;
    this.onPageChange = options.onPageChange || (() => {});
    this.maxVisiblePages = options.maxVisiblePages || 5;
    this.container = null;
  }

  get totalPages() {
    return Math.ceil(this.totalItems / this.pageSize);
  }

  get hasNextPage() {
    return this.currentPage < this.totalPages;
  }

  get hasPrevPage() {
    return this.currentPage > 1;
  }

  update(totalItems, currentPage = null) {
    this.totalItems = totalItems;
    if (currentPage !== null) {
      this.currentPage = currentPage;
    }
    this.render();
  }

  render(containerId) {
    const container = containerId 
      ? document.getElementById(containerId)
      : this.container;
    
    if (!container) {
      console.warn('Pagination container not found');
      return;
    }

    this.container = container;

    if (this.totalPages <= 1) {
      container.innerHTML = '';
      return;
    }

    const pages = this.getVisiblePages();
    const startItem = (this.currentPage - 1) * this.pageSize + 1;
    const endItem = Math.min(this.currentPage * this.pageSize, this.totalItems);

    container.innerHTML = `
      <div class="pagination-container">
        <div class="pagination-info">
          Showing ${startItem}-${endItem} of ${this.totalItems}
        </div>
        <div class="pagination-controls">
          <button class="pagination-btn" data-page="prev" ${!this.hasPrevPage ? 'disabled' : ''}>
            Previous
          </button>
          ${pages.map(page => `
            <button class="pagination-btn ${page === this.currentPage ? 'active' : ''}" data-page="${page}">
              ${page}
            </button>
          `).join('')}
          <button class="pagination-btn" data-page="next" ${!this.hasNextPage ? 'disabled' : ''}>
            Next
          </button>
        </div>
      </div>
    `;

    // Attach event listeners
    container.querySelectorAll('.pagination-btn').forEach(btn => {
      if (!btn.disabled) {
        btn.addEventListener('click', (e) => {
          const page = e.target.dataset.page;
          if (page === 'prev') {
            this.goToPage(this.currentPage - 1);
          } else if (page === 'next') {
            this.goToPage(this.currentPage + 1);
          } else {
            this.goToPage(parseInt(page));
          }
        });
      }
    });
  }

  getVisiblePages() {
    const pages = [];
    const total = this.totalPages;
    const current = this.currentPage;
    const maxVisible = this.maxVisiblePages;

    if (total <= maxVisible) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      let start = Math.max(1, current - Math.floor(maxVisible / 2));
      let end = Math.min(total, start + maxVisible - 1);

      if (end - start < maxVisible - 1) {
        start = Math.max(1, end - maxVisible + 1);
      }

      if (start > 1) {
        pages.push(1);
        if (start > 2) {
          pages.push('...');
        }
      }

      for (let i = start; i <= end; i++) {
        if (i !== 1 && i !== total) {
          pages.push(i);
        }
      }

      if (end < total) {
        if (end < total - 1) {
          pages.push('...');
        }
        pages.push(total);
      }
    }

    return pages.filter((p, i, arr) => {
      if (p === '...' && arr[i + 1] === '...') return false;
      return true;
    });
  }

  goToPage(page) {
    if (page < 1 || page > this.totalPages || page === this.currentPage) {
      return;
    }
    this.currentPage = page;
    this.render();
    this.onPageChange(page);
  }

  next() {
    if (this.hasNextPage) {
      this.goToPage(this.currentPage + 1);
    }
  }

  prev() {
    if (this.hasPrevPage) {
      this.goToPage(this.currentPage - 1);
    }
  }
}

describe('Pagination', () => {
  let container;
  let pagination;
  let onPageChange;

  beforeEach(() => {
    document.body.innerHTML = '<div id="pagination-container"></div>';
    container = document.getElementById('pagination-container');
    onPageChange = vi.fn();
    pagination = new Pagination({
      currentPage: 1,
      pageSize: 20,
      totalItems: 100,
      onPageChange
    });
  });

  describe('initialization', () => {
    it('should initialize with default values', () => {
      const p = new Pagination();
      expect(p.currentPage).toBe(1);
      expect(p.pageSize).toBe(20);
      expect(p.totalItems).toBe(0);
      expect(p.maxVisiblePages).toBe(5);
    });

    it('should initialize with custom values', () => {
      const p = new Pagination({
        currentPage: 2,
        pageSize: 10,
        totalItems: 50
      });
      expect(p.currentPage).toBe(2);
      expect(p.pageSize).toBe(10);
      expect(p.totalItems).toBe(50);
    });
  });

  describe('computed properties', () => {
    it('should calculate totalPages correctly', () => {
      expect(pagination.totalPages).toBe(5); // 100 items / 20 per page
    });

    it('should return hasNextPage correctly', () => {
      expect(pagination.hasNextPage).toBe(true);
      pagination.currentPage = 5;
      expect(pagination.hasNextPage).toBe(false);
    });

    it('should return hasPrevPage correctly', () => {
      expect(pagination.hasPrevPage).toBe(false);
      pagination.currentPage = 2;
      expect(pagination.hasPrevPage).toBe(true);
    });
  });

  describe('render', () => {
    it('should render pagination controls', () => {
      pagination.render('pagination-container');
      expect(container.querySelector('.pagination-container')).toBeTruthy();
      expect(container.querySelector('.pagination-info')).toBeTruthy();
    });

    it('should not render if totalPages <= 1', () => {
      pagination.totalItems = 10;
      pagination.pageSize = 20;
      pagination.render('pagination-container');
      expect(container.innerHTML).toBe('');
    });

    it('should display correct item range', () => {
      pagination.render('pagination-container');
      const info = container.querySelector('.pagination-info');
      expect(info.textContent).toContain('Showing 1-20 of 100');
    });

    it('should disable prev button on first page', () => {
      pagination.render('pagination-container');
      const prevBtn = container.querySelector('button[data-page="prev"]');
      expect(prevBtn.disabled).toBe(true);
    });

    it('should disable next button on last page', () => {
      pagination.currentPage = 5;
      pagination.render('pagination-container');
      const nextBtn = container.querySelector('button[data-page="next"]');
      expect(nextBtn.disabled).toBe(true);
    });
  });

  describe('getVisiblePages', () => {
    it('should return all pages when total <= maxVisible', () => {
      pagination.totalItems = 50; // 3 pages
      const pages = pagination.getVisiblePages();
      expect(pages).toEqual([1, 2, 3]);
    });

    it('should show ellipsis for large page counts', () => {
      pagination.totalItems = 200; // 10 pages
      pagination.currentPage = 5;
      const pages = pagination.getVisiblePages();
      expect(pages).toContain(1);
      expect(pages).toContain(10);
      expect(pages).toContain(5);
    });
  });

  describe('goToPage', () => {
    it('should change current page', () => {
      pagination.goToPage(2);
      expect(pagination.currentPage).toBe(2);
      expect(onPageChange).toHaveBeenCalledWith(2);
    });

    it('should not change if page is invalid', () => {
      pagination.goToPage(0);
      expect(pagination.currentPage).toBe(1);
      expect(onPageChange).not.toHaveBeenCalled();
    });

    it('should not change if page exceeds totalPages', () => {
      pagination.goToPage(10);
      expect(pagination.currentPage).toBe(1);
      expect(onPageChange).not.toHaveBeenCalled();
    });

    it('should not change if page is same as current', () => {
      pagination.goToPage(1);
      expect(onPageChange).not.toHaveBeenCalled();
    });
  });

  describe('next and prev', () => {
    it('should go to next page', () => {
      pagination.next();
      expect(pagination.currentPage).toBe(2);
      expect(onPageChange).toHaveBeenCalledWith(2);
    });

    it('should not go to next if on last page', () => {
      pagination.currentPage = 5;
      pagination.next();
      expect(pagination.currentPage).toBe(5);
    });

    it('should go to previous page', () => {
      pagination.currentPage = 2;
      pagination.prev();
      expect(pagination.currentPage).toBe(1);
      expect(onPageChange).toHaveBeenCalledWith(1);
    });

    it('should not go to prev if on first page', () => {
      pagination.prev();
      expect(pagination.currentPage).toBe(1);
    });
  });

  describe('update', () => {
    it('should update totalItems', () => {
      pagination.update(200);
      expect(pagination.totalItems).toBe(200);
    });

    it('should update currentPage if provided', () => {
      pagination.update(200, 3);
      expect(pagination.currentPage).toBe(3);
    });

    it('should re-render after update', () => {
      const renderSpy = vi.spyOn(pagination, 'render');
      pagination.update(200);
      expect(renderSpy).toHaveBeenCalled();
    });
  });
});

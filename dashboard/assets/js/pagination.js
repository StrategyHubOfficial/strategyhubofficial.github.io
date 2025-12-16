/**
 * Pagination Component - Consistent pagination across the system
 */

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
      <div class="pagination-container" style="
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin: 2rem 0;
        padding: 1rem;
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        flex-wrap: wrap;
        gap: 1rem;
      ">
        <div class="pagination-info" style="
          color: var(--text-secondary);
          font-size: 0.9rem;
        ">
          Showing ${startItem}-${endItem} of ${this.totalItems}
        </div>
        
        <div class="pagination-controls" style="
          display: flex;
          gap: 0.5rem;
          align-items: center;
        ">
          <button 
            class="pagination-btn" 
            data-page="prev"
            ${!this.hasPrevPage ? 'disabled' : ''}
            style="
              padding: 0.5rem 1rem;
              background: ${this.hasPrevPage ? 'var(--bitcoin-orange)' : 'var(--bg-card-hover)'};
              color: ${this.hasPrevPage ? 'white' : 'var(--text-muted)'};
              border: 1px solid var(--border-color);
              border-radius: 6px;
              cursor: ${this.hasPrevPage ? 'pointer' : 'not-allowed'};
              font-size: 0.9rem;
              transition: var(--transition);
            "
            onmouseover="if(this.disabled){}else{this.style.opacity='0.9'}"
            onmouseout="if(this.disabled){}else{this.style.opacity='1'}"
          >
            Previous
          </button>
          
          ${pages.map(page => `
            <button 
              class="pagination-btn ${page === this.currentPage ? 'active' : ''}"
              data-page="${page}"
              style="
                padding: 0.5rem 0.75rem;
                min-width: 2.5rem;
                background: ${page === this.currentPage ? 'var(--bitcoin-orange)' : 'var(--bg-card)'};
                color: ${page === this.currentPage ? 'white' : 'var(--text-primary)'};
                border: 1px solid var(--border-color);
                border-radius: 6px;
                cursor: pointer;
                font-size: 0.9rem;
                transition: var(--transition);
                ${page === this.currentPage ? 'font-weight: 600;' : ''}
              "
              onmouseover="if(${page !== this.currentPage}){this.style.background='var(--bg-card-hover)'}"
              onmouseout="if(${page !== this.currentPage}){this.style.background='var(--bg-card)'}"
            >
              ${page}
            </button>
          `).join('')}
          
          <button 
            class="pagination-btn" 
            data-page="next"
            ${!this.hasNextPage ? 'disabled' : ''}
            style="
              padding: 0.5rem 1rem;
              background: ${this.hasNextPage ? 'var(--bitcoin-orange)' : 'var(--bg-card-hover)'};
              color: ${this.hasNextPage ? 'white' : 'var(--text-muted)'};
              border: 1px solid var(--border-color);
              border-radius: 6px;
              cursor: ${this.hasNextPage ? 'pointer' : 'not-allowed'};
              font-size: 0.9rem;
              transition: var(--transition);
            "
            onmouseover="if(this.disabled){}else{this.style.opacity='0.9'}"
            onmouseout="if(this.disabled){}else{this.style.opacity='1'}"
          >
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
      // Show all pages if total is less than max visible
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      // Calculate start and end
      let start = Math.max(1, current - Math.floor(maxVisible / 2));
      let end = Math.min(total, start + maxVisible - 1);

      // Adjust if we're near the end
      if (end - start < maxVisible - 1) {
        start = Math.max(1, end - maxVisible + 1);
      }

      // Always show first page
      if (start > 1) {
        pages.push(1);
        if (start > 2) {
          pages.push('...');
        }
      }

      // Add visible pages
      for (let i = start; i <= end; i++) {
        if (i !== 1 && i !== total) { // Don't duplicate first/last
          pages.push(i);
        }
      }

      // Always show last page
      if (end < total) {
        if (end < total - 1) {
          pages.push('...');
        }
        pages.push(total);
      }
    }

    return pages.filter((p, i, arr) => {
      // Remove duplicate ellipsis and ensure proper order
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

// Export for global use
window.Pagination = Pagination;


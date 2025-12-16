/**
 * Real-Time Form Validation Utility
 * Provides debounced validation with visual feedback
 */

class FormValidator {
  constructor(form, options = {}) {
    this.form = typeof form === 'string' ? document.querySelector(form) : form;
    this.options = {
      debounce: 300,
      validateOnBlur: true,
      validateOnInput: true,
      showSuccessIcon: true,
      showErrorIcon: true,
      ...options
    };
    
    this.validators = new Map();
    this.debounceTimers = new Map();
    this.validationState = new Map();
    
    if (this.form) {
      this.init();
    }
  }

  init() {
    // Add validation styles if not already present
    this.injectStyles();
    
    // Set up input listeners
    const inputs = this.form.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      if (this.options.validateOnInput) {
        input.addEventListener('input', (e) => {
          this.debounceValidate(e.target);
        });
      }
      
      if (this.options.validateOnBlur) {
        input.addEventListener('blur', (e) => {
          this.validateField(e.target);
        });
      }
    });
    
    // Validate on form submit
    this.form.addEventListener('submit', (e) => {
      if (!this.validateForm()) {
        e.preventDefault();
        return false;
      }
    });
  }

  injectStyles() {
    if (document.getElementById('form-validation-styles')) {
      return; // Styles already injected
    }
    
    const style = document.createElement('style');
    style.id = 'form-validation-styles';
    style.textContent = `
      .form-group {
        position: relative;
      }
      
      .form-group.has-success input,
      .form-group.has-success textarea,
      .form-group.has-success select {
        border-color: var(--success, #00b894);
      }
      
      .form-group.has-error input,
      .form-group.has-error textarea,
      .form-group.has-error select {
        border-color: var(--error, #d63031);
      }
      
      .validation-icon {
        position: absolute;
        right: 0.75rem;
        top: 50%;
        transform: translateY(-50%);
        pointer-events: none;
        font-size: 1.1rem;
        z-index: 10;
      }
      
      .form-group input[type="password"] ~ .validation-icon,
      .form-group input[type="email"] ~ .validation-icon,
      .form-group textarea ~ .validation-icon {
        top: 1.5rem;
      }
      
      .validation-icon.success {
        color: var(--success, #00b894);
      }
      
      .validation-icon.error {
        color: var(--error, #d63031);
      }
      
      .validation-message {
        font-size: 0.85rem;
        margin-top: 0.5rem;
        display: block;
        min-height: 1.25rem;
      }
      
      .validation-message.success {
        color: var(--success, #00b894);
      }
      
      .validation-message.error {
        color: var(--error, #d63031);
      }
      
      .validation-message.hint {
        color: var(--text-secondary, #b0b0b0);
      }
    `;
    document.head.appendChild(style);
  }

  registerValidator(fieldName, validator) {
    this.validators.set(fieldName, validator);
  }

  debounceValidate(field) {
    const fieldName = field.name || field.id;
    
    // Clear existing timer
    if (this.debounceTimers.has(fieldName)) {
      clearTimeout(this.debounceTimers.get(fieldName));
    }
    
    // Set new timer
    const timer = setTimeout(() => {
      this.validateField(field);
      this.debounceTimers.delete(fieldName);
    }, this.options.debounce);
    
    this.debounceTimers.set(fieldName, timer);
  }

  validateField(field) {
    const fieldName = field.name || field.id;
    const value = field.value.trim();
    const formGroup = field.closest('.form-group');
    
    if (!formGroup) return true;
    
    // Get validator for this field
    const validator = this.validators.get(fieldName);
    
    if (!validator) {
      // Use default HTML5 validation
      return this.validateHTML5(field, formGroup);
    }
    
    // Run custom validator
    const result = validator(value, field, this.form);
    
    if (result === true || result.valid === true) {
      this.showSuccess(field, formGroup, result?.message);
      this.validationState.set(fieldName, true);
      return true;
    } else {
      const errorMessage = typeof result === 'string' ? result : result?.message || 'Invalid input';
      const suggestion = result?.suggestion || '';
      this.showError(field, formGroup, errorMessage, suggestion);
      this.validationState.set(fieldName, false);
      return false;
    }
  }

  validateHTML5(field, formGroup) {
    if (!field.validity.valid) {
      let message = field.validationMessage;
      
      // Provide better messages for common cases
      if (field.validity.valueMissing) {
        message = field.required ? `${field.labels?.[0]?.textContent || 'This field'} is required` : message;
      } else if (field.validity.typeMismatch) {
        if (field.type === 'email') {
          message = 'Please enter a valid email address';
        } else if (field.type === 'url') {
          message = 'Please enter a valid URL (e.g., https://example.com)';
        }
      } else if (field.validity.tooShort) {
        message = `Must be at least ${field.minLength} characters`;
      } else if (field.validity.tooLong) {
        message = `Must be no more than ${field.maxLength} characters`;
      } else if (field.validity.patternMismatch) {
        message = field.title || 'Invalid format';
      }
      
      this.showError(field, formGroup, message);
      return false;
    } else {
      this.showSuccess(field, formGroup);
      return true;
    }
  }

  showSuccess(field, formGroup, message = null) {
    formGroup.classList.remove('has-error');
    formGroup.classList.add('has-success');
    
    // Remove existing icons
    const existingIcon = formGroup.querySelector('.validation-icon');
    if (existingIcon) {
      existingIcon.remove();
    }
    
    // Add success icon
    if (this.options.showSuccessIcon) {
      const icon = document.createElement('span');
      icon.className = 'validation-icon success';
      icon.innerHTML = '✓';
      icon.setAttribute('aria-label', 'Valid');
      field.parentElement.appendChild(icon);
    }
    
    // Update message
    this.updateMessage(formGroup, message || '', 'success');
  }

  showError(field, formGroup, message, suggestion = '') {
    formGroup.classList.remove('has-success');
    formGroup.classList.add('has-error');
    
    // Remove existing icons
    const existingIcon = formGroup.querySelector('.validation-icon');
    if (existingIcon) {
      existingIcon.remove();
    }
    
    // Add error icon
    if (this.options.showErrorIcon) {
      const icon = document.createElement('span');
      icon.className = 'validation-icon error';
      icon.innerHTML = '✕';
      icon.setAttribute('aria-label', 'Invalid');
      field.parentElement.appendChild(icon);
    }
    
    // Update message with suggestion
    const fullMessage = suggestion ? `${message} ${suggestion}` : message;
    this.updateMessage(formGroup, fullMessage, 'error');
  }

  updateMessage(formGroup, message, type) {
    let messageEl = formGroup.querySelector('.validation-message');
    
    if (!messageEl) {
      messageEl = document.createElement('span');
      messageEl.className = 'validation-message';
      formGroup.appendChild(messageEl);
    }
    
    messageEl.className = `validation-message ${type}`;
    messageEl.textContent = message;
    messageEl.setAttribute('role', type === 'error' ? 'alert' : 'status');
  }

  validateForm() {
    const inputs = this.form.querySelectorAll('input, textarea, select');
    let isValid = true;
    
    inputs.forEach(input => {
      if (!this.validateField(input)) {
        isValid = false;
      }
    });
    
    return isValid;
  }

  // Common validators
  static validators = {
    required: (value) => {
      if (!value || value.trim() === '') {
        return { valid: false, message: 'This field is required' };
      }
      return true;
    },
    
    email: (value) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return { 
          valid: false, 
          message: 'Please enter a valid email address',
          suggestion: 'Example: user@example.com'
        };
      }
      return true;
    },
    
    url: (value) => {
      try {
        new URL(value);
        return true;
      } catch {
        return { 
          valid: false, 
          message: 'Please enter a valid URL',
          suggestion: 'Include https:// or http://'
        };
      }
    },
    
    minLength: (min) => (value) => {
      if (value.length < min) {
        return { 
          valid: false, 
          message: `Must be at least ${min} characters`,
          suggestion: `You need ${min - value.length} more character${min - value.length === 1 ? '' : 's'}`
        };
      }
      return true;
    },
    
    maxLength: (max) => (value) => {
      if (value.length > max) {
        return { 
          valid: false, 
          message: `Must be no more than ${max} characters`,
          suggestion: `Remove ${value.length - max} character${value.length - max === 1 ? '' : 's'}`
        };
      }
      return true;
    },
    
    password: (value) => {
      const issues = [];
      if (value.length < 8) {
        issues.push('at least 8 characters');
      }
      if (!/[A-Z]/.test(value)) {
        issues.push('one uppercase letter');
      }
      if (!/[a-z]/.test(value)) {
        issues.push('one lowercase letter');
      }
      if (!/[0-9]/.test(value)) {
        issues.push('one number');
      }
      
      if (issues.length > 0) {
        return { 
          valid: false, 
          message: 'Password must contain:',
          suggestion: issues.join(', ')
        };
      }
      return true;
    },
    
    passwordMatch: (passwordField) => (value) => {
      const password = passwordField.value;
      if (value !== password) {
        return { 
          valid: false, 
          message: 'Passwords do not match',
          suggestion: 'Make sure both passwords are the same'
        };
      }
      return true;
    },
    
    lightningAddress: (value) => {
      const lightningRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!lightningRegex.test(value)) {
        return { 
          valid: false, 
          message: 'Please enter a valid Lightning address',
          suggestion: 'Format: username@domain.com'
        };
      }
      return true;
    }
  };
}

// Auto-initialize forms with data-validate attribute
document.addEventListener('DOMContentLoaded', () => {
  const forms = document.querySelectorAll('form[data-validate]');
  forms.forEach(form => {
    const validator = new FormValidator(form);
    window.formValidators = window.formValidators || new Map();
    window.formValidators.set(form.id || form, validator);
  });
});


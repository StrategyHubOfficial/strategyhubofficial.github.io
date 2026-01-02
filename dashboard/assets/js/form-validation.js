/**
 * Real-Time Form Validation
 * Provides debounced validation feedback as user types
 */

class FormValidator {
  constructor() {
    this.validators = new Map();
    this.setupDefaultValidators();
  }

  setupDefaultValidators() {
    // Email validation
    this.validators.set('email', {
      validate: (value) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value);
      },
      message: 'Please enter a valid email address'
    });

    // Required validation
    this.validators.set('required', {
      validate: (value) => {
        return value && value.trim().length > 0;
      },
      message: 'This field is required'
    });

    // Min length validation
    this.validators.set('minLength', {
      validate: (value, min) => {
        return value && value.length >= min;
      },
      message: (min) => `Must be at least ${min} characters`
    });

    // Password validation
    this.validators.set('password', {
      validate: (value) => {
        return value && value.length >= 8;
      },
      message: 'Password must be at least 8 characters'
    });

    // URL validation
    this.validators.set('url', {
      validate: (value) => {
        try {
          new URL(value);
          return true;
        } catch {
          return false;
        }
      },
      message: 'Please enter a valid URL'
    });

    // Date validation
    this.validators.set('date', {
      validate: (value) => {
        const date = new Date(value);
        return !isNaN(date.getTime());
      },
      message: 'Please enter a valid date'
    });

    // Future date validation
    this.validators.set('futureDate', {
      validate: (value) => {
        const date = new Date(value);
        return !isNaN(date.getTime()) && date > new Date();
      },
      message: 'Date must be in the future'
    });
  }

  /**
   * Validate a field with debouncing
   */
  validateField(input, rules = []) {
    // Remove existing validation UI and listeners
    this.clearValidation(input);

    // Create debounced validator
    const debouncedValidate = this.debounce(() => {
      const value = input.value;
      let isValid = true;
      let errorMessage = '';

      for (const rule of rules) {
        const validator = this.validators.get(rule.type);
        if (!validator) {
          continue;
        }

        const ruleValid = validator.validate(value, rule.value);
        if (!ruleValid) {
          isValid = false;
          errorMessage = typeof validator.message === 'function' 
            ? validator.message(rule.value) 
            : validator.message;
          break;
        }
      }

      this.showValidation(input, isValid, errorMessage);
    }, 300);

    // Store handlers for cleanup
    input._validationHandlers = {
      input: debouncedValidate,
      blur: debouncedValidate
    };

    // Validate on input
    input.addEventListener('input', debouncedValidate);
    input.addEventListener('blur', debouncedValidate);

    // Initial validation if field has value
    if (input.value) {
      debouncedValidate();
    }
  }

  /**
   * Show validation feedback
   */
  showValidation(input, isValid, message) {
    this.clearValidation(input);

    // Add visual indicator
    if (isValid) {
      input.classList.add('valid');
      input.classList.remove('invalid');
      
      // Add checkmark icon
      const checkmark = document.createElement('span');
      checkmark.className = 'validation-icon valid-icon';
      checkmark.innerHTML = '✓';
      checkmark.style.cssText = `
        position: absolute;
        right: 0.75rem;
        top: 50%;
        transform: translateY(-50%);
        color: var(--success);
        font-weight: bold;
        pointer-events: none;
      `;
      
      const wrapper = this.getWrapper(input);
      if (wrapper) {
        wrapper.style.position = 'relative';
        wrapper.appendChild(checkmark);
      }
    } else {
      input.classList.add('invalid');
      input.classList.remove('valid');

      // Add error icon
      const errorIcon = document.createElement('span');
      errorIcon.className = 'validation-icon invalid-icon';
      errorIcon.innerHTML = '✕';
      errorIcon.style.cssText = `
        position: absolute;
        right: 0.75rem;
        top: 50%;
        transform: translateY(-50%);
        color: var(--error);
        font-weight: bold;
        pointer-events: none;
      `;

      const wrapper = this.getWrapper(input);
      if (wrapper) {
        wrapper.style.position = 'relative';
        // Ensure input has padding-right for icon
        if (!input.style.paddingRight) {
          input.style.paddingRight = '2.5rem';
        }
        wrapper.appendChild(errorIcon);
      }

      // Show error message
      if (message) {
        const errorMsg = document.createElement('div');
        errorMsg.className = 'validation-error';
        errorMsg.textContent = message;
        errorMsg.style.cssText = `
          color: var(--error);
          font-size: 0.85rem;
          margin-top: 0.25rem;
          animation: slideDown 0.2s ease;
        `;
        
        const wrapper = this.getWrapper(input) || input.parentElement;
        wrapper.appendChild(errorMsg);
      }
    }
  }

  /**
   * Clear validation UI
   */
  clearValidation(input) {
    input.classList.remove('valid', 'invalid');
    // Reset padding if we added it
    if (input.style.paddingRight === '2.5rem') {
      input.style.paddingRight = '';
    }
    
    // Remove event listeners
    if (input._validationHandlers) {
      input.removeEventListener('input', input._validationHandlers.input);
      input.removeEventListener('blur', input._validationHandlers.blur);
      delete input._validationHandlers;
    }
    
    const wrapper = this.getWrapper(input) || input.parentElement;
    const icon = wrapper.querySelector('.validation-icon');
    if (icon) icon.remove();
    
    const errorMsg = wrapper.querySelector('.validation-error');
    if (errorMsg) errorMsg.remove();
  }

  /**
   * Get form group wrapper
   */
  getWrapper(input) {
    return input.closest('.form-group') || input.parentElement;
  }

  /**
   * Debounce function
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Validate entire form
   */
  validateForm(form) {
    try {
      const inputs = form.querySelectorAll('input[data-validate], textarea[data-validate]');
      let isValid = true;

      inputs.forEach(input => {
        try {
          const rules = this.parseRules(input.getAttribute('data-validate'));
          const value = input.value;
          let inputValid = true;
          let errorMessage = '';
          
          for (const rule of rules) {
            const validator = this.validators.get(rule.type);
            if (!validator) {
              continue;
            }

            const ruleValid = validator.validate(value, rule.value);
            if (!ruleValid) {
              isValid = false;
              inputValid = false;
              errorMessage = typeof validator.message === 'function' 
                ? validator.message(rule.value) 
                : validator.message;
              break; // Stop at first invalid rule
            }
          }
          
          // Show validation state for both valid and invalid
          this.showValidation(input, inputValid, errorMessage);
        } catch (error) {
          console.error('Error validating input:', error);
          // Continue with other inputs
        }
      });

      return isValid;
    } catch (error) {
      console.error('Error validating form:', error);
      // Return true to allow submission if validation fails catastrophically
      return true;
    }
  }

  /**
   * Parse validation rules from data attribute
   * Format: "required|email|minLength:8"
   */
  parseRules(rulesString) {
    if (!rulesString) return [];
    
    return rulesString.split('|').map((rule) => {
      const [type, value] = rule.split(':');
      return { type, value: value ? parseInt(value, 10) : undefined };
    });
  }

  /**
   * Initialize form with validation
   */
  initForm(form) {
    // Prevent multiple initializations
    if (form._validationInitialized) {
      return;
    }
    form._validationInitialized = true;
    
    const inputs = form.querySelectorAll('input[data-validate], textarea[data-validate]');
    
    inputs.forEach(input => {
      const rules = this.parseRules(input.getAttribute('data-validate'));
      this.validateField(input, rules);
    });

    // Validate on submit (store handler for cleanup)
    const submitHandler = (e) => {
      try {
        if (!this.validateForm(form)) {
          e.preventDefault();
          const firstInvalid = form.querySelector('.invalid');
          if (firstInvalid) {
            try {
              firstInvalid.focus();
              firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } catch (error) {
              console.error('Error focusing invalid field:', error);
            }
          }
          if (typeof toast !== 'undefined' && toast) {
            toast.error('Please fix the errors in the form');
          }
        }
      } catch (error) {
        console.error('Form validation error:', error);
        // Don't prevent submission if validation throws
      }
    };
    form.addEventListener('submit', submitHandler);
    form._validationSubmitHandler = submitHandler; // Store for cleanup
  }
}

// Global form validator instance (only once)
if (!window.formValidator) {
  window.formValidator = new FormValidator();

  // Auto-initialize forms with data-validate attributes
  const initForms = () => {
    document.querySelectorAll('form[data-validate]').forEach(form => {
      if (!form._validationInitialized) {
        window.formValidator.initForm(form);
      }
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initForms);
  } else {
    initForms();
  }
}

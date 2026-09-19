const UI = {
  // Safe text injection to prevent XSS
  safeText: (elementId, text) => {
    const el = document.getElementById(elementId);
    if (el) {
      el.textContent = text;
    }
  },

  // Toast notifications
  showToast: (message, type = 'success') => {
    // Create toast container if it doesn't exist
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'fixed bottom-5 right-5 z-50 flex flex-col gap-2';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    const colors = type === 'success' ? 'bg-green-600 text-white' : 
                   type === 'error' ? 'bg-red-600 text-white' : 
                   'bg-blue-600 text-white';
    
    toast.className = `${colors} px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all transform translate-y-10 opacity-0 duration-300 ease-out`;
    toast.textContent = message;

    container.appendChild(toast);

    // Animate in
    setTimeout(() => {
      toast.classList.remove('translate-y-10', 'opacity-0');
    }, 10);

    // Animate out and remove
    setTimeout(() => {
      toast.classList.add('translate-y-10', 'opacity-0');
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 3000);
  },

  // Date formatting
  formatDate: (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  // Button loading state
  setButtonLoading: (buttonId, isLoading, originalText = '') => {
    const btn = document.getElementById(buttonId);
    if (!btn) return;
    
    if (isLoading) {
      btn.disabled = true;
      btn.dataset.originalText = btn.textContent;
      btn.textContent = 'Memuat...';
      btn.classList.add('opacity-75', 'cursor-not-allowed');
    } else {
      btn.disabled = false;
      btn.textContent = originalText || btn.dataset.originalText || 'Submit';
      btn.classList.remove('opacity-75', 'cursor-not-allowed');
    }
  }
};

window.UI = UI;

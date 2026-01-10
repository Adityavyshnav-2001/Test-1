/**
 * Buy Now Button Functionality
 * Adds product to cart and redirects directly to checkout
 */

class BuyNowButton {
  constructor(button) {
    this.button = button;
    this.init();
  }

  init() {
    this.button.addEventListener('click', this.handleClick.bind(this));
    
    // Listen for variant changes to update the button
    document.addEventListener('variant:change', this.handleVariantChange.bind(this));
  }

  async handleClick(e) {
    e.preventDefault();
    
    const variantId = this.button.dataset.variantId;
    const quantity = parseInt(this.button.dataset.quantity) || 1;

    if (!variantId || this.button.disabled) {
      return;
    }

    // Disable button and show loading state
    const originalText = this.button.innerHTML;
    this.button.disabled = true;
    this.button.innerHTML = 'Processing...';

    try {
      // Add to cart
      const response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: variantId,
          quantity: quantity
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.description || 'Failed to add to cart');
      }

      // Redirect to checkout
      window.location.href = '/checkout';

    } catch (error) {
      console.error('Buy Now error:', error);
      
      // Restore button
      this.button.disabled = false;
      this.button.innerHTML = originalText;
      
      // Show error message
      alert(error.message || 'There was an error processing your order. Please try again.');
    }
  }

  handleVariantChange(event) {
    const variant = event.detail.variant;
    
    if (!variant) {
      this.button.disabled = true;
      this.button.dataset.variantId = '';
      return;
    }

    // Update button state based on variant availability
    this.button.disabled = !variant.available;
    this.button.dataset.variantId = variant.id;

    // Update button text if out of stock
    if (!variant.available) {
      this.button.innerHTML = 'Sold Out';
    } else {
      // Restore original text (you might want to customize this)
      this.button.innerHTML = this.button.dataset.originalText || 'Buy Now';
    }
  }
}

// Initialize all Buy Now buttons on the page
document.addEventListener('DOMContentLoaded', () => {
  const buyNowButtons = document.querySelectorAll('.buy-now-button');
  
  buyNowButtons.forEach(button => {
    // Store original text
    button.dataset.originalText = button.innerHTML;
    new BuyNowButton(button);
  });
});

// Also initialize any dynamically added buttons
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType === 1) { // Element node
        const buyNowButtons = node.querySelectorAll ? node.querySelectorAll('.buy-now-button') : [];
        buyNowButtons.forEach(button => {
          if (!button.dataset.initialized) {
            button.dataset.initialized = 'true';
            button.dataset.originalText = button.innerHTML;
            new BuyNowButton(button);
          }
        });
      }
    });
  });
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});
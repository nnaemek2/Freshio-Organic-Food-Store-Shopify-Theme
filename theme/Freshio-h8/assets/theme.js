window.theme = window.theme || {};
window.slate = window.slate || {};

/* ================ SLATE ================ */
theme.Sections = function Sections() {
  this.constructors = {};
  this.instances = [];

  $(document)
    .on('shopify:section:load', this._onSectionLoad.bind(this))
    .on('shopify:section:unload', this._onSectionUnload.bind(this))
    .on('shopify:section:select', this._onSelect.bind(this))
    .on('shopify:section:deselect', this._onDeselect.bind(this))
    .on('shopify:block:select', this._onBlockSelect.bind(this))
    .on('shopify:block:deselect', this._onBlockDeselect.bind(this));
};

theme.Sections.prototype = _.assignIn({}, theme.Sections.prototype, {
  _createInstance: function(container, constructor) {
    var $container = $(container);
    var id = $container.attr('data-section-id');
    var type = $container.attr('data-section-type');

    constructor = constructor || this.constructors[type];

    if (_.isUndefined(constructor)) {
      return;
    }

    var instance = _.assignIn(new constructor(container), {
      id: id,
      type: type,
      container: container
    });

    this.instances.push(instance);
  },

  _onSectionLoad: function(evt) {
    var container = $('[data-section-id]', evt.target)[0];
    if (container) {
      this._createInstance(container);
    }
    if (AOS) {
      AOS.refreshHard();
    }
  },
  _loadSubSections: function() {
    if (AOS) {
      AOS.refreshHard();
    }
  },
  _onSectionUnload: function(evt) {
    this.instances = _.filter(this.instances, function(instance) {
      var isEventInstance = instance.id === evt.detail.sectionId;

      if (isEventInstance) {
        if (_.isFunction(instance.onUnload)) {
          instance.onUnload(evt);
        }
      }

      return !isEventInstance;
    });
  },

  _onSelect: function(evt) {
    // eslint-disable-next-line no-shadow
    var instance = _.find(this.instances, function(instance) {
      return instance.id === evt.detail.sectionId;
    });

    if (!_.isUndefined(instance) && _.isFunction(instance.onSelect)) {
      instance.onSelect(evt);
    }
  },

  _onDeselect: function(evt) {
    // eslint-disable-next-line no-shadow
    var instance = _.find(this.instances, function(instance) {
      return instance.id === evt.detail.sectionId;
    });

    if (!_.isUndefined(instance) && _.isFunction(instance.onDeselect)) {
      instance.onDeselect(evt);
    }
  },

  _onBlockSelect: function(evt) {
    // eslint-disable-next-line no-shadow
    var instance = _.find(this.instances, function(instance) {
      return instance.id === evt.detail.sectionId;
    });

    if (!_.isUndefined(instance) && _.isFunction(instance.onBlockSelect)) {
      instance.onBlockSelect(evt);
    }
  },

  _onBlockDeselect: function(evt) {
    // eslint-disable-next-line no-shadow
    var instance = _.find(this.instances, function(instance) {
      return instance.id === evt.detail.sectionId;
    });

    if (!_.isUndefined(instance) && _.isFunction(instance.onBlockDeselect)) {
      instance.onBlockDeselect(evt);
    }
  },

  register: function(type, constructor) {
    this.constructors[type] = constructor;

    $('[data-section-type=' + type + ']').each(
      function(index, container) {
        this._createInstance(container, constructor);
      }.bind(this)
    );
  }
});

window.slate = window.slate || {};

/**
 * iFrames
 * -----------------------------------------------------------------------------
 * Wrap videos in div to force responsive layout.
 *
 * @namespace iframes
 */

slate.rte = {
  wrapTable: function() {
    $('.rte table').wrap('<div class="rte__table-wrapper"></div>');
  },

  iframeReset: function() {
    var $iframeVideo = $(
      '.rte iframe[src*="youtube.com/embed"], .rte iframe[src*="player.vimeo"]'
    );
    var $iframeReset = $iframeVideo.add('.rte iframe#admin_bar_iframe');

    $iframeVideo.each(function() {
      // Add wrapper to make video responsive
      $(this).wrap('<div class="video-wrapper"></div>');
    });

    $iframeReset.each(function() {
      // Re-set the src attribute on each iframe after page load
      // for Chrome's "incorrect iFrame content on 'back'" bug.
      // https://code.google.com/p/chromium/issues/detail?id=395791
      // Need to specifically target video and admin bar
      this.src = this.src;
    });
  }
};

window.slate = window.slate || {};

/**
 * A11y Helpers
 * -----------------------------------------------------------------------------
 * A collection of useful functions that help make your theme more accessible
 * to users with visual impairments.
 *
 *
 * @namespace a11y
 */

slate.a11y = {
  /**
   * For use when focus shifts to a container rather than a link
   * eg for In-page links, after scroll, focus shifts to content area so that
   * next `tab` is where user expects if focusing a link, just $link.focus();
   *
   * @param {JQuery} $element - The element to be acted upon
   */
  pageLinkFocus: function($element) {
    var focusClass = 'js-focus-hidden';

    $element
      .first()
      .attr('tabIndex', '-1')
      .focus()
      .addClass(focusClass)
      .one('blur', callback);

    function callback() {
      $element
        .first()
        .removeClass(focusClass)
        .removeAttr('tabindex');
    }
  },

  /**
   * If there's a hash in the url, focus the appropriate element
   */
  focusHash: function() {
    var hash = window.location.hash;

    // is there a hash in the url? is it an element on the page?
    if (hash && document.getElementById(hash.slice(1))) {
      this.pageLinkFocus($(hash));
    }
  },

  /**
   * When an in-page (url w/hash) link is clicked, focus the appropriate element
   */
  bindInPageLinks: function() {
    $('a[href*=#]').on(
      'click',
      function(evt) {
        this.pageLinkFocus($(evt.currentTarget.hash));
      }.bind(this)
    );
  },

  /**
   * Traps the focus in a particular container
   *
   * @param {object} options - Options to be used
   * @param {jQuery} options.$container - Container to trap focus within
   * @param {jQuery} options.$elementToFocus - Element to be focused when focus leaves container
   * @param {string} options.namespace - Namespace used for new focus event handler
   */
  trapFocus: function(options) {
    var eventName = options.namespace
      ? 'focusin.' + options.namespace
      : 'focusin';

    if (!options.$elementToFocus) {
      options.$elementToFocus = options.$container;
    }

    options.$container.attr('tabindex', '-1');
    options.$elementToFocus.focus();

    $(document).on(eventName, function(evt) {
      if (
        options.$container[0] !== evt.target &&
        !options.$container.has(evt.target).length
      ) {
        options.$container.focus();
      }
    });
  },

  /**
   * Removes the trap of focus in a particular container
   *
   * @param {object} options - Options to be used
   * @param {jQuery} options.$container - Container to trap focus within
   * @param {string} options.namespace - Namespace used for new focus event handler
   */
  removeTrapFocus: function(options) {
    var eventName = options.namespace
      ? 'focusin.' + options.namespace
      : 'focusin';

    if (options.$container && options.$container.length) {
      options.$container.removeAttr('tabindex');
    }

    $(document).off(eventName);
  }
};

/**
 * Currency Helpers
 * -----------------------------------------------------------------------------
 * A collection of useful functions that help with currency formatting
 *
 * Current contents
 * - formatMoney - Takes an amount in cents and returns it as a formatted dollar value.
 *
 * Alternatives
 * - Accounting.js - http://openexchangerates.github.io/accounting.js/
 *
 */

theme.Currency = (function() {
  var moneyFormat = '${{amount}}'; // eslint-disable-line camelcase

  function formatMoney(cents, format) {
    if (typeof cents === 'string') {
      cents = cents.replace('.', '');
    }
    var value = '';
    var placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
    var formatString = format || moneyFormat;

    function formatWithDelimiters(number, precision, thousands, decimal) {
      thousands = thousands || ',';
      decimal = decimal || '.';

      if (isNaN(number) || number === null) {
        return 0;
      }

      number = (number / 100.0).toFixed(precision);

      var parts = number.split('.');
      var dollarsAmount = parts[0].replace(
        /(\d)(?=(\d\d\d)+(?!\d))/g,
        '$1' + thousands
      );
      var centsAmount = parts[1] ? decimal + parts[1] : '';

      return dollarsAmount + centsAmount;
    }

    switch (formatString.match(placeholderRegex)[1]) {
      case 'amount':
        value = formatWithDelimiters(cents, 2);
        break;
      case 'amount_no_decimals':
        value = formatWithDelimiters(cents, 0);
        break;
      case 'amount_with_comma_separator':
        value = formatWithDelimiters(cents, 2, '.', ',');
        break;
      case 'amount_no_decimals_with_comma_separator':
        value = formatWithDelimiters(cents, 0, '.', ',');
        break;
      case 'amount_no_decimals_with_space_separator':
        value = formatWithDelimiters(cents, 0, ' ');
        break;
      case 'amount_with_apostrophe_separator':
        value = formatWithDelimiters(cents, 2, "'");
        break;
    }
    return formatString.replace(placeholderRegex, value);
  }

  return {
    formatMoney: formatMoney
  };
})();

/**
 * Image Helper Functions
 * -----------------------------------------------------------------------------
 * A collection of functions that help with basic image operations.
 *
 */

theme.Images = (function() {
  /**
   * Preloads an image in memory and uses the browsers cache to store it until needed.
   *
   * @param {Array} images - A list of image urls
   * @param {String} size - A shopify image size attribute
   */

  function preload(images, size) {
    if (typeof images === 'string') {
      images = [images];
    }

    for (var i = 0; i < images.length; i++) {
      var image = images[i];
      this.loadImage(this.getSizedImageUrl(image, size));
    }
  }

  /**
   * Loads and caches an image in the browsers cache.
   * @param {string} path - An image url
   */
  function loadImage(path) {
    new Image().src = path;
  }

  /**
   * Swaps the src of an image for another OR returns the imageURL to the callback function
   * @param image
   * @param element
   * @param callback
   */
  function switchImage(image, element, callback) {
    var size = this.imageSize(element.src);
    var imageUrl = this.getSizedImageUrl(image.src, size);

    if (callback) {
      callback(imageUrl, image, element); // eslint-disable-line callback-return
    } else {
      element.src = imageUrl;
    }
  }

  /**
   * +++ Useful
   * Find the Shopify image attribute size
   *
   * @param {string} src
   * @returns {null}
   */
  function imageSize(src) {
    src = src || '';

    var match = src.match(
      /.+_((?:pico|icon|thumb|small|compact|medium|large|grande)|\d{1,4}x\d{0,4}|x\d{1,4})[_\\.@]/
    );

    if (match === null) {
      return null;
    } else {
      return match[1];
    }
  }

  /**
   * +++ Useful
   * Adds a Shopify size attribute to a URL
   *
   * @param src
   * @param size
   * @returns {*}
   */
  function getSizedImageUrl(src, size) {
    if (size === null) {
      return src;
    }

    if (size === 'master') {
      return this.removeProtocol(src);
    }

    var match = src.match(
      /\.(jpg|jpeg|gif|png|bmp|bitmap|tiff|tif)(\?v=\d+)?$/i
    );

    if (match !== null) {
      var prefix = src.split(match[0]);
      var suffix = match[0];

      return this.removeProtocol(prefix[0] + '_' + size + suffix);
    }

    return null;
  }

  function removeProtocol(path) {
    return path.replace(/http(s)?:/, '');
  }

  return {
    preload: preload,
    loadImage: loadImage,
    switchImage: switchImage,
    imageSize: imageSize,
    getSizedImageUrl: getSizedImageUrl,
    removeProtocol: removeProtocol
  };
})();

/**
 * Variant Selection scripts
 * ------------------------------------------------------------------------------
 *
 * Handles change events from the variant inputs in any `cart/add` forms that may
 * exist.  Also updates the master select and triggers updates when the variants
 * price or image changes.
 *
 * @namespace variants
 */

slate.Variants = (function() {
  /**
   * Variant constructor
   *
   * @param {object} options - Settings from `product.js`
   */
  function Variants(options) {
    this.$container = options.$container;
    this.product = options.product;
    this.singleOptionSelector = options.singleOptionSelector;
    this.originalSelectorId = options.originalSelectorId;
    this.enableHistoryState = options.enableHistoryState;
    this.currentVariant = this._getVariantFromOptions();

    $(this.singleOptionSelector, this.$container).on(
      'change',
      this._onSelectChange.bind(this)
    );
  }

  Variants.prototype = _.assignIn({}, Variants.prototype, {
    /**
     * Get the currently selected options from add-to-cart form. Works with all
     * form input elements.
     *
     * @return {array} options - Values of currently selected variants
     */
    _getCurrentOptions: function() {
      var currentOptions = _.map(
        $(this.singleOptionSelector, this.$container),
        function(element) {
          var $element = $(element);
          var type = $element.attr('type');
          var currentOption = {};

          if (type === 'radio' || type === 'checkbox') {
            if ($element[0].checked) {
              currentOption.value = $element.val();
              currentOption.index = $element.data('index');

              return currentOption;
            } else {
              return false;
            }
          } else {
            currentOption.value = $element.val();
            currentOption.index = $element.data('index');

            return currentOption;
          }
        }
      );

      // remove any unchecked input values if using radio buttons or checkboxes
      currentOptions = _.compact(currentOptions);

      return currentOptions;
    },

    /**
     * Find variant based on selected values.
     *
     * @param  {array} selectedValues - Values of variant inputs
     * @return {object || undefined} found - Variant object from product.variants
     */
    _getVariantFromOptions: function() {
      var selectedValues = this._getCurrentOptions();
      var variants = this.product.variants;

      var found = _.find(variants, function(variant) {
        return selectedValues.every(function(values) {
          return _.isEqual(variant[values.index], values.value);
        });
      });

      return found;
    },

    /**
     * Event handler for when a variant input changes.
     */
    _onSelectChange: function() {
      var variant = this._getVariantFromOptions();

      this.$container.trigger({
        type: 'variantChange',
        variant: variant
      });

      if (!variant) {
        return;
      }

      this._updateMasterSelect(variant);
      this._updateImages(variant);
      this._updatePrice(variant);
      this._updateSKU(variant);
      this.currentVariant = variant;

      if (this.enableHistoryState) {
        this._updateHistoryState(variant);
      }
    },

    /**
     * Trigger event when variant image changes
     *
     * @param  {object} variant - Currently selected variant
     * @return {event}  variantImageChange
     */
    _updateImages: function(variant) {
      var variantImage = variant.featured_image || {};
      var currentVariantImage = this.currentVariant.featured_image || {};

      if (
        !variant.featured_image ||
        variantImage.src === currentVariantImage.src
      ) {
        return;
      }

      this.$container.trigger({
        type: 'variantImageChange',
        variant: variant
      });
    },

    /**
     * Trigger event when variant price changes.
     *
     * @param  {object} variant - Currently selected variant
     * @return {event} variantPriceChange
     */
    _updatePrice: function(variant) {
      if (
        variant.price === this.currentVariant.price &&
        variant.compare_at_price === this.currentVariant.compare_at_price
      ) {
        return;
      }

      this.$container.trigger({
        type: 'variantPriceChange',
        variant: variant
      });
    },

    /**
     * Trigger event when variant sku changes.
     *
     * @param  {object} variant - Currently selected variant
     * @return {event} variantSKUChange
     */
    _updateSKU: function(variant) {
      if (variant.sku === this.currentVariant.sku) {
        return;
      }

      this.$container.trigger({
        type: 'variantSKUChange',
        variant: variant
      });
    },

    /**
     * Update history state for product deeplinking
     *
     * @param  {variant} variant - Currently selected variant
     * @return {k}         [description]
     */
    _updateHistoryState: function(variant) {
      if (!history.replaceState || !variant) {
        return;
      }

      var newurl =
        window.location.protocol +
        '//' +
        window.location.host +
        window.location.pathname +
        '?variant=' +
        variant.id;
      window.history.replaceState({ path: newurl }, '', newurl);
    },

    /**
     * Update hidden master select of variant change
     *
     * @param  {variant} variant - Currently selected variant
     */
    _updateMasterSelect: function(variant) {
      $(this.originalSelectorId, this.$container).val(variant.id);
    }
  });

  return Variants;
})();


/*================ MODULES ================*/
window.Drawers = (function() {
  var Drawer = function(id, position, options) {
    var defaults = {
      close: '.js-drawer-close',
      open: '.js-drawer-open-' + position,
      openClass: 'js-drawer-open',
      dirOpenClass: 'js-drawer-open-' + position
    };

    this.nodes = {
      $parent: $('body, html'),
      $page: $('.page-element'),
      $moved: $('.is-moved-by-drawer')
    };

    this.config = $.extend(defaults, options);
    this.position = position;

    this.$drawer = $('#' + id);
    this.$open = $(this.config.open);

    if (!this.$drawer.length) {
      return false;
    }

    this.drawerIsOpen = false;
    this.init();
  };

  Drawer.prototype.init = function() {
    this.$open.attr('aria-expanded', 'false');
    this.$open.on('click', $.proxy(this.open, this));
    this.$drawer.find(this.config.close).on('click', $.proxy(this.close, this));
  };

  Drawer.prototype.open = function(evt) {
    // Keep track if drawer was opened from a click, or called by another function
    var externalCall = false;

    // don't open an opened drawer
    if (this.drawerIsOpen) {
      return;
    }

    this.$open.addClass(this.config.openClass);

    // Prevent following href if link is clicked
    if (evt) {
      evt.preventDefault();
    } else {
      externalCall = true;
    }

    // Without this, the drawer opens, the click event bubbles up to $nodes.page
    // which closes the drawer.
    if (evt && evt.stopPropagation) {
      evt.stopPropagation();
      // save the source of the click, we'll focus to this on close
      this.$activeSource = $(evt.currentTarget);
    }

    if (this.drawerIsOpen && !externalCall) {
      return this.close();
    }

    // Add is-transitioning class to moved elements on open so drawer can have
    // transition for close animation
    this.nodes.$moved.addClass('is-transitioning');
    this.$drawer.prepareTransition();

    this.nodes.$parent.addClass(
      this.config.openClass + ' ' + this.config.dirOpenClass
    );
    this.drawerIsOpen = true;

    // Set focus on drawer
    slate.a11y.trapFocus({
      $container: this.$drawer,
      namespace: 'drawer_focus'
    });

    // Run function when draw opens if set
    if (
      this.config.onDrawerOpen &&
      typeof this.config.onDrawerOpen === 'function'
    ) {
      if (!externalCall) {
        this.config.onDrawerOpen();
      }
    }

    if (this.$activeSource && this.$activeSource.attr('aria-expanded')) {
      this.$activeSource.attr('aria-expanded', 'true');
    }

    this.bindEvents();
  };

  Drawer.prototype.close = function() {
    // don't close a closed drawer
    if (!this.drawerIsOpen) {
      return;
    }

    this.$open.removeClass(this.config.openClass);

    // deselect any focused form elements
    $(document.activeElement).trigger('blur');

    // Ensure closing transition is applied to moved elements, like the nav
    this.nodes.$moved.prepareTransition({ disableExisting: true });
    this.$drawer.prepareTransition({ disableExisting: true });

    this.nodes.$parent.removeClass(
      this.config.dirOpenClass + ' ' + this.config.openClass
    );

    this.drawerIsOpen = false;

    // Remove focus on drawer
    slate.a11y.removeTrapFocus({
      $container: this.$drawer,
      namespace: 'drawer_focus'
    });

    if (this.$activeSource && this.$activeSource.attr('aria-expanded')) {
      this.$activeSource.attr('aria-expanded', 'false');
    }

    this.unbindEvents();
  };

  Drawer.prototype.bindEvents = function() {
    // Lock scrolling on mobile
    this.nodes.$page.on('touchmove.drawer', function() {
      return false;
    });

    // Clicking out of drawer closes it
    this.nodes.$page.on(
      'click.drawer',
      $.proxy(function() {
        this.close();
        return false;
      }, this)
    );

    // Pressing escape closes drawer
    this.nodes.$parent.on(
      'keyup.drawer',
      $.proxy(function(evt) {
        if (evt.keyCode === 27) {
          this.close();
        }
      }, this)
    );
  };

  Drawer.prototype.unbindEvents = function() {
    this.nodes.$page.off('.drawer');
    this.nodes.$parent.off('.drawer');
  };

  return Drawer;
})();

window.Modals = (function() {
  var Modal = function(id, name, options) {
    var defaults = {
      close: '.js-modal-close',
      open: '.js-modal-open-' + name,
      openClass: 'modal--is-active'
    };

    this.$modal = $('#' + id);

    if (!this.$modal.length) {
      return false;
    }

    this.nodes = {
      $body: $('body')
    };

    this.config = $.extend(defaults, options);

    this.modalIsOpen = false;
    this.$focusOnOpen = this.config.focusOnOpen
      ? $(this.config.focusOnOpen)
      : this.$modal;
    this.init();
  };

  Modal.prototype.init = function() {
    var $openBtn = $(this.config.open);

    // Add aria controls
    $openBtn.attr('aria-expanded', 'false');

    $(this.config.open).on('click', $.proxy(this.open, this));
    this.$modal.find(this.config.close).on('click', $.proxy(this.close, this));
  };

  Modal.prototype.open = function(evt) {
    // Keep track if modal was opened from a click, or called by another function
    var externalCall = false;

    // don't open an opened modal
    if (this.modalIsOpen) {
      return;
    }

    // Prevent following href if link is clicked
    if (evt) {
      evt.preventDefault();
    } else {
      externalCall = true;
    }

    // Without this, the modal opens, the click event bubbles up to $nodes.page
    // which closes the modal.
    if (evt && evt.stopPropagation) {
      evt.stopPropagation();
      // save the source of the click, we'll focus to this on close
      this.$activeSource = $(evt.currentTarget);
    }

    if (this.modalIsOpen && !externalCall) {
      return this.close();
    }

    this.$modal.prepareTransition().addClass(this.config.openClass);
    this.nodes.$body.addClass(this.config.openClass);

    this.modalIsOpen = true;

    // Set focus on modal
    slate.a11y.trapFocus({
      $container: this.$modal,
      namespace: 'modal_focus',
      $elementToFocus: this.$focusOnOpen
    });

    if (this.$activeSource && this.$activeSource.attr('aria-expanded')) {
      this.$activeSource.attr('aria-expanded', 'true');
    }

    this.bindEvents();
  };

  Modal.prototype.close = function() {
    // don't close a closed modal
    if (!this.modalIsOpen) {
      return;
    }

    // deselect any focused form elements
    $(document.activeElement).trigger('blur');

    this.$modal.prepareTransition().removeClass(this.config.openClass);
    this.nodes.$body.removeClass(this.config.openClass);

    this.modalIsOpen = false;

    // Remove focus on modal
    slate.a11y.removeTrapFocus({
      $container: this.$modal,
      namespace: 'modal_focus'
    });

    if (this.$activeSource && this.$activeSource.attr('aria-expanded')) {
      this.$activeSource.attr('aria-expanded', 'false').focus();
    }

    this.unbindEvents();
  };

  Modal.prototype.bindEvents = function() {
    // Pressing escape closes modal
    this.nodes.$body.on(
      'keyup.modal',
      $.proxy(function(evt) {
        if (evt.keyCode === 27) {
          this.close();
        }
      }, this)
    );
  };

  Modal.prototype.unbindEvents = function() {
    this.nodes.$body.off('.modal');
  };

  return Modal;
})();

window.QtySelector = (function() {
  var QtySelector = function($el) {
    this.cache = {
      $body: $('body'),
      $subtotal: $('#CartSubtotal'),
      $discountTotal: $('#cartDiscountTotal'),
      $cartTable: $('.cart-table'),
      $cartTemplate: $('#CartProducts')
    };

    this.settings = {
      loadingClass: 'js-qty--is-loading',
      isCartTemplate: this.cache.$body.hasClass('template-cart'),
      // On the cart template, minimum is 0. Elsewhere min is 1
      minQty: this.cache.$body.hasClass('template-cart') ? 0 : 1
    };

    this.$el = $el;
    this.qtyUpdateTimeout;
    this.createInputs();
    this.bindEvents();
  };

  QtySelector.prototype.createInputs = function() {
    var $el = this.$el;

    var data = {
      value: $el.val(),
      key: $el.attr('id'),
      name: $el.attr('name'),
      line: $el.attr('data-line')
    };
    var source = $('#QuantityTemplate').html();
    var template = Handlebars.compile(source);

    this.$wrapper = $(template(data)).insertBefore($el);

    // Remove original number input
    $el.remove();
  };

  QtySelector.prototype.validateAvailability = function(line, quantity) {
    var product = theme.cartObject.items[line - 1]; // 0-based index in API
    var handle = product.handle; // needed for the ajax request
    var id = product.id; // needed to find right variant from ajax results

    var params = {
      type: 'GET',
      url: '/products/' + handle + '.js',
      dataType: 'json',
      success: $.proxy(function(cartProduct) {
        this.validateAvailabilityCallback(line, quantity, id, cartProduct);
      }, this)
    };

    $.ajax(params);
  };

  QtySelector.prototype.validateAvailabilityCallback = function(
    line,
    quantity,
    id,
    product
  ) {
    var quantityIsAvailable = true;

    // This returns all variants of a product.
    // Loop through them to get our desired one.
    for (var i = 0; i < product.variants.length; i++) {
      var variant = product.variants[i];
      if (variant.id === id) {
        break;
      }
    }

    // If the variant tracks inventory and does not sell when sold out
    // we can compare the requested with available quantity
    if (
      variant.inventory_management !== null &&
      variant.inventory_policy === 'deny'
    ) {
      if (variant.inventory_quantity < quantity) {

        // Set quantity to max amount available
        this.$wrapper.find('.js-qty__input').val(variant.inventory_quantity);

        quantityIsAvailable = false;
        this.$wrapper.removeClass(this.settings.loadingClass);
      }
    }

    if (quantityIsAvailable) {
      this.updateItemQuantity(line, quantity);
    }
  };

  QtySelector.prototype.validateQty = function(qty) {
    if (parseFloat(qty) === parseInt(qty, 10) && !isNaN(qty)) {
      // We have a valid number!
    } else {
      // Not a number. Default to 1.
      qty = 1;
    }
    return parseInt(qty, 10);
  };

  QtySelector.prototype.adjustQty = function(evt) {
    var $el = $(evt.currentTarget);
    var $input = $el.siblings('.js-qty__input');
    var qty = this.validateQty($input.val());
    var line = $input.attr('data-line');

    if ($el.hasClass('js-qty__adjust--minus')) {
      qty -= 1;
      if (qty <= this.settings.minQty) {
        qty = this.settings.minQty;
      }
    } else {
      qty += 1;
    }

    if (this.settings.isCartTemplate) {
      $el.parent().addClass(this.settings.loadingClass);
      this.updateCartItemPrice(line, qty);
    } else {
      $input.val(qty);
    }
  };

  QtySelector.prototype.bindEvents = function() {
    this.$wrapper
      .find('.js-qty__adjust')
      .on('click', $.proxy(this.adjustQty, this));

    // Select input text on click
    this.$wrapper.on('click', '.js-qty__input', function() {
      this.setSelectionRange(0, this.value.length);
    });

    // If the quantity changes on the cart template, update the price
    if (this.settings.isCartTemplate) {
      this.$wrapper.on(
        'change',
        '.js-qty__input',
        $.proxy(function(evt) {
          var $input = $(evt.currentTarget);
          var line = $input.attr('data-line');
          var qty = this.validateQty($input.val());
          $input.parent().addClass(this.settings.loadingClass);
          this.updateCartItemPrice(line, qty);
        }, this)
      );
    }
  };

  QtySelector.prototype.updateCartItemPrice = function(line, qty) {
    // Update cart after short timeout so user doesn't create simultaneous ajax calls
    clearTimeout(this.qtyUpdateTimeout);
    this.qtyUpdateTimeout = setTimeout(
      $.proxy(function() {
        this.validateAvailability(line, qty);
      }, this),
      200
    );
  };

  QtySelector.prototype.updateItemQuantity = function(line, quantity) {
    var params = {
      type: 'POST',
      url: '/cart/change.js',
      data: 'quantity=' + quantity + '&line=' + line,
      dataType: 'json',
      success: $.proxy(function(cart) {
        this.updateCartItemCallback(cart);
      }, this)
    };

    $.ajax(params);
  };

  QtySelector.prototype.updateCartItemCallback = function(cart) {
    // Reload the page to show the empty cart if no items
    if (cart.item_count === 0) {
      location.reload();
      return;
    }

    // Update cart object
    theme.cartObject = cart;

    // Handlebars.js cart layout
    var data = {};
    var items = [];
    var item = {};
    var source = $('#CartProductTemplate').html();
    var template = Handlebars.compile(source);
    var prodImg;

    // Add each item to our handlebars.js data
    $.each(cart.items, function(index, cartItem) {
      /* Hack to get product image thumbnail
       *   - If image is not null
       *     - Remove file extension, add 240x240, and re-add extension
       *     - Create server relative link
       *   - A hard-coded url of no-image
       */

      if (cartItem.image === null) {
        prodImg =
          '//cdn.shopify.com/s/assets/admin/no-image-medium-cc9732cb976dd349a0df1d39816fbcc7.gif';
      } else {
        prodImg = cartItem.image
          .replace(/(\.[^.]*)$/, '_240x240$1')
          .replace('http:', '');
      }

      if (cartItem.properties !== null) {
        $.each(cartItem.properties, function(key, value) {
          if (key.charAt(0) === '_' || !value) {
            delete cartItem.properties[key];
          }
        });
      }

      // Create item's data object and add to 'items' array
      item = {
        key: cartItem.key,
        line: index + 1, // Shopify uses a 1+ index in the API
        url: cartItem.url,
        img: prodImg,
        name: cartItem.product_title,
        variation: cartItem.variant_title,
        properties: cartItem.properties,
        itemQty: cartItem.quantity,
        price: theme.Currency.formatMoney(cartItem.price, theme.moneyFormat),
        vendor: cartItem.vendor,
        linePrice: theme.Currency.formatMoney(
          cartItem.line_price,
          theme.moneyFormat
        ),
        originalLinePrice: theme.Currency.formatMoney(
          cartItem.original_line_price,
          theme.moneyFormat
        ),
        discounts: cartItem.discounts,
        discountsApplied:
          cartItem.line_price === cartItem.original_line_price ? false : true
      };

      items.push(item);
      theme.updateCurrencies();
    });

    // Gather all cart data and add to DOM
    data = {
      items: items
    };
    this.cache.$cartTemplate.empty().append(template(data));

    // Create new quantity selectors
    this.cache.$cartTable.find('input[type="number"]').each(function(i, el) {
      new QtySelector($(el));
    });

    // Update the cart subtotal
    this.cache.$subtotal.html(
      theme.Currency.formatMoney(cart.total_price, theme.moneyFormat)
    );

    // Update the cart total discounts
    if (cart.total_discount > 0) {
      this.cache.$discountTotal.html(
        theme.strings.totalCartDiscount.replace(
          '[savings]',
          theme.Currency.formatMoney(cart.total_discount, theme.moneyFormat)
        )
      );
    } else {
      this.cache.$discountTotal.empty();
    }
    
    theme.miniCart.updateElements();
    theme.updateCurrencies();
    // Set focus on cart table
    slate.a11y.pageLinkFocus(this.cache.$cartTable);
  };

  return QtySelector;
})();

/*
  Allow product to be added to cart via ajax with
  custom success and error responses.
*/
window.AjaxCart = (function() {
  var styleCart = $('.js-mini-cart').attr("data-cartmini");
  var cart = function($form) {
    this.cache = {
      $cartIconIndicator: $('.site-header__cart-indicator')
    };

    this.$form = $form;
    this.eventListeners();
    
    this.showNotice = false;
    if (this.$form.length) {
      this.showNotice  = this.$form.hasClass('js-form--notice')? true : false;
    }
  };

  cart.prototype.eventListeners = function() {
    if (this.$form.length) {
      this.$form.on('submit', $.proxy(this.addItemFromForm, this));
    }
  };

  cart.prototype.addItemFromForm = function(evt) {
    evt.preventDefault();

    var params = {
      type: 'POST',
      url: '/cart/add.js',
      data: this.$form.serialize(),
      dataType: 'json',
      success: $.proxy(function(lineItem) {
        this.success(lineItem);
      }, this),
      error: $.proxy(function(XMLHttpRequest, textStatus) {
        this.error(XMLHttpRequest, textStatus);
      }, this)
    };

    $.ajax(params);
  };
  
  cart.prototype.success = function(item) {
    theme.miniCart.updateElements();
    theme.miniCart.generateCart();
    if(styleCart != 'true' ){
      if (this.showNotice) {
        var htmlVariant = item.variant_title !== null ? '<i>('+item.variant_title+')</i>' : '';
        var htmlAlert = '<div class="media mt-2 alert--cart"><a class="mr-3" href="/cart"><img class="lazyload" data-src="'+item.image+'"></a><div class="media-body align-self-center"><p class="m-0 font-weight-bold">'+item.product_title+' x '+ item.quantity +'</p>'+htmlVariant+'<div><div>';
        theme.alert.new(theme.strings.addToCartSuccess,htmlAlert,3000,'notice');
      }else{
        theme.crosssell.showPopup(item);
      }
    }
  };

  // Error handling reference from Shopify.onError in api.jquery.js
  cart.prototype.error = function(XMLHttpRequest) {
    var data = JSON.parse(XMLHttpRequest.responseText);
    
    if (data.message) {
      theme.alert.new('',data.description,3000,'warning');
    }
  };

  return cart;
})();

/*================ TEMPLATES ================*/
theme.customerTemplates = (function() {
  function initEventListeners() {
    // Show reset password form
    $('#RecoverPassword').on('click', function(evt) {
      evt.preventDefault();
      toggleRecoverPasswordForm();
    });

    // Hide reset password form
    $('#HideRecoverPasswordLink').on('click', function(evt) {
      evt.preventDefault();
      toggleRecoverPasswordForm();
    });
  }

  /**
   *
   *  Show/Hide recover password form
   *
   */
  function toggleRecoverPasswordForm() {
    $('#RecoverPasswordForm').toggleClass('hide');
    $('#CustomerLoginForm').toggleClass('hide');
  }

  /**
   *
   *  Show reset password success message
   *
   */
  function resetPasswordSuccess() {
    // check if reset password form was successfully submited
    if (!$('.reset-password-success').length) {
      return;
    }

    // show success message
    $('#ResetSuccess').removeClass('hide');
  }

  /**
   *
   *  Show/hide customer address forms
   *
   */
  function customerAddressForm() {
    var $newAddressForm = $('#AddressNewForm');

    if (!$newAddressForm.length) {
      return;
    }

    // Initialize observers on address selectors, defined in shopify_common.js
    if (Shopify) {
      // eslint-disable-next-line no-new
      new Shopify.CountryProvinceSelector(
        'AddressCountryNew',
        'AddressProvinceNew',
        {
          hideElement: 'AddressProvinceContainerNew'
        }
      );
    }

    // Initialize each edit form's country/province selector
    $('.address-country-option').each(function() {
      var formId = $(this).data('form-id');
      var countrySelector = 'AddressCountry_' + formId;
      var provinceSelector = 'AddressProvince_' + formId;
      var containerSelector = 'AddressProvinceContainer_' + formId;

      // eslint-disable-next-line no-new
      new Shopify.CountryProvinceSelector(countrySelector, provinceSelector, {
        hideElement: containerSelector
      });
    });

    // Toggle new/edit address forms
    $('.address-new-toggle').on('click', function() {
      $newAddressForm.toggleClass('hide');
    });

    $('.address-edit-toggle').on('click', function() {
      var formId = $(this).data('form-id');
      $('#EditAddress_' + formId).toggleClass('hide');
    });

    $('.address-delete').on('click', function() {
      var $el = $(this);
      var formId = $el.data('form-id');
      var confirmMessage = $el.data('confirm-message');

      // eslint-disable-next-line no-alert
      if (
        confirm(
          confirmMessage || 'Are you sure you wish to delete this address?'
        )
      ) {
        Shopify.postLink('/account/addresses/' + formId, {
          parameters: { _method: 'delete' }
        });
      }
    });
  }

  /**
   *
   *  Check URL for reset password hash
   *
   */
  function checkUrlHash() {
    var hash = window.location.hash;

    // Allow deep linking to recover password form
    if (hash === '#recover') {
      toggleRecoverPasswordForm();
    }
  }

  return {
    init: function() {
      checkUrlHash();
      initEventListeners();
      resetPasswordSuccess();
      customerAddressForm();
    }
  };
})();

/*================ SECTIONS ================*/
theme.HeaderSection = (function() {
  function Header() {
    theme.NavDrawer = new window.Drawers('NavDrawer', 'left');
  }

  return Header;
})();

theme.Product = (function() {
  var defaults = {
    smallBreakpoint: 750,
    productThumbIndex: 0,
    productThumbMax: 0,
    ajaxCart: false,
    stockSetting: false
  };

  function Product(container) {
    var $container = (this.$container = $(container));
    var sectionId = $container.attr('data-section-id');
    var sectionTem= $container.attr('data-id');

    this.selectors = {
      originalSelectorId: '#ProductSelect-' + sectionId,
      modal: 'ProductModal',
      productZoomImage: '#ProductZoomImg',
      addToCart: '#AddToCart-' + sectionId,
      productPrice: '#ProductPrice-' + sectionId,
      comparePrice: '#ComparePrice-' + sectionId,
      addToCartText: '#AddToCartText-' + sectionId,
      SKU: '.js-variant-sku',
      productImageContainers: '.product__photo-container-' + sectionId,
      productImageWrappers: '.product__photo-wrapper-' + sectionId,
      productThumbContainers: '.product-single__thumbnail-item-' + sectionId,
      productThumbsWrapper: '.product-single__thumbnails-' + sectionId,
      productThumbs: '.product-single__thumbnail-' + sectionId,
      saleTag: '#ProductSaleTag-' + sectionId,
      productStock: '#ProductStock-' + sectionId,
      singleOptionSelector: '.single-option-selector-' + sectionId,
      shopifyPaymentButton: '.shopify-payment-button',
      availability: '.product-single__availability',
      hurrify : '.js-hurrify'
    };

    this.settings = $.extend({}, defaults, {
      sectionId: sectionId,
      sectionTem:sectionTem,
      ajaxCart: $container.data('ajax'),
      stockSetting: $container.data('stock'),
      enableHistoryState: $container.data('enable-history-state') || false,
      namespace: '.product-' + sectionId
    });

    // Stop parsing if we don't have the product json script tag
    if (!$('#ProductJson-' + sectionId).html()) {
      return;
    }

    this.productSingleObject = JSON.parse(
      $('#ProductJson-' + sectionId).html()
    );
    this.addVariantInfo();

    this.init();
  }

  Product.prototype = _.assignIn({}, Product.prototype, {
    init: function() {
      this._stringOverrides();
      this._initVariants();
      this._productZoomImage();
      this._productThumbSwitch();
      this._productThumbnailSlider();
      this._initQtySelector();

      if (this.settings.ajaxCart) {
        theme.AjaxCart = new window.AjaxCart(
          $('#AddToCartForm-' + this.settings.sectionId)
        );
      }
    },

    _stringOverrides: function() {
      window.productStrings = window.productStrings || {};
      $.extend(theme.strings, window.productStrings);
    },

    addVariantInfo: function() {
      if (!this.productSingleObject || !this.settings.stockSetting) {
        return;
      }

      var variantInfo = JSON.parse(
        $('#VariantJson-' + this.settings.sectionId).html()
      );

      for (var i = 0; i < variantInfo.length; i++) {
        $.extend(this.productSingleObject.variants[i], variantInfo[i]);
      }
    },

    _initVariants: function() {
      var options = {
        $container: this.$container,
        enableHistoryState: this.settings.enableHistoryState,
        product: this.productSingleObject,
        singleOptionSelector: this.selectors.singleOptionSelector,
        originalSelectorId: this.selectors.originalSelectorId
      };

      // eslint-disable-next-line no-new
      this.variants = new slate.Variants(options);

      this.$container.on(
        'variantChange' + this.settings.namespace,
        this._updateAddToCartBtn.bind(this)
      );
      this.$container.on(
        'variantChange' + this.settings.namespace,
        this._updateStickyCart.bind(this)
      );
      this.$container.on(
        'variantPriceChange' + this.settings.namespace,
        this._updatePrice.bind(this)
      );
      this.$container.on(
        'variantSKUChange' + this.settings.namespace,
        this._updateSKU.bind(this)
      );
      this.$container.on(
        'variantImageChange' + this.settings.namespace,
        this._updateImages.bind(this)
      );
    },

    _updateStock: function(variant) {
      if (!this.settings.stockSetting) return;

      var $stock = $(this.selectors.productStock),
          $hurrify = $(this.selectors.hurrify);

      // If we don't track variant inventory, hide stock
      if (!variant || !variant.inventory_management) {
        $stock.addClass('hide');
        $hurrify.addClass('hide');
        return;
      }

      if (variant.inventory_quantity < 10 && variant.inventory_quantity > 0) {
        $stock
          .html(
            theme.strings.stockAvailable.replace(
              '1',
              variant.inventory_quantity
            )
          )
          .removeClass('hide');
        $hurrify.removeClass('hide').find('.progress-bar').css('width',variant.inventory_quantity*10+'%');
        return;
      }

      if (variant.inventory_quantity <= 0 && variant.incoming) {
        $stock
          .html(
            theme.strings.willNotShipUntil.replace(
              '[date]',
              variant.next_incoming_date
            )
          )
          .removeClass('hide');
        $hurrify.addClass('hide');
        return;
      }

      // If there's more than 10 available, hide stock
      $stock.addClass('hide');
      $hurrify.addClass('hide');
    },

    _updateIncomingInfo: function(variant) {
      if (!this.settings.stockSetting) return;

      var $stock = $(this.selectors.productStock);

      if (variant.incoming) {
        $stock
          .html(
            theme.strings.willBeInStockAfter.replace(
              '[date]',
              variant.next_incoming_date
            )
          )
          .removeClass('hide');
        return;
      }

      // If there is no stock incoming, hide stock
      $stock.addClass('hide');
    },

    _updateAddToCartBtn: function(evt) {
      var variant = evt.variant;

      var cache = {
        $addToCart: $(this.selectors.addToCart),
        $addToCartText: $(this.selectors.addToCartText)
      };

      if (variant) {
        // Select a valid variant if available
        theme.noticeSoldout.init(variant);
        if (variant.available) {
          // We have a valid product variant, so enable the submit button
          cache.$addToCart.removeClass('btn--sold-out').prop('disabled', false);
          cache.$addToCartText.html(theme.strings.addToCart);
          $(this.selectors.shopifyPaymentButton, this.$container).show();
          // Show how many items are left, if below 10
          this._updateStock(variant);
          //update availability - available
          $(this.selectors.availability).find('span').text(theme.strings.available);
        } else {
          // Variant is sold out, disable the submit button
          cache.$addToCart.prop('disabled', true).addClass('btn--sold-out');
          cache.$addToCartText.html(theme.strings.soldOut);
          $(this.selectors.shopifyPaymentButton, this.$container).hide();
          // Update when stock will be available
          this._updateIncomingInfo(variant);
          //update availability - soldout
          $(this.selectors.availability).find('span').text(theme.strings.soldOut);
        }
      } else {
        cache.$addToCart.prop('disabled', true).removeClass('btn--sold-out');
        cache.$addToCartText.html(theme.strings.unavailable);
        //update availability - unavailable
        $(this.selectors.availability).find('span').text(theme.strings.unavailable);
        $(this.selectors.shopifyPaymentButton, this.$container).hide();
        // Hide stock display
        this._updateStock();
      }
    },

    _updatePrice: function(evt) {
      var variant = evt.variant;

      if (variant) {
        $(this.selectors.productPrice).html(
          theme.Currency.formatMoney(variant.price, theme.moneyFormat)
        );

        // Update and show the product's compare price if necessary
        if (variant.compare_at_price > variant.price) {
          $(this.selectors.comparePrice)
            .html(
              theme.Currency.formatMoney(
                variant.compare_at_price,
                theme.moneyFormat
              )
            )
            .removeClass('hide');
          $(this.selectors.saleTag).removeClass('hide');
        } else {
          $(this.selectors.comparePrice).addClass('hide');
          $(this.selectors.saleTag).addClass('hide');
        }
        
        theme.updateCurrencies();
      } else {
        $(this.selectors.comparePrice).addClass('hide');
      }
    },

    _updateSKU: function(evt) {
      var variant = evt.variant;

      if (variant) {
        $(this.selectors.SKU).html(variant.sku);
      }
    },

    _updateImages: function(evt) {
      var variant = evt.variant;

      if (variant && variant.featured_image) {
        var imageId = variant.featured_image.id;
        this.switchProductImage(imageId);
        this.setActiveThumbnail(imageId);
      }
    },
    _updateStickyCart: function (evt){
      var variant = evt.variant,
          $stickyPrice = $('#js-sticky-price'),
          $stickyTitle = $('#js-sticky-title'),
          $stickyImage = $('#js-sticky-img'),
          $stickyButton = $('#js-sticky-btn');
      if (variant) {
        //update title
        $stickyTitle.html(' - ' + variant.title);
        //update price
        $stickyPrice.html(theme.Currency.formatMoney(variant.price, theme.moneyFormat));
        //update selectbox
        for (var i = 1; i <= 3; i++) {
          var option = 'option' + i,
              $selecBox = '#js-sticky-option-' + i;
          if (variant[option] !== null){
            var valueOption = variant[option];
            $($selecBox).val(valueOption);
          }
        }
        //update button cart
        if (variant.available) {
          $stickyButton.prop('disabled', false).removeClass('btn--sold-out');
          $stickyButton.html(theme.strings.addToCart);
        } else {
          $stickyButton.prop('disabled', true).addClass('btn--sold-out');
          $stickyButton.html(theme.strings.soldOut);
        }
        //update image
        if (variant.featured_image) {
          $stickyImage.attr('src',theme.Images.getSizedImageUrl(variant.featured_image.src,'200x'));
        }
      } else {
        //update title
        $stickyTitle.html(' - ' + theme.strings.unavailable);
        //update button cart
        $stickyButton.prop('disabled', true).removeClass('btn--sold-out');
        $stickyButton.html(theme.strings.unavailable);
      }
    },

    switchProductImage: function(imageId) {
      var $imageToShow = $(
        this.selectors.productImageContainers +
          "[data-image-id='" +
          imageId +
          "']",
        this.$container
      );
      var $imagesToHide = $(
        this.selectors.productImageContainers +
          ":not([data-image-id='" +
          imageId +
          "'])",
        this.$container
      );
      $imagesToHide.addClass('hide');
      $imageToShow.removeClass('hide');
      //Scroll to active
      topMenuHeight = $('.site-header').outerHeight();
      if(this.settings.sectionId === 'product-template-8'){
        $([document.documentElement, document.body]).animate({
          scrollTop: $imageToShow.offset().top-topMenuHeight
        }, 500);
      }
    },

    setActiveThumbnail: function(imageId) {
      var $thumbnailToShow = $(
        this.selectors.productThumbContainers +
          "[data-image-id='" +
          imageId +
          "']",
        this.$container
      );
      var $thumbnailsToHide = $(
        this.selectors.productThumbContainers +
          ":not([data-image-id='" +
          imageId +
          "'])",
        this.$container
      );
      $thumbnailsToHide.removeClass('is-active');
      $thumbnailToShow.addClass('is-active');
      $thumbnailToShow.trigger('click');
      var $thumbnails = $(this.selectors.productThumbsWrapper, this.$container);

      // If there is a slick carousel, get the slide index, and position it into view with animation.
      if ($thumbnails.hasClass('slick-initialized')) {
        // eslint-disable-next-line shopify/jquery-dollar-sign-reference
        var currentActiveSlideIndex = $thumbnails.slick('slickCurrentSlide');
        var newActiveSlideIndex = parseInt(
          $thumbnailToShow.attr('data-slick-index')
        );
        if (currentActiveSlideIndex !== newActiveSlideIndex) {
          $thumbnails.slick('slickGoTo', newActiveSlideIndex, false);
         
        }
      }
    },

    _productZoomImage: function() {
      // The zoom image is only used on the product template, so return early
      // even if a featured product section is present.
      if (
        !$('.product-single ' + this.selectors.productImageContainers).length
      ) {
        return;
      }

      var self = this;

      $(this.selectors.productImageWrappers).on(
        'click' + this.settings.namespace,
        function(evt) {
          evt.preventDefault();
          // Empty src before loadig new image to avoid awkward image swap
          $(self.selectors.productZoomImage)
            .attr('src', '')
            .attr('src', $(this).attr('href'));
        }
      );

      this.ProductModal = new window.Modals(
        this.selectors.modal,
        'product-modal'
      );

      // Close modal if clicked, but not if the image is clicked
      this.ProductModal.$modal.on('click' + this.settings.namespace, function(
        evt
      ) {
        if (evt.target.nodeName !== 'IMG') {
          self.ProductModal.close();
        }
      });
    },

    _productThumbSwitch: function() {
      if (!$(this.selectors.productThumbs).length) {
        return;
      }

      var self = this;

      $(this.selectors.productThumbs).on(
        'click' + this.settings.namespace,
        function(evt) {
          evt.preventDefault();
          var imageId = $(this)
            .parent()
            .data('image-id');
          self.setActiveThumbnail(imageId);
          self.switchProductImage(imageId);
        }
      );
      //trigger hover thumb
      // $(this.selectors.productThumbs).on('click',function(){
      //   $(this).trigger('click');
      // });
    },

    /*
      Thumbnail slider
     */
    _productThumbnailSlider: function() {
      var $productThumbsWrapper = $(this.selectors.productThumbsWrapper);
      var $productThumbs = $(this.selectors.productThumbs);
      if (!$productThumbs.length) {
        return;
      }

      if ($productThumbs.length > 1) {
        $productThumbsWrapper.on(
          'init' + this.settings.namespace,
          this._productSwipeInit.bind(this)
        );
        if (this.settings.sectionTem === 'product-template-3' || this.settings.sectionTem === 'product-template-4' || this.settings.sectionTem === 'product-template-5'){
          $productThumbsWrapper.slick({
            accessibility: false,
            arrows: true,
            dots: false,
            infinite: false,
            autoplay: false,
            slidesToShow: 5,
            slidesToScroll: 5,
            vertical: true,
            verticalSwiping: true,
            responsive: [
              {
                breakpoint: 992,
                settings: {
                  vertical: false,
                  verticalSwiping: false,
                  slidesToShow: 4,
                  slidesToScroll: 4,
                  dots: false,
                }
              }
            ]
          }).css('opacity','1');
        }
        else if(this.settings.sectionTem === 'product-template-7'){
          $productThumbsWrapper.slick({
            accessibility: false,
            arrows: true,
            dots: true,
            infinite: true,
            autoplay: false,
            slidesToShow: 1,
            slidesToScroll: 1,
            responsive: [
              {
                breakpoint: 992,
                settings: {
                  slidesToShow: 1,
                  slidesToScroll: 1,
                  dots: false,
                  arrows: true,
                }
              }
            ]
          }).css('opacity','1');
        }
        else if (this.settings.sectionTem === 'product-template-8' ){
          var lastId,
              topMenu = $(".product-single__thumbnails"),
              topMenuHeight = $('.site-header').outerHeight()+20,
              // All list items
              menuItems = topMenu.find(".product-single__thumbnail");
             
             
          if ($(window).width() > 767) {
              menuItems.click(function (e){
              var findid =$(this).attr('href');
              offsetTop = $(findid).offset().top-topMenuHeight + 1;
              $('html, body').stop().animate({
                  scrollTop: offsetTop
              },200);
              return false;
            });
              // Anchors corresponding to menu items
              scrollItems = menuItems.map(function(){
                var item = $($(this).attr('href'));
                if (item.length) { return item; }
              });
              
            $(window).scroll(function(){
                // Get container scroll position
                var fromTop = $(this).scrollTop()+topMenuHeight;
                // Get id of current scroll item
                var cur = scrollItems.map(function(){
                  if ($(this).offset().top < fromTop)
                    return this;
                });
                // Get the id of the current element
                cur = cur[cur.length-1];
                var id = cur && cur.length ? cur[0].id : "";
                
                if (lastId !== id) {
                    lastId = id;
                    // Set/remove active class
                    menuItems
                      .parent().removeClass("is-active")
                      .end().filter("[href='#"+id+"']").parent().addClass("is-active");
                }                   
            });
          }
          else{
            menuItems.click(function (e){
              var findid =$(this).attr('href');
              offsetTop = $(findid).offset().top;
              $('html, body').stop().animate({
                  scrollTop: offsetTop
              });
              return false;
            });
          }
          
          $productThumbsWrapper.slick({
            accessibility: false,
            arrows: true,
            dots: false,
            infinite: false,
            autoplay: false,
            slidesToShow: 5,
            slidesToScroll: 1,
            vertical: true,
            verticalSwiping: true,
            responsive: [
              {
                breakpoint: 992,
                settings: {
                  vertical: false,
                  verticalSwiping: false,
                  slidesToShow: 4,
                  slidesToScroll: 4,
                  dots: true,
                }
              }
            ]
          }).css('opacity','1');
        }
        else{
          $productThumbsWrapper.slick({
            accessibility: false,
            arrows: true,
            dots: false,
            infinite: false,
            autoplay: false,
            slidesToShow: 4,
            slidesToScroll: 4
          }).css('opacity','1');
        }

        // Show highlighted thumbnail by repositioning slider
        $productThumbsWrapper.slick(
          'slickGoTo',
          $productThumbsWrapper.find('.is-active').attr('data-slick-index'),
          true
        );
      }
    },

    _productSwipeInit: function(evt, obj) {
      // Slider is initialized. Setup custom swipe events
      this.settings.productThumbIndex = obj.currentSlide;
      this.settings.productThumbMax = obj.slideCount - 1; // we need the 0-based index

      var self = this;

      $(this.selectors.productImageWrappers).on(
        'swipeleft swiperight',
        function(event) {
          if (event.type === 'swipeleft') {
            self._goToNextThumbnail();
          }

          if (event.type === 'swiperight') {
            self._goToPrevThumbnail();
          }

          // Trigger click on newly requested thumbnail
          $(
            '.product-single__thumbnail-item[data-slick-index="' +
              self.settings.productThumbIndex +
              '"]'
          )
            .find('.product-single__thumbnail')
            .trigger('click');
          
        }
      );
    },
    _goToNextThumbnail: function() {
      this.settings.productThumbIndex++;

      if (this.settings.productThumbIndex > this.settings.productThumbMax) {
        this.settings.productThumbIndex = 0;
      }

      $(this.selectors.productThumbsWrapper).slick(
        'slickGoTo',
        this.settings.productThumbIndex,
        true
      );
    },

    _goToPrevThumbnail: function() {
      this.settings.productThumbIndex--;

      if (this.settings.productThumbIndex < 0) {
        this.settings.productThumbIndex = this.settings.productThumbMax;
      }

      $(this.selectors.productThumbsWrapper).slick(
        'slickGoTo',
        this.settings.productThumbIndex,
        true
      );
    },

    _initQtySelector: function() {
      this.$container.find('.product-form__quantity').each(function(i, el) {
        // eslint-disable-next-line no-new
        new QtySelector($(el));
      });
    },

    onUnload: function() {
      $(this.selectors.productImageWrappers).off(this.settings.namespace);
      $(this.selectors.productThumbs).off(this.settings.namespace);
      $(this.selectors.productThumbs).slick('unslick');
      if (this.ProductModal) {
        this.ProductModal.$modal.off(this.settings.namespace);
      }
    }
  });

  return Product;
})();

theme.Slideshow = (function() {
  this.$slideshow = null;
  var classes = {
    slideshow: 'slideshow',
    slickActiveMobile: 'slick-active-mobile',
    controlsHover: 'slideshow__controls--hover',
    isPaused: 'is-paused'
  };

  var selectors = {
    section: '.shopify-section',
    wrapper: '#SlideshowWrapper-',
    slides: '.slideshow__slide',
    textWrapperMobile: '.slideshow__text-wrap--mobile',
    textContentMobile: '.slideshow__text-content--mobile',
    controls: '.slideshow__controls',
    dots: '.slick-dots',
    arrowLeft: '.slideshow__arrow-left',
    arrowRight: '.slideshow__arrow-right'
  };

  function slideshow(el, sectionId) {
    var $slideshow = (this.$slideshow = $(el));
    this.adaptHeight = this.$slideshow.data('adapt-height');
    this.$wrapper = this.$slideshow.closest(selectors.wrapper + sectionId);
    this.$section = this.$wrapper.closest(selectors.section);
    this.$controls = this.$wrapper.find(selectors.controls);
    this.$textWrapperMobile = this.$section.find(selectors.textWrapperMobile);
    this.autorotate = this.$slideshow.data('autorotate');
    var autoplaySpeed = this.$slideshow.data('speed');
    var loadSlideA11yString = this.$slideshow.data('slide-nav-a11y');
    var e_arrow = this.$slideshow.data('arrow');
    var e_dot = this.$slideshow.data('dot');

    this.settings = {
      rtl:theme.rtl,
      accessibility: true,
      arrows: e_arrow,
      dots: e_dot,
      fade: (theme.rtl? false:true),
      draggable: true,
      touchThreshold: 20,
      autoplay: this.autorotate,
      autoplaySpeed: autoplaySpeed
    };

    this.$slideshow.on('beforeChange', beforeChange.bind(this));
    this.$slideshow.on('init', slideshowA11ySetup.bind(this));

    // Add class to style mobile dots & show the correct text content for the
    // first slide on mobile when the slideshow initialises
    this.$slideshow.on(
      'init',
      function() {
        this.$mobileDots
          .find('li:first-of-type')
          .addClass(classes.slickActiveMobile);
        this.showMobileText(0);
      }.bind(this)
    );

    if (this.adaptHeight) {
      this.setSlideshowHeight();
      $(window).resize($.debounce(50, this.setSlideshowHeight.bind(this)));
    }

    this.$slideshow.slick(this.settings);

    // This can't be called when the slick 'init' event fires due to how slick
    // adds a11y features.
    slideshowPostInitA11ySetup.bind(this)();
  }

  function slideshowA11ySetup(event, obj) {
    var $slider = obj.$slider;
    var $list = obj.$list;
    this.$dots = this.$section.find(selectors.dots);
    this.$mobileDots = this.$dots.eq(1);

    // Remove default Slick aria-live attr until slider is focused
    $list.removeAttr('aria-live');

//     this.$wrapper.on('keyup', keyboardNavigation.bind(this));
//     this.$controls.on('keyup', keyboardNavigation.bind(this));
//     this.$textWrapperMobile.on('keyup', keyboardNavigation.bind(this));

    // When an element in the slider is focused
    // pause slideshow and set aria-live.
    this.$wrapper
      .on(
        'focusin',
        function(evt) {
          if (!this.$wrapper.has(evt.target).length) {
            return;
          }

          $list.attr('aria-live', 'polite');
          if (this.autorotate) {
            $slider.slick('slickPause');
          }
        }.bind(this)
      )
      .on(
        'focusout',
        function(evt) {
          if (!this.$wrapper.has(evt.target).length) {
            return;
          }

          $list.removeAttr('aria-live');
        }.bind(this)
      );

    // Add arrow key support when focused
    if (this.$dots) {
      this.$dots
        .find('a')
        .each(function() {
          var $dot = $(this);
          $dot.on('click keyup', function(evt) {
            if (
              evt.type === 'keyup' &&
              evt.which !== slate.utils.keyboardKeys.ENTER
            )
              return;

            evt.preventDefault();

            var slideNumber = $(evt.target).data('slide-number');

            $slider.attr('tabindex', -1).slick('slickGoTo', slideNumber);

            if (evt.type === 'keyup') {
              $slider.focus();
            }
          });
        })
        .eq(0)
        .attr('aria-current', 'true');
    }

    this.$controls
      .on('focusin', highlightControls.bind(this))
      .on('focusout', unhighlightControls.bind(this));
  }

  function slideshowPostInitA11ySetup() {
    var $slides = this.$slideshow.find(selectors.slides);

    $slides.removeAttr('role').removeAttr('aria-labelledby');
    this.$dots
      .removeAttr('role')
      .find('li')
      .removeAttr('role')
      .removeAttr('aria-selected')
      .each(function() {
        var $dot = $(this);
        var ariaControls = $dot.attr('aria-controls');
        $dot
          .removeAttr('aria-controls')
          .find('a')
          .attr('aria-controls', ariaControls);
      });
  }

  function beforeChange(event, slick, currentSlide, nextSlide) {
    var $dotLinks = this.$dots.find('a');
    var $mobileDotLinks = this.$mobileDots.find('li');

    $dotLinks
      .removeAttr('aria-current')
      .eq(nextSlide)
      .attr('aria-current', 'true');

    $mobileDotLinks
      .removeClass(classes.slickActiveMobile)
      .eq(nextSlide)
      .addClass(classes.slickActiveMobile);
    this.showMobileText(nextSlide);
  }

//   function keyboardNavigation() {
//     if (event.keyCode === slate.utils.keyboardKeys.LEFTARROW) {
//       this.$slideshow.slick('slickPrev');
//     }
//     if (event.keyCode === slate.utils.keyboardKeys.RIGHTARROW) {
//       this.$slideshow.slick('slickNext');
//     }
//   }

  function highlightControls() {
    this.$controls.addClass(classes.controlsHover);
  }

  function unhighlightControls() {
    this.$controls.removeClass(classes.controlsHover);
  }

  slideshow.prototype.setSlideshowHeight = function() {
    var minAspectRatio = this.$slideshow.data('min-aspect-ratio');
    this.$slideshow.height($(document).width() / minAspectRatio);
  };

  slideshow.prototype.showMobileText = function(slideIndex) {
    var $allTextContent = this.$textWrapperMobile.find(
      selectors.textContentMobile
    );
    var currentTextContentSelector =
      selectors.textContentMobile + '-' + slideIndex;
    var $currentTextContent = this.$textWrapperMobile.find(
      currentTextContentSelector
    );
    if (
      !$currentTextContent.length &&
      this.$slideshow.find(selectors.slides).length === 1
    ) {
      this.$textWrapperMobile.hide();
    } else {
      this.$textWrapperMobile.show();
    }
    $allTextContent.hide();
    $currentTextContent.show();
  };

  function getSlideshowId($el) {
    return '#Slideshow-' + $el.data('id');
  }

  return slideshow;
})();

theme.slideshows = {};

theme.SlideshowSection = (function() {
  function SlideshowSection(container) {
    var $container = (this.$container = $(container));
    var sectionId = $container.attr('data-section-id');
    var slideshow = (this.slideshow = '#Slideshow-' + sectionId);

    theme.slideshows[slideshow] = new theme.Slideshow(slideshow, sectionId);
  }

  return SlideshowSection;
})();

theme.SlideshowSection.prototype = _.assignIn(
  {},
  theme.SlideshowSection.prototype,
  {
    onUnload: function() {
      delete theme.slideshows[this.slideshow];
    },

    onBlockSelect: function(evt) {
      var $slideshow = $(this.slideshow);
      var adaptHeight = $slideshow.data('adapt-height');

      if (adaptHeight) {
        theme.slideshows[this.slideshow].setSlideshowHeight();
      }

      // Ignore the cloned version
      var $slide = $(
        '.slideshow__slide--' + evt.detail.blockId + ':not(.slick-cloned)'
      );
      var slideIndex = $slide.data('slick-index');

      // Go to selected slide, pause auto-rotate
      $slideshow.slick('slickGoTo', slideIndex).slick('slickPause');
    },

    onBlockDeselect: function() {
      // Resume auto-rotate
      $(this.slideshow).slick('slickPlay');
    }
  }
);

theme.slideshows = {};

theme.Cart = (function() {
  var selectors = {
    cartNote: '#CartSpecialInstructions',
    cartQtyInput: '.cart__quantity',
    cartNoCookiesClass: 'cart--no-cookies'
  };

  function Cart(container) {
    var $container = (this.$container = $(container));
    var sectionId = $container.attr('data-section-id');

    theme.cartObject = JSON.parse($('#CartJson-' + sectionId).html());

    this.init($container);
  }

  Cart.prototype = _.assignIn({}, Cart.prototype, {
    init: function($container) {
      this._initQtySelector();
      this._initCartNote();

      if (!this._cookiesEnabled()) {
        $container.addClass(selectors.cartNoCookiesClass);
      }
    },

    _initQtySelector: function() {
      $(selectors.cartQtyInput).each(function(i, el) {
        // eslint-disable-next-line no-new
        new QtySelector($(el));
      });
    },

    _initCartNote: function() {
      if (!$(selectors.cartNote).length) {
        return;
      }

      var $el = $(selectors.cartNote);
      var noteText;
      var params;
      var noteOffset = $el[0].offsetHeight - $el[0].clientHeight;

      // Auto grow the cart note if text fills it up
      $el.on('keyup input', function() {
        $(this)
          .css('height', 'auto')
          .css('height', $el[0].scrollHeight + noteOffset);
      });

      // Save the cart note via ajax. A safeguard in case
      // a user decides to leave the page before clicking 'Update Cart'
      $el.on(
        'change',
        $.proxy(function() {
          noteText = $el.val();
          params = {
            type: 'POST',
            url: '/cart/update.js',
            data: 'note=' + this._attributeToString(noteText),
            dataType: 'json'
          };
          $.ajax(params);
        }, this)
      );
    },

    _attributeToString: function(attr) {
      if (typeof attr !== 'string') {
        attr = String(attr);
        if (attr === 'undefined') {
          attr = '';
        }
      }
      return $.trim(attr);
    },

    _cookiesEnabled: function() {
      var cookieEnabled = navigator.cookieEnabled;

      if (!cookieEnabled) {
        document.cookie = 'testcookie';
        cookieEnabled = document.cookie.indexOf('testcookie') !== -1;
      }
      return cookieEnabled;
    }
  });

  return Cart;
})();

// Instagrams
theme.Instagrams = (function() {
  function Instagrams(container) {
    this.$container = $(container).on('init', this._a11y.bind(this));
    this.settings = {
      style 			: this.$container.data('style'),
      accesstoken 		: this.$container.data('accesstoken'),
      userid			: this.$container.data('userid'),
      limit 			: this.$container.data('limit'),
      resolution 		: this.$container.data('resolution'),
      target 			: this.$container.attr('id'),
      rows 			: this.$container.data('rows'),
      
      slidesToShow 		: this.$container.data('slidestoshow') || 1,
      infinite 			: this.$container.data('infinite') || false,
      arrows 			: this.$container.data('arrows') || false,
      draggable 		: this.$container.data('draggable') || false,
      dots 				: this.$container.data('dots') || false,
    }
    this.settings.slidesToShow1200 		= (this.settings.slidesToShow - 1) > 1? (this.settings.slidesToShow - 1) : 1;
    this.settings.slidesToShow992  		= (this.settings.slidesToShow - 2) > 1? (this.settings.slidesToShow - 2) : 1;
    this.settings.slidesToShow768  		= (this.settings.slidesToShow - 3) > 1? (this.settings.slidesToShow - 3) : 1;
    this.settings.slidesToShow480  		= 2;
    
    var _self = this;
    var $instagramSelector = $('#'+this.settings.target);
    if (this.settings.style === 'grid'){
      var afterInstagram = function(){} // blank function
    }else if (this.settings.style === 'carousel'){
      var afterInstagram = function(){
        $instagramSelector.slick({
          slidesToShow		: _self.settings.slidesToShow,
          slidesToScroll	: _self.settings.slidesToShow,
          arrows			: _self.settings.arrows,
          dots				: _self.settings.dots,
          draggable		 	: _self.settings.draggable,
          infinite		 	: _self.settings.infinite,
          rows : _self.settings.rows,
          responsive: [
            {
              breakpoint: 1200,
              settings: {
                slidesToShow	: _self.settings.slidesToShow1200,
                slidesToScroll	: _self.settings.slidesToShow1200,
              }
            },
            {
              breakpoint: 992,
              settings: {
                slidesToShow	: _self.settings.slidesToShow992,
                slidesToScroll	: _self.settings.slidesToShow992,
              }
            },
            {
              breakpoint: 768,
              settings: {
                slidesToShow	: _self.settings.slidesToShow768,
                slidesToScroll	: _self.settings.slidesToShow768,
              }
            },
            {
              breakpoint: 480,
              settings: {
                slidesToShow	: _self.settings.slidesToShow480,
                slidesToScroll	: _self.settings.slidesToShow480,
              }
            }
          ]
        })
      }
    }

    var feed = new Instafeed({
      get			: 'user',
      target 		: this.settings.target,
      userId		: this.settings.userid,
      accessToken	: this.settings.accesstoken,
      limit			: this.settings.limit,
      resolution	: this.settings.resolution,
      template		: '<div class="col hv-image-brightness"><a class="instagram-item" href="{{link}}" target="_blank" id="{{id}}"><img alt="instagram image" class="transition lazyload" data-src="{{image}}" /></a></div>',
      after			: afterInstagram
    });

    feed.run();
  }

  Instagrams.prototype = _.assignIn({}, Instagrams.prototype, {
    _a11y: function(event, obj) {
      var $list = obj.$list;
      var $wrapper = this.$container.parent();

      // Remove default Slick aria-live attr until slider is focused
      $list.removeAttr('aria-live');

      // When an element in the slider is focused set aria-live
      $wrapper.on('focusin', function(evt) {
        if ($wrapper.has(evt.target).length) {
          $list.attr('aria-live', 'polite');
        }
      });

      // Remove aria-live
      $wrapper.on('focusout', function(evt) {
        if ($wrapper.has(evt.target).length) {
          $list.removeAttr('aria-live');
        }
      });
    }
  });

  return Instagrams;
})();

// Slick carousel
theme.slickCarousel = (function (){
  function Carousels(container) {
    this.$container = $(container).on('init', this._a11y.bind(this));
    this.settings = {
      rows 				: this.$container.data('rows') || 1,
      slidesToShow 		: this.$container.data('slidestoshow') || 1,
      slidesToScroll	: this.$container.data('slidestoscroll') || 1,
      infinite 			: this.$container.data('infinite') || false,
      arrows 			: this.$container.data('arrows') || false,
      dots 				: this.$container.data('dots') || false,
      autoplay 			: this.$container.data('autoplay') || false,
      draggable 		: this.$container.data('draggable') || false,
      accessibility 	: this.$container.data('accessibility') || true,
    }
    this.settings.slidesToShow1200 		= (this.settings.slidesToShow - 1) > 1? (this.settings.slidesToShow - 1) : 1;
    this.settings.slidesToShow992  		= (this.settings.slidesToShow - 2) > 1? (this.settings.slidesToShow - 2) : 1;
    this.settings.slidesToShow768  		= (this.settings.slidesToShow - 3) > 1? (this.settings.slidesToShow - 3) : 1;
    this.settings.slidesToShow480  		= (this.settings.slidesToShow - 4) > 1? (this.settings.slidesToShow - 4) : 1;
    this.settings.slidesToScroll1200 	= (this.settings.slidesToScroll - 1) > 1? (this.settings.slidesToScroll - 1) : 1;
    this.settings.slidesToScroll992  	= (this.settings.slidesToScroll - 2) > 1? (this.settings.slidesToScroll - 2) : 1;
    this.settings.slidesToScroll768  	= (this.settings.slidesToScroll - 3) > 1? (this.settings.slidesToScroll - 3) : 1;
    this.settings.slidesToScroll480  	= (this.settings.slidesToScroll - 4) > 1? (this.settings.slidesToScroll - 4) : 1;
    this.$container.slick({
      rtl				: theme.rtl,
      rows 				: this.settings.rows,
      slidesToShow		: this.settings.slidesToShow,
      slidesToScroll 	: this.settings.slidesToScroll,
      arrows			: this.settings.arrows,
      dots				: this.settings.dots,
      autoplay			: this.settings.autoplay,
      accessibility		: this.settings.accessibility,
      draggable			: this.settings.draggable,
      infinite			: this.settings.infinite,
      adaptiveHeight: true,
      responsive: [
        {
          breakpoint: 1200,
          settings: {
            slidesToShow: this.settings.slidesToShow1200,
            slidesToScroll: this.settings.slidesToScroll1200
          }
        },
        {
          breakpoint: 992,
          settings: {
            slidesToShow: this.settings.slidesToShow992,
            slidesToScroll: this.settings.slidesToScroll992
          }
        },
        {
          breakpoint: 768,
          settings: {
            slidesToShow: this.settings.slidesToShow768,
            slidesToScroll: this.settings.slidesToScroll768
          }
        },
        {
          breakpoint: 480,
          settings: {
            slidesToShow: 1,
            slidesToScroll: this.settings.slidesToScroll480
          }
        }
      ]
    })
  }

  Carousels.prototype = _.assignIn({}, Carousels.prototype, {
    _a11y: function(event, obj) {
      var $list = obj.$list;
      var $wrapper = this.$container.parent();

      // Remove default Slick aria-live attr until slider is focused
      $list.removeAttr('aria-live');

      // When an element in the slider is focused set aria-live
      $wrapper.on('focusin', function(evt) {
        if ($wrapper.has(evt.target).length) {
          $list.attr('aria-live', 'polite');
        }
      });

      // Remove aria-live
      $wrapper.on('focusout', function(evt) {
        if ($wrapper.has(evt.target).length) {
          $list.removeAttr('aria-live');
        }
      });
    },
    
    _goToSlide: function(slideIndex) {
      this.$container.slick('slickGoTo', slideIndex);
    },

    onUnload: function() {
      delete this.$container;
    },

    onBlockSelect: function(evt) {
      // Ignore the cloned version
      var $slide = $(
        '.carousel__slide-wrapper--' + evt.detail.blockId + ':not(.slick-cloned)'
      );
      var slideIndex = $slide.data('slick-index');

      // Go to selected slide, pause autoplay
      this._goToSlide(slideIndex);
      
    }
  });

  return Carousels;
})()

// Productlists
theme.Productlists = (function() {
  function Productlists(container) {
    this.$container = $(container).on('init', this._a11y.bind(this));
    this.settings = {
      slidesToShow 		: this.$container.data('slidestoshow') || 1,
      rows 				: this.$container.data('rows') || 1,
      arrows 			: this.$container.data('arrows') || false,
      dots 				: this.$container.data('dots') || false,
      draggable 		: this.$container.data('draggable') || false,
      infinite 			: this.$container.data('infinite') || false,
    }
    this.settings.slidesToShow1200 = (this.settings.slidesToShow - 1) > 1? (this.settings.slidesToShow - 1) : 1;
    this.settings.slidesToShow992  = (this.settings.slidesToShow - 2) > 1? (this.settings.slidesToShow - 2) : 1;
    this.settings.slidesToShow768  = (this.settings.slidesToShow - 3) > 1? (this.settings.slidesToShow - 3) : 1;
    this.settings.slidesToShow480  = 2;
    this.$container.slick({
      rtl				: theme.rtl,
      accessibility		: true,
      slidesToShow		: this.settings.slidesToShow,
      slidesToScroll	: this.settings.slidesToShow,
      rows				: this.settings.rows,
      arrows			: this.settings.arrows,
      dots				: this.settings.dots,
      infinite 			: this.settings.infinite,
      draggable			: this.settings.draggable,
      responsive		: [
        {
          breakpoint: 1200,
          settings: {
            slidesToShow	: this.settings.slidesToShow1200,
            slidesToScroll	: this.settings.slidesToShow1200
          }
        },
        {
          breakpoint: 992,
          settings: {
            slidesToShow	: this.settings.slidesToShow992,
            slidesToScroll	: this.settings.slidesToShow992
          }
        },
        {
          breakpoint: 768,
          settings: {
            slidesToShow	: this.settings.slidesToShow768,
            slidesToScroll	: this.settings.slidesToShow768
          }
        },
        {
          breakpoint: 480,
          settings: {
            slidesToShow	: this.settings.slidesToShow480,
            slidesToScroll	: this.settings.slidesToShow480
          }
        }
      ]
    }).css('opacity','1');
  }

  Productlists.prototype = _.assignIn({}, Productlists.prototype, {
    _a11y: function(event, obj) {
      var $list = obj.$list;
      var $wrapper = this.$container.parent();

      // Remove default Slick aria-live attr until slider is focused
      $list.removeAttr('aria-live');

      // When an element in the slider is focused set aria-live
      $wrapper.on('focusin', function(evt) {
        if ($wrapper.has(evt.target).length) {
          $list.attr('aria-live', 'polite');
        }
      });

      // Remove aria-live
      $wrapper.on('focusout', function(evt) {
        if ($wrapper.has(evt.target).length) {
          $list.removeAttr('aria-live');
        }
      });
    },

    _goToSlide: function(slideIndex) {
      this.$container.slick('slickGoTo', slideIndex);
    },

    onUnload: function() {
      delete this.$container;
    }
  });

  return Productlists;
})();

// Producttabs
theme.Producttabs = (function() {
  function Producttabs(container) {
    var _self = this; // avoid conflict
    this.$container = $(container).on('init', this._a11y.bind(this));
    this.slickWrap 	= '.prdtab-content';
    this.settings 	= {
      slidesToShow 		: this.$container.data('slidestoshow') || 1,
      arrows 			: this.$container.data('arrows') || false,
      rows 				: this.$container.data('rows') || 1,
      dots 				: this.$container.data('dots') || false,
      draggable			: this.$container.data('draggable') || false,
      infinite			: this.$container.data('infinite') || false,
    }
    this.settings.slidesToShow1200 = (this.settings.slidesToShow - 1) > 1? (this.settings.slidesToShow - 1) : 1;
    this.settings.slidesToShow992  = (this.settings.slidesToShow - 2) > 1? (this.settings.slidesToShow - 2) : 1;
    this.settings.slidesToShow768  = (this.settings.slidesToShow - 3) > 1? (this.settings.slidesToShow - 3) : 1;
    this.settings.slidesToShow480  = 2;

    this._initSlick();
    this.$container.find('a[data-toggle="tab"]').on("shown.bs.tab", function(e) {
      _self._unSlick();
      _self._initSlick();
      theme.tooltip.load();
    })
  }

  Producttabs.prototype = _.assignIn({}, Producttabs.prototype, {
    _a11y: function(event, obj) {
      var $list = obj.$list;
      var $wrapper = this.$container.parent();

      // Remove default Slick aria-live attr until slider is focused
      $list.removeAttr('aria-live');

      // When an element in the slider is focused set aria-live
      $wrapper.on('focusin', function(evt) {
        if ($wrapper.has(evt.target).length) {
          $list.attr('aria-live', 'polite');
        }
      });

      // Remove aria-live
      $wrapper.on('focusout', function(evt) {
        if ($wrapper.has(evt.target).length) {
          $list.removeAttr('aria-live');
        }
      });
    },

    _getSliderSettings : function (){
      return {
        rtl				: theme.rtl,
        accessibility	: true,
        slidesToShow	: this.settings.slidesToShow,
        slidesToScroll	: this.settings.slidesToShow,
        arrows			: this.settings.arrows,
        rows			: this.settings.rows,
        dots			: this.settings.dots,
        infinite 		: this.settings.infinite,
        draggable		: this.settings.draggable,
        responsive: [
          {
            breakpoint: 1200,
            settings: {
              slidesToShow: this.settings.slidesToShow1200,
              slidesToScroll: this.settings.slidesToShow1200
            }
          },
          {
            breakpoint: 992,
            settings: {
              slidesToShow: this.settings.slidesToShow992,
              slidesToScroll: this.settings.slidesToShow992
            }
          },
          {
            breakpoint: 768,
            settings: {
              slidesToShow: this.settings.slidesToShow768,
              slidesToScroll: this.settings.slidesToShow768
            }
          },
          {
            breakpoint: 480,
            settings: {
              slidesToShow: this.settings.slidesToShow480,
              slidesToScroll: this.settings.slidesToShow480
            }
          }
        ]
      }
    },

    _initSlick : function (){
      this.$container.find(this.slickWrap).slick(this._getSliderSettings()).css('opacity','1');
    },

    _unSlick : function(){
      this.$container.find(this.slickWrap).slick('unslick');
    },

    onUnload: function() {
      delete this.$container;
    },

    onSelect: function() {
      this._unSlick();
      this._initSlick();
    },

    onBlockSelect: function(evt) {
      var navItem = $('.nav-link-' + evt.detail.blockId);
      navItem.tab('show');
      this._unSlick();
      this._initSlick();
    }
  });

  return Producttabs;
})();

theme.Video = (function() {
  var promiseYoutubeAPI;
  var promiseVimeoAPI;

  var youtube = {
    promiseAPI: function() {
      if (!promiseYoutubeAPI) {
        var tag = document.createElement('script');

        tag.src = 'https://www.youtube.com/iframe_api';
        var firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

        promiseYoutubeAPI = $.Deferred(function(defer) {
          window.onYouTubeIframeAPIReady = defer.resolve;

          setTimeout(function() {
            defer.reject('Request for YouTube API timed out after 30 seconds.');
          }, 30000);
        });
      }

      return promiseYoutubeAPI;
    },
    promisePlayer: function(id, options) {
      return this.promiseAPI().then(function() {
        return $.Deferred(function(defer) {
          if (typeof window.YT === 'undefined') {
            defer.reject(
              "We're sorry, something went wrong. The YouTube API has not loaded correctly."
            );
          }

          /* eslint-disable no-undef */
          var player = new YT.Player(id, options); // global YT variable injected by YouTube API

          player.addEventListener('onReady', function() {
            defer.resolve(player);
          });

          setTimeout(function() {
            defer.reject(
              'Request for YouTube player has timed out after 30 seconds.'
            );
          }, 30000);
        });
      });
    }
  };

  var vimeo = {
    promiseAPI: function() {
      if (!promiseVimeoAPI) {
        promiseVimeoAPI = $.Deferred(function(defer) {
          var tag = document.createElement('script');
          tag.src = 'https://player.vimeo.com/api/player.js';
          tag.onload = tag.onreadystatechange = function() {
            if (!this.readyState || this.readyState === 'complete') {
              defer.resolve();
            }
          };

          var firstScriptTag = document.getElementsByTagName('script')[0];
          firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

          setTimeout(function() {
            defer.reject('Request for Vimeo API timed out after 30 seconds.');
          }, 30000);
        });
      }

      return promiseVimeoAPI;
    },

    promisePlayer: function(id, options) {
      return this.promiseAPI().then(function() {
        return $.Deferred(function(defer) {
          if (typeof window.Vimeo === 'undefined') {
            defer.reject(
              "We're sorry, something went wrong. The Vimeo API has not loaded correctly."
            );
          }

          var player = new window.Vimeo.Player(id, options);

          setTimeout(function() {
            defer.reject(
              'Request for Vimeo player has timed out after 30 seconds.'
            );
          }, 30000);

          player.ready().then(function() {
            defer.resolve(player);
          });
        });
      });
    }
  };

  var selectors = {
    loadPlayerButton: '.video-section__load-player-button',
    closePlayerButton: '.video-section__player-close',
    playerContainer: '.video-section__player',
    cover: '.video-section__cover',
    errorMessage: '.video-section__error',
    bodyOverlay: '.video-section__body-overlay',
    body: 'body'
  };
  var classes = {
    playerLoading: 'video-section--loading',
    playerLoaded: 'video-section--loaded',
    playerError: 'video-section--error',
    videoPlaying: 'video-playing'
  };

  function Video(container) {
    this.$container = $(container);
    var sectionId = this.$container.attr('data-section-id');
    this.namespace = '.' + sectionId;
    this.onLoad();
  }

  Video.prototype = _.assignIn({}, Video.prototype, {
    onLoad: function() {
      this.$container
        .on('click', selectors.loadPlayerButton, this._loadPlayer.bind(this))
        .on('click', selectors.closePlayerButton, this._closePlayer.bind(this))
        .on('click', selectors.bodyOverlay, this._closePlayer.bind(this));
    },

    _loadPlayer: function() {
      var $container = this.$container;
      var $playerContainer = $(selectors.playerContainer, $container);
      var playerType = this.$container.attr('data-video-type');

      var promiseVideoPlayer;

      if (playerType === 'youtube') {
        promiseVideoPlayer = this._loadYoutubePlayer($playerContainer[0]);
      } else if (playerType === 'vimeo') {
        promiseVideoPlayer = this._loadVimeoPlayer($playerContainer[0]);
      }

      return promiseVideoPlayer
        .then(this._onPlayerLoadReady.bind(this))
        .fail(this._onPlayerLoadError.bind(this));
    },

    _loadYoutubePlayer: function(container) {
      return youtube
        .promisePlayer(container, {
          videoId: this.$container.attr('data-video-id'),
          ratio: 16 / 9,
          playerVars: {
            modestbranding: 1,
            autoplay: 1,
            showinfo: 0,
            rel: 0
          }
        })
        .then(
          function(player) {
            this.player = player;
          }.bind(this)
        );
    },

    _loadVimeoPlayer: function(container) {
      return vimeo
        .promisePlayer(container, {
          id: this.$container.attr('data-video-id')
        })
        .then(
          function(player) {
            this.player = player;
            this.player.play();
          }.bind(this)
        );
    },

    _onPlayerLoadReady: function() {
      $(selectors.closePlayerButton, this.$container)
        .show()
        .focus();
      $(selectors.cover, this.$container).addClass(classes.playerLoaded);
      this.$container.addClass(classes.playerLoaded);

      this._setScrollPositionValues();

      $(selectors.body).addClass(classes.videoPlaying);

      $(document).on('keyup' + this.namespace, this._closeOnEscape.bind(this));
      $(window).on(
        'resize' + this.namespace,
        this._setScrollPositionValues.bind(this)
      );
      slate.a11y.trapFocus({
        $container: this.$container,
        namespace: this.namespace
      });
    },

    _onPlayerLoadError: function(err) {
      this.$container.addClass(classes.playerError);
      $(selectors.errorMessage, this.$container).text(err);
    },

    _closeOnEscape: function(evt) {
      if (evt.keyCode !== 27) {
        return;
      }

      this._closePlayer();
      $(selectors.loadPlayerButton, this.$container).focus();
    },

    _onScroll: function() {
      var scrollTop = $(window).scrollTop();

      if (
        scrollTop > this.videoTop + 0.25 * this.videoHeight ||
        scrollTop + this.windowHeight <
          this.videoBottom - 0.25 * this.videoHeight
      ) {
        // Debounce DOM edits to the next frame with requestAnimationFrame
        requestAnimationFrame(this._closePlayer.bind(this));
      }
    },

    _setScrollPositionValues: function() {
      this.videoHeight = this.$container.outerHeight(true);
      this.videoTop = this.$container.offset().top;
      this.videoBottom = this.videoTop + this.videoHeight;
      this.windowHeight = $(window).innerHeight();
    },

    _closePlayer: function() {
      $(selectors.body).removeClass(classes.videoPlaying);
      $(selectors.cover, this.$container).removeClass(classes.playerLoaded);
      this.$container.removeClass(classes.playerLoaded);
      $(selectors.closePlayerButton, this.$container).hide();

      slate.a11y.removeTrapFocus({
        $container: this.$container,
        namespace: this.namespace
      });

      if (typeof this.player.destroy === 'function') {
        this.player.destroy();
      } else if (typeof this.player.unload === 'function') {
        this.player.unload();
      }

      $(document).off(this.namespace);
      $(window).off(this.namespace);
    }
  });

  return Video;
})();

theme.CollectionsList = (function() {
  function CollectionsList(container) {
    var $container = (this.$container = $(container));
    var stretchImage = $container.is('[data-stretch-image]');

    // Early return if 'secondary image layout' is enabled
    if (stretchImage) return;

    var namespace = (this.namespace = '.' + $container.attr('data-section-id'));
    var self = this;

    self._collectionListFix();
    $(window).on(
      'resize' + namespace,
      $.debounce(250, function() {
        self._collectionListFix();
      })
    );
  }

  CollectionsList.prototype = _.assignIn({}, CollectionsList.prototype, {
    onUnload: function() {
      $(window).off(this.namespace);
    },

    _collectionListFix: function() {
      var numberRows = this.$container.find('.grid').data('number-rows');
      var $featureCards = this.$container.find('.featured-card');

      // We can exit if 'Use secondary image layout' is enabled
      if ($featureCards.is('[data-stretch-image]')) return;

      // Go through each of the rows
      for (var i = 0; i < numberRows; i++) {
        var maxWrapperHeight = 0;
        var maxHeaderHeight = 0;
        var $currentRow = $featureCards.filter(
          "[data-row-number='" + (i + 1) + "']"
        );
        var $cardHeaders = $currentRow.find('.featured-card__header');

        // Find the max heights for each row
        $currentRow.each(function() {
          var $cardTitle = $(this).find('.featured-card__title');
          var $cardAction = $(this).find('.featured-card__action');
          var $cardImageWrapper = $(this).find('.featured-card__image-wrapper');
          var headerHeight =
            $cardTitle.outerHeight() + $cardAction.outerHeight() + 65;
          var wrapperHeight = $cardImageWrapper.outerHeight();
          if (headerHeight > maxHeaderHeight) {
            maxHeaderHeight = headerHeight;
          }
          if (wrapperHeight > maxWrapperHeight) {
            maxWrapperHeight = wrapperHeight;
          }
        });

        // Set the heights of the headers and cards for this row with padding
        $cardHeaders.outerHeight(maxHeaderHeight);
        $currentRow.height(maxWrapperHeight + maxHeaderHeight + 40);
      }
    }
  });

  return CollectionsList;
})();

theme.ParrallaxImage = (function() {
  function ParrallaxImage(container) {
    this.container = container;
      this.sectionId = $(container).attr('data-section-id');
      this.namespace = 'parallax-' + this.sectionId;
      var images =  document.getElementsByClassName('thumbnail'+ this.sectionId);
      new simpleParallax(images,{
        scale: 1.5,
        delay: .6,
      });
  }

  ParrallaxImage.prototype = $.extend({}, ParrallaxImage.prototype, {
    onUnload: function(evt) {
      var instance = new simpleParallax(images);
      instance.destroy();
      delete theme.ParrallaxImage[this.namespace];
    }
  });

  return ParrallaxImage;
})();

theme.init = function() {
  theme.customerTemplates.init();
  slate.rte.wrapTable();
  slate.rte.iframeReset();

  // Common a11y fixes
  slate.a11y.pageLinkFocus($(window.location.hash));

  $('.in-page-link').on('click', function(evt) {
    slate.a11y.pageLinkFocus($(evt.currentTarget.hash));
  });

  $('a[href="#"]').on('click', function(evt) {
    evt.preventDefault();
  });


    //scroll animation
  AOS.init({
    startEvent: 'DOMContentLoaded',
    offset: 30, // offset (in px) from the original trigger point
    delay: 0, // values from 0 to 3000, with step 50ms
    duration: 1000,
    once: true
  });
  window.addEventListener('load', function() {
    AOS.refresh();
  });


  // Sections
  var sections = new theme.Sections();
  sections.register('header', theme.HeaderSection);
  sections.register('product', theme.Product);
  sections.register('slideshow-section', theme.SlideshowSection);
  sections.register('cart', theme.Cart);
  sections.register('instagrams', theme.Instagrams);
  sections.register('masonries', theme.Masonry);
  sections.register('productlist', theme.Productlists);
  sections.register('producttab', theme.Producttabs);
  sections.register('slickCarousels', theme.slickCarousel);
  sections.register('video', theme.Video);
  sections.register('collections-list', theme.CollectionsList);
  sections.register('parallax-image', theme.ParrallaxImage);
  sections.register('bgcollection',theme.Bgcollection);

  // Standalone modules
  $(window).on('load', theme.articleImages);
  theme.passwordModalInit();
};

theme.articleImages = function() {
  var $indentedRteImages = $('.rte--indented-images');
  if (!$indentedRteImages.length) {
    return;
  }

  $indentedRteImages.find('img').each(function(i, el) {
    var $el = $(el);
    var attr = $el.attr('style');

    // Check if undefined or float: none
    if (!attr || attr === 'float: none;') {
      // Add class to parent paragraph tag if image is wider than container
      if ($el.width() >= $indentedRteImages.width()) {
        $el.parent('p').addClass('rte__image-indent');
      }
    }
  });
};

theme.passwordModalInit = function() {
  var $loginModal = $('#LoginModal');
  if (!$loginModal.length) {
    return;
  }

  // Initialize modal
  theme.PasswordModal = new window.Modals('LoginModal', 'login-modal', {
    focusOnOpen: '#Password'
  });

  // Open modal if errors exist
  if ($loginModal.find('.errors').length) {
    theme.PasswordModal.open();
  }
};

// CSS var ponyfill
theme.cssVar = (function() {
  cssVars();
})()

// Ajax search https://gist.github.com/awojtczyk/53d74c8af5f893841f33979b0cdcd6fe
theme.ajaxSearch = (function() {
  var $inputSearch = '.js-ajaxsearch',
      $resultsList = '.search-results',
      $input = $($inputSearch).find('input[name="q"]'),
      $currentAjaxRequest,
      $displayProducts = 6;

  $($inputSearch).css('position', 'relative').each(function() {
    $input.attr('autocomplete', 'off').bind('keyup change', function() {
      var term = $(this).val(),
          form = $(this).closest('form'),
          searchURL = '/search?type=product&q=*' + term + '*';
      if (term.length > 2 && term !== $(this).attr('data-old-term')) {
        $(this).attr('data-old-term', term);
        if ($currentAjaxRequest !== undefined) $currentAjaxRequest.abort();
        $currentAjaxRequest = $.getJSON(searchURL + '&view=json', function(data) {
          $($resultsList).empty();

          if (data.results_count === 0) {
            $($resultsList).html('<p class="text-center">'+ theme.strings.ajaxSearchNoResult +'</p>')
          } else {
            $.each(data.results, function(index, item) {
              if (index < $displayProducts){
                var itemPrice = theme.Currency.formatMoney(item.price, theme.moneyFormat);
                var link = $('<a class="d-inline-flex '+index+'"></a>')
                .attr('href', item.url)
                .append('<span class="image"><img src="' + item.thumbnail + '" /></span>')
                .append('<div class="meta"><p class="title">' + item.title + '</p>'+itemPrice+'</div>')
                .wrap('<div class="ajax-search-item"></div>');
                $($resultsList).append(link.parent());
                theme.updateCurrencies();
              }
            });
            if (data.results_count > $displayProducts) {
              $($resultsList).append('<a class="btn btn--full" href="' + searchURL + '">'+ theme.strings.ajaxSearchViewAll +' (' + data.results_count + ')</a>');
            }
          }
          $($resultsList).addClass('active').fadeIn(200);
        });
      }
    });
  });

  //escape when click somethings
  $(document).click(function(event) {
    var target = event.target;
    if (!$(target).is($inputSearch) && !$(target).parents().is($inputSearch)) {
      $($resultsList).slideUp(300);
    }
  });
})();

// Quickview https://github.com/kellyvaughn/quickview-for-shopify/blob/master/quickview.js.liquid
theme.quickview = (function() {
  var product_handle = '',
      quickviewButtonClass = '.js-btn-quickview',
      quickviewId = '#jsQuickview',
      quickviewOption = '#jsQuickview select',
      quickviewThumb = '#qv-product-images',
      quickviewAddCartButton = '.qv-add-button',
      quickviewPrice = '.qv-product-price',
      quickviewComparePrice = '.qv-product-compare-price';

  // 1. Show quickview
  $(document).on('click',quickviewButtonClass, function() {
    var quickviewAvaible = $(this).attr("data-pavailable");
    product_handle = $(this).data('handle');
    //ResetQuickview
    $(quickviewId).removeClass().addClass('modal fade');
    $(quickviewThumb).removeClass().empty();
    $('.qv-product-options').empty();
    var desc = $(this).find('.txt-short').text();
    $("#loading_qv").removeClass('active');
    //Pushdata
    $(quickviewId).addClass(product_handle).data('handle',product_handle);
    jQuery.getJSON('/products/' + product_handle + '.js', function(product) {
      var title = product.title;
      var type = product.type;
      var vendor = product.vendor;
      var price = 0;
      var compare_price = 0;
      var images = product.images;
      var variants = product.variants;
      var options = product.options;
      var url = '/products/' + product_handle;
      
      $('.qv-product-title').text(title);
      $('.qv-product-type').text(type);
      $('.qv-product-description').html(desc);
      $('.qv-view-product').attr('href', url);
      $('.qv-view-type').text(type);
      $('.qv-view-vendor').text(vendor);
      if ($('.qv-product-description').is(':empty')){
        $('.qv-product-description').removeClass('my-3');
      }
      else{
        $('.qv-product-description').addClass('my-3');
      }
      if(quickviewAvaible == 'true'){
        $(quickviewAddCartButton).prop('disabled', false).html(theme.strings.addToCart);
      }
      else{
        $(quickviewAddCartButton).prop('disabled', true).html(theme.strings.soldOut);
      }
      $(product.variants).each(function(i,variants) {
        if(variants.sku != null){
          $('.qv-sku').addClass("show").removeClass("hide");
          $('.qv-view-sku').text(product.variants[0].sku);
        }
        else{
          $('.qv-sku').addClass("hide").removeClass("show");
        }
        
      });
      var imageCount = $(images).length;
      $(images).each(function(i, image) {
        image_embed = '<div><img class="lazyload" data-src="' + image + '"></div>';
        image_embed = image_embed.replace('.jpg', '_600x.jpg').replace('.png', '_600x.png');
        $(quickviewThumb).append(image_embed);
      });
      $(quickviewThumb).slick({
        rtl:theme.rtl,
        'dots': true,
        'arrows': true,
        'respondTo': 'min',
        'useTransform': true
      }).css('opacity', '1');

      if (product.variants[0].option1 !== "Default Title"){
        $(options).each(function(i, option) {
          var name = option.name;
          var opt = name.replace(/ /g, '-').toLowerCase();
          var selectClass = '.option.' + opt;
          $('.qv-product-options').append('<div class="option-selection ' + opt + '"><span class="option text-uppercase font-weight-bold text-body">' + option.name + '</span><select class="option-' + i + ' option ' + opt + '"></select></div>');
          $(option.values).each(function(i, value) {
            $('.option.' + opt).append($('<option>', {
              value: value,
              text: value
            }));
          });
        });
      }
      $(product.variants).each(function(i, v) {
        if (v.inventory_quantity == 0) {
          return true
        } else {
          price = theme.Currency.formatMoney(v.price, theme.moneyFormat);
          compare_price = theme.Currency.formatMoney(v.compare_at_price, theme.moneyFormat);
          $(quickviewPrice).html(price);
          if (v.compare_at_price !== null) {
            $(quickviewComparePrice).html(compare_price).show();
          } else {
            $(quickviewComparePrice).hide();
          }
          theme.updateCurrencies();
          $('select.option-0').val(v.option1);
          $('select.option-1').val(v.option2);
          $('select.option-2').val(v.option3);
          return false
        }
      });
    }).fail(function() {
      console.log( "error" );
    })
    .always(function() {
      $("#loading_qv").addClass('active');
    });
    //addCartQuickview
  });
  // 2. Add to cart
  $(document).on('click',quickviewAddCartButton, function(){
    product_handle = $(quickviewId).data('handle');
    var qty = $('.qv-quantity').val(),
        selectedOptions = '',
        var_id = '';
    function processCart() {
      jQuery.post('/cart/add.js', {
        quantity: qty,
        id: var_id
      },null,"json").done(function(item) {
        var htmlVariant = item.variant_title !== null ? '<i>('+item.variant_title+')</i>' : '';
        var styleCart = $('.js-mini-cart').attr("data-cartmini");
        if(styleCart != 'true'){
        var htmlAlert = '<div class="media mt-2 alert--cart"><a class="mr-3" href="/cart"><img class="lazyload" data-src="'+item.image+'"></a><div class="media-body align-self-center"><p class="m-0 font-weight-bold">'+item.product_title+' x '+ item.quantity +'</p>'+htmlVariant+'<div><div>';
        theme.alert.new(theme.strings.addToCartSuccess,htmlAlert,3000,'notice');
        }
        theme.miniCart.updateElements();
        theme.miniCart.generateCart();
      })
      .fail(function($xhr) {
        var data = $xhr.responseJSON;
        theme.alert.new('',data.description,3000,'warning');
      });
    }
    $(quickviewOption).each(function(i) {
      if (selectedOptions == '') {
        selectedOptions = $(this).val();
      } else {
        selectedOptions = selectedOptions + ' / ' + $(this).val();
      }
    });
    jQuery.getJSON('/products/' + product_handle + '.js', function(product) {
      if (product.variants.length === 1){
        var_id = product.variants[0].id;
      }else{
        $(product.variants).each(function(i, v) {
          if (v.title == selectedOptions) {
            var_id = v.id;
          }
        });
      }
      processCart();
    });
  });
  // 3. Select variants
  $(document).on('change', quickviewOption, function() {
    var selectedOptions = '';
    $(quickviewOption).each(function(i) {
      if (selectedOptions == '') {
        selectedOptions = $(this).val();
      } else {
        selectedOptions = selectedOptions + ' / ' + $(this).val();
      }
    });
    jQuery.getJSON('/products/' + product_handle + '.js', function(product) {
      $(product.variants).each(function(i, v) {
        if (v.title == selectedOptions) {
          if (v.featured_image !== null){
            var iSlick = v.featured_image.position - 1;
            $(quickviewThumb).slick('slickGoTo', iSlick);
          }
          var price = theme.Currency.formatMoney(v.price, theme.moneyFormat);
          var compare_price = theme.Currency.formatMoney(v.compare_at_price, theme.moneyFormat);
          $(quickviewPrice).html(price);
          $(quickviewComparePrice).html(compare_price);
          if(v.sku != null){
            $('.qv-sku').addClass("show").removeClass("hide");
            $('.qv-view-sku').text(v.sku);
          }
          else{
            $('.qv-sku').addClass("hide").removeClass("show");
          }
          if (v.compare_at_price !== null) {
            $(quickviewComparePrice).html(compare_price).show();
          } else {
            $(quickviewComparePrice).hide();
          }
          theme.updateCurrencies();
          if (v.inventory_management === null) {
            $(quickviewAddCartButton).prop('disabled', false).val(theme.strings.addToCart);
          } else {
            if (v.inventory_quantity < 1) {
              $(quickviewAddCartButton).prop('disabled', true).val(theme.strings.soldOut);
            } else {
              $(quickviewAddCartButton).prop('disabled', false).val(theme.strings.addToCart);
            }
          }
        }
      });
    });
  });
})()

// Button add to cart (in grid item)
theme.addCartButton = (function(){
  var buttonClass = '.js-grid-cart';
  $(document).on('click',buttonClass,function(){
    var $this = $(this);
    var id = $this.data('id');
    $this.addClass('is-loading');
    Shopify.addItem(id,1,function(item){
      var htmlVariant = item.variant_title !== null ? '<i>('+item.variant_title+')</i>' : '';
      var styleCart = $('.js-mini-cart').attr("data-cartmini");
        if(styleCart != 'true'){
          var htmlAlert = '<div class="media mt-2 alert--cart"><a class="mr-3" href="/cart"><img class="lazyload" data-src="'+item.image+'"></a><div class="media-body align-self-center"><p class="m-0 font-weight-bold">'+item.product_title+' x '+ item.quantity +'</p>'+htmlVariant+'<div><div>';
        }
      theme.miniCart.updateElements();
      theme.miniCart.generateCart();
      setTimeout(function() {
        styleCart != 'true' ? theme.alert.new(theme.strings.addToCartSuccess,htmlAlert,3000,'notice'): '';
        $this.removeClass('is-loading');
      }, 1000);
    });
  })
})()

// Multi currencies 
if (theme.enableCurrencies){
  // Can be 'money_format' or 'money_with_currency_format'
  Currency.format = 'money_format';
  var shopCurrency = Shopify.currency.active;
  var cookieCurrency = Currency.cookie.read();
  // Fix for customer account pages 
  jQuery('span.money span.money').each(function() {
    jQuery(this).parent('span.money').removeClass('money');
  });
  // Add precalculated shop currency to data attribute 
  jQuery('span.money').each(function() {
    jQuery(this).attr('data-currency-' + Shopify.currency.active, jQuery(this).html());
  });
  // Select all your currencies buttons.
  var buttons = jQuery('#currencies a'),
      currentCurrencies = jQuery('.pre-currencies');
  // When the page loads.
  if (cookieCurrency == null || cookieCurrency == shopCurrency) {
    Currency.currentCurrency = shopCurrency;
  }
  else {
    Currency.currentCurrency = cookieCurrency;
    Currency.convertAll(shopCurrency, cookieCurrency);
    buttons.removeClass('selected');
    jQuery('#currencies a[data-currency=' + cookieCurrency + ']').addClass('selected');
    var htmlCurrently = jQuery('#currencies a[data-currency=' + cookieCurrency + ']').html();
    currentCurrencies.html(htmlCurrently);
  }
  buttons.click(function() {
    buttons.removeClass('selected');
    jQuery(this).addClass('selected');
    var newCurrency =  jQuery(this).attr('data-currency');
    var htmlCurrently = jQuery(this).html();
    currentCurrencies.html(htmlCurrently);
    Currency.convertAll(Currency.currentCurrency, newCurrency);
  });
  // For product options.
  var original_selectCallback = window.selectCallback;
  var selectCallback = function(variant, selector) {
    original_selectCallback(variant, selector);
    Currency.convertAll(shopCurrency, jQuery('#currencies a.selected').attr('data-currency'));
  };
}
theme.updateCurrencies = function (){
  Currency.convertAll(shopCurrency, jQuery('#currencies a.selected').attr('data-currency'));
}

// MiniCart
theme.miniCart = (function(){
  var miniCart = '.js-mini-cart',
      styleCart = $(miniCart).attr("data-cartmini"),
      cartToggle = '.js-toggle-cart',
      cartCount = '.js-cart-count',
      cartContent = '.js-mini-cart-content',
      $cartBottom = $('.js-cart-bottom'),
      cartTotal = '.js-cart-total',
      $btnCheckout = $('.js-cart-btn-checkout'),
      numberDisplayed = 5,
      buttonHtml = '<a class="btn-theme w-100 mt-5" href='+theme.strings.cartCollection+'>'+theme.strings.cartEmptyButton+'</a>',
      emptyCartHTML = '<div class="alert mini-cart-empty"><div class="iconcart-empty">'+theme.strings.cartIcon+'</div><div class="txtcart-empty mt-4">'+theme.strings.cartEmpty+'</div>'+buttonHtml+'</div>';

  function updateElements(){
    Shopify.getCart(function(cart){
      
      if (cart.item_count === 0) {
        $(cartContent).html(emptyCartHTML);
        $btnCheckout.addClass('disabled');
        $cartBottom.addClass('hide');
        
      }else{
        $btnCheckout.removeClass('disabled');
        $cartBottom.removeClass('hide');
      }
      $(cartCount).text(cart.item_count);
      $(cartTotal).html(theme.Currency.formatMoney(cart.total_price, theme.moneyFormat));
      theme.freeShipping.load(cart);
      theme.updateCurrencies();
    })
  }
  function generateCart(){
    
    Shopify.getCart(function(cart){
        
      var htmlCart = cart.item_count === 0? emptyCartHTML:'',
          itemCount = cart.items.length,
          forLoop = itemCount < numberDisplayed ? itemCount : numberDisplayed;
          if (cart.item_count === 0) {	
            $cartBottom.addClass('hide');	
          }else{	
            $cartBottom.removeClass('hide');	
          }
          //styleCart === 'true' ? cart.items.length ? $(miniCart).addClass('active'): $(miniCart).removeClass('active') :null;

      // add list items
      for (var i = 0; i < forLoop; i++) { 
        var product = cart.items[i],
            productPrice = theme.Currency.formatMoney(product.price, theme.moneyFormat);
        htmlCart += '<div class="mini-cart-item">';
        htmlCart += '	<a class="mini-cart-image" href="'+ product.url +'">';
        htmlCart += '		<img src="'+ product.image +'"/>';
        htmlCart += '	</a>';
        htmlCart += '	<div class="mini-cart-meta">';
        htmlCart += '		<p ><a href="'+ product.url +'">'+ product.title +'</a></p>';
        htmlCart += '		<span> '+ productPrice +'</span><b> x '+product.quantity+'</b>';
        htmlCart += '	</div>';
        htmlCart += '	<button class="btn js-remove-mini-cart" data-id="'+product.id+'">&times;</button>';
        htmlCart += '</div>';
      }
      if (itemCount > numberDisplayed){
        htmlCart += '<a class="js-btn-viewmore" href="/cart">'+theme.strings.cartMore+'('+(itemCount - numberDisplayed)+')</a>'
      }
      // add total price and cart button / checkout button
      $(cartContent).html(htmlCart);
      $(cartTotal).html(theme.Currency.formatMoney(cart.total_price, theme.moneyFormat));
      theme.updateCurrencies();
    })
  }
  // 2. Button remove items
  $(document).on('click','.js-remove-mini-cart',function(){
    var itemId = $(this).data('id');
    var isOuterMiniCart = $(this).closest(miniCart).length === 0? true : false;  // check element from mini cart or not
    
    // hide items
    $(this).parent().fadeOut();
    
    //remove from cart
    Shopify.changeItem(itemId,0,updateElements);
    Shopify.getCart(function(cart){
      if (cart.items.length > numberDisplayed || isOuterMiniCart) {
        generateCart();
      }
    });
  });

  //Keep popup when click cart / UX
  $(document).on('click',cartToggle,function(){
    $(this).parent(miniCart).toggleClass('active');
  });
  $(document).on('click','.overlaycart',function(){
    $(this).parent(miniCart).removeClass('active');
  });

  // gen minicart when load page
  generateCart();
  return{
    updateElements:updateElements,
    generateCart: generateCart
  }
})()

// Free shipping
theme.freeShipping = (function(){
  var $freeShippingClass = $('.js-free-shipping'),
      $freeShippingTextClass = $('.js-free-shipping-text'),
      $free_fisrt = $freeShippingClass.attr('data-start'),
      $free_end = $freeShippingClass.attr('data-end')
      minOrderValue = parseInt($freeShippingClass.data('value')) || 0,
      $percentClass = $('.js-free-shipping .progress-bar');

  function generate(cart){
    var priceCart = cart.total_price;
    if (priceCart >= minOrderValue){
      $percentClass.css('width','100%').removeClass('progress-bar-striped bg-primary');
      $freeShippingTextClass.text(theme.strings.freeShipping)
    }else{
      let percent = priceCart / minOrderValue * 100;
      let left = Shopify.formatMoney((minOrderValue - priceCart),theme.moneyFormat);
      $percentClass.css('width',percent+'%').addClass('progress-bar-striped primary');
      $freeShippingTextClass.html($free_fisrt +' '+ left +' '+ $free_end);
      theme.updateCurrencies();
    }
  }

  Shopify.getCart(function(cart){
    generate(cart);
  });

  return {
    load:generate
  }
})()

// Shipping time - https://github.com/phstc/jquery-dateFormat
theme.shippingTime = (function(){
  var $shippingTime = $('.js-shipping-time'),
      shippingTime = $shippingTime.data('time') || '',
      now = new Date(),
      restHour = 23 - now.getHours(),
      restMinute = 59 - now.getMinutes();
  if (shippingTime !== ''){
    var nextTime = new Date(now.getTime() + shippingTime * 86400000),
        formatTime = $.format.date(nextTime, "ddd, dd MMMM yyyy"),
        htmlShipping = 'Order in the next <b>'+restHour+'</b> hours <b>'+restMinute+'</b> minutes to get it by <b>'+formatTime+'</b>. ';
    $shippingTime.html(htmlShipping);
  }
})()

// Infinite scroll - https://github.com/Elkfox/Ajaxinate/blob/master/dist/ajaxinate.min.js
theme.infiniteScroll = (function (){
  function initInfiniteScroll(){
    if ($('.AjaxinateLoop').length === 0){
      return;
    }else{
      var endlessScroll = new Ajaxinate({
        loadingText:'<div class="text-center"><div class="'+theme.loadingClass+'" role="status"></div></div>',
        callback:function(){
          theme.wishlist.load();
          theme.compare.load();
          theme.countdown.load();
          theme.priceRange.load();
          theme.tooltip.load();
          theme.collectionView.triggerView();
          theme.swatchCard2.load();
        }
      });
    }
  }
  
  // Infinite scroll in other page (blog, list-collection)
  function initOtherPages(){
    var otherPages = new Ajaxinate({
      loadingText:'<div class="text-center"><div class="'+theme.loadingClass+'" role="status"></div></div>',
      container: '.js-pagination-content',
      pagination: '.js-pagination'
    });
  }

  document.addEventListener("DOMContentLoaded", function(){
    initInfiniteScroll();
    initOtherPages();
  });

  return{
    load:initInfiniteScroll
  }
})()

// Scroll to fixed
theme.scrollToFixed = (function (){
  var window_width = $( window ).width();

    if (window_width < 768) {
      $(".js-stick-parent").trigger("sticky_kit:detach");
    } else {
      make_sticky();
    }
  	$( window ).resize(function() {

      window_width = $( window ).width();

      if (window_width < 768) {
        $(".js-stick-parent").trigger("sticky_kit:detach");
      } else {
        make_sticky();
      }
    });
  function make_sticky() {
      $('.js-stick-parent').stick_in_parent({recalc_every: 1});
    }
  
})()
// hover active menu vertical
theme.menuVerical = (function (){
  if($('.js-vertical-title').length){
    var $menuTitle = $('.js-vertical-title');
    var $menuVer = $('#verticalMenu');
    var window_width = $( window ).width();

      if (window_width < 768) {
        makeClick();
      } else {
        makeHover();
      }
      $( window ).resize(function() {
        if (window_width < 768) {
          makeClick();
        } else {
          makeHover();
        }
      });
    function makeHover() {
      $menuVer.hover(function(){
        $(this).addClass('active');
        }, function(){
          $(this).removeClass('active');
      });
      }
    function makeClick() {
          $menuTitle.click(function(){
            $(this).parent().toggleClass('active');
        });
      }
  }
  
})()

//filter 2.0
theme.updatePriceFilter = function (){
  if (typeof($("#slider-range").html()) != 'undefined' && typeof($("#slider-range-mobile").html()) != 'undefined'){
    var max_price = parseInt(Currency.convert(parseInt($("#slider-range").data('max')), shopCurrency, $('#currencies a.selected').attr('data-currency')));
    var min_price = parseInt(Currency.convert(0, shopCurrency, $('#currencies a.selected').attr('data-currency')));

    var current_min_price = min_price;
    if ($("#Filter-Price-GTE").val()) {
      current_min_price = parseInt(Currency.convert(parseInt($("#Filter-Price-GTE").val()), shopCurrency, $('#currencies a.selected').attr('data-currency')));
    }
    var current_max_price = max_price;
    if ($("#Filter-Price-LTE").val()) {
      current_max_price = parseInt(Currency.convert(parseInt($("#Filter-Price-LTE").val()), shopCurrency, $('#currencies a.selected').attr('data-currency')));
    }

    $("#slider-range").attr('data-max', max_price);
    $("#slider-range").slider({
      range: true,
      min: min_price,
      max: max_price,
      values: [current_min_price, current_max_price],
      slide: function( event, ui ) {
        var p1 = parseInt(Currency.convert(ui.values[0], $('#currencies a.selected').attr('data-currency'), shopCurrency));
        var p2 = parseInt(Currency.convert(ui.values[1], $('#currencies a.selected').attr('data-currency'), shopCurrency));

        $("#Filter-Price-GTE").val(p1);
        $("#Filter-Price-LTE").val(p2);


        $('.slider-range-content .price-from').html(Shopify.formatMoney(p1 * 100, theme.moneyFormat));
        $('.slider-range-content .price-to').html(Shopify.formatMoney(p2 * 100, theme.moneyFormat));

        theme.updateCurrencies();
      },
      stop: function( event, ui ) {
          var form = $("<form id='FacetFiltersForm'></form>");
          $('#FacetFiltersForm input').each(function(){
            form.append($(this));
          });

          var p1 = parseInt(Currency.convert(ui.values[0], $('#currencies a.selected').attr('data-currency'), shopCurrency))
          var p2 = parseInt(Currency.convert(ui.values[1], $('#currencies a.selected').attr('data-currency'), shopCurrency));

          $('.slider-range-content .price-from').html(Shopify.formatMoney(p1 * 100, theme.moneyFormat));
          $('.slider-range-content .price-to').html(Shopify.formatMoney(p2 * 100, theme.moneyFormat));

          theme.updateCurrencies();
          const formData = new FormData(form[0]);
          const searchParams = new URLSearchParams(formData).toString();
          document.querySelector('facet-filters-form').renderPage(searchParams, null, true);
      }
    });


    $("#slider-range-mobile").attr('data-max', max_price);
    $("#slider-range-mobile").slider({
      range: true,
      min: min_price,
      max: max_price,
      values: [current_min_price, current_max_price],
      slide: function( event, ui ) {
        var p1 = parseInt(Currency.convert(ui.values[0], $('#currencies a.selected').attr('data-currency'), shopCurrency));
        var p2 = parseInt(Currency.convert(ui.values[1], $('#currencies a.selected').attr('data-currency'), shopCurrency));

        $("#Filter-Price-GTE").val(p1);
        $("#Filter-Price-LTE").val(p2);


        $('.slider-range-content .price-from').html(Shopify.formatMoney(p1 * 100, theme.moneyFormat));
        $('.slider-range-content .price-to').html(Shopify.formatMoney(p2 * 100, theme.moneyFormat));
        theme.updateCurrencies();
      },
      stop: function( event, ui ) {
          var form = $("<form id='FacetFiltersForm'></form>");
          $('#FacetFiltersForm input').each(function(){
            form.append($(this));
          });

          var p1 = parseInt(Currency.convert(ui.values[0], $('#currencies a.selected').attr('data-currency'), shopCurrency))
          var p2 = parseInt(Currency.convert(ui.values[1], $('#currencies a.selected').attr('data-currency'), shopCurrency));

          $('.slider-range-content .price-from').html(Shopify.formatMoney(p1 * 100, theme.moneyFormat));
          $('.slider-range-content .price-to').html(Shopify.formatMoney(p2 * 100, theme.moneyFormat));
          theme.updateCurrencies();
          const formData = new FormData(form[0]);
          const searchParams = new URLSearchParams(formData).toString();
          document.querySelector('facet-filters-form').renderPage(searchParams, null, true);
      }
    });
  }
}
$( document ).ready(function() {
  theme.updatePriceFilter();
});

theme.headersidebar = (function(){
  $('#dismiss, .overlaysidebar').on('click', function () {
    // hide sidebar
    $('#sidebar').removeClass('active');
    // hide overlay
    $('.overlaysidebar').removeClass('active');
  });
  
  $('#sidebarCollapse').on('click', function () {
    // open sidebar
    $('#sidebar').addClass('active');
    // fade in the overlay
    $('.overlaysidebar').addClass('active');
    $('.collapse.in').toggleClass('in');
    $('a[aria-expanded=true]').attr('aria-expanded', 'false');
  });
})()

// Wishlist
theme.wishlist = (function (){
  var wishlistButtonClass = '.js-btn-wishlist',
      wishlistRemoveButtonClass = '.js-remove-wishlist',
      $wishlistCount = $('.js-wishlist-count'),
      $wishlistContainer = $('.js-wishlist-content'),
      wishlistObject = JSON.parse(localStorage.getItem('localWishlist')) || [],
      wishlistPageUrl = $('.js-wishlist-link').attr('href'),
      loadNoResult = function (){
        $wishlistContainer.html('<div class="col text-center"><div class="alert alert-warning d-inline-block">'+ theme.strings.wishlistNoResult + '</div></div>');
      };

  function updateWishlist(self) {
    var productHandle = $(self).data('handle'),
        allSimilarProduct = $(wishlistButtonClass+'[data-handle="'+productHandle+'"]');
    var isAdded = $.inArray(productHandle,wishlistObject) !== -1 ? true:false;
    if (isAdded) {
      // go to wishlist page
      window.location.href = wishlistPageUrl;
    }else{
      wishlistObject.push(productHandle);
      allSimilarProduct.fadeOut('slow').fadeIn('fast').html(theme.strings.wishlistIconAdded + theme.strings.wishlistTextAdded);
      //change tooltip
      allSimilarProduct.attr('data-original-title',theme.strings.wishlistTextAdded); 
      $('.tooltip-inner').text(theme.strings.wishlistTextAdded);
    }
    localStorage.setItem('localWishlist', JSON.stringify(wishlistObject)); 
    $wishlistCount.text(wishlistObject.length);
  };
  function loadWishlist(){
    $wishlistContainer.html('');
    //page wishlist
    if (wishlistObject.length > 0){
      for (var i = 0; i < wishlistObject.length; i++) { 
        var productHandle = wishlistObject[i];
        Shopify.getProduct(productHandle,function(product){
          var htmlProduct = '';
          var productPrice = product.price_varies? 'from ' + theme.Currency.formatMoney(product.price_min, theme.moneyFormat) : theme.Currency.formatMoney(product.price, theme.moneyFormat);
          var productComparePrice = product.compare_at_price_min !== 0? theme.Currency.formatMoney(product.compare_at_price_min, theme.moneyFormat) : '';
          htmlProduct += '<div class="js-wishlist-item col-md-4 col-sm-6 col-xs-6 col-12 mb-4">';
          htmlProduct += '<div class="js-wishlist-itembox">';
          htmlProduct += '<div class=" d-flex flex-row p-4">';
          htmlProduct += '	<a class="d-inline-block mr-4 " href="'+ product.url +'">';
          htmlProduct += '		<img src="'+ product.featured_image +'"/>';
          htmlProduct += '	</a>';
          htmlProduct += '	<div><a href="'+ product.url +'" class="title-prouct d-block h5 text-body" >'+ product.title +'</a>';
          htmlProduct += '	<span> '+ productPrice +'</span>';
          htmlProduct += '	 <s>'+ productComparePrice +'</s></div>';
          htmlProduct += '<button class="btn js-remove-wishlist" data-handle="'+product.handle+'">'+ theme.strings.wishlistRemove +'</button>';
          htmlProduct += '</div>';
          htmlProduct += '</div>';
          htmlProduct += '</div>';
          $wishlistContainer.append(htmlProduct); 
          theme.updateCurrencies();
        });
      }
    }else{
      loadNoResult();
    }

    //count items
    $wishlistCount.text(wishlistObject.length);

    //button text
    $(wishlistButtonClass).each(function(){
      var productHandle = $(this).data('handle');
      var iconWishlist = $.inArray(productHandle,wishlistObject) !== -1 ? theme.strings.wishlistIconAdded : theme.strings.wishlistIcon;
      var textWishlist = $.inArray(productHandle,wishlistObject) !== -1 ? theme.strings.wishlistTextAdded : theme.strings.wishlistText;
      $(this).html(iconWishlist+textWishlist).attr('title',textWishlist);
    });
  }
  
  $(document).on('click',wishlistButtonClass,function (event) {
    event.preventDefault();
    updateWishlist(this);
  });
  $(document).on('click',wishlistRemoveButtonClass,function(){
    var productHandle = $(this).data('handle'),
    allSimilarProduct = $(wishlistButtonClass+'[data-handle="'+productHandle+'"]');
    
    //update button
    allSimilarProduct.html(theme.strings.wishlistIcon + theme.strings.wishlistText);
     //update tooltip
    allSimilarProduct.attr('data-original-title',theme.strings.wishlistText);
    $('.tooltip-inner').text(theme.strings.wishlistText);
    //update Object
    wishlistObject.splice(wishlistObject.indexOf(productHandle), 1);
    localStorage.setItem('localWishlist', JSON.stringify(wishlistObject)); 
    // Remove element
    $(this).closest('.js-wishlist-item').fadeOut(); // or .remove()
    //count
    $wishlistCount.text(wishlistObject.length);
    if (wishlistObject.length === 0) {
      loadNoResult();
    }
  });

  loadWishlist();
  $(document).on('shopify:section:load', loadWishlist);
  return{
    load:loadWishlist
  }
})()

// Compare
theme.compare = (function (){
  var compareButtonClass = '.js-btn-compare',
      compareRemoveButtonClass = '.js-remove-compare',
      $compareCount = $('.js-compare-count'),
      $compareContainer = $('.js-compare-content'),
      compareObject = JSON.parse(localStorage.getItem('localCompare')) || [],
      alertClass='notice';
  function updateCompare(self) {
    var productHandle = $(self).data('handle'),
        alertText = '';
    var isAdded = $.inArray(productHandle,compareObject) !== -1 ? true:false;
    if (isAdded) {
      compareObject.splice(compareObject.indexOf(productHandle), 1);
      alertText = theme.strings.compareNotifyRemoved;
      alertClass = 'notice';
    }else{
      if (compareObject.length === 4){
        alertText = theme.strings.compareNotifyMaximum;
        alertClass = 'error';
      }else{
        alertClass = 'notice';
        compareObject.push(productHandle);
        alertText = theme.strings.compareNotifyAdded;
      }
    }
    localStorage.setItem('localCompare', JSON.stringify(compareObject)); 
    theme.alert.new(theme.strings.compareText,alertText,2000,alertClass);
    $compareCount.text(compareObject.length);
  };
  function loadCompare(){
    var compareGrid;
    $compareContainer.html('');
    //popup compare
    if (compareObject.length > 0){
      compareGrid = compareObject.length === 1? 'col-md-6 col-sm-6' : 'col';
      for (var i = 0; i < compareObject.length; i++) { 
        var productHandle = compareObject[i];
        Shopify.getProduct(productHandle,function(product){
          var htmlProduct = '',
              productPrice = product.price_varies? 'from ' + theme.Currency.formatMoney(product.price_min, theme.moneyFormat) : theme.Currency.formatMoney(product.price, theme.moneyFormat),
              productComparePrice = product.compare_at_price_min !== 0 ? theme.Currency.formatMoney(product.compare_at_price_min, theme.moneyFormat) : '',
              productAvailable = product.available ? theme.strings.available : theme.strings.unavailable,
              productAvailableClass = product.available ? 'alert-success' : 'alert-danger',
              productTypeHTML = product.type !== "" ? '<a href="/collections/types?q='+ product.type +'">'+ product.type +'</a>' : '<span>'+ theme.strings.none +'</span>',
              productVendorHTML = product.vendor !== "" ? '<a href="/collections/vendors?q='+ product.vendor +'">'+ product.vendor +'</a>' : '<span>'+ theme.strings.none +'</span>';
          htmlProduct += '<div class="compare-item '+compareGrid+' col-xs-6">';
          htmlProduct += '	<a href="'+ product.url +'">';
          htmlProduct += '		<img src="'+ Shopify.resizeImage(product.featured_image,'x300') +'"/>';
          htmlProduct += '	</a>';
          htmlProduct += '	<hr /><h5 >'+ product.title +'</h5>';
          htmlProduct += '	<hr /><s>'+ productComparePrice +'</s>';
          htmlProduct += '	<span> '+ productPrice +'</span>';
          htmlProduct += '	<hr /><span class='+ productAvailableClass +'> '+ productAvailable +'</span>';
          htmlProduct += '	<hr />'+ productTypeHTML;
          htmlProduct += '	<hr />'+ productVendorHTML;
          htmlProduct += '  <hr /><button class="btn js-remove-compare btn-theme gradient-theme" data-handle="'+product.handle+'">'+ theme.strings.compareRemove +'</button>';
          htmlProduct += '</div>';
          $compareContainer.append(htmlProduct);
          theme.updateCurrencies();
        });
      }
    }else{
      $compareContainer.html('<div class="alert alert-warning d-inline-block">'+ theme.strings.compareNoResult + '</div>');
    }
    
    //button text
    $(compareButtonClass).each(function(){
      var productHandle = $(this).data('handle');
      var status = $.inArray(productHandle,compareObject) !== -1 ? 'added' : '';
      $(this).removeClass('added').addClass(status);
    });

    //count items
    $compareCount.text(compareObject.length);
  }
  $(document).on('click',compareButtonClass,function (event) {
    event.preventDefault();
    updateCompare(this);
    loadCompare();
  });
  $(document).on('click',compareRemoveButtonClass,function(){
    var productHandle = $(this).data('handle');
    compareObject.splice(compareObject.indexOf(productHandle), 1);
    localStorage.setItem('localCompare', JSON.stringify(compareObject)); 
    loadCompare();
  });

  loadCompare();
  $(document).on('shopify:section:load', loadCompare);
  return{
    load:loadCompare
  }
})()

// Popup newsletter
theme.popupNewletter = (function(){
  var $popupNewsletter = $('#jsPopupNewsletter'),
      $newsletterForm = $('#jsPopupNewsletter form'),
      date = new Date(),
      minutes = theme.timePopupNewsletter;
      minutesdelay = $popupNewsletter.attr('data-delay');
  if ($popupNewsletter.length === 1){
    date.setTime(date.getTime() + (minutes * 60 * 1000));
    var setCookies = function (){
      $.cookie('cookiesNewsletter', 'disabled', { expires: date, path: '/' } );
    };
    if ($.cookie('cookiesNewsletter') !== "disabled") {
      $(window).on('load',function(){
        setTimeout(function () {
          $popupNewsletter.modal('show');
        }, minutesdelay * 1000);
      });
      $popupNewsletter.on('hidden.bs.modal', setCookies);
      $newsletterForm.submit(setCookies);     
    }
  }
})()

// Cookie policy
theme.cookie = (function(){
  var $policy = $('.js-cookie-policy'),
      $closeButton = $('.js-btn-ok'),
      isOk = localStorage.getItem('localCookie') || '';
  if (isOk === ''){
    $policy.fadeIn('slow');
  }
  $closeButton.on('click',function(){
    localStorage.setItem('localCookie', 'accept');
    $policy.fadeOut('slow');
  })
})()

// Announcement Bar
theme.announcement = (function(){
  var $bar = $('.js-announcement-bar'),
      $closeButton = $('.js-ab-close'),
      isClosed = localStorage.getItem('localAnnouncement') || '';
  if (isClosed === ''){
    $bar.fadeIn();
    $bar.closest('.body-theme').addClass('body-announcement-bar');
  }
  $closeButton.on('click',function(){
    localStorage.setItem('localAnnouncement', 'closed');
    $bar.slideUp();
    $bar.closest('.body-theme').removeClass('body-announcement-bar');
  })
})()

// Open external link in new tab
theme.exLink = (function(){
  var links = document.links;
  for (let i = 0, linksLength = links.length ; i < linksLength ; i++) {
    if (links[i].hostname !== window.location.hostname && $(links[i]).attr('href') !== 'javascript:void(0)') {
      links[i].target = '_blank';
    }
  }
})()

// Deal- countdown
theme.countdown = (function(){
  function initCountdown(){
    $(".js-countdown").each(function() {
      var endTime = $(this).data('time'),
          htmlLayout = "<ul class='list--inline'><li class='gradient-theme-vertical'><span class='countdown-time'>%%D%%</span><span class='countdown-text'>Days</span></li><li class='gradient-theme-vertical'><span class='countdown-time'>%%H%%</span><span class='countdown-text'>Hours</span></li><li class='gradient-theme-vertical'><span class='countdown-time'>%%M%%</span><span class='countdown-text'>Mins</span></li><li class='gradient-theme-vertical'><span class='countdown-time'>%%S%%</span><span class='countdown-text'>Secs</span></li></ul>";
      $(this).lofCountDown({
        TargetDate:endTime,
        DisplayFormat:htmlLayout,
        FinishMessage: '<span class="alert alert-warning d-inline-block">'+ theme.strings.countdownEndText +'</span>'
      });
    });
  }
  initCountdown();
  return{
    load:initCountdown
  }
})()

// Price range - Collection page
theme.priceRange =  (function (){
  function initPriceRange(){
    var min=0,
        max=0,
        slideRange = '#js-slider-range',
        productCard = '.js-product-card',
        slideRangeWrap = '.slider-range-wr',
        rangeMin = '.js-range-min',
        rangeMax = '.js-range-max',
        enablePriceRange = $('#js-slider-range').length === 1? true : false;

    if (enablePriceRange){
      $(productCard).each(function(){      
        if(eval($(this).data('price'))>max) max = eval($(this).data('price'));
        if(min==0) min = eval($(this).data('price')); else if(eval($(this).data('price'))<min) min =  eval($(this).data('price'));      
      });

      if (min === max){
        $(slideRangeWrap).fadeOut();
      }else{
        $(slideRangeWrap).fadeIn();
      }

      $(slideRange).slider({
        range: true,
        min: min,
        max: max,
        values: [ min, max ],
        slide: function(event,ui){
          var price1 = (Shopify.formatMoney(ui.values[0], theme.moneyFormat));
          var price2 = (Shopify.formatMoney(ui.values[1], theme.moneyFormat));
          $(rangeMin).html(price1);
          $(rangeMax).html(price2);
          theme.updateCurrencies();

          // Show/Hide product when dragging
          $(productCard).each(function() {
            if(eval($(this).data('price'))>= ui.values[0] && eval($(this).data('price'))<=ui.values[1]){
              $(this).parent().fadeIn();
            }else{
              $(this).parent().fadeOut();
            }
          });
        }
      });

      var price1 = (Shopify.formatMoney(min, theme.moneyFormat));
      var price2 = (Shopify.formatMoney(max, theme.moneyFormat));
      $(rangeMin).html(price1);
      $(rangeMax).html(price2);	  
      theme.updateCurrencies();

    }
  }
  initPriceRange();
  return{
    load:initPriceRange
  }
})()

// Collection view - Collection page
theme.collectionView =  (function (){
  var btnView = '.js-btn-view',
      btnViewActive = '.js-btn-view.active';

  $(document).on('click',btnView,function(){
    var value = $(this).data('col'),
        $gridItemCol = $('.js-col');

    $(btnView).removeClass('active');
    $(this).addClass('active');

    $gridItemCol.removeClass().addClass('js-col col-sm-6 col-6');
    if (value === 3){
      $gridItemCol.addClass('col-lg-4');
    }else if(value === 4){
      $gridItemCol.addClass('col-lg-3');
    }else if(value === 5){
      $gridItemCol.addClass('col-lg-2-4');
    }else if(value === 6){
      $gridItemCol.addClass('col-lg-2');
    };
  })

  function triggerCollectionView(){
    $(btnViewActive).trigger('click');
  }

  return {
    triggerView:triggerCollectionView
  }
})()

// Swath variant in card item
theme.swatchCard = (function(){
  $(document).on('click','.js-swatch-card-item',function(){//click or mouseover
    $(".js-swatch-card-item").removeClass("active");
    $(this).addClass("active");   
    var newImage = $(this).data('image');
    var id = $(this).data('id');
    var gridItem = $(this).closest('.js-product-card');
    gridItem.find('.product-card__image').find('img').attr('srcset',newImage);
    gridItem.find('.js-grid-cart').data('id',id).attr('data-id',id);
  });
})()

theme.swatchCard2 = (function(){
  function initVariant(id){
    var productJson = JSON.parse($('.customJson-' + id).html());
    var $selectorForm = $('.customform-' + id);
    var $button = $('.js-customform-addtocart-' + id);
    var $buttontext = $button.find('span');
    var $wrapObject = $selectorForm.closest('.js-product-card');
    var options = {
      $container: $selectorForm,
      enableHistoryState: false,
      product: productJson,
      singleOptionSelector: '.single-option-selector-' + id,
      originalSelectorId: '#ProductSelect-' + id
    };
    var variants = new slate.Variants(options);
    var AjaxCart = new window.AjaxCart($selectorForm);
    var _updateButton = function (evt){
      var variant = evt.variant;
      if (variant === undefined){
        $button.prop('disabled', true).removeClass('btn--sold-out');
        $buttontext.html(theme.strings.unavailable);
      }else{
        if (variant.available){
          $button.removeClass('btn--sold-out').prop('disabled', false);
          $buttontext.html(theme.strings.addToCart);
        }else{
          $button.prop('disabled', true).addClass('btn--sold-out');
          $buttontext.html(theme.strings.soldOut);
        }
      }
    }
    var _updateImage = function (evt){
      var variant = evt.variant;
      var $mainImage = $wrapObject.find('.product-card__image').find('img');
      if (variant !== undefined && variant.featured_image !== null){
        var variantImage = variant.featured_image;
        $mainImage.attr('srcset',variantImage.src);
      }
    }
    var _updatePrice = function (evt){
      var $price = $wrapObject.find('.product-card__price');
      var variant = evt.variant;
      if (variant !== undefined){
        var htmlComparePrice = variant.compare_at_price !== null ? '<s class="product-card__regular-price"><span class="money">'+variant.compare_at_price+'</span></s>' : '';
        var htmlPrice = '<span class="money">'+variant.price+'</span>' + htmlComparePrice ;
        $price.html(htmlPrice);
        theme.updateCurrencies();
      }
    }
    variants.$container.on(
      'variantChange' , _updateButton
    );
    variants.$container.on(
      'variantChange' , _updateImage
    );
    variants.$container.on(
      'variantChange' , _updatePrice
    );
  }
  function initForm(){
    $('.js-customform').each(function(){
      var id = $(this).data('id');
      initVariant(id);
    })
  }

  initForm();
  return{
    load:initForm
  }
})()

// Loading
theme.loading = (function(){
  var $loading = $('#js-loading'),
      hasLoading = $('#js-loading').length === 0? false : true;
  if (hasLoading){
    $(window).load(function () {
      $loading.fadeOut();
    });  
  }
})()

theme.effectLeavingPage = (function(){
  window.onbeforeunload = function(){
    $('body').css('opacity','0');
  }
})()

// Isotope
theme.isotope = (function(){
  var enableIsotope = $('.enable-isotope').length === 1 ? true : false,
      $grid = $('.js-grid'),
      filter = '.js-filter-isotope';

  function initIsotope(){
    if (enableIsotope){
      $grid.isotope({
        itemSelector: '.grid-item',
        percentPosition: true
      })
      $(document).on('click',filter,function(){
        var filterValue = $(this).data('filter') === '*'? $(this).data('filter') : '.' + $(this).data('filter');
        $(filter).removeClass('active');
        $(this).addClass('active');
        $grid.isotope({ 
          filter: filterValue 
        });
      });
      $(window).scroll(function() {
        $grid.isotope('layout');
      });
      $(window).load(function () {
        $grid.isotope('layout');
        $(filter).first().trigger('click');
      });
    }
  }
  initIsotope();
})()

//aos



// theme.Wow = (function(){
//   new WOW().init();
// })()




// Masonry
theme.Masonry = (function(){
  function Masonry(container) {
    this.$container = $(container).on('init', this._a11y.bind(this));
    var $masonry = this.$container;
    $masonry.isotope({
      initLayout: true,
      itemSelector: '.grid-item',
      layoutMode: 'masonry',
      percentPosition: true,
      transitionDuration: 0,
      masonry: {
        columnWidth: '.grid-sizer'
      }
    });
    $(window).load(function () {
      $masonry.isotope('layout').css('opacity','1');
    });
    $(window).scroll(function() {
      $masonry.isotope('layout').css('opacity','1');
    });
  }

  Masonry.prototype = _.assignIn({}, Masonry.prototype, {
    _a11y: function(event, obj) {
      var $list = obj.$list;
      var $wrapper = this.$container.parent();

      // Remove default Slick aria-live attr until slider is focused
      $list.removeAttr('aria-live');

      // When an element in the slider is focused set aria-live
      $wrapper.on('focusin', function(evt) {
        if ($wrapper.has(evt.target).length) {
          $list.attr('aria-live', 'polite');
        }
      });

      // Remove aria-live
      $wrapper.on('focusout', function(evt) {
        if ($wrapper.has(evt.target).length) {
          $list.removeAttr('aria-live');
        }
      });
    }
  });

  return Masonry;
})();



// Cross-selling
theme.crosssell = (function(){
  var crosssellClass = '.js-crosssell',
      handles = $(crosssellClass).data('handles') || '',
      arrayHandle = handles.split(','),
      $blockCrosssell = $('.block-cross-sell'),
      variantSelectClass = '.js-cross-select',
      crossImageClass = '.cross-item-image',
      crossPriceClass = '.cross-item-money';  
  function generateCrosssell(){
    for (var i = 0; i < arrayHandle.length; i++) {
      var productHandle = arrayHandle[i];
      Shopify.getProduct(productHandle,function(product){
        var htmlCross = '',
            htmlOption = '',
            firstAvailableVariant = '',
            variantCount = product.variants.length;

        // generate select box and check first avaiable variant
        for (var j = 0; j < variantCount; j++){
          var variant = product.variants[j],
              variantImage = variant.featured_image === null? product.featured_image : variant.featured_image.src,
              disabled = variant.available ? '' : 'disabled';
          htmlOption += '<option '+disabled+' data-id="'+variant.id+'" data-price="'+variant.price+'" data-image="'+variantImage+'">'+variant.title+'</option>';
          if (firstAvailableVariant === '' && variant.available ){
            firstAvailableVariant = variant
          }
        }
        var productPrice = theme.Currency.formatMoney(firstAvailableVariant.price, theme.moneyFormat),
            productImage = firstAvailableVariant.featured_image === null? product.featured_image:firstAvailableVariant.featured_image.src,
            selectHide = variantCount === 1 ? 'hide' : '';

        // generate HTML
        htmlCross +='<div class="col cross-item '+product.handle+'">';
        htmlCross +='	<a class="cross-item-image" href="'+product.url+'" title="'+product.title+'"><img src="'+productImage+'" />'+theme.strings.cartIcon+'</a>';
        htmlCross +='	<a target="_blank" href="'+product.url+'" title="'+product.title+'" class="cross-item-title">'+product.title+'</a>';
        htmlCross +='	<span class="cross-item-money">'+productPrice+'</span>';
        htmlCross +='	<select class="js-cross-select '+selectHide+'" data-image="'+productImage+'" data-price="'+firstAvailableVariant.price+'" data-item="'+firstAvailableVariant.id+'">'+htmlOption+'</select>';
        htmlCross +='</div>';
        $(crosssellClass).append(htmlCross);
        theme.updateCurrencies();
      });
    }
  }
  
  function showPopupCrosssell(lineItem){
    //generate lineitem;
    var htmlLineItem = '';
    htmlLineItem += '<span class="alert alert-success d-inline-block mb-2">'+ theme.strings.addToCartSuccess +'</span>';
    htmlLineItem += '<div><img src="'+lineItem.image+'" alt="Added Product"></div>';
    htmlLineItem += '<h4 class="cross-item-title">'+lineItem.title+'</h4>';
    htmlLineItem += '<div class="mb-2">'+theme.strings.cartQuantity+': '+lineItem.quantity+'</div>';
    $('.js-cross-added').hide().html(htmlLineItem).fadeIn();

    // show popup
    var $popupCrosssell = $('#jsCrosssell');
    $popupCrosssell.modal('show');
  }

  if (handles !== '') {
    $(document).on('click',crossImageClass,function(event){
      event.preventDefault();
      var parent = $(this).closest('.cross-item'),
          itemId = parent.find(variantSelectClass).attr('data-item');
      Shopify.addItem(itemId,1,function(lineItem){
        theme.miniCart.updateElements();
        theme.miniCart.generateCart();
        showPopupCrosssell(lineItem);
      });
    });
    $(document).on('change',variantSelectClass,function(){
      var selectVariant = $(this).children(':selected'),
          selectVariantId = selectVariant.data('id'),
          parent = $(this).parent(),
          newPrice = theme.Currency.formatMoney(selectVariant.data('price'), theme.moneyFormat);

      if (selectVariant.data('image') !== ''){
        parent.find(crossImageClass).find('img').attr('src',selectVariant.data('image'));
      }
      $(this).attr('data-item',selectVariantId);
      parent.find(crossPriceClass).html(newPrice);
      theme.updateCurrencies();
    });
    $(document).on('shopify:section:load', generateCrosssell);
    generateCrosssell();
    $blockCrosssell.removeClass('hide');
  }
  return{
    showPopup:showPopupCrosssell
  }
})()

// Upsell
theme.upsell = (function(){
  var popupUpsell = '#jsUpsell',
      $button = $('#jsUpsell .btn'),
      productUpsellId = $('#jsUpsell').data('id') || '',
      buttonAcceptClass = 'js-btn-accept',
      delayTime = $('#jsUpsell').data('delay') || 3000,
      isUpsell = $(popupUpsell).length === 1? true:false;
  if (isUpsell){
    $(document).ready(function() {
      setTimeout(function() {
        $(popupUpsell).modal('show');
      }, delayTime);
    });
    $button.on('click',function(){
      if($(this).hasClass(buttonAcceptClass)){
        Shopify.addItem(productUpsellId,1,function(item){
          theme.miniCart.updateElements();
          theme.miniCart.generateCart();
          var htmlVariant = item.variant_title !== null ? '<i>('+item.variant_title+')</i>' : '';
          var htmlAlert = '<div class="media mt-2 alert--cart"><a class="mr-3" href="/cart"><img class="lazyload" data-src="'+item.image+'"></a><div class="media-body align-self-center"><p class="m-0 font-weight-bold">'+item.product_title+' x '+ item.quantity +'</p>'+htmlVariant+'<div><div>';
          theme.alert.new(theme.strings.addToCartSuccess,htmlAlert,3000,'notice');
        })
      }
      $(popupUpsell).modal('hide');
    })
  }
})()

// Coupon
theme.coupon = (function(){
  var popupCoupon = '#jsCoupon',
      $button = $('#jsCoupon .js-btn-coupon'),
      delayTime = $('#jsCoupon').data('delay') || 3000,
      isCoupon = $(popupCoupon).length === 1? true:false,
      isCopied = localStorage.getItem('localCoupon') || '';
  if (isCoupon && isCopied === ''){
    $(document).ready(function() {
      setTimeout(function() {
        $(popupCoupon).modal('show');
      }, delayTime);
    });
    $button.on('click',function(){
      var copyText = document.getElementById("coupon_code");
      copyText.select();
      document.execCommand("Copy");
      $(popupCoupon).modal('hide');
      theme.alert.new('Coupon code','Successfully copied, now you can paste code at checkout',4000);
      localStorage.setItem('localCoupon', 'copied');
    })
  }
})()

// Overwrite Shopify.onError in Shopify API
Shopify.onError = function(t, r) {
    var e = eval("(" + t.responseText + ")");
    var mess = e.message ? e.message + "(" + e.status + "): " + e.description : "Error : " + Shopify.fullMessagesFromErrors(e).join("; ") + "."
    theme.alert.new('Alert',mess,3000,'warning');
}

// Megamenu width
theme.fixWidthMegamenu = (function(){
  var $megamenuClass = $('.site-nav__item-mega'),
      megaDropdownClass = '.meganav';
  $megamenuClass.each(function(){
    var widthMenu = $(this).data('width') || 0;
    if (widthMenu !== 0){
      $(this).find(megaDropdownClass).css({'width':widthMenu+'px','margin-left':'-'+widthMenu/2+'px'});
    }
  });
})()

// Product video
theme.productVideo = (function(){
  var playButtonClass = '.js-play-button';
  $(document).on('click',playButtonClass,function(){
    let videoSelector = $(this).next(),
        videoObject = videoSelector.get(0);
    $(this).toggleClass('active');
    videoSelector.toggleClass('active');
    videoObject.paused ? videoObject.play() : videoObject.pause();
  })
})()

// Fake-viewers
theme.fakeViewer = (function(){
  var $fakeViewClass = $('.js-fake-view'),
      minValue = $fakeViewClass.data('min'),
      maxValue = $fakeViewClass.data('max'),
      duration = $fakeViewClass.data('duration');
  function randomInRange(start,end){
    var value = Math.floor(Math.random() * (end - start + 1) + start);
    $fakeViewClass.text(value);
  }

  if (minValue !== undefined && maxValue !== undefined){
    randomInRange(minValue,maxValue);
    setInterval(function() {
      randomInRange(minValue,maxValue);
    },duration);
  }

})();

// Product-suggest
theme.productSuggest = (function(){
  var $productSuggestClass = $('.product-notification'),
      $closeButtonClass = $('.close-notifi'),
      duration = $productSuggestClass.data('time') || 0,
      productSuggestCookie = 'cookieSuggest';

  function SomeonePurchased() {
    if ($.cookie(productSuggestCookie) == 'closed') {
      $productSuggestClass.remove();
    }
    $closeButtonClass.on('click',function(){
      $productSuggestClass.remove();
      $.cookie(productSuggestCookie, 'closed', {expires:1, path:'/'});
    });  
    function toggleSomething() {
      if($productSuggestClass.hasClass('active')){
        $productSuggestClass.removeClass('active')
      }
      else{
        var arrayProducts = $('.data-product'),
            randomProduct = Math.floor(Math.random() * arrayProducts.length),
            Object = $(arrayProducts[randomProduct]);

        $productSuggestClass.addClass('active');
        $productSuggestClass.find('.product-image').attr('href', Object.data('url')).find('img').attr('src', Object.data('image'));
        $productSuggestClass.find('.product-name').text(Object.data('title')).attr('href', Object.data('url'));
        $productSuggestClass.find('.time-ago').text(Object.data('time'));
        $productSuggestClass.find('.from-ago').text(Object.data('local'));
      }
    }

    if (duration !== 0){
      setInterval(toggleSomething, duration);
    }
  }
  SomeonePurchased();
})()


// Stickyheader
theme.stickyHeader = (function(){
  var stickHeaderClass = '.site-header--sticky';
  if ($(stickHeaderClass).length !== 0){
    $(window).scroll(function() {
      if (window.pageYOffset >= 20) {
        $(stickHeaderClass).addClass('active');
      } else {
        $(stickHeaderClass).removeClass('active');
      }
    });
  }
})()

theme.PhotoSwipe = (function(){
  var initPhotoSwipeFromDOM = function(gallerySelector) {

    // parse slide data (url, title, size ...) from DOM elements 
    // (children of gallerySelector)
    var parseThumbnailElements = function(el) {
        var thumbElements = el.childNodes,
            numNodes = thumbElements.length,
            items = [],
            figureEl,
            linkEl,
            size,
            item;

        for(var i = 0; i < numNodes; i++) {

            figureEl = thumbElements[i]; // <figure> element

            // include only element nodes 
            if(figureEl.nodeType !== 1) {
                continue;
            }

            linkEl = figureEl.children[0]; // <a> element

            size = linkEl.getAttribute('data-size').split('x');

            // create slide object
            item = {
                src: linkEl.getAttribute('href'),
                w: parseInt(size[0], 10),
                h: parseInt(size[1], 10)
            };



            if(figureEl.children.length > 1) {
                // <figcaption> content
                item.title = figureEl.children[1].innerHTML; 
            }

            if(linkEl.children.length > 0) {
                // <img> thumbnail element, retrieving thumbnail url
                item.msrc = linkEl.children[0].getAttribute('src');
            } 

            item.el = figureEl; // save link to element for getThumbBoundsFn
            items.push(item);
        }

        return items;
    };

    // find nearest parent element
    var closest = function closest(el, fn) {
        return el && ( fn(el) ? el : closest(el.parentNode, fn) );
    };

    // triggers when user clicks on thumbnail
    var onThumbnailsClick = function(e) {
        e = e || window.event;
        e.preventDefault ? e.preventDefault() : e.returnValue = false;

        var eTarget = e.target || e.srcElement;

        // find root element of slide
        var clickedListItem = closest(eTarget, function(el) {
            return (el.tagName && el.tagName.toUpperCase() === 'FIGURE');
        });

        if(!clickedListItem) {
            return;
        }

        // find index of clicked item by looping through all child nodes
        // alternatively, you may define index via data- attribute
        var clickedGallery = clickedListItem.parentNode,
            childNodes = clickedListItem.parentNode.childNodes,
            numChildNodes = childNodes.length,
            nodeIndex = 0,
            index;

        for (var i = 0; i < numChildNodes; i++) {
            if(childNodes[i].nodeType !== 1) { 
                continue; 
            }

            if(childNodes[i] === clickedListItem) {
                index = nodeIndex;
                break;
            }
            nodeIndex++;
        }



        if(index >= 0) {
            // open PhotoSwipe if valid index found
            openPhotoSwipe( index, clickedGallery );
        }
        return false;
    };

    // parse picture index and gallery index from URL (#&pid=1&gid=2)
    var photoswipeParseHash = function() {
        var hash = window.location.hash.substring(1),
        params = {};

        if(hash.length < 5) {
            return params;
        }

        var vars = hash.split('&');
        for (var i = 0; i < vars.length; i++) {
            if(!vars[i]) {
                continue;
            }
            var pair = vars[i].split('=');  
            if(pair.length < 2) {
                continue;
            }           
            params[pair[0]] = pair[1];
        }

        if(params.gid) {
            params.gid = parseInt(params.gid, 10);
        }

        return params;
    };

    var openPhotoSwipe = function(index, galleryElement, disableAnimation, fromURL) {
        var pswpElement = document.querySelectorAll('.pswp')[0],
            gallery,
            options,
            items;

        items = parseThumbnailElements(galleryElement);

        // define options (if needed)
        options = {
          maxSpreadZoom: 1,
          bgOpacity: 0.7,
          zoomEl: true,
          history:false,
          zoomEl: false,
          pinchToClose: false,
          closeOnScroll:false,
            // define gallery index (for URL)
            galleryUID: galleryElement.getAttribute('data-pswp-uid'),

        };

        // PhotoSwipe opened from URL
        if(fromURL) {
            if(options.galleryPIDs) {
                // parse real index when custom PIDs are used 
                // http://photoswipe.com/documentation/faq.html#custom-pid-in-url
                for(var j = 0; j < items.length; j++) {
                    if(items[j].pid == index) {
                        options.index = j;
                        break;
                    }
                }
            } else {
                // in URL indexes start from 1
                options.index = parseInt(index, 10) - 1;
            }
        } else {
            options.index = parseInt(index, 10);
        }

        // exit if index not found
        if( isNaN(options.index) ) {
            return;
        }

        if(disableAnimation) {
            options.showAnimationDuration = 0;
        }

        // Pass data to PhotoSwipe and initialize it
        gallery = new PhotoSwipe( pswpElement, PhotoSwipeUI_Default, items, options);
        gallery.init();
    };

    // loop through all gallery elements and bind events
    var galleryElements = document.querySelectorAll( gallerySelector );

    for(var i = 0, l = galleryElements.length; i < l; i++) {
        galleryElements[i].setAttribute('data-pswp-uid', i+1);
        galleryElements[i].onclick = onThumbnailsClick;
    }

    // Parse URL and open gallery if it contains #&pid=3&gid=1
    var hashData = photoswipeParseHash();
    if(hashData.pid && hashData.gid) {
        openPhotoSwipe( hashData.pid ,  galleryElements[ hashData.gid - 1 ], true, true );
    }
};

// execute above function
initPhotoSwipeFromDOM('.my-gallery');
})()

theme.ZoomImage = (function(){
  $(window).resize(function() {
    var width = $(window).width();
    if (width > 767){
      ZoomImage();
    }
  });
  $(window).width(function() {
    var width = $(window).width();
    if (width > 767){
      ZoomImage();
    }
  });
  function ZoomImage(){
    $(".zoom_image").each(function(arg, el){
        var image = $(el).find("img");
        $(el).zoom({
            on: 'mouseover',
            url: image.attr("src").replace("small", "big")
        });
    });
  }
})()

theme.activeAccordion = (function(){
  $('.collapse').on('shown.bs.collapse', function () {
       $(this).prev().addClass('active-acc');
   });
   $('.collapse').on('hidden.bs.collapse', function () {
       $(this).prev().removeClass('active-acc');
   });
})()


// Anchor scroll
theme.anchorScroll = (function(){
  $(document).on('click', 'a[href^="#"]', function (event) {
    event.preventDefault();
    var disableAnchor = $(this).hasClass('disabled-anchor');
    if (!disableAnchor){
      $('html, body').animate({
        scrollTop: $($.attr(this, 'href')).offset().top
      }, 500);
    }
  });
})()

// Product-recently-viewed
theme.productRecentlyViewed = (function(){
  var $viewedElement = $('.js-recently-view'),
      $viewButton = $('.js-recently-view-button'),
      $content = $('.js-recently-view-content'),
      productHandle = $viewedElement.data('handle') || '',
      limit = $viewButton.data('limit') || 0,
      arrayProduct = JSON.parse(localStorage.getItem('localRecentlyViewed')) || [],
      lastProduct = arrayProduct[arrayProduct.length - 1] || '',
      isAdded = $.inArray(productHandle,arrayProduct) !== -1 ? true:false;

  function processViewed(){
    if (productHandle !== ''){
      //process last product
      if (lastProduct === productHandle && arrayProduct.length > 1){
        lastProduct = arrayProduct[arrayProduct.length - 2]
      }

      //move current product to last of array
      if (isAdded){
        arrayProduct.splice(arrayProduct.indexOf(productHandle), 1);
      }
      arrayProduct.push(productHandle);
      //remove first item if limit
      if (arrayProduct.length > limit){
        arrayProduct.shift()
      }
      localStorage.setItem('localRecentlyViewed', JSON.stringify(arrayProduct));
    }
  }

  function generatorProduct(){
    $content.html('');
    if (arrayProduct.length > 0){
      //array
      for (var i = 0; i < arrayProduct.length; i++) {
        var productHandle = arrayProduct[i];
        Shopify.getProduct(productHandle,function(product){
          var htmlProduct = '';
          var productPrice = product.price_varies? 'from ' + theme.Currency.formatMoney(product.price_min, theme.moneyFormat) : theme.Currency.formatMoney(product.price, theme.moneyFormat);
          var productComparePrice = product.compare_at_price_min !== 0? theme.Currency.formatMoney(product.compare_at_price_min, theme.moneyFormat) : '';
          htmlProduct += '<div class="col-12 col-lg-4 js-viewed-item mb-4">';
          htmlProduct += '	<div class="border p-3 rounded media d-flex ">';
          htmlProduct += '	<a class="mr-3 col-4 p-0" href="'+ product.url +'">';
          htmlProduct += '		<img src="'+ product.featured_image +'"/>';
          htmlProduct += '	</a>';
          htmlProduct += '	<div class="media-body text-left">';
          htmlProduct += '		<h5 class="mb-2 mt-2"><a href="'+ product.url +'">'+ product.title +'</a></h5>';
          htmlProduct += '	<span> '+ productPrice +'</span>';
          htmlProduct += '	<s>'+ productComparePrice +'</s>';
          htmlProduct += '	</div>';
          htmlProduct += '	</div>';
          htmlProduct += '</div>';
          $content.append(htmlProduct);
          theme.updateCurrencies();
        });
      }

      //last product
      Shopify.getProduct(lastProduct,function(product){
        $viewButton.css('background-image','url('+product.featured_image+')').addClass('active');
      })
    }
  }

  processViewed();
  generatorProduct();

})()

// Notice when soldout
theme.alert = (function(){
  function createAlert(title,mess,time,type){
    var aTitle = title || '',
        aTime = time || 2000,
        aMessage = mess || '',
        aClass = type || 'default';
    $.growl({ 
      title: aTitle,
      message: aMessage,
      duration: aTime,
      style: aClass,
      size: 'large'
    });
  }

  return{
    new:createAlert
  }
})()

// Notice when soldout
theme.noticeSoldout = (function(){
  var $soldoutWrapFormClass = $('.js-contact-soldout'),
      $textClass = $('.js-notify-text'),
      $soldoutValueId = $('#ContactProduct');
  function noticeSoldout(variant){
    $soldoutWrapFormClass.find('.form-success').remove()
    if (variant.available){
      $textClass.find('span').text('');
      $soldoutWrapFormClass.addClass('hide');
    }else{
      $textClass.find('span').text(': ' + variant.name);
      $soldoutWrapFormClass.removeClass('hide');
      $soldoutValueId.val(variant.name).attr('value',variant.name);
    }
  }
  return {
    init : noticeSoldout
  }
})()

// Sticky cart
theme.stickyCart = (function(){
  var $anchor = $('#js-anchor-sticky-cart'),
      $stCart = $('.sticky-cart-wr'),
      $close = $('#js-sticky-close'),
      disableStCart = localStorage.getItem('localDisableStCart') || '';
  if(disableStCart !== ''){
    $stCart.addClass('disable');
  }
  $close.on('click',function(){
    var isDisable = disableStCart !== '';
    if(isDisable){
      localStorage.setItem('localDisableStCart', '');
    }else{
      localStorage.setItem('localDisableStCart', 'true');
    }
    $stCart.toggleClass('disable');
  })
  if($anchor.length){
    $(window).on('scroll',function() {
      var hT = $anchor.offset().top,
          hH = $anchor.outerHeight(),
          wH = $(window).height(),
          wS = $(this).scrollTop();
      if (wS > (hT+hH-wH)){
        $stCart.addClass('active');
      }else{
        $stCart.removeClass('active');
      }
    });
  }
  
})()

//Fix reload safari
window.addEventListener("pageshow", function(evt){
  if(evt.persisted){
  setTimeout(function(){
      window.location.reload();
  },10);
}
}, false);

// Back to top
theme.backToTop = (function(){
  var backtotopClass = $('.js-back-to-top');
  $(window).scroll(function() {
    if ($(this).scrollTop() > 300) {
      backtotopClass.fadeIn('slow');
    } else {
      backtotopClass.fadeOut('slow');
    }
  });
  backtotopClass.on('click',function(){
    $('body,html').animate({scrollTop: 0}, 800);
  });
})()


// Tooltip
theme.tooltip = (function(){
  var selector = '[data-toggle="tooltip"],[data-tooltip="true"]';
  function loadTooltip(){
    $(selector).tooltip(); //Bootstrap 4
  };
  $(document).on('click',selector,function(){
    $(this).tooltip('hide');
  });
  loadTooltip();
  return{
    load:loadTooltip
  }
})()

//Collections style 2
theme.Bgcollection = (function(){
  // init Isotope
    function Bgcollection(container){
     var $container = this.$container = $(container);
     var sectionId = $container.attr('data-section-id');
     var wrapper = this.wrapper = '.bgcollection-wrapper';
     var slider = this.slider = '#Bgcollection-' + sectionId;
     var $slider = $(slider, wrapper);
     $(".colgrid__bg--full[data-index='1']").addClass('active');
     $('.colgrid .colgrid__box').each(function(){
           var index = $(this).attr("data-index");
           $(this).hover(
           function() {
              $(".colgrid__bg--full[data-index='"+index+"']").addClass('active');
           }, 
           function() {
                 $(".colgrid__bg--full[data-index='"+index+"']").removeClass('active');
              }
           );
        });
      }
    
    return Bgcollection;
  })();
  

//Sidebar
theme.sidebar = (function(){
  var togglebutton = '.js-toggle-filter',
      $sidebar = $('.js-sidebar');
  $(document).on('click',togglebutton,function(){
    $sidebar.toggleClass('active');
    $(this).toggleClass('active');
  })
})()

// Ajax filter in collection page
theme.ajaxFilter = (function() {
  var ajaxContent = '#js-product-ajax',
      ajaxSortBy = '#js-sortby',
      ajaxFillter = '#js-fillter',
      ajaxCollectionTitle = '.js-collection-title',
      pageTitle = $(document).find("title").text(),
      jsLoading = '#js-loading';

  var apollo = {
    init: function() {
      this.initFilter(); 
    },
    showLoading: function() {
      $(jsLoading).show();
    },
    hideLoading: function() {
      $('body,html').animate({
        scrollTop: $('#MainContent').offset().top - 150
      }, 600);
      setTimeout(function(){
        $(jsLoading).hide(); //delay 500ms for better UX
      }, 500); 
     
    },
    initFilter: function() {
      apollo.filterParams();
      apollo.filterSortby();
      apollo.sidebarMapTagEvents();
      apollo.filterMapSorting();
      apollo.filterMapPaging();
    },
    filterParams: function() {
      Shopify.queryParams = {};
      if (location.search.length) {
        for (var aKeyValue, i = 0, aCouples = location.search.substr(1).split('&'); i < aCouples.length; i++) {
          aKeyValue = aCouples[i].split('=');
          if (aKeyValue.length > 1) {
            Shopify.queryParams[decodeURIComponent(aKeyValue[0])] = decodeURIComponent(aKeyValue[1]);
          }
        }
      }
    },
    filterSortby: function() {
      if (Shopify.queryParams.sort_by) {
        var sortby = Shopify.queryParams.sort_by;
        $(ajaxSortBy).val(sortby);
      }
    },
    filterCreateUrl: function(baseLink) {
      var newQuery = $.param(Shopify.queryParams).replace(/%2B/g, '+');
      if (baseLink) {
        if (newQuery != "") {
          return baseLink + "?" + newQuery;
        } else {
          return baseLink;
        }
      }
      return location.pathname + "?" + newQuery;
    },
    filterMapData: function(data) {
      // 1. update product grid
      $(ajaxContent).html($(ajaxContent, data.responseText).html());
      // 2. update left filter
      $(ajaxFillter).html($(ajaxFillter, data.responseText).html());
      // 3. update collection title
      $(ajaxCollectionTitle).html($(ajaxCollectionTitle, data.responseText).html());
    },
    filterAjaxClick: function(baseLink) {
      delete Shopify.queryParams.page;
      var newurl = apollo.filterCreateUrl(baseLink);
      History.pushState({
        param: Shopify.queryParams
      }, pageTitle, newurl);
      apollo.filterGetContent(newurl);
    },
    filterGetContent: function(newurl) {
      $.ajax({
        type: 'GET',
        url: newurl,
        data: {},
        beforeSend: function() {
          apollo.showLoading();
        },
        complete: function(data) {
          apollo.filterMapData(data);
          theme.wishlist.load();
          theme.compare.load();
          theme.countdown.load();
          theme.priceRange.load();
          theme.tooltip.load();
          theme.collectionView.triggerView();
          theme.swatchCard2.load();
          theme.infiniteScroll.load();
          apollo.hideLoading();
        },
        error: function(xhr, text) {
          apollo.hideLoading();
          alert($.parseJSON(xhr.responseText).description);
        }
      });
    },
    sidebarMapTagEvents: function() {
      $(document).on('click','.advanced-filter a',function(event){
        event.preventDefault();
        $('.tooltip').removeClass('show');
        var currentTags = [];
        if (Shopify.queryParams.constraint) {
          currentTags = Shopify.queryParams.constraint.split('+');
        }
        if (!$(this).parent().hasClass("active-filter")) {
          var otherTag = $(this).parents('.catalog_filter_ul').find("li.active-filter");
          if (otherTag.length > 0) {
            var tagName = otherTag.data("handle");
            if (tagName) {
              var tagPos = currentTags.indexOf(tagName);
              if (tagPos >= 0) {
                currentTags.splice(tagPos, 1);
              }
            }
          }
        }
        var dataHandle = $(this).parent().data("handle");
        if (dataHandle) {
          var tagPos = currentTags.indexOf(dataHandle);
          if (tagPos >= 0) {
            currentTags.splice(tagPos, 1);
          } else {
            currentTags.push(dataHandle);
          }
        }
        if (currentTags.length) {
          Shopify.queryParams.constraint = currentTags.join('+');
        } else {
          delete Shopify.queryParams.constraint;
        }
        apollo.filterAjaxClick();
      });
      $(document).on('click','.advanced-filter .icon',function(){
        $(this).parent('.advanced-filter').find('a').trigger( "click" );
      });
    },
    filterMapSorting: function() {
      $(document).on('change',ajaxSortBy,function(){
        Shopify.queryParams.sort_by = $(this).val();
        apollo.filterAjaxClick();
      })
    },
    filterMapPaging: function() {
      $(document).on('click','.js-pagination a',function(){
        event.preventDefault();
        var linkPage = $(this).attr("href").match(/page=\d+/g);
        if (linkPage) {
          Shopify.queryParams.page = parseInt(linkPage[0].match(/\d+/g));
          if (Shopify.queryParams.page) {
            var newurl = apollo.filterCreateUrl();
            History.pushState({
              param: Shopify.queryParams
            }, pageTitle, newurl);
            apollo.filterGetContent(newurl);
          }
        }
      });
    }
  }

  if ($(".template-collection")) {
    History.Adapter.bind(window, 'statechange', function() {
      var State = History.getState();
      apollo.filterParams();
    });
  }
  apollo.init();
  
})();

$(theme.init);
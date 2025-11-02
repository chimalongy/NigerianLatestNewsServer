<?php

/**
 * MoreNews functions and definitions
 *
 * @link https://developer.wordpress.org/themes/basics/theme-functions/
 *
 * @package MoreNews
 */

/**
 * Define Theme Constants.
 */

defined('ESHF_COMPATIBILITY_TMPL') or define('ESHF_COMPATIBILITY_TMPL', 'morenews');

/**
 * MoreNews functions and definitions
 *
 * @link https://developer.wordpress.org/themes/basics/theme-functions/
 *
 * @package MoreNews
 */

if (!function_exists('morenews_setup')) :
  /**
   * Sets up theme defaults and registers support for various WordPress features.
   *
   * Note that this function is hooked into the after_setup_theme hook, which
   * runs before the init hook. The init hook is too late for some features, such
   * as indicating support for post thumbnails.
   */
  /**
   *
   */
  /**
   *
   */
  function morenews_setup()
  {
    /*
         * Make theme available for translation.
         * Translations can be filed in the /languages/ directory.
         * If you're building a theme based on MoreNews, use a find and replace
         * to change 'morenews' to the name of your theme in all the template files.
         */
    // load_theme_textdomain('morenews', get_template_directory() . '/languages');

    // Add default posts and comments RSS feed links to head.
    add_theme_support('automatic-feed-links');

    /*
         * Let WordPress manage the document title.
         * By adding theme support, we declare that this theme does not use a
         * hard-coded <title> tag in the document head, and expect WordPress to
         * provide it for us.
         */
    add_theme_support('title-tag');

    /*
         * Enable support for Post Thumbnails on posts and pages.
         *
         * @link https://developer.wordpress.org/themes/functionality/featured-images-post-thumbnails/
         */

    add_theme_support('post-thumbnails');
    add_theme_support('rtl');
    // Add featured image sizes
    add_image_size('morenews-featured', 1024, 0, false); // width, height, crop
    add_image_size('morenews-large', 825, 575, true); // width, height, crop
    add_image_size('morenews-medium', 590, 410, true); // width, height, crop



    /*
         * Enable support for Post Formats on posts and pages.
         *
         * @link https://developer.wordpress.org/themes/functionality/post-formats/
         */
    add_theme_support('post-formats', array('image', 'video', 'gallery'));

    // This theme uses wp_nav_menu() in one location.
    register_nav_menus(array(
      'aft-primary-nav' => esc_html__('Primary Menu', 'morenews'),
      'aft-social-nav' => esc_html__('Social Menu', 'morenews'),
      'aft-footer-nav' => esc_html__('Footer Menu', 'morenews'),
    ));

    /*
         * Switch default core markup for search form, comment form, and comments
         * to output valid HTML5.
         */
    add_theme_support('html5', array(
      'search-form',
      'comment-form',
      'comment-list',
      'gallery',
      'caption',
    ));

    // Set up the WordPress core custom background feature.
    add_theme_support('custom-background', apply_filters('morenews_custom_background_args', array(
      'default-color' => 'eeeeee',
      'default-image' => '',
    )));

    // Add theme support for selective refresh for widgets.
    add_theme_support('customize-selective-refresh-widgets');



    /**
     * Add support for core custom logo.
     *
     * @link https://codex.wordpress.org/Theme_Logo
     */
    add_theme_support('custom-logo', array(
      'flex-width' => true,
      'flex-height' => true,
    ));
    // Add AMP support
    add_theme_support('amp');

    /** 
     * Add theme support for gutenberg block
     */
    add_theme_support('align-wide');
    add_theme_support('responsive-embeds');
    add_theme_support('wp-block-styles');
    add_theme_support('appearance-tools');
    add_theme_support('custom-spacing');
    add_theme_support('custom-units');
    add_theme_support('custom-line-height');
    add_theme_support('border');
    add_theme_support('link-color');
  }
endif;
add_action('after_setup_theme', 'morenews_setup');


function morenews_is_amp()
{
  return function_exists('is_amp_endpoint') && is_amp_endpoint();
}

/**
 * Set the content width in pixels, based on the theme's design and stylesheet.
 *
 * Priority 0 to make it available to lower priority callbacks.
 *
 * @global int $content_width
 */
function morenews_content_width()
{
  $GLOBALS['content_width'] = apply_filters('morenews_content_width', 640);
}

add_action('after_setup_theme', 'morenews_content_width', 0);
/**
 * Filter font variants to include only necessary ones.
 *
 * @param string $font The font string (e.g., "Lato:400,300,400italic,900,700").
 * @return string Filtered font string with only the allowed variants.
 */

function morenews_is_google_fonts_enabled()
{
  $global_font_type = morenews_get_option('global_font_family_type');
  return $global_font_type === 'google';
}


/**
 * Filter allowed font variants.
 */
function morenews_filter_font_variants($font)
{
  if (strpos($font, ':') === false) {
    return $font;
  }

  list($font_name, $variants) = explode(':', $font);

  $allowed_variants = array('400', '700');
  $font_variants = explode(',', $variants);
  $filtered_variants = array_intersect($font_variants, $allowed_variants);

  return !empty($filtered_variants) ? $font_name . ':' . implode(',', $filtered_variants) : $font_name;
}

/**
 * Get Google Fonts URL based on theme settings.
 */
function morenews_get_fonts_url()
{
  static $cached_url = null;
  if ($cached_url !== null) {
    return $cached_url;
  }

  // 💡 Check if Google Fonts are enabled
  if (!morenews_is_google_fonts_enabled()) {
    $cached_url = '';
    return '';
  }

  $fonts_url = '';
  $subsets = 'latin';
  $theme_fonts = array();

  $site_title_font = morenews_get_option('site_title_font');
  $primary_font    = morenews_get_option('primary_font');
  $secondary_font  = morenews_get_option('secondary_font');

  $all_fonts = array($site_title_font, $primary_font, $secondary_font);

  $theme_fonts = array_filter(array_map(function ($font) {
    if (empty($font)) return '';
    if (stripos($font, 'Open+Sans') !== false || stripos($font, 'Oswald') !== false) {
      return null;
    }
    return morenews_filter_font_variants($font);
  }, $all_fonts));

  $unique_fonts = array_unique($theme_fonts);

  if (!empty($unique_fonts)) {
    $fonts_url = add_query_arg(array(
      'family'  => implode('|', $unique_fonts),
      'subset'  => $subsets,
      'display' => 'swap',
    ), 'https://fonts.googleapis.com/css');
  }

  $cached_url = $fonts_url;
  return $fonts_url;
}


/**
 * Add preconnect for Google Fonts domains (only if used).
 */
function morenews_add_preconnect_links($urls, $relation_type)
{
  if ('preconnect' === $relation_type && morenews_is_google_fonts_enabled()) {
    $urls[] = 'https://fonts.googleapis.com';
    $urls[] = 'https://fonts.gstatic.com';
  }
  return $urls;
}

add_filter('wp_resource_hints', 'morenews_add_preconnect_links', 10, 2);

/**
 * Preload fonts (Google or local) in <head>.
 */
function morenews_preload_google_fonts()
{
  if (!morenews_is_google_fonts_enabled() || morenews_is_amp()) {
    return;
  }

  $fonts_url = morenews_get_fonts_url();
  $site_title_font = morenews_get_option('site_title_font');
  $primary_font    = morenews_get_option('primary_font');
  $secondary_font  = morenews_get_option('secondary_font');

  $fonts_in_use = array($site_title_font, $primary_font, $secondary_font);

  $load_oswald     = false;
  $load_open_sans  = false;

  foreach ($fonts_in_use as $font) {
    $font_clean = strtolower($font);
    if (strpos($font_clean, 'oswald') !== false) {
      $load_oswald = true;
    }
    if (strpos($font_clean, 'open+sans') !== false || strpos($font_clean, 'open sans') !== false) {
      $load_open_sans = true;
    }
  }

  if ($fonts_url) {
    printf(
      "<link rel='preload' href='%s' as='style' onload=\"this.onload=null;this.rel='stylesheet'\" type='text/css' media='all' crossorigin='anonymous'>\n",
      esc_url($fonts_url)
    );
  }

  $base = get_template_directory_uri() . '/assets/fonts/';
  if ($load_oswald) {
    echo "<link rel='preload' href='{$base}oswald/oswald-regular.woff2' as='font' type='font/woff2' crossorigin='anonymous'>\n";
    echo "<link rel='preload' href='{$base}oswald/oswald-700.woff2' as='font' type='font/woff2' crossorigin='anonymous'>\n";
  }
  if ($load_open_sans) {
    echo "<link rel='preload' href='{$base}open-sans/open-sans-regular.woff2' as='font' type='font/woff2' crossorigin='anonymous'>\n";
    echo "<link rel='preload' href='{$base}open-sans/open-sans-700.woff2' as='font' type='font/woff2' crossorigin='anonymous'>\n";
  }
}

add_action('wp_head', 'morenews_preload_google_fonts', 1);

/**
 * Enqueue Google Fonts (only if needed).
 */
function morenews_enqueue_fonts()
{
  if (!morenews_is_google_fonts_enabled()) {
    return; // Do not enqueue if system fonts
  }

  $fonts_url = morenews_get_fonts_url();
  if ($fonts_url) {
    wp_enqueue_style('morenews-google-fonts', $fonts_url, array(), null);
  }
}


/**
 * Load Init for Hook files.
 */
require get_template_directory() . '/inc/custom-style.php';

/**
 * Enqueue styles.
 */

add_action('wp_enqueue_scripts', 'morenews_style_files');
function morenews_style_files()
{

  $min = defined('SCRIPT_DEBUG') && SCRIPT_DEBUG ? '' : '.min';
  $morenews_version = wp_get_theme()->get('Version');
  // wp_enqueue_style('font-awesome-v5', get_template_directory_uri() . '/assets/font-awesome/css/all' . $min . '.css');
  wp_enqueue_style('aft-icons', get_template_directory_uri() . '/assets/icons/style.css', array());

  wp_enqueue_style('bootstrap', get_template_directory_uri() . '/assets/bootstrap/css/bootstrap' . $min . '.css');
  wp_enqueue_style('slick', get_template_directory_uri() . '/assets/slick/css/slick' . $min . '.css');

  wp_enqueue_style('sidr', get_template_directory_uri() . '/assets/sidr/css/jquery.sidr.dark.css');

  wp_enqueue_style('magnific-popup', get_template_directory_uri() . '/assets/magnific-popup/magnific-popup.css');

  $show_footer_checkbox = morenews_get_option('athfb_show_checkbox_footer');
  $show_header_checkbox = morenews_get_option('athfb_show_checkbox_header');

  if ($show_header_checkbox) {
    wp_register_style(
      'morenew_header_builder',
      get_template_directory_uri() . '/assets/css/header-builder.css',
      array(),
      null,
      'all'
    );
    wp_enqueue_style('morenew_header_builder');
  }
  if ($show_footer_checkbox) {
    wp_register_style(
      'morenew_footer_builder',
      get_template_directory_uri() . '/assets/css/footer-builder.css',
      array(),
      null,
      'all'
    );
    wp_enqueue_style('morenew_footer_builder');
  }
  /**
   * Load WooCommerce compatibility file.
   */
  if (class_exists('WooCommerce')) {
    wp_enqueue_style('morenews-woocommerce-style', get_template_directory_uri() . '/woocommerce.css');

    $font_path = WC()->plugin_url() . '/assets/fonts/';
    $inline_font = '@font-face {
			font-family: "star";
			src: url("' . $font_path . 'star.eot");
			src: url("' . $font_path . 'star.eot?#iefix") format("embedded-opentype"),
				url("' . $font_path . 'star.woff") format("woff"),
				url("' . $font_path . 'star.ttf") format("truetype"),
				url("' . $font_path . 'star.svg#star") format("svg");
			font-weight: normal;
			font-style: normal;
		}';

    wp_add_inline_style('morenews-woocommerce-style', $inline_font);
  }



  // wp_enqueue_style('morenews-style', get_stylesheet_uri());
  wp_enqueue_style('morenews-style', get_template_directory_uri() . '/style' . $min . '.css', array(), $morenews_version);
  wp_add_inline_style('morenews-style', morenews_custom_style());
}



/**
 * Enqueue scripts.
 */

function morenews_scripts()
{

  // if (morenews_is_amp()) {
  //   return;
  // }
  $min = defined('SCRIPT_DEBUG') && SCRIPT_DEBUG ? '' : '.min';
  $morenews_version = wp_get_theme()->get('Version');
  wp_enqueue_script('jquery');
  wp_enqueue_script('jquery-cookie', get_template_directory_uri() . '/assets/jquery.cookie.js');
  wp_enqueue_script('morenews-toggle-script', get_template_directory_uri() . '/assets/toggle-script.js', array('jquery-cookie'), $morenews_version, true);

  wp_enqueue_script('morenews-background-script', get_template_directory_uri() . '/assets/background-script.js', array('jquery'), $morenews_version);
  wp_enqueue_script('morenews-navigation', get_template_directory_uri() . '/js/navigation.js', array(), $morenews_version, true);
  wp_enqueue_script('morenews-skip-link-focus-fix', get_template_directory_uri() . '/js/skip-link-focus-fix.js', array(), $morenews_version, true);
  wp_enqueue_script('slick', get_template_directory_uri() . '/assets/slick/js/slick' . $min . '.js', array('jquery'), $morenews_version, true);
  wp_enqueue_script('bootstrap', get_template_directory_uri() . '/assets/bootstrap/js/bootstrap' . $min . '.js', array('jquery'), $morenews_version, array(
    'in_footer' => true, // Because involves header.
    'strategy'  => 'defer',
  ));
  wp_enqueue_script('sidr', get_template_directory_uri() . '/assets/sidr/js/jquery.sidr' . $min . '.js', array('jquery'), $morenews_version, true);
  wp_enqueue_script('magnific-popup', get_template_directory_uri() . '/assets/magnific-popup/jquery.magnific-popup' . $min . '.js', array('jquery'), $morenews_version, true);
  wp_enqueue_script('matchheight', get_template_directory_uri() . '/assets/jquery-match-height/jquery.matchHeight' . $min . '.js', array('jquery'), $morenews_version, true);
  wp_enqueue_script('marquee', get_template_directory_uri() . '/admin-dashboard/dist/morenews_marque_scripts.build.js', array('jquery'), $morenews_version, true);

  $sticky_header = morenews_get_option('disable_sticky_header_option');
  if ($sticky_header ==  false) {
    wp_enqueue_script('morenews-fixed-header-script', get_template_directory_uri() . '/assets/fixed-header-script.js', array('jquery'), '', 1);
  }

  wp_enqueue_script('morenews-script', get_template_directory_uri() . '/admin-dashboard/dist/morenews_scripts.build.js', array('jquery'), $morenews_version, true);

  if (is_singular() && comments_open() && get_option('thread_comments')) {
    wp_enqueue_script('comment-reply');
  }
}

add_action('wp_enqueue_scripts', 'morenews_scripts');


/**
 * Enqueue admin scripts and styles.
 *
 * @since MoreNews 1.0.0
 */
function morenews_admin_scripts($hook)
{
  if ('widgets.php' === $hook) {
    wp_enqueue_media();
    wp_enqueue_script('morenews-widgets', get_template_directory_uri() . '/assets/widgets.js', array('jquery'), '1.0.0', true);
  }

  wp_enqueue_style('morenews-notice', get_template_directory_uri() . '/assets/css/notice.css');
}

add_action('admin_enqueue_scripts', 'morenews_admin_scripts');

add_action('elementor/editor/before_enqueue_scripts', 'morenews_admin_scripts');



/**
 * Custom template tags for this theme.
 */
require get_template_directory() . '/inc/template-tags.php';

/**
 * Custom Multi Author tags for this theme.
 */
require get_template_directory() . '/inc/multi-author.php';

/**
 * Custom template tags for this theme.
 */
require get_template_directory() . '/inc/template-images.php';

/**
 * Functions which enhance the theme by hooking into WordPress.
 */
require get_template_directory() . '/inc/template-functions.php';


/**
 * Customizer additions.
 */
require get_template_directory() . '/inc/customizer/customizer.php';

/**
 * Implement the Custom Header feature.
 */
require get_template_directory() . '/inc/custom-header.php';

/**
 * Customizer additions.
 */
require get_template_directory() . '/inc/init.php';



/**
 * Functions which enhance AMP Compatibility
 */

require get_template_directory() . '/inc/class-amp-compatible.php';
require get_template_directory() . '/inc/class-walker-menu.php';

/**
 * Load Jetpack compatibility file.
 */
if (defined('JETPACK__VERSION')) {
  require get_template_directory() . '/inc/jetpack.php';
}

/**
 * Load WooCommerce compatibility file.
 */
if (class_exists('WooCommerce')) {
  require get_template_directory() . '/inc/woocommerce.php';
}

/**
 * Descriptions on Header Menu
 * @author AF themes
 * @param string $item_output , HTML outputp for the menu item
 * @param object $item , menu item object
 * @param int $depth , depth in menu structure
 * @param object $args , arguments passed to wp_nav_menu()
 * @return string $item_output
 */
function morenews_header_menu_desc($item_output, $item, $depth, $args)
{
  $show_primary_menu_desc = morenews_get_option('show_primary_menu_desc');
  if ($show_primary_menu_desc) {
    if (isset($args->theme_location) && 'aft-primary-nav' == $args->theme_location && $item->description)
      $item_output = str_replace('</a>', '<span class="menu-description">' . $item->description . '</span></a>', $item_output);
  }


  return $item_output;
}

add_filter('walker_nav_menu_start_el', 'morenews_header_menu_desc', 10, 4);

function morenews_menu_notitle($menu)
{
  return $menu = preg_replace('/ title=\"(.*?)\"/', '', $menu);
}
add_filter('wp_nav_menu', 'morenews_menu_notitle');
add_filter('wp_page_menu', 'morenews_menu_notitle');
add_filter('wp_list_categories', 'morenews_menu_notitle');



function morenews_print_pre($args)
{
  if ($args) {
    echo "<pre>";
    print_r($args);
    echo "</pre>";
  } else {
    echo "<pre>";
    print_r('Empty');
    echo "</pre>";
  }
}

add_action('init', 'morenews_transltion_init', 99);

function morenews_transltion_init()
{
  load_theme_textdomain('morenews', get_template_directory()  . '/languages');
}


require_once get_template_directory() . '/inc/customizer/builder/options.php';
function athfb_load_files()
{
  // Only load in admin or customizer context
  if (!is_admin() && !is_customize_preview()) {
    return;
  }

  // Include files in the correct order
  require_once get_template_directory() . '/inc/customizer/builder/class-header-footer-builder.php';
  require_once get_template_directory() . '/inc/customizer/builder/class-header-footer-builder-control.php';
  require_once get_template_directory() . '/inc/customizer/builder/class-block-toggle.php';
}

// Load files when WordPress is ready and customizer classes are available
add_action('customize_register', 'athfb_load_files', 1);
function athfb_loadFiles()
{
  $loadHeader = morenews_get_option('athfb_show_checkbox_header');
  $loadFooter = morenews_get_option('athfb_show_checkbox_footer');
  // if ($loadHeader || $loadFooter) {
  require_once get_template_directory() . '/inc/customizer/builder/builder-structure.php';
  require_once get_template_directory() . '/inc/customizer/builder/header-builder-structure.php';
  require_once get_template_directory() . '/inc/customizer/builder/footer-builder-structure.php';
  // }
}


add_action('init', 'athfb_loadFiles');
/**
 * Always load theme integration for frontend
 */




/**
 * Initialize the Header Footer Builder
 */
function athfb_init()
{
  // Only initialize if we're in the right context
  if (class_exists('Header_Footer_Builder')) {
    Header_Footer_Builder::get_instance();
  }
}
add_action('admin_init', 'athfb_init');


/**
 * Allow REST API to access SEO meta keys
 */
add_filter('rest_api_allowed_private_meta_keys', function ($protected, $meta_key) {
    $seo_keys = [
        // Rank Math
        '_rank_math_focus_keyword',
        '_rank_math_description',
        '_rank_math_title',
        // Yoast
        '_yoast_wpseo_focuskw',
        '_yoast_wpseo_metadesc',
        '_yoast_wpseo_title',
    ];

    if (in_array($meta_key, $seo_keys, true)) {
        return true;
    }

    return $protected;
}, 10, 2);

/**
 * Make Rank Math + Yoast meta fields writable via REST API
 */
function expose_seo_meta_to_rest() {
    $fields = [
        // Rank Math
        '_rank_math_focus_keyword',
        '_rank_math_description',
        '_rank_math_title',
        // Yoast
        '_yoast_wpseo_focuskw',
        '_yoast_wpseo_metadesc',
        '_yoast_wpseo_title',
    ];

    foreach ($fields as $field) {
        register_post_meta('post', $field, [
            'show_in_rest'  => true,
            'single'        => true,
            'type'          => 'string',
            'auth_callback' => function() {
                return current_user_can('edit_posts');
            },
        ]);
    }
}
add_action('init', 'expose_seo_meta_to_rest');



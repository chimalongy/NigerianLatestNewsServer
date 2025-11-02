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

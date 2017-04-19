# frozen_string_literal: true

class RenameDrupalIndicesToBeUnique < ActiveRecord::Migration
  def change
    # In sqlite, index names must be unique across the entire database.
    # See: http://stackoverflow.com/a/1982880
    rename_index :cache, 'expire', 'cache_expire'
    rename_index :cache_admin_menu, 'expire', 'cache_admin_menu_expire'
    rename_index :cache_block, 'expire', 'cache_block_expire'
    rename_index :cache_bootstrap, 'expire', 'cache_bootstrap_expire'
    rename_index :cache_field, 'expire', 'cache_field_expire'
    rename_index :cache_filter, 'expire', 'cache_filter_expire'
    rename_index :cache_form, 'expire', 'cache_form_expire'
    rename_index :cache_image, 'expire', 'cache_image_expire'
    rename_index :cache_menu, 'expire', 'cache_menu_expire'
    rename_index :cache_page, 'expire', 'cache_page_expire'
    rename_index :cache_path, 'expire', 'cache_path_expire'
    rename_index :cache_rules, 'expire', 'cache_rules_expire'
    rename_index :cache_token, 'expire', 'cache_token_expire'
    rename_index :cache_update, 'expire', 'cache_update_expire'
    rename_index :cache_views, 'expire', 'cache_views_expire'
    rename_index :cache_views_data, 'expire', 'cache_views_data_expire'
    rename_index :queue, 'expire', 'queue_expire'
    rename_index :semaphore, 'expire', 'semaphore_expire'

    rename_index :block, 'list', 'block_list'
    rename_index :d6_upgrade_filter, 'list', 'd6_upgrade_filter_list'
    rename_index :filter, 'list', 'filter_list'

    rename_index :block_node_type, "type", "block_node_type_type"
    rename_index :field_config, "type", "field_config_type"
    rename_index :watchdog, "type", "watchdog_type"

    rename_index :field_config, "deleted", "field_config_deleted"
    rename_index :field_config_instance, "deleted", "field_config_instance_deleted"
    rename_index :field_data_body, "deleted", "field_data_body_deleted"
    rename_index :field_revision_body, "deleted", "field_revision_body_deleted"

    rename_index :advanced_help_index, "language", "advanced_help_index_language"
    rename_index :field_data_body, "language", "field_data_body_language"
    rename_index :field_revision_body, "language", "field_revision_body_language"
    rename_index :node, "language", "node_language"

    rename_index :field_data_body, "body_format", "field_data_body_body_format"
    rename_index :field_revision_body, "body_format", "field_revision_body_body_format"

    rename_index :field_config_instance, "field_name_bundle", "field_config_instance_bundle"
    rename_index :field_data_body, "bundle", "field_data_body_bundle"
    rename_index :field_revision_body, "bundle", "field_revision_body_bundle"

    rename_index :field_data_body, "entity_id", "field_data_body_entity_id"
    rename_index :field_revision_body, "entity_id", "field_revision_body_entity_id"

    rename_index :field_data_body, "entity_type", "field_data_body_entity_type"
    rename_index :field_revision_body, "entity_type", "field_revision_body_entity_type"

    rename_index :field_data_body, "revision_id", "field_data_body_revision_id"
    rename_index :field_revision_body, "revision_id", "field_revision_body_revision_id"

    rename_index :file_managed, "status", "file_managed_status"
    rename_index :files, "status", "files_status"

    rename_index :file_managed, "timestamp", "file_managed_timestamp"
    rename_index :files, "timestamp", "files_timestamp"
    rename_index :sessions, "timestamp", "sessions_timestamp"

    rename_index "file_managed", "uid", "file_managed_uid"
    rename_index "files", "uid", "files_uid"
    rename_index "node", "uid", "node_uid"
    rename_index "node_revision", "uid", "node_revision_uid"
    rename_index "sessions", "uid", "sessions_uid"
    rename_index "watchdog", "uid", "watchdog_uid"
    rename_index "wysiwyg_user", "uid", "wysiwyg_user_uid"

    rename_index "countries_country", "name", "countries_country_name"
    rename_index "filter_format", "name", "filter_format_name"
    rename_index "image_styles", "name", "image_styles_name"
    rename_index "role", "name", "role_name"
    rename_index "rules_config", "name", "rules_config_name"
    rename_index "users", "name", "users_name"
    rename_index "views_view", "name", "views_view_name"

    rename_index "history", "nid", "history_nid"
    rename_index "node_revision", "nid", "node_revision_nid"
    rename_index "search_node_links", "nid", "search_node_links_nid"
    rename_index "webform_submitted_data", "nid", "webform_submitted_data_nid"

    rename_index "field_config", "module", "field_config_module"
    rename_index "rules_dependencies", "module", "rules_dependencies_module"

    rename_index "block_role", "rid", "block_role_rid"
    rename_index "users_roles", "rid", "users_roles_rid"

    rename_index "node", "vid", "node_vid"
    rename_index "views_display", "vid", "views_display_vid"

    rename_index "webform_submissions", "sid_nid", "webform_submissions_sid_nid"
    rename_index "webform_submitted_data", "sid_nid", "webform_submitted_data_sid_nid"

    # sqlite doesn't allow tables and indices to share a name
    rename_index "node", "node_type", "node_node_type"
    rename_index "users", "access", "users_access"
  end
end

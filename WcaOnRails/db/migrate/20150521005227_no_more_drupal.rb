# frozen_string_literal: true

class NoMoreDrupal < ActiveRecord::Migration
  class DeviseUser < ActiveRecord::Base
  end

  class User < ActiveRecord::Base
  end

  class Node < ActiveRecord::Base
    self.table_name = "node"
    # Drupal has a "type" column that we don't want ActiveRecord to get excited about.
    self.inheritance_column = :_type_disabled
    # Drupal also has "changed" column that conflicts with ActiveRecord.
    ignore_columns :changed

    has_one :field_data_body, -> { where(entity_type: "node") }, primary_key: "nid", foreign_key: "entity_id"
    belongs_to :author, class_name: "User", primary_key: "uid", foreign_key: "uid"

    def alias
      urlAlias = UrlAlias.find_by source: "node/#{nid}"
      if !urlAlias
        nil
      elsif urlAlias.alias.start_with? 'posts/'
        urlAlias.alias.split("/")[1]
      else
        urlAlias.alias
      end
    end
  end

  class UrlAlias < ActiveRecord::Base
    self.table_name = "url_alias"
  end

  class FieldDataBody < ActiveRecord::Base
    self.table_name = "field_data_body"
    belongs_to :node, primary_key: "nid", foreign_key: "entity_id"
  end

  class Post < ActiveRecord::Base
    belongs_to :author, class_name: "DeviseUser"
  end

  def change
    add_column :devise_users, :name, :string

    create_table(:posts) do |t|
      t.string "title", null: false, default: ""

      # mysql TEXT must default to null
      t.text "body", null: false, default: nil

      t.string "slug", null: false, default: ""
      t.boolean "sticky"
      t.belongs_to :author, class_name: "DeviseUser"
      t.timestamps null: false
    end
    add_index :posts, :slug, unique: true

    Node.where(promote: true).each do |node|
      drupal_user = node.author
      devise_user = DeviseUser.find_by_email(drupal_user.mail)
      if !devise_user
        devise_user = DeviseUser.create!(
          name: drupal_user.name,
          email: drupal_user.mail,
          created_at: Time.at(drupal_user.created),
          confirmed_at: Time.now,
        )
      end
      Post.create!(
        title: node.title,
        body: node.field_data_body.body_value,
        author: devise_user,
        slug: node.alias,
        sticky: node.sticky,
        created_at: Time.at(node.created),
        updated_at: Time.at(node.created), # rails won't let us access the changed column, so just reuse created
      )
    end

    drop_table :users
    drop_table :node
    drop_table :url_alias
    drop_table :field_data_body

    drop_table :access
    drop_table :actions
    drop_table :advanced_help_index
    drop_table :authmap
    drop_table :batch
    drop_table :block
    drop_table :block_custom
    drop_table :block_node_type
    drop_table :block_role
    drop_table :blocked_ips
    drop_table :cache
    drop_table :cache_admin_menu
    drop_table :cache_block
    drop_table :cache_bootstrap
    drop_table :cache_field
    drop_table :cache_filter
    drop_table :cache_form
    drop_table :cache_image
    drop_table :cache_menu
    drop_table :cache_page
    drop_table :cache_path
    drop_table :cache_rules
    drop_table :cache_token
    drop_table :cache_update
    drop_table :cache_views
    drop_table :cache_views_data
    drop_table :captcha_points
    drop_table :captcha_sessions
    drop_table :countries_country
    drop_table :countries_data
    drop_table :ctools_css_cache
    drop_table :ctools_object_cache
    drop_table :d6_upgrade_filter
    drop_table :date_format_locale
    drop_table :date_format_type
    drop_table :date_formats
    drop_table :field_config
    drop_table :field_config_instance
    drop_table :field_revision_body
    drop_table :file_managed
    drop_table :file_usage
    drop_table :files
    drop_table :filter
    drop_table :filter_format
    drop_table :flood
    drop_table :history
    drop_table :image_effects
    drop_table :image_styles
    drop_table :menu_custom
    drop_table :menu_links
    drop_table :menu_router
    drop_table :node_access
    drop_table :node_revision
    drop_table :node_type
    drop_table :rdf_mapping
    drop_table :registry
    drop_table :registry_file
    drop_table :role
    drop_table :role_permission
    drop_table :rules_config
    drop_table :rules_dependencies
    drop_table :rules_scheduler
    drop_table :rules_tags
    drop_table :rules_trigger
    drop_table :search_dataset
    drop_table :search_index
    drop_table :search_node_links
    drop_table :search_total
    drop_table :semaphore
    drop_table :sequences
    drop_table :sessions
    drop_table :system
    drop_table :taxonomy_term_relation
    drop_table :taxonomy_term_synonym
    drop_table :top_searches
    drop_table :users_roles
    drop_table :variable
    drop_table :views_display
    drop_table :views_view
    drop_table :watchdog
    drop_table :webform
    drop_table :webform_component
    drop_table :webform_emails
    drop_table :webform_last_download
    drop_table :webform_roles
    drop_table :webform_submissions
    drop_table :webform_submitted_data
    drop_table :wysiwyg
    drop_table :wysiwyg_user
  end
end

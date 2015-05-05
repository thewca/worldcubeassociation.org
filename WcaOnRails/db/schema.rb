# encoding: UTF-8
# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 20150504163657) do

  create_table "access", primary_key: "aid", force: :cascade do |t|
    t.string  "mask",   limit: 255, default: "", null: false
    t.string  "type",   limit: 255, default: "", null: false
    t.integer "status", limit: 1,   default: 0,  null: false
  end

  create_table "actions", primary_key: "aid", force: :cascade do |t|
    t.string "type",       limit: 32,  default: "",  null: false
    t.string "callback",   limit: 255, default: "",  null: false
    t.binary "parameters",                           null: false
    t.string "label",      limit: 255, default: "0", null: false
  end

  create_table "advanced_help_index", primary_key: "sid", force: :cascade do |t|
    t.string "module",   limit: 255, default: "", null: false
    t.string "topic",    limit: 255, default: "", null: false
    t.string "language", limit: 12,  default: "", null: false
  end

  add_index "advanced_help_index", ["language"], name: "advanced_help_index_language"

  create_table "authmap", primary_key: "aid", force: :cascade do |t|
    t.integer "uid",      limit: 4,   default: 0,  null: false
    t.string  "authname", limit: 128, default: "", null: false
    t.string  "module",   limit: 128, default: "", null: false
  end

  add_index "authmap", ["authname"], name: "authname", unique: true

  create_table "batch", primary_key: "bid", force: :cascade do |t|
    t.string  "token",     limit: 64, default: "", null: false
    t.integer "timestamp", limit: 4,  default: 0,  null: false
    t.binary  "batch"
  end

  add_index "batch", ["token"], name: "token"

  create_table "block", primary_key: "bid", force: :cascade do |t|
    t.string  "module",     limit: 64,    default: "",  null: false
    t.string  "delta",      limit: 32,    default: "0", null: false
    t.string  "theme",      limit: 64,    default: "",  null: false
    t.integer "status",     limit: 1,     default: 0,   null: false
    t.integer "weight",     limit: 4,     default: 0,   null: false
    t.string  "region",     limit: 64,    default: "",  null: false
    t.integer "custom",     limit: 1,     default: 0,   null: false
    t.integer "visibility", limit: 1,     default: 0,   null: false
    t.text    "pages",      limit: 65535,               null: false
    t.string  "title",      limit: 255,   default: "",  null: false
    t.integer "cache",      limit: 1,     default: 1,   null: false
  end

  add_index "block", ["theme", "module", "delta"], name: "tmd", unique: true
  add_index "block", ["theme", "status", "region", "weight", "module"], name: "block_list"

  create_table "block_custom", primary_key: "bid", force: :cascade do |t|
    t.text   "body",   limit: 4294967295
    t.string "info",   limit: 128,        default: "", null: false
    t.string "format", limit: 255
  end

  add_index "block_custom", ["info"], name: "info", unique: true

  create_table "block_node_type", id: false, force: :cascade do |t|
    t.string "module", limit: 64, null: false
    t.string "delta",  limit: 32, null: false
    t.string "type",   limit: 32, null: false
  end

  add_index "block_node_type", ["type"], name: "block_node_type_type"

  create_table "block_role", id: false, force: :cascade do |t|
    t.string  "module", limit: 64, default: "", null: false
    t.string  "delta",  limit: 32, default: "", null: false
    t.integer "rid",    limit: 4,  default: 0,  null: false
  end

  add_index "block_role", ["rid"], name: "block_role_rid"

  create_table "blocked_ips", primary_key: "iid", force: :cascade do |t|
    t.string "ip", limit: 40, default: "", null: false
  end

  add_index "blocked_ips", ["ip"], name: "blocked_ip"

  create_table "cache", primary_key: "cid", force: :cascade do |t|
    t.binary  "data"
    t.integer "expire",     limit: 4, default: 0, null: false
    t.integer "created",    limit: 4, default: 0, null: false
    t.integer "serialized", limit: 2, default: 0, null: false
  end

  add_index "cache", ["expire"], name: "cache_expire"

  create_table "cache_admin_menu", primary_key: "cid", force: :cascade do |t|
    t.binary  "data"
    t.integer "expire",     limit: 4, default: 0, null: false
    t.integer "created",    limit: 4, default: 0, null: false
    t.integer "serialized", limit: 2, default: 0, null: false
  end

  add_index "cache_admin_menu", ["expire"], name: "cache_admin_menu_expire"

  create_table "cache_block", primary_key: "cid", force: :cascade do |t|
    t.binary  "data"
    t.integer "expire",     limit: 4, default: 0, null: false
    t.integer "created",    limit: 4, default: 0, null: false
    t.integer "serialized", limit: 2, default: 0, null: false
  end

  add_index "cache_block", ["expire"], name: "cache_block_expire"

  create_table "cache_bootstrap", primary_key: "cid", force: :cascade do |t|
    t.binary  "data"
    t.integer "expire",     limit: 4, default: 0, null: false
    t.integer "created",    limit: 4, default: 0, null: false
    t.integer "serialized", limit: 2, default: 0, null: false
  end

  add_index "cache_bootstrap", ["expire"], name: "cache_bootstrap_expire"

  create_table "cache_field", primary_key: "cid", force: :cascade do |t|
    t.binary  "data"
    t.integer "expire",     limit: 4, default: 0, null: false
    t.integer "created",    limit: 4, default: 0, null: false
    t.integer "serialized", limit: 2, default: 0, null: false
  end

  add_index "cache_field", ["expire"], name: "cache_field_expire"

  create_table "cache_filter", primary_key: "cid", force: :cascade do |t|
    t.binary  "data"
    t.integer "expire",     limit: 4, default: 0, null: false
    t.integer "created",    limit: 4, default: 0, null: false
    t.integer "serialized", limit: 2, default: 0, null: false
  end

  add_index "cache_filter", ["expire"], name: "cache_filter_expire"

  create_table "cache_form", primary_key: "cid", force: :cascade do |t|
    t.binary  "data"
    t.integer "expire",     limit: 4, default: 0, null: false
    t.integer "created",    limit: 4, default: 0, null: false
    t.integer "serialized", limit: 2, default: 0, null: false
  end

  add_index "cache_form", ["expire"], name: "cache_form_expire"

  create_table "cache_image", primary_key: "cid", force: :cascade do |t|
    t.binary  "data"
    t.integer "expire",     limit: 4, default: 0, null: false
    t.integer "created",    limit: 4, default: 0, null: false
    t.integer "serialized", limit: 2, default: 0, null: false
  end

  add_index "cache_image", ["expire"], name: "cache_image_expire"

  create_table "cache_menu", primary_key: "cid", force: :cascade do |t|
    t.binary  "data"
    t.integer "expire",     limit: 4, default: 0, null: false
    t.integer "created",    limit: 4, default: 0, null: false
    t.integer "serialized", limit: 2, default: 0, null: false
  end

  add_index "cache_menu", ["expire"], name: "cache_menu_expire"

  create_table "cache_page", primary_key: "cid", force: :cascade do |t|
    t.binary  "data"
    t.integer "expire",     limit: 4, default: 0, null: false
    t.integer "created",    limit: 4, default: 0, null: false
    t.integer "serialized", limit: 2, default: 0, null: false
  end

  add_index "cache_page", ["expire"], name: "cache_page_expire"

  create_table "cache_path", primary_key: "cid", force: :cascade do |t|
    t.binary  "data"
    t.integer "expire",     limit: 4, default: 0, null: false
    t.integer "created",    limit: 4, default: 0, null: false
    t.integer "serialized", limit: 2, default: 0, null: false
  end

  add_index "cache_path", ["expire"], name: "cache_path_expire"

  create_table "cache_rules", primary_key: "cid", force: :cascade do |t|
    t.binary  "data"
    t.integer "expire",     limit: 4, default: 0, null: false
    t.integer "created",    limit: 4, default: 0, null: false
    t.integer "serialized", limit: 2, default: 0, null: false
  end

  add_index "cache_rules", ["expire"], name: "cache_rules_expire"

  create_table "cache_token", primary_key: "cid", force: :cascade do |t|
    t.binary  "data"
    t.integer "expire",     limit: 4, default: 0, null: false
    t.integer "created",    limit: 4, default: 0, null: false
    t.integer "serialized", limit: 2, default: 0, null: false
  end

  add_index "cache_token", ["expire"], name: "cache_token_expire"

  create_table "cache_update", primary_key: "cid", force: :cascade do |t|
    t.binary  "data"
    t.integer "expire",     limit: 4, default: 0, null: false
    t.integer "created",    limit: 4, default: 0, null: false
    t.integer "serialized", limit: 2, default: 0, null: false
  end

  add_index "cache_update", ["expire"], name: "cache_update_expire"

  create_table "cache_views", primary_key: "cid", force: :cascade do |t|
    t.binary  "data"
    t.integer "expire",     limit: 4, default: 0, null: false
    t.integer "created",    limit: 4, default: 0, null: false
    t.integer "serialized", limit: 2, default: 0, null: false
  end

  add_index "cache_views", ["expire"], name: "cache_views_expire"

  create_table "cache_views_data", primary_key: "cid", force: :cascade do |t|
    t.binary  "data"
    t.integer "expire",     limit: 4, default: 0, null: false
    t.integer "created",    limit: 4, default: 0, null: false
    t.integer "serialized", limit: 2, default: 1, null: false
  end

  add_index "cache_views_data", ["expire"], name: "cache_views_data_expire"

  create_table "captcha_points", primary_key: "form_id", force: :cascade do |t|
    t.string "module",       limit: 64
    t.string "captcha_type", limit: 64
  end

  create_table "captcha_sessions", primary_key: "csid", force: :cascade do |t|
    t.string  "token",      limit: 64
    t.integer "uid",        limit: 4,   default: 0,  null: false
    t.string  "sid",        limit: 64,  default: "", null: false
    t.string  "ip_address", limit: 128
    t.integer "timestamp",  limit: 4,   default: 0,  null: false
    t.string  "form_id",    limit: 128,              null: false
    t.string  "solution",   limit: 128, default: "", null: false
    t.integer "status",     limit: 4,   default: 0,  null: false
    t.integer "attempts",   limit: 4,   default: 0,  null: false
  end

  add_index "captcha_sessions", ["csid", "ip_address"], name: "csid_ip"

  create_table "countries_country", primary_key: "cid", force: :cascade do |t|
    t.string  "iso2",          limit: 2,                   null: false
    t.string  "iso3",          limit: 3
    t.string  "name",          limit: 95,                  null: false
    t.string  "official_name", limit: 127,                 null: false
    t.integer "numcode",       limit: 2
    t.string  "continent",     limit: 2,                   null: false
    t.integer "enabled",       limit: 4,   default: 1,     null: false
    t.string  "language",      limit: 12,  default: "und", null: false
  end

  add_index "countries_country", ["continent"], name: "continent"
  add_index "countries_country", ["enabled"], name: "enabled"
  add_index "countries_country", ["iso2"], name: "iso2", unique: true
  add_index "countries_country", ["name"], name: "countries_country_name", unique: true

  create_table "countries_data", primary_key: "iso2", force: :cascade do |t|
    t.string "module", limit: 255, default: "system", null: false
    t.string "name",   limit: 255, default: "system", null: false
    t.binary "data"
  end

  create_table "ctools_css_cache", primary_key: "cid", force: :cascade do |t|
    t.string  "filename", limit: 255
    t.text    "css",      limit: 4294967295
    t.integer "filter",   limit: 1
  end

  create_table "ctools_object_cache", id: false, force: :cascade do |t|
    t.string  "sid",     limit: 64,              null: false
    t.string  "name",    limit: 128,             null: false
    t.string  "obj",     limit: 128,             null: false
    t.integer "updated", limit: 4,   default: 0, null: false
    t.binary  "data"
  end

  add_index "ctools_object_cache", ["updated"], name: "updated"

  create_table "d6_upgrade_filter", primary_key: "fid", force: :cascade do |t|
    t.integer "format", limit: 4,  default: 0,  null: false
    t.string  "module", limit: 64, default: "", null: false
    t.integer "delta",  limit: 1,  default: 0,  null: false
    t.integer "weight", limit: 1,  default: 0,  null: false
  end

  add_index "d6_upgrade_filter", ["format", "module", "delta"], name: "fmd", unique: true
  add_index "d6_upgrade_filter", ["format", "weight", "module", "delta"], name: "d6_upgrade_filter_list"

  create_table "date_format_locale", id: false, force: :cascade do |t|
    t.string "format",   limit: 100, null: false
    t.string "type",     limit: 64,  null: false
    t.string "language", limit: 12,  null: false
  end

  create_table "date_format_type", primary_key: "type", force: :cascade do |t|
    t.string  "title",  limit: 255,             null: false
    t.integer "locked", limit: 1,   default: 0, null: false
  end

  add_index "date_format_type", ["title"], name: "title"

  create_table "date_formats", primary_key: "dfid", force: :cascade do |t|
    t.string  "format", limit: 100,             null: false
    t.string  "type",   limit: 64,              null: false
    t.integer "locked", limit: 1,   default: 0, null: false
  end

  add_index "date_formats", ["format", "type"], name: "formats", unique: true

  create_table "devise_users", force: :cascade do |t|
    t.string   "email",                  default: "", null: false
    t.string   "encrypted_password",     default: "", null: false
    t.string   "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.integer  "sign_in_count",          default: 0,  null: false
    t.datetime "current_sign_in_at"
    t.datetime "last_sign_in_at"
    t.string   "current_sign_in_ip"
    t.string   "last_sign_in_ip"
    t.string   "confirmation_token"
    t.datetime "confirmed_at"
    t.datetime "confirmation_sent_at"
    t.string   "unconfirmed_email"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  add_index "devise_users", ["email"], name: "index_devise_users_on_email", unique: true
  add_index "devise_users", ["reset_password_token"], name: "index_devise_users_on_reset_password_token", unique: true

  create_table "field_config", force: :cascade do |t|
    t.string  "field_name",     limit: 32,               null: false
    t.string  "type",           limit: 128,              null: false
    t.string  "module",         limit: 128, default: "", null: false
    t.integer "active",         limit: 1,   default: 0,  null: false
    t.string  "storage_type",   limit: 128,              null: false
    t.string  "storage_module", limit: 128, default: "", null: false
    t.integer "storage_active", limit: 1,   default: 0,  null: false
    t.integer "locked",         limit: 1,   default: 0,  null: false
    t.binary  "data",                                    null: false
    t.integer "cardinality",    limit: 1,   default: 0,  null: false
    t.integer "translatable",   limit: 1,   default: 0,  null: false
    t.integer "deleted",        limit: 1,   default: 0,  null: false
  end

  add_index "field_config", ["active"], name: "active"
  add_index "field_config", ["deleted"], name: "field_config_deleted"
  add_index "field_config", ["field_name"], name: "field_name"
  add_index "field_config", ["module"], name: "field_config_module"
  add_index "field_config", ["storage_active"], name: "storage_active"
  add_index "field_config", ["storage_module"], name: "storage_module"
  add_index "field_config", ["storage_type"], name: "storage_type"
  add_index "field_config", ["type"], name: "field_config_type"

  create_table "field_config_instance", force: :cascade do |t|
    t.integer "field_id",    limit: 4,                null: false
    t.string  "field_name",  limit: 32,  default: "", null: false
    t.string  "entity_type", limit: 32,  default: "", null: false
    t.string  "bundle",      limit: 128, default: "", null: false
    t.binary  "data",                                 null: false
    t.integer "deleted",     limit: 1,   default: 0,  null: false
  end

  add_index "field_config_instance", ["deleted"], name: "field_config_instance_deleted"
  add_index "field_config_instance", ["field_name", "entity_type", "bundle"], name: "field_config_instance_bundle"

  create_table "field_data_body", id: false, force: :cascade do |t|
    t.string  "entity_type",  limit: 128,        default: "", null: false
    t.string  "bundle",       limit: 128,        default: "", null: false
    t.integer "deleted",      limit: 1,          default: 0,  null: false
    t.integer "entity_id",    limit: 4,                       null: false
    t.integer "revision_id",  limit: 4
    t.string  "language",     limit: 32,         default: "", null: false
    t.integer "delta",        limit: 4,                       null: false
    t.text    "body_value",   limit: 4294967295
    t.text    "body_summary", limit: 4294967295
    t.string  "body_format",  limit: 255
  end

  add_index "field_data_body", ["body_format"], name: "field_data_body_body_format"
  add_index "field_data_body", ["bundle"], name: "field_data_body_bundle"
  add_index "field_data_body", ["deleted"], name: "field_data_body_deleted"
  add_index "field_data_body", ["entity_id"], name: "field_data_body_entity_id"
  add_index "field_data_body", ["entity_type"], name: "field_data_body_entity_type"
  add_index "field_data_body", ["language"], name: "field_data_body_language"
  add_index "field_data_body", ["revision_id"], name: "field_data_body_revision_id"

  create_table "field_revision_body", id: false, force: :cascade do |t|
    t.string  "entity_type",  limit: 128,        default: "", null: false
    t.string  "bundle",       limit: 128,        default: "", null: false
    t.integer "deleted",      limit: 1,          default: 0,  null: false
    t.integer "entity_id",    limit: 4,                       null: false
    t.integer "revision_id",  limit: 4,                       null: false
    t.string  "language",     limit: 32,         default: "", null: false
    t.integer "delta",        limit: 4,                       null: false
    t.text    "body_value",   limit: 4294967295
    t.text    "body_summary", limit: 4294967295
    t.string  "body_format",  limit: 255
  end

  add_index "field_revision_body", ["body_format"], name: "field_revision_body_body_format"
  add_index "field_revision_body", ["bundle"], name: "field_revision_body_bundle"
  add_index "field_revision_body", ["deleted"], name: "field_revision_body_deleted"
  add_index "field_revision_body", ["entity_id"], name: "field_revision_body_entity_id"
  add_index "field_revision_body", ["entity_type"], name: "field_revision_body_entity_type"
  add_index "field_revision_body", ["language"], name: "field_revision_body_language"
  add_index "field_revision_body", ["revision_id"], name: "field_revision_body_revision_id"

  create_table "file_managed", primary_key: "fid", force: :cascade do |t|
    t.integer "uid",       limit: 4,   default: 0,  null: false
    t.string  "filename",  limit: 255, default: "", null: false
    t.string  "uri",       limit: 255, default: "", null: false
    t.string  "filemime",  limit: 255, default: "", null: false
    t.integer "filesize",  limit: 8,   default: 0,  null: false
    t.integer "status",    limit: 1,   default: 0,  null: false
    t.integer "timestamp", limit: 4,   default: 0,  null: false
  end

  add_index "file_managed", ["status"], name: "file_managed_status"
  add_index "file_managed", ["timestamp"], name: "file_managed_timestamp"
  add_index "file_managed", ["uid"], name: "file_managed_uid"
  add_index "file_managed", ["uri"], name: "uri", unique: true

  create_table "file_usage", id: false, force: :cascade do |t|
    t.integer "fid",    limit: 4,                null: false
    t.string  "module", limit: 255, default: "", null: false
    t.string  "type",   limit: 64,  default: "", null: false
    t.integer "id",     limit: 4,   default: 0,  null: false
    t.integer "count",  limit: 4,   default: 0,  null: false
  end

  add_index "file_usage", ["fid", "count"], name: "fid_count"
  add_index "file_usage", ["fid", "module"], name: "fid_module"
  add_index "file_usage", ["type", "id"], name: "type_id"

  create_table "files", primary_key: "fid", force: :cascade do |t|
    t.integer "uid",       limit: 4,   default: 0,  null: false
    t.string  "filename",  limit: 255, default: "", null: false
    t.string  "filepath",  limit: 255, default: "", null: false
    t.string  "filemime",  limit: 255, default: "", null: false
    t.integer "filesize",  limit: 4,   default: 0,  null: false
    t.integer "status",    limit: 4,   default: 0,  null: false
    t.integer "timestamp", limit: 4,   default: 0,  null: false
  end

  add_index "files", ["status"], name: "files_status"
  add_index "files", ["timestamp"], name: "files_timestamp"
  add_index "files", ["uid"], name: "files_uid"

  create_table "filter", id: false, force: :cascade do |t|
    t.string  "format",   limit: 255,              null: false
    t.string  "module",   limit: 64,  default: "", null: false
    t.string  "name",     limit: 32,  default: "", null: false
    t.integer "weight",   limit: 4,   default: 0,  null: false
    t.integer "status",   limit: 4,   default: 0,  null: false
    t.binary  "settings"
  end

  add_index "filter", ["weight", "module", "name"], name: "filter_list"

  create_table "filter_format", primary_key: "format", force: :cascade do |t|
    t.string  "name",   limit: 255, default: "", null: false
    t.integer "cache",  limit: 1,   default: 0,  null: false
    t.integer "status", limit: 1,   default: 1,  null: false
    t.integer "weight", limit: 4,   default: 0,  null: false
  end

  add_index "filter_format", ["name"], name: "filter_format_name", unique: true
  add_index "filter_format", ["status", "weight"], name: "status_weight"

  create_table "flood", primary_key: "fid", force: :cascade do |t|
    t.string  "event",      limit: 64,  default: "", null: false
    t.string  "identifier", limit: 128, default: "", null: false
    t.integer "timestamp",  limit: 4,   default: 0,  null: false
    t.integer "expiration", limit: 4,   default: 0,  null: false
  end

  add_index "flood", ["event", "identifier", "timestamp"], name: "allow"
  add_index "flood", ["expiration"], name: "purge"

  create_table "history", id: false, force: :cascade do |t|
    t.integer "uid",       limit: 4, default: 0, null: false
    t.integer "nid",       limit: 4, default: 0, null: false
    t.integer "timestamp", limit: 4, default: 0, null: false
  end

  add_index "history", ["nid"], name: "history_nid"

  create_table "image_effects", primary_key: "ieid", force: :cascade do |t|
    t.integer "isid",   limit: 4,   default: 0, null: false
    t.integer "weight", limit: 4,   default: 0, null: false
    t.string  "name",   limit: 255,             null: false
    t.binary  "data",                           null: false
  end

  add_index "image_effects", ["isid"], name: "isid"
  add_index "image_effects", ["weight"], name: "weight"

  create_table "image_styles", primary_key: "isid", force: :cascade do |t|
    t.string "name",  limit: 255,              null: false
    t.string "label", limit: 255, default: "", null: false
  end

  add_index "image_styles", ["name"], name: "image_styles_name", unique: true

  create_table "menu_custom", primary_key: "menu_name", force: :cascade do |t|
    t.string "title",       limit: 255,   default: "", null: false
    t.text   "description", limit: 65535
  end

  create_table "menu_links", primary_key: "mlid", force: :cascade do |t|
    t.string  "menu_name",    limit: 32,  default: "",       null: false
    t.integer "plid",         limit: 4,   default: 0,        null: false
    t.string  "link_path",    limit: 255, default: "",       null: false
    t.string  "router_path",  limit: 255, default: "",       null: false
    t.string  "link_title",   limit: 255, default: "",       null: false
    t.binary  "options"
    t.string  "module",       limit: 255, default: "system", null: false
    t.integer "hidden",       limit: 2,   default: 0,        null: false
    t.integer "external",     limit: 2,   default: 0,        null: false
    t.integer "has_children", limit: 2,   default: 0,        null: false
    t.integer "expanded",     limit: 2,   default: 0,        null: false
    t.integer "weight",       limit: 4,   default: 0,        null: false
    t.integer "depth",        limit: 2,   default: 0,        null: false
    t.integer "customized",   limit: 2,   default: 0,        null: false
    t.integer "p1",           limit: 4,   default: 0,        null: false
    t.integer "p2",           limit: 4,   default: 0,        null: false
    t.integer "p3",           limit: 4,   default: 0,        null: false
    t.integer "p4",           limit: 4,   default: 0,        null: false
    t.integer "p5",           limit: 4,   default: 0,        null: false
    t.integer "p6",           limit: 4,   default: 0,        null: false
    t.integer "p7",           limit: 4,   default: 0,        null: false
    t.integer "p8",           limit: 4,   default: 0,        null: false
    t.integer "p9",           limit: 4,   default: 0,        null: false
    t.integer "updated",      limit: 2,   default: 0,        null: false
  end

  add_index "menu_links", ["link_path", "menu_name"], name: "path_menu"
  add_index "menu_links", ["menu_name", "p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8", "p9"], name: "menu_parents"
  add_index "menu_links", ["menu_name", "plid", "expanded", "has_children"], name: "menu_plid_expand_child"
  add_index "menu_links", ["router_path"], name: "router_path"

  create_table "menu_router", primary_key: "path", force: :cascade do |t|
    t.binary  "load_functions",                                  null: false
    t.binary  "to_arg_functions",                                null: false
    t.string  "access_callback",   limit: 255,      default: "", null: false
    t.binary  "access_arguments"
    t.string  "page_callback",     limit: 255,      default: "", null: false
    t.binary  "page_arguments"
    t.integer "fit",               limit: 4,        default: 0,  null: false
    t.integer "number_parts",      limit: 2,        default: 0,  null: false
    t.string  "tab_parent",        limit: 255,      default: "", null: false
    t.string  "tab_root",          limit: 255,      default: "", null: false
    t.string  "title",             limit: 255,      default: "", null: false
    t.string  "title_callback",    limit: 255,      default: "", null: false
    t.string  "title_arguments",   limit: 255,      default: "", null: false
    t.integer "type",              limit: 4,        default: 0,  null: false
    t.text    "description",       limit: 65535,                 null: false
    t.string  "position",          limit: 255,      default: "", null: false
    t.integer "weight",            limit: 4,        default: 0,  null: false
    t.text    "include_file",      limit: 16777215
    t.string  "delivery_callback", limit: 255,      default: "", null: false
    t.integer "context",           limit: 4,        default: 0,  null: false
    t.string  "theme_callback",    limit: 255,      default: "", null: false
    t.string  "theme_arguments",   limit: 255,      default: "", null: false
  end

  add_index "menu_router", ["fit"], name: "fit"
  add_index "menu_router", ["tab_parent", "weight", "title"], name: "tab_parent"
  add_index "menu_router", ["tab_root", "weight", "title"], name: "tab_root_weight_title"

  create_table "node", primary_key: "nid", force: :cascade do |t|
    t.integer "vid",       limit: 4
    t.string  "type",      limit: 32,  default: "", null: false
    t.string  "language",  limit: 12,  default: "", null: false
    t.string  "title",     limit: 255, default: "", null: false
    t.integer "uid",       limit: 4,   default: 0,  null: false
    t.integer "status",    limit: 4,   default: 1,  null: false
    t.integer "created",   limit: 4,   default: 0,  null: false
    t.integer "changed",   limit: 4,   default: 0,  null: false
    t.integer "comment",   limit: 4,   default: 0,  null: false
    t.integer "promote",   limit: 4,   default: 0,  null: false
    t.integer "sticky",    limit: 4,   default: 0,  null: false
    t.integer "tnid",      limit: 4,   default: 0,  null: false
    t.integer "translate", limit: 4,   default: 0,  null: false
  end

  add_index "node", ["changed"], name: "node_changed"
  add_index "node", ["created"], name: "node_created"
  add_index "node", ["language"], name: "node_language"
  add_index "node", ["promote", "status", "sticky", "created"], name: "node_frontpage"
  add_index "node", ["status", "type", "nid"], name: "node_status_type"
  add_index "node", ["title", "type"], name: "node_title_type"
  add_index "node", ["tnid"], name: "tnid"
  add_index "node", ["translate"], name: "translate"
  add_index "node", ["type"], name: "node_node_type"
  add_index "node", ["uid"], name: "{:using=>\"node_uid\"}"
  add_index "node", ["vid"], name: "node_vid", unique: true

  create_table "node_access", id: false, force: :cascade do |t|
    t.integer "nid",          limit: 4,   default: 0,  null: false
    t.integer "gid",          limit: 4,   default: 0,  null: false
    t.string  "realm",        limit: 255, default: "", null: false
    t.integer "grant_view",   limit: 1,   default: 0,  null: false
    t.integer "grant_update", limit: 1,   default: 0,  null: false
    t.integer "grant_delete", limit: 1,   default: 0,  null: false
  end

  create_table "node_revision", primary_key: "vid", force: :cascade do |t|
    t.integer "nid",       limit: 4,          default: 0,  null: false
    t.integer "uid",       limit: 4,          default: 0,  null: false
    t.string  "title",     limit: 255,        default: "", null: false
    t.text    "log",       limit: 4294967295,              null: false
    t.integer "timestamp", limit: 4,          default: 0,  null: false
    t.integer "status",    limit: 4,          default: 1,  null: false
    t.integer "comment",   limit: 4,          default: 0,  null: false
    t.integer "promote",   limit: 4,          default: 0,  null: false
    t.integer "sticky",    limit: 4,          default: 0,  null: false
  end

  add_index "node_revision", ["nid"], name: "node_revision_nid"
  add_index "node_revision", ["uid"], name: "node_revision_uid"

  create_table "node_type", primary_key: "type", force: :cascade do |t|
    t.string  "name",        limit: 255,      default: "", null: false
    t.string  "base",        limit: 255,                   null: false
    t.text    "description", limit: 16777215,              null: false
    t.text    "help",        limit: 16777215,              null: false
    t.integer "has_title",   limit: 1,        default: 0,  null: false
    t.string  "title_label", limit: 255,      default: "", null: false
    t.integer "custom",      limit: 1,        default: 0,  null: false
    t.integer "modified",    limit: 1,        default: 0,  null: false
    t.integer "locked",      limit: 1,        default: 0,  null: false
    t.string  "orig_type",   limit: 255,      default: "", null: false
    t.string  "module",      limit: 255,                   null: false
    t.integer "disabled",    limit: 1,        default: 0,  null: false
  end

  create_table "oauth_access_grants", force: :cascade do |t|
    t.integer  "resource_owner_id", null: false
    t.integer  "application_id",    null: false
    t.string   "token",             null: false
    t.integer  "expires_in",        null: false
    t.text     "redirect_uri",      null: false
    t.datetime "created_at",        null: false
    t.datetime "revoked_at"
    t.string   "scopes"
  end

  add_index "oauth_access_grants", ["token"], name: "index_oauth_access_grants_on_token", unique: true

  create_table "oauth_access_tokens", force: :cascade do |t|
    t.integer  "resource_owner_id"
    t.integer  "application_id"
    t.string   "token",             null: false
    t.string   "refresh_token"
    t.integer  "expires_in"
    t.datetime "revoked_at"
    t.datetime "created_at",        null: false
    t.string   "scopes"
  end

  add_index "oauth_access_tokens", ["refresh_token"], name: "index_oauth_access_tokens_on_refresh_token", unique: true
  add_index "oauth_access_tokens", ["resource_owner_id"], name: "index_oauth_access_tokens_on_resource_owner_id"
  add_index "oauth_access_tokens", ["token"], name: "index_oauth_access_tokens_on_token", unique: true

  create_table "oauth_applications", force: :cascade do |t|
    t.string   "name",                      null: false
    t.string   "uid",                       null: false
    t.string   "secret",                    null: false
    t.text     "redirect_uri",              null: false
    t.string   "scopes",       default: "", null: false
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  add_index "oauth_applications", ["uid"], name: "index_oauth_applications_on_uid", unique: true

  create_table "queue", primary_key: "item_id", force: :cascade do |t|
    t.string  "name",    limit: 255, default: "", null: false
    t.binary  "data"
    t.integer "expire",  limit: 4,   default: 0,  null: false
    t.integer "created", limit: 4,   default: 0,  null: false
  end

  add_index "queue", ["expire"], name: "queue_expire"
  add_index "queue", ["name", "created"], name: "name_created"

  create_table "rdf_mapping", id: false, force: :cascade do |t|
    t.string "type",    limit: 128, null: false
    t.string "bundle",  limit: 128, null: false
    t.binary "mapping"
  end

  create_table "registry", id: false, force: :cascade do |t|
    t.string  "name",     limit: 255, default: "", null: false
    t.string  "type",     limit: 9,   default: "", null: false
    t.string  "filename", limit: 255,              null: false
    t.string  "module",   limit: 255, default: "", null: false
    t.integer "weight",   limit: 4,   default: 0,  null: false
  end

  add_index "registry", ["type", "weight", "module"], name: "hook"

  create_table "registry_file", primary_key: "filename", force: :cascade do |t|
    t.string "hash", limit: 64, null: false
  end

  create_table "role", primary_key: "rid", force: :cascade do |t|
    t.string  "name",   limit: 64, default: "", null: false
    t.integer "weight", limit: 4,  default: 0,  null: false
  end

  add_index "role", ["name", "weight"], name: "name_weight"
  add_index "role", ["name"], name: "role_name", unique: true

  create_table "role_permission", id: false, force: :cascade do |t|
    t.integer "rid",        limit: 4,                null: false
    t.string  "permission", limit: 128, default: "", null: false
    t.string  "module",     limit: 255, default: "", null: false
  end

  add_index "role_permission", ["permission"], name: "permission"

  create_table "rules_config", force: :cascade do |t|
    t.string  "name",           limit: 64,                        null: false
    t.string  "label",          limit: 255, default: "unlabeled", null: false
    t.string  "plugin",         limit: 127,                       null: false
    t.integer "active",         limit: 4,   default: 1,           null: false
    t.integer "weight",         limit: 1,   default: 0,           null: false
    t.integer "status",         limit: 1,   default: 1,           null: false
    t.integer "dirty",          limit: 1,   default: 0,           null: false
    t.string  "module",         limit: 255
    t.integer "access_exposed", limit: 1,   default: 0,           null: false
    t.binary  "data"
    t.string  "owner",          limit: 255, default: "rules",     null: false
  end

  add_index "rules_config", ["name"], name: "rules_config_name", unique: true
  add_index "rules_config", ["plugin"], name: "plugin"

  create_table "rules_dependencies", id: false, force: :cascade do |t|
    t.integer "id",     limit: 4,   null: false
    t.string  "module", limit: 255, null: false
  end

  add_index "rules_dependencies", ["module"], name: "rules_dependencies_module"

  create_table "rules_scheduler", primary_key: "tid", force: :cascade do |t|
    t.string  "config",     limit: 64,    default: "", null: false
    t.integer "date",       limit: 4,                  null: false
    t.text    "data",       limit: 65535
    t.string  "identifier", limit: 255,   default: ""
    t.string  "handler",    limit: 255
  end

  add_index "rules_scheduler", ["date"], name: "date"

  create_table "rules_tags", id: false, force: :cascade do |t|
    t.integer "id",  limit: 4,   null: false
    t.string  "tag", limit: 255, null: false
  end

  create_table "rules_trigger", id: false, force: :cascade do |t|
    t.integer "id",    limit: 4,                null: false
    t.string  "event", limit: 127, default: "", null: false
  end

  create_table "search_dataset", id: false, force: :cascade do |t|
    t.integer "sid",     limit: 4,          default: 0, null: false
    t.string  "type",    limit: 16,                     null: false
    t.text    "data",    limit: 4294967295,             null: false
    t.integer "reindex", limit: 4,          default: 0, null: false
  end

  create_table "search_index", id: false, force: :cascade do |t|
    t.string  "word",  limit: 50, default: "", null: false
    t.integer "sid",   limit: 4,  default: 0,  null: false
    t.string  "type",  limit: 16,              null: false
    t.float   "score", limit: 24
  end

  add_index "search_index", ["sid", "type"], name: "sid_type"

  create_table "search_node_links", id: false, force: :cascade do |t|
    t.integer "sid",     limit: 4,          default: 0,  null: false
    t.string  "type",    limit: 16,         default: "", null: false
    t.integer "nid",     limit: 4,          default: 0,  null: false
    t.text    "caption", limit: 4294967295
  end

  add_index "search_node_links", ["nid"], name: "search_node_links_nid"

  create_table "search_total", primary_key: "word", force: :cascade do |t|
    t.float "count", limit: 24
  end

  create_table "semaphore", primary_key: "name", force: :cascade do |t|
    t.string "value",  limit: 255, default: "",  null: false
    t.float  "expire", limit: 53,  default: 0.0, null: false
  end

  add_index "semaphore", ["expire"], name: "semaphore_expire"
  add_index "semaphore", ["value"], name: "value"

  create_table "sequences", primary_key: "value", force: :cascade do |t|
  end

  create_table "sessions", id: false, force: :cascade do |t|
    t.integer "uid",       limit: 4,   default: 0,  null: false
    t.string  "sid",       limit: 128,              null: false
    t.string  "hostname",  limit: 128, default: "", null: false
    t.integer "timestamp", limit: 4,   default: 0,  null: false
    t.integer "cache",     limit: 4,   default: 0,  null: false
    t.binary  "session"
    t.string  "ssid",      limit: 128, default: "", null: false
  end

  add_index "sessions", ["ssid"], name: "ssid"
  add_index "sessions", ["timestamp"], name: "sessions_timestamp"
  add_index "sessions", ["uid"], name: "sessions_uid"

  create_table "system", primary_key: "filename", force: :cascade do |t|
    t.string  "name",           limit: 255, default: "", null: false
    t.string  "type",           limit: 12,  default: "", null: false
    t.string  "owner",          limit: 255, default: "", null: false
    t.integer "status",         limit: 4,   default: 0,  null: false
    t.integer "bootstrap",      limit: 4,   default: 0,  null: false
    t.integer "schema_version", limit: 2,   default: -1, null: false
    t.integer "weight",         limit: 4,   default: 0,  null: false
    t.binary  "info"
  end

  add_index "system", ["status", "bootstrap", "type", "weight", "name"], name: "system_list"
  add_index "system", ["type", "name"], name: "type_name"

  create_table "taxonomy_term_relation", primary_key: "trid", force: :cascade do |t|
    t.integer "tid1", limit: 4, default: 0, null: false
    t.integer "tid2", limit: 4, default: 0, null: false
  end

  add_index "taxonomy_term_relation", ["tid1", "tid2"], name: "tid1_tid2", unique: true
  add_index "taxonomy_term_relation", ["tid2"], name: "tid2"

  create_table "taxonomy_term_synonym", primary_key: "tsid", force: :cascade do |t|
    t.integer "tid",  limit: 4,   default: 0,  null: false
    t.string  "name", limit: 255, default: "", null: false
  end

  add_index "taxonomy_term_synonym", ["name", "tid"], name: "name_tid"
  add_index "taxonomy_term_synonym", ["tid"], name: "tid"

  create_table "top_searches", primary_key: "qid", force: :cascade do |t|
    t.string  "q",       limit: 255, default: ""
    t.integer "counter", limit: 4,   default: 0
  end

  add_index "top_searches", ["q"], name: "q", unique: true

  create_table "url_alias", primary_key: "pid", force: :cascade do |t|
    t.string "source",   limit: 255, default: "", null: false
    t.string "alias",    limit: 255, default: "", null: false
    t.string "language", limit: 12,  default: "", null: false
  end

  add_index "url_alias", ["alias", "language", "pid"], name: "url_alias_language"
  add_index "url_alias", ["source", "language", "pid"], name: "source_language_pid"

  create_table "users", primary_key: "uid", force: :cascade do |t|
    t.string  "name",             limit: 60,  default: "", null: false
    t.string  "pass",             limit: 128, default: "", null: false
    t.string  "mail",             limit: 254, default: ""
    t.string  "theme",            limit: 255, default: "", null: false
    t.string  "signature",        limit: 255, default: "", null: false
    t.integer "created",          limit: 4,   default: 0,  null: false
    t.integer "access",           limit: 4,   default: 0,  null: false
    t.integer "login",            limit: 4,   default: 0,  null: false
    t.integer "status",           limit: 1,   default: 0,  null: false
    t.string  "timezone",         limit: 32
    t.string  "language",         limit: 12,  default: "", null: false
    t.string  "init",             limit: 254, default: ""
    t.binary  "data"
    t.string  "signature_format", limit: 255
    t.integer "picture",          limit: 4,   default: 0,  null: false
  end

  add_index "users", ["access"], name: "users_access"
  add_index "users", ["created"], name: "created"
  add_index "users", ["mail"], name: "mail"
  add_index "users", ["name"], name: "users_name", unique: true
  add_index "users", ["picture"], name: "picture"

  create_table "users_roles", id: false, force: :cascade do |t|
    t.integer "uid", limit: 4, default: 0, null: false
    t.integer "rid", limit: 4, default: 0, null: false
  end

  add_index "users_roles", ["rid"], name: "users_roles_rid"

  create_table "variable", primary_key: "name", force: :cascade do |t|
    t.binary "value", null: false
  end

  create_table "views_display", id: false, force: :cascade do |t|
    t.integer "vid",             limit: 4,          default: 0,  null: false
    t.string  "id",              limit: 64,         default: "", null: false
    t.string  "display_title",   limit: 64,         default: "", null: false
    t.string  "display_plugin",  limit: 64,         default: "", null: false
    t.integer "position",        limit: 4,          default: 0
    t.text    "display_options", limit: 4294967295
  end

  add_index "views_display", ["vid", "position"], name: "views_display_vid"

  create_table "views_view", primary_key: "vid", force: :cascade do |t|
    t.string  "name",        limit: 128, default: "", null: false
    t.string  "description", limit: 255, default: ""
    t.string  "tag",         limit: 255, default: ""
    t.string  "base_table",  limit: 64,  default: "", null: false
    t.string  "human_name",  limit: 255, default: ""
    t.integer "core",        limit: 4,   default: 0
  end

  add_index "views_view", ["name"], name: "views_view_name", unique: true

  create_table "watchdog", primary_key: "wid", force: :cascade do |t|
    t.integer "uid",       limit: 4,          default: 0,  null: false
    t.string  "type",      limit: 64,         default: "", null: false
    t.text    "message",   limit: 4294967295,              null: false
    t.binary  "variables",                                 null: false
    t.integer "severity",  limit: 1,          default: 0,  null: false
    t.string  "link",      limit: 255,        default: ""
    t.text    "location",  limit: 65535,                   null: false
    t.text    "referer",   limit: 65535
    t.string  "hostname",  limit: 128,        default: "", null: false
    t.integer "timestamp", limit: 4,          default: 0,  null: false
  end

  add_index "watchdog", ["severity"], name: "severity"
  add_index "watchdog", ["type"], name: "watchdog_type"
  add_index "watchdog", ["uid"], name: "watchdog_uid"

  create_table "webform", primary_key: "nid", force: :cascade do |t|
    t.text    "confirmation",          limit: 65535,                            null: false
    t.string  "confirmation_format",   limit: 255
    t.string  "redirect_url",          limit: 255,   default: "<confirmation>"
    t.integer "status",                limit: 1,     default: 1,                null: false
    t.integer "block",                 limit: 1,     default: 0,                null: false
    t.integer "teaser",                limit: 1,     default: 0,                null: false
    t.integer "allow_draft",           limit: 1,     default: 0,                null: false
    t.integer "auto_save",             limit: 1,     default: 0,                null: false
    t.integer "submit_notice",         limit: 1,     default: 1,                null: false
    t.string  "submit_text",           limit: 255
    t.integer "submit_limit",          limit: 1,     default: -1,               null: false
    t.integer "submit_interval",       limit: 4,     default: -1,               null: false
    t.integer "total_submit_limit",    limit: 4,     default: -1,               null: false
    t.integer "total_submit_interval", limit: 4,     default: -1,               null: false
  end

  create_table "webform_component", id: false, force: :cascade do |t|
    t.integer "nid",       limit: 4,     default: 0, null: false
    t.integer "cid",       limit: 2,     default: 0, null: false
    t.integer "pid",       limit: 2,     default: 0, null: false
    t.string  "form_key",  limit: 128
    t.string  "name",      limit: 255
    t.string  "type",      limit: 16
    t.text    "value",     limit: 65535,             null: false
    t.text    "extra",     limit: 65535,             null: false
    t.integer "mandatory", limit: 1,     default: 0, null: false
    t.integer "weight",    limit: 2,     default: 0, null: false
  end

  create_table "webform_emails", id: false, force: :cascade do |t|
    t.integer "nid",                 limit: 4,     default: 0, null: false
    t.integer "eid",                 limit: 2,     default: 0, null: false
    t.text    "email",               limit: 65535
    t.string  "subject",             limit: 255
    t.string  "from_name",           limit: 255
    t.string  "from_address",        limit: 255
    t.text    "template",            limit: 65535
    t.text    "excluded_components", limit: 65535,             null: false
    t.integer "html",                limit: 1,     default: 0, null: false
    t.integer "attachments",         limit: 1,     default: 0, null: false
  end

  create_table "webform_last_download", id: false, force: :cascade do |t|
    t.integer "nid",       limit: 4, default: 0, null: false
    t.integer "uid",       limit: 4, default: 0, null: false
    t.integer "sid",       limit: 4, default: 0, null: false
    t.integer "requested", limit: 4, default: 0, null: false
  end

  create_table "webform_roles", id: false, force: :cascade do |t|
    t.integer "nid", limit: 4, default: 0, null: false
    t.integer "rid", limit: 4, default: 0, null: false
  end

  create_table "webform_submissions", primary_key: "sid", force: :cascade do |t|
    t.integer "nid",         limit: 4,   default: 0, null: false
    t.integer "uid",         limit: 4,   default: 0, null: false
    t.integer "is_draft",    limit: 1,   default: 0, null: false
    t.integer "submitted",   limit: 4,   default: 0, null: false
    t.string  "remote_addr", limit: 128
  end

  add_index "webform_submissions", ["nid", "sid"], name: "nid_sid"
  add_index "webform_submissions", ["nid", "uid", "sid"], name: "nid_uid_sid"
  add_index "webform_submissions", ["sid", "nid"], name: "webform_submissions_sid_nid", unique: true

  create_table "webform_submitted_data", id: false, force: :cascade do |t|
    t.integer "nid",  limit: 4,        default: 0,   null: false
    t.integer "sid",  limit: 4,        default: 0,   null: false
    t.integer "cid",  limit: 2,        default: 0,   null: false
    t.string  "no",   limit: 128,      default: "0", null: false
    t.text    "data", limit: 16777215,               null: false
  end

  add_index "webform_submitted_data", ["data"], name: "data"
  add_index "webform_submitted_data", ["nid"], name: "webform_submitted_data_nid"
  add_index "webform_submitted_data", ["sid", "nid"], name: "webform_submitted_data_sid_nid"

  create_table "wysiwyg", primary_key: "format", force: :cascade do |t|
    t.string "editor",   limit: 128,   default: "", null: false
    t.text   "settings", limit: 65535
  end

  create_table "wysiwyg_user", id: false, force: :cascade do |t|
    t.integer "uid",    limit: 4,   default: 0, null: false
    t.string  "format", limit: 255
    t.integer "status", limit: 1,   default: 0, null: false
  end

  add_index "wysiwyg_user", ["format"], name: "format"
  add_index "wysiwyg_user", ["uid"], name: "wysiwyg_user_uid"

end

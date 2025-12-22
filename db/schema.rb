# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2025_12_22_101010) do
  create_table "active_storage_attachments", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.datetime "created_at", precision: nil, null: false
    t.string "name", null: false
    t.bigint "record_id", null: false
    t.string "record_type", null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.bigint "byte_size", null: false
    t.string "checksum"
    t.string "content_type"
    t.datetime "created_at", precision: nil, null: false
    t.string "filename", null: false
    t.string "key", null: false
    t.text "metadata"
    t.string "service_name", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

  create_table "archive_phpbb3_forums", primary_key: "forum_id", id: { type: :integer, limit: 3, unsigned: true }, charset: "utf8mb3", collation: "utf8mb3_bin", options: "ENGINE=MyISAM", force: :cascade do |t|
    t.integer "display_on_index", limit: 1, default: 1, null: false, unsigned: true
    t.integer "display_subforum_list", limit: 1, default: 1, null: false, unsigned: true
    t.integer "enable_icons", limit: 1, default: 1, null: false, unsigned: true
    t.integer "enable_indexing", limit: 1, default: 1, null: false, unsigned: true
    t.integer "enable_prune", limit: 1, default: 0, null: false, unsigned: true
    t.integer "enable_shadow_prune", limit: 1, default: 0, null: false, unsigned: true
    t.text "forum_desc", null: false
    t.string "forum_desc_bitfield", limit: 255, default: "", null: false
    t.integer "forum_desc_options", default: 7, null: false, unsigned: true
    t.string "forum_desc_uid", limit: 8, default: "", null: false
    t.integer "forum_flags", limit: 1, default: 32, null: false
    t.string "forum_image", limit: 255, default: "", null: false
    t.integer "forum_last_post_id", limit: 3, default: 0, null: false, unsigned: true
    t.string "forum_last_post_subject", limit: 255, default: "", null: false
    t.integer "forum_last_post_time", default: 0, null: false, unsigned: true
    t.string "forum_last_poster_colour", limit: 6, default: "", null: false
    t.integer "forum_last_poster_id", limit: 3, default: 0, null: false, unsigned: true
    t.string "forum_last_poster_name", limit: 255, default: "", null: false
    t.string "forum_link", limit: 255, default: "", null: false
    t.string "forum_name", limit: 255, default: "", null: false
    t.integer "forum_options", default: 0, null: false, unsigned: true
    t.text "forum_parents", size: :medium, null: false
    t.string "forum_password", limit: 255, default: "", null: false
    t.integer "forum_posts_approved", limit: 3, default: 0, null: false, unsigned: true
    t.integer "forum_posts_softdeleted", limit: 3, default: 0, null: false, unsigned: true
    t.integer "forum_posts_unapproved", limit: 3, default: 0, null: false, unsigned: true
    t.text "forum_rules", null: false
    t.string "forum_rules_bitfield", limit: 255, default: "", null: false
    t.string "forum_rules_link", limit: 255, default: "", null: false
    t.integer "forum_rules_options", default: 7, null: false, unsigned: true
    t.string "forum_rules_uid", limit: 8, default: "", null: false
    t.integer "forum_status", limit: 1, default: 0, null: false
    t.integer "forum_style", limit: 3, default: 0, null: false, unsigned: true
    t.integer "forum_topics_approved", limit: 3, default: 0, null: false, unsigned: true
    t.integer "forum_topics_per_page", limit: 1, default: 0, null: false
    t.integer "forum_topics_softdeleted", limit: 3, default: 0, null: false, unsigned: true
    t.integer "forum_topics_unapproved", limit: 3, default: 0, null: false, unsigned: true
    t.integer "forum_type", limit: 1, default: 0, null: false
    t.integer "left_id", limit: 3, default: 0, null: false, unsigned: true
    t.integer "parent_id", limit: 3, default: 0, null: false, unsigned: true
    t.integer "prune_days", limit: 3, default: 0, null: false, unsigned: true
    t.integer "prune_freq", limit: 3, default: 0, null: false, unsigned: true
    t.integer "prune_next", default: 0, null: false, unsigned: true
    t.integer "prune_shadow_days", limit: 3, default: 7, null: false, unsigned: true
    t.integer "prune_shadow_freq", limit: 3, default: 1, null: false, unsigned: true
    t.integer "prune_shadow_next", default: 0, null: false
    t.integer "prune_viewed", limit: 3, default: 0, null: false, unsigned: true
    t.integer "right_id", limit: 3, default: 0, null: false, unsigned: true
    t.index ["forum_last_post_id"], name: "forum_lastpost_id"
    t.index ["left_id", "right_id"], name: "left_right_id"
  end

  create_table "archive_phpbb3_posts", primary_key: "post_id", id: { type: :integer, limit: 3, unsigned: true }, charset: "utf8mb3", collation: "utf8mb3_bin", options: "ENGINE=MyISAM", force: :cascade do |t|
    t.string "bbcode_bitfield", limit: 255, default: "", null: false
    t.string "bbcode_uid", limit: 8, default: "", null: false
    t.integer "enable_bbcode", limit: 1, default: 1, null: false, unsigned: true
    t.integer "enable_magic_url", limit: 1, default: 1, null: false, unsigned: true
    t.integer "enable_sig", limit: 1, default: 1, null: false, unsigned: true
    t.integer "enable_smilies", limit: 1, default: 1, null: false, unsigned: true
    t.integer "forum_id", limit: 3, default: 0, null: false, unsigned: true
    t.integer "icon_id", limit: 3, default: 0, null: false, unsigned: true
    t.integer "post_attachment", limit: 1, default: 0, null: false, unsigned: true
    t.string "post_checksum", limit: 32, default: "", null: false
    t.string "post_delete_reason", limit: 255, default: "", null: false
    t.integer "post_delete_time", default: 0, null: false, unsigned: true
    t.integer "post_delete_user", limit: 3, default: 0, null: false, unsigned: true
    t.integer "post_edit_count", limit: 2, default: 0, null: false, unsigned: true
    t.integer "post_edit_locked", limit: 1, default: 0, null: false, unsigned: true
    t.string "post_edit_reason", limit: 255, default: "", null: false
    t.integer "post_edit_time", default: 0, null: false, unsigned: true
    t.integer "post_edit_user", limit: 3, default: 0, null: false, unsigned: true
    t.integer "post_postcount", limit: 1, default: 1, null: false, unsigned: true
    t.integer "post_reported", limit: 1, default: 0, null: false, unsigned: true
    t.string "post_subject", limit: 255, default: "", null: false, collation: "utf8mb3_unicode_ci"
    t.text "post_text", size: :medium, null: false, collation: "utf8mb3_unicode_ci"
    t.integer "post_time", default: 0, null: false, unsigned: true
    t.string "post_username", limit: 255, default: "", null: false
    t.integer "post_visibility", limit: 1, default: 0, null: false
    t.integer "poster_id", limit: 3, default: 0, null: false, unsigned: true
    t.string "poster_ip", limit: 40, default: "", null: false
    t.integer "topic_id", limit: 3, default: 0, null: false, unsigned: true
    t.index ["forum_id"], name: "forum_id"
    t.index ["post_subject"], name: "post_subject", type: :fulltext
    t.index ["post_text", "post_subject"], name: "post_content", type: :fulltext
    t.index ["post_username"], name: "post_username"
    t.index ["post_visibility"], name: "post_visibility"
    t.index ["poster_id"], name: "poster_id"
    t.index ["poster_ip"], name: "poster_ip"
    t.index ["topic_id", "post_time"], name: "tid_post_time"
    t.index ["topic_id"], name: "topic_id"
  end

  create_table "archive_phpbb3_topics", primary_key: "topic_id", id: { type: :integer, limit: 3, unsigned: true }, charset: "utf8mb3", collation: "utf8mb3_bin", options: "ENGINE=MyISAM", force: :cascade do |t|
    t.integer "forum_id", limit: 3, default: 0, null: false, unsigned: true
    t.integer "icon_id", limit: 3, default: 0, null: false, unsigned: true
    t.integer "poll_last_vote", default: 0, null: false, unsigned: true
    t.integer "poll_length", default: 0, null: false, unsigned: true
    t.integer "poll_max_options", limit: 1, default: 1, null: false
    t.integer "poll_start", default: 0, null: false, unsigned: true
    t.string "poll_title", limit: 255, default: "", null: false
    t.integer "poll_vote_change", limit: 1, default: 0, null: false, unsigned: true
    t.boolean "poll_vote_name", default: false, null: false
    t.integer "topic_attachment", limit: 1, default: 0, null: false, unsigned: true
    t.integer "topic_bumped", limit: 1, default: 0, null: false, unsigned: true
    t.integer "topic_bumper", limit: 3, default: 0, null: false, unsigned: true
    t.string "topic_delete_reason", limit: 255, default: "", null: false
    t.integer "topic_delete_time", default: 0, null: false, unsigned: true
    t.integer "topic_delete_user", limit: 3, default: 0, null: false, unsigned: true
    t.integer "topic_first_post_id", limit: 3, default: 0, null: false, unsigned: true
    t.string "topic_first_poster_colour", limit: 6, default: "", null: false
    t.string "topic_first_poster_name", limit: 255, default: "", null: false, collation: "utf8mb3_unicode_ci"
    t.integer "topic_last_post_id", limit: 3, default: 0, null: false, unsigned: true
    t.string "topic_last_post_subject", limit: 255, default: "", null: false
    t.integer "topic_last_post_time", default: 0, null: false, unsigned: true
    t.string "topic_last_poster_colour", limit: 6, default: "", null: false
    t.integer "topic_last_poster_id", limit: 3, default: 0, null: false, unsigned: true
    t.string "topic_last_poster_name", limit: 255, default: "", null: false
    t.integer "topic_last_view_time", default: 0, null: false, unsigned: true
    t.integer "topic_moved_id", limit: 3, default: 0, null: false, unsigned: true
    t.integer "topic_poster", limit: 3, default: 0, null: false, unsigned: true
    t.integer "topic_posts_approved", limit: 3, default: 0, null: false, unsigned: true
    t.integer "topic_posts_softdeleted", limit: 3, default: 0, null: false, unsigned: true
    t.integer "topic_posts_unapproved", limit: 3, default: 0, null: false, unsigned: true
    t.integer "topic_reported", limit: 1, default: 0, null: false, unsigned: true
    t.integer "topic_status", limit: 1, default: 0, null: false
    t.integer "topic_time", default: 0, null: false, unsigned: true
    t.integer "topic_time_limit", default: 0, null: false, unsigned: true
    t.string "topic_title", limit: 255, default: "", null: false, collation: "utf8mb3_unicode_ci"
    t.integer "topic_type", limit: 1, default: 0, null: false
    t.integer "topic_views", limit: 3, default: 0, null: false, unsigned: true
    t.integer "topic_visibility", limit: 1, default: 0, null: false
    t.index ["forum_id", "topic_last_post_time", "topic_moved_id"], name: "fid_time_moved"
    t.index ["forum_id", "topic_type"], name: "forum_id_type"
    t.index ["forum_id", "topic_visibility", "topic_last_post_id"], name: "forum_vis_last"
    t.index ["forum_id"], name: "forum_id"
    t.index ["topic_last_post_time"], name: "last_post_time"
    t.index ["topic_visibility"], name: "topic_visibility"
  end

  create_table "archive_phpbb3_users", primary_key: "user_id", id: { type: :integer, limit: 3, unsigned: true }, charset: "utf8mb3", collation: "utf8mb3_bin", options: "ENGINE=MyISAM", force: :cascade do |t|
    t.integer "group_id", limit: 3, default: 3, null: false, unsigned: true
    t.string "user_actkey", limit: 32, default: "", null: false
    t.integer "user_allow_massemail", limit: 1, default: 1, null: false, unsigned: true
    t.integer "user_allow_pm", limit: 1, default: 1, null: false, unsigned: true
    t.integer "user_allow_viewemail", limit: 1, default: 1, null: false, unsigned: true
    t.integer "user_allow_viewonline", limit: 1, default: 1, null: false, unsigned: true
    t.string "user_avatar", limit: 255, default: "", null: false
    t.integer "user_avatar_height", limit: 2, default: 0, null: false, unsigned: true
    t.string "user_avatar_type", limit: 255, default: "", null: false
    t.integer "user_avatar_width", limit: 2, default: 0, null: false, unsigned: true
    t.string "user_birthday", limit: 10, default: "", null: false
    t.string "user_colour", limit: 6, default: "", null: false
    t.string "user_dateformat", limit: 64, default: "d M Y H:i", null: false
    t.string "user_email", limit: 100, default: "", null: false
    t.bigint "user_email_hash", default: 0, null: false
    t.integer "user_emailtime", default: 0, null: false, unsigned: true
    t.string "user_form_salt", limit: 32, default: "", null: false
    t.integer "user_full_folder", default: -3, null: false
    t.integer "user_inactive_reason", limit: 1, default: 0, null: false
    t.integer "user_inactive_time", default: 0, null: false, unsigned: true
    t.string "user_ip", limit: 40, default: "", null: false
    t.string "user_jabber", limit: 255, default: "", null: false
    t.string "user_lang", limit: 30, default: "", null: false
    t.string "user_last_confirm_key", limit: 10, default: "", null: false
    t.integer "user_last_privmsg", default: 0, null: false, unsigned: true
    t.integer "user_last_search", default: 0, null: false, unsigned: true
    t.integer "user_last_warning", default: 0, null: false, unsigned: true
    t.integer "user_lastmark", default: 0, null: false, unsigned: true
    t.string "user_lastpage", limit: 200, default: "", null: false
    t.integer "user_lastpost_time", default: 0, null: false, unsigned: true
    t.integer "user_lastvisit", default: 0, null: false, unsigned: true
    t.integer "user_login_attempts", limit: 1, default: 0, null: false
    t.integer "user_message_rules", limit: 1, default: 0, null: false, unsigned: true
    t.integer "user_new", limit: 1, default: 1, null: false, unsigned: true
    t.integer "user_new_privmsg", default: 0, null: false
    t.string "user_newpasswd", limit: 255, default: "", null: false
    t.integer "user_notify", limit: 1, default: 0, null: false, unsigned: true
    t.integer "user_notify_pm", limit: 1, default: 1, null: false, unsigned: true
    t.integer "user_notify_type", limit: 1, default: 0, null: false
    t.integer "user_options", default: 230271, null: false, unsigned: true
    t.integer "user_passchg", default: 0, null: false, unsigned: true
    t.string "user_password", limit: 255, default: "", null: false
    t.integer "user_perm_from", limit: 3, default: 0, null: false, unsigned: true
    t.text "user_permissions", size: :medium, null: false
    t.integer "user_post_show_days", limit: 2, default: 0, null: false, unsigned: true
    t.string "user_post_sortby_dir", limit: 1, default: "a", null: false
    t.string "user_post_sortby_type", limit: 1, default: "t", null: false
    t.integer "user_posts", limit: 3, default: 0, null: false, unsigned: true
    t.integer "user_rank", limit: 3, default: 0, null: false, unsigned: true
    t.integer "user_regdate", default: 0, null: false, unsigned: true
    t.integer "user_reminded", limit: 1, default: 0, null: false
    t.integer "user_reminded_time", default: 0, null: false, unsigned: true
    t.text "user_sig", size: :medium, null: false
    t.string "user_sig_bbcode_bitfield", limit: 255, default: "", null: false
    t.string "user_sig_bbcode_uid", limit: 8, default: "", null: false
    t.integer "user_style", limit: 3, default: 0, null: false, unsigned: true
    t.string "user_timezone", limit: 100, default: "", null: false
    t.integer "user_topic_show_days", limit: 2, default: 0, null: false, unsigned: true
    t.string "user_topic_sortby_dir", limit: 1, default: "d", null: false
    t.string "user_topic_sortby_type", limit: 1, default: "t", null: false
    t.integer "user_type", limit: 1, default: 0, null: false
    t.integer "user_unread_privmsg", default: 0, null: false
    t.integer "user_warnings", limit: 1, default: 0, null: false
    t.string "username", limit: 255, default: "", null: false
    t.string "username_clean", limit: 255, default: "", null: false
    t.index ["user_birthday"], name: "user_birthday"
    t.index ["user_email_hash"], name: "user_email_hash"
    t.index ["user_type"], name: "user_type"
    t.index ["username_clean"], name: "username_clean", unique: true
  end

  create_table "archive_registrations", id: { type: :integer, unsigned: true }, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.datetime "accepted_at", precision: nil
    t.integer "birthDay", limit: 1, default: 0, null: false, unsigned: true
    t.integer "birthMonth", limit: 1, default: 0, null: false, unsigned: true
    t.integer "birthYear", limit: 2, default: 0, null: false, unsigned: true
    t.text "comments"
    t.string "competitionId", limit: 32, default: "", null: false
    t.string "countryId", limit: 50, default: "", null: false
    t.datetime "created_at", precision: nil, null: false
    t.string "email", limit: 80, default: "", null: false
    t.string "gender", limit: 1, default: "", null: false
    t.integer "guests", default: 0, null: false
    t.text "guests_old"
    t.string "ip", limit: 16, default: "", null: false
    t.string "name", limit: 80
    t.string "personId", limit: 10, default: "", null: false
    t.datetime "updated_at", precision: nil, null: false
    t.integer "user_id"
    t.index ["competitionId", "user_id"], name: "index_registrations_on_competitionId_and_user_id", unique: true
  end

  create_table "assignments", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "assignment_code", null: false
    t.bigint "registration_id"
    t.string "registration_type"
    t.bigint "schedule_activity_id"
    t.integer "station_number"
    t.index ["registration_id", "registration_type"], name: "index_assignments_on_registration_id_and_registration_type"
    t.index ["schedule_activity_id"], name: "index_assignments_on_schedule_activity_id"
  end

  create_table "bookmarked_competitions", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "competition_id", null: false
    t.integer "user_id", null: false
    t.index ["competition_id"], name: "index_bookmarked_competitions_on_competition_id"
    t.index ["user_id"], name: "index_bookmarked_competitions_on_user_id"
  end

  create_table "cached_results", primary_key: "key_params", id: :string, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.json "payload"
    t.datetime "updated_at", null: false
  end

  create_table "championships", id: :integer, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "championship_type", null: false
    t.string "competition_id", null: false
    t.index ["championship_type"], name: "index_championships_on_championship_type"
    t.index ["competition_id", "championship_type"], name: "index_championships_on_competition_id_and_championship_type", unique: true
  end

  create_table "competition_delegates", id: :integer, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "competition_id"
    t.datetime "created_at", precision: nil, null: false
    t.integer "delegate_id"
    t.boolean "receive_registration_emails", default: false, null: false
    t.datetime "updated_at", precision: nil, null: false
    t.index ["competition_id", "delegate_id"], name: "index_competition_delegates_on_competition_id_and_delegate_id", unique: true
    t.index ["competition_id"], name: "index_competition_delegates_on_competition_id"
    t.index ["delegate_id"], name: "index_competition_delegates_on_delegate_id"
  end

  create_table "competition_events", id: :integer, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "competition_id", null: false
    t.string "event_id", null: false
    t.integer "fee_lowest_denomination", default: 0, null: false
    t.text "qualification"
    t.index ["competition_id", "event_id"], name: "index_competition_events_on_competition_id_and_event_id", unique: true
    t.index ["event_id"], name: "fk_rails_ba6cfdafb1"
  end

  create_table "competition_media", id: { type: :integer, unsigned: true }, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "competition_id", limit: 32, default: "", null: false
    t.timestamp "decided_at"
    t.string "media_type", limit: 15, default: "", null: false
    t.string "status", limit: 10, default: "", null: false
    t.timestamp "submitted_at", default: -> { "CURRENT_TIMESTAMP" }, null: false
    t.text "submitter_comment"
    t.string "submitter_email", default: "", null: false
    t.string "submitter_name", default: "", null: false
    t.string "text", limit: 100, default: "", null: false
    t.text "uri"
  end

  create_table "competition_organizers", id: :integer, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "competition_id"
    t.datetime "created_at", precision: nil, null: false
    t.integer "organizer_id"
    t.boolean "receive_registration_emails", default: false, null: false
    t.datetime "updated_at", precision: nil, null: false
    t.index ["competition_id", "organizer_id"], name: "idx_competition_organizers_on_competition_id_and_organizer_id", unique: true
    t.index ["competition_id"], name: "index_competition_organizers_on_competition_id"
    t.index ["organizer_id"], name: "index_competition_organizers_on_organizer_id"
  end

  create_table "competition_payment_integrations", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "competition_id", null: false
    t.bigint "connected_account_id", null: false
    t.string "connected_account_type", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["competition_id"], name: "index_competition_payment_integrations_on_competition_id"
    t.index ["connected_account_type", "connected_account_id"], name: "index_competition_payment_integrations_on_connected_account"
  end

  create_table "competition_series", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.datetime "created_at", precision: nil, null: false
    t.string "name"
    t.string "short_name"
    t.datetime "updated_at", precision: nil, null: false
    t.string "wcif_id", null: false
  end

  create_table "competition_tabs", id: :integer, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "competition_id"
    t.text "content"
    t.integer "display_order"
    t.string "name", limit: 255
    t.index ["competition_id"], name: "index_competition_tabs_on_competition_id"
    t.index ["display_order", "competition_id"], name: "index_competition_tabs_on_display_order_and_competition_id", unique: true
  end

  create_table "competition_venues", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "competition_id", null: false
    t.string "country_iso2", null: false
    t.datetime "created_at", precision: nil, null: false
    t.integer "latitude_microdegrees", null: false
    t.integer "longitude_microdegrees", null: false
    t.string "name", null: false
    t.string "timezone_id", null: false
    t.datetime "updated_at", precision: nil, null: false
    t.integer "wcif_id", null: false
    t.index ["competition_id", "wcif_id"], name: "index_competition_venues_on_competition_id_and_wcif_id", unique: true
    t.index ["competition_id"], name: "index_competition_venues_on_competition_id"
  end

  create_table "competitions", id: { type: :string, limit: 32, default: "" }, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.boolean "allow_registration_edits", default: false, null: false
    t.boolean "allow_registration_without_qualification", default: false
    t.datetime "announced_at", precision: nil
    t.integer "announced_by"
    t.integer "auto_accept_disable_threshold"
    t.integer "auto_accept_preference", default: 0, null: false
    t.integer "auto_close_threshold"
    t.integer "base_entry_fee_lowest_denomination"
    t.datetime "cancelled_at", precision: nil
    t.integer "cancelled_by"
    t.string "cell_name", limit: 45, default: "", null: false
    t.string "city_name", limit: 50, default: "", null: false
    t.integer "competition_series_id"
    t.integer "competitor_can_cancel", default: 0, null: false
    t.integer "competitor_limit"
    t.boolean "competitor_limit_enabled"
    t.text "competitor_limit_reason"
    t.datetime "confirmed_at", precision: nil
    t.string "connected_stripe_account_id", limit: 255
    t.string "contact", limit: 255
    t.string "country_id", limit: 50, default: "", null: false
    t.datetime "created_at", precision: nil
    t.string "currency_code", limit: 255, default: "USD"
    t.boolean "early_puzzle_submission"
    t.text "early_puzzle_submission_reason"
    t.boolean "enable_donations"
    t.date "end_date"
    t.datetime "event_change_deadline_date", precision: nil
    t.boolean "event_restrictions"
    t.text "event_restrictions_reason"
    t.integer "events_per_registration_limit"
    t.string "external_registration_page", limit: 200
    t.string "external_website", limit: 200
    t.text "extra_registration_requirements"
    t.boolean "forbid_newcomers", default: false, null: false
    t.string "forbid_newcomers_reason"
    t.boolean "force_comment_in_registration"
    t.boolean "generate_website"
    t.integer "guest_entry_status", default: 0, null: false
    t.boolean "guests_enabled", default: true, null: false
    t.integer "guests_entry_fee_lowest_denomination"
    t.integer "guests_per_registration_limit"
    t.text "information", size: :medium
    t.integer "latitude"
    t.integer "longitude"
    t.string "main_event_id"
    t.string "name", limit: 50, default: "", null: false
    t.string "name_reason"
    t.integer "newcomer_month_reserved_spots"
    t.integer "on_the_spot_entry_fee_lowest_denomination"
    t.boolean "on_the_spot_registration"
    t.integer "posting_by"
    t.boolean "qualification_results"
    t.text "qualification_results_reason"
    t.datetime "refund_policy_limit_date", precision: nil
    t.integer "refund_policy_percent"
    t.datetime "registration_close", precision: nil
    t.datetime "registration_open", precision: nil
    t.datetime "registration_reminder_sent_at", precision: nil
    t.text "remarks"
    t.datetime "results_nag_sent_at", precision: nil
    t.datetime "results_posted_at", precision: nil
    t.integer "results_posted_by"
    t.datetime "results_submitted_at", precision: nil
    t.boolean "show_at_all", default: false, null: false
    t.date "start_date"
    t.datetime "updated_at", precision: nil
    t.boolean "use_wca_live_for_scoretaking", default: false, null: false
    t.boolean "use_wca_registration", default: true, null: false
    t.string "venue", limit: 240, default: "", null: false
    t.string "venue_address"
    t.string "venue_details"
    t.datetime "waiting_list_deadline_date", precision: nil
    t.index ["cancelled_at"], name: "index_competitions_on_cancelled_at"
    t.index ["country_id"], name: "index_Competitions_on_countryId"
    t.index ["end_date"], name: "index_competitions_on_end_date"
    t.index ["start_date"], name: "index_competitions_on_start_date"
  end

  create_table "concise_average_results", id: false, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.integer "average", default: 0, null: false
    t.string "continent_id", limit: 50, default: "", null: false
    t.string "country_id", limit: 50, default: "", null: false
    t.integer "day", limit: 2, default: 0, null: false, unsigned: true
    t.string "event_id", limit: 6, default: "", null: false
    t.integer "id", default: 0, null: false
    t.integer "month", limit: 2, default: 0, null: false, unsigned: true
    t.string "person_id", limit: 10, default: "", null: false
    t.bigint "value_and_id"
    t.integer "year", limit: 2, default: 0, null: false, unsigned: true
  end

  create_table "concise_single_results", id: false, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.integer "best", default: 0, null: false
    t.string "continent_id", limit: 50, default: "", null: false
    t.string "country_id", limit: 50, default: "", null: false
    t.integer "day", limit: 2, default: 0, null: false, unsigned: true
    t.string "event_id", limit: 6, default: "", null: false
    t.integer "id", default: 0, null: false
    t.integer "month", limit: 2, default: 0, null: false, unsigned: true
    t.string "person_id", limit: 10, default: "", null: false
    t.bigint "value_and_id"
    t.integer "year", limit: 2, default: 0, null: false, unsigned: true
  end

  create_table "connected_paypal_accounts", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "account_status"
    t.string "consent_status"
    t.datetime "created_at", null: false
    t.string "paypal_merchant_id"
    t.string "permissions_granted"
    t.datetime "updated_at", null: false
  end

  create_table "connected_stripe_accounts", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "account_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "continents", id: { type: :string, limit: 50, default: "" }, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.integer "latitude", default: 0, null: false
    t.integer "longitude", default: 0, null: false
    t.string "name", limit: 50, default: "", null: false
    t.string "record_name", limit: 3, default: "", null: false
    t.integer "zoom", limit: 1, default: 0, null: false
  end

  create_table "countries", id: { type: :string, limit: 50, default: "" }, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "continent_id", limit: 50, default: "", null: false
    t.string "iso2", limit: 2
    t.string "name", limit: 50, default: "", null: false
    t.index ["continent_id"], name: "fk_continents"
    t.index ["iso2"], name: "iso2", unique: true
  end

  create_table "country_band_details", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.integer "due_amount_per_competitor_us_cents", null: false
    t.integer "due_percent_registration_fee", null: false
    t.date "end_date"
    t.integer "number", null: false
    t.date "start_date", null: false
    t.datetime "updated_at", null: false
  end

  create_table "country_bands", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "iso2", limit: 2, null: false
    t.integer "number", null: false
    t.index ["iso2"], name: "index_country_bands_on_iso2", unique: true
    t.index ["number"], name: "index_country_bands_on_number"
  end

  create_table "cronjob_statistics", primary_key: "name", id: :string, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.bigint "average_runtime"
    t.datetime "enqueued_at", precision: nil
    t.text "last_error_message"
    t.boolean "last_run_successful", default: false, null: false
    t.integer "recently_errored", default: 0, null: false
    t.integer "recently_rejected", default: 0, null: false
    t.datetime "run_end", precision: nil
    t.datetime "run_start", precision: nil
    t.datetime "successful_run_start", precision: nil
    t.integer "times_completed", default: 0, null: false
  end

  create_table "delegate_reports", id: :integer, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "competition_id"
    t.datetime "created_at", precision: nil, null: false
    t.string "discussion_url", limit: 255
    t.text "equipment"
    t.text "incidents"
    t.datetime "nag_sent_at", precision: nil
    t.text "organization"
    t.datetime "posted_at", precision: nil
    t.integer "posted_by_user_id"
    t.text "remarks"
    t.datetime "reminder_sent_at", precision: nil
    t.string "schedule_url", limit: 255
    t.text "summary"
    t.datetime "updated_at", precision: nil, null: false
    t.text "venue"
    t.integer "version", default: 0, null: false
    t.boolean "wic_feedback_requested", default: false, null: false
    t.string "wic_incidents"
    t.boolean "wrc_feedback_requested", default: false, null: false
    t.string "wrc_incidents"
    t.integer "wrc_primary_user_id"
    t.integer "wrc_secondary_user_id"
    t.index ["competition_id"], name: "index_delegate_reports_on_competition_id", unique: true
  end

  create_table "duplicate_checker_job_runs", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "competition_id", null: false
    t.datetime "created_at", null: false
    t.datetime "end_time"
    t.string "run_status", null: false
    t.datetime "start_time"
    t.datetime "updated_at", null: false
    t.index ["competition_id"], name: "index_duplicate_checker_job_runs_on_competition_id"
  end

  create_table "eligible_country_iso2s_for_championship", id: false, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "championship_type", null: false
    t.string "eligible_country_iso2", null: false
    t.index ["championship_type", "eligible_country_iso2"], name: "index_eligible_iso2s_for_championship_on_type_and_country_iso2", unique: true
  end

  create_table "events", id: { type: :string, limit: 6, default: "" }, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "format", limit: 10, default: "", null: false
    t.string "name", limit: 54, default: "", null: false
    t.integer "rank", default: 0, null: false
  end

  create_table "formats", id: { type: :string, limit: 1, default: "" }, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.integer "expected_solve_count", null: false
    t.string "name", limit: 50, default: "", null: false
    t.string "sort_by", limit: 255, null: false
    t.string "sort_by_second", limit: 255, null: false
    t.integer "trim_fastest_n", null: false
    t.integer "trim_slowest_n", null: false
  end

  create_table "groups_metadata_board", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "email"
    t.datetime "updated_at", null: false
  end

  create_table "groups_metadata_councils", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "email"
    t.string "friendly_id"
    t.datetime "updated_at", null: false
  end

  create_table "groups_metadata_delegate_regions", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "email"
    t.string "friendly_id"
    t.datetime "updated_at", null: false
  end

  create_table "groups_metadata_teams_committees", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "email"
    t.string "friendly_id"
    t.string "preferred_contact_mode", default: "email", null: false
    t.datetime "updated_at", null: false
  end

  create_table "groups_metadata_translators", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "locale"
    t.datetime "updated_at", null: false
  end

  create_table "inbox_persons", id: false, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "competition_id", limit: 32, null: false
    t.string "country_iso2", limit: 2, default: "", null: false
    t.date "dob", null: false
    t.string "gender", limit: 1, default: ""
    t.string "id", limit: 10, null: false
    t.string "name", limit: 80
    t.string "wca_id", limit: 10, default: "", null: false
    t.index ["competition_id", "id"], name: "index_InboxPersons_on_competitionId_and_id", unique: true
    t.index ["country_iso2"], name: "InboxPersons_fk_country"
    t.index ["name"], name: "InboxPersons_name"
    t.index ["wca_id"], name: "InboxPersons_id"
  end

  create_table "inbox_results", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.integer "average", default: 0, null: false
    t.integer "best", default: 0, null: false
    t.string "competition_id", limit: 32, default: "", null: false
    t.string "event_id", limit: 6, default: "", null: false
    t.string "format_id", limit: 1, default: "", null: false
    t.string "person_id", limit: 20, null: false
    t.integer "pos", limit: 2, default: 0, null: false
    t.integer "round_id", null: false
    t.string "round_type_id", limit: 1, default: "", null: false
    t.integer "value1", default: 0, null: false
    t.integer "value2", default: 0, null: false
    t.integer "value3", default: 0, null: false
    t.integer "value4", default: 0, null: false
    t.integer "value5", default: 0, null: false
    t.index ["competition_id"], name: "InboxResults_fk_tournament"
    t.index ["event_id"], name: "InboxResults_fk_event"
    t.index ["format_id"], name: "InboxResults_fk_format"
    t.index ["round_id"], name: "index_inbox_results_on_round_id"
    t.index ["round_type_id"], name: "InboxResults_fk_round"
  end

  create_table "inbox_scramble_sets", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "competition_id", null: false
    t.datetime "created_at", null: false
    t.string "event_id", null: false
    t.bigint "external_upload_id"
    t.integer "matched_round_id"
    t.integer "ordered_index", null: false
    t.integer "round_number", null: false
    t.integer "scramble_set_number", null: false
    t.datetime "updated_at", null: false
    t.index ["competition_id", "event_id", "round_number"], name: "idx_on_competition_id_event_id_round_number_063e808d5f"
    t.index ["competition_id"], name: "index_inbox_scramble_sets_on_competition_id"
    t.index ["event_id"], name: "fk_rails_7a55abc2f3"
    t.index ["external_upload_id"], name: "index_inbox_scramble_sets_on_external_upload_id"
    t.index ["matched_round_id"], name: "index_inbox_scramble_sets_on_matched_round_id"
  end

  create_table "inbox_scrambles", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "inbox_scramble_set_id", null: false
    t.boolean "is_extra", default: false, null: false
    t.bigint "matched_scramble_set_id"
    t.integer "ordered_index", null: false
    t.integer "scramble_number", null: false
    t.text "scramble_string", null: false
    t.datetime "updated_at", null: false
    t.index ["inbox_scramble_set_id", "scramble_number", "is_extra"], name: "idx_on_inbox_scramble_set_id_scramble_number_is_ext_bd518aa059", unique: true
    t.index ["inbox_scramble_set_id"], name: "index_inbox_scrambles_on_inbox_scramble_set_id"
    t.index ["matched_scramble_set_id"], name: "index_inbox_scrambles_on_matched_scramble_set_id"
  end

  create_table "incident_competitions", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "comments"
    t.string "competition_id", null: false
    t.bigint "incident_id", null: false
    t.index ["incident_id", "competition_id"], name: "index_incident_competitions_on_incident_id_and_competition_id", unique: true
    t.index ["incident_id"], name: "index_incident_competitions_on_incident_id"
  end

  create_table "incident_tags", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.bigint "incident_id", null: false
    t.string "tag", null: false
    t.index ["incident_id", "tag"], name: "index_incident_tags_on_incident_id_and_tag", unique: true
    t.index ["incident_id"], name: "index_incident_tags_on_incident_id"
    t.index ["tag"], name: "index_incident_tags_on_tag"
  end

  create_table "incidents", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.datetime "created_at", precision: nil, null: false
    t.datetime "digest_sent_at", precision: nil
    t.boolean "digest_worthy", default: false
    t.text "private_description"
    t.text "private_wrc_decision"
    t.text "public_summary"
    t.datetime "resolved_at", precision: nil
    t.string "title"
    t.datetime "updated_at", precision: nil, null: false
  end

  create_table "linked_rounds", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "wcif_id"
  end

  create_table "live_attempt_history_entries", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "entered_at", null: false
    t.string "entered_by", null: false
    t.bigint "live_attempt_id", null: false
    t.integer "result", null: false
    t.datetime "updated_at", null: false
    t.index ["live_attempt_id"], name: "index_live_attempt_history_entries_on_live_attempt_id"
  end

  create_table "live_attempts", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.integer "attempt_number", null: false
    t.datetime "created_at", null: false
    t.bigint "live_result_id"
    t.integer "result", null: false
    t.datetime "updated_at", null: false
    t.index ["live_result_id"], name: "index_live_attempts_on_live_result_id"
  end

  create_table "live_results", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.boolean "advancing", default: false, null: false
    t.boolean "advancing_questionable", default: false, null: false
    t.integer "average", null: false
    t.string "average_record_tag", limit: 255
    t.integer "best", null: false
    t.datetime "created_at", null: false
    t.integer "global_pos"
    t.datetime "last_attempt_entered_at", null: false
    t.integer "local_pos"
    t.bigint "registration_id", null: false
    t.bigint "round_id", null: false
    t.string "single_record_tag", limit: 255
    t.datetime "updated_at", null: false
    t.index ["registration_id", "round_id"], name: "index_live_results_on_registration_id_and_round_id", unique: true
    t.index ["registration_id"], name: "index_live_results_on_registration_id"
    t.index ["round_id"], name: "index_live_results_on_round_id"
  end

  create_table "locations", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.datetime "created_at", precision: nil, null: false
    t.integer "latitude_microdegrees"
    t.integer "longitude_microdegrees"
    t.integer "notification_radius_km"
    t.datetime "updated_at", precision: nil, null: false
    t.integer "user_id", null: false
  end

  create_table "manual_payment_integrations", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "payment_instructions", null: false
    t.string "payment_reference_label", null: false
    t.datetime "updated_at", null: false
  end

  create_table "oauth_access_grants", id: :integer, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.integer "application_id", null: false
    t.datetime "created_at", precision: nil, null: false
    t.integer "expires_in", null: false
    t.text "redirect_uri"
    t.integer "resource_owner_id", null: false
    t.datetime "revoked_at", precision: nil
    t.string "scopes", limit: 255
    t.string "token", null: false
    t.index ["token"], name: "index_oauth_access_grants_on_token", unique: true
  end

  create_table "oauth_access_tokens", id: :integer, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.integer "application_id"
    t.datetime "created_at", precision: nil, null: false
    t.integer "expires_in"
    t.string "refresh_token"
    t.integer "resource_owner_id"
    t.datetime "revoked_at", precision: nil
    t.string "scopes", limit: 255
    t.string "token", null: false
    t.index ["refresh_token"], name: "index_oauth_access_tokens_on_refresh_token", unique: true
    t.index ["resource_owner_id"], name: "index_oauth_access_tokens_on_resource_owner_id"
    t.index ["token"], name: "index_oauth_access_tokens_on_token", unique: true
  end

  create_table "oauth_applications", id: :integer, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.boolean "confidential", default: true, null: false
    t.datetime "created_at", precision: nil
    t.boolean "dangerously_allow_any_redirect_uri", default: false, null: false
    t.string "name", limit: 255, null: false
    t.integer "owner_id"
    t.string "owner_type"
    t.text "redirect_uri"
    t.string "scopes", limit: 255, default: "", null: false
    t.string "secret", limit: 255, null: false
    t.boolean "superapp", default: false, null: false
    t.string "uid", null: false
    t.datetime "updated_at", precision: nil
    t.index ["owner_id", "owner_type"], name: "index_oauth_applications_on_owner_id_and_owner_type"
    t.index ["uid"], name: "index_oauth_applications_on_uid", unique: true
  end

  create_table "oauth_openid_requests", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.integer "access_grant_id", null: false
    t.string "nonce", null: false
    t.index ["access_grant_id"], name: "index_oauth_openid_requests_on_access_grant_id"
  end

  create_table "payment_intents", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.datetime "canceled_at", precision: nil
    t.bigint "cancellation_source_id"
    t.string "cancellation_source_type"
    t.text "client_secret"
    t.bigint "confirmation_source_id"
    t.string "confirmation_source_type"
    t.datetime "confirmed_at", precision: nil
    t.datetime "created_at", precision: nil, null: false
    t.text "error_details"
    t.bigint "holder_id"
    t.string "holder_type"
    t.integer "initiated_by_id"
    t.bigint "payment_record_id"
    t.string "payment_record_type"
    t.datetime "updated_at", precision: nil, null: false
    t.string "wca_status"
    t.index ["cancellation_source_type", "cancellation_source_id"], name: "index_stripe_payment_intents_on_canceled_by"
    t.index ["confirmation_source_type", "confirmation_source_id"], name: "index_stripe_payment_intents_on_confirmed_by"
    t.index ["holder_type", "holder_id"], name: "index_payment_intents_on_holder"
    t.index ["initiated_by_id"], name: "fk_rails_2dbc373c0c"
    t.index ["payment_record_id"], name: "index_payment_intents_on_payment_record_id"
  end

  create_table "paypal_records", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "amount_paypal_denomination"
    t.datetime "created_at", null: false
    t.datetime "created_at_remote"
    t.string "currency_code"
    t.string "merchant_id"
    t.text "parameters", null: false
    t.bigint "parent_record_id"
    t.string "paypal_id"
    t.string "paypal_record_type"
    t.string "paypal_status", null: false
    t.datetime "updated_at", null: false
    t.datetime "updated_at_remote"
    t.index ["parent_record_id"], name: "index_paypal_records_on_parent_record_id"
  end

  create_table "persons", id: :integer, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "comments", limit: 40, default: "", null: false
    t.string "country_id", limit: 50, default: "", null: false
    t.date "dob"
    t.string "gender", limit: 1, default: ""
    t.integer "incorrect_wca_id_claim_count", default: 0, null: false
    t.string "name", limit: 80
    t.integer "sub_id", limit: 1, default: 1, null: false
    t.string "wca_id", limit: 10, default: "", null: false
    t.index ["country_id"], name: "Persons_fk_country"
    t.index ["name"], name: "Persons_name"
    t.index ["name"], name: "index_persons_on_name", type: :fulltext
    t.index ["wca_id", "sub_id"], name: "index_Persons_on_wca_id_and_subId", unique: true
    t.index ["wca_id"], name: "index_persons_on_wca_id"
  end

  create_table "poll_options", id: :integer, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "description", limit: 200, null: false
    t.integer "poll_id", null: false
    t.index ["poll_id"], name: "poll_id"
  end

  create_table "polls", id: :integer, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.text "comment"
    t.datetime "confirmed_at", precision: nil
    t.datetime "created_at", precision: nil, null: false
    t.datetime "deadline", precision: nil, null: false
    t.boolean "multiple", null: false
    t.text "question"
    t.datetime "updated_at", precision: nil, null: false
  end

  create_table "post_tags", id: :integer, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.integer "post_id", null: false
    t.string "tag", null: false
    t.index ["post_id", "tag"], name: "index_post_tags_on_post_id_and_tag", unique: true
    t.index ["post_id"], name: "index_post_tags_on_post_id"
    t.index ["tag"], name: "index_post_tags_on_tag"
  end

  create_table "posts", id: :integer, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.integer "author_id"
    t.text "body"
    t.datetime "created_at", precision: nil, null: false
    t.boolean "show_on_homepage", default: true, null: false
    t.string "slug", default: "", null: false
    t.boolean "sticky", default: false, null: false
    t.string "title", limit: 255, default: "", null: false
    t.date "unstick_at"
    t.datetime "updated_at", precision: nil, null: false
    t.index ["created_at"], name: "index_posts_on_world_readable_and_created_at"
    t.index ["show_on_homepage", "sticky", "created_at"], name: "idx_show_wr_sticky_created_at"
    t.index ["slug"], name: "index_posts_on_slug", unique: true
    t.index ["sticky", "created_at"], name: "index_posts_on_world_readable_and_sticky_and_created_at"
  end

  create_table "potential_duplicate_persons", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "duplicate_checker_job_run_id", null: false
    t.integer "duplicate_person_id", null: false
    t.string "name_matching_algorithm", null: false
    t.integer "original_user_id", null: false
    t.integer "score", null: false
    t.datetime "updated_at", null: false
    t.index ["duplicate_checker_job_run_id"], name: "idx_on_duplicate_checker_job_run_id_12b05a3796"
    t.index ["duplicate_person_id"], name: "index_potential_duplicate_persons_on_duplicate_person_id"
    t.index ["original_user_id"], name: "index_potential_duplicate_persons_on_original_user_id"
  end

  create_table "preferred_formats", id: false, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "event_id", null: false
    t.string "format_id", null: false
    t.integer "ranking", null: false
    t.index ["event_id", "format_id"], name: "index_preferred_formats_on_event_id_and_format_id", unique: true
    t.index ["format_id"], name: "fk_rails_c3e0098ed3"
  end

  create_table "ranks_average", id: :integer, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.integer "best", default: 0, null: false
    t.integer "continent_rank", default: 0, null: false
    t.integer "country_rank", default: 0, null: false
    t.string "event_id", limit: 6, default: "", null: false
    t.string "person_id", limit: 10, default: "", null: false
    t.integer "world_rank", default: 0, null: false
    t.index ["event_id"], name: "fk_events"
    t.index ["person_id"], name: "fk_persons"
  end

  create_table "ranks_single", id: :integer, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.integer "best", default: 0, null: false
    t.integer "continent_rank", default: 0, null: false
    t.integer "country_rank", default: 0, null: false
    t.string "event_id", limit: 6, default: "", null: false
    t.string "person_id", limit: 10, default: "", null: false
    t.integer "world_rank", default: 0, null: false
    t.index ["event_id"], name: "fk_events"
    t.index ["person_id"], name: "fk_persons"
  end

  create_table "regional_organizations", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "address", null: false
    t.text "area_description", null: false
    t.string "country", null: false
    t.datetime "created_at", precision: nil, null: false
    t.text "directors_and_officers", null: false
    t.string "email", null: false
    t.date "end_date"
    t.text "extra_information"
    t.text "future_plans", null: false
    t.string "name", null: false
    t.text "past_and_current_activities", null: false
    t.date "start_date"
    t.datetime "updated_at", precision: nil, null: false
    t.string "website", null: false
    t.index ["country"], name: "index_regional_organizations_on_country"
    t.index ["name"], name: "index_regional_organizations_on_name"
  end

  create_table "regional_records_lookup", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.integer "average", default: 0, null: false
    t.integer "best", default: 0, null: false
    t.date "competition_end_date", null: false
    t.string "country_id", null: false
    t.string "event_id", null: false
    t.integer "result_id", null: false
    t.index ["event_id", "country_id", "average", "competition_end_date"], name: "idx_on_eventId_countryId_average_competitionEndDate_b424c59953"
    t.index ["event_id", "country_id", "best", "competition_end_date"], name: "idx_on_eventId_countryId_best_competitionEndDate_4e01b1ae38"
    t.index ["result_id"], name: "index_regional_records_lookup_on_resultId"
  end

  create_table "registration_competition_events", id: :integer, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.integer "competition_event_id"
    t.integer "registration_id"
    t.index ["competition_event_id"], name: "index_registration_competition_events_on_competition_event_id"
    t.index ["registration_id", "competition_event_id"], name: "idx_registration_competition_events_on_reg_id_and_comp_event_id", unique: true
    t.index ["registration_id", "competition_event_id"], name: "index_reg_events_reg_id_comp_event_id"
    t.index ["registration_id"], name: "index_registration_competition_events_on_registration_id"
  end

  create_table "registration_history_changes", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "key"
    t.bigint "registration_history_entry_id"
    t.datetime "updated_at", null: false
    t.text "value"
    t.index ["registration_history_entry_id"], name: "idx_on_registration_history_entry_id_e1e6e4bed0"
  end

  create_table "registration_history_entries", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "action"
    t.string "actor_id"
    t.string "actor_type"
    t.datetime "created_at", null: false
    t.bigint "registration_id"
    t.datetime "updated_at", null: false
    t.index ["registration_id"], name: "index_registration_history_entries_on_registration_id"
  end

  create_table "registration_payments", id: :integer, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.integer "amount_lowest_denomination"
    t.datetime "created_at", precision: nil, null: false
    t.string "currency_code", limit: 255
    t.boolean "is_completed", default: true, null: false
    t.datetime "paid_at"
    t.bigint "receipt_id"
    t.string "receipt_type"
    t.integer "refunded_registration_payment_id"
    t.integer "registration_id"
    t.string "stripe_charge_id"
    t.datetime "updated_at", precision: nil, null: false
    t.integer "user_id"
    t.index ["receipt_type", "receipt_id"], name: "index_registration_payments_on_receipt"
    t.index ["refunded_registration_payment_id"], name: "idx_reg_payments_on_refunded_registration_payment_id"
    t.index ["registration_id"], name: "index_registration_payments_on_registration_id"
    t.index ["stripe_charge_id"], name: "index_registration_payments_on_stripe_charge_id"
  end

  create_table "registrations", id: { type: :integer, unsigned: true }, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.datetime "accepted_at", precision: nil
    t.integer "accepted_by"
    t.text "administrative_notes"
    t.text "comments"
    t.string "competing_status", default: "pending", null: false
    t.string "competition_id", limit: 32, default: "", null: false
    t.datetime "created_at", precision: nil, null: false
    t.datetime "deleted_at", precision: nil
    t.integer "deleted_by"
    t.integer "guests", default: 0, null: false
    t.string "ip", limit: 16, default: "", null: false
    t.boolean "is_competing", default: true
    t.datetime "registered_at", null: false
    t.integer "registrant_id", null: false
    t.text "roles"
    t.datetime "updated_at", precision: nil, null: false
    t.integer "user_id"
    t.index ["competition_id", "competing_status"], name: "index_registrations_on_competition_id_and_competing_status"
    t.index ["competition_id", "registrant_id"], name: "index_registrations_on_competition_id_and_registrant_id", unique: true
    t.index ["competition_id", "user_id"], name: "index_registrations_on_competition_id_and_user_id", unique: true
    t.index ["competition_id"], name: "index_registrations_on_competition_id"
    t.index ["user_id"], name: "index_registrations_on_user_id"
  end

  create_table "result_attempts", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.integer "attempt_number", null: false
    t.datetime "created_at", null: false
    t.bigint "result_id", null: false
    t.datetime "updated_at", null: false
    t.integer "value", null: false
    t.index ["result_id", "attempt_number"], name: "index_result_attempts_on_result_id_and_attempt_number", unique: true
    t.index ["result_id"], name: "index_result_attempts_on_result_id"
  end

  create_table "results", id: :integer, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.integer "average", default: 0, null: false
    t.integer "best", default: 0, null: false
    t.string "competition_id", limit: 32, default: "", null: false
    t.string "country_id", limit: 50, default: "", null: false
    t.string "event_id", limit: 6, default: "", null: false
    t.string "format_id", limit: 1, default: "", null: false
    t.string "person_id", limit: 10, default: "", null: false
    t.string "person_name", limit: 80, default: "", null: false
    t.integer "pos", limit: 2, default: 0, null: false
    t.string "regional_average_record", limit: 3
    t.string "regional_single_record", limit: 3
    t.integer "round_id", null: false
    t.string "round_type_id", limit: 1, default: "", null: false
    t.timestamp "updated_at", default: -> { "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP" }, null: false
    t.integer "value1", default: 0, null: false
    t.integer "value2", default: 0, null: false
    t.integer "value3", default: 0, null: false
    t.integer "value4", default: 0, null: false
    t.integer "value5", default: 0, null: false
    t.index ["competition_id", "updated_at"], name: "index_Results_on_competitionId_and_updated_at"
    t.index ["competition_id"], name: "Results_fk_tournament"
    t.index ["country_id"], name: "_tmp_index_Results_on_countryId"
    t.index ["event_id", "average"], name: "Results_eventAndAverage"
    t.index ["event_id", "best"], name: "Results_eventAndBest"
    t.index ["event_id", "competition_id", "round_type_id", "country_id", "average"], name: "Results_regionalAverageRecordCheckSpeedup"
    t.index ["event_id", "competition_id", "round_type_id", "country_id", "best"], name: "Results_regionalSingleRecordCheckSpeedup"
    t.index ["event_id", "value1"], name: "index_Results_on_eventId_and_value1"
    t.index ["event_id", "value2"], name: "index_Results_on_eventId_and_value2"
    t.index ["event_id", "value3"], name: "index_Results_on_eventId_and_value3"
    t.index ["event_id", "value4"], name: "index_Results_on_eventId_and_value4"
    t.index ["event_id", "value5"], name: "index_Results_on_eventId_and_value5"
    t.index ["event_id"], name: "Results_fk_event"
    t.index ["format_id"], name: "Results_fk_format"
    t.index ["person_id"], name: "Results_fk_competitor"
    t.index ["regional_average_record", "event_id"], name: "index_Results_on_regionalAverageRecord_and_eventId"
    t.index ["regional_single_record", "event_id"], name: "index_Results_on_regionalSingleRecord_and_eventId"
    t.index ["round_id", "person_id"], name: "results_person_uniqueness_speedup"
    t.index ["round_id"], name: "index_results_on_round_id"
    t.index ["round_type_id"], name: "Results_fk_round"
  end

  create_table "roles_metadata_banned_competitors", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "ban_reason"
    t.datetime "created_at", null: false
    t.string "scope"
    t.datetime "updated_at", null: false
  end

  create_table "roles_metadata_councils", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "status"
    t.datetime "updated_at", null: false
  end

  create_table "roles_metadata_delegate_regions", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.date "first_delegated"
    t.date "last_delegated"
    t.string "location"
    t.string "status"
    t.integer "total_delegated"
    t.datetime "updated_at", null: false
  end

  create_table "roles_metadata_officers", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "status"
    t.datetime "updated_at", null: false
  end

  create_table "roles_metadata_teams_committees", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "status"
    t.datetime "updated_at", null: false
  end

  create_table "round_types", id: { type: :string, limit: 1, default: "" }, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "cell_name", limit: 45, default: "", null: false
    t.boolean "final", null: false
    t.string "name", limit: 50, default: "", null: false
    t.integer "rank", default: 0, null: false
  end

  create_table "rounds", id: :integer, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.text "advancement_condition"
    t.integer "competition_event_id", null: false
    t.datetime "created_at", precision: nil, null: false
    t.text "cutoff"
    t.string "format_id", limit: 255, null: false
    t.boolean "is_h2h_mock", default: false, null: false
    t.bigint "linked_round_id"
    t.integer "number", null: false
    t.string "old_type", limit: 1
    t.text "round_results", size: :medium
    t.integer "scramble_set_count", default: 1, null: false
    t.text "time_limit"
    t.integer "total_number_of_rounds", null: false
    t.datetime "updated_at", precision: nil, null: false
    t.index ["competition_event_id", "number"], name: "index_rounds_on_competition_event_id_and_number", unique: true
    t.index ["linked_round_id"], name: "index_rounds_on_linked_round_id"
  end

  create_table "sanity_check_categories", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "email_to"
    t.string "name", null: false
    t.index ["name"], name: "index_sanity_check_categories_on_name", unique: true
  end

  create_table "sanity_check_exclusions", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.text "comments"
    t.text "exclusion", null: false
    t.bigint "sanity_check_id", null: false
    t.index ["sanity_check_id"], name: "fk_rails_c9112973d2"
  end

  create_table "sanity_check_results", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "cronjob_statistic_id", null: false
    t.json "query_results", null: false
    t.bigint "sanity_check_category_id", null: false
    t.datetime "updated_at", null: false
    t.index ["cronjob_statistic_id"], name: "index_sanity_check_results_on_cronjob_statistic_id"
    t.index ["sanity_check_category_id"], name: "index_sanity_check_results_on_sanity_check_category_id"
  end

  create_table "sanity_checks", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.text "comments"
    t.text "query", null: false
    t.bigint "sanity_check_category_id", null: false
    t.string "topic", null: false
    t.index ["sanity_check_category_id"], name: "fk_rails_fddad5fbb5"
    t.index ["topic"], name: "index_sanity_checks_on_topic", unique: true
  end

  create_table "schedule_activities", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "activity_code", null: false
    t.datetime "created_at", precision: nil, null: false
    t.datetime "end_time", precision: nil, null: false
    t.string "name", null: false
    t.bigint "parent_activity_id"
    t.integer "round_id"
    t.integer "scramble_set_id"
    t.datetime "start_time", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
    t.bigint "venue_room_id", null: false
    t.integer "wcif_id", null: false
    t.index ["parent_activity_id"], name: "index_schedule_activities_on_parent_activity_id"
    t.index ["round_id"], name: "index_schedule_activities_on_round_id"
    t.index ["venue_room_id", "wcif_id"], name: "index_schedule_activities_on_venue_room_id_and_wcif_id", unique: true
    t.index ["venue_room_id"], name: "index_schedule_activities_on_venue_room_id"
  end

  create_table "scramble_file_uploads", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "competition_id", null: false
    t.datetime "created_at", null: false
    t.timestamp "generated_at"
    t.string "original_filename"
    t.text "raw_wcif", size: :long, null: false
    t.string "scramble_program"
    t.datetime "updated_at", null: false
    t.timestamp "uploaded_at", null: false
    t.integer "uploaded_by", null: false
    t.index ["competition_id"], name: "index_scramble_file_uploads_on_competition_id"
    t.index ["uploaded_by"], name: "index_scramble_file_uploads_on_uploaded_by"
  end

  create_table "scrambles", id: { type: :integer, unsigned: true }, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "competition_id", limit: 32, null: false
    t.string "event_id", limit: 6, null: false
    t.string "group_id", limit: 3, null: false
    t.boolean "is_extra", null: false
    t.integer "round_id", null: false
    t.string "round_type_id", limit: 1, null: false
    t.text "scramble", null: false
    t.integer "scramble_num", null: false
    t.index ["competition_id", "event_id"], name: "competitionId"
    t.index ["round_id"], name: "index_scrambles_on_round_id"
  end

  create_table "server_settings", primary_key: "name", id: :string, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "value"
    t.index ["name"], name: "index_server_settings_on_name", unique: true
  end

  create_table "stripe_records", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "account_id"
    t.integer "amount_stripe_denomination"
    t.datetime "created_at", precision: nil, null: false
    t.string "currency_code"
    t.text "error"
    t.text "parameters", null: false
    t.bigint "parent_record_id"
    t.string "stripe_id"
    t.string "stripe_record_type"
    t.string "stripe_status", null: false
    t.datetime "updated_at", precision: nil, null: false
    t.index ["parent_record_id"], name: "fk_rails_6ad225b020"
    t.index ["stripe_id"], name: "index_stripe_records_on_stripe_id"
    t.index ["stripe_status"], name: "index_stripe_records_on_stripe_status"
  end

  create_table "stripe_webhook_events", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "account_id"
    t.datetime "created_at", precision: nil, null: false
    t.datetime "created_at_remote", precision: nil, null: false
    t.string "event_type"
    t.boolean "handled", default: false, null: false
    t.string "stripe_id"
    t.bigint "stripe_record_id"
    t.datetime "updated_at", precision: nil, null: false
    t.index ["stripe_record_id"], name: "index_stripe_webhook_events_on_stripe_record_id"
  end

  create_table "ticket_comments", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.bigint "acting_stakeholder_id", null: false
    t.integer "acting_user_id", null: false
    t.text "comment"
    t.datetime "created_at", null: false
    t.bigint "ticket_id", null: false
    t.datetime "updated_at", null: false
    t.index ["acting_stakeholder_id"], name: "index_ticket_comments_on_acting_stakeholder_id"
    t.index ["acting_user_id"], name: "index_ticket_comments_on_acting_user_id"
    t.index ["ticket_id"], name: "index_ticket_comments_on_ticket_id"
  end

  create_table "ticket_log_changes", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "field_name", null: false
    t.string "field_value", null: false
    t.bigint "ticket_log_id", null: false
    t.datetime "updated_at", null: false
    t.index ["ticket_log_id"], name: "index_ticket_log_changes_on_ticket_log_id"
  end

  create_table "ticket_logs", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.bigint "acting_stakeholder_id", null: false
    t.integer "acting_user_id", null: false
    t.string "action_type", null: false
    t.datetime "created_at", null: false
    t.string "metadata_action"
    t.bigint "ticket_id", null: false
    t.datetime "updated_at", null: false
    t.index ["acting_stakeholder_id"], name: "index_ticket_logs_on_acting_stakeholder_id"
    t.index ["acting_user_id"], name: "index_ticket_logs_on_acting_user_id"
    t.index ["ticket_id"], name: "index_ticket_logs_on_ticket_id"
  end

  create_table "ticket_stakeholders", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "connection", null: false
    t.datetime "created_at", null: false
    t.boolean "is_active", null: false
    t.string "stakeholder_id", limit: 255, null: false
    t.string "stakeholder_role", null: false
    t.string "stakeholder_type", null: false
    t.bigint "ticket_id", null: false
    t.datetime "updated_at", null: false
    t.index ["stakeholder_type", "stakeholder_id"], name: "index_ticket_stakeholders_on_stakeholder"
    t.index ["ticket_id"], name: "index_ticket_stakeholders_on_ticket_id"
  end

  create_table "tickets", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "metadata_id", null: false
    t.string "metadata_type", null: false
    t.datetime "updated_at", null: false
    t.index ["metadata_type", "metadata_id"], name: "index_tickets_on_metadata"
  end

  create_table "tickets_competition_result", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "competition_id", null: false
    t.datetime "created_at", null: false
    t.text "delegate_message", null: false
    t.string "status", null: false
    t.datetime "updated_at", null: false
    t.index ["competition_id"], name: "index_tickets_competition_result_on_competition_id"
  end

  create_table "tickets_edit_person", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "status", null: false
    t.datetime "updated_at", null: false
    t.string "wca_id", null: false
  end

  create_table "tickets_edit_person_fields", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "field_name", null: false
    t.text "new_value", null: false
    t.text "old_value", null: false
    t.bigint "tickets_edit_person_id", null: false
    t.datetime "updated_at", null: false
    t.index ["tickets_edit_person_id"], name: "index_tickets_edit_person_fields_on_tickets_edit_person_id"
  end

  create_table "uploaded_jsons", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "competition_id"
    t.text "json_str", size: :long
    t.index ["competition_id"], name: "index_uploaded_jsons_on_competition_id"
  end

  create_table "user_avatars", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.datetime "approved_at", precision: nil
    t.integer "approved_by"
    t.string "backend"
    t.datetime "created_at", null: false
    t.string "filename"
    t.text "revocation_reason"
    t.datetime "revoked_at", precision: nil
    t.integer "revoked_by"
    t.string "status"
    t.integer "thumbnail_crop_h"
    t.integer "thumbnail_crop_w"
    t.integer "thumbnail_crop_x"
    t.integer "thumbnail_crop_y"
    t.datetime "updated_at", null: false
    t.integer "user_id"
    t.index ["status"], name: "index_user_avatars_on_status"
    t.index ["user_id"], name: "index_user_avatars_on_user_id"
  end

  create_table "user_groups", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "group_type", null: false
    t.boolean "is_active", null: false
    t.boolean "is_hidden", null: false
    t.bigint "metadata_id"
    t.string "metadata_type"
    t.string "name", null: false
    t.bigint "parent_group_id"
    t.datetime "updated_at", null: false
    t.index ["parent_group_id"], name: "index_user_groups_on_parent_group_id"
  end

  create_table "user_preferred_events", id: :integer, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "event_id"
    t.integer "user_id"
    t.index ["user_id", "event_id"], name: "index_user_preferred_events_on_user_id_and_event_id", unique: true
  end

  create_table "user_roles", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.date "end_date"
    t.bigint "group_id", null: false
    t.bigint "metadata_id"
    t.string "metadata_type"
    t.date "start_date", null: false
    t.datetime "updated_at", null: false
    t.integer "user_id", null: false
    t.index ["group_id"], name: "index_user_roles_on_group_id"
    t.index ["user_id"], name: "index_user_roles_on_user_id"
  end

  create_table "users", id: :integer, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.boolean "competition_notifications_enabled"
    t.datetime "confirmation_sent_at", precision: nil
    t.string "confirmation_token", limit: 255
    t.datetime "confirmed_at", precision: nil
    t.integer "consumed_timestep"
    t.boolean "cookies_acknowledged", default: false, null: false
    t.string "country_iso2", limit: 255
    t.datetime "created_at", precision: nil
    t.bigint "current_avatar_id"
    t.datetime "current_sign_in_at", precision: nil
    t.string "current_sign_in_ip", limit: 255
    t.integer "delegate_id_to_handle_wca_id_claim"
    t.string "delegate_reports_region_id"
    t.string "delegate_reports_region_type"
    t.date "dob"
    t.boolean "dummy_account", default: false, null: false
    t.string "email", default: "", null: false
    t.string "encrypted_password", limit: 255, default: "", null: false
    t.string "gender", limit: 255
    t.datetime "last_sign_in_at", precision: nil
    t.string "last_sign_in_ip", limit: 255
    t.string "name", limit: 255
    t.text "otp_backup_codes"
    t.boolean "otp_required_for_login", default: false
    t.string "otp_secret"
    t.bigint "pending_avatar_id"
    t.string "preferred_locale", limit: 255
    t.boolean "receive_delegate_reports", default: false, null: false
    t.boolean "receive_developer_mails", default: false, null: false
    t.boolean "registration_notifications_enabled", default: false
    t.datetime "remember_created_at", precision: nil
    t.datetime "reset_password_sent_at", precision: nil
    t.string "reset_password_token"
    t.boolean "results_notifications_enabled", default: false
    t.string "session_validity_token"
    t.integer "sign_in_count", default: 0, null: false
    t.string "unconfirmed_email", limit: 255
    t.string "unconfirmed_wca_id", limit: 255
    t.datetime "updated_at", precision: nil
    t.string "wca_id"
    t.index ["delegate_id_to_handle_wca_id_claim"], name: "index_users_on_delegate_id_to_handle_wca_id_claim"
    t.index ["delegate_reports_region_type", "delegate_reports_region_id"], name: "index_users_on_delegate_reports_region"
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
    t.index ["wca_id"], name: "index_users_on_wca_id", unique: true
  end

  create_table "venue_rooms", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "color", limit: 7, null: false
    t.bigint "competition_venue_id", null: false
    t.datetime "created_at", precision: nil, null: false
    t.string "name", null: false
    t.datetime "updated_at", precision: nil, null: false
    t.integer "wcif_id", null: false
    t.index ["competition_venue_id", "wcif_id"], name: "index_venue_rooms_on_competition_venue_id_and_wcif_id", unique: true
    t.index ["competition_venue_id"], name: "index_venue_rooms_on_competition_venue_id"
  end

  create_table "vote_options", id: :integer, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.integer "poll_option_id", null: false
    t.integer "vote_id", null: false
  end

  create_table "votes", id: :integer, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "comment", limit: 200
    t.integer "poll_id"
    t.integer "user_id", null: false
    t.index ["user_id"], name: "index_votes_on_user_id"
  end

  create_table "waiting_lists", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.json "entries"
    t.string "holder_id"
    t.string "holder_type"
    t.datetime "updated_at", null: false
    t.index ["holder_type", "holder_id"], name: "index_waiting_lists_on_holder"
  end

  create_table "wcif_extensions", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.text "data", null: false
    t.string "extendable_id"
    t.string "extendable_type"
    t.string "extension_id", null: false
    t.string "spec_url", null: false
    t.index ["extendable_type", "extendable_id"], name: "index_wcif_extensions_on_extendable_type_and_extendable_id"
  end

  create_table "wfc_dues_redirects", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "redirect_source_id", null: false
    t.string "redirect_source_type", null: false
    t.bigint "redirect_to_id", null: false
    t.datetime "updated_at", null: false
    t.index ["redirect_to_id"], name: "index_wfc_dues_redirects_on_redirect_to_id"
  end

  create_table "wfc_xero_users", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "email", null: false
    t.boolean "is_combined_invoice", default: false, null: false
    t.string "name", null: false
    t.datetime "updated_at", null: false
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "inbox_results", "rounds"
  add_foreign_key "inbox_scramble_sets", "events"
  add_foreign_key "inbox_scramble_sets", "rounds", column: "matched_round_id"
  add_foreign_key "inbox_scramble_sets", "scramble_file_uploads", column: "external_upload_id"
  add_foreign_key "inbox_scrambles", "inbox_scramble_sets"
  add_foreign_key "inbox_scrambles", "inbox_scramble_sets", column: "matched_scramble_set_id"
  add_foreign_key "live_attempt_history_entries", "live_attempts"
  add_foreign_key "oauth_openid_requests", "oauth_access_grants", column: "access_grant_id", on_delete: :cascade
  add_foreign_key "payment_intents", "users", column: "initiated_by_id"
  add_foreign_key "paypal_records", "paypal_records", column: "parent_record_id"
  add_foreign_key "potential_duplicate_persons", "duplicate_checker_job_runs"
  add_foreign_key "potential_duplicate_persons", "persons", column: "duplicate_person_id"
  add_foreign_key "potential_duplicate_persons", "users", column: "original_user_id"
  add_foreign_key "regional_records_lookup", "results", on_update: :cascade, on_delete: :cascade
  add_foreign_key "registration_history_changes", "registration_history_entries"
  add_foreign_key "results", "rounds"
  add_foreign_key "rounds", "linked_rounds"
  add_foreign_key "sanity_check_exclusions", "sanity_checks"
  add_foreign_key "sanity_checks", "sanity_check_categories"
  add_foreign_key "schedule_activities", "rounds"
  add_foreign_key "schedule_activities", "schedule_activities", column: "parent_activity_id"
  add_foreign_key "schedule_activities", "venue_rooms"
  add_foreign_key "scramble_file_uploads", "users", column: "uploaded_by"
  add_foreign_key "scrambles", "rounds"
  add_foreign_key "stripe_records", "stripe_records", column: "parent_record_id"
  add_foreign_key "stripe_webhook_events", "stripe_records"
  add_foreign_key "ticket_comments", "ticket_stakeholders", column: "acting_stakeholder_id"
  add_foreign_key "ticket_comments", "tickets"
  add_foreign_key "ticket_comments", "users", column: "acting_user_id"
  add_foreign_key "ticket_logs", "ticket_stakeholders", column: "acting_stakeholder_id"
  add_foreign_key "ticket_logs", "users", column: "acting_user_id"
  add_foreign_key "tickets_competition_result", "competitions"
  add_foreign_key "user_avatars", "users"
  add_foreign_key "user_groups", "user_groups", column: "parent_group_id"
  add_foreign_key "user_roles", "user_groups", column: "group_id"
  add_foreign_key "user_roles", "users"
  add_foreign_key "wfc_dues_redirects", "wfc_xero_users", column: "redirect_to_id"
end

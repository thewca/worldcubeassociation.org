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

ActiveRecord::Schema[7.0].define(version: 2023_11_25_061943) do
  create_table "Competitions", id: { type: :string, limit: 32, default: "" }, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "name", limit: 50, default: "", null: false
    t.string "cityName", limit: 50, default: "", null: false
    t.string "countryId", limit: 50, default: "", null: false
    t.text "information", size: :medium
    t.string "venue", limit: 240, default: "", null: false
    t.string "venueAddress", limit: 120
    t.string "venueDetails", limit: 120
    t.string "external_website", limit: 200
    t.string "cellName", limit: 45, default: "", null: false
    t.boolean "showAtAll", default: false, null: false
    t.integer "latitude"
    t.integer "longitude"
    t.string "contact", limit: 255
    t.text "remarks"
    t.datetime "registration_open", precision: nil
    t.datetime "registration_close", precision: nil
    t.boolean "use_wca_registration", default: true, null: false
    t.boolean "guests_enabled", default: true, null: false
    t.datetime "results_posted_at", precision: nil
    t.datetime "results_nag_sent_at", precision: nil
    t.boolean "generate_website"
    t.datetime "announced_at", precision: nil
    t.integer "base_entry_fee_lowest_denomination"
    t.string "currency_code", limit: 255, default: "USD"
    t.string "connected_stripe_account_id", limit: 255
    t.date "start_date"
    t.date "end_date"
    t.boolean "enable_donations"
    t.boolean "competitor_limit_enabled"
    t.integer "competitor_limit"
    t.text "competitor_limit_reason"
    t.text "extra_registration_requirements"
    t.boolean "on_the_spot_registration"
    t.integer "on_the_spot_entry_fee_lowest_denomination"
    t.integer "refund_policy_percent"
    t.datetime "refund_policy_limit_date", precision: nil
    t.integer "guests_entry_fee_lowest_denomination"
    t.datetime "created_at", precision: nil
    t.datetime "updated_at", precision: nil
    t.datetime "results_submitted_at", precision: nil
    t.boolean "early_puzzle_submission"
    t.text "early_puzzle_submission_reason"
    t.boolean "qualification_results"
    t.text "qualification_results_reason"
    t.string "name_reason"
    t.string "external_registration_page"
    t.datetime "confirmed_at", precision: nil
    t.boolean "event_restrictions"
    t.text "event_restrictions_reason"
    t.datetime "registration_reminder_sent_at", precision: nil
    t.integer "announced_by"
    t.integer "results_posted_by"
    t.string "main_event_id"
    t.datetime "cancelled_at", precision: nil
    t.integer "cancelled_by"
    t.datetime "waiting_list_deadline_date", precision: nil
    t.datetime "event_change_deadline_date", precision: nil
    t.integer "guest_entry_status", default: 0, null: false
    t.boolean "allow_registration_edits", default: false, null: false
    t.boolean "allow_registration_self_delete_after_acceptance", default: false, null: false
    t.integer "competition_series_id"
    t.boolean "use_wca_live_for_scoretaking", default: false, null: false
    t.boolean "allow_registration_without_qualification", default: false
    t.integer "guests_per_registration_limit"
    t.integer "events_per_registration_limit"
    t.boolean "force_comment_in_registration"
    t.integer "posting_by"
    t.boolean "uses_v2_registrations", default: false, null: false
    t.index ["cancelled_at"], name: "index_Competitions_on_cancelled_at"
    t.index ["countryId"], name: "index_Competitions_on_countryId"
    t.index ["end_date"], name: "index_Competitions_on_end_date"
    t.index ["start_date"], name: "index_Competitions_on_start_date"
  end

  create_table "CompetitionsMedia", id: { type: :integer, unsigned: true }, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "competitionId", limit: 32, default: "", null: false
    t.string "type", limit: 15, default: "", null: false
    t.string "text", limit: 100, default: "", null: false
    t.text "uri"
    t.string "submitterName", default: "", null: false
    t.text "submitterComment"
    t.string "submitterEmail", default: "", null: false
    t.timestamp "timestampSubmitted", default: -> { "CURRENT_TIMESTAMP" }, null: false
    t.timestamp "timestampDecided"
    t.string "status", limit: 10, default: "", null: false
  end

  create_table "ConciseAverageResults", id: false, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.integer "id", default: 0, null: false
    t.integer "average", default: 0, null: false
    t.bigint "valueAndId"
    t.string "personId", limit: 10, default: "", null: false
    t.string "eventId", limit: 6, default: "", null: false
    t.string "countryId", limit: 50, default: "", null: false
    t.string "continentId", limit: 50, default: "", null: false
    t.integer "year", limit: 2, default: 0, null: false, unsigned: true
    t.integer "month", limit: 2, default: 0, null: false, unsigned: true
    t.integer "day", limit: 2, default: 0, null: false, unsigned: true
  end

  create_table "ConciseSingleResults", id: false, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.integer "id", default: 0, null: false
    t.integer "best", default: 0, null: false
    t.bigint "valueAndId"
    t.string "personId", limit: 10, default: "", null: false
    t.string "eventId", limit: 6, default: "", null: false
    t.string "countryId", limit: 50, default: "", null: false
    t.string "continentId", limit: 50, default: "", null: false
    t.integer "year", limit: 2, default: 0, null: false, unsigned: true
    t.integer "month", limit: 2, default: 0, null: false, unsigned: true
    t.integer "day", limit: 2, default: 0, null: false, unsigned: true
  end

  create_table "Continents", id: { type: :string, limit: 50, default: "" }, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "name", limit: 50, default: "", null: false
    t.string "recordName", limit: 3, default: "", null: false
    t.integer "latitude", default: 0, null: false
    t.integer "longitude", default: 0, null: false
    t.integer "zoom", limit: 1, default: 0, null: false
  end

  create_table "Countries", id: { type: :string, limit: 50, default: "" }, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "name", limit: 50, default: "", null: false
    t.string "continentId", limit: 50, default: "", null: false
    t.string "iso2", limit: 2
    t.index ["continentId"], name: "fk_continents"
    t.index ["iso2"], name: "iso2", unique: true
  end

  create_table "Events", id: { type: :string, limit: 6, default: "" }, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", options: "ENGINE=InnoDB PACK_KEYS=0", force: :cascade do |t|
    t.string "name", limit: 54, default: "", null: false
    t.integer "rank", default: 0, null: false
    t.string "format", limit: 10, default: "", null: false
    t.string "cellName", limit: 45, default: "", null: false
  end

  create_table "Formats", id: { type: :string, limit: 1, default: "" }, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "name", limit: 50, default: "", null: false
    t.string "sort_by", limit: 255, null: false
    t.string "sort_by_second", limit: 255, null: false
    t.integer "expected_solve_count", null: false
    t.integer "trim_fastest_n", null: false
    t.integer "trim_slowest_n", null: false
  end

  create_table "InboxPersons", id: false, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "id", limit: 10, null: false
    t.string "wcaId", limit: 10, default: "", null: false
    t.string "name", limit: 80
    t.string "countryId", limit: 2, default: "", null: false
    t.string "gender", limit: 1, default: ""
    t.date "dob", null: false
    t.string "competitionId", limit: 32, null: false
    t.index ["competitionId", "id"], name: "index_InboxPersons_on_competitionId_and_id", unique: true
    t.index ["countryId"], name: "InboxPersons_fk_country"
    t.index ["name"], name: "InboxPersons_name"
    t.index ["wcaId"], name: "InboxPersons_id"
  end

  create_table "InboxResults", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", options: "ENGINE=InnoDB PACK_KEYS=0", force: :cascade do |t|
    t.string "personId", limit: 20, null: false
    t.integer "pos", limit: 2, default: 0, null: false
    t.string "competitionId", limit: 32, default: "", null: false
    t.string "eventId", limit: 6, default: "", null: false
    t.string "roundTypeId", limit: 1, default: "", null: false
    t.string "formatId", limit: 1, default: "", null: false
    t.integer "value1", default: 0, null: false
    t.integer "value2", default: 0, null: false
    t.integer "value3", default: 0, null: false
    t.integer "value4", default: 0, null: false
    t.integer "value5", default: 0, null: false
    t.integer "best", default: 0, null: false
    t.integer "average", default: 0, null: false
    t.index ["competitionId"], name: "InboxResults_fk_tournament"
    t.index ["eventId"], name: "InboxResults_fk_event"
    t.index ["formatId"], name: "InboxResults_fk_format"
    t.index ["roundTypeId"], name: "InboxResults_fk_round"
  end

  create_table "Persons", id: :integer, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "wca_id", limit: 10, default: "", null: false
    t.integer "subId", limit: 1, default: 1, null: false
    t.string "name", limit: 80
    t.string "countryId", limit: 50, default: "", null: false
    t.string "gender", limit: 1, default: ""
    t.date "dob"
    t.string "comments", limit: 40, default: "", null: false
    t.integer "incorrect_wca_id_claim_count", default: 0, null: false
    t.index ["countryId"], name: "Persons_fk_country"
    t.index ["name"], name: "Persons_name"
    t.index ["name"], name: "index_Persons_on_name", type: :fulltext
    t.index ["wca_id", "subId"], name: "index_Persons_on_wca_id_and_subId", unique: true
    t.index ["wca_id"], name: "index_Persons_on_wca_id"
  end

  create_table "RanksAverage", id: :integer, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "personId", limit: 10, default: "", null: false
    t.string "eventId", limit: 6, default: "", null: false
    t.integer "best", default: 0, null: false
    t.integer "worldRank", default: 0, null: false
    t.integer "continentRank", default: 0, null: false
    t.integer "countryRank", default: 0, null: false
    t.index ["eventId"], name: "fk_events"
    t.index ["personId"], name: "fk_persons"
  end

  create_table "RanksSingle", id: :integer, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "personId", limit: 10, default: "", null: false
    t.string "eventId", limit: 6, default: "", null: false
    t.integer "best", default: 0, null: false
    t.integer "worldRank", default: 0, null: false
    t.integer "continentRank", default: 0, null: false
    t.integer "countryRank", default: 0, null: false
    t.index ["eventId"], name: "fk_events"
    t.index ["personId"], name: "fk_persons"
  end

  create_table "Results", id: :integer, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", options: "ENGINE=InnoDB PACK_KEYS=1", force: :cascade do |t|
    t.integer "pos", limit: 2, default: 0, null: false
    t.string "personId", limit: 10, default: "", null: false
    t.string "personName", limit: 80
    t.string "countryId", limit: 50
    t.string "competitionId", limit: 32, default: "", null: false
    t.string "eventId", limit: 6, default: "", null: false
    t.string "roundTypeId", limit: 1, default: "", null: false
    t.string "formatId", limit: 1, default: "", null: false
    t.integer "value1", default: 0, null: false
    t.integer "value2", default: 0, null: false
    t.integer "value3", default: 0, null: false
    t.integer "value4", default: 0, null: false
    t.integer "value5", default: 0, null: false
    t.integer "best", default: 0, null: false
    t.integer "average", default: 0, null: false
    t.string "regionalSingleRecord", limit: 3
    t.string "regionalAverageRecord", limit: 3
    t.timestamp "updated_at", default: -> { "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP" }, null: false
    t.index ["competitionId", "updated_at"], name: "index_Results_on_competitionId_and_updated_at"
    t.index ["competitionId"], name: "Results_fk_tournament"
    t.index ["countryId"], name: "_tmp_index_Results_on_countryId"
    t.index ["eventId", "average"], name: "Results_eventAndAverage"
    t.index ["eventId", "best"], name: "Results_eventAndBest"
    t.index ["eventId", "competitionId", "roundTypeId", "countryId", "average"], name: "Results_regionalAverageRecordCheckSpeedup"
    t.index ["eventId", "competitionId", "roundTypeId", "countryId", "best"], name: "Results_regionalSingleRecordCheckSpeedup"
    t.index ["eventId", "value1"], name: "index_Results_on_eventId_and_value1"
    t.index ["eventId", "value2"], name: "index_Results_on_eventId_and_value2"
    t.index ["eventId", "value3"], name: "index_Results_on_eventId_and_value3"
    t.index ["eventId", "value4"], name: "index_Results_on_eventId_and_value4"
    t.index ["eventId", "value5"], name: "index_Results_on_eventId_and_value5"
    t.index ["eventId"], name: "Results_fk_event"
    t.index ["formatId"], name: "Results_fk_format"
    t.index ["personId"], name: "Results_fk_competitor"
    t.index ["regionalAverageRecord", "eventId"], name: "index_Results_on_regionalAverageRecord_and_eventId"
    t.index ["regionalSingleRecord", "eventId"], name: "index_Results_on_regionalSingleRecord_and_eventId"
    t.index ["roundTypeId"], name: "Results_fk_round"
  end

  create_table "RoundTypes", id: { type: :string, limit: 1, default: "" }, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.integer "rank", default: 0, null: false
    t.string "name", limit: 50, default: "", null: false
    t.string "cellName", limit: 45, default: "", null: false
    t.boolean "final", null: false
  end

  create_table "Scrambles", primary_key: "scrambleId", id: { type: :integer, unsigned: true }, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "competitionId", limit: 32, null: false
    t.string "eventId", limit: 6, null: false
    t.string "roundTypeId", limit: 1, null: false
    t.string "groupId", limit: 3, null: false
    t.boolean "isExtra", null: false
    t.integer "scrambleNum", null: false
    t.text "scramble", null: false
    t.index ["competitionId", "eventId"], name: "competitionId"
  end

  create_table "active_storage_attachments", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "name", null: false
    t.string "record_type", null: false
    t.bigint "record_id", null: false
    t.bigint "blob_id", null: false
    t.datetime "created_at", precision: nil, null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "key", null: false
    t.string "filename", null: false
    t.string "content_type"
    t.text "metadata"
    t.bigint "byte_size", null: false
    t.string "checksum"
    t.datetime "created_at", precision: nil, null: false
    t.string "service_name", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

  create_table "archive_phpbb3_forums", primary_key: "forum_id", id: { type: :integer, limit: 3, unsigned: true }, charset: "utf8mb3", collation: "utf8mb3_bin", options: "ENGINE=MyISAM", force: :cascade do |t|
    t.integer "parent_id", limit: 3, default: 0, null: false, unsigned: true
    t.integer "left_id", limit: 3, default: 0, null: false, unsigned: true
    t.integer "right_id", limit: 3, default: 0, null: false, unsigned: true
    t.text "forum_parents", size: :medium, null: false
    t.string "forum_name", limit: 255, default: "", null: false
    t.text "forum_desc", null: false
    t.string "forum_desc_bitfield", limit: 255, default: "", null: false
    t.integer "forum_desc_options", default: 7, null: false, unsigned: true
    t.string "forum_desc_uid", limit: 8, default: "", null: false
    t.string "forum_link", limit: 255, default: "", null: false
    t.string "forum_password", limit: 255, default: "", null: false
    t.integer "forum_style", limit: 3, default: 0, null: false, unsigned: true
    t.string "forum_image", limit: 255, default: "", null: false
    t.text "forum_rules", null: false
    t.string "forum_rules_link", limit: 255, default: "", null: false
    t.string "forum_rules_bitfield", limit: 255, default: "", null: false
    t.integer "forum_rules_options", default: 7, null: false, unsigned: true
    t.string "forum_rules_uid", limit: 8, default: "", null: false
    t.integer "forum_topics_per_page", limit: 1, default: 0, null: false
    t.integer "forum_type", limit: 1, default: 0, null: false
    t.integer "forum_status", limit: 1, default: 0, null: false
    t.integer "forum_last_post_id", limit: 3, default: 0, null: false, unsigned: true
    t.integer "forum_last_poster_id", limit: 3, default: 0, null: false, unsigned: true
    t.string "forum_last_post_subject", limit: 255, default: "", null: false
    t.integer "forum_last_post_time", default: 0, null: false, unsigned: true
    t.string "forum_last_poster_name", limit: 255, default: "", null: false
    t.string "forum_last_poster_colour", limit: 6, default: "", null: false
    t.integer "forum_flags", limit: 1, default: 32, null: false
    t.integer "display_on_index", limit: 1, default: 1, null: false, unsigned: true
    t.integer "enable_indexing", limit: 1, default: 1, null: false, unsigned: true
    t.integer "enable_icons", limit: 1, default: 1, null: false, unsigned: true
    t.integer "enable_prune", limit: 1, default: 0, null: false, unsigned: true
    t.integer "prune_next", default: 0, null: false, unsigned: true
    t.integer "prune_days", limit: 3, default: 0, null: false, unsigned: true
    t.integer "prune_viewed", limit: 3, default: 0, null: false, unsigned: true
    t.integer "prune_freq", limit: 3, default: 0, null: false, unsigned: true
    t.integer "display_subforum_list", limit: 1, default: 1, null: false, unsigned: true
    t.integer "forum_options", default: 0, null: false, unsigned: true
    t.integer "forum_posts_approved", limit: 3, default: 0, null: false, unsigned: true
    t.integer "forum_posts_unapproved", limit: 3, default: 0, null: false, unsigned: true
    t.integer "forum_posts_softdeleted", limit: 3, default: 0, null: false, unsigned: true
    t.integer "forum_topics_approved", limit: 3, default: 0, null: false, unsigned: true
    t.integer "forum_topics_unapproved", limit: 3, default: 0, null: false, unsigned: true
    t.integer "forum_topics_softdeleted", limit: 3, default: 0, null: false, unsigned: true
    t.integer "enable_shadow_prune", limit: 1, default: 0, null: false, unsigned: true
    t.integer "prune_shadow_days", limit: 3, default: 7, null: false, unsigned: true
    t.integer "prune_shadow_freq", limit: 3, default: 1, null: false, unsigned: true
    t.integer "prune_shadow_next", default: 0, null: false
    t.index ["forum_last_post_id"], name: "forum_lastpost_id"
    t.index ["left_id", "right_id"], name: "left_right_id"
  end

  create_table "archive_phpbb3_posts", primary_key: "post_id", id: { type: :integer, limit: 3, unsigned: true }, charset: "utf8mb3", collation: "utf8mb3_bin", options: "ENGINE=MyISAM", force: :cascade do |t|
    t.integer "topic_id", limit: 3, default: 0, null: false, unsigned: true
    t.integer "forum_id", limit: 3, default: 0, null: false, unsigned: true
    t.integer "poster_id", limit: 3, default: 0, null: false, unsigned: true
    t.integer "icon_id", limit: 3, default: 0, null: false, unsigned: true
    t.string "poster_ip", limit: 40, default: "", null: false
    t.integer "post_time", default: 0, null: false, unsigned: true
    t.integer "post_reported", limit: 1, default: 0, null: false, unsigned: true
    t.integer "enable_bbcode", limit: 1, default: 1, null: false, unsigned: true
    t.integer "enable_smilies", limit: 1, default: 1, null: false, unsigned: true
    t.integer "enable_magic_url", limit: 1, default: 1, null: false, unsigned: true
    t.integer "enable_sig", limit: 1, default: 1, null: false, unsigned: true
    t.string "post_username", limit: 255, default: "", null: false
    t.string "post_subject", limit: 255, default: "", null: false, collation: "utf8mb3_unicode_ci"
    t.text "post_text", size: :medium, null: false, collation: "utf8mb3_unicode_ci"
    t.string "post_checksum", limit: 32, default: "", null: false
    t.integer "post_attachment", limit: 1, default: 0, null: false, unsigned: true
    t.string "bbcode_bitfield", limit: 255, default: "", null: false
    t.string "bbcode_uid", limit: 8, default: "", null: false
    t.integer "post_postcount", limit: 1, default: 1, null: false, unsigned: true
    t.integer "post_edit_time", default: 0, null: false, unsigned: true
    t.string "post_edit_reason", limit: 255, default: "", null: false
    t.integer "post_edit_user", limit: 3, default: 0, null: false, unsigned: true
    t.integer "post_edit_count", limit: 2, default: 0, null: false, unsigned: true
    t.integer "post_edit_locked", limit: 1, default: 0, null: false, unsigned: true
    t.integer "post_visibility", limit: 1, default: 0, null: false
    t.integer "post_delete_time", default: 0, null: false, unsigned: true
    t.string "post_delete_reason", limit: 255, default: "", null: false
    t.integer "post_delete_user", limit: 3, default: 0, null: false, unsigned: true
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
    t.integer "topic_attachment", limit: 1, default: 0, null: false, unsigned: true
    t.integer "topic_reported", limit: 1, default: 0, null: false, unsigned: true
    t.string "topic_title", limit: 255, default: "", null: false, collation: "utf8mb3_unicode_ci"
    t.integer "topic_poster", limit: 3, default: 0, null: false, unsigned: true
    t.integer "topic_time", default: 0, null: false, unsigned: true
    t.integer "topic_time_limit", default: 0, null: false, unsigned: true
    t.integer "topic_views", limit: 3, default: 0, null: false, unsigned: true
    t.integer "topic_status", limit: 1, default: 0, null: false
    t.integer "topic_type", limit: 1, default: 0, null: false
    t.integer "topic_first_post_id", limit: 3, default: 0, null: false, unsigned: true
    t.string "topic_first_poster_name", limit: 255, default: "", null: false, collation: "utf8mb3_unicode_ci"
    t.string "topic_first_poster_colour", limit: 6, default: "", null: false
    t.integer "topic_last_post_id", limit: 3, default: 0, null: false, unsigned: true
    t.integer "topic_last_poster_id", limit: 3, default: 0, null: false, unsigned: true
    t.string "topic_last_poster_name", limit: 255, default: "", null: false
    t.string "topic_last_poster_colour", limit: 6, default: "", null: false
    t.string "topic_last_post_subject", limit: 255, default: "", null: false
    t.integer "topic_last_post_time", default: 0, null: false, unsigned: true
    t.integer "topic_last_view_time", default: 0, null: false, unsigned: true
    t.integer "topic_moved_id", limit: 3, default: 0, null: false, unsigned: true
    t.integer "topic_bumped", limit: 1, default: 0, null: false, unsigned: true
    t.integer "topic_bumper", limit: 3, default: 0, null: false, unsigned: true
    t.string "poll_title", limit: 255, default: "", null: false
    t.integer "poll_start", default: 0, null: false, unsigned: true
    t.integer "poll_length", default: 0, null: false, unsigned: true
    t.integer "poll_max_options", limit: 1, default: 1, null: false
    t.integer "poll_last_vote", default: 0, null: false, unsigned: true
    t.integer "poll_vote_change", limit: 1, default: 0, null: false, unsigned: true
    t.boolean "poll_vote_name", default: false, null: false
    t.integer "topic_visibility", limit: 1, default: 0, null: false
    t.integer "topic_delete_time", default: 0, null: false, unsigned: true
    t.string "topic_delete_reason", limit: 255, default: "", null: false
    t.integer "topic_delete_user", limit: 3, default: 0, null: false, unsigned: true
    t.integer "topic_posts_approved", limit: 3, default: 0, null: false, unsigned: true
    t.integer "topic_posts_unapproved", limit: 3, default: 0, null: false, unsigned: true
    t.integer "topic_posts_softdeleted", limit: 3, default: 0, null: false, unsigned: true
    t.index ["forum_id", "topic_last_post_time", "topic_moved_id"], name: "fid_time_moved"
    t.index ["forum_id", "topic_type"], name: "forum_id_type"
    t.index ["forum_id", "topic_visibility", "topic_last_post_id"], name: "forum_vis_last"
    t.index ["forum_id"], name: "forum_id"
    t.index ["topic_last_post_time"], name: "last_post_time"
    t.index ["topic_visibility"], name: "topic_visibility"
  end

  create_table "archive_phpbb3_users", primary_key: "user_id", id: { type: :integer, limit: 3, unsigned: true }, charset: "utf8mb3", collation: "utf8mb3_bin", options: "ENGINE=MyISAM", force: :cascade do |t|
    t.integer "user_type", limit: 1, default: 0, null: false
    t.integer "group_id", limit: 3, default: 3, null: false, unsigned: true
    t.text "user_permissions", size: :medium, null: false
    t.integer "user_perm_from", limit: 3, default: 0, null: false, unsigned: true
    t.string "user_ip", limit: 40, default: "", null: false
    t.integer "user_regdate", default: 0, null: false, unsigned: true
    t.string "username", limit: 255, default: "", null: false
    t.string "username_clean", limit: 255, default: "", null: false
    t.string "user_password", limit: 255, default: "", null: false
    t.integer "user_passchg", default: 0, null: false, unsigned: true
    t.string "user_email", limit: 100, default: "", null: false
    t.bigint "user_email_hash", default: 0, null: false
    t.string "user_birthday", limit: 10, default: "", null: false
    t.integer "user_lastvisit", default: 0, null: false, unsigned: true
    t.integer "user_lastmark", default: 0, null: false, unsigned: true
    t.integer "user_lastpost_time", default: 0, null: false, unsigned: true
    t.string "user_lastpage", limit: 200, default: "", null: false
    t.string "user_last_confirm_key", limit: 10, default: "", null: false
    t.integer "user_last_search", default: 0, null: false, unsigned: true
    t.integer "user_warnings", limit: 1, default: 0, null: false
    t.integer "user_last_warning", default: 0, null: false, unsigned: true
    t.integer "user_login_attempts", limit: 1, default: 0, null: false
    t.integer "user_inactive_reason", limit: 1, default: 0, null: false
    t.integer "user_inactive_time", default: 0, null: false, unsigned: true
    t.integer "user_posts", limit: 3, default: 0, null: false, unsigned: true
    t.string "user_lang", limit: 30, default: "", null: false
    t.string "user_timezone", limit: 100, default: "", null: false
    t.string "user_dateformat", limit: 64, default: "d M Y H:i", null: false
    t.integer "user_style", limit: 3, default: 0, null: false, unsigned: true
    t.integer "user_rank", limit: 3, default: 0, null: false, unsigned: true
    t.string "user_colour", limit: 6, default: "", null: false
    t.integer "user_new_privmsg", default: 0, null: false
    t.integer "user_unread_privmsg", default: 0, null: false
    t.integer "user_last_privmsg", default: 0, null: false, unsigned: true
    t.integer "user_message_rules", limit: 1, default: 0, null: false, unsigned: true
    t.integer "user_full_folder", default: -3, null: false
    t.integer "user_emailtime", default: 0, null: false, unsigned: true
    t.integer "user_topic_show_days", limit: 2, default: 0, null: false, unsigned: true
    t.string "user_topic_sortby_type", limit: 1, default: "t", null: false
    t.string "user_topic_sortby_dir", limit: 1, default: "d", null: false
    t.integer "user_post_show_days", limit: 2, default: 0, null: false, unsigned: true
    t.string "user_post_sortby_type", limit: 1, default: "t", null: false
    t.string "user_post_sortby_dir", limit: 1, default: "a", null: false
    t.integer "user_notify", limit: 1, default: 0, null: false, unsigned: true
    t.integer "user_notify_pm", limit: 1, default: 1, null: false, unsigned: true
    t.integer "user_notify_type", limit: 1, default: 0, null: false
    t.integer "user_allow_pm", limit: 1, default: 1, null: false, unsigned: true
    t.integer "user_allow_viewonline", limit: 1, default: 1, null: false, unsigned: true
    t.integer "user_allow_viewemail", limit: 1, default: 1, null: false, unsigned: true
    t.integer "user_allow_massemail", limit: 1, default: 1, null: false, unsigned: true
    t.integer "user_options", default: 230271, null: false, unsigned: true
    t.string "user_avatar", limit: 255, default: "", null: false
    t.string "user_avatar_type", limit: 255, default: "", null: false
    t.integer "user_avatar_width", limit: 2, default: 0, null: false, unsigned: true
    t.integer "user_avatar_height", limit: 2, default: 0, null: false, unsigned: true
    t.text "user_sig", size: :medium, null: false
    t.string "user_sig_bbcode_uid", limit: 8, default: "", null: false
    t.string "user_sig_bbcode_bitfield", limit: 255, default: "", null: false
    t.string "user_jabber", limit: 255, default: "", null: false
    t.string "user_actkey", limit: 32, default: "", null: false
    t.string "user_newpasswd", limit: 255, default: "", null: false
    t.string "user_form_salt", limit: 32, default: "", null: false
    t.integer "user_new", limit: 1, default: 1, null: false, unsigned: true
    t.integer "user_reminded", limit: 1, default: 0, null: false
    t.integer "user_reminded_time", default: 0, null: false, unsigned: true
    t.index ["user_birthday"], name: "user_birthday"
    t.index ["user_email_hash"], name: "user_email_hash"
    t.index ["user_type"], name: "user_type"
    t.index ["username_clean"], name: "username_clean", unique: true
  end

  create_table "archive_registrations", id: { type: :integer, unsigned: true }, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "competitionId", limit: 32, default: "", null: false
    t.string "name", limit: 80
    t.string "personId", limit: 10, default: "", null: false
    t.string "countryId", limit: 50, default: "", null: false
    t.string "gender", limit: 1, default: "", null: false
    t.integer "birthYear", limit: 2, default: 0, null: false, unsigned: true
    t.integer "birthMonth", limit: 1, default: 0, null: false, unsigned: true
    t.integer "birthDay", limit: 1, default: 0, null: false, unsigned: true
    t.string "email", limit: 80, default: "", null: false
    t.text "guests_old"
    t.text "comments"
    t.string "ip", limit: 16, default: "", null: false
    t.integer "user_id"
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
    t.integer "guests", default: 0, null: false
    t.datetime "accepted_at", precision: nil
    t.index ["competitionId", "user_id"], name: "index_registrations_on_competitionId_and_user_id", unique: true
  end

  create_table "assignments", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.bigint "registration_id"
    t.bigint "schedule_activity_id"
    t.integer "station_number"
    t.string "assignment_code", null: false
    t.index ["registration_id"], name: "index_assignments_on_registration_id"
    t.index ["schedule_activity_id"], name: "index_assignments_on_schedule_activity_id"
  end

  create_table "bookmarked_competitions", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "competition_id", null: false
    t.integer "user_id", null: false
    t.index ["competition_id"], name: "index_bookmarked_competitions_on_competition_id"
    t.index ["user_id"], name: "index_bookmarked_competitions_on_user_id"
  end

  create_table "cached_results", primary_key: "key_params", id: :string, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.json "payload"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "championships", id: :integer, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "competition_id", null: false
    t.string "championship_type", null: false
    t.index ["championship_type"], name: "index_championships_on_championship_type"
    t.index ["competition_id", "championship_type"], name: "index_championships_on_competition_id_and_championship_type", unique: true
  end

  create_table "competition_delegates", id: :integer, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "competition_id"
    t.integer "delegate_id"
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
    t.boolean "receive_registration_emails", default: false, null: false
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

  create_table "competition_organizers", id: :integer, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "competition_id"
    t.integer "organizer_id"
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
    t.boolean "receive_registration_emails", default: false, null: false
    t.index ["competition_id", "organizer_id"], name: "idx_competition_organizers_on_competition_id_and_organizer_id", unique: true
    t.index ["competition_id"], name: "index_competition_organizers_on_competition_id"
    t.index ["organizer_id"], name: "index_competition_organizers_on_organizer_id"
  end

  create_table "competition_series", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "wcif_id", null: false
    t.string "name"
    t.string "short_name"
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
  end

  create_table "competition_tabs", id: :integer, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "competition_id"
    t.string "name", limit: 255
    t.text "content"
    t.integer "display_order"
    t.index ["display_order", "competition_id"], name: "index_competition_tabs_on_display_order_and_competition_id", unique: true
  end

  create_table "competition_venues", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "competition_id", null: false
    t.integer "wcif_id", null: false
    t.string "name", null: false
    t.integer "latitude_microdegrees", null: false
    t.integer "longitude_microdegrees", null: false
    t.string "timezone_id", null: false
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
    t.string "country_iso2", null: false
    t.index ["competition_id", "wcif_id"], name: "index_competition_venues_on_competition_id_and_wcif_id", unique: true
    t.index ["competition_id"], name: "index_competition_venues_on_competition_id"
  end

  create_table "country_bands", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.integer "number", null: false
    t.string "iso2", limit: 2, null: false
    t.index ["iso2"], name: "index_country_bands_on_iso2", unique: true
    t.index ["number"], name: "index_country_bands_on_number"
  end

  create_table "cronjob_statistics", primary_key: "name", id: :string, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.datetime "run_start", precision: nil
    t.datetime "run_end", precision: nil
    t.boolean "last_run_successful", default: false, null: false
    t.text "last_error_message"
    t.datetime "enqueued_at", precision: nil
    t.integer "recently_rejected", default: 0, null: false
    t.integer "recently_errored", default: 0, null: false
    t.integer "times_completed", default: 0, null: false
    t.bigint "average_runtime"
  end

  create_table "delegate_reports", id: :integer, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "competition_id"
    t.text "equipment"
    t.text "venue"
    t.text "organization"
    t.string "schedule_url", limit: 255
    t.text "incidents"
    t.text "remarks"
    t.string "discussion_url", limit: 255
    t.integer "posted_by_user_id"
    t.datetime "posted_at", precision: nil
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
    t.datetime "nag_sent_at", precision: nil
    t.boolean "wrc_feedback_requested", default: false, null: false
    t.string "wrc_incidents"
    t.boolean "wdc_feedback_requested", default: false, null: false
    t.string "wdc_incidents"
    t.integer "wrc_primary_user_id"
    t.integer "wrc_secondary_user_id"
    t.datetime "reminder_sent_at", precision: nil
    t.index ["competition_id"], name: "index_delegate_reports_on_competition_id", unique: true
  end

  create_table "eligible_country_iso2s_for_championship", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "championship_type", null: false
    t.string "eligible_country_iso2", null: false
    t.index ["championship_type", "eligible_country_iso2"], name: "index_eligible_iso2s_for_championship_on_type_and_country_iso2", unique: true
  end

  create_table "incident_competitions", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.bigint "incident_id", null: false
    t.string "competition_id", null: false
    t.string "comments"
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
    t.string "title"
    t.text "private_description"
    t.text "private_wrc_decision"
    t.text "public_summary"
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
    t.datetime "resolved_at", precision: nil
    t.boolean "digest_worthy", default: false
    t.datetime "digest_sent_at", precision: nil
  end

  create_table "jwt_denylist", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "jti", null: false
    t.datetime "exp", null: false
    t.index ["jti"], name: "index_jwt_denylist_on_jti"
  end

  create_table "locations", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.integer "user_id", null: false
    t.integer "latitude_microdegrees"
    t.integer "longitude_microdegrees"
    t.integer "notification_radius_km"
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
  end

  create_table "oauth_access_grants", id: :integer, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.integer "resource_owner_id", null: false
    t.integer "application_id", null: false
    t.string "token", null: false
    t.integer "expires_in", null: false
    t.text "redirect_uri"
    t.datetime "created_at", precision: nil, null: false
    t.datetime "revoked_at", precision: nil
    t.string "scopes", limit: 255
    t.index ["token"], name: "index_oauth_access_grants_on_token", unique: true
  end

  create_table "oauth_access_tokens", id: :integer, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.integer "resource_owner_id"
    t.integer "application_id"
    t.string "token", null: false
    t.string "refresh_token"
    t.integer "expires_in"
    t.datetime "revoked_at", precision: nil
    t.datetime "created_at", precision: nil, null: false
    t.string "scopes", limit: 255
    t.index ["refresh_token"], name: "index_oauth_access_tokens_on_refresh_token", unique: true
    t.index ["resource_owner_id"], name: "index_oauth_access_tokens_on_resource_owner_id"
    t.index ["token"], name: "index_oauth_access_tokens_on_token", unique: true
  end

  create_table "oauth_applications", id: :integer, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "name", limit: 255, null: false
    t.string "uid", null: false
    t.string "secret", limit: 255, null: false
    t.text "redirect_uri"
    t.string "scopes", limit: 255, default: "", null: false
    t.datetime "created_at", precision: nil
    t.datetime "updated_at", precision: nil
    t.integer "owner_id"
    t.string "owner_type"
    t.boolean "dangerously_allow_any_redirect_uri", default: false, null: false
    t.boolean "confidential", default: true, null: false
    t.index ["owner_id", "owner_type"], name: "index_oauth_applications_on_owner_id_and_owner_type"
    t.index ["uid"], name: "index_oauth_applications_on_uid", unique: true
  end

  create_table "poll_options", id: :integer, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "description", limit: 200, null: false
    t.integer "poll_id", null: false
    t.index ["poll_id"], name: "poll_id"
  end

  create_table "polls", id: :integer, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.text "question"
    t.boolean "multiple", null: false
    t.datetime "deadline", precision: nil, null: false
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
    t.text "comment"
    t.datetime "confirmed_at", precision: nil
  end

  create_table "post_tags", id: :integer, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.integer "post_id", null: false
    t.string "tag", null: false
    t.index ["post_id", "tag"], name: "index_post_tags_on_post_id_and_tag", unique: true
    t.index ["post_id"], name: "index_post_tags_on_post_id"
    t.index ["tag"], name: "index_post_tags_on_tag"
  end

  create_table "posts", id: :integer, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "title", limit: 255, default: "", null: false
    t.text "body"
    t.string "slug", default: "", null: false
    t.boolean "sticky", default: false, null: false
    t.integer "author_id"
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
    t.boolean "show_on_homepage", default: true, null: false
    t.date "unstick_at"
    t.index ["created_at"], name: "index_posts_on_world_readable_and_created_at"
    t.index ["show_on_homepage", "sticky", "created_at"], name: "idx_show_wr_sticky_created_at"
    t.index ["slug"], name: "index_posts_on_slug", unique: true
    t.index ["sticky", "created_at"], name: "index_posts_on_world_readable_and_sticky_and_created_at"
  end

  create_table "preferred_formats", id: false, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "event_id", null: false
    t.string "format_id", null: false
    t.integer "ranking", null: false
    t.index ["event_id", "format_id"], name: "index_preferred_formats_on_event_id_and_format_id", unique: true
    t.index ["format_id"], name: "fk_rails_c3e0098ed3"
  end

  create_table "regional_organizations", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "name", null: false
    t.string "country", null: false
    t.string "website", null: false
    t.date "start_date"
    t.date "end_date"
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
    t.string "email", null: false
    t.string "address", null: false
    t.text "directors_and_officers", null: false
    t.text "area_description", null: false
    t.text "past_and_current_activities", null: false
    t.text "future_plans", null: false
    t.text "extra_information"
    t.index ["country"], name: "index_regional_organizations_on_country"
    t.index ["name"], name: "index_regional_organizations_on_name"
  end

  create_table "registration_competition_events", id: :integer, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.integer "registration_id"
    t.integer "competition_event_id"
    t.index ["registration_id", "competition_event_id"], name: "idx_registration_competition_events_on_reg_id_and_comp_event_id", unique: true
    t.index ["registration_id", "competition_event_id"], name: "index_reg_events_reg_id_comp_event_id"
  end

  create_table "registration_payments", id: :integer, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.integer "registration_id"
    t.integer "amount_lowest_denomination"
    t.string "currency_code", limit: 255
    t.bigint "receipt_id"
    t.string "receipt_type"
    t.string "stripe_charge_id"
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
    t.integer "refunded_registration_payment_id"
    t.integer "user_id"
    t.index ["receipt_type", "receipt_id"], name: "index_registration_payments_on_receipt"
    t.index ["refunded_registration_payment_id"], name: "idx_reg_payments_on_refunded_registration_payment_id"
    t.index ["stripe_charge_id"], name: "index_registration_payments_on_stripe_charge_id"
  end

  create_table "registrations", id: { type: :integer, unsigned: true }, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "competition_id", limit: 32, default: "", null: false
    t.text "comments"
    t.string "ip", limit: 16, default: "", null: false
    t.integer "user_id"
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
    t.integer "guests", default: 0, null: false
    t.datetime "accepted_at", precision: nil
    t.integer "accepted_by"
    t.datetime "deleted_at", precision: nil
    t.integer "deleted_by"
    t.text "roles"
    t.boolean "is_competing", default: true
    t.text "administrative_notes"
    t.index ["competition_id", "user_id"], name: "index_registrations_on_competition_id_and_user_id", unique: true
  end

  create_table "roles", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.integer "user_id", null: false
    t.bigint "group_id", null: false
    t.date "start_date", null: false
    t.date "end_date"
    t.bigint "metadata_id"
    t.string "metadata_type"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["group_id"], name: "index_roles_on_group_id"
    t.index ["user_id"], name: "index_roles_on_user_id"
  end

  create_table "rounds", id: :integer, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.integer "competition_event_id", null: false
    t.string "format_id", limit: 255, null: false
    t.integer "number", null: false
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
    t.text "time_limit"
    t.text "cutoff"
    t.text "advancement_condition"
    t.integer "scramble_set_count", default: 1, null: false
    t.text "round_results", size: :medium
    t.integer "total_number_of_rounds", null: false
    t.string "old_type", limit: 1
    t.index ["competition_event_id", "number"], name: "index_rounds_on_competition_event_id_and_number", unique: true
  end

  create_table "sanity_check_categories", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "name", null: false
    t.string "email_to"
    t.index ["name"], name: "index_sanity_check_categories_on_name", unique: true
  end

  create_table "sanity_check_exclusions", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.bigint "sanity_check_id", null: false
    t.text "exclusion", null: false
    t.text "comments"
    t.index ["sanity_check_id"], name: "fk_rails_c9112973d2"
  end

  create_table "sanity_checks", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.bigint "sanity_check_category_id", null: false
    t.string "topic", null: false
    t.text "comments"
    t.text "query", null: false
    t.index ["sanity_check_category_id"], name: "fk_rails_fddad5fbb5"
    t.index ["topic"], name: "index_sanity_checks_on_topic", unique: true
  end

  create_table "schedule_activities", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "holder_type", null: false
    t.bigint "holder_id", null: false
    t.integer "wcif_id", null: false
    t.string "name", null: false
    t.string "activity_code", null: false
    t.datetime "start_time", precision: nil, null: false
    t.datetime "end_time", precision: nil, null: false
    t.integer "scramble_set_id"
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
    t.index ["holder_type", "holder_id", "wcif_id"], name: "index_activities_on_their_id_within_holder", unique: true
    t.index ["holder_type", "holder_id"], name: "index_schedule_activities_on_holder_type_and_holder_id"
  end

  create_table "server_settings", primary_key: "name", id: :string, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "value"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["name"], name: "index_server_settings_on_name", unique: true
  end

  create_table "starburst_announcement_views", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.integer "user_id"
    t.integer "announcement_id"
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
    t.index ["user_id", "announcement_id"], name: "starburst_announcement_view_index", unique: true
  end

  create_table "starburst_announcements", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.text "title"
    t.text "body"
    t.datetime "start_delivering_at", precision: nil
    t.datetime "stop_delivering_at", precision: nil
    t.text "limit_to_users"
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
    t.text "category"
  end

  create_table "stripe_payment_intents", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "holder_type"
    t.bigint "holder_id"
    t.bigint "stripe_transaction_id"
    t.text "client_secret"
    t.text "error_details"
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
    t.integer "user_id"
    t.datetime "confirmed_at", precision: nil
    t.string "confirmed_by_type"
    t.bigint "confirmed_by_id"
    t.datetime "canceled_at", precision: nil
    t.string "canceled_by_type"
    t.bigint "canceled_by_id"
    t.index ["canceled_by_type", "canceled_by_id"], name: "index_stripe_payment_intents_on_canceled_by"
    t.index ["confirmed_by_type", "confirmed_by_id"], name: "index_stripe_payment_intents_on_confirmed_by"
    t.index ["holder_type", "holder_id"], name: "index_stripe_payment_intents_on_holder"
    t.index ["stripe_transaction_id"], name: "index_stripe_payment_intents_on_stripe_transaction_id"
    t.index ["user_id"], name: "fk_rails_2dbc373c0c"
  end

  create_table "stripe_transactions", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "api_type"
    t.string "stripe_id"
    t.text "parameters", null: false
    t.integer "amount_stripe_denomination"
    t.string "currency_code"
    t.string "status", null: false
    t.text "error"
    t.string "account_id"
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
    t.bigint "parent_transaction_id"
    t.index ["parent_transaction_id"], name: "fk_rails_6ad225b020"
    t.index ["status"], name: "index_stripe_transactions_on_status"
  end

  create_table "stripe_webhook_events", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "stripe_id"
    t.string "event_type"
    t.string "account_id"
    t.datetime "created_at_remote", precision: nil, null: false
    t.boolean "handled", default: false, null: false
    t.bigint "stripe_transaction_id"
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
    t.index ["stripe_transaction_id"], name: "index_stripe_webhook_events_on_stripe_transaction_id"
  end

  create_table "team_members", id: :integer, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.integer "team_id", null: false
    t.integer "user_id", null: false
    t.date "start_date", null: false
    t.date "end_date"
    t.boolean "team_leader", default: false, null: false
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
    t.boolean "team_senior_member", default: false, null: false
  end

  create_table "teams", id: :integer, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "friendly_id"
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
    t.string "email"
    t.boolean "hidden", default: false, null: false
    t.index ["friendly_id"], name: "index_teams_on_friendly_id"
  end

  create_table "uploaded_jsons", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "competition_id"
    t.text "json_str", size: :long
    t.index ["competition_id"], name: "index_uploaded_jsons_on_competition_id"
  end

  create_table "user_groups", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "name", null: false
    t.string "group_type", null: false
    t.bigint "parent_group_id"
    t.boolean "is_active", null: false
    t.boolean "is_hidden", null: false
    t.bigint "metadata_id"
    t.string "metadata_type"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["parent_group_id"], name: "index_user_groups_on_parent_group_id"
  end

  create_table "user_groups_delegate_regions_metadata", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "email"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "user_preferred_events", id: :integer, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.integer "user_id"
    t.string "event_id"
    t.index ["user_id", "event_id"], name: "index_user_preferred_events_on_user_id_and_event_id", unique: true
  end

  create_table "users", id: :integer, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "email", default: "", null: false
    t.string "encrypted_password", limit: 255, default: "", null: false
    t.string "reset_password_token"
    t.datetime "reset_password_sent_at", precision: nil
    t.datetime "remember_created_at", precision: nil
    t.integer "sign_in_count", default: 0, null: false
    t.datetime "current_sign_in_at", precision: nil
    t.datetime "last_sign_in_at", precision: nil
    t.string "current_sign_in_ip", limit: 255
    t.string "last_sign_in_ip", limit: 255
    t.string "confirmation_token", limit: 255
    t.datetime "confirmed_at", precision: nil
    t.datetime "confirmation_sent_at", precision: nil
    t.string "unconfirmed_email", limit: 255
    t.datetime "created_at", precision: nil
    t.datetime "updated_at", precision: nil
    t.string "name", limit: 255
    t.string "delegate_status", limit: 255
    t.bigint "region_id"
    t.integer "senior_delegate_id"
    t.string "location", limit: 255
    t.string "wca_id"
    t.string "avatar", limit: 255
    t.string "pending_avatar", limit: 255
    t.integer "saved_avatar_crop_x"
    t.integer "saved_avatar_crop_y"
    t.integer "saved_avatar_crop_w"
    t.integer "saved_avatar_crop_h"
    t.integer "saved_pending_avatar_crop_x"
    t.integer "saved_pending_avatar_crop_y"
    t.integer "saved_pending_avatar_crop_w"
    t.integer "saved_pending_avatar_crop_h"
    t.string "unconfirmed_wca_id", limit: 255
    t.integer "delegate_id_to_handle_wca_id_claim"
    t.date "dob"
    t.string "gender", limit: 255
    t.string "country_iso2", limit: 255
    t.boolean "results_notifications_enabled", default: false
    t.string "preferred_locale", limit: 255
    t.boolean "competition_notifications_enabled"
    t.boolean "receive_delegate_reports", default: false, null: false
    t.boolean "dummy_account", default: false, null: false
    t.integer "consumed_timestep"
    t.boolean "otp_required_for_login", default: false
    t.text "otp_backup_codes"
    t.string "session_validity_token"
    t.boolean "cookies_acknowledged", default: false, null: false
    t.boolean "registration_notifications_enabled", default: false
    t.string "otp_secret"
    t.index ["delegate_id_to_handle_wca_id_claim"], name: "index_users_on_delegate_id_to_handle_wca_id_claim"
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["region_id"], name: "index_users_on_region_id"
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
    t.index ["senior_delegate_id"], name: "index_users_on_senior_delegate_id"
    t.index ["wca_id"], name: "index_users_on_wca_id", unique: true
  end

  create_table "venue_rooms", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.bigint "competition_venue_id", null: false
    t.integer "wcif_id", null: false
    t.string "name", null: false
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
    t.string "color", limit: 7, null: false
    t.index ["competition_venue_id", "wcif_id"], name: "index_venue_rooms_on_competition_venue_id_and_wcif_id", unique: true
    t.index ["competition_venue_id"], name: "index_venue_rooms_on_competition_venue_id"
  end

  create_table "vote_options", id: :integer, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.integer "vote_id", null: false
    t.integer "poll_option_id", null: false
  end

  create_table "votes", id: :integer, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.integer "user_id", null: false
    t.string "comment", limit: 200
    t.integer "poll_id"
    t.index ["user_id"], name: "index_votes_on_user_id"
  end

  create_table "wcif_extensions", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "extendable_type"
    t.string "extendable_id"
    t.string "extension_id", null: false
    t.string "spec_url", null: false
    t.text "data", null: false
    t.index ["extendable_type", "extendable_id"], name: "index_wcif_extensions_on_extendable_type_and_extendable_id"
  end

  create_table "wfc_dues_redirects", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "redirect_source_id", null: false
    t.string "redirect_source_type", null: false
    t.bigint "redirect_to_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["redirect_to_id"], name: "index_wfc_dues_redirects_on_redirect_to_id"
  end

  create_table "wfc_xero_users", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "name", null: false
    t.string "email", null: false
    t.boolean "is_combined_invoice", default: false, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "roles", "user_groups", column: "group_id"
  add_foreign_key "roles", "users"
  add_foreign_key "sanity_check_exclusions", "sanity_checks"
  add_foreign_key "sanity_checks", "sanity_check_categories"
  add_foreign_key "stripe_payment_intents", "stripe_transactions"
  add_foreign_key "stripe_payment_intents", "users"
  add_foreign_key "stripe_transactions", "stripe_transactions", column: "parent_transaction_id"
  add_foreign_key "stripe_webhook_events", "stripe_transactions"
  add_foreign_key "user_groups", "user_groups", column: "parent_group_id"
  add_foreign_key "users", "user_groups", column: "region_id"
  add_foreign_key "wfc_dues_redirects", "wfc_xero_users", column: "redirect_to_id"
end

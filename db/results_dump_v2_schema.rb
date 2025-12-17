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

ActiveRecord::Schema[7.1].define(version: 0) do
  create_table "competitions", id: { type: :string, limit: 50, default: "" }, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "name", limit: 50, default: "", null: false
    t.string "city_name", limit: 50, default: "", null: false
    t.string "country_id", limit: 50, default: "", null: false
    t.text "information", size: :medium
    t.integer "year", limit: 2, default: 0, null: false, unsigned: true
    t.integer "month", limit: 2, default: 0, null: false, unsigned: true
    t.integer "day", limit: 2, default: 0, null: false, unsigned: true
    t.integer "end_year", limit: 2, default: 0, null: false, unsigned: true
    t.integer "end_month", limit: 2, default: 0, null: false, unsigned: true
    t.integer "end_day", limit: 2, default: 0, null: false, unsigned: true
    t.integer "cancelled", default: 0, null: false
    t.text "event_specs", size: :long
    t.text "delegates", size: :medium
    t.text "organizers", size: :medium
    t.string "venue", limit: 240, default: "", null: false
    t.string "venue_address"
    t.string "venue_details"
    t.string "external_website", limit: 200
    t.string "cell_name", limit: 45, default: "", null: false
    t.integer "latitude_microdegrees"
    t.integer "longitude_microdegrees"
  end

  create_table "continents", id: { type: :string, limit: 50, default: "" }, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "name", limit: 50, default: "", null: false
    t.string "record_name", limit: 3, default: "", null: false
  end

  create_table "countries", id: { type: :string, limit: 50, default: "" }, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "name", limit: 50, default: "", null: false
    t.string "continent_id", limit: 50, default: "", null: false
    t.string "iso2", limit: 2
  end

  create_table "events", id: { type: :string, limit: 50, default: "" }, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "name", limit: 54, default: "", null: false
    t.integer "rank", default: 0, null: false
    t.string "format", limit: 10, default: "", null: false
  end

  create_table "formats", id: { type: :string, limit: 50, default: "" }, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "name", limit: 50, default: "", null: false
    t.string "sort_by", limit: 255, null: false
    t.string "sort_by_second", limit: 255, null: false
    t.integer "expected_solve_count", null: false
    t.integer "trim_fastest_n", null: false
    t.integer "trim_slowest_n", null: false
  end

  create_table "persons", id: false, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "wca_id", limit: 10, default: "", null: false
    t.integer "sub_id", limit: 1, default: 1, null: false
    t.string "name", limit: 80
    t.string "country_id", limit: 50, default: "", null: false
    t.string "gender", limit: 1, default: ""
  end

  create_table "ranks_average", id: false, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "person_id", limit: 10, default: "", null: false
    t.string "event_id", limit: 6, default: "", null: false
    t.integer "best", default: 0, null: false
    t.integer "world_rank", default: 0, null: false
    t.integer "continent_rank", default: 0, null: false
    t.integer "country_rank", default: 0, null: false
  end

  create_table "ranks_single", id: false, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "person_id", limit: 10, default: "", null: false
    t.string "event_id", limit: 6, default: "", null: false
    t.integer "best", default: 0, null: false
    t.integer "world_rank", default: 0, null: false
    t.integer "continent_rank", default: 0, null: false
    t.integer "country_rank", default: 0, null: false
  end

  create_table "result_attempts", id: { type: :string, limit: 50, default: "" }, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.integer "value", null: false
    t.integer "attempt_number", null: false
    t.bigint "result_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "results", id: { type: :string, limit: 50, default: "" }, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "competition_id", limit: 32, default: "", null: false
    t.string "event_id", limit: 6, default: "", null: false
    t.string "round_type_id", limit: 1, default: "", null: false
    t.integer "pos", limit: 2, default: 0, null: false
    t.integer "best", default: 0, null: false
    t.integer "average", default: 0, null: false
    t.string "person_name", limit: 80
    t.string "person_id", limit: 10, default: "", null: false
    t.string "person_country_id", limit: 50
    t.string "format_id", limit: 1, default: "", null: false
    t.string "regional_single_record", limit: 3
    t.string "regional_average_record", limit: 3
  end

  create_table "round_types", id: { type: :string, limit: 50, default: "" }, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.integer "rank", default: 0, null: false
    t.string "name", limit: 50, default: "", null: false
    t.string "cell_name", limit: 45, default: "", null: false
    t.boolean "final", null: false
  end

  create_table "scrambles", id: { type: :string, limit: 50, default: "" }, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "competition_id", limit: 32, null: false
    t.string "event_id", limit: 6, null: false
    t.string "round_type_id", limit: 1, null: false
    t.string "group_id", limit: 3, null: false
    t.boolean "is_extra", null: false
    t.integer "scramble_num", null: false
    t.text "scramble", null: false
  end

  create_table "championships", id: { type: :string, limit: 50, default: "" }, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "competition_id", null: false
    t.string "championship_type", null: false
  end

  create_table "eligible_country_iso2s_for_championship", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "championship_type", null: false
    t.string "eligible_country_iso2", null: false
  end
end

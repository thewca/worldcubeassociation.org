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
  create_table "Competitions", id: false, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "id", limit: 32, default: "", null: false
    t.string "name", limit: 50, default: "", null: false
    t.string "cityName", limit: 50, default: "", null: false
    t.string "countryId", limit: 50, default: "", null: false
    t.text "information", size: :medium
    t.integer "year", limit: 2, default: 0, null: false, unsigned: true
    t.integer "month", limit: 2, default: 0, null: false, unsigned: true
    t.integer "day", limit: 2, default: 0, null: false, unsigned: true
    t.integer "endMonth", limit: 2, default: 0, null: false, unsigned: true
    t.integer "endDay", limit: 2, default: 0, null: false, unsigned: true
    t.integer "cancelled", default: 0, null: false
    t.text "eventSpecs", size: :long
    t.text "wcaDelegate", size: :medium
    t.text "organiser", size: :medium
    t.string "venue", limit: 240, default: "", null: false
    t.string "venueAddress", limit: 120
    t.string "venueDetails", limit: 120
    t.string "external_website", limit: 200
    t.string "cellName", limit: 45, default: "", null: false
    t.integer "latitude"
    t.integer "longitude"
  end

  create_table "Continents", id: false, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "id", limit: 50, default: "", null: false
    t.string "name", limit: 50, default: "", null: false
    t.string "recordName", limit: 3, default: "", null: false
    t.integer "latitude", default: 0, null: false
    t.integer "longitude", default: 0, null: false
    t.integer "zoom", limit: 1, default: 0, null: false
  end

  create_table "Countries", id: false, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "id", limit: 50, default: "", null: false
    t.string "name", limit: 50, default: "", null: false
    t.string "continentId", limit: 50, default: "", null: false
    t.string "iso2", limit: 2
  end

  create_table "Events", id: false, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "id", limit: 6, default: "", null: false
    t.string "name", limit: 54, default: "", null: false
    t.integer "rank", default: 0, null: false
    t.string "format", limit: 10, default: "", null: false
    t.string "cellName", limit: 45, default: "", null: false
  end

  create_table "Formats", id: false, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "id", limit: 1, default: "", null: false
    t.string "name", limit: 50, default: "", null: false
    t.string "sort_by", limit: 255, null: false
    t.string "sort_by_second", limit: 255, null: false
    t.integer "expected_solve_count", null: false
    t.integer "trim_fastest_n", null: false
    t.integer "trim_slowest_n", null: false
  end

  create_table "Persons", id: false, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "id", limit: 10, default: "", null: false
    t.integer "subid", limit: 1, default: 1, null: false
    t.string "name", limit: 80
    t.string "countryId", limit: 50, default: "", null: false
    t.string "gender", limit: 1, default: ""
  end

  create_table "RanksAverage", id: false, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "personId", limit: 10, default: "", null: false
    t.string "eventId", limit: 6, default: "", null: false
    t.integer "best", default: 0, null: false
    t.integer "worldRank", default: 0, null: false
    t.integer "continentRank", default: 0, null: false
    t.integer "countryRank", default: 0, null: false
  end

  create_table "RanksSingle", id: false, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "personId", limit: 10, default: "", null: false
    t.string "eventId", limit: 6, default: "", null: false
    t.integer "best", default: 0, null: false
    t.integer "worldRank", default: 0, null: false
    t.integer "continentRank", default: 0, null: false
    t.integer "countryRank", default: 0, null: false
  end

  create_table "Results", id: false, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "competitionId", limit: 32, default: "", null: false
    t.string "eventId", limit: 6, default: "", null: false
    t.string "roundTypeId", limit: 1, default: "", null: false
    t.integer "pos", limit: 2, default: 0, null: false
    t.integer "best", default: 0, null: false
    t.integer "average", default: 0, null: false
    t.string "personName", limit: 80
    t.string "personId", limit: 10, default: "", null: false
    t.string "personCountryId", limit: 50
    t.string "formatId", limit: 1, default: "", null: false
    t.integer "value1", default: 0, null: false
    t.integer "value2", default: 0, null: false
    t.integer "value3", default: 0, null: false
    t.integer "value4", default: 0, null: false
    t.integer "value5", default: 0, null: false
    t.string "regionalSingleRecord", limit: 3
    t.string "regionalAverageRecord", limit: 3
  end

  create_table "RoundTypes", id: false, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "id", limit: 1, default: "", null: false
    t.integer "rank", default: 0, null: false
    t.string "name", limit: 50, default: "", null: false
    t.string "cellName", limit: 45, default: "", null: false
    t.boolean "final", null: false
  end

  create_table "Rounds", id: false, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "sorry_message", limit: 172, default: "", null: false, collation: "utf8mb3_general_ci"
  end

  create_table "Scrambles", id: false, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.integer "scrambleId", default: 0, null: false, unsigned: true
    t.string "competitionId", limit: 32, null: false
    t.string "eventId", limit: 6, null: false
    t.string "roundTypeId", limit: 1, null: false
    t.string "groupId", limit: 3, null: false
    t.boolean "isExtra", null: false
    t.integer "scrambleNum", null: false
    t.text "scramble", null: false
  end

  create_table "championships", id: false, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.integer "id", default: 0, null: false
    t.string "competition_id", null: false
    t.string "championship_type", null: false
  end

  create_table "eligible_country_iso2s_for_championship", id: false, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.bigint "id", default: 0, null: false
    t.string "championship_type", null: false
    t.string "eligible_country_iso2", null: false
  end

end

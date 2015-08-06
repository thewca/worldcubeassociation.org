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

module ActiveRecord
  module ConnectionAdapters
    class AbstractAdapter
      class SchemaCreation # :nodoc:
        private
          def visit_ColumnDefinition(o)
            sql_type = type_to_sql(o.type, o.limit, o.precision, o.scale)
            column_sql = "#{quote_column_name(o.name)} #{sql_type}"
            add_column_options!(column_sql, column_options(o)) unless o.primary_key?
            #### Begin monkeypatch to get a string id PRIMARY KEY working in sqlite
            if o.primary_key? && o.type == :string
              column_sql << " PRIMARY KEY"
            end
            #### End monkeypatch
            column_sql
          end
      end
    end
  end
end

ActiveRecord::Schema.define(version: 20150806172310) do

  create_table "Competitions", id: false, force: :cascade do |t|
    t.string  "id",                null: false,     primary_key: true
    t.string  "name",              limit: 50,       default: "",    null: false
    t.string  "cityName",          limit: 50,       default: "",    null: false
    t.string  "countryId",         limit: 50,       default: "",    null: false
    t.text    "information",       limit: 16777215
    t.integer "year",              limit: 2,        default: 0,     null: false
    t.integer "month",             limit: 2,        default: 0,     null: false
    t.integer "day",               limit: 2,        default: 0,     null: false
    t.integer "endMonth",          limit: 2,        default: 0,     null: false
    t.integer "endDay",            limit: 2,        default: 0,     null: false
    t.text    "eventSpecs",        limit: 65535,                    null: false
    t.string  "wcaDelegate",       limit: 240,      default: "",    null: false
    t.string  "organiser",         limit: 200,      default: "",    null: false
    t.string  "venue",             limit: 240,      default: "",    null: false
    t.string  "venueAddress",      limit: 120
    t.string  "venueDetails",      limit: 120
    t.string  "website",           limit: 200
    t.string  "cellName",          limit: 45,       default: "",    null: false
    t.boolean "showAtAll",         limit: 1,        default: false, null: false
    t.boolean "showPreregForm",    limit: 1,        default: false, null: false
    t.boolean "showPreregList",    limit: 1,        default: false, null: false
    t.integer "latitude",          limit: 4,        default: 0,     null: false
    t.integer "longitude",         limit: 4,        default: 0,     null: false
    t.boolean "isConfirmed",       limit: 1,        default: false, null: false
  end

  add_index "Competitions", ["year", "month", "day"], name: "year_month_day"

  create_table "CompetitionsMedia", force: :cascade do |t|
    t.string   "competitionId",      limit: 32,    default: "", null: false
    t.string   "type",               limit: 15,    default: "", null: false
    t.string   "text",               limit: 100,   default: "", null: false
    t.text     "uri",                limit: 65535,              null: false
    t.string   "submitterName",      limit: 50,    default: "", null: false
    t.text     "submitterComment",   limit: 65535,              null: false
    t.string   "submitterEmail",     limit: 45,    default: "", null: false
    t.datetime "timestampSubmitted",                            null: false
    t.datetime "timestampDecided",                              null: false
    t.string   "status",             limit: 10,    default: "", null: false
  end

  create_table "ConciseAverageResults", id: false, force: :cascade do |t|
    t.integer "id",          limit: 4,  default: 0,  null: false
    t.integer "average",     limit: 4,  default: 0,  null: false
    t.integer "valueAndId",  limit: 8
    t.string  "personId",    limit: 10, default: "", null: false
    t.string  "eventId",     limit: 6,  default: "", null: false
    t.string  "countryId",   limit: 50, default: "", null: false
    t.string  "continentId", limit: 50, default: "", null: false
    t.integer "year",        limit: 2,  default: 0,  null: false
    t.integer "month",       limit: 2,  default: 0,  null: false
    t.integer "day",         limit: 2,  default: 0,  null: false
  end

  create_table "ConciseSingleResults", id: false, force: :cascade do |t|
    t.integer "id",          limit: 4,  default: 0,  null: false
    t.integer "best",        limit: 4,  default: 0,  null: false
    t.integer "valueAndId",  limit: 8
    t.string  "personId",    limit: 10, default: "", null: false
    t.string  "eventId",     limit: 6,  default: "", null: false
    t.string  "countryId",   limit: 50, default: "", null: false
    t.string  "continentId", limit: 50, default: "", null: false
    t.integer "year",        limit: 2,  default: 0,  null: false
    t.integer "month",       limit: 2,  default: 0,  null: false
    t.integer "day",         limit: 2,  default: 0,  null: false
  end

  create_table "Continents", id: false, force: :cascade do |t|
    t.string  "id",         null: false, primary_key: true
    t.string  "name",       limit: 50, default: "", null: false
    t.string  "recordName", limit: 3,  default: "", null: false
    t.integer "latitude",   limit: 4,  default: 0,  null: false
    t.integer "longitude",  limit: 4,  default: 0,  null: false
    t.integer "zoom",       limit: 1,  default: 0,  null: false
  end

  create_table "Countries", id: false, force: :cascade do |t|
    t.string  "id",          null: false, primary_key: true
    t.string  "name",        limit: 50, default: "", null: false
    t.string  "continentId", limit: 50, default: "", null: false
    t.integer "latitude",    limit: 4,  default: 0,  null: false
    t.integer "longitude",   limit: 4,  default: 0,  null: false
    t.integer "zoom",        limit: 1,  default: 0,  null: false
    t.string  "iso2",        limit: 2
  end

  add_index "Countries", ["continentId"], name: "fk_continents"
  add_index "Countries", ["iso2"], name: "iso2", unique: true

  create_table "Events", id: false, force: :cascade do |t|
    t.string  "id",       null: false, primary_key: true
    t.string  "name",     limit: 54, default: "", null: false
    t.integer "rank",     limit: 4,  default: 0,  null: false
    t.string  "format",   limit: 10, default: "", null: false
    t.string  "cellName", limit: 45, default: "", null: false
  end

  create_table "Formats", id: false, force: :cascade do |t|
    t.string  "id",  null: false, primary_key: true
    t.string "name", limit: 50, default: "", null: false
  end

  create_table "InboxPersons", id: false, force: :cascade do |t|
    t.string "id",            limit: 10, primary_key: true,  null: false
    t.string "wcaId",         limit: 10, default: "", null: false
    t.string "name",          limit: 80
    t.string "countryId",     limit: 2,  default: "", null: false
    t.string "gender",        limit: 1,  default: "", null: false
    t.date   "dob",                                   null: false
    t.string "competitionId", limit: 32,              null: false
  end

  add_index "InboxPersons", ["countryId"], name: "InboxPersons_fk_country"
  add_index "InboxPersons", ["name"], name: "InboxPersons_name"
  add_index "InboxPersons", ["wcaId"], name: "InboxPersons_id"

  create_table "InboxPersons_old", id: false, force: :cascade do |t|
    t.string  "id",                limit: 10, default: "", null: false, primary_key: true
    t.integer "subId",             limit: 1,  default: 1,  null: false
    t.string  "name",              limit: 80
    t.string  "countryId",         limit: 50, default: "", null: false
    t.string  "gender",            limit: 1,  default: "", null: false
    t.integer "year",              limit: 2,  default: 0,  null: false
    t.integer "month",             limit: 1,  default: 0,  null: false
    t.integer "day",               limit: 1,  default: 0,  null: false
    t.string  "comments",          limit: 40, default: "", null: false
    t.string  "fromCompetitionId", limit: 32,              null: false
  end

  add_index "InboxPersons_old", ["countryId"], name: "InboxPersons_old_fk_country"
  add_index "InboxPersons_old", ["name"], name: "InboxPersons_old_name"

  create_table "InboxResults", id: false, force: :cascade do |t|
    t.string  "personId",      limit: 20,              null: false
    t.integer "pos",           limit: 2,  default: 0,  null: false
    t.string  "competitionId", limit: 32, default: "", null: false
    t.string  "eventId",       limit: 6,  default: "", null: false
    t.string  "roundId",       limit: 1,  default: "", null: false
    t.string  "formatId",      limit: 1,  default: "", null: false
    t.integer "value1",        limit: 4,  default: 0,  null: false
    t.integer "value2",        limit: 4,  default: 0,  null: false
    t.integer "value3",        limit: 4,  default: 0,  null: false
    t.integer "value4",        limit: 4,  default: 0,  null: false
    t.integer "value5",        limit: 4,  default: 0,  null: false
    t.integer "best",          limit: 4,  default: 0,  null: false
    t.integer "average",       limit: 4,  default: 0,  null: false
  end

  add_index "InboxResults", ["competitionId"], name: "InboxResults_fk_tournament"
  add_index "InboxResults", ["eventId"], name: "InboxResults_fk_event"
  add_index "InboxResults", ["formatId"], name: "InboxResults_fk_format"
  add_index "InboxResults", ["roundId"], name: "InboxResults_fk_round"

  create_table "InboxResults_old", id: false, force: :cascade do |t|
    t.integer "pos",                   limit: 2,  default: 0,  null: false
    t.string  "personId",              limit: 10, default: "", null: false
    t.string  "personName",            limit: 80
    t.string  "countryId",             limit: 50
    t.string  "competitionId",         limit: 32, default: "", null: false
    t.string  "eventId",               limit: 6,  default: "", null: false
    t.string  "roundId",               limit: 1,  default: "", null: false
    t.string  "formatId",              limit: 1,  default: "", null: false
    t.integer "value1",                limit: 4,  default: 0,  null: false
    t.integer "value2",                limit: 4,  default: 0,  null: false
    t.integer "value3",                limit: 4,  default: 0,  null: false
    t.integer "value4",                limit: 4,  default: 0,  null: false
    t.integer "value5",                limit: 4,  default: 0,  null: false
    t.integer "best",                  limit: 4,  default: 0,  null: false
    t.integer "average",               limit: 4,  default: 0,  null: false
    t.string  "regionalSingleRecord",  limit: 3
    t.string  "regionalAverageRecord", limit: 3
  end

  add_index "InboxResults_old", ["competitionId"], name: "InboxResults_old_fk_tournament"
  add_index "InboxResults_old", ["eventId", "average"], name: "InboxResults_old_eventAndAverage"
  add_index "InboxResults_old", ["eventId", "best"], name: "InboxResults_old_eventAndBest"
  add_index "InboxResults_old", ["eventId", "competitionId", "roundId", "countryId", "average"], name: "InboxResults_old_regionalAverageRecordCheckSpeedup"
  add_index "InboxResults_old", ["eventId", "competitionId", "roundId", "countryId", "best"], name: "InboxResults_old_regionalSingleRecordCheckSpeedup"
  add_index "InboxResults_old", ["eventId"], name: "InboxResults_old_fk_event"
  add_index "InboxResults_old", ["formatId"], name: "InboxResults_old_fk_format"
  add_index "InboxResults_old", ["personId"], name: "InboxResults_old_fk_competitor"
  add_index "InboxResults_old", ["roundId"], name: "InboxResults_old_fk_round"

  create_table "Persons", id: false, force: :cascade do |t|
    t.string  "id",        limit: 10, default: "", null: false, primary_key: true
    t.integer "subId",     limit: 1,  default: 1,  null: false
    t.string  "name",      limit: 80
    t.string  "countryId", limit: 50, default: "", null: false
    t.string  "gender",    limit: 1,  default: "", null: false
    t.integer "year",      limit: 2,  default: 0,  null: false
    t.integer "month",     limit: 1,  default: 0,  null: false
    t.integer "day",       limit: 1,  default: 0,  null: false
    t.string  "comments",  limit: 40, default: "", null: false
  end

  add_index "Persons", ["countryId"], name: "Persons_fk_country"
  add_index "Persons", ["name"], name: "Persons_name"

  create_table "Preregs", force: :cascade do |t|
    t.string  "competitionId", limit: 32,    default: "", null: false
    t.string  "name",          limit: 80
    t.string  "personId",      limit: 10,    default: "", null: false
    t.string  "countryId",     limit: 50,    default: "", null: false
    t.string  "gender",        limit: 1,     default: "", null: false
    t.integer "birthYear",     limit: 2,     default: 0,  null: false
    t.integer "birthMonth",    limit: 1,     default: 0,  null: false
    t.integer "birthDay",      limit: 1,     default: 0,  null: false
    t.string  "email",         limit: 80,    default: "", null: false
    t.text    "guests",        limit: 65535,              null: false
    t.text    "comments",      limit: 65535,              null: false
    t.string  "ip",            limit: 16,    default: "", null: false
    t.string  "status",        limit: 1,     default: "", null: false
    t.text    "eventIds",      limit: 65535,              null: false
  end

  create_table "RanksAverage", force: :cascade do |t|
    t.string  "personId",      limit: 10, default: "", null: false
    t.string  "eventId",       limit: 6,  default: "", null: false
    t.integer "best",          limit: 4,  default: 0,  null: false
    t.integer "worldRank",     limit: 4,  default: 0,  null: false
    t.integer "continentRank", limit: 4,  default: 0,  null: false
    t.integer "countryRank",   limit: 4,  default: 0,  null: false
  end

  add_index "RanksAverage", ["eventId"], name: "RanksAverage_fk_events"
  add_index "RanksAverage", ["personId"], name: "RanksAverage_fk_persons"

  create_table "RanksSingle", force: :cascade do |t|
    t.string  "personId",      limit: 10, default: "", null: false
    t.string  "eventId",       limit: 6,  default: "", null: false
    t.integer "best",          limit: 4,  default: 0,  null: false
    t.integer "worldRank",     limit: 4,  default: 0,  null: false
    t.integer "continentRank", limit: 4,  default: 0,  null: false
    t.integer "countryRank",   limit: 4,  default: 0,  null: false
  end

  add_index "RanksSingle", ["eventId"], name: "RanksSingle_fk_events"
  add_index "RanksSingle", ["personId"], name: "RanksSingle_fk_persons"

  create_table "Results", force: :cascade do |t|
    t.integer "pos",                   limit: 2,  default: 0,  null: false
    t.string  "personId",              limit: 10, default: "", null: false
    t.string  "personName",            limit: 80
    t.string  "countryId",             limit: 50
    t.string  "competitionId",         limit: 32, default: "", null: false
    t.string  "eventId",               limit: 6,  default: "", null: false
    t.string  "roundId",               limit: 1,  default: "", null: false
    t.string  "formatId",              limit: 1,  default: "", null: false
    t.integer "value1",                limit: 4,  default: 0,  null: false
    t.integer "value2",                limit: 4,  default: 0,  null: false
    t.integer "value3",                limit: 4,  default: 0,  null: false
    t.integer "value4",                limit: 4,  default: 0,  null: false
    t.integer "value5",                limit: 4,  default: 0,  null: false
    t.integer "best",                  limit: 4,  default: 0,  null: false
    t.integer "average",               limit: 4,  default: 0,  null: false
    t.string  "regionalSingleRecord",  limit: 3
    t.string  "regionalAverageRecord", limit: 3
  end

  add_index "Results", ["competitionId"], name: "Results_fk_tournament"
  add_index "Results", ["eventId", "average"], name: "Results_eventAndAverage"
  add_index "Results", ["eventId", "best"], name: "Results_eventAndBest"
  add_index "Results", ["eventId", "competitionId", "roundId", "countryId", "average"], name: "Results_regionalAverageRecordCheckSpeedup"
  add_index "Results", ["eventId", "competitionId", "roundId", "countryId", "best"], name: "Results_regionalSingleRecordCheckSpeedup"
  add_index "Results", ["eventId"], name: "Results_fk_event"
  add_index "Results", ["formatId"], name: "Results_fk_format"
  add_index "Results", ["personId"], name: "Results_fk_competitor"
  add_index "Results", ["roundId"], name: "Results_fk_round"

  create_table "ResultsStatus", id: false, force: :cascade do |t|
    t.string "id",    limit: 50, default: "", null: false, primary_key: true
    t.string "value", limit: 50, default: "", null: false
  end

  create_table "Rounds", id: false, force: :cascade do |t|
    t.string  "id",       null: false, primary_key: true
    t.integer "rank",     limit: 4,  default: 0,  null: false
    t.string  "name",     limit: 50, default: "", null: false
    t.string  "cellName", limit: 45, default: "", null: false
  end

  create_table "Scrambles", primary_key: "scrambleId", force: :cascade do |t|
    t.string  "competitionId", limit: 32,  null: false
    t.string  "eventId",       limit: 6,   null: false
    t.string  "roundId",       limit: 1,   null: false
    t.string  "groupId",       limit: 3,   null: false
    t.boolean "isExtra",       limit: 1,   null: false
    t.integer "scrambleNum",   limit: 4,   null: false
    t.string  "scramble",      limit: 500, null: false
  end

  add_index "Scrambles", ["competitionId", "eventId"], name: "competitionId"

  create_table "competition_delegates", force: :cascade do |t|
    t.string   "competition_id"
    t.integer  "delegate_id"
    t.datetime "created_at",     null: false
    t.datetime "updated_at",     null: false
  end

  add_index "competition_delegates", ["competition_id", "delegate_id"], name: "index_competition_delegates_on_competition_id_and_delegate_id", unique: true
  add_index "competition_delegates", ["competition_id"], name: "index_competition_delegates_on_competition_id"
  add_index "competition_delegates", ["delegate_id"], name: "index_competition_delegates_on_delegate_id"

  create_table "competition_organizers", force: :cascade do |t|
    t.string  "competition_id"
    t.integer  "organizer_id"
    t.datetime "created_at",     null: false
    t.datetime "updated_at",     null: false
  end

  add_index "competition_organizers", ["competition_id", "organizer_id"], name: "idx_competition_organizers_on_competition_id_and_organizer_id", unique: true
  add_index "competition_organizers", ["competition_id"], name: "index_competition_organizers_on_competition_id"
  add_index "competition_organizers", ["organizer_id"], name: "index_competition_organizers_on_organizer_id"

  create_table "oauth_access_grants", force: :cascade do |t|
    t.integer  "resource_owner_id", limit: 4,     null: false
    t.integer  "application_id",    limit: 4,     null: false
    t.string   "token",             limit: 255,   null: false
    t.integer  "expires_in",        limit: 4,     null: false
    t.text     "redirect_uri",      limit: 65535, null: false
    t.datetime "created_at",                      null: false
    t.datetime "revoked_at"
    t.string   "scopes",            limit: 255
  end

  add_index "oauth_access_grants", ["token"], name: "index_oauth_access_grants_on_token", unique: true

  create_table "oauth_access_tokens", force: :cascade do |t|
    t.integer  "resource_owner_id", limit: 4
    t.integer  "application_id",    limit: 4
    t.string   "token",             limit: 255, null: false
    t.string   "refresh_token",     limit: 255
    t.integer  "expires_in",        limit: 4
    t.datetime "revoked_at"
    t.datetime "created_at",                    null: false
    t.string   "scopes",            limit: 255
  end

  add_index "oauth_access_tokens", ["refresh_token"], name: "index_oauth_access_tokens_on_refresh_token", unique: true
  add_index "oauth_access_tokens", ["resource_owner_id"], name: "index_oauth_access_tokens_on_resource_owner_id"
  add_index "oauth_access_tokens", ["token"], name: "index_oauth_access_tokens_on_token", unique: true

  create_table "oauth_applications", force: :cascade do |t|
    t.string   "name",         limit: 255,                null: false
    t.string   "uid",          limit: 255,                null: false
    t.string   "secret",       limit: 255,                null: false
    t.text     "redirect_uri", limit: 65535,              null: false
    t.string   "scopes",       limit: 255,   default: "", null: false
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  add_index "oauth_applications", ["uid"], name: "index_oauth_applications_on_uid", unique: true

  create_table "posts", force: :cascade do |t|
    t.string   "title",      limit: 255,   default: "", null: false
    t.text     "body",       limit: 65535,              null: false
    t.string   "slug",       limit: 255,   default: "", null: false
    t.boolean  "sticky",     limit: 1
    t.integer  "author_id",  limit: 4
    t.datetime "created_at",                            null: false
    t.datetime "updated_at",                            null: false
  end

  add_index "posts", ["slug"], name: "index_posts_on_slug", unique: true

  create_table "users", force: :cascade do |t|
    t.string   "email",                  limit: 255, default: "", null: false
    t.string   "encrypted_password",     limit: 255, default: "", null: false
    t.string   "reset_password_token",   limit: 255
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.integer  "sign_in_count",          limit: 4,   default: 0,  null: false
    t.datetime "current_sign_in_at"
    t.datetime "last_sign_in_at"
    t.string   "current_sign_in_ip",     limit: 255
    t.string   "last_sign_in_ip",        limit: 255
    t.string   "confirmation_token",     limit: 255
    t.datetime "confirmed_at"
    t.datetime "confirmation_sent_at"
    t.string   "unconfirmed_email",      limit: 255
    t.datetime "created_at"
    t.datetime "updated_at"
    t.boolean  "admin",                  limit: 1
    t.boolean  "results_team",           limit: 1
    t.string   "name",                   limit: 255
    t.string   "delegate_status"
    t.integer  "senior_delegate_id"
    t.string   "region"
    t.string   "wca_id"
  end

  add_index "users", ["email"], name: "index_users_on_email", unique: true
  add_index "users", ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
  add_index "users", ["senior_delegate_id"], name: "index_users_on_senior_delegate_id"
  add_index "users", ["wca_id"], name: "index_users_on_wca_id", unique: true

end

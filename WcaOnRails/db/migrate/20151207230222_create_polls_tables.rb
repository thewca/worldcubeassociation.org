Class CreatePollsTables < ActiveRecord::Migration
  def change
    create_table "votes", force: :cascade do |t|
      t.integer "user_id",        limit: 4
      t.integer "poll_option_id", limit: 4
      t.string  "comment",        limit: 200
    end

    add_index "votes", ["poll_option_id"], name: "option_id", using: :btree
    add_index "votes", ["user_id"], name: "user_id", using: :btree

    add_foreign_key "poll_options", "polls", name: "poll_options_ibfk_1"
    add_foreign_key "votes", "users", name: "votes_ibfk_1"

    create_table "poll_options", force: :cascade do |t|
      t.string  "description", limit: 200
      t.integer "poll_id",     limit: 4
    end

    add_index "poll_options", ["poll_id"], name: "poll_id", using: :btree

    create_table "polls", force: :cascade do |t|
      t.string  "question", limit: 300
      t.boolean "multiple", limit: 1
      t.date    "deadline"
    end
  end
end

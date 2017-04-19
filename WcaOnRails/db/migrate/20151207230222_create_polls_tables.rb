# frozen_string_literal: true

class CreatePollsTables < ActiveRecord::Migration
  def change
    create_table "polls", force: :cascade do |t|
      t.string "question", limit: 300, null: false
      t.boolean "multiple", limit: 1, null: false
      t.date "deadline", null: false
      t.boolean "confirmed", limit: 1, null: false
      t.timestamps null: false
    end

    create_table "poll_options", force: :cascade do |t|
      t.string "description", limit: 200, null: false
      t.integer "poll_id", null: false
    end

    add_index "poll_options", ["poll_id"], name: "poll_id", using: :btree

    create_table "votes", force: :cascade do |t|
      t.integer "user_id", null: false
      t.integer "poll_option_id", null: false
      t.string "comment", limit: 200
    end

    add_index :votes, :poll_option_id
    add_index :votes, :user_id

    add_foreign_key "poll_options", "polls", name: "poll_options_ibfk_1"
    add_foreign_key "votes", "users", name: "votes_ibfk_1"
  end
end

# frozen_string_literal: true

class CreateVoteOptions < ActiveRecord::Migration
  def change
    create_table :vote_options do |t|
      t.integer "vote_id",        null: false
      t.integer "poll_option_id", null: false
    end

    change_column :polls, :question, :text

    remove_column :votes, :poll_option_id, :integer

    add_column :votes, :poll_id, :integer

    add_column :polls, :comment, :text
  end
end

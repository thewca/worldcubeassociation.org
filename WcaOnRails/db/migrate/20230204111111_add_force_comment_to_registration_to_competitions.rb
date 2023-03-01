# frozen_string_literal: true

class AddForceCommentToRegistrationToCompetitions < ActiveRecord::Migration[7.0]
  def change
    add_column :Competitions, :force_comment_in_registration, :boolean
  end
end

# frozen_string_literal: true

class AddTimestampsToPreregs < ActiveRecord::Migration
  def change
    change_table(:Preregs) { |t| t.timestamps }
  end
end

# frozen_string_literal: true

class AddWaitingListAndEventsDeadlinesToCompetitions < ActiveRecord::Migration[5.2]
  def change
    add_column :Competitions, :waiting_list_deadline_date, :datetime, null: true, default: nil
    add_column :Competitions, :event_change_deadline_date, :datetime, null: true, default: nil
  end
end

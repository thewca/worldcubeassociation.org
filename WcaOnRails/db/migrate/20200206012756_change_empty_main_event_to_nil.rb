# frozen_string_literal: true

class ChangeEmptyMainEventToNil < ActiveRecord::Migration[5.2]
  def change
    Competition.where(main_event_id: "").update_all(main_event_id: nil)
  end
end

# frozen_string_literal: true

class AddLeadDelegateIdToCompetitions < ActiveRecord::Migration[8.1]
  def change
    add_reference :competitions, :lead_delegate, after: :main_event_id
  end
end

# frozen_string_literal: true

class FixCompetitionResultTicketStatuses < ActiveRecord::Migration[7.2]
  def change
    reversible do |dir|
      dir.up do
        TicketsCompetitionResult.where(status: 'warnings_verification').update_all(status: 'locked_for_posting')
        TicketsCompetitionResult.where(status: 'results_verification').update_all(status: 'warnings_verified')
      end

      dir.down do
        TicketsCompetitionResult.where(status: 'locked_for_posting').update_all(status: 'warnings_verification')
        TicketsCompetitionResult.where(status: 'warnings_verified').update_all(status: 'results_verification')
      end
    end
  end
end

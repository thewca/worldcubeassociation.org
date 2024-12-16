# frozen_string_literal: true

class AddLastSuccessfulRunToCronjobs < ActiveRecord::Migration[7.1]
  def change
    add_column :cronjob_statistics, :successful_run_start, :datetime, precision: nil, after: :last_error_message

    reversible do |direction|
      direction.up do
        execute "UPDATE cronjob_statistics SET successful_run_start = run_start WHERE last_run_successful = 1"
      end
    end
  end
end

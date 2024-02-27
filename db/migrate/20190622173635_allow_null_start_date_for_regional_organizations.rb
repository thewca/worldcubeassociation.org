# frozen_string_literal: true

class AllowNullStartDateForRegionalOrganizations < ActiveRecord::Migration[5.2]
  def change
    change_column_null(:regional_organizations, :start_date, true)
  end
end

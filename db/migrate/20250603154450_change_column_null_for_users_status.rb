# frozen_string_literal: true

class ChangeColumnNullForUsersStatus < ActiveRecord::Migration[7.2]
  def change
    change_column_null :ticket_stakeholders, :stakeholder_role, false
  end
end

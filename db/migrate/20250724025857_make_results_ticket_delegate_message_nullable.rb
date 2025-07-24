# frozen_string_literal: true

class MakeResultsTicketDelegateMessageNullable < ActiveRecord::Migration[7.2]
  def change
    change_column_null :tickets_competition_result, :delegate_message, true
  end
end

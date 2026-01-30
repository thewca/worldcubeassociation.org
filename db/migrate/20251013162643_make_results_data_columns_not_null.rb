# frozen_string_literal: true

class MakeResultsDataColumnsNotNull < ActiveRecord::Migration[7.2]
  def change
    change_column_default :results, :person_name, from: nil, to: ""
    change_column_null :results, :person_name, false
    change_column_default :results, :country_id, from: nil, to: ""
    change_column_null :results, :country_id, false
  end
end

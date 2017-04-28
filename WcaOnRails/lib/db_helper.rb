# frozen_string_literal: true

module DbHelper
  # Executes a multiline SQL.
  def self.execute_sql(sql)
    sql.split(/;\s*$/).each do |statement|
      ActiveRecord::Base.connection.execute statement if statement.present?
    end
  end
end

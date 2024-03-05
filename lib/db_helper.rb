# frozen_string_literal: true

module DbHelper
  # Executes a multiline SQL.
  def self.execute_sql(sql)
    connection = ActiveRecord::Base.connection
    raw_connection = connection.raw_connection
    raw_connection.set_server_option(Mysql2::Client::OPTION_MULTI_STATEMENTS_ON)
    connection.execute sql
    raw_connection.set_server_option(Mysql2::Client::OPTION_MULTI_STATEMENTS_OFF)
    raw_connection.abandon_results!
  end
end

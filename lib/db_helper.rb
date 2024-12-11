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

  def self.with_temp_table(table_name)
    temp_table_name = "#{table_name}_temp"
    old_table_name = "#{table_name}_old"

    ActiveRecord::Base.connection.execute("CREATE TABLE #{temp_table_name} LIKE #{table_name}")
    ActiveRecord::Base.connection.execute("ALTER TABLE #{temp_table_name} AUTO_INCREMENT = 1")

    ActiveRecord::Base.transaction do
      yield temp_table_name
    end

    # Atomically swap the tables
    ActiveRecord::Base.connection.execute("RENAME TABLE #{table_name} TO #{old_table_name}, #{temp_table_name} TO #{table_name}")

    # Drop the old table
    ActiveRecord::Base.connection.execute("DROP TABLE #{old_table_name}")
  ensure
    ActiveRecord::Base.connection.execute("DROP TABLE IF EXISTS #{temp_table_name}")
    ActiveRecord::Base.connection.execute("DROP TABLE IF EXISTS #{old_table_name}")
  end

  def self.execute_cached_query(cache_params, timestamp, sql_query)
    # As we are using the native Rails cache we set the expiry date to 7 days
    #   as CAD is usually ran much more frequently than that
    Rails.cache.fetch([*cache_params, timestamp], expires_in: 7.days) do
      ActiveRecord::Base.connected_to(role: :read_replica) do
        ActiveRecord::Base.connection.exec_query(sql_query)
      end
    end
  end
end

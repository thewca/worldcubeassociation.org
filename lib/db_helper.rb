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
    connection = ActiveRecord::Base.connection

    temp_table_name = "#{table_name}_temp"
    old_table_name = "#{table_name}_old"

    quoted_table_name = connection.quote_table_name(table_name)
    quoted_temp_table_name = connection.quote_table_name(temp_table_name)
    quoted_old_table_name = connection.quote_table_name(old_table_name)

    # Clean up leftover tables from a previous run that was not cleanly terminated.
    #   In particular, redeployments can hard-kill Sidekiq in a way that skips the `ensure` block below.
    connection.execute("DROP TABLE IF EXISTS #{quoted_temp_table_name}")
    connection.execute("DROP TABLE IF EXISTS #{quoted_old_table_name}")

    connection.execute("CREATE TABLE #{quoted_temp_table_name} LIKE #{quoted_table_name}")
    connection.execute("ALTER TABLE #{quoted_temp_table_name} AUTO_INCREMENT = 1")

    ActiveRecord::Base.transaction do
      yield temp_table_name
    end

    # Atomically swap the tables
    connection.execute("RENAME TABLE #{quoted_table_name} TO #{quoted_old_table_name}, #{quoted_temp_table_name} TO #{quoted_table_name}")

    # Drop the old table
    connection.execute("DROP TABLE #{quoted_old_table_name}")
  ensure
    connection.execute("DROP TABLE IF EXISTS #{quoted_temp_table_name}")
    connection.execute("DROP TABLE IF EXISTS #{quoted_old_table_name}")
  end

  def self.execute_cached_query(cache_params, timestamp, sql_query, db_role: :read_replica)
    # As we are using the native Rails cache we set the expiry date to 7 days
    #   as CAD is usually ran much more frequently than that
    Rails.cache.fetch([*cache_params, timestamp], expires_in: 7.days) do
      ActiveRecord::Base.connected_to(role: db_role) do
        ActiveRecord::Base.connection.exec_query(sql_query)
      end
    end
  end
end

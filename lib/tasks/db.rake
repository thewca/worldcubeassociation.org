# frozen_string_literal: true

# Copied from https://gist.github.com/koffeinfrei/8931935,
# and slightly modified.
namespace :db do
  namespace :data do
    desc 'Validates all records in the database'
    task validate: :environment do
      original_log_level = ActiveRecord::Base.logger.level
      ActiveRecord::Base.logger.level = 1

      puts 'Validate database (this will take some time)...'

      # http://stackoverflow.com/a/10712838/1739415
      Rails.application.eager_load!

      error_count = 0
      # There is a bug in RuboCop which wants to move the "rescue" to align with "ActiveRecord" at the beginning of the line
      # Haven't found a workaround yet other than upgrading, which we cannot do because of our old infrastructure
      ActiveRecord::Base.subclasses
                        .reject { |type| type.to_s.include?('::') || type.to_s == "WiceGridSerializedQuery" }
                        .each do |type|
        type.find_each do |record|
          unless record.valid?
            puts "#<#{type} id: #{record.id}, errors: #{record.errors.full_messages}>"
            error_count += 1
          end
        end
      rescue StandardError => e
        puts "An exception occurred: #{e.message}"
        error_count += 1
      end
      ActiveRecord::Base.logger.level = original_log_level

      exit error_count > 0 ? 1 : 0
    end
  end

  namespace :dump do
    desc 'Generates a dump of our database with sensitive information stripped, safe for public viewing.'
    task development: :environment do
      DbDumpHelper.dump_developer_db
    end

    task public_results: :environment do
      DbDumpHelper.dump_results_db
    end
  end

  namespace :load do
    desc 'Download and import the publicly accessible database dump from the production server'
    task development: :environment do
      if EnvConfig.WCA_LIVE_SITE?
        abort "This actions is disabled for the production server!"
      end

      Dir.mktmpdir do |dir|
        FileUtils.cd dir do
          dev_db_dump_url = DbDumpHelper.public_s3_path(DbDumpHelper::DEVELOPER_EXPORT_SQL_PERMALINK)
          local_file = "./dump.zip"
          LogTask.log_task("Downloading #{dev_db_dump_url}") do
            system("curl -o #{local_file} #{dev_db_dump_url}") || raise("Error while running `curl`")
          end
          LogTask.log_task("Unzipping dump.zip") do
            system("unzip #{local_file} ") || raise("Error while running `unzip`")
          end

          config = ActiveRecord::Base.connection_db_config
          LogTask.log_task "Clobbering contents of '#{config.database}' with #{local_file} " do
            ActiveRecord::Tasks::DatabaseTasks.drop config
            ActiveRecord::Tasks::DatabaseTasks.create config

            DatabaseDumper.mysql("SET unique_checks=0", config.database)
            DatabaseDumper.mysql("SET foreign_key_checks=0", config.database)
            DatabaseDumper.mysql("SET autocommit=0", config.database)
            if Rails.env.development?
              DatabaseDumper.mysql("SET GLOBAL innodb_flush_log_at_trx_commit=0", config.database)
            end

            # Explicitly loading the schema is not necessary because the downloaded SQL dump file contains CREATE TABLE
            # definitions, so if we load the schema here the SOURCE command below would overwrite it anyways

            DatabaseDumper.mysql("SOURCE #{DbDumpHelper::DEVELOPER_EXPORT_SQL}", config.database)

            DatabaseDumper.mysql("SET unique_checks=1", config.database)
            DatabaseDumper.mysql("SET foreign_key_checks=1", config.database)
            DatabaseDumper.mysql("SET autocommit=1", config.database)
            if Rails.env.development?
              DatabaseDumper.mysql("SET GLOBAL innodb_flush_log_at_trx_commit=1", config.database)
            end

            # We always Commit, even if RDS has autocommit=1, it will act as a No Op
            DatabaseDumper.mysql("COMMIT", config.database)
          end

          dummy_password = DbDumpHelper.use_staging_password? ? AppSecrets.STAGING_PASSWORD : DbDumpHelper::DEFAULT_DEV_PASSWORD

          default_encrypted_password = User.new(password: dummy_password).encrypted_password
          LogTask.log_task "Setting all user passwords to '#{dummy_password}'" do
            User.update_all encrypted_password: default_encrypted_password
          end

          # Create an OAuth application so people can easily play around with OAuth on staging.
          Doorkeeper::Application.create!(
            name: "Example Application for staging",
            uid: "example-application-id",
            secret: "example-secret",
            redirect_uri: "urn:ietf:wg:oauth:2.0:oob",
            dangerously_allow_any_redirect_uri: true,
            scopes: Doorkeeper.configuration.scopes.to_s,
            owner_id: User.find_by_wca_id!("2005FLEI01").id,
            owner_type: "User",
          )
        end
      end
    end
  end

  namespace :reload do
    desc 'Reload the development database with a fresh copy from the production dump without downtime'
    task development: :environment do
      if EnvConfig.WCA_LIVE_SITE?
        abort "This action is disabled for the production server!"
      end

      Dir.mktmpdir do |dir|
        FileUtils.cd dir do
          dev_db_dump_url = DbDumpHelper.public_s3_path(DbDumpHelper::DEVELOPER_EXPORT_SQL_PERMALINK)
          local_file = "./dump.zip"

          LogTask.log_task("Downloading #{dev_db_dump_url}") do
            system("curl -o #{local_file} #{dev_db_dump_url}") || raise("Error while running `curl`")
          end

          LogTask.log_task("Unzipping dump.zip") do
            system("unzip #{local_file}") || raise("Error while running `unzip`")
          end

          config = ActiveRecord::Base.connection_db_config.configuration_hash
          database_name = config[:database]
          temp_db_name = "#{database_name}_temp"

          LogTask.log_task "Creating and loading temporary database '#{temp_db_name}'" do
            # Create the temporary database
            ActiveRecord::Base.establish_connection(config.merge(database: nil))
            ActiveRecord::Base.connection.execute("DROP DATABASE IF EXISTS #{temp_db_name} ")
            ActiveRecord::Base.connection.execute("CREATE DATABASE #{temp_db_name}")

            # Disable certain checks for faster loading
            DatabaseDumper.mysql("SET unique_checks=0", temp_db_name)
            DatabaseDumper.mysql("SET foreign_key_checks=0", temp_db_name)
            DatabaseDumper.mysql("SET autocommit=0", temp_db_name)

            if Rails.env.development?
              DatabaseDumper.mysql("SET GLOBAL innodb_flush_log_at_trx_commit=0", temp_db_name)
            end

            # Load the dump into the temporary database
            DatabaseDumper.mysql("SOURCE #{DbDumpHelper::DEVELOPER_EXPORT_SQL}", temp_db_name)

            # Commit any pending transactions
            DatabaseDumper.mysql("COMMIT", temp_db_name)
          end

          # RENAME Database has been removed, that's why we need to swap tables
          LogTask.log_task "Swapping tables between databases" do
            ActiveRecord::Base.connection.execute("CREATE DATABASE #{database_name}_old")
            # Re-establish the connection to the old database so we can swap
            ActiveRecord::Base.establish_connection(config)
            # Get the list of tables from the current database using ActiveRecord
            current_tables = ActiveRecord::Base.connection.execute("SHOW TABLES").map { |row| row[0] }

            # Get the list of tables in the temporary database because there might be new tables
            temp_tables = ActiveRecord::Base.connection.execute("SHOW TABLES FROM #{temp_db_name}").map { |row| row[0] }

            # Swap tables between the databases
            temp_tables.each do |table|
              if current_tables.include?(table)
                rename_sql = "RENAME TABLE #{database_name}.#{table} TO #{database_name}_old.#{table}, #{temp_db_name}.#{table} TO #{database_name}.#{table};"
              else
                rename_sql = "RENAME TABLE #{temp_db_name}.#{table} TO #{database_name}.#{table};"
              end
              ActiveRecord::Base.connection.execute(rename_sql)
            end
          end

          # Clean up the old database
          LogTask.log_task "Dropping old database" do
            ActiveRecord::Base.establish_connection(config.merge(database: nil))
            ActiveRecord::Base.connection.execute("DROP DATABASE #{temp_db_name}")
            ActiveRecord::Base.connection.execute("DROP DATABASE #{database_name}_old")
          end

          # Re-enable checks
          if Rails.env.development?
            DatabaseDumper.mysql("SET GLOBAL innodb_flush_log_at_trx_commit=1", temp_db_name)
          end

          # Re-establish the connection to the new database (which also re-enables local checks)
          ActiveRecord::Base.establish_connection(config)

          # Update passwords and other configurations in the new database
          LogTask.log_task "Updating user passwords and creating OAuth application" do
            dummy_password = DbDumpHelper.use_staging_password? ? AppSecrets.STAGING_PASSWORD : DbDumpHelper::DEFAULT_DEV_PASSWORD
            default_encrypted_password = User.new(password: dummy_password).encrypted_password
            User.update_all encrypted_password: default_encrypted_password

            Doorkeeper::Application.create!(
              name: "Example Application for staging",
              uid: "example-application-id",
              secret: "example-secret",
              redirect_uri: "urn:ietf:wg:oauth:2.0:oob",
              dangerously_allow_any_redirect_uri: true,
              scopes: Doorkeeper.configuration.scopes.to_s,
              owner_id: User.find_by_wca_id!("2005FLEI01").id,
              owner_type: "User",
            )
          end
        end
      end
    end
  end
end

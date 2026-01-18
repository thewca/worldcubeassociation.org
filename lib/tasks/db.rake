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

      exit error_count.positive? ? 1 : 0
    end
  end

  namespace :dump do
    desc 'Generates a dump of our database with sensitive information stripped, safe for public viewing.'
    task development: :environment do
      DbDumpHelper.dump_developer_db
    end

    desc 'Generates a partial dump of our database containing only results and relevant stuff for statistics.'
    # task public_results: :environment do
    task :public_results, [:local] => [:environment] do |_, args|
      local = args[:local].present?

      DatabaseDumper.results_export_live_versions.each do |v|
        puts "Dumping results #{'locally' if local} for version: #{v}."
        DbDumpHelper.dump_results_db(v, local: local)
      end
    end
  end

  namespace :load do
    desc 'Download and import the publicly accessible database dump from the production server, use the reload parameter to replace an already existing DB without downtime'
    task :development, [:reload] => [:environment] do |_, args|
      abort "This actions is disabled for the production server!" if EnvConfig.WCA_LIVE_SITE?

      reload = args[:reload] || false

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
          config_hash = ActiveRecord::Base.connection_db_config.configuration_hash
          database_name = config.database
          temp_db_name = "#{database_name}_temp"

          load_description = reload ? "Reloading Database '#{database_name}' from #{local_file}" : "Clobbering contents of '#{database_name}' with #{local_file}"

          LogTask.log_task load_description do
            # Create new or temporary db
            working_db = if reload
                           ActiveRecord::Base.establish_connection(config_hash.merge(database: nil))
                           ActiveRecord::Base.connection.execute("DROP DATABASE IF EXISTS #{temp_db_name} ")
                           ActiveRecord::Base.connection.execute("CREATE DATABASE #{temp_db_name}")
                           temp_db_name
                         else
                           ActiveRecord::Tasks::DatabaseTasks.drop config
                           ActiveRecord::Tasks::DatabaseTasks.create config
                           database_name
                         end

            DatabaseDumper.mysql("SET unique_checks=0", working_db)
            DatabaseDumper.mysql("SET foreign_key_checks=0", working_db)
            DatabaseDumper.mysql("SET autocommit=0", working_db)
            DatabaseDumper.mysql("SET GLOBAL innodb_flush_log_at_trx_commit=0", working_db) if Rails.env.development?

            # Explicitly loading the schema is not necessary because the downloaded SQL dump file contains CREATE TABLE
            # definitions, so if we load the schema here the SOURCE command below would overwrite it anyways

            DatabaseDumper.mysql("SOURCE #{DbDumpHelper::DEVELOPER_EXPORT_SQL}", working_db)

            DatabaseDumper.mysql("SET unique_checks=1", working_db)
            DatabaseDumper.mysql("SET foreign_key_checks=1", working_db)
            DatabaseDumper.mysql("SET autocommit=1", working_db)
            DatabaseDumper.mysql("SET GLOBAL innodb_flush_log_at_trx_commit=1", working_db) if Rails.env.development?

            DatabaseDumper.mysql("COMMIT", working_db)
          end

          # Achieve no downtime reload by swapping tables
          if reload
            LogTask.log_task "Swapping tables between databases" do
              ActiveRecord::Base.connection.execute("CREATE DATABASE #{database_name}_old")
              # Re-establish the connection to the old database so we can swap
              ActiveRecord::Base.establish_connection(config_hash)
              # Get the list of tables from the current database using ActiveRecord
              current_tables = ActiveRecord::Base.connection.tables

              # Get the list of tables in the temporary database because there might be new tables
              temp_tables = ActiveRecord::Base.connection.execute("SHOW TABLES FROM #{temp_db_name}").map { |row| row[0] }

              # Swap tables between the databases
              temp_tables.each do |table|
                rename_sql = if current_tables.include?(table)
                               "RENAME TABLE #{database_name}.#{table} TO #{database_name}_old.#{table}, #{temp_db_name}.#{table} TO #{database_name}.#{table};"
                             else
                               "RENAME TABLE #{temp_db_name}.#{table} TO #{database_name}.#{table};"
                             end
                ActiveRecord::Base.connection.execute(rename_sql)
              end
            end

            # Clean up the old database
            LogTask.log_task "Dropping old database" do
              ActiveRecord::Base.establish_connection(config_hash.merge(database: nil))
              ActiveRecord::Base.connection.execute("DROP DATABASE #{temp_db_name}")
              ActiveRecord::Base.connection.execute("DROP DATABASE #{database_name}_old")
              ActiveRecord::Base.establish_connection(config_hash)
            end
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
            owner_id: User.find_by!(wca_id: "2005FLEI01").id,
            owner_type: "User",
          )
        end
      end
    end
  end
end

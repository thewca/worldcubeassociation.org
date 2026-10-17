# frozen_string_literal: true

def apply_connection_options(**opts)
  opts.each do |key, opt|
    global_scope, desired_value = opt.values_at(:global, :value)

    scope_modifier = global_scope ? "GLOBAL" : "SESSION"
    ActiveRecord::Base.connection.execute("SET #{scope_modifier} #{key}=#{desired_value}")
  end
end

def with_connection_options(**opts, &)
  current_settings = opts.to_h do |key, opt|
    sql_var_name = "@@#{key}"
    query_res = ActiveRecord::Base.connection.exec_query("SELECT #{sql_var_name}")

    # exec_query above is designed to return many rows at once. But by design of our specific query,
    #   we know for sure only one row will ever be returned. That's why we use `first` sloppily.
    current_value = query_res.first[sql_var_name]
    current_setting = { **opt, value: current_value }

    [key, current_setting]
  end

  begin
    apply_connection_options(**opts)
    yield
  ensure
    apply_connection_options(**current_settings)
  end
end

def within_database(db_name, **connection_opts, &)
  base_config = ActiveRecord::Base.connection_db_config
  temp_config_hash = base_config.configuration_hash.merge(database: db_name)

  begin
    ActiveRecord::Base.establish_connection(temp_config_hash)

    with_connection_options(**connection_opts) do
      yield temp_config_hash
    end
  ensure
    ActiveRecord::Base.establish_connection(base_config)
  end
end

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
    task :development, [:local] => [:environment] do |_, args|
      local = args[:local].present?

      puts "Dumping developer database #{'locally' if local}."
      DbDumpHelper.dump_developer_db(local: local)
    end

    desc 'Generates a partial dump of our database containing only results and relevant stuff for statistics.'
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

          database_name = ActiveRecord::Base.connection.current_database
          temp_db_name = "#{database_name}_temp"

          load_description = reload ? "Reloading Database '#{database_name}' from #{local_file}" : "Clobbering contents of '#{database_name}' with #{local_file}"

          LogTask.log_task load_description do
            # Create new or temporary db
            working_db = reload ? temp_db_name : database_name

            within_database(working_db) do |temp_config|
              ActiveRecord::Tasks::DatabaseTasks.drop temp_config
              ActiveRecord::Tasks::DatabaseTasks.create temp_config
            end

            import_options = {
              unique_checks: { global: false, value: 0 },
              foreign_key_checks: { global: false, value: 0 },
              autocommit: { global: false, value: 0 },
            }

            import_options[:innodb_flush_log_at_trx_commit] = { global: true, value: 0 } if Rails.env.development?

            within_database(working_db, **import_options.compact) do
              # Explicitly loading the schema is not necessary because the downloaded SQL dump file contains CREATE TABLE
              # definitions, so if we load the schema here the SOURCE command below would overwrite it anyways

              DatabaseDumper.mysql("SOURCE #{DbDumpHelper::DEVELOPER_EXPORT_SQL}", working_db)
              ActiveRecord::Base.connection.commit_db_transaction
            end
          end

          # Achieve no downtime reload by swapping tables
          if reload
            old_db_name = "#{database_name}_old"

            LogTask.log_task "Swapping tables between databases" do
              within_database(old_db_name) do |temp_config|
                ActiveRecord::Tasks::DatabaseTasks.create temp_config
              end

              # Get the list of tables from the current database using ActiveRecord
              current_tables = ActiveRecord::Base.connection.tables

              # Get the list of tables in the temporary database because there might be new tables
              temp_tables = within_database(temp_db_name) { ActiveRecord::Base.connection.tables }

              # Swap tables between the databases
              temp_tables.each do |table|
                renames = [temp_db_name, database_name]
                renames << old_db_name if current_tables.include?(table)

                # `each_cons` stands for "each-consecutive", creating a sliding window:
                #   [1,2,3,4].each_cons(2) creates [[1,2],[2,3],[3,4]]
                # We need to reverse these windows because we first need to "swap away" the existing table
                #   into the old_db to "make room", and then execute the original temp -> existing swap
                rename_swaps = renames.each_cons(2).to_a.reverse

                rename_sub_statements = rename_swaps.map { |from, to| "#{from}.#{table} TO #{to}.#{table}" }
                rename_sql = "RENAME TABLE #{rename_sub_statements.join(', ')}"

                ActiveRecord::Base.connection.execute(rename_sql)
              end
            end

            # Clean up the old database
            LogTask.log_task "Dropping old database" do
              # Even when you turn MySQL to burn the whole database down, it still worries about
              #   foreign key integrity in the middle of the deletion process...
              # WHO MADE THAT DESIGN DECISION ON THE InnoDB TEAM??!
              drop_options = { foreign_key_checks: { global: false, value: 0 } }

              within_database(temp_db_name, **drop_options) { ActiveRecord::Tasks::DatabaseTasks.drop it }
              within_database(old_db_name, **drop_options) { ActiveRecord::Tasks::DatabaseTasks.drop it }
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

          # Run the CAD jobs so that results are available
          LogTask.log_task "Populating CAD tables" do
            AuxiliaryDataComputation.compute_everything
          end
        end
      end
    end
  end
end

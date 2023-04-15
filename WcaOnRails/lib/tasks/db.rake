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
      Dir.mktmpdir do |dir|
        FileUtils.cd dir do
          DatabaseDumper.development_dump(DatabaseController::DEVELOPER_EXPORT_SQL)

          LogTask.log_task "Zipping '#{DatabaseController::DEVELOPER_EXPORT_SQL}' to '#{DatabaseController::DEVELOPER_EXPORT_SQL_PERMALINK}'" do
            system("zip #{DatabaseController::DEVELOPER_EXPORT_SQL_PERMALINK} #{DatabaseController::DEVELOPER_EXPORT_SQL}") || raise("Error running `zip`")
          end

          public_zip_path = DatabaseController::DEVELOPER_EXPORT_FOLDER.join(DatabaseController::DEVELOPER_EXPORT_SQL_PERMALINK)

          LogTask.log_task "Moving zipped file to '#{public_zip_path}'" do
            FileUtils.mkpath(File.dirname(public_zip_path))
            FileUtils.mv(DatabaseController::DEVELOPER_EXPORT_SQL_PERMALINK, public_zip_path)
          end
        end
      end
    end

    task public_results: :environment do
      Dir.mktmpdir do |dir|
        FileUtils.cd dir do
          export_timestamp = DateTime.now

          tsv_folder_name = "TSV_export"
          FileUtils.mkpath tsv_folder_name

          DatabaseDumper.public_results_dump(DatabaseController::RESULTS_EXPORT_SQL, tsv_folder_name)

          metadata = {
            'export_format_version' => DatabaseDumper::PUBLIC_RESULTS_VERSION,
            'export_date' => export_timestamp,
          }
          File.write(DatabaseController::RESULTS_EXPORT_METADATA, JSON.dump(metadata))

          readme_template = DatabaseController.render_readme(ActionController::Base.new, export_timestamp)
          File.write(DatabaseController::RESULTS_EXPORT_README, readme_template)

          # Remove old exports to save storage space
          FileUtils.rm_r DatabaseController::RESULTS_EXPORT_FOLDER, force: true, secure: true

          def zip_and_permalink(zip_filename, permalink_filename, *additional_files)
            zip_contents = [DatabaseController::RESULTS_EXPORT_METADATA, DatabaseController::RESULTS_EXPORT_README] | additional_files
            zip_filelist = zip_contents.join(" ")

            LogTask.log_task "Zipping metadata and #{additional_files.length} additional files to '#{zip_filename}'" do
              system("zip #{zip_filename} #{zip_filelist}") || raise("Error running `zip`")
            end

            public_zip_path = DatabaseController::RESULTS_EXPORT_FOLDER.join(zip_filename)
            permalink_zip_path = DatabaseController::RESULTS_EXPORT_FOLDER.join(permalink_filename)

            LogTask.log_task "Moving zipped file to '#{public_zip_path}'" do
              FileUtils.mkpath(File.dirname(public_zip_path))
              FileUtils.mv(zip_filename, public_zip_path)
              # Writing a RELATIVE link, so that we can do readlink in dev and prod and not care about stuff like Docker
              FileUtils.ln_s(zip_filename, permalink_zip_path, force: true)
            end
          end

          sql_zip_filename = "WCA_export#{export_timestamp.strftime('%j')}_#{export_timestamp.strftime('%Y%m%dT%H%M%SZ')}.sql.zip"
          zip_and_permalink(sql_zip_filename, DatabaseController::RESULTS_EXPORT_SQL_PERMALINK, DatabaseController::RESULTS_EXPORT_SQL)

          tsv_zip_filename = "WCA_export#{export_timestamp.strftime('%j')}_#{export_timestamp.strftime('%Y%m%dT%H%M%SZ')}.tsv.zip"
          tsv_files = Dir.glob("#{tsv_folder_name}/*.tsv").map do |tsv|
            FileUtils.mv(tsv, '.')
            File.basename tsv
          end

          zip_and_permalink(tsv_zip_filename, DatabaseController::RESULTS_EXPORT_TSV_PERMALINK, *tsv_files)
        end
      end
    end
  end

  namespace :load do
    desc 'Download and import the publicly accessible database dump from the production server'
    task development: :environment do
      if EnvVars.WCA_LIVE_SITE?
        abort "This actions is disabled for the production server!"
      end

      Dir.mktmpdir do |dir|
        FileUtils.cd dir do
          dev_db_dump_url = "https://www.worldcubeassociation.org/export/developer/#{DatabaseController::DEVELOPER_EXPORT_SQL_PERMALINK}"

          LogTask.log_task("Downloading #{dev_db_dump_url}") do
            system("curl -o #{DatabaseController::DEVELOPER_EXPORT_SQL_PERMALINK} #{dev_db_dump_url}") || raise("Error while running `curl`")
          end
          LogTask.log_task("Unzipping #{DatabaseController::DEVELOPER_EXPORT_SQL_PERMALINK}") do
            system("unzip #{DatabaseController::DEVELOPER_EXPORT_SQL_PERMALINK}") || raise("Error while running `unzip`")
          end

          config = ActiveRecord::Base.connection_db_config
          LogTask.log_task "Clobbering contents of '#{config.database}' with #{DatabaseController::DEVELOPER_EXPORT_SQL}" do
            DatabaseDumper.mysql("DROP DATABASE IF EXISTS #{config.database}")
            DatabaseDumper.mysql("CREATE DATABASE #{config.database}")
            DatabaseDumper.mysql("SOURCE #{DatabaseController::DEVELOPER_EXPORT_SQL}", config.database)
          end

          default_password = 'wca'
          default_encrypted_password = User.new(password: default_password).encrypted_password
          LogTask.log_task "Setting all user passwords to '#{default_password}'" do
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
end

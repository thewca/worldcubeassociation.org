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
          dump_filename = "wca-developer-database-dump.sql"
          zip_filename = "wca-developer-database-dump.zip"
          DatabaseDumper.development_dump(dump_filename)

          LogTask.log_task "Zipping '#{dump_filename}' to '#{zip_filename}'" do
            system("zip #{zip_filename} #{dump_filename}") || raise("Error running `zip`")
          end

          public_zip_path = Rails.root.join('public', 'export', 'developer', zip_filename)

          LogTask.log_task "Moving zipped file to '#{public_zip_path}'" do
            FileUtils.mkpath(File.dirname(public_zip_path))
            FileUtils.mv(zip_filename, public_zip_path)
          end
        end
      end
    end

    task public_results: :environment do
      Dir.mktmpdir do |dir|
        FileUtils.cd dir do
          export_timestamp = DateTime.now

          dump_filename = "WCA_export.sql"
          sql_zip_filename = "WCA_export#{export_timestamp.strftime('%j')}_#{export_timestamp.strftime('%Y%m%dT%H%M%SZ')}.sql.zip"
          DatabaseDumper.public_results_dump(dump_filename)

          metadata_filename = "metadata.json"
          metadata = {
            'export_format_version' => DatabaseDumper::PUBLIC_RESULTS_VERSION,
            'export_date' => export_timestamp
          }
          File.write(metadata_filename, JSON.dump(metadata))

          readme_filename = "README.md"
          readme_template = ActionController::Base.new.render_to_string(partial: 'database/public_results_readme', formats: :md, locals: { long_date: export_timestamp, export_version: DatabaseDumper::PUBLIC_RESULTS_VERSION })
          File.write(readme_filename, readme_template)

          LogTask.log_task "Zipping '#{dump_filename}' and metadata to '#{sql_zip_filename}'" do
            system("zip #{sql_zip_filename} #{dump_filename} #{metadata_filename} #{readme_filename}") || raise("Error running `zip`")
          end

          public_zip_path = Rails.root.join('public', 'export', 'results', sql_zip_filename)
          permalink_zip_path = Rails.root.join('public', 'export', 'results', DatabaseController::SQL_PERMALINK_FILE)

          LogTask.log_task "Moving zipped file to '#{public_zip_path}'" do
            FileUtils.mkpath(File.dirname(public_zip_path))
            FileUtils.mv(sql_zip_filename, public_zip_path)
            # Writing a RELATIVE link, so that we can do readlink in dev and prod and not care about stuff like Docker
            FileUtils.ln_s(sql_zip_filename, permalink_zip_path, force: true)
          end
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
          dev_db_dump_url = "https://www.worldcubeassociation.org/wst/wca-developer-database-dump.zip"
          dump_filename = "wca-developer-database-dump.sql"
          zip_filename = "wca-developer-database-dump.zip"

          LogTask.log_task("Downloading #{dev_db_dump_url}") do
            system("curl -o #{zip_filename} #{dev_db_dump_url}") || raise("Error while running `curl`")
          end
          LogTask.log_task("Unzipping #{zip_filename}") do
            system("unzip #{zip_filename}") || raise("Error while running `unzip`")
          end

          config = ActiveRecord::Base.connection_db_config
          LogTask.log_task "Clobbering contents of '#{config.database}' with #{dump_filename}" do
            DatabaseDumper.mysql("DROP DATABASE IF EXISTS #{config.database}")
            DatabaseDumper.mysql("CREATE DATABASE #{config.database}")
            DatabaseDumper.mysql("SOURCE #{dump_filename}", config.database)
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

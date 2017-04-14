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
      ActiveRecord::Base.subclasses
                        .reject { |type| type.to_s.include?('::') || type.to_s == "WiceGridSerializedQuery" }
                        .each do |type|
                          begin
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
            `zip #{zip_filename} #{dump_filename}`
            raise "zip returned: #{$CHILD_STATUS.exitstatus}" unless $CHILD_STATUS.success?
          end

          public_zip_path = Rails.root.join('public', 'wst', zip_filename)
          FileUtils.mkpath(File.dirname(public_zip_path))
          FileUtils.mv(zip_filename, public_zip_path)
        end
      end
    end
  end

  namespace :load do
    desc 'Download and import the publicly accessible database dump from the production server'
    task development: :environment do
      Dir.mktmpdir do |dir|
        FileUtils.cd dir do
          dev_db_dump_url = "https://www.worldcubeassociation.org/wst/wca-developer-database-dump.zip"
          dump_filename = "wca-developer-database-dump.sql"
          zip_filename = "wca-developer-database-dump.zip"

          LogTask.log_task("Downloading #{dev_db_dump_url}") { `wget #{dev_db_dump_url}` }
          LogTask.log_task("Unzipping #{zip_filename}") { `unzip #{zip_filename}` }

          config = ActiveRecord::Base.connection_config
          LogTask.log_task "Clobbering contents of '#{config[:database]}' with #{dump_filename}" do
            DatabaseDumper.mysql("DROP DATABASE IF EXISTS #{config[:database]}")
            DatabaseDumper.mysql("CREATE DATABASE #{config[:database]}")
            DatabaseDumper.mysql("SOURCE #{dump_filename}", config[:database])
          end

          default_password = 'wca'
          default_encrypted_password = User.new(password: default_password).encrypted_password
          LogTask.log_task "Setting all user passwords to '#{default_password}'" do
            User.update_all encrypted_password: default_encrypted_password
          end
        end
      end
    end
  end
end

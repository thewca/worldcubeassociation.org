# frozen_string_literal: true

module DbDumpHelper
  S3_BASE_PATH = "export"

  RESULTS_EXPORT_FOLDER = "#{S3_BASE_PATH}/results".freeze
  RESULTS_EXPORT_FILENAME = 'WCA_export'
  RESULTS_EXPORT_SQL = "#{RESULTS_EXPORT_FILENAME}.sql".freeze
  RESULTS_EXPORT_README = 'README.md'
  RESULTS_EXPORT_METADATA = 'metadata.json'
  RESULTS_EXPORT_SQL_PERMALINK = "#{RESULTS_EXPORT_SQL}.zip".freeze
  RESULTS_EXPORT_TSV_PERMALINK = "#{RESULTS_EXPORT_FILENAME}.tsv.zip".freeze

  DEVELOPER_EXPORT_FOLDER = "#{S3_BASE_PATH}/developer".freeze
  DEVELOPER_EXPORT_FILENAME = "wca-developer-database-dump"
  DEVELOPER_EXPORT_SQL = "#{DEVELOPER_EXPORT_FILENAME}.sql".freeze
  DEVELOPER_EXPORT_SQL_PERMALINK = "#{DEVELOPER_EXPORT_FOLDER}/#{DEVELOPER_EXPORT_FILENAME}.zip".freeze
  BUCKET_NAME = 'assets.worldcubeassociation.org'
  DEFAULT_DEV_PASSWORD = 'wca'

  def self.dump_developer_db
    Dir.mktmpdir do |dir|
      FileUtils.cd dir do
        # WARNING: Headache ahead! By using Rails-DSL database schema files, the migrations in the dev export can break.
        #   Rails uses the timestamp at the top of the schema file to determine which migration is the latest one.
        #   It then proceeds to glob the migration folder for older migrations and inserts them when loading the schema.
        #   However, this glob is _relative_ to the Rails root. Due to our chdir into a temporary directory (where we can
        #   write files to our heart's desire) the glob returns an empty list. So we symlink the migrations into our tmp
        #   working directory to make sure that Rails can find them when loading/dumping the schema.
        primary_connection_pool = ActiveRecord::Base.connection_pool
        migration_paths = primary_connection_pool.migration_context.migrations_paths

        migration_paths.each do |migration_path|
          FileUtils.mkpath(File.dirname(migration_path))

          abs_migrations = File.join(Rails.application.root, migration_path)
          FileUtils.ln_s abs_migrations, migration_path, verbose: true
        end

        DatabaseDumper.development_dump(DEVELOPER_EXPORT_SQL)
        zip_file_name = File.basename(DEVELOPER_EXPORT_SQL_PERMALINK)

        self.zip_and_upload_to_s3(zip_file_name, DEVELOPER_EXPORT_SQL_PERMALINK, DEVELOPER_EXPORT_SQL)
      end
    end
  end

  def self.public_s3_path(file_name)
    "#{EnvConfig.DUMP_HOST}/#{file_name}"
  end

  def self.dump_results_db(export_timestamp = DateTime.now)
    Dir.mktmpdir do |dir|
      FileUtils.cd dir do
        tsv_folder_name = "TSV_export"
        FileUtils.mkpath tsv_folder_name

        DatabaseDumper.public_results_dump(RESULTS_EXPORT_SQL, tsv_folder_name)

        metadata = {
          'export_format_version' => DatabaseDumper::PUBLIC_RESULTS_VERSION,
          'export_date' => export_timestamp,
        }
        File.write(RESULTS_EXPORT_METADATA, JSON.dump(metadata))

        readme_template = DatabaseController.render_readme(ActionController::Base.new, export_timestamp)
        File.write(RESULTS_EXPORT_README, readme_template)

        sql_zip_filename = self.result_export_file_name("sql", export_timestamp)
        sql_zip_contents = [RESULTS_EXPORT_METADATA, RESULTS_EXPORT_README, RESULTS_EXPORT_SQL]

        self.zip_and_upload_to_s3(sql_zip_filename, "#{RESULTS_EXPORT_FOLDER}/#{sql_zip_filename}", *sql_zip_contents)

        tsv_zip_filename = self.result_export_file_name("tsv", export_timestamp)
        tsv_files = Dir.glob("#{tsv_folder_name}/*.tsv").map do |tsv|
          FileUtils.mv(tsv, '.')
          File.basename tsv
        end

        tsv_zip_contents = [RESULTS_EXPORT_METADATA, RESULTS_EXPORT_README] | tsv_files
        self.zip_and_upload_to_s3(tsv_zip_filename, "#{RESULTS_EXPORT_FOLDER}/#{tsv_zip_filename}", *tsv_zip_contents)
      end
    end
  end

  def self.result_export_file_name(file_type, timestamp)
    "WCA_export#{timestamp.strftime('%j')}_#{timestamp.strftime('%Y%m%dT%H%M%SZ')}.#{file_type}.zip"
  end

  def self.zip_and_upload_to_s3(zip_filename, s3_path, *zip_contents)
    zip_file_list = zip_contents.join(" ")

    LogTask.log_task "Zipping #{zip_contents.length} file entries to '#{zip_filename}'" do
      system("zip #{zip_filename} #{zip_file_list}", exception: true)
    end

    LogTask.log_task "Moving zipped file to 's3://#{s3_path}'" do
      bucket = Aws::S3::Resource.new(
        region: EnvConfig.STORAGE_AWS_REGION,
        credentials: Aws::ECSCredentials.new,
      ).bucket(BUCKET_NAME)
      bucket.object(s3_path).upload_file(zip_filename)

      # Delete the zipfile now that it's uploaded
      FileUtils.rm zip_filename

      # Invalidate Export Route in Prod
      if EnvConfig.WCA_LIVE_SITE?
        Aws::CloudFront::Client.new(region: EnvConfig.STORAGE_AWS_REGION,
                                    credentials: Aws::ECSCredentials.new)
                               .create_invalidation({
                                                      distribution_id: EnvConfig.CDN_ASSETS_DISTRIBUTION_ID,
                                                      invalidation_batch: {
                                                        paths: {
                                                          quantity: 1,
                                                          items: ["/#{s3_path}"], # AWS SDK throws an error if the path doesn't start with "/"
                                                        },
                                                        caller_reference: "DB Dump invalidation #{Time.now.utc}",
                                                      },
                                                    })
      end
    end
  end

  def self.use_staging_password?
    Rails.env.production? && !EnvConfig.WCA_LIVE_SITE?
  end
end

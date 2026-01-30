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

  def self.public_s3_file_size(file_name)
    return 123_456 unless Rails.env.production?

    bucket = Aws::S3::Resource.new(
      credentials: Aws::ECSCredentials.new,
    ).bucket(DbDumpHelper::BUCKET_NAME)

    bucket.object(file_name).content_length
  end

  def self.resolve_results_export(file_type, version, export_timestamp = DumpPublicResultsDatabase.successful_start_date)
    return self.result_export_file_name(file_type, version, Time.new(2025, 11, 25)) unless Rails.env.production?

    base_name = DbDumpHelper.result_export_file_name(file_type, version, export_timestamp)

    "#{DbDumpHelper::RESULTS_EXPORT_FOLDER}/#{base_name}"
  end

  def self.cached_results_export_info(file_type, version, export_timestamp = DumpPublicResultsDatabase.successful_start_date)
    Rails.cache.fetch("database-export-#{export_timestamp}-#{file_type}-#{version}", expires_in: 1.day) do
      file_name = DbDumpHelper.resolve_results_export(file_type, version)

      filesize_bytes = DbDumpHelper.public_s3_file_size(file_name)
      [DbDumpHelper.public_s3_path(file_name), filesize_bytes]
    end
  end

  def self.dump_results_db(version, export_timestamp = DateTime.now, local: false)
    target_dir = local ? "#{RESULTS_EXPORT_FILENAME}_#{version}_#{export_timestamp.strftime('%Y%m%dT%H%M%SZ')}".tap { Dir.mkdir(it) } : Dir.mktmpdir

    FileUtils.cd target_dir do
      tsv_folder_name = "TSV_export"
      FileUtils.mkpath tsv_folder_name

      DatabaseDumper.public_results_dump(RESULTS_EXPORT_SQL, tsv_folder_name, version)

      metadata = DatabaseDumper::RESULTS_EXPORT_VERSIONS[version][:metadata]
      metadata['export_date'] = export_timestamp
      File.write(RESULTS_EXPORT_METADATA, JSON.dump(metadata))

      readme_template = DatabaseController.render_readme(ActionController::Base.new, export_timestamp, version)
      File.write(RESULTS_EXPORT_README, readme_template)

      sql_zip_filename = self.result_export_file_name("sql", version, export_timestamp)
      sql_zip_contents = [RESULTS_EXPORT_METADATA, RESULTS_EXPORT_README, RESULTS_EXPORT_SQL]

      self.zip_and_upload_to_s3(sql_zip_filename, "#{RESULTS_EXPORT_FOLDER}/#{sql_zip_filename}", *sql_zip_contents) unless local

      tsv_zip_filename = self.result_export_file_name("tsv", version, export_timestamp)
      tsv_files = Dir.glob("#{tsv_folder_name}/*.tsv").map do |tsv|
        FileUtils.mv(tsv, '.')
        File.basename tsv
      end

      tsv_zip_contents = [RESULTS_EXPORT_METADATA, RESULTS_EXPORT_README] | tsv_files
      self.zip_and_upload_to_s3(tsv_zip_filename, "#{RESULTS_EXPORT_FOLDER}/#{tsv_zip_filename}", *tsv_zip_contents) unless local
    ensure
      FileUtils.remove_entry target_dir unless local
    end
  end

  def self.result_export_file_name(file_type, version, timestamp)
    "WCA_export_#{version}_#{timestamp.strftime('%j')}_#{timestamp.strftime('%Y%m%dT%H%M%SZ')}.#{file_type}.zip"
  end

  def self.zip_and_upload_to_s3(zip_filename, s3_path, *zip_contents)
    zip_file_list = zip_contents.join(" ")

    LogTask.log_task "Zipping #{zip_contents.length} file entries to '#{zip_filename}'" do
      system("zip #{zip_filename} #{zip_file_list}", exception: true)
    end

    LogTask.log_task "Moving zipped file to 's3://#{s3_path}'" do
      tm = Aws::S3::TransferManager.new
      tm.upload_file(zip_filename, bucket: BUCKET_NAME, key: s3_path)

      # Delete the zipfile now that it's uploaded
      FileUtils.rm zip_filename

      # Invalidate Export Route in Prod
      if EnvConfig.WCA_LIVE_SITE?
        Aws::CloudFront::Client.new(credentials: Aws::ECSCredentials.new)
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

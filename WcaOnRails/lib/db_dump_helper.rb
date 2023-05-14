# frozen_string_literal: true

module DbDumpHelper
  EXPORT_PUBLIC_FOLDER = Rails.root.join('public', 'export')

  RESULTS_EXPORT_FOLDER = EXPORT_PUBLIC_FOLDER.join('results')
  RESULTS_EXPORT_FILENAME = 'WCA_export'
  RESULTS_EXPORT_SQL = "#{RESULTS_EXPORT_FILENAME}.sql".freeze
  RESULTS_EXPORT_README = 'README.md'
  RESULTS_EXPORT_METADATA = 'metadata.json'
  RESULTS_EXPORT_SQL_PERMALINK = "#{RESULTS_EXPORT_SQL}.zip".freeze
  RESULTS_EXPORT_TSV_PERMALINK = "#{RESULTS_EXPORT_FILENAME}.tsv.zip".freeze

  DEVELOPER_EXPORT_FOLDER = EXPORT_PUBLIC_FOLDER.join('developer')
  DEVELOPER_EXPORT_FILENAME = 'wca-developer-database-dump'
  DEVELOPER_EXPORT_SQL = "#{DEVELOPER_EXPORT_FILENAME}.sql".freeze
  DEVELOPER_EXPORT_SQL_PERMALINK = "#{DEVELOPER_EXPORT_FILENAME}.zip".freeze

  def self.dump_developer_db
    Dir.mktmpdir do |dir|
      FileUtils.cd dir do
        DatabaseDumper.development_dump(DEVELOPER_EXPORT_SQL)

        self.zip_and_permalink(DEVELOPER_EXPORT_FOLDER, DEVELOPER_EXPORT_SQL_PERMALINK, nil, DEVELOPER_EXPORT_SQL)
      end
    end
  end

  def self.dump_results_db
    Dir.mktmpdir do |dir|
      FileUtils.cd dir do
        export_timestamp = DateTime.now

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

        # Remove old exports to save storage space
        FileUtils.rm_r RESULTS_EXPORT_FOLDER, force: true, secure: true

        sql_zip_filename = "WCA_export#{export_timestamp.strftime('%j')}_#{export_timestamp.strftime('%Y%m%dT%H%M%SZ')}.sql.zip"
        sql_zip_contents = [RESULTS_EXPORT_METADATA, RESULTS_EXPORT_README, RESULTS_EXPORT_SQL]

        self.zip_and_permalink(RESULTS_EXPORT_FOLDER, sql_zip_filename, RESULTS_EXPORT_SQL_PERMALINK, *sql_zip_contents)

        tsv_zip_filename = "WCA_export#{export_timestamp.strftime('%j')}_#{export_timestamp.strftime('%Y%m%dT%H%M%SZ')}.tsv.zip"
        tsv_files = Dir.glob("#{tsv_folder_name}/*.tsv").map do |tsv|
          FileUtils.mv(tsv, '.')
          File.basename tsv
        end

        tsv_zip_contents = [RESULTS_EXPORT_METADATA, RESULTS_EXPORT_README] | tsv_files
        self.zip_and_permalink(RESULTS_EXPORT_FOLDER, tsv_zip_filename, RESULTS_EXPORT_TSV_PERMALINK, *tsv_zip_contents)
      end
    end
  end

  def self.zip_and_permalink(root_folder, zip_filename, permalink_filename = nil, *zip_contents)
    zip_file_list = zip_contents.join(" ")

    LogTask.log_task "Zipping #{zip_contents.length} file entries to '#{zip_filename}'" do
      system("zip #{zip_filename} #{zip_file_list}") || raise("Error running `zip`")
    end

    public_zip_path = root_folder.join(zip_filename)

    LogTask.log_task "Moving zipped file to '#{public_zip_path}'" do
      FileUtils.mkpath(File.dirname(public_zip_path))
      FileUtils.mv(zip_filename, public_zip_path)

      if permalink_filename.present?
        permalink_zip_path = root_folder.join(permalink_filename)

        # Writing a RELATIVE link, so that we can do readlink in dev and prod and not care about stuff like Docker
        FileUtils.ln_s(zip_filename, permalink_zip_path, force: true)
      end
    end
  end
end

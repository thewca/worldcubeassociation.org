# frozen_string_literal: true

class DatabaseController < ApplicationController
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

  RESULTS_README_TEMPLATE = 'database/public_results_readme'

  def results_export
    @sql_filename, @sql_filesize = _link_info RESULTS_EXPORT_SQL_PERMALINK
    @tsv_filename, @tsv_filesize = _link_info RESULTS_EXPORT_TSV_PERMALINK

    @sql_rel_path = DatabaseController.rel_download_path RESULTS_EXPORT_FOLDER, @sql_filename
    @tsv_rel_path = DatabaseController.rel_download_path RESULTS_EXPORT_FOLDER, @tsv_filename

    @sql_perma_path = DatabaseController.rel_download_path RESULTS_EXPORT_FOLDER, RESULTS_EXPORT_SQL_PERMALINK
    @tsv_perma_path = DatabaseController.rel_download_path RESULTS_EXPORT_FOLDER, RESULTS_EXPORT_TSV_PERMALINK
  end

  def _link_info(permalink)
    full_permalink = RESULTS_EXPORT_FOLDER.join(permalink)

    actual_filename = File.basename File.readlink(full_permalink)
    # Manually resolve the relative link to be independent of runtime environments
    actual_file = RESULTS_EXPORT_FOLDER.join(actual_filename)

    filesize_bytes = File.size? actual_file

    [actual_filename, filesize_bytes]
  end

  def developer_export
    @rel_download_path = DatabaseController.rel_download_path DEVELOPER_EXPORT_FOLDER, DEVELOPER_EXPORT_SQL_PERMALINK
  end

  def self.rel_download_path(base_folder, file_name)
    file_path = base_folder.join file_name
    relative_path = file_path.relative_path_from EXPORT_PUBLIC_FOLDER.parent

    # has to start with / or otherwise Rails resolves the controller action into the path
    "/#{relative_path}"
  end

  def self.render_readme(rendering_engine, export_timestamp)
    locals = { long_date: export_timestamp, export_version: DatabaseDumper::PUBLIC_RESULTS_VERSION }

    if rendering_engine.respond_to?(:render_to_string)
      rendering_engine.render_to_string(partial: RESULTS_README_TEMPLATE, formats: :md, locals: locals)
    else
      rendering_engine.render(partial: RESULTS_README_TEMPLATE, formats: :md, locals: locals)
    end
  end
end

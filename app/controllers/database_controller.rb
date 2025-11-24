# frozen_string_literal: true

class DatabaseController < ApplicationController
  def results_export
    @sql_path, @sql_filesize = DbDumpHelper.cached_results_export_info("sql")
    @tsv_path, @tsv_filesize = DbDumpHelper.cached_results_export_info("tsv")

    @sql_filename = File.basename(@sql_path)
    @tsv_filename = File.basename(@tsv_path)
  end

  def sql_permalink
    url, = DbDumpHelper.cached_results_export_info("sql")
    redirect_to url, status: :moved_permanently, allow_other_host: true
  end

  def tsv_permalink
    url, = DbDumpHelper.cached_results_export_info("tsv")
    redirect_to url, status: :moved_permanently, allow_other_host: true
  end

  def developer_export
    @rel_download_path = DbDumpHelper.public_s3_path(DbDumpHelper::DEVELOPER_EXPORT_SQL_PERMALINK)
  end

  def self.render_readme(rendering_engine, export_timestamp, version)
    locals = { long_date: export_timestamp, export_version: DatabaseDumper::RESULTS_EXPORT_VERSIONS[version][:version_number] }

    partial_filename = "database/#{version}_public_results_readme"
    if rendering_engine.respond_to?(:render_to_string)
      rendering_engine.render_to_string(partial: partial_filename, formats: :md, locals: locals)
    else
      rendering_engine.render(partial: partial_filename, formats: :md, locals: locals)
    end
  end
end

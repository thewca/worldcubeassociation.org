# frozen_string_literal: true

class DatabaseController < ApplicationController
  RESULTS_README_TEMPLATE = 'database/public_results_readme'

  def results_export
    @sql_rel_path, @sql_filesize = get_current_export("sql")
    @tsv_rel_path, @tsv_filesize = get_current_export("tsv")

    @sql_perma_path = "#{EnvConfig.ROOT_URL}/export/results/#{DbDumpHelper::RESULTS_EXPORT_SQL_PERMALINK}"
    @tsv_perma_path = "#{EnvConfig.ROOT_URL}/export/results/#{DbDumpHelper::RESULTS_EXPORT_TSV_PERMALINK}"
  end

  def results_permalink
    type = if request.env['REQUEST_URI'].include?("tsv")
             "tsv"
           else
             "sql"
           end
    link, _ = get_current_export(type)
    respond_to do |format|
      format.zip { redirect_to link, status: 301 }
    end
  end

  def get_current_export(type)
    export_timestamp = DbDumpHelper::export_metadata["export_date"]

    Rails.cache.fetch("database-export-#{export_timestamp}-#{type}") do
      file_name = "#{DbDumpHelper::RESULTS_EXPORT_FOLDER}/WCA_export#{export_timestamp.strftime('%j')}_#{export_timestamp.strftime('%Y%m%dT%H%M%SZ')}.#{type}.zip"
      bucket = Aws::S3::Resource.new(
        region: EnvConfig.STORAGE_AWS_REGION,
        credentials: Aws::InstanceProfileCredentials.new,
        ).bucket(DbDumpHelper::BUCKET_NAME)
      filesize_bytes = bucket.object(file_name).content_length
      ["https://s3.#{EnvConfig.AWS_STORAGE_REGION}.amazonaws.com/#{DbDumpHelper::BUCKET_NAME}/#{file_name}", filesize_bytes]
    end
  end

  def developer_export
    @rel_download_path = "https://s3.#{EnvConfig.AWS_STORAGE_REGION}.amazonaws.com/#{DbDumpHelper::BUCKET_NAME}/#{DbDumpHelper::DEVELOPER_EXPORT_SQL_PERMALINK}"
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

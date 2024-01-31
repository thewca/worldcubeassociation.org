# frozen_string_literal: true

class DatabaseController < ApplicationController
  RESULTS_README_TEMPLATE = 'database/public_results_readme'

  def results_export
    @sql_path, @sql_filesize = get_current_results_export("sql")
    @tsv_path, @tsv_filesize = get_current_results_export("tsv")
    @sql_filename = File.basename(@sql_path)
    @tsv_filename = File.basename(@tsv_path)

    @sql_perma_path = "#{EnvConfig.ROOT_URL}/export/results/#{DbDumpHelper::RESULTS_EXPORT_SQL_PERMALINK}"
    @tsv_perma_path = "#{EnvConfig.ROOT_URL}/export/results/#{DbDumpHelper::RESULTS_EXPORT_TSV_PERMALINK}"
  end

  def sql_permalink
    url, _ = get_current_results_export("sql")
    redirect_to url, status: 301, allow_other_host: true
  end

  def tsv_permalink
    url, _ = get_current_results_export("sql")
    redirect_to url, status: 301, allow_other_host: true
  end

  def get_current_results_export(file_type)
    export_timestamp = Time.new(DbDumpHelper::export_metadata["export_date"])

    Rails.cache.fetch("database-export-#{export_timestamp}-#{file_type}", expires_in: 1.days) do
      file_name = "#{DbDumpHelper::RESULTS_EXPORT_FOLDER}/WCA_export#{export_timestamp.strftime('%j')}_#{export_timestamp.strftime('%Y%m%dT%H%M%SZ')}.#{file_type}.zip"
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

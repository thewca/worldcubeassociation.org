# frozen_string_literal: true

class RegulationsController < ApplicationController
  def render_regulations_from_s3(route)
    bucket = Aws::S3::Resource.new(
      region: EnvConfig.STORAGE_AWS_REGION,
      credentials: Aws::InstanceProfileCredentials.new,
    ).bucket('wca-regulations')

    version = bucket.object("version").get.body.read.strip
    erb_file = Rails.cache.fetch("regulations-file-#{version}-#{route}", expires_in: 7.days) do
      bucket.object(route).get.body.read.strip
    end
    render inline: erb_file, :layout => "application"
  end

  def guidelines
    render_regulations_from_s3("guidelines.html.erb")
  end

  def show
    render_regulations_from_s3("index.html.erb")
  end

  def historical_guidelines
    render_regulations_from_s3("history/official/#{params[:id]}/guidelines.html.erb")
  end

  def historical_regulations
    render_regulations_from_s3("history/official/#{params[:id]}/index.html.erb")
  end
end

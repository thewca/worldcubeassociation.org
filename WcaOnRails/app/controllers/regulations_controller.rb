# frozen_string_literal: true

class RegulationsController < ApplicationController
  def render_regulations_from_s3(route)
    s3 = Aws::S3::Resource.new(
      region: "us-west-2",
      credentials: Aws::InstanceProfileCredentials.new,
    )

    bucket_name = 'wca-regulations'

    erb_file = s3.bucket(bucket_name).object(route).get.body.read.strip
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

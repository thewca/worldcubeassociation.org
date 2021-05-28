# frozen_string_literal: true

module DocumentsHelper
  def documents_list(directory)
    safe_join Dir.glob("#{Rails.root}/public/#{directory}/*.pdf")
                 .sort
                 .map { |doc| File.basename(doc, ".pdf") }
                 .map { |name| content_tag(:li, link_to(name, "/#{directory}/#{name}.pdf")) }
  end
end

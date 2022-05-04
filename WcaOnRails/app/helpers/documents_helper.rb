# frozen_string_literal: true

module DocumentsHelper
  def documents_list(directory)
    safe_join Dir.glob("#{Rails.root}/public/documents/#{directory}/*.pdf")
                 .map { |doc| File.basename(doc, ".pdf") }
                 .map { |name| content_tag(:li, link_to(name, "/documents/#{directory}/#{name}.pdf")) }
  end
end

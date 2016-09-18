# frozen_string_literal: true

class Regulation < SimpleDelegator
  REGULATIONS = JSON.parse(File.read(Rails.root.to_s + "/app/views/regulations/wca-regulations.json")).freeze

  def limit(number)
    first(number)
  end

  def self.search(query, *)
    matched_regulations = REGULATIONS.dup
    query.downcase.split.each do |part|
      matched_regulations.select! do |reg|
        %w(content_html id).any? { |field| reg[field].downcase.include?(part) }
      end
    end
    Regulation.new(matched_regulations)
  end
end

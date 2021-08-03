# frozen_string_literal: true

class WcifExtension < ApplicationRecord
  serialize :data, JSON

  validates :extension_id, format: { with: /\A\w+(\.\w+)*\z/ }
  validates :spec_url, url: true

  def to_wcif
    { "id" => self.extension_id, "specUrl" => self.spec_url, "data" => self.data }
  end

  def self.wcif_json_schema
    {
      "type" => ["object"],
      "properties" => {
        "id" => { "type" => "string" },
        "specUrl" => { "type" => "string" },
        "data" => { "type" => "object" },
      },
    }
  end

  def self.wcif_to_attributes(wcif)
    {
      extension_id: wcif["id"],
      spec_url: wcif["specUrl"],
      data: wcif["data"],
    }
  end

  def load_wcif!(wcif)
    update!(WcifExtension.wcif_to_attributes(wcif))
    self
  end

  def self.update_wcif_extensions!(parent, extension_wcifs)
    updated_extensions = extension_wcifs.map do |extension_wcif|
      extension = parent.wcif_extensions.find do |wcif_extension|
        wcif_extension.extension_id == extension_wcif["id"]
      end
      (extension || parent.wcif_extensions.build).load_wcif!(extension_wcif)
    end
    parent.wcif_extensions = updated_extensions
  end
end

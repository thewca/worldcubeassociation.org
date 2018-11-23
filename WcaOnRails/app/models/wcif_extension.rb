# frozen_string_literal: true

class WcifExtension < ApplicationRecord
  serialize :data, JSON

  validates :extension_id, format: { with: /\A\w+(\.\w+)*\z/ }
  validates :spec_url, url: true
  validates :data, presence: true

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
end

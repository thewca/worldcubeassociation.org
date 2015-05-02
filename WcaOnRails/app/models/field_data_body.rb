class FieldDataBody < ActiveRecord::Base
  self.table_name = "field_data_body"
  belongs_to :node, primary_key: "nid", foreign_key: "entity_id"
end

class Node < ActiveRecord::Base
  self.table_name = "node"
  # Django has a "type" column that we don't want ActiveRecord to get excited about.
  self.inheritance_column = :_type_disabled
  # Django also has "changed" column that conflicts with ActiveRecord.
  ignore_columns :changed

  has_one :field_data_body, -> { where(entity_type: "node") }, primary_key: "nid", foreign_key: "entity_id"
  has_one :author, class_name: "User", primary_key: "uid", foreign_key: "uid"

  def alias
    urlAlias = UrlAlias.find_by source: "node/#{nid}"
    urlAlias ? urlAlias.alias.split("/")[1] : nil
  end
end

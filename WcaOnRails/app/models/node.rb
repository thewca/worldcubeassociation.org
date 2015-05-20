class Node < ActiveRecord::Base
  self.table_name = "node"
  # Django has a "type" column that we don't want ActiveRecord to get excited about.
  self.inheritance_column = :_type_disabled
  # Django also has "changed" column that conflicts with ActiveRecord.
  ignore_columns :changed

  has_one :field_data_body, -> { where(entity_type: "node") }, primary_key: "nid", foreign_key: "entity_id"
  belongs_to :author, class_name: "User", primary_key: "uid", foreign_key: "uid"

  def alias
    urlAlias = UrlAlias.find_by source: "node/#{nid}"
    if !urlAlias
      nil
    elsif urlAlias.alias.start_with? 'posts/'
      urlAlias.alias.split("/")[1]
    else
      urlAlias.alias
    end
  end
end

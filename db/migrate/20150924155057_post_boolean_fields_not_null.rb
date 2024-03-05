# frozen_string_literal: true

class PostBooleanFieldsNotNull < ActiveRecord::Migration
  def change
    change_column_null :posts, :sticky, false, false
    change_column_default :posts, :sticky, false
    change_column_null :posts, :world_readable, false, false
    change_column_default :posts, :world_readable, false
  end
end

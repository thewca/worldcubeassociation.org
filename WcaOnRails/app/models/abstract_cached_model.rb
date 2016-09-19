# frozen_string_literal: true
class AbstractCachedModel < ActiveRecord::Base
  self.abstract_class = true
  def self.call_by_id
    unless class_variable_defined?(:@@models_by_id)
      class_variable_set(:@@models_by_id, all.index_by(&:id))
    end
    class_variable_get(:@@models_by_id)
  end

  def self.find(id)
    unless class_variable_defined?(:@@models_by_id)
      call_by_id
    end
    class_variable_get(:@@models_by_id)[id]
  end
end

# frozen_string_literal: true

# For classes such as Country, Event, etc. we want to keep a local cache of the data in the db:
#  - the data are read very often
#  - we don't modify these tables from within the application, so cache invalidation is
#    as simple as restarting the server, which is done whenever we deploy.
#
# /!\ READ THIS BEFORE USING THIS MODULE /!\
#
# It has been designed for models that are read-only during the application's lifetime.
# (Modifications to the data in db are typically made through migrations)
# Please refer to the discussions in https://github.com/cubing/worldcubeassociation.org/pull/908.
# If you plan on using it for more dynamic models you'd most likely need to add
# a cache invalidation mechanism.
# Keep in mind multiple instances of the application run on the server(!!!).
require 'active_support/concern'

module Cachable
  extend ActiveSupport::Concern

  class_methods do
    # We want to keep the cache in a class variable.
    # Assuming we have a class like Country < AbstractCachedModel, we want the
    # class variable within Country, not within AbstractCachedModel.
    # Using directly @@models_by_id would set it in the latter, so we need to rely
    # on 'class_variable_get' and 'class_variable_set' that will act on the extending
    # class (here Country).
    def c_all_by_id
      class_variable_set(:@@models_by_id, all.index_by(&:id)) unless class_variable_defined?(:@@models_by_id)
      class_variable_get(:@@models_by_id)
    end

    def c_find(id)
      c_all_by_id[id]
    end

    def c_find!(id)
      self.c_find(id) || raise("id not found: #{id}")
    end
  end
end

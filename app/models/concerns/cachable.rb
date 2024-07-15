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
    def c_all_by_id
      Rails.cache.fetch(['model_cache', self.name.underscore.to_s, 'all_by_id']) do
        self.all.index_by(&:id)
      end
    end

    def c_find(id)
      Rails.cache.fetch(['model_cache', self.name.underscore.to_s, 'find', id]) do
        self.c_all_by_id[id]
      end
    end

    def c_find!(id)
      self.c_find(id) || raise("Cached model #{self.name.underscore} ID not found: #{id}")
    end

    def c_values
      self.c_all_by_id.values
    end
  end

  included do
    after_commit :clear_cache

    def clear_cache
      Rails.cache.delete(['model_cache', self.name.underscore.to_s, 'by_id'])

      # For some reason, the implementation of combining an array into a valid cache key is private in Rails.
      # So we have to "break in" to their API using `send`, but in the end all this does is turn an array into a string.
      model_matcher = Rails.cache.send(:expanded_key, ['model_cache', self.name.underscore.to_s, 'find', '*'])
      Rails.cache.delete_matched(model_matcher)
    end
  end
end

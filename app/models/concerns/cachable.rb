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

  included do
    thread_mattr_accessor :models_by_id

    after_commit :clear_cache

    def clear_cache
      self.models_by_id = nil
    end

    # Tells the caching mechanism what ID to cache by.
    # For static objects like Country or Continent, this should be `id` by default.
    # But for some other objects like T/Cs, we have a separate `friendly_id` column that we want to index by.
    def cachable_id
      self.id
    end

    def as_cached
      self.class.try(self.cachable_id.to_s) || self.class.c_find(self.cachable_id)
    end
  end

  class_methods do
    def c_all_by_id
      self.models_by_id ||= self.all.index_by(&:cachable_id).with_indifferent_access
    end

    def c_find(id)
      self.c_all_by_id[id]
    end

    def c_find!(id)
      self.c_find(id) || raise("Cached model #{self.name} ID not found: #{id}")
    end

    def c_values
      self.c_all_by_id.values
    end

    def cached_entity(*ids)
      ids.each do |id|
        self.define_singleton_method(id) { self.c_find(id) }
      end
    end
  end
end

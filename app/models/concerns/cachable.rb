# frozen_string_literal: true

# For classes such as Country, Event, etc. we want to keep a local cache of the data in the db:
#  - The data is being read very often
#  - We don't modify these tables frequently, so cache invalidation is okay to control manually.
#    Read the instructions below for details.
#
# /!\ READ THIS BEFORE USING THIS MODULE /!\
#
# Keep in mind multiple instances of the application run on the server(!!!). The implications are explained
#   in another comment below, especially regarding thread-safety on Puma.
#
# If you are using this for writing data, keep the following in mind:
#  - The cached classes themselves will invalidate their own cache whenever an update to the DB is made
#    (see after_commit hook below)
#  - If you have some depending classes (that point to a cached entity) you will need them to let their cached entity
#    "forget" about their stored relation. There are two standard ways to do that:
#     1. Defining a `touch: true` on the belongs_to/has_one/has_many relation that points to this cached entity.
#        Doing so will trigger the `after_commit` hook in here, reloading the data as needed.
#     2. Defining a custom hook that uses Rails' magic `reset_{association_name}` methods to let the associated
#        cachable entity "forget" their backlink to whatever class relies on the cachable entity.
#     In 9/10 cases you probably want to choose option (1), just saying that a custom solution using (2) is possible.
#
# ***IMPORTANT*** To future WST: If we ever (for some reason) move away from the standard MRI Ruby interpreter
#   (the one that comes bundled with modern Ruby installations and also the Docker `ruby` image)
#   and we end up using something like JRuby -- which has _true_ multi-threading -- this class has to be redesigned!
require 'active_support/concern'

module Cachable
  extend ActiveSupport::Concern

  included do
    # We do NOT want to use thread_mattr_accessor here on purpose. Using the thread_* version
    #   makes it so that each thread has its own copy of the variable, with independent values per thread
    #   (essentially, each thread keeps its own cache). But if one user launches one request to update a team role
    #   which is served by one single (Puma) thread, all other threads should be invalidated as well.
    #
    # So, we use a "thread-global" mattr_accessor on purpose, because we _want_ all threads to share the same cache.
    #   This is not a problem because the standard Ruby interpreter has a GIL (global locking) mechanism that prevents
    #   it from truly parallel code execution. Every thread that potentially enters the `c_all_by_id` loading mechanism
    #   below is inherently thread-safe by virtue of the fact that the interpreter locks the code execution.
    #
    # Interesting reading: https://thoughtbot.com/blog/untangling-ruby-threads
    #
    # (Sidenote: Our previous approach had been based on our own custom @@cache variable,
    #   which is exactly what mattr_accessor does internally. And that one worked for literally many years.)
    mattr_accessor :models_by_id

    # Everything that modifies our knowledge about which cached entities even _exist_,
    #   needs to flush the whole cache (so that created / deleted entities can be loaded / dropped)
    after_commit :clear_cache, on: [:create, :destroy]

    def clear_cache
      self.models_by_id = nil
    end

    # Everything that changes an entity in-place only needs to reload this one particular entity
    after_commit :reload_cache, on: :update

    def reload_cache
      self.as_cached.reload
    end

    # Tells the caching mechanism what ID to cache by.
    # For static objects like Country or Continent, this should be `id` by default.
    # But for some other objects like T/Cs, we have a separate `friendly_id` column that we want to index by.
    def cachable_id
      self.id
    end

    def as_cached
      self.class.c_find(self.cachable_id)
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

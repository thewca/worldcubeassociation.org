# frozen_string_literal: true

# This module can be included by a model willing to have tags.
# The including model must have a has_many relationship to their tags table,
# and the relation must be named the following way:
#  - "my_foo_tags" for the MyFoo model
#  - "foo_tags" for the Foo model
module Taggable
  extend ActiveSupport::Concern

  TAG_REGEX = /\A[-+a-zA-Z0-9]+\z/
  TAG_REGEX_MESSAGE = "only allows English letters, numbers, hyphens, and '+'"

  private def item_tags
    public_send("#{self.class.name.underscore}_tags")
  end

  included do
    attr_writer :tags

    def tags
      @tags ||= item_tags.pluck(:tag).join(",")
    end

    def tags_array
      tags.split(",")
    end

    before_validation do
      tags_array.each do |tag|
        item_tags.find_or_initialize_by(tag: tag)
      end

      item_tags.each do |item_tag|
        item_tag.mark_for_destruction unless tags_array.include?(item_tag.tag)
      end
    end
  end
end

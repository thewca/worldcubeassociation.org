# frozen_string_literal: true

class WaitingList < ActiveRecord::Base
  belongs_to :holder, polymorphic: true

  def remove(item)
    update_column :entries, entries - [item.id]
  end

  def add(item)
    item.can_be_waitlisted! # can_be_waitlisted! raises an error if it fails
    return if entries.include?(item.id)

    if entries.nil?
      update_column :entries, [item.id]
    else
      update_column :entries, entries + [item.id]
    end
  end

  def move_to_position(item, new_position)
    raise ArgumentError.new('Target position out of waiting list range') if new_position > entries.length || new_position < 1

    old_index = entries.find_index(item.id)
    return if old_index == new_position-1

    update_column :entries, entries.insert(new_position-1, entries.delete_at(old_index))
  end

  # This is the position from the user/organizers perspective - ie, we start counting at 1
  def position(item)
    return nil unless entries.include?(item.id)
    entries.index(item.id) + 1
  end
end

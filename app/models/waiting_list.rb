# frozen_string_literal: true

class WaitingList < ActiveRecord::Base
  belongs_to :holder, polymorphic: true

  def remove(entry)
    update_column :entries, entries - [entry.id]
  end

  def add(entry)
    entry.try(:ensure_waitlist_eligibility!) # raises an error if not waitlistable
    return if entries.include?(entry.id)

    if entries.nil?
      update_column :entries, [entry.id]
    else
      update_column :entries, entries + [entry.id]
    end
  end

  def move_to_position(entry, new_position)
    raise ArgumentError.new('Target position out of waiting list range') if new_position > entries.length || new_position < 1

    old_index = entries.find_index(entry.id)
    return if old_index == new_position-1

    update_column :entries, entries.insert(new_position-1, entries.delete_at(old_index))
  end

  # This is the position from the user/organizers perspective - ie, we start counting at 1
  def position(entry)
    return nil unless entries.include?(entry.id)
    entries.index(entry.id) + 1
  end
end

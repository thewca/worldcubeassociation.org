# frozen_string_literal: true

class WaitingList < ActiveRecord::Base
  belongs_to :holder, polymorphic: true

  def remove(registration_id)
    update_column :entries, entries - [registration_id]
  end

  def add(registration_id)
    if entries.nil?
      update_column :entries, [registration_id]
    else
      update_column :entries, entries + [registration_id]
    end
  end

  def move_to_position(registration_id, new_position)
    raise ArgumentError.new('Target position out of waiting list range') if new_position > entries.length || new_position < 1

    old_index = entries.find_index(registration_id)
    return if old_index == new_position-1

    update_column :entries, entries.insert(new_position-1, entries.delete_at(old_index))
  end

  def position(registration_id)
    entries.index(registration_id) + 1
  end
end

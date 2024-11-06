# frozen_string_literal: true

class WaitingList < ActiveRecord::Base
  belongs_to :holder, polymorphic: true

  def remove(entry_id)
    update_column :entries, entries - [entry_id]
  end

  def add(entry_id)
    if entries.nil?
      update_column :entries, [entry_id]
    else
      update_column :entries, entries + [entry_id]
    end
  end

  def move_to_position(entry_id, new_position)
    raise ArgumentError.new('Target position out of waiting list range') if new_position > entries.length || new_position < 1

    old_index = entries.find_index(entry_id)
    return if old_index == new_position-1

    update_column :entries, entries.insert(new_position-1, entries.delete_at(old_index))
  end

  def position(entry_id)
    entries.index(entry_id) + 1
  end
end

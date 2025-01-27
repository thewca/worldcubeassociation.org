# frozen_string_literal: true

class WaitingList < ActiveRecord::Base
  belongs_to :holder, polymorphic: true

  def remove(registration)
    update_column :entries, entries - [registration.id]
  end

  def add(registration)
    raise ArgumentError.new("Registration must have a competing_status of 'waiting_list' to be added to the waiting list") unless
      registration.competing_status == Registrations::Helper::STATUS_WAITING_LIST
    return if entries.include?(registration.id)

    if entries.nil?
      update_column :entries, [registration.id]
    else
      update_column :entries, entries + [registration.id]
    end
  end

  def move_to_position(registration, new_position)
    raise ArgumentError.new('Target position out of waiting list range') if new_position > entries.length || new_position < 1

    old_index = entries.find_index(registration.id)
    return if old_index == new_position-1

    update_column :entries, entries.insert(new_position-1, entries.delete_at(old_index))
  end

  # This is the position from the user/organizers perspective - ie, we start counting at 1
  def position(registration)
    return nil unless entries.include?(registration.id)
    entries.index(registration.id) + 1
  end
end

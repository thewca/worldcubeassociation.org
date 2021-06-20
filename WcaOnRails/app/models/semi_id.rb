# frozen_string_literal: true

class SemiId
  include ActiveModel::Model
  attr_accessor :value

  SEMI_ID_RE = /\A[1-9][[:digit:]]{3}[[:upper:]]{4}\z/
  # This is the char the php scripts used for filling WCA IDs.
  PADDING_CHAR = "U"
  validates_format_of :value, with: SEMI_ID_RE

  def generate_wca_id
    # Try finding an appropriate WCA ID for our semi ID
    unless valid?
      return ""
    end

    # From all persons with that semi id, take the last WCA ID, or default
    # to "AAAABBBB00".
    last_wca_id = Person.where("wca_id like ?", "#{value}%").order(:wca_id).pluck(:wca_id).last || "#{value}00"
    last_index = last_wca_id.last(2).to_i

    if last_index < 99
      "#{value}#{(last_index+1).to_s.rjust(2, "0")}"
    else
      # Sometimes we run out of indices (like for "2019ZHAO"), there is nothing
      # we can do but to return an empty one...
      ""
    end
  end

  def self.generate(name, competition)
    semi_id_year = competition.year.to_s
    # Extract the "roman" part of the name (everything up to "("), and transliterate
    # remaining characters.
    roman_name = I18n.transliterate(name.slice(/\A[^(]+/) || "")
    # Remove any non alphabetic characters, and make all upper case
    roman_name.gsub!(/[^[[:alpha:]] ]/, '')
    roman_name.upcase!

    # Splitting by ' ' is implied by default
    name_parts = roman_name.split
    if name_parts.empty?
      # The given name has no usable parts, we can only generate an invalid SemiId
      return SemiId.new
    end
    # Take the first 4 chars of the last name
    semi_id_name = name_parts.pop.first(4)
    # If needed, take the first few chars of the first name.
    semi_id_name.concat((name_parts.shift || "").first(3))
    # In the end we may have more or less than 4 chars, so pad with 'U' and truncate.
    semi_id_name = semi_id_name.ljust(4, PADDING_CHAR).first(4)

    SemiId.new(value: semi_id_year.concat(semi_id_name))
  end
end

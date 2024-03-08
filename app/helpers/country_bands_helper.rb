# frozen_string_literal: true

module CountryBandsHelper
  def continent_id_as_class(id)
    id.tr(' ', '')
  end

  def continent_options
    [['None', '']].concat(Continent.real.map { |c| [c.name, continent_id_as_class(c.id)] })
  end
end

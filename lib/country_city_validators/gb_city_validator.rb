# frozen_string_literal: true

module CountryCityValidators
  GB_COUNTIES = %w(
    Aberdeenshire
    Angus
    Argyll\ and\ Bute
    Bedfordshire
    Berkshire
    Buckinghamshire
    Cambridgeshire
    Cheshire
    City\ of\ Bristol
    City\ of\ London
    City\ of\ Aberdeen
    City\ of\ Edinburgh
    City\ of\ Glasgow
    Clackmannanshire
    Clwyd
    Cornwall
    County\ Antrim
    County\ Armagh
    County\ Down
    County\ Durham
    County\ Fermanagh
    County\ Londonderry
    County\ Tyrone
    Cumbria
    Derbyshire
    Devon
    Dorset
    Dumfries\ and\ Galloway
    Dundee\ City
    Dyfed
    East\ Ayrshire
    East\ Dunbartonshire
    East\ Lothian
    East\ Renfrewshire
    East\ Sussex
    Essex
    Falkirk
    Fife
    Gloucestershire
    Greater\ London
    Greater\ Manchester
    Gwent
    Gwynedd
    Hampshire
    Herefordshire
    Hertfordshire
    Highland
    Inverclyde
    Isle\ of\ Wight
    Kent
    Lancashire
    Leicestershire
    Lincolnshire
    Merseyside
    Mid\ Glamorgan
    Midlothian
    Moray
    Norfolk
    North\ Ayrshire
    North\ Lanarkshire
    North\ Yorkshire
    Northamptonshire
    Northumberland
    Nottinghamshire
    Oxfordshire
    Perth\ and\ Kinross
    Powys
    Renfrewshire
    Rutland
    Scottish\ Borders
    Shropshire
    Somerset
    South\ Ayrshire
    South\ Glamorgan
    South\ Lanarkshire
    South\ Yorkshire
    Staffordshire
    Stirling
    Suffolk
    Surrey
    Tyne\ and\ Wear
    Warwickshire
    West\ Dunbartonshire
    West\ Glamorgan
    West\ Lothian
    West\ Midlands
    West\ Sussex
    West\ Yorkshire
    Wiltshire
    Worcestershire
    Yorkshire
  ).to_set
  GB_TERRITORIES = %w(
    Akrotiri\ and\ Dhekelia
    Anguilla
    Bermuda
    British\ Virgin\ Islands
    Cayman\ Islands
    Falkland\ Islands
    Gibraltar
    Montserrat
    Pitcairn\ Islands
    Saint\ Helena,\ Ascension\ and\ Tristan\ da\ Cunha
    Turks\ and\ Caicos\ Islands
  ).to_set
  GB_REGIONS = GB_COUNTIES | GB_TERRITORIES

  class GbCityValidator < CityCommaRegionValidator
    def initialize
      super(type_of_region: 'county', valid_regions: GB_REGIONS)
    end

    def self.country_iso_2
      'GB'
    end
  end
end

# frozen_string_literal: true
class Country
  attr_accessor :id, :name, :continentId, :iso2

  def initialize(attributes={})
    @id = attributes[:id]
    @name = attributes[:name]
    @continentId = attributes[:continentId]
    @iso2 = attributes[:iso2]
  end

  def to_partial_path
    "country"
  end

  def self.find(id)
    ALL_COUNTRIES_BY_ID[id] or raise "Unrecognized country id"
  end

  def self.find_by_id(id)
    ALL_COUNTRIES_BY_ID[id]
  end

  def self.find_by_iso2(iso2)
    ALL_COUNTRIES_BY_ISO2[iso2]
  end

  def self.all
    ALL_COUNTRIES
  end

  def self.all_real
    all.select { |country| country.name.exclude? "Multiple Countries" }
  end

  def hash
    id.hash
  end

  def eql?(o)
    id == o.id
  end

  ALL_COUNTRIES = [
    {
      "id": "Afghanistan",
      "name": "Afghanistan",
      "continentId": "_Asia",
      "iso2": "AF",
    },
    {
      "id": "Albania",
      "name": "Albania",
      "continentId": "_Europe",
      "iso2": "AL",
    },
    {
      "id": "Algeria",
      "name": "Algeria",
      "continentId": "_Africa",
      "iso2": "DZ",
    },
    {
      "id": "Andorra",
      "name": "Andorra",
      "continentId": "_Europe",
      "iso2": "AD",
    },
    {
      "id": "Angola",
      "name": "Angola",
      "continentId": "_Africa",
      "iso2": "AO",
    },
    {
      "id": "Anguilla",
      "name": "Anguilla",
      "continentId": "_North America",
      "iso2": "AI",
    },
    {
      "id": "Antigua",
      "name": "Antigua",
      "continentId": "_North America",
      "iso2": "AG",
    },
    {
      "id": "Argentina",
      "name": "Argentina",
      "continentId": "_South America",
      "iso2": "AR",
    },
    {
      "id": "Armenia",
      "name": "Armenia",
      "continentId": "_Europe",
      "iso2": "AM",
    },
    {
      "id": "Aruba",
      "name": "Aruba",
      "continentId": "_North America",
      "iso2": "AW",
    },
    {
      "id": "Australia",
      "name": "Australia",
      "continentId": "_Oceania",
      "iso2": "AU",
    },
    {
      "id": "Austria",
      "name": "Austria",
      "continentId": "_Europe",
      "iso2": "AT",
    },
    {
      "id": "Azerbaijan",
      "name": "Azerbaijan",
      "continentId": "_Europe",
      "iso2": "AZ",
    },
    {
      "id": "Bahamas",
      "name": "Bahamas",
      "continentId": "_North America",
      "iso2": "BS",
    },
    {
      "id": "Bahrain",
      "name": "Bahrain",
      "continentId": "_Asia",
      "iso2": "BH",
    },
    {
      "id": "Bangladesh",
      "name": "Bangladesh",
      "continentId": "_Asia",
      "iso2": "BD",
    },
    {
      "id": "Barbados",
      "name": "Barbados",
      "continentId": "_North America",
      "iso2": "BB",
    },
    {
      "id": "Belarus",
      "name": "Belarus",
      "continentId": "_Europe",
      "iso2": "BY",
    },
    {
      "id": "Belgium",
      "name": "Belgium",
      "continentId": "_Europe",
      "iso2": "BE",
    },
    {
      "id": "Belize",
      "name": "Belize",
      "continentId": "_North America",
      "iso2": "BZ",
    },
    {
      "id": "Benin",
      "name": "Benin",
      "continentId": "_Africa",
      "iso2": "BJ",
    },
    {
      "id": "Bhutan",
      "name": "Bhutan",
      "continentId": "_Asia",
      "iso2": "BT",
    },
    {
      "id": "Bolivia",
      "name": "Bolivia",
      "continentId": "_South America",
      "iso2": "BO",
    },
    {
      "id": "Bosnia and Herzegovina",
      "name": "Bosnia and Herzegovina",
      "continentId": "_Europe",
      "iso2": "BA",
    },
    {
      "id": "Botswana",
      "name": "Botswana",
      "continentId": "_Africa",
      "iso2": "BW",
    },
    {
      "id": "Brazil",
      "name": "Brazil",
      "continentId": "_South America",
      "iso2": "BR",
    },
    {
      "id": "British Virgin Islands",
      "name": "British Virgin Islands",
      "continentId": "_North America",
      "iso2": "VG",
    },
    {
      "id": "Brunei",
      "name": "Brunei",
      "continentId": "_Asia",
      "iso2": "BN",
    },
    {
      "id": "Bulgaria",
      "name": "Bulgaria",
      "continentId": "_Europe",
      "iso2": "BG",
    },
    {
      "id": "Burkina Faso",
      "name": "Burkina Faso",
      "continentId": "_Africa",
      "iso2": "BF",
    },
    {
      "id": "Cambodia",
      "name": "Cambodia",
      "continentId": "_Asia",
      "iso2": "KH",
    },
    {
      "id": "Cameroon",
      "name": "Cameroon",
      "continentId": "_Africa",
      "iso2": "CM",
    },
    {
      "id": "Canada",
      "name": "Canada",
      "continentId": "_North America",
      "iso2": "CA",
    },
    {
      "id": "Central African Republic",
      "name": "Central African Republic",
      "continentId": "_Africa",
      "iso2": "CF",
    },
    {
      "id": "Chad",
      "name": "Chad",
      "continentId": "_Africa",
      "iso2": "TD",
    },
    {
      "id": "Chile",
      "name": "Chile",
      "continentId": "_South America",
      "iso2": "CL",
    },
    {
      "id": "China",
      "name": "China",
      "continentId": "_Asia",
      "iso2": "CN",
    },
    {
      "id": "Colombia",
      "name": "Colombia",
      "continentId": "_South America",
      "iso2": "CO",
    },
    {
      "id": "Comoros",
      "name": "Comoros",
      "continentId": "_Africa",
      "iso2": "KM",
    },
    {
      "id": "Congo",
      "name": "Congo",
      "continentId": "_Africa",
      "iso2": "CG",
    },
    {
      "id": "Cook Islands",
      "name": "Cook Islands",
      "continentId": "_Asia",
      "iso2": "CK",
    },
    {
      "id": "Costa Rica",
      "name": "Costa Rica",
      "continentId": "_North America",
      "iso2": "CR",
    },
    {
      "id": "Cote d_Ivoire",
      "name": "Cote d'Ivoire",
      "continentId": "_Africa",
      "iso2": "CI",
    },
    {
      "id": "Croatia",
      "name": "Croatia",
      "continentId": "_Europe",
      "iso2": "HR",
    },
    {
      "id": "Cuba",
      "name": "Cuba",
      "continentId": "_North America",
      "iso2": "CU",
    },
    {
      "id": "Cyprus",
      "name": "Cyprus",
      "continentId": "_Europe",
      "iso2": "CY",
    },
    {
      "id": "Czech Republic",
      "name": "Czech Republic",
      "continentId": "_Europe",
      "iso2": "CZ",
    },
    {
      "id": "Denmark",
      "name": "Denmark",
      "continentId": "_Europe",
      "iso2": "DK",
    },
    {
      "id": "Djibouti",
      "name": "Djibouti",
      "continentId": "_Africa",
      "iso2": "DJ",
    },
    {
      "id": "Dominica",
      "name": "Dominica",
      "continentId": "_North America",
      "iso2": "DM",
    },
    {
      "id": "Dominican Republic",
      "name": "Dominican Republic",
      "continentId": "_North America",
      "iso2": "DO",
    },
    {
      "id": "DR Congo",
      "name": "DR Congo",
      "continentId": "_Africa",
      "iso2": "CD",
    },
    {
      "id": "Ecuador",
      "name": "Ecuador",
      "continentId": "_South America",
      "iso2": "EC",
    },
    {
      "id": "Egypt",
      "name": "Egypt",
      "continentId": "_Africa",
      "iso2": "EG",
    },
    {
      "id": "El Salvador",
      "name": "El Salvador",
      "continentId": "_North America",
      "iso2": "SV",
    },
    {
      "id": "Equatorial Guinea",
      "name": "Equatorial Guinea",
      "continentId": "_Africa",
      "iso2": "GQ",
    },
    {
      "id": "Eritrea",
      "name": "Eritrea",
      "continentId": "_Africa",
      "iso2": "ER",
    },
    {
      "id": "Estonia",
      "name": "Estonia",
      "continentId": "_Europe",
      "iso2": "EE",
    },
    {
      "id": "Ethiopia",
      "name": "Ethiopia",
      "continentId": "_Africa",
      "iso2": "ET",
    },
    {
      "id": "Fiji",
      "name": "Fiji",
      "continentId": "_Oceania",
      "iso2": "FJ",
    },
    {
      "id": "Finland",
      "name": "Finland",
      "continentId": "_Europe",
      "iso2": "FI",
    },
    {
      "id": "France",
      "name": "France",
      "continentId": "_Europe",
      "iso2": "FR",
    },
    {
      "id": "French Guiana",
      "name": "French Guiana",
      "continentId": "_South America",
      "iso2": "GF",
    },
    {
      "id": "French Polynesia",
      "name": "French Polynesia",
      "continentId": "_Oceania",
      "iso2": "PF",
    },
    {
      "id": "Gabon",
      "name": "Gabon",
      "continentId": "_Africa",
      "iso2": "GA",
    },
    {
      "id": "Gambia",
      "name": "Gambia",
      "continentId": "_Africa",
      "iso2": "GM",
    },
    {
      "id": "Georgia",
      "name": "Georgia",
      "continentId": "_Europe",
      "iso2": "GE",
    },
    {
      "id": "Germany",
      "name": "Germany",
      "continentId": "_Europe",
      "iso2": "DE",
    },
    {
      "id": "Ghana",
      "name": "Ghana",
      "continentId": "_Africa",
      "iso2": "GH",
    },
    {
      "id": "Greece",
      "name": "Greece",
      "continentId": "_Europe",
      "iso2": "GR",
    },
    {
      "id": "Grenada",
      "name": "Grenada",
      "continentId": "_North America",
      "iso2": "GD",
    },
    {
      "id": "Guatemala",
      "name": "Guatemala",
      "continentId": "_North America",
      "iso2": "GT",
    },
    {
      "id": "Guernsey",
      "name": "Guernsey",
      "continentId": "_Europe",
      "iso2": "GG",
    },
    {
      "id": "Guinea",
      "name": "Guinea",
      "continentId": "_Africa",
      "iso2": "GN",
    },
    {
      "id": "Guyana",
      "name": "Guyana",
      "continentId": "_South America",
      "iso2": "GY",
    },
    {
      "id": "Haiti",
      "name": "Haiti",
      "continentId": "_North America",
      "iso2": "HT",
    },
    {
      "id": "Honduras",
      "name": "Honduras",
      "continentId": "_North America",
      "iso2": "HN",
    },
    {
      "id": "Hong Kong",
      "name": "Hong Kong",
      "continentId": "_Asia",
      "iso2": "HK",
    },
    {
      "id": "Hungary",
      "name": "Hungary",
      "continentId": "_Europe",
      "iso2": "HU",
    },
    {
      "id": "Iceland",
      "name": "Iceland",
      "continentId": "_Europe",
      "iso2": "IS",
    },
    {
      "id": "India",
      "name": "India",
      "continentId": "_Asia",
      "iso2": "IN",
    },
    {
      "id": "Indonesia",
      "name": "Indonesia",
      "continentId": "_Asia",
      "iso2": "ID",
    },
    {
      "id": "Iran",
      "name": "Iran",
      "continentId": "_Asia",
      "iso2": "IR",
    },
    {
      "id": "Iraq",
      "name": "Iraq",
      "continentId": "_Asia",
      "iso2": "IQ",
    },
    {
      "id": "Ireland",
      "name": "Ireland",
      "continentId": "_Europe",
      "iso2": "IE",
    },
    {
      "id": "Isle of Man",
      "name": "Isle of Man",
      "continentId": "_Europe",
      "iso2": "IM",
    },
    {
      "id": "Israel",
      "name": "Israel",
      "continentId": "_Europe",
      "iso2": "IL",
    },
    {
      "id": "Italy",
      "name": "Italy",
      "continentId": "_Europe",
      "iso2": "IT",
    },
    {
      "id": "Jamaica",
      "name": "Jamaica",
      "continentId": "_North America",
      "iso2": "JM",
    },
    {
      "id": "Japan",
      "name": "Japan",
      "continentId": "_Asia",
      "iso2": "JP",
    },
    {
      "id": "Jordan",
      "name": "Jordan",
      "continentId": "_Asia",
      "iso2": "JO",
    },
    {
      "id": "Kazakhstan",
      "name": "Kazakhstan",
      "continentId": "_Asia",
      "iso2": "KZ",
    },
    {
      "id": "Kenya",
      "name": "Kenya",
      "continentId": "_Africa",
      "iso2": "KE",
    },
    {
      "id": "Kiribati",
      "name": "Kiribati",
      "continentId": "_Oceania",
      "iso2": "KI",
    },
    {
      "id": "Korea",
      "name": "Korea",
      "continentId": "_Asia",
      "iso2": "KR",
    },
    {
      "id": "Kosovo",
      "name": "Kosovo",
      "continentId": "_Europe",
      "iso2": "XK",
    },
    {
      "id": "Kuwait",
      "name": "Kuwait",
      "continentId": "_Asia",
      "iso2": "KW",
    },
    {
      "id": "Laos",
      "name": "Laos",
      "continentId": "_Asia",
      "iso2": "LA",
    },
    {
      "id": "Latvia",
      "name": "Latvia",
      "continentId": "_Europe",
      "iso2": "LV",
    },
    {
      "id": "Lebanon",
      "name": "Lebanon",
      "continentId": "_Asia",
      "iso2": "LB",
    },
    {
      "id": "Lesotho",
      "name": "Lesotho",
      "continentId": "_Africa",
      "iso2": "LS",
    },
    {
      "id": "Liberia",
      "name": "Liberia",
      "continentId": "_Africa",
      "iso2": "LR",
    },
    {
      "id": "Libya",
      "name": "Libya",
      "continentId": "_Africa",
      "iso2": "LY",
    },
    {
      "id": "Liechtenstein",
      "name": "Liechtenstein",
      "continentId": "_Europe",
      "iso2": "LI",
    },
    {
      "id": "Lithuania",
      "name": "Lithuania",
      "continentId": "_Europe",
      "iso2": "LT",
    },
    {
      "id": "Luxembourg",
      "name": "Luxembourg",
      "continentId": "_Europe",
      "iso2": "LU",
    },
    {
      "id": "Macau",
      "name": "Macau",
      "continentId": "_Asia",
      "iso2": "MO",
    },
    {
      "id": "Macedonia",
      "name": "Macedonia",
      "continentId": "_Europe",
      "iso2": "MK",
    },
    {
      "id": "Madagascar",
      "name": "Madagascar",
      "continentId": "_Africa",
      "iso2": "MG",
    },
    {
      "id": "Malawi",
      "name": "Malawi",
      "continentId": "_Africa",
      "iso2": "MW",
    },
    {
      "id": "Malaysia",
      "name": "Malaysia",
      "continentId": "_Asia",
      "iso2": "MY",
    },
    {
      "id": "Mali",
      "name": "Mali",
      "continentId": "_Africa",
      "iso2": "ML",
    },
    {
      "id": "Malta",
      "name": "Malta",
      "continentId": "_Europe",
      "iso2": "MT",
    },
    {
      "id": "Marshall Islands",
      "name": "Marshall Islands",
      "continentId": "_Oceania",
      "iso2": "MH",
    },
    {
      "id": "Mauritania",
      "name": "Mauritania",
      "continentId": "_Africa",
      "iso2": "MR",
    },
    {
      "id": "Mauritius",
      "name": "Mauritius",
      "continentId": "_Africa",
      "iso2": "MU",
    },
    {
      "id": "Mayotte",
      "name": "Mayotte",
      "continentId": "_Africa",
      "iso2": "YT",
    },
    {
      "id": "Mexico",
      "name": "Mexico",
      "continentId": "_North America",
      "iso2": "MX",
    },
    {
      "id": "Moldova",
      "name": "Moldova",
      "continentId": "_Europe",
      "iso2": "MD",
    },
    {
      "id": "Monaco",
      "name": "Monaco",
      "continentId": "_Europe",
      "iso2": "MC",
    },
    {
      "id": "Mongolia",
      "name": "Mongolia",
      "continentId": "_Asia",
      "iso2": "MN",
    },
    {
      "id": "Montenegro",
      "name": "Montenegro",
      "continentId": "_Europe",
      "iso2": "ME",
    },
    {
      "id": "Morocco",
      "name": "Morocco",
      "continentId": "_Africa",
      "iso2": "MA",
    },
    {
      "id": "Mozambique",
      "name": "Mozambique",
      "continentId": "_Africa",
      "iso2": "MZ",
    },
    {
      "id": "Myanmar",
      "name": "Myanmar",
      "continentId": "_Asia",
      "iso2": "MM",
    },
    {
      "id": "Namibia",
      "name": "Namibia",
      "continentId": "_Africa",
      "iso2": "NA",
    },
    {
      "id": "Nauru",
      "name": "Nauru",
      "continentId": "_Oceania",
      "iso2": "NR",
    },
    {
      "id": "Nepal",
      "name": "Nepal",
      "continentId": "_Asia",
      "iso2": "NP",
    },
    {
      "id": "Netherlands",
      "name": "Netherlands",
      "continentId": "_Europe",
      "iso2": "NL",
    },
    {
      "id": "New Caledonia",
      "name": "New Caledonia",
      "continentId": "_Oceania",
      "iso2": "NC",
    },
    {
      "id": "New Zealand",
      "name": "New Zealand",
      "continentId": "_Oceania",
      "iso2": "NZ",
    },
    {
      "id": "Nicaragua",
      "name": "Nicaragua",
      "continentId": "_North America",
      "iso2": "NI",
    },
    {
      "id": "Niger",
      "name": "Niger",
      "continentId": "_Africa",
      "iso2": "NE",
    },
    {
      "id": "Nigeria",
      "name": "Nigeria",
      "continentId": "_Africa",
      "iso2": "NG",
    },
    {
      "id": "Niue",
      "name": "Niue",
      "continentId": "_Oceania",
      "iso2": "NU",
    },
    {
      "id": "North Korea",
      "name": "North Korea",
      "continentId": "_Asia",
      "iso2": "KP",
    },
    {
      "id": "Norway",
      "name": "Norway",
      "continentId": "_Europe",
      "iso2": "NO",
    },
    {
      "id": "Oman",
      "name": "Oman",
      "continentId": "_Asia",
      "iso2": "OM",
    },
    {
      "id": "Pakistan",
      "name": "Pakistan",
      "continentId": "_Asia",
      "iso2": "PK",
    },
    {
      "id": "Palestine",
      "name": "Palestine",
      "continentId": "_Asia",
      "iso2": "PS",
    },
    {
      "id": "Panama",
      "name": "Panama",
      "continentId": "_North America",
      "iso2": "PA",
    },
    {
      "id": "Papua New Guinea",
      "name": "Papua New Guinea",
      "continentId": "_Oceania",
      "iso2": "PG",
    },
    {
      "id": "Paraguay",
      "name": "Paraguay",
      "continentId": "_South America",
      "iso2": "PY",
    },
    {
      "id": "Peru",
      "name": "Peru",
      "continentId": "_South America",
      "iso2": "PE",
    },
    {
      "id": "Philippines",
      "name": "Philippines",
      "continentId": "_Asia",
      "iso2": "PH",
    },
    {
      "id": "Pitcairn Islands",
      "name": "Pitcairn Islands",
      "continentId": "_Oceania",
      "iso2": "PN",
    },
    {
      "id": "Poland",
      "name": "Poland",
      "continentId": "_Europe",
      "iso2": "PL",
    },
    {
      "id": "Portugal",
      "name": "Portugal",
      "continentId": "_Europe",
      "iso2": "PT",
    },
    {
      "id": "Puerto Rico",
      "name": "Puerto Rico",
      "continentId": "_North America",
      "iso2": "PR",
    },
    {
      "id": "Qatar",
      "name": "Qatar",
      "continentId": "_Asia",
      "iso2": "QA",
    },
    {
      "id": "Romania",
      "name": "Romania",
      "continentId": "_Europe",
      "iso2": "RO",
    },
    {
      "id": "Russia",
      "name": "Russia",
      "continentId": "_Europe",
      "iso2": "RU",
    },
    {
      "id": "Saint Kitts and Nevis",
      "name": "Saint Kitts and Nevis",
      "continentId": "_North America",
      "iso2": "KN",
    },
    {
      "id": "Saint Lucia",
      "name": "Saint Lucia",
      "continentId": "_North America",
      "iso2": "LC",
    },
    {
      "id": "Saint Vincent and the Grenadines",
      "name": "Saint Vincent and the Grenadines",
      "continentId": "_North America",
      "iso2": "VC",
    },
    {
      "id": "Samoa",
      "name": "Samoa",
      "continentId": "_Oceania",
      "iso2": "WS",
    },
    {
      "id": "San Marino",
      "name": "San Marino",
      "continentId": "_Europe",
      "iso2": "SM",
    },
    {
      "id": "Sao Tome and Principe",
      "name": "Sao Tome and Principe",
      "continentId": "_Africa",
      "iso2": "ST",
    },
    {
      "id": "Saudi Arabia",
      "name": "Saudi Arabia",
      "continentId": "_Asia",
      "iso2": "SA",
    },
    {
      "id": "Senegal",
      "name": "Senegal",
      "continentId": "_Africa",
      "iso2": "SN",
    },
    {
      "id": "Serbia",
      "name": "Serbia",
      "continentId": "_Europe",
      "iso2": "RS",
    },
    {
      "id": "Sierra Leone",
      "name": "Sierra Leone",
      "continentId": "_Africa",
      "iso2": "SL",
    },
    {
      "id": "Singapore",
      "name": "Singapore",
      "continentId": "_Asia",
      "iso2": "SG",
    },
    {
      "id": "Slovakia",
      "name": "Slovakia",
      "continentId": "_Europe",
      "iso2": "SK",
    },
    {
      "id": "Slovenia",
      "name": "Slovenia",
      "continentId": "_Europe",
      "iso2": "SI",
    },
    {
      "id": "Solomon Islands",
      "name": "Solomon Islands",
      "continentId": "_Oceania",
      "iso2": "SB",
    },
    {
      "id": "Somalia",
      "name": "Somalia",
      "continentId": "_Africa",
      "iso2": "SO",
    },
    {
      "id": "South Africa",
      "name": "South Africa",
      "continentId": "_Africa",
      "iso2": "ZA",
    },
    {
      "id": "South Sudan",
      "name": "South Sudan",
      "continentId": "_Africa",
      "iso2": "SS",
    },
    {
      "id": "Spain",
      "name": "Spain",
      "continentId": "_Europe",
      "iso2": "ES",
    },
    {
      "id": "Sri Lanka",
      "name": "Sri Lanka",
      "continentId": "_Asia",
      "iso2": "LK",
    },
    {
      "id": "Sudan",
      "name": "Sudan",
      "continentId": "_Africa",
      "iso2": "SD",
    },
    {
      "id": "Suriname",
      "name": "Suriname",
      "continentId": "_South America",
      "iso2": "SR",
    },
    {
      "id": "Swaziland",
      "name": "Swaziland",
      "continentId": "_Africa",
      "iso2": "SZ",
    },
    {
      "id": "Sweden",
      "name": "Sweden",
      "continentId": "_Europe",
      "iso2": "SE",
    },
    {
      "id": "Switzerland",
      "name": "Switzerland",
      "continentId": "_Europe",
      "iso2": "CH",
    },
    {
      "id": "Syria",
      "name": "Syria",
      "continentId": "_Asia",
      "iso2": "SY",
    },
    {
      "id": "Taiwan",
      "name": "Taiwan",
      "continentId": "_Asia",
      "iso2": "TW",
    },
    {
      "id": "Tanzania",
      "name": "Tanzania",
      "continentId": "_Africa",
      "iso2": "TZ",
    },
    {
      "id": "Thailand",
      "name": "Thailand",
      "continentId": "_Asia",
      "iso2": "TH",
    },
    {
      "id": "Togo",
      "name": "Togo",
      "continentId": "_Africa",
      "iso2": "TG",
    },
    {
      "id": "Tonga",
      "name": "Tonga",
      "continentId": "_Oceania",
      "iso2": "TO",
    },
    {
      "id": "Trinidad and Tobago",
      "name": "Trinidad and Tobago",
      "continentId": "_North America",
      "iso2": "TT",
    },
    {
      "id": "Tunisia",
      "name": "Tunisia",
      "continentId": "_Africa",
      "iso2": "TN",
    },
    {
      "id": "Turkey",
      "name": "Turkey",
      "continentId": "_Europe",
      "iso2": "TR",
    },
    {
      "id": "Turks and Caicos Islands",
      "name": "Turks and Caicos Islands",
      "continentId": "_North America",
      "iso2": "TC",
    },
    {
      "id": "Tuvalu",
      "name": "Tuvalu",
      "continentId": "_Oceania",
      "iso2": "TV",
    },
    {
      "id": "Uganda",
      "name": "Uganda",
      "continentId": "_Africa",
      "iso2": "UG",
    },
    {
      "id": "Ukraine",
      "name": "Ukraine",
      "continentId": "_Europe",
      "iso2": "UA",
    },
    {
      "id": "United Arab Emirates",
      "name": "United Arab Emirates",
      "continentId": "_Asia",
      "iso2": "AE",
    },
    {
      "id": "United Kingdom",
      "name": "United Kingdom",
      "continentId": "_Europe",
      "iso2": "GB",
    },
    {
      "id": "Uruguay",
      "name": "Uruguay",
      "continentId": "_South America",
      "iso2": "UY",
    },
    {
      "id": "USA",
      "name": "USA",
      "continentId": "_North America",
      "iso2": "US",
    },
    {
      "id": "Uzbekistan",
      "name": "Uzbekistan",
      "continentId": "_Asia",
      "iso2": "UZ",
    },
    {
      "id": "Vanuatu",
      "name": "Vanuatu",
      "continentId": "_Oceania",
      "iso2": "VU",
    },
    {
      "id": "Venezuela",
      "name": "Venezuela",
      "continentId": "_South America",
      "iso2": "VE",
    },
    {
      "id": "Vietnam",
      "name": "Vietnam",
      "continentId": "_Asia",
      "iso2": "VN",
    },
    {
      "id": "XA",
      "name": "Multiple Countries (Asia)",
      "continentId": "_Asia",
      "iso2": "XA",
    },
    {
      "id": "XE",
      "name": "Multiple Countries (Europe)",
      "continentId": "_Europe",
      "iso2": "XE",
    },
    {
      "id": "XS",
      "name": "Multiple Countries (South America)",
      "continentId": "_South America",
      "iso2": "XS",
    },
    {
      "id": "Yemen",
      "name": "Yemen",
      "continentId": "_Asia",
      "iso2": "YE",
    },
    {
      "id": "Zambia",
      "name": "Zambia",
      "continentId": "_Africa",
      "iso2": "ZM",
    },
    {
      "id": "Zimbabwe",
      "name": "Zimbabwe",
      "continentId": "_Africa",
      "iso2": "ZW",
    },
  ].map { |e| Country.new(e) }

  ALL_COUNTRIES_BY_ID = Hash[ALL_COUNTRIES.map { |e| [e.id, e] }]
  ALL_COUNTRIES_BY_ISO2 = Hash[ALL_COUNTRIES.map { |e| [e.iso2, e] }]
  ALL_COUNTRIES_WITH_NAME_AND_ID = Hash[ALL_COUNTRIES.map { |e| [e.name, e.id] }]
end

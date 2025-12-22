module SanityCheckData
  module PersonDataIrregularities
    ID = 1
    FOLDER = "person_data_irregularities"
    QUERIES = [
      {
        id: 1,
        topic: "Names with numbers or non-desired special characters",
        query: File.read(Rails.root.join("lib", "sanity_check_sql",FOLDER, "name_special_characters.sql"))
      },
      {
        id: 2,
        topic: "Lowercase first names",
        query: File.read(Rails.root.join("lib", "sanity_check_sql",FOLDER, "lower_case_first_name.sql"))
      },
    ]
  end
end

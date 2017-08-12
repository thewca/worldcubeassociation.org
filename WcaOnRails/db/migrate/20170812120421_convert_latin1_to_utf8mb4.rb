# frozen_string_literal: true

class ConvertLatin1ToUtf8mb4 < ActiveRecord::Migration[5.1]
  def change
    %w(championships timestamps).each do |table|
      execute "ALTER TABLE `#{table}` CHARACTER SET = utf8mb4;"
    end
  end
end

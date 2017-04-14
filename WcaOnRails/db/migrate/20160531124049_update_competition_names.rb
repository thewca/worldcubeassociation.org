# frozen_string_literal: true

class UpdateCompetitionNames < ActiveRecord::Migration
  def up
    execute "update Competitions set name = 'Clock N'' Other Stuff 2016', cellName = 'Clock N'' Other Stuff 2016' where id = 'ClockNOtherStuff2016';"
    execute "update Competitions set name = 'Macau Rubik''s Open 2009', cellName = 'Macau Rubik''s Open 2009' where id = 'MacauOpen2009';"
    execute "update Competitions set name = 'Moldavian Nationals - Winter 2016', cellName = 'Moldavian Nationals - Winter 2016' where id = 'MoldavianNationalsWinter2016';"
    execute "update Competitions set name = 'Thakur Rubik''s Cube Championship 2014', cellName = 'Thakur Rubik''s Cube Championship 2014' where id = 'ThakurChampionship2014';"
    execute "update Competitions set name = 'C3 Cube Open 2014', cellName = 'C3 Cube Open 2014' where id = 'C3Open2014';"
    execute "update Competitions set name = 'Hari ng Norte King of the North 2015' where id = 'HariNgNorte2015';"
    execute "update Competitions set name = 'HOOAH SMA 2015', cellName = 'HOOAH SMA 2015' where id = 'HOOAHSMA2015';"
    execute "update Competitions set name = 'Reno Lake Tahoe Winter 2010 Cube Competition' where id = 'RenoWinter2010';"
    execute "update Competitions set name = 'Rubik''s Cubed Baires 2.0 2011' where id = 'RubiksBaires2011';"
    execute "update Competitions set name = 'Campeonato de Cubos Mágicos de São Carlos SP 2013' where id = 'SaoCarlos2013';"
    execute "update Competitions set name = 'SESC Santos 2010', cellName = 'SESC Santos 2010' where id = 'SESCSantos2010';"
    execute "update Competitions set name = 'SESC Santos 2011', cellName = 'SESC Santos 2011' where id = 'SESCSantos2011';"
  end

  def down
    execute "update Competitions set name = 'Clock N’ Other Stuff 2016', cellName = 'Clock N’ Other Stuff 2016' where id = 'ClockNOtherStuff2016';"
    execute "update Competitions set name = 'Macau Rubik´s Open 2009', cellName = 'Macau Rubik´s Open 2009' where id = 'MacauOpen2009';"
    execute "update Competitions set name = 'Moldavian Nationals – Winter 2016', cellName = 'Moldavian Nationals – Winter 2016' where id = 'MoldavianNationalsWinter2016';"
    execute "update Competitions set name = 'Thakur Rubik’s Cube Championship 2014', cellName = 'Thakur Rubik’s Cube Championship 2014' where id = 'ThakurChampionship2014';"
    execute "update Competitions set name = 'C^3 Cube Open 2014', cellName = 'C^3 Cube Open 2014' where id = 'C3Open2014';"
    execute "update Competitions set name = 'Hari ng Norte (King of the North) 2015' where id = 'HariNgNorte2015';"
    execute "update Competitions set name = 'HOOAH! SMA 2015', cellName = 'HOOAH! SMA 2015' where id = 'HOOAHSMA2015';"
    execute "update Competitions set name = 'Reno/Lake Tahoe Winter 2010 Cube Competition' where id = 'RenoWinter2010';"
    execute "update Competitions set name = '(Rubik´s)^3 Baires 2.0 2011' where id = 'RubiksBaires2011';"
    execute "update Competitions set name = 'Campeonato de Cubos Mágicos de São Carlos/SP 2013' where id = 'SaoCarlos2013';"
    execute "update Competitions set name = 'SESC/Santos 2010', cellName = 'SESC/Santos 2010' where id = 'SESCSantos2010';"
    execute "update Competitions set name = 'SESC/Santos 2011', cellName = 'SESC/Santos 2011' where id = 'SESCSantos2011';"
  end
end

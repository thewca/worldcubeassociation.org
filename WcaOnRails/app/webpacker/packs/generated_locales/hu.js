// This file is generated automatically by the rake middleware!
// DO NOT EDIT IT MANUALLY!
import I18n from '../../lib/i18n';
I18n.translations || (I18n.translations = {});
I18n.translations["hu"] = I18n.extend((I18n.translations["hu"] || {}), JSON.parse('{"common":{"all_regions":"Minden régió","average":"Átlag","best":"Legjobb","continent":"Kontinens","country":"Ország","date":{"no_date":"Nincs dátum"},"date_placeholder":"ÉÉÉÉ-HH-NN","datetime_placeholder":"ÉÉÉÉ-HH-NN ÓÓ:PP","days":{"one":"1 nap","other":"%{count} nap","zero":"0 nap"},"delete":"Törlés","errors":{"invalid":"érvénytelen"},"filter":"Szűrő","here":"itt","search_site":"Keresés az oldalon","single":"Egyszeri","solves":"Kirakások","these_events":{"one":"ez a versenyszám","other":"ez a(z) %{count} versenyszám","zero":"ez a 0 versenyszám"},"time_format":"12h","user":{"citizen_of":"Ország","wca_id":"WCA ID"}},"competitions":{"announcements":"Közlemények","competition_form":{"add_championship":"Adj hozzá versenyt","championship_types":{"continental":"Kontinentális Bajnokság: %{continent}","generic":"Bajnokság: %{type}","greater_china":"Greater China Bajnokság","national":"Nemzeti Bajnokság: %{country}","world":"Világbajnokság"},"confirmed_but_not_visible_html":"Megerősítetted a versenyed, de még nincs kihirdetve. Várj, amíg %{contact} kihirdeti.","contact_html":"Opcionális kontakt információ. Ha nem töltöd ki, akkor a szervezők e-mail címei lesznek publikusak. %{md}. Pl: [Szöveg, amit ki akarsz íratni](mailto:some@email.com)","coordinates":"Koordináták","deprecated_events":"A versenyenyhez olyan versenyszámok vannak hozzáadva, amik többé nem hivatalosan és nem támogatjuk a szerkesztésüket.","events":"Versenyszámok","is_visible":"Ez a verseny mindenki számára látható, minden változtatás, amit végrehajtasz egyből látható lesz mindenkinek.","name_reason_html":"A verseny nevének rövid magyarázata. A névnek meg kell felelnie a \\u003ca href=\'/documents/policies/Competition%20Name.pdf\'\\u003eWCA Competition Name Policy\\u003c/a\\u003e-nek.","pending_confirmation_html":"Tölts ki minden mezőt és kattints a Megerősítés-re, amikor készen állsz arra, hogy %{contact} jóváhagyja a versenyt.","public_and_locked_html":"Ez a verseny ki van hirdetve és nem lehet szerkeszteni. Ha bármilyen módosításra van szükséged, akkor a verseny megerősítésekor kapott e-mailre válaszolj.","submit_confirm":"Biztosan megerősíted? A megerősítés után többé nem leszel képes az információk módosítására. Ezután nézd meg az e-mailedet, hogy meggyőződj róla, hogy a WCAT értesítve lett.","submit_confirm_value":"Megerősítés","submit_create_value":"Verseny létrehozása","submit_delete":"Biztosan törölni szeretnéd ezt a versenyt? Utána nem tudod visszavonni.","submit_delete_value":"Törlés","submit_update_value":"Verseny frissítése","supports_md_html":"Támogatja  a \\u003ca href=\'https://daringfireball.net/projects/markdown/basics\' target=\'_blank\'\\u003eMarkdown-t\\u003c/a\\u003e","venue_details_html":"A helyszín részletei (pl: Az első emeleten, hátul; kövesd a feliratokat). %{md}","venue_html":"A helyszín, ahol a verseny megrendezésre kerül. %{md}. Például: [Cité des Sciences et de l\'Industrie](http://www.cite-sciences.fr)","wcat":"WCA Competition Announcement Team"},"competition_info":{"address":"Cím","city":"Város","claim_wca_id_html":"Ha ez nem az első versenyed, akkor rendeld hozzá a WCA ID-det a WCA felhasználódhoz %{here}.","click_to_display_requirements_html":"A versenynek vége, kattints %{link_here}, hogy megjelenítsd a használt regisztrációs követelményeket.","competitor_limit_is":"A versenyre %{competitor_limit} fős versenyzői limit van.","contact":"Kontakt","create_wca_account_html":"Ha még nincs WCA felhasználód, akkor hozz létre egyet %{here}.","date":"Dátum","delegate":{"one":"WCA delegált","other":"WCA delegáltak","zero":"WCA delegált"},"details":"Részletek","entry_fee_is":"Az alap regisztrációs díj a versenyre %{base_entry_fee}.","events":"Versenyszámok","guests_free":"Nézők ingyenesen részt vehetnek a versenyen.","guests_pay":"Nézők a %{guests_base_fee} alap nézői regisztrációs díj megfizetésével tudnak részt venni a versenyen.","hide_requirements":"Regisztrációs követelmények elrejtése.","information":"Információk","no_competitor_limit":"Nincs versenyzői limit a versenyre.","no_entry_fee":"A versenyre ingyenes a regisztráció.","no_on_the_spot_registration":"Helyszíni regisztráció nem lesz lehetséges.","no_refunds":"A regisztrációs díjak nem lesznek visszatérítve semmilyen körülmények között.","on_the_spot_registration":"A helyszíni regisztráció lehetséges lesz %{on_the_spot_base_entry_fee} alap regisztrációs díjjal.","on_the_spot_registration_free":"A helyszíni regisztrció ingyenes lesz.","organizer_plural":{"one":"Szervező","other":"Szervezők","zero":"Szervező"},"refund_policy_html":"A regisztrációd a %{limit_date_and_time} határidő előtt lett törölve, így a regisztrációs díjad %{refund_policy_percent}-a vissza lesz tértve.","register_below_html":"Regisztrálj erre a versenyre lent.","register_link_html":"Regisztrálj erre a versenyre %{here}.","registration_period":{"label":"Regisztrációs időszak","range_future_html":"Az online regisztráció kezdete: %{start_date_and_time} és a vége: %{end_date_and_time}.","range_ongoing_html":"Az online regisztráció kezdete: %{start_date_and_time} és a vége: close %{end_date_and_time}.","range_past_html":"Az online regisztráció kezdete: %{start_date_and_time} és a vége: %{end_date_and_time} volt."},"registration_requirements":"A regisztráció feltételei","use_stripe_below_html":"A regisztrációs díjat a Stripe rendszeren keresztül kell befizetni lent, a regisztrció után.","use_stripe_link_html":"A regisztrációs díjat a Stripe rendszeren keresztül %{here} kell befizetni a regisztráció után.","venue":"Helyszín","website":"Weboldal"},"errors":{"cannot_delete_confirmed":"Nem tudsz megerősített versenyt törölni.","cannot_delete_public":"Nem tudsz versenyt törölni, ami mindenki számára látható.","cannot_manage":"A versenyt nem tudod szerkeszteni.","end_date_before_start":"A záró dátum nem lehet a nyitó dátum előtt.","invalid_currency_code":"A kiválasztott pénznem érvénytelen","invalid_name_message":"évszámmal kell végződnie és kizárólag alfanumerikus karaktereket, gondolatjeleket(-), \\"és\\" jeleket(\\u0026), pontokat(.), kettőspontokat(:), aposztrófokat(\') és szóközöket( ) tartalmazhat","must_contain_delegate":"legalább legalább 1 WCA Delegálttal rendelkeznie kell a versenynek","must_contain_event":"legalább 1 versenyszámmal rendelkeznie kell a versenynek","not_all_delegates":"nem mindegyikük Delegált","refund_date_after_start":"A visszatérítési határidő nem lehet a kezdési dátum után.","registration_close_after_open":"a regisztráció zárásának a regisztráció nyitása utánra kell esnie","schedule_must_match_rounds":"legalább 1 fordulóval rendelkeznie kell és minden fordulónak szerepelnie kell az időbeosztásban.","span_too_many_days":"A verseny nem tarthat %{max_days} napnál több ideig."},"events":{"cutoff":"Cutoff","format":"Formátum","proceed":"Tovább jut","time_limit":"Időlimit","time_limit_information":{"cumulative_across_rounds_html":"%{cumulative_time_limit} lehet használatban több fordulóra együttesen is (lásd %{guideline_link}).","cumulative_one_round_html":"%{cumulative_time_limit} lehet használatban (lásd %{regulation_link}).","cumulative_time_limit":"Kumulált időlimit","cutoff_html":"Az az eredmény, ami által jogosulttá válasz egy kombinált forduló második szakaszában való versenyzésre (lásd %{regulation_link}).","format_html":"A formátum írja le, hogy mi alapján határozzuk meg a versenyzők helyezését az eredményeik alapján. Az egyes versenyszámoknál megengedett formátumokat a %{link_to_9b} írja le. Nézd meg a %{link_to_9f}-t az egyes formátumok értelmezéséhez.","guideline_link_text":"Útmutató %{number}","regulation_link_text":"Szabályzat %{number}","time_limit_html":"Ha eléred az időlimitet a kirakás közben, akkor a bíró le fog állítani és az eredményed DNF (lásd %{regulation_link}) lesz."}},"index":{"all_events":"Mind","all_years":"Minden év","clear":"Törlés","custom":"Egyedi","from_date":"From","list":"Lista","map":"Térkép","no_access":"Nincs hozzáférésed ehhez az oldalhoz!","no_comp_found":"Nem található verseny.","no_comp_match":"Nem található verseny ezekkel a versenyszámokkal: %{events}! Próbálj meg kevesebb versenyszámra keresni.","past":"Régebbi","past_all":"Régebbi, minden évből","past_from":"Régebbi, %{year} évből","present":"Jelenlegi","recent":"Korábbi","region":"Régió","search":"Keresés","state":"Amikor","title":"Versenyek","titles":{"custom":"Versenyek a kiválasztott időintervallumban","in_progress":"Folyamatban lévő verseny","past":"Régebbi versenyek, %{year} évben","past_all":"Régebbi versenyek, minden évből","recent":"Korábbi versenyek (elmúlt %{count} nap)","upcoming":"Jövőbeli versenyek"},"to_date":"To","tooltips":{"hourglass":{"ended":"Véget ért %{days}ja","in_progress":"Folyamatban van!","posted":"Az eredmények feltöltve!","starts_in":"%{days} nap múlva kezdődik"},"recent":"Az elmúlt %{count} nap","search":"Név vagy város"}},"messages":{"confirmed_not_visible":"Ez a verseny megerősített, de nem publikus","confirmed_visible":"Ez verseny megerősített és mindenki számára látható","create_success":"Sikeresen létrehoztál egy új versenyt!","in_progress":"A verseny folyamatban van. Kérlek látogass vissza az oldalra %{date} után, hogy lásd az eredményeket!","must_have_events":"Kérlek adj hozzá legalább 1 versenyszámot, mielőtt megerősíted a versenyt.","name_too_long":"A verseny neve 32 karakternél hosszabb. Az ennél rövidebb neveket támogatjuk és ezért örülnénk ha megváltoztatnád.","not_confirmed_not_visible":"Ez a verseny nem megerősített és nem publikus","not_confirmed_visible":"Ez a verseny nem megerősített, de mindenki számára látható","not_visible":"Ez a verseny még nem publikus.","results_preview_alert":"Olyan eredményeket nézel, amik még nem lettek közzétéve.","schedule_must_match_rounds":"Kérlek győződj meg róla, hogy a verseny minden versenyszáma rendelkezik legalább 1 fordulóval és az időbeosztás, amit készítettél minden fordulót tartalmaz, mielőtt még megerősítenéd a versenyt.","stripe_connected":"Sikeresen társítottad a Stripe felhasználódat, mostantól képes vagy fogadni az erre a versenyre érkező befizetéseket.","stripe_not_connected":"Probléma merült fel. Nem tudtuk a Stripe felhasználódat társítani.","tooltip_registered":"Regisztrálva vagy.","tooltip_waiting_list":"Jelenleg a várólistán vagy.","upload_results":"A verseny véget ért, dolgozunk rajta, hogy az eredmények minél előbb felkerüljenek a honlapra!"},"my_competitions":{"disclaimer":"Csak azok a versenyek jelennek meg itt, melyek a WCA regisztrációs rendszerét használnak. Ha a versenyed nem szerepel a listában, akkor keresd fel a verseny honlapját.","past_competitions":"Korábbi versenyek","title":"Versenyeim"},"my_competitions_table":{"competitions_list":"versenyek listája","edit":"Szerkesztés","edit_report":"Riport szerkesztése","missing_report":"A riportod még nem lett közzétéve!","no_past_competitions":"Nincs múltbéli versenyed.","no_upcoming_competitions_html":"Nincs jövőbeli versenyed! Nézd meg a linket: %{link}.","registrations":"Regisztrációk","report":"Nézd meg a delegált riportot","results_up":"Eredmények feltöltve!"},"nav":{"menu":{"admin_view":"Admin nézet","all":"Mind","by_person":"Személyenként","clone":"Klónozás","competitors":"Versenyzők","delegate_report":"Delegált riport","edit":"Szerkesztés","event_view":"Versenyszámok szerkesztése","import_registrations":"Regisztrációk importálása","info":"Információk","orga_view":"Szervezői nézet","payment_view":"Fizetések beállítása","podiums":"Dobogós helyezések","register":"Regisztrálok","registration":"Regisztráció","results":"Eredmények","schedule_view":"Időbeosztás szerkeztése","submit_results":"Eredmények beküldése","tabs":"Fülek szerkesztése"}},"nearby_competitions":{"after":"után","before":"előtt","competitions":{"one":"1 verseny","other":"%{count} verseny","zero":"nincs verseny"},"competitors":"Versenyzők","date":"Dátum","delegates":"Delegált(ak)","distance":"Távolság","label":"Közeli versenyek (%{days} napon és %{kms} km-en belül)","label_admin":"Elmúlt %{days} nap","limit":"Limit","location":"Elhelyezkedés","name":"Név","nearby_admin":"%{x_competitions} van %{kms} km-en és %{days} napon belül.","no_comp_nearby":"Nincs a közelben verseny!","no_date_yet":"Nem választottál még dátumot ennek a versenynek.","no_location_yet":"Nem választottál még helyszínt ennek a versenynek.","show":"Mutat","within":"%{days} napon belül"},"new":{"create_competition":"Verseny létrehozása","note_clone":"Egy létező verseny lemásolásához keresd fel a verseny információs oldalát és kattints a \\"Klónozás\\" linkre a menüben."},"post_announcement":"Poszt készítése versenyek kihirdetéséről","results_table":{"event":"Versenyszám","name":"Név","round":"Forduló","wca_profile":"WCA profil"},"schedule":{"activity":"Tevékenység","display_as":{"calendar":"Naptár","label":"Az időbeosztás megjelenítése, mint:","table":"Táblázat"},"display_for_room":"Az időbeosztás megjelenítése:","end":"Vége","multiple_venues_available":"A verseny több helyszínen is zajlik, ne felejtsd el megnézni a többi helyszín időbeosztását!","range":{"from":"Kezdő időpont:","to":"Vég időpont:"},"room":"Terem","schedule_for_date":"Időbeosztás %{day_name} (%{full_date})","start":"Kezdés","timezone_message":"Az időbeosztás a(z) %{timezone} időzónában jelenik meg.","venue_information_html":"A %{venue_name} helyszín időbeosztását nézed épp."},"show":{"events":"Versenyszámok","general_info":"Általános információk","schedule":"Időbeosztás"},"time_until_competition":{"competition_in":"A verseny %{n_days} múlva kezdődik.","competition_was":"A verseny %{n_days}pal elezőtt véget ért."},"update":{"confirm_success":"Sikeresen megerősítetted a versenyt. Nézd meg az e-mailedet és várj, amíg a WCAT kihirdeti!","delete_success":"Sikeresen törölt verseny (%{id}).","save_success":"Sikeresen elmentetted a versenyt."},"update_events":{"update_success":"Sikeresen frissítetted a versenyen lévő versenyszámokat."},"upload_results":"Eredmények feltöltése"},"countries":{"AC":"Ascension-sziget","AD":"Andorra","AE":"Egyesült Arab Emirátus","AF":"Afganisztán","AG":"Antigua és Barbuda","AI":"Anguilla","AL":"Albánia","AM":"Örményország","AN":"Holland Antillák","AO":"Angola","AQ":"Antarktisz","AR":"Argentína","AS":"Amerikai Szamoa","AT":"Ausztria","AU":"Ausztrália","AW":"Aruba","AX":"Åland-szigetek","AZ":"Azerbajdzsán","BA":"Bosznia-Hercegovina","BB":"Barbados","BD":"Banglades","BE":"Belgium","BF":"Burkina Faso","BG":"Bulgária","BH":"Bahrein","BI":"Burundi","BJ":"Benin","BL":"Saint-Barthélemy","BM":"Bermuda","BN":"Brunei","BO":"Bolívia","BQ":"Holland Karib-térség","BR":"Brazília","BS":"Bahama-szigetek","BT":"Bhután","BV":"Bouvet-sziget","BW":"Botswana","BY":"Fehéroroszország","BZ":"Belize","CA":"Kanada","CC":"Kókusz-szigetek","CD":"Kongó - Kinshasa","CF":"Közép-afrikai Köztársaság","CG":"Kongó - Brazzaville","CH":"Svájc","CI":"Elefántcsontpart","CK":"Cook-szigetek","CL":"Chile","CM":"Kamerun","CN":"Kína","CO":"Kolumbia","CP":"Clipperton-sziget","CR":"Costa Rica","CU":"Kuba","CV":"Zöld-foki Köztársaság","CW":"Curaçao","CX":"Karácsony-sziget","CY":"Ciprus","CZ":"Csehország","DE":"Németország","DG":"Diego Garcia","DJ":"Dzsibuti","DK":"Dánia","DM":"Dominika","DO":"Dominikai Köztársaság","DZ":"Algéria","EA":"Ceuta és Melilla","EC":"Ecuador","EE":"Észtország","EG":"Egyiptom","EH":"Nyugat-Szahara","ER":"Eritrea","ES":"Spanyolország","ET":"Etiópia","EU":"Európai Unió","FI":"Finnország","FJ":"Fidzsi-szigetek","FK":"Falkland-szigetek","FM":"Mikronézia","FO":"Feröer-szigetek","FR":"Franciaország","GA":"Gabon","GB":"Egyesült Királyság","GD":"Grenada","GE":"Grúzia","GF":"Francia Guyana","GG":"Guernsey","GH":"Ghána","GI":"Gibraltár","GL":"Grönland","GM":"Gambia","GN":"Guinea","GP":"Guadeloupe","GQ":"Egyenlítői-Guinea","GR":"Görögország","GS":"Déli-Georgia és Déli-Sandwich-szigetek","GT":"Guatemala","GU":"Guam","GW":"Guinea-Bissau","GY":"Guyana","HK":"Hongkong","HM":"Heard-sziget és McDonald-szigetek","HN":"Honduras","HR":"Horvátország","HT":"Haiti","HU":"Magyarország","IC":"Kanári-szigetek","ID":"Indonézia","IE":"Írország","IL":"Izrael","IM":"Man-sziget","IN":"India","IO":"Brit Indiai-óceáni Terület","IQ":"Irak","IR":"Irán","IS":"Izland","IT":"Olaszország","JE":"Jersey","JM":"Jamaica","JO":"Jordánia","JP":"Japán","KE":"Kenya","KG":"Kirgizisztán","KH":"Kambodzsa","KI":"Kiribati","KM":"Comore-szigetek","KN":"Saint Kitts és Nevis","KP":"Észak-Korea","KR":"Korea","KW":"Kuvait","KY":"Kajmán-szigetek","KZ":"Kazahsztán","LA":"Laosz","LB":"Libanon","LC":"Santa Lucia","LI":"Liechtenstein","LK":"Srí Lanka","LR":"Libéria","LS":"Lesotho","LT":"Litvánia","LU":"Luxemburg","LV":"Lettország","LY":"Líbia","MA":"Marokkó","MC":"Monaco","MD":"Moldova","ME":"Montenegró","MF":"Saint Martin","MG":"Madagaszkár","MH":"Marshall-szigetek","MK":"Macedónia","ML":"Mali","MM":"Mianmar (Burma)","MN":"Mongólia","MO":"Makaó","MP":"Északi Mariana-szigetek","MQ":"Martinique","MR":"Mauritánia","MS":"Montserrat","MT":"Málta","MU":"Mauritius","MV":"Maldív-szigetek","MW":"Malawi","MX":"Mexikó","MY":"Malajzia","MZ":"Mozambik","NA":"Namíbia","NC":"Új-Kaledónia","NE":"Niger","NF":"Norfolk-sziget","NG":"Nigéria","NI":"Nicaragua","NL":"Hollandia","NO":"Norvégia","NP":"Nepál","NR":"Nauru","NU":"Niue","NZ":"Új-Zéland","OM":"Omán","PA":"Panama","PE":"Peru","PF":"Francia Polinézia","PG":"Pápua Új-Guinea","PH":"Fülöp-szigetek","PK":"Pakisztán","PL":"Lengyelország","PM":"Saint Pierre és Miquelon","PN":"Pitcairn-szigetek","PR":"Puerto Rico","PS":"Palesztin Terület","PT":"Portugália","PW":"Palau","PY":"Paraguay","QA":"Katar","QO":"Külső-Óceánia","RE":"Reunion","RO":"Románia","RS":"Szerbia","RU":"Oroszország","RW":"Ruanda","SA":"Szaúd-Arábia","SB":"Salamon-szigetek","SC":"Seychelle-szigetek","SD":"Szudán","SE":"Svédország","SG":"Szingapúr","SH":"Szent Ilona","SI":"Szlovénia","SJ":"Spitzbergák és Jan Mayen-szigetek","SK":"Szlovákia","SL":"Sierra Leone","SM":"San Marino","SN":"Szenegál","SO":"Szomália","SR":"Suriname","SS":"Dél-Szudán","ST":"Sao Tomé és Príncipe","SV":"Salvador","SX":"Sint Maarten","SY":"Szíria","SZ":"Szváziföld","TA":"Tristan da Cunha","TC":"Turks- és Caicos-szigetek","TD":"Csád","TF":"Francia Déli Területek","TG":"Togo","TH":"Thaiföld","TJ":"Tádzsikisztán","TK":"Tokelau","TL":"Kelet-Timor","TM":"Türkmenisztán","TN":"Tunézia","TO":"Tonga","TR":"Törökország","TT":"Trinidad és Tobago","TV":"Tuvalu","TW":"Tajvan","TZ":"Tanzánia","UA":"Ukrajna","UG":"Uganda","UM":"Amerikai Csendes-óceáni Szigetek","US":"Amerikai Egyesült Államok","UY":"Uruguay","UZ":"Üzbegisztán","VA":"Vatikán","VC":"Saint Vincent és a Grenadine-szigetek","VE":"Venezuela","VG":"Brit Virgin-szigetek","VI":"Amerikai Virgin-szigetek","VN":"Vietnam","VU":"Vanuatu","WF":"Wallis- és Futuna-szigetek","WS":"Szamoa","XA":"Több ország (Ázsia)","XE":"Több ország (Európa)","XK":"Koszovó","XM":"Több ország (Amerika)","XS":"Több ország (Dél-Amerika)","YE":"Jemen","YT":"Mayotte","ZA":"Dél-afrikai Köztársaság","ZM":"Zambia","ZW":"Zimbabwe"},"enums":{"competition_medium":{"status":{"accepted":"Elfogadva","pending":"Függőben"},"type":{"article":"Cikk","multimedia":"Multimédia","report":"Riport"}},"person":{"gender":{"f":"Nő","m":"Férfi","o":"Egyéb"}},"user":{"delegate_status":{"candidate_delegate":"Candidate Delegate","delegate":"Delegate","senior_delegate":"Senior Delegate"},"gender":{"f":"Nő","m":"Férfi","o":"Egyéb"}}},"events":{"222":"2x2x2 kocka","333":"3x3x3 kocka","333bf":"3x3x3 vakon","333fm":"3x3x3 legkevesebb mozdulat","333ft":"3x3x3 lábbal","333mbf":"3x3x3 több kocka vakon","333mbo":"3x3x3 kocka: több kocka vakon régi formátum","333oh":"3x3x3 egy kézzel","444":"4x4x4 kocka","444bf":"4x4x4 vakon","555":"5x5x5 kocka","555bf":"5x5x5 vakon","666":"6x6x6 kocka","777":"7x7x7 kocka","clock":"Clock","magic":"Magic","minx":"Megaminx","mmagic":"Master Magic","pyram":"Pyraminx","skewb":"Skewb","sq1":"Square-1"},"formats":{"1":"1-ből a legjobb","2":"2-ből a legjobb","3":"3-ból a legjobb","a":"5 átlaga","m":"3 átlaga","short":{"1":"Bo1","2":"Bo2","3":"Bo3","a":"Ao5","m":"Mo3"}},"regional_organizations":{"application_instructions":{"description_html":"Kérlek töltsd ki ezt az űrlapot: \\u003ca href=\'https://docs.google.com/forms/d/e/1FAIpQLSfX2HbafvMbWw-9DTgIP0Zf7im1VMZEaRq1J-jXnyW2nVYzsg/viewform\'\\u003ethis form\\u003c/a\\u003e.","title":"Jelentkezés menete"},"content":"A WCA a következő nemzeti szervezeteket ismeri el:","how_to":{"description":"A WCA világszerte számos nemzeti szervezetet ismer el. A WCA nemzeti szervezetek célja, hogy WCA versenyeket szervezzen és támogassa a WCA tevékenységét az adott régióban. Azok az országoknak, akik nemzeti szervezetet szeretnének létrehozni először támogatniuk kell a WCA tevékenységét az adott régióban, mielőtt beadják a jelentkezésüket. WCA versenyek szervezésében segítséget kaphatsz a hozzád legközelebb lévő WCA Delegálttól.","title":"Hogyan lehet WCA nemzeti szervezetté válni"},"requirements":{"list":{"1":"Aktívan szervezzen és támogassa a WCA versenyek szervezését a régióban","2":"Aktívan támogassa a kontinens versenyeket, amik a nemzeti szervezet kontinensén kerülnek megrendezésre","3":"Elismerje és alkalmazza a célkitűzéseket, amelyek WCA Alaptörvényében és a WCA Szabályzatban vannak lefektetve","4":"Megfeleljen az érvényes WCA Szabályzatnak","5":"Fogadja el a WCA képviselőinek döntéseit és feleljen meg nekik","6":"Folyamatosan el kell juttatnia az aktuális alaptörvényét és szabályzatát a WCA-hoz elektronikus formában"},"title":"Feltételek a WCA nemzeti szervezetekkel szemben"},"title":"Nemzeti szervezetek"},"round":{"name":"%{event_name} %{round_name}"},"search_results":{"index":{"advanced_search":"Részletes keresés","competitions":"Versenyek","not_found":{"competitions":"Nem található verseny a következő kereséssel:","people":"Nem található személy a következő kereséssel:","posts":"Nem található poszt a következő kereséssel:","regulations_and_guidelines":"Nem található Szabályzat vagy Útmutató cikk a következő kereséssel:"},"people":"Személyek","posts":"Posztok","regulations_and_guidelines":"Szabályzat és Útmutató"}}}'));

document.addEventListener("deviceready", onDeviceReady, false);
var db;
var archiveRows = [];
var userArchiveRows = [];
var allJournals = [];

//checkconnection(); alert(navigator.connection.type);
document.addEventListener("backbutton", onBackKeyDown, false);

function onDeviceReady() {
    //document.addEventListener("backbutton", onBackKeyDown, false);
}

(function () {
    db = window.openDatabase("JournalsDB", "1.0", "Ohrgos Database", 36000); //will create database Dummy_DB or open it
    if (!db) {
        alert("Невозможно подключится к Базе данных...");
    }

    db.transaction(populateDB, function (txn, error) {}, function () {
        $.post('http://ohrgos.ru/mobile_application/getJournalsData.php', function (data) {

            var journals_items = eval('(' + data + ')').sort(compareDate);
            //USER JOURNALS 
            var sql_data_user = 'SELECT user_journals.journalId, user_journals.content, journals.title, journals.journal_picture FROM user_journals, journals WHERE journals.journal_id = user_journals.journalId GROUP BY user_journals.journalId';
            var findJournals = new Array();

            db.transaction(function (txn) {
                txn.executeSql(sql_data_user, [], function (txn, result) {
                    for (var i = 0; i < result.rows.length; i++) {
                        findJournals.push(result.rows.item(i)['journalId']);
                    }

                    db.transaction(function (txn) {
                        for (var i = 0; i < journals_items.length; i++) {
                            if (findJournals.indexOf(parseInt(journals_items[i].id)) < 0) {
                                txn.executeSql('INSERT OR IGNORE INTO journals (title, journal_picture, journal_id, created) VALUES("' + journals_items[i].title + '", "' + journals_items[i].image + '", "' + journals_items[i].id + '", "' + journals_items[i].created + '")');
                            }
                        }
                    }, function (txn, error) {
                        alert(error);
                    }, function () {
                        db.transaction(function (txn) {
                            var sql_data = 'SELECT *, (SELECT MAX(journal_id) FROM journals) AS MaxID FROM journals WHERE journal_id NOT IN (SELECT journalId FROM user_journals) ORDER BY created DESC';
                            var sql_data_all = 'SELECT *, (SELECT MAX(journal_id) FROM journals) AS MaxID FROM journals ORDER BY created DESC';
                            
							
							txn.executeSql(sql_data_all, [], function (txn, result) {
                                if (result.rows.length > 0) {
									
												
									for (i = 0; i < result.rows.length; i++){
										allJournals.push(result.rows.item(i));
									}
									
                                } 
                            }, function (txn, error) {
                                alert(error);
                            });
							
							
							
							txn.executeSql(sql_data, [], function (txn, result) {
                                if (result.rows.length > 0) {
									
												
									for (i = 0; i < result.rows.length; i++){
										archiveRows.push(result.rows.item(i));
									}
									updateJournalArchive();
									
									
                                } else {
                                    $('#parse_load_result').html('<p class="internet_error">Для того чтобы получить список журналов и загрузить их требуется соединение с интернетом...</p>');
                                }
                            }, function (txn, error) {
                                alert(error);
                            });

                            getUserJournals();

                        }, function (txn, error) {
                            alert(error);
                        }, function () {
                            $('.mobile_main_screen').fadeOut(300, function () {
                                $('.mobile_main_content').fadeIn(300);
                            });
                        });
                    });
                }, function (txn, error) {
                    alert(error.message);
                });
            }, function (err) {
                console.log(err.message);
            }, function () {

            });
        }).fail(function () {
            db.transaction(function (txn) {
                var sql_data = 'SELECT *, (SELECT MAX(journal_id) FROM journals) AS MaxID FROM journals WHERE journal_id NOT IN (SELECT journalId FROM user_journals) ORDER BY created DESC';
                txn.executeSql(sql_data, [], function (txn, result) {
                    if (result.rows.length > 0) {
                        
						
						
						for (i = 0; i < result.rows.length; i++){
							archiveRows.push(result.rows.item(i));
						}
						
						updateJournalArchive();
						
						
						
						
						
                    } else {
                        $('#parse_load_result').html('<p class="internet_error">Для того чтобы получить список журналов и загрузить их требуется соединение с интернетом...</p>');
                    }
                }, function (txn, error) {
                    alert(error);
                });

                getUserJournals();

            }, function (txn, error) {
                alert(error);
            }, function () {
                $('.mobile_main_screen').fadeOut(300, function () {
                    $('.mobile_main_content').fadeIn(300);
                });
            });
        });
    });
})();



function updateJournalArchive(){

	$('#new_journal_content').empty();
	$('#parse_load_result').empty();
	$('#parse_load_result').append('<div class="journal_archive_title">Архив номеров</div>');
						
	
	var arr2 = []
	for(i=0;i<archiveRows.length;i++) {
	  for(k=0;k<archiveRows.length;k++) {
		if(k!=i) {
		  if(archiveRows[i]['journal_id']==archiveRows[k]['journal_id']) archiveRows[k]=''
		}
	  }
	}
	for(i=0;i<archiveRows.length;i++) {
	  if(archiveRows[i]=='') continue
	  else arr2.push(archiveRows[i])
	}
	archiveRows = arr2;

						
						
	for (var i = 0; i < archiveRows.length; i++) {
		if (i === 0) {
			
			if (archiveRows[i]['journal_id'] === archiveRows[i]['MaxID']) {
				
				
				$('.mobile_main_content').prepend('<div id="new_journal_content"></div>');
				
				$('#new_journal_content').addClass('newJournal' + archiveRows[i]['journal_id']);
				$('#new_journal_content').append('<div class="new_journal_block" style="background-image: url(' + archiveRows[i]['journal_picture'] + ');"><div class="journal_back"><div class="new_journal_title">Свежий номер</div><div class="journal_back_image" style="background-image: url(' + archiveRows[i]['journal_picture'] + ');"></div><div class="journal_name">' + archiveRows[i]['title'] + '</div><div class="journal_download_main" onclick="loadJournalContentFromSite(' + archiveRows[i]['journal_id'] + ');" id="s' + archiveRows[i]['journal_id'] + '"><div class="download_progress" id="j' + archiveRows[i]['journal_id'] + '"><div class="b_title gray" id="t' + archiveRows[i]['journal_id'] + '">Скачать</div></div></div></div></div>');
			}
		} else {
			
			$('#parse_load_result').append('<div class="journal_block" id="jb' + archiveRows[i]['journal_id'] + '"><div class="journal_min_title">' + archiveRows[i]['title'] + '</div><img src="' + archiveRows[i]['journal_picture'] + '" /><div class="save_button_journal" onclick="loadJournalContentFromSite(' + archiveRows[i]['journal_id'] + ');" id="s' + archiveRows[i]['journal_id'] + '"><div class="download_progress" id="j' + archiveRows[i]['journal_id'] + '"><div class="b_title" id="t' + archiveRows[i]['journal_id'] + '">Скачать</div></div></div></div>');
		}
	}
	
}

function onBackKeyDown() {
    switch (nowOpen) {
        case 'full':
            hideFullJournal();
            break;
        case 'nofull':
            hideReadJournal();
            break;
    }
    return false;
}

var loadingProgress = null;
var isLoading = false;

function compareDate(obj1, obj2) {
	return new Date(obj2.created) - new Date(obj1.created);
}

function cancelDel(_id) {
    //alert(_id);
    $('#journal_id' + _id).find('.delete_container').hide(300);
}

function deleteJournal(_id) {
	
	
	

	
    db.transaction(function (txn) {
        txn.executeSql('DELETE FROM user_journals WHERE journalId = ?', [_id]);
    }, function (e) {
		
		for(var i = 0;i < userArchiveRows.length;i++){
			
			
			
			if(userArchiveRows[i]['journalId'] == _id)
			{
				var f = false;
				for(var j = 0; j < archiveRows.length;j++)
				{
					
					
					if(archiveRows[j]['journal_id'] == _id)
					{	
						f = true;
					}
					
				}
				
				if(!f){
					
					var value;
					for(var k = 0;k < allJournals.length;k++)
					{
						
						if(allJournals[k]['journal_id'] == userArchiveRows[i].journalId)
						{
							
							value = allJournals[k];
						}
					}
					
					
					
					archiveRows.push(value);
				}
			}
		}
		
		
		

		archiveRows.sort(compareDate);
		
		
        $('#journal_id' + _id).remove();
		
		updateJournalArchive();
		
						
    }, function () {
		
		for(var i = 0;i < userArchiveRows.length;i++){
			
			
			
			if(userArchiveRows[i]['journalId'] == _id)
			{
				var f = false;
				for(var j = 0; j < archiveRows.length;j++)
				{
					
					if(archiveRows[j]['journal_id'] == _id)
					{
						f = true;
					}
					
				}
				
				if(!f){
				
					var value;
					
					
					
					for(var k = 0;k < allJournals.length;k++)
					{
						if(allJournals[k]['journal_id'] == _id)
						{
							
							value = allJournals[k];
						}
					}
					
					archiveRows.push(value);
				}
			}
		}
	
		archiveRows.sort(compareDate);
		
		
        $('#journal_id' + _id).remove();
		updateJournalArchive();
						
    });
}

function loadJournalContentFromSite(_journalId, _main) {

    if (!isLoading) {
        isLoading = true;
        //$('.mobile_main_screen_loading').show(300);

        $('#s' + _journalId).css('background-color', '#e2e3df');
        loadingProgress = setInterval(function () {

            if (_main === 1) {
                $('.load_new_journal').show(100);

                var w_width = $('.load_new_journal').width();
                var p_80 = (w_width * Math.random() * 90) / 100;

                if ($('.load_new_journal_progress').width() < p_80) {
                    $('.load_new_journal_progress').css('width', ($('.load_new_journal_progress').width() + 10) + 'px');
                }

                var _percent = ($('.load_new_journal_progress').width() * 100) / w_width;
                //$('#t' + _journalId).html(_percent.toFixed(0) + '%');

            } else {
                var w_width = $('.save_button_journal').width();
                var p_80 = (w_width * Math.random() * 90) / 100;

                if ($('#j' + _journalId).width() < p_80) {
                    $('#j' + _journalId).css('width', ($('#j' + _journalId).width() + 10) + 'px');
                }

                var _percent = ($('#j' + _journalId).width() * 100) / w_width;
                $('#t' + _journalId).html(_percent.toFixed(0) + '%');
            }
        }, 100);

        $.post('http://ohrgos.ru/getCurrentJournal.php', {'journalId': _journalId}, function (data) {
			
			
		
			
			try {

				var journals_items = eval('(' + data + ')').sort(function (obj1, obj2) {
					return obj1.journal_id - obj2.journal_id;
				});
				
			
			
			
            //$('.mobile_main_screen_loading').html(data);
            db.transaction(function (txn) {
                for (var i = 0; i < journals_items.length; i++) {
                    txn.executeSql('INSERT OR IGNORE INTO user_journals (content, journalId, introtext, posttitle, created, category, introImage, created_by_alias) VALUES(?, ?, ?, ?, ?, ?, ?, ?)', [journals_items[i].content, journals_items[i].journal_id, journals_items[i].introtext, journals_items[i].title, journals_items[i].created, journals_items[i].category, journals_items[i].intro_image, journals_items[i].created_by_alias]);
                }
            }, function (e) {
                clearInterval(loadingProgress);
                isLoading = false;
                //location.reload();
                $('#jb' + _journalId).remove();
                $('.newJournal' + _journalId).remove();
            }, function () {
                clearInterval(loadingProgress);
                getUserJournals();
                isLoading = false;
                $('.newJournal' + _journalId).remove();
                $('#jb' + _journalId).remove();
            });
			
			
			} catch (e) {
				
				alert('К сожалению в данный момент свежий номер не доступен, попробуйте через некоторое время!');
				clearInterval(loadingProgress);
				isLoading = false;
				$('.mobile_main_screen_loading').hide(300);
			
			}
        }).fail(function () {
            alert('Для загрузки журнала необходимо активное интернет соединение...');
            clearInterval(loadingProgress);
            isLoading = false;
            $('.mobile_main_screen_loading').hide(300);
        });
    }
}

//create table and insert some record
function populateDB(txn) {
//    txn.executeSql('DROP TABLE IF EXISTS journals');
//    txn.executeSql('DROP TABLE IF EXISTS user_journals');
    txn.executeSql('CREATE TABLE IF NOT EXISTS journals (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, journal_picture TEXT, journal_id INTEGER unique, created datetime, newJournal INTEGER)');
    txn.executeSql('CREATE TABLE IF NOT EXISTS user_journals (id INTEGER PRIMARY KEY AUTOINCREMENT, content TEXT, journalId INTEGER, introtext TEXT, posttitle TEXT unique, created datetime, category TEXT, introImage TEXT, created_by_alias TEXT)');
}

//function will be called when an error occurred
function errorCB(error) {

}

function getUserJournals() {
    //USER JOURNALS 
    $('#my_journals').empty();
	
    db.transaction(function (txn) {
        var sql_data_user = 'SELECT user_journals.journalId, user_journals.content, journals.title, journals.journal_picture FROM user_journals, journals WHERE journals.journal_id = user_journals.journalId GROUP BY user_journals.journalId ORDER BY user_journals.created DESC';
        txn.executeSql(sql_data_user, [], function (txn, result) {
            if (result.rows.length > 0) {
                $('#my_journals').append('<div class="journal_archive_title">Мой архив</div>');
            }
			
			for (i = 0; i < result.rows.length; i++){
				userArchiveRows.push(result.rows.item(i));
			}
			
			
            for (var i = 0; i < result.rows.length; i++) {
                
				
				
				$('#my_journals').append('<div class="journal_block_gray" id="journal_id' + result.rows.item(i)['journalId'] + '"><div class="journal_min_title">' + result.rows.item(i)['title'] + '</div><img src="' + result.rows.item(i)['journal_picture'] + '"/><div class="save_button_journal" onclick="readCurrentJournal(' + result.rows.item(i)['journalId'] + ');">Читать</div><div class="delete_container"><div class="delbutton" onclick="deleteJournal(' + result.rows.item(i)['journalId'] + ');">Удалить</div><div class="delbutton" onclick="cancelDel(' + result.rows.item(i)['journalId'] + ');">Отмена</div></div></div>');
            }

            $(function () {
				
				$( '.journal_block_gray' ).on( "swiperight", function( event ) { 
						
					$(this).find('.delete_container').show(300);
					
				} );
				$( '.journal_block_gray' ).on( "swipeleft", function( event ) { 
						
						
					$(this).find('.delete_container').show(300);
				
				

				} );
				
				/*
                $('.journal_block_gray').swipe({
                    //Generic swipe handler for all directions
                    swipe: function (event, direction, distance, duration, fingerCount, fingerData) {
                        //alert(direction);
						
						if(direction=='right' || direction == "left"){
							
							$(this).find('.delete_container').show(300);
						
						}
						
                    },
                    //Default is 75px, set to 0 for demo so any distance triggers swipe
                    threshold: 75,
                    allowPageScroll: 'vertical'
                });
				*/
            });
        }, function (txn, error) {
            alert(error);
        });
    });
}

//function will be called when process succeed
function successCB() {

}

function hideReadJournal() {
    $('.mobile_read_content').fadeOut(300, function () {
        $('.mobile_main_content').fadeIn(300);
    });
}

function readCurrentJournal(_journalId) {
    $('.mobile_main_content').fadeOut(300, function () {
        //$('.mobile_main_screen').fadeIn(300);
    });
//    db = window.openDatabase("JournalsDB", "1.0", "Ohrgos Database", 60000); //will create database Dummy_DB or open it
//    if (!db) {
//        alert("Невозможно подключится к Базе данных...");
//    }
    $('#parse_load_result_read').empty();
    $('#new_journal_content_read').empty();

    nowOpen = 'nofull';
    var journalName = _journalId;
    db.transaction(function (txn) {
        var journal_data = 'SELECT user_journals.introtext, user_journals.content, journals.journal_picture, journals.title, user_journals.posttitle, user_journals.category FROM user_journals, journals WHERE user_journals.journalId = journals.journal_id AND user_journals.journalId = ?';

        txn.executeSql(journal_data, [journalName], function (txn, result) {
            if (result.rows.length > 0) {
                var journal_background = '';
                var journal_title = '';

                for (var i = 0; i < result.rows.length; i++) {
                    journal_background = result.rows.item(i)['journal_picture'];
                    journal_title = result.rows.item(i)['title'];
                    
                    $('#parse_load_result_read').append('<div class="j_category">' + result.rows.item(i)['category'] + '</div><div class="curr_journal_post_content" onclick="readJournalFull(' + journalName + ', ' + i + ');"><div class="post_title">' + result.rows.item(i)['posttitle'] + '</div><div class="introtext">' + result.rows.item(i)['introtext'] + '</div><div class="small_bottom"></div></div>');
                }

                $('#new_journal_content_read').append('<img src="images/arrow.png" style="position: absolute; top: 42px; left: 20px; z-index: 100;" onclick="hideReadJournal();" /><div class="new_journal_block_read" style="background-image: url(' + journal_background + ');"><div class="journal_back"><div class="journal_name_read">' + journal_title + '</div></div></div>');

                $('.mobile_main_screen').fadeOut(300, function () {
                    $('.mobile_read_content').fadeIn(300);
                });
                $(document).scrollTop(0);
            } else {
                $('.mobile_main_screen').fadeOut(300, function () {
                    $('.mobile_read_content').fadeIn(300);
                });
            }
        }, function (txn, error) {
            alert(error);
        });
    }, function (txn, error) {

    }, function () {

    });
}

function hideFullJournal() {
    $('.mobile_full_journal').fadeOut(300, function () {
        $('.mobile_read_content').fadeIn(300);
        nowOpen = 'nofull';
    });
}

var swiper = false;
var nowOpen = '';

function readJournalFull(_journal, _slide) {
    if (swiper) {
        swiper.destroy(true, true);
    }
    $('.mobile_read_content').fadeOut(300);

    $('#new_journal_content_read_full').empty();
    $('.swiper-container').empty();
    var journalName = _journal;
    var slideStart = _slide;
    nowOpen = 'full';
    db.transaction(function (txn) {
        var journal_data = 'SELECT user_journals.content, user_journals.introImage, user_journals.category, user_journals.introtext, journals.journal_picture, journals.title, user_journals.created_by_alias, user_journals.posttitle FROM user_journals, journals WHERE user_journals.journalId = journals.journal_id AND user_journals.journalId = ?';

        txn.executeSql(journal_data, [journalName], function (txn, result) {
            if (result.rows.length > 0) {
                var journal_background = '';
                var journal_title = '';

                $('.swiper-container').append('<div class="swiper-wrapper"></div><div class="swiper-pagination"></div>');

                for (var i = 0; i < result.rows.length; i++) {
                    journal_background = result.rows.item(i)['journal_picture'];
                    journal_title = result.rows.item(i)['title'];

                    $('.swiper-wrapper').append('<div class="swiper-slide">  <img class="intro_image" src="' + result.rows.item(i)['introImage'] + '"/> <div class="category_title">' + result.rows.item(i)['category'] + '<div class="blackLineBottom"></div></div>   <div class="post_title centered_nax">' + result.rows.item(i)['posttitle'] + '<br/><br/><p class="rstp">' + result.rows.item(i)['created_by_alias'] + '<p><div class="grayLineBottom"></div></div><div class="intro_full">' + result.rows.item(i)['introtext'] + '<div class="blackLineBottom"></div></div><div class="fulltext">' + (result.rows.item(i)['content']) + '</div><div class="small_bottom"></div></div>');
                }

                $('#new_journal_content_read_full').append('<img src="images/arrow.png" style="position: absolute; top: 42px; left: 20px; z-index: 100;" id="back_to_list" onclick="hideFullJournal();" /><div class="new_journal_block_read" style="background-image: url(' + journal_background + ');"><div class="journal_back"><div class="journal_name_read">' + journal_title + '</div></div></div>');

                $('.mobile_main_screen').fadeOut(300, function () {
                    setTimeout(function () {
                        swiper = new Swiper('.swiper-container', {
							
                            pagination: '.swiper-pagination',
                            paginationType: 'progress',
                            autoHeight: true,
                            spaceBetween: 100,
                            initialSlide: slideStart,
                            onInit: function () {},
							onSlideChangeStart: function (s) {
								
								$('html,body').animate({scrollTop: 0}, 500);
								
								
								
							  }
                        });
												
						
						
						
                    }, 1000);
                    $(document).scrollTop(0);
                    $('.mobile_full_journal').fadeIn(300);
                    $('.swiper-container').fadeIn(300);
                });
            } else {
                $('.mobile_main_screen').fadeOut(300, function () {
                    $('.mobile_full_journal').fadeIn(300);
                });
            }
        }, function (txn, error) {
            console.log(error.message);
        });
    }, function (txn, error) {
        console.log(error.message);
    }, function () {

    });
}
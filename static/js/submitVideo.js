$('#submit-btn').on('click', () => {

    // parse the videoId from the videoUrl and validate
    const url_split = $('#YTurl').val().split('?v=');

    if (url_split.length >= 2 && url_split[1].length === 11) {
      // valid videoId submitted
      const videoId = url_split[1];
      console.log('tested')
      $.ajax({
         url: '/api/comments?videoId=' + videoId,
         method: 'GET',
         beforeSend: function() { $('#alert-box').html('') },
         success: function(response) {
           $('#alert-box').html(
             '<div class="alert alert-success">' +
             '<strong>Success!</strong> Please wait while we download and analyze your comments.' +
             '</div>'
           );
//           const data = $.parseJSON(response);
//           waitForWatsonUploads(data.results.environment_id, data.results.collection_id);
         },
         error: function() {
           $('#alert-box').html(
             '<div class="alert alert-danger">' +
             '<strong>Error!</strong> We are having trouble getting comments for that video URL.' +
             '</div>'
           )
         }
      });

    } else {
      // invalid videoId
      $('#alert-box').html(
        '<div class="alert alert-danger">' +
        '<strong>Invalid URL!</strong> Please copy and paste a video URL from your web browser.' +
        '</div>'
      )
    }
    return false;
});

//  function waitForWatsonUploads(env_id, col_id) {
//
//    // wait 10 seconds each check
//    sleep(10000)
//    let count = -1;
//    let new_count = 0;
//
//    while ( count !== new_count ) {
//      $.ajax({
//        url: '/api/upload_status?environment_id=' + env_id + '&collection_id=' + col_id,
//        method: 'GET',
//        beforeSend: function() { },
//        success: function(response) {
//          console.log(response);
//        },
//      })
//      new_count = -1;
//    }
//
//
// function sleep(milliseconds) {
//   var start = new Date().getTime();
//   for (var i = 0; i < 1e7; i++) {
//     if ((new Date().getTime() - start) > milliseconds){
//       break;
//     }
//   }
// }

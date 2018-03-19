$('#submit-btn').on('click', () => {

    // parse the videoId from the videoUrl and validate
    const url_split = $('#YTurl').val().split('?v=');

    if (url_split.length >= 2 && url_split[1].length === 11) {
      // valid videoId submitted

      $('#alert-box').html(
        '<div class="alert alert-secondary">' +
        'Attempting to find your YouTube video.' +
        '</div>'
      );


      const videoId = url_split[1];
      console.log('tested')
      $.ajax({
         url: '/api/comments?videoId=' + videoId,
         method: 'GET',
         beforeSend: function() {
           $('#alert-box').html('');
           $('#YTurl').prop('disabled', true);
         },
         success: function(response) {
           $('#alert-box').html(
             '<div class="alert alert-success">' +
             '<strong>Success!</strong> Please wait while we download and analyze your comments.' +
             '</div>'
           );
           waitForWatsonUploads(response.results.environment_id, response.results.collection_id, response.results.total_comments);
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

function waitForWatsonUploads(env_id, col_id, total_comments, last_count=-1) {

   console.log('waiting for watson')
   let new_count;
   let is_done = false;
   $.ajax({
     url: '/api/upload_status?environment_id=' + env_id + '&collection_id=' + col_id,
     method: 'GET',
     beforeSend: function() { },
     success: function(response) {
       $('#progress-box').html('')
       $('#progress-box').html(
         '<div class="progress">' +
           '<div class="progress-bar bg-danger progress-bar-striped progress-bar-animated" role="progressbar" aria-valuenow="' + response.results + '" aria-valuemin="0" aria-valuemax="'+ total_comments +'" style="width: '+ Math.round(response.results*100 / total_comments)  +'%"></div>' +
         '</div>'
       )
       if (last_count === response.results)
          is_done = true;

       else
          new_count = response.results
      }
    }).then( () => {
        if (is_done) {
          // IT IS DONE
          console.log('its done')
          $('#progress-box').html('')
          $('#progress-box').html(
            '<div class="progress">' +
              '<div class="progress-bar bg-danger progress-bar-striped progress-bar-animated" role="progressbar" aria-valuenow="' + response.results + '" aria-valuemin="0" aria-valuemax="'+ total_comments +'" style="width: '+ Math.round(response.results*100 / total_comments)  +'%"></div>' +
            '</div>'
          )
        } else {
          setTimeout( function() {
            waitForWatsonUploads(env_id, col_id, total_comments, new_count)
          }, 10000)
        }
    })

}

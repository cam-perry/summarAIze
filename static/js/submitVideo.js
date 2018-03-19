$('#submit-btn').on('click', () => {

    // parse the videoId from the videoUrl and validate
    const url_split = $('#YTurl').val().split('?v=');

    if (url_split.length >= 2 && url_split[1].length === 11) {
      // valid videoId submitted

      $('#alert-box').html(
        '<div class="alert alert-info">' +
        'Attempting to find your YouTube video.' +
        '</div>'
      );

      const videoId = url_split[1];

      // first pull the summary data about the video
      $.ajax({
        url: '/api/video?videoId=' + videoId,
        method: 'GET',
        success: function(response) {

          const total_comments = response.results.items[0].statistics.commentCount;

          // display success message and create progress bar
          $('#alert-box').html('')
          $('#alert-box').html(
            '<div class="alert alert-success">' +
            '<strong>Success!</strong> Fetching and analzying ' + total_comments + ' comments.' +
            '</div>'
          );
          $('#progress-box').html('')
          $('#progress-box').html(
            '<div class="progress">' +
              '<div class="progress-bar bg-danger progress-bar-striped progress-bar-animated" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="'+ total_comments +'" style="width: 0%"></div>' +
            '</div>'
          );

          // after confirming video, start the comment processing
          $.ajax({
             url: '/api/comments?videoId=' + videoId,
             method: 'GET',
             beforeSend: function() {
               $('#YTurl').prop('disabled', true);
             },
             success: function(response) {
               waitForWatsonUploads(response.results.environment_id, response.results.collection_id, total_comments);
             },
             error: function() {
               $('#alert-box').html('')
               $('#alert-box').html(
                 '<div class="alert alert-danger">' +
                 '<strong>Error!</strong> We are having trouble getting comments for that video URL.' +
                 '</div>'
               )
             }
          });
        }
      })

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


// this function runs a loop until the comments are all uploaded (can track failures and processing)
// responsible for updating progress bar as it goes, and triggering analytics in backend when complete
function waitForWatsonUploads(env_id, col_id, total_comments) {


   let new_count;
   let is_done = false;

   console.log('new_run')

   $.ajax({
     url: '/api/upload_status?environment_id=' + env_id + '&collection_id=' + col_id,
     method: 'GET',
     beforeSend: function() { },
     success: function(response) {
       $('#progress-box').html('')
       $('#progress-box').html(
         '<div class="progress">' +
           '<div class="progress-bar bg-danger progress-bar-striped progress-bar-animated" role="progressbar" aria-valuenow="' + response.results.available + '" aria-valuemin="0" aria-valuemax="'+ total_comments +'" style="width: '+ Math.round(response.results*100 / total_comments)  +'%"></div>' +
         '</div>'
       )

       if (response.results.available + response.results.failed === total_comments)
          is_done = true;
       else
          new_count = response.results.available
      }
    }).then( () => {
        if (is_done) {
          // complete the function if total response count is reached
          console.log('is_done')
          $('#alert-box').html('')
          $('#alert-box').html(
            '<div class="alert alert-success">' +
            '<strong>All done!</strong> We are preparing your analytics.' +
            '</div>'
          );
          $('#progress-box').html('')
          $('#progress-box').html(
            '<div class="progress">' +
              '<div class="progress-bar bg-danger progress-bar-striped progress-bar-animated" role="progressbar" aria-valuenow="1" aria-valuemin="1" aria-valuemax="1" style="width: 100%"></div>' +
            '</div>'
          )
          // AJAX CALL TO KATIE's BACKEND FUNCTIONS GO HERE

        } else {
          // if not done, keep checking every 2 seconds
          setTimeout( function() {
            waitForWatsonUploads(env_id, col_id, total_comments)
          }, 2000)
        }
    })

}

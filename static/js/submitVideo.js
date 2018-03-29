$('#cards-container').on('click', '.video-selector', (evt) => {
      console.log(evt)
      $('#alert-box').html('')
      $('#alert-box').html(
        '<div class="alert alert-info">' +
        'Gathering comments for video ' + evt.target.id +
        '</div>'
      );

      const videoId = evt.target.id;

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
               waitForWatsonUploads(response.results.environment_id, response.results.collection_id, total_comments, videoId);
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

    return false;
});


// this function runs a loop until the comments are all uploaded (can track failures and processing)
// responsible for updating progress bar as it goes, and triggering analytics in backend when complete
function waitForWatsonUploads(env_id, col_id, total_comments, videoId) {


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
           '<div class="progress-bar bg-danger progress-bar-striped progress-bar-animated" role="progressbar" aria-valuenow="' + response.results.available + '" aria-valuemin="0" aria-valuemax="'+ total_comments +'" style="width: '+ Math.round(response.results.available*100 / total_comments)  +'%"></div>' +
         '</div>'
       )
       console.log(response.results)
       if (response.results.processing === 0)
          is_done = true;
       else
          new_count = response.results.available
      }
    }).then( () => {
        if (is_done) {
          // complete the function if total response count is reached
          $('#alert-box').html('')
          $('#alert-box').html(
            '<div class="alert alert-success">' +
            '<strong>All done!</strong> We are preparing your analytics.' +
            '</div>'
          );
          $('#progress-box').html('')

          window.location.href = "/analyze.html?video=" + videoId

          /*$.ajax({
     url: '/api/analyze',
     method: 'GET',
     beforeSend: function() { },
     success: function(response) {
       console.log(response.results);
    },
              error: function(error){
          }
    })*/

        } else {
          // if not done, keep checking every 2 seconds
          setTimeout( function() {
            waitForWatsonUploads(env_id, col_id, total_comments, videoId)
          }, 2000)
        }
    })

}

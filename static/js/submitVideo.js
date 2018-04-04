import adminEmail from '../config.js';

// makes it so that you can press enter to submit the channel button
$(document).ready(function() {
  $(window).keydown(function(event){
    if(event.keyCode == 13) {
      event.preventDefault();
      $('#channel-submit-btn').click();
      return false;
    }
  });
});


$('#cards-container').on('click', '.video-selector', (evt) => {

      // disable the other buttons
      $('.video-selector').addClass('disabled');
      $('#channel-submit-btn').addClass('disabled');

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
        beforeSend: function() {
          window.location.href = "/#"
        },
        success: function(response) {
          // store this globally for testing on analyze page
          var VIDEO = response.results.items[0];
          const total_comments = response.results.items[0].statistics.commentCount;

          if (total_comments > 500) {
              // prevent over 500 comments from being analyzed
              $('.video-selector').removeClass('disabled');
              $('#channel-submit-btn').removeClass('disabled');
              $('#alert-box').html('')
              $('#alert-box').html(
                '<div class="alert alert-warning">' +
                  'Looks like you have a lot of comments. Contact ' + adminEmail + ' to request Premium access and analyze over 500 comments.' +
                '</div>'
              );
          } else {
            // display success message and create progress bar
            $('#alert-box').html('')
            $('#alert-box').html(
              '<div class="alert alert-success">' +
              '<strong>Success!</strong> Fetching and analyzing ' + total_comments + ' comments.' +
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
            }) // end second AJAX
          } // end else
        } // end first AJAX success
      }) // end first AJAX

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

          // push over to the analyze page
          window.location.href = "/analyze?video=" + videoId

        } else {
          // if not done, keep checking every 2 seconds
          setTimeout( function() {
            waitForWatsonUploads(env_id, col_id, total_comments, videoId)
          }, 2000)
        }
    })

}

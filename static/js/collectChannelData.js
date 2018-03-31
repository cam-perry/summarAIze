$('#channel-submit-btn').on('click', () => {

    // parse the videoId from the videoUrl and validate
    const channel = $('#channel-input').val()

    $('#alert-box').html(
      '<div class="alert alert-success">' +
      'Which video should we summarAIze?' +
      '</div>'
    );

    // fetch the channel's videos
    $.ajax({
      url: '/api/channel?channelId=' + channel,
      method: 'GET',
      success: function(response) {
        const videos = response.results;
        let cards = '';
        // catch channel-finding errors handled in the backend and display error messaged
        if (['error: no channel', 'error: multiple channels'].includes(videos)) {
          $('#alert-box').html(
            '<div class="alert alert-danger">' +
            '<strong>Sorry...</strong> we couldn\'t find a YouTube user by that name.' +
            '</div>'
          );
        } else {
          videos.forEach( video => {
            const videoId = video.snippet.resourceId.videoId;
            cards += (
              '<div class="card">' +
                '<img class="card-img-top" src="' + video.snippet.thumbnails.high.url + '" alt="Card image cap">' +
                '<div class="card-body">' +
                  '<h5 class="card-title"><a target="_blank" href="https://youtube.com/watch/?v=' + videoId + '">' + video.snippet.title + '</a></h5>' +
                  '<p class="card-text">' + video.snippet.description + '</p>' +
                  '<a href="#" class="btn btn-danger video-selector" id="' + videoId + '">summarAIze</a>' +
                '</div>' +
              '</div>'
            )
          })
          $('#cards-container').html('')
          $('#cards-container').html(cards)
        }
      }
    });
});

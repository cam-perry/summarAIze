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
        videos.forEach( video => {
          cards += (
            '<div class="card">' +
              '<img class="card-img-top" src="' + video.snippet.thumbnails.high.url + '" alt="Card image cap">' +
              '<div class="card-body">' +
                '<h5 class="card-title">' + video.snippet.title + '</h5>' +
                '<p class="card-text">' + video.snippet.description + '</p>' +
                '<a href="#" class="btn btn-danger">summarAIze</a>' +
              '</div>' +
            '</div>'
          )
        })
        $('#cards-container').html('')
        $('#cards-container').html(cards)
      }
    });
});

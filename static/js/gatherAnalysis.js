$.ajax({
  url: '/api/analyze',
  method: 'GET',
  success: function(response) {
    console.log(response.results);
  },
  error: function(error) {
    console.log(error);
  }
})

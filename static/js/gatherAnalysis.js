$.ajax({
  url: '/api/analyze',
  method: 'GET',
  success: function(response) {
    console.log(response.results);
    displayEntities(response.results.entitiesResults)
  },
  error: function(error) {
    console.log(error);
  }
})

function displayEntities(entities) {
  const sorted_entities = sortEntities(entities);
  let max = sorted_entities.length < 10 ? sorted_entities.length : 10;
  let insert = '';
  console.log(sorted_entities);
  for (let i=0; i < max; i++) {
    const li_class = sorted_entities[i].score < 0 ? 'list-group-item-danger' : 'list-group-item-success';
    const {title, count, score} = sorted_entities[i];
      insert += (
        '<button data-container="body" data-toggle="popover" data-trigger="focus" data-placement="top" ' +
              'data-title="Sentiment: ' + parseFloat(score).toFixed(2) + '" ' +
              'data-content="0 represents a neutral sentiment."' +
              'class="list-group-item list-group-item-action ' + li_class + '">' +
        '<p><strong>' + title + '</strong></p>' +
        '<p>' + count + (count === 1 ? ' mention' : ' mentions') + '</p>' +
        '</button>'
      )
  }
  $('#top-entities').html(insert);
  // initialize the popovers
  $(function () {
    $('[data-toggle="popover"]').popover()
  })
}

function sortEntities(entities) {
  let entities_array = [];
  Object.keys(entities).forEach( function(entity){
    entities_array.push({
      title: entity,
      count: entities[entity].count,
      score: entities[entity].score
    });
  });
  let swapped;
  do {
    swapped = false;
    for (let i=0; i < entities_array.length-1; i++) {
      if (entities_array[i].count < entities_array[i+1].count) {
        var temp = entities_array[i];
        entities_array[i] = entities_array[i+1];
        entities_array[i+1] = temp;
        swapped = true;
      }
    }
  } while (swapped);
  return entities_array;
}

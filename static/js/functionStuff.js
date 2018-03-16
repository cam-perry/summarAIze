

function attachHandlers(){
    /*trial();*/
    /*displayTopEnt();*/
    /*colourChg();*/
}
window.onload = function(){
    var items = {"Entity 1": 0.5, "Entity 2": 1, "Entity 3": 0};
    var finalList = "<ol>";
    for(var index in items) {
        finalList += "<li>" +index + " (" + items[index] + ")</li>";
        }
    finalList += "</ol>";
    document.getElementById("displayList").innerHTML = finalList;
    
    
    var comments = {"Comment 1": 88, "Comment 2": 50, "Comment 3": 20};
    var finalTable = "<table> <thead><tr><th>Representative Comment</th><th>% of Comments</th></tr></thead> <tbody>";
    for(var index2 in comments) {
        finalTable += "<tr> <td>" +index2 + "</td> <td>" + comments[index2] + "%</td></tr>";
        }
    finalTable += "</tbody></table>";
    document.getElementById("displayTable").innerHTML = finalTable;
    
}

function colourChg(){

}

/*window.onload = displayTopEnt();*/


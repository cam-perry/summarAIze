

function attachHandlers(){
    /*trial();*/
    displayTopEnt();
    /*colourChg();*/
    

}

function trial(){
    var items = {"Entity 1": 0.5, "Entity 2": 1, "Entity 3": 0};
    document.write("<ul>")
    for(var index in items) {
        document.write("<li>" +index + " (" + items[index] + ")</li>");
        }
    document.write("</ul>")
}

window.onload = function(){
    var items = {"Entity 1": 0.5, "Entity 2": 1, "Entity 3": 0};
    var endList = "<ol>";
    for(var index in items) {
        endList += "<li>" +index + " (" + items[index] + ")</li>";
        }
    endList += "</ol>";
    document.getElementById("displayTable").innerHTML = endList;
}

function colourChg(){

}

/*window.onload = displayTopEnt();*/


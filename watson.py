import json
import nltk

from config import discovery

# Deletes existing collection and creates new collection for current video being analyzed
def setUpCollection(videoId, app):
    with app.app_context():
        environments = discovery.list_environments()
        # Gets environment ID
        environment_id = environments["environments"][1]["environment_id"]
        configs = discovery.list_configurations(environment_id)
        config_id = configs["configurations"][0]["configuration_id"]

        # Delete existing collection
        collections = discovery.list_collections(environment_id)
        try:
            collection_id = collections["collections"][1]["collection_id"]
            delete_collection = discovery.delete_collection(environment_id, collection_id)
        except Exception:
            print('Only had one collection')

        # Create new collection
        new_collection = discovery.create_collection(environment_id=environment_id, name=videoId)
        collection_id = new_collection["collection_id"]

        # Record environment_id, collection_id
        file = open("id.txt","w")
        file.write(environment_id)
        file.write('\n')
        file.write(collection_id)
        file.close()

        return environment_id, collection_id

def uploadDocsToWatson(comments, environment_id, collection_id):
    for comment in comments:
        # add the file to discovery
        while True:
            try:
                discovery.add_document(environment_id, collection_id, file=json.dumps(comment),
                                                file_content_type='application/json', filename=comment['Cid'])
                break
            except Exception:
                print('Overflow on Watson write')

def checkUploadCount(environment_id, collection_id):
    # Gets collection info
    collection = discovery.get_collection(environment_id=environment_id, collection_id=collection_id)
    # return the number of available documents

    return collection['document_counts']


def performAnalysis():
    file = open('id.txt','r')
    e_id = file.readline().strip()
    c_id = file.readline().strip()
    file.close()
    my_query = discovery.query(environment_id=e_id, collection_id=c_id, query='', count=9999)

    # Finds entities and how many times they are mentioned
    entitiesDict = {}
    sentiments = {'-1.0to-0.75':0,'-0.75to-0.50':0,'-0.50to-0.25':0,'-0.25to0.00':0,'0.00to0.25':0,'0.25to0.50':0,'0.50to0.75':0, '0.75to1.00':0}
    commentSummary1Dict = {}
    commentSummary2Dict = {}
    commentSummary3Dict = {}
    totalComments = 0

    #Loop and fill dictionaries
    for comment in my_query["results"]:
        totalComments += 1

        #for sentiment graph
        sentiment = comment["enriched_text"]["sentiment"]["document"]["score"]
        if sentiment >= -1 and sentiment < -0.75:
            sentiments['-1.0to-0.75'] += 1
        elif sentiment >= -0.75 and sentiment < -0.5:
            sentiments['-0.75to-0.50'] += 1
        elif sentiment >= -0.5 and sentiment < -0.25:
            sentiments['-0.50to-0.25'] += 1
        elif sentiment >= -0.25 and sentiment < 0:
            sentiments['-0.25to0.00'] += 1
        elif sentiment >= 0 and sentiment < 0.25:
            sentiments['0.00to0.25'] += 1
        elif sentiment >= 0.25 and sentiment < 0.5:
            sentiments['0.25to0.50'] += 1
        elif sentiment >= 0.5 and sentiment < 0.75:
            sentiments['0.50to0.75'] += 1
        elif sentiment >= 0.75 and sentiment < 1:
            sentiments['0.75to1.00'] += 1

        # for top mentioned entities
        entities = comment["enriched_text"]["entities"]
        if entities != []:
            for entity in entities:
                entityName = entity["text"]
                if entityName not in entitiesDict:
                    entitiesDict[entityName] = {'score':[comment["enriched_text"]["sentiment"]["document"]["score"]],'count':1}
                else:
                    entitiesDict[entityName]["score"].append(comment["enriched_text"]["sentiment"]["document"]["score"])
                    entitiesDict[entityName]["count"] += 1

        # comment summary method 1 - not great
        entitiesList = ""
        for entity in comment["enriched_text"]["entities"]:
            entitiesList += entity["text"] + ", "
        if sentiment > 0:
            entitiesList += str(1)
        elif sentiment < 0:
            entitiesList += str(-1)
        else:
            entitiesList += str(0)

        if entitiesList not in commentSummary1Dict:
            # list that tracks similar comments
            comments = []
            comments.append(comment["text"])
            commentSummary1Dict[entitiesList] = [comments,1]
        else:
            commentSummary1Dict[entitiesList][0].append(comment["text"])
            commentSummary1Dict[entitiesList][1] += 1

        # comment summary method 2 - a bit better
        theComment = comment["text"].lower()
        try:
            tokens = nltk.word_tokenize(theComment)
            tagged = nltk.pos_tag(tokens)
        except Exception as error:
            tagged = []

        wordList = []
        for word in tagged:
            if word[1][0] == "N" and len(word[0]) > 1 and word[0] not in wordList:  #make sure we don't double count same word multiple times in one comment
                noun = word[0]
                wordList.append(noun)
                if sentiment > 0:
                    noun += str(1)
                elif sentiment < 0:
                    noun += str(-1)
                else:
                    noun += str(0)
                if noun not in commentSummary2Dict:
                    comments = []
                    comments.append(theComment)
                    commentSummary2Dict[noun] = [comments,1]
                else:
                    commentSummary2Dict[noun][0].append(theComment)
                    commentSummary2Dict[noun][1] += 1


    # turn sentiments into percentages
    for key in sentiments:
        sentiments[key] = sentiments[key]/totalComments * 100
    for key in entitiesDict:
        lengthOfList = len(entitiesDict[key])
        entitiesDict[key]["score"] = sum(entitiesDict[key]["score"])/lengthOfList
    newDict = {}
    newDict["entitiesResults"] = entitiesDict
    newDict["sentimentsResults"] = sentiments

    testList = []
    for k in commentSummary2Dict:
        testList.append((commentSummary2Dict[k][0],k,commentSummary2Dict[k][1]))
    sortedList = sorted(testList, key=lambda tup: tup[2])
    newDict["commentResults"] = sortedList
    return newDict

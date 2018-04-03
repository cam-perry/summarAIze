# Copyright 2015 IBM Corp. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import nltk
import os
from flask import Flask, jsonify, request

from youtube import getTopLevelComments
from youtube import getReplies
from youtube import getVideoData
from youtube import getUploadsId
from youtube import getVideosFromPlaylist

from watson import setUpCollection
from watson import checkUploadCount
from watson_developer_cloud import DiscoveryV1

discovery = DiscoveryV1(
    username="45063df0-4434-4245-a465-752ac7d12514",
    password="UXbZKDFdIyWh",
    version="2018-03-07"
)

app = Flask(__name__)

@app.route('/')
def Welcome():
    return app.send_static_file('index.html')

@app.route('/analyze')
def Analysis():
    return app.send_static_file('analyze.html')


@app.route('/api/channel')
def getVideos():
    uploadsId = getUploadsId(request.args.get('channelId'))
    if uploadsId in ['error: no channel', 'error: multiple channels']:
        return jsonify(results=uploadsId)
    else:
        return jsonify(results=getVideosFromPlaylist(uploadsId))

@app.route('/api/analyze')
def Analyze():
    file = open('id.txt','r')
    e_id = file.readline().strip()
    c_id = file.readline().strip()
    file.close()
    my_query = discovery.query(environment_id=e_id, collection_id=c_id, query='', count=9999)
    #print(my_query)
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
            #print(entitiesList)
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
        tokens = nltk.word_tokenize(theComment)
        tagged = nltk.pos_tag(tokens)
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

    return jsonify(results=newDict)


## To fetch summary data about a YouTube video on initial submit
@app.route('/api/video')
def GetVideoSummary():
    data = getVideoData(request.args.get('videoId'))
    return jsonify(results=data)

## To fetch all comments for a given YouTube video
## GET /api/comments?videoId=<ENTER_VIDEO_ID_HERE>
@app.route('/api/comments')
def GetCommentsForVideo():
    # parse video ID from the request query string
    videoId = request.args.get('videoId')

    # remove existing the collection on Watson, and create a new one with this videoId
    (environment_id, collection_id) = setUpCollection(videoId, app)

    # fetch the top level comments
    comments = getTopLevelComments(videoId, environment_id, collection_id)

    # use top level comments to get replies
    replies_tall = [getReplies(comment['Cid'], videoId, environment_id, collection_id) for comment in comments if comment['replies'] > 0]

    # return all comments and replies
    return_val = {
        'environment_id': environment_id,
        'collection_id': collection_id,
        'status': 'success'
    }

    return jsonify(results=return_val)



@app.route('/api/upload_status')
def checkUploadStatus():
    # get and return the current document count uploaded
    environment_id = request.args.get('environment_id')
    collection_id = request.args.get('collection_id')
    results = checkUploadCount(environment_id, collection_id)
    return jsonify(results=results)

port = os.getenv('PORT', '5000')
if __name__ == "__main__":
	app.run(host='0.0.0.0', port=int(port))

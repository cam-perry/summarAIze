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

import os
from flask import Flask, jsonify, request
import requests
import sys
import json
from watson_developer_cloud import DiscoveryV1

from youtube import getTopLevelComments
from youtube import getReplies

discovery = DiscoveryV1(
  username="333e8f48-6029-4375-a553-4db2cc467f46",
  password="ykJmpPHlGMnW",
  version="2018-03-07"
)

##resultsJSON = {             #example for testing
##  "results": [
##    {
##      "author_channel": "http://www.youtube.com/channel/UCyNTDMdk-plBFVwm6unKcQw",
##      "author_name": "KnightCrown",
##      "id": "UgxlMYi_wXGEaU1PIB14AaABAg",
##      "replies": 0,
##      "text": "Shame. The voice acting was absolutely stellar and definitely adds alot to the experience",
##      "type": "top-level"
##    },
##    {
##      "author_channel": "http://www.youtube.com/channel/UC-PQf-3OwTRXoJMo684bIdg",
##      "author_name": "Kristina Thuduwage",
##      "id": "Ugz-KOPvxmHVtZdWxRR4AaABAg",
##      "replies": 2,
##      "text": "so what was the name of the song from the game?",
##      "type": "top-level"
##    },
##    {
##      "author_channel": "http://www.youtube.com/channel/UCs-NmivxOfqiGkltRI6pygA",
##      "author_name": "\u10d2\u10d8\u10dd\u10e0\u10d2\u10d8",
##      "id": "UgwB9hbiPBGWJnvjqy94AaABAg",
##      "replies": 0,
##      "text": "actually there is unofficial version of it, with ps3 sprites, voices and etc, it's still work in progress. The best part is, it's legal because the author put it through a password wall and you need ps3 version and pc version to get it. look up \"Umineko Project\". I'm still waiting for them to finish the rest before playing.",
##      "type": "top-level"
##    }
##  ]
##}
##videoId = '23VP_mwwvxw'         # example for testing

#Deletes existing collection and creates new collection for current video being analyzed
def setUpCollection(videoId):
    with app.app_context():
        videoId = '23VP_mwwvxw'
        environments = discovery.list_environments()
        # Gets environment ID
        environment_id = environments["environments"][1]["environment_id"]
        configs = discovery.list_configurations(environment_id)
        config_id = configs["configurations"][0]["configuration_id"]

        # Delete existing collection
        collections = discovery.list_collections(environment_id)
        collection_id=collections["collections"][1]["collection_id"]
        delete_collection = discovery.delete_collection(environment_id, collection_id)

        # Create new collection
        new_collection = discovery.create_collection(environment_id=environment_id,name=videoId)
        collection_id=new_collection["collection_id"]

#Adds documents in videoId folder to collection and deletes them
def addToCollection(environment_id, collection_id, videoId):
    path = os.getcwd()+"/data/"+videoId+"/"
    # Looping through files in videoId folder and uploading all of them
    for filename in os.listdir(path):
        with open(path + filename) as fileinfo:
            add_doc = discovery.add_document(environment_id, collection_id, file=fileinfo)
    # Deleting the files after upload
    for filename in os.listdir(path):
        print(path + filename)
        os.remove(path + filename)
        
# Creates .html files, one per comment, in the data/videoId folder
def createHTMLFiles(videoId, resultsJSON):
    for i in range(0,len(resultsJSON["results"])):
        if not os.path.exists("data/"+videoId):            #create a new directory with the video id if it doesn't already exist
            os.makedirs("data/"+videoId)
        comment_id = resultsJSON["results"][i]["id"]
        Html_file= open("data/"+videoId+"/"+comment_id+".html","w")
        Html_file.write(str(json.dumps(resultsJSON["results"][i])))
        Html_file.close

app = Flask(__name__)

@app.route('/')
def Welcome():
    return app.send_static_file('index.html')

## To fetch all comments for a given YouTube video
## GET /api/comments?videoId=<ENTER_VIDEO_ID_HERE>
@app.route('/api/comments')
def GetCommentsForVideo():
    # parse video ID from the request query string
    videoId = request.args.get('videoId')
    # fetch the top level comments
    comments = getTopLevelComments(videoId)

    # use top level comments to get replies
    replies_tall = [getReplies(comment['id']) for comment in comments if comment['replies'] > 0]

    # flatten out replies from a list of lists to a single list
    replies_flat = [reply for reply_list in replies_tall for reply in reply_list]

    # creates HTML files in data folder to be uploaded into Watson Discovery                                <--- Change this!
    resultsJSON = jsonify(results=(comments + replies_flat))
    createHTMLFiles(videoId, resultsJSON)

    # return all comments and replies
    return resultsJSON

@app.route('/api/people')
def GetPeople():
    list = [
        {'name': 'John', 'age': 28},
        {'name': 'Bill', 'val': 26}
    ]
    return jsonify(results=list)

@app.route('/api/people/<name>')
def SayHello(name):
    message = {
        'message': 'Hello ' + name
    }
    return jsonify(results=message)

port = os.getenv('PORT', '5000')
if __name__ == "__main__":
	app.run(host='0.0.0.0', port=int(port))

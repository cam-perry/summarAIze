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

from youtube import getTopLevelComments
from youtube import getReplies

from watson import setUpCollection


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

    # remove existing the collection on Watson, and create a new one with this videoId
    (environment_id, collection_id) = setUpCollection(videoId, app)

    # fetch the top level comments
    comments = getTopLevelComments(videoId, environment_id, collection_id)

    # use top level comments to get replies
    replies_tall = [getReplies(comment['Cid'], videoId, environment_id, collection_id) for comment in comments if comment['replies'] > 0]

    # return all comments and replies
    return jsonify(result='success')

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

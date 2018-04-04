
import nltk
import os
from flask import Flask, jsonify, request

from youtube import getTopLevelComments, getReplies, getVideoData, getUploadsId, getVideosFromPlaylist
from watson import setUpCollection, checkUploadCount, performAnalysis

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

## Pulls Natural language analysis from watson discovery and returns data
## use for the bar chart, entity list, and comment summary tables
@app.route('/api/analyze')
def Analyze():
    results = performAnalysis()
    return jsonify(results=results)

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

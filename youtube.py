
import requests
import threading
import time
from watson import uploadDocsToWatson
from config import youtubeKey

# find's a channel by owner's YouTube username
# returns the ID of the uploads playlist
def getUploadsId(channel_name):
    base_url = 'https://www.googleapis.com/youtube/v3/channels?part=contentDetails&key=' + youtubeKey + '&forUsername='
    base_url += channel_name
    print(base_url)
    res = requests.get(base_url).json()

    if len(res['items']) == 0:
        return 'error: no channel'
    elif len(res['items']) > 1:
        return 'error: multiple channels'
    else:
        return res['items'][0]['contentDetails']['relatedPlaylists']['uploads']

# pulls all videos from a playlist by id
# returns an array of these video objects
def getVideosFromPlaylist(playlistId):
    url = 'https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=6&key=' + youtubeKey + '&playlistId='
    url += playlistId
    res = requests.get(url).json()
    return res['items']

def getVideoData(videoId):
    base_url = 'https://www.googleapis.com/youtube/v3/videos?part=statistics&key=' + youtubeKey + '&id='
    res = requests.get(base_url + videoId)
    return res.json()

## recursive function to collect all top level comments on a video
## call with the video's ID as videoId
def getTopLevelComments(videoId, environment_id, collection_id, nextPageToken=''):
    base_url = 'https://www.googleapis.com/youtube/v3/commentThreads?maxResults=100&part=snippet&key=' + youtubeKey + '&videoId='
    base_url += videoId
    query = base_url if nextPageToken == '' else base_url + '&pageToken=' + nextPageToken
    res = requests.get(query)

    clean_comments = [{'type': 'top-level',
                       'text': comment['snippet']['topLevelComment']['snippet']['textOriginal'],
                       'author_name': comment['snippet']['topLevelComment']['snippet']['authorDisplayName'],
                       'author_channel': comment['snippet']['topLevelComment']['snippet']['authorChannelUrl'],
                       'Cid': comment['id'],
                       'replies': comment['snippet']['totalReplyCount']
                       } for comment in res.json()['items']]

    t = threading.Thread(target=uploadDocsToWatson, args=(clean_comments, environment_id, collection_id))
    t.start()

    print('threaded')

    if 'nextPageToken' in res.json():
        return clean_comments + getTopLevelComments(videoId, environment_id, collection_id, res.json()['nextPageToken'])
    else:
        return clean_comments

## recursive function to collect all replies to a top level comment
## call with the top level comment's ID as parentId
def getReplies(parentId, videoId, environment_id, collection_id, nextPageToken=''):
    base_url = 'https://www.googleapis.com/youtube/v3/comments?part=snippet&key=' + youtubeKey + '&textFormat=plainText&maxResults=100&parentId='
    base_url += parentId
    query = base_url if nextPageToken == '' else base_url + '&pageToken=' + nextPageToken
    res = requests.get(query)

    clean_comments = [{'type': 'reply',
                       'text': comment['snippet']['textOriginal'],
                       'author_name': comment['snippet']['authorDisplayName'],
                       'author_channel': comment['snippet']['authorChannelUrl'],
                       'parentId': comment['snippet']['parentId'],
                       'Cid': comment['id']
                       } for comment in res.json()['items']]

    ## create new thread to handle publishing results to Watson
    t = threading.Thread(target=uploadDocsToWatson, args=(clean_comments, environment_id, collection_id))
    t.start()

    if 'nextPageToken' in res.json():
        return clean_comments + getReplies(parentId, videoId, environment_id, collection_id, res.json()['nextPageToken'])
    else:
        return clean_comments

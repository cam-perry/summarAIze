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

import requests

## recursive function to collect all top level comments on a video
## call with the video's ID as videoId
def getTopLevelComments(videoId, nextPageToken=''):
    base_url = 'https://www.googleapis.com/youtube/v3/commentThreads?maxResults=100&part=snippet&key=AIzaSyCRJexp3hVDSOkrZJbGX7HdrY55HVFK8Rw&videoId='
    base_url += videoId
    query = base_url if nextPageToken == '' else base_url + '&pageToken=' + nextPageToken
    res = requests.get(query)

    clean_comments = [{'type': 'top-level',
                       'text': comment['snippet']['topLevelComment']['snippet']['textOriginal'],
                       'author_name': comment['snippet']['topLevelComment']['snippet']['authorDisplayName'],
                       'author_channel': comment['snippet']['topLevelComment']['snippet']['authorChannelUrl'],
                       'id': comment['id'],
                       'replies': comment['snippet']['totalReplyCount']
                       } for comment in res.json()['items']]

    if 'nextPageToken' in res.json():
        return clean_comments + getTopLevelComments(videoId, res.json()['nextPageToken'])
    else:
        return clean_comments

## recursive function to collect all replies to a top level comment
## call with the top level comment's ID as parentId
def getReplies(parentId, nextPageToken=''):
    base_url = 'https://www.googleapis.com/youtube/v3/comments?part=snippet&key=AIzaSyCRJexp3hVDSOkrZJbGX7HdrY55HVFK8Rw&textFormat=plainText&maxResults=100&parentId='
    base_url += parentId
    query = base_url if nextPageToken == '' else base_url + '&pageToken=' + nextPageToken
    res = requests.get(query)
    print(res.json()['items'])
    clean_comments = [{'type': 'reply',
                       'text': comment['snippet']['textOriginal'],
                       'author_name': comment['snippet']['authorDisplayName'],
                       'author_channel': comment['snippet']['authorChannelUrl'],
                       'parentId': comment['snippet']['parentId'],
                       'replyId': comment['id']
                       } for comment in res.json()['items']]
    if 'nextPageToken' in res.json():
        return clean_comments + getReplies(parentId, res.json()['nextPageToken'])
    else:
        return clean_comments
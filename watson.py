import os
import json
import csv

from watson_developer_cloud import DiscoveryV1

discovery = DiscoveryV1(
    username="45063df0-4434-4245-a465-752ac7d12514",
    password="UXbZKDFdIyWh",
    version="2018-03-07"
)


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
    return collection.document_counts.available

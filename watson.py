import os
import json
from watson_developer_cloud import DiscoveryV1

discovery = DiscoveryV1(
    username="333e8f48-6029-4375-a553-4db2cc467f46",
    password="ykJmpPHlGMnW",
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
        collection_id = collections["collections"][1]["collection_id"]
        delete_collection = discovery.delete_collection(environment_id, collection_id)

        # Create new collection
        new_collection = discovery.create_collection(environment_id=environment_id, name=videoId)
        collection_id = new_collection["collection_id"]

        return environment_id, collection_id


def uploadDocsToWatson(comments, environment_id, collection_id):
    for comment in comments:
        # add the file to discovery
        while True:
            try:
                print(comment)
                discovery.add_document(environment_id, collection_id, file=json.dumps(comment),
                                                file_content_type='application/json', filename=comment['C   id'])
                break
            except Exception:
                complete = False

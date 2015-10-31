from twisted.web import server, resource
from twisted.internet import reactor
import sys
import json
import argparse

##Server module
# Server Index.
# Server IPs
# Server Ports
parser = argparse.ArgumentParser()
parser.add_argument('-p','--server-port')
parseResult = parser.parse_args(sys.argv[1:])
thisPort = int(parseResult.server_port)

class CortanaRedirect(resource.Resource):
    isLeaf = True
    numberRequests = 0

    def render_POST(self,request):
        jstr = str(request.content.getvalue())
        jsonObj = json.loads(jstr)
        conversationLink = str(jsonObj['eventMessages'][0]['resource']['conversationLink'])
        content = str(jsonObj['eventMessages'][0]['content'])
        dict = {}
        '''
        messagetype: 'RichText',
        contenttype: 'text',
        '''
        dict['url'] = conversationLink
        dict['payload'] = {}
        dict['payload']['content'] = 'got it.'
        dict['payload']['messagetype'] = 'RichText'
        dict['payload']['contenttype'] = 'text'
        if [x.lower() for x in content.split(' ')[0:2]] == ['hey','cortana']:
            return json.dump(dict)
        else:
            return ""

reactor.listenTCP(thisPort, server.Site(CortanaRedirect()))
reactor.run()
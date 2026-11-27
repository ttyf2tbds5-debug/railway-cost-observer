import json, os, urllib.request
base=os.environ.get('COST_OBSERVER_URL','http://localhost:3000').rstrip('/')
request=urllib.request.Request(base+'/api/v1/dashboard',headers={'Authorization':'Bearer '+os.environ['COST_OBSERVER_TOKEN']})
class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self,req,fp,code,msg,headers,newurl): return None
opener=urllib.request.build_opener(NoRedirect)
with opener.open(request,timeout=10) as response:
    result=json.load(response)
print(json.dumps({'projects':len(result['projects']),'estimateOnly':result['meta']['estimateOnly']}))
